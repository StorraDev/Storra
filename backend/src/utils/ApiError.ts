interface ApiErrorDetail {
  field: string;
  message: string;
}

interface ApiErrorParams {
  statusCode: number;
  message?: string;
  errors?: ApiErrorDetail[];
  stack?: string;
}

class ApiError extends Error {
  statusCode: number;
  data: null;
  errors: ApiErrorDetail[];
  success: boolean;

  constructor({ statusCode, message = "Something went wrong", errors = [], stack }: ApiErrorParams) {
    super(message);

    this.statusCode = statusCode;
    this.data = null;
    this.errors = errors;
    this.success = false;

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }

    Object.setPrototypeOf(this, ApiError.prototype); // Ensures instanceof works correctly
  }
}

export { ApiError };
