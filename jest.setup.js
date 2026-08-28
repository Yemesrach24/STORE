import '@testing-library/jest-dom'

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter() {
    return {
      route: '/',
      pathname: '/',
      query: {},
      asPath: '/',
      push: jest.fn(),
      pop: jest.fn(),
      reload: jest.fn(),
      back: jest.fn(),
      prefetch: jest.fn().mockResolvedValue(undefined),
      beforePopState: jest.fn(),
      events: {
        on: jest.fn(),
        off: jest.fn(),
        emit: jest.fn(),
      },
      isFallback: false,
    }
  },
}))

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
    }
  },
  useSearchParams() {
    return new URLSearchParams()
  },
  usePathname() {
    return '/'
  },
}))

// Mock next-auth (Google OAuth sessions)
jest.mock('next-auth/react', () => ({
  SessionProvider: ({ children }) => children,
  useSession: () => ({
    data: {
      user: {
        id: 'test-user-id',
        name: 'Test User',
        email: 'test@example.com',
        image: null,
      },
    },
    status: 'authenticated',
  }),
  signIn: jest.fn(),
  signOut: jest.fn(),
}))

// Mock the server-side auth helper used by API routes
jest.mock('@/lib/auth', () => ({
  auth: jest.fn(async () => ({ userId: 'test-user-id' })),
  getCurrentUser: jest.fn(),
  requireAuth: jest.fn(),
  requireAdmin: jest.fn(),
  requireManagerOrAdmin: jest.fn(),
  ensureUserExists: jest.fn(),
}))

// Mock environment variables
process.env.MONGODB_URI = 'mongodb://localhost:27017/test'
process.env.AUTH_SECRET = 'test-secret'
process.env.AUTH_GOOGLE_ID = 'test-google-id'
process.env.AUTH_GOOGLE_SECRET = 'test-google-secret'
process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000'

// Global test utilities
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}))

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}))

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})
