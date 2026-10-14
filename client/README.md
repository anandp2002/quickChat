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

| Route     | Access    | Page   |
| --------- | --------- | ------ |
| `/login`  | Public    | Login  |
| `/signup` | Public    | Signup |
| `/`       | Protected | Home   |
| `/chat`   | Protected | Chat   |

`PublicRoute` redirects authenticated users to `/`. `ProtectedRoute` redirects unauthenticated users to `/login`. Firebase session changes are synchronized into Redux by `AuthListener`.

## Adding Sidebar Items

Add new authenticated navigation items in `client/src/config/navigation.js`:

```js
{
  label: 'Settings',
  path: '/settings',
  icon: 'settings',
}
```

Then register the matching icon in `client/src/components/sidebar/NavigationIcon.jsx` and add the protected route in `AppRoutes.jsx`.

## API Endpoints

All auth API requests require a Firebase ID token in the `Authorization` header.

| Method | Endpoint             | Purpose                         |
| ------ | -------------------- | ------------------------------- |
| `GET`  | `/`                  | Server health check             |
| `POST` | `/api/auth/register` | Create or update a user profile |
| `GET`  | `/api/auth/me`       | Get the current user profile    |
