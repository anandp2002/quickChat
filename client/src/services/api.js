import { auth } from '@/config/firebase';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

/**
 * Lightweight API client that auto-attaches the current user's
 * Firebase ID token to every request.
 *
 * @param {string} endpoint  — path relative to the API base (e.g. '/api/auth/register')
 * @param {object} [options] — fetch options (method, body, headers, etc.)
 * @returns {Promise<object>} parsed JSON response
 */
export const apiClient = async (endpoint, options = {}) => {
  const user = auth.currentUser;

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // Attach Firebase ID token if the user is signed in
  if (user) {
    const token = await user.getIdToken();
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    const error = new Error(data.error || 'Something went wrong.');
    error.status = response.status;
    throw error;
  }

  return data;
};
