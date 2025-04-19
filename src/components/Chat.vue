<template>
    <div class="chat-container">
      <div
        v-for="(msg, i) in messages"
        :key="i"
        :class="['message', msg.role]"
      >
        <span class="role">{{ msg.role }}:</span>
        <span class="content">{{ msg.content }}</span>
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
    background: var(--panel-bg);
    backdrop-filter: blur(10px);
    border-radius: 16px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6);
    overflow: hidden;
    display: flex;
    flex-direction: column;
    height: 600px;
  }
  
  /* Messages scroll area */
  .chat-container > .message {
    opacity: 0;
    animation: fadeIn 0.4s forwards;
    margin: 0.5rem 1rem;
    padding: 0.75rem;
    border-radius: 12px;
    max-width: 80%;
    word-wrap: break-word;
  }
  
  /* Role‐based coloring */
  .message.user {
    margin-left: auto;
    background: rgba(60, 60, 60, 0.4);
  }
  .message.assistant {
    margin-right: auto;
    background: rgba(40, 40, 50, 0.4);
  }
  
  .role {
    font-size: 0.75rem;
    text-transform: uppercase;
    color: var(--text-alt);
    display: block;
    margin-bottom: 0.25rem;
  }
  
  .content {
    font-size: 0.9rem;
    line-height: 1.4;
  }
  
  /* Input and button */
  .chat-form {
    display: flex;
    gap: 0.5rem;
    padding: 1rem;
    background: rgba(0, 0, 0, 0.2);
  }
  .chat-form input {
    flex: 1;
    padding: 0.6rem;
    border: 1px solid var(--input-border);
    border-radius: 8px;
    background: var(--input-bg);
    color: var(--text-main);
    transition: border var(--transition);
  }
  .chat-form input:focus {
    outline: none;
    border-color: var(--accent);
  }
  .chat-form button {
    padding: 0 1rem;
    border: none;
    border-radius: 8px;
    background: var(--accent);
    color: white;
    cursor: pointer;
    transition: background var(--transition);
  }
  .chat-form button:hover {
    background: rgba(61, 220, 132, 0.8);
  }
  
  /* Fade‐in animation */
  @keyframes fadeIn {
    to {
      opacity: 1;
      transform: translateY(0);
    }
    from {
      opacity: 0;
      transform: translateY(10px);
    }
  }
  </style>
  