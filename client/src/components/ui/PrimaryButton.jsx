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
      className={`inline-flex w-full items-center justify-center rounded-2xl bg-sky-500 px-4 py-3.5 text-sm font-semibold text-white transition hover:bg-sky-600 disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
    >
      {children}
    </button>
  );
}
