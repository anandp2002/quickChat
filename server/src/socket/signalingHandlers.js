/**
 * signalingHandlers.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Socket.IO event handlers for WebRTC SDP signaling.
 *
 * These handlers relay SDP offers and answers between two authorised
 * participants in the same room.  The Node.js server is a pure relay —
 * it NEVER inspects or modifies SDP content, and it NEVER routes actual
 * audio/video media.  Media transport is handled entirely by WebRTC.
 *
 * ── Security ────────────────────────────────────────────────────────────────
 *
 *  • Sender identity is derived from socket.data.user.uid (set by
 *    socketAuthMiddleware during the handshake).  Client-supplied "from"
 *    fields in event payloads are NEVER trusted.
 *  • Room membership is verified for every signaling message.
 *  • Messages for ended rooms are rejected.
 *  • SDP payloads are size-limited (MAX_SDP_BYTES).
 *
 * ── Events handled ──────────────────────────────────────────────────────────
 *
 *  room:peer-ready  { roomId }
 *    Client declares it is in the in-call screen with media ready.
 *    When both participants have signalled ready, the server emits
 *    `room:both-ready` to the room with the offerer's UID.
 *
 *  rtc:offer  { roomId, sdp }
 *    Forwarded to the peer as  { roomId, sdp, from: uid }.
 *
 *  rtc:answer  { roomId, sdp }
 *    Forwarded to the peer as  { roomId, sdp, from: uid }.
 *
 *  rtc:ice-candidate  { roomId, candidate }
 *    Forwarded to the peer as  { roomId, candidate, from: uid }.
 *    `candidate` may be null (end-of-candidates indication) or a
 *    serialised RTCIceCandidateInit object.  The server never inspects
 *    candidate content beyond a size check.
 *
 * ── Peer-ready idempotency ──────────────────────────────────────────────────
 *
 *  Duplicate `room:peer-ready` events from the same participant are
 *  harmless — the server uses a Set for tracking, and `room:both-ready`
 *  is emitted at most once per readyMap entry (guarded by the
 *  bothReadyEmitted Set).
 */

import { getRoom } from './roomManager.js';

// ─────────────────────────────────────────────────────────────────────────────
// Configuration
// ─────────────────────────────────────────────────────────────────────────────

/** Maximum allowed size (bytes) for a serialised SDP payload. */
const MAX_SDP_BYTES = 10 * 1024; // 10 KB

/** Maximum allowed size (bytes) for a serialised ICE candidate payload. */
const MAX_CANDIDATE_BYTES = 2 * 1024; // 2 KB — candidates are much smaller than SDP

// ─────────────────────────────────────────────────────────────────────────────
// Internal tracking
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Map<roomId, Set<uid>> — tracks which participants have signalled
 * "peer-ready" for a given room.
 */
const readyMap = new Map();

/**
 * Set<roomId> — tracks rooms where `room:both-ready` has already been
 * emitted.  Prevents duplicate emissions on repeated peer-ready events.
 */
const bothReadyEmitted = new Set();

// ─────────────────────────────────────────────────────────────────────────────
// Handler registration
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Register WebRTC signaling event handlers on a connected, authenticated socket.
 *
 * @param {import('socket.io').Socket} socket
 * @param {import('socket.io').Server} io
 */
