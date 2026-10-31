export function FriendRow({
  friend,
  actionLabel,
  onAction,
  isActionDisabled,
  secondaryActionLabel,
  onSecondaryAction,
}) {
  return (
    <li className="flex items-center gap-3 border-b border-[#edf1ee] py-4 last:border-b-0">
      {friend.photoURL ? (
        <img
          src={friend.photoURL}
          alt=""
          className="h-11 w-11 shrink-0 rounded-full object-cover"
        />
      ) : (
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#dcefe8] font-sans text-[0.85rem] font-semibold text-[#176044]">
          {(friend.name || '?')
            .split(/\s+/)
            .map((part) => part[0])
            .join('')
            .slice(0, 2)
            .toUpperCase()}
        </span>
      )}
      <div className="min-w-0 flex-1">
        <p className="m-0 truncate font-sans text-[0.9rem] font-semibold text-[#263a33]">
          {friend.name}
        </p>
        <p className="m-0 mt-0.5 truncate font-sans text-[0.73rem] text-[#77827e]">
          {friend.username}
        </p>
      </div>
      <div className="flex shrink-0 gap-2">
        {secondaryActionLabel ? (
          <button
            type="button"
            className="rounded-full border border-[#dce6e0] px-3 py-1.5 font-sans text-[0.72rem] text-[#667772] hover:bg-[#f4f7f5]"
            onClick={onSecondaryAction}
          >
            {secondaryActionLabel}
          </button>
        ) : null}
        {actionLabel ? (
          <button
            type="button"
            disabled={isActionDisabled}
            className={`rounded-full border px-3 py-1.5 font-sans text-[0.72rem] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#73c49e] ${
              isActionDisabled
                ? 'cursor-default border-[#cbd9d1] text-[#84908d]'
                : 'border-[#b8d5c3] bg-[#e1f0e7] text-[#176044] hover:bg-[#d2e8da]'
            }`}
            onClick={onAction}
          >
            {actionLabel}
          </button>
        ) : null}
      </div>
    </li>
  );
}
