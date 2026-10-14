/**
 * Generic primary action button.
 * Use for all prominent CTAs throughout the app (auth, chat, settings, etc.).
 */
export function PrimaryButton({
  children,
  type = 'button',
  onClick,
  disabled = false,
  className = '',
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex w-full items-center justify-center rounded-xl bg-[#5f7c58] px-4 py-3.5 text-sm font-semibold text-white transition hover:bg-[#4f6b49] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5f7c58] disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
    >
      {children}
    </button>
  );
}
