import mongoose, { Schema } from 'mongoose';
import { IInvitation } from '../types/index';

const invitationSchema = new Schema<IInvitation>(
    {
        token: {
            type: String,
            required: true,
            unique: true
        },
        email: {
            type: String,
            required: true,
            lowercase: true,
            trim: true
        },
        workshop: {
            type: Schema.Types.ObjectId,
            ref: 'Workshop',
            required: true
        },
        role: {
            type: Schema.Types.ObjectId,
            ref: 'Role'
        },
        invitedBy: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        expiresAt: {
            type: Date,
            required: true,
            default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
        },
        isUsed: {
            type: Boolean,
            default: false
        }
    },
    {
        timestamps: true
    }
);

invitationSchema.index({ email: 1, workshop: 1 });
invitationSchema.index({ token: 1 });

export const Invitation = mongoose.model<IInvitation>('Invitation', invitationSchema);
