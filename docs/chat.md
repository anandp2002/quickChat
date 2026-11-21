# Chat

## Overview

QuickChat currently supports direct text conversations between accepted friends. REST handles conversation setup and history. Socket.IO handles live delivery and typing indicators. Firestore persists the conversation and message data.

## Opening a conversation

Selecting a friend in `/chat` calls:

```http
POST /api/conversations/direct/:friendId
```

The server verifies:

1. The caller is authenticated.
2. The friend ID is valid.
3. A friendship exists.
4. Its status is `accepted`.
5. The caller is a member of the friendship.

The conversation ID is deterministic for direct chats:

```text
sortedUid1_sortedUid2
```

This mirrors the accepted friendship relationship ID.

## Conversation document

```text
conversations/{conversationId}
```

```js
{
  type: "direct",
  members: ["uid1", "uid2"],
  createdBy: "uid1",
  createdAt: Timestamp,
  updatedAt: Timestamp,
  lastMessage: {
    messageId: "messageId",
    senderId: "uid1",
    text: "Hello",
    type: "text",
    createdAt: Timestamp
  },
  unreadCount: {
    uid1: 0,
    uid2: 1
  }
}
```

## Message document

```text
conversations/{conversationId}/messages/{messageId}
```

```js
{
  clientId: "generated-client-id",
  senderId: "uid1",
  type: "text",
  text: "Hello",
  attachment: null,
  status: "sent",
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

Text messages are trimmed and limited to 5000 characters.

## REST endpoints

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `POST` | `/api/conversations/direct/:friendId` | Open or create a conversation |
| `GET` | `/api/conversations/:conversationId/messages?limit=30&before=messageId` | Load message history |
| `PATCH` | `/api/conversations/:conversationId/read` | Reset the caller unread count |

History is ordered by `createdAt` and supports cursor pagination through `before`.

## Socket.IO authentication

The client retrieves a Firebase ID token and supplies it when connecting:

```js
{
  auth: {
    token: await user.getIdToken()
  }
}
```

The server verifies the token and stores `socket.data.uid`.

## Socket events

### Client to server

| Event | Payload |
| --- | --- |
| `conversation:join` | `{ conversationId }` |
| `conversation:leave` | `{ conversationId }` |
| `message:send` | `{ conversationId, text, clientId }` |
| `typing:start` | `{ conversationId }` |
| `typing:stop` | `{ conversationId }` |
| `messages:read` | `{ conversationId }` |

### Server to client

| Event | Payload |
| --- | --- |
| `message:new` | `{ conversationId, message }` |
| `typing:update` | `{ conversationId, uid, typing }` |
| `messages:read` | `{ conversationId, uid }` |

Sending a message receives an acknowledgement containing the persisted message or an error.

## Send flow

1. The client generates a `clientId`.
2. The client immediately displays an optimistic message.
3. The client emits `message:send`.
4. The server validates message length and conversation membership.
5. The server creates a deterministic message ID using the conversation, sender, and `clientId`.
6. The message is written to Firestore.
7. Conversation metadata and recipient unread count are updated.
8. The server emits `message:new`.
9. The sender receives an acknowledgement.
10. The client replaces or removes its optimistic copy.

The deterministic message ID and `clientId` prevent duplicate messages after reconnect or repeated sends.

## Typing and read state

Typing events are temporary Socket.IO events and are not persisted to Firestore.

When a conversation is opened or a new message is received, the client calls the read endpoint. The server resets the unread count for the current member only.

## Future media model

Messages already include `type` and `attachment` fields. Future voice, image, video, and document messages can use:

```js
{
  type: "image",
  text: null,
  attachment: {
    kind: "image",
    url: "https://...",
    thumbnailUrl: "https://...",
    fileName: "photo.jpg",
    mimeType: "image/jpeg",
    size: 250000,
    width: 1200,
    height: 800
  }
}
```

Raw media should be uploaded through REST to Firebase Storage or another provider; Socket.IO should carry message metadata only.
