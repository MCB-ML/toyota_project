// LEVEL 2 — Report-local Semantic Knowledge.
//
// 기존 BI 리포트는 "SQL 결과"가 아니라 **이미 검증된 의미 자산**이다. 어떤 열이 있고,
// 그 열이 무슨 업무 개념이며, 어떤 값을 갖는지를 리포트가 이미 알고 있다.
// 글로벌 Dimension에 없다는 이유로 Raw Schema를 다시 뒤지는 것은, 아는 것을 버리고
// 추측으로 되돌아가는 일이다.
//
// 두 종류를 구분한다:
//   declared  — 계약 YAML의 report_semantics 블록. 사람이 근거와 함께 적었다.
//               row_grain이 선언되어 있어야 집계(REPORT_COMPOSED)에 쓸 수 있다.
//   derived   — 계약에서 자동 추출한 골격(컬럼 이름·파라미터). 무슨 열이 있는지는
//               알지만 그 열의 의미·grain은 모른다. **집계에 쓰지 않는다.**
//
// 자동 추출한 것을 근거 없이 확정하지 않는 것이 이 파일의 핵심 규칙이다(지시 33장).
import { listReports, reportDimensionNames } from '../reports/registry.js'
import { loadRegistry } from '../agentic-bi/app/semantic/registry.js'
import { norm } from './text.js'

export const SEMANTICS_SOURCE = { DECLARED: 'declared', DERIVED: 'derived' }

// 계약 파라미터 이름 → 글로벌 차원. 자동 추출 골격에서 pushdown 후보를 만드는 데 쓴다.
// reports/registry.js의 GENERIC_PARAMS와 같은 집합을 바라본다.
const PARAM_TO_GLOBAL_DIMENSION = {
  brand: 'brand', Brand: 'brand', sc_brand: 'brand',
  dealer_nm: 'dealer', DealerNm: 'dealer',
  group_name: 'showroom', GroupName: 'showroom',
  dept_nm: 'department', DeptNm: 'department',
  sc_name: 'sales_consultant', ScName: 'sales_consultant',
  active_yn: 'active_status', ActYn: 'active_status', ActiveYn: 'active_status',
}

let cache = null

export function clearReportSemanticsCache() {
  cache = null
}

/** @returns {Map<string, object>} report_id -> semantics */
export function loadReportSemantics({ force = false } = {}) {
  if (cache && !force) return cache
  const out = new Map()
  for (const report of listReports()) {
    out.set(report.report_id, buildSemantics(report))
  }
  cache = out
  return out
}

/**
 * 파라미터로만 받는 조건도 개념으로 찾을 수 있어야 한다.
 *
 * 딜러·브랜드·전시장은 출력 컬럼이 아니라 슬라이서라 columns에 없다. 그런데 사용자는
 * "렉서스 강남에서"라고 조건을 건다 — 그 개념을 못 찾으면 리포트가 딜러를 아는데도
 * "모르는 개념"이 되어 Schema RAG로 잘못 내려간다.
 *
 * 별칭은 글로벌 Dimension에서 가져온다. 같은 말을 두 곳에 적어 두면 갈라진다.
 */
function pushdownColumns(pushdown, declaredColumns) {
  const already = new Set(declaredColumns.map((c) => norm(c.concept)))
  let dimensions
  try {
    dimensions = loadRegistry().dimensions
  } catch {
    dimensions = new Map()
  }
  const out = []
  for (const [concept, entry] of Object.entries(pushdown)) {
    if (already.has(norm(concept))) continue
    const dim = dimensions.get(entry.global_dimension || concept)
    const aliases = new Set([concept, entry.global_dimension, dim?.label_ko, ...(dim?.query_aliases || [])].filter(Boolean))
    out.push({
      concept,
      label: dim?.label_ko || concept,
      role: 'dimension',
      filterable: true,
      aliases: [...aliases],
      global_dimension: entry.global_dimension || null,
      pushdown_parameter: entry.parameter,
      from_pushdown: true,
      physical: entry.physical || null,
      note: entry.note || null,
    })
  }
  return out
}

