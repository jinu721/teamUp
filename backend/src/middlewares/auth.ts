import { Response, NextFunction } from 'express';
import { verifyToken } from '../config/jwt';
import { AuthRequest } from '../types';
import { AuthenticationError } from '../utils/errorHandler';

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AuthenticationError('No token provided');
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    req.user = {
      id: decoded.id,
      email: decoded.email
    };

    next();
  } catch (error) {
    next(new AuthenticationError('Invalid or expired token'));
  }
};
