export function SidebarBrand({ compact = false }) {
  return (
    <div
      className={`flex min-h-8 min-w-0 items-center gap-2.5 whitespace-nowrap px-2.5 text-[1.2rem] font-bold tracking-[-0.02em] text-text-brand min-[701px]:w-auto ${compact ? 'min-[701px]:justify-center min-[701px]:px-0' : 'min-[701px]:justify-start'}`}
      title="QuickChat"
      aria-label="QuickChat"
    >
      <span
        className="grid h-8 w-8 shrink-0 place-items-center rounded-control bg-brand-soft font-sans text-[0.9rem] text-text-brand"
        aria-hidden="true"
      >
        Q
      </span>
      <span className={compact ? 'min-[701px]:hidden' : ''}>QuickChat</span>
    </div>
  );
}
