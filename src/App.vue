<template>
  <div id="app">
    <header>
      <div class="header-left">
        <img src="@/assets/logo.png" alt="NexusQuiz AI" class="logo" />
        <h1>NexusQuiz AI</h1>
      </div>
      
      <nav>
        <router-link to="/">Home</router-link>
        <router-link to="/generate">Generate</router-link>
        <router-link v-if="auth.state.isAuthenticated" to="/my-quizzes">My Quizzes</router-link>
        <router-link v-if="isAdmin" to="/admin" class="admin-link">Admin</router-link>
      </nav>
      
      <div class="auth-controls">
        <template v-if="auth.state.isAuthenticated">
          <div class="user-menu" ref="userMenu">
            <button class="user-menu-btn" @click="toggleUserMenu">
              <span class="username">{{ auth.state.user?.username }}</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                <path d="M1.553 6.776a.5.5 0 0 1 .67-.223L8 9.44l5.776-2.888a.5.5 0 1 1 .448.894l-6 3a.5.5 0 0 1-.448 0l-6-3a.5.5 0 0 1-.223-.67z"/>
              </svg>
            </button>
            <div class="dropdown-menu" :class="{ 'show': showUserMenu }">
              <router-link to="/profile" class="dropdown-item">Profile</router-link>
              <div class="dropdown-divider"></div>
              <button @click="logout" class="dropdown-item logout-btn">Logout</button>
            </div>
          </div>
        </template>
        <template v-else>
          <router-link to="/login" class="auth-btn login-btn">Login</router-link>
          <router-link to="/register" class="auth-btn register-btn">Register</router-link>
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

const router = useRouter()
const showUserMenu = ref(false)
const userMenu = ref<HTMLElement | null>(null)
const userRole = ref<string | null>(null)

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
#app {
  max-width: 960px;
  margin: 0 auto;
}

header {
  display: flex;
  align-items: center; /* Vertically center all direct children */
  justify-content: flex-start; /* Align items to the start, let margin handle spacing */
  padding: 0 2rem;
  background: var(--panel-bg);
  backdrop-filter: blur(10px);
  box-shadow: 0 2px 4px rgba(0,0,0,0.5);
  border-radius: 0 0 12px 12px;
  height: 70px; /* Maintain fixed height */
}

.header-left {
  display: flex;
  align-items: center; /* Vertically center logo and title */
  gap: 1rem;
  margin-right: 2rem; /* Add some space after the logo/title */
}

header .logo {
  width: 42px;
  height: 42px;
  margin-right: 1rem;
  transition: transform 0.3s ease;
}

.header-left:hover .logo {
  transform: rotate(10deg) scale(1.1);
}

header h1 {
  font-size: 1.25rem;
  color: var(--text-main);
  font-weight: 700;
  letter-spacing: 0.5px;
}

header nav {
  display: flex;
  align-items: center; /* Vertically center nav links */
  gap: 1.5rem;
  margin-left: auto; /* Push nav away from left, towards center/right */
}

header nav a {
  position: relative;
  color: var(--text-main);
  text-decoration: none;
  transition: color var(--transition-duration) var(--transition-timing);
  font-weight: 500;
  display: inline-flex; /* Helps with vertical alignment */
  align-items: center;
}

header nav a.router-link-active,
header nav a:hover {
  color: var(--accent);
}

/* Admin link styling */
header nav a.admin-link {
  color: #ff9500;
}

header nav a.admin-link:hover,
header nav a.admin-link.router-link-active {
  color: #ffb347;
}

header nav a.admin-link::after {
  background: #ff9500;
}

/* sliding underline */
header nav a::after {
  content: "";
  position: absolute;
  bottom: -4px;
  left: 0;
  width: 0;
  height: 2px;
  background: var(--accent);
  transition: width var(--transition-duration) var(--transition-timing);
}

header nav a.router-link-active::after,
header nav a:hover::after {
  width: 100%;
}

/* Auth controls */
.auth-controls {
  display: flex;
  align-items: center; /* Vertically center buttons */
  gap: 0.8rem;
  margin-left: 2rem; /* Add space between nav and auth controls */
}

.auth-btn {
  padding: 8px 20px;
  border-radius: 6px;
  font-size: 0.9rem;
  font-weight: 500;
  text-decoration: none;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 38px; /* Consistent height */
  white-space: nowrap; /* Prevent button text wrapping */
}

.login-btn {
  background: transparent;
  border: 1px solid var(--accent);
  color: var(--accent);
}

.login-btn:hover {
  background: rgba(61, 220, 132, 0.1);
}

.register-btn {
  background: var(--accent);
  color: #121212;
  border: 1px solid var(--accent);
}

.register-btn:hover {
  opacity: 0.9;
}

/* User menu dropdown */
.user-menu {
  position: relative;
  display: flex;
  align-items: center;
}

.user-menu-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: transparent;
  border: 1px solid var(--input-border);
  color: var(--text-main);
  padding: 0 1rem;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
  height: 38px; /* Match auth-btn height */
  white-space: nowrap; /* Prevent button text wrapping */
}

.username {
  font-weight: 500;
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dropdown-menu {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  min-width: 180px;
  background: var(--panel-bg);
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  overflow: hidden;
  visibility: hidden;
  opacity: 0;
  transform: translateY(-10px);
  transition: all 0.3s ease;
  z-index: 1000; /* Increased z-index */
}

.dropdown-menu.show {
  visibility: visible;
  opacity: 1;
  transform: translateY(0);
}

.dropdown-item {
  display: block;
  padding: 0.75rem 1rem;
  color: var(--text-main);
  text-decoration: none;
  transition: all 0.2s ease;
  text-align: left;
  width: 100%;
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 0.9rem;
}

.dropdown-item:hover {
  background: rgba(255, 255, 255, 0.05);
  color: var(--accent);
}

.dropdown-divider {
  height: 1px;
  background: var(--input-border);
  margin: 0.25rem 0;
}

.admin-item {
  color: #ff9500;
}

.admin-item:hover {
  background: rgba(255, 149, 0, 0.1);
  color: #ffb347;
}

.logout-btn {
  color: rgb(255, 89, 89);
}

.logout-btn:hover {
  background: rgba(255, 89, 89, 0.1);
  color: rgb(255, 89, 89);
}

/* Responsive adjustments */
@media (max-width: 768px) {
  header {
    flex-wrap: wrap;
    padding: 1rem;
  }
  
  header nav {
    order: 3;
    width: 100%;
    margin-top: 1rem;
    justify-content: center;
  }
  
  .auth-controls {
    flex-shrink: 0;
  }
}

@media (max-width: 480px) {
  header h1 {
    font-size: 1rem;
  }
  
  header .logo {
    width: 32px;
    height: 32px;
    margin-right: 0.5rem;
  }
  
  .auth-btn {
    padding: 0.4rem 0.8rem;
    font-size: 0.8rem;
  }
  
  .username {
    max-width: 80px;
  }
}
</style>