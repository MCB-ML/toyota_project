// Schema Retriever — "무엇을 쓸 가능성이 있는가"를 찾는다. 실행 허가가 아니다(스펙 9장).
//
// 이 파일의 판단 규칙 두 가지가 이 레이어 전체의 안전성을 결정한다.
//
// 1) **값이 있는 요구는 값으로 확정한다.**
//    사용자가 "접수 유형이 QR 접수"라고 하면, 근거는 어떤 컬럼의 실제 값 목록에
//    "QR 접수"가 있다는 사실이다. 이름이 비슷한 컬럼(channel_type 0.78)을 대신 쓰면
//    쿼리는 성공하고 표도 멀쩡한데 값만 다르다 — 사람이 눈으로 못 거른다.
//
// 2) **1등과 2등이 붙어 있으면 고르지 않는다.**
//    top1을 그대로 쓰는 것이 스펙 9장이 금지한 바로 그것이다. 점수 차가 임계 미만이면
//    AMBIGUOUS로 올려보내 되묻게 한다.
import { norm, tokenize, overlap, valueEquals } from '../text.js'
import { ROLE, STATUS, tablesOf } from '../catalog/metadataIndex.js'

/** 개념 해석 결과. AMBIGUOUS/UNRESOLVED는 실행을 막는다(스펙 37장). */
export const RESOLUTION = {
  RESOLVED: 'RESOLVED',
  AMBIGUOUS: 'AMBIGUOUS',
  UNRESOLVED: 'UNRESOLVED',
}

// 1등이 이 점수를 넘어야 하고, 2등과 이만큼 벌어져야 고른다.
const MIN_SCORE = 0.34
const MIN_MARGIN = 0.15

const EVIDENCE_WEIGHT = {
  value_exact: 1.0,
  value_partial: 0.45,
  column_description: 0.4,
  column_name: 0.3,
  table_context: 0.12,
  curated_column: 0.1,
  role_fit: 0.08,
}

function scoreColumn({ table, column, queryTokens, value, wantRole }) {
  const evidence = []
  let matchedValue = null

  if (value != null && String(value).length > 0) {
    const key = norm(value)
    if (column._values?.has(key)) {
      matchedValue = column._values.get(key)
      evidence.push({ type: 'value_exact', detail: `${column.name} 표본값에 "${matchedValue}" 존재` })
    } else if (column._values?.size) {
      for (const [k, v] of column._values) {
        if (k.length >= 2 && (k.includes(key) || key.includes(k))) {
          matchedValue = v
          evidence.push({ type: 'value_partial', detail: `${column.name} 표본값 "${v}" 와 부분 일치` })
          break
        }
      }
    }
  }

  const nameOverlap = overlap(queryTokens, tokenize(column.name))
  if (nameOverlap > 0) evidence.push({ type: 'column_name', detail: column.name, score: nameOverlap })

  const descTokens = column.description ? tokenize(column.description) : null
  const descOverlap = descTokens ? overlap(queryTokens, descTokens) : 0
  if (descOverlap > 0) evidence.push({ type: 'column_description', detail: column.description, score: descOverlap })

  const tableOverlap = overlap(queryTokens, table._tokens)
  if (tableOverlap > 0) evidence.push({ type: 'table_context', detail: table.full, score: tableOverlap })

  if (column.certification_status === STATUS.CERTIFIED) {
    evidence.push({ type: 'curated_column', detail: '정의서에 설명이 있는 컬럼' })
  }
  if (wantRole && column.role === wantRole) {
    evidence.push({ type: 'role_fit', detail: `role=${column.role}` })
  }

  let score = 0
  for (const e of evidence) {
    score += EVIDENCE_WEIGHT[e.type] * (e.score != null ? e.score : 1)
  }
  return { score: Number(score.toFixed(4)), evidence, matchedValue }
}

const ROLE_FOR_KIND = {
  filter: ROLE.CATEGORICAL,
  dimension: ROLE.CATEGORICAL,
  time: ROLE.DATE,
  measure: ROLE.MEASURE,
}

/**
 * 개념 하나를 스키마 후보로 해석한다.
 *
 * @param {object} concept {concept, value?, kind?: 'filter'|'dimension'|'time'|'measure', hint?}
 * @returns {{concept, resolution, matches, note}}
 */
export function retrieveConcept(index, concept, { limit = 6, restrictTables = null } = {}) {
  const queryTokens = tokenize([concept.concept, concept.hint].filter(Boolean).join(' '))
  const wantRole = ROLE_FOR_KIND[concept.kind] || null
  const hasValue = concept.value != null && String(concept.value).length > 0

  const scored = []
  for (const table of tablesOf(index)) {
    if (restrictTables && !restrictTables.includes(table.full)) continue
    for (const column of table.columns) {
      // 키·자유텍스트 컬럼은 필터/차원 후보가 아니다 — 값으로 걸 수 있는 컬럼만 본다.
      if (wantRole === ROLE.CATEGORICAL && column.role !== ROLE.CATEGORICAL) continue
      if (wantRole === ROLE.DATE && column.role !== ROLE.DATE) continue
      const s = scoreColumn({ table, column, queryTokens, value: concept.value, wantRole })
      if (s.score <= 0) continue
      scored.push({
        table: table.full,
        column: column.name,
        role: column.role,
        status: column.certification_status,
        description: column.description || null,
        distinct_count: column.distinct_count ?? null,
        sample_coverage: column.sample_coverage || null,
        matched_value: s.matchedValue,
        has_exact_value: s.evidence.some((e) => e.type === 'value_exact'),
        score: s.score,
        evidence: s.evidence,
      })
    }
  }
  scored.sort((a, b) => b.score - a.score || a.table.localeCompare(b.table) || a.column.localeCompare(b.column))
  const matches = scored.slice(0, limit)

  return { concept: concept.concept, kind: concept.kind || null, value: concept.value ?? null, ...decide(matches, hasValue, scored) }
}

