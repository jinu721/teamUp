import { Response, NextFunction } from 'express';
import { AuthService } from '../services/AuthService';
import { AuthRequest } from '../types';
import { ValidationError } from '../utils/errorHandler';

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

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

      res.status(201).json({
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
}
