import { Response, NextFunction } from 'express';
import { ChatService } from '../services/ChatService';
import { CloudinaryService } from '../services/CloudinaryService';
import { AuthRequest } from '../types';
import { MessageType } from '../models/Message';
import { ChatRoomType } from '../models/ChatRoom';
import { SocketService } from '../services/SocketService';
import multer from 'multer';

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    }
});

import { PermissionService } from '../services/PermissionService';
import { AuthorizationError } from '../utils/errors';

export class ChatController {
    private chatService: ChatService;
    private cloudinaryService: CloudinaryService;
    private permissionService: PermissionService;
    private socketService: SocketService | null = null;
    public uploadMiddleware = upload.single('file');

    constructor() {
        this.chatService = new ChatService();
        this.cloudinaryService = new CloudinaryService();
        this.permissionService = PermissionService.getInstance();
    }

    /**
     * Set socket service for real-time updates
     */
    setSocketService(socketService: SocketService): void {
        this.socketService = socketService;
        this.chatService.setSocketService(socketService);
    }

    /**
     * Create a new chat room
     * POST /api/workshops/:workshopId/chat/rooms
     */
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

            let roomParticipants = participants;

            // Automatically add project/team members if no participants provided
            if (!roomParticipants || roomParticipants.length === 0) {
                const pList = new Set<string>();
                pList.add(userId);

                if (roomType === ChatRoomType.PROJECT && projectId) {
                    const project = await require('../models/WorkshopProject').WorkshopProject.findById(projectId);
                    if (project) {
                        project.assignedIndividuals.forEach((id: any) => pList.add(id.toString()));
                        if (project.projectManager) pList.add(project.projectManager.toString());
                        project.maintainers.forEach((id: any) => pList.add(id.toString()));

                        // Add members from assigned teams
                        if (project.assignedTeams && project.assignedTeams.length > 0) {
                            const TeamModel = require('../models/Team').Team;
                            const teams = await TeamModel.find({ _id: { $in: project.assignedTeams } });
                            teams.forEach((team: any) => {
                                team.members.forEach((memberId: any) => pList.add(memberId.toString()));
                            });
                        }
                    }
                } else if (roomType === ChatRoomType.TEAM && teamId) {
                    const team = await require('../models/Team').Team.findById(teamId);
                    if (team) {
                        team.members.forEach((id: any) => pList.add(id.toString()));
                    }
                } else if (roomType === ChatRoomType.WORKSHOP || !roomType) {
                    const MembershipModel = require('../models/Membership').Membership;
                    const members = await MembershipModel.find({
                        workshop: workshopId,
                        state: 'active'
                    });
                    members.forEach((m: any) => pList.add(m.user.toString()));
                }

                roomParticipants = Array.from(pList);
            } else if (!roomParticipants.includes(userId)) {
                roomParticipants.push(userId);
            }

            const chatRoom = await this.chatService.createChatRoom({
                roomType: roomType || ChatRoomType.WORKSHOP,
                workshopId,
                projectId,
                teamId,
                participants: roomParticipants,
                name,
                description,
                createdBy: userId
            });

            // Emit real-time update
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

    /**
     * Get user's chat rooms
     * GET /api/workshops/:workshopId/chat/rooms
     */
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

    /**
     * Update chat room
     * PUT /api/chat/rooms/:roomId
     */
    updateRoom = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { roomId } = req.params;
            const userId = req.user!.id;
            const { name, description } = req.body;

            const chatRoom = await this.chatService.updateChatRoom(roomId, userId, { name, description });

            // Emit real-time update
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

    /**
     * Delete chat room
     * DELETE /api/chat/rooms/:roomId
     */
    deleteRoom = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { roomId } = req.params;
            const userId = req.user!.id;

            // Get room details first to know which workshop to emit to
            const chatRoom = await this.chatService.getChatRoom(roomId);
            const workshopId = chatRoom.workshop.toString();

            await this.chatService.deleteChatRoom(roomId, userId);

            // Emit real-time update
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

    /**
     * Get chat room details
     * GET /api/chat/rooms/:roomId
     */
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

    /**
     * Get or create direct message room
     * POST /api/workshops/:workshopId/chat/direct
     */
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

    /**
     * Send a message
     * POST /api/chat/rooms/:roomId/messages
     */
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

            // Emit real-time update
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

    /**
     * Get messages with pagination
     * GET /api/chat/rooms/:roomId/messages
     */
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

    /**
     * Upload media (image, audio, document)
     * POST /api/chat/upload
     */
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

            // Upload based on message type
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

            // Create message with uploaded file
            const message = await this.chatService.sendMessage(roomId, userId, {
                messageType,
                content: uploadResult.secureUrl,
                fileName: file.originalname,
                fileSize: uploadResult.bytes,
                mimeType: file.mimetype,
                duration: uploadResult.duration,
                replyTo
            });

            // Emit real-time update
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

    /**
     * Upload file only (without message)
     */
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

    /**
     * Mark message as seen
     * PUT /api/chat/messages/:messageId/seen
     */
    markAsSeen = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { messageId } = req.params;
            const userId = req.user!.id;

            const message = await this.chatService.markMessageAsSeen(messageId, userId);

            // Emit real-time update
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

    /**
     * Mark all messages in room as seen
     * PUT /api/chat/rooms/:roomId/seen
     */
    markAllAsSeen = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { roomId } = req.params;
            const userId = req.user!.id;

            await this.chatService.markAllMessagesAsSeen(roomId, userId);

            // Emit real-time update
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

    /**
     * Edit message
     * PUT /api/chat/messages/:messageId
     */
    editMessage = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { messageId } = req.params;
            const userId = req.user!.id;
            const { content } = req.body;

            const message = await this.chatService.editMessage(messageId, userId, content);

            // Emit real-time update
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

    /**
     * Delete message
     * DELETE /api/chat/messages/:messageId
     */
    deleteMessage = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { messageId } = req.params;
            const userId = req.user!.id;

            await this.chatService.deleteMessage(messageId, userId);

            // Emit real-time update
            if (this.socketService) {
                // Get room ID before deletion
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

    /**
     * Add reaction to message
     * POST /api/chat/messages/:messageId/reactions
     */
    addReaction = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { messageId } = req.params;
            const userId = req.user!.id;
            const { emoji } = req.body;

            const message = await this.chatService.addReaction(messageId, userId, emoji);

            // Emit real-time update
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

    /**
     * Remove reaction from message
     * DELETE /api/chat/messages/:messageId/reactions
     */
    removeReaction = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { messageId } = req.params;
            const userId = req.user!.id;
            const { emoji } = req.body;

            const message = await this.chatService.removeReaction(messageId, userId, emoji);

            // Emit real-time update
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

    /**
     * Search messages
     * GET /api/chat/rooms/:roomId/search
     */
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

    /**
     * Get unread message count
     * GET /api/chat/rooms/:roomId/unread
     */
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