function buildSemantics(report) {
  const { contract } = report
  const declared = contract.report_semantics
  if (declared) {
    const pushdown = declared.pushdown || {}
    return {
      report_id: report.report_id,
      title: contract.title,
      source: SEMANTICS_SOURCE.DECLARED,
      composable: declared.composable !== false && Boolean(declared.row_grain?.unique_key),
      row_grain: declared.row_grain || null,
      columns: [
        ...(declared.columns || []).map((c) => ({ ...c, aliases: c.aliases || [c.label] })),
        ...pushdownColumns(pushdown, declared.columns || []),
      ],
      pushdown,
      limits: declared.composition_limits || {},
      output_columns: reportDimensionNames(contract),
    }
  }

  // ── 자동 추출 골격 ──
  // 계약이 이미 알려주는 것만 옮긴다. row_grain은 추출할 방법이 없으므로 null이고,
  // null이면 composable=false다 — 즉 이 리포트로는 새 집계를 만들지 않는다.
  const columns = []
  for (const label of reportDimensionNames(contract)) {
    columns.push({
      concept: null,
      label,
      role: 'unknown',
      filterable: false,
      aliases: [label],
      auto: true,
    })
  }
  for (const [label, sem] of Object.entries(contract.column_semantics || {})) {
    columns.push({
      concept: null,
      label,
      role: 'measure',
      filterable: false,
      aliases: [label],
      ratio_basis: sem?.ratio_basis || null,
      auto: true,
    })
  }

  const pushdown = {}
  for (const p of contract.parameters || []) {
    const dim = PARAM_TO_GLOBAL_DIMENSION[p.name]
    if (dim) pushdown[dim] = { parameter: p.name, global_dimension: dim, auto: true }
  }

  return {
    report_id: report.report_id,
    title: contract.title,
    source: SEMANTICS_SOURCE.DERIVED,
    composable: false,
    composable_blocked_by: 'row_grain 미선언 — 무엇을 한 건으로 셀지 근거가 없다',
    row_grain: null,
    columns,
    pushdown,
    limits: {},
    output_columns: reportDimensionNames(contract),
  }
}

const DEFAULT_MAX_ROWS = 20000

export function compositionLimits(semantics) {
  return { maxRowsFetched: semantics?.limits?.max_rows_fetched ?? DEFAULT_MAX_ROWS }
}

/** 개념 하나가 이 리포트의 어느 컬럼인지. 별칭·라벨·concept id를 모두 본다. */
export function matchColumn(semantics, concept) {
  const wanted = norm(concept)
  if (!wanted) return null
  for (const c of semantics.columns) {
    if (c.concept && norm(c.concept) === wanted) return c
    if (norm(c.label) === wanted) return c
    if ((c.aliases || []).some((a) => norm(a) === wanted)) return c
  }
  return null
}

/** 값까지 이 리포트가 아는가. known_values가 선언된 컬럼만 확정적으로 답할 수 있다. */
export function matchValue(column, value) {
  if (value == null) return { known: true, value: null }
  if (!column?.known_values?.length) return { known: null, value }   // 모른다 ≠ 없다
  const hit = column.known_values.find((v) => norm(v) === norm(value))
  return hit ? { known: true, value: hit } : { known: false, value, candidates: column.known_values }
}

/**
 * 요구된 개념들을 전부 제공하는 리포트를 찾는다(지시 8장).
 *
 * 값까지 요구된 개념은 그 리포트가 값을 아는지도 함께 본다 — 컬럼 이름만 맞고 값이
 * 다른 리포트를 고르면 오류 없이 0행이 나간다.
 *
 * @returns {Array<{report_id, title, semantics, coverage, score, unmatched, valueMismatch}>}
 */
export function findReportsCovering(concepts, { semanticsByReport = loadReportSemantics(), requireComposable = true } = {}) {
  const out = []
  for (const semantics of semanticsByReport.values()) {
    if (requireComposable && !semantics.composable) continue
    const coverage = []
    const unmatched = []
    const valueMismatch = []
    for (const c of concepts) {
      const column = matchColumn(semantics, c.concept)
      if (!column) { unmatched.push(c.concept); continue }
      if (c.value != null && column.filterable === false) {
        unmatched.push(c.concept)
        continue
      }
      const v = matchValue(column, c.value)
      if (v.known === false) { valueMismatch.push({ concept: c.concept, value: c.value, candidates: v.candidates }); continue }
      coverage.push({ concept: c.concept, column, matched_value: v.value, value_known: v.known })
    }
    if (unmatched.length || valueMismatch.length) {
      out.push({ report_id: semantics.report_id, title: semantics.title, semantics, coverage, unmatched, valueMismatch, score: coverage.length, complete: false })
      continue
    }
    // 선언된 의미로 덮은 개념이 많을수록, 자동 추출 컬럼에 의존하지 않을수록 좋다.
    const declaredHits = coverage.filter((c) => !c.column.auto).length
    out.push({
      report_id: semantics.report_id,
      title: semantics.title,
      semantics,
      coverage,
      unmatched: [],
      valueMismatch: [],
      score: coverage.length * 10 + declaredHits,
      complete: true,
    })
  }
  out.sort((a, b) => b.score - a.score || a.report_id.localeCompare(b.report_id))
  return out
}

/** 관측 가능성 trace에 그대로 싣는 요약. */
export function describeReportSemantics(semanticsByReport = loadReportSemantics()) {
  const all = [...semanticsByReport.values()]
  return {
    reports: all.length,
    declared: all.filter((s) => s.source === SEMANTICS_SOURCE.DECLARED).length,
    composable: all.filter((s) => s.composable).map((s) => s.report_id),
  }
}
