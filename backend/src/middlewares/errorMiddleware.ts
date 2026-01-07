import { Request, Response, NextFunction } from 'express';
import { Error as MongooseError } from 'mongoose';
import {
  AppError,
  ValidationError,
  AuthenticationError,
  NotFoundError,
  ConflictError,
  InternalServerError,
  isOperationalError
} from '../utils/errors';

/**
 * Error Response Interface
 */
interface ErrorResponse {
  success: false;
  message: string;
  code?: string;
  details?: any;
  stack?: string;
}

/**
 * Handle Mongoose Validation Errors
 */
function handleMongooseValidationError(err: MongooseError.ValidationError): ValidationError {
  const errors = Object.values(err.errors).map(error => ({
    field: error.path,
    message: error.message,
    value: (error as any).value
  }));

  // Create a user-friendly message
  if (errors.length === 1) {
    const error = errors[0];
    return new ValidationError(error.message, { errors });
  } else {
    const fieldMessages = errors.map(e => `${e.field}: ${e.message}`).join(', ');
    return new ValidationError(`Validation failed: ${fieldMessages}`, { errors });
  }
}

/**
 * Handle Mongoose Cast Errors (invalid ObjectId)
 */
function handleMongooseCastError(err: MongooseError.CastError): ValidationError {
  return new ValidationError(`Invalid ${err.path}: ${err.value}`);
}

/**
 * Handle Mongoose Duplicate Key Errors
 */
function handleMongooseDuplicateKeyError(err: any): ConflictError {
  const fields = Object.keys(err.keyPattern);

  if (fields.length > 1) {
    // Handle compound index (e.g., workshop + user)
    return new ConflictError(`This combination of ${fields.join(' and ')} already exists`);
  }

  const field = fields[0];
  const value = err.keyValue[field];
  return new ConflictError(`${field} '${value}' already exists`);
}

/**
 * Handle JWT Errors
 */
function handleJWTError(): AuthenticationError {
  return new AuthenticationError('Invalid token. Please log in again');
}

function handleJWTExpiredError(): AuthenticationError {
  return new AuthenticationError('Your token has expired. Please log in again');
}

/**
 * Sanitize error message to prevent sensitive information leakage
 */
function sanitizeErrorMessage(message: string): string {
  // Remove any potential sensitive patterns
  const sensitivePatterns = [
    /password/gi,
    /token/gi,
    /secret/gi,
    /key/gi,
    /mongodb:\/\//gi,
    /connection string/gi
  ];

  let sanitized = message;
  sensitivePatterns.forEach(pattern => {
    sanitized = sanitized.replace(pattern, '[REDACTED]');
  });

  return sanitized;
}

/**
 * Main Error Handler Middleware
 */
export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  let error: AppError;

  // Handle Mongoose Validation Errors
  if (err instanceof MongooseError.ValidationError) {
    error = handleMongooseValidationError(err);
  }
  // Handle Mongoose Cast Errors
  else if (err instanceof MongooseError.CastError) {
    error = handleMongooseCastError(err);
  }
  // Handle Mongoose Duplicate Key Errors
  else if (err.name === 'MongoServerError' && (err as any).code === 11000) {
    error = handleMongooseDuplicateKeyError(err);
  }
  // Handle JWT Errors
  else if (err.name === 'JsonWebTokenError') {
    error = handleJWTError();
  }
  else if (err.name === 'TokenExpiredError') {
    error = handleJWTExpiredError();
  }
  // Handle Custom App Errors
  else if (err instanceof AppError) {
    error = err;
  }
  // Handle Unknown Errors
  else {
    error = new InternalServerError(
      process.env.NODE_ENV === 'development' ? err.message : 'An unexpected error occurred'
    );
  }

  // Log error for debugging (but not sensitive info)
  if (!isOperationalError(error) || process.env.NODE_ENV === 'development') {
    console.error('Error Details:', {
      name: err.name,
      message: error.message,
      statusCode: error.statusCode,
      code: error.code,
      details: error instanceof ValidationError ? error.details : undefined,
      originalError: err instanceof MongooseError.ValidationError ? {
        errors: Object.keys(err.errors).map(key => ({
          field: key,
          message: err.errors[key].message,
          value: (err.errors[key] as any).value,
          kind: (err.errors[key] as any).kind
        }))
      } : undefined,
      stack: error.stack,
      url: req.url,
      method: req.method,
      body: req.method === 'POST' || req.method === 'PUT' ? req.body : undefined,
      ip: req.ip
    });
  }

  // Build error response
  const response: ErrorResponse = {
    success: false,
    message: sanitizeErrorMessage(error.message),
    code: error.code
  };

  // Add details for validation errors
  if (error instanceof ValidationError && error.details) {
    response.details = error.details;

    // Also add a more user-friendly errors array
    if (error.details.errors && Array.isArray(error.details.errors)) {
      response.details.fieldErrors = error.details.errors.reduce((acc: any, err: any) => {
        acc[err.field] = err.message;
        return acc;
      }, {});
    }
  }

  // Add stack trace in development
  if (process.env.NODE_ENV === 'development') {
    response.stack = error.stack;
  }

  // Send response
  res.status(error.statusCode).json(response);
};

/**
 * Handle 404 Not Found
 */
export const notFoundHandler = (req: Request, _res: Response, next: NextFunction): void => {
  const error = new NotFoundError(`Route ${req.originalUrl}`);
  next(error);
};

/**
 * Async Error Wrapper
 * Wraps async route handlers to catch errors
 */
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
