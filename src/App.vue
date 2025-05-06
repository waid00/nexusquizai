<template>
  <div id="app">
    <header>
      <div class="header-left">
        <img src="@/assets/logo.png" alt="NexusQuiz AI" class="logo" />
        <h1>NexusQuiz AI</h1>
      </div>
      
      <nav>
        <router-link to="/">{{ t('header.home') }}</router-link>
        <router-link to="/generate">{{ t('header.generate') }}</router-link>
        <router-link v-if="auth.state.isAuthenticated" to="/my-quizzes">{{ t('header.myQuizzes') }}</router-link>
        <router-link v-if="isAdmin" to="/admin" class="admin-link">{{ t('header.admin') }}</router-link>
      </nav>
      
      <div class="auth-controls">
        <LanguageSelector />
        <template v-if="auth.state.isAuthenticated">
          <div class="user-menu" ref="userMenu">
            <button class="user-menu-btn" @click="toggleUserMenu">
              <span class="username">{{ auth.state.user?.username }}</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                <path d="M1.553 6.776a.5.5 0 0 1 .67-.223L8 9.44l5.776-2.888a.5.5 0 1 1 .448.894l-6 3a.5.5 0 0 1-.448 0l-6-3a.5.5 0 0 1-.223-.67z"/>
              </svg>
            </button>
            <div class="dropdown-menu" :class="{ 'show': showUserMenu }">
              <router-link to="/profile" class="dropdown-item">{{ t('header.profile') }}</router-link>
              <div class="dropdown-divider"></div>
              <button @click="logout" class="dropdown-item logout-btn">{{ t('header.logout') }}</button>
            </div>
          </div>
        </template>
        <template v-else>
          <router-link to="/login" class="auth-btn login-btn">{{ t('header.login') }}</router-link>
          <router-link to="/register" class="auth-btn register-btn">{{ t('header.register') }}</router-link>
        </template>
      </div>
    </header>

    <main>
      <transition name="fade" mode="out-in">
        <router-view v-slot="{ Component }">
          <component :is="Component" />
        </router-view>
      </transition>
    </main>

    <footer>
      © 2025 David Wais - VŠE Praha, FIS | Powered by Vue.js & OpenAI API
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { auth } from '@/store/auth'
import { supabase } from '@/api/supabase'
import { useProvideLanguage } from '@/context/LanguageContext'
import LanguageSelector from '@/components/LanguageSelector.vue'

const router = useRouter()
const showUserMenu = ref(false)
const userMenu = ref<HTMLElement | null>(null)
const userRole = ref<string | null>(null)

// Set up language provider and get translation function
const languageState = useProvideLanguage();
const t = (key: string): string => {
  if (!languageState) return key;
  return languageState.t(key);
};

// Check if user is admin
const isAdmin = computed(() => {
  return userRole.value === 'admin'
})

// Toggle user dropdown menu
function toggleUserMenu() {
  showUserMenu.value = !showUserMenu.value
}

// Close dropdown when clicking outside
function handleClickOutside(e: MouseEvent) {
  if (userMenu.value && !userMenu.value.contains(e.target as Node)) {
    showUserMenu.value = false
  }
}

// Logout handler
function logout() {
  auth.logout()
  showUserMenu.value = false
  userRole.value = null
  router.push('/')
}

// Check user role
async function checkUserRole() {
  if (auth.state.isAuthenticated && auth.state.user) {
    try {
      const { data, error } = await supabase
        .from('Roles')
        .select('role_name')
        .eq('id', auth.state.user.roleId)
        .single()
      
      if (!error && data) {
        userRole.value = data.role_name
      }
    } catch (err) {
      console.error('Error fetching user role:', err)
    }
  }
}

// Watch for authentication state changes
watch(() => auth.state.isAuthenticated, (isAuthenticated) => {
  if (isAuthenticated) {
    // If user logged in, check their role
    checkUserRole()
  } else {
    // If user logged out, reset role
    userRole.value = null
  }
}, { immediate: true })

// Add/remove click listener for dropdown
onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  checkUserRole()
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
@import '@/assets/globals/app.css';
</style>