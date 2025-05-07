import { vi } from 'vitest'

// Create a more comprehensive mock Supabase client for testing that matches your implementation
export const mockSupabaseClient = {
  auth: {
    getUser: vi.fn(),
    getSession: vi.fn(),
    signInWithPassword: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
    resetPasswordForEmail: vi.fn(),
    updateUser: vi.fn(),
    onAuthStateChange: vi.fn()
  },
  from: vi.fn(),
  storage: {
    from: vi.fn().mockReturnValue({
      upload: vi.fn(),
      getPublicUrl: vi.fn(),
      list: vi.fn(),
      remove: vi.fn()
    })
  }
}

// Mock the createClient function to return the mock client
export const mockCreateClient = vi.fn().mockReturnValue(mockSupabaseClient)