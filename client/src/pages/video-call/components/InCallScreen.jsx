/**
 * InCallScreen.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Full-screen in-call UI that renders once both participants are in the room
 * and the user has left the pre-call lobby.
 *
 * Responsibilities
 * ─────────────────
 * • Activates the useWebRTC hook to start RTCPeerConnection and signaling.
 * • Displays the remote peer's video (full viewport) or a waiting animation.
 * • Displays the local camera preview as a small picture-in-picture overlay.
 * • Shows a glassmorphic control bar with camera/mic toggles and end-call.
 * • Shows a connection status badge with colour-coded state.
 * • Room ID display with copy-to-clipboard.
 *
 * What this component does NOT do
 * ─────────────────────────────────
 * • Does not manage room creation/joining (handled by useVideoCall).
 * • Does not acquire media (already acquired in the lobby, reused here).
 * • Does not implement ICE candidate exchange (Step 6).
 */

import {
  Camera,
  CameraOff,
  Check,
  Copy,
  Loader2,
  Mic,
  MicOff,
  PhoneOff,
} from 'lucide-react';
import { useWebRTC } from '../hooks/useWebRTC';
import { useMediaDevices } from '../hooks/useMediaDevices';

// ─────────────────────────────────────────────────────────────────────────────
// Status styling map
// ─────────────────────────────────────────────────────────────────────────────

const STATUS_STYLES = {
  new: { dot: 'bg-gray-400', text: 'text-gray-300' },
  connecting: { dot: 'bg-amber-400 animate-pulse', text: 'text-amber-300' },
  connected: { dot: 'bg-emerald-400', text: 'text-emerald-300' },
  disconnected: { dot: 'bg-amber-500 animate-pulse', text: 'text-amber-400' },
  failed: { dot: 'bg-red-500', text: 'text-red-400' },
  closed: { dot: 'bg-gray-500', text: 'text-gray-400' },
};

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @param {{
 *   roomId: string;
 *   isHost: boolean;
 *   peerPresent: boolean;
 *   onEndCall: () => void;
 *   onCopyRoomId: (id: string) => void;
 *   copied: boolean;
 * }} props
 */
