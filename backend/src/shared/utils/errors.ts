
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

    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  public readonly details?: any;

  constructor(message: string, details?: any) {
    super(message, 400, true, 'VALIDATION_ERROR');
    this.details = details;
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication failed') {
    super(message, 401, true, 'AUTHENTICATION_ERROR');
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'You do not have permission to perform this action') {
    super(message, 403, true, 'AUTHORIZATION_ERROR');
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, 404, true, 'NOT_FOUND');
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409, true, 'CONFLICT_ERROR');
  }
}

export class InternalServerError extends AppError {
  constructor(message: string = 'An unexpected error occurred') {
    super(message, 500, false, 'INTERNAL_SERVER_ERROR');
  }
}

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

export function isOperationalError(error: Error): boolean {
  if (error instanceof AppError) {
    return error.isOperational;
  }
  return false;
}