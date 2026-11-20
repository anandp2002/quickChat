export function ChatAvatar({ friend, size = 'large' }) {
  const sizeClass = size === 'large' ? 'h-12 w-12' : 'h-11 w-11';

  if (friend.photoURL) {
    return (
      <img
        src={friend.photoURL}
        alt=""
        className={`${sizeClass} shrink-0 rounded-full object-cover`}
      />
    );
  }

  const initials = (friend.name || '?')
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <span
      className={`${sizeClass} grid shrink-0 place-items-center rounded-full bg-brand-soft font-sans text-[0.82rem] font-semibold text-text-brand`}
      aria-hidden="true"
    >
      {initials}
    </span>
  );
}
