import pg from 'pg'

// 로컬 Postgres — 본사/딜러사별 대시보드 레이아웃 저장(docker-compose.yml). Fabric과 달리
// 인증서/AD 인증이 필요 없는 로컬 컨테이너라 단순 Pool 하나면 충분하다.
let _pool = null

export function getPool() {
  if (_pool) return _pool
  const { PG_HOST, PG_PORT, PG_USER, PG_PASSWORD, PG_DATABASE, DATABASE_URL, PG_SSL } = process.env
  // Azure Database for PostgreSQL(과 대부분의 관리형 Postgres)은 SSL을 강제한다 — 로컬
  // docker-compose Postgres는 SSL이 없어서 기본은 꺼둔 채로, PG_SSL=true일 때만 켠다.
  // rejectUnauthorized:false는 Azure의 서버 인증서를 별도 CA 번들 없이 신뢰하기 위함
  // (연결 자체는 여전히 암호화됨 — 중간자 검증만 생략).
  const ssl = PG_SSL === 'true' ? { rejectUnauthorized: false } : undefined
  _pool = new pg.Pool(
    DATABASE_URL
      ? { connectionString: DATABASE_URL, ssl }
      : {
          host: PG_HOST || 'localhost',
          port: Number(PG_PORT) || 5432,
          user: PG_USER,
          password: PG_PASSWORD,
          database: PG_DATABASE,
          ssl,
        }
  )
  return _pool
}