export function registerSignalingHandlers(socket, io) {
  const uid = socket.data.user.uid;

  // ─── room:peer-ready ─────────────────────────────────────────────────────
  socket.on('room:peer-ready', ({ roomId } = {}) => {
    if (!roomId || typeof roomId !== 'string') {
      socket.emit('room:error', { message: 'room:peer-ready requires a roomId string.' });
      return;
    }

    const room = getRoom(roomId);
    if (!room || room.status === 'ended') {
      socket.emit('room:error', { message: 'Room does not exist or has ended.' });
      return;
    }

    if (!room.participants.has(uid)) {
      socket.emit('room:error', { message: 'You are not a participant in this room.' });
      return;
    }

    // Track readiness (idempotent — Set.add is a no-op for duplicates).
    if (!readyMap.has(roomId)) {
      readyMap.set(roomId, new Set());
    }
    readyMap.get(roomId).add(uid);

    console.log(
      `[room:peer-ready] uid=${uid} ready in room ${roomId} ` +
        `(${readyMap.get(roomId).size}/${room.participants.size})`,
    );

    // Check whether all participants are present AND ready.
    const readySet = readyMap.get(roomId);
    const allReady =
      room.participants.size >= 2 &&
      [...room.participants.keys()].every((pUid) => readySet.has(pUid));

    if (allReady && !bothReadyEmitted.has(roomId)) {
      bothReadyEmitted.add(roomId);

      io.to(roomId).emit('room:both-ready', {
        roomId,
        offererUid: room.hostUid,
      });

      console.log(
        `[room:both-ready] Emitted for room ${roomId} — offerer=${room.hostUid}`,
      );
    }
  });

  // ─── rtc:offer ────────────────────────────────────────────────────────────
  socket.on('rtc:offer', ({ roomId, sdp } = {}) => {
    if (!_validateSignalingPayload(socket, roomId, sdp, uid, 'rtc:offer')) return;

    const room = getRoom(roomId);
    const peer = _findPeer(room, uid);

    if (!peer) {
      socket.emit('room:error', { message: 'No peer in the room to receive the offer.' });
      return;
    }

    // Forward with server-derived sender identity.
    io.to(peer.socketId).emit('rtc:offer', { roomId, sdp, from: uid });

    console.log(
      `[rtc:offer] Forwarded from uid=${uid} → uid=${peer.uid} in room ${roomId}`,
    );
  });

  // ─── rtc:answer ───────────────────────────────────────────────────────────
  socket.on('rtc:answer', ({ roomId, sdp } = {}) => {
    if (!_validateSignalingPayload(socket, roomId, sdp, uid, 'rtc:answer')) return;

    const room = getRoom(roomId);
    const peer = _findPeer(room, uid);

    if (!peer) {
      socket.emit('room:error', { message: 'No peer in the room to receive the answer.' });
      return;
    }

    // Forward with server-derived sender identity.
    io.to(peer.socketId).emit('rtc:answer', { roomId, sdp, from: uid });

    console.log(
      `[rtc:answer] Forwarded from uid=${uid} → uid=${peer.uid} in room ${roomId}`,
    );
  });

  // ─── rtc:ice-candidate ────────────────────────────────────────────────────
  //
  // Relay trickle-ICE candidates between the two authenticated participants.
  // `candidate` may be null (end-of-candidates) or a candidate object.
  // The server is a pure relay — it never parses or stores candidate content.
  socket.on('rtc:ice-candidate', ({ roomId, candidate } = {}) => {
    if (!_validateIceCandidatePayload(socket, roomId, candidate, uid, 'rtc:ice-candidate')) return;

    const room = getRoom(roomId);
    const peer = _findPeer(room, uid);

    if (!peer) {
      socket.emit('room:error', { message: 'No peer in the room to receive the ICE candidate.' });
      return;
    }

    // Forward with server-derived sender identity.
    // candidate may be null (end-of-candidates indication) — forward as-is.
    io.to(peer.socketId).emit('rtc:ice-candidate', { roomId, candidate, from: uid });

    if (candidate) {
      console.log(
        `[rtc:ice-candidate] Forwarded from uid=${uid} → uid=${peer.uid} in room ${roomId}`,
      );
    } else {
      console.log(
        `[rtc:ice-candidate] End-of-candidates from uid=${uid} → uid=${peer.uid} in room ${roomId}`,
      );
    }
  });

  socket.on('room:leave', () => {
    _cleanupParticipantReady(uid);
  });

  socket.on('disconnect', () => {
    _cleanupParticipantReady(uid);
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Internal helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Validate a signaling payload (shared by rtc:offer and rtc:answer).
 *
 * @param {import('socket.io').Socket} socket
 * @param {string} roomId
 * @param {object} sdp
 * @param {string} uid
 * @param {string} eventName — for logging
 * @returns {boolean} true if valid
 */
function _validateSignalingPayload(socket, roomId, sdp, uid, eventName) {
  if (!roomId || typeof roomId !== 'string') {
    socket.emit('room:error', { message: `${eventName} requires a roomId string.` });
    return false;
  }

  if (!sdp || typeof sdp !== 'object') {
    socket.emit('room:error', { message: `${eventName} requires an sdp object.` });
    return false;
  }

  // Size limit check (prevent abuse).
  const sdpSize = JSON.stringify(sdp).length;
  if (sdpSize > MAX_SDP_BYTES) {
    socket.emit('room:error', { message: `${eventName} SDP payload too large (${sdpSize} bytes).` });
    return false;
  }

  const room = getRoom(roomId);
  if (!room || room.status === 'ended') {
    socket.emit('room:error', { message: 'Room does not exist or has ended.' });
    return false;
  }

  if (!room.participants.has(uid)) {
    socket.emit('room:error', { message: 'You are not a participant in this room.' });
    return false;
  }

  return true;
}

/**
 * Validate an ICE candidate payload.
 *
 * `candidate` may legitimately be null (end-of-candidates) or an object.
 * An absent or non-object candidate that is not null is rejected.
 *
 * @param {import('socket.io').Socket} socket
 * @param {string} roomId
 * @param {object | null | undefined} candidate
 * @param {string} uid
 * @param {string} eventName — for logging
 * @returns {boolean} true if valid
 */
function _validateIceCandidatePayload(socket, roomId, candidate, uid, eventName) {
  if (!roomId || typeof roomId !== 'string') {
    socket.emit('room:error', { message: `${eventName} requires a roomId string.` });
    return false;
  }

  // null is valid (end-of-candidates); anything else must be an object.
  if (candidate !== null && candidate !== undefined && typeof candidate !== 'object') {
    socket.emit('room:error', { message: `${eventName} candidate must be an object or null.` });
    return false;
  }

  // Size check on non-null candidates to prevent abuse.
  if (candidate !== null && candidate !== undefined) {
    const candidateSize = JSON.stringify(candidate).length;
    if (candidateSize > MAX_CANDIDATE_BYTES) {
      socket.emit('room:error', {
        message: `${eventName} candidate payload too large (${candidateSize} bytes).`,
      });
      return false;
    }
  }

  const room = getRoom(roomId);
  if (!room || room.status === 'ended') {
    socket.emit('room:error', { message: 'Room does not exist or has ended.' });
    return false;
  }

  if (!room.participants.has(uid)) {
    socket.emit('room:error', { message: 'You are not a participant in this room.' });
    return false;
  }

  return true;
}

/**
 * Find the peer participant in a room (the one that is NOT the given uid).
 *
 * @param {object} room
 * @param {string} uid
 * @returns {{ uid: string, socketId: string } | undefined}
 */
function _findPeer(room, uid) {
  for (const participant of room.participants.values()) {
    if (participant.uid !== uid) return participant;
  }
  return undefined;
}

/**
 * Remove a participant's readiness state from all rooms.
 * Called on socket disconnect to prevent stale entries.
 *
 * @param {string} uid
 */
function _cleanupParticipantReady(uid) {
  for (const [roomId, readySet] of readyMap.entries()) {
    if (readySet.delete(uid)) {
      // If a participant left, allow both-ready to re-fire for a future peer.
      bothReadyEmitted.delete(roomId);
    }
    if (readySet.size === 0) {
      readyMap.delete(roomId);
    }
  }
}
