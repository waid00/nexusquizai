<template>
  <div id="app">
    <header>
      <img src="@/assets/logo.svg" alt="NexusQuiz AI" class="logo" />
      <h1>NexusQuiz AI</h1>
      <nav>
        <router-link to="/">Home</router-link>
        <router-link to="/generate">Generate</router-link>
      </nav>
    </header>

    <main>
      <transition name="fade" mode="out-in">
        <router-view/>
      </transition>
    </main>

    <footer>
      © 2025 David Wais - VŠE Praha, FIS | Powered by Vue.js & OpenAI API
    </footer>
  </div>
</template>

<script setup lang="ts" />

<style scoped>
#app {
  /* constrain the whole app to a comfortable width */
  max-width: 960px;
  margin: 0 auto;
}
</style>