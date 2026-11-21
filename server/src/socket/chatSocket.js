import { auth as firebaseAuth, db } from '../config/firebase.js';
import { FieldValue } from 'firebase-admin/firestore';
import * as chatService from '../services/chatService.js';

export const registerChatSocket = (io) => {
  const presenceSockets = new Map();

  const getAcceptedFriendIds = async (uid) => {
    const snapshot = await db
      .collection('friendships')
      .where('members', 'array-contains', uid)
      .where('status', '==', 'accepted')
      .get();

    return snapshot.docs
      .map((doc) => {
        const members = doc.data().members || [];
        return members.find((memberUid) => memberUid !== uid);
      })
      .filter(Boolean);
  };

  const setPresenceOnline = async (uid) => {
    await db.collection('users').doc(uid).set(
      {
        presence: {
          online: true,
          lastSeen: FieldValue.serverTimestamp(),
        },
      },
      { merge: true },
    );
  };

  const setPresenceOffline = async (uid) => {
    await db.collection('users').doc(uid).set(
      {
        presence: {
          online: false,
          lastSeen: FieldValue.serverTimestamp(),
        },
      },
      { merge: true },
    );
  };

  const getPresenceState = async (friendIds) => {
    const snapshots = await Promise.all(
      friendIds.map((uid) =>
        db.collection('users').doc(uid).get(),
      ),
    );

    return friendIds.reduce((states, uid, index) => {
      const data = snapshots[index].exists ? snapshots[index].data() : {};
      const inMemoryOnline = (presenceSockets.get(uid)?.size || 0) > 0;
      const presence = data.presence || {};
      states[uid] = {
        online: inMemoryOnline,
        lastSeen: presence.lastSeen?.toDate?.().toISOString()
          || (presence.lastSeen instanceof Date ? presence.lastSeen.toISOString() : null),
      };
      return states;
    }, {});
  };

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('Authentication required.'));

      const decoded = await firebaseAuth.verifyIdToken(token);
      socket.data.uid = decoded.uid;
      socket.data.email = decoded.email || null;
      return next();
    } catch {
      return next(new Error('Invalid or expired authentication token.'));
    }
  });

  io.on('connection', (socket) => {
    const uid = socket.data.uid;
    const userSocketIds = presenceSockets.get(uid) || new Set();
    userSocketIds.add(socket.id);
    presenceSockets.set(uid, userSocketIds);

    let acceptedFriendIds = [];
    const initializePresence = async () => {
      acceptedFriendIds = await getAcceptedFriendIds(uid);
      await socket.join(`presence:${uid}`);

      await Promise.all(
        acceptedFriendIds.map((friendUid) =>
          socket.join(`presence:${friendUid}`),
        ),
      );

      if (userSocketIds.size === 1) {
        await setPresenceOnline(uid);
        io.to(`presence:${uid}`).emit('presence:online', { uid });
      }
    };

    initializePresence().catch((error) => {
      console.error('Failed to initialize user presence:', error);
    });

    socket.on('presence:subscribe', async (payload = {}, acknowledge) => {
      try {
        if (!acceptedFriendIds.length) {
          acceptedFriendIds = await getAcceptedFriendIds(uid);
        }
        const presences = await getPresenceState(acceptedFriendIds);
        acknowledge?.({ ok: true, presences });
      } catch (error) {
        acknowledge?.({ ok: false, error: error.message });
      }
    });

    socket.on('conversation:join', async (payload = {}, acknowledge) => {
      try {
        await chatService.assertConversationMember(
          payload.conversationId,
          socket.data.uid,
        );
        await socket.join(payload.conversationId);
        acknowledge?.({ ok: true });
      } catch (error) {
        acknowledge?.({ ok: false, error: error.message });
      }
    });

    socket.on('conversation:leave', async (payload = {}) => {
      if (payload.conversationId) {
        await socket.leave(payload.conversationId);
      }
    });

    socket.on('message:send', async (payload = {}, acknowledge) => {
      try {
        const message = await chatService.sendTextMessage({
          conversationId: payload.conversationId,
          uid: socket.data.uid,
          text: payload.text,
          clientId: payload.clientId,
        });

        io.to(payload.conversationId).emit('message:new', {
          conversationId: payload.conversationId,
          message,
        });
        acknowledge?.({ ok: true, message });
      } catch (error) {
        acknowledge?.({ ok: false, error: error.message });
      }
    });

    socket.on('typing:start', async (payload = {}) => {
      try {
        await chatService.assertConversationMember(
          payload.conversationId,
          socket.data.uid,
        );
        socket.to(payload.conversationId).emit('typing:update', {
          conversationId: payload.conversationId,
          uid: socket.data.uid,
          typing: true,
        });
      } catch {
        // Ignore typing updates that are not authorized for the conversation.
      }
    });

    socket.on('typing:stop', async (payload = {}) => {
      try {
        await chatService.assertConversationMember(
          payload.conversationId,
          socket.data.uid,
        );
        socket.to(payload.conversationId).emit('typing:update', {
          conversationId: payload.conversationId,
          uid: socket.data.uid,
          typing: false,
        });
      } catch {
        // Ignore typing updates that are not authorized for the conversation.
      }
    });

    socket.on('messages:read', async (payload = {}, acknowledge) => {
      try {
        await chatService.markConversationRead(
          payload.conversationId,
          socket.data.uid,
        );
        socket.to(payload.conversationId).emit('messages:read', {
          conversationId: payload.conversationId,
          uid: socket.data.uid,
        });
        acknowledge?.({ ok: true });
      } catch (error) {
        acknowledge?.({ ok: false, error: error.message });
      }
    });

    socket.on('disconnect', async () => {
      const remainingSocketIds =
        presenceSockets.get(uid) || new Set();
      remainingSocketIds.delete(socket.id);

      if (remainingSocketIds.size) {
        presenceSockets.set(uid, remainingSocketIds);
        return;
      }

      presenceSockets.delete(uid);
      try {
        await setPresenceOffline(uid);
        io.to(`presence:${uid}`).emit('presence:offline', {
          uid,
          lastSeen: new Date().toISOString(),
        });
      } catch (error) {
        console.error('Failed to update offline presence:', error);
      }
    });
  });
};
