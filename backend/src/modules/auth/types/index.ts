
import { Document, Types } from 'mongoose';

export interface IPendingUser extends Document {
    _id: Types.ObjectId;
    name: string;
    email: string;
    password: string;
    otp: string;
    otpExpires: Date;
    createdAt: Date;
}

export interface IPasswordReset extends Document {
    email: string;
    token: string;
    expiresAt: Date;
    used: boolean;
    createdAt: Date;
    updatedAt: Date;
}
