import pg from 'pg'

// 로컬 Postgres — 본사/딜러사별 대시보드 레이아웃 저장(docker-compose.yml). Fabric과 달리
// 인증서/AD 인증이 필요 없는 로컬 컨테이너라 단순 Pool 하나면 충분하다.
let _pool = null

export function getPool() {
  if (_pool) return _pool
  const { PG_HOST, PG_PORT, PG_USER, PG_PASSWORD, PG_DATABASE, DATABASE_URL } = process.env
  _pool = new pg.Pool(
    DATABASE_URL
      ? { connectionString: DATABASE_URL }
      : {
          host: PG_HOST || 'localhost',
          port: Number(PG_PORT) || 5432,
          user: PG_USER,
          password: PG_PASSWORD,
          database: PG_DATABASE,
        }
  )
  return _pool
}
