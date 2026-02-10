import { IChatRoom, IMessage } from '../types/index';
import { CreateChatRoomData, SendMessageData } from '../types/index';
import { ISocketService } from '../../../shared/interfaces/ISocketService';

export interface IChatService {
    setSocketService(socketService: ISocketService): void;
    createChatRoom(data: CreateChatRoomData): Promise<IChatRoom>;
    getChatRoom(roomId: string): Promise<IChatRoom>;
    getUserChatRooms(userId: string, workshopId: string): Promise<IChatRoom[]>;
    syncAllWorkshopMembers(workshopId: string): Promise<void>;
    getOrCreateDirectRoom(workshopId: string, user1Id: string, user2Id: string): Promise<IChatRoom>;
    updateChatRoom(roomId: string, userId: string, data: Partial<{ name: string; description: string }>): Promise<IChatRoom>;
    deleteChatRoom(roomId: string, userId: string): Promise<void>;
    deleteRoomsByEntity(entityType: 'project' | 'team', entityId: string): Promise<void>;
    syncUserToWorkshopRooms(userId: string, workshopId: string): Promise<void>;
    syncUserRemovalFromWorkshopRooms(userId: string, workshopId: string): Promise<void>;
    sendMessage(roomId: string, senderId: string, data: SendMessageData): Promise<IMessage>;
    getMessages(roomId: string, userId: string, page?: number, limit?: number): Promise<{ messages: IMessage[]; total: number; hasMore: boolean }>;
    markMessageAsSeen(messageId: string, userId: string): Promise<IMessage>;
    markAllMessagesAsSeen(roomId: string, userId: string): Promise<void>;
    editMessage(messageId: string, userId: string, newContent: string): Promise<IMessage>;
    deleteMessage(messageId: string, userId: string): Promise<void>;
    addReaction(messageId: string, userId: string, emoji: string): Promise<IMessage>;
    removeReaction(messageId: string, userId: string, emoji: string): Promise<IMessage>;
    searchMessages(roomId: string, userId: string, query: string, page?: number, limit?: number): Promise<{ messages: IMessage[]; total: number }>;
    getUnreadCount(roomId: string, userId: string): Promise<number>;
}
