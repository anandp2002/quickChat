import { Video } from 'lucide-react';
import { PrimaryButton } from '@/components/ui/PrimaryButton';

/**
 * CreateRoomCard — card that lets the user start a new video call.
 *
 * Purely presentational. Receives the handler as a prop so the
 * component has no awareness of Redux, routing, or Socket.IO.
 *
 * @param {{ onCreateRoom: function }} props
 */
export function CreateRoomCard({ onCreateRoom }) {
  return (
    <section
      className="flex flex-col rounded-[14px] border border-[#dce6e0] bg-[#dfeee5] p-[34px]"
      aria-labelledby="create-room-heading"
    >
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

      <div className="mt-8">
        <PrimaryButton
          id="btn-create-room"
          onClick={onCreateRoom}
          className="gap-2"
        >
          <Video size={16} strokeWidth={2} aria-hidden="true" />
          Create Room
        </PrimaryButton>
      </div>
    </section>
  );
}
