import { NextFunction, Request, Response } from 'express';
import { AppError } from '../utils/errors';
import { env } from '../../config/env';

export const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) =>
    (req: Request, res: Response, next: NextFunction) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };

export const errorHandler = (
    err: Error | AppError,
    _req: Request,
    res: Response,
    _next: NextFunction
): void => {
    let statusCode = 500;
    let message = 'Internal Server Error';
    let errors: any[] | undefined;

    if (err instanceof AppError) {
        statusCode = err.statusCode;
        message = err.message;
        // AppError doesn't have errors property in def, ValidationError does details.
        if ('details' in err) {
            errors = [(err as any).details];
        }
    } else if (err instanceof Error) {
        message = err.message;
    }

    // Filter out sensitive error details in production
    if (env.NODE_ENV === 'production' && statusCode === 500) {
        message = 'Internal Server Error';
    }

    const response: any = {
        success: false,
        message,
        ...(errors && { errors }),
        ...(env.NODE_ENV !== 'production' && { stack: (err as Error).stack }),
    };

    res.status(statusCode).json(response);
};
