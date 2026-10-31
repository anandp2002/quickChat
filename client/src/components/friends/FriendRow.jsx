export function FriendRow({ friend, actionLabel, onAction, isActionDisabled }) {
  return (
    <li className="flex items-center gap-3 border-b border-[#edf1ee] py-4 last:border-b-0">
      <span
        className={`grid h-11 w-11 shrink-0 place-items-center rounded-full font-sans text-[0.85rem] font-semibold ${friend.avatarClass}`}
        aria-hidden="true"
      >
        {friend.initials}
      </span>
      <div className="min-w-0 flex-1">
        <p className="m-0 truncate font-sans text-[0.9rem] font-semibold text-[#263a33]">
          {friend.name}
        </p>
        <p className="m-0 mt-0.5 truncate font-sans text-[0.73rem] text-[#77827e]">
          {friend.username}
        </p>
      </div>
      <button
        type="button"
        disabled={isActionDisabled}
        className={`shrink-0 rounded-full border px-3 py-1.5 font-sans text-[0.72rem] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#73c49e] ${
          isActionDisabled
            ? 'cursor-default border-[#cbd9d1] text-[#84908d]'
            : 'border-[#b8d5c3] bg-[#e1f0e7] text-[#176044] hover:bg-[#d2e8da]'
        }`}
        onClick={onAction}
      >
        {actionLabel}
      </button>
    </li>
  );
}
