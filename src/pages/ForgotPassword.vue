<!-- src/pages/ForgotPassword.vue -->
<template>
  <div class="forgot-password-page">
    <div class="auth-container">
      <!-- Initial screen (enter username) -->
      <div v-if="currentStep === 'username'">
        <h1 class="auth-title">Recover Password</h1>
        <p class="auth-subtitle">Enter your username to start recovery</p>
        
        <div v-if="errorMessage" class="error-message">
          {{ errorMessage }}
        </div>

        <form @submit.prevent="goToRecoveryPhrase">
          <div class="form-group">
            <label for="username" class="form-label">Username or Email</label>
            <input 
              id="username" 
              v-model="username" 
              type="text" 
              class="form-input" 
              required 
              autocomplete="username"
              :disabled="isLoading"
            >
            <span class="input-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm2-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0Zm4 8c0 1-1 1-1 1H3s-1 0-1-1 1-4 6-4 6 3 6 4Zm-1-.004c-.001-.246-.154-.986-.832-1.664C11.516 10.68 10.289 10 8 10c-2.29 0-3.516.68-4.168 1.332-.678.678-.83 1.418-.832 1.664h10Z"/>
              </svg>
            </span>
          </div>

          <button 
            type="submit" 
            class="auth-btn" 
            :disabled="isLoading || !username"
          >
            {{ isLoading ? 'Processing...' : 'Continue' }}
          </button>
        </form>
      </div>

      <!-- Recovery phrase screen -->
      <div v-else-if="currentStep === 'recovery'">
        <h1 class="auth-title">Enter Recovery Phrase</h1>
        <p class="auth-subtitle">Type the 10 words provided during registration</p>

        <div v-if="errorMessage" class="error-message">
          {{ errorMessage }}
        </div>

        <div class="recovery-form">
          <div v-for="(word, index) in recoveryPhrase" :key="index" class="recovery-word-input">
            <label :for="`word-${index}`" class="word-label">{{ index + 1 }}</label>
            <input 
              :id="`word-${index}`" 
              v-model="recoveryPhrase[index]"
              type="text" 
              class="form-input recovery-input" 
              :ref="`word${index}`"
              @keydown="handleWordInputKeydown($event, index)"
              :disabled="isLoading"
              autocomplete="off"
            >
          </div>
        </div>

        <div class="recovery-actions">
          <button 
            @click="goToUsername" 
            class="back-btn"
            :disabled="isLoading"
          >
            Back
          </button>
          <button 
            @click="verifyRecoveryPhrase" 
            class="auth-btn" 
            :disabled="isLoading || !isRecoveryPhraseComplete"
          >
            {{ isLoading ? 'Verifying...' : 'Verify Recovery Phrase' }}
          </button>
        </div>
      </div>

      <!-- New password screen -->
      <div v-else-if="currentStep === 'new-password'">
        <h1 class="auth-title">Create New Password</h1>
        <p class="auth-subtitle">Enter your new password</p>

        <div v-if="errorMessage" class="error-message">
          {{ errorMessage }}
        </div>

        <div v-if="successMessage" class="success-message">
          {{ successMessage }}
        </div>

        <form v-if="!resetComplete" @submit.prevent="resetPassword">
          <div class="form-group">
            <label for="new-password" class="form-label">New Password</label>
            <input 
              id="new-password" 
              v-model="newPassword" 
              :type="showPassword ? 'text' : 'password'" 
              class="form-input" 
              required
              autocomplete="new-password"
              :disabled="isLoading"
              @input="validatePassword"
            >
            <span class="input-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                <path d="M5.338 1.59a61.44 61.44 0 0 0-2.837.856.481.481 0 0 0-.328.39c-.554 4.157.726 7.19 2.253 9.188a10.725 10.725 0 0 0 2.287 2.233c.346.244.652.42.893.533.12.057.218.095.293.118a.55.55 0 0 0 .101.025.615.615 0 0 0 .1-.025c.076-.023.174-.061.294-.118.24-.113.547-.29.893-.533a10.726 10.726 0 0 0 2.287-2.233c1.527-1.997 2.807-5.031 2.253-9.188a.48.48 0 0 0-.328-.39c-.651-.213-1.75-.56-2.837-.855C9.552 1.29 8.531 1.067 8 1.067c-.53 0-1.552.223-2.662.524zM5.072.56C6.157.265 7.31 0 8 0s1.843.265 2.928.56c1.11.3 2.229.655 2.887.87a1.54 1.54 0 0 1 1.044 1.262c.596 4.477-.787 7.795-2.465 9.99a11.775 11.775 0 0 1-2.517 2.453 7.159 7.159 0 0 1-1.048.625c-.28.132-.581.24-.829.24s-.548-.108-.829-.24a7.158 7.158 0 0 1-1.048-.625 11.777 11.777 0 0 1-2.517-2.453C1.928 10.487.545 7.169 1.141 2.692A1.54 1.54 0 0 1 2.185 1.43 62.456 62.456 0 0 1 5.072.56z"/>
                <path d="M9.5 6.5a1.5 1.5 0 0 1-1 1.415l.385 1.99a.5.5 0 0 1-.491.595h-.788a.5.5 0 0 1-.49-.595l.384-1.99a1.5 1.5 0 1 1 2-1.415z"/>
              </svg>
            </span>
            <button 
              type="button" 
              class="password-toggle" 
              @click="showPassword = !showPassword"
              :disabled="isLoading"
            >
              <svg v-if="!showPassword" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                <path d="M16 8s-3-5.5-8-5.5S0 8 0 8s3 5.5 8 5.5S16 8 16 8zM1.173 8a13.133 13.133 0 0 1 1.66-2.043C4.12 4.668 5.88 3.5 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13.133 13.133 0 0 1 14.828 8c-.058.087-.122.183-.195.288-.335.48-.83 1.12-1.465 1.755C11.879 11.332 10.119 12.5 8 12.5c-2.12 0-3.879-1.168-5.168-2.457A13.134 13.134 0 0 1 1.172 8z"/>
                <path d="M8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zM4.5 8a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0z"/>
              </svg>
              <svg v-else xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                <path d="M13.359 11.238C15.06 9.72 16 8 16 8s-3-5.5-8-5.5a7.028 7.028 0 0 0-2.79.588l.77.771A5.944 5.944 0 0 1 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13.134 13.134 0 0 1 14.828 8c-.058.087-.122.183-.195.288-.335.48-.83 1.12-1.465 1.755-.165.165-.337.328-.517.486l.708.709z"/>
                <path d="M11.297 9.176a3.5 3.5 0 0 0-4.474-4.474l.823.823a2.5 2.5 0 0 1 2.829 2.829l.822.822zm-2.943 1.299.822.822a3.5 3.5 0 0 1-4.474-4.474l.823.823a2.5 2.5 0 0 0 2.829 2.829z"/>
                <path d="M3.35 5.47c-.18.16-.353.322-.518.487A13.134 13.134 0 0 0 1.172 8l.195.288c.335.48.83 1.12 1.465 1.755C4.121 11.332 5.881 12.5 8 12.5c.716 0 1.39-.133 2.02-.36l.77.772A7.029 7.029 0 0 1 8 13.5C3 13.5 0 8 0 8s.939-1.721 2.641-3.238l.708.709zm10.296 8.884-12-12 .708-.708 12 12-.708.708z"/>
              </svg>
            </button>
            <div class="password-requirements">
              <div :class="{ 'requirement-met': passwordLength }">
                <svg v-if="passwordLength" xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                  <path d="M10.97 4.97a.235.235 0 0 0-.02.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-1.071-1.05z"/>
                </svg>
                <svg v-else xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                </svg>
                At least 8 characters
              </div>
              <div :class="{ 'requirement-met': passwordUppercase }">
                <svg v-if="passwordUppercase" xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                  <path d="M10.97 4.97a.235.235 0 0 0-.02.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-1.071-1.05z"/>
                </svg>
                <svg v-else xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                </svg>
                Contains uppercase letter
              </div>
              <div :class="{ 'requirement-met': passwordLowercase }">
                <svg v-if="passwordLowercase" xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                  <path d="M10.97 4.97a.235.235 0 0 0-.02.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-1.071-1.05z"/>
                </svg>
                <svg v-else xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                </svg>
                Contains lowercase letter
              </div>
              <div :class="{ 'requirement-met': passwordNumber }">
                <svg v-if="passwordNumber" xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                  <path d="M10.97 4.97a.235.235 0 0 0-.02.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-1.071-1.05z"/>
                </svg>
                <svg v-else xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                </svg>
                Contains number
              </div>
            </div>
          </div>

          <div class="form-group">
            <label for="confirm-password" class="form-label">Confirm Password</label>
            <input 
              id="confirm-password" 
              v-model="confirmPassword" 
              :type="showPassword ? 'text' : 'password'" 
              class="form-input" 
              required
              autocomplete="new-password"
              :disabled="isLoading"
              @input="validatePasswordMatch"
            >
            <span class="input-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                <path d="M8 1a2 2 0 0 1 2 2v4H6V3a2 2 0 0 1 2-2zm3 6V3a3 3 0 0 0-6 0v4a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"/>
              </svg>
            </span>
            <small v-if="passwordMatchError" class="error-text">{{ passwordMatchError }}</small>
          </div>

          <button 
            type="submit" 
            class="auth-btn" 
            :disabled="isLoading || !isPasswordValid"
          >
            {{ isLoading ? 'Resetting Password...' : 'Reset Password' }}
          </button>
        </form>

        <div v-if="resetComplete" class="reset-success">
          <div class="success-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" fill="currentColor" viewBox="0 0 16 16">
              <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zm-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z"/>
            </svg>
          </div>
          <p>Your password has been successfully reset.</p>
          <router-link to="/login" class="auth-btn login-btn">Go to Login</router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import '@/assets/auth.css'
