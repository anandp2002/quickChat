import { Router } from 'express';
import { verifyToken } from '../middlewares/authMiddleware.js';
import * as friendController from '../controllers/friendController.js';

const router = Router();

router.use(verifyToken);
router.get('/discover', friendController.discover);
router.get('/', friendController.listFriends);
router.get('/requests', friendController.listRequests);
router.post('/:userId', friendController.createRequest);
router.patch('/requests/:userId', friendController.respondToRequest);
router.delete('/:userId', friendController.deleteFriend);

export default router;
