# Authentication

## Overview

QuickChat uses Firebase Authentication for sign-in and Firebase Admin for server-side token verification. Firebase owns credentials and sessions, while Firestore stores the application's user profile.

## Supported sign-in methods

- Email and password
- Google popup sign-in

## Sign-up flow

### Email/password

1. Firebase creates the Authentication account.
2. The client updates the Firebase display name.
3. `POST /api/auth/register` creates the Firestore `users/{uid}` profile.
4. `AuthListener` adds the serializable user to Redux.
5. The user is redirected to the home page.

### Google

1. Firebase opens the Google popup.
2. The client sends the display name or email-derived name to `/api/auth/register`.
3. The server creates or updates the existing profile idempotently.
4. The user is redirected to the home page.

## User profile

```text
users/{uid}
```

```js
{
  uid: "firebase uid",
  name: "Display name",
  email: "user@example.com",
  photoURL: "Google photo URL or null",
  createdAt: "ISO string"
}
```

Email/password signup also writes `createdAt` as an ISO string. Existing profiles do not currently expose profile-edit operations.

## Redux state

The authentication slice stores:

```js
{
  user: {
    uid,
    email,
    displayName,
    photoURL
  },
  loading
}
```

`AuthListener` listens for Firebase auth-state changes. It must not store the Firebase `User` object itself.

## Route protection

- `PublicRoute` prevents authenticated users from opening login or signup.
- `ProtectedRoute` sends unauthenticated users to `/login`.
- Protected routes are nested under `MainLayout`.

## REST authentication

`apiClient` obtains the current Firebase ID token and sends:

```http
Authorization: Bearer <Firebase ID token>
```

The server verifies it with `firebase-admin/auth` and places the decoded identity in `req.user`.

## Server endpoints

| Method | Endpoint | Access |
| --- | --- | --- |
| `POST` | `/api/auth/register` | Firebase bearer token |
| `GET` | `/api/auth/me` | Firebase bearer token |

## Account edge cases

- Google sign-in cannot replace a profile that already belongs to a different Firebase account with the same email.
- Popup closure is handled as a user cancellation.
- Existing profiles are returned instead of duplicated.
- A Google photo may be backfilled onto an existing profile when none is present.
