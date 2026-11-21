# QuickChat Server

The QuickChat server is an Express API and Socket.IO server using Firebase Admin to authenticate users and access Firestore.

## Requirements

- Node.js 18 or newer
- A Firebase project
- A Firebase Admin service-account key
- A Firestore database

## Configuration

Place the private key at:

```text
server/serviceAccountKey.json
```

Create `server/.env`:

```env
PORT=5000
CLIENT_URL=http://localhost:5173
FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
```

`PORT` defaults to `5000`.

`CLIENT_URL` is used as the Socket.IO CORS origin.

## Installation

```bash
npm install
```

## Commands

```bash
npm run dev       # Start server with Node watch mode
npm start         # Start server normally
```

## Source structure

```text
src/
├── config/        Firebase Admin initialization
├── controllers/   HTTP request handlers
├── middlewares/   Firebase token verification
├── routes/        Express route definitions
├── services/      Firestore and domain operations
└── socket/        Socket.IO authentication and events
```

## Authentication

REST routes protected by `verifyToken` require:

```http
Authorization: Bearer <Firebase ID token>
```

Socket.IO connections send the Firebase ID token in:

```js
socket.handshake.auth.token
```

Both mechanisms verify the token with Firebase Admin.

## REST API

### Authentication

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `POST` | `/api/auth/register` | Create or update a user profile |
| `GET` | `/api/auth/me` | Get the current profile |

### Friends

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/api/friends/discover` | Discover users |
| `GET` | `/api/friends` | List accepted friends |
| `GET` | `/api/friends/requests` | List incoming requests |
| `POST` | `/api/friends/:userId` | Send a friend request |
| `PATCH` | `/api/friends/requests/:userId` | Accept or decline a request |
| `DELETE` | `/api/friends/:userId` | Remove an accepted friend |

### Conversations

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `POST` | `/api/conversations/direct/:friendId` | Open or create a direct conversation |
| `GET` | `/api/conversations/:conversationId/messages` | Load recent or older messages |
| `PATCH` | `/api/conversations/:conversationId/read` | Reset the caller unread count |

## Socket.IO events

### Client to server

- `conversation:join`
- `conversation:leave`
- `message:send`
- `typing:start`
- `typing:stop`
- `messages:read`

### Server to client

- `message:new`
- `typing:update`
- `messages:read`

## Firestore collections

- `users`
- `friendships`
- `conversations`
- `conversations/{conversationId}/messages`

Server services are responsible for friendship checks, conversation membership checks, message persistence, and unread-count updates.

## Security

- Keep `serviceAccountKey.json` private and outside version control.
- Verify every Firebase ID token on REST and Socket.IO.
- Recheck conversation membership before joins and writes.
- Recheck accepted friendship before direct-conversation creation.
- Keep server timestamps authoritative.
- Use `clientId` values for send deduplication.
- Validate text length and required fields on the server.
