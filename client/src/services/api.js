import { auth } from '@/config/firebase';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const apiClient = async (endpoint, options = {}) => {
  const user = auth.currentUser;
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (user) {
    headers.Authorization = `Bearer ${await user.getIdToken()}`;
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });
  const data = response.status === 204 ? null : await response.json();

  if (!response.ok) {
    const error = new Error(data?.error || 'Something went wrong.');
    error.status = response.status;
    throw error;
  }

  return data;
};
