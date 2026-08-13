import sql from 'mssql'
import { runWithFabricConcurrency } from './fabricConcurrency.js'

// Fabric Data Warehouse SQL 분석 엔드포인트 — 실제 웨어하우스 연결.
// 인증 정보는 절대 코드에 넣지 않고 .env에서만 읽는다 (자격 위치는 .env.example 참고).
const ENDPOINTS = {
  Agora: 'REPLACE_ME.datawarehouse.fabric.microsoft.com',
  Karete: 'REPLACE_ME.datawarehouse.fabric.microsoft.com',
  BP_KTWS: 'REPLACE_ME.datawarehouse.fabric.microsoft.com',
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
const DEFAULT_TENANT_ID = '00000000-0000-0000-0000-000000000000'

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
      // mssql/tedious 기본 requestTimeout(15초)은 CROSS APPLY 월별 윈도우처럼 무거운 리포트성
      // 쿼리(예: SC 출고 매트릭스)엔 너무 짧아 타임아웃이 났다 — 60초로 넉넉히 잡는다.
      requestTimeout: 60000,
    }
    pools.set(key, new sql.ConnectionPool(config).connect())
  }
  return pools.get(key)
}

const UNSAFE_SQL_RE = /\b(INSERT|UPDATE|DELETE|DROP|ALTER|EXEC|EXECUTE|MERGE|TRUNCATE|CREATE|GRANT)\b/i

function assertReadOnly(sqlText) {
  const normalized = String(sqlText || '').trimStart().replace(/^(;\s*)+/, '')
  if (!/^(SELECT|WITH)\b/i.test(normalized) || UNSAFE_SQL_RE.test(sqlText)) {
    throw new Error('읽기 전용(SELECT) 쿼리만 허용됩니다.')
  }
}

// SELECT/WITH 만 허용 — LLM이 생성한 SQL을 실행할 가능성을 염두에 둔 최소 안전장치.
export async function queryFabric(db, sqlText) {
  assertReadOnly(sqlText)
  const pool = await getPool(db)
  // 2026-08-04 leo: 일반 query, watermark, certified report가 별도 경로에서 실행돼
  // 페이지별 제한만으로는 전체 Fabric 부하를 막지 못했다. 모든 Fabric 실행을 공통 permit에 건다.
  const result = await runWithFabricConcurrency(() => pool.request().query(sqlText))
  return result.recordset
}

// 사용자가 채팅으로 직접 트리거하는 쿼리(챗봇/대시보드 위젯)에서만 사용 — timeoutMs 안에 안
// 끝나면 실행을 취소하고 QueryTimeoutError를 던진다. TOP N을 무조건 박아 결과를 조용히
// 자르는 대신, 정말 오래 걸리는(=결과가 많거나 무거운) 경우에만 사용자에게 되묻기 위한 장치
// — 호출부는 `err.isTimeout`으로 구분해 재질문 흐름으로 이어받는다.
export class QueryTimeoutError extends Error {
  constructor(timeoutMs) {
    super(`이 조회가 ${Math.round(timeoutMs / 1000)}초 넘게 걸려 실행을 중단했습니다. 결과가 많거나 복잡한 조건일 수 있습니다 — 상위 몇 개만 볼지, 아니면 기간·조건을 좁혀서 다시 질문해 주시겠어요?`)
    this.name = 'QueryTimeoutError'
    this.isTimeout = true
  }
}

export async function queryFabricWithTimeout(db, sqlText, timeoutMs = 30000) {
  assertReadOnly(sqlText)
  const pool = await getPool(db)
  const request = pool.request()
  const result = await runWithFabricConcurrency(async () => {
    // 2026-08-04 leo: 기존에는 전역 Fabric 대기열에 선 시간까지 쿼리 timeout으로
    // 계산되어 아직 실행하지 않은 request가 cancel됐다. permit을 얻은 뒤부터만 실행
    // 시간을 재서, 혼잡 시에는 대기열 오류와 실제 SQL timeout을 구분한다.
    let timedOut = false
    const timer = setTimeout(() => {
      timedOut = true
      request.cancel()
    }, timeoutMs)
    try {
      return await request.query(sqlText)
    } catch (err) {
      if (timedOut) throw new QueryTimeoutError(timeoutMs)
      throw err
    } finally {
      clearTimeout(timer)
    }
  })
  return result.recordset
}

