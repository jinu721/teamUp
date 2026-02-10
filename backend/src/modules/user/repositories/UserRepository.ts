import { User } from '../models/User';
import { IUser } from '../types/index';
import { Types } from 'mongoose';
import { IUserRepository } from '../interfaces/IUserRepository';

export class UserRepository implements IUserRepository {
  async create(userData: Partial<IUser>): Promise<IUser> {
    const user = new User(userData);
    return await user.save();
  }

  async findById(id: string): Promise<IUser | null> {
    return await User.findById(id).select('-password');
  }

  async findByIdWithPassword(id: string): Promise<IUser | null> {
    return await User.findById(id);
  }

  async findByEmail(email: string): Promise<IUser | null> {
    return await User.findOne({ email });
  }

  async findByEmailWithoutPassword(email: string): Promise<IUser | null> {
    return await User.findOne({ email }).select('-password');
  }

  async findByVerificationToken(token: string): Promise<IUser | null> {
    return await User.findOne({ verificationToken: token });
  }

  async findByGoogleId(googleId: string): Promise<IUser | null> {
    return await User.findOne({ googleId });
  }

  async findByGithubId(githubId: string): Promise<IUser | null> {
    return await User.findOne({ githubId });
  }

  async update(id: string, updates: Partial<IUser>): Promise<IUser | null> {
    return await User.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-password');
  }

  async updatePresence(id: string, isOnline: boolean): Promise<IUser | null> {
    return await User.findByIdAndUpdate(
      id,
      {
        $set: {
          isOnline,
          lastActive: new Date()
        }
      },
      { new: true }
    ).select('-password');
  }

  async findMultipleByIds(ids: string[]): Promise<IUser[]> {
    return await User.find({
      _id: { $in: ids.map(id => new Types.ObjectId(id)) }
    }).select('-password');
  }

  async searchBySkills(skills: string[]): Promise<IUser[]> {
    return await User.find({
      skills: { $in: skills }
    }).select('-password').limit(20);
  }
}