import { ChatRoom, IChatRoom, ChatRoomType } from '../models/ChatRoom';
import { Message, IMessage, MessageType } from '../models/Message';
import { NotFoundError, AuthorizationError, ValidationError } from '../utils/errors';
import { Types } from 'mongoose';
import { ActivityHistoryService } from './ActivityHistoryService';
import { ActivityAction, ActivityEntityType } from '../models/ActivityHistory';
import { SocketService } from './SocketService';

export interface CreateChatRoomData {
    roomType: ChatRoomType;
    workshopId: string;
    projectId?: string;
    teamId?: string;
    participants: string[];
    name: string;
    description?: string;
    createdBy: string;
}

export interface SendMessageData {
    messageType: MessageType;
    content: string;
    fileName?: string;
    fileSize?: number;
    mimeType?: string;
    duration?: number;
    replyTo?: string;
}

export interface MessageFilters {
    search?: string;
    messageType?: MessageType;
    startDate?: Date;
    endDate?: Date;
}

export class ChatService {
    private activityService: ActivityHistoryService;
    private socketService: SocketService | null = null;

    constructor() {
        this.activityService = new ActivityHistoryService();
    }

    setSocketService(socketService: SocketService): void {
        this.socketService = socketService;
    }

    private getIdString(id: any): string {
        if (!id) return '';
        return id._id ? id._id.toString() : id.toString();
    }

    /**
     * Create a new chat room
     */
    async createChatRoom(data: CreateChatRoomData): Promise<IChatRoom> {
        const WorkshopModel = require('../models/Workshop').Workshop;
        const workshop = await WorkshopModel.findById(data.workshopId);

        const participants = [...data.participants];
        if (data.roomType !== ChatRoomType.DIRECT && workshop) {
            const ownerIdStr = workshop.owner.toString();
            if (!participants.includes(ownerIdStr)) {
                participants.push(ownerIdStr);
            }
        }

        const chatRoom = await ChatRoom.create({
            roomType: data.roomType,
            workshop: new Types.ObjectId(data.workshopId),
            project: data.projectId ? new Types.ObjectId(data.projectId) : undefined,
            team: data.teamId ? new Types.ObjectId(data.teamId) : undefined,
            participants: participants.map(id => new Types.ObjectId(id)),
            name: data.name,
            description: data.description,
            createdBy: new Types.ObjectId(data.createdBy),
            admins: [new Types.ObjectId(data.createdBy)]
        });

        // Log activity
        await this.activityService.logActivity({
            workshop: data.workshopId,
            user: data.createdBy,
            action: ActivityAction.CREATED,
            entityType: ActivityEntityType.MESSAGE,
            entityId: chatRoom._id.toString(),
            entityName: data.name,
            description: `Created ${data.roomType} chat room: ${data.name}`
        });

        return chatRoom.populate(['participants', 'createdBy', 'workshop', 'project', 'team']);
    }

    /**
     * Get chat room by ID
     */
    async getChatRoom(roomId: string): Promise<IChatRoom> {
        const chatRoom = await ChatRoom.findById(roomId)
            .populate(['participants', 'createdBy', 'lastMessage', 'workshop', 'project', 'team']);

        if (!chatRoom) {
            throw new NotFoundError('Chat room');
        }

        return chatRoom;
    }

    /**
     * Get user's chat rooms in a workshop
     */
    async getUserChatRooms(userId: string, workshopId: string): Promise<IChatRoom[]> {
        // Auto-sync user to rooms before fetching
        await this.syncUserToWorkshopRooms(userId, workshopId);

        const WorkshopModel = require('../models/Workshop').Workshop;
        const workshop = await WorkshopModel.findById(workshopId);
        const isOwner = workshop && workshop.owner.toString() === userId;

        const query: any = { workshop: new Types.ObjectId(workshopId) };
        if (!isOwner) {
            query.participants = new Types.ObjectId(userId);
        }

        const chatRooms = await ChatRoom.find(query)
            .populate(['participants', 'lastMessage', 'project', 'team'])
            .sort({ lastMessageAt: -1 });

        return chatRooms;
    }

    /**
     * Sync all active workshop members to relevant rooms
     */
    async syncAllWorkshopMembers(workshopId: string): Promise<void> {
        const MembershipModel = require('../models/Membership').Membership;
        const activeMemberships = await MembershipModel.find({
            workshop: new Types.ObjectId(workshopId),
            state: 'active'
        });

        for (const membership of activeMemberships) {
            await this.syncUserToWorkshopRooms(membership.user.toString(), workshopId);
        }
    }

