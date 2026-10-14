import { useSelector } from 'react-redux';

/**
 * Home page — shown after login/signup.
 */
export function HomePage() {
  const user = useSelector((state) => state.auth.user);

  return (
    <div className="mx-auto w-full max-w-[1040px] px-5 py-10 sm:px-[7vw] sm:py-[8vw] lg:px-[7vw] lg:py-[8vw]">
      <header className="max-w-[650px]">
        <p className="mb-3 font-sans text-[0.7rem] font-bold uppercase tracking-[0.12em] text-[#4a9271]">
          Workspace
        </p>
        <h1 className="m-0 text-[clamp(2.3rem,5vw,4.2rem)] font-normal leading-none tracking-[-0.05em] text-[#1c3029]">
          Good to see you, {user?.displayName?.split(' ')[0] || 'there'}.
        </h1>
        <p className="mt-5 font-sans text-[0.95rem] leading-[1.6] text-[#77827e]">
          Pick up where you left off or start a new conversation.
        </p>
      </header>
      <div className="mt-9 grid grid-cols-1 gap-4 sm:mt-[58px] sm:gap-[18px] lg:grid-cols-[minmax(0,1.4fr)_minmax(220px,0.8fr)]">
        <section className="min-h-[230px] rounded-[14px] border border-[#dce6e0] bg-[#dfeee5] p-[34px] lg:min-h-[270px]">
          <span className="mb-3 font-sans text-[0.7rem] font-bold uppercase tracking-[0.12em] text-[#4a9271]">
            QuickChat
          </span>
          <h2 className="m-0 max-w-[420px] text-[clamp(1.8rem,3vw,2.7rem)] font-normal leading-[1.05] tracking-[-0.04em] text-[#214d3b]">
            Your conversations, in one calm place.
          </h2>
          <p className="mt-7 max-w-[360px] font-sans text-[0.88rem] leading-[1.6] text-[#667772]">
            Head to Chat from the sidebar when you are ready to connect.
          </p>
        </section>
        <section className="self-start rounded-[14px] border border-[#dce6e0] bg-white p-7">
          <span className="mb-3 font-sans text-[0.7rem] font-bold uppercase tracking-[0.12em] text-[#4a9271]">
            Signed in as
          </span>
          <strong className="block break-words font-sans text-[0.9rem] text-[#253a33]">
            {user?.email}
          </strong>
          <p className="mt-2 font-sans text-[0.88rem] leading-[1.6] text-[#667772]">
            Your account is ready to use.
          </p>
        </section>
      </div>
    </div>
  );
}
