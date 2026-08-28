import { NextRequest } from 'next/server'
import { GET, POST } from '../items/route'
import { GET as getItem, PUT, DELETE } from '../items/[id]/route'
import { seedTestDatabase, cleanupTestDatabase } from '@/lib/test-seed'
import { Item, User } from '@/models'
import dbConnect from '@/lib/mongodb'
import mongoose from 'mongoose'

// Mock the app auth helper (NextAuth session wrapper)
jest.mock('@/lib/auth', () => ({
  auth: jest.fn(async () => ({ userId: 'test-user-id' })),
}))

describe('/api/items', () => {
  let testUser: any
  let testItem: any

  beforeAll(async () => {
    await dbConnect()
  })

  beforeEach(async () => {
    await cleanupTestDatabase()
    
    // Create test user
    testUser = await User.create({
      authId: 'test-user-id',
      name: 'Test User',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      role: 'user',
      isActive: true,
    })

    // Create test item
    testItem = await Item.create({
      name: 'Test Item',
      description: 'A test item',
      sku: 'TEST-001',
      barcode: '1234567890123',
      price: 29.99,
      cost: 15.00,
      quantity: 100,
      minQuantity: 10,
      maxQuantity: 500,
      unit: 'pieces',
      location: 'Warehouse A',
      supplier: 'Test Supplier',
      isActive: true,
      userId: testUser._id,
    })
  })

  afterAll(async () => {
    await cleanupTestDatabase()
    await mongoose.connection.close()
  })

  describe('GET /api/items', () => {
    it('returns items for authenticated user', async () => {
      const request = new NextRequest('http://localhost:3000/api/items')
      
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.items).toHaveLength(1)
      expect(data.items[0].name).toBe('Test Item')
    })

    it('filters items by search query', async () => {
      const request = new NextRequest('http://localhost:3000/api/items?search=Test')
      
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.items).toHaveLength(1)
    })

    it('filters items by category', async () => {
      const request = new NextRequest('http://localhost:3000/api/items?category=electronics')
      
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.items).toHaveLength(0) // No items in electronics category
    })

    it('filters items by stock status', async () => {
      const request = new NextRequest('http://localhost:3000/api/items?stockStatus=in_stock')
      
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.items).toHaveLength(1)
    })

    it('paginates results', async () => {
      // Create multiple items
      await Item.create([
        {
          name: 'Item 2',
          description: 'Second item',
          sku: 'TEST-002',
          price: 19.99,
          cost: 10.00,
          quantity: 50,
          unit: 'pieces',
          userId: testUser._id,
        },
        {
          name: 'Item 3',
          description: 'Third item',
          sku: 'TEST-003',
          price: 39.99,
          cost: 20.00,
          quantity: 75,
          unit: 'pieces',
          userId: testUser._id,
        },
      ])

      const request = new NextRequest('http://localhost:3000/api/items?page=1&limit=2')
      
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.items).toHaveLength(2)
      expect(data.pagination.page).toBe(1)
      expect(data.pagination.total).toBe(3)
    })
  })

  describe('POST /api/items', () => {
    it('creates a new item', async () => {
      const newItem = {
        name: 'New Item',
        description: 'A new test item',
        sku: 'NEW-001',
        barcode: '9876543210987',
        price: 49.99,
        cost: 25.00,
        quantity: 200,
        minQuantity: 20,
        maxQuantity: 1000,
        unit: 'boxes',
        location: 'Warehouse B',
        supplier: 'New Supplier',
        tags: ['new', 'test'],
      }

      const request = new NextRequest('http://localhost:3000/api/items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newItem),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.success).toBe(true)
      expect(data.item.name).toBe('New Item')
      expect(data.item.userId).toBe(testUser._id.toString())
    })

    it('validates required fields', async () => {
      const invalidItem = {
        description: 'Missing name and other required fields',
      }

      const request = new NextRequest('http://localhost:3000/api/items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invalidItem),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.errors).toBeDefined()
    })

    it('validates unique SKU', async () => {
      const duplicateItem = {
        name: 'Duplicate Item',
        description: 'Item with duplicate SKU',
        sku: 'TEST-001', // Same SKU as existing item
        price: 19.99,
        cost: 10.00,
        quantity: 50,
        unit: 'pieces',
      }

      const request = new NextRequest('http://localhost:3000/api/items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(duplicateItem),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.message).toContain('SKU already exists')
    })
  })

  describe('GET /api/items/[id]', () => {
    it('returns a specific item', async () => {
      const request = new NextRequest(`http://localhost:3000/api/items/${testItem._id}`)
      
      const response = await getItem(request, { params: { id: testItem._id.toString() } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.item.name).toBe('Test Item')
    })

    it('returns 404 for non-existent item', async () => {
      const nonExistentId = new mongoose.Types.ObjectId()
      const request = new NextRequest(`http://localhost:3000/api/items/${nonExistentId}`)
      
      const response = await getItem(request, { params: { id: nonExistentId.toString() } })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.success).toBe(false)
    })

    it('returns 403 for item not owned by user', async () => {
      // Create item owned by different user
      const otherUser = await User.create({
        authId: 'other-user-id',
        name: 'Other User',
        email: 'other@example.com',
        firstName: 'Other',
        lastName: 'User',
        role: 'user',
        isActive: true,
      })

      const otherItem = await Item.create({
        name: 'Other Item',
        description: 'Item owned by other user',
        sku: 'OTHER-001',
        price: 19.99,
        cost: 10.00,
        quantity: 50,
        unit: 'pieces',
        userId: otherUser._id,
      })

      const request = new NextRequest(`http://localhost:3000/api/items/${otherItem._id}`)
      
      const response = await getItem(request, { params: { id: otherItem._id.toString() } })
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.success).toBe(false)
    })
  })

  describe('PUT /api/items/[id]', () => {
    it('updates an existing item', async () => {
      const updates = {
        name: 'Updated Item',
        price: 39.99,
        quantity: 150,
      }

      const request = new NextRequest(`http://localhost:3000/api/items/${testItem._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      })

      const response = await PUT(request, { params: { id: testItem._id.toString() } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.item.name).toBe('Updated Item')
      expect(data.item.price).toBe(39.99)
      expect(data.item.quantity).toBe(150)
    })

    it('validates updates', async () => {
      const invalidUpdates = {
        price: -10, // Invalid negative price
        quantity: 'invalid', // Invalid quantity type
      }

      const request = new NextRequest(`http://localhost:3000/api/items/${testItem._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invalidUpdates),
      })

      const response = await PUT(request, { params: { id: testItem._id.toString() } })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
    })
  })

  describe('DELETE /api/items/[id]', () => {
    it('deletes an item', async () => {
      const request = new NextRequest(`http://localhost:3000/api/items/${testItem._id}`, {
        method: 'DELETE',
      })

      const response = await DELETE(request, { params: { id: testItem._id.toString() } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)

      // Verify item is deleted
      const deletedItem = await Item.findById(testItem._id)
      expect(deletedItem).toBeNull()
    })

    it('returns 404 for non-existent item', async () => {
      const nonExistentId = new mongoose.Types.ObjectId()
      const request = new NextRequest(`http://localhost:3000/api/items/${nonExistentId}`, {
        method: 'DELETE',
      })

      const response = await DELETE(request, { params: { id: nonExistentId.toString() } })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.success).toBe(false)
    })
  })
}) 