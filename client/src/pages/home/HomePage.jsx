import { useSelector } from 'react-redux';

/**
 * Home page — shown after login/signup.
 */
export function HomePage() {
  const user = useSelector((state) => state.auth.user);

  return (
    <div className="mx-auto w-full max-w-[1040px] px-5 py-10 sm:px-[7vw] sm:py-[8vw] lg:px-[7vw] lg:py-[8vw]">
      <header className="max-w-[650px]">
        <p className="mb-3 font-sans text-[0.7rem] font-bold uppercase tracking-[0.12em] text-brand">
          Workspace
        </p>
        <h1 className="m-0 text-[clamp(2.3rem,5vw,4.2rem)] font-normal leading-none tracking-[-0.05em] text-text-heading">
          Good to see you, {user?.displayName?.split(' ')[0] || 'there'}.
        </h1>
        <p className="mt-5 font-sans text-[0.95rem] leading-[1.6] text-text-muted">
          Pick up where you left off or start a new conversation.
        </p>
      </header>
      <div className="mt-9 grid grid-cols-1 gap-4 sm:mt-[58px] sm:gap-[18px] lg:grid-cols-[minmax(0,1.4fr)_minmax(220px,0.8fr)]">
        <section className="min-h-[230px] rounded-card border border-border-subtle bg-surface-accent p-[34px] lg:min-h-[270px]">
          <span className="mb-3 font-sans text-[0.7rem] font-bold uppercase tracking-[0.12em] text-brand">
            QuickChat
          </span>
          <h2 className="m-0 max-w-[420px] text-[clamp(1.8rem,3vw,2.7rem)] font-normal leading-[1.05] tracking-[-0.04em] text-text-brand">
            Your conversations, in one calm place.
          </h2>
          <p className="mt-7 max-w-[360px] font-sans text-[0.88rem] leading-[1.6] text-text-secondary">
            Head to Chat from the sidebar when you are ready to connect.
          </p>
        </section>
        <section className="self-start rounded-card border border-border-subtle bg-surface p-7">
          <span className="mb-3 font-sans text-[0.7rem] font-bold uppercase tracking-[0.12em] text-brand">
            Signed in as
          </span>
          <strong className="block break-words font-sans text-[0.9rem] text-text-primary">
            {user?.email}
          </strong>
          <p className="mt-2 font-sans text-[0.88rem] leading-[1.6] text-text-secondary">
            Your account is ready to use.
          </p>
        </section>
      </div>
    </div>
  );
}
