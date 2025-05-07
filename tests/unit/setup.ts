// This file contains global setup for tests

// Vitest automatically imports this file
import { beforeAll, afterAll, afterEach, expect, vi } from 'vitest'
import { cleanup } from '@testing-library/vue'

// Clean up after each test to prevent state leakage
afterEach(() => {
  cleanup()
})

// You can add global mocks here
beforeAll(() => {
  // Mock window.matchMedia
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  })
})

// Clean up all mocks after all tests
afterAll(() => {
  vi.resetAllMocks()
})