<!-- src/pages/Profile.vue -->
<template>
  <div class="profile-page">
    <h2 class="page-title">My Profile</h2>

    <!-- Loading state -->
    <div v-if="isLoading" class="loading-container">
      <div class="loading-spinner"></div>
      <p>Loading profile information...</p>
    </div>
    
    <!-- Error state -->
    <div v-else-if="error" class="error-container">
      <div class="error-icon">
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor" viewBox="0 0 16 16">
          <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
          <path d="M7.002 11a1 1 0 1 1 2 0 1 1 0 0 1-2 0zM7.1 4.995a.905.905 0 1 1 1.8 0l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 4.995z"/>
        </svg>
      </div>
      <p>{{ error }}</p>
      <button @click="loadUserData" class="action-btn">Try Again</button>
    </div>

    <!-- Profile Content -->
    <div v-else class="profile-content">
      <div class="section user-info">
        <h3 class="section-title">Account Information</h3>
        
        <!-- View Mode - Display User Info -->
        <div v-if="!editMode" class="user-details">
          <div class="info-item">
            <div class="info-label">Username</div>
            <div class="info-value">{{ userData.username }}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Email</div>
            <div class="info-value">{{ userData.email }}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Account Type</div>
            <div class="info-value">{{ userRole }}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Member Since</div>
            <div class="info-value">{{ formatDate(userData.createdAt) }}</div>
          </div>
          <button @click="enableEditMode" class="action-btn edit-btn">Edit Profile</button>
        </div>
        
        <!-- Edit Mode - Edit User Info Form -->
        <form v-else @submit.prevent="updateProfile" class="edit-form">
          <div class="form-group">
            <label for="username" class="form-label">Username</label>
            <input 
              id="username" 
              v-model="formData.username" 
              type="text" 
              class="form-input" 
              required
              @blur="validateUsername"
            >
            <small v-if="usernameError" class="error-text">{{ usernameError }}</small>
          </div>
          
          <div class="form-group">
            <label for="email" class="form-label">Email</label>
            <input 
              id="email" 
              v-model="formData.email" 
              type="email" 
              class="form-input" 
              required
              @blur="validateEmail"
            >
            <small v-if="emailError" class="error-text">{{ emailError }}</small>
          </div>
          
          <div class="form-actions">
            <button type="button" @click="cancelEdit" class="cancel-btn">Cancel</button>
            <button 
              type="submit" 
              class="action-btn save-btn"
              :disabled="!isFormValid || isSaving"
            >
              {{ isSaving ? 'Saving...' : 'Save Changes' }}
            </button>
          </div>
        </form>
      </div>
      
      <!-- Change Password Section -->
      <div class="section password-section">
        <h3 class="section-title">Change Password</h3>
        
        <div v-if="!showPasswordForm" class="password-prompt">
          <p>Change your account password to keep your account secure.</p>
          <button @click="showPasswordForm = true" class="action-btn password-btn">Change Password</button>
        </div>
        
        <form v-else @submit.prevent="updatePassword" class="password-form">
          <div class="form-group">
            <label for="currentPassword" class="form-label">Current Password</label>
            <input 
              id="currentPassword" 
              v-model="passwordData.currentPassword" 
              :type="showCurrentPassword ? 'text' : 'password'" 
              class="form-input" 
              required
            >
            <button 
              type="button" 
              class="password-toggle" 
              @click="showCurrentPassword = !showCurrentPassword"
              aria-label="Toggle password visibility"
            >
              <svg v-if="showCurrentPassword" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                <path d="M16 8s-3-5.5-8-5.5S0 8 0 8s3 5.5 8 5.5S16 8 16 8zM1.173 8a13.133 13.133 0 0 1 1.66-2.043C4.12 4.668 5.88 3.5 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13.133 13.133 0 0 1 14.828 8c-.058.087-.122.183-.195.288-.335.48-.83 1.12-1.465 1.755C11.879 11.332 10.119 12.5 8 12.5c-2.12 0-3.879-1.168-5.168-2.457A13.134 13.134 0 0 1 1.172 8z"/>
                <path d="M8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zM4.5 8a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0z"/>
              </svg>
              <svg v-else xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                <path d="M13.359 11.238C15.06 9.72 16 8 16 8s-3-5.5-8-5.5S0 8 0 8s3 5.5 8 5.5c2.572 0 4.745-1.275 6.356-2.762ZM5.886 4.46A3.5 3.5 0 0 0 8 6.5a3.5 3.5 0 0 0 2.114-2.04A9.1 9.1 0 0 0 8 2.5c-.924 0-1.765.171-2.514.46Zm5.228 6.08c-.844.523-1.902.9-3.114.9-1.212 0-2.27-.377-3.113-.9a9.1 9.1 0 0 0 3.113-1.727 9.1 9.1 0 0 0 3.114 1.727Z"/>
                <path d="M8 11.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z"/>
              </svg>
            </button>
          </div>
          
          <div class="form-group">
            <label for="newPassword" class="form-label">New Password</label>
            <input 
              id="newPassword" 
              v-model="passwordData.newPassword" 
              :type="showNewPassword ? 'text' : 'password'" 
              class="form-input" 
              required
              @input="validateNewPassword"
            >
            <button 
              type="button" 
              class="password-toggle" 
              @click="showNewPassword = !showNewPassword"
              aria-label="Toggle password visibility"
            >
              <svg v-if="showNewPassword" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                <path d="M16 8s-3-5.5-8-5.5S0 8 0 8s3 5.5 8 5.5S16 8 16 8zM1.173 8a13.133 13.133 0 0 1 1.66-2.043C4.12 4.668 5.88 3.5 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13.133 13.133 0 0 1 14.828 8c-.058.087-.122.183-.195.288-.335.48-.83 1.12-1.465 1.755C11.879 11.332 10.119 12.5 8 12.5c-2.12 0-3.879-1.168-5.168-2.457A13.134 13.134 0 0 1 1.172 8z"/>
                <path d="M8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zM4.5 8a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0z"/>
              </svg>
              <svg v-else xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                <path d="M13.359 11.238C15.06 9.72 16 8 16 8s-3-5.5-8-5.5S0 8 0 8s3 5.5 8 5.5c2.572 0 4.745-1.275 6.356-2.762ZM5.886 4.46A3.5 3.5 0 0 0 8 6.5a3.5 3.5 0 0 0 2.114-2.04A9.1 9.1 0 0 0 8 2.5c-.924 0-1.765.171-2.514.46Zm5.228 6.08c-.844.523-1.902.9-3.114.9-1.212 0-2.27-.377-3.113-.9a9.1 9.1 0 0 0 3.113-1.727 9.1 9.1 0 0 0 3.114 1.727Z"/>
                <path d="M8 11.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z"/>
              </svg>
            </button>
            
            <div class="password-requirements">
              <div :class="{ 'requirement-met': passwordLength }">
                <span v-if="passwordLength">✓</span>
                <span v-else>•</span>
                At least 8 characters
              </div>
              <div :class="{ 'requirement-met': passwordUppercase }">
                <span v-if="passwordUppercase">✓</span>
                <span v-else>•</span>
                Contains uppercase letter
              </div>
              <div :class="{ 'requirement-met': passwordLowercase }">
                <span v-if="passwordLowercase">✓</span>
                <span v-else>•</span>
                Contains lowercase letter
              </div>
              <div :class="{ 'requirement-met': passwordNumber }">
                <span v-if="passwordNumber">✓</span>
                <span v-else>•</span>
                Contains number
              </div>
            </div>
          </div>
          
          <div class="form-group">
            <label for="confirmPassword" class="form-label">Confirm New Password</label>
            <input 
              id="confirmPassword" 
              v-model="passwordData.confirmPassword" 
              :type="showConfirmPassword ? 'text' : 'password'" 
              class="form-input" 
              required
              @input="validateConfirmPassword"
            >
            <button 
              type="button" 
              class="password-toggle" 
              @click="showConfirmPassword = !showConfirmPassword"
              aria-label="Toggle password visibility"
            >
              <svg v-if="showConfirmPassword" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                <path d="M16 8s-3-5.5-8-5.5S0 8 0 8s3 5.5 8 5.5S16 8 16 8zM1.173 8a13.133 13.133 0 0 1 1.66-2.043C4.12 4.668 5.88 3.5 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13.133 13.133 0 0 1 14.828 8c-.058.087-.122.183-.195.288-.335.48-.83 1.12-1.465 1.755C11.879 11.332 10.119 12.5 8 12.5c-2.12 0-3.879-1.168-5.168-2.457A13.134 13.134 0 0 1 1.172 8z"/>
                <path d="M8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zM4.5 8a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0z"/>
              </svg>
              <svg v-else xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                <path d="M13.359 11.238C15.06 9.72 16 8 16 8s-3-5.5-8-5.5S0 8 0 8s3 5.5 8 5.5c2.572 0 4.745-1.275 6.356-2.762ZM5.886 4.46A3.5 3.5 0 0 0 8 6.5a3.5 3.5 0 0 0 2.114-2.04A9.1 9.1 0 0 0 8 2.5c-.924 0-1.765.171-2.514.46Zm5.228 6.08c-.844.523-1.902.9-3.114.9-1.212 0-2.27-.377-3.113-.9a9.1 9.1 0 0 0 3.113-1.727 9.1 9.1 0 0 0 3.114 1.727Z"/>
                <path d="M8 11.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z"/>
              </svg>
            </button>
            <small v-if="passwordMatchError" class="error-text">{{ passwordMatchError }}</small>
          </div>
          
          <div class="form-actions">
            <button type="button" @click="cancelPasswordChange" class="cancel-btn">Cancel</button>
            <button 
              type="submit" 
              class="action-btn save-btn"
              :disabled="!isPasswordFormValid || isChangingPassword"
            >
              {{ isChangingPassword ? 'Updating...' : 'Update Password' }}
            </button>
          </div>
        </form>
        
        <div v-if="passwordSuccess" class="success-message">
          Your password has been updated successfully.
        </div>
      </div>
      
      <!-- User Statistics Section -->
      <div class="section stats-section">
        <h3 class="section-title">Quiz Statistics</h3>
        
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-value">{{ userStats.createdQuizzes }}</div>
            <div class="stat-label">Quizzes Created</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">{{ userStats.takenQuizzes }}</div>
            <div class="stat-label">Quizzes Taken</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">{{ userStats.passRate }}%</div>
            <div class="stat-label">Pass Rate</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">{{ userStats.totalUpvotes }}</div>
            <div class="stat-label">Total Upvotes</div>
          </div>
        </div>
      </div>
      
      <!-- Account Deletion Section -->
      <div class="section danger-section">
        <h3 class="section-title">Danger Zone</h3>
        <p class="warning-text">Permanently delete your account and all associated data.</p>
        <button @click="showDeleteConfirmation = true" class="delete-btn">Delete Account</button>
        
        <!-- Delete Account Confirmation Modal -->
        <div v-if="showDeleteConfirmation" class="modal-overlay">
          <div class="modal-content">
            <h3 class="modal-title">Delete Account</h3>
            <p class="modal-text">
              Are you sure you want to delete your account? This action cannot be undone and will permanently delete:
            </p>
            <ul class="deletion-list">
              <li>Your account information</li>
              <li>All quizzes you've created</li>
              <li>All your quiz attempts</li>
              <li>Your upvotes and stats</li>
            </ul>
            
            <div class="modal-actions">
              <button @click="showDeleteConfirmation = false" class="cancel-btn">Cancel</button>
              <button @click="deleteAccount" class="delete-confirm-btn" :disabled="isDeletingAccount">
                {{ isDeletingAccount ? 'Deleting...' : 'Yes, Delete Account' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { auth } from '@/store/auth'
import { supabase } from '@/api/supabase'
import bcrypt from 'bcryptjs'

// Router for navigation
const router = useRouter()

// State variables
const isLoading = ref(true)
const error = ref('')
const editMode = ref(false)
const showPasswordForm = ref(false)
const passwordSuccess = ref(false)
const showDeleteConfirmation = ref(false)

// Password visibility toggles
const showCurrentPassword = ref(false)
const showNewPassword = ref(false)
const showConfirmPassword = ref(false)

// Form submission states
const isSaving = ref(false)
const isChangingPassword = ref(false)
const isDeletingAccount = ref(false)

// Form validation
const usernameError = ref('')
const emailError = ref('')
const passwordMatchError = ref('')

// Password validation
const passwordLength = ref(false)
const passwordUppercase = ref(false)
const passwordLowercase = ref(false)
const passwordNumber = ref(false)

// User data
const userData = reactive({
  userId: 0,
  username: '',
  email: '',
  roleId: 0,
  roleName: '',
  createdAt: ''
})

// Form data for editing profile
const formData = reactive({
  username: '',
  email: ''
})

// Form data for changing password
const passwordData = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

// User statistics
const userStats = reactive({
  createdQuizzes: 0,
  takenQuizzes: 0,
  passRate: 0,
  totalUpvotes: 0
})

// Computed properties
const userRole = computed(() => {
  return userData.roleName.charAt(0).toUpperCase() + userData.roleName.slice(1)
})

const isFormValid = computed(() => {
  return (
    formData.username.trim() !== '' && 
    formData.email.trim() !== '' && 
    !usernameError.value && 
    !emailError.value
  )
})

const isPasswordFormValid = computed(() => {
  return (
    passwordData.currentPassword.trim() !== '' &&
    passwordData.newPassword.trim() !== '' &&
    passwordData.confirmPassword.trim() !== '' &&
    passwordLength.value &&
    passwordUppercase.value &&
    passwordLowercase.value &&
    passwordNumber.value &&
    !passwordMatchError.value
  )
})

// Load user data when component mounts
onMounted(async () => {
  if (!auth.state.isAuthenticated || !auth.state.user) {
    router.push('/login')
    return
  }
  
  await loadUserData()
})

// Function to load user data from the database
async function loadUserData() {
  if (!auth.state.user) return
  
  isLoading.value = true
  error.value = ''
  
  try {
    // Load basic user data
    const { data: user, error: userError } = await supabase
      .from('Users')
      .select(`
        id, 
        username, 
        email, 
        role_id,
        created_at,
        Roles (role_name)
      `)
      .eq('id', auth.state.user.userId)
      .single()
    
    if (userError || !user) {
      throw new Error(userError?.message || 'Failed to load user data')
    }
    
    // Set user data
    userData.userId = user.id
    userData.username = user.username
    userData.email = user.email
    userData.roleId = user.role_id
    userData.roleName = user.Roles.role_name
    userData.createdAt = user.created_at
    
    // Set form data (for editing)
    formData.username = user.username
    formData.email = user.email
    
    // Load user statistics
    await loadUserStats()
    
  } catch (err) {
    console.error('Error loading user data:', err)
    error.value = 'Failed to load profile. Please try again.'
  } finally {
    isLoading.value = false
  }
}

// Load user statistics
async function loadUserStats() {
  try {
    // Count created quizzes
    const { count: createdCount, error: createdError } = await supabase
      .from('Quizzes')
      .select('id', { count: 'exact', head: true })
      .eq('owner_id', userData.userId)
      .eq('is_deleted', false)
    
    if (!createdError) {
      userStats.createdQuizzes = createdCount || 0
    }
    
    // Count quiz attempts and calculate pass rate
    const { data: attempts, error: attemptsError } = await supabase
      .from('QuizAttempts')
      .select('is_passed')
      .eq('user_id', userData.userId)
    
    if (!attemptsError && attempts) {
      userStats.takenQuizzes = attempts.length
      
      if (attempts.length > 0) {
        const passedAttempts = attempts.filter(a => a.is_passed).length
        userStats.passRate = Math.round((passedAttempts / attempts.length) * 100)
      } else {
        userStats.passRate = 0
      }
    }
    
    // Count total upvotes on user's quizzes
    const { data: quizIds, error: quizIdsError } = await supabase
      .from('Quizzes')
      .select('id')
      .eq('owner_id', userData.userId)
      .eq('is_deleted', false)
    
    if (!quizIdsError && quizIds && quizIds.length > 0) {
      const ids = quizIds.map(q => q.id)
      
      const { count: upvotesCount, error: upvotesError } = await supabase
        .from('QuizUpvotes')
        .select('id', { count: 'exact', head: true })
        .in('quiz_id', ids)
      
      if (!upvotesError) {
        userStats.totalUpvotes = upvotesCount || 0
      }
    }
    
  } catch (err) {
    console.error('Error loading user stats:', err)
    // Don't set error state - stats are not critical
  }
}

// Form validation functions
function validateUsername() {
  usernameError.value = ''
  
  if (formData.username.length < 3) {
    usernameError.value = 'Username must be at least 3 characters'
  } else if (formData.username.length > 20) {
    usernameError.value = 'Username must be less than 20 characters'
  } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
    usernameError.value = 'Username can only contain letters, numbers, and underscores'
  }
}

function validateEmail() {
  emailError.value = ''
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(formData.email)) {
    emailError.value = 'Please enter a valid email address'
  }
}

