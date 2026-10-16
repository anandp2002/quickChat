import { AlertCircle, CheckCircle2, WifiOff, X } from 'lucide-react';
import { useVideoCall } from './hooks/useVideoCall';
import { VideoCallHero } from './components/VideoCallHero';
import { CreateRoomCard } from './components/CreateRoomCard';
import { JoinRoomCard } from './components/JoinRoomCard';
import { PreCallLobby } from './components/PreCallLobby';
import { InCallScreen } from './components/InCallScreen';

/**
 * VideoCallPage — Page orchestrator for real-time room creation and joining.
 *
 * Rendering strategy
 * ───────────────────
 * • Home view   — shown when no room is active (currentRoom === null).
 * • Lobby view  — shown as a full-screen overlay once a room is ready
 *                 (currentRoom is set) AND the user has not yet entered
 *                 the call (lobbyActive).
 * • In-call     — shown as a full-screen overlay when inCall is active
 *                 and lobby is closed.
 *
 * The home view is always in the DOM when lobby and in-call are not active so that
 * socket listeners, Redux state, and form values are preserved.
 *
 * Camera / microphone are NOT requested until the lobby mounts.
 */
export function VideoCallPage() {
  const {
    currentRoom,
    isHost,
    roomId,
    roomIdError,
    isCreating,
    isJoining,
    error,
    successMessage,
    socketConnected,
    socketError,
    copied,
    lobbyActive,
    inCall,
    peerPresent,
    handleRoomIdChange,
    handleCreateRoom,
    handleJoinRoom,
    handleLeaveRoom,
    handleCopyRoomId,
    handleDismissError,
    handleDismissSuccess,
    handleStartCall,
    handleCancelLobby,
    handleEndCall,
  } = useVideoCall();

  return (
    <>
      {/* ── Pre-call lobby overlay ─────────────────────────────────────── */}
      {lobbyActive && currentRoom && (
        <PreCallLobby
          roomId={currentRoom.id}
          isHost={isHost}
          onStartCall={handleStartCall}
          onCancel={handleCancelLobby}
          onCopyRoomId={handleCopyRoomId}
          copied={copied}
        />
      )}

      {/* ── In-call screen overlay ──────────────────────────────────────── */}
      {inCall && currentRoom && !lobbyActive && (
        <InCallScreen
          roomId={currentRoom.id}
          isHost={isHost}
          peerPresent={peerPresent}
          onEndCall={handleEndCall}
          onCopyRoomId={handleCopyRoomId}
          copied={copied}
        />
      )}


      {/* ── Home / room management view ────────────────────────────────── */}
      <div className="mx-auto w-full max-w-[1040px] px-5 py-10 sm:px-[7vw] sm:py-[8vw] lg:px-[7vw] lg:py-[8vw]">
        <VideoCallHero />

        {/* Socket Connection Warning Banner */}
        {socketError && !socketConnected && (
          <div
            role="status"
            className="mt-6 flex items-center gap-3 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 shadow-sm"
          >
            <WifiOff size={18} className="shrink-0 text-amber-600" />
            <div className="flex-1">
              <span className="font-semibold">Real-time connection issue: </span>
              <span>{socketError} Check that the server is running on port 5000.</span>
            </div>
          </div>
        )}

        {/* Global Error Banner (Room errors, server rejection, etc.) */}
        {error && (
          <div
            role="alert"
            className="mt-6 flex items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 shadow-sm animate-in fade-in duration-200"
          >
            <div className="flex items-center gap-3">
              <AlertCircle size={18} className="shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
            <button
              type="button"
              onClick={handleDismissError}
              className="rounded p-1 text-red-600 hover:bg-red-100 transition"
              aria-label="Dismiss error"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* Global Success Banner */}
        {successMessage && !lobbyActive && (
          <div
            role="status"
            className="mt-6 flex items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 shadow-sm animate-in fade-in duration-200"
          >
            <div className="flex items-center gap-3">
              <CheckCircle2 size={18} className="shrink-0 text-emerald-600" />
              <span>{successMessage}</span>
            </div>
            <button
              type="button"
              onClick={handleDismissSuccess}
              className="rounded p-1 text-emerald-600 hover:bg-emerald-100 transition"
              aria-label="Dismiss message"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* Action Cards Grid */}
        <div className="mt-9 grid grid-cols-1 gap-4 sm:mt-[58px] sm:gap-[18px] lg:grid-cols-2">
          <CreateRoomCard
            onCreateRoom={handleCreateRoom}
            isCreating={isCreating}
            currentRoom={currentRoom}
            isHost={isHost}
            onCopyRoomId={handleCopyRoomId}
            copied={copied}
            onLeaveRoom={handleLeaveRoom}
            disabled={isJoining}
          />

          <JoinRoomCard
            roomId={roomId}
            roomIdError={roomIdError}
            isJoining={isJoining}
            currentRoom={currentRoom}
            isHost={isHost}
            onRoomIdChange={handleRoomIdChange}
            onJoinRoom={handleJoinRoom}
            onLeaveRoom={handleLeaveRoom}
            onCopyRoomId={handleCopyRoomId}
            copied={copied}
            disabled={isCreating}
          />
        </div>
      </div>
    </>
  );
}
