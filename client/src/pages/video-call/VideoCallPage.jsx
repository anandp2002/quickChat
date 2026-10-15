import { useVideoCall } from './hooks/useVideoCall';
import { VideoCallHero } from './components/VideoCallHero';
import { CreateRoomCard } from './components/CreateRoomCard';
import { JoinRoomCard } from './components/JoinRoomCard';

/**
 * VideoCallPage — Step 1: UI only.
 *
 * This component is a thin orchestrator:
 *   • Retrieves all state + handlers from `useVideoCall`.
 *   • Delegates every visual concern to focused child components.
 *   • Contains zero business logic and zero styling of its own.
 *
 * To add Socket.IO / WebRTC in Step 2, update `useVideoCall` only.
 * To change the layout, update this file only.
 * To change a card's appearance, update its component only.
 */
export function VideoCallPage() {
  const {
    roomId,
    roomIdError,
    handleRoomIdChange,
    handleCreateRoom,
    handleJoinRoom,
  } = useVideoCall();

  return (
    <div className="mx-auto w-full max-w-[1040px] px-5 py-10 sm:px-[7vw] sm:py-[8vw] lg:px-[7vw] lg:py-[8vw]">
      <VideoCallHero />

      <div className="mt-9 grid grid-cols-1 gap-4 sm:mt-[58px] sm:gap-[18px] lg:grid-cols-2">
        <CreateRoomCard onCreateRoom={handleCreateRoom} />

        <JoinRoomCard
          roomId={roomId}
          roomIdError={roomIdError}
          onRoomIdChange={handleRoomIdChange}
          onJoinRoom={handleJoinRoom}
        />
      </div>
    </div>
  );
}

