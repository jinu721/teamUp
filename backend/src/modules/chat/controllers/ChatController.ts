import { Response, NextFunction } from 'express';
import { IChatService } from '../interfaces/IChatService';
import { ICloudinaryService } from '../../../shared/interfaces/ICloudinaryService';
import { AuthRequest } from '../../../shared/types/index';
import { MessageType } from '../models/Message';
import { ChatRoomType } from '../models/ChatRoom';
import { ISocketService } from '../../../shared/interfaces/ISocketService';
import multer from 'multer';
import { IPermissionService } from '../../access-control/interfaces/IPermissionService';
import { AuthorizationError } from '../../../shared/utils/errors';

const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: {
        fileSize: 10 * 1024 * 1024
    }
});

export class ChatController {
    private socketService: ISocketService | null = null;
    public uploadMiddleware = upload.single('file');

    constructor(
        private chatService: IChatService,
        private cloudinaryService: ICloudinaryService,
        private permissionService: IPermissionService
    ) { }

    setSocketService(socketService: ISocketService): void {
        this.socketService = socketService;
        this.chatService.setSocketService(socketService);
    }

    createRoom = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { workshopId } = req.params;
            const userId = req.user!.id;
            const { roomType, projectId, teamId, participants, name, description } = req.body;

            const permission = await this.permissionService.checkPermission(userId, workshopId, 'create', 'chat_room', {
                projectId,
                teamId
            });

            if (!permission.granted) {
                throw new AuthorizationError(permission.reason || 'You do not have permission to create chat rooms');
            }

            const chatRoom = await this.chatService.createChatRoom({
                roomType: roomType || ChatRoomType.WORKSHOP,
                workshopId,
                projectId,
                teamId,
                participants: participants || [],
                name,
                description,
                createdBy: userId
            });

            if (this.socketService) {
                this.socketService.emitToWorkshop(workshopId, 'chat:room:created', chatRoom);
            }

