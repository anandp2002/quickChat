/**
 * Loading spinner for full-page route transitions or inline content states.
 */
export function Spinner({ size = 'full' }) {
  const isInline = size === 'sm';

  return (
    <div
      className={
        isInline
          ? 'flex min-h-24 items-center justify-center'
          : 'flex min-h-screen items-center justify-center bg-white'
      }
      role="status"
      aria-label="Loading"
    >
      <div
        className={
          isInline
            ? 'h-6 w-6 animate-spin rounded-full border-2 border-[#dce6da] border-t-[#5f7c58]'
            : 'h-10 w-10 animate-spin rounded-full border-4 border-[#dce6da] border-t-[#5f7c58]'
        }
      />
    </div>
  );
}
