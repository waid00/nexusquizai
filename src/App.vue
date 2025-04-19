<template>
  <div id="app">
    <img src="@/assets/logo.svg" alt="Logo" class="logo" />
    <h1>My Vue + OpenAI Chat</h1>
    <Chat />
  </div>
</template>

<script setup lang="ts">
import Chat from "@/components/Chat.vue";
</script>

<style>
#app {
  max-width: 600px;
  margin: 2rem auto;
  text-align: center;
  font-family: Arial, sans-serif;
}
.logo {
  width: 100px;
  margin-bottom: 1rem;
}
</style>
