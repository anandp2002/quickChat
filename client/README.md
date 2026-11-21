# QuickChat Client

The QuickChat client is a React 19 and Vite application. It uses Firebase Authentication, Redux Toolkit for authentication state, React Router for navigation, Tailwind CSS 4 for styling, Socket.IO for real-time chat events, and the existing Express API for REST operations.

## Requirements

- Node.js 18 or newer
- A running QuickChat server
- A Firebase Web application configuration

## Environment configuration

Create `client/.env`:

```env
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_API_URL=http://localhost:5000
VITE_SOCKET_URL=http://localhost:5000
```

`VITE_API_URL` defaults to `http://localhost:5000`.

`VITE_SOCKET_URL` defaults to `VITE_API_URL`, then `http://localhost:5000`.

## Installation

```bash
npm install
```

## Commands

```bash
npm run dev       # Start Vite development server
npm run build     # Create a production build
npm run lint      # Run ESLint
npm run preview   # Preview the production build
```

## Application routes

| Route | Access | Feature |
| --- | --- | --- |
| `/login` | Public only | Email/password and Google sign-in |
| `/signup` | Public only | Account creation and Google sign-up |
| `/` | Protected | Home dashboard |
| `/friends` | Protected | Friend discovery and request management |
| `/chat` | Protected | Direct text conversations |

## Source structure

```text
src/
├── components/
│   ├── auth/          Authentication cards and controls
│   ├── chat/          Chat sidebar and conversation UI
│   ├── friends/       Friend tabs and actions
│   ├── layout/        Layout support components
│   ├── sidebar/       Main responsive sidebar
│   └── ui/            Shared form and modal components
├── config/            Firebase and navigation configuration
├── layouts/           Public and authenticated layouts
├── pages/             Route-level pages
├── routes/            Route guards and route definitions
├── services/          REST and Socket.IO clients
└── store/             Redux authentication state
```

## Authentication state

`AuthListener` subscribes to Firebase `onAuthStateChanged` and stores a serializable subset of the Firebase user in Redux:

- `uid`
- `email`
- `displayName`
- `photoURL`

REST requests obtain a fresh Firebase ID token from `auth.currentUser` through `apiClient`.

## Chat integration

The chat flow is:

1. Select an accepted friend.
2. Open or create a direct conversation through `POST /api/conversations/direct/:friendId`.
3. Load message history through REST.
4. Connect to Socket.IO with a Firebase ID token.
5. Join the conversation room.
6. Send messages through `message:send`.
7. Display `message:new` events and typing updates.

Socket.IO events use generated `clientId` values for optimistic UI updates and duplicate protection.

## Development notes

- Use `@/` imports for source files; the alias is configured in `vite.config.js`.
- Keep UI state separate from server-owned Firestore state.
- Do not expose the Firebase service-account key in the client.
- Run `npm run lint` and `npm run build` before submitting changes.
