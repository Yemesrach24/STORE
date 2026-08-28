import mongoose from 'mongoose'
import { User, Item, Category, Transaction } from '@/models'
import dbConnect from './mongodb'

// Mock data generators
const generateMockUsers = (count = 10) => {
  const users = []
  const roles = ['user', 'manager', 'admin'] as const
  
  for (let i = 0; i < count; i++) {
    users.push({
      authId: `google_test_user_${i + 1}`,
      name: `Test User ${i + 1}`,
      email: `testuser${i + 1}@example.com`,
      firstName: `Test${i + 1}`,
      lastName: `User${i + 1}`,
      imageUrl: `https://example.com/avatar${i + 1}.jpg`,
      role: roles[i % roles.length],
      isActive: true,
      phone: `+1-555-${String(i + 1).padStart(3, '0')}-${String(i + 1).padStart(4, '0')}`,
      location: `City ${i + 1}`,
      bio: `Bio for test user ${i + 1}`,
      timezone: 'America/New_York',
      language: 'en',
      currency: 'USD',
      dateFormat: 'MM/DD/YYYY',
      emailNotifications: true,
      lowStockAlerts: true,
      weeklyReports: i % 2 === 0,
      marketingEmails: false,
      theme: 'light' as const,
      autoLogout: true,
      twoFactorAuth: i % 3 === 0,
      lastLoginAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
    })
  }
  
  return users
}

const generateMockCategories = (count = 15) => {
  const categories: Array<{ name: string; description: string; slug: string; parentId: string | null; userId: string; isActive: boolean }> = []
  const categoryNames = [
    'Electronics', 'Clothing', 'Books', 'Home & Garden', 'Sports',
    'Automotive', 'Health & Beauty', 'Toys & Games', 'Food & Beverages',
    'Office Supplies', 'Tools & Hardware', 'Pet Supplies', 'Jewelry',
    'Art & Crafts', 'Music & Instruments'
  ]
  
  for (let i = 0; i < count; i++) {
    categories.push({
      name: categoryNames[i] || `Category ${i + 1}`,
      description: `Description for ${categoryNames[i] || `Category ${i + 1}`}`,
      slug: (categoryNames[i] || `category-${i + 1}`).toLowerCase().replace(/\s+/g, '-'),
      parentId: i > 5 ? categories[Math.floor(Math.random() * 6)]?.name ?? null : null,
      userId: `test-user-${(i % 3) + 1}`,
      isActive: true,
    })
  }
  
  return categories
}

const generateMockItems = (count = 50, userIds: string[], categoryIds: string[]) => {
  const items = []
  const itemNames = [
    'Laptop', 'Smartphone', 'Headphones', 'Tablet', 'Monitor',
    'Keyboard', 'Mouse', 'Printer', 'Scanner', 'Webcam',
    'T-Shirt', 'Jeans', 'Shoes', 'Hat', 'Jacket',
    'Book', 'Magazine', 'Notebook', 'Pen', 'Pencil',
    'Chair', 'Table', 'Lamp', 'Plant', 'Picture Frame',
    'Basketball', 'Tennis Racket', 'Soccer Ball', 'Gym Equipment', 'Yoga Mat'
  ]
  
  const units = ['pieces', 'boxes', 'pairs', 'sets', 'kg', 'liters', 'meters']
  const locations = ['Warehouse A', 'Warehouse B', 'Storage Room 1', 'Storage Room 2', 'Shelf A1', 'Shelf B2']
  const suppliers = ['Supplier A', 'Supplier B', 'Supplier C', 'Supplier D', 'Supplier E']
  
  for (let i = 0; i < count; i++) {
    const price = Math.round((Math.random() * 1000 + 10) * 100) / 100
    const cost = Math.round((price * (0.3 + Math.random() * 0.4)) * 100) / 100
    const quantity = Math.floor(Math.random() * 1000) + 1
    const minQuantity = Math.floor(quantity * 0.1)
    const maxQuantity = quantity + Math.floor(Math.random() * 500)
    
    items.push({
      name: itemNames[i % itemNames.length] || `Item ${i + 1}`,
      description: `Description for ${itemNames[i % itemNames.length] || `Item ${i + 1}`}`,
      sku: `SKU-${String(i + 1).padStart(4, '0')}`,
      barcode: `123456789${String(i + 1).padStart(3, '0')}`,
      category: categoryIds[Math.floor(Math.random() * categoryIds.length)],
      price,
      cost,
      quantity,
      minQuantity,
      maxQuantity,
      unit: units[Math.floor(Math.random() * units.length)],
      location: locations[Math.floor(Math.random() * locations.length)],
      supplier: suppliers[Math.floor(Math.random() * suppliers.length)],
      imageUrl: `https://example.com/item${i + 1}.jpg`,
      tags: [`tag${i + 1}`, `category${Math.floor(i / 10) + 1}`],
      isActive: Math.random() > 0.1, // 90% active
      userId: userIds[Math.floor(Math.random() * userIds.length)],
    })
  }
  
  return items
}

