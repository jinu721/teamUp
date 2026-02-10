import { IUser } from '../../../shared/types/index';

export interface IUserRepository {
    create(userData: Partial<IUser>): Promise<IUser>;
    findById(id: string): Promise<IUser | null>;
    findByIdWithPassword(id: string): Promise<IUser | null>;
    findByEmail(email: string): Promise<IUser | null>;
    findByEmailWithoutPassword(email: string): Promise<IUser | null>;
    findByVerificationToken(token: string): Promise<IUser | null>;
    findByGoogleId(googleId: string): Promise<IUser | null>;
    findByGithubId(githubId: string): Promise<IUser | null>;
    update(id: string, updates: Partial<IUser>): Promise<IUser | null>;
    updatePresence(id: string, isOnline: boolean): Promise<IUser | null>;
    findMultipleByIds(ids: string[]): Promise<IUser[]>;
    searchBySkills(skills: string[]): Promise<IUser[]>;
}
