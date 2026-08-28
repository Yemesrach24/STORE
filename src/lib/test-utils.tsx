import React, { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { SessionProvider } from 'next-auth/react'

// Custom render function that includes providers
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <SessionProvider>
      {children}
    </SessionProvider>
  )
}

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options })

// Re-export everything
export * from '@testing-library/react'

// Override render method
export { customRender as render }

// Test data generators
export const createMockUser = (overrides = {}) => ({
  id: 'test-user-id',
  authId: 'google_test_user_123',
  name: 'Test User',
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
  imageUrl: 'https://example.com/avatar.jpg',
  role: 'user' as const,
  isActive: true,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  ...overrides,
})

export const createMockItem = (overrides = {}) => ({
  id: 'test-item-id',
  name: 'Test Item',
  description: 'A test item for testing',
  sku: 'TEST-001',
  barcode: '1234567890123',
  category: 'test-category-id',
  price: 29.99,
  cost: 15.00,
  quantity: 100,
  minQuantity: 10,
  maxQuantity: 500,
  unit: 'pieces',
  location: 'Warehouse A',
  supplier: 'Test Supplier',
  imageUrl: 'https://example.com/item.jpg',
  tags: ['test', 'sample'],
  isActive: true,
  userId: 'test-user-id',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  ...overrides,
})

export const createMockCategory = (overrides = {}) => ({
  id: 'test-category-id',
  name: 'Test Category',
  description: 'A test category',
  slug: 'test-category',
  parentId: null,
  userId: 'test-user-id',
  isActive: true,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  ...overrides,
})

export const createMockTransaction = (overrides = {}) => ({
  id: 'test-transaction-id',
  itemId: 'test-item-id',
  type: 'IN' as const,
  quantity: 50,
  previousQuantity: 100,
  newQuantity: 150,
  reason: 'Restock',
  reference: 'PO-12345',
  notes: 'Regular restock order',
  cost: 15.00,
  supplier: 'Test Supplier',
  customer: null,
  transactionDate: new Date('2024-01-01'),
  userId: 'test-user-id',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  ...overrides,
})

// Mock API responses
export const mockApiResponse = (data: any, status = 200) => {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
  })
}

// Mock fetch for API testing
export const mockFetch = (response: any, status = 200) => {
  return jest.fn().mockImplementation(() => mockApiResponse(response, status))
}

// Wait for element to be removed
export const waitForElementToBeRemoved = (element: Element | null) => {
  return new Promise<void>((resolve) => {
    if (!element) {
      resolve()
      return
    }

    const observer = new MutationObserver(() => {
      if (!document.contains(element)) {
        observer.disconnect()
        resolve()
      }
    })

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    })
  })
} 