import { ref, computed } from 'vue'
import { auth } from '@/store/auth'

// Step navigation (username → recovery phrase → new password)
const currentStep = ref('username')

// Form data
const username = ref('')
const recoveryPhrase = ref(Array(10).fill(''))
const newPassword = ref('')
const confirmPassword = ref('')

// UI state
const isLoading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const showPassword = ref(false)
const resetComplete = ref(false)

// Password validation
const passwordMatchError = ref('')
const passwordLength = ref(false)
const passwordUppercase = ref(false)
const passwordLowercase = ref(false)
const passwordNumber = ref(false)

// Step 1: Go from username to recovery phrase input
async function goToRecoveryPhrase() {
  if (!username.value) return
  
  errorMessage.value = ''
  currentStep.value = 'recovery'
}

// Step 2: Go back to username input
function goToUsername() {
  errorMessage.value = ''
  currentStep.value = 'username'
}

// Recover phrase validation
const isRecoveryPhraseComplete = computed(() => {
  return !recoveryPhrase.value.some(word => !word.trim())
})

// Keyboard navigation in phrase inputs
function handleWordInputKeydown(event: KeyboardEvent, index: number) {
  // If user presses space or tab, move to next input
  if ((event.key === ' ' || event.key === 'Tab') && event.target instanceof HTMLInputElement) {
    event.preventDefault()
    
    // Move to next input if this one has text
    if (event.target.value.trim() && index < 9) {
      const nextInput = document.getElementById(`word-${index + 1}`)
      nextInput?.focus()
    }
  }
  
  // If user presses backspace on empty input, move to previous
  if (event.key === 'Backspace' && event.target instanceof HTMLInputElement) {
    if (!event.target.value && index > 0) {
      const prevInput = document.getElementById(`word-${index - 1}`)
      prevInput?.focus()
    }
  }
}

