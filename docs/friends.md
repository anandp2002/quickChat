# Friends

## Overview

The Friends feature allows users to discover people, send requests, accept or decline requests, list accepted friends, search, and remove existing friendships.

## Relationship states

Friend relationships use one deterministic Firestore document per user pair:

```text
friendships/{sortedUid1_sortedUid2}
```

Possible states:

- `none`: no relationship document
- `pending`: waiting for the recipient
- `accepted`: the users are friends
- `declined`: a previous request was declined

Sending a request after a decline reopens it as `pending`.

## Friendship document

```js
{
  requesterId: "uid1",
  recipientId: "uid2",
  members: ["uid1", "uid2"],
  status: "pending",
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

The `members` array and status support server queries and membership checks.

## Client pages

The `/friends` page contains three tabs:

- `Friends`: accepted relationships
- `Requests`: incoming pending requests
- `Discover`: users who are not already accepted friends

The list supports local search submitted as a server query parameter.

## Actions

- Send friend request
- Accept incoming request
- Decline incoming request
- Remove accepted friend
- Refresh the active list
- Search users or existing relationships

Destructive actions use a confirmation modal.

## REST endpoints

All endpoints require Firebase bearer authentication.

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/api/friends/discover?search=&limit=` | Discover users |
| `GET` | `/api/friends?search=` | List accepted friends |
| `GET` | `/api/friends/requests?search=` | List incoming pending requests |
| `POST` | `/api/friends/:userId` | Send a request |
| `PATCH` | `/api/friends/requests/:userId` | Accept or decline with `{ action }` |
| `DELETE` | `/api/friends/:userId` | Remove an accepted friend |

## Business rules

- A user cannot send a request to themselves.
- A missing recipient returns `404`.
- Duplicate or already accepted requests return `409`.
- Only the original recipient can accept or decline a pending request.
- Declining a request changes its status to `declined`.
- Removing a friend deletes its relationship document.

## Firestore indexes

The existing `firestore.indexes.json` defines indexes for:

- `recipientId + status`
- `members array-contains + status`
