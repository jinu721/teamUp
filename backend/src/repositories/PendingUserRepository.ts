import { PendingUser } from '../models/PendingUser';
import { IPendingUser } from '../types';

export class PendingUserRepository {
    async create(userData: Partial<IPendingUser>): Promise<IPendingUser> {
        const pendingUser = new PendingUser(userData);
        return await pendingUser.save();
    }

    async findByEmail(email: string): Promise<IPendingUser | null> {
        return await PendingUser.findOne({ email });
    }

    async findByOTP(otp: string): Promise<IPendingUser | null> {
        return await PendingUser.findOne({ otp });
    }

    async deleteById(id: string): Promise<void> {
        await PendingUser.findByIdAndDelete(id);
    }
}
