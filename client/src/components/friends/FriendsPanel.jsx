import { useEffect, useState } from 'react';
import { Search, UserRoundPlus } from 'lucide-react';
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
  discover: { title: 'People you may know' },
};

export function FriendsPanel() {
  const [activeTab, setActiveTab] = useState('discover');
  const [query, setQuery] = useState('');
  const [friends, setFriends] = useState([]);
  const [requestCount, setRequestCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pendingAction, setPendingAction] = useState('');

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
        setLoading(true);
        setError('');
        try {
          const response =
            activeTab === 'discover'
              ? await friendService.discover({ search: query })
              : activeTab === 'friends'
                ? await friendService.list()
                : await friendService.listRequests();

          if (!active) return;
          const items = response.friends || response.requests || [];
          setFriends(items);
          if (activeTab === 'requests') setRequestCount(items.length);
        } catch (requestError) {
          if (active) setError(requestError.message);
        } finally {
          if (active) setLoading(false);
        }
      },
      activeTab === 'discover' ? 250 : 0,
    );

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [activeTab, query]);

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
          <UserRoundPlus
            className="mt-1 text-[#4a9271]"
            size={20}
            aria-hidden="true"
          />
        </div>
        <div className="mt-5">
          <FriendsTabs
            activeTab={activeTab}
            onTabChange={setActiveTab}
            requestCount={requestCount}
          />
        </div>
      </header>

      {activeTab === 'discover' ? (
        <div className="relative mt-5">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#77827e]"
            size={17}
            aria-hidden="true"
          />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search people by name or email..."
            aria-label="Search people by name or email"
            className="h-11 w-full rounded-[9px] border border-[#dce6e0] bg-[#f8faf8] px-10 font-sans text-[0.8rem] text-[#253a33] outline-none placeholder:text-[#89968f] focus:border-[#4a9271]"
          />
        </div>
      ) : null}

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
          <p className="mt-3 font-sans text-[0.8rem] leading-6 text-[#667772]">
            {activeTab === 'discover' && query
              ? 'No people match your search.'
              : copy.empty}
          </p>
        )}
      </div>
    </section>
  );
}