function validateNewPassword() {
  const password = passwordData.newPassword
  passwordLength.value = password.length >= 8
  passwordUppercase.value = /[A-Z]/.test(password)
  passwordLowercase.value = /[a-z]/.test(password)
  passwordNumber.value = /[0-9]/.test(password)
  
  if (passwordData.confirmPassword) {
    validateConfirmPassword()
  }
}

function validateConfirmPassword() {
  passwordMatchError.value = ''
  
  if (passwordData.newPassword !== passwordData.confirmPassword) {
    passwordMatchError.value = 'Passwords do not match'
  }
}

// Date formatter
function formatDate(dateString: string) {
  if (!dateString) return 'N/A'
  
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

// Enable edit mode for user profile
function enableEditMode() {
  formData.username = userData.username
  formData.email = userData.email
  editMode.value = true
}

// Cancel edit mode and reset form
function cancelEdit() {
  formData.username = userData.username
  formData.email = userData.email
  usernameError.value = ''
  emailError.value = ''
  editMode.value = false
}

// Cancel password change form
function cancelPasswordChange() {
  passwordData.currentPassword = ''
  passwordData.newPassword = ''
  passwordData.confirmPassword = ''
  passwordMatchError.value = ''
  showPasswordForm.value = false
  passwordSuccess.value = false
}

// Update user profile
async function updateProfile() {
  if (!isFormValid.value || isSaving.value) return
  
  isSaving.value = true
  
  try {
    // Check if username or email changed
    if (formData.username === userData.username && formData.email === userData.email) {
      // No changes made
      editMode.value = false
      return
    }
    
    // Check if username is already taken (if it was changed)
    if (formData.username !== userData.username) {
      const { data: existingUser, error: checkError } = await supabase
        .from('Users')
        .select('id')
        .eq('username', formData.username)
        .neq('id', userData.userId)
        .maybeSingle()
      
      if (checkError) {
        throw new Error('Error checking username availability')
      }
      
      if (existingUser) {
        usernameError.value = 'Username is already taken'
        return
      }
    }
    
    // Check if email is already taken (if it was changed)
    if (formData.email !== userData.email) {
      const { data: existingEmail, error: checkError } = await supabase
        .from('Users')
        .select('id')
        .eq('email', formData.email)
        .neq('id', userData.userId)
        .maybeSingle()
      
      if (checkError) {
        throw new Error('Error checking email availability')
      }
      
      if (existingEmail) {
        emailError.value = 'Email is already in use'
        return
      }
    }
    
    // Update user data in Supabase
    const { error: updateError } = await supabase
      .from('Users')
      .update({
        username: formData.username,
        email: formData.email
      })
      .eq('id', userData.userId)
    
    if (updateError) {
      throw new Error(updateError.message || 'Failed to update profile')
    }
    
    // Update local user data
    userData.username = formData.username
    userData.email = formData.email
    
    // Update auth store
    auth.state.user = {
      userId: userData.userId,
      username: formData.username,
      email: formData.email,
      roleId: userData.roleId
    }
    
    // Save updated user to localStorage
    localStorage.setItem('user', JSON.stringify(auth.state.user))
    
    // Exit edit mode
    editMode.value = false
    
  } catch (err) {
    console.error('Error updating profile:', err)
    error.value = err instanceof Error ? err.message : 'Failed to update profile'
  } finally {
    isSaving.value = false
  }
}

// Update user password
async function updatePassword() {
  if (!isPasswordFormValid.value || isChangingPassword.value) return
  
  isChangingPassword.value = true
  passwordSuccess.value = false
  
  try {
    // Verify current password
    const { data: user, error: userError } = await supabase
      .from('Users')
      .select('password_hash')
      .eq('id', userData.userId)
      .single()
    
    if (userError || !user) {
      throw new Error('User not found')
    }
    
    const isValidPassword = await bcrypt.compare(passwordData.currentPassword, user.password_hash)
    if (!isValidPassword) {
      throw new Error('Current password is incorrect')
    }
    
    // Hash new password
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(passwordData.newPassword, salt)
    
    // Update password in database
    const { error: updateError } = await supabase
      .from('Users')
      .update({ password_hash: hashedPassword })
      .eq('id', userData.userId)
    
    if (updateError) {
      throw new Error(updateError.message || 'Failed to update password')
    }
    
    // Reset password form and show success message
    passwordData.currentPassword = ''
    passwordData.newPassword = ''
    passwordData.confirmPassword = ''
    showPasswordForm.value = false
    passwordSuccess.value = true
    
  } catch (err) {
    console.error('Error updating password:', err)
    error.value = err instanceof Error ? err.message : 'Failed to update password'
  } finally {
    isChangingPassword.value = false
  }
}

// Delete user account
async function deleteAccount() {
  if (isDeletingAccount.value) return
  
  isDeletingAccount.value = true
  
  try {
    // Mark user as inactive instead of actually deleting
    // This preserves referential integrity while making the user "deleted"
    const { error: updateError } = await supabase
      .from('Users')
      .update({ is_active: false })
      .eq('id', userData.userId)
    
    if (updateError) {
      throw new Error(updateError.message || 'Failed to delete account')
    }
    
    // Logout and redirect to home page
    auth.logout()
    router.push('/')
    
  } catch (err) {
    console.error('Error deleting account:', err)
    error.value = err instanceof Error ? err.message : 'Failed to delete account'
    showDeleteConfirmation.value = false
  } finally {
    isDeletingAccount.value = false
  }
}
</script>

<style scoped>
.profile-page {
  max-width: 800px;
  margin: 0 auto;
  padding: var(--spacing-lg);
}

.page-title {
  text-align: center;
  margin-bottom: var(--spacing-lg);
  font-size: 2rem;
  font-weight: 600;
  letter-spacing: 0.5px;
}

/* Loading and error states */
.loading-container, .error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  text-align: center;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  border-top-color: var(--accent);
  animation: spin 1s ease-in-out infinite;
  margin-bottom: var(--spacing-md);
}

