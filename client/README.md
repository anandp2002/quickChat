# QuickChat

QuickChat is a MERN chat application with Firebase authentication, a React/Vite client, and an Express API server. The client currently provides email/password and Google authentication, protected routes, a responsive expandable sidebar, and placeholder Home and Chat views.

## Project Structure

```text
quickChat/
|-- client/                 React + Vite frontend
|   |-- src/
|       |-- components/     Auth, UI, and sidebar components
|       |-- config/         Firebase and navigation configuration
|       |-- layouts/        AuthLayout and MainLayout
|       |-- pages/          Auth, Home, and Chat pages
|       |-- routes/         Routes and public/protected guards
|       |-- services/       API and authentication services
|       |-- store/          Redux auth state and Firebase listener
|-- server/                 Express + Firebase Admin backend
|   |-- src/
|       |-- config/         Firebase Admin initialization
|       |-- controllers/    Request handlers
|       |-- middlewares/    Firebase token verification
|       |-- routes/         API route definitions
|   |-- server.js
|   |-- serviceAccountKey.json
```

## Requirements

- Node.js 18 or newer
- A Firebase project
- Firebase Authentication enabled with Email/Password and Google providers
- A Firebase Admin service account key for the server

## Configuration

### Client

Create `client/.env`:

```env
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_API_URL=http://localhost:5000
```

`VITE_API_URL` is optional and defaults to `http://localhost:5000`.

### Server

Place the Firebase Admin private key at:

```text
server/serviceAccountKey.json
```

Create `server/.env` when using Firebase Storage:

```env
PORT=5000
FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
```

The service account file contains private credentials. Never expose it in the client or commit it to a public repository.

## Installation

Install dependencies in both packages:

```bash
cd client
npm install

cd ../server
npm install
```

## Development

Start the API server in one terminal:

```bash
cd server
npm run dev
```

Start the Vite client in another terminal:

```bash
cd client
npm run dev
```

The client is normally available at `http://localhost:5173` and the API at `http://localhost:5000`.

## Available Scripts

### Client

```bash
npm run dev       # Start the Vite development server
npm run build     # Create a production build
npm run lint      # Run ESLint
npm run preview   # Preview the production build
```

### Server

```bash
npm run dev       # Start Express with Node watch mode
npm start         # Start Express normally
```

## Routing

Routes are centralized in `client/src/routes/routePaths.js`.

| Route        | Access    | Page       |
| ------------ | --------- | ---------- |
| `/login`     | Public    | Login      |
| `/signup`    | Public    | Signup     |
| `/`          | Protected | Home       |
| `/chat`      | Protected | Chat       |
| `/video-call`| Protected | Video Call |

`PublicRoute` redirects authenticated users to `/`. `ProtectedRoute` redirects unauthenticated users to `/login`. Firebase session changes are synchronized into Redux by `AuthListener`.

## Real-Time Video Call Room Management

QuickChat integrates Socket.IO with Firebase ID token handshake authentication for room orchestration:

### Architecture

1. **`socketService.js` (`client/src/services/socketService.js`)**:
   - Singleton client manager connecting to `VITE_API_URL` (default `http://localhost:5000`).
   - Retrieves the verified Firebase ID token from `auth.currentUser.getIdToken()`.
   - Sends the token in `io(URL, { auth: { token } })`.
   - Server-side Firebase Admin SDK verifies token authenticity and extracts `socket.data.user.uid`.
   - Client never sends unverified `uid`, email, or name in event payloads.
2. **`roomSlice.js` (`client/src/store/slices/roomSlice.js`)**:
   - Centralizes `currentRoom`, `isCreating`, `isJoining`, `socketConnected`, `error`, and `successMessage`.
3. **`useVideoCall.js` (`client/src/pages/video-call/hooks/useVideoCall.js`)**:
   - Orchestrates socket lifecycle, connects on demand or mount, registers event listeners cleanly, and detaches listeners on unmount to prevent memory leaks.
   - Handles Clipboard API copying with browser fallbacks.

### Event Flow

1. **Create Room**:
   - Creator clicks **Create Room** on `/video-call`.
   - Client establishes verified Socket.IO connection and emits `room:create`.
   - Server verifies token, creates room with crypto-random ID, and emits `room:created` with `RoomSnapshot`.
   - Client sets room as active, displays Room ID, and provides a **Copy ID** button.
2. **Join Room**:
   - Peer enters Room ID on `/video-call` and clicks **Join Room**.
   - Client emits `room:join` with `{ roomId }`.
   - Server validates room capacity (< 2 peers) and emits `room:joined` to peer and `room:peer-joined` to host.
   - Status updates dynamically to **Connected (2/2)** on both screens.
3. **Leave / Disconnect**:
   - Either user clicking **Leave Room** or closing their browser emits `room:leave` or `disconnect`.
   - Server notifies the peer (`room:left`) or closes the room (`room:ended`).

---

## Testing with Two Logged-In Users

To test room creation and joining locally without account conflicts:

1. **Window A (Host / Creator)**:
   - Open standard browser window at `http://localhost:5173`.
   - Sign in with **User 1** (e.g., `user1@example.com`).
   - Navigate to `/video-call` in the sidebar.
   - Click **Create Room**.
   - Note the generated Room ID and click **Copy ID**.

2. **Window B (Joiner / Peer)**:
   - Open an **Incognito / Private Window** (or a second browser like Firefox / Chrome).
   - Sign in with **User 2** (e.g., `user2@example.com`).
   - Navigate to `/video-call`.
   - Paste the copied Room ID into the **Room ID** input and click **Join Room**.

3. **Verify Synchronized State**:
   - In **Window A**: Status changes from *"Waiting for peer (1/2)"* to *"Call active (2/2)"*.
   - In **Window B**: Shows *"Connected to Session (2/2)"*.
   - Click **Leave Room** in either window: The other user receives real-time notification that the peer left.

---

## API Endpoints

All auth API requests require a Firebase ID token in the `Authorization` header.

| Method | Endpoint             | Purpose                         |
| ------ | -------------------- | ------------------------------- |
| `GET`  | `/`                  | Server health check             |
| `POST` | `/api/auth/register` | Create or update a user profile |
| `GET`  | `/api/auth/me`       | Get the current user profile    |

