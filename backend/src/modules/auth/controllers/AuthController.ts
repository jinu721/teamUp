import { Response, NextFunction } from 'express';
import { IAuthService } from '../interfaces/IAuthService';
import { AuthRequest } from '../../../shared/types/index';
import { ValidationError } from '../../../shared/utils/errors';
import passport from 'passport';
import { isStrategyEnabled } from '../../../config/passport';

export class AuthController {
  constructor(private authService: IAuthService) { }

  register = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { name, email, password } = req.body;

      if (!name || !email || !password) {
        throw new ValidationError('Name, email, and password are required');
      }

      if (password.length < 6) {
        throw new ValidationError('Password must be at least 6 characters');
      }

      const result = await this.authService.register(name, email, password);

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  };

  verifyOTP = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email, otp } = req.body;

      if (!email || !otp) {
        throw new ValidationError('Email and verification code are required');
      }

      const result = await this.authService.verifyOTP(email, otp);

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  };

  resendOTP = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email } = req.body;

      if (!email) {
        throw new ValidationError('Email is required');
      }

      const result = await this.authService.resendOTP(email);

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  };

  login = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        throw new ValidationError('Email and password are required');
      }

      const result = await this.authService.login(email, password);

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  };

  refreshToken = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        throw new ValidationError('Refresh token is required');
      }

      const result = await this.authService.refreshToken(refreshToken);

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  };

  getProfile = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const user = await this.authService.getProfile(userId);

      res.status(200).json({
        success: true,
        data: user
      });
    } catch (error) {
      next(error);
    }
  };

  updateProfile = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const user = await this.authService.updateProfile(userId, req.body);

      res.status(200).json({
        success: true,
        data: user
      });
    } catch (error) {
      next(error);
    }
  };

  forgotPassword = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email } = req.body;

      if (!email) {
        throw new ValidationError('Email is required');
      }

      const result = await this.authService.forgotPassword(email);

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  };

  resetPassword = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { token, password } = req.body;

      if (!token || !password) {
        throw new ValidationError('Token and password are required');
      }

      if (password.length < 6) {
        throw new ValidationError('Password must be at least 6 characters');
      }

      const result = await this.authService.resetPassword(token, password);

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  };

  completeSocialLogin = (req: AuthRequest, res: Response): void => {
    const user = req.user as any;
    const { token, refreshToken } = this.authService.generateTokens(user);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(`${frontendUrl}/social-callback?token=${token}&refreshToken=${refreshToken}`);
  };

  initiateGoogleAuth = (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!isStrategyEnabled('google')) {
      res.status(400).json({
        success: false,
        message: 'Google authentication is not configured. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in the backend .env file.'
      });
      return;
    }
    passport.authenticate('google', { scope: ['profile', 'email'] })(req, res, next);
  };

  handleGoogleCallback = (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!isStrategyEnabled('google')) {
      res.redirect((process.env.FRONTEND_URL || 'http://localhost:3000') + '/login?error=google_not_configured');
      return;
    }
    passport.authenticate('google', { session: false, failureRedirect: '/login' })(req, res, next);
  };

  initiateGithubAuth = (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!isStrategyEnabled('github')) {
      res.status(400).json({
        success: false,
        message: 'GitHub authentication is not configured. Please set GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET in the backend .env file.'
      });
      return;
    }
    passport.authenticate('github', { scope: ['user:email'] })(req, res, next);
  };

  handleGithubCallback = (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!isStrategyEnabled('github')) {
      res.redirect((process.env.FRONTEND_URL || 'http://localhost:3000') + '/login?error=github_not_configured');
      return;
    }
    passport.authenticate('github', { session: false, failureRedirect: '/login' })(req, res, next);
  };
}