.error-icon {
  color: rgb(255, 89, 89);
  margin-bottom: var(--spacing-md);
}

.error-container p {
  margin-bottom: var(--spacing-md);
  color: var(--text-alt);
  max-width: 400px;
}

/* Content sections */
.profile-content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.section {
  background: var(--panel-bg);
  border-radius: var(--radius-md);
  padding: var(--spacing-md);
  box-shadow: var(--shadow-sm);
}

.section-title {
  margin-top: 0;
  margin-bottom: var(--spacing-md);
  font-size: 1.2rem;
  border-bottom: 1px solid var(--input-border);
  padding-bottom: var(--spacing-sm);
}

/* User info display */
.user-details {
  display: grid;
  gap: var(--spacing-md);
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.info-label {
  color: var(--text-alt);
  font-size: 0.85rem;
}

.info-value {
  font-weight: 500;
  font-size: 1rem;
}

/* Form elements */
.form-group {
  margin-bottom: var(--spacing-md);
  position: relative;
}

.form-label {
  display: block;
  margin-bottom: var(--spacing-xs);
  color: var(--text-main);
  font-size: 0.9rem;
  font-weight: 500;
}

.form-input {
  width: 100%;
  height: 45px;
  padding: 0 1rem;
  background: var(--input-bg);
  border: 1px solid var(--input-border);
  border-radius: var(--radius-md);
  color: var(--text-main);
  font-size: 1rem;
  transition: border-color var(--transition-duration) var(--transition-timing);
}

.form-input:focus {
  border-color: var(--accent);
  outline: none;
}

.error-text {
  color: rgb(255, 89, 89);
  font-size: 0.8rem;
  margin-top: 0.25rem;
  display: block;
}

.password-toggle {
  position: absolute;
  right: 0.75rem;
  top: 2.5rem;
  background: none;
  border: none;
  color: var(--text-alt);
  cursor: pointer;
  padding: 0;
}

.password-toggle:hover {
  color: var(--text-main);
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-sm);
  margin-top: var(--spacing-md);
}

