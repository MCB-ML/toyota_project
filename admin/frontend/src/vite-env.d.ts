/// <reference types="vite/client" />

// add other env variables here
interface ImportMetaEnv {
  readonly VITE_AZURE_AD_TENANT_ID: string;
  readonly VITE_AZURE_AD_CLIENT_ID: string;
  readonly VITE_TOKEN: string;
  readonly VITE_BASE_OS_API_URL: string;
  readonly VITE_TOKEN_EXPIRY_LIMIT: string;
  readonly VITE_INACTIVITY_TIMEOUT: string;
  readonly VITE_DEMO_MODE: string;
  readonly VITE_LOG_API_URL: string;
  readonly VITE_BASE_AI_AGENT_API_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
