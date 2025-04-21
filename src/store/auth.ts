// src/store/auth.ts
import { reactive, readonly } from 'vue'
import { getDB, saveDB } from '@/db/index'
import bcrypt from 'bcryptjs'

// Predefined word list for recovery phrases - common, easy-to-remember words
const recoveryWordList = [
  'apple', 'banana', 'orange', 'grape', 'melon', 'peach', 'cherry', 'lemon', 'kiwi', 'pear',
  'river', 'ocean', 'mountain', 'forest', 'desert', 'island', 'valley', 'canyon', 'lake', 'hill',
  'dog', 'cat', 'horse', 'lion', 'tiger', 'bear', 'wolf', 'fox', 'eagle', 'hawk',
  'red', 'blue', 'green', 'yellow', 'purple', 'orange', 'black', 'white', 'brown', 'pink',
  'sun', 'moon', 'star', 'cloud', 'rain', 'snow', 'wind', 'storm', 'rainbow', 'sky',
  'book', 'story', 'poem', 'song', 'movie', 'game', 'puzzle', 'dance', 'paint', 'photo',
  'king', 'queen', 'knight', 'castle', 'crown', 'throne', 'sword', 'shield', 'armor', 'dragon',
  'happy', 'brave', 'calm', 'clever', 'gentle', 'honest', 'kind', 'lucky', 'proud', 'wise'
]

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
  recoveryPhrase: string[] | null
}

// Create a reactive state
const state = reactive<AuthState>({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  recoveryPhrase: null
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

// Clear error
function clearError() {
  state.error = null
}

// Generate a random recovery phrase
function generateRecoveryPhrase(): string[] {
  const phrase: string[] = []
  const usedIndices = new Set<number>()

  while (phrase.length < 10) {
    const randomIndex = Math.floor(Math.random() * recoveryWordList.length)

    // Ensure we don't use the same word twice
    if (!usedIndices.has(randomIndex)) {
      usedIndices.add(randomIndex)
      phrase.push(recoveryWordList[randomIndex])
    }
  }

  return phrase
}

// Register a new user
async function register(username: string, email: string, password: string): Promise<boolean> {
  state.isLoading = true
  state.error = null

  try {
    const db = await getDB()

    // Check if username or email already exist
    const existingUser = db.exec(`
      SELECT * FROM Users 
      WHERE username = '${username}' OR email = '${email}'
    `)

    if (existingUser.length && existingUser[0].values.length) {
      throw new Error('Username or email already exists')
    }

    // Create role if it doesn't exist (basic user role)
    db.run(`
      INSERT OR IGNORE INTO Roles (role_name)
      VALUES ('user')
    `)

    // Get the role_id
    const roles = db.exec('SELECT role_id FROM Roles WHERE role_name = "user"')
    const roleId = roles[0].values[0][0]

    // Generate a recovery phrase
    const recoveryPhrase = generateRecoveryPhrase()
    // Store in state temporarily for display to the user
    state.recoveryPhrase = recoveryPhrase

    // Join words with space for storage
    const recoveryPhraseString = recoveryPhrase.join(' ')

    // Hash the password
    const passwordHash = await bcrypt.hash(password, 10)

    // Insert the new user
    db.run(`
      INSERT INTO Users (username, email, password_hash, recovery_phrase, role_id)
      VALUES ('${username}', '${email}', '${passwordHash}', '${recoveryPhraseString}', ${roleId})
    `)

    // Save changes to localStorage
    saveDB()

    return true
  } catch (err: any) {
    state.error = err.message
    return false
  } finally {
    state.isLoading = false
  }
}

// Login a user
async function login(usernameOrEmail: string, password: string): Promise<boolean> {
  state.isLoading = true
  state.error = null

  try {
    const db = await getDB()

    // Find the user
    const results = db.exec(`
      SELECT user_id, username, email, password_hash, role_id
      FROM Users 
      WHERE username = '${usernameOrEmail}' OR email = '${usernameOrEmail}'
    `)

    if (!results.length || !results[0].values.length) {
      throw new Error('Invalid username or password')
    }

    const userData = results[0].values[0]
    const storedPasswordHash = String(userData[3]) // Convert SqlValue to string

    // Compare passwords
    const isMatch = await bcrypt.compare(password, storedPasswordHash)

    if (!isMatch) {
      throw new Error('Invalid username or password')
    }

    // Set auth state
    state.isAuthenticated = true
    state.user = {
      userId: Number(userData[0]), // Convert to number
      username: String(userData[1]), // Convert to string
      email: String(userData[2]), // Convert to string
      roleId: Number(userData[4]) // Convert to number
    }

    // Save to localStorage
    localStorage.setItem('user', JSON.stringify(state.user))

    return true
  } catch (err: any) {
    state.error = err.message
    return false
  } finally {
    state.isLoading = false
  }
}

// Verify recovery phrase to reset password
async function verifyRecoveryPhrase(username: string, phrase: string[]): Promise<boolean> {
  state.isLoading = true
  state.error = null

  try {
    const db = await getDB()

    // Find the user
    const results = db.exec(`
      SELECT user_id, recovery_phrase
      FROM Users 
      WHERE username = '${username}' OR email = '${username}'
    `)

    if (!results.length || !results[0].values.length) {
      throw new Error('User not found')
    }

    const userData = results[0].values[0]
    const storedPhraseString = userData[1] as string

    // Compare recovery phrases (case insensitive)
    const submittedPhraseString = phrase.join(' ').toLowerCase()
    const isMatch = submittedPhraseString === storedPhraseString.toLowerCase()

    if (!isMatch) {
      throw new Error('Invalid recovery phrase')
    }

    // Store user ID for the password reset
    state.user = {
      userId: Number(userData[0]), // Convert to number to ensure it matches the User interface
      username: '',
      email: '',
      roleId: 0
    }

    return true
  } catch (err: any) {
    state.error = err.message
    return false
  } finally {
    state.isLoading = false
  }
}

// Reset password using verified recovery phrase
async function resetPassword(newPassword: string): Promise<boolean> {
  state.isLoading = true
  state.error = null

  try {
    if (!state.user?.userId) {
      throw new Error('Recovery phrase verification required first')
    }

    const db = await getDB()

    // Hash the new password
    const passwordHash = await bcrypt.hash(newPassword, 10)

    // Update the user's password
    db.run(`
      UPDATE Users
      SET password_hash = '${passwordHash}'
      WHERE user_id = ${state.user.userId}
    `)

    // Save changes to localStorage
    saveDB()

    // Reset temporary recovery state
    state.user = null

    return true
  } catch (err: any) {
    state.error = err.message
    return false
  } finally {
    state.isLoading = false
  }
}

// Logout
function logout() {
  state.isAuthenticated = false
  state.user = null
  state.recoveryPhrase = null
  localStorage.removeItem('user')
}

// Export the auth store
export const auth = {
  state: readonly(state),
  register,
  login,
  logout,
  clearError,
  generateRecoveryPhrase,
  verifyRecoveryPhrase,
  resetPassword
}