const generateMockTransactions = (count = 100, itemIds: string[], userIds: string[]) => {
  const transactions = []
  const types = ['IN', 'OUT', 'ADJUSTMENT', 'TRANSFER'] as const
  const reasons = [
    'Restock', 'Sale', 'Return', 'Damaged', 'Lost', 'Found',
    'Inventory Count', 'Transfer', 'Donation', 'Sample'
  ]
  const references = ['PO-', 'SO-', 'INV-', 'TRF-', 'ADJ-']
  
  for (let i = 0; i < count; i++) {
    const itemId = itemIds[Math.floor(Math.random() * itemIds.length)]
    const type = types[Math.floor(Math.random() * types.length)]
    const quantity = Math.floor(Math.random() * 100) + 1
    const previousQuantity = Math.floor(Math.random() * 500) + 50
    const newQuantity = type === 'IN' || type === 'ADJUSTMENT' 
      ? previousQuantity + quantity 
      : Math.max(0, previousQuantity - quantity)
    
    transactions.push({
      itemId,
      type,
      quantity,
      previousQuantity,
      newQuantity,
      reason: reasons[Math.floor(Math.random() * reasons.length)],
      reference: `${references[Math.floor(Math.random() * references.length)]}${String(i + 1).padStart(5, '0')}`,
      notes: `Transaction notes for ${type} operation`,
      cost: Math.round((Math.random() * 50 + 5) * 100) / 100,
      supplier: type === 'IN' ? `Supplier ${Math.floor(Math.random() * 5) + 1}` : null,
      customer: type === 'OUT' ? `Customer ${Math.floor(Math.random() * 10) + 1}` : null,
      transactionDate: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000),
      userId: userIds[Math.floor(Math.random() * userIds.length)],
    })
  }
  
  return transactions
}

// Main seeding function
export const seedTestDatabase = async () => {
  try {
    await dbConnect()
    
    // Clear existing data
    await User.deleteMany({})
    await Category.deleteMany({})
    await Item.deleteMany({})
    await Transaction.deleteMany({})
    
    console.log('🗑️  Cleared existing test data')
    
    // Generate and insert users
    const mockUsers = generateMockUsers(10)
    const users = await User.insertMany(mockUsers)
    const userIds = users.map(user => user._id.toString())
    
    console.log(`👥 Created ${users.length} test users`)
    
    // Generate and insert categories
    const mockCategories = generateMockCategories(15)
    const categories = await Category.insertMany(mockCategories)
    const categoryIds = categories.map(category => category._id.toString())
    
    console.log(`📂 Created ${categories.length} test categories`)
    
    // Generate and insert items
    const mockItems = generateMockItems(50, userIds, categoryIds)
    const items = await Item.insertMany(mockItems)
    const itemIds = items.map(item => item._id.toString())
    
    console.log(`📦 Created ${items.length} test items`)
    
    // Generate and insert transactions
    const mockTransactions = generateMockTransactions(100, itemIds, userIds)
    const transactions = await Transaction.insertMany(mockTransactions)
    
    console.log(`📊 Created ${transactions.length} test transactions`)
    
    // Update item quantities based on transactions
    for (const transaction of transactions) {
      await Item.findByIdAndUpdate(
        transaction.itemId,
        { $set: { quantity: transaction.newQuantity } }
      )
    }
    
    console.log('✅ Test database seeded successfully!')
    
    return {
      users: users.length,
      categories: categories.length,
      items: items.length,
      transactions: transactions.length,
    }
    
  } catch (error) {
    console.error('❌ Error seeding test database:', error)
    throw error
  }
}

// Cleanup function
export const cleanupTestDatabase = async () => {
  try {
    await dbConnect()
    
    await User.deleteMany({})
    await Category.deleteMany({})
    await Item.deleteMany({})
    await Transaction.deleteMany({})
    
    console.log('🧹 Test database cleaned up')
  } catch (error) {
    console.error('❌ Error cleaning up test database:', error)
    throw error
  }
}

// Export individual generators for unit tests
export {
  generateMockUsers,
  generateMockCategories,
  generateMockItems,
  generateMockTransactions,
} 