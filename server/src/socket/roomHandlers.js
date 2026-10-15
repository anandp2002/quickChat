/**
 * roomHandlers.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Socket.IO event handlers for room lifecycle management.
 *
 * All handlers read the authenticated user's UID from socket.data.user.uid,
 * which was set by socketAuthMiddleware during the handshake.
 * Client-supplied UIDs in event payloads are NEVER used as proof of identity.
 *
 * ── Events emitted TO the client ────────────────────────────────────────────
 *
 *  room:created   { room: RoomSnapshot }
 *    Sent to the creator after a successful room:create.
 *
 *  room:joined    { room: RoomSnapshot }
 *    Sent to the joiner after a successful room:join.
 *    Also sent to ALL existing room members to update their state.
 *
 *  room:peer-joined  { room: RoomSnapshot, peer: { uid } }
 *    Sent to the host when the second participant joins.
 *
 *  room:left      { roomId, uid }
 *    Sent to the remaining participant when the other one leaves.
 *
 *  room:ended     { roomId }
 *    Sent to all room members when the room is closed (last person left).
 *
 *  room:error     { message }
 *    Sent to the requesting socket on any validation failure.
 *
 * ── Events received FROM the client ─────────────────────────────────────────
 *
 *  room:create    {}  (no payload needed)
 *    → server creates room, emits room:created back to creator.
 *    Example: socket.emit('room:create')
 *
 *  room:join      { roomId: string }
 *    → server validates & joins, emits room:joined to joiner,
 *      room:peer-joined to host.
 *    Example: socket.emit('room:join', { roomId: 'abc123' })
 *
 *  room:leave     {}  (no payload needed — UID from token)
 *    → server removes participant, notifies remaining peer.
 *    Example: socket.emit('room:leave')
 */

import {
  createRoom,
  joinRoom,
  leaveRoom,
  roomSnapshot,
} from './roomManager.js';

/**
 * Register all room event handlers on a connected, authenticated socket.
 *
 * @param {import('socket.io').Socket} socket
 * @param {import('socket.io').Server} io
 */
export function registerRoomHandlers(socket, io) {
  const uid = socket.data.user.uid;

  // ─── room:create ──────────────────────────────────────────────────────────
  /**
   * Client payload: none required.
   *
   * Server response (on success):
   *   Event  : 'room:created'
   *   Payload: { room: { id, hostUid, status, participants, createdAt, endedAt } }
   *
   * Server response (on error):
   *   Event  : 'room:error'
   *   Payload: { message: string }
   */
  socket.on('room:create', () => {
    console.log(`[room:create] uid=${uid} socket=${socket.id}`);

    const { room, error } = createRoom(uid, socket.id);

    if (error) {
      socket.emit('room:error', { message: error });
      return;
    }

    // Join the Socket.IO room (for targeted broadcasts).
    socket.join(room.id);

    socket.emit('room:created', { room: roomSnapshot(room) });
    console.log(`[room:create] ✅ Room ${room.id} created by uid=${uid}`);
  });

  // ─── room:join ────────────────────────────────────────────────────────────
  /**
   * Client payload: { roomId: string }
   *
   * Server response (on success — to joiner):
   *   Event  : 'room:joined'
   *   Payload: { room: RoomSnapshot }
   *
   * Server response (on success — to existing participants):
   *   Event  : 'room:peer-joined'
   *   Payload: { room: RoomSnapshot, peer: { uid } }
   *
   * Server response (on error — to joiner):
   *   Event  : 'room:error'
   *   Payload: { message: string }
   */
  socket.on('room:join', ({ roomId } = {}) => {
    console.log(`[room:join] uid=${uid} socket=${socket.id} roomId=${roomId}`);

    if (!roomId || typeof roomId !== 'string') {
      socket.emit('room:error', { message: 'room:join requires a roomId string.' });
      return;
    }

    const { room, error } = joinRoom(roomId, uid, socket.id);

    if (error) {
      socket.emit('room:error', { message: error });
      return;
    }

    // Notify existing participants BEFORE this socket joins the IO room,
    // so the broadcast doesn't accidentally include the joiner themselves.
    socket.to(room.id).emit('room:peer-joined', {
      room: roomSnapshot(room),
      peer: { uid },
    });

    // Now add the joiner's socket to the Socket.IO room.
    socket.join(room.id);

    socket.emit('room:joined', { room: roomSnapshot(room) });
    console.log(`[room:join] ✅ uid=${uid} joined room ${room.id} — status: ${room.status}`);
  });

  // ─── room:leave ───────────────────────────────────────────────────────────
  /**
   * Client payload: none required (identity comes from token).
   *
   * Server response (to remaining participant):
   *   If room still has members:
   *     Event  : 'room:left'
   *     Payload: { roomId, uid }   — uid of who left
   *   If room is now empty:
   *     Event  : 'room:ended'
   *     Payload: { roomId }
   */
  socket.on('room:leave', () => {
    _handleLeave(socket, io, uid);
  });

  // ─── disconnect ───────────────────────────────────────────────────────────
  /**
   * Triggered automatically by Socket.IO when the transport closes.
   * Cleans up the participant the same way as room:leave.
   */
  socket.on('disconnect', (reason) => {
    console.log(`[disconnect] socket=${socket.id} uid=${uid} reason=${reason}`);
    _handleLeave(socket, io, uid, /* fromDisconnect= */ true);
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Internal helper
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Shared leave + cleanup logic used by both room:leave and disconnect.
 *
 * @param {import('socket.io').Socket} socket
 * @param {import('socket.io').Server} io
 * @param {string} uid
 * @param {boolean} [fromDisconnect=false]
 */
function _handleLeave(socket, io, uid, fromDisconnect = false) {
  const { room, wasHost } = leaveRoom(uid);

  if (!room) {
    // User wasn't in any room — nothing to do.
    if (!fromDisconnect) {
      socket.emit('room:error', { message: 'You are not currently in a room.' });
    }
    return;
  }

  const roomId = room.id;

  if (room.status === 'ended') {
    // Last person left — notify everyone still subscribed to the IO room.
    io.to(roomId).emit('room:ended', { roomId });
    console.log(`[room:leave] Room ${roomId} ended — all participants gone.`);
  } else {
    // Remaining participant gets a 'room:left' notification.
    socket.to(roomId).emit('room:left', {
      roomId,
      uid,
    });
    console.log(`[room:leave] uid=${uid} left room ${roomId}. wasHost=${wasHost}`);
  }

  // Remove this socket from the Socket.IO room.
  socket.leave(roomId);
}

