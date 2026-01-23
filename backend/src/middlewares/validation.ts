import { Request, Response, NextFunction } from 'express';
import { ValidationError, createEnumValidationError } from '../utils/errors';

export const validateEnum = (field: string, enumObj: object, required: boolean = false) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const value = req.body[field];

    if (required && (value === undefined || value === null || value === '')) {
      throw new ValidationError(`${field} is required`);
    }

    if (!required && (value === undefined || value === null || value === '')) {
      return next();
    }

    const allowedValues = Object.values(enumObj);
    if (!allowedValues.includes(value)) {
      throw createEnumValidationError(field, value, allowedValues);
    }

    next();
  };
};

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

export const validateStringLength = (
  field: string,
  minLength?: number,
  maxLength?: number
) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const value = req.body[field];

    if (value === undefined || value === null) {
      return next();
    }

    if (typeof value !== 'string') {
      throw new ValidationError(`${field} must be a string`);
    }

    if (minLength !== undefined && value.trim().length < minLength) {
      throw new ValidationError(
        `${field} must be at least ${minLength} characters`,
        { field, minLength, actualLength: value.trim().length }
      );
    }

    if (maxLength !== undefined && value.length > maxLength) {
      throw new ValidationError(
        `${field} cannot exceed ${maxLength} characters`,
        { field, maxLength, actualLength: value.length }
      );
    }

    next();
  };
};

export const validateEmail = (field: string = 'email') => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const value = req.body[field];

    if (value === undefined || value === null || value === '') {
      return next();
    }

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

export const validateArray = (
  field: string,
  required: boolean = false,
  minLength?: number,
  maxLength?: number
) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const value = req.body[field];

    if (required && (value === undefined || value === null)) {
      throw new ValidationError(`${field} is required`);
    }

    if (value === undefined || value === null) {
      return next();
    }

    if (!Array.isArray(value)) {
      throw new ValidationError(`${field} must be an array`);
    }

    if (minLength !== undefined && value.length < minLength) {
      throw new ValidationError(
        `${field} must contain at least ${minLength} item(s)`,
        { field, minLength, actualLength: value.length }
      );
    }

    if (maxLength !== undefined && value.length > maxLength) {
      throw new ValidationError(
        `${field} cannot contain more than ${maxLength} item(s)`,
        { field, maxLength, actualLength: value.length }
      );
    }

    next();
  };
};

export const sanitizeInput = (fields: string[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    fields.forEach(field => {
      if (req.body[field] && typeof req.body[field] === 'string') {

        req.body[field] = req.body[field].trim();

        req.body[field] = req.body[field].replace(/<[^>]*>/g, '');
      }
    });

    next();
  };
};