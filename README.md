# QuickChat — Real-Time Video Call & Messaging Platform

QuickChat is a full-stack real-time communication platform built on the MERN stack with Firebase Authentication, Socket.IO real-time room signaling, and Redux Toolkit state management.

---

## Architecture Overview

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        QUICKCHAT ARCHITECTURE                          │
└────────────────────────────────────────────────────────────────────────┘

    ┌─────────────────────────┐               ┌─────────────────────────┐
    │     Browser Client      │               │     Browser Client      │
    │      (User 1: Host)     │               │      (User 2: Peer)     │
    └───────────┬─────────────┘               └────────────┬────────────┘
                │ Firebase Auth                           │ Firebase Auth
                ▼                                         ▼
         Firebase Auth                             Firebase Auth
         (ID Token JWT)                            (ID Token JWT)
                │                                         │
                │ Handshake { auth: { token } }           │ Handshake { auth: { token } }
                ▼                                         ▼
    ┌───────────────────────────────────────────────────────────────────┐
    │                 Node.js / Express Server (:5000)                  │
    │                                                                   │
    │  1. socketAuthMiddleware:                                         │
    │     - Validates Firebase ID token via Firebase Admin SDK          │
    │     - Binds verified claims to socket.data.user.uid               │
    │                                                                   │
    │  2. Room Handlers (roomHandlers.js):                              │
    │     - room:create  ──> Generates crypto-safe Room ID              │
    │     - room:join    ──> Validates capacity (< 2) & attaches peer   │
    │     - room:leave   ──> Graceful exit / host migration             │
    │                                                                   │
    │  3. In-Memory Room Store (roomManager.js):                        │
    │     - Map<roomId, Room> (Zero-Trust, 1-to-1 rooms, 5m TTL sweep)   │
    └───────────────────────────────────────────────────────────────────┘
```

---

## Detailed Documentation Guides

- 📘 **Client Socket Architecture & Redux Lifecycle**: [`client/docs/SOCKET_ARCHITECTURE.md`](file:///d:/MERN/Antigravity/quickChat/client/docs/SOCKET_ARCHITECTURE.md)
- 📗 **Client Setup & UI Overview**: [`client/README.md`](file:///d:/MERN/Antigravity/quickChat/client/README.md)
- 📙 **Backend Socket & Room Management Reference**: [`server/src/docs/room_management_docs.md`](file:///d:/MERN/Antigravity/quickChat/server/src/docs/room_management_docs.md)
- 📕 **Server Setup & REST API Reference**: [`server/README.md`](file:///d:/MERN/Antigravity/quickChat/server/README.md)

---

## How the Real-Time Socket Layer Works

### 1. Zero-Trust Handshake Authentication
When a user signs in, the client retrieves a cryptographically signed Firebase ID token:
```javascript
const token = await auth.currentUser.getIdToken();
const socket = io('http://localhost:5000', { auth: { token } });
```
On the server, `socketAuthMiddleware` intercepts the handshake before `connection` fires:
```javascript
const decodedToken = await admin.auth().verifyIdToken(token);
socket.data.user = decodedToken; // Trusted UID bound on the server
```
Neither `uid`, email, nor display name are ever trusted from client event payloads.

### 2. Room State Lifecycle
Rooms are managed in-memory on the server (`server/src/socket/roomManager.js`):
- **`waiting`**: Host created the room; waiting for peer (1/2).
- **`active`**: Second participant joined; active one-to-one session (2/2).
- **`ended`**: Participants left; room locked and scheduled for deletion after 5 minutes.

### 3. Step-by-Step Room Flow

```text
Host (Alice)                      Server                      Peer (Bob)
     │                              │                              │
     ├────── room:create ──────────>│                              │
     │<───── room:created ──────────┤                              │
     │      (Status: waiting, 1/2)  │                              │
     │                              │                              │
     │      [Shares Room ID] ─────────────────────────────────────>│
     │                              │<───── room:join { roomId } ──┤
     │<───── room:peer-joined ──────┤                              │
     │      (Status: active, 2/2)   ├────── room:joined ──────────>│
     │                              │      (Status: active, 2/2)   │
     │                              │                              │
     ├────── room:leave ───────────>│                              │
     │                              ├────── room:left ────────────>│
     │                              │      (Status: waiting, 1/2)  │
```

---

## Quick Start

### 1. Prerequisites
- Node.js 18+
- A Firebase project with Email/Password & Google auth enabled
- Firebase Admin Service Account JSON at `server/serviceAccountKey.json`

### 2. Environment Setup

**Client (`client/.env`):**
```env
VITE_FIREBASE_API_KEY=your_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_API_URL=http://localhost:5000
```

**Server (`server/.env`):**
```env
PORT=5000
CLIENT_URL=http://localhost:5173
```

### 3. Install & Run

```bash
# Terminal 1 - Backend Server
cd server
npm install
npm run dev

# Terminal 2 - Frontend Client
cd client
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.
