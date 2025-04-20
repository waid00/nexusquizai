<!-- src/pages/ForgotPassword.vue -->
<template>
  <div class="forgot-password-page">
    <router-link to="/login" class="home-link">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
        <path fill-rule="evenodd" d="M15 8a.5.5 0 0 0-.5-.5H2.707l3.147-3.146a.5.5 0 1 0-.708-.708l-4 4a.5.5 0 0 0 0 .708l4 4a.5.5 0 0 0 .708-.708L2.707 8.5H14.5A.5.5 0 0 0 15 8z"/>
      </svg>
      Back to Login
    </router-link>

    <div class="auth-container">
      <h1 class="auth-title">Recover Password</h1>
      <p class="auth-subtitle">Enter your email to receive a password reset link</p>
      
      <div v-if="errorMessage" class="error-message">
        {{ errorMessage }}
      </div>
      
      <div v-if="successMessage" class="success-message">
        {{ successMessage }}
      </div>

      <form v-if="!resetSent" @submit.prevent="handleResetRequest">
        <div class="form-group">
          <label for="email" class="form-label">Email Address</label>
          <input 
            id="email" 
            v-model="email" 
            type="email" 
            class="form-input" 
            required 
            autocomplete="email"
            :disabled="isLoading"
          >
          <span class="input-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
              <path d="M.05 3.555A2 2 0 0 1 2 2h12a2 2 0 0 1 1.95 1.555L8 8.414.05 3.555ZM0 4.697v7.104l5.803-3.558L0 4.697ZM6.761 8.83l-6.57 4.027A2 2 0 0 0 2 14h12a2 2 0 0 0 1.808-1.144l-6.57-4.027L8 9.586l-1.239-.757Zm3.436-.586L16 11.801V4.697l-5.803 3.546Z"/>
            </svg>
          </span>
        </div>

        <button 
          type="submit" 
          class="auth-btn" 
          :disabled="isLoading || !email"
        >
          {{ isLoading ? 'Processing...' : 'Reset Password' }}
        </button>
      </form>

      <div v-if="resetSent" class="reset-success">
        <div class="success-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" fill="currentColor" viewBox="0 0 16 16">
            <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm.93-9.412-1 4.705c-.07.34.029.533.304.533.194 0 .487-.07.686-.246l-.088.416c-.287.346-.92.598-1.465.598-.703 0-1.002-.422-.808-1.319l.738-3.468c.064-.293.006-.399-.287-.47l-.451-.081.082-.381 2.29-.287zM8 5.5a1 1 0 1 1 0-2 1 1 0 0 1 0 2z"/>
          </svg>
        </div>
        <p>We've sent a password reset link to <strong>{{ email }}</strong>.</p>
        <p>Please check your email and follow the instructions.</p>
        <button class="link-btn" @click="resetForm">Try another email</button>
      </div>

      <p class="auth-alt">
        Remember your password? 
        <router-link to="/login" class="auth-link">Sign in</router-link>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import '@/assets/auth.css'
import { ref } from 'vue'

// Email input
const email = ref('')

// UI state
const isLoading = ref(false)
const resetSent = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

// Handle reset request
const handleResetRequest = async () => {
  if (!email.value) return
  
  isLoading.value = true
  errorMessage.value = ''
  
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 1500))
  
  // Demo mode - always succeed
  resetSent.value = true
  isLoading.value = false
}

// Reset form
const resetForm = () => {
  email.value = ''
  resetSent.value = false
  errorMessage.value = ''
  successMessage.value = ''
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

.reset-success {
  text-align: center;
  color: var(--text-main);
  animation: fadeIn 0.5s ease;
}

.success-icon {
  color: var(--accent);
  margin-bottom: 1.5rem;
}

.reset-success p {
  margin-bottom: 1rem;
  line-height: 1.5;
}

.link-btn {
  background: none;
  border: none;
  color: var(--accent);
  cursor: pointer;
  font-size: 0.9rem;
  padding: 0;
  margin-top: 1rem;
  text-decoration: underline;
}

.link-btn:hover {
  opacity: 0.8;
  transform: none;
  box-shadow: none;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
</style>