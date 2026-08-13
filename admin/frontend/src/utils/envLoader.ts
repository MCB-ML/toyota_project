const env = import.meta.env.MODE as "development" | "production";

// Define the shape of our window object with __ENV__
declare global {
  interface Window {
    __ENV__: {
      VITE_AZURE_AD_TENANT_ID: string;
      VITE_AZURE_AD_CLIENT_ID: string;
      VITE_BASE_OS_API_URL?: string;
      VITE_TOKEN: string;
      VITE_TOKEN_EXPIRY_LIMIT?: string;
      VITE_INACTIVITY_TIMEOUT?: string;
      VITE_DEMO_MODE?: string;
      VITE_LOG_API_URL?: string;
      VITE_BASE_AI_AGENT_API_URL?: string;
    };
  }
}

const getEnv = (key: keyof Window["__ENV__"]) => {
  return window.__ENV__?.[key] || import.meta.env[key];
};

const development = {
  AZURE_AD_TENANT_ID: getEnv("VITE_AZURE_AD_TENANT_ID"),
  AZURE_AD_CLIENT_ID: getEnv("VITE_AZURE_AD_CLIENT_ID"),
  TOKEN_KEY: getEnv("VITE_TOKEN"),
  BASE_OS_API_URL: getEnv("VITE_BASE_OS_API_URL"),
  TOKEN_EXPIRY_LIMIT: Number(getEnv("VITE_TOKEN_EXPIRY_LIMIT")),
  INACTIVITY_TIMEOUT: Number(getEnv("VITE_INACTIVITY_TIMEOUT")),
  DEMO_MODE: getEnv("VITE_DEMO_MODE"),
  LOG_API_URL: getEnv("VITE_LOG_API_URL"),
  AI_AGENT_API_URL: getEnv("VITE_BASE_AI_AGENT_API_URL"),
};

const production = {
  AZURE_AD_TENANT_ID: getEnv("VITE_AZURE_AD_TENANT_ID"),
  AZURE_AD_CLIENT_ID: getEnv("VITE_AZURE_AD_CLIENT_ID"),
  TOKEN_KEY: getEnv("VITE_TOKEN"),
  BASE_OS_API_URL: getEnv("VITE_BASE_OS_API_URL"),
  TOKEN_EXPIRY_LIMIT: Number(getEnv("VITE_TOKEN_EXPIRY_LIMIT")),
  INACTIVITY_TIMEOUT: Number(getEnv("VITE_INACTIVITY_TIMEOUT")),
  DEMO_MODE: getEnv("VITE_DEMO_MODE"),
  LOG_API_URL: getEnv("VITE_LOG_API_URL"),
  AI_AGENT_API_URL: getEnv("VITE_BASE_AI_AGENT_API_URL"),
};

const config = {
  development,
  production,
};

export default config[env];