// Step 3: Verify recovery phrase and go to new password screen
async function verifyRecoveryPhrase() {
  if (!isRecoveryPhraseComplete.value) return
  
  isLoading.value = true
  errorMessage.value = ''
  
  try {
    const wordsArray = recoveryPhrase.value.map(word => word.trim().toLowerCase())
    const success = await auth.verifyRecoveryPhrase(username.value, wordsArray)
    
    if (success) {
      currentStep.value = 'new-password'
    }
  } catch (error: any) {
    errorMessage.value = error.message || 'Failed to verify recovery phrase'
  } finally {
    isLoading.value = false
  }
}

// Password validation
function validatePassword() {
  const password = newPassword.value
  passwordLength.value = password.length >= 8
  passwordUppercase.value = /[A-Z]/.test(password)
  passwordLowercase.value = /[a-z]/.test(password)
  passwordNumber.value = /[0-9]/.test(password)
  
  // Check match if confirm password is already entered
  if (confirmPassword.value) {
    validatePasswordMatch()
  }
}

function validatePasswordMatch() {
  if (newPassword.value !== confirmPassword.value) {
    passwordMatchError.value = 'Passwords do not match'
  } else {
    passwordMatchError.value = ''
  }
}

// Check if password is valid
const isPasswordValid = computed(() => {
  return passwordLength.value 
    && passwordUppercase.value 
    && passwordLowercase.value 
    && passwordNumber.value 
    && newPassword.value === confirmPassword.value
})

