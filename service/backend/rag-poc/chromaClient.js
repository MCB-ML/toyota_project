import { ChromaClient } from 'chromadb'

// Single shared Chroma connection + collection helpers for the RAG POC. We always supply our
// own Azure OpenAI embeddings (embedClient.js) rather than letting Chroma embed text itself —
// embeddingFunction: null skips chromadb's default embedding function entirely (which would
// otherwise try to load the separate @chroma-core/default-embed package we don't install).
const CHROMA_URL = process.env.CHROMA_URL || 'http://localhost:8000'

function buildClient() {
  const url = new URL(CHROMA_URL)
  const isHttps = url.protocol === 'https:'
  // 포트가 URL에 명시 안 됐으면 프로토콜 기본 포트를 써야 한다 — 로컬 docker-compose는
  // http+8000이라 8000이 기본이었지만, https(예: Azure Web App 컨테이너, 443 뒤에서
  // 8000으로 프록시)에서 그대로 8000을 쓰면 엉뚱한 포트로 붙어 연결이 실패한다.
  const port = url.port ? Number(url.port) : (isHttps ? 443 : 8000)
  return new ChromaClient({
    host: url.hostname,
    port,
    ssl: isHttps,
  })
}

let _client = null
export function getClient() {
  if (!_client) _client = buildClient()
  return _client
}

export const COLLECTIONS = {
  TABLES: 'ktws_tables',
  PATTERNS: 'ktws_patterns',
  FRAGMENTS: 'ktws_fragments',
  RULES: 'ktws_rules',
  GLOSSARY: 'ktws_glossary',
}

// hnsw.space: 'cosine' so query() distances are cosine distances (0=identical) —
// toScore() below converts that to the same "higher is better, ~0-1" similarity
// semantics the old cosine.js-based code used.
export async function getOrCreateCollection(name) {
  const client = getClient()
  return client.getOrCreateCollection({
    name,
    embeddingFunction: null,
    configuration: { hnsw: { space: 'cosine' } },
  })
}

export async function recreateCollection(name) {
  const client = getClient()
  try {
    await client.deleteCollection({ name })
  } catch {
    // didn't exist yet — fine
  }
  return getOrCreateCollection(name)
}

export function toScore(distance) {
  return distance == null ? 0 : 1 - distance
}
