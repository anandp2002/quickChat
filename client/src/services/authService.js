import { apiClient } from './api';

/**
 * Service to handle authentication/profile-related backend API calls.
 */
export const authService = {
  /**
   * Creates/registers a user profile in the backend database.
   *
   * @param {object} payload
   * @param {string} payload.name - The full name of the user
   * @returns {Promise<object>} The created user profile details.
   */
  register: async ({ name }) => {
    return apiClient('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
  },

  /**
   * Fetches the current authenticated user's profile details from the backend.
   *
   * @returns {Promise<object>} The user's profile from the backend database.
   */
  getMe: async () => {
    return apiClient('/api/auth/me', {
      method: 'GET',
    });
  },
};
