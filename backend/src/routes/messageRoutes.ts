import { Router } from 'express';
import { MessageController } from '../controllers/MessageController';
import { authenticate } from '../middlewares/auth';
import { MessageService } from '../services/MessageService';

const router = Router();
const messageService = new MessageService();
const messageController = new MessageController(messageService);

router.use(authenticate);

router.post('/projects/:projectId/messages', messageController.sendMessage);
router.get('/projects/:projectId/messages', messageController.getProjectMessages);

export default router;
export { messageService };
