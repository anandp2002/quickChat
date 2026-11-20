import { useEffect, useState } from 'react';
import { friendService } from '@/services/friendService';
import { ChatSidebar } from '@/components/chat/ChatSidebar';
import { ChatConversation } from '@/components/chat/ChatConversation';

export function ChatPage() {
  const [friends, setFriends] = useState([]);
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    const timer = setTimeout(async () => {
      setLoading(true);
      setError('');
      try {
        const response = await friendService.list({ search: query });
        if (active) setFriends(response.friends || []);
      } catch (requestError) {
        if (active) setError(requestError.message);
      } finally {
        if (active) setLoading(false);
      }
    }, 250);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [query]);

  return (
    <div className="flex h-full w-full overflow-hidden bg-surface">
      <ChatSidebar
        friends={friends}
        selectedFriend={selectedFriend}
        query={query}
        loading={loading}
        error={error}
        onQueryChange={setQuery}
        onSelectFriend={setSelectedFriend}
      />
      <ChatConversation
        friend={selectedFriend}
        onClose={() => setSelectedFriend(null)}
      />
    </div>
  );
}
