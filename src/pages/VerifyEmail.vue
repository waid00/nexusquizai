<template>
  <div class="verify-email-page">
    <div class="auth-container">
      <div v-if="isVerifying">
        <h1 class="auth-title">Verifying Email</h1>
        <p class="auth-subtitle">Please wait while we verify your email address...</p>
        <div class="loading-indicator">
          <div class="spinner"></div>
        </div>
      </div>

      <div v-else-if="isVerified">
        <h1 class="auth-title">Email Verified!</h1>
        <div class="success-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" fill="currentColor" viewBox="0 0 16 16">
            <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zm-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z"/>
          </svg>
        </div>
        <p class="success-message">Your email has been successfully verified.</p>
        <p>You can now log in to your account.</p>
        <button @click="navigateToLogin" class="auth-btn">
          Go to Login
        </button>
      </div>

      <div v-else>
        <h1 class="auth-title">Verification Failed</h1>
        <div class="error-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" fill="currentColor" viewBox="0 0 16 16">
            <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
            <path d="M7.002 11a1 1 0 1 1 2 0 1 1 0 0 1-2 0zM7.1 4.995a.905.905 0 1 1 1.8 0l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 4.995z"/>
          </svg>
        </div>
        <p class="error-message">{{ verificationError || 'We could not verify your email address.' }}</p>
        <p>{{ additionalErrorInfo }}</p>
        
        <div v-if="showResendOption" class="resend-container">
          <p>Would you like us to send a new verification email?</p>
          <button 
            @click="resendVerificationEmail" 
            class="auth-btn"
            :disabled="resending"
          >
            {{ resending ? 'Sending...' : 'Resend Verification Email' }}
          </button>
          <p v-if="resendSuccess" class="success-text">Verification email sent successfully!</p>
        </div>
        
        <div class="action-links">
          <router-link to="/login" class="auth-link">Back to Login</router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import '@/assets/auth.css';
import { ref, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { auth } from '@/store/auth';

// Router and route
const router = useRouter();
const route = useRoute();

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
  if (!token) {
    isVerifying.value = false;
    verificationError.value = 'Missing verification token';
    additionalErrorInfo.value = 'The verification link is invalid or has expired.';
    return;
  }

  try {
    const success = await auth.verifyEmail(token);
    isVerifying.value = false;
    
    if (success) {
      isVerified.value = true;
    } else {
      verificationError.value = auth.state.error || 'Verification failed';
      // Check if user is logged in to show resend option
      showResendOption.value = !!auth.state.user && !auth.state.user.confirmed;
    }
  } catch (error) {
    isVerifying.value = false;
    verificationError.value = 'Failed to verify email';
    additionalErrorInfo.value = 'Please try again or contact support if the problem persists.';
    
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
      verificationError.value = auth.state.error || 'Failed to resend verification email';
    }
  } catch (error) {
    verificationError.value = 'An error occurred when trying to resend the email';
  } finally {
    resending.value = false;
  }
}
</script>

<style scoped>
.verify-email-page {
  padding: 2rem 1rem;
}

.loading-indicator {
  display: flex;
  justify-content: center;
  margin: 2rem 0;
}

.spinner {
  width: 48px;
  height: 48px;
  border: 5px solid rgba(79, 70, 229, 0.3);
  border-radius: 50%;
  border-top-color: var(--accent);
  animation: spin 1s ease-in-out infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.success-icon,
.error-icon {
  display: flex;
  justify-content: center;
  margin: 2rem 0;
}

.success-icon {
  color: var(--success);
}

.error-icon {
  color: var(--error);
}

.success-message {
  color: var(--success);
  font-weight: 500;
  text-align: center;
}

.error-message {
  color: var(--error);
  font-weight: 500;
  text-align: center;
}

.action-links {
  margin-top: 2rem;
  text-align: center;
}

.resend-container {
  margin-top: 2rem;
  text-align: center;
}

.success-text {
  color: var(--success);
  margin-top: 1rem;
  font-size: 0.9rem;
}
</style>