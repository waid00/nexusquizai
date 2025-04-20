// src/store/auth.ts
import { reactive, readonly } from 'vue'
import { getDB } from '@/db/index'

interface User {
  userId: number
  username: string
  email: string
  roleId: number
}

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
}

// Create a reactive state
const state = reactive<AuthState>({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null
})

// Check if we have a user in localStorage on init
try {
  const savedUser = localStorage.getItem('user')
  if (savedUser) {
    const user = JSON.parse(savedUser)
    state.user = user
    state.isAuthenticated = true
  }
} catch (error) {
  console.error('Failed to restore user session:', error)
  localStorage.removeItem('user')
}

// Auth functions
export const auth = {
  // Expose state as readonly
  state: readonly(state),
  
  // Register a new user
  async register(username: string, email: string, password: string): Promise<boolean> {
    state.isLoading = true
    state.error = null
    
    try {
      const db = await getDB()
      
      // Check if user already exists
      const userCheck = db.exec(`
        SELECT username FROM Users 
        WHERE username = '${username}' OR email = '${email}'
      `)
      
      if (userCheck.length && userCheck[0].values.length) {
        state.error = 'Username or email already exists'
        return false
      }
      
      // Hash password (this is simulated - in a real app, use proper hashing)
      const passwordHash = btoa(password) // Base64 encoding (NOT secure - just for demo)
      
      // Insert the new user with a default role (role_id = 2 for regular users)
      db.run(`
        INSERT INTO Users (username, email, password_hash, role_id) 
        VALUES ('${username}', '${email}', '${passwordHash}', 2)
      `)
      
      return true
    } catch (error: any) {
      state.error = error.message || 'Registration failed'
      return false
    } finally {
      state.isLoading = false
    }
  },
  
  // Login a user
  async login(usernameOrEmail: string, password: string): Promise<boolean> {
    state.isLoading = true
    state.error = null
    
    try {
      const db = await getDB()
      
      // Hash password (simulated - not secure)
      const passwordHash = btoa(password)
      
      // Check user credentials
      const result = db.exec(`
        SELECT user_id, username, email, role_id 
        FROM Users 
        WHERE (username = '${usernameOrEmail}' OR email = '${usernameOrEmail}')
        AND password_hash = '${passwordHash}'
        AND is_active = 1
      `)
      
      if (!result.length || !result[0].values.length) {
        state.error = 'Invalid credentials'
        return false
      }
      
      // Get user data from result
      const userData = result[0].values[0]
      const user: User = {
        userId: userData[0] as number,
        username: userData[1] as string,
        email: userData[2] as string,
        roleId: userData[3] as number
      }
      
      // Update state
      state.user = user
      state.isAuthenticated = true
      
      // Save to localStorage
      localStorage.setItem('user', JSON.stringify(user))
      
      return true
    } catch (error: any) {
      state.error = error.message || 'Login failed'
      return false
    } finally {
      state.isLoading = false
    }
  },
  
  // Logout
  logout() {
    state.user = null
    state.isAuthenticated = false
    localStorage.removeItem('user')
  },
  
  // Clear errors
  clearError() {
    state.error = null
  }
}