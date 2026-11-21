import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import 'dotenv/config';
import './src/config/firebase.js';
import authRoutes from './src/routes/authRoutes.js';
import friendRoutes from './src/routes/friendRoutes.js';
import chatRoutes from './src/routes/chatRoutes.js';
import { registerChatSocket } from './src/socket/chatSocket.js';

export const app = express();
const PORT = process.env.PORT || 5000;

// ---------------------------------------------------------------------------
// Global middleware
// ---------------------------------------------------------------------------
app.use(cors());
app.use(express.json());

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------
app.get('/', (req, res) => {
  res.json({ message: 'Server is running' });
});

app.use('/api/auth', authRoutes);
app.use('/api/friends', friendRoutes);
app.use('/api/conversations', chatRoutes);

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
  },
});

registerChatSocket(io);

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
