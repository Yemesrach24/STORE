import mongoose from 'mongoose';
import { env } from './env-validation';

// Get validated environment variables
const MONGODB_URI = env.MONGODB_URI;
const MONGODB_DB_NAME = env.MONGODB_DB_NAME;

// Connection configuration
const MONGODB_OPTIONS: mongoose.ConnectOptions = {
  bufferCommands: false, // Disable mongoose buffering
  maxPoolSize: 10, // Maintain up to 10 socket connections
  serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
  socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
  family: 4, // Use IPv4, skip trying IPv6
  retryWrites: true,
  retryReads: true,
  w: 'majority', // Write concern
  readPreference: 'primaryPreferred',
  // Connection pool settings
  maxIdleTimeMS: 30000, // Close connections after 30 seconds of inactivity
  minPoolSize: 1, // Maintain at least 1 connection
  // SSL settings for MongoDB Atlas
  ssl: MONGODB_URI.includes('mongodb+srv://'),
};

// Global connection cache for serverless environments
interface ConnectionCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
  lastConnected: number | null;
  retryCount: number;
  maxRetries: number;
}

declare global {
  var mongoose: ConnectionCache | undefined;
}

let cached: ConnectionCache = global.mongoose || {
  conn: null,
  promise: null,
  lastConnected: null,
  retryCount: 0,
  maxRetries: 3
};

if (!global.mongoose) {
  global.mongoose = cached;
}

// Connection retry logic
async function connectWithRetry(): Promise<typeof mongoose> {
  const startTime = Date.now();
  
  try {
    console.log('MongoDB: Attempting to connect...');
    
    const mongooseInstance = await mongoose.connect(MONGODB_URI!, {
  ...MONGODB_OPTIONS,
  dbName: MONGODB_DB_NAME,
});
    
    const connectionTime = Date.now() - startTime;
    console.log(`MongoDB: Connected successfully in ${connectionTime}ms`);
    
    // Reset retry count on successful connection
    cached.retryCount = 0;
    cached.lastConnected = Date.now();
    
    return mongooseInstance;
  } catch (error) {
    cached.retryCount++;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    console.error(`MongoDB: Connection attempt ${cached.retryCount} failed:`, errorMessage);
    
    if (cached.retryCount >= cached.maxRetries) {
      console.error('MongoDB: Max retry attempts reached. Connection failed.');
      throw new Error(`Failed to connect to MongoDB after ${cached.maxRetries} attempts: ${errorMessage}`);
    }
    
    // Exponential backoff: wait 1s, 2s, 4s between retries
    const backoffDelay = Math.pow(2, cached.retryCount - 1) * 1000;
    console.log(`MongoDB: Retrying in ${backoffDelay}ms...`);
    
    await new Promise(resolve => setTimeout(resolve, backoffDelay));
    
    return connectWithRetry();
  }
}

// Health check function
export async function checkConnectionHealth(): Promise<{
  isConnected: boolean;
  error?: string;
  connectionTime?: number;
}> {
  try {
    if (!cached.conn) {
      return { isConnected: false, error: 'No active connection' };
    }
    
    const db = cached.conn.connection.db;
    if (!db) {
      return { isConnected: false, error: 'Database not available' };
    }
    
    const startTime = Date.now();
    await db.admin().ping();
    const pingTime = Date.now() - startTime;
    
    return {
      isConnected: true,
      connectionTime: pingTime
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      isConnected: false,
      error: errorMessage
    };
  }
}

// Main connection function
async function dbConnect(): Promise<typeof mongoose> {
  // Reuse the cached connection. readyState is a local check — the previous
  // implementation issued an admin ping here, which cost a full round-trip to
  // Atlas on every single request before any real query could run.
  // 1 = connected, 2 = connecting.
  if (cached.conn) {
    const state = cached.conn.connection.readyState;
    if (state === 1 || state === 2) {
      return cached.conn;
    }
    cached.conn = null;
    cached.promise = null;
  }

  // Check if we're already connecting
  if (cached.promise) {
    try {
      cached.conn = await cached.promise;
      return cached.conn;
    } catch (error) {
      console.error('MongoDB: Connection promise failed:', error);
      cached.promise = null;
      cached.conn = null;
    }
  }

  // Create new connection
  console.log('MongoDB: Creating new connection...');
  cached.promise = connectWithRetry();
  
  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (error) {
    cached.promise = null;
    cached.conn = null;
    throw error;
  }
}

// Graceful shutdown function
export async function closeConnection(): Promise<void> {
  try {
    if (cached.conn) {
      console.log('MongoDB: Closing connection...');
      await cached.conn.disconnect();
      cached.conn = null;
      cached.promise = null;
      cached.lastConnected = null;
      console.log('MongoDB: Connection closed successfully');
    }
  } catch (error) {
    console.error('MongoDB: Error closing connection:', error);
    throw error;
  }
}

// Connection event handlers
mongoose.connection.on('connected', () => {
  console.log('MongoDB: Connection established');
});

mongoose.connection.on('error', (error) => {
  console.error('MongoDB: Connection error:', error);
});

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB: Connection disconnected');
  cached.conn = null;
  cached.promise = null;
});

mongoose.connection.on('reconnected', () => {
  console.log('MongoDB: Connection reestablished');
  cached.lastConnected = Date.now();
});

// Handle process termination
process.on('SIGINT', async () => {
  console.log('MongoDB: Received SIGINT, closing connection...');
  await closeConnection();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('MongoDB: Received SIGTERM, closing connection...');
  await closeConnection();
  process.exit(0);
});

export default dbConnect; 