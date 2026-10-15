import { Link2, LogIn } from 'lucide-react';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { TextField } from '@/components/ui/TextField';

/**
 * JoinRoomCard — card that lets the user join an existing video call.
 *
 * Purely presentational. All state and handlers come from props so
 * this component has zero awareness of Redux, routing, or Socket.IO.
 *
 * @param {{
 *   roomId: string,
 *   roomIdError: string,
 *   onRoomIdChange: function,
 *   onJoinRoom: function,
 * }} props
 */
export function JoinRoomCard({ roomId, roomIdError, onRoomIdChange, onJoinRoom }) {
  return (
    <section
      className="flex flex-col rounded-[14px] border border-[#dce6e0] bg-white p-[34px]"
      aria-labelledby="join-room-heading"
    >
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
            placeholder="e.g. abc-xyz-123"
            value={roomId}
            onChange={onRoomIdChange}
            autoComplete="off"
          />
          {/* Inline validation error — announced to screen readers via role="alert" */}
          {roomIdError && (
            <p
              id="room-id-error"
              role="alert"
              className="mt-2 font-sans text-[0.8rem] text-red-600"
            >
              {roomIdError}
            </p>
          )}
        </div>

        <PrimaryButton
          id="btn-join-room"
          type="submit"
          className="gap-2"
        >
          <LogIn size={16} strokeWidth={2} aria-hidden="true" />
          Join Room
        </PrimaryButton>
      </form>
    </section>
  );
}
