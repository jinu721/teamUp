import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errorHandler';

export const errorHandler = (
  err: Error | AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      statusCode: err.statusCode
    });
    return;
  }

  console.error('Unexpected error:', err);

  res.status(500).json({
    success: false,
    message: 'Internal server error',
    statusCode: 500
  });
};
