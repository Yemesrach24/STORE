interface EnvConfig {
  MONGODB_URI: string;
  MONGODB_DB_NAME: string;
  AUTH_SECRET?: string;
  AUTH_GOOGLE_ID?: string;
  AUTH_GOOGLE_SECRET?: string;
  NODE_ENV: string;
  NEXT_PUBLIC_APP_URL: string;
}

function validateEnvVar(name: string, value: string | undefined, required: boolean = true): string {
  if (!value && required) {
    throw new Error(
      `Missing required environment variable: ${name}. ` +
      'Please check your .env.local file and ensure all required variables are set.'
    );
  }
  
  if (!value) {
    return '';
  }
  
  return value;
}

export function validateEnvironment(): EnvConfig {
  const config: EnvConfig = {
    MONGODB_URI: validateEnvVar('MONGODB_URI', process.env.MONGODB_URI),
    MONGODB_DB_NAME: validateEnvVar('MONGODB_DB_NAME', process.env.MONGODB_DB_NAME, false) || 'inventory-management',
    AUTH_SECRET: validateEnvVar('AUTH_SECRET', process.env.AUTH_SECRET, false),
    AUTH_GOOGLE_ID: validateEnvVar('AUTH_GOOGLE_ID', process.env.AUTH_GOOGLE_ID, false),
    AUTH_GOOGLE_SECRET: validateEnvVar('AUTH_GOOGLE_SECRET', process.env.AUTH_GOOGLE_SECRET, false),
    NODE_ENV: validateEnvVar('NODE_ENV', process.env.NODE_ENV, false) || 'development',
    NEXT_PUBLIC_APP_URL: validateEnvVar('NEXT_PUBLIC_APP_URL', process.env.NEXT_PUBLIC_APP_URL, false) || 'http://localhost:3000',
  };
  
  // Validate MongoDB URI format
  if (!config.MONGODB_URI.startsWith('mongodb://') && !config.MONGODB_URI.startsWith('mongodb+srv://')) {
    throw new Error(
      'Invalid MONGODB_URI format. Must start with mongodb:// or mongodb+srv://. ' +
      'Please check your .env.local file.'
    );
  }
  
  return config;
}

export function getEnvConfig(): EnvConfig {
  try {
    return validateEnvironment();
  } catch (error) {
    console.error('Environment validation failed:', error);
    throw error;
  }
}

// Export individual getters for convenience
export const env = {
  get MONGODB_URI() { return getEnvConfig().MONGODB_URI; },
  get MONGODB_DB_NAME() { return getEnvConfig().MONGODB_DB_NAME; },
  get AUTH_SECRET() { return getEnvConfig().AUTH_SECRET; },
  get AUTH_GOOGLE_ID() { return getEnvConfig().AUTH_GOOGLE_ID; },
  get AUTH_GOOGLE_SECRET() { return getEnvConfig().AUTH_GOOGLE_SECRET; },
  get NODE_ENV() { return getEnvConfig().NODE_ENV; },
  get NEXT_PUBLIC_APP_URL() { return getEnvConfig().NEXT_PUBLIC_APP_URL; },
  get IS_DEVELOPMENT() { return getEnvConfig().NODE_ENV === 'development'; },
  get IS_PRODUCTION() { return getEnvConfig().NODE_ENV === 'production'; },
  get IS_TEST() { return getEnvConfig().NODE_ENV === 'test'; },
}; 
