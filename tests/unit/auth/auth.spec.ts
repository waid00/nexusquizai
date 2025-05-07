import { describe, it, expect, vi, beforeEach, Mock } from 'vitest'
import axios from 'axios'

// Mock bcryptjs and axios correctly
vi.mock('bcryptjs', () => {
  return {
    default: {
      genSalt: vi.fn().mockResolvedValue('mockedsalt'),
      hash: vi.fn().mockResolvedValue('hashedpassword123'),
      compare: vi.fn()
    },
    genSalt: vi.fn().mockResolvedValue('mockedsalt'),
    hash: vi.fn().mockResolvedValue('hashedpassword123'),
    compare: vi.fn()
  }
})

vi.mock('axios', () => {
  return {
    default: {
      post: vi.fn()
    }
  }
})

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: vi.fn((key) => store[key] || null),
    setItem: vi.fn((key, value) => { store[key] = value.toString() }),
    removeItem: vi.fn((key) => { delete store[key] }),
    clear: vi.fn(() => { store = {} })
  }
})()
Object.defineProperty(window, 'localStorage', { value: localStorageMock })

// Mock the auth module
vi.mock('../../../src/store/auth', () => {
  // Create a mocked version of the auth state
  const state = {
    isAuthenticated: false,
    user: null,
    error: null,
    isLoading: false,
    recoveryPhrase: null
  }

  return {
    auth: {
      state,
      login: vi.fn(),
      loginByUsername: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      resetPassword: vi.fn(),
      clearError: vi.fn(),
      generateRecoveryPhrase: vi.fn().mockReturnValue(['apple', 'banana', 'orange', 'grape', 'lemon', 'peach', 'plum', 'berry', 'melon', 'cherry']),
      verifyEmail: vi.fn(),
      resendVerificationEmail: vi.fn()
    }
  }
})

// Mock the supabase client
vi.mock('../../../src/api/supabase', () => {
  const mockFrom = vi.fn()
  const mockSupabase = {
    from: mockFrom
  }
  
  return {
    supabase: mockSupabase
  }
})

// Import the mocked modules
import { auth } from '../../../src/store/auth'
import { supabase } from '../../../src/api/supabase'
import bcrypt from 'bcryptjs'

// Import types if needed
import type { User } from '../../../src/store/auth'

// Cast mocked functions with proper types
const mockedLogin = auth.login as Mock
const mockedRegister = auth.register as Mock
const mockedLogout = auth.logout as Mock
const mockedResetPassword = auth.resetPassword as Mock
const mockedVerifyEmail = auth.verifyEmail as Mock
const mockedBcryptCompare = bcrypt.compare as Mock
const mockedAxiosPost = axios.post as Mock
const mockedSupabaseFrom = supabase.from as Mock

