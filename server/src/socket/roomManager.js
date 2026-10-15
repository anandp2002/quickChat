/**
 * roomManager.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Pure in-memory store for video-call rooms.  No WebRTC, no SDP, no ICE.
 *
 * ── Data shape ──────────────────────────────────────────────────────────────
 *
 *  rooms  Map<roomId, Room>
 *
 *  Room {
 *    id          : string          — crypto-random, server-generated
 *    hostUid     : string          — Firebase UID of the creator
 *    status      : 'waiting'       — host joined, awaiting second peer
 *               | 'active'         — both participants connected
 *               | 'ended'          — closed; no new joins allowed
 *    participants: Map<uid, Participant>
 *    createdAt   : number          — Date.now()
 *    endedAt     : number | null   — Date.now() when ended, else null
 *  }
 *
 *  Participant {
 *    uid       : string   — Firebase UID (from verified token)
 *    socketId  : string   — socket.id of the current live connection
 *    joinedAt  : number   — Date.now()
 *  }
 */

import { randomBytes } from 'crypto';

/** Maximum participants per room (one-to-one call). */
export const MAX_PARTICIPANTS = 2;

/**
 * How long (ms) an ended room is kept before being swept from memory.
 * Prevents stale-room build-up without an external store.
 */
const ENDED_ROOM_TTL_MS = 5 * 60 * 1000; // 5 minutes

// ─────────────────────────────────────────────────────────────────────────────
// Internal store
// ─────────────────────────────────────────────────────────────────────────────

const rooms = new Map();

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Generate a cryptographically random, URL-safe room ID.
 * 16 bytes → 22-char base64url string (no padding).
 */
function generateRoomId() {
  return randomBytes(16).toString('base64url');
}

// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Create a new room with the caller as host and first participant.
 *
 * @param {string} uid      Firebase UID of the creator
 * @param {string} socketId Current socket.id of the creator
 * @returns {{ room: object, error: null } | { room: null, error: string }}
 */
export function createRoom(uid, socketId) {
  // Prevent a user from hosting/joining multiple simultaneous rooms.
  const existing = getRoomByParticipant(uid);
  if (existing) {
    return {
      room: null,
      error: `You are already in room "${existing.id}". Leave it before creating a new one.`,
    };
  }

  const id = generateRoomId();

  const room = {
    id,
    hostUid: uid,
    status: 'waiting',
    participants: new Map([[uid, { uid, socketId, joinedAt: Date.now() }]]),
    createdAt: Date.now(),
    endedAt: null,
  };

  rooms.set(id, room);
  return { room, error: null };
}

/**
 * Join an existing room.
 *
 * Validates:
 *  1. Room exists
 *  2. Room has not ended
 *  3. Room is not full (< MAX_PARTICIPANTS)
 *  4. User is not already a participant
 *
 * @param {string} roomId
 * @param {string} uid      Firebase UID of the joiner
 * @param {string} socketId Current socket.id of the joiner
 * @returns {{ room: object, error: null } | { room: null, error: string }}
 */
export function joinRoom(roomId, uid, socketId) {
  const room = rooms.get(roomId);

  if (!room) {
    return { room: null, error: `Room "${roomId}" does not exist.` };
  }

  if (room.status === 'ended') {
    return { room: null, error: `Room "${roomId}" has already ended.` };
  }

  if (room.participants.size >= MAX_PARTICIPANTS) {
    return { room: null, error: `Room "${roomId}" is already full.` };
  }

  if (room.participants.has(uid)) {
    return { room: null, error: 'You are already a participant in this room.' };
  }

  room.participants.set(uid, { uid, socketId, joinedAt: Date.now() });

  if (room.participants.size === MAX_PARTICIPANTS) {
    room.status = 'active';
  }

  return { room, error: null };
}

/**
 * Remove a participant from their current room.
 * - Room becomes 'ended' when empty.
 * - Room reverts to 'waiting' when one participant remains.
 * - Host role transfers to the remaining participant if the host left.
 *
 * @param {string} uid Firebase UID of the leaving user
 * @returns {{ room: object | null, wasHost: boolean }}
 */
export function leaveRoom(uid) {
  const room = getRoomByParticipant(uid);
  if (!room) return { room: null, wasHost: false };

  const wasHost = room.hostUid === uid;
  room.participants.delete(uid);

  if (room.participants.size === 0) {
    _endRoom(room);
  } else {
    room.status = 'waiting';

    if (wasHost) {
      const remaining = [...room.participants.values()][0];
      room.hostUid = remaining.uid;
    }
  }

  return { room, wasHost };
}

/**
 * Handle a socket disconnection.
 * Finds the participant owning `socketId` and applies leaveRoom logic.
 *
 * @param {string} socketId
 * @returns {{ room: object | null, uid: string | null, wasHost: boolean }}
 */
export function handleDisconnect(socketId) {
  for (const room of rooms.values()) {
    for (const participant of room.participants.values()) {
      if (participant.socketId === socketId) {
        const { room: updatedRoom, wasHost } = leaveRoom(participant.uid);
        return { room: updatedRoom ?? room, uid: participant.uid, wasHost };
      }
    }
  }
  return { room: null, uid: null, wasHost: false };
}

/**
 * Retrieve a room by ID.
 * @param {string} roomId
 */
export function getRoom(roomId) {
  return rooms.get(roomId);
}

/**
 * Find the room a given user is currently in (status != 'ended').
 * @param {string} uid
 */
export function getRoomByParticipant(uid) {
  for (const room of rooms.values()) {
    if (room.status !== 'ended' && room.participants.has(uid)) {
      return room;
    }
  }
  return undefined;
}

/**
 * Serialize a room to a plain object safe for JSON transmission.
 * Omits internal socketId values — clients only need UIDs.
 *
 * @param {object} room
 */
export function roomSnapshot(room) {
  return {
    id: room.id,
    hostUid: room.hostUid,
    status: room.status,
    participants: [...room.participants.values()].map(({ uid, joinedAt }) => ({
      uid,
      joinedAt,
    })),
    createdAt: room.createdAt,
    endedAt: room.endedAt,
  };
}

/** @returns {number} Total rooms currently in memory (for debugging). */
export function roomCount() {
  return rooms.size;
}

// ─────────────────────────────────────────────────────────────────────────────
// Internal
// ─────────────────────────────────────────────────────────────────────────────

function _endRoom(room) {
  room.status = 'ended';
  room.participants.clear();
  room.endedAt = Date.now();

  // Auto-remove from the map after TTL to avoid unbounded growth.
  setTimeout(() => {
    rooms.delete(room.id);
  }, ENDED_ROOM_TTL_MS);
}

