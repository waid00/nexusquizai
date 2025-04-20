<!-- src/pages/Register.vue -->
<template>
  <div class="register-page">
    <router-link to="/" class="home-link">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
        <path fill-rule="evenodd" d="M15 8a.5.5 0 0 0-.5-.5H2.707l3.147-3.146a.5.5 0 1 0-.708-.708l-4 4a.5.5 0 0 0 0 .708l4 4a.5.5 0 0 0 .708-.708L2.707 8.5H14.5A.5.5 0 0 0 15 8z"/>
      </svg>
      Back to Home
    </router-link>

    <div class="auth-container">
      <h1 class="auth-title">Create Account</h1>
      <p class="auth-subtitle">Join NexusQuiz AI and create your own quizzes</p>
      
      <div v-if="auth.state.error" class="error-message">
        {{ auth.state.error }}
      </div>

      <form @submit.prevent="handleRegister">
        <div class="form-group">
          <label for="username" class="form-label">Username</label>
          <input 
            id="username" 
            v-model="formData.username" 
            type="text" 
            class="form-input" 
            required 
            autocomplete="username"
            :disabled="auth.state.isLoading"
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
          <label for="email" class="form-label">Email Address</label>
          <input 
            id="email" 
            v-model="formData.email" 
            type="email" 
            class="form-input" 
            required 
            autocomplete="email"
            :disabled="auth.state.isLoading"
            @blur="validateEmail"
          >
          <span class="input-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
              <path d="M.05 3.555A2 2 0 0 1 2 2h12a2 2 0 0 1 1.95 1.555L8 8.414.05 3.555ZM0 4.697v7.104l5.803-3.558L0 4.697ZM6.761 8.83l-6.57 4.027A2 2 0 0 0 2 14h12a2 2 0 0 0 1.808-1.144l-6.57-4.027L8 9.586l-1.239-.757Zm3.436-.586L16 11.801V4.697l-5.803 3.546Z"/>
            </svg>
          </span>
          <small v-if="emailError" class="error-text">{{ emailError }}</small>
        </div>

        <div class="form-group">
          <label for="password" class="form-label">Password</label>
          <input 
            id="password" 
            v-model="formData.password" 
            :type="showPassword ? 'text' : 'password'" 
            class="form-input" 
            required
            autocomplete="new-password"
            :disabled="auth.state.isLoading"
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
            <div :class="{ 'requirement-met': passwordLength }">✓ At least 8 characters</div>
            <div :class="{ 'requirement-met': passwordUppercase }">✓ Contains uppercase letter</div>
            <div :class="{ 'requirement-met': passwordLowercase }">✓ Contains lowercase letter</div>
            <div :class="{ 'requirement-met': passwordNumber }">✓ Contains number</div>
          </div>
        </div>

        <div class="form-group">
          <label for="confirmPassword" class="form-label">Confirm Password</label>
          <input 
            id="confirmPassword" 
            v-model="formData.confirmPassword" 
            :type="showPassword ? 'text' : 'password'" 
            class="form-input" 
            required
            autocomplete="new-password"
            :disabled="auth.state.isLoading"
            @input="validatePasswordMatch"
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
          <label for="terms">I agree to the <a href="#" class="auth-link">Terms of Service</a> and <a href="#" class="auth-link">Privacy Policy</a></label>
        </div>

        <button 
          type="submit" 
          class="auth-btn" 
          :disabled="auth.state.isLoading || !isFormValid"
        >
          {{ auth.state.isLoading ? 'Creating Account...' : 'Create Account' }}
        </button>
      </form>

      <div class="divider">OR</div>

      <div class="social-login">
        <button class="social-btn" :disabled="auth.state.isLoading">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
            <path d="M15.545 6.558a9.42 9.42 0 0 1 .139 1.626c0 2.434-.87 4.492-2.384 5.885h.002C11.978 15.292 10.158 16 8 16A8 8 0 1 1 8 0a7.689 7.689 0 0 1 5.352 2.082l-2.284 2.284A4.347 4.347 0 0 0 8 3.166c-2.087 0-3.86 1.408-4.492 3.304a4.792 4.792 0 0 0 0 3.063h.003c.635 1.893 2.405 3.301 4.492 3.301 1.078 0 2.004-.276 2.722-.764h-.003a3.702 3.702 0 0 0 1.599-2.431H8v-3.08h7.545z"/>
          </svg>
          Google
        </button>
        <button class="social-btn" :disabled="auth.state.isLoading">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
            <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.012 8.012 0 0 0 16 8c0-4.42-3.58-8-8-8z"/>
          </svg>
          GitHub
        </button>
      </div>

      <p class="auth-alt">
        Already have an account? 
        <router-link to="/login" class="auth-link">Sign in</router-link>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import '@/assets/auth.css'
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { auth } from '@/store/auth'

// Router
const router = useRouter()

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
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
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
    // Redirect to login page
    router.push('/login')
  }
}
</script>

<style scoped>
.register-page {
  padding: 2rem 1rem;
}

.error-text {
  color: rgb(255, 89, 89);
  font-size: 0.8rem;
  margin-top: 0.25rem;
  display: block;
}

.terms-checkbox {
  display: flex;
  gap: 0.5rem;
  margin: 1rem 0;
  align-items: flex-start;
  color: var(--text-alt);
  font-size: 0.85rem;
}

.requirement-met {
  color: var(--accent);
}

.password-requirements div {
  margin-top: 0.25rem;
  font-size: 0.8rem;
  color: var(--text-alt);
}
</style>