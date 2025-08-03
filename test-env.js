require('dotenv').config({ path: '.env.local' });

console.log('Testing environment variables...');
console.log('MONGODB_URI:', process.env.MONGODB_URI ? 'Set' : 'Not set');
console.log('CLERK_PUBLISHABLE_KEY:', process.env.CLERK_PUBLISHABLE_KEY ? 'Set' : 'Not set');
console.log('CLERK_SECRET_KEY:', process.env.CLERK_SECRET_KEY ? 'Set' : 'Not set');
console.log('NODE_ENV:', process.env.NODE_ENV || 'development');

// Test MongoDB connection
const mongoose = require('mongoose');

async function testConnection() {
  try {
    console.log('\nTesting MongoDB connection...');
    
    if (!process.env.MONGODB_URI) {
      console.error('MONGODB_URI not set');
      return;
    }
    
    await mongoose.connect(process.env.MONGODB_URI, {
      bufferCommands: false,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    
    console.log('MongoDB connected successfully');
    
    // Test ping
    const db = mongoose.connection.db;
    if (db) {
      await db.admin().ping();
      console.log('Database ping successful');
    }
    
    await mongoose.disconnect();
    console.log('MongoDB disconnected');
    
  } catch (error) {
    console.error('MongoDB connection failed:', error.message);
  }
}

testConnection(); 