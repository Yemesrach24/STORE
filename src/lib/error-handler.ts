import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

export interface ApiError {
  success: false;
  error: string;
  details?: Record<string, any>;
  code?: string;
}

export interface ApiSuccess<T = any> {
  success: true;
  data: T;
  message?: string;
}

export type ApiResponse<T = any> = ApiSuccess<T> | ApiError;

export class AppError extends Error {
  public statusCode: number;
  public code?: string;
  public details?: Record<string, any>;

  constructor(message: string, statusCode: number = 500, code?: string, details?: Record<string, any>) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.name = 'AppError';
  }
}

export function createErrorResponse(
  error: string,
  statusCode: number = 500,
  code?: string,
  details?: Record<string, any>
): NextResponse<ApiError> {
  const errorResponse: ApiError = {
    success: false,
    error,
    code,
    details,
  };

  return NextResponse.json(errorResponse, { status: statusCode });
}

export function createSuccessResponse<T>(
  data: T,
  message?: string,
  statusCode: number = 200
): NextResponse<ApiSuccess<T>> {
  const successResponse: ApiSuccess<T> = {
    success: true,
    data,
    message,
  };

  return NextResponse.json(successResponse, { status: statusCode });
}

export function handleApiError(error: unknown): NextResponse<ApiError> {
  console.error('API Error:', error);

  // Handle Zod validation errors
  if (error instanceof ZodError) {
    const details: Record<string, string> = {};
    error.errors.forEach((err) => {
      const field = err.path.join('.');
      details[field] = err.message;
    });

    return createErrorResponse(
      'Validation error',
      400,
      'VALIDATION_ERROR',
      details
    );
  }

  // Handle AppError instances
  if (error instanceof AppError) {
    return createErrorResponse(
      error.message,
      error.statusCode,
      error.code,
      error.details
    );
  }

  // Handle MongoDB errors
  if (error && typeof error === 'object' && 'code' in error) {
    const mongoError = error as any;
    
    switch (mongoError.code) {
      case 11000: // Duplicate key error
        return createErrorResponse(
          'Duplicate entry found',
          409,
          'DUPLICATE_ENTRY',
          { field: Object.keys(mongoError.keyPattern || {})[0] }
        );
      
      case 121: // Document validation failed
        return createErrorResponse(
          'Document validation failed',
          400,
          'VALIDATION_ERROR',
          mongoError.errInfo?.details?.schemaRulesNotSatisfied
        );
      
      default:
        return createErrorResponse(
          'Database error',
          500,
          'DATABASE_ERROR'
        );
    }
  }

  // Handle generic errors
  if (error instanceof Error) {
    return createErrorResponse(
      error.message,
      500,
      'INTERNAL_ERROR'
    );
  }

  // Handle unknown errors
  return createErrorResponse(
    'An unexpected error occurred',
    500,
    'UNKNOWN_ERROR'
  );
}

export function withErrorHandler<T extends any[], R>(
  handler: (...args: T) => Promise<R>
) {
  return async (...args: T): Promise<R> => {
    try {
      return await handler(...args);
    } catch (error) {
      throw error; // Re-throw to be handled by the API route
    }
  };
}

// Common error types
export const Errors = {
  // Authentication errors
  UNAUTHORIZED: new AppError('Authentication required', 401, 'UNAUTHORIZED'),
  FORBIDDEN: new AppError('Access denied', 403, 'FORBIDDEN'),
  INVALID_TOKEN: new AppError('Invalid or expired token', 401, 'INVALID_TOKEN'),

  // Resource errors
  NOT_FOUND: (resource: string = 'Resource') => 
    new AppError(`${resource} not found`, 404, 'NOT_FOUND'),
  ALREADY_EXISTS: (resource: string = 'Resource') => 
    new AppError(`${resource} already exists`, 409, 'ALREADY_EXISTS'),
  DELETED: (resource: string = 'Resource') => 
    new AppError(`${resource} has been deleted`, 410, 'DELETED'),

  // Validation errors
  INVALID_INPUT: (field?: string) => 
    new AppError(
      field ? `Invalid ${field}` : 'Invalid input',
      400,
      'INVALID_INPUT',
      field ? { field } : undefined
    ),
  MISSING_REQUIRED_FIELD: (field: string) => 
    new AppError(`Missing required field: ${field}`, 400, 'MISSING_FIELD', { field }),

  // Rate limiting
  RATE_LIMIT_EXCEEDED: new AppError('Rate limit exceeded', 429, 'RATE_LIMIT_EXCEEDED'),

  // Database errors
  DATABASE_ERROR: new AppError('Database operation failed', 500, 'DATABASE_ERROR'),
  CONNECTION_ERROR: new AppError('Database connection failed', 503, 'CONNECTION_ERROR'),

  // File upload errors
  FILE_TOO_LARGE: (maxSize: string) => 
    new AppError(`File size exceeds maximum allowed size of ${maxSize}`, 413, 'FILE_TOO_LARGE'),
  INVALID_FILE_TYPE: (allowedTypes: string[]) => 
    new AppError(`Invalid file type. Allowed types: ${allowedTypes.join(', ')}`, 400, 'INVALID_FILE_TYPE'),

  // Business logic errors
  INSUFFICIENT_STOCK: (itemName: string, available: number, requested: number) => 
    new AppError(
      `Insufficient stock for ${itemName}. Available: ${available}, Requested: ${requested}`,
      400,
      'INSUFFICIENT_STOCK',
      { itemName, available, requested }
    ),
  ITEM_IN_USE: (itemName: string) => 
    new AppError(`${itemName} is currently in use and cannot be deleted`, 409, 'ITEM_IN_USE'),
  LAST_ADMIN_DELETE: new AppError('Cannot delete the last admin user', 400, 'LAST_ADMIN_DELETE'),
} as const;

// Helper function to check if a response is an error
export function isErrorResponse(response: ApiResponse): response is ApiError {
  return !response.success;
}

// Helper function to check if a response is successful
export function isSuccessResponse<T>(response: ApiResponse<T>): response is ApiSuccess<T> {
  return response.success;
} 