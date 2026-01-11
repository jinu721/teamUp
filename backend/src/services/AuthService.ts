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

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const verificationLink = `${frontendUrl}/verify-email?token=${verificationToken}`;

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

  async socialLogin(profile: any, type: 'google' | 'github'): Promise<any> {
    const idField = type === 'google' ? 'googleId' : 'githubId';
    let user = type === 'google'
      ? await this.userRepository.findByGoogleId(profile.id)
      : await this.userRepository.findByGithubId(profile.id);

    if (user) {
      return user;
    }

    // Check by email
    const email = profile.emails?.[0]?.value;
    if (email) {
      user = await this.userRepository.findByEmail(email);
      if (user) {
        // Link account
        (user as any)[idField] = profile.id;
        if (!user.isVerified) user.isVerified = true;
        await user.save();
        return user;
      }
    }

    // Create new user
    const dummyPassword = crypto.randomBytes(32).toString('hex');
    const hashedPassword = await bcrypt.hash(dummyPassword, 10);

    const userData: any = {
      name: profile.displayName || profile.username || 'User',
      email: email || `${profile.id}@${type}.com`,
      password: hashedPassword,
      isVerified: true,
      profilePhoto: profile.photos?.[0]?.value || '',
      skills: [],
      interests: [],
      isOnline: true,
      lastActive: new Date()
    };
    userData[idField] = profile.id;

    user = await this.userRepository.create(userData);
    return user;
  }
}
