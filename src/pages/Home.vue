<template>
    <section class="home">
      <h2>Abstract</h2>
      <p>
        Hlavním cílem této bakalářské práce je vytvoření kompletní aplikace, která
        s využitím umělé inteligence vygeneruje kvízové otázky na základě zadaného
        textu či vloženého souboru a následného hodnocení z hlediska kvality a relevance.
      </p>
      <h2>Úvod</h2>
      <p>
        Automatizovaná tvorba kvízových otázek je v současnosti velmi aktuální téma
        díky rostoucí potřebě efektivních vzdělávacích nástrojů. S rozšiřujícím se
        využitím online vzdělávacích platforem narůstá poptávka po způsobech, jak
        rychle a spolehlivě ověřovat porozumění studentů danému učivu.
      </p>
      
      <!-- Database tables section -->
      <h2>Database Tables</h2>
      <p>The app uses the following database tables:</p>
      <ul>
        <li v-for="table in tables" :key="table">{{ table }}</li>
      </ul>
    </section>
  </template>
  
  <script setup lang="ts">
  import { ref, onMounted } from 'vue'
  import { getDB } from '@/db/index.ts'
  
  // Content adapted from your thesis :contentReference[oaicite:0]{index=0}&#8203;:contentReference[oaicite:1]{index=1}
  const tables = ref<string[]>([])
  onMounted(async () => {
    const db = await getDB()
    const res = db.exec("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';")
    if (res.length) {
      tables.value = res[0].values.map(v => v[0] as string)
    }
  })
  </script>
  
  <style scoped>
  .home {
    padding: 1rem;
    line-height: 1.6;
    color: var(--text-main);
  }
  .home h2 {
    margin-top: 1.5rem;
    color: var(--accent);
  }
  </style>
