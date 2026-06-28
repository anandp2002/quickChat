import { Router } from 'express';
import { verifyToken } from '../middlewares/authMiddleware.js';
import * as authController from '../controllers/authController.js';

const router = Router();

// POST /api/auth/register — create user profile in Firestore
router.post('/register', verifyToken, authController.register);

// GET  /api/auth/me       — fetch current user's profile
router.get('/me', verifyToken, authController.getMe);

export default router;
