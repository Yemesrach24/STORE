import React from 'react'
import { render, screen } from '@/lib/test-utils'
import { InventoryCard } from '../inventory/InventoryCard'
import { createMockItem } from '@/lib/test-utils'

describe('InventoryCard', () => {
  const mockItem = createMockItem()

  it('renders item information correctly', () => {
    render(<InventoryCard item={mockItem} />)

    expect(screen.getByText(mockItem.name)).toBeInTheDocument()
    expect(screen.getByText(mockItem.description)).toBeInTheDocument()
    expect(screen.getByText(`$${mockItem.price.toFixed(2)}`)).toBeInTheDocument()
    expect(screen.getByText(`${mockItem.quantity} ${mockItem.unit}`)).toBeInTheDocument()
    expect(screen.getByText(mockItem.location)).toBeInTheDocument()
  })

  it('displays low stock warning when quantity is below minimum', () => {
    const lowStockItem = createMockItem({
      quantity: 5,
      minQuantity: 10,
    })

    render(<InventoryCard item={lowStockItem} />)

    expect(screen.getByText(/low stock/i)).toBeInTheDocument()
  })

  it('displays out of stock warning when quantity is zero', () => {
    const outOfStockItem = createMockItem({
      quantity: 0,
    })

    render(<InventoryCard item={outOfStockItem} />)

    expect(screen.getByText(/out of stock/i)).toBeInTheDocument()
  })

  it('shows correct stock status badge', () => {
    const { rerender } = render(<InventoryCard item={mockItem} />)

    // Normal stock
    expect(screen.getByText('In Stock')).toBeInTheDocument()

    // Low stock
    const lowStockItem = createMockItem({ quantity: 5, minQuantity: 10 })
    rerender(<InventoryCard item={lowStockItem} />)
    expect(screen.getByText('Low Stock')).toBeInTheDocument()

    // Out of stock
    const outOfStockItem = createMockItem({ quantity: 0 })
    rerender(<InventoryCard item={outOfStockItem} />)
    expect(screen.getByText('Out of Stock')).toBeInTheDocument()
  })

  it('displays SKU and barcode information', () => {
    render(<InventoryCard item={mockItem} />)

    expect(screen.getByText(`SKU: ${mockItem.sku}`)).toBeInTheDocument()
    expect(screen.getByText(`Barcode: ${mockItem.barcode}`)).toBeInTheDocument()
  })

  it('shows supplier information when available', () => {
    render(<InventoryCard item={mockItem} />)

    expect(screen.getByText(`Supplier: ${mockItem.supplier}`)).toBeInTheDocument()
  })

  it('displays tags when available', () => {
    const itemWithTags = createMockItem({
      tags: ['electronics', 'gadgets', 'tech'],
    })

    render(<InventoryCard item={itemWithTags} />)

    expect(screen.getByText('electronics')).toBeInTheDocument()
    expect(screen.getByText('gadgets')).toBeInTheDocument()
    expect(screen.getByText('tech')).toBeInTheDocument()
  })

  it('handles items without tags gracefully', () => {
    const itemWithoutTags = createMockItem({
      tags: [],
    })

    render(<InventoryCard item={itemWithoutTags} />)

    // Should still render without errors
    expect(screen.getByText(itemWithoutTags.name)).toBeInTheDocument()
  })

  it('displays total value calculation', () => {
    const item = createMockItem({
      price: 25.00,
      quantity: 10,
    })

    render(<InventoryCard item={item} />)

    const totalValue = (item.price * item.quantity).toFixed(2)
    expect(screen.getByText(`Total Value: $${totalValue}`)).toBeInTheDocument()
  })
}) 