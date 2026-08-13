// Schema / Metadata Index — 검색 가능한 웨어하우스 메타데이터(스펙 8장).
//
// 왜 별도 인덱스인가:
//   schema/tables/*.yaml 은 사람이 쓴 22개 테이블 설명이다. 정확하지만 **웨어하우스의
//   일부만** 덮는다(KPI_W ktws 스키마 실측 39테이블·500컬럼). 등록되지 않은 질문에
//   답하려면 카탈로그 밖 컬럼도 찾을 수 있어야 한다.
//
//   반대로 라이브 INFORMATION_SCHEMA 만으로는 "이 컬럼이 업무적으로 무엇인가"를 알 수 없다.
//   그래서 둘을 합친다 — 큐레이션 설명이 있으면 CERTIFIED, 하베스트로만 알아낸 건 DISCOVERED.
//   이 등급 차이는 뒤(planValidator)에서 실행 허용 여부를 가르는 근거로 쓰인다.
//
// 인덱스는 디스크 JSON이다. 질문마다 웨어하우스를 뒤지지 않고, 테스트는 오프라인으로 돈다.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { norm, tokenize } from '../text.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DEFAULT_FILE = path.resolve(__dirname, '..', 'cache', 'metadata-index.json')

/** 컬럼의 인증 등급 — 이 값이 실행 허용 판단에 쓰인다(스펙 7장). */
export const STATUS = {
  CERTIFIED: 'CERTIFIED',
  DISCOVERED: 'DISCOVERED',
  AMBIGUOUS: 'AMBIGUOUS',
  REJECTED: 'REJECTED',
}

/** 컬럼이 질의에서 하는 역할. 하베스트가 타입·이름·프로파일로 결정한다. */
export const ROLE = {
  KEY: 'key',
  DATE: 'date',
  MEASURE: 'measure',
  CATEGORICAL: 'categorical',
  TEXT: 'text',
  OTHER: 'other',
}

export function indexPath() {
  return DEFAULT_FILE
}

let _cache = null

/**
 * 인덱스를 읽는다.
 *
 * @param {{file?: string, index?: object, force?: boolean}} opts
 *   index를 직접 넘기면 파일을 읽지 않는다 — 테스트가 이 경로로 가짜 인덱스를 주입한다.
 */
export function loadMetadataIndex({ file, index, force = false } = {}) {
  if (index) return decorate(index)
  if (_cache && !force && !file) return _cache
  const target = file || DEFAULT_FILE
  if (!fs.existsSync(target)) {
    throw new Error(
      `스키마 메타데이터 인덱스가 없습니다: ${target}\n` +
      `먼저 "npm run dynamic:harvest" 로 웨어하우스 메타데이터를 수집하세요(읽기 전용).`
    )
  }
  const parsed = JSON.parse(fs.readFileSync(target, 'utf-8'))
  const decorated = decorate(parsed)
  if (!file) _cache = decorated
  return decorated
}

export function clearMetadataIndexCache() {
  _cache = null
}

export function saveMetadataIndex(index, file = DEFAULT_FILE) {
  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.writeFileSync(file, JSON.stringify(index, null, 2), 'utf-8')
  return file
}

// 검색용 파생 필드를 한 번만 계산해 붙인다. 원본 JSON은 사람이 읽을 수 있게 두고,
// 토큰/값 색인은 메모리에서만 만든다(파일이 몇 배로 불어나는 것을 피한다).
function decorate(index) {
  if (index.__decorated) return index
  for (const t of index.tables || []) {
    t.full = t.full || `${t.schema}.${t.table}`
    t._tokens = tokenize([t.table, t.ko, t.description, t.grain, ...(t.synonyms || [])].filter(Boolean).join(' '))
    for (const c of t.columns || []) {
      c.table = t.full
      c._tokens = tokenize([c.name, c.ko, c.description].filter(Boolean).join(' '))
      c._values = new Map()
      for (const v of c.sample_values || []) {
        const key = norm(v?.value ?? v)
        if (key) c._values.set(key, v?.value ?? v)
      }
    }
  }
  Object.defineProperty(index, '__decorated', { value: true, enumerable: false })
  return index
}

export function tablesOf(index) {
  return index.tables || []
}

export function getTable(index, full) {
  return tablesOf(index).find((t) => t.full === full || t.table === full) || null
}

export function getColumn(index, tableFull, columnName) {
  const t = getTable(index, tableFull)
  if (!t) return null
  const n = String(columnName).toLowerCase()
  return t.columns.find((c) => c.name.toLowerCase() === n) || null
}

/** 값으로 검색할 수 있는 컬럼 — 표본값이 실제로 수집된 것만. */
export function valueSearchableColumns(index) {
  const out = []
  for (const t of tablesOf(index)) {
    for (const c of t.columns) {
      if (c._values?.size) out.push({ table: t, column: c })
    }
  }
  return out
}

/** 인덱스 요약(관측 가능성 trace에 그대로 싣는다). */
export function describeIndex(index) {
  const tables = tablesOf(index)
  return {
    generated_at: index.generated_at || null,
    database: index.database,
    schemas: index.schemas,
    tables: tables.length,
    curated_tables: tables.filter((t) => t.curated).length,
    columns: tables.reduce((n, t) => n + t.columns.length, 0),
    value_profiled_columns: tables.reduce((n, t) => n + t.columns.filter((c) => c.sample_values?.length).length, 0),
  }
}
