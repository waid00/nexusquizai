import { createApp } from "vue";
import App from "./App.vue";

// import your global styles:
import "./assets/base.css";
import "./assets/main.css";

import router from './router'
createApp(App).use(router).mount('#app')
