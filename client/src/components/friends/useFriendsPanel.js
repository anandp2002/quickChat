import { useEffect, useState } from 'react';
import { friendService } from '@/services/friendService';

export function useFriendsPanel() {
  const [activeTab, setActiveTab] = useState('discover');
  const [query, setQuery] = useState('');
  const [friends, setFriends] = useState([]);
  const [requestCount, setRequestCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pendingAction, setPendingAction] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [confirmation, setConfirmation] = useState(null);

  useEffect(() => {
    let active = true;
    friendService.listRequests()
      .then((response) => {
        if (active) setRequestCount(response.requests.length);
      })
      .catch((requestError) => {
        if (active) setError(requestError.message);
      });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    const timer = setTimeout(async () => {
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
    }, 250);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [activeTab, query, refreshKey]);

  const changeTab = (tab) => {
    setActiveTab(tab);
    setFriends([]);
    setLoading(true);
    setError('');
  };

  const refresh = () => {
    setFriends([]);
    setLoading(true);
    setError('');
    setRefreshKey((current) => current + 1);
  };

  const sendRequest = async (userId) => {
    if (pendingAction) return;
    setPendingAction(userId);
    setError('');
    try {
      await friendService.sendRequest(userId);
      setFriends((current) => current.map((friend) =>
        friend.id === userId ? { ...friend, relationshipStatus: 'pending' } : friend,
      ));
    } catch (requestError) {
      setError(requestError.message);
      if (requestError.status === 409 || requestError.status === 404) {
        setRefreshKey((current) => current + 1);
      }
    } finally {
      setPendingAction('');
    }
  };

  const respondToRequest = async (userId, action) => {
    if (pendingAction) return;
    setPendingAction(userId);
    setError('');
    try {
      await friendService.respondToRequest(userId, action);
      setFriends((current) => current.filter((friend) => friend.id !== userId));
      setRequestCount((count) => Math.max(0, count - 1));
      setConfirmation(null);
    } catch (requestError) {
      setError(requestError.message);
      if (requestError.status === 404 || requestError.status === 409) {
        setRefreshKey((current) => current + 1);
      }
    } finally {
      setPendingAction('');
    }
  };

  const removeFriend = async (userId) => {
    if (pendingAction) return;
    setPendingAction(userId);
    setError('');
    try {
      await friendService.remove(userId);
      setFriends((current) => current.filter((friend) => friend.id !== userId));
      setConfirmation(null);
    } catch (requestError) {
      setError(requestError.message);
      if (requestError.status === 404 || requestError.status === 409) {
        setRefreshKey((current) => current + 1);
      }
    } finally {
      setPendingAction('');
    }
  };

  return {
    activeTab, query, friends, requestCount, loading, error, pendingAction,
    confirmation, setQuery, setConfirmation, changeTab, refresh,
    sendRequest, respondToRequest, removeFriend,
  };
}
