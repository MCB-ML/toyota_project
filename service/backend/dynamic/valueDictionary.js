// 값 사전 — 질문에 있는 값이 조건으로 안 걸리고 사라지는 것을 잡는다.
//
// 왜 필요한가: 요구 추출은 LLM이 한다. 2026-08-12 실측으로 "RX 모델 계약을 연누적으로
// 보여줘"를 3회 돌렸더니 2회가 '모델=RX' 조건을 통째로 빠뜨렸다. 그러면 연누적 전체
// 17,219가 RX 실적인 것처럼 나간다 — 오류도 안 나고 표도 한 줄로 멀쩡하다.
//
// Fidelity 게이트는 **요구에 적힌 것**만 대조할 수 있어서 이 종류를 못 잡는다.
// 요구가 비어 있으면 대조할 것이 없기 때문이다. 그래서 질문 원문을 직접 본다.
//
// 판정은 결정론적이다: 등록 차원의 실제 값 목록에 있는 말이 질문에 그대로 있는데
// 조건에 없으면 막는다. 모델을 손보는 대신 서버가 정한다.
import { queryFabricWithTimeout } from '../fabricClient.js'
import { loadRegistry } from '../agentic-bi/app/semantic/registry.js'
import { norm } from './text.js'

const DB = 'KPI_W'
const TTL_MS = 30 * 60 * 1000
const MAX_VALUES = 800

// 값 목록을 읽어올 차원. 전 차원을 읽으면 질문마다 웨어하우스를 여러 번 두드린다.
// **조용히 사라졌을 때 숫자가 크게 달라지는 축**부터 넣는다.
//
// 조직 축(딜러·전시장·팀·SC)은 여기 없다 — 그쪽은 dimensionValues.canonicalizeValues가
// 이미 같은 일을 하고, 리포트 경로에서 그 함수를 통과시키고 있다.
export const WATCHED_DIMENSIONS = ['vehicle_model', 'vehicle_variant']

const cache = new Map()   // dimensionId -> {at, values}

export function clearValueDictionaryCache() { cache.clear() }

/** 그 차원의 실제 값 목록. 선언된 known_values가 있으면 그것을 쓰고, 없으면 읽어온다. */
export async function valuesOf(dimensionId, { query = queryFabricWithTimeout, registry = loadRegistry() } = {}) {
  const dim = registry.dimensions.get(dimensionId)
  if (!dim?.column?.table || !dim?.column?.column) return []

  if (Array.isArray(dim.known_values) && dim.known_values.length) {
    return dim.known_values.map((v) => String(v).trim()).filter(Boolean)
  }

  const hit = cache.get(dimensionId)
  if (hit && Date.now() - hit.at < TTL_MS) return hit.values

  // 식별자는 등록 카탈로그에서만 온다 — 사용자 입력이 여기 닿는 경로가 없다.
  if (!/^[A-Za-z0-9_]+$/.test(dim.column.table) || !/^[A-Za-z0-9_]+$/.test(dim.column.column)) return []
  const sql = `SELECT DISTINCT TOP ${MAX_VALUES} [${dim.column.column}] AS v `
    + `FROM ktws.[${dim.column.table}] WHERE [${dim.column.column}] IS NOT NULL`
  let rows
  try {
    rows = await query(DB, sql, 30000)
  } catch {
    return []   // 목록을 못 읽으면 이 검사를 건너뛴다 — 조회 실패로 질문을 막지 않는다
  }
  const values = [...new Set(rows.map((r) => String(r.v ?? '').trim()).filter(Boolean))]
  cache.set(dimensionId, { at: Date.now(), values })
  return values
}

// 질문에 그대로 있다고 보려면 이 길이는 넘어야 한다. 한두 글자 값(예: 'A')은
// 아무 문장에나 들어 있어서 근거가 되지 않는다.
const MIN_VALUE_LENGTH = 2

/**
 * 질문 안에 있는 그 차원의 값들.
 *
 * 부분 일치를 쓰지 않는다 — 값끼리 서로 부분 문자열인 카탈로그(RX / RX350h)에서
 * 부분 일치는 엉뚱한 값을 집어낸다. 질문 문자열에 값이 통째로 들어 있는지만 본다.
 */
export function valuesMentionedIn(question, values) {
  const haystack = norm(question)
  if (!haystack) return []
  const hits = values.filter((v) => norm(v).length >= MIN_VALUE_LENGTH && haystack.includes(norm(v)))
  if (!hits.length) return []
  // 'RX'와 'RX350h'가 둘 다 걸리면 더 긴 쪽이 사용자가 말한 것이다.
  const longest = hits.reduce((a, b) => (norm(b).length > norm(a).length ? b : a))
  return hits.filter((v) => norm(longest).includes(norm(v)) ? v === longest : true)
}

/**
 * 질문에 있는데 조건으로 안 걸린 값을 찾는다.
 *
 * @param {Array<{concept, values}>} appliedFilters 계획에 실제로 들어간 조건
 * @returns {Promise<Array<{dimension, value, label}>>}
 */
export async function findDroppedValues(question, appliedFilters, {
  dimensions = WATCHED_DIMENSIONS,
  query = queryFabricWithTimeout,
  registry = loadRegistry(),
} = {}) {
  const applied = new Set()
  for (const f of appliedFilters || []) {
    for (const v of f.values || []) applied.add(norm(v))
  }

  const dropped = []
  for (const dimensionId of dimensions) {
    const values = await valuesOf(dimensionId, { query, registry })
    if (!values.length) continue
    for (const v of valuesMentionedIn(question, values)) {
      // 이미 걸린 값이거나, 걸린 값 안에 포함된 값이면(RX ⊂ RX350h) 사라진 것이 아니다.
      const covered = [...applied].some((a) => a === norm(v) || a.includes(norm(v)))
      if (covered) continue
      dropped.push({ dimension: dimensionId, value: v, label: registry.dimensions.get(dimensionId)?.label_ko || dimensionId })
    }
  }
  return dropped
}
