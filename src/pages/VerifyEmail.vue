<template>
  <div class="verify-email-page">
    <div class="auth-container">
      <div v-if="isVerifying">
        <h1 class="auth-title">{{ t('register.verifyEmail') }}</h1>
        <p class="auth-subtitle">{{ t('common.loading') }}</p>
        <div class="loading-indicator">
          <div class="spinner"></div>
        </div>
      </div>

      <div v-else-if="isVerified">
        <h1 class="auth-title">{{ t('register.emailSentSuccess') }}</h1>
        <div class="success-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" fill="currentColor" viewBox="0 0 16 16">
            <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zm-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z"/>
          </svg>
        </div>
        <p class="success-message">{{ t('register.emailSentSuccess') }}</p>
        <p>{{ t('login.noAccount') }}</p>
        <button @click="navigateToLogin" class="auth-btn">
          {{ t('login.signIn') }}
        </button>
      </div>

      <div v-else>
        <h1 class="auth-title">{{ t('common.error') }}</h1>
        <div class="error-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" fill="currentColor" viewBox="0 0 16 16">
            <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
            <path d="M7.002 11a1 1 0 1 1 2 0 1 1 0 0 1-2 0zM7.1 4.995a.905.905 0 1 1 1.8 0l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 4.995z"/>
          </svg>
        </div>
        <p class="error-message">{{ verificationError || t('validation.required') }}</p>
        <p>{{ additionalErrorInfo }}</p>
        
        <div v-if="showResendOption" class="resend-container">
          <p>{{ t('register.checkInbox') }}</p>
          <button 
            @click="resendVerificationEmail" 
            class="auth-btn"
            :disabled="resending"
          >
            {{ resending ? t('register.sending') : t('register.resendVerificationEmail') }}
          </button>
          <p v-if="resendSuccess" class="success-text">{{ t('register.emailSentSuccess') }}</p>
        </div>
        
        <div class="action-links">
          <router-link to="/login" class="auth-link">{{ t('login.signIn') }}</router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import '@/assets/pages/auth.css';
import { ref, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { auth } from '@/store/auth';
import { useLanguage } from '@/context/LanguageContext';

// Router and route
const router = useRouter();
const route = useRoute();

// Get language context
const language = useLanguage();
const t = (key: string) => language?.t?.(key) || key;

// Component state
const isVerifying = ref(true);
const isVerified = ref(false);
const verificationError = ref('');
const additionalErrorInfo = ref('');
const showResendOption = ref(false);
const resending = ref(false);
const resendSuccess = ref(false);

// Get token from URL
const token = route.query.token as string;

// Verify email on component mount
onMounted(async () => {
  console.log('VerifyEmail mounted, token present:', !!token);
  console.log('Current URL:', window.location.href);
  
  if (!token) {
    console.error('No token found in URL parameters!');
    isVerifying.value = false;
    verificationError.value = t('validation.required');
    additionalErrorInfo.value = t('register.verifyEmailNote');
    return;
  }

  try {
    console.log('Attempting to verify email with token:', token.substring(0, 10) + '...');
    const success = await auth.verifyEmail(token);
    console.log('Verification result:', success);
    isVerifying.value = false;
    
    if (success) {
      console.log('Email verification successful');
      isVerified.value = true;
    } else {
      console.error('Verification failed:', auth.state.error);
      verificationError.value = auth.state.error || t('common.error');
      // Check if user is logged in to show resend option
      showResendOption.value = !!auth.state.user && !auth.state.user.confirmed;
      
      // Additional debugging for error case
      console.log('User logged in:', !!auth.state.user);
      if (auth.state.user) {
        console.log('User confirmed status:', auth.state.user.confirmed);
      }
    }
  } catch (error: any) {
    console.error('Error in verification process:', error);
    console.error('Error details:', error.message || 'Unknown error');
    isVerifying.value = false;
    verificationError.value = t('common.error');
    additionalErrorInfo.value = t('register.verifyEmailNote');
    
    // Check if user is logged in to show resend option
    showResendOption.value = !!auth.state.user && !auth.state.user.confirmed;
  }
});

// Navigate to login page
function navigateToLogin() {
  router.push('/login');
}

// Resend verification email
async function resendVerificationEmail() {
  resending.value = true;
  resendSuccess.value = false;
  
  try {
    const success = await auth.resendVerificationEmail();
    if (success) {
      resendSuccess.value = true;
    } else {
      verificationError.value = auth.state.error || t('common.error');
    }
  } catch (error) {
    verificationError.value = t('common.error');
  } finally {
    resending.value = false;
  }
}
</script>

<style scoped>
@import '@/assets/pages/verify-email.css';
</style>