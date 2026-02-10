
import { Document, Types } from 'mongoose';

export interface IInvitation extends Document {
    token: string;
    email: string;
    workshop: Types.ObjectId;
    role?: Types.ObjectId;
    invitedBy: Types.ObjectId;
    expiresAt: Date;
    isUsed: boolean;
    createdAt: Date;
    updatedAt: Date;
}
