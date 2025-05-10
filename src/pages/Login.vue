<!-- src/pages/Login.vue -->
<template>
  <div class="login-page">
    <div class="auth-container">
      <h1 class="auth-title">{{ t('login.welcomeBack') }}</h1>
      <p class="auth-subtitle">{{ t('login.enterCredentials') }}</p>
      
      <div v-if="auth.state.error" class="error-message">
        {{ auth.state.error }}
      </div>

      <form @submit.prevent="handleLogin">
        <div class="form-group">
          <label for="username" class="form-label">{{ t('login.usernameOrEmail') }}</label>
          <input 
            id="username" 
            v-model="formData.username" 
            type="text" 
            class="form-input" 
            required 
            autocomplete="username"
            :disabled="auth.state.isLoading"
            placeholder="Enter your username or email..."
          >
          <span class="input-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
              <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm2-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0Zm4 8c0 1-1 1-1 1H3s-1 0-1-1 1-4 6-4 6 3 6 4Zm-1-.004c-.001-.246-.154-.986-.832-1.664C11.516 10.68 10.289 10 8 10c-2.29 0-3.516.68-4.168 1.332-.678.678-.83 1.418-.832 1.664h10Z"/>
            </svg>
          </span>
        </div>

        <div class="form-group">
          <label for="password" class="form-label">{{ t('account.password') }}</label>
          <input 
            id="password" 
            v-model="formData.password" 
            :type="showPassword ? 'text' : 'password'" 
            class="form-input" 
            required
            autocomplete="current-password"
            :disabled="auth.state.isLoading"
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
        </div>

        <button 
          type="submit" 
          class="auth-btn" 
          :disabled="auth.state.isLoading || !isFormValid"
        >
          {{ auth.state.isLoading ? t('login.signingIn') : t('login.signIn') }}
        </button>
        <div class="remember-me">
          <input 
            id="remember" 
            type="checkbox" 
            v-model="formData.remember" 
            class="checkbox-input"
            :disabled="auth.state.isLoading"
          >
          <label for="remember">{{ t('account.rememberMe') }}</label>
        </div>

      </form>

      <p class="auth-alt">
        {{ t('login.noAccount') }} 
        <router-link to="/register" class="auth-link">{{ t('login.createOne') }}</router-link>
      </p>

      <p class="auth-alt">
        <router-link to="/forgot-password" class="auth-link">{{ t('account.forgotPassword') }}</router-link>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import '@/assets/pages/auth.css';
import { ref, reactive, computed } from 'vue'
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
  password: '',
  remember: false
})

// UI state
const showPassword = ref(false)

// Form validation
const isFormValid = computed(() => {
  return formData.username.trim() !== '' && formData.password.trim() !== ''
})

// Login handler
const handleLogin = async () => {
  if (!isFormValid.value) return
  
  auth.clearError()
  
  // Determine if input is email or username and call the appropriate login function
  const isEmail = formData.username.includes('@')
  let success
  
  if (isEmail) {
    // If input contains @, treat as email
    success = await auth.login(formData.username, formData.password)
  } else {
    // Otherwise treat as username
    success = await auth.loginByUsername(formData.username, formData.password)
  }
  
  if (success) {
    // Redirect to home page
    router.push('/')
  }
}
</script>