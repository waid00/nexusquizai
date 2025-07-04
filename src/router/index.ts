import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { auth } from '@/store/auth'
import { supabase } from '@/api/supabase'

// Import your pages (filenames must match!)
import Home from '@/pages/Home.vue'
import Generate from '@/pages/generate.vue'
import Login from '@/pages/Login.vue'
import Register from '@/pages/Register.vue'
import ForgotPassword from '@/pages/ForgotPassword.vue'
import MyQuizzes from '@/pages/MyQuizzes.vue'
import Profile from '@/pages/Profile.vue'
import VerifyEmail from '@/pages/VerifyEmail.vue'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/generate',
    name: 'Generate',
    component: Generate,
    meta: { requiresAuth: true }
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
    component: () => import('@/pages/TakeQuiz.vue')
  },
  {
    path: '/quiz/:id/details',
    name: 'QuizDetails',
    component: () => import('@/pages/QuizDetails.vue')
  },
  {
    path: '/quiz/:id/edit',
    name: 'EditQuizDetail',
    component: () => import('@/pages/EditQuiz.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/edit-quiz/:id',
    name: 'EditQuiz',
    component: () => import('@/pages/EditQuiz.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/attempt/:id',
    name: 'AttemptDetails',
    component: () => import('@/pages/AttemptDetails.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/admin',
    name: 'Admin',
    component: () => import('@/pages/Admin.vue'),
    meta: { requiresAuth: true, requiresAdmin: true }
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
  },  {
    path: '/verify-email',
    name: 'VerifyEmail',
    component: VerifyEmail
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: Home,
    beforeEnter: (to, from, next) => {
      console.warn(`Route not found: ${to.fullPath}, redirecting to Home`);
      next({ name: 'Home' });
    }
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

// Navigation guard
router.beforeEach(async (to, from, next) => {
  // Check for protected routes
  if (to.matched.some(record => record.meta.requiresAuth)) {
    if (!auth.state.isAuthenticated) {
      // Redirect to login page if not authenticated
      next({ name: 'Login', query: { redirect: to.fullPath } })
    }
    // Check for admin-only routes
    else if (to.matched.some(record => record.meta.requiresAdmin)) {
      // Get user role if already authenticated
      try {
        // If roleId is undefined, we can assume they're not an admin
        if (!auth.state.user?.roleId) {
          next({ name: 'Home' });
          return;
        }
        
        const { data: roleData, error: roleError } = await supabase
          .from('Roles')
          .select('role_name')
          .eq('id', auth.state.user.roleId)
          .single();
        
        if (roleError || !roleData || roleData.role_name !== 'admin') {
          // Redirect non-admin users to home
          next({ name: 'Home' })
        } else {
          next()
        }
      } catch (error) {
        console.error('Error checking admin role:', error)
        next({ name: 'Home' })
      }
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
