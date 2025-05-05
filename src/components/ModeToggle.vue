<!-- src/components/ModeToggle.vue -->
<template>
    <div class="mode-toggle">
      <div class="toggle-container" :class="{ 'file-active': modelValue }">
        <div class="toggle-option prompt-option" @click="$emit('update:modelValue', false)">
          <div class="icon">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18">
              <path fill="currentColor" d="M20,4H4A2,2 0 0,0 2,6V18A2,2 0 0,0 4,20H20A2,2 0 0,0 22,18V6A2,2 0 0,0 20,4M20,18H4V6H20V18M6,10H18V12H6V10M6,14H14V16H6V14Z" />
            </svg>
          </div>
          <span>Prompt</span>
        </div>
        <div class="toggle-option file-option" @click="$emit('update:modelValue', true)">
          <div class="icon">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18">
              <path fill="currentColor" d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
            </svg>
          </div>
          <span>File</span>
        </div>
        <div class="slider-handle"></div>
      </div>
    </div>
  </template>
  
  <script setup>
  import { defineProps, defineEmits } from 'vue';
  
  const props = defineProps({
    modelValue: {
      type: Boolean,
      default: false
    }
  });
  
  defineEmits(['update:modelValue']);
  </script>
  
  <style>
  @import '../assets/components/mode-toggle.css';
  </style>