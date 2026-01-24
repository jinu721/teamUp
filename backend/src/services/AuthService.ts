import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { UserRepository } from '../repositories/UserRepository';
import { PendingUserRepository } from '../repositories/PendingUserRepository';
import { PasswordResetRepository } from '../repositories/PasswordResetRepository';
import { generateToken, generateRefreshToken, verifyRefreshToken } from '../config/jwt';
import { AuthenticationError, ValidationError, NotFoundError } from '../utils/errors';
import { sendEmail } from '../utils/emailService';

export class AuthService {
  private userRepository: UserRepository;
  private pendingUserRepository: PendingUserRepository;
  private passwordResetRepository: PasswordResetRepository;

  constructor() {
    this.userRepository = new UserRepository();
    this.pendingUserRepository = new PendingUserRepository();
    this.passwordResetRepository = new PasswordResetRepository();
  }

  async register(name: string, email: string, password: string): Promise<{ message: string }> {
    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser) {
      throw new ValidationError('Email already registered');
    }

    const existingPending = await this.pendingUserRepository.findByEmail(email);
    if (existingPending) {

      const hashedPassword = await bcrypt.hash(password, 10);
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

      existingPending.name = name;
      existingPending.password = hashedPassword;
      existingPending.otp = otp;
      existingPending.otpExpires = otpExpires;
      await existingPending.save();

      await this.sendVerificationOTP(email, otp);
      return { message: 'Verification code re-sent. Please check your email.' };
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

    await this.pendingUserRepository.create({
      name,
      email,
      password: hashedPassword,
      otp,
      otpExpires
    } as any);

    await this.sendVerificationOTP(email, otp);

    return { message: 'Registration successful. Please check your email for the verification code.' };
  }

  private async sendVerificationOTP(email: string, otp: string) {
    const emailHtml = `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h1 style="color: #333 text-align: center;">Welcome to Team Up!</h1>
        <p>Your verification code is:</p>
        <div style="text-align: center; margin: 30px 0;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #007bff; background: #f0f7ff; padding: 10px 20px; border-radius: 5px; border: 1px dashed #007bff;">${otp}</span>
        </div>
        <p style="text-align: center; color: #666;">This code will expire in 10 minutes.</p>
        <p style="color: #777; font-size: 12px; margin-top: 30px; text-align: center;">If you didn't request this, please ignore this email.</p>
      </div>
    `;

    await sendEmail(email, 'Your Verification Code - Team Up', emailHtml);
  }

  async verifyOTP(email: string, otp: string): Promise<{ user: any; token: string; refreshToken: string }> {
    const pendingUser = await this.pendingUserRepository.findByEmail(email);

    if (!pendingUser) {
      throw new ValidationError('Registration not found or expired');
    }

    if (pendingUser.otp !== otp) {
      throw new ValidationError('Invalid verification code');
    }

    if (new Date() > pendingUser.otpExpires) {
      throw new ValidationError('Verification code has expired');
    }

    const newUser = await this.userRepository.create({
      name: pendingUser.name,
      email: pendingUser.email,
      password: pendingUser.password,
      isVerified: true,
      skills: [],
      interests: [],
      isOnline: true,
      lastActive: new Date(),
    } as any);

    await this.pendingUserRepository.deleteById(pendingUser._id.toString());

    const authToken = generateToken({ id: newUser._id.toString(), email: newUser.email });
    const refreshToken = generateRefreshToken({ id: newUser._id.toString(), email: newUser.email });

    const userResponse = JSON.parse(JSON.stringify(newUser));
    delete userResponse.password;

    return { user: userResponse, token: authToken, refreshToken };
  }

  async resendOTP(email: string): Promise<{ message: string }> {
    const pendingUser = await this.pendingUserRepository.findByEmail(email);
    if (!pendingUser) {
      throw new ValidationError('Registration not found or expired. Please register again.');
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

    pendingUser.otp = otp;
    pendingUser.otpExpires = otpExpires;
    await pendingUser.save();

    await this.sendVerificationOTP(email, otp);
    return { message: 'New verification code sent to your email.' };
  }

  async login(email: string, password: string): Promise<{ user: any; token: string; refreshToken: string }> {
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new ValidationError('Invalid email or password');
    }

    if (!user.isVerified) {
      throw new ValidationError('Please verify your email before logging in.');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new ValidationError('Invalid email or password');
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

    const email = profile.emails?.[0]?.value;
    if (email) {
      user = await this.userRepository.findByEmail(email);
      if (user) {

        (user as any)[idField] = profile.id;
        if (!user.isVerified) user.isVerified = true;
        await user.save();
        return user;
      }
    }

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

  async updateProfile(userId: string, data: any): Promise<any> {
    const allowedFields = ['name', 'profilePhoto', 'skills', 'interests'];
    const updates: any = {};

    allowedFields.forEach(field => {
      if (data[field] !== undefined) {
        updates[field] = data[field];
      }
    });

    const user = await this.userRepository.update(userId, updates);
    if (!user) {
      throw new AuthenticationError('User not found');
    }

    return user;
  }

  async forgotPassword(email: string): Promise<{ message: string }> {
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new NotFoundError('No account found with this email address');
    }

    await this.passwordResetRepository.deleteByEmail(email);

    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await this.passwordResetRepository.create({
      email,
      token: resetToken,
      expiresAt
    });

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    
    const emailHtml = `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h1 style="color: #333; text-align: center;">Reset Your Password</h1>
        <p>Hi ${user.name},</p>
        <p>You requested to reset your password for your Team Up account. Click the button below to reset it:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Reset Password</a>
        </div>
        <p style="color: #666;">This link will expire in 1 hour for security reasons.</p>
        <p style="color: #666;">If you didn't request this password reset, please ignore this email.</p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #777; font-size: 12px; text-align: center;">
          If the button doesn't work, copy and paste this link into your browser:<br>
          <a href="${resetUrl}" style="color: #007bff;">${resetUrl}</a>
        </p>
      </div>
    `;

    await sendEmail(email, 'Reset Your Password - Team Up', emailHtml);

    return { message: 'Password reset link has been sent to your email' };
  }

  async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    const passwordReset = await this.passwordResetRepository.findByToken(token);
    if (!passwordReset) {
      throw new ValidationError('Invalid or expired password reset token');
    }

    const user = await this.userRepository.findByEmail(passwordReset.email);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.userRepository.update(user._id.toString(), { password: hashedPassword });

    await this.passwordResetRepository.markAsUsed(token);

    return { message: 'Password has been reset successfully' };
  }
}