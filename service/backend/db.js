import pg from 'pg'

let _pool = null

function normalizeSearchPath(value) {
  const raw = String(value || 'public').trim()
  const parts = raw.split(',').map((part) => part.trim()).filter(Boolean)
  const validated = parts.length ? parts : ['public']
  for (const part of validated) {
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(part)) {
      throw new Error(`Invalid PG search path entry: ${part}`)
    }
  }
  return validated.join(',')
}

export function getPool() {
  if (_pool) return _pool
  const {
    PG_HOST,
    PG_PORT,
    PG_USER,
    PG_PASSWORD,
    PG_DATABASE,
    DATABASE_URL,
    PG_SSL,
    PG_SEARCH_PATH,
    SERVICE_PG_SEARCH_PATH,
  } = process.env

  const ssl = PG_SSL === 'true' ? { rejectUnauthorized: false } : undefined
  const searchPath = normalizeSearchPath(PG_SEARCH_PATH || SERVICE_PG_SEARCH_PATH || 'public')
  const options = `-c search_path=${searchPath}`

  _pool = new pg.Pool(
    DATABASE_URL
      ? { connectionString: DATABASE_URL, ssl, options }
      : {
          host: PG_HOST || 'localhost',
          port: Number(PG_PORT) || 5432,
          user: PG_USER,
          password: PG_PASSWORD,
          database: PG_DATABASE,
          ssl,
          options,
        }
  )
  return _pool
}