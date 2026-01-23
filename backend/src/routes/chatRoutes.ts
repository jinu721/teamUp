import { Router } from 'express';
import { ChatController } from '../controllers/ChatController';
import { authenticate } from '../middlewares/auth';

const router = Router();
export const chatController = new ChatController();

router.post('/workshops/:workshopId/chat/rooms', authenticate, chatController.createRoom);
router.get('/workshops/:workshopId/chat/rooms', authenticate, chatController.getRooms);
router.post('/workshops/:workshopId/chat/direct', authenticate, chatController.getOrCreateDirectRoom);

router.get('/rooms/:roomId', authenticate, chatController.getRoom);
router.put('/rooms/:roomId', authenticate, chatController.updateRoom);
router.delete('/rooms/:roomId', authenticate, chatController.deleteRoom);

router.post('/rooms/:roomId/messages', authenticate, chatController.sendMessage);
router.get('/rooms/:roomId/messages', authenticate, chatController.getMessages);

router.put('/messages/:messageId', authenticate, chatController.editMessage);
router.delete('/messages/:messageId', authenticate, chatController.deleteMessage);

router.put('/messages/:messageId/seen', authenticate, chatController.markAsSeen);
router.put('/rooms/:roomId/seen', authenticate, chatController.markAllAsSeen);
router.get('/rooms/:roomId/unread', authenticate, chatController.getUnreadCount);

router.post('/messages/:messageId/reactions', authenticate, chatController.addReaction);
router.delete('/messages/:messageId/reactions', authenticate, chatController.removeReaction);

router.get('/rooms/:roomId/search', authenticate, chatController.searchMessages);

router.post('/upload', authenticate, chatController.uploadMiddleware, chatController.uploadMedia);
router.post('/upload-only', authenticate, chatController.uploadMiddleware, chatController.uploadOnly);

export default router;