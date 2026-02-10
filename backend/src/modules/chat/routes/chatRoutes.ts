import { Router } from 'express';
import { authMiddleware } from '@middlewares';
import { CHAT_ROUTES } from '@constants';
import { Container } from '@di/types';

export const createChatRoutes = (container: Container) => {
    const router = Router();
    const chatController = container.chatCtrl;

    router.post(CHAT_ROUTES.WORKSHOP_ROOMS, authMiddleware, chatController.createRoom);
    router.get(CHAT_ROUTES.WORKSHOP_ROOMS, authMiddleware, chatController.getRooms);
    router.post(CHAT_ROUTES.DIRECT, authMiddleware, chatController.getOrCreateDirectRoom);

    router.get(CHAT_ROUTES.BY_ID, authMiddleware, chatController.getRoom);
    router.put(CHAT_ROUTES.BY_ID, authMiddleware, chatController.updateRoom);
    router.delete(CHAT_ROUTES.BY_ID, authMiddleware, chatController.deleteRoom);

    router.post(CHAT_ROUTES.MESSAGES, authMiddleware, chatController.sendMessage);
    router.get(CHAT_ROUTES.MESSAGES, authMiddleware, chatController.getMessages);

    router.put(CHAT_ROUTES.MESSAGE_BY_ID, authMiddleware, chatController.editMessage);
    router.delete(CHAT_ROUTES.MESSAGE_BY_ID, authMiddleware, chatController.deleteMessage);

    router.put(CHAT_ROUTES.MESSAGE_SEEN, authMiddleware, chatController.markAsSeen);
    router.put(CHAT_ROUTES.ROOM_SEEN, authMiddleware, chatController.markAllAsSeen);
    router.get(CHAT_ROUTES.ROOM_UNREAD, authMiddleware, chatController.getUnreadCount);

    router.post(CHAT_ROUTES.REACTIONS, authMiddleware, chatController.addReaction);
    router.delete(CHAT_ROUTES.REACTIONS, authMiddleware, chatController.removeReaction);

    router.get(CHAT_ROUTES.SEARCH, authMiddleware, chatController.searchMessages);

    router.post(CHAT_ROUTES.UPLOAD, authMiddleware, chatController.uploadMiddleware, chatController.uploadMedia);
    router.post(CHAT_ROUTES.UPLOAD_ONLY, authMiddleware, chatController.uploadMiddleware, chatController.uploadOnly);

    return router;
};

export default createChatRoutes;