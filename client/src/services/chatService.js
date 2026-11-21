import { apiClient } from './api';

export const chatService = {
  openDirect: (friendId) =>
    apiClient(`/api/conversations/direct/${encodeURIComponent(friendId)}`, {
      method: 'POST',
    }),
  listMessages: ({ conversationId, limit = 30, before } = {}) => {
    const params = new URLSearchParams({ limit: String(limit) });
    if (before) params.set('before', before);
    return apiClient(
      `/api/conversations/${encodeURIComponent(conversationId)}/messages?${params}`,
    );
  },
  markRead: (conversationId) =>
    apiClient(
      `/api/conversations/${encodeURIComponent(conversationId)}/read`,
      { method: 'PATCH' },
    ),
};
