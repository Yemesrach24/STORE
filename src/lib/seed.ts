import dbConnect from './mongodb';
import { User, Item, Category, Transaction } from '@/models';

const sampleCategories = [
  { name: 'Electronics', description: 'Electronic devices and accessories', color: '#3B82F6' },
  { name: 'Clothing', description: 'Apparel and fashion items', color: '#EF4444' },
  { name: 'Books', description: 'Books and publications', color: '#10B981' },
  { name: 'Home & Garden', description: 'Home improvement and garden items', color: '#F59E0B' },
  { name: 'Sports & Outdoors', description: 'Sports equipment and outdoor gear', color: '#8B5CF6' },
];

const sampleItems = [
  {
    name: 'Laptop Computer',
    description: 'High-performance laptop for work and gaming',
    quantity: 15,
    price: 1299.99,
    costPrice: 899.99,
    category: 'Electronics',
    sku: 'LAPTOP-001',
    unit: 'pieces',
    minQuantity: 5,
    maxQuantity: 50,
    location: 'Warehouse A, Shelf B1',
    supplier: 'TechCorp Inc.',
    tags: ['computer', 'laptop', 'electronics'],
  },
  {
    name: 'Wireless Mouse',
    description: 'Ergonomic wireless mouse with precision tracking',
    quantity: 45,
    price: 29.99,
    costPrice: 15.99,
    category: 'Electronics',
    sku: 'MOUSE-001',
    unit: 'pieces',
    minQuantity: 10,
    maxQuantity: 100,
    location: 'Warehouse A, Shelf B2',
    supplier: 'TechCorp Inc.',
    tags: ['mouse', 'wireless', 'accessories'],
  },
  {
    name: 'Cotton T-Shirt',
    description: 'Comfortable cotton t-shirt in various sizes',
    quantity: 120,
    price: 19.99,
    costPrice: 8.99,
    category: 'Clothing',
    sku: 'TSHIRT-001',
    unit: 'pieces',
    minQuantity: 20,
    maxQuantity: 200,
    location: 'Warehouse B, Shelf C1',
    supplier: 'Fashion World',
    tags: ['clothing', 't-shirt', 'cotton'],
  },
  {
    name: 'Programming Book',
    description: 'Comprehensive guide to modern programming',
    quantity: 25,
    price: 49.99,
    costPrice: 25.99,
    category: 'Books',
    sku: 'BOOK-001',
    unit: 'pieces',
    minQuantity: 5,
    maxQuantity: 50,
    location: 'Warehouse C, Shelf D1',
    supplier: 'Book Publishers Ltd.',
    tags: ['book', 'programming', 'education'],
  },
  {
    name: 'Garden Hose',
    description: 'Durable garden hose for outdoor use',
    quantity: 8,
    price: 39.99,
    costPrice: 22.99,
    category: 'Home & Garden',
    sku: 'HOSE-001',
    unit: 'pieces',
    minQuantity: 3,
    maxQuantity: 20,
    location: 'Warehouse D, Shelf E1',
    supplier: 'Garden Supplies Co.',
    tags: ['garden', 'hose', 'outdoor'],
  },
];

export async function seedDatabase() {
  try {
    await dbConnect();
    console.log('Connected to database');

    // Clear existing data
    await Promise.all([
      User.deleteMany({}),
      Item.deleteMany({}),
      Category.deleteMany({}),
      Transaction.deleteMany({}),
    ]);
    console.log('Cleared existing data');

    // Create a test user
    const testUser = new User({
      clerkId: 'test_user_123',
      name: 'Test User',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      role: 'admin',
      isActive: true,
    });
    await testUser.save();
    console.log('Created test user:', testUser.email);

    // Create categories
    const createdCategories = await Promise.all(
      sampleCategories.map(async (catData) => {
        const category = new Category({
          ...catData,
          userId: testUser._id,
          isActive: true,
        });
        return await category.save();
      })
    );
    console.log(`Created ${createdCategories.length} categories`);

    // Create items
    const createdItems = await Promise.all(
      sampleItems.map(async (itemData) => {
        const item = new Item({
          ...itemData,
          userId: testUser._id,
          isActive: true,
        });
        return await item.save();
      })
    );
    console.log(`Created ${createdItems.length} items`);

    // Create some sample transactions
    const sampleTransactions = [
      {
        itemId: createdItems[0]._id,
        type: 'IN' as const,
        quantity: 10,
        previousQuantity: 0,
        newQuantity: 10,
        reason: 'Initial stock',
        notes: 'Initial inventory setup',
        userId: testUser._id,
        transactionDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
      },
      {
        itemId: createdItems[0]._id,
        type: 'OUT' as const,
        quantity: 2,
        previousQuantity: 10,
        newQuantity: 8,
        reason: 'Sale',
        notes: 'Sold to customer',
        userId: testUser._id,
        transactionDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      },
      {
        itemId: createdItems[1]._id,
        type: 'IN' as const,
        quantity: 50,
        previousQuantity: 0,
        newQuantity: 50,
        reason: 'Purchase order',
        notes: 'Bulk order from supplier',
        userId: testUser._id,
        transactionDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
      },
    ];

    const createdTransactions = await Promise.all(
      sampleTransactions.map(async (transData) => {
        const transaction = new Transaction(transData);
        return await transaction.save();
      })
    );
    console.log(`Created ${createdTransactions.length} transactions`);

    console.log('Database seeding completed successfully!');
    console.log('\nSample data created:');
    console.log(`- 1 test user (${testUser.email})`);
    console.log(`- ${createdCategories.length} categories`);
    console.log(`- ${createdItems.length} items`);
    console.log(`- ${createdTransactions.length} transactions`);

    return {
      user: testUser,
      categories: createdCategories,
      items: createdItems,
      transactions: createdTransactions,
    };
  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  }
}

// Run seeder if this file is executed directly
if (require.main === module) {
  seedDatabase()
    .then(() => {
      console.log('Seeding completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Seeding failed:', error);
      process.exit(1);
    });
} 