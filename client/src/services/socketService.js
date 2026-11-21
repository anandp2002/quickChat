import { io } from 'socket.io-client';
import { auth } from '@/config/firebase';

const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL ||
  import.meta.env.VITE_API_URL ||
  'http://localhost:5000';

let socket = null;

export const getChatSocket = async () => {
  const user = auth.currentUser;
  if (!user) throw new Error('You must be signed in to chat.');

  if (!socket) {
    socket = io(SOCKET_URL, {
      auth: { token: await user.getIdToken() },
      autoConnect: false,
    });
  } else {
    socket.auth = { token: await user.getIdToken() };
  }

  if (!socket.connected) socket.connect();
  return socket;
};

export const disconnectChatSocket = () => {
  if (socket) socket.disconnect();
};
