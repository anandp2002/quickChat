import { auth as firebaseAuth } from '../config/firebase.js';
import * as chatService from '../services/chatService.js';

export const registerChatSocket = (io) => {
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

    socket.on('typing:start', (payload = {}) => {
      socket.to(payload.conversationId).emit('typing:update', {
        conversationId: payload.conversationId,
        uid: socket.data.uid,
        typing: true,
      });
    });

    socket.on('typing:stop', (payload = {}) => {
      socket.to(payload.conversationId).emit('typing:update', {
        conversationId: payload.conversationId,
        uid: socket.data.uid,
        typing: false,
      });
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
  });
};