/* Buttons */
.action-btn, .cancel-btn, .delete-btn {
  padding: 0.6rem 1.2rem;
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-weight: 500;
  border: none;
  transition: all 0.3s ease;
}

.action-btn {
  background: var(--accent);
  color: white;
}

.action-btn:hover:not(:disabled) {
  background: color-mix(in srgb, var(--accent) 80%, white);
}

.action-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.cancel-btn {
  background: var(--input-bg);
  color: var(--text-main);
  border: 1px solid var(--input-border);
}

.cancel-btn:hover {
  background: var(--panel-bg);
}

.delete-btn {
  background: rgba(255, 89, 89, 0.1);
  color: rgb(255, 89, 89);
  border: 1px solid rgba(255, 89, 89, 0.3);
}

.delete-btn:hover {
  background: rgba(255, 89, 89, 0.2);
}

/* Password requirements */
.password-requirements {
  margin-top: var(--spacing-xs);
  font-size: 0.8rem;
  color: var(--text-alt);
}

.password-requirements div {
  margin-top: 0.4rem;
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.requirement-met {
  color: var(--accent);
}

/* Success message */
.success-message {
  margin-top: var(--spacing-md);
  padding: var(--spacing-sm);
  background: rgba(46, 213, 115, 0.1);
  border: 1px solid rgba(46, 213, 115, 0.3);
  border-radius: var(--radius-sm);
  color: #2ed573;
  text-align: center;
}

/* Stats section */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--spacing-md);
}

