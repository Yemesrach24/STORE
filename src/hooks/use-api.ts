import { useCallback } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';

interface ApiError {
  error: string;
  details?: any;
}

interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
}

export function useApi() {
  const { isSignedIn } = useAuth();
  const router = useRouter();

  const apiRequest = useCallback(async <T>(
    url: string, 
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> => {
    if (!isSignedIn) {
      router.push('/sign-in');
      return {
        data: null,
        error: 'Authentication required',
        loading: false
      };
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (!response.ok) {
        const errorData: ApiError = await response.json().catch(() => ({ error: 'Unknown error' }));
        
        let errorMessage = errorData.error || `Request failed with status ${response.status}`;
        
        switch (response.status) {
          case 401:
            errorMessage = 'Authentication required. Please sign in again.';
            break;
          case 403:
            errorMessage = 'Access denied. You don\'t have permission to perform this action.';
            break;
          case 404:
            errorMessage = 'Resource not found. Please check your request.';
            break;
          case 422:
            errorMessage = 'Invalid data provided. Please check your input.';
            break;
          case 429:
            errorMessage = 'Too many requests. Please try again later.';
            break;
          case 500:
            errorMessage = 'Server error. Please try again later.';
            break;
          case 503:
            errorMessage = 'Service temporarily unavailable. Please try again later.';
            break;
          default:
            if (response.status >= 500) {
              errorMessage = 'Server error. Please try again later.';
            }
        }

        return {
          data: null,
          error: errorMessage,
          loading: false
        };
      }

      const data = await response.json();
      return {
        data,
        error: null,
        loading: false
      };

    } catch (error) {
      let errorMessage = 'An unexpected error occurred';
      
      if (error instanceof TypeError && error.message.includes('fetch')) {
        errorMessage = 'Network error. Please check your internet connection.';
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      return {
        data: null,
        error: errorMessage,
        loading: false
      };
    }
  }, [isSignedIn]);

  return { apiRequest };
} 