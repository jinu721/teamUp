/**
 * Utility functions for handling API errors
 */

export interface ApiError {
  response?: {
    data?: {
      message?: string;
      details?: {
        errors?: Array<{
          field: string;
          message: string;
          value?: any;
        }>;
        fieldErrors?: Record<string, string>;
      };
    };
  };
}

/**
 * Extract a user-friendly error message from an API error
 */
export function getErrorMessage(error: ApiError, fallback: string = 'An error occurred'): string {
  if (!error.response?.data) {
    return fallback;
  }

  const errorData = error.response.data;

  // Check for validation errors with field details
  if (errorData.details?.fieldErrors) {
    const fieldErrors = Object.entries(errorData.details.fieldErrors)
      .map(([field, message]) => `${field}: ${message}`)
      .join(', ');
    return fieldErrors;
  }

  // Check for validation errors array
  if (errorData.details?.errors && Array.isArray(errorData.details.errors)) {
    return errorData.details.errors
      .map((err: any) => `${err.field}: ${err.message}`)
      .join(', ');
  }

  // Fall back to the main error message
  if (errorData.message) {
    return errorData.message;
  }

  return fallback;
}

/**
 * Get field-specific errors for form validation
 */
export function getFieldErrors(error: ApiError): Record<string, string> {
  if (!error.response?.data?.details) {
    return {};
  }

  const details = error.response.data.details;

  // Use fieldErrors if available
  if (details.fieldErrors) {
    return details.fieldErrors;
  }

  // Convert errors array to field errors object
  if (details.errors && Array.isArray(details.errors)) {
    return details.errors.reduce((acc: Record<string, string>, err: any) => {
      acc[err.field] = err.message;
      return acc;
    }, {});
  }

  return {};
}