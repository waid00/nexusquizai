import { ref, reactive, computed, watch } from 'vue';
import { createInjectionState } from '@vueuse/core';

// Language translations
import enTranslations from '../locales/en';
import csTranslations from '../locales/cs';

type TranslationObject = typeof enTranslations | typeof csTranslations;
type TranslationMap = {
  [key: string]: TranslationObject;
};

const translations: TranslationMap = {
  en: enTranslations,
  cs: csTranslations
};

// Create injection state
const [useProvideLanguage, useLanguage] = createInjectionState(() => {
  const language = ref(localStorage.getItem('language') || 'en');
  
  // Watch for language changes and store in localStorage
  watch(language, (newLang) => {
    localStorage.setItem('language', newLang);
    document.documentElement.lang = newLang;
  });
  
  // Function to change language
  function changeLanguage(lang: string) {
    if (translations[lang]) {
      language.value = lang;
    }
  }
  
  // Function to translate a key
  function t(key: string): string {
    const keys = key.split('.');
    let result: any = translations[language.value];
    
    // Walk through the nested keys
    for (const k of keys) {
      if (result && result[k]) {
        result = result[k];
      } else {
        return key; // Fallback to key if translation not found
      }
    }
    
    return result as string;
  }
  
  return {
    language,
    changeLanguage,
    t
  };
});

export { useProvideLanguage, useLanguage };