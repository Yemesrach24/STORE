// Clerk configuration for the application
export const clerkConfig = {
  // Disable CAPTCHA for development/testing
  // In production, you should enable CAPTCHA for security
  captcha: {
    enabled: process.env.NODE_ENV === 'production' && process.env.NEXT_PUBLIC_CLERK_DISABLE_CAPTCHA !== 'true',
  },
  
  // Appearance configuration
  appearance: {
    elements: {
      formButtonPrimary: 'bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors',
      formButtonSecondary: 'bg-gray-200 hover:bg-gray-300 text-gray-900 font-medium py-2 px-4 rounded-md transition-colors',
      formInput: 'border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
      formLabel: 'block text-sm font-medium text-gray-700 mb-1',
      card: 'bg-white rounded-lg shadow-md p-6',
      headerTitle: 'text-2xl font-bold text-gray-900',
      headerSubtitle: 'text-gray-600',
    },
    variables: {
      colorPrimary: '#2563eb',
      colorText: '#1f2937',
      colorTextSecondary: '#6b7280',
      colorBackground: '#ffffff',
      colorInputBackground: '#ffffff',
      colorInputText: '#1f2937',
    },
  },
  
  // Localization
  localization: {
    locale: 'en-US',
  },
  
  // Sign up configuration
  signUp: {
    // Disable email verification for development
    // In production, you should enable this
    emailVerification: process.env.NODE_ENV === 'production',
  },
  
  // Sign in configuration
  signIn: {
    // Allow password-based authentication
    password: true,
    // Allow OAuth providers (configure in Clerk dashboard)
    oauth: true,
  },
};

// Helper function to get Clerk configuration
export function getClerkConfig() {
  return {
    publishableKey: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    ...clerkConfig,
  };
} 