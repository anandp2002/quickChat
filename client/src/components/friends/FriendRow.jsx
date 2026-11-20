export function FriendRow({
  friend,
  actionLabel,
  onAction,
  isActionDisabled,
  secondaryActionLabel,
  onSecondaryAction,
}) {
  return (
    <li className="flex items-center gap-3 border-b border-border-divider py-4 last:border-b-0">
      {friend.photoURL ? (
        <img
          src={friend.photoURL}
          alt=""
          className="h-11 w-11 shrink-0 rounded-full object-cover"
        />
      ) : (
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-brand-soft font-sans text-[0.85rem] font-semibold text-text-brand">
          {(friend.name || '?')
            .split(/\s+/)
            .map((part) => part[0])
            .join('')
            .slice(0, 2)
            .toUpperCase()}
        </span>
      )}
      <div className="min-w-0 flex-1">
        <p className="m-0 truncate font-sans text-[0.9rem] font-semibold text-text-primary">
          {friend.name}
        </p>
        <p className="m-0 mt-0.5 truncate font-sans text-[0.73rem] text-text-muted">
          {friend.username}
        </p>
      </div>
      <div className="flex shrink-0 gap-2">
        {secondaryActionLabel ? (
          <button
            type="button"
            className="rounded-full border border-border-subtle px-3 py-1.5 font-sans text-[0.72rem] text-text-secondary hover:bg-surface-muted"
            onClick={onSecondaryAction}
          >
            {secondaryActionLabel}
          </button>
        ) : null}
        {actionLabel ? (
          <button
            type="button"
            disabled={isActionDisabled}
            className={`rounded-full border px-3 py-1.5 font-sans text-[0.72rem] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus ${
              isActionDisabled
                ? 'cursor-default border-border-subtle text-text-muted'
                : 'border-border-active bg-brand-soft text-text-brand hover:bg-surface-accent'
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