    /**
     * Get or create direct message room
     */
    async getOrCreateDirectRoom(workshopId: string, user1Id: string, user2Id: string): Promise<IChatRoom> {
        // Check if direct room already exists
        const existingRoom = await ChatRoom.findOne({
            roomType: ChatRoomType.DIRECT,
            workshop: new Types.ObjectId(workshopId),
            participants: {
                $all: [new Types.ObjectId(user1Id), new Types.ObjectId(user2Id)],
                $size: 2
            }
        }).populate(['participants', 'lastMessage']);

        if (existingRoom) {
            return existingRoom;
        }

        // Create new direct room
        return this.createChatRoom({
            roomType: ChatRoomType.DIRECT,
            workshopId,
            participants: [user1Id, user2Id],
            name: 'Direct Message',
            createdBy: user1Id
        });
    }

    /**
     * Update chat room
     */
    async updateChatRoom(roomId: string, userId: string, data: Partial<{ name: string; description: string }>): Promise<IChatRoom> {
        const chatRoom = await this.getChatRoom(roomId);

        // Check if user is admin
        if (!chatRoom.admins.some(admin => this.getIdString(admin) === userId)) {
            throw new AuthorizationError('Only room admins can update room details');
        }

        if (data.name) chatRoom.name = data.name;
        if (data.description !== undefined) chatRoom.description = data.description;

        await chatRoom.save();
        return chatRoom.populate(['participants', 'createdBy', 'workshop', 'project', 'team']);
    }

    /**
     * Delete chat room
     */
    async deleteChatRoom(roomId: string, userId: string): Promise<void> {
        const chatRoom = await this.getChatRoom(roomId);

        // Check if user is admin or creator
        const isAdmin = chatRoom.admins.some(admin => this.getIdString(admin) === userId);
        const isCreator = this.getIdString(chatRoom.createdBy) === userId;

        if (!isAdmin && !isCreator) {
            throw new AuthorizationError('Only room admins or the creator can delete the room');
        }

        await this.performRoomDeletion(roomId);
    }

    /**
     * Delete all rooms associated with an entity (e.g. Project, Team)
     */
    async deleteRoomsByEntity(entityType: 'project' | 'team', entityId: string): Promise<void> {
        const query = entityType === 'project'
            ? { project: new Types.ObjectId(entityId) }
            : { team: new Types.ObjectId(entityId) };

        const rooms = await ChatRoom.find(query);
        for (const room of rooms) {
            await this.performRoomDeletion(room._id.toString());
        }
    }

    /**
     * Internal implementation of room deletion
     */
    private async performRoomDeletion(roomId: string): Promise<void> {
        // Delete all messages first
        await Message.deleteMany({ chatRoom: new Types.ObjectId(roomId) });
        await ChatRoom.findByIdAndDelete(roomId);

        // Emit real-time update
        if (this.socketService) {
            this.socketService.emitToChatRoom(roomId, 'chat:room:deleted', { roomId });
        }
    }

    /**
     * Sync user to all relevant chat rooms in a workshop
     */
    async syncUserToWorkshopRooms(userId: string, workshopId: string): Promise<void> {
        const uId = new Types.ObjectId(userId);
        const workshopObjectId = new Types.ObjectId(workshopId);

        // 1. Check if user is still an active workshop member
        const MembershipModel = require('../models/Membership').Membership;
        const membership = await MembershipModel.findOne({
            workshop: workshopObjectId,
            user: uId,
            state: 'active'
        });

        const WorkshopModel = require('../models/Workshop').Workshop;
        const workshop = await WorkshopModel.findById(workshopObjectId);

        if (!membership) {
            // Even if not an active member, if they are the owner, they keep special access
            const isOwner = workshop && workshop.owner.toString() === userId;
            if (!isOwner) {
                await this.syncUserRemovalFromWorkshopRooms(userId, workshopId);
                return;
            }
        }

        const isOwner = workshop && workshop.owner.toString() === userId;

        if (isOwner) {
            // Owner is automatically added to all non-direct rooms
            await ChatRoom.updateMany(
                {
                    workshop: workshopObjectId,
                    roomType: { $ne: ChatRoomType.DIRECT }
                },
                { $addToSet: { participants: uId } }
            );
        }

        // 2. Handle Workshop (General) rooms - ensure user is in
        await ChatRoom.updateMany(
            { workshop: workshopObjectId, roomType: ChatRoomType.WORKSHOP },
            { $addToSet: { participants: uId } }
        );

        // 3. Re-sync Team and Project rooms
        // First, remove user from all Team and Project rooms to strictly enforce current state
        await ChatRoom.updateMany(
            {
                workshop: workshopObjectId,
                roomType: { $in: [ChatRoomType.TEAM, ChatRoomType.PROJECT] }
            },
            { $pull: { participants: uId } }
        );

        // 4. Add user to Team rooms they belong to
        const TeamModel = require('../models/Team').Team;
        const teams = await TeamModel.find({ workshop: workshopObjectId, members: uId });
        if (teams.length > 0) {
            const teamIds = teams.map((t: any) => t._id);
            await ChatRoom.updateMany(
                { workshop: workshopObjectId, roomType: ChatRoomType.TEAM, team: { $in: teamIds } },
                { $addToSet: { participants: uId } }
            );
        }

        // 5. Add user to Project rooms they are assigned to (direct or via team)
        const ProjectModel = require('../models/WorkshopProject').WorkshopProject;
        const projects = await ProjectModel.find({
            workshop: workshopObjectId,
            $or: [
                { assignedIndividuals: uId },
                { projectManager: uId },
                { maintainers: uId },
                { assignedTeams: { $in: teams.map((t: any) => t._id) } }
            ]
        });
        if (projects.length > 0) {
            const projectIds = projects.map((p: any) => p._id);
            await ChatRoom.updateMany(
                { workshop: workshopObjectId, roomType: ChatRoomType.PROJECT, project: { $in: projectIds } },
                { $addToSet: { participants: uId } }
            );
        }

        // Notify frontend that user's rooms might have changed
        if (this.socketService) {
            this.socketService.emitToUser(userId, 'chat:rooms:sync', { workshopId });
        }
    }

