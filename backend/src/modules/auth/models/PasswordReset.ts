import mongoose, { Schema, Document } from 'mongoose';

export interface IPasswordReset extends Document {
    email: string;
    token: string;
    expiresAt: Date;
    used: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const passwordResetSchema = new Schema<IPasswordReset>(
    {
        email: {
            type: String,
            required: true,
            lowercase: true,
            trim: true
        },
        token: {
            type: String,
            required: true,
            unique: true
        },
        expiresAt: {
            type: Date,
            required: true
        },
        used: {
            type: Boolean,
            default: false
        }
    },
    {
        timestamps: true
    }
);

passwordResetSchema.index({ email: 1 });
passwordResetSchema.index({ token: 1 });
passwordResetSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const PasswordReset = mongoose.model<IPasswordReset>('PasswordReset', passwordResetSchema);