<!-- src/pages/Profile.vue -->
<template>
  <div class="profile-page">
    <h2 class="page-title">{{ t('profile.title') }}</h2>

    <!-- Loading state -->
    <div v-if="isLoading" class="loading-container">
      <div class="loading-spinner"></div>
      <p>{{ t('profile.loadingProfile') }}</p>
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
      <button @click="loadUserData" class="action-btn">{{ t('profile.tryAgain') }}</button>
    </div>

    <!-- Profile Content -->
    <div v-else class="profile-content">
      <div class="section user-info">
        <h3 class="section-title">{{ t('profile.accountInformation') }}</h3>
        
        <!-- View Mode - Display User Info -->
        <div v-if="!editMode" class="user-details">
          <div class="info-item">
            <div class="info-label">{{ t('account.username') }}</div>
            <div class="info-value">{{ userData.username }}</div>
          </div>
          <div class="info-item">
            <div class="info-label">{{ t('account.email') }}</div>
            <div class="info-value">{{ userData.email }}</div>
          </div>
          <div class="info-item">
            <div class="info-label">{{ t('profile.accountType') }}</div>
            <div class="info-value">{{ userRole }}</div>
          </div>
          <div class="info-item">
            <div class="info-label">{{ t('profile.memberSince') }}</div>
            <div class="info-value">{{ formatDate(userData.createdAt) }}</div>
          </div>
          <button @click="enableEditMode" class="action-btn edit-btn">{{ t('profile.editProfile') }}</button>
        </div>
        
        <!-- Edit Mode - Edit User Info Form -->
        <form v-else @submit.prevent="updateProfile" class="edit-form">
          <div class="form-group">
            <label for="username" class="form-label">{{ t('account.username') }}</label>
            <input 
              id="username" 
              v-model="formData.username" 
              type="text" 
              class="form-input" 
              :class="{
                'is-valid': formData.username.trim() !== '' && !usernameError,
                'is-invalid': usernameError
              }"
              required
              @blur="validateUsername"
            >
            <small v-if="usernameError" class="error-text">{{ usernameError }}</small>
          </div>
          
          <div class="form-group">
            <label for="email" class="form-label">{{ t('account.email') }}</label>
            <input 
              id="email" 
              v-model="formData.email" 
              type="email" 
              class="form-input" 
              :class="{
                'is-valid': formData.email.trim() !== '' && !emailError,
                'is-invalid': emailError
              }"
              required
              @blur="validateEmail"
            >
            <small v-if="emailError" class="error-text">{{ emailError }}</small>
          </div>
          
          <div class="form-actions">
            <button type="button" @click="cancelEdit" class="cancel-btn">{{ t('common.cancel') }}</button>
            <button 
              type="submit" 
              class="action-btn save-btn"
              :disabled="!isFormValid || isSaving"
            >
              {{ isSaving ? t('profile.saving') : t('profile.saveChanges') }}
            </button>
          </div>
        </form>
      </div>
      
      <!-- Change Password Section -->
      <div class="section password-section">
        <h3 class="section-title">{{ t('profile.changePassword') }}</h3>
        
        <div v-if="!showPasswordForm" class="password-prompt">
          <p>{{ t('profile.passwordSecurityMessage') }}</p>
          <button @click="showPasswordForm = true" class="action-btn password-btn">{{ t('profile.changePassword') }}</button>
        </div>
        
        <form v-else @submit.prevent="updatePassword" class="password-form">
          <div class="form-group">
            <label for="currentPassword" class="form-label">{{ t('account.currentPassword') }}</label>
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
                <path d="M16 8s-3-5.5-8-5.5S0 8 0 8s3-5.5 8-5.5S16 8 16 8zM1.173 8a13.133 13.133 13.133 0 0 1 1.66-2.043C4.12 4.668 5.88 3.5 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13.133 13.133 13.133 0 0 1 14.828 8c-.058.087-.122.183-.195.288-.335.48-.83 1.12-1.465 1.755C11.879 11.332 10.119 12.5 8 12.5c-2.12 0-3.879-1.168-5.168-2.457A13.134 13.134 13.134 0 0 1 1.172 8z"/>
                <path d="M8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zM4.5 8a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0z"/>
              </svg>
              <svg v-else xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                <path d="M13.359 11.238C15.06 9.72 16 8 16 8s-3-5.5-8-5.5S0 8 0 8s3-5.5 8-5.5c2.572 0 4.745-1.275 6.356-2.762ZM5.886 4.46A3.5 3.5 0 0 0 8 6.5a3.5 3.5 0 0 0 2.114-2.04A9.1 9.1 0 0 0 8 2.5c-.924 0-1.765.171-2.514.46Zm5.228 6.08c-.844.523-1.902.9-3.114.9-1.212 0-2.27-.377-3.113-.9a9.1 9.1 0 0 0 3.113-1.727 9.1 9.1 0 0 0 3.114 1.727Z"/>
                <path d="M8 11.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z"/>
              </svg>
            </button>
          </div>
          
          <div class="form-group">
            <label for="newPassword" class="form-label">{{ t('account.newPassword') }}</label>
            <input 
              id="newPassword" 
              v-model="passwordData.newPassword" 
              :type="showNewPassword ? 'text' : 'password'" 
              class="form-input" 
              :class="{
                'is-valid': passwordData.newPassword && passwordLength && passwordUppercase && passwordLowercase && passwordNumber && passwordSpecial,
                'is-invalid': passwordData.newPassword && !(passwordLength && passwordUppercase && passwordLowercase && passwordNumber && passwordSpecial)
              }"
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
                <path d="M16 8s-3-5.5-8-5.5S0 8 0 8s3-5.5 8-5.5S16 8 16 8zM1.173 8a13.133 13.133 13.133 0 0 1 1.66-2.043C4.12 4.668 5.88 3.5 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13.133 13.133 13.133 0 0 1 14.828 8c-.058.087-.122.183-.195.288-.335.48-.83 1.12-1.465 1.755C11.879 11.332 10.119 12.5 8 12.5c-2.12 0-3.879-1.168-5.168-2.457A13.134 13.134 13.134 0 0 1 1.172 8z"/>
                <path d="M8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zM4.5 8a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0z"/>
              </svg>
              <svg v-else xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                <path d="M13.359 11.238C15.06 9.72 16 8 16 8s-3-5.5-8-5.5S0 8 0 8s3-5.5 8-5.5c2.572 0 4.745-1.275 6.356-2.762ZM5.886 4.46A3.5 3.5 0 0 0 8 6.5a3.5 3.5 0 0 0 2.114-2.04A9.1 9.1 0 0 0 8 2.5c-.924 0-1.765.171-2.514.46Zm5.228 6.08c-.844.523-1.902.9-3.114.9-1.212 0-2.27-.377-3.113-.9a9.1 9.1 0 0 0 3.113-1.727 9.1 9.1 0 0 0 3.114 1.727Z"/>
                <path d="M8 11.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z"/>
              </svg>
            </button>
            
            <div class="password-requirements">
              <div :class="{ 'requirement-met': passwordLength }">
                <span v-if="passwordLength">✓</span>
                <span v-else>•</span>
                {{ t('profile.passwordMinLength') }}
              </div>
              <div :class="{ 'requirement-met': passwordUppercase }">
                <span v-if="passwordUppercase">✓</span>
                <span v-else>•</span>
                {{ t('profile.passwordUppercase') }}
              </div>
              <div :class="{ 'requirement-met': passwordLowercase }">
                <span v-if="passwordLowercase">✓</span>
                <span v-else>•</span>
                {{ t('profile.passwordLowercase') }}
              </div>
              <div :class="{ 'requirement-met': passwordNumber }">
                <span v-if="passwordNumber">✓</span>
                <span v-else>•</span>
                {{ t('profile.passwordNumber') }}
              </div>
              <div :class="{ 'requirement-met': passwordSpecial }">
                <span v-if="passwordSpecial">✓</span>
                <span v-else>•</span>
                {{ t('profile.passwordSpecial') }}
              </div>
            </div>
          </div>
          
          <div class="form-group">
            <label for="confirmPassword" class="form-label">{{ t('account.confirmPassword') }}</label>
            <input 
              id="confirmPassword" 
              v-model="passwordData.confirmPassword" 
              :type="showConfirmPassword ? 'text' : 'password'" 
              class="form-input" 
              :class="{
                'is-valid': passwordData.confirmPassword && passwordData.confirmPassword === passwordData.newPassword,
                'is-invalid': passwordData.confirmPassword && passwordData.confirmPassword !== passwordData.newPassword
              }"
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
                <path d="M16 8s-3-5.5-8-5.5S0 8 0 8s3-5.5 8-5.5S16 8 16 8zM1.173 8a13.133 13.133 13.133 0 0 1 1.66-2.043C4.12 4.668 5.88 3.5 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13.133 13.133 13.133 0 0 1 14.828 8c-.058.087-.122.183-.195.288-.335.48-.83 1.12-1.465 1.755C11.879 11.332 10.119 12.5 8 12.5c-2.12 0-3.879-1.168-5.168-2.457A13.134 13.134 13.134 0 0 1 1.172 8z"/>
                <path d="M8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zM4.5 8a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0z"/>
              </svg>
              <svg v-else xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                <path d="M13.359 11.238C15.06 9.72 16 8 16 8s-3-5.5-8-5.5S0 8 0 8s3-5.5 8-5.5c2.572 0 4.745-1.275 6.356-2.762ZM5.886 4.46A3.5 3.5 0 0 0 8 6.5a3.5 3.5 0 0 0 2.114-2.04A9.1 9.1 0 0 0 8 2.5c-.924 0-1.765.171-2.514.46Zm5.228 6.08c-.844.523-1.902.9-3.114.9-1.212 0-2.27-.377-3.113-.9a9.1 9.1 0 0 0 3.113-1.727 9.1 9.1 0 0 0 3.114 1.727Z"/>
                <path d="M8 11.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z"/>
              </svg>
            </button>
            <small v-if="passwordMatchError" class="error-text">{{ passwordMatchError }}</small>
          </div>
          
          <div class="form-actions">
            <button type="button" @click="cancelPasswordChange" class="cancel-btn">{{ t('common.cancel') }}</button>
            <button 
              type="submit" 
              class="action-btn save-btn"
              :disabled="!isPasswordFormValid || isChangingPassword"
            >
              {{ isChangingPassword ? t('profile.updating') : t('profile.updatePassword') }}
            </button>
          </div>
        </form>
        
        <div v-if="passwordSuccess" class="success-message">
          {{ t('profile.passwordUpdateSuccess') }}
        </div>
      </div>
      
      <!-- User Statistics Section -->
      <div class="section stats-section">
        <h3 class="section-title">{{ t('profile.quizStatistics') }}</h3>
        
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-value">{{ userStats.createdQuizzes }}</div>
            <div class="stat-label">{{ t('profile.quizzesCreated') }}</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">{{ userStats.takenQuizzes }}</div>
            <div class="stat-label">{{ t('profile.quizzesTaken') }}</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">{{ userStats.passRate }}%</div>
            <div class="stat-label">{{ t('profile.passRate') }}</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">{{ userStats.totalUpvotes }}</div>
            <div class="stat-label">{{ t('profile.totalUpvotes') }}</div>
          </div>
        </div>
      </div>
      
      <!-- Account Deletion Section -->
      <div class="section danger-section">
        <h3 class="section-title">{{ t('profile.dangerZone') }}</h3>
        <p class="warning-text">{{ t('profile.deleteAccountWarning') }}</p>
        <button @click="confirmDeleteAccount" class="delete-btn">{{ t('account.deleteAccount') }}</button>
      </div>
    </div>
    
    <!-- Confirmation Modal -->
    <ConfirmationModal
      :show="showConfirmation"
      :title="confirmationData.title"
      :message="confirmationData.message"
      :confirm-text="confirmationData.confirmText"
      :type="confirmationData.type"
      @confirm="confirmAction"
      @cancel="cancelConfirmation"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { auth } from '@/store/auth'
