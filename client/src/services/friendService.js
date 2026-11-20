import { apiClient } from './api';

export const friendService = {
  discover: ({ search = '', limit = 20 } = {}) =>
    apiClient(`/api/friends/discover?search=${encodeURIComponent(search)}&limit=${limit}`),
  list: ({ search = '' } = {}) =>
    apiClient(`/api/friends?search=${encodeURIComponent(search)}`),
  listRequests: ({ search = '' } = {}) =>
    apiClient(`/api/friends/requests?search=${encodeURIComponent(search)}`),
  sendRequest: (userId) => apiClient(`/api/friends/${userId}`, { method: 'POST' }),
  respondToRequest: (userId, action) =>
    apiClient(`/api/friends/requests/${userId}`, {
      method: 'PATCH',
      body: JSON.stringify({ action }),
    }),
  remove: (userId) => apiClient(`/api/friends/${userId}`, { method: 'DELETE' }),
};
