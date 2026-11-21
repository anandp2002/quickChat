import { MessageCircleMore, Search } from 'lucide-react';
import { Spinner } from '@/components/ui/Spinner';
import { ChatAvatar } from '@/components/chat/ChatAvatar';

export function ChatSidebar({
  friends,
  presenceByUid = {},
  selectedFriend,
  query,
  loading,
  error,
  onQueryChange,
  onSelectFriend,
}) {
  return (
    <aside
      className={`${selectedFriend ? 'hidden' : 'flex'} w-full shrink-0 flex-col border-r border-border-subtle bg-surface min-[721px]:flex min-[721px]:w-[360px]`}
    >
      <header className="flex h-[72px] shrink-0 items-center justify-between border-b border-border-subtle px-5">
        <h1 className="m-0 font-sans text-[1.35rem] font-semibold tracking-[-0.03em] text-text-heading">
          Chats
        </h1>
        <button
          type="button"
          className="grid h-10 w-10 place-items-center rounded-full text-text-secondary transition-colors hover:bg-surface-active hover:text-text-brand"
          aria-label="New chat"
          title="New chat"
        >
          <MessageCircleMore size={21} strokeWidth={1.8} aria-hidden="true" />
        </button>
      </header>

      <div className="shrink-0 px-4 pb-3 pt-4">
        <div className="relative">
          <Search
            size={17}
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
          />
          <input
            type="search"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Search or start a new chat"
            aria-label="Search friends"
            className="h-11 w-full rounded-control border border-border-subtle bg-surface-muted px-10 font-sans text-[0.82rem] text-text-primary outline-none placeholder:text-text-muted focus:border-brand"
          />
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {error ? (
          <p className="mx-4 mt-2 rounded-lg bg-danger-soft p-3 font-sans text-[0.8rem] text-danger">
            {error}
          </p>
        ) : loading ? (
          <div className="pt-5"><Spinner size="sm" /></div>
        ) : friends.length ? (
          <ul className="m-0 list-none p-0">
            {friends.map((friend) => (
              <li key={friend.id}>
                <button
                  type="button"
                  onClick={() => onSelectFriend(friend)}
                  className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-surface-muted ${
                    selectedFriend?.id === friend.id ? 'bg-surface-active' : ''
                  }`}
                  aria-current={selectedFriend?.id === friend.id ? 'true' : undefined}
                >
                  <span className="relative shrink-0">
                    <ChatAvatar friend={friend} />
                    {presenceByUid[friend.id]?.online && (
                      <span
                        className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-surface bg-emerald-500"
                        aria-label={`${friend.name} is online`}
                        title="Online"
                      />
                    )}
                  </span>
                  <span className="min-w-0 flex-1 border-b border-border-divider py-1">
                    <span className="block truncate font-sans text-[0.92rem] font-semibold text-text-primary">
                      {friend.name}
                    </span>
                    <span className="mt-1 block truncate font-sans text-[0.76rem] text-text-muted">
                      {friend.username || 'Tap to open chat'}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <div className="grid place-items-center px-6 py-12 text-center">
            <div className="grid h-12 w-12 place-items-center rounded-full bg-surface-accent text-brand">
              <MessageCircleMore size={21} aria-hidden="true" />
            </div>
            <p className="m-0 mt-3 font-sans text-[0.86rem] font-semibold text-text-primary">
              {query ? 'No friends match your search' : 'No friends yet'}
            </p>
          </div>
        )}
      </div>
    </aside>
  );
}
