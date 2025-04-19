/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_OPENAI_API_KEY: string;
    // add other env vars here…
  }
  
  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
  