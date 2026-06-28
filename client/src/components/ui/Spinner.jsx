/**
 * Full-screen loading spinner.
 * Used by route guards during auth state resolution and
 * by Suspense fallbacks during lazy-loaded route transitions.
 */
export function Spinner() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-white">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-sky-500" />
    </div>
  );
}
