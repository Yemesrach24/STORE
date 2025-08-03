import { test, expect } from '@playwright/test'

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication - you'll need to implement this based on your auth setup
    // For now, we'll assume the user is already authenticated
    await page.goto('/dashboard')
  })

  test('should display dashboard layout', async ({ page }) => {
    // Check for sidebar navigation
    await expect(page.getByRole('navigation')).toBeVisible()
    await expect(page.getByRole('link', { name: /dashboard/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /inventory/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /profile/i })).toBeVisible()

    // Check for header
    await expect(page.getByRole('banner')).toBeVisible()
    await expect(page.getByPlaceholder(/search/i)).toBeVisible()
  })

  test('should display dashboard stats', async ({ page }) => {
    // Check for stats cards
    await expect(page.getByText(/total items/i)).toBeVisible()
    await expect(page.getByText(/low stock/i)).toBeVisible()
    await expect(page.getByText(/out of stock/i)).toBeVisible()
    await expect(page.getByText(/total value/i)).toBeVisible()
  })

  test('should display recent items', async ({ page }) => {
    // Check for recent items section
    await expect(page.getByRole('heading', { name: /recent items/i })).toBeVisible()
    
    // Should show a table or grid of items
    await expect(page.getByRole('table')).toBeVisible()
  })

  test('should navigate to inventory page', async ({ page }) => {
    await page.getByRole('link', { name: /inventory/i }).click()
    await expect(page).toHaveURL(/.*inventory/)
  })

  test('should navigate to profile page', async ({ page }) => {
    await page.getByRole('link', { name: /profile/i }).click()
    await expect(page).toHaveURL(/.*profile/)
  })

  test('should handle search functionality', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/search/i)
    await searchInput.fill('test item')
    await searchInput.press('Enter')
    
    // Should navigate to inventory with search query
    await expect(page).toHaveURL(/.*inventory.*search=test%20item/)
  })

  test('should display user menu', async ({ page }) => {
    // Click on user avatar/button
    await page.getByRole('button', { name: /user menu/i }).click()
    
    // Should show user menu options
    await expect(page.getByRole('menuitem', { name: /profile/i })).toBeVisible()
    await expect(page.getByRole('menuitem', { name: /settings/i })).toBeVisible()
    await expect(page.getByRole('menuitem', { name: /sign out/i })).toBeVisible()
  })

  test('should handle mobile navigation', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    
    // Mobile menu button should be visible
    await expect(page.getByRole('button', { name: /menu/i })).toBeVisible()
    
    // Click mobile menu
    await page.getByRole('button', { name: /menu/i }).click()
    
    // Navigation should be visible in mobile menu
    await expect(page.getByRole('link', { name: /inventory/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /profile/i })).toBeVisible()
  })

  test('should display quick actions', async ({ page }) => {
    // Check for quick action buttons
    await expect(page.getByRole('button', { name: /add item/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /view all items/i })).toBeVisible()
  })

  test('should handle quick action - add item', async ({ page }) => {
    await page.getByRole('button', { name: /add item/i }).click()
    
    // Should open add item modal or navigate to add item page
    await expect(page.getByRole('dialog')).toBeVisible()
    // OR
    // await expect(page).toHaveURL(/.*inventory.*new/)
  })

  test('should handle quick action - view all items', async ({ page }) => {
    await page.getByRole('button', { name: /view all items/i }).click()
    await expect(page).toHaveURL(/.*inventory/)
  })

  test('should display notifications', async ({ page }) => {
    // Check for notification bell
    await expect(page.getByRole('button', { name: /notifications/i })).toBeVisible()
    
    // Click notification bell
    await page.getByRole('button', { name: /notifications/i }).click()
    
    // Should show notifications panel
    await expect(page.getByRole('dialog')).toBeVisible()
  })

  test('should handle loading states', async ({ page }) => {
    // Navigate to dashboard and check for loading indicators
    await page.goto('/dashboard')
    
    // Should show loading states initially
    await expect(page.getByTestId('loading-spinner')).toBeVisible()
    
    // Wait for content to load
    await expect(page.getByText(/total items/i)).toBeVisible()
    
    // Loading spinner should be hidden
    await expect(page.getByTestId('loading-spinner')).not.toBeVisible()
  })

  test('should handle error states', async ({ page }) => {
    // Mock API error by intercepting requests
    await page.route('**/api/dashboard', route => {
      route.fulfill({ status: 500, body: 'Internal Server Error' })
    })
    
    await page.goto('/dashboard')
    
    // Should show error message
    await expect(page.getByText(/error loading dashboard/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /retry/i })).toBeVisible()
  })

  test('should handle empty states', async ({ page }) => {
    // Mock empty data
    await page.route('**/api/dashboard', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          totalItems: 0,
          lowStockItems: 0,
          outOfStockItems: 0,
          totalValue: 0,
          recentItems: []
        })
      })
    })
    
    await page.goto('/dashboard')
    
    // Should show empty state message
    await expect(page.getByText(/no items found/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /add your first item/i })).toBeVisible()
  })
}) 