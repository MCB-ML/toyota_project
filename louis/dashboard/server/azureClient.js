import { AzureOpenAI } from 'openai'

export function getAzureConfig() {
  return {
    apiKey: process.env.AZURE_OPENAI_KEY,
    endpoint: process.env.AZURE_OPENAI_ENDPOINT,
    deployment: process.env.AZURE_OPENAI_DEPLOYMENT,
    apiVersion: process.env.AZURE_OPENAI_API_VERSION || '2025-04-01-preview',
  }
}

// Returns null if required env vars are missing — callers should surface
// a single consistent error message to the client in that case.
export function createAzureClient() {
  const { apiKey, endpoint, deployment, apiVersion } = getAzureConfig()
  if (!apiKey || !endpoint || !deployment) return null
  return new AzureOpenAI({ apiKey, endpoint, deployment, apiVersion })
}

export async function readJsonBody(req) {
  const chunks = []
  for await (const chunk of req) chunks.push(chunk)
  return JSON.parse(Buffer.concat(chunks).toString())
}