            res.status(201).json({
                success: true,
                data: chatRoom,
                message: 'Chat room created successfully'
            });
        } catch (error) {
            next(error);
        }
    };

    getRooms = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { workshopId } = req.params;
            const userId = req.user!.id;

            const chatRooms = await this.chatService.getUserChatRooms(userId, workshopId);

            res.json({
                success: true,
                data: chatRooms,
                message: 'Chat rooms retrieved successfully'
            });
        } catch (error) {
            next(error);
        }
    };

    updateRoom = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { roomId } = req.params;
            const userId = req.user!.id;
            const { name, description } = req.body;

            const chatRoom = await this.chatService.updateChatRoom(roomId, userId, { name, description });

            if (this.socketService) {
                this.socketService.emitToChatRoom(roomId, 'chat:room:updated', chatRoom);
            }

            res.json({
                success: true,
                data: chatRoom,
                message: 'Chat room updated successfully'
            });
        } catch (error) {
            next(error);
        }
    };

    deleteRoom = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { roomId } = req.params;
            const userId = req.user!.id;

            const chatRoom = await this.chatService.getChatRoom(roomId);
            const workshopId = chatRoom.workshop.toString();

            await this.chatService.deleteChatRoom(roomId, userId);

            if (this.socketService) {
                this.socketService.emitToWorkshop(workshopId, 'chat:room:deleted', { roomId });
            }

            res.json({
                success: true,
                message: 'Chat room deleted successfully'
            });
        } catch (error) {
            next(error);
        }
    };

    getRoom = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { roomId } = req.params;

            const chatRoom = await this.chatService.getChatRoom(roomId);

            res.json({
                success: true,
                data: chatRoom,
                message: 'Chat room retrieved successfully'
            });
        } catch (error) {
            next(error);
        }
    };

    getOrCreateDirectRoom = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { workshopId } = req.params;
            const userId = req.user!.id;
            const { recipientId } = req.body;

            const chatRoom = await this.chatService.getOrCreateDirectRoom(workshopId, userId, recipientId);

            res.json({
                success: true,
                data: chatRoom,
                message: 'Direct message room retrieved successfully'
            });
        } catch (error) {
            next(error);
        }
    };

    sendMessage = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { roomId } = req.params;
            const userId = req.user!.id;
            const { messageType, content, replyTo } = req.body;

            const message = await this.chatService.sendMessage(roomId, userId, {
                messageType: messageType || MessageType.TEXT,
                content,
                replyTo
            });

            if (this.socketService) {
                this.socketService.emitToChatRoom(roomId, 'chat:message:received', message);
            }

            res.status(201).json({
                success: true,
                data: message,
                message: 'Message sent successfully'
            });
        } catch (error) {
            next(error);
        }
    };

    getMessages = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { roomId } = req.params;
            const userId = req.user!.id;
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 50;

            const result = await this.chatService.getMessages(roomId, userId, page, limit);

            res.json({
                success: true,
                data: result.messages,
                pagination: {
                    page,
                    limit,
                    total: result.total,
                    hasMore: result.hasMore
                },
                message: 'Messages retrieved successfully'
            });
        } catch (error) {
            next(error);
        }
    };

    uploadMedia = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { roomId, messageType, replyTo } = req.body;
            const userId = req.user!.id;
            const file = req.file;

            if (!file) {
                res.status(400).json({
                    success: false,
                    message: 'No file uploaded'
                });
                return;
            }

            let uploadResult;
            let folder = 'teamup/chat';

            switch (messageType) {
                case MessageType.IMAGE:
                    uploadResult = await this.cloudinaryService.uploadImage(file, `${folder}/images`);
                    break;
                case MessageType.AUDIO:
                    uploadResult = await this.cloudinaryService.uploadAudio(file, `${folder}/audio`);
                    break;
                case MessageType.DOCUMENT:
                    uploadResult = await this.cloudinaryService.uploadDocument(file, `${folder}/documents`);
                    break;
                default:
                    res.status(400).json({
                        success: false,
                        message: 'Invalid message type'
                    });
                    return;
            }

            const message = await this.chatService.sendMessage(roomId, userId, {
                messageType,
                content: uploadResult.secureUrl,
                fileName: file.originalname,
                fileSize: uploadResult.bytes,
                mimeType: file.mimetype,
                duration: uploadResult.duration,
                replyTo
            });

            if (this.socketService) {
                this.socketService.emitToChatRoom(roomId, 'chat:message:received', message);
            }

            res.status(201).json({
                success: true,
                data: message,
                message: 'Media uploaded and message sent successfully'
            });
        } catch (error) {
            next(error);
        }
    };

    uploadOnly = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
        try {
            const file = req.file;
            if (!file) {
                res.status(400).json({ success: false, message: 'No file provided' });
                return;
            }

            const { type } = req.body as { type: string };
            let uploadResult;

            switch (type) {
                case MessageType.IMAGE:
                    uploadResult = await this.cloudinaryService.uploadImage(file, 'general/images');
                    break;
                case MessageType.AUDIO:
                    uploadResult = await this.cloudinaryService.uploadAudio(file, 'general/audio');
                    break;
                case MessageType.DOCUMENT:
                default:
                    uploadResult = await this.cloudinaryService.uploadDocument(file, 'general/documents');
                    break;
            }

            res.status(200).json({
                success: true,
                data: {
                    fileUrl: uploadResult.secureUrl,
                    fileName: file.originalname,
                    fileType: file.mimetype,
                    fileSize: uploadResult.bytes
                }
            });
        } catch (error) {
            next(error);
        }
    };

    markAsSeen = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { messageId } = req.params;
            const userId = req.user!.id;

            const message = await this.chatService.markMessageAsSeen(messageId, userId);

            if (this.socketService) {
                const roomId = (message.chatRoom as any)._id || message.chatRoom;
                this.socketService.emitToChatRoom(roomId.toString(), 'chat:message:seen', {
                    messageId,
                    userId,
                    seenAt: new Date()
                });
            }

            res.json({
                success: true,
                data: message,
                message: 'Message marked as seen'
            });
        } catch (error) {
            next(error);
        }
    };

    markAllAsSeen = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { roomId } = req.params;
            const userId = req.user!.id;

            await this.chatService.markAllMessagesAsSeen(roomId, userId);

            if (this.socketService) {
                this.socketService.emitToChatRoom(roomId, 'chat:room:all_seen', {
                    userId,
                    seenAt: new Date()
                });
            }

            res.json({
                success: true,
                message: 'All messages marked as seen'
            });
        } catch (error) {
            next(error);
        }
    };

    editMessage = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { messageId } = req.params;
            const userId = req.user!.id;
            const { content } = req.body;

            const message = await this.chatService.editMessage(messageId, userId, content);

            if (this.socketService) {
                const roomId = (message.chatRoom as any)._id || message.chatRoom;
                this.socketService.emitToChatRoom(roomId.toString(), 'chat:message:edited', message);
            }

            res.json({
                success: true,
                data: message,
                message: 'Message edited successfully'
            });
        } catch (error) {
            next(error);
        }
    };

    deleteMessage = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { messageId } = req.params;
            const userId = req.user!.id;

            await this.chatService.deleteMessage(messageId, userId);

            if (this.socketService) {
                const Message = require('../models/Message').Message;
                const message = await Message.findById(messageId);
                if (message) {
                    this.socketService.emitToChatRoom(message.chatRoom.toString(), 'chat:message:deleted', {
                        messageId
                    });
                }
            }

            res.json({
                success: true,
                message: 'Message deleted successfully'
            });
        } catch (error) {
            next(error);
        }
    };

    addReaction = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { messageId } = req.params;
            const userId = req.user!.id;
            const { emoji } = req.body;

            const message = await this.chatService.addReaction(messageId, userId, emoji);

            if (this.socketService) {
                const roomId = (message.chatRoom as any)._id || message.chatRoom;
                this.socketService.emitToChatRoom(roomId.toString(), 'chat:reaction:added', {
                    messageId,
                    userId,
                    emoji
                });
            }

            res.json({
                success: true,
                data: message,
                message: 'Reaction added successfully'
            });
        } catch (error) {
            next(error);
        }
    };

    removeReaction = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { messageId } = req.params;
            const userId = req.user!.id;
            const { emoji } = req.body;

            const message = await this.chatService.removeReaction(messageId, userId, emoji);

            if (this.socketService) {
                const roomId = (message.chatRoom as any)._id || message.chatRoom;
                this.socketService.emitToChatRoom(roomId.toString(), 'chat:reaction:removed', {
                    messageId,
                    userId,
                    emoji
                });
            }

            res.json({
                success: true,
                data: message,
                message: 'Reaction removed successfully'
            });
        } catch (error) {
            next(error);
        }
    };

    searchMessages = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { roomId } = req.params;
            const userId = req.user!.id;
            const query = req.query.q as string;
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 20;

            const result = await this.chatService.searchMessages(roomId, userId, query, page, limit);

            res.json({
                success: true,
                data: result.messages,
                pagination: {
                    page,
                    limit,
                    total: result.total
                },
                message: 'Messages searched successfully'
            });
        } catch (error) {
            next(error);
        }
    };

    getUnreadCount = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { roomId } = req.params;
            const userId = req.user!.id;

            const count = await this.chatService.getUnreadCount(roomId, userId);

            res.json({
                success: true,
                data: { count },
                message: 'Unread count retrieved successfully'
            });
        } catch (error) {
            next(error);
        }
    };
}