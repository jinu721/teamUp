
import { Document, Types } from 'mongoose';

export interface IUser extends Document {
    _id: Types.ObjectId;
    name: string;
    email: string;
    password: string;
    profilePhoto?: string;
    skills: string[];
    interests: string[];
    isOnline: boolean;
    lastActive: Date;
    createdAt: Date;
    updatedAt: Date;
    isVerified?: boolean;
    verificationToken?: string;
    googleId?: string;
    githubId?: string;
}
