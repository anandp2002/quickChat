import { apiClient } from './api';

export const friendService = {
  discover: ({ search = '', limit = 20 } = {}) =>
    apiClient(`/api/friends/discover?search=${encodeURIComponent(search)}&limit=${limit}`),
  list: () => apiClient('/api/friends'),
  listRequests: () => apiClient('/api/friends/requests'),
  sendRequest: (userId) => apiClient(`/api/friends/${userId}`, { method: 'POST' }),
  respondToRequest: (userId, action) =>
    apiClient(`/api/friends/requests/${userId}`, {
      method: 'PATCH',
      body: JSON.stringify({ action }),
    }),
  remove: (userId) => apiClient(`/api/friends/${userId}`, { method: 'DELETE' }),
};
