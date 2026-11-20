import { useEffect, useState } from 'react';
import {
  RefreshCw,
  Search,
  UserRoundPlus,
  UsersRound,
  UserCheck,
} from 'lucide-react';
import { friendService } from '@/services/friendService';
import { FriendRow } from '@/components/friends/FriendRow';
import { FriendsTabs } from '@/components/friends/FriendsTabs';
import { Spinner } from '@/components/ui/Spinner';

const tabCopy = {
  friends: {
    title: 'Your friends',
    empty: 'Friends you have connected with will appear here.',
  },
  requests: {
    title: 'Friend requests',
    empty: 'You do not have any pending requests.',
  },
  discover: {
    title: 'People you may know',
    empty: 'No people to show right now.',
  },
};

export function FriendsPanel() {
  const [activeTab, setActiveTab] = useState('discover');
  const [query, setQuery] = useState('');
  const [friends, setFriends] = useState([]);
  const [requestCount, setRequestCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pendingAction, setPendingAction] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let active = true;
    friendService
      .listRequests()
      .then((response) => {
        if (active) setRequestCount(response.requests.length);
      })
      .catch((requestError) => {
        if (active) setError(requestError.message);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    const timer = setTimeout(
      async () => {
        setError('');
        try {
          const response =
            activeTab === 'discover'
              ? await friendService.discover({ search: query })
              : activeTab === 'friends'
                ? await friendService.list({ search: query })
                : await friendService.listRequests({ search: query });

          if (!active) return;
          const items = response.friends || response.requests || [];
          setFriends(items);
          if (activeTab === 'requests' && !query) setRequestCount(items.length);
        } catch (requestError) {
          if (active) setError(requestError.message);
        } finally {
          if (active) setLoading(false);
        }
      },
      250,
    );

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [activeTab, query, refreshKey]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setFriends([]);
    setLoading(true);
    setError('');
  };

  const handleQueryChange = (event) => {
    setQuery(event.target.value);
    setLoading(true);
    setError('');
  };

  const handleRefresh = () => {
    setFriends([]);
    setLoading(true);
    setError('');
    setRefreshKey((current) => current + 1);
  };

  const handleSendRequest = async (userId) => {
    setPendingAction(userId);
    setError('');
    try {
      await friendService.sendRequest(userId);
      setFriends((current) =>
        current.map((friend) =>
          friend.id === userId
            ? { ...friend, relationshipStatus: 'pending' }
            : friend,
        ),
      );
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setPendingAction('');
    }
  };

  const handleRequestResponse = async (userId, action) => {
    setPendingAction(userId);
    setError('');
    try {
      await friendService.respondToRequest(userId, action);
      setFriends((current) => current.filter((friend) => friend.id !== userId));
      setRequestCount((count) => Math.max(0, count - 1));
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setPendingAction('');
    }
  };

  const handleRemoveFriend = async (userId) => {
    setPendingAction(userId);
    setError('');
    try {
      await friendService.remove(userId);
      setFriends((current) => current.filter((friend) => friend.id !== userId));
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setPendingAction('');
    }
  };

  const copy = tabCopy[activeTab];

  return (
    <section className="w-full max-w-[768px] rounded-panel border border-border-subtle bg-surface p-5 text-text-heading shadow-card sm:p-7">
      <header>
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <h1 className="m-0 font-sans text-[1.35rem] font-semibold tracking-[-0.03em]">
              Friends
            </h1>
            <p className="m-0 mt-1 font-sans text-[0.82rem] text-text-muted">
              Discover people and manage your connections.
            </p>
          </div>
          <button
            type="button"
            onClick={handleRefresh}
            disabled={loading}
            className="mt-0 grid h-9 w-9 shrink-0 place-items-center rounded-full border border-border-subtle text-brand transition-colors hover:bg-surface-active focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:cursor-not-allowed disabled:opacity-60"
            aria-label="Refresh friends"
            title="Refresh friends"
          >
            <RefreshCw
              size={17}
              aria-hidden="true"
              className={loading ? 'animate-spin' : ''}
            />
          </button>
        </div>
        <div className="mt-5">
          <FriendsTabs
            activeTab={activeTab}
            onTabChange={handleTabChange}
            requestCount={requestCount}
          />
        </div>
      </header>

      <div className="relative mt-5">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
            size={17}
            aria-hidden="true"
          />
          <input
            type="search"
            value={query}
            onChange={handleQueryChange}
            placeholder={
              activeTab === 'friends'
                ? 'Search friends by name or email...'
                : activeTab === 'requests'
                  ? 'Search requests by name or email...'
                  : 'Search people by name or email...'
            }
            aria-label={
              activeTab === 'friends'
                ? 'Search friends by name or email'
                : activeTab === 'requests'
                  ? 'Search requests by name or email'
                  : 'Search people by name or email'
            }
            className="h-11 w-full rounded-control border border-border-subtle bg-surface-muted px-10 font-sans text-[0.8rem] text-text-primary outline-none placeholder:text-text-muted focus:border-brand"
          />
        </div>

      <div className="mt-6">
        <h2 className="m-0 font-sans text-[0.92rem] font-semibold text-text-primary">
          {copy.title}
        </h2>
        {error ? (
          <p className="mt-3 rounded-lg bg-danger-soft p-3 font-sans text-[0.8rem] text-danger">
            {error}
          </p>
        ) : loading ? (
          <Spinner size="sm" />
        ) : friends.length ? (
          <ul className="m-0 mt-2 list-none p-0">
            {friends.map((friend) => {
              const isPending = pendingAction === friend.id;
              const status = friend.relationshipStatus;
              return (
                <FriendRow
                  key={friend.id}
                  friend={friend}
                  actionLabel={
                    activeTab === 'requests'
                      ? 'Accept'
                      : activeTab === 'friends'
                        ? 'Remove'
                        : status === 'pending'
                          ? 'Pending'
                          : 'Add Friend'
                  }
                  isActionDisabled={
                    isPending ||
                    (activeTab === 'discover' && status === 'pending')
                  }
                  onAction={() =>
                    activeTab === 'requests'
                      ? handleRequestResponse(friend.id, 'accept')
                      : activeTab === 'friends'
                        ? handleRemoveFriend(friend.id)
                        : handleSendRequest(friend.id)
                  }
                  secondaryActionLabel={
                    activeTab === 'requests' ? 'Decline' : null
                  }
                  onSecondaryAction={() =>
                    handleRequestResponse(friend.id, 'decline')
                  }
                />
              );
            })}
          </ul>
        ) : (
          <div className="mt-3 flex min-h-32 flex-col items-center justify-center rounded-card border border-dashed border-border-subtle bg-surface-subtle px-5 py-6 text-center">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-surface-active text-brand">
              {activeTab === 'friends' ? (
                <UsersRound size={18} aria-hidden="true" />
              ) : activeTab === 'requests' ? (
                <UserCheck size={18} aria-hidden="true" />
              ) : (
                <UserRoundPlus size={18} aria-hidden="true" />
              )}
            </span>
            <p className="m-0 mt-3 font-sans text-[0.82rem] font-semibold text-text-primary">
              {query
                ? activeTab === 'friends'
                  ? 'No friends match your search.'
                  : activeTab === 'requests'
                    ? 'No requests match your search.'
                    : 'No people match your search.'
                : copy.empty}
            </p>
            <p className="m-0 mt-1 font-sans text-[0.74rem] leading-5 text-text-muted">
              {query
                ? 'Try a different name or email address.'
                : activeTab === 'discover'
                  ? 'Check back later to find new people.'
                : activeTab === 'friends'
                  ? 'Send a friend request to someone you would like to connect with.'
                  : 'New friend requests will appear here.'}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
