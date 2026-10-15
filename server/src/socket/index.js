/**
 * socket/index.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Initialises the Socket.IO server, attaches auth middleware, and wires
 * event handlers.  Call initSocketIO(httpServer) once from server.js.
 */

import { Server } from 'socket.io';
import { socketAuthMiddleware } from './socketAuth.js';
import { registerRoomHandlers } from './roomHandlers.js';

/**
 * Create and configure the Socket.IO server attached to the given HTTP server.
 *
 * @param {import('http').Server} httpServer
 * @returns {import('socket.io').Server}
 */
export function initSocketIO(httpServer) {
    const io = new Server(httpServer, {
        cors: {
            // Mirror whatever origin(s) the Express CORS config allows.
            // Use process.env.CLIENT_URL in production; fall back to localhost dev.
            origin: process.env.CLIENT_URL || 'http://localhost:5173',
            methods: ['GET', 'POST'],
            credentials: true,
        },
    });

    // ── Auth middleware ────────────────────────────────────────────────────────
    // Runs for every incoming connection BEFORE the `connection` event fires.
    // Rejects unauthenticated sockets immediately.
    io.use(socketAuthMiddleware);

    // ── Connection handler ─────────────────────────────────────────────────────
    io.on('connection', (socket) => {
        const uid = socket.data.user.uid;
        console.log(`[socket] ✅ Connected  socket=${socket.id} uid=${uid}`);

        // Wire all room events for this socket.
        registerRoomHandlers(socket, io);
    });

    return io;
}

