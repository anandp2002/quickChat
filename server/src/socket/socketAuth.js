/**
 * socketAuth.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Socket.IO middleware that verifies a Firebase ID token sent by the client
 * during the handshake.
 *
 * The client must include the token in the `auth` object:
 *
 *   const socket = io(SERVER_URL, {
 *     auth: { token: '<firebase-id-token>' }
 *   });
 *
 * On success the decoded token is attached to socket.data.user so that
 * every subsequent event handler can read socket.data.user.uid safely,
 * without ever trusting a client-provided uid in the event payload.
 *
 * On failure the connection is rejected with a descriptive error that
 * Socket.IO surfaces to the client via the connect_error event.
 */

import { auth } from '../config/firebase.js';

/**
 * Socket.IO middleware — call this with io.use(socketAuthMiddleware).
 *
 * @param {import('socket.io').Socket} socket
 * @param {(err?: Error) => void} next
 */
export async function socketAuthMiddleware(socket, next) {
  const token = socket.handshake.auth?.token;

  if (!token) {
    return next(new Error('Authentication error: no token provided.'));
  }

  try {
    const decodedToken = await auth.verifyIdToken(token);

    // Attach to socket.data — safe, server-side only.
    socket.data.user = decodedToken;

    next();
  } catch (err) {
    console.error(`[socketAuth] Token verification failed for socket ${socket.id}:`, err.message);
    next(new Error('Authentication error: invalid or expired token.'));
  }
}

