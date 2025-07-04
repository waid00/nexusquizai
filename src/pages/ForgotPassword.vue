<!-- src/pages/ForgotPassword.vue -->
<template>
  <div class="forgot-password-page">
    <div class="auth-container">
      <!-- Initial screen (enter username) -->
      <div v-if="currentStep === 'username'">
        <h1 class="auth-title">{{ t('password.recoverPassword') }}</h1>
        <p class="auth-subtitle">{{ t('password.enterUsernameToRecover') }}</p>
        
        <div v-if="errorMessage" class="error-message">
          {{ errorMessage }}
        </div>

        <form @submit.prevent="goToRecoveryPhrase">
          <div class="form-group">
            <label for="username" class="form-label">{{ t('login.usernameOrEmail') }}</label>
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
            {{ isLoading ? t('common.processing') : t('common.submit') }}
          </button>
        </form>
      </div>

      <!-- Recovery phrase screen -->
      <div v-else-if="currentStep === 'recovery'">
        <h1 class="auth-title">{{ t('password.enterRecoveryPhrase') }}</h1>
        <p class="auth-subtitle">{{ t('password.type10Words') }}</p>

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
              @paste="handlePasteWord($event, index)"
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
            {{ t('common.back') }}
          </button>
          <button 
            @click="verifyRecoveryPhrase" 
            class="auth-btn" 
            :disabled="isLoading || !isRecoveryPhraseComplete"
          >
            {{ isLoading ? t('password.verifying') : t('password.verifyRecoveryPhrase') }}
          </button>
        </div>
      </div>

      <!-- New password screen -->
      <div v-else-if="currentStep === 'new-password'">
        <h1 class="auth-title">{{ t('password.createNewPassword') }}</h1>
        <p class="auth-subtitle">{{ t('password.enterNewPassword') }}</p>

        <div v-if="errorMessage" class="error-message">
          {{ errorMessage }}
        </div>

        <div v-if="successMessage" class="success-message">
          {{ successMessage }}
        </div>

        <form v-if="!resetComplete" @submit.prevent="resetPassword">
          <div class="form-group">
            <label for="new-password" class="form-label">{{ t('password.newPassword') }}</label>
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
                {{ t('password.atLeast8Chars') }}
              </div>
              <div :class="{ 'requirement-met': passwordUppercase }">
                <svg v-if="passwordUppercase" xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                  <path d="M10.97 4.97a.235.235 0 0 0-.02.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-1.071-1.05z"/>
                </svg>
                <svg v-else xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                </svg>
                {{ t('password.containsUppercase') }}
              </div>
              <div :class="{ 'requirement-met': passwordLowercase }">
                <svg v-if="passwordLowercase" xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                  <path d="M10.97 4.97a.235.235 0 0 0-.02.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-1.071-1.05z"/>
                </svg>
                <svg v-else xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                </svg>
                {{ t('password.containsLowercase') }}
              </div>
              <div :class="{ 'requirement-met': passwordNumber }">
                <svg v-if="passwordNumber" xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                  <path d="M10.97 4.97a.235.235 0 0 0-.02.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-1.071-1.05z"/>
                </svg>
                <svg v-else xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                </svg>
                {{ t('password.containsNumber') }}
              </div>
            </div>
          </div>

          <div class="form-group">
            <label for="confirm-password" class="form-label">{{ t('password.confirmPassword') }}</label>
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
            {{ isLoading ? t('password.resettingPassword') : t('password.resetPassword') }}
          </button>
        </form>

        <div v-if="resetComplete" class="reset-success">
          <div class="success-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" fill="currentColor" viewBox="0 0 16 16">
              <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zm-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z"/>
            </svg>
          </div>
          <p>{{ t('password.passwordResetSuccess') }}</p>
          <router-link to="/login" class="auth-btn login-btn">{{ t('login.goToLogin') }}</router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import '@/assets/pages/auth.css';
import { ref, computed } from 'vue'
import { auth } from '@/store/auth'
import { supabase } from '@/api/supabase'
import '@/assets/pages/password.css';
import { useLanguage } from '@/context/LanguageContext'

// Add language support
const language = useLanguage();
const t = (key: string) => language?.t?.(key) || key;

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

// Handle pasting all recovery words at once
function handlePasteWord(event: ClipboardEvent, index: number) {
  if (event.clipboardData) {
    const pastedText = event.clipboardData.getData('text')
    
    // Check if multiple words were pasted
    const words = pastedText.trim().split(/[\s,\t\n]+/).filter(word => word)
    
    if (words.length > 1) {
      event.preventDefault() // Prevent default paste behavior
      distributePastedWords(pastedText)
    }
    // For single word pastes, let the default behavior happen
  }
}

// Distribute words from pasted text into individual inputs
function distributePastedWords(text: string) {
  // Split by spaces, commas, tabs, or newlines
  const words = text.trim().split(/[\s,\t\n]+/).filter(word => word)
  
  // Fill recovery phrase array with words (up to 10)
  for (let i = 0; i < Math.min(words.length, 10); i++) {
    recoveryPhrase.value[i] = words[i].toLowerCase().trim()
  }
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
    
    // Check if user exists with this username and recovery phrase
    const { data, error } = await supabase
      .from('Users')
      .select('id, email')
      .or(`username.eq.${username.value},email.eq.${username.value}`)
      .eq('is_active', true)
      .single()
    
    if (error || !data) {
      throw new Error(t('password.userNotFound'))
    }
    
    // Store the email for the reset password step
    const userEmail = data.email
    
    // Check if recovery phrase matches
    const { data: phraseCheck, error: phraseError } = await supabase
      .from('Users')
      .select('id')
      .eq('id', data.id)
      .eq('recovery_phrase', wordsArray.join(' '))
      .single()
    
    if (phraseError || !phraseCheck) {
      throw new Error(t('password.invalidRecoveryPhrase'))
    }
    
    // Store the email for later use in resetPassword
    localStorage.setItem('resetEmail', userEmail)
    
    // Success - go to password reset screen
    currentStep.value = 'new-password'
    return true
  } catch (error: any) {
    errorMessage.value = error.message || t('common.error')
    return false
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
    passwordMatchError.value = t('password.passwordsDoNotMatch')
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
    // Get the user's email stored during verification step
    const userEmail = localStorage.getItem('resetEmail')
    if (!userEmail) {
      throw new Error(t('password.sessionExpired'))
    }
    
    // Get the recovery phrase as a string
    const recoveryPhraseString = recoveryPhrase.value.join(' ')
    
    // Call the reset password function with all required parameters
    const success = await auth.resetPassword(userEmail, recoveryPhraseString, newPassword.value)
    
    if (success) {
      // Clean up stored email
      localStorage.removeItem('resetEmail')
      
      resetComplete.value = true
      successMessage.value = t('password.passwordResetSuccess')
    }
  } catch (error: any) {
    errorMessage.value = error.message || t('password.failedToReset')
  } finally {
    isLoading.value = false
  }
}
</script>