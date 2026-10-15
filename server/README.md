# QuickChat Server

Backend API and real-time Socket.IO signaling server built with Express, Socket.IO, and Firebase Admin SDK.

---

## Features

- **Express REST API**: Health checks and profile management routes with Firebase token verification middleware.
- **Socket.IO Real-Time Engine**: Real-time room management and signaling pipeline attached to the shared Node HTTP server.
- **Cryptographic Token Verification**: All Socket.IO handshake attempts verify the client's Firebase ID token via `firebase-admin` before granting connection access.
- **Zero-Trust Identity**: Client event payloads never pass or specify UIDs. All handlers resolve identity exclusively from `socket.data.user.uid`.
- **In-Memory Room Management**: One-to-one video call room state with participant limits, duplicate prevention, and automatic cleanup.

---

## Directory Structure

```text
server/
|-- src/
|   |-- config/
|   |   `-- firebase.js          # Firebase Admin SDK initialization
|   |-- controllers/
|   |   `-- authController.js    # Auth HTTP endpoints
|   |-- middlewares/
|   |   `-- authMiddleware.js    # Express bearer token verification
|   |-- routes/
|   |   `-- authRoutes.js        # API routing
|   |-- socket/
|       |-- index.js             # Socket.IO initialization and CORS setup
|       |-- socketAuth.js        # Socket handshake auth middleware
|       |-- roomHandlers.js      # Socket event listeners (room:create, room:join, etc.)
|       `-- roomManager.js       # In-memory room store and lifecycle state machine
|-- server.js                    # Entry point (Express + HTTP + Socket.IO)
|-- serviceAccountKey.json       # Firebase service account credentials (gitignored)
`-- package.json
```

---

## Environment Variables

Create `server/.env`:

```env
PORT=5000
CLIENT_URL=http://localhost:5173
```

Ensure `server/serviceAccountKey.json` is present with valid Firebase Admin credentials.

---

## Socket.IO Handshake Authentication

Every incoming Socket.IO connection must present a valid Firebase ID token in the handshake `auth` object:

```javascript
const socket = io('http://localhost:5000', {
  auth: { token: '<firebase-id-token>' }
});
```

1. **Verification**: `socketAuthMiddleware` intercepts the connection before the `connection` event fires and invokes `admin.auth().verifyIdToken(token)`.
2. **Rejection**: If the token is missing, invalid, or expired, the connection is rejected with an Error and Socket.IO fires `connect_error` on the client.
3. **Session Attachment**: Decoded token claims are attached to `socket.data.user`. Every event handler reads `socket.data.user.uid` directly from server state.

---

## Room Management Protocol

### Client → Server Events

| Event | Payload | Description |
|---|---|---|
| `room:create` | None (`{}`) | Requests creation of a new room. Server validates user is not already in a room and generates a cryptographic URL-safe Room ID. |
| `room:join` | `{ roomId: string }` | Requests joining an existing room. Server validates room exists, is not ended, and has capacity (< 2 peers). |
| `room:leave` | None (`{}`) | Leaves the caller's active room. Notifies remaining peer or ends room if last user. |
| `disconnect` | Built-in | Automatic transport disconnection. Executes the same cleanup as `room:leave`. |

### Server → Client Events

| Event | Payload | Description |
|---|---|---|
| `room:created` | `{ room: RoomSnapshot }` | Emitted to creator upon successful room creation. |
| `room:joined` | `{ room: RoomSnapshot }` | Emitted to joiner upon successfully entering a room. |
| `room:peer-joined` | `{ room: RoomSnapshot, peer: { uid } }` | Emitted to host/existing participant when second participant joins. |
| `room:left` | `{ roomId: string, uid: string }` | Emitted to remaining peer when other participant leaves. |
| `room:ended` | `{ roomId: string }` | Emitted to room members when room is closed (all left). |
| `room:error` | `{ message: string }` | Emitted to requesting socket upon validation failure (e.g., room full, already in room, invalid ID). |

### Room Snapshot Shape

```json
{
  "id": "7mKx8_12aBcDeFgHiJkLm",
  "hostUid": "firebase-uid-creator",
  "status": "waiting | active | ended",
  "participants": [
    { "uid": "firebase-uid-creator", "joinedAt": 1718000000000 }
  ],
  "createdAt": 1718000000000,
  "endedAt": null
}
```

---

## Running the Server

```bash
cd server
npm install
npm run dev
```

Server starts on `http://localhost:5000` with WebSocket upgrade enabled.
