import { IPasswordReset } from '../models/PasswordReset';

export interface IPasswordResetRepository {
    create(data: Partial<IPasswordReset>): Promise<IPasswordReset>;
    findByToken(token: string): Promise<IPasswordReset | null>;
    findByEmail(email: string): Promise<IPasswordReset | null>;
    markAsUsed(token: string): Promise<IPasswordReset | null>;
    deleteByEmail(email: string): Promise<void>;
}
