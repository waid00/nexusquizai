<template>
  <div class="language-selector">
    <button 
      class="lang-btn" 
      :class="{ 'active': languageState?.language?.value === 'en' }"
      @click="languageState?.changeLanguage('en')"
    >
      EN
    </button>
    <button 
      class="lang-btn" 
      :class="{ 'active': languageState?.language?.value === 'cs' }"
      @click="languageState?.changeLanguage('cs')"
    >
      CZ
    </button>
  </div>
</template>

<script setup lang="ts">
import { useLanguage } from '../context/LanguageContext';

const languageState = useLanguage();
</script>

<style>
.language-selector {
  display: flex;
  gap: 0.25rem;
  margin-right: 1rem;
}

.lang-btn {
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  background: transparent;
  border: 1px solid var(--input-border);
  cursor: pointer;
  font-size: 0.8rem;
  color: var(--text-alt);
  transition: all 0.2s ease;
}

.lang-btn.active {
  background: var(--accent);
  color: white;
  border-color: var(--accent);
}

.lang-btn:hover:not(.active) {
  border-color: var(--accent);
  color: var(--text-main);
}

@media (max-width: 768px) {
  .language-selector {
    margin-right: 0.5rem;
  }
  
  .lang-btn {
    padding: 0.2rem 0.4rem;
    font-size: 0.75rem;
  }
}
</style>