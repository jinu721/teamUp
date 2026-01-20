import mongoose, { Schema } from 'mongoose';
import { IPendingUser } from '../types';

const pendingUserSchema = new Schema<IPendingUser>(
    {
        name: {
            type: String,
            required: [true, 'Name is required'],
            trim: true
        },
        email: {
            type: String,
            required: [true, 'Email is required'],
            unique: true,
            lowercase: true,
            trim: true,
            match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
        },
        password: {
            type: String,
            required: [true, 'Password is required']
        },
        otp: {
            type: String,
            required: true
        },
        otpExpires: {
            type: Date,
            required: true
        },
        createdAt: {
            type: Date,
            default: Date.now,
            index: { expires: '2h' } // Automatically delete after 2 hours
        }
    },
    {
        timestamps: true
    }
);

export const PendingUser = mongoose.model<IPendingUser>('PendingUser', pendingUserSchema);
