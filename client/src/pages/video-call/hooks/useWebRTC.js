/**
 * useWebRTC.js
 * ─────────────────────────────────────────────────────────────────────────────
 * React hook that manages the RTCPeerConnection lifecycle, SDP offer/answer
 * negotiation, ICE candidate exchange, and remote media stream for a
 * one-to-one video call.
 *
 * Design decisions
 * ────────────────
 * • All mutable WebRTC objects (pc, remote stream, flags) are stored in refs
 *   to avoid recreating them on React re-renders and to survive Strict Mode
 *   double-invocations.
 *
 * • A generation counter prevents stale async operations (createOffer,
 *   createAnswer, setLocalDescription, setRemoteDescription, addIceCandidate)
 *   from modifying state that belongs to a newer call.
 *
 * • The perfect negotiation pattern is used for collision detection: the host
 *   is the "impolite" offerer, the joiner is the "polite" answerer.
 *
 * • The existing local MediaStream from mediaService is reused — the hook
 *   does NOT request a second getUserMedia() stream.
 *
 * • Socket.IO signaling reuses the existing singleton socket from socketService.
 *
 * • Cleanup is idempotent: closing the PC does NOT stop the shared local
 *   MediaStream — that lifecycle is owned by mediaService / MediaContext.
 *
 * ICE candidate exchange (Step 6)
 * ────────────────────────────────
 * • Trickle ICE: candidates are emitted as they are gathered via
 *   pc.onicecandidate; the peer does not wait for gathering to complete.
 * • A pending-candidate queue buffers any candidate that arrives before
 *   the remote description has been installed.  The queue is drained
 *   immediately after every successful setRemoteDescription() call.
 * • The generation counter guards against stale candidates from old calls
 *   being applied to a new RTCPeerConnection.
 * • End-of-candidates (event.candidate === null) is forwarded to the peer
 *   as a null payload and handled gracefully without treating it as a
 *   regular RTCIceCandidate object.
 *
 * Signaling flow
 * ──────────────
 *   1. Both peers mount InCallScreen → useWebRTC activates.
 *   2. Each peer creates an RTCPeerConnection, adds local tracks, and emits
 *      `room:peer-ready` through Socket.IO.
 *   3. The server tracks readiness and, when both participants are ready,
 *      emits `room:both-ready` with the offerer UID (the host).
 *   4. Offerer: createOffer → setLocalDescription → emit rtc:offer.
 *      ICE candidates arrive via pc.onicecandidate → emit rtc:ice-candidate.
 *   5. Answerer: setRemoteDescription(offer) → flush queued candidates →
 *      createAnswer → setLocalDescription(answer) → emit rtc:answer.
 *   6. Offerer: setRemoteDescription(answer) → flush queued candidates.
 *   7. Both: ICE connectivity checks complete → connectionState → 'connected'.
 *   8. Both: ontrack fires → remote MediaStream is exposed to the UI.
 */

import { useRef, useState, useCallback, useEffect } from 'react';
import {
  getSocket,
  emitPeerReady,
  emitRtcOffer,
  emitRtcAnswer,
  emitRtcIceCandidate,
} from '@/services/socketService';
import { getStream, onStreamChange } from '@/services/mediaService';
import { createPeerConnection } from '@/services/webrtcService';


// ─────────────────────────────────────────────────────────────────────────────
// Connection state → UI label mapping
// ─────────────────────────────────────────────────────────────────────────────

const CONNECTION_LABELS = {
  new: 'Initializing…',
  connecting: 'Connecting…',
  connected: 'Connected',
  disconnected: 'Connection interrupted',
  failed: 'Connection failed',
  closed: 'Call ended',
};

