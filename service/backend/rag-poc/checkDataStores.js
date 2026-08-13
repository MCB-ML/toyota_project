import 'dotenv/config'
import { getPool } from '../db.js'
import { COLLECTIONS, getClient } from './chromaClient.js'

const REQUIRED_POSTGRES_TABLES = [
  'dashboard_scopes',
  'sql_sources',
  'business_rules',
  'sql_fragments',
  'query_patterns',
]

const OPTIONAL_POSTGRES_TABLES = [
  'dashboard_saved_pages',
]

async function postgresTableCount(pool, tableName) {
  const exists = await pool.query('SELECT to_regclass($1) AS table_name', [`public.${tableName}`])
  if (!exists.rows[0]?.table_name) return { status: 'missing', count: null }

  const result = await pool.query(`SELECT count(*)::int AS count FROM ${tableName}`)
  return { status: 'ok', count: result.rows[0].count }
}

async function chromaCollectionCount(client, collectionName) {
  try {
    const collection = await client.getCollection({ name: collectionName })
    return { status: 'ok', count: await collection.count() }
  } catch {
    return { status: 'missing', count: null }
  }
}

async function main() {
  const pool = getPool()
  const postgres = {}

  try {
    for (const tableName of [...REQUIRED_POSTGRES_TABLES, ...OPTIONAL_POSTGRES_TABLES]) {
      postgres[tableName] = await postgresTableCount(pool, tableName)
    }
  } finally {
    await pool.end()
  }

  const chromaClient = getClient()
  const chroma = {}
  for (const collectionName of Object.values(COLLECTIONS)) {
    chroma[collectionName] = await chromaCollectionCount(chromaClient, collectionName)
  }

  const postgresReady = REQUIRED_POSTGRES_TABLES.every((tableName) => {
    const entry = postgres[tableName]
    return entry?.status === 'ok' && entry.count > 0
  })
  const chromaReady = Object.values(chroma).every((entry) => entry.status === 'ok' && entry.count > 0)
  const ready = postgresReady && chromaReady

  console.log(JSON.stringify({ ready, postgresReady, chromaReady, postgres, chroma }, null, 2))
  process.exitCode = ready ? 0 : 1
}

main().catch((err) => {
  console.error(err)
  process.exitCode = 1
})
