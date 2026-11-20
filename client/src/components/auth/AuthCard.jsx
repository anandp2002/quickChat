export function AuthCard({ eyebrow, title, description, children, footer }) {
  return (
    <section className="rounded-card border border-border-auth bg-surface p-6 shadow-auth-card sm:p-8">
      <div className="mb-8">
        <p className="text-sm font-medium uppercase tracking-[0.24em] text-brand">
          {eyebrow}
        </p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-text-primary">
          {title}
        </h2>
        <p className="mt-3 text-sm leading-6 text-text-secondary">{description}</p>
      </div>
      {children}
      {footer ? (
        <div className="mt-6 border-t border-border-divider pt-4">{footer}</div>
      ) : null}
    </section>
  );
}
