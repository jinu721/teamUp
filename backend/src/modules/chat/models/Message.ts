import mongoose, { Schema } from 'mongoose';
import { MessageType, IMessage, ISeenBy, IMessageReaction } from '../types/index';

const messageReactionSchema = new Schema<IMessageReaction>({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    emoji: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const seenBySchema = new Schema<ISeenBy>({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    seenAt: {
        type: Date,
        default: Date.now
    }
});

const messageSchema = new Schema<IMessage>(
    {
        chatRoom: {
            type: Schema.Types.ObjectId,
            ref: 'ChatRoom',
            required: true,
            index: true
        },
        sender: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true
        },
        messageType: {
            type: String,
            enum: Object.values(MessageType),
            required: true,
            default: MessageType.TEXT
        },
        content: {
            type: String,
            required: true
        },
        fileName: {
            type: String
        },
        fileSize: {
            type: Number
        },
        mimeType: {
            type: String
        },
        duration: {
            type: Number
        },
        seenBy: [seenBySchema],
        replyTo: {
            type: Schema.Types.ObjectId,
            ref: 'Message'
        },
        isEdited: {
            type: Boolean,
            default: false
        },
        editedAt: {
            type: Date
        },
        isDeleted: {
            type: Boolean,
            default: false
        },
        deletedAt: {
            type: Date
        },
        reactions: [messageReactionSchema]
    },
    {
        timestamps: true
    }
);

messageSchema.index({ chatRoom: 1, createdAt: -1 });
messageSchema.index({ sender: 1, createdAt: -1 });
messageSchema.index({ chatRoom: 1, isDeleted: 1, createdAt: -1 });

export const Message = mongoose.model<IMessage>('Message', messageSchema);