export function InCallScreen({
  roomId,
  isHost,
  peerPresent,
  onEndCall,
  onCopyRoomId,
  copied,
}) {
  // ── WebRTC hook — manages peer connection and remote stream ────────────
  const { remoteStream, remoteVideoRef, connectionState, connectionLabel } =
    useWebRTC({ roomId, isHost, active: true });

  // ── Local media hook — reuses existing stream from mediaService ────────
  const {
    videoRef: localVideoRef,
    stream: localStream,
    videoEnabled,
    audioEnabled,
    hasCamera,
    hasMicrophone,
    toggleVideo,
    toggleAudio,
  } = useMediaDevices();

  const status = STATUS_STYLES[connectionState] || STATUS_STYLES.new;
  const showWaiting = !remoteStream;
  const localVideoVisible = localStream && videoEnabled && hasCamera;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#0a0b10]">
      {/* ── Top bar — connection status + room ID ───────────────────────── */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 py-3 sm:px-6">
        {/* Connection status badge */}
        <div className="flex items-center gap-2.5 rounded-xl bg-black/50 backdrop-blur-xl px-4 py-2 border border-white/[0.08] shadow-lg">
          <span className={`h-2 w-2 shrink-0 rounded-full ${status.dot}`} />
          <span className={`text-xs font-medium ${status.text}`}>
            {connectionLabel}
          </span>
        </div>

        {/* Room ID chip */}
        <div className="flex items-center gap-2 rounded-xl bg-black/50 backdrop-blur-xl px-3 py-2 border border-white/[0.08] shadow-lg">
          <span className="text-[0.6rem] font-bold uppercase tracking-widest text-white/30 hidden sm:block">
            Room
          </span>
          <code className="max-w-[100px] truncate font-mono text-xs font-semibold text-white/60">
            {roomId}
          </code>
          <button
            id="incall-btn-copy-room-id"
            type="button"
            onClick={() => onCopyRoomId(roomId)}
            className="rounded-md p-1 text-white/40 hover:text-white/70 hover:bg-white/10 transition active:scale-90"
            aria-label="Copy Room ID"
            title="Copy Room ID"
          >
            {copied ? (
              <Check size={12} className="text-emerald-400" />
            ) : (
              <Copy size={12} />
            )}
          </button>
        </div>
      </div>

      {/* ── Main area — remote video or waiting state ───────────────────── */}
      <div className="flex-1 relative overflow-hidden">
        {/* Remote video — always in DOM for ref stability */}
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${
            remoteStream ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        />

        {/* Waiting / connecting overlay */}
        {showWaiting && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              {/* Animated concentric circles */}
              <div className="relative mx-auto mb-8 h-24 w-24">
                <div className="absolute inset-0 rounded-full bg-emerald-500/10 animate-pulse" />
                <div className="absolute inset-4 rounded-full bg-emerald-500/15 animate-pulse" />
                <div className="absolute inset-7 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <Loader2
                    size={24}
                    className="animate-spin text-emerald-400/70"
                  />
                </div>
              </div>

              <p className="text-sm font-medium text-white/50 mb-1">
                {!peerPresent
                  ? 'Waiting for peer to join…'
                  : connectionLabel}
              </p>
              <p className="text-xs text-white/25 max-w-[260px] mx-auto leading-relaxed">
                {!peerPresent
                  ? 'Share the Room ID with your peer to start the call'
                  : 'Establishing a secure peer-to-peer connection…'}
              </p>
            </div>
          </div>
        )}

        {/* Remote video self-label */}
        {remoteStream && (
          <div className="absolute top-16 left-4 sm:left-6 rounded-lg bg-black/50 px-2.5 py-1 text-xs text-white/70 font-medium backdrop-blur-sm z-10">
            Peer
          </div>
        )}

        {/* ── Local video PiP ───────────────────────────────────────────── */}
        <div className="absolute bottom-24 right-4 w-40 sm:w-48 aspect-video rounded-xl overflow-hidden border border-white/15 shadow-2xl shadow-black/50 bg-[#111118] z-10">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className={`h-full w-full object-cover transition-opacity duration-300 ${
              localVideoVisible ? 'opacity-100' : 'opacity-0'
            }`}
            aria-label="Local camera preview"
          />

          {/* Camera-off overlay for PiP */}
          {!localVideoVisible && (
            <div className="absolute inset-0 flex items-center justify-center bg-[#111118]">
              <CameraOff size={18} className="text-white/25" />
            </div>
          )}

          {/* Self label */}
          <div className="absolute bottom-1.5 left-2 rounded bg-black/60 px-1.5 py-0.5 text-[0.6rem] font-medium text-white/70 backdrop-blur-sm">
            You
          </div>
        </div>
      </div>

      {/* ── Bottom control bar ───────────────────────────────────────────── */}
      <div className="absolute bottom-0 left-0 right-0 z-20 flex items-center justify-center pb-6 pt-16 bg-gradient-to-t from-black/80 via-black/40 to-transparent pointer-events-none">
        <div className="flex items-center gap-3 rounded-2xl bg-black/60 backdrop-blur-xl px-5 py-3 border border-white/[0.08] shadow-2xl pointer-events-auto">
          {/* Camera toggle */}
          <button
            id="incall-btn-toggle-camera"
            type="button"
            onClick={toggleVideo}
            disabled={!localStream || !hasCamera}
            aria-label={videoEnabled ? 'Turn camera off' : 'Turn camera on'}
            aria-pressed={videoEnabled}
            className={`group relative h-12 w-12 rounded-full flex items-center justify-center transition active:scale-90 disabled:opacity-30 disabled:cursor-not-allowed ${
              videoEnabled && hasCamera
                ? 'bg-white/10 text-white hover:bg-white/20'
                : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
            }`}
          >
            {videoEnabled && hasCamera ? (
              <Camera size={20} />
            ) : (
              <CameraOff size={20} />
            )}
            <span className="pointer-events-none absolute -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-gray-900 px-2.5 py-1 text-[0.65rem] font-medium text-white opacity-0 transition group-hover:opacity-100 shadow-lg">
              {videoEnabled && hasCamera
                ? 'Camera on'
                : !hasCamera
                  ? 'No camera'
                  : 'Camera off'}
            </span>
          </button>

          {/* Mic toggle */}
          <button
            id="incall-btn-toggle-mic"
            type="button"
            onClick={toggleAudio}
            disabled={!localStream || !hasMicrophone}
            aria-label={audioEnabled ? 'Mute microphone' : 'Unmute microphone'}
            aria-pressed={audioEnabled}
            className={`group relative h-12 w-12 rounded-full flex items-center justify-center transition active:scale-90 disabled:opacity-30 disabled:cursor-not-allowed ${
              audioEnabled && hasMicrophone
                ? 'bg-white/10 text-white hover:bg-white/20'
                : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
            }`}
          >
            {audioEnabled && hasMicrophone ? (
              <Mic size={20} />
            ) : (
              <MicOff size={20} />
            )}
            <span className="pointer-events-none absolute -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-gray-900 px-2.5 py-1 text-[0.65rem] font-medium text-white opacity-0 transition group-hover:opacity-100 shadow-lg">
              {audioEnabled && hasMicrophone
                ? 'Mic on'
                : !hasMicrophone
                  ? 'No mic'
                  : 'Muted'}
            </span>
          </button>

          {/* Separator */}
          <div className="h-7 w-px bg-white/10 mx-1" />

          {/* End call */}
          <button
            id="incall-btn-end-call"
            type="button"
            onClick={onEndCall}
            aria-label="End call"
            className="group relative h-12 w-14 rounded-full bg-red-500 text-white flex items-center justify-center transition hover:bg-red-600 active:scale-90 shadow-lg shadow-red-500/20"
          >
            <PhoneOff size={20} />
            <span className="pointer-events-none absolute -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-gray-900 px-2.5 py-1 text-[0.65rem] font-medium text-white opacity-0 transition group-hover:opacity-100 shadow-lg">
              End call
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
