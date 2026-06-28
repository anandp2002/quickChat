export function AuthCard({ eyebrow, title, description, children, footer }) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <div className="mb-8">
        <p className="text-sm font-medium uppercase tracking-[0.24em] text-sky-500">
          {eyebrow}
        </p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">
          {title}
        </h2>
        <p className="mt-3 text-sm leading-6 text-slate-500">{description}</p>
      </div>
      {children}
      {footer ? (
        <div className="mt-6 border-t border-slate-200 pt-4">{footer}</div>
      ) : null}
    </section>
  );
}
