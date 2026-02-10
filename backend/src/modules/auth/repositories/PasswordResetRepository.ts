import { PasswordReset, IPasswordReset } from '../models/PasswordReset';

export class PasswordResetRepository {
    async create(data: Partial<IPasswordReset>): Promise<IPasswordReset> {
        const passwordReset = new PasswordReset(data);
        return await passwordReset.save();
    }

    async findByToken(token: string): Promise<IPasswordReset | null> {
        return await PasswordReset.findOne({ 
            token, 
            used: false, 
            expiresAt: { $gt: new Date() } 
        });
    }

    async findByEmail(email: string): Promise<IPasswordReset | null> {
        return await PasswordReset.findOne({ 
            email, 
            used: false, 
            expiresAt: { $gt: new Date() } 
        });
    }

    async markAsUsed(token: string): Promise<IPasswordReset | null> {
        return await PasswordReset.findOneAndUpdate(
            { token },
            { used: true },
            { new: true }
        );
    }

    async deleteByEmail(email: string): Promise<void> {
        await PasswordReset.deleteMany({ email });
    }
}