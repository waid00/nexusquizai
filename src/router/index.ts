import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { auth } from '@/store/auth'

// Import your pages (filenames must match!)
import Home from '@/pages/Home.vue'
import Generate from '@/pages/generate.vue'
import Login from '@/pages/Login.vue'
import Register from '@/pages/Register.vue'
import ForgotPassword from '@/pages/ForgotPassword.vue'
import MyQuizzes from '@/pages/MyQuizzes.vue'
import Profile from '@/pages/Profile.vue'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/generate',
    name: 'Generate',
    component: Generate
  },
  {
    path: '/my-quizzes',
    name: 'MyQuizzes',
    component: MyQuizzes,
    meta: { requiresAuth: true }
  },
  {
    path: '/profile',
    name: 'Profile',
    component: Profile,
    meta: { requiresAuth: true }
  },
  {
    path: '/quiz/:id',
    name: 'TakeQuiz',
    component: () => import('@/pages/TakeQuiz.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/quiz/:id/details',
    name: 'QuizDetails',
    component: () => import('@/pages/QuizDetails.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/attempt/:id',
    name: 'AttemptDetails',
    component: () => import('@/pages/AttemptDetails.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/login',
    name: 'Login',
    component: Login,
    meta: { guestOnly: true }
  },
  {
    path: '/register',
    name: 'Register',
    component: Register,
    meta: { guestOnly: true }
  },
  {
    path: '/forgot-password',
    name: 'ForgotPassword',
    component: ForgotPassword,
    meta: { guestOnly: true }
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

// Navigation guard
router.beforeEach((to, from, next) => {
  // Check for protected routes
  if (to.matched.some(record => record.meta.requiresAuth)) {
    if (!auth.state.isAuthenticated) {
      // Redirect to login page if not authenticated
      next({ name: 'Login', query: { redirect: to.fullPath } })
    } else {
      next()
    }
  } 
  // Check for guest-only routes (login, register, etc.)
  else if (to.matched.some(record => record.meta.guestOnly)) {
    if (auth.state.isAuthenticated) {
      // Redirect to home if already authenticated
      next({ name: 'Home' })
    } else {
      next()
    }
  } else {
    next()
  }
})

export default router
