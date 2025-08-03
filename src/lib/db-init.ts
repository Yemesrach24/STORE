import dbConnect, { checkConnectionHealth } from './mongodb';
import { User, Item, Category, Transaction } from '@/models';
import { env } from './env-validation';

interface InitResult {
  success: boolean;
  message: string;
  details?: any;
}

export async function initializeDatabase(): Promise<InitResult> {
  try {
    console.log('Database: Starting initialization...');
    
    // Connect to database
    await dbConnect();
    
    // Check connection health
    const health = await checkConnectionHealth();
    if (!health.isConnected) {
      throw new Error(`Database connection failed: ${health.error}`);
    }
    
    console.log('Database: Connection established, creating indexes...');
    
    // Create indexes for all collections
    await Promise.all([
      // User indexes
      User.collection.createIndex({ clerkId: 1 }, { unique: true }),
      User.collection.createIndex({ email: 1 }, { unique: true }),
      User.collection.createIndex({ role: 1 }),
      User.collection.createIndex({ isActive: 1 }),
      
      // Item indexes
      Item.collection.createIndex({ userId: 1 }),
      Item.collection.createIndex({ category: 1 }),
      Item.collection.createIndex({ sku: 1 }, { sparse: true }),
      Item.collection.createIndex({ barcode: 1 }, { sparse: true }),
      Item.collection.createIndex({ isActive: 1 }),
      Item.collection.createIndex({ quantity: 1 }),
      Item.collection.createIndex({ name: 'text', description: 'text' }),
      
      // Category indexes
      Category.collection.createIndex({ userId: 1 }),
      Category.collection.createIndex({ parentId: 1 }),
      Category.collection.createIndex({ isActive: 1 }),
      Category.collection.createIndex({ name: 1 }),
      
      // Transaction indexes
      Transaction.collection.createIndex({ userId: 1 }),
      Transaction.collection.createIndex({ itemId: 1 }),
      Transaction.collection.createIndex({ type: 1 }),
      Transaction.collection.createIndex({ createdAt: 1 }),
    ]);
    
    console.log('Database: Indexes created successfully');
    
    // Check if we need to create a default admin user
    const adminCount = await User.countDocuments({ role: 'admin' });
    
    if (adminCount === 0) {
      console.log('Database: No admin users found, creating default admin...');
      
      // Create a default admin user (this should be replaced by actual user registration)
      const defaultAdmin = new User({
        clerkId: 'default_admin',
        name: 'System Administrator',
        email: 'admin@inventory-system.com',
        firstName: 'System',
        lastName: 'Administrator',
        role: 'admin',
        isActive: true,
        emailNotifications: true,
        lowStockAlerts: true,
        weeklyReports: true,
        marketingEmails: false,
        theme: 'system',
        autoLogout: false,
        twoFactorAuth: false,
        language: 'en',
        currency: 'USD',
        dateFormat: 'MM/DD/YYYY',
        timezone: 'UTC'
      });
      
      await defaultAdmin.save();
      console.log('Database: Default admin user created');
    }
    
    // Create default categories if none exist
    const categoryCount = await Category.countDocuments();
    
    if (categoryCount === 0) {
      console.log('Database: No categories found, creating default categories...');
      
      const defaultCategories = [
        { name: 'Electronics', description: 'Electronic devices and accessories' },
        { name: 'Clothing', description: 'Apparel and fashion items' },
        { name: 'Books', description: 'Books and publications' },
        { name: 'Home & Garden', description: 'Home improvement and garden items' },
        { name: 'Sports', description: 'Sports equipment and accessories' },
        { name: 'Automotive', description: 'Automotive parts and accessories' },
        { name: 'Health & Beauty', description: 'Health and beauty products' },
        { name: 'Toys & Games', description: 'Toys and gaming items' },
        { name: 'Food & Beverages', description: 'Food and beverage products' },
        { name: 'Other', description: 'Miscellaneous items' }
      ];
      
      for (const categoryData of defaultCategories) {
        const category = new Category({
          ...categoryData,
          userId: null, // Global categories
          isActive: true,
          sortOrder: defaultCategories.indexOf(categoryData)
        });
        await category.save();
      }
      
      console.log('Database: Default categories created');
    }
    
    console.log('Database: Initialization completed successfully');
    
    return {
      success: true,
      message: 'Database initialized successfully',
      details: {
        connectionTime: health.connectionTime,
        adminUsers: adminCount,
        categories: categoryCount,
        indexes: 'All indexes created'
      }
    };
    
  } catch (error) {
    console.error('Database: Initialization failed:', error);
    
    return {
      success: false,
      message: 'Database initialization failed',
      details: {
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    };
  }
}

export async function validateDatabaseSetup(): Promise<InitResult> {
  try {
    console.log('Database: Validating setup...');
    
    // Check connection
    const health = await checkConnectionHealth();
    if (!health.isConnected) {
      throw new Error(`Database connection failed: ${health.error}`);
    }
    
    // Check collections exist
    const conn = await dbConnect();
    const db = conn.connection.db;
    if (!db) {
      throw new Error('Database not available');
    }
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map(col => col.name);
    
    const requiredCollections = ['users', 'items', 'categories', 'transactions'];
    const missingCollections = requiredCollections.filter(name => !collectionNames.includes(name));
    
    if (missingCollections.length > 0) {
      throw new Error(`Missing collections: ${missingCollections.join(', ')}`);
    }
    
    // Check indexes
    const userIndexes = await User.collection.indexes();
    const itemIndexes = await Item.collection.indexes();
    const categoryIndexes = await Category.collection.indexes();
    const transactionIndexes = await Transaction.collection.indexes();
    
    console.log('Database: Setup validation completed');
    
    return {
      success: true,
      message: 'Database setup is valid',
      details: {
        connectionTime: health.connectionTime,
        collections: collectionNames,
        indexes: {
          users: userIndexes.length,
          items: itemIndexes.length,
          categories: categoryIndexes.length,
          transactions: transactionIndexes.length
        }
      }
    };
    
  } catch (error) {
    console.error('Database: Setup validation failed:', error);
    
    return {
      success: false,
      message: 'Database setup validation failed',
      details: {
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    };
  }
} 