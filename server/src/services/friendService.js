import { FieldValue } from 'firebase-admin/firestore';
import { db } from '../config/firebase.js';

const USERS_COLLECTION = 'users';
const FRIENDSHIPS_COLLECTION = 'friendships';
const MAX_LIMIT = 50;

const relationshipId = (firstUid, secondUid) =>
  [firstUid, secondUid].sort().join('_');

const toIsoString = (value) => {
  if (!value) return null;
  if (typeof value.toDate === 'function') return value.toDate().toISOString();
  return value instanceof Date ? value.toISOString() : value;
};

const publicUser = (data) => ({
  id: data.uid,
  name: data.name || 'Unnamed user',
  photoURL: data.photoURL || null,
});

const serializeRelationship = (snapshot) => {
  const data = snapshot.data();
  return {
    id: snapshot.id,
    requesterId: data.requesterId,
    recipientId: data.recipientId,
    status: data.status,
    createdAt: toIsoString(data.createdAt),
    updatedAt: toIsoString(data.updatedAt),
  };
};

const getUser = async (uid) => {
  const snapshot = await db.collection(USERS_COLLECTION).doc(uid).get();
  return snapshot.exists ? snapshot.data() : null;
};

const getRelationship = async (firstUid, secondUid) =>
  db.collection(FRIENDSHIPS_COLLECTION).doc(relationshipId(firstUid, secondUid)).get();

const getUsersWithRelationships = async (uid, users) => {
  const results = await Promise.all(
    users.map(async (user) => {
      const relationshipSnapshot = await getRelationship(uid, user.uid);
      const relationship = relationshipSnapshot.exists
        ? serializeRelationship(relationshipSnapshot)
        : null;

      return {
        ...publicUser(user),
        relationshipStatus: relationship?.status || 'none',
        relationship,
      };
    }),
  );

  return results;
};

export const listDiscoverableUsers = async ({ uid, search = '', limit = 20 }) => {
  const normalizedSearch = search.trim().toLowerCase();
  const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), MAX_LIMIT);
  const snapshot = await db
    .collection(USERS_COLLECTION)
    .orderBy('name')
    .limit(MAX_LIMIT)
    .get();

  const users = snapshot.docs
    .map((doc) => doc.data())
    .filter((user) => user.uid !== uid)
    .filter((user) => {
      if (!normalizedSearch) return true;
      return `${user.name || ''} ${user.email || ''}`
        .toLowerCase()
        .includes(normalizedSearch);
    })
    .slice(0, safeLimit);

  return getUsersWithRelationships(uid, users);
};

export const listRelationships = async (uid, status) => {
  const query =
    status === 'pending'
      ? db
          .collection(FRIENDSHIPS_COLLECTION)
          .where('recipientId', '==', uid)
          .where('status', '==', status)
      : db
          .collection(FRIENDSHIPS_COLLECTION)
          .where('status', '==', status)
          .where('members', 'array-contains', uid);

  const snapshot = await query.get();
  const relationships = snapshot.docs.map(serializeRelationship);
  const users = await Promise.all(
    relationships.map((item) =>
      getUser(item.requesterId === uid ? item.recipientId : item.requesterId),
    ),
  );

  return relationships
    .map((relationship, index) => {
      const user = users[index];
      return user
        ? { ...publicUser(user), relationshipStatus: status, relationship }
        : null;
    })
    .filter(Boolean);
};

export const sendRequest = async (requesterId, recipientId) => {
  if (requesterId === recipientId) {
    const error = new Error('You cannot send a friend request to yourself.');
    error.status = 400;
    throw error;
  }

  if (!(await getUser(recipientId))) {
    const error = new Error('User not found.');
    error.status = 404;
    throw error;
  }

  const friendshipRef = db
    .collection(FRIENDSHIPS_COLLECTION)
    .doc(relationshipId(requesterId, recipientId));

  await db.runTransaction(async (transaction) => {
    const existing = await transaction.get(friendshipRef);
    if (existing.exists) {
      if (existing.data().status === 'declined') {
        transaction.update(friendshipRef, {
          requesterId,
          recipientId,
          members: [requesterId, recipientId],
          status: 'pending',
          updatedAt: FieldValue.serverTimestamp(),
        });
        return;
      }

      const error = new Error(
        existing.data().status === 'accepted'
          ? 'You are already friends.'
          : 'A friend request already exists.',
      );
      error.status = 409;
      throw error;
    }

    transaction.set(friendshipRef, {
      requesterId,
      recipientId,
      members: [requesterId, recipientId],
      status: 'pending',
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
  });

  return { id: friendshipRef.id, requesterId, recipientId, status: 'pending' };
};

export const updateRequest = async (recipientId, requesterId, action) => {
  if (!['accept', 'decline'].includes(action)) {
    const error = new Error('Action must be either accept or decline.');
    error.status = 400;
    throw error;
  }

  const friendshipRef = db
    .collection(FRIENDSHIPS_COLLECTION)
    .doc(relationshipId(requesterId, recipientId));

  return db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(friendshipRef);
    if (!snapshot.exists || snapshot.data().recipientId !== recipientId) {
      const error = new Error('Friend request not found.');
      error.status = 404;
      throw error;
    }
    if (snapshot.data().status !== 'pending') {
      const error = new Error('This friend request is no longer pending.');
      error.status = 409;
      throw error;
    }

    const status = action === 'accept' ? 'accepted' : 'declined';
    transaction.update(friendshipRef, {
      status,
      updatedAt: FieldValue.serverTimestamp(),
    });
    return { ...serializeRelationship(snapshot), status };
  });
};

export const removeFriend = async (uid, otherUid) => {
  const friendshipRef = db
    .collection(FRIENDSHIPS_COLLECTION)
    .doc(relationshipId(uid, otherUid));
  const snapshot = await friendshipRef.get();

  if (!snapshot.exists || !snapshot.data().members.includes(uid)) {
    const error = new Error('Friendship not found.');
    error.status = 404;
    throw error;
  }

  await friendshipRef.delete();
};
