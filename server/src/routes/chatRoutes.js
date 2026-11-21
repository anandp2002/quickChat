import { Router } from 'express';
import { verifyToken } from '../middlewares/authMiddleware.js';
import * as chatController from '../controllers/chatController.js';

const router = Router();

router.use(verifyToken);
router.post('/direct/:friendId', chatController.openConversation);
router.get('/:conversationId/messages', chatController.listMessages);
router.patch('/:conversationId/read', chatController.markRead);

export default router;
