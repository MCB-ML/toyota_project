// Schema Metadata Harvest — 웨어하우스에서 검색 가능한 메타데이터를 **읽기만** 해서 모은다.
//
// 수집 항목(스펙 8장): 테이블/컬럼/타입/nullable/행수/distinct 수/null 비율/대표 표본값/
// PK 후보/FK 후보. 표본값이 핵심이다 — "QR 접수" 같은 사용자 표현으로 컬럼을 찾으려면
// 값 자체가 색인되어 있어야 한다.
//
// 비용 통제(스펙 14장):
//   - 컬럼당 쿼리를 날리지 않는다. 테이블 하나당 집계 쿼리 1번으로 전 컬럼의
//     distinct/null 수를 한꺼번에 센다.
//   - 표본값은 distinct 수가 임계 이하인 컬럼만 TOP N GROUP BY로 가져온다.
//     (메모·고객명처럼 카디널리티가 큰 컬럼은 값을 안 담는다 — 개인정보이기도 하다.)
//
// 실행 문장은 전부 SELECT다. 데이터를 바꾸는 문장은 이 파일에 존재하지 않는다.
import { queryFabric } from '../../fabricClient.js'
import { applyCurated } from './curated.js'
import { saveMetadataIndex } from './metadataIndex.js'
import { ROLE } from './metadataIndex.js'

const TEXT_TYPES = new Set(['varchar', 'nvarchar', 'char', 'nchar'])
const DATE_TYPES = new Set(['date', 'datetime', 'datetime2', 'smalldatetime', 'datetimeoffset', 'time'])
const NUMERIC_TYPES = new Set(['int', 'bigint', 'smallint', 'tinyint', 'decimal', 'numeric', 'float', 'real', 'money'])

const KEY_NAME = /(_key|_id|_no|_cd|_seq)$/i
// 값을 색인하면 안 되는 컬럼. 개인정보이거나(고객명·연락처) 자유 텍스트라 검색에 쓸모가 없다.
const NEVER_SAMPLE = /(cust_nm|customer_nm|name|memo|phone|tel|hp_no|email|addr|vin|_no$|_id$|_key$|_seq$)/i

function ident(s) {
  // 식별자에 대괄호/개행이 섞이면 그대로 거부한다. INFORMATION_SCHEMA에서 온 이름이라
  // 정상이면 걸릴 일이 없고, 걸린다면 그건 이 코드가 다뤄야 할 이름이 아니다.
  if (!/^[A-Za-z0-9_가-힣 ]+$/.test(String(s))) throw new Error(`허용되지 않은 식별자: ${s}`)
  return `[${s}]`
}

function roleOf({ name, data_type, distinct_count, row_count, max_length }) {
  if (DATE_TYPES.has(data_type)) return ROLE.DATE
  if (KEY_NAME.test(name)) return ROLE.KEY
  if (NUMERIC_TYPES.has(data_type)) return ROLE.MEASURE
  if (TEXT_TYPES.has(data_type)) {
    if (max_length != null && max_length > 400) return ROLE.TEXT
    if (distinct_count != null && row_count && distinct_count <= Math.max(200, row_count * 0.01)) return ROLE.CATEGORICAL
    return ROLE.TEXT
  }
  return ROLE.OTHER
}

/**
 * @param {object} opts
 * @param {(db: string, sql: string) => Promise<object[]>} [opts.query] 주입 가능(테스트/오프라인)
 */
export async function harvestMetadata({
  database = 'KPI_W',
  schemas = ['ktws'],
  query = queryFabric,
  maxSampleValues = 40,
  maxDistinctForSamples = 300,
  tableFilter = null,
  onProgress = () => {},
} = {}) {
  const schemaList = schemas.map((s) => `'${String(s).replace(/'/g, "''")}'`).join(', ')

  const columnRows = await query(database, `
    SELECT TABLE_SCHEMA, TABLE_NAME, COLUMN_NAME, DATA_TYPE, IS_NULLABLE,
           CHARACTER_MAXIMUM_LENGTH, ORDINAL_POSITION
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA IN (${schemaList})
    ORDER BY TABLE_SCHEMA, TABLE_NAME, ORDINAL_POSITION`)

  const byTable = new Map()
  for (const r of columnRows) {
    const full = `${r.TABLE_SCHEMA}.${r.TABLE_NAME}`
    if (tableFilter && !tableFilter(r.TABLE_NAME, r.TABLE_SCHEMA)) continue
    if (!byTable.has(full)) byTable.set(full, { schema: r.TABLE_SCHEMA, table: r.TABLE_NAME, full, columns: [] })
    byTable.get(full).columns.push({
      name: r.COLUMN_NAME,
      data_type: String(r.DATA_TYPE).toLowerCase(),
      nullable: r.IS_NULLABLE === 'YES',
      max_length: r.CHARACTER_MAXIMUM_LENGTH ?? null,
      ordinal: r.ORDINAL_POSITION,
    })
  }

  const tables = [...byTable.values()]
  let done = 0
  for (const t of tables) {
    onProgress({ phase: 'profile', table: t.full, done, total: tables.length })
    try {
      await profileTable(t, { database, query, maxSampleValues, maxDistinctForSamples })
    } catch (err) {
      // 한 테이블이 실패해도 나머지는 계속 모은다. 실패는 인덱스에 남겨 추적한다.
      t.profile_error = err.message
    }
    done++
  }

  const index = {
    generated_at: new Date().toISOString(),
    database,
    schemas,
    tables,
  }
  applyCurated(index)
  markKeyCandidates(index)
  onProgress({ phase: 'done', done, total: tables.length })
  return index
}

