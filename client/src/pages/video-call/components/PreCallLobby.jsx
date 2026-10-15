/**
 * PreCallLobby.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Google Meet-style pre-call screen shown after a room is successfully created
 * or joined. Lets the user preview and control their camera/microphone before
 * entering the actual video call.
 *
 * Responsibilities
 * ─────────────────
 * • Acquires the local MediaStream on mount (after room is ready).
 * • Shows a live camera preview with autoPlay/playsInline/muted.
 * • Displays camera + microphone toggle controls.
 * • Shows Room ID with a copy button.
 * • Provides "Start Call" (host) or "Join Call" (peer) primary action.
 * • Provides a Cancel/Leave button that releases media and leaves the room.
 * • Handles loading, permission-denied, audio-only, and no-device states.
 *
 * What this component does NOT do
 * ─────────────────────────────────
 * • Does not create an RTCPeerConnection.
 * • Does not display a remote video.
 * • Does not stop the MediaStream on unmount (the stream survives navigation).
 */

import { useEffect } from 'react';
import {
  Camera,
  CameraOff,
  Check,
  Copy,
  Loader2,
  Mic,
  MicOff,
  PhoneOff,
  RefreshCw,
  Video,
} from 'lucide-react';
import { useMediaDevices } from '../hooks/useMediaDevices';

/**
 * @param {{
 *   roomId: string;
 *   isHost: boolean;
 *   onStartCall: () => void;
 *   onCancel: () => void;
 *   onCopyRoomId: (id: string) => void;
 *   copied: boolean;
 * }} props
 */
