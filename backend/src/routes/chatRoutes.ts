import { Router } from 'express';
import { ChatController } from '../controllers/ChatController';
import { authenticate } from '../middlewares/auth';

const router = Router();
export const chatController = new ChatController();

// ============================================
// CHAT ROOM ROUTES
// ============================================

// Workshop chat rooms
router.post('/workshops/:workshopId/chat/rooms', authenticate, chatController.createRoom);
router.get('/workshops/:workshopId/chat/rooms', authenticate, chatController.getRooms);
router.post('/workshops/:workshopId/chat/direct', authenticate, chatController.getOrCreateDirectRoom);

// Chat room details
router.get('/rooms/:roomId', authenticate, chatController.getRoom);
router.put('/rooms/:roomId', authenticate, chatController.updateRoom);
router.delete('/rooms/:roomId', authenticate, chatController.deleteRoom);

// ============================================
// MESSAGE ROUTES
// ============================================

// Send and get messages
router.post('/rooms/:roomId/messages', authenticate, chatController.sendMessage);
router.get('/rooms/:roomId/messages', authenticate, chatController.getMessages);

// Message actions
router.put('/messages/:messageId', authenticate, chatController.editMessage);
router.delete('/messages/:messageId', authenticate, chatController.deleteMessage);

// Read receipts
router.put('/messages/:messageId/seen', authenticate, chatController.markAsSeen);
router.put('/rooms/:roomId/seen', authenticate, chatController.markAllAsSeen);
router.get('/rooms/:roomId/unread', authenticate, chatController.getUnreadCount);

// Reactions
router.post('/messages/:messageId/reactions', authenticate, chatController.addReaction);
router.delete('/messages/:messageId/reactions', authenticate, chatController.removeReaction);

// Search
router.get('/rooms/:roomId/search', authenticate, chatController.searchMessages);

// ============================================
// FILE UPLOAD ROUTES
// ============================================

router.post('/upload', authenticate, chatController.uploadMiddleware, chatController.uploadMedia);
router.post('/upload-only', authenticate, chatController.uploadMiddleware, chatController.uploadOnly);

export default router;
