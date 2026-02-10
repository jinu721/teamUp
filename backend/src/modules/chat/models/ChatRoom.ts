import mongoose, { Schema } from 'mongoose';
import { ChatRoomType, IChatRoom, IChatRoomSettings } from '../types/index';

const chatRoomSettingsSchema = new Schema<IChatRoomSettings>({
    allowFileSharing: {
        type: Boolean,
        default: true
    },
    allowAudioMessages: {
        type: Boolean,
        default: true
    },
    maxFileSize: {
        type: Number,
        default: 10 * 1024 * 1024
    }
});

const chatRoomSchema = new Schema<IChatRoom>(
    {
        roomType: {
            type: String,
            enum: Object.values(ChatRoomType),
            required: true,
            index: true
        },
        workshop: {
            type: Schema.Types.ObjectId,
            ref: 'Workshop',
            required: true,
            index: true
        },
        project: {
            type: Schema.Types.ObjectId,
            ref: 'WorkshopProject'
        },
        team: {
            type: Schema.Types.ObjectId,
            ref: 'Team'
        },
        participants: [{
            type: Schema.Types.ObjectId,
            ref: 'User'
        }],
        name: {
            type: String,
            required: true,
            trim: true
        },
        description: {
            type: String,
            trim: true
        },
        lastMessage: {
            type: Schema.Types.ObjectId,
            ref: 'Message'
        },
        lastMessageAt: {
            type: Date
        },
        createdBy: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        admins: [{
            type: Schema.Types.ObjectId,
            ref: 'User'
        }],
        settings: {
            type: chatRoomSettingsSchema,
            default: () => ({})
        }
    },
    {
        timestamps: true
    }
);

chatRoomSchema.index({ workshop: 1, roomType: 1 });
chatRoomSchema.index({ participants: 1, lastMessageAt: -1 });
chatRoomSchema.index({ project: 1 });
chatRoomSchema.index({ team: 1 });

chatRoomSchema.index({ roomType: 1, participants: 1 });

export const ChatRoom = mongoose.model<IChatRoom>('ChatRoom', chatRoomSchema);