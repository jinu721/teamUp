import { Request, Response, NextFunction } from 'express';
import { ValidationError, createEnumValidationError } from '../utils/errors';

/**
 * Validate Enum Value
 * Checks if a field value is in the allowed enum values
 */
export const validateEnum = (field: string, enumObj: object, required: boolean = false) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const value = req.body[field];

    // Check if field is required
    if (required && (value === undefined || value === null || value === '')) {
      throw new ValidationError(`${field} is required`);
    }

    // If not required and no value provided, skip validation
    if (!required && (value === undefined || value === null || value === '')) {
      return next();
    }

    // Validate enum value
    const allowedValues = Object.values(enumObj);
    if (!allowedValues.includes(value)) {
      throw createEnumValidationError(field, value, allowedValues);
    }

    next();
  };
};

/**
 * Validate Required Fields
 * Checks if all required fields are present
 */
export const validateRequired = (fields: string[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const missingFields: string[] = [];

    fields.forEach(field => {
      const value = req.body[field];
      if (value === undefined || value === null || value === '') {
        missingFields.push(field);
      }
    });

    if (missingFields.length > 0) {
      throw new ValidationError(
        'Missing required fields',
        {
          missingFields,
          message: `The following fields are required: ${missingFields.join(', ')}`
        }
      );
    }

    next();
  };
};

/**
 * Validate String Length
 * Checks if string fields meet length requirements
 */
export const validateStringLength = (
  field: string,
  minLength?: number,
  maxLength?: number
) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const value = req.body[field];

    // Skip if field is not present
    if (value === undefined || value === null) {
      return next();
    }

    // Ensure it's a string
    if (typeof value !== 'string') {
      throw new ValidationError(`${field} must be a string`);
    }

    // Check minimum length
    if (minLength !== undefined && value.trim().length < minLength) {
      throw new ValidationError(
        `${field} must be at least ${minLength} characters`,
        { field, minLength, actualLength: value.trim().length }
      );
    }

    // Check maximum length
    if (maxLength !== undefined && value.length > maxLength) {
      throw new ValidationError(
        `${field} cannot exceed ${maxLength} characters`,
        { field, maxLength, actualLength: value.length }
      );
    }

    next();
  };
};

/**
 * Validate Email Format
 * Checks if email field has valid format
 */
export const validateEmail = (field: string = 'email') => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const value = req.body[field];

    // Skip if field is not present
    if (value === undefined || value === null || value === '') {
      return next();
    }

    // Email regex pattern
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(value)) {
      throw new ValidationError(
        'Invalid email format',
        { field, value, message: 'Please provide a valid email address' }
      );
    }

    next();
  };
};

/**
 * Validate Array Field
 * Checks if field is an array and optionally validates its contents
 */
export const validateArray = (
  field: string,
  required: boolean = false,
  minLength?: number,
  maxLength?: number
) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const value = req.body[field];

    // Check if required
    if (required && (value === undefined || value === null)) {
      throw new ValidationError(`${field} is required`);
    }

    // Skip if not present and not required
    if (value === undefined || value === null) {
      return next();
    }

    // Ensure it's an array
    if (!Array.isArray(value)) {
      throw new ValidationError(`${field} must be an array`);
    }

    // Check minimum length
    if (minLength !== undefined && value.length < minLength) {
      throw new ValidationError(
        `${field} must contain at least ${minLength} item(s)`,
        { field, minLength, actualLength: value.length }
      );
    }

    // Check maximum length
    if (maxLength !== undefined && value.length > maxLength) {
      throw new ValidationError(
        `${field} cannot contain more than ${maxLength} item(s)`,
        { field, maxLength, actualLength: value.length }
      );
    }

    next();
  };
};

/**
 * Sanitize Input
 * Removes potentially dangerous characters from input
 */
export const sanitizeInput = (fields: string[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    fields.forEach(field => {
      if (req.body[field] && typeof req.body[field] === 'string') {
        // Trim whitespace
        req.body[field] = req.body[field].trim();
        
        // Remove any HTML tags (basic XSS prevention)
        req.body[field] = req.body[field].replace(/<[^>]*>/g, '');
      }
    });

    next();
  };
};