// 테이블 하나당 집계 쿼리 1번. 컬럼이 아주 많으면 나눠 던진다(T-SQL SELECT 목록 한계 회피).
const AGG_CHUNK = 40

async function profileTable(t, { database, query, maxSampleValues, maxDistinctForSamples }) {
  const from = `${ident(t.schema)}.${ident(t.table)}`
  const profilable = t.columns.filter((c) => TEXT_TYPES.has(c.data_type) || DATE_TYPES.has(c.data_type) || NUMERIC_TYPES.has(c.data_type))

  const rowCountRows = await query(database, `SELECT COUNT(*) AS n FROM ${from}`)
  t.row_count = Number(rowCountRows[0]?.n ?? 0)

  for (let i = 0; i < profilable.length; i += AGG_CHUNK) {
    const chunk = profilable.slice(i, i + AGG_CHUNK)
    const selects = chunk.flatMap((c, j) => [
      `COUNT(DISTINCT ${ident(c.name)}) AS d${i + j}`,
      `SUM(CASE WHEN ${ident(c.name)} IS NULL THEN 1 ELSE 0 END) AS n${i + j}`,
    ])
    const rows = await query(database, `SELECT ${selects.join(', ')} FROM ${from}`)
    const row = rows[0] || {}
    chunk.forEach((c, j) => {
      c.distinct_count = Number(row[`d${i + j}`] ?? 0)
      const nulls = Number(row[`n${i + j}`] ?? 0)
      c.null_ratio = t.row_count ? Number((nulls / t.row_count).toFixed(4)) : 0
    })
  }

  for (const c of t.columns) {
    c.role = roleOf({ ...c, row_count: t.row_count })
  }

  // 표본값: 카디널리티가 작고 개인정보가 아닌 문자열 컬럼만.
  for (const c of t.columns) {
    if (!TEXT_TYPES.has(c.data_type)) continue
    if (c.distinct_count == null || c.distinct_count === 0) continue
    if (c.distinct_count > maxDistinctForSamples) continue
    if (c.max_length != null && c.max_length > 400) continue
    if (NEVER_SAMPLE.test(c.name)) continue
    const rows = await query(database, `
      SELECT TOP ${maxSampleValues} ${ident(c.name)} AS v, COUNT(*) AS n
      FROM ${from}
      WHERE ${ident(c.name)} IS NOT NULL AND LTRIM(RTRIM(${ident(c.name)})) <> ''
      GROUP BY ${ident(c.name)}
      ORDER BY COUNT(*) DESC`)
    c.sample_values = rows.map((r) => ({ value: String(r.v).trim(), count: Number(r.n) }))
    c.sample_coverage = c.sample_values.length >= c.distinct_count ? 'complete' : 'partial'
  }
}

/**
 * PK/FK 후보 표시.
 *   PK 후보: NOT NULL이고 distinct 수가 행 수와 같다(유일).
 *   FK 후보: 이름이 키 모양이고, 다른 테이블의 PK 후보 또는 동명 컬럼이 존재한다.
 * 어느 쪽도 "이 조인을 써도 된다"는 뜻이 아니다 — Join 후보를 찾을 근거일 뿐이다(스펙 9장).
 */
export function markKeyCandidates(index) {
  const columnOwners = new Map() // 컬럼명(소문자) -> [{table, column}]
  for (const t of index.tables) {
    for (const c of t.columns) {
      c.pk_candidate = Boolean(
        t.row_count > 0 && c.distinct_count === t.row_count && c.null_ratio === 0
      ) || (t.declared_primary_keys || []).some((p) => p.toLowerCase() === c.name.toLowerCase())
      const key = c.name.toLowerCase()
      if (!columnOwners.has(key)) columnOwners.set(key, [])
      columnOwners.get(key).push({ table: t.full, column: c })
    }
  }
  for (const t of index.tables) {
    for (const c of t.columns) {
      const owners = columnOwners.get(c.name.toLowerCase()) || []
      c.fk_candidate = KEY_NAME.test(c.name) && owners.length > 1
      c.shared_with = c.fk_candidate ? owners.filter((o) => o.table !== t.full).map((o) => o.table) : []
    }
  }
  return index
}

/** CLI: node backend/dynamic/catalog/harvest.js [--schemas ktws,dbo] [--out path] */
export async function main(argv = process.argv.slice(2)) {
  const arg = (name, fallback) => {
    const i = argv.indexOf(`--${name}`)
    return i >= 0 ? argv[i + 1] : fallback
  }
  const schemas = String(arg('schemas', 'ktws')).split(',').map((s) => s.trim()).filter(Boolean)
  const database = arg('db', 'KPI_W')
  const out = arg('out', undefined)

  console.log(`[harvest] ${database} / schemas=${schemas.join(',')} — 읽기 전용 수집 시작`)
  const index = await harvestMetadata({
    database,
    schemas,
    onProgress: ({ phase, table, done, total }) => {
      if (phase === 'profile') console.log(`  [${done + 1}/${total}] ${table}`)
    },
  })
  const file = saveMetadataIndex(index, out)
  const columns = index.tables.reduce((n, t) => n + t.columns.length, 0)
  const sampled = index.tables.reduce((n, t) => n + t.columns.filter((c) => c.sample_values?.length).length, 0)
  console.log(`[harvest] 완료 — 테이블 ${index.tables.length} / 컬럼 ${columns} / 값 색인 ${sampled}`)
  console.log(`[harvest] 저장: ${file}`)
  return file
}

if (process.argv[1] && process.argv[1].endsWith('harvest.js')) {
  main().then(() => process.exit(0)).catch((err) => {
    console.error('[harvest]', err.message)
    process.exit(1)
  })
}
