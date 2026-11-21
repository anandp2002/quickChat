import { createHash, randomUUID } from 'crypto';
import { FieldValue } from 'firebase-admin/firestore';
import { db } from '../config/firebase.js';

const CONVERSATIONS_COLLECTION = 'conversations';
const FRIENDSHIPS_COLLECTION = 'friendships';
const USERS_COLLECTION = 'users';

const relationshipId = (firstUid, secondUid) =>
  [firstUid, secondUid].sort().join('_');

const conversationId = (firstUid, secondUid) =>
  relationshipId(firstUid, secondUid);

const toIsoString = (value) => {
  if (!value) return null;
  if (typeof value.toDate === 'function') return value.toDate().toISOString();
  return value instanceof Date ? value.toISOString() : value;
};

const serializeMessage = (snapshot) => {
  const data = snapshot.data();
  return {
    id: snapshot.id,
    clientId: data.clientId,
    senderId: data.senderId,
    type: data.type,
    text: data.text,
    attachment: data.attachment || null,
    status: data.status,
    createdAt: toIsoString(data.createdAt),
    updatedAt: toIsoString(data.updatedAt),
  };
};

export const assertConversationMember = async (conversationIdValue, uid) => {
  const snapshot = await db
    .collection(CONVERSATIONS_COLLECTION)
    .doc(conversationIdValue)
    .get();

  if (!snapshot.exists || !snapshot.data().members?.includes(uid)) {
    const error = new Error('Conversation not found.');
    error.status = 404;
    throw error;
  }

  return snapshot;
};

export const openDirectConversation = async (uid, friendUid) => {
  if (!friendUid || uid === friendUid) {
    const error = new Error('Invalid friend.');
    error.status = 400;
    throw error;
  }

  const friendshipSnapshot = await db
    .collection(FRIENDSHIPS_COLLECTION)
    .doc(relationshipId(uid, friendUid))
    .get();

  if (
    !friendshipSnapshot.exists ||
    !friendshipSnapshot.data().members?.includes(uid) ||
    friendshipSnapshot.data().status !== 'accepted'
  ) {
    const error = new Error('You are not friends with this user.');
    error.status = 403;
    throw error;
  }

  const id = conversationId(uid, friendUid);
  const conversationRef = db.collection(CONVERSATIONS_COLLECTION).doc(id);
  const snapshot = await conversationRef.get();

  if (!snapshot.exists) {
    await conversationRef.set({
      type: 'direct',
      members: [uid, friendUid],
      createdBy: uid,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      lastMessage: null,
      unreadCount: { [uid]: 0, [friendUid]: 0 },
    });
  }

  const conversation = await conversationRef.get();
  return {
    id,
    ...conversation.data(),
    createdAt: toIsoString(conversation.data().createdAt),
    updatedAt: toIsoString(conversation.data().updatedAt),
  };
};

export const getConversationMessages = async ({
  conversationId: id,
  uid,
  limit = 30,
  before,
}) => {
  await assertConversationMember(id, uid);
  const safeLimit = Math.min(Math.max(Number(limit) || 30, 1), 100);
  let query = db
    .collection(CONVERSATIONS_COLLECTION)
    .doc(id)
    .collection('messages')
    .orderBy('createdAt', 'desc')
    .limit(safeLimit);

  if (before) {
    const beforeSnapshot = await db
      .collection(CONVERSATIONS_COLLECTION)
      .doc(id)
      .collection('messages')
      .doc(before)
      .get();
    if (beforeSnapshot.exists) query = query.startAfter(beforeSnapshot);
  }

  const snapshot = await query.get();
  return snapshot.docs.map(serializeMessage).reverse();
};

export const sendTextMessage = async ({
  conversationId: id,
  uid,
  text,
  clientId,
}) => {
  const value = typeof text === 'string' ? text.trim() : '';
  if (!value) {
    const error = new Error('Message cannot be empty.');
    error.status = 400;
    throw error;
  }
  if (value.length > 5000) {
    const error = new Error('Message cannot exceed 5000 characters.');
    error.status = 400;
    throw error;
  }
  if (!clientId || typeof clientId !== 'string') {
    const error = new Error('Client message ID is required.');
    error.status = 400;
    throw error;
  }

  const conversationSnapshot = await assertConversationMember(id, uid);
  const members = conversationSnapshot.data().members || [];

  const messageId = createHash('sha256')
    .update(`${id}:${uid}:${clientId}`)
    .digest('hex');
  const messageRef = db
    .collection(CONVERSATIONS_COLLECTION)
    .doc(id)
    .collection('messages')
    .doc(messageId);

  const messageData = await db.runTransaction(async (transaction) => {
    const existing = await transaction.get(messageRef);
    if (existing.exists) return serializeMessage(existing);

    const conversationRef = conversationSnapshot.ref;
    const conversationData = conversationSnapshot.data();
    const unreadCount = conversationData.unreadCount || {};

    transaction.set(messageRef, {
      clientId,
      senderId: uid,
      type: 'text',
      text: value,
      attachment: null,
      status: 'sent',
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    members.forEach((memberUid) => {
      if (memberUid !== uid) unreadCount[memberUid] = (unreadCount[memberUid] || 0) + 1;
    });

    transaction.update(conversationRef, {
      updatedAt: FieldValue.serverTimestamp(),
      unreadCount,
      lastMessage: {
        messageId,
        senderId: uid,
        text: value,
        type: 'text',
        createdAt: FieldValue.serverTimestamp(),
      },
    });

    return {
      id: messageId,
      clientId,
      senderId: uid,
      type: 'text',
      text: value,
      attachment: null,
      status: 'sent',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  });

  return messageData;
};

export const markConversationRead = async (id, uid) => {
  await assertConversationMember(id, uid);
  const conversationRef = db.collection(CONVERSATIONS_COLLECTION).doc(id);
  await conversationRef.update({
    [`unreadCount.${uid}`]: 0,
  });
};

export const getUser = async (uid) => {
  const snapshot = await db.collection(USERS_COLLECTION).doc(uid).get();
  return snapshot.exists ? snapshot.data() : null;
};
