import { signOut } from 'firebase/auth';
import { auth } from '@/config/firebase';

/**
 * Minimal placeholder chat page.
 * Proves that auth flow works end-to-end.
 */
export function ChatPage() {
  const handleLogout = async () => {
    await signOut(auth);
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white">
      <h1 className="text-4xl font-semibold tracking-tight text-slate-900">
        Welcome to QuickChat 🎉
      </h1>
      <p className="mt-4 text-lg text-slate-500">
        You're signed in. Chat UI coming soon.
      </p>
      <button
        onClick={handleLogout}
        className="mt-8 rounded-2xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
      >
        Sign out
      </button>
    </div>
  );
}
