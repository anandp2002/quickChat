import { signOut } from 'firebase/auth';
import { LogOut } from 'lucide-react';
import { auth } from '@/config/firebase';

function getInitials(displayName) {
  return displayName
    ?.split(' ')
    .map((word) => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function SidebarAccount({ user, collapsed = false }) {
  const handleLogout = async () => {
    await signOut(auth);
  };

  return (
    <div className="mt-auto grid gap-[18px] border-t border-border-divider px-0 pt-3 pb-2 min-[701px]:w-full min-[701px]:items-center min-[701px]:px-0 min-[701px]:pt-5 min-[701px]:pb-1 min-[701px]:group-hover:px-2.5">
      <div
        className={`flex min-w-0 items-center gap-2.5 min-[701px]:min-h-11 ${collapsed ? 'min-[701px]:justify-center' : 'min-[701px]:justify-start'}`}
      >
        {user?.photoURL ? (
          <img
            src={user.photoURL}
            alt={user.displayName || 'Profile'}
            referrerPolicy="no-referrer"
            className="grid h-[34px] w-[34px] shrink-0 place-items-center rounded-full bg-brand-soft object-cover font-sans text-xs font-bold text-text-brand"
          />
        ) : (
          <span className="grid h-[34px] w-[34px] shrink-0 place-items-center rounded-full bg-brand-soft font-sans text-xs font-bold text-text-brand">
            {getInitials(user?.displayName) || '?'}
          </span>
        )}
        <div className={collapsed ? 'hidden' : 'grid min-w-0 gap-0.5'}>
          <strong className="overflow-hidden text-ellipsis whitespace-nowrap text-[0.85rem] text-text-primary">
            {user?.displayName || 'User'}
          </strong>
          <span className="max-w-[180px] overflow-hidden text-ellipsis whitespace-nowrap font-sans text-[0.68rem] text-text-muted">
            {user?.email}
          </span>
        </div>
      </div>
      <button
        className="relative flex min-h-11 w-full items-center justify-center gap-2 rounded-control border-0 bg-transparent px-0 py-3 text-center font-sans text-[0.76rem] text-text-muted transition-[background-color,color,padding] duration-150 hover:bg-danger-soft hover:text-danger focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus min-[701px]:group-hover:min-h-0 min-[701px]:group-hover:px-3 min-[701px]:group-hover:py-2.5"
        type="button"
        title="Sign out"
        aria-label="Sign out"
        onClick={handleLogout}
      >
        <LogOut size={17} strokeWidth={1.8} aria-hidden="true" />
        <span className={collapsed ? 'hidden' : 'whitespace-nowrap'}>
          Sign out
        </span>
      </button>
    </div>
  );
}
