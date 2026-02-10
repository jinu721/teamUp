import { Document, Types } from 'mongoose';

export enum ChatRoomType {
    WORKSHOP = 'workshop',
    PROJECT = 'project',
    TEAM = 'team',
    DIRECT = 'direct'
}

export interface IChatRoomSettings {
    allowFileSharing: boolean;
    allowAudioMessages: boolean;
    maxFileSize: number;
}

export interface IChatRoom extends Document {
    roomType: ChatRoomType;
    workshop: Types.ObjectId;
    project?: Types.ObjectId;
    team?: Types.ObjectId;
    participants: Types.ObjectId[];
    name: string;
    description?: string;
    lastMessage?: Types.ObjectId;
    lastMessageAt?: Date;
    createdBy: Types.ObjectId;
    admins: Types.ObjectId[];
    settings: IChatRoomSettings;
    createdAt: Date;
    updatedAt: Date;
}

export enum MessageType {
    TEXT = 'text',
    AUDIO = 'audio',
    IMAGE = 'image',
    DOCUMENT = 'document'
}

export interface IMessageReaction {
    user: Types.ObjectId;
    emoji: string;
    createdAt: Date;
}

export interface ISeenBy {
    user: Types.ObjectId;
    seenAt: Date;
}

export interface IMessage extends Document {
    chatRoom: Types.ObjectId;
    sender: Types.ObjectId;
    messageType: MessageType;
    content: string;
    fileName?: string;
    fileSize?: number;
    mimeType?: string;
    duration?: number;
    seenBy: ISeenBy[];
    replyTo?: Types.ObjectId;
    isEdited: boolean;
    editedAt?: Date;
    isDeleted: boolean;
    deletedAt?: Date;
    reactions: IMessageReaction[];
    createdAt: Date;
    updatedAt: Date;
}

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
