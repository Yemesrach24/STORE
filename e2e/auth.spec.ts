import { test, expect } from '@playwright/test'

test.describe('Authentication Flow', () => {
  test('should redirect unauthenticated users to sign-in page', async ({ page }) => {
    await page.goto('/dashboard')
    
    // Should redirect to sign-in page
    await expect(page).toHaveURL(/.*sign-in/)
  })

  test('should display sign-in form', async ({ page }) => {
    await page.goto('/sign-in')
    
    await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible()
    await expect(page.getByLabel(/email/i)).toBeVisible()
    await expect(page.getByLabel(/password/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible()
  })

  test('should display sign-up form', async ({ page }) => {
    await page.goto('/sign-up')
    
    await expect(page.getByRole('heading', { name: /sign up/i })).toBeVisible()
    await expect(page.getByLabel(/first name/i)).toBeVisible()
    await expect(page.getByLabel(/last name/i)).toBeVisible()
    await expect(page.getByLabel(/email/i)).toBeVisible()
    await expect(page.getByLabel(/password/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /sign up/i })).toBeVisible()
  })

  test('should navigate between sign-in and sign-up pages', async ({ page }) => {
    await page.goto('/sign-in')
    
    // Click link to sign-up
    await page.getByRole('link', { name: /create an account/i }).click()
    await expect(page).toHaveURL(/.*sign-up/)
    
    // Click link back to sign-in
    await page.getByRole('link', { name: /already have an account/i }).click()
    await expect(page).toHaveURL(/.*sign-in/)
  })

  test('should display forgot password form', async ({ page }) => {
    await page.goto('/forgot-password')
    
    await expect(page.getByRole('heading', { name: /forgot password/i })).toBeVisible()
    await expect(page.getByLabel(/email/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /send reset link/i })).toBeVisible()
  })

  test('should validate form fields', async ({ page }) => {
    await page.goto('/sign-in')
    
    // Try to submit empty form
    await page.getByRole('button', { name: /sign in/i }).click()
    
    // Should show validation errors
    await expect(page.getByText(/email is required/i)).toBeVisible()
    await expect(page.getByText(/password is required/i)).toBeVisible()
  })

  test('should validate email format', async ({ page }) => {
    await page.goto('/sign-in')
    
    // Enter invalid email
    await page.getByLabel(/email/i).fill('invalid-email')
    await page.getByLabel(/password/i).fill('password123')
    await page.getByRole('button', { name: /sign in/i }).click()
    
    // Should show email validation error
    await expect(page.getByText(/invalid email address/i)).toBeVisible()
  })

  test('should validate password strength on sign-up', async ({ page }) => {
    await page.goto('/sign-up')
    
    // Fill form with weak password
    await page.getByLabel(/first name/i).fill('John')
    await page.getByLabel(/last name/i).fill('Doe')
    await page.getByLabel(/email/i).fill('john@example.com')
    await page.getByLabel(/password/i).fill('123')
    await page.getByRole('button', { name: /sign up/i }).click()
    
    // Should show password strength error
    await expect(page.getByText(/password must be at least/i)).toBeVisible()
  })
}) 