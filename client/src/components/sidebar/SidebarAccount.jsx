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

export function SidebarAccount({ user }) {
  const handleLogout = async () => {
    await signOut(auth);
  };

  return (
    <div className="app-sidebar-footer">
      <div className="app-user">
        {user?.photoURL ? (
          <img
            src={user.photoURL}
            alt={user.displayName || 'Profile'}
            referrerPolicy="no-referrer"
          />
        ) : (
          <span className="app-user-avatar">
            {getInitials(user?.displayName) || '?'}
          </span>
        )}
        <div className="app-user-details">
          <strong>{user?.displayName || 'User'}</strong>
          <span>{user?.email}</span>
        </div>
      </div>
      <button
        className="app-signout"
        type="button"
        title="Sign out"
        aria-label="Sign out"
        onClick={handleLogout}
      >
        <LogOut size={17} strokeWidth={1.8} aria-hidden="true" />
        <span className="app-signout-label">Sign out</span>
      </button>
    </div>
  );
}
