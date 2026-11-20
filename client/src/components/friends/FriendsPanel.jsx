import { RefreshCw, Search, UserRoundPlus, UsersRound, UserCheck } from 'lucide-react';
import { FriendRow } from '@/components/friends/FriendRow';
import { FriendsTabs } from '@/components/friends/FriendsTabs';
import { Spinner } from '@/components/ui/Spinner';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { useFriendsPanel } from '@/components/friends/useFriendsPanel';

const tabCopy = {
  friends: { title: 'Your friends', empty: 'Friends you have connected with will appear here.' },
  requests: { title: 'Friend requests', empty: 'You do not have any pending requests.' },
  discover: { title: 'People you may know', empty: 'No people to show right now.' },
};

export function FriendsPanel() {
  const state = useFriendsPanel();
  const copy = tabCopy[state.activeTab];

  const openConfirmation = (friend, type) => {
    if (!state.pendingAction) state.setConfirmation({ friend, type });
  };

  const handleConfirmation = () => {
    if (!state.confirmation) return;
    if (state.confirmation.type === 'decline') {
      state.respondToRequest(state.confirmation.friend.id, 'decline');
    } else {
      state.removeFriend(state.confirmation.friend.id);
    }
  };

  const placeholder = state.activeTab === 'friends'
    ? 'Search friends by name or email...'
    : state.activeTab === 'requests'
      ? 'Search requests by name or email...'
      : 'Search people by name or email...';

  return (
    <section className="flex h-full w-full flex-col border-0 bg-surface text-text-heading">
      <header className="h-[72px] shrink-0 border-b border-border-subtle px-5 sm:px-7">
        <div className="flex h-full items-center gap-3">
          <div className="min-w-0 flex-1">
            <h1 className="m-0 font-sans text-[1.35rem] font-semibold tracking-[-0.03em]">Friends</h1>
          </div>
          <button type="button" onClick={state.refresh} disabled={state.loading} className="grid h-9 w-9 place-items-center rounded-full border border-border-subtle text-brand hover:bg-surface-active" aria-label="Refresh friends">
            <RefreshCw size={17} aria-hidden="true" className={state.loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-7">
        <FriendsTabs activeTab={state.activeTab} onTabChange={state.changeTab} requestCount={state.requestCount} />
        <div className="relative mt-5">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={17} aria-hidden="true" />
          <input type="search" value={state.query} onChange={(event) => state.setQuery(event.target.value)} placeholder={placeholder} aria-label="Search friends" className="h-11 w-full rounded-control border border-border-subtle bg-surface-muted px-10 font-sans text-[0.82rem] text-text-primary outline-none placeholder:text-text-muted focus:border-brand" />
        </div>

        <h2 className="m-0 mt-6 font-sans text-[0.92rem] font-semibold text-text-primary">{copy.title}</h2>
        {state.error ? (
          <p className="mt-3 rounded-lg bg-danger-soft p-3 font-sans text-[0.8rem] text-danger">{state.error}</p>
        ) : state.loading ? (
          <Spinner size="sm" />
        ) : state.friends.length ? (
          <ul className="m-0 mt-2 list-none p-0">
            {state.friends.map((friend) => {
              const isPending = state.pendingAction === friend.id;
              const status = friend.relationshipStatus;
              return (
                <FriendRow
                  key={friend.id}
                  friend={friend}
                  actionLabel={state.activeTab === 'requests' ? 'Accept' : state.activeTab === 'friends' ? 'Remove' : status === 'pending' ? 'Pending' : 'Add Friend'}
                  isActionDisabled={isPending || (state.activeTab === 'discover' && status === 'pending')}
                  onAction={() => state.activeTab === 'requests' ? state.respondToRequest(friend.id, 'accept') : state.activeTab === 'friends' ? openConfirmation(friend, 'remove') : state.sendRequest(friend.id)}
                  secondaryActionLabel={state.activeTab === 'requests' ? 'Decline' : null}
                  isSecondaryActionDisabled={isPending}
                  onSecondaryAction={() => openConfirmation(friend, 'decline')}
                />
              );
            })}
          </ul>
        ) : (
          <div className="mt-3 flex min-h-32 flex-col items-center justify-center rounded-card border border-dashed border-border-subtle bg-surface-subtle px-5 py-6 text-center">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-surface-active text-brand">
              {state.activeTab === 'friends' ? <UsersRound size={18} /> : state.activeTab === 'requests' ? <UserCheck size={18} /> : <UserRoundPlus size={18} />}
            </span>
            <p className="m-0 mt-3 font-sans text-[0.82rem] font-semibold text-text-primary">{state.query ? 'No matches found.' : copy.empty}</p>
          </div>
        )}
      </div>
      <ConfirmationModal
        open={Boolean(state.confirmation)}
        title={state.confirmation?.type === 'remove' ? 'Remove friend?' : 'Decline friend request?'}
        description={state.confirmation?.type === 'remove' ? `This will remove ${state.confirmation.friend.name} from your friends.` : `This will decline the friend request from ${state.confirmation?.friend?.name || 'this person'}.`}
        confirmLabel={state.confirmation?.type === 'remove' ? 'Remove friend' : 'Decline request'}
        onConfirm={handleConfirmation}
        onClose={() => state.setConfirmation(null)}
        isConfirming={Boolean(state.pendingAction)}
      />
    </section>
  );
}
