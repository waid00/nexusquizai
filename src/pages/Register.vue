<!-- src/pages/Register.vue -->
<template>
  <div class="register-page">
    <div class="auth-container">
      <!-- Registration form shown if not showing recovery phrase -->
      <div v-if="!showRecoveryPhrase && !registrationComplete">
        <h1 class="auth-title">{{ t('register.createAccount') }}</h1>
        <p class="auth-subtitle">{{ t('register.joinNexusQuiz') }}</p>
        
        <div v-if="auth.state.error" class="error-message">
          {{ auth.state.error }}
        </div>

        <form @submit.prevent="handleRegister">
          <div class="form-group">
            <label for="username" class="form-label">{{ t('account.username') }}*</label>
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
              autocomplete="username"
              :disabled="auth.state.isLoading"
              placeholder="Enter your username..."
              @blur="validateUsername"
            >
            <span class="input-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm2-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0Zm4 8c0 1-1 1-1 1H3s-1 0-1-1 1-4 6-4 6 3 6 4Zm-1-.004c-.001-.246-.154-.986-.832-1.664C11.516 10.68 10.289 10 8 10c-2.29 0-3.516.68-4.168 1.332-.678.678-.83 1.418-.832 1.664h10Z"/>
              </svg>
            </span>
            <small v-if="usernameError" class="error-text">{{ usernameError }}</small>
          </div>

          <div class="form-group">
            <label for="email" class="form-label">{{ t('account.emailAddress') }}*</label>
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
              autocomplete="email"
              :disabled="auth.state.isLoading"
              @blur="validateEmail"
              placeholder="Enter your email..."
            >
            <span class="input-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                <path d="M.05 3.555A2 2 0 0 1 2 2h12a2 2 0 0 1 1.95 1.555L8 8.414.05 3.555ZM0 4.697v7.104l5.803-3.558L0 4.697ZM6.761 8.83l-6.57 4.027A2 2 0 0 0 2 14h12a2 2 0 0 0 1.808-1.144l-6.57-4.027L8 9.586l-1.239-.757Zm3.436-.586L16 11.801V4.697l-5.803 3.546Z"/>
              </svg>
            </span>
            <small v-if="emailError" class="error-text">{{ emailError }}</small>
          </div>

          <div class="form-group">
            <label for="password" class="form-label">{{ t('account.password') }}*</label>
            <input 
              id="password" 
              v-model="formData.password" 
              :type="showPassword ? 'text' : 'password'" 
              class="form-input" 
              :class="{
                'is-valid': formData.password && passwordLength && passwordUppercase && passwordLowercase && passwordNumber,
                'is-invalid': formData.password && !(passwordLength && passwordUppercase && passwordLowercase && passwordNumber)
              }"
              required
              autocomplete="new-password"
              :disabled="auth.state.isLoading"
              @input="validatePassword"
              placeholder="Enter your password..."
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
              :disabled="auth.state.isLoading"
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
                {{ t('register.passwordRequirements.minChars') }}
              </div>
              <div :class="{ 'requirement-met': passwordUppercase }">
                <svg v-if="passwordUppercase" xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                  <path d="M10.97 4.97a.235.235 0 0 0-.02.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-1.071-1.05z"/>
                </svg>
                <svg v-else xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                </svg>
                {{ t('register.passwordRequirements.uppercase') }}
              </div>
              <div :class="{ 'requirement-met': passwordLowercase }">
                <svg v-if="passwordLowercase" xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                  <path d="M10.97 4.97a.235.235 0 0 0-.02.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-1.071-1.05z"/>
                </svg>
                <svg v-else xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                </svg>
                {{ t('register.passwordRequirements.lowercase') }}
              </div>
              <div :class="{ 'requirement-met': passwordNumber }">
                <svg v-if="passwordNumber" xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                  <path d="M10.97 4.97a.235.235 0 0 0-.02.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-1.071-1.05z"/>
                </svg>
                <svg v-else xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                </svg>
                {{ t('register.passwordRequirements.number') }}
              </div>
            </div>
          </div>

          <div class="form-group">
            <label for="confirmPassword" class="form-label">{{ t('register.confirmPassword') }}*</label>
            <input 
              id="confirmPassword" 
              v-model="formData.confirmPassword" 
              :type="showPassword ? 'text' : 'password'" 
              class="form-input" 
              :class="{
                'is-valid': formData.confirmPassword && formData.confirmPassword === formData.password,
                'is-invalid': formData.confirmPassword && formData.confirmPassword !== formData.password
              }"
              required
              autocomplete="new-password"
              :disabled="auth.state.isLoading"
              @input="validatePasswordMatch"
              placeholder="Confirm your password..."
            >
            <span class="input-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                <path d="M8 1a2 2 0 0 1 2 2v4H6V3a2 2 0 0 1 2-2zm3 6V3a3 3 0 0 0-6 0v4a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"/>
              </svg>
            </span>
            <small v-if="passwordMatchError" class="error-text">{{ passwordMatchError }}</small>
          </div>

          <div class="terms-checkbox">
            <input 
              id="terms" 
              type="checkbox" 
              v-model="formData.agreeTerms" 
              class="checkbox-input"
              required
              :disabled="auth.state.isLoading"
            >
            <label for="terms">{{ t('register.agreeToTerms') }} <a href="#" class="auth-link">{{ t('register.termsOfService') }}</a> {{ t('register.and') }} <a href="#" class="auth-link">{{ t('register.privacyPolicy') }}</a></label>
          </div>

          <button 
            type="submit" 
            class="auth-btn" 
            :disabled="auth.state.isLoading || !isFormValid"
          >
            {{ auth.state.isLoading ? t('register.creatingAccount') : t('register.createAccount') }}
          </button>
        </form>

        <p class="auth-alt">
          {{ t('register.alreadyHaveAccount') }} 
          <router-link to="/login" class="auth-link">{{ t('register.signIn') }}</router-link>
        </p>
      </div>

      <!-- Email verification screen (shown after registration but before recovery phrase) -->
      <div v-else-if="registrationComplete && !showRecoveryPhrase" class="verification-container">
        <h1 class="auth-title">{{ t('register.verifyEmail') }}</h1>
        <div class="email-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" fill="currentColor" viewBox="0 0 16 16">
            <path d="M0 4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V4Zm2-1a1 1 0 0 0-1 1v.217l7 4.2 7-4.2V4a1 1 0 0 0-1-1H2Zm13 2.383-4.708 2.825L15 11.105V5.383Zm-.034 6.876-5.64-3.471L8 9.583l-1.326-.795-5.64 3.47A1 1 0 0 0 2 13h12a1 1 0 0 0 .966-.741ZM1 11.105l4.708-2.897L1 5.383v5.722Z"/>
          </svg>
        </div>
        
        <p>{{ t('register.sentVerificationEmail') }} <strong>{{ formData.email }}</strong></p>
        <p>{{ t('register.checkInbox') }}</p>
        
        <div class="verification-actions">
          <button @click="showRecoveryPhrase = true" class="auth-btn">
            {{ t('register.continueToRecovery') }}
          </button>
          
          <button @click="resendVerificationEmail" class="text-btn" :disabled="resending">
            {{ resending ? t('register.sending') : t('register.resendVerificationEmail') }}
          </button>
          
          <div v-if="resendSuccess" class="success-message">
            {{ t('register.emailSentSuccess') }}
          </div>
        </div>
        
        <div class="verification-note">
          <p>{{ t('register.verifyEmailNote') }}</p>
        </div>
      </div>

      <!-- Recovery phrase screen -->
      <div v-else class="recovery-phrase-container">
        <h1 class="auth-title">{{ t('register.accountCreated') }}</h1>
        <p class="auth-subtitle">{{ t('register.saveRecoveryPhrase') }}</p>
        
        <div class="recovery-notice">
          <div class="notice-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
              <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm.93-9.412-1 4.705c-.07.34.029.533.304.533.194 0 .487-.07.686-.246l-.088.416c-.287.346-.92.598-1.465.598-.703 0-1.002-.422-.808-1.319l.738-3.468c.064-.293.006-.399-.287-.47l-.451-.081.082-.381 2.29-.287zM8 5.5a1 1 0 1 1 0-2 1 1 0 0 1 0 2z"/>
            </svg>
          </div>
          <p><strong>{{ t('register.important') }}:</strong> {{ t('register.recoveryPhraseInstructions') }}</p>
          <p>{{ t('register.cannotBeRecovered') }}</p>
        </div>
        
        <div class="recovery-words">
          <div v-for="(word, index) in auth.state.recoveryPhrase" :key="index" class="recovery-word">
            <span class="word-number">{{ index + 1 }}</span>
            <span class="word-text">{{ word }}</span>
          </div>
        </div>
        
        <div class="recovery-actions">
          <button 
            class="copy-btn" 
            @click="copyRecoveryPhrase" 
            title="Copy to clipboard"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
              <path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1v-1z"/>
              <path d="M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5h3zm-3-1A1.5 1.5 0 0 0 5 1.5v1A1.5 1.5 0 0 0 6.5 4h3A1.5 1.5 0 0 0 11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3z"/>
            </svg>
            {{ t('register.copyWords') }}
          </button>
          <div v-if="copied" class="copied-message">{{ t('register.copied') }}</div>
        </div>

        <div class="recovery-confirm">
          <div class="checkbox-group">
            <input 
              id="confirm-saved" 
              type="checkbox" 
              v-model="recoveryPhraseConfirmed" 
              class="checkbox-input"
            >
            <label for="confirm-saved">{{ t('register.haveSavedRecoveryWords') }}</label>
          </div>
          
          <button 
            class="auth-btn continue-btn" 
            @click="proceedToLogin"
            :disabled="!recoveryPhraseConfirmed"
          >
            {{ t('register.continueToLogin') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import '@/assets/pages/auth.css';
import { ref, reactive, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { auth } from '@/store/auth'
import { supabase } from '@/api/supabase'
import { useLanguage } from '@/context/LanguageContext'

// Router
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

// Form data
const formData = reactive({
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
  agreeTerms: false
})

// UI state
const showPassword = ref(false)
const showRecoveryPhrase = ref(false)
const recoveryPhraseConfirmed = ref(false)
const copied = ref(false)
const registrationComplete = ref(false)
const resending = ref(false)
const resendSuccess = ref(false)

// Validation state
const usernameError = ref('')
const emailError = ref('')
const passwordMatchError = ref('')

// Password strength requirements
const passwordLength = ref(false)
const passwordUppercase = ref(false)
const passwordLowercase = ref(false)
const passwordNumber = ref(false)

// Form validation
const isFormValid = computed(() => {
  return formData.username.trim() !== '' 
    && formData.email.trim() !== '' 
    && isValidEmail(formData.email)
    && formData.password.trim() !== ''
    && formData.password === formData.confirmPassword
    && passwordLength.value
    && passwordUppercase.value
    && passwordLowercase.value
    && passwordNumber.value
    && formData.agreeTerms
    && !usernameError.value
    && !emailError.value
    && !passwordMatchError.value
})

// Validation helpers
function isValidEmail(email: string): boolean {
  // More comprehensive email regex that checks for proper format
  const emailRegex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
  return emailRegex.test(email)
}

function validateUsername() {
  if (formData.username.length < 3) {
    usernameError.value = 'Username must be at least 3 characters'
  } else if (formData.username.length > 20) {
    usernameError.value = 'Username must be less than 20 characters'
  } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
    usernameError.value = 'Username can only contain letters, numbers, and underscores'
  } else {
    usernameError.value = ''
  }
}

function validateEmail() {
  if (!isValidEmail(formData.email)) {
    emailError.value = 'Please enter a valid email address'
  } else {
    emailError.value = ''
  }
}

function validatePassword() {
  const password = formData.password
  passwordLength.value = password.length >= 8
  passwordUppercase.value = /[A-Z]/.test(password)
  passwordLowercase.value = /[a-z]/.test(password)
  passwordNumber.value = /[0-9]/.test(password)
  
  // Check match if confirm password is already entered
  if (formData.confirmPassword) {
    validatePasswordMatch()
  }
}

function validatePasswordMatch() {
  if (formData.password !== formData.confirmPassword) {
    passwordMatchError.value = 'Passwords do not match'
  } else {
    passwordMatchError.value = ''
  }
}

// Setup watchers for real-time validation
watch(() => formData.username, (newValue) => {
  if (newValue.trim() !== '') {
    validateUsername()
  }
})

watch(() => formData.email, (newValue) => {
  if (newValue.trim() !== '') {
    validateEmail()
  }
})

// Watch for changes in password fields and validate in real-time
watch(() => formData.password, () => {
  validatePassword()
})

watch(() => formData.confirmPassword, () => {
  if (formData.confirmPassword.trim() !== '') {
    validatePasswordMatch()
  }
})

// Register handler
const handleRegister = async () => {
  if (!isFormValid.value) return
  
  auth.clearError()
  const success = await auth.register(
    formData.username, 
    formData.email, 
    formData.password
  )
  
  if (success) {
    // First show the verification screen
    registrationComplete.value = true
    showRecoveryPhrase.value = true
  }
}

// Resend verification email
const resendVerificationEmail = async () => {
  if (!auth.state.user) return
  
  resending.value = true
  resendSuccess.value = false
  
  try {
    const success = await auth.resendVerificationEmail()
    if (success) {
      resendSuccess.value = true
    }
  } catch (error) {
    console.error('Failed to resend verification email:', error)
  } finally {
    resending.value = false
  }
}

// Copy recovery phrase to clipboard
const copyRecoveryPhrase = () => {
  if (auth.state.recoveryPhrase) {
    const phraseText = auth.state.recoveryPhrase.join(' ')
    navigator.clipboard.writeText(phraseText)
    copied.value = true
    
    // Clear the copied message after 2 seconds
    setTimeout(() => {
      copied.value = false
    }, 2000)
  }
}

// Continue to login after confirming recovery phrase
const proceedToLogin = () => {
  if (recoveryPhraseConfirmed.value) {
    router.push('/login')
  }
}
</script>

<style scoped>
@import '@/assets/pages/register.css';
</style>