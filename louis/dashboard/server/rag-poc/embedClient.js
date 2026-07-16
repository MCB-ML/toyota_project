import { AzureOpenAI } from 'openai'

// Separate client from azureClient.js's createAzureClient(): that one bakes the
// *chat* deployment into the base URL (see openai/azure.js — constructor `deployment`
// fixes `/deployments/{deployment}` for every request on that client instance), so
// embeddings need their own client pointed at AZURE_OPENAI_EMBEDDING_DEPLOYMENT.
export function createEmbeddingClient() {
  const apiKey = process.env.AZURE_OPENAI_KEY
  const endpoint = process.env.AZURE_OPENAI_ENDPOINT
  const deployment = process.env.AZURE_OPENAI_EMBEDDING_DEPLOYMENT
  const apiVersion = process.env.AZURE_OPENAI_API_VERSION || '2025-04-01-preview'
  if (!apiKey || !endpoint || !deployment) return null
  return { client: new AzureOpenAI({ apiKey, endpoint, deployment, apiVersion }), deployment }
}

// Batches to stay well under Azure's per-request input-array limits.
export async function embedTexts(texts, batchSize = 50) {
  const { client, deployment } = createEmbeddingClient() || {}
  if (!client) throw new Error('AZURE_OPENAI_EMBEDDING_DEPLOYMENT (or key/endpoint) not set in .env')

  const vectors = []
  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize)
    const res = await client.embeddings.create({ model: deployment, input: batch })
    vectors.push(...res.data.map(d => d.embedding))
  }
  return vectors
}
