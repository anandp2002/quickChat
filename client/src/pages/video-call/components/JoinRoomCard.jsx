import { Link2, LogIn, LogOut, Copy, Check, Users, Loader2 } from 'lucide-react';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { TextField } from '@/components/ui/TextField';

/**
 * JoinRoomCard — manages room entry by Room ID, active joined status,
 * and form validation/loading states.
 *
 * @param {{
 *   roomId: string,
 *   roomIdError: string,
 *   isJoining: boolean,
 *   currentRoom: object | null,
 *   isHost: boolean,
 *   onRoomIdChange: (e: import('react').ChangeEvent<HTMLInputElement>) => void,
 *   onJoinRoom: (e: import('react').FormEvent) => void,
 *   onLeaveRoom: () => void,
 *   onCopyRoomId: (id?: string) => void,
 *   copied: boolean,
 *   disabled?: boolean,
 * }} props
 */
export function JoinRoomCard({
  roomId,
  roomIdError,
  isJoining,
  currentRoom,
  isHost,
  onRoomIdChange,
  onJoinRoom,
  onLeaveRoom,
  onCopyRoomId,
  copied,
  disabled = false,
}) {
  // If the user is currently participating as a joiner
  if (currentRoom && !isHost) {
    const participantCount = currentRoom.participants?.length || 2;

    return (
      <section
        className="flex flex-col rounded-[14px] border border-[#d2e2d8] bg-white p-[34px] shadow-sm transition-all"
        aria-labelledby="joined-room-heading"
      >
        <div className="flex items-center justify-between">
          <div
            className="mb-5 grid h-[48px] w-[48px] place-items-center rounded-2xl bg-[#e7f1eb] text-[#2d6a50]"
            aria-hidden="true"
          >
            <Link2 size={22} strokeWidth={1.8} />
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Connected (2/2)
          </span>
        </div>

        <span className="mb-2 font-sans text-[0.7rem] font-bold uppercase tracking-[0.12em] text-[#3e8564]">
          Joined Call
        </span>
        <h2
          id="joined-room-heading"
          className="m-0 text-[clamp(1.4rem,2.2vw,1.8rem)] font-normal leading-[1.2] tracking-[-0.03em] text-[#214d3b]"
        >
          Connected to Session
        </h2>
        <p className="mt-2 font-sans text-[0.88rem] leading-[1.6] text-[#556960]">
          You are currently in an active room with the host.
        </p>

        {/* Room ID Display & Copy Button */}
        <div className="mt-6 rounded-xl border border-[#d6e4dc] bg-[#f9fbf9] p-3.5">
          <span className="block text-[0.7rem] font-semibold uppercase tracking-wider text-[#6b8277]">
            Active Room ID
          </span>
          <div className="mt-1.5 flex items-center justify-between gap-3">
            <code
              id="joined-room-id"
              className="select-all font-mono text-sm font-semibold tracking-wide text-[#1b3d2f] break-all"
            >
              {currentRoom.id}
            </code>
            <button
              id="btn-copy-joined-room-id"
              type="button"
              onClick={() => onCopyRoomId(currentRoom.id)}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-[#c0d6c8] bg-white px-3 py-2 text-xs font-semibold text-[#2b6048] transition hover:bg-[#eaf3ed] active:scale-95"
              title="Copy Room ID"
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

        <div className="mt-4 flex items-center gap-2 text-xs text-[#526a5e]">
          <Users size={15} />
          <span>{participantCount} participants connected in room</span>
        </div>

        {/* Leave Room Button */}
        <div className="mt-6 border-t border-[#e2ece5] pt-5">
          <button
            id="btn-leave-room-peer"
            type="button"
            onClick={onLeaveRoom}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50/70 px-4 py-2.5 text-xs font-semibold text-red-700 transition hover:bg-red-100/80 active:scale-98"
          >
            <LogOut size={14} />
            Leave Room
          </button>
        </div>
      </section>
    );
  }

  // Default Join Form state
  return (
    <section
      className="flex flex-col justify-between rounded-[14px] border border-[#dce6e0] bg-white p-[34px]"
      aria-labelledby="join-room-heading"
    >
      <div>
        {/* Icon badge */}
        <div
          className="mb-5 grid h-[48px] w-[48px] place-items-center rounded-2xl bg-[#e7f1eb] text-[#2d6a50]"
          aria-hidden="true"
        >
          <Link2 size={22} strokeWidth={1.8} />
        </div>

        <span className="mb-2 font-sans text-[0.7rem] font-bold uppercase tracking-[0.12em] text-[#4a9271]">
          Have an ID?
        </span>
        <h2
          id="join-room-heading"
          className="m-0 text-[clamp(1.5rem,2.5vw,2rem)] font-normal leading-[1.1] tracking-[-0.03em] text-[#214d3b]"
        >
          Join a Room
        </h2>
        <p className="mt-3 font-sans text-[0.88rem] leading-[1.6] text-[#667772]">
          Enter the Room ID shared by the other person to connect to their
          ongoing session.
        </p>
      </div>

      <form
        className="mt-8 flex flex-col gap-3"
        onSubmit={onJoinRoom}
        noValidate
      >
        <div>
          <TextField
            id="room-id-input"
            name="roomId"
            label="Room ID"
            placeholder="e.g. 7mKx8_12aBcDeFgHiJkLm"
            value={roomId}
            onChange={onRoomIdChange}
            disabled={isJoining || disabled || Boolean(currentRoom)}
            autoComplete="off"
          />
          {/* Inline validation error — announced to screen readers via role="alert" */}
          {roomIdError && (
            <p
              id="room-id-error"
              role="alert"
              className="mt-2 font-sans text-[0.8rem] text-red-600 font-medium"
            >
              {roomIdError}
            </p>
          )}
        </div>

        <PrimaryButton
          id="btn-join-room"
          type="submit"
          disabled={isJoining || disabled || Boolean(currentRoom)}
          className="gap-2"
        >
          {isJoining ? (
            <>
              <Loader2 size={16} className="animate-spin" aria-hidden="true" />
              <span>Joining Room...</span>
            </>
          ) : (
            <>
              <LogIn size={16} strokeWidth={2} aria-hidden="true" />
              <span>Join Room</span>
            </>
          )}
        </PrimaryButton>

        {Boolean(currentRoom && isHost) && (
          <p className="mt-1 text-center text-xs text-[#72837a]">
            You are hosting room <strong className="font-mono">{currentRoom.id}</strong>. Leave it to join another.
          </p>
        )}
      </form>
    </section>
  );
}
