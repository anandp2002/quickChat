/**
 * Minimal placeholder chat page.
 */
export function ChatPage() {
  return (
    <div className="mx-auto w-full max-w-[1040px] px-5 py-10 sm:px-[7vw] sm:py-[8vw] lg:px-[7vw] lg:py-[8vw]">
      <header className="max-w-[650px]">
        <p className="mb-3 font-sans text-[0.7rem] font-bold uppercase tracking-[0.12em] text-[#4a9271]">
          Messages
        </p>
        <h1 className="m-0 text-[clamp(2.3rem,5vw,4.2rem)] font-normal leading-none tracking-[-0.05em] text-[#1c3029]">
          Chat
        </h1>
        <p className="mt-5 font-sans text-[0.95rem] leading-[1.6] text-[#77827e]">
          Your conversations will appear here.
        </p>
      </header>
      <section className="mt-9 grid max-w-[620px] place-items-center rounded-[14px] border border-[#dce6e0] bg-white px-6 py-12 text-center sm:mt-[58px] sm:px-8 sm:py-[58px]">
        <div
          className="mb-5 grid h-[52px] w-[52px] place-items-center rounded-2xl bg-[#e0eee5] text-xl"
          aria-hidden="true"
        >
          ...
        </div>
        <h2 className="m-0 text-[1.7rem] font-normal text-[#243b32]">
          No conversations yet
        </h2>
        <p className="mt-3 max-w-[360px] font-sans text-[0.88rem] leading-[1.6] text-[#667772]">
          When chat is connected, this is where your messages will live.
        </p>
      </section>
    </div>
  );
}
