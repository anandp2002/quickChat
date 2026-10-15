import { Video, Copy, Check, Users, LogOut, Loader2 } from 'lucide-react';
import { PrimaryButton } from '@/components/ui/PrimaryButton';

/**
 * CreateRoomCard — handles room creation initiation, display of the
 * generated Room ID, copy-to-clipboard action, and participant status.
 *
 * @param {{
 *   onCreateRoom: () => void,
 *   isCreating: boolean,
 *   currentRoom: object | null,
 *   isHost: boolean,
 *   onCopyRoomId: (id?: string) => void,
 *   copied: boolean,
 *   onLeaveRoom: () => void,
 *   disabled?: boolean,
 * }} props
 */
export function CreateRoomCard({
  onCreateRoom,
  isCreating,
  currentRoom,
  isHost,
  onCopyRoomId,
  copied,
  onLeaveRoom,
  disabled = false,
}) {
  // If the user created an active room, show the hosted room details
  if (currentRoom && isHost) {
    const isWaiting = currentRoom.status === 'waiting';
    const participantCount = currentRoom.participants?.length || 1;

    return (
      <section
        className="flex flex-col rounded-[14px] border border-[#bcdbc8] bg-[#e6f4ec] p-[34px] shadow-sm transition-all"
        aria-labelledby="active-room-heading"
      >
        {/* Status icon badge */}
        <div className="flex items-center justify-between">
          <div
            className="mb-5 grid h-[48px] w-[48px] place-items-center rounded-2xl bg-[#c2dece] text-[#2d6a50]"
            aria-hidden="true"
          >
            <Video size={22} strokeWidth={1.8} />
          </div>
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
              isWaiting
                ? 'bg-amber-100 text-amber-800 border border-amber-200'
                : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                isWaiting ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'
              }`}
            />
            {isWaiting ? 'Waiting for peer (1/2)' : 'Call active (2/2)'}
          </span>
        </div>

        <span className="mb-2 font-sans text-[0.7rem] font-bold uppercase tracking-[0.12em] text-[#3e8564]">
          Hosting Session
        </span>
        <h2
          id="active-room-heading"
          className="m-0 text-[clamp(1.4rem,2.2vw,1.8rem)] font-normal leading-[1.2] tracking-[-0.03em] text-[#214d3b]"
        >
          Room is Live
        </h2>
        <p className="mt-2 font-sans text-[0.88rem] leading-[1.6] text-[#556960]">
          Share this Room ID with the participant you wish to connect with.
        </p>

        {/* Room ID Display & Copy Button */}
        <div className="mt-6 rounded-xl border border-[#c4dcce] bg-white p-3.5">
          <span className="block text-[0.7rem] font-semibold uppercase tracking-wider text-[#6b8277]">
            Room ID
          </span>
          <div className="mt-1.5 flex items-center justify-between gap-3">
            <code
              id="displayed-room-id"
              className="select-all font-mono text-sm font-semibold tracking-wide text-[#1b3d2f] break-all"
            >
              {currentRoom.id}
            </code>
            <button
              id="btn-copy-room-id"
              type="button"
              onClick={() => onCopyRoomId(currentRoom.id)}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-[#c0d6c8] bg-[#f5fbf7] px-3 py-2 text-xs font-semibold text-[#2b6048] transition hover:bg-[#e4f3ea] active:scale-95"
              title="Copy Room ID to clipboard"
              aria-label="Copy Room ID"
            >
              {copied ? (
                <>
                  <Check size={14} className="text-emerald-600" />
                  <span className="text-emerald-700 font-bold">Copied!</span>
                </>
              ) : (
                <>
                  <Copy size={14} />
                  <span>Copy ID</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Participants count indicator */}
        <div className="mt-4 flex items-center gap-2 text-xs text-[#526a5e]">
          <Users size={15} />
          <span>
            {participantCount} of 2 participant{participantCount > 1 ? 's' : ''} in room
          </span>
        </div>

        {/* Leave room button */}
        <div className="mt-6 border-t border-[#cee2d6] pt-5">
          <button
            id="btn-leave-room-host"
            type="button"
            onClick={onLeaveRoom}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50/70 px-4 py-2.5 text-xs font-semibold text-red-700 transition hover:bg-red-100/80 active:scale-98"
          >
            <LogOut size={14} />
            Leave & Close Room
          </button>
        </div>
      </section>
    );
  }

  // Default creation state
  return (
    <section
      className="flex flex-col justify-between rounded-[14px] border border-[#dce6e0] bg-[#dfeee5] p-[34px]"
      aria-labelledby="create-room-heading"
    >
      <div>
        {/* Icon badge */}
        <div
          className="mb-5 grid h-[48px] w-[48px] place-items-center rounded-2xl bg-[#c2dece] text-[#2d6a50]"
          aria-hidden="true"
        >
          <Video size={22} strokeWidth={1.8} />
        </div>

        <span className="mb-2 font-sans text-[0.7rem] font-bold uppercase tracking-[0.12em] text-[#4a9271]">
          New call
        </span>
        <h2
          id="create-room-heading"
          className="m-0 text-[clamp(1.5rem,2.5vw,2rem)] font-normal leading-[1.1] tracking-[-0.03em] text-[#214d3b]"
        >
          Create a Room
        </h2>
        <p className="mt-3 font-sans text-[0.88rem] leading-[1.6] text-[#667772]">
          Start a new video call session. A unique Room ID will be generated
          that you can share with another person.
        </p>
      </div>

      <div className="mt-8">
        <PrimaryButton
          id="btn-create-room"
          onClick={onCreateRoom}
          disabled={isCreating || disabled || Boolean(currentRoom)}
          className="gap-2"
        >
          {isCreating ? (
            <>
              <Loader2 size={16} className="animate-spin" aria-hidden="true" />
              <span>Creating Room...</span>
            </>
          ) : (
            <>
              <Video size={16} strokeWidth={2} aria-hidden="true" />
              <span>Create Room</span>
            </>
          )}
        </PrimaryButton>
        {Boolean(currentRoom && !isHost) && (
          <p className="mt-2 text-center text-xs text-[#72837a]">
            You are currently in another room. Leave it before creating a new one.
          </p>
        )}
      </div>
    </section>
  );
}
