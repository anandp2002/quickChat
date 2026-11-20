import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { MessageCircleMore, UserRoundPlus, UsersRound } from 'lucide-react';
import { routePaths } from '@/routes/routePaths';

export function HomePage() {
  const user = useSelector((state) => state.auth.user);
  const navigate = useNavigate();
  const firstName = user?.displayName?.split(' ')[0] || 'there';

  return (
    <div className="h-full w-full overflow-y-auto bg-app px-5 py-6 sm:px-8 sm:py-8 lg:px-10">
      <header className="flex items-center justify-between gap-4">
        <div>
          <p className="m-0 font-sans text-[0.7rem] font-bold uppercase tracking-[0.12em] text-brand">
            Home
          </p>
          <h1 className="m-0 mt-2 font-sans text-[clamp(1.8rem,4vw,2.8rem)] font-semibold leading-tight tracking-[-0.04em] text-text-heading">
            Good to see you, {firstName}.
          </h1>
        </div>
      </header>

      <section className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-[1.4fr_0.8fr]">
        <button
          type="button"
          onClick={() => navigate(routePaths.chat)}
          className="group min-h-[230px] rounded-panel border border-border-subtle bg-surface-accent p-7 text-left transition-transform hover:-translate-y-0.5"
        >
          <span className="grid h-12 w-12 place-items-center rounded-full bg-surface text-brand shadow-card">
            <MessageCircleMore size={22} strokeWidth={1.8} aria-hidden="true" />
          </span>
          <p className="m-0 mt-8 font-sans text-[0.7rem] font-bold uppercase tracking-[0.12em] text-brand">
            Messages
          </p>
          <h2 className="m-0 mt-2 max-w-[420px] font-sans text-[clamp(1.7rem,3vw,2.5rem)] font-semibold leading-[1.05] tracking-[-0.04em] text-text-brand">
            Continue your conversations
          </h2>
          <p className="m-0 mt-4 font-sans text-[0.82rem] text-text-secondary">
            Open your inbox and catch up with friends.
          </p>
        </button>

        <div className="grid min-h-[230px] gap-4 sm:grid-cols-2 xl:grid-cols-1">
          <button
            type="button"
            onClick={() => navigate(routePaths.friends)}
            className="rounded-panel border border-border-subtle bg-surface p-6 text-left transition-colors hover:bg-surface-muted"
          >
            <span className="grid h-10 w-10 place-items-center rounded-full bg-brand-soft text-text-brand">
              <UsersRound size={19} aria-hidden="true" />
            </span>
            <h2 className="m-0 mt-5 font-sans text-[1.05rem] font-semibold text-text-primary">
              Your friends
            </h2>
            <p className="m-0 mt-2 font-sans text-[0.78rem] leading-5 text-text-muted">
              View and manage your connections.
            </p>
          </button>

          <button
            type="button"
            onClick={() => navigate(routePaths.friends)}
            className="rounded-panel border border-border-subtle bg-surface p-6 text-left transition-colors hover:bg-surface-muted"
          >
            <span className="grid h-10 w-10 place-items-center rounded-full bg-brand-soft text-text-brand">
              <UserRoundPlus size={19} aria-hidden="true" />
            </span>
            <h2 className="m-0 mt-5 font-sans text-[1.05rem] font-semibold text-text-primary">
              Find people
            </h2>
            <p className="m-0 mt-2 font-sans text-[0.78rem] leading-5 text-text-muted">
              Discover people and send friend requests.
            </p>
          </button>
        </div>
      </section>

      <section className="mt-4 rounded-panel border border-border-subtle bg-surface p-6 sm:p-7">
        <p className="m-0 font-sans text-[0.7rem] font-bold uppercase tracking-[0.12em] text-brand">
          Account
        </p>
        <div className="mt-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="m-0 font-sans text-[1.05rem] font-semibold text-text-primary">
              {user?.displayName || 'QuickChat account'}
            </h2>
            <p className="m-0 mt-1 break-all font-sans text-[0.78rem] text-text-muted">
              {user?.email || 'Signed in'}
            </p>
          </div>
          <span className="mt-3 w-fit rounded-full bg-surface-active px-3 py-1.5 font-sans text-[0.72rem] font-semibold text-text-brand sm:mt-0">
            Account active
          </span>
        </div>
      </section>
    </div>
  );
}
