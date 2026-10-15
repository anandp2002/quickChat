/**
 * VideoCallHero — page-level header for the Video Call page.
 *
 * Purely presentational: renders the eyebrow label, h1 title,
 * and subtitle. Receives no props — the copy is static.
 * Swap or localise this component without touching any logic.
 */
export function VideoCallHero() {
  return (
    <header className="max-w-[650px]">
      <p className="mb-3 font-sans text-[0.7rem] font-bold uppercase tracking-[0.12em] text-[#4a9271]">
        Video Calls
      </p>
      <h1 className="m-0 text-[clamp(2.3rem,5vw,4.2rem)] font-normal leading-none tracking-[-0.05em] text-[#1c3029]">
        Start or join a call
      </h1>
      <p className="mt-5 font-sans text-[0.95rem] leading-[1.6] text-[#77827e]">
        Create a new room and share the ID, or paste one you received to jump
        straight into the call.
      </p>
    </header>
  );
}