// ── Certified Report 전용 실행 경로 ──────────────────────────────────────────
//
// 위의 assertReadOnly는 "LLM이 써낸 SQL"을 막으려는 장치라 SELECT/WITH로 시작할 것을
// 요구한다. 등록된 리포트 SQL은 신뢰 등급이 다르다 — 사람이 작성해 리포지토리에
// 커밋했고, 계약의 sql_sha256으로 본문이 고정돼 있으며, LLM은 report_id를 고를 수만
// 있고 SQL을 쓰거나 고칠 수 없다. 그래서 시작 토큰 제약만 풀고(등록 SQL은 DECLARE/IF로
// 시작한다) DDL/DML 차단은 그대로 유지한다.
//
// 파라미터는 전부 드라이버 바인딩(request.input)으로 넘긴다. 값을 SQL 문자열에
// 끼워넣는 경로는 이 함수에 존재하지 않는다.
const SQL_TYPE_BY_NAME = {
  int: sql.Int,
  nvarchar: sql.NVarChar(sql.MAX),
  date: sql.Date,
}

// 주석을 걷어낸 SQL. 등록 리포트의 머리말에는 "임시테이블 CREATE/DROP 미사용",
// "DROP TABLE 전부 제거" 같은 설명이 흔히 들어 있어서, 본문 검사를 주석까지 포함해
// 하면 멀쩡한 리포트가 막힌다. 주석은 실행되지 않으므로 검사 대상에서 뺀다.
// (문자열 리터럴 안의 --, /* 를 주석으로 오인하지 않도록 따옴표 상태를 따라간다.)
export function stripSqlComments(sqlText) {
  let out = ''
  let i = 0
  const s = String(sqlText || '')
  while (i < s.length) {
    const c = s[i]
    if (c === "'") { // 문자열 리터럴 — '' 는 이스케이프된 따옴표
      out += c; i++
      while (i < s.length) {
        if (s[i] === "'" && s[i + 1] === "'") { out += "''"; i += 2; continue }
        if (s[i] === "'") { out += "'"; i++; break }
        out += s[i]; i++
      }
      continue
    }
    if (c === '-' && s[i + 1] === '-') {
      while (i < s.length && s[i] !== '\n') i++
      continue
    }
    if (c === '/' && s[i + 1] === '*') {
      i += 2
      while (i < s.length && !(s[i] === '*' && s[i + 1] === '/')) i++
      i += 2
      continue
    }
    out += c; i++
  }
  return out
}

export async function queryFabricCertified(db, sqlText, params = {}, { timeoutMs = 60000 } = {}) {
  // 주석을 포함한 원문에서 먼저 보고, 걸리면 주석을 걷어내고 다시 본다 —
  // 이렇게 하면 주석 때문에 생기는 오탐만 걸러지고 실제 DDL은 그대로 막힌다.
  if (UNSAFE_SQL_RE.test(sqlText) && UNSAFE_SQL_RE.test(stripSqlComments(sqlText))) {
    throw new Error('인증 리포트 SQL에 데이터 변경/DDL 구문이 포함되어 있습니다.')
  }

  const pool = await getPool(db)
  const request = pool.request()

  for (const [name, spec] of Object.entries(params)) {
    const type = SQL_TYPE_BY_NAME[spec.type]
    if (!type) throw new Error(`알 수 없는 파라미터 타입: ${name} → ${spec.type}`)
    request.input(name, type, spec.value ?? null)
  }

  const result = await runWithFabricConcurrency(async () => {
    let timedOut = false
    const timer = setTimeout(() => {
      timedOut = true
      request.cancel()
    }, timeoutMs)
    try {
      return await request.query(sqlText)
    } catch (err) {
      if (timedOut) throw new QueryTimeoutError(timeoutMs)
      throw err
    } finally {
      clearTimeout(timer)
    }
  })
  // IF/ELSE 분기 구조라 실제로 결과를 내는 SELECT는 하나뿐이지만, 앞선
  // 변수 대입문 등이 섞일 수 있으므로 마지막 recordset을 출력으로 본다.
  const sets = result.recordsets || []
  return sets.length > 0 ? sets[sets.length - 1] : result.recordset || []
}

// 실행은 빨랐지만(타임아웃 안 걸림) 결과 행 수 자체가 과도한 경우(TOP N을 안 걸므로 이런
// 케이스가 생길 수 있다 — 예: 날짜 필터 없는 목록형 쿼리) — 호출부가 성공적으로 받은
// rows.length를 이 임계값과 비교해서, 넘으면 차트/표를 그리는 대신 이 메시지로 되묻는다
// (QueryTimeoutError와 같은 "사용자에게 되묻기" 취지, 다만 예외가 아니라 성공 이후의
// 정상 체크라 별도 함수로 둔다).
export const MAX_ROWS_BEFORE_REASK = 500

export function tooManyRowsMessage(rowCount) {
  return `이 조회 결과가 ${rowCount.toLocaleString()}행이나 됩니다. 상위 몇 개만 볼지, 아니면 기간·조건을 좁혀서 다시 질문해 주시겠어요?`
}

export async function testConnection(db) {
  const rows = await queryFabric(db, 'SELECT 1 AS ok')
  return rows[0]?.ok === 1
}
