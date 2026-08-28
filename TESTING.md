# Testing Documentation

This document provides comprehensive information about the testing setup and practices for the Inventory Management System.

## Table of Contents

1. [Testing Overview](#testing-overview)
2. [Test Types](#test-types)
3. [Running Tests](#running-tests)
4. [Test Structure](#test-structure)
5. [Writing Tests](#writing-tests)
6. [Mock Data](#mock-data)
7. [CI/CD Integration](#cicd-integration)
8. [Best Practices](#best-practices)

## Testing Overview

Our testing strategy follows a pyramid approach:
- **Unit Tests**: Fast, isolated tests for individual components and functions
- **Integration Tests**: Tests for component interactions and API endpoints
- **E2E Tests**: Full user journey tests using Playwright
- **API Tests**: Dedicated tests for backend API functionality

## Test Types

### 1. Unit Tests (Jest + React Testing Library)

Unit tests focus on testing individual components and functions in isolation.

**Location**: `src/components/__tests__/` and `src/lib/__tests__/`

**Example**:
```typescript
import { render, screen } from '@/lib/test-utils'
import { InventoryCard } from '../inventory/InventoryCard'

describe('InventoryCard', () => {
  it('renders item information correctly', () => {
    render(<InventoryCard item={mockItem} />)
    expect(screen.getByText(mockItem.name)).toBeInTheDocument()
  })
})
```

### 2. Integration Tests

Integration tests verify that components work together correctly.

**Location**: `src/__tests__/integration/`

**Example**:
```typescript
describe('Inventory Management Flow', () => {
  it('completes full CRUD workflow', async () => {
    // Test complete user workflow
  })
})
```

### 3. API Tests

API tests verify backend endpoints work correctly.

**Location**: `src/app/api/__tests__/`

**Example**:
```typescript
describe('/api/items', () => {
  it('returns items for authenticated user', async () => {
    const response = await GET(request)
    expect(response.status).toBe(200)
  })
})
```

### 4. E2E Tests (Playwright)

End-to-end tests simulate real user interactions.

**Location**: `e2e/`

**Example**:
```typescript
test('should complete inventory workflow', async ({ page }) => {
  await page.goto('/dashboard')
  await page.click('[data-testid="add-item"]')
  // ... complete user journey
})
```

## Running Tests

### Unit and Integration Tests

```bash
# Run all tests
npm test

# Run unit tests only
npm run test:unit

# Run integration tests only
npm run test:integration

# Run API tests
npm run test:api-jest

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

### E2E Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e:ui

# Run E2E tests in debug mode
npm run test:e2e:debug

# Run E2E tests in headed mode
npm run test:e2e:headed
```

### Database Seeding

```bash
# Seed development database
npm run seed

# Seed test database
npm run test:seed

# Seed production database
npm run db:seed
```

## Test Structure

```
src/
├── components/
│   └── __tests__/           # Component unit tests
├── lib/
│   └── __tests__/           # Utility function tests
├── app/
│   └── api/
│       └── __tests__/       # API endpoint tests
└── __tests__/
    └── integration/         # Integration tests

e2e/                         # E2E tests
├── auth.spec.ts
├── dashboard.spec.ts
└── inventory.spec.ts

jest.config.js               # Jest configuration
jest.setup.js               # Jest setup file
playwright.config.ts        # Playwright configuration
```

## Writing Tests

### Component Tests

1. **Use test utilities**: Import from `@/lib/test-utils`
2. **Test user interactions**: Use `fireEvent` and `userEvent`
3. **Test accessibility**: Use `getByRole`, `getByLabelText`
4. **Test error states**: Mock API failures
5. **Test loading states**: Verify loading indicators

```typescript
import { render, screen, fireEvent, waitFor } from '@/lib/test-utils'
import { Component } from '../Component'

describe('Component', () => {
  it('handles user interaction', async () => {
    render(<Component />)
    
    fireEvent.click(screen.getByRole('button'))
    
    await waitFor(() => {
      expect(screen.getByText('Success')).toBeInTheDocument()
    })
  })
})
```

### API Tests

1. **Mock authentication**: Use the next-auth/react and @/lib/auth mocks in jest.setup.js
2. **Test database operations**: Use test database
3. **Test validation**: Send invalid data
4. **Test authorization**: Test role-based access
5. **Test error handling**: Verify error responses

```typescript
describe('/api/items', () => {
  beforeEach(async () => {
    await cleanupTestDatabase()
    // Setup test data
  })

  it('validates required fields', async () => {
    const response = await POST(request, invalidData)
    expect(response.status).toBe(400)
  })
})
```

### E2E Tests

1. **Test user journeys**: Complete workflows
2. **Test responsive design**: Different viewport sizes
3. **Test accessibility**: Keyboard navigation
4. **Test performance**: Page load times
5. **Test error scenarios**: Network failures

```typescript
test('should handle form validation', async ({ page }) => {
  await page.goto('/sign-in')
  await page.click('button[type="submit"]')
  
  await expect(page.getByText('Email is required')).toBeVisible()
})
```

## Mock Data

### Test Data Generators

Located in `src/lib/test-utils.tsx` and `src/lib/test-seed.ts`:

```typescript
// Create mock data
const mockUser = createMockUser({ role: 'admin' })
const mockItem = createMockItem({ quantity: 0 })
const mockCategory = createMockCategory({ name: 'Electronics' })
```

### Database Seeding

```typescript
// Seed test database
await seedTestDatabase()

// Clean up after tests
await cleanupTestDatabase()
```

### API Mocking

```typescript
// Mock API responses
jest.mock('@/lib/api', () => ({
  getItems: jest.fn().mockResolvedValue({ items: mockItems }),
  createItem: jest.fn().mockResolvedValue({ success: true }),
}))
```

## CI/CD Integration

### GitHub Actions Workflow

The CI/CD pipeline includes:

1. **Lint and Type Check**: ESLint and TypeScript validation
2. **Unit Tests**: Jest tests with coverage
3. **Integration Tests**: Component interaction tests
4. **E2E Tests**: Playwright tests
5. **Security Audit**: npm audit and Snyk
6. **Build and Deploy**: Production deployment
7. **Performance Testing**: Lighthouse CI
8. **Database Operations**: Migrations and seeding

### Environment Setup

```yaml
# Test environment variables
MONGODB_URI: mongodb://localhost:27017/test
AUTH_SECRET: test-secret
AUTH_GOOGLE_ID: test-google-id
AUTH_GOOGLE_SECRET: test-google-secret
```

### Test Reports

- **Coverage**: Codecov integration
- **E2E Reports**: Playwright HTML reports
- **Performance**: Lighthouse reports
- **Security**: Snyk vulnerability reports

## Best Practices

### 1. Test Organization

- Group related tests using `describe` blocks
- Use descriptive test names
- Follow AAA pattern (Arrange, Act, Assert)
- Keep tests independent and isolated

### 2. Test Data Management

- Use factories for creating test data
- Clean up after each test
- Use realistic but minimal test data
- Avoid hardcoded values

### 3. Assertions

- Test behavior, not implementation
- Use semantic queries (getByRole, getByLabelText)
- Test accessibility features
- Verify error states and edge cases

### 4. Performance

- Keep tests fast and focused
- Use mocks for external dependencies
- Avoid unnecessary setup/teardown
- Run tests in parallel when possible

### 5. Maintenance

- Update tests when features change
- Remove obsolete tests
- Keep test utilities up to date
- Document complex test scenarios

### 6. Accessibility Testing

```typescript
// Test keyboard navigation
await page.keyboard.press('Tab')
await expect(page.getByRole('button')).toHaveFocus()

// Test screen reader compatibility
await expect(page.getByRole('alert')).toBeVisible()
```

### 7. Error Handling

```typescript
// Test API errors
await page.route('**/api/items', route => {
  route.fulfill({ status: 500 })
})

// Test network failures
await page.route('**/*', route => {
  route.abort()
})
```

## Troubleshooting

### Common Issues

1. **Tests failing intermittently**: Add proper wait conditions
2. **Mock not working**: Check import paths and mock setup
3. **Database connection issues**: Verify test database setup
4. **E2E tests timing out**: Increase timeouts or add waits

### Debug Commands

```bash
# Debug Jest tests
npm run test:watch

# Debug E2E tests
npm run test:e2e:debug

# Run specific test file
npm test -- --testPathPattern=Component.test.tsx

# Run tests with verbose output
npm test -- --verbose
```

## Coverage Goals

- **Unit Tests**: 80%+ coverage
- **Integration Tests**: Critical user flows
- **E2E Tests**: Main user journeys
- **API Tests**: All endpoints

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Playwright Documentation](https://playwright.dev/docs/intro)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library) 