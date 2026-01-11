import { Response, NextFunction, Request } from 'express';
import { verifyToken } from '../config/jwt';
import { AuthenticationError } from '../utils/errors';

export const authenticate = (req: Request, _res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(new AuthenticationError('No token provided'));
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return next(new AuthenticationError('No token provided'));
    }

    const decoded = verifyToken(token);

    (req as any).user = {
      id: decoded.id,
      email: decoded.email
    };

    next();
  } catch (error) {
    next(new AuthenticationError('Invalid or expired token'));
  }
};

/**
 * Optional authentication - doesn't fail if no token provided
 * Sets req.user if valid token exists, otherwise continues without user
 */
export const optionalAuthenticate = (req: Request, _res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers['authorization'];

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = verifyToken(token);
      (req as any).user = {
        id: decoded.id,
        email: decoded.email
      };
    }

    next();
  } catch (error) {
    // Token invalid but continue anyway (optional auth)
    next();
  }
};
