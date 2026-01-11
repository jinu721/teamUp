import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { UserRepository } from '../repositories/UserRepository';
import { generateToken, generateRefreshToken, verifyRefreshToken } from '../config/jwt';
import { AuthenticationError, ValidationError } from '../utils/errorHandler';
import { sendEmail } from '../utils/emailService';

export class AuthService {
  private userRepository: UserRepository;

  constructor() {
    this.userRepository = new UserRepository();
  }

  async register(name: string, email: string, password: string): Promise<{ message: string }> {
    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser) {
      throw new ValidationError('Email already registered');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationToken = crypto.randomBytes(32).toString('hex');

    await this.userRepository.create({
      name,
      email,
      password: hashedPassword,
      skills: [],
      interests: [],
      isOnline: false,
      lastActive: new Date(),
      isVerified: false,
      verificationToken
    } as any);

    const verificationLink = `http://localhost:3000/verify-email?token=${verificationToken}`;

    const emailHtml = `
      <h1>Welcome to Team Up!</h1>
      <p>Please verify your email address by clicking the link below:</p>
      <a href="${verificationLink}">${verificationLink}</a>
      <p>If you didn't request this, please ignore this email.</p>
    `;

    await sendEmail(email, 'Verify your email - Team Up', emailHtml);

    return { message: 'Registration successful. Please check your email to verify your account.' };
  }

  async verifyEmail(token: string): Promise<{ user: any; token: string; refreshToken: string }> {
    const user = await this.userRepository.findByVerificationToken(token);

    if (!user) {
      throw new ValidationError('Invalid or expired verification token');
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    await user.save();

    await this.userRepository.updatePresence(user._id.toString(), true);

    const authToken = generateToken({ id: user._id.toString(), email: user.email });
    const refreshToken = generateRefreshToken({ id: user._id.toString(), email: user.email });

    const userResponse = JSON.parse(JSON.stringify(user));
    delete userResponse.password;
    delete userResponse.verificationToken;

    return { user: userResponse, token: authToken, refreshToken };
  }

  async login(email: string, password: string): Promise<{ user: any; token: string; refreshToken: string }> {
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new AuthenticationError('Invalid email or password');
    }

    if (!user.isVerified) {
      throw new AuthenticationError('Please verify your email before logging in.');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new AuthenticationError('Invalid email or password');
    }

    await this.userRepository.updatePresence(user._id.toString(), true);

    const token = generateToken({ id: user._id.toString(), email: user.email });
    const refreshToken = generateRefreshToken({ id: user._id.toString(), email: user.email });

    const userResponse = JSON.parse(JSON.stringify(user));
    delete userResponse.password;

    return { user: userResponse, token, refreshToken };
  }

  async refreshToken(token: string): Promise<{ token: string }> {
    try {
      const decoded = verifyRefreshToken(token);
      const user = await this.userRepository.findById(decoded.id);

      if (!user) {
        throw new AuthenticationError('User not found');
      }

      const newToken = generateToken({ id: user._id.toString(), email: user.email });
      return { token: newToken };
    } catch (error) {
      throw new AuthenticationError('Invalid or expired refresh token');
    }
  }

  async getProfile(userId: string): Promise<any> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new AuthenticationError('User not found');
    }
    return user;
  }
}
