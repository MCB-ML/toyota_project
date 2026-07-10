import sql from 'mssql'

// Fabric Data Warehouse SQL 분석 엔드포인트 — 실제 웨어하우스 연결.
// 인증 정보는 절대 코드에 넣지 않고 .env에서만 읽는다 (자격 위치는 .env.example 참고).
const ENDPOINTS = {
  Agora: '6orm62c43rguff2mpdxwqy76tu-3meqk2mii2pehfjxfscngx5a6e.datawarehouse.fabric.microsoft.com',
  Karete: '6orm62c43rguff2mpdxwqy76tu-kp6lscr4iunung5p66mov6kcka.datawarehouse.fabric.microsoft.com',
  BP_KTWS: '6orm62c43rguff2mpdxwqy76tu-xhehnpiu2bautgglhximxpyqca.datawarehouse.fabric.microsoft.com',
}

// DB정의서_*.md의 "DB 개요" 표에 나온 DB명 → 소속 엔드포인트. 새 DB가 추가되면 여기 등록.
const DB_TO_SYSTEM = {
  TMKR_L: 'Agora', TMKR_W: 'Agora', TMKR_W_CUSTOMER: 'Agora', TMKR_W_PARTS: 'Agora',
  'TMKR_W_PARTS(IMS)': 'Agora', TMKR_W_SALES: 'Agora', test: 'Agora',
  LH_INTELLIGENCE_BI: 'Karete', LH_INTELLIGENCE_ML: 'Karete', LH_META: 'Karete', LH_REFINED: 'Karete',
  KPI_L: 'BP_KTWS', KPI_W: 'BP_KTWS',
}

// tedious(mssql의 내부 드라이버)는 azure-active-directory-password 인증에 clientId를 필수로
// 요구한다. 원래 파이썬/pyodbc 스캔(ActiveDirectoryPassword, ODBC Driver 17)은 드라이버가
// 자체 Microsoft 1st-party client id를 내장하고 있어 이 값이 필요 없었다. 아래는 Azure CLI의
// 공개 client id — 대부분 테넌트에서 기본적으로 사전 동의(pre-consent)되어 있어 별도 앱 등록 없이
// 동작하는 경우가 많다. 로그인이 막히면 IT에 이 테넌트용 앱 등록을 요청하고
// FABRIC_SQL_CLIENT_ID로 교체할 것 (README.md의 KTWS BI SSO 이슈와 동일한 종류의 차단 지점).
const DEFAULT_CLIENT_ID = '04b07795-8ddb-461a-bbee-02f9e1bf7b46'

// toyotamotor.co.kr 실 테넌트 (README.md에 이미 기록된 값). FABRIC_SQL_TENANT_ID로 덮어쓸 수 있음.
const DEFAULT_TENANT_ID = '68cfa2f3-dc5c-424d-974c-78ef6863fe9d'

const pools = new Map() // "system/db" -> Promise<ConnectionPool>

function systemForDb(db) {
  const system = DB_TO_SYSTEM[db]
  if (!system) throw new Error(`알 수 없는 DB입니다: ${db} (server/fabricClient.js의 DB_TO_SYSTEM에 추가 필요)`)
  return system
}

function getPool(db) {
  const system = systemForDb(db)
  const key = `${system}/${db}`
  if (!pools.has(key)) {
    const { Fabric_ID, Fabric_PW, FABRIC_SQL_CLIENT_ID, FABRIC_SQL_TENANT_ID } = process.env
    if (!Fabric_ID || !Fabric_PW) {
      throw new Error('Fabric_ID / Fabric_PW 환경변수가 설정되지 않았습니다. .env를 확인하세요.')
    }
    const config = {
      server: ENDPOINTS[system],
      database: db,
      port: 1433,
      authentication: {
        type: 'azure-active-directory-password',
        options: {
          userName: Fabric_ID,
          password: Fabric_PW,
          clientId: FABRIC_SQL_CLIENT_ID || DEFAULT_CLIENT_ID,
          tenantId: FABRIC_SQL_TENANT_ID || DEFAULT_TENANT_ID,
        },
      },
      options: { encrypt: true, trustServerCertificate: false },
    }
    pools.set(key, new sql.ConnectionPool(config).connect())
  }
  return pools.get(key)
}

const UNSAFE_SQL_RE = /\b(INSERT|UPDATE|DELETE|DROP|ALTER|EXEC|EXECUTE|MERGE|TRUNCATE|CREATE|GRANT)\b/i

// SELECT/WITH 만 허용 — LLM이 생성한 SQL을 실행할 가능성을 염두에 둔 최소 안전장치.
export async function queryFabric(db, sqlText) {
  if (!/^\s*(SELECT|WITH)\b/i.test(sqlText) || UNSAFE_SQL_RE.test(sqlText)) {
    throw new Error('읽기 전용(SELECT) 쿼리만 허용됩니다.')
  }
  const pool = await getPool(db)
  const result = await pool.request().query(sqlText)
  return result.recordset
}

export async function testConnection(db) {
  const rows = await queryFabric(db, 'SELECT 1 AS ok')
  return rows[0]?.ok === 1
}
