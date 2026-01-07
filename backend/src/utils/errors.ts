/**
 * Custom Error Classes for TeamUp Application
 * Provides structured error handling with proper HTTP status codes
 */

/**
 * Base Application Error
 * All custom errors extend from this class
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly code?: string;

  constructor(
    message: string,
    statusCode: number,
    isOperational: boolean = true,
    code?: string
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.code = code;

    // Maintains proper stack trace for where error was thrown
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Validation Error (400)
 * Used when input validation fails
 */
export class ValidationError extends AppError {
  public readonly details?: any;

  constructor(message: string, details?: any) {
    super(message, 400, true, 'VALIDATION_ERROR');
    this.details = details;
  }
}

/**
 * Authentication Error (401)
 * Used when authentication fails or token is invalid
 */
export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication failed') {
    super(message, 401, true, 'AUTHENTICATION_ERROR');
  }
}

/**
 * Authorization Error (403)
 * Used when user doesn't have permission to perform action
 */
export class AuthorizationError extends AppError {
  constructor(message: string = 'You do not have permission to perform this action') {
    super(message, 403, true, 'AUTHORIZATION_ERROR');
  }
}

/**
 * Not Found Error (404)
 * Used when requested resource doesn't exist
 */
export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, 404, true, 'NOT_FOUND');
  }
}

/**
 * Conflict Error (409)
 * Used when there's a conflict with existing data
 */
export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409, true, 'CONFLICT_ERROR');
  }
}

/**
 * Internal Server Error (500)
 * Used for unexpected errors
 */
export class InternalServerError extends AppError {
  constructor(message: string = 'An unexpected error occurred') {
    super(message, 500, false, 'INTERNAL_SERVER_ERROR');
  }
}

/**
 * Helper function to create validation error with enum details
 */
export function createEnumValidationError(
  field: string,
  value: any,
  allowedValues: any[]
): ValidationError {
  return new ValidationError(
    `Invalid ${field}`,
    {
      field,
      value,
      allowedValues,
      message: `${field} must be one of: ${allowedValues.join(', ')}`
    }
  );
}

/**
 * Helper function to check if error is operational
 */
export function isOperationalError(error: Error): boolean {
  if (error instanceof AppError) {
    return error.isOperational;
  }
  return false;
}
