/// <reference types="vite/client" />

declare global {
  interface ImportMetaEnv {
    readonly VITE_OPENROUTER_API_KEY: string;
  }
  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
}