.stat-card {
  background: var(--input-bg);
  border-radius: var(--radius-sm);
  padding: var(--spacing-md);
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--accent);
  margin-bottom: 0.5rem;
}

.stat-label {
  font-size: 0.85rem;
  color: var(--text-alt);
}

/* Danger zone */
.danger-section {
  border: 1px solid rgba(255, 89, 89, 0.3);
}

.warning-text {
  color: var(--text-alt);
  margin-bottom: var(--spacing-md);
}

/* Delete confirmation modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: var(--panel-bg);
  border-radius: var(--radius-md);
  padding: var(--spacing-lg);
  max-width: 500px;
  width: 90%;
}

.modal-title {
  margin-top: 0;
  margin-bottom: var(--spacing-md);
  color: rgb(255, 89, 89);
}

.modal-text {
  margin-bottom: var(--spacing-sm);
  line-height: 1.5;
}

.deletion-list {
  margin-bottom: var(--spacing-lg);
  padding-left: var(--spacing-lg);
}

.deletion-list li {
  margin-bottom: var(--spacing-xs);
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-sm);
}

.delete-confirm-btn {
  background: rgb(255, 89, 89);
  color: white;
  border: none;
  padding: 0.6rem 1.2rem;
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s ease;
}

.delete-confirm-btn:hover:not(:disabled) {
  background: rgba(255, 89, 89, 0.8);
}

.delete-confirm-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Animation */
@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Responsive layout */
@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 480px) {
  .form-actions {
    flex-direction: column;
  }
  
  .modal-content {
    padding: var(--spacing-md);
  }
}
</style>