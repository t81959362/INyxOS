declare module '*.svg' {
  const content: string;
  export default content;
}

declare const process: { env: { PUBLIC_URL: string } };

// Vite environment type augmentations
interface ImportMetaEnv {
  readonly BASE_URL: string;
  readonly VITE_HF_TOKEN: string;
  // add more env vars as needed
}
interface ImportMeta {
  readonly env: ImportMetaEnv;
}