export function PreCallLobby({ roomId, isHost, onStartCall, onCancel, onCopyRoomId, copied }) {
  const {
    videoRef,
    stream,
    isAcquiring,
    mediaError,
    videoEnabled,
    audioEnabled,
    hasCamera,
    hasMicrophone,
    acquire,
    toggleVideo,
    toggleAudio,
    retryAcquire,
  } = useMediaDevices();

  // Acquire media as soon as the lobby mounts.
  // acquire() is idempotent — safe under React Strict Mode double-invocations.
  useEffect(() => {
    acquire();
    // Do NOT release on unmount. The stream must survive navigation to the
    // in-call screen. Releasing is handled by onCancel / session end.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isAudioOnly = stream && !hasCamera;
  const isReady = (stream && !isAcquiring) || Boolean(mediaError);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl overflow-hidden">
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-[#dfeee5] text-[#2d6a50]">
              <Video size={18} strokeWidth={1.8} />
            </div>
            <div>
              <p className="text-[0.7rem] font-bold uppercase tracking-widest text-[#4a9271]">
                Pre-call Check
              </p>
              <h2 className="text-sm font-semibold text-[#1c3029] leading-tight">
                {isHost ? 'Ready to start?' : 'Ready to join?'}
              </h2>
            </div>
          </div>

          {/* Room ID chip */}
          {roomId && (
            <div className="flex items-center gap-2 rounded-xl border border-[#c4dcce] bg-[#f5fbf7] px-3 py-1.5">
              <span className="text-[0.65rem] font-bold uppercase tracking-wider text-[#5a7a6a] hidden sm:block">
                Room
              </span>
              <code className="max-w-[120px] truncate font-mono text-xs font-semibold text-[#1b3d2f]">
                {roomId}
              </code>
              <button
                id="lobby-btn-copy-room-id"
                type="button"
                onClick={() => onCopyRoomId(roomId)}
                className="ml-0.5 rounded-md p-1 text-[#3e7a60] hover:bg-[#e4f3ea] transition active:scale-95"
                aria-label="Copy Room ID"
                title="Copy Room ID"
              >
                {copied ? (
                  <Check size={12} className="text-emerald-600" />
                ) : (
                  <Copy size={12} />
                )}
              </button>
            </div>
          )}
        </div>

        {/* ── Camera preview ─────────────────────────────────────────────── */}
        <div className="relative bg-[#0d1117] aspect-video w-full flex items-center justify-center overflow-hidden">
          {/* Live preview — always rendered so the ref is available */}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`h-full w-full object-cover transition-opacity duration-300 ${
              stream && videoEnabled && hasCamera ? 'opacity-100' : 'opacity-0'
            }`}
            aria-label="Local camera preview"
          />

          {/* Overlay states — Loading */}
          {isAcquiring && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-white">
              <Loader2 size={36} className="animate-spin text-[#4a9271]" />
              <p className="text-sm text-gray-300 font-medium">
                Requesting camera &amp; microphone access…
              </p>
            </div>
          )}

          {/* Overlay states — Error */}
          {!isAcquiring && mediaError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 text-center text-white">
              <div className="grid h-16 w-16 place-items-center rounded-full bg-red-900/60">
                <CameraOff size={28} className="text-red-300" />
              </div>
              <div>
                <p className="text-sm font-semibold text-red-300 mb-1">
                  Media access failed
                </p>
                <p className="text-xs text-gray-400 leading-relaxed max-w-xs">{mediaError}</p>
              </div>
              <button
                id="lobby-btn-retry-media"
                type="button"
                onClick={retryAcquire}
                className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold text-white hover:bg-white/20 transition active:scale-95"
              >
                <RefreshCw size={13} />
                Try Again
              </button>
            </div>
          )}

          {/* Overlay states — Camera off (but stream exists) */}
          {!isAcquiring && !mediaError && stream && (!videoEnabled || !hasCamera) && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-white">
              <div className="grid h-16 w-16 place-items-center rounded-full bg-gray-700/60">
                <CameraOff size={28} className="text-gray-300" />
              </div>
              <p className="text-xs text-gray-400 font-medium">
                {!hasCamera ? 'No camera detected' : 'Camera is off'}
              </p>
            </div>
          )}

          {/* Audio-only badge */}
          {isAudioOnly && !isAcquiring && !mediaError && (
            <div className="absolute top-3 left-3 flex items-center gap-1.5 rounded-full bg-amber-500/80 px-2.5 py-1 text-[0.65rem] font-semibold text-white backdrop-blur-sm">
              <Mic size={11} />
              Audio only
            </div>
          )}

          {/* Self-label */}
          {!isAcquiring && stream && (
            <div className="absolute bottom-3 left-3 rounded-lg bg-black/50 px-2.5 py-1 text-xs text-white/90 font-medium backdrop-blur-sm">
              You (preview)
            </div>
          )}
        </div>

        {/* ── Controls bar ───────────────────────────────────────────────── */}
        <div className="flex items-center justify-between gap-3 px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            {/* Camera toggle */}
            <button
              id="lobby-btn-toggle-camera"
              type="button"
              onClick={toggleVideo}
              disabled={!stream || !hasCamera || isAcquiring}
              aria-label={videoEnabled ? 'Turn camera off' : 'Turn camera on'}
              aria-pressed={videoEnabled}
              className={`group relative inline-flex h-11 w-11 items-center justify-center rounded-full border transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 ${
                videoEnabled && hasCamera
                  ? 'border-[#c4dcce] bg-[#f0f9f4] text-[#2d6a50] hover:bg-[#dff2ea] focus-visible:ring-[#4a9271]'
                  : 'border-red-200 bg-red-50 text-red-600 hover:bg-red-100 focus-visible:ring-red-400'
              }`}
            >
              {videoEnabled && hasCamera ? <Camera size={18} /> : <CameraOff size={18} />}
              {/* Tooltip */}
              <span className="pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-gray-900 px-2 py-1 text-[0.65rem] font-medium text-white opacity-0 transition group-hover:opacity-100 group-focus-visible:opacity-100">
                {videoEnabled && hasCamera ? 'Camera on' : !hasCamera ? 'No camera' : 'Camera off'}
              </span>
            </button>

            {/* Microphone toggle */}
            <button
              id="lobby-btn-toggle-mic"
              type="button"
              onClick={toggleAudio}
              disabled={!stream || !hasMicrophone || isAcquiring}
              aria-label={audioEnabled ? 'Mute microphone' : 'Unmute microphone'}
              aria-pressed={audioEnabled}
              className={`group relative inline-flex h-11 w-11 items-center justify-center rounded-full border transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 ${
                audioEnabled && hasMicrophone
                  ? 'border-[#c4dcce] bg-[#f0f9f4] text-[#2d6a50] hover:bg-[#dff2ea] focus-visible:ring-[#4a9271]'
                  : 'border-red-200 bg-red-50 text-red-600 hover:bg-red-100 focus-visible:ring-red-400'
              }`}
            >
              {audioEnabled && hasMicrophone ? <Mic size={18} /> : <MicOff size={18} />}
              <span className="pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-gray-900 px-2 py-1 text-[0.65rem] font-medium text-white opacity-0 transition group-hover:opacity-100 group-focus-visible:opacity-100">
                {audioEnabled && hasMicrophone
                  ? 'Mic on'
                  : !hasMicrophone
                  ? 'No microphone'
                  : 'Mic off'}
              </span>
            </button>

            {/* Status chips */}
            <div className="hidden sm:flex items-center gap-2 ml-1">
              {/* Camera status */}
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.65rem] font-semibold ${
                  !hasCamera
                    ? 'bg-gray-100 text-gray-500'
                    : videoEnabled
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-red-50 text-red-600 border border-red-200'
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    !hasCamera ? 'bg-gray-400' : videoEnabled ? 'bg-emerald-500' : 'bg-red-500'
                  }`}
                />
                {!hasCamera ? 'No camera' : videoEnabled ? 'Camera on' : 'Camera off'}
              </span>

              {/* Mic status */}
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.65rem] font-semibold ${
                  !hasMicrophone
                    ? 'bg-gray-100 text-gray-500'
                    : audioEnabled
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-red-50 text-red-600 border border-red-200'
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    !hasMicrophone
                      ? 'bg-gray-400'
                      : audioEnabled
                      ? 'bg-emerald-500'
                      : 'bg-red-500'
                  }`}
                />
                {!hasMicrophone ? 'No mic' : audioEnabled ? 'Mic on' : 'Muted'}
              </span>
            </div>
          </div>

          {/* Cancel button */}
          <button
            id="lobby-btn-cancel"
            type="button"
            onClick={onCancel}
            className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50/70 px-3.5 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-100/80 active:scale-95"
          >
            <PhoneOff size={14} />
            <span className="hidden sm:inline">Cancel</span>
          </button>
        </div>

        {/* ── Footer — primary action ─────────────────────────────────────── */}
        <div className="flex items-center justify-between gap-4 px-6 py-4">
          <p className="text-xs text-gray-400 leading-relaxed">
            {isAcquiring
              ? 'Waiting for camera permission…'
              : mediaError
              ? 'You can still join without camera/mic.'
              : isAudioOnly
              ? 'Audio-only mode — no camera detected.'
              : 'Your camera and microphone are ready.'}
          </p>

          <button
            id={isHost ? 'lobby-btn-start-call' : 'lobby-btn-join-call'}
            type="button"
            onClick={onStartCall}
            disabled={isAcquiring && !mediaError}
            className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-[#2d6a50] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#245842] active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4a9271] focus-visible:ring-offset-2"
          >
            {isAcquiring && !mediaError ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                <span>Getting ready…</span>
              </>
            ) : (
              <>
                <Video size={15} strokeWidth={2} />
                <span>{isHost ? 'Start Call' : 'Join Call'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