    /**
     * Remove user from all relevant chat rooms in a workshop (except direct messages)
     */
    async syncUserRemovalFromWorkshopRooms(userId: string, workshopId: string): Promise<void> {
        const uId = new Types.ObjectId(userId);
        await ChatRoom.updateMany(
            {
                workshop: new Types.ObjectId(workshopId),
                roomType: { $ne: ChatRoomType.DIRECT }
            },
            { $pull: { participants: uId } }
        );
    }

    /**
     * Send a message
     */
    async sendMessage(roomId: string, senderId: string, data: SendMessageData): Promise<IMessage> {
        // Verify room exists and user is participant
        const chatRoom = await this.getChatRoom(roomId);
        if (!chatRoom.participants.some(p => this.getIdString(p) === senderId)) {
            throw new AuthorizationError('You are not a participant of this chat room');
        }

        // Create message
        const message = await Message.create({
            chatRoom: new Types.ObjectId(roomId),
            sender: new Types.ObjectId(senderId),
            messageType: data.messageType,
            content: data.content,
            fileName: data.fileName,
            fileSize: data.fileSize,
            mimeType: data.mimeType,
            duration: data.duration,
            replyTo: data.replyTo ? new Types.ObjectId(data.replyTo) : undefined,
            seenBy: [{ user: new Types.ObjectId(senderId), seenAt: new Date() }]
        });

        // Update chat room's last message
        await ChatRoom.findByIdAndUpdate(roomId, {
            lastMessage: message._id,
            lastMessageAt: message.createdAt
        });

        // Log activity
        await this.activityService.logActivity({
            workshop: this.getIdString(chatRoom.workshop),
            user: this.getIdString(senderId),
            action: ActivityAction.CREATED,
            entityType: ActivityEntityType.MESSAGE,
            entityId: message._id.toString(),
            entityName: chatRoom.name,
            description: `Sent a ${data.messageType} message in ${chatRoom.name}`
        });

        return message.populate(['sender', 'replyTo']);
    }

    /**
     * Get messages with pagination
     */
    async getMessages(
        roomId: string,
        userId: string,
        page: number = 1,
        limit: number = 50
    ): Promise<{ messages: IMessage[]; total: number; hasMore: boolean }> {
        // Verify user is participant
        const chatRoom = await this.getChatRoom(roomId);
        if (!chatRoom.participants.some(p => this.getIdString(p) === userId)) {
            throw new AuthorizationError('You are not a participant of this chat room');
        }

        const skip = (page - 1) * limit;

        const [messages, total] = await Promise.all([
            Message.find({
                chatRoom: new Types.ObjectId(roomId),
                isDeleted: false
            })
                .populate(['sender', 'replyTo', 'seenBy.user'])
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            Message.countDocuments({
                chatRoom: new Types.ObjectId(roomId),
                isDeleted: false
            })
        ]);

        return {
            messages: messages.reverse(), // Reverse to show oldest first
            total,
            hasMore: skip + messages.length < total
        };
    }

