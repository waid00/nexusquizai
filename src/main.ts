import { createApp } from "vue";
import App from "./App.vue";

// Import global styles first
import "./assets/globals/base.css";
import "./assets/globals/main.css";

// Import component styles
import "./assets/components/modals.css";
import "./assets/components/mode-toggle.css";
import "./assets/components/quiz-cards.css";

// Import page-specific styles
import "./assets/pages/auth.css";
import "./assets/pages/generate.css";
import "./assets/pages/home.css";
import "./assets/pages/my-quizzes.css";
import "./assets/pages/take-quiz.css";

import router from './router'
import { initializeRoles } from './db/roles'
import { initializeCategories } from './db/categories'

// Add this near the top of the file, after imports
console.log('ENV check:', {
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL ? 'defined' : 'undefined',
  supabaseKey: import.meta.env.VITE_SUPABASE_KEY ? 'defined' : 'undefined'
});

// Initialize database tables before mounting the app
Promise.all([
  initializeRoles().catch(error => {
    console.error('Error initializing roles:', error);
  }),
  initializeCategories().catch(error => {
    console.error('Error initializing categories:', error);
  })
])
.then(() => {
  console.log('Database initialization complete');
})
.catch(error => {
  console.error('Error during database initialization:', error);
})
.finally(() => {
  // Mount the app regardless of initialization success
  createApp(App).use(router).mount('#app');
});