// 값이 주어졌으면 값 일치가 유일한 확정 근거다. 이름/설명 점수는 순위를 매길 뿐,
// 값 근거 없이 컬럼을 확정하지 못한다(스펙 24장).
function decide(matches, hasValue, allScored) {
  if (!matches.length) {
    return { resolution: RESOLUTION.UNRESOLVED, matches: [], note: '이 개념에 해당할 만한 컬럼을 찾지 못했습니다.' }
  }

  if (hasValue) {
    const exact = allScored.filter((m) => m.has_exact_value)
    if (exact.length === 1) {
      return { resolution: RESOLUTION.RESOLVED, matches, selected: exact[0], note: null }
    }
    if (exact.length > 1) {
      return {
        resolution: RESOLUTION.AMBIGUOUS,
        matches,
        candidates: exact.slice(0, limitOf(exact)),
        note: `요청한 값이 컬럼 ${exact.length}곳에 모두 존재합니다 — 어느 기준인지 확인이 필요합니다.`,
      }
    }
    // 값이 어디에도 없다. 표본이 부분 수집인 컬럼이 있으면 "없다"고 단정하지 않는다.
    const partial = matches.filter((m) => m.sample_coverage === 'partial')
    return {
      resolution: partial.length ? RESOLUTION.AMBIGUOUS : RESOLUTION.UNRESOLVED,
      matches,
      note: partial.length
        ? '요청한 값이 수집된 표본에 없습니다. 후보 컬럼의 값 목록이 부분 수집이라 없다고 단정할 수 없습니다.'
        : '요청한 값이 어느 컬럼의 값 목록에도 없습니다.',
    }
  }

  const [top, second] = matches
  if (top.score < MIN_SCORE) {
    return { resolution: RESOLUTION.UNRESOLVED, matches, note: `가장 가까운 후보(${top.table}.${top.column})도 근거가 약합니다.` }
  }
  if (second && top.score - second.score < MIN_MARGIN) {
    return {
      resolution: RESOLUTION.AMBIGUOUS,
      matches,
      candidates: matches.filter((m) => top.score - m.score < MIN_MARGIN),
      note: `후보 점수가 붙어 있습니다(${top.column} ${top.score} vs ${second.column} ${second.score}).`,
    }
  }
  return { resolution: RESOLUTION.RESOLVED, matches, selected: top, note: null }
}

function limitOf(list) {
  return Math.min(list.length, 5)
}

/**
 * 도메인 → 테이블 검색(스펙 34장). LLM 프롬프트에 넣을 테이블을 좁히는 데만 쓴다.
 */
export function retrieveTables(index, question, { limit = 10, seedTables = [] } = {}) {
  const queryTokens = tokenize(question)
  const scored = tablesOf(index).map((t) => {
    let score = overlap(queryTokens, t._tokens)
    for (const c of t.columns) score += 0.2 * overlap(queryTokens, c._tokens)
    if (t.curated) score += 0.15
    if (seedTables.includes(t.full)) score += 1
    return { table: t.full, score: Number(score.toFixed(4)), curated: Boolean(t.curated), row_count: t.row_count ?? null }
  })
  scored.sort((a, b) => b.score - a.score || a.table.localeCompare(b.table))
  return scored.filter((s) => s.score > 0).slice(0, limit)
}

/**
 * LLM 프롬프트용 컨텍스트. 테이블 전체를 넣지 않는다(스펙 35장) —
 * 고른 테이블의 컬럼만, 표본값은 앞 8개까지만.
 */
export function renderSchemaSlice(index, tableNames, { maxValues = 8 } = {}) {
  const lines = []
  for (const full of tableNames) {
    const t = tablesOf(index).find((x) => x.full === full)
    if (!t) continue
    lines.push(`### ${t.full}${t.ko ? ` (${t.ko})` : ''}${t.description ? ` — ${t.description}` : ''}`)
    if (t.grain) lines.push(`grain: ${t.grain}`)
    if (t.row_count != null) lines.push(`rows: ${t.row_count}`)
    for (const c of t.columns) {
      if (c.role === ROLE.OTHER) continue
      const bits = [`- ${c.name} (${c.data_type}, ${c.role})`]
      if (c.description) bits.push(c.description)
      if (c.sample_values?.length) {
        bits.push(`값 예시: ${c.sample_values.slice(0, maxValues).map((v) => v.value).join(' / ')}`)
      }
      lines.push(bits.join(' — '))
    }
    lines.push('')
  }
  return lines.join('\n')
}
