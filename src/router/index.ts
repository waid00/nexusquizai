import { createRouter, createWebHistory } from 'vue-router'
import Home     from '@/pages/Home.vue'
import Generate from '@/pages/Generate.vue'

const routes = [
  { path: '/',         component: Home    },
  { path: '/generate', component: Generate },
]

export default createRouter({
  history: createWebHistory(),
  routes,
})
