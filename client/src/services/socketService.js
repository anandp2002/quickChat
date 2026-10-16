/**
 * socketService.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Reusable Socket.IO client service for QuickChat.
 *
 * Responsibilities:
 *   • Obtains a fresh Firebase ID token from the authenticated client.
 *   • Establishes a verified connection with the backend Socket.IO server.
 *   • Hands the Firebase ID token in `socket.handshake.auth.token`.
 *   • Deduplicates connection attempts and avoids duplicate socket instances.
 *   • Reconnects safely and cleans up listeners on demand.
 *   • Emits room lifecycle events (`room:create`, `room:join`, `room:leave`)
 *     WITHOUT sending unverified client UIDs (the server validates the token).
 */

import { io } from 'socket.io-client';
import { auth } from '@/config/firebase';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

/** @type {import('socket.io-client').Socket | null} */
let socketInstance = null;

/** @type {Promise<import('socket.io-client').Socket> | null} */
let pendingConnectionPromise = null;

/**
 * Retrieve a valid Firebase ID token for the current user.
 *
 * @param {boolean} [forceRefresh=false]
 * @returns {Promise<string>}
 */
export async function getAuthToken(forceRefresh = false) {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('Authentication required: please log in before connecting.');
  }
  return await currentUser.getIdToken(forceRefresh);
}

/**
 * Connect to the Socket.IO server using Firebase ID token authentication.
 *
 * Safe to call multiple times:
 *   - If already connected, resolves immediately with existing socket.
 *   - If a connection handshake is currently in flight, returns that promise.
 *   - If disconnected or not yet created, initializes a new authenticated connection.
 *
 * @returns {Promise<import('socket.io-client').Socket>}
 */
export async function connectSocket() {
  if (socketInstance?.connected) {
    return socketInstance;
  }

  if (pendingConnectionPromise) {
    return pendingConnectionPromise;
  }

  pendingConnectionPromise = (async () => {
    try {
      const token = await getAuthToken();

      if (!socketInstance) {
        socketInstance = io(SOCKET_URL, {
          auth: { token },
          autoConnect: false,
          reconnection: true,
          reconnectionAttempts: 5,
          reconnectionDelay: 1000,
          transports: ['websocket', 'polling'],
        });

        // Auto-refresh token if connection errors due to expired authentication
        socketInstance.on('connect_error', async (err) => {
          console.warn('[socketService] connect_error:', err.message);
          if (
            err?.message?.toLowerCase().includes('authentication') &&
            auth.currentUser
          ) {
            try {
              const freshToken = await getAuthToken(true);
              if (socketInstance) {
                socketInstance.auth = { token: freshToken };
              }
            } catch (tokenErr) {
              console.error('[socketService] Token refresh failed:', tokenErr.message);
            }
          }
        });
      } else {
        // Socket existed but was disconnected; update token before reconnecting
        socketInstance.auth = { token };
      }

      await new Promise((resolve, reject) => {
        const handleConnect = () => {
          cleanup();
          resolve(socketInstance);
        };

        const handleConnectError = (error) => {
          cleanup();
          reject(
            new Error(
              error?.message || 'Failed to establish real-time socket connection.',
            ),
          );
        };

        const cleanup = () => {
          socketInstance.off('connect', handleConnect);
          socketInstance.off('connect_error', handleConnectError);
        };

        socketInstance.once('connect', handleConnect);
        socketInstance.once('connect_error', handleConnectError);

        socketInstance.connect();
      });

      return socketInstance;
    } finally {
      pendingConnectionPromise = null;
    }
  })();

  return pendingConnectionPromise;
}

/**
 * Access the active socket instance without initiating a connection.
 *
 * @returns {import('socket.io-client').Socket | null}
 */
export function getSocket() {
  return socketInstance;
}

/**
 * Disconnect the socket and remove all registered listeners.
 */
export function disconnectSocket() {
  if (socketInstance) {
    socketInstance.removeAllListeners();
    socketInstance.disconnect();
    socketInstance = null;
  }
  pendingConnectionPromise = null;
}

/**
 * Emit `room:create` to the server.
 * Requires an active, authenticated socket connection.
 */
export function emitCreateRoom() {
  if (!socketInstance?.connected) {
    throw new Error('Socket is not connected. Unable to create room.');
  }
  // Server extracts UID from verified Firebase token in socket.data.user
  socketInstance.emit('room:create');
}

/**
 * Emit `room:join` with target room ID.
 *
 * @param {string} roomId
 */
export function emitJoinRoom(roomId) {
  if (!socketInstance?.connected) {
    throw new Error('Socket is not connected. Unable to join room.');
  }
  if (!roomId || typeof roomId !== 'string' || !roomId.trim()) {
    throw new Error('Please provide a valid Room ID to join.');
  }
  // Server extracts UID from verified Firebase token in socket.data.user
  socketInstance.emit('room:join', { roomId: roomId.trim() });
}

/**
 * Emit `room:leave` to the server.
 */
export function emitLeaveRoom() {
  if (!socketInstance?.connected) {
    return;
  }
  socketInstance.emit('room:leave');
}

/**
 * Emit `room:peer-ready` to declare readiness for WebRTC negotiation.
 *
 * @param {string} roomId
 */
export function emitPeerReady(roomId) {
  if (!socketInstance?.connected) {
    throw new Error('Socket is not connected. Unable to signal peer readiness.');
  }
  socketInstance.emit('room:peer-ready', { roomId });
}

/**
 * Emit `rtc:offer` to relay SDP offer to peer in the specified room.
 *
 * @param {string} roomId
 * @param {RTCSessionDescriptionInit | object} sdp
 */
export function emitRtcOffer(roomId, sdp) {
  if (!socketInstance?.connected) {
    throw new Error('Socket is not connected. Unable to send RTC offer.');
  }
  socketInstance.emit('rtc:offer', { roomId, sdp });
}

/**
 * Emit `rtc:answer` to relay SDP answer to peer in the specified room.
 *
 * @param {string} roomId
 * @param {RTCSessionDescriptionInit | object} sdp
 */
export function emitRtcAnswer(roomId, sdp) {
  if (!socketInstance?.connected) {
    throw new Error('Socket is not connected. Unable to send RTC answer.');
  }
  socketInstance.emit('rtc:answer', { roomId, sdp });
}

/**
 * Emit `rtc:ice-candidate` to relay an ICE candidate to the peer in the room.
 *
 * Implements trickle ICE — called once per gathered candidate so the peer
 * can begin connectivity checks without waiting for gathering to complete.
 *
 * @param {string} roomId
 * @param {object | null} candidate
 *   A serialised RTCIceCandidateInit object, or null to signal
 *   end-of-candidates (all local candidates have been gathered).
 */
export function emitRtcIceCandidate(roomId, candidate) {
  if (!socketInstance?.connected) {
    // Silently drop — the socket may have disconnected during gathering.
    console.warn('[socketService] emitRtcIceCandidate: socket not connected, dropping candidate.');
    return;
  }
  socketInstance.emit('rtc:ice-candidate', { roomId, candidate });
}
