interface EnvConfig {
  MONGODB_URI: string;
  MONGODB_DB_NAME: string;
  CLERK_PUBLISHABLE_KEY?: string;
  CLERK_SECRET_KEY?: string;
  CLERK_WEBHOOK_SECRET?: string;
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
    CLERK_PUBLISHABLE_KEY: validateEnvVar('CLERK_PUBLISHABLE_KEY', process.env.CLERK_PUBLISHABLE_KEY, false),
    CLERK_SECRET_KEY: validateEnvVar('CLERK_SECRET_KEY', process.env.CLERK_SECRET_KEY, false),
    CLERK_WEBHOOK_SECRET: validateEnvVar('CLERK_WEBHOOK_SECRET', process.env.CLERK_WEBHOOK_SECRET, false),
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
  
  // Validate Clerk keys format (only if they are provided)
  if (config.CLERK_PUBLISHABLE_KEY && !config.CLERK_PUBLISHABLE_KEY.startsWith('pk_')) {
    throw new Error(
      'Invalid CLERK_PUBLISHABLE_KEY format. Must start with pk_. ' +
      'Please check your .env.local file.'
    );
  }
  
  if (config.CLERK_SECRET_KEY && !config.CLERK_SECRET_KEY.startsWith('sk_')) {
    throw new Error(
      'Invalid CLERK_SECRET_KEY format. Must start with sk_. ' +
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
  get CLERK_PUBLISHABLE_KEY() { return getEnvConfig().CLERK_PUBLISHABLE_KEY; },
  get CLERK_SECRET_KEY() { return getEnvConfig().CLERK_SECRET_KEY; },
  get CLERK_WEBHOOK_SECRET() { return getEnvConfig().CLERK_WEBHOOK_SECRET; },
  get NODE_ENV() { return getEnvConfig().NODE_ENV; },
  get NEXT_PUBLIC_APP_URL() { return getEnvConfig().NEXT_PUBLIC_APP_URL; },
  get IS_DEVELOPMENT() { return getEnvConfig().NODE_ENV === 'development'; },
  get IS_PRODUCTION() { return getEnvConfig().NODE_ENV === 'production'; },
  get IS_TEST() { return getEnvConfig().NODE_ENV === 'test'; },
}; 