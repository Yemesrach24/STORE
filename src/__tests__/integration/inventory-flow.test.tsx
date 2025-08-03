import React from 'react'
import { render, screen, fireEvent, waitFor } from '@/lib/test-utils'
import { InventoryTable } from '@/components/inventory/InventoryTable'
import { ItemFormModal } from '@/components/inventory/ItemFormModal'
import { createMockItem, createMockCategory } from '@/lib/test-utils'

// Mock API calls
jest.mock('@/lib/api', () => ({
  getItems: jest.fn(),
  createItem: jest.fn(),
  updateItem: jest.fn(),
  deleteItem: jest.fn(),
  getCategories: jest.fn(),
}))

describe('Inventory Management Flow', () => {
  const mockItems = [
    createMockItem({ id: '1', name: 'Laptop', quantity: 10 }),
    createMockItem({ id: '2', name: 'Mouse', quantity: 50 }),
    createMockItem({ id: '3', name: 'Keyboard', quantity: 25 }),
  ]

  const mockCategories = [
    createMockCategory({ id: '1', name: 'Electronics' }),
    createMockCategory({ id: '2', name: 'Accessories' }),
  ]

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Inventory Table Integration', () => {
    it('displays items and handles search', async () => {
      const { getItems } = require('@/lib/api')
      getItems.mockResolvedValue({
        items: mockItems,
        pagination: { page: 1, total: 3, pages: 1 },
      })

      render(<InventoryTable />)

      // Wait for items to load
      await waitFor(() => {
        expect(screen.getByText('Laptop')).toBeInTheDocument()
        expect(screen.getByText('Mouse')).toBeInTheDocument()
        expect(screen.getByText('Keyboard')).toBeInTheDocument()
      })

      // Test search functionality
      const searchInput = screen.getByPlaceholderText(/search items/i)
      fireEvent.change(searchInput, { target: { value: 'Laptop' } })

      await waitFor(() => {
        expect(screen.getByText('Laptop')).toBeInTheDocument()
        expect(screen.queryByText('Mouse')).not.toBeInTheDocument()
        expect(screen.queryByText('Keyboard')).not.toBeInTheDocument()
      })
    })

    it('handles item deletion with confirmation', async () => {
      const { getItems, deleteItem } = require('@/lib/api')
      getItems.mockResolvedValue({
        items: mockItems,
        pagination: { page: 1, total: 3, pages: 1 },
      })
      deleteItem.mockResolvedValue({ success: true })

      render(<InventoryTable />)

      await waitFor(() => {
        expect(screen.getByText('Laptop')).toBeInTheDocument()
      })

      // Click delete button for first item
      const deleteButtons = screen.getAllByRole('button', { name: /delete/i })
      fireEvent.click(deleteButtons[0])

      // Confirm deletion
      await waitFor(() => {
        expect(screen.getByText(/are you sure/i)).toBeInTheDocument()
      })

      const confirmButton = screen.getByRole('button', { name: /confirm/i })
      fireEvent.click(confirmButton)

      await waitFor(() => {
        expect(deleteItem).toHaveBeenCalledWith('1')
      })
    })

    it('handles sorting and filtering', async () => {
      const { getItems } = require('@/lib/api')
      getItems.mockResolvedValue({
        items: mockItems,
        pagination: { page: 1, total: 3, pages: 1 },
      })

      render(<InventoryTable />)

      await waitFor(() => {
        expect(screen.getByText('Laptop')).toBeInTheDocument()
      })

      // Test sorting by name
      const nameHeader = screen.getByText(/name/i)
      fireEvent.click(nameHeader)

      await waitFor(() => {
        expect(getItems).toHaveBeenCalledWith(
          expect.objectContaining({
            sortBy: 'name',
            sortOrder: 'asc',
          })
        )
      })

      // Test category filtering
      const categoryFilter = screen.getByLabelText(/category/i)
      fireEvent.change(categoryFilter, { target: { value: '1' } })

      await waitFor(() => {
        expect(getItems).toHaveBeenCalledWith(
          expect.objectContaining({
            category: '1',
          })
        )
      })
    })
  })

  describe('Item Form Modal Integration', () => {
    it('creates a new item successfully', async () => {
      const { createItem, getCategories } = require('@/lib/api')
      createItem.mockResolvedValue({ success: true, item: mockItems[0] })
      getCategories.mockResolvedValue({ categories: mockCategories })

      render(<ItemFormModal open={true} onClose={() => {}} />)

      // Wait for categories to load
      await waitFor(() => {
        expect(screen.getByText('Electronics')).toBeInTheDocument()
      })

      // Fill out the form
      fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'New Item' } })
      fireEvent.change(screen.getByLabelText(/description/i), { target: { value: 'A new test item' } })
      fireEvent.change(screen.getByLabelText(/sku/i), { target: { value: 'NEW-001' } })
      fireEvent.change(screen.getByLabelText(/price/i), { target: { value: '29.99' } })
      fireEvent.change(screen.getByLabelText(/cost/i), { target: { value: '15.00' } })
      fireEvent.change(screen.getByLabelText(/quantity/i), { target: { value: '100' } })
      fireEvent.change(screen.getByLabelText(/unit/i), { target: { value: 'pieces' } })

      // Select category
      const categorySelect = screen.getByLabelText(/category/i)
      fireEvent.change(categorySelect, { target: { value: '1' } })

      // Submit form
      const submitButton = screen.getByRole('button', { name: /save/i })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(createItem).toHaveBeenCalledWith({
          name: 'New Item',
          description: 'A new test item',
          sku: 'NEW-001',
          price: 29.99,
          cost: 15.00,
          quantity: 100,
          unit: 'pieces',
          category: '1',
        })
      })
    })

    it('validates form fields before submission', async () => {
      const { getCategories } = require('@/lib/api')
      getCategories.mockResolvedValue({ categories: mockCategories })

      render(<ItemFormModal open={true} onClose={() => {}} />)

      await waitFor(() => {
        expect(screen.getByText('Electronics')).toBeInTheDocument()
      })

      // Try to submit without required fields
      const submitButton = screen.getByRole('button', { name: /save/i })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/name is required/i)).toBeInTheDocument()
        expect(screen.getByText(/sku is required/i)).toBeInTheDocument()
        expect(screen.getByText(/price is required/i)).toBeInTheDocument()
      })
    })

    it('updates an existing item', async () => {
      const { updateItem, getCategories } = require('@/lib/api')
      updateItem.mockResolvedValue({ success: true, item: mockItems[0] })
      getCategories.mockResolvedValue({ categories: mockCategories })

      const existingItem = mockItems[0]
      render(<ItemFormModal open={true} onClose={() => {}} item={existingItem} />)

      await waitFor(() => {
        expect(screen.getByDisplayValue('Laptop')).toBeInTheDocument()
      })

      // Update the name
      fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'Updated Laptop' } })

      // Submit form
      const submitButton = screen.getByRole('button', { name: /save/i })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(updateItem).toHaveBeenCalledWith(existingItem.id, {
          name: 'Updated Laptop',
          description: existingItem.description,
          sku: existingItem.sku,
          price: existingItem.price,
          cost: existingItem.cost,
          quantity: existingItem.quantity,
          unit: existingItem.unit,
          category: existingItem.category,
        })
      })
    })

    it('handles form submission errors', async () => {
      const { createItem, getCategories } = require('@/lib/api')
      createItem.mockRejectedValue(new Error('Creation failed'))
      getCategories.mockResolvedValue({ categories: mockCategories })

      render(<ItemFormModal open={true} onClose={() => {}} />)

      await waitFor(() => {
        expect(screen.getByText('Electronics')).toBeInTheDocument()
      })

      // Fill out required fields
      fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'New Item' } })
      fireEvent.change(screen.getByLabelText(/sku/i), { target: { value: 'NEW-001' } })
      fireEvent.change(screen.getByLabelText(/price/i), { target: { value: '29.99' } })

      // Submit form
      const submitButton = screen.getByRole('button', { name: /save/i })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/failed to save item/i)).toBeInTheDocument()
      })
    })
  })

  describe('Complete Inventory Workflow', () => {
    it('completes full CRUD workflow', async () => {
      const { getItems, createItem, updateItem, deleteItem, getCategories } = require('@/lib/api')
      
      // Initial load
      getItems.mockResolvedValue({
        items: mockItems,
        pagination: { page: 1, total: 3, pages: 1 },
      })
      getCategories.mockResolvedValue({ categories: mockCategories })

      render(
        <div>
          <InventoryTable />
          <ItemFormModal open={false} onClose={() => {}} />
        </div>
      )

      // Verify initial items are loaded
      await waitFor(() => {
        expect(screen.getByText('Laptop')).toBeInTheDocument()
        expect(screen.getByText('Mouse')).toBeInTheDocument()
      })

      // Create new item
      createItem.mockResolvedValue({ success: true, item: { ...mockItems[0], id: '4', name: 'New Item' } })
      
      const addButton = screen.getByRole('button', { name: /add item/i })
      fireEvent.click(addButton)

      // Fill and submit new item form
      await waitFor(() => {
        expect(screen.getByLabelText(/name/i)).toBeInTheDocument()
      })

      fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'New Item' } })
      fireEvent.change(screen.getByLabelText(/sku/i), { target: { value: 'NEW-001' } })
      fireEvent.change(screen.getByLabelText(/price/i), { target: { value: '19.99' } })

      const saveButton = screen.getByRole('button', { name: /save/i })
      fireEvent.click(saveButton)

      await waitFor(() => {
        expect(createItem).toHaveBeenCalled()
      })

      // Update existing item
      updateItem.mockResolvedValue({ success: true, item: { ...mockItems[0], name: 'Updated Laptop' } })
      
      const editButtons = screen.getAllByRole('button', { name: /edit/i })
      fireEvent.click(editButtons[0])

      await waitFor(() => {
        expect(screen.getByDisplayValue('Laptop')).toBeInTheDocument()
      })

      fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'Updated Laptop' } })
      fireEvent.click(saveButton)

      await waitFor(() => {
        expect(updateItem).toHaveBeenCalled()
      })

      // Delete item
      deleteItem.mockResolvedValue({ success: true })
      
      const deleteButtons = screen.getAllByRole('button', { name: /delete/i })
      fireEvent.click(deleteButtons[0])

      await waitFor(() => {
        expect(screen.getByText(/are you sure/i)).toBeInTheDocument()
      })

      const confirmButton = screen.getByRole('button', { name: /confirm/i })
      fireEvent.click(confirmButton)

      await waitFor(() => {
        expect(deleteItem).toHaveBeenCalled()
      })
    })
  })
}) 