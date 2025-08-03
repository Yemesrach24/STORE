import React from 'react'
import { render, screen, fireEvent, waitFor } from '@/lib/test-utils'
import { ProfileForm } from '../profile/ProfileForm'
import { createMockUser } from '@/lib/test-utils'

// Mock the API call
jest.mock('@/lib/api', () => ({
  updateUserProfile: jest.fn(),
}))

describe('ProfileForm', () => {
  const mockUser = createMockUser()
  const mockOnUpdate = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders form fields with user data', () => {
    render(<ProfileForm user={mockUser} onUpdate={mockOnUpdate} />)

    expect(screen.getByLabelText(/first name/i)).toHaveValue(mockUser.firstName)
    expect(screen.getByLabelText(/last name/i)).toHaveValue(mockUser.lastName)
    expect(screen.getByLabelText(/display name/i)).toHaveValue(mockUser.name)
    expect(screen.getByLabelText(/phone/i)).toHaveValue(mockUser.phone || '')
    expect(screen.getByLabelText(/location/i)).toHaveValue(mockUser.location || '')
    expect(screen.getByLabelText(/bio/i)).toHaveValue(mockUser.bio || '')
  })

  it('validates required fields', async () => {
    render(<ProfileForm user={mockUser} onUpdate={mockOnUpdate} />)

    // Clear required fields
    fireEvent.change(screen.getByLabelText(/first name/i), { target: { value: '' } })
    fireEvent.change(screen.getByLabelText(/last name/i), { target: { value: '' } })

    // Submit form
    fireEvent.click(screen.getByRole('button', { name: /save changes/i }))

    await waitFor(() => {
      expect(screen.getByText(/first name is required/i)).toBeInTheDocument()
      expect(screen.getByText(/last name is required/i)).toBeInTheDocument()
    })
  })

  it('validates email format', async () => {
    render(<ProfileForm user={mockUser} onUpdate={mockOnUpdate} />)

    // Enter invalid email
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'invalid-email' } })

    // Submit form
    fireEvent.click(screen.getByRole('button', { name: /save changes/i }))

    await waitFor(() => {
      expect(screen.getByText(/invalid email address/i)).toBeInTheDocument()
    })
  })

  it('validates phone number format', async () => {
    render(<ProfileForm user={mockUser} onUpdate={mockOnUpdate} />)

    // Enter invalid phone
    fireEvent.change(screen.getByLabelText(/phone/i), { target: { value: 'invalid-phone' } })

    // Submit form
    fireEvent.click(screen.getByRole('button', { name: /save changes/i }))

    await waitFor(() => {
      expect(screen.getByText(/invalid phone number/i)).toBeInTheDocument()
    })
  })

  it('submits form with valid data', async () => {
    const { updateUserProfile } = require('@/lib/api')
    updateUserProfile.mockResolvedValue({ success: true })

    render(<ProfileForm user={mockUser} onUpdate={mockOnUpdate} />)

    // Update form fields
    fireEvent.change(screen.getByLabelText(/first name/i), { target: { value: 'John' } })
    fireEvent.change(screen.getByLabelText(/last name/i), { target: { value: 'Doe' } })
    fireEvent.change(screen.getByLabelText(/display name/i), { target: { value: 'John Doe' } })
    fireEvent.change(screen.getByLabelText(/phone/i), { target: { value: '+1-555-123-4567' } })
    fireEvent.change(screen.getByLabelText(/location/i), { target: { value: 'New York' } })
    fireEvent.change(screen.getByLabelText(/bio/i), { target: { value: 'Software Developer' } })

    // Submit form
    fireEvent.click(screen.getByRole('button', { name: /save changes/i }))

    await waitFor(() => {
      expect(updateUserProfile).toHaveBeenCalledWith({
        firstName: 'John',
        lastName: 'Doe',
        name: 'John Doe',
        phone: '+1-555-123-4567',
        location: 'New York',
        bio: 'Software Developer',
      })
      expect(mockOnUpdate).toHaveBeenCalled()
    })
  })

  it('handles form submission errors', async () => {
    const { updateUserProfile } = require('@/lib/api')
    updateUserProfile.mockRejectedValue(new Error('Update failed'))

    render(<ProfileForm user={mockUser} onUpdate={mockOnUpdate} />)

    // Submit form
    fireEvent.click(screen.getByRole('button', { name: /save changes/i }))

    await waitFor(() => {
      expect(screen.getByText(/failed to update profile/i)).toBeInTheDocument()
    })
  })

  it('shows loading state during submission', async () => {
    const { updateUserProfile } = require('@/lib/api')
    updateUserProfile.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)))

    render(<ProfileForm user={mockUser} onUpdate={mockOnUpdate} />)

    // Submit form
    fireEvent.click(screen.getByRole('button', { name: /save changes/i }))

    expect(screen.getByRole('button', { name: /saving/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /saving/i })).toBeDisabled()
  })

  it('handles avatar upload', async () => {
    render(<ProfileForm user={mockUser} onUpdate={mockOnUpdate} />)

    const file = new File(['avatar'], 'avatar.jpg', { type: 'image/jpeg' })
    const input = screen.getByLabelText(/upload avatar/i)

    fireEvent.change(input, { target: { files: [file] } })

    await waitFor(() => {
      expect(screen.getByText('avatar.jpg')).toBeInTheDocument()
    })
  })

  it('validates avatar file type', async () => {
    render(<ProfileForm user={mockUser} onUpdate={mockOnUpdate} />)

    const file = new File(['document'], 'document.pdf', { type: 'application/pdf' })
    const input = screen.getByLabelText(/upload avatar/i)

    fireEvent.change(input, { target: { files: [file] } })

    await waitFor(() => {
      expect(screen.getByText(/please select a valid image file/i)).toBeInTheDocument()
    })
  })

  it('validates avatar file size', async () => {
    render(<ProfileForm user={mockUser} onUpdate={mockOnUpdate} />)

    // Create a large file (5MB)
    const largeFile = new File(['x'.repeat(5 * 1024 * 1024)], 'large.jpg', { type: 'image/jpeg' })
    const input = screen.getByLabelText(/upload avatar/i)

    fireEvent.change(input, { target: { files: [largeFile] } })

    await waitFor(() => {
      expect(screen.getByText(/file size must be less than 5MB/i)).toBeInTheDocument()
    })
  })

  it('resets form to original values', () => {
    render(<ProfileForm user={mockUser} onUpdate={mockOnUpdate} />)

    // Change a field
    fireEvent.change(screen.getByLabelText(/first name/i), { target: { value: 'Changed' } })

    // Reset form
    fireEvent.click(screen.getByRole('button', { name: /reset/i }))

    expect(screen.getByLabelText(/first name/i)).toHaveValue(mockUser.firstName)
  })
}) 