// ─────────────────────────────────────────────────────────────────────────────
// Module-level helper: log selected candidate pair stats (dev only)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Log the active ICE candidate pair and basic transport stats via getStats().
 * Runs only in development builds. Never logs credentials or SDP content.
 *
 * Candidate types:
 *   host   — local LAN address (fastest, works on same network)
 *   srflx  — server-reflexive; STUN-discovered public address
 *   relay  — TURN relay; used when direct paths are unavailable
 *
 * @param {RTCPeerConnection} pc
 */
async function _logCandidatePairStats(pc) {
  if (import.meta.env.PROD) return;
  try {
    const stats = await pc.getStats();
    let activePair = null;

    stats.forEach((report) => {
      if (
        report.type === 'candidate-pair' &&
        report.state === 'succeeded' &&
        report.nominated
      ) {
        activePair = report;
      }
    });

    if (!activePair) return;

    const local  = stats.get(activePair.localCandidateId);
    const remote = stats.get(activePair.remoteCandidateId);

    console.log('[useWebRTC] Active candidate pair:', {
      localType:  local?.candidateType  ?? 'unknown',
      remoteType: remote?.candidateType ?? 'unknown',
      protocol:   local?.protocol       ?? 'unknown',
      rtt: activePair.currentRoundTripTime != null
        ? `${(activePair.currentRoundTripTime * 1000).toFixed(1)} ms`
        : 'n/a',
      bytesSent:     activePair.bytesSent,
      bytesReceived: activePair.bytesReceived,
    });
  } catch {
    // Stats API not available or PC already closed — silently ignore.
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @param {{
 *   roomId: string;
 *   isHost: boolean;
 *   active: boolean;
 * }} options
 *
 * @returns {{
 *   remoteStream: MediaStream | null;
 *   remoteVideoRef: import('react').RefObject<HTMLVideoElement>;
 *   connectionState: RTCPeerConnectionState | 'new' | 'closed';
 *   connectionLabel: string;
 *   cleanup: () => void;
 * }}
 */
export function useWebRTC({ roomId, isHost, active }) {
  // ── Refs — mutable, not in React state ─────────────────────────────────
  const generationRef    = useRef(0);
  const pcRef            = useRef(/** @type {RTCPeerConnection | null} */ (null));
  const remoteStreamRef  = useRef(/** @type {MediaStream | null} */ (null));
  const remoteVideoRef   = useRef(/** @type {HTMLVideoElement | null} */ (null));
  const makingOfferRef   = useRef(false);

  /**
   * ICE candidates received before setRemoteDescription() was called.
   * Flushed immediately after the remote description is successfully installed.
   * Reset to [] at the start of every new call generation.
   */
  const pendingCandidatesRef = useRef(/** @type {RTCIceCandidate[]} */ ([]));

  /**
   * True once setRemoteDescription() has succeeded for the current call.
   * Gates the pending-candidate flush and the direct-apply path.
   */
  const remoteDescSetRef = useRef(false);

  // ── React state — drives re-renders ────────────────────────────────────
  const [remoteStream, setRemoteStream] = useState(
    /** @type {MediaStream | null} */ (null),
  );
  const [connectionState, setConnectionState] = useState(
    /** @type {string} */ ('new'),
  );

  // ── Idempotent cleanup ─────────────────────────────────────────────────
  /**
   * Close the RTCPeerConnection and clear all WebRTC state.
   *
   * • Removes registered event handlers to prevent stale callbacks.
   * • Closes the peer connection.
   * • Clears the remote stream and detaches the remote video element.
   * • Increments the generation counter to invalidate pending async ops.
   * • Drains the pending ICE candidate queue without processing.
   * • Does NOT stop the local MediaStream (owned by mediaService).
   * • Does NOT remove Socket.IO listeners (the calling effect handles that).
   */
  const cleanup = useCallback(() => {
    generationRef.current        += 1;
    makingOfferRef.current        = false;
    pendingCandidatesRef.current  = [];
    remoteDescSetRef.current      = false;

    const pc = pcRef.current;
    if (pc) {
      pc.ontrack                    = null;
      pc.onconnectionstatechange    = null;
      pc.onsignalingstatechange     = null;
      pc.oniceconnectionstatechange = null;
      pc.onicegatheringstatechange  = null;
      pc.onnegotiationneeded        = null;
      pc.onicecandidate             = null;

      try {
        pc.close();
      } catch {
        /* already closed */
      }
      pcRef.current = null;
    }

    remoteStreamRef.current = null;
    setRemoteStream(null);

    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }

    setConnectionState('closed');
  }, []);

  // ── Attach remote stream to <video> element ────────────────────────────
  useEffect(() => {
    const el = remoteVideoRef.current;
    if (!el) return;

    if (remoteStream) {
      if (el.srcObject !== remoteStream) {
        el.srcObject = remoteStream;
        // Handle browser autoplay restrictions.
        el.play().catch((err) => {
          console.warn('[useWebRTC] Remote video autoplay blocked:', err.message);
        });
      }
    } else {
      el.srcObject = null;
    }
  }, [remoteStream]);

  // ── Main effect — PC lifecycle, signaling, negotiation, ICE ──────────
  useEffect(() => {
    if (!active || !roomId) {
      if (pcRef.current) cleanup();
      return;
    }

    // ── Generation guard ───────────────────────────────────────────────
    const generation = ++generationRef.current;
    const isStale = () => generationRef.current !== generation;

    // ── Reset per-call ICE state ───────────────────────────────────────
    // Reset here (not only in cleanup) so the first cold-mount call also
    // starts with clean state.
    pendingCandidatesRef.current = [];
    remoteDescSetRef.current     = false;

    // ── Socket reference ───────────────────────────────────────────────
    const socket = getSocket();
    if (!socket?.connected) {
      console.warn('[useWebRTC] No connected socket — cannot initialise WebRTC');
      return;
    }

    // ── Perfect negotiation role ──────────────────────────────────────
    // Host = impolite (offerer).  Joiner = polite (answerer).
    const polite = !isHost;

    // ── Create RTCPeerConnection ──────────────────────────────────────
    const pc = createPeerConnection();
    pcRef.current = pc;
    setConnectionState('new');

    console.log('[useWebRTC] Created RTCPeerConnection for room', roomId);

    // ── Add local tracks ──────────────────────────────────────────────
    const localStream = getStream();
    if (localStream) {
      localStream.getTracks().forEach((track) => {
        pc.addTrack(track, localStream);
      });
      console.log(
        `[useWebRTC] Added ${localStream.getTracks().length} local track(s)`,
      );
    } else {
      console.warn(
        '[useWebRTC] No local stream — proceeding without local media',
      );
    }

    // Subscribe to stream changes if media was acquired or updated after mount
    const unsubscribeMedia = onStreamChange((newStream) => {
      if (!newStream || isStale() || !pcRef.current) return;
      const senders = pcRef.current.getSenders();
      newStream.getTracks().forEach((track) => {
        const alreadyAdded = senders.some((s) => s.track === track);
        if (!alreadyAdded) {
          try {
            pcRef.current.addTrack(track, newStream);
            console.log(`[useWebRTC] Added new ${track.kind} track from stream change`);
          } catch (e) {
            console.warn('[useWebRTC] Failed to add track from stream change:', e);
          }
        }
      });
    });

    // ── Handle incoming remote tracks ─────────────────────────────────
    pc.ontrack = (event) => {
      if (isStale()) return;

      let stream;
      if (event.streams && event.streams.length > 0) {
        // Preferred path: browser associates the track with a MediaStream
        // when the remote peer called addTrack(track, stream).
        stream = event.streams[0];
      } else {
        // Fallback: track without an associated stream.
        if (!remoteStreamRef.current) {
          remoteStreamRef.current = new MediaStream();
        }
        remoteStreamRef.current.addTrack(event.track);
        stream = remoteStreamRef.current;
      }

      console.log(`[useWebRTC] Remote track: kind=${event.track.kind}`);

      remoteStreamRef.current = stream;
      setRemoteStream(stream);
    };

    // ── Connection state tracking ─────────────────────────────────────
    pc.onconnectionstatechange = () => {
      if (isStale()) return;
      const state = pc.connectionState;
      console.log(`[useWebRTC] connectionState → ${state}`);
      setConnectionState(state);
    };

    pc.onsignalingstatechange = () => {
      if (isStale()) return;
      console.log(`[useWebRTC] signalingState → ${pc.signalingState}`);
    };

    // ── ICE state monitoring ──────────────────────────────────────────
    pc.oniceconnectionstatechange = () => {
      if (isStale()) return;
      const state = pc.iceConnectionState;
      console.log(`[useWebRTC] iceConnectionState → ${state}`);

      if (state === 'connected' || state === 'completed') {
        // Log the winning candidate pair type and RTT in dev builds.
        _logCandidatePairStats(pc);
      }

      if (state === 'failed') {
        console.warn(
          '[useWebRTC] ICE connection failed — no usable candidate pair found. ' +
          'Consider configuring a TURN server (VITE_TURN_URL) for networks ' +
          'behind symmetric NAT or restrictive firewalls.',
        );
      }
    };

    pc.onicegatheringstatechange = () => {
      if (isStale()) return;
      console.log(`[useWebRTC] iceGatheringState → ${pc.iceGatheringState}`);
    };

    // ── ICE candidate gathering — trickle ICE ─────────────────────────
    //
    // Candidates are emitted individually as they are gathered so the peer
    // can begin connectivity checks without waiting for gathering to finish.
    // This is standard trickle-ICE behaviour (RFC 8838).
    pc.onicecandidate = (event) => {
      if (isStale()) return;

      if (event.candidate) {
        // Serialize only the necessary fields; never forward the full SDP.
        emitRtcIceCandidate(roomId, {
          candidate:        event.candidate.candidate,
          sdpMid:           event.candidate.sdpMid,
          sdpMLineIndex:    event.candidate.sdpMLineIndex,
          usernameFragment: event.candidate.usernameFragment,
        });
        console.log(
          `[useWebRTC] ICE candidate gathered: type=${event.candidate.type ?? 'unknown'}`,
        );
      } else {
        // null candidate = end-of-gathering; all local candidates have been
        // emitted.  Forward the indication so the peer can finalize its
        // candidate queue via addIceCandidate(null).
        console.log('[useWebRTC] ICE gathering complete — all local candidates sent');
        emitRtcIceCandidate(roomId, null);
      }
    };

    // ── Flush pending ICE candidates after remote SDP is set ──────────
    /**
     * Drain any RTCIceCandidates that arrived before setRemoteDescription()
     * was called.  Must be awaited immediately after every successful
     * setRemoteDescription().  Per-candidate errors are logged but do not
     * abort the remaining queue.  Stale generation aborts early.
     */
    const flushPendingCandidates = async () => {
      const queue = pendingCandidatesRef.current.splice(0);
      if (queue.length > 0) {
        console.log(`[useWebRTC] Flushing ${queue.length} queued ICE candidate(s)`);
      }
      for (const candidate of queue) {
        if (isStale()) break;
        try {
          await pc.addIceCandidate(candidate);
        } catch (err) {
          if (!isStale()) {
            console.warn('[useWebRTC] addIceCandidate (queued) failed:', err.message);
          }
        }
      }
    };

    // ── Socket event handlers ─────────────────────────────────────────

    /**
     * Server confirms both peers are in the in-call screen and ready.
     * The offerer (host) starts SDP negotiation.
     */
    const handleBothReady = async ({ offererUid }) => {
      if (isStale()) return;

      // Only the designated offerer creates the offer.
      if (!isHost) return;

      // Guard against duplicate offers (idempotent both-ready handling).
      if (pc.signalingState !== 'stable' || makingOfferRef.current) {
        console.warn(
          '[useWebRTC] Ignoring both-ready — negotiation already active',
        );
        return;
      }

      console.log('[useWebRTC] Both peers ready — creating offer');

      try {
        makingOfferRef.current = true;

        const offer = await pc.createOffer();
        if (isStale()) return;

        await pc.setLocalDescription(offer);
        if (isStale()) return;

        emitRtcOffer(roomId, {
          type: pc.localDescription.type,
          sdp:  pc.localDescription.sdp,
        });

        console.log('[useWebRTC] Offer created and sent');
      } catch (err) {
        console.error('[useWebRTC] createOffer / setLocalDescription failed:', err);
      } finally {
        makingOfferRef.current = false;
      }
    };

    /**
     * Answerer: receive offer → setRemoteDescription → flush queued candidates
     * → createAnswer → setLocalDescription → send answer.
     *
     * Includes perfect-negotiation collision detection.
     */
    const handleRtcOffer = async ({ sdp, from }) => {
      if (isStale()) return;

      console.log(`[useWebRTC] Received offer from ${from}`);

      // ── Perfect negotiation: collision detection ──────────────────
      const offerCollision =
        makingOfferRef.current || pc.signalingState !== 'stable';

      if (offerCollision) {
        if (!polite) {
          // Impolite peer (host): ignore incoming offer during collision.
          console.warn(
            '[useWebRTC] Ignoring offer — collision (impolite peer)',
          );
          return;
        }
        // Polite peer (joiner): setRemoteDescription will implicitly
        // rollback the local description (spec behaviour).
      }

      try {
        await pc.setRemoteDescription(new RTCSessionDescription(sdp));
        if (isStale()) return;

        // Mark remote description as installed, then immediately drain
        // any ICE candidates that arrived before this point.
        remoteDescSetRef.current = true;
        await flushPendingCandidates();
        if (isStale()) return;

        console.log('[useWebRTC] Remote description (offer) applied');

        const answer = await pc.createAnswer();
        if (isStale()) return;

        await pc.setLocalDescription(answer);
        if (isStale()) return;

        emitRtcAnswer(roomId, {
          type: pc.localDescription.type,
          sdp:  pc.localDescription.sdp,
        });

        console.log('[useWebRTC] Answer created and sent');
      } catch (err) {
        console.error('[useWebRTC] handleRtcOffer failed:', err);
      }
    };

    /**
     * Offerer: receive answer → setRemoteDescription → flush queued candidates.
     */
    const handleRtcAnswer = async ({ sdp, from }) => {
      if (isStale()) return;

      console.log(`[useWebRTC] Received answer from ${from}`);

      // Validate signaling state before applying the answer.
      if (pc.signalingState !== 'have-local-offer') {
        console.warn(
          `[useWebRTC] Ignoring answer — signalingState is ${pc.signalingState}`,
        );
        return;
      }

      try {
        await pc.setRemoteDescription(new RTCSessionDescription(sdp));
        if (isStale()) return;

        // Mark remote description as installed, then drain any ICE candidates
        // that arrived before the answer was processed.
        remoteDescSetRef.current = true;
        await flushPendingCandidates();

        console.log(
          '[useWebRTC] Remote description (answer) applied — negotiation complete',
        );
      } catch (err) {
        console.error('[useWebRTC] setRemoteDescription(answer) failed:', err);
      }
    };

    /**
     * Receive an ICE candidate from the peer and apply it to the PC.
     *
     * Edge cases handled:
     *  • End-of-candidates (candidate === null): forwarded to addIceCandidate(null);
     *    browsers that do not support it silently ignore the error.
     *  • Candidate arrives before remote SDP: buffered in pendingCandidatesRef
     *    and flushed once the remote description is installed.
     *  • Stale generation (old call): dropped immediately via isStale().
     *  • Malformed candidate object: logged and dropped without crashing.
     *  • addIceCandidate failure: logged; the call continues normally.
     *  • User leaves while candidates are being processed: isStale() guard
     *    aborts any in-flight async addIceCandidate chains.
     */
    const handleRtcIceCandidate = async ({ candidate }) => {
      if (isStale()) return;

      // ── End-of-candidates indication ─────────────────────────────
      if (candidate === null || candidate === undefined) {
        console.log('[useWebRTC] Received end-of-candidates from peer');
        try {
          // Pass null to signal the end of remote candidates.
          // Some older browsers ignore or throw; both outcomes are safe.
          await pc.addIceCandidate(null);
        } catch {
          // Intentionally ignored — not all browsers support null here.
        }
        return;
      }

      // ── Parse the candidate ───────────────────────────────────────
      let iceCandidate;
      try {
        iceCandidate = new RTCIceCandidate(candidate);
      } catch (err) {
        console.warn(
          '[useWebRTC] Invalid ICE candidate received, dropping:',
          err.message,
        );
        return;
      }

      // ── Queue if remote description is not yet installed ──────────
      // Calling addIceCandidate() before setRemoteDescription() is a spec
      // violation that throws in most browsers.
      if (!remoteDescSetRef.current) {
        pendingCandidatesRef.current.push(iceCandidate);
        console.log(
          `[useWebRTC] ICE candidate queued (remote desc not yet set) ` +
          `— queue size: ${pendingCandidatesRef.current.length}`,
        );
        return;
      }

      // ── Apply immediately ─────────────────────────────────────────
      try {
        await pc.addIceCandidate(iceCandidate);
        console.log('[useWebRTC] ICE candidate applied');
      } catch (err) {
        if (!isStale()) {
          console.warn('[useWebRTC] addIceCandidate failed:', err.message);
        }
      }
    };

    /**
     * Handle remote peer leaving the room: clear remote stream.
     */
    const handlePeerLeft = () => {
      if (isStale()) return;
      console.log('[useWebRTC] Peer left the room — resetting remote stream');
      remoteStreamRef.current = null;
      setRemoteStream(null);
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = null;
      }
    };

    // ── Register socket listeners ─────────────────────────────────────
    socket.on('room:both-ready',   handleBothReady);
    socket.on('rtc:offer',         handleRtcOffer);
    socket.on('rtc:answer',        handleRtcAnswer);
    socket.on('rtc:ice-candidate', handleRtcIceCandidate);
    socket.on('room:left',         handlePeerLeft);

    // ── Signal readiness to the server ────────────────────────────────
    try {
      emitPeerReady(roomId);
      console.log('[useWebRTC] Emitted peer-ready for room', roomId);
    } catch (err) {
      console.warn('[useWebRTC] emitPeerReady failed:', err.message);
    }

    // ── Effect cleanup ────────────────────────────────────────────────
    return () => {
      unsubscribeMedia();
      socket.off('room:both-ready',   handleBothReady);
      socket.off('rtc:offer',         handleRtcOffer);
      socket.off('rtc:answer',        handleRtcAnswer);
      socket.off('rtc:ice-candidate', handleRtcIceCandidate);
      socket.off('room:left',         handlePeerLeft);

      cleanup();
    };
  }, [active, roomId, isHost, cleanup]);

  // ── Public API ──────────────────────────────────────────────────────────
  return {
    /** The remote peer's MediaStream (null until tracks arrive). */
    remoteStream,
    /** Ref to attach to the remote <video> element — auto-manages srcObject. */
    remoteVideoRef,
    /** Current RTCPeerConnection.connectionState (or 'new' / 'closed'). */
    connectionState,
    /** Human-readable label for the current connection state. */
    connectionLabel: CONNECTION_LABELS[connectionState] || connectionState,
    /** Idempotent cleanup — close the PC without stopping local media. */
    cleanup,
  };
}