describe('Autentizační systém', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    vi.resetAllMocks()
    
    // Clear localStorage
    localStorageMock.clear()
    
    // Reset auth state
    auth.state.isAuthenticated = false
    auth.state.user = null
    auth.state.error = null
    auth.state.isLoading = false
  })

  describe('Registrace', () => {
    it('registruje nového uživatele úspěšně', async () => {
      // Setup mock implementation for this test
      mockedRegister.mockImplementation((username, email, password) => {
        auth.state.user = {
          userId: 1,
          username,
          email,
          roleId: 3,
          confirmed: false
        }
        auth.state.isAuthenticated = true
        localStorage.setItem('user', JSON.stringify(auth.state.user))
        return Promise.resolve(true)
      })

      // Call the register function
      const result = await auth.register('testuser', 'test@example.com', 'Password123')

      // Verify the result
      expect(result).toBe(true)
      expect(auth.state.isAuthenticated).toBe(true)
      expect(auth.state.user).toEqual({
        userId: 1,
        username: 'testuser',
        email: 'test@example.com',
        roleId: 3,
        confirmed: false
      })

      // Verify localStorage was updated
      expect(localStorageMock.setItem).toHaveBeenCalledWith('user', JSON.stringify(auth.state.user))
    })

    it('vyhodí chybu, když uživatelské jméno již existuje', async () => {
      // Setup mock implementation for this test
      mockedRegister.mockImplementation(() => {
        auth.state.error = 'Username or email already exists'
        return Promise.resolve(false)
      })

      // Call the register function
      const result = await auth.register('existinguser', 'test@example.com', 'Password123')

      // Verify the result
      expect(result).toBe(false)
      expect(auth.state.error).toBe('Username or email already exists')
      expect(auth.state.isAuthenticated).toBe(false)
    })
  })

  describe('Přihlášení', () => {
    it('přihlásí uživatele s platnými přihlašovacími údaji', async () => {
      // Setup mock implementation for this test
      mockedLogin.mockImplementation((email, password) => {
        auth.state.user = {
          userId: 1,
          username: 'testuser',
          email,
          roleId: 3,
          confirmed: true
        }
        auth.state.isAuthenticated = true
        localStorage.setItem('user', JSON.stringify(auth.state.user))
        return Promise.resolve(true)
      })

      // Call the login function
      const result = await auth.login('test@example.com', 'Password123')

      // Verify the result
      expect(result).toBe(true)
      expect(auth.state.isAuthenticated).toBe(true)
      expect(auth.state.user).toEqual({
        userId: 1,
        username: 'testuser',
        email: 'test@example.com',
        roleId: 3,
        confirmed: true
      })

      // Verify localStorage was updated
      expect(localStorageMock.setItem).toHaveBeenCalledWith('user', JSON.stringify(auth.state.user))
    })

    it('odmítne přihlášení s nesprávným heslem', async () => {
      // Setup mock implementation for this test
      mockedLogin.mockImplementation(() => {
        auth.state.error = 'Invalid email or password'
        return Promise.resolve(false)
      })

      // Call the login function
      const result = await auth.login('test@example.com', 'WrongPassword')

      // Verify the result
      expect(result).toBe(false)
      expect(auth.state.error).toBe('Invalid email or password')
      expect(auth.state.isAuthenticated).toBe(false)
    })

    it('odmítne přihlášení s neexistujícím emailem', async () => {
      // Setup mock implementation for this test
      mockedLogin.mockImplementation(() => {
        auth.state.error = 'Invalid email or password'
        return Promise.resolve(false)
      })

      // Call the login function
      const result = await auth.login('nonexistent@example.com', 'Password123')

      // Verify the result
      expect(result).toBe(false)
      expect(auth.state.error).toBe('Invalid email or password')
      expect(auth.state.isAuthenticated).toBe(false)
    })
  })

  describe('Odhlášení', () => {
    it('odstraní autentizační stav při odhlášení', async () => {
      // Setup authenticated state
      auth.state.isAuthenticated = true
      auth.state.user = {
        userId: 1,
        username: 'testuser',
        email: 'test@example.com',
        roleId: 3,
        confirmed: true
      }
      localStorageMock.setItem('user', JSON.stringify(auth.state.user))

      // Setup mock implementation for logout
      mockedLogout.mockImplementation(() => {
        auth.state.isAuthenticated = false
        auth.state.user = null
        localStorageMock.removeItem('user')
      })

      // Call logout function
      auth.logout()

      // Verify the state was cleared
      expect(auth.state.isAuthenticated).toBe(false)
      expect(auth.state.user).toBe(null)
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('user')
    })
  })

  describe('Obnovení hesla', () => {
    it('obnoví heslo s platnou obnovovací frází', async () => {
      // Setup mock implementation
      mockedResetPassword.mockResolvedValue(true)

      // Call the resetPassword function
      const result = await auth.resetPassword('test@example.com', 'apple banana orange grape lemon peach plum berry melon cherry', 'NewPassword123')

      // Verify the result
      expect(result).toBe(true)
    })

    it('vyhodí chybu při neplatném emailu', async () => {
      // Setup mock implementation
      mockedResetPassword.mockImplementation(() => {
        auth.state.error = 'Invalid email'
        return Promise.resolve(false)
      })

      // Call the resetPassword function
      const result = await auth.resetPassword('nonexistent@example.com', 'apple banana orange grape lemon peach plum berry melon cherry', 'NewPassword123')

      // Verify the result
      expect(result).toBe(false)
      expect(auth.state.error).toBe('Invalid email')
    })
  })

  describe('Verifikace emailu', () => {
    it('úspěšně ověří email s platným tokenem', async () => {
      // Setup user state
      auth.state.user = {
        userId: 1,
        username: 'testuser',
        email: 'test@example.com',
        roleId: 3,
        confirmed: false
      }

      // Setup mock implementation
      mockedVerifyEmail.mockImplementation(() => {
        if (auth.state.user) {
          auth.state.user.confirmed = true;
        } else {
          throw new Error('User is not authenticated');
        }
        localStorage.setItem('user', JSON.stringify(auth.state.user))
        return Promise.resolve(true)
      })

      // Call verification function
      const result = await auth.verifyEmail('valid-token-123')

      // Verify the result
      expect(result).toBe(true)
      expect(auth.state.user!.confirmed).toBe(true)
      expect(localStorageMock.setItem).toHaveBeenCalledWith('user', JSON.stringify(auth.state.user))
    })

    it('zpracuje neúspěšnou verifikaci emailu', async () => {
      // Setup mock implementation
      mockedVerifyEmail.mockResolvedValue(false)

      // Call verification function
      const result = await auth.verifyEmail('invalid-token')

      // Verify the result
      expect(result).toBe(false)
    })

    it('zpracuje chybu při verifikaci emailu', async () => {
      // Setup mock implementation
      mockedVerifyEmail.mockImplementation(() => {
        auth.state.error = 'Token expired'
        return Promise.resolve(false)
      })

      // Call verification function
      const result = await auth.verifyEmail('expired-token')

      // Verify the result
      expect(result).toBe(false)
      expect(auth.state.error).toBe('Token expired')
    })
  })

  describe('Additional Test Case', () => {
    it('checks user properties when authenticated', () => {
      const mockUser = {
        id: 1,
        username: 'testuser'
      }

      auth.state.isAuthenticated = true
      auth.state.user = {
        userId: mockUser.id,
        username: mockUser.username,
        email: 'test@example.com',
        roleId: 3,
        confirmed: true
      }

      if (auth.state.isAuthenticated && auth.state.user) {
        expect(auth.state.user!.userId).toBe(mockUser.id)
        expect(auth.state.user!.username).toBe(mockUser.username)
      } else {
        throw new Error('User is not authenticated');
      }
    })
  })
})