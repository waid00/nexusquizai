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
  
  <style scoped>
  .mode-toggle {
    display: flex;
    justify-content: center;
    width: 100%;
  }
  
  .toggle-container {
    position: relative;
    display: flex;
    width: 240px;
    height: 52px;
    background: var(--input-bg);
    border-radius: 26px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
    overflow: hidden;
    padding: 4px;
    cursor: pointer;
    transition: all 0.3s ease;
  }
  
  .toggle-option {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    z-index: 2;
    transition: color 0.3s ease;
    user-select: none;
  }
  
  .icon {
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .slider-handle {
    position: absolute;
    top: 4px;
    left: 4px;
    width: calc(50% - 4px);
    height: calc(100% - 8px);
    background: var(--accent-dark);
    border-radius: 22px;
    transition: transform 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    z-index: 1;
  }
  
  .toggle-container.file-active .slider-handle {
    transform: translateX(calc(100% + 4px));
  }
  
  /* Text color transitions */
  .toggle-container:not(.file-active) .prompt-option {
    color: #fff;
    font-weight: 500;
  }
  
  .toggle-container:not(.file-active) .file-option {
    color: var(--text-alt);
  }
  
  .toggle-container.file-active .prompt-option {
    color: var(--text-alt);
  }
  
  .toggle-container.file-active .file-option {
    color: #fff;
    font-weight: 500;
  }
  
  /* Hover effect */
  .toggle-container:hover {
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.15);
    transform: translateY(-2px);
  }
  
  /* Active click effect */
  .toggle-option:active {
    transform: scale(0.95);
  }
  
  @media (max-width: 480px) {
    .toggle-container {
      width: 200px;
      height: 46px;
    }
  }
  </style>