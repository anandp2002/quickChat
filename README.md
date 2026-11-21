# QuickChat

QuickChat is a responsive MERN chat application built with React, Vite, Express, Firebase Authentication, Firestore, and Socket.IO.

The current release includes account authentication, protected application routes, friend discovery and requests, direct text conversations, typing indicators, unread counts, and a responsive chat interface.

## Repository structure

```text
quickChat/
├── client/          React + Vite web application
├── server/          Express REST API and Socket.IO server
├── docs/            Feature documentation
├── firestore.indexes.json
└── README.md
```

## Features

- Email/password and Google authentication
- Firebase-backed user profiles
- Protected and public routes
- Friend discovery, requests, acceptance, decline, and removal
- Direct text conversations
- REST-loaded message history
- Real-time message delivery
- Typing indicators
- Read handling and unread-count tracking
- Responsive desktop and mobile navigation

## Architecture

```text
React/Vite client
    |
    | Firebase ID token
    v
Express REST API ------> Firebase Admin ------> Firestore
    |
    | Socket.IO token verification
    v
Socket.IO real-time server
```

The client uses Firebase Authentication for sign-in and obtains Firebase ID tokens for protected REST and Socket.IO operations.

Firestore stores users, friendships, conversations, and messages. Socket.IO provides immediate events but does not replace Firestore persistence.

## Requirements

- Node.js 18 or newer
- npm
- A Firebase project
- Email/password and Google providers enabled in Firebase Authentication
- A Firebase Admin service-account key
- A Firestore database

## Configuration

### Client environment

Create `client/.env`:

```env
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_API_URL=http://localhost:5000
VITE_SOCKET_URL=http://localhost:5000
```

`VITE_SOCKET_URL` is optional and falls back to `VITE_API_URL`.

### Server environment

Create `server/.env`:

```env
PORT=5000
CLIENT_URL=http://localhost:5173
FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
```

Place the Firebase Admin private key at `server/serviceAccountKey.json`.

Never commit the service-account key or publicize Firebase private credentials.

## Installation

```bash
cd client
npm install

cd ../server
npm install
```

## Running locally

Start the server:

```bash
cd server
npm run dev
```

Start the client in a separate terminal:

```bash
cd client
npm run dev
```

- Client: `http://localhost:5173`
- Server: `http://localhost:5000`

## Documentation

- [Authentication](docs/auth.md)
- [Friends](docs/friends.md)
- [Chat](docs/chat.md)
- [Application and navigation](docs/application.md)

Client-specific instructions are in [client/README.md](client/README.md). Server-specific instructions are in [server/README.md](server/README.md).

## Future extension

The message model already separates text content and attachment metadata, making it suitable for later additions such as:

- Voice messages
- Images
- Videos
- Documents
- Replies
- Forwarding
- Reactions
- Group conversations
