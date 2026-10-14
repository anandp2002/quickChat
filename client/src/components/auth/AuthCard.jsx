export function AuthCard({ eyebrow, title, description, children, footer }) {
  return (
    <section className="rounded-2xl border border-[#d7e1d6] bg-white p-6 shadow-[0_18px_45px_rgba(48,73,54,0.07)] sm:p-8">
      <div className="mb-8">
        <p className="text-sm font-medium uppercase tracking-[0.24em] text-[#65845d]">
          {eyebrow}
        </p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-[#203229]">
          {title}
        </h2>
        <p className="mt-3 text-sm leading-6 text-[#748278]">{description}</p>
      </div>
      {children}
      {footer ? (
        <div className="mt-6 border-t border-[#e1e8df] pt-4">{footer}</div>
      ) : null}
    </section>
  );
}