import { supabase } from '@/api/supabase'
import bcrypt from 'bcryptjs'
import ConfirmationModal from '@/components/ConfirmationModal.vue'
import { useLanguage } from '@/context/LanguageContext'
import '@/assets/pages/profile.css';

// Router for navigation
const router = useRouter()

// Translation function
const languageState = useLanguage()
const t = (key: string, params?: Record<string, any>): string => {
  if (!languageState) return key
  
  // Get the translation from the language state
  let translation = languageState.t(key)
  
  // If params are provided, replace placeholders like {param} with actual values
  if (params) {
    Object.keys(params).forEach(paramKey => {
      const placeholder = new RegExp(`{${paramKey}}`, 'g')
      translation = translation.replace(placeholder, params[paramKey])
    })
  }
  
  return translation
}

// State variables
const isLoading = ref(true)
const error = ref('')
const editMode = ref(false)
const showPasswordForm = ref(false)
const passwordSuccess = ref(false)

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
const passwordSpecial = ref(false)

// Confirmation modal state
const showConfirmation = ref(false)
const confirmationData = reactive({
  title: '',
  message: '',
  confirmText: 'Confirm',
  type: 'warning',
  action: ''
})

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
    passwordSpecial.value &&
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
    error.value = t('profile.loadError')
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
    usernameError.value = t('profile.usernameMinLength')
  } else if (formData.username.length > 20) {
    usernameError.value = t('profile.usernameMaxLength')
  } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
    usernameError.value = t('profile.usernameInvalidCharacters')
  }
}

