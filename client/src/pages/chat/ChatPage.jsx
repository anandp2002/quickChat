import { useEffect, useState } from 'react';
import { friendService } from '@/services/friendService';
import { chatService } from '@/services/chatService';
import { getChatSocket } from '@/services/socketService';
import { ChatSidebar } from '@/components/chat/ChatSidebar';
import { ChatConversation } from '@/components/chat/ChatConversation';

export function ChatPage() {
  const [friends, setFriends] = useState([]);
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [conversation, setConversation] = useState(null);
  const [openingChat, setOpeningChat] = useState(false);
  const [presenceByUid, setPresenceByUid] = useState({});

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

  useEffect(() => {
    let active = true;
    let chatSocket;

    const handleOnline = ({ uid }) => {
      if (!active) return;
      setPresenceByUid((current) => ({
        ...current,
        [uid]: { ...current[uid], online: true },
      }));
    };

    const handleOffline = ({ uid, lastSeen }) => {
      if (!active) return;
      setPresenceByUid((current) => ({
        ...current,
        [uid]: { ...current[uid], online: false, lastSeen: lastSeen || current[uid]?.lastSeen || null },
      }));
    };

    const connect = async () => {
      try {
        chatSocket = await getChatSocket();
        chatSocket.on('presence:online', handleOnline);
        chatSocket.on('presence:offline', handleOffline);

        const subscribe = () => {
          chatSocket.emit('presence:subscribe', {}, (response) => {
            if (active && response?.ok) {
              setPresenceByUid(response.presences || {});
            }
          });
        };

        if (chatSocket.connected) subscribe();
        else chatSocket.once('connect', subscribe);
      } catch {
        // The chat REST flow remains available when presence cannot connect.
      }
    };

    connect();

    return () => {
      active = false;
      if (chatSocket) {
        chatSocket.off('presence:online', handleOnline);
        chatSocket.off('presence:offline', handleOffline);
      }
    };
  }, []);

  const openConversation = async (friend) => {
    setSelectedFriend(friend);
    setConversation(null);
    setOpeningChat(true);
    setError('');
    try {
      const response = await chatService.openDirect(friend.id);
      setConversation(response.conversation);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setOpeningChat(false);
    }
  };

  const closeConversation = () => {
    setSelectedFriend(null);
    setConversation(null);
  };

  return (
    <div className="flex h-full w-full overflow-hidden bg-surface">
      <ChatSidebar
        friends={friends}
        presenceByUid={presenceByUid}
        selectedFriend={selectedFriend}
        query={query}
        loading={loading}
        error={error}
        onQueryChange={setQuery}
        onSelectFriend={openConversation}
      />
      <ChatConversation
        key={selectedFriend?.id || 'no-chat'}
        friend={selectedFriend}
        presence={selectedFriend ? presenceByUid[selectedFriend.id] : null}
        conversation={conversation}
        loading={openingChat}
        error={error}
        onClose={closeConversation}
      />
    </div>
  );
}
