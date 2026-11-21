# Application and Navigation

## Overview

QuickChat uses a shared authenticated layout and a responsive sidebar. Public authentication routes use a separate layout.

## Route map

| Route | Guard | Layout | Page |
| --- | --- | --- | --- |
| `/login` | Public only | `AuthLayout` | `LoginPage` |
| `/signup` | Public only | `AuthLayout` | `SignupPage` |
| `/` | Protected | `MainLayout` | `HomePage` |
| `/friends` | Protected | `MainLayout` | `FriendsPage` |
| `/chat` | Protected | `MainLayout` | `ChatPage` |

Unknown routes redirect to `/login`.

## Public layout

`AuthLayout` displays the authentication card and shared branding.

## Authenticated layout

`MainLayout` provides:

- A responsive sidebar
- A collapsible mobile navigation experience
- An account section
- A full-height content outlet

The layout is `100vh` on larger screens and uses the mobile height reservation for smaller screens.

## Sidebar navigation

Navigation is configured in `client/src/config/navigation.js`:

- Home
- Chat
- Friends

Icons are mapped in `NavigationIcon.jsx`.

## Home page

The home page provides:

- A personalized greeting
- A shortcut to conversations
- A shortcut to friends
- A shortcut to discover users
- A summary of the active account

## State management

Redux currently contains the authentication slice.

```text
store
└── auth
    ├── user
    └── loading
```

Chat and friend lists use page or component state rather than a shared Redux chat slice. The chat implementation can be moved into dedicated Redux state as features grow.

## UI system

Tailwind CSS theme tokens are defined in `client/src/index.css`, including:

- Surface and brand colors
- Text colors
- Borders and dividers
- Control and card radii
- Shadows
- Font family

Shared components include:

- `TextField`
- `PrimaryButton`
- `GoogleButton`
- `Spinner`
- `ConfirmationModal`
- `Divider`