    /**
     * Mark message as seen
     */
    async markMessageAsSeen(messageId: string, userId: string): Promise<IMessage> {
        const message = await Message.findById(messageId);
        if (!message) {
            throw new NotFoundError('Message');
        }

        // Check if already seen
        const alreadySeen = message.seenBy.some(s => s.user.toString() === userId);
        if (alreadySeen) {
            return message;
        }

        // Add to seenBy
        message.seenBy.push({
            user: new Types.ObjectId(userId),
            seenAt: new Date()
        });

        await message.save();
        return message.populate(['sender', 'seenBy.user']);
    }

    /**
     * Mark all messages in room as seen
     */
    async markAllMessagesAsSeen(roomId: string, userId: string): Promise<void> {
        await Message.updateMany(
            {
                chatRoom: new Types.ObjectId(roomId),
                'seenBy.user': { $ne: new Types.ObjectId(userId) }
            },
            {
                $push: {
                    seenBy: {
                        user: new Types.ObjectId(userId),
                        seenAt: new Date()
                    }
                }
            }
        );
    }

    /**
     * Edit message
     */
    async editMessage(messageId: string, userId: string, newContent: string): Promise<IMessage> {
        const message = await Message.findById(messageId);
        if (!message) {
            throw new NotFoundError('Message');
        }

        if (message.sender.toString() !== userId) {
            throw new AuthorizationError('You can only edit your own messages');
        }

        if (message.messageType !== MessageType.TEXT) {
            throw new ValidationError('Only text messages can be edited');
        }

        message.content = newContent;
        message.isEdited = true;
        message.editedAt = new Date();

        await message.save();
        return message.populate(['sender', 'seenBy.user']);
    }

    /**
     * Delete message (soft delete)
     */
    async deleteMessage(messageId: string, userId: string): Promise<void> {
        const message = await Message.findById(messageId).populate('chatRoom');
        if (!message) {
            throw new NotFoundError('Message');
        }

        const chatRoom = message.chatRoom as any;
        const isAdmin = chatRoom.admins.some((admin: any) => this.getIdString(admin) === userId);
        const isOwner = this.getIdString(message.sender) === userId;

        if (!isOwner && !isAdmin) {
            throw new AuthorizationError('You can only delete your own messages or you must be a room admin');
        }

        message.isDeleted = true;
        message.deletedAt = new Date();
        message.content = 'This message has been deleted';

        await message.save();
    }

    /**
     * Add reaction to message
     */
    async addReaction(messageId: string, userId: string, emoji: string): Promise<IMessage> {
        const message = await Message.findById(messageId);
        if (!message) {
            throw new NotFoundError('Message');
        }

        // Check if user already reacted with this emoji
        const existingReaction = message.reactions.find(
            r => this.getIdString(r.user) === userId && r.emoji === emoji
        );

        if (existingReaction) {
            return message;
        }

        message.reactions.push({
            user: new Types.ObjectId(userId),
            emoji,
            createdAt: new Date()
        });

        await message.save();
        return message.populate(['sender', 'reactions.user']);
    }

    /**
     * Remove reaction from message
     */
    async removeReaction(messageId: string, userId: string, emoji: string): Promise<IMessage> {
        const message = await Message.findById(messageId);
        if (!message) {
            throw new NotFoundError('Message');
        }

        message.reactions = message.reactions.filter(
            r => !(this.getIdString(r.user) === userId && r.emoji === emoji)
        );

        await message.save();
        return message.populate(['sender', 'reactions.user']);
    }

    /**
     * Search messages in a room
     */
    async searchMessages(
        roomId: string,
        userId: string,
        query: string,
        page: number = 1,
        limit: number = 20
    ): Promise<{ messages: IMessage[]; total: number }> {
        // Verify user is participant
        const chatRoom = await this.getChatRoom(roomId);
        if (!chatRoom.participants.some(p => this.getIdString(p) === userId)) {
            throw new AuthorizationError('You are not a participant of this chat room');
        }

        const skip = (page - 1) * limit;

        const searchFilter = {
            chatRoom: new Types.ObjectId(roomId),
            isDeleted: false,
            $or: [
                { content: { $regex: query, $options: 'i' } },
                { fileName: { $regex: query, $options: 'i' } }
            ]
        };

        const [messages, total] = await Promise.all([
            Message.find(searchFilter)
                .populate(['sender', 'seenBy.user'])
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            Message.countDocuments(searchFilter)
        ]);

        return { messages, total };
    }

    /**
     * Get unread message count for user in a room
     */
    async getUnreadCount(roomId: string, userId: string): Promise<number> {
        return Message.countDocuments({
            chatRoom: new Types.ObjectId(roomId),
            isDeleted: false,
            'seenBy.user': { $ne: new Types.ObjectId(userId) }
        });
    }
}
