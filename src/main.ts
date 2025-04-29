import { createApp } from "vue";
import App from "./App.vue";

// import your global styles:
import "./assets/base.css";
import "./assets/main.css";

import router from './router'
import { initializeRoles } from './db/roles'
import { initializeCategories } from './db/categories'

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
