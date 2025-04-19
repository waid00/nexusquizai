<template>
    <div class="chat-container">
      <div
        v-for="(msg, i) in messages"
        :key="i"
        :class="['message', msg.role]"
      >
        <strong>{{ msg.role }}:</strong> {{ msg.content }}
      </div>
      <form @submit.prevent="sendMessage" class="chat-form">
        <input
          v-model="userInput"
          placeholder="Type your message…"
          autocomplete="off"
        />
        <button type="submit">Send</button>
      </form>
    </div>
  </template>
  
  <script setup lang="ts">
  import { ref } from "vue";
  import type { ChatCompletionRequestMessage } from "@/api/openai";
  import { chat } from "@/api/openai";
  
  const userInput = ref("");
  const messages = ref<ChatCompletionRequestMessage[]>([]);
  
  async function sendMessage() {
    const text = userInput.value.trim();
    if (!text) return;
    messages.value.push({ role: "user", content: text });
    userInput.value = "";
  
    try {
      const reply = await chat(messages.value);
      messages.value.push({ role: "assistant", content: reply });
    } catch (e: any) {
      messages.value.push({ role: "assistant", content: `Error: ${e.message}` });
    }
  }
  </script>
  
  <style scoped>
  .chat-container {
    border: 1px solid #ccc;
    padding: 1rem;
    border-radius: 8px;
    max-height: 70vh;
    overflow-y: auto;
  }
  .message {
    margin-bottom: 0.5rem;
  }
  .message.user {
    text-align: right;
  }
  .chat-form {
    display: flex;
    gap: 0.5rem;
    margin-top: 1rem;
  }
  input {
    flex: 1;
    padding: 0.5rem;
  }
  button {
    padding: 0.5rem 1rem;
  }
  </style>
  