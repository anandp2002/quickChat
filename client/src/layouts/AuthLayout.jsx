import { Outlet } from 'react-router-dom';

const FEATURES = [
  ['Fast', 'Optimized for a clear entry flow'],
  ['Modular', 'Reusable components and routes'],
  ['Ready', 'Prepared for auth and session logic'],
];

export function AuthLayout() {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <div className="grid min-h-screen lg:grid-cols-[1.15fr_0.85fr]">
        <section className="relative hidden overflow-hidden border-r border-slate-200 bg-gradient-to-br from-sky-50 via-white to-sky-50/60 lg:flex lg:flex-col lg:justify-between">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.10),transparent_50%)]" />
          <div className="relative z-10 flex h-full flex-col justify-between p-10 xl:p-14">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.35em] text-sky-500">
                QuickChat
              </p>
              <h1 className="mt-6 max-w-xl text-5xl font-semibold tracking-tight text-slate-900 xl:text-6xl">
                Simple, secure chat with a clean first impression.
              </h1>
              <p className="mt-6 max-w-lg text-base leading-7 text-slate-500 xl:text-lg">
                A focused authentication flow built to scale into your chat
                product without rework.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              {FEATURES.map(([title, description]) => (
                <div
                  key={title}
                  className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <p className="text-sm font-semibold text-slate-900">
                    {title}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
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
