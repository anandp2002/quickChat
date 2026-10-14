/**
 * Single source of truth for all route paths.
 *
 * Import this everywhere instead of hardcoding strings.
 * When a path changes, update it here and the entire app follows.
 */
export const routePaths = {
  // Auth
  login: '/login',
  signup: '/signup',

  // App (protected)
  home: '/',
  chat: '/chat',
};
