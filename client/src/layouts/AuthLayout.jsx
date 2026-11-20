import { Outlet } from 'react-router-dom';

const FEATURES = [
  ['Fast', 'Optimized for a clear entry flow'],
  ['Modular', 'Reusable components and routes'],
  ['Ready', 'Prepared for auth and session logic'],
];

export function AuthLayout() {
  return (
    <div className="min-h-screen bg-app-warm text-text-primary">
      <div className="grid min-h-screen lg:grid-cols-[1.15fr_0.85fr]">
        <section className="relative hidden overflow-hidden border-r border-border-auth bg-surface-auth lg:flex lg:flex-col lg:justify-between">
          <div className="relative z-10 flex h-full flex-col justify-between p-10 xl:p-14">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.35em] text-brand">
                QuickChat
              </p>
              <h1 className="mt-6 max-w-xl text-5xl font-semibold tracking-tight text-text-primary xl:text-6xl">
                Simple, secure chat with a clean first impression.
              </h1>
              <p className="mt-6 max-w-lg text-base leading-7 text-text-secondary xl:text-lg">
                A focused authentication flow built to scale into your chat
                product without rework.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              {FEATURES.map(([title, description]) => (
                <div
                  key={title}
                  className="rounded-card border border-border-auth bg-surface p-4 shadow-sm"
                >
                  <p className="text-sm font-semibold text-text-primary">
                    {title}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-text-secondary">
                    {description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <main className="flex items-center justify-center px-4 py-8 sm:px-6 lg:px-10">
          <div className="w-full max-w-md">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