function validateEmail() {
  emailError.value = ''
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(formData.email)) {
    emailError.value = t('profile.invalidEmail')
  }
}

function validateNewPassword() {
  const password = passwordData.newPassword
  passwordLength.value = password.length >= 8
  passwordUppercase.value = /[A-Z]/.test(password)
  passwordLowercase.value = /[a-z]/.test(password)
  passwordNumber.value = /[0-9]/.test(password)
  passwordSpecial.value = /[!@#$%^&*(),.?":{}|<>]/.test(password)
  
  if (passwordData.confirmPassword) {
    validateConfirmPassword()
  }
}

function validateConfirmPassword() {
  passwordMatchError.value = ''
  
  if (passwordData.newPassword !== passwordData.confirmPassword) {
    passwordMatchError.value = t('profile.passwordMismatch')
  }
}

// Date formatter
function formatDate(dateString: string) {
  if (!dateString) return t('common.notAvailable')
  
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
        throw new Error(t('profile.usernameCheckError'))
      }
      
      if (existingUser) {
        usernameError.value = t('profile.usernameTaken')
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
        throw new Error(t('profile.emailCheckError'))
      }
      
      if (existingEmail) {
        emailError.value = t('profile.emailTaken')
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
      throw new Error(updateError.message || t('profile.updateError'))
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
    error.value = err instanceof Error ? err.message : t('profile.updateError')
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
      throw new Error(t('profile.userNotFound'))
    }
    
    const isValidPassword = await bcrypt.compare(passwordData.currentPassword, user.password_hash)
    if (!isValidPassword) {
      throw new Error(t('profile.invalidCurrentPassword'))
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
      throw new Error(updateError.message || t('profile.passwordUpdateError'))
    }
    
    // Reset password form and show success message
    passwordData.currentPassword = ''
    passwordData.newPassword = ''
    passwordData.confirmPassword = ''
    showPasswordForm.value = false
    passwordSuccess.value = true
    
  } catch (err) {
    console.error('Error updating password:', err)
    error.value = err instanceof Error ? err.message : t('profile.passwordUpdateError')
  } finally {
    isChangingPassword.value = false
  }
}

// Confirm delete account action
function confirmDeleteAccount() {
  confirmationData.title = t('profile.deleteAccountTitle');
  confirmationData.message = t('profile.deleteAccountMessage');
  confirmationData.confirmText = t('profile.deleteAccountConfirmText');
  confirmationData.type = 'danger';
  confirmationData.action = 'deleteAccount';
  
  showConfirmation.value = true;
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
      throw new Error(updateError.message || t('profile.deleteAccountError'))
    }
    
    // Logout and redirect to home page
    auth.logout()
    router.push('/')
    
  } catch (err) {
    console.error('Error deleting account:', err)
    error.value = err instanceof Error ? err.message : t('profile.deleteAccountError')
  } finally {
    isDeletingAccount.value = false
  }
}

// Handle confirmation modal actions
function confirmAction() {
  switch (confirmationData.action) {
    case 'deleteAccount':
      deleteAccount();
      break;
  }
  
  showConfirmation.value = false;
}

// Cancel confirmation
function cancelConfirmation() {
  showConfirmation.value = false;
}
</script>