// Step 4: Reset password
async function resetPassword() {
  if (!isPasswordValid.value) return
  
  isLoading.value = true
  errorMessage.value = ''
  successMessage.value = ''
  
  try {
    const success = await auth.resetPassword(newPassword.value)
    
    if (success) {
      resetComplete.value = true
      successMessage.value = 'Your password has been successfully reset.'
    }
  } catch (error: any) {
    errorMessage.value = error.message || 'Failed to reset password'
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
.forgot-password-page {
  padding: 2rem 1rem;
}

.success-message {
  background: rgba(61, 220, 132, 0.1);
  border: 1px solid rgba(61, 220, 132, 0.3);
  border-radius: 6px;
  padding: 0.75rem;
  margin-bottom: 1.5rem;
  color: var(--accent);
  font-size: 0.9rem;
}

.error-text {
  color: rgb(255, 89, 89);
  font-size: 0.8rem;
  margin-top: 0.25rem;
  display: block;
}

.recovery-form {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;
  margin: 1.5rem 0;
}

.recovery-word-input {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.word-label {
  color: var(--accent);
  font-weight: 600;
  font-size: 0.9rem;
  min-width: 1.5rem;
  text-align: center;
}

.recovery-input {
  font-family: monospace;
  letter-spacing: 0.5px;
}

.recovery-actions {
  display: flex;
  gap: 0.75rem;
  margin-top: 1.5rem;
}

.back-btn {
  flex: 1;
  background: var(--input-bg);
  color: var(--text-main);
  border: 1px solid var(--input-border);
}

.back-btn:hover:not(:disabled) {
  background: var(--input-border);
}

.auth-btn {
  flex: 2;
}

.requirement-met {
  color: var(--accent);
}

.password-requirements div {
  margin-top: 0.25rem;
  font-size: 0.8rem;
  color: var(--text-alt);
}

.reset-success {
  text-align: center;
  color: var(--text-main);
  animation: fadeIn 0.5s ease;
  margin-top: 1rem;
}

.success-icon {
  color: var(--accent);
  margin-bottom: 1.5rem;
}

.reset-success p {
  margin-bottom: 1.5rem;
  line-height: 1.5;
}

.login-btn {
  display: inline-block;
  text-decoration: none;
  margin-top: 1rem;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@media (max-width: 480px) {
  .recovery-form {
    grid-template-columns: 1fr;
  }
}
</style>