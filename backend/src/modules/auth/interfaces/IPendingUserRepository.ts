import { IPendingUser } from '../types/index';

export interface IPendingUserRepository {
    create(userData: Partial<IPendingUser>): Promise<IPendingUser>;
    findByEmail(email: string): Promise<IPendingUser | null>;
    findByOTP(otp: string): Promise<IPendingUser | null>;
    deleteById(id: string): Promise<void>;
}
