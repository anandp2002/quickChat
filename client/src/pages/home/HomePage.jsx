import { signOut } from 'firebase/auth';
import { useSelector } from 'react-redux';
import { auth } from '@/config/firebase';

/**
 * Home page — shown after login/signup.
 * Displays the authenticated user's profile info.
 */
export function HomePage() {
  const user = useSelector((state) => state.auth.user);

  const handleLogout = async () => {
    await signOut(auth);
  };

  const initials = user?.displayName
    ?.split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50">
      {/* ── Profile card ── */}
      <div className="w-full max-w-sm rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="flex flex-col items-center gap-4">
          {/* Avatar */}
          {user?.photoURL ? (
            <img
              src={user.photoURL}
              alt={user.displayName || 'Profile'}
              referrerPolicy="no-referrer"
              className="h-20 w-20 rounded-full object-cover ring-4 ring-sky-100"
            />
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-sky-400 to-indigo-500 text-2xl font-bold text-white ring-4 ring-sky-100">
              {initials || '?'}
            </div>
          )}

          {/* Name */}
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            {user?.displayName || 'User'}
          </h1>

          {/* Email */}
          <p className="text-sm text-slate-500">{user?.email}</p>
        </div>

        {/* Divider */}
        <div className="my-6 h-px bg-slate-200" />

        {/* Sign out */}
        <button
          onClick={handleLogout}
          className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 active:scale-[0.98]"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
