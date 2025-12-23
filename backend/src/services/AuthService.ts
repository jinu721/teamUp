import bcrypt from 'bcryptjs';
import { UserRepository } from '../repositories/UserRepository';
import { generateToken } from '../config/jwt';
import { AuthenticationError, ValidationError } from '../utils/errorHandler';

export class AuthService {
  private userRepository: UserRepository;

  constructor() {
    this.userRepository = new UserRepository();
  }

  async register(name: string, email: string, password: string): Promise<{ user: any; token: string }> {
    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser) {
      throw new ValidationError('Email already registered');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await this.userRepository.create({
      name,
      email,
      password: hashedPassword,
      skills: [],
      interests: [],
      isOnline: false,
      lastActive: new Date()
    } as any);

    const token = generateToken({ id: user._id.toString(), email: user.email });

    const userResponse = user.toObject();
    delete userResponse.password;

    return { user: userResponse, token };
  }

  async login(email: string, password: string): Promise<{ user: any; token: string }> {
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new AuthenticationError('Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new AuthenticationError('Invalid email or password');
    }

    await this.userRepository.updatePresence(user._id.toString(), true);

    const token = generateToken({ id: user._id.toString(), email: user.email });

    const userResponse = user.toObject();
    delete userResponse.password;

    return { user: userResponse, token };
  }

  async getProfile(userId: string): Promise<any> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new AuthenticationError('User not found');
    }
    return user;
  }
}
