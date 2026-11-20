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
    <section className="w-full max-w-[768px] rounded-[18px] border border-[#dce6e0] bg-white p-5 text-[#1c3029] shadow-[0_20px_60px_rgba(30,65,48,0.08)] sm:p-7">
      <header>
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <h1 className="m-0 font-sans text-[1.35rem] font-semibold tracking-[-0.03em]">
              Friends
            </h1>
            <p className="m-0 mt-1 font-sans text-[0.82rem] text-[#77827e]">
              Discover people and manage your connections.
            </p>
          </div>
          <button
            type="button"
            onClick={handleRefresh}
            disabled={loading}
            className="mt-0 grid h-9 w-9 shrink-0 place-items-center rounded-full border border-[#dce6e0] text-[#4a9271] transition-colors hover:bg-[#edf5f1] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#73c49e] disabled:cursor-not-allowed disabled:opacity-60"
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
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#77827e]"
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
            className="h-11 w-full rounded-[9px] border border-[#dce6e0] bg-[#f8faf8] px-10 font-sans text-[0.8rem] text-[#253a33] outline-none placeholder:text-[#89968f] focus:border-[#4a9271]"
          />
        </div>

      <div className="mt-6">
        <h2 className="m-0 font-sans text-[0.92rem] font-semibold text-[#263a33]">
          {copy.title}
        </h2>
        {error ? (
          <p className="mt-3 rounded-lg bg-[#fff1f0] p-3 font-sans text-[0.8rem] text-[#b42318]">
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
          <div className="mt-3 flex min-h-32 flex-col items-center justify-center rounded-[12px] border border-dashed border-[#dce6e0] bg-[#fafcfb] px-5 py-6 text-center">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-[#edf5f1] text-[#4a9271]">
              {activeTab === 'friends' ? (
                <UsersRound size={18} aria-hidden="true" />
              ) : activeTab === 'requests' ? (
                <UserCheck size={18} aria-hidden="true" />
              ) : (
                <UserRoundPlus size={18} aria-hidden="true" />
              )}
            </span>
            <p className="m-0 mt-3 font-sans text-[0.82rem] font-semibold text-[#263a33]">
              {query
                ? activeTab === 'friends'
                  ? 'No friends match your search.'
                  : activeTab === 'requests'
                    ? 'No requests match your search.'
                    : 'No people match your search.'
                : copy.empty}
            </p>
            <p className="m-0 mt-1 font-sans text-[0.74rem] leading-5 text-[#77827e]">
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
