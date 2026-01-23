
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

export function getErrorMessage(error: ApiError, fallback: string = 'An error occurred'): string {
  if (!error.response?.data) {
    return fallback;
  }

  const errorData = error.response.data;

  if (errorData.details?.fieldErrors) {
    const fieldErrors = Object.entries(errorData.details.fieldErrors)
      .map(([field, message]) => `${field}: ${message}`)
      .join(', ');
    return fieldErrors;
  }

  if (errorData.details?.errors && Array.isArray(errorData.details.errors)) {
    return errorData.details.errors
      .map((err: any) => `${err.field}: ${err.message}`)
      .join(', ');
  }

  if (errorData.message) {
    return errorData.message;
  }

  return fallback;
}

export function getFieldErrors(error: ApiError): Record<string, string> {
  if (!error.response?.data?.details) {
    return {};
  }

  const details = error.response.data.details;

  if (details.fieldErrors) {
    return details.fieldErrors;
  }

  if (details.errors && Array.isArray(details.errors)) {
    return details.errors.reduce((acc: Record<string, string>, err: any) => {
      acc[err.field] = err.message;
      return acc;
    }, {});
  }

  return {};
}