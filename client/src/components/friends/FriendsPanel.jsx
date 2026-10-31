import { useState } from 'react';
import { Search, UserRoundPlus } from 'lucide-react';
import { suggestedFriends } from '@/config/friends';
import { FriendRow } from '@/components/friends/FriendRow';
import { FriendsTabs } from '@/components/friends/FriendsTabs';

function getTabContent(activeTab) {
  if (activeTab === 'friends') {
    return {
      title: 'Your friends',
      description: 'Friends you have connected with will appear here.',
      actionLabel: null,
    };
  }

  if (activeTab === 'requests') {
    return {
      title: 'Friend requests',
      description: 'You do not have any pending requests.',
      actionLabel: null,
    };
  }

  return {
    title: 'People you may know',
    description: null,
    actionLabel: 'Add Friend',
  };
}

export function FriendsPanel() {
  const [activeTab, setActiveTab] = useState('discover');
  const [query, setQuery] = useState('');
  const [addedFriendIds, setAddedFriendIds] = useState([]);
  const content = getTabContent(activeTab);
  const normalizedQuery = query.trim().toLowerCase();
  const visibleFriends = suggestedFriends.filter(
    (friend) =>
      !normalizedQuery ||
      `${friend.name} ${friend.username}`.toLowerCase().includes(normalizedQuery),
  );

  const handleAddFriend = (friendId) => {
    setAddedFriendIds((currentIds) => [...currentIds, friendId]);
  };

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
            strokeWidth={1.8}
            aria-hidden="true"
          />
        </div>
        <div className="mt-5">
          <FriendsTabs activeTab={activeTab} onTabChange={setActiveTab} />
        </div>
      </header>

      <div className="relative mt-5">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#77827e]"
          size={17}
          strokeWidth={1.8}
          aria-hidden="true"
        />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search people by name or username..."
          aria-label="Search people by name or username"
          className="h-11 w-full rounded-[9px] border border-[#dce6e0] bg-[#f8faf8] px-10 font-sans text-[0.8rem] text-[#253a33] outline-none placeholder:text-[#89968f] focus:border-[#4a9271]"
        />
      </div>

      <div className="mt-6">
        <h2 className="m-0 font-sans text-[0.92rem] font-semibold text-[#263a33]">
          {content.title}
        </h2>
        {content.description ? (
          <p className="mt-3 font-sans text-[0.8rem] leading-6 text-[#667772]">
            {content.description}
          </p>
        ) : visibleFriends.length ? (
          <ul className="m-0 mt-2 list-none p-0">
            {visibleFriends.map((friend) => {
              const isAdded = addedFriendIds.includes(friend.id);
              return (
                <FriendRow
                  key={friend.id}
                  friend={friend}
                  actionLabel={isAdded ? 'Added' : content.actionLabel}
                  isActionDisabled={isAdded}
                  onAction={() => handleAddFriend(friend.id)}
                />
              );
            })}
          </ul>
        ) : (
          <p className="mt-3 font-sans text-[0.8rem] leading-6 text-[#667772]">
            No people match your search.
          </p>
        )}
      </div>

      <p className="m-0 mt-4 font-sans text-[0.75rem] text-[#84908d]">
        Connect with people to start chatting.
      </p>
    </section>
  );
}
