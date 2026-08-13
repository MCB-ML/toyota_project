// Resolution Router — 요구를 **어느 지식 계층으로 푸는가**를 정한다(지시 3·13·14장).
//
// 계층과 신뢰 순서:
//   LEVEL 1  Certified Report / GOLD      이미 검증된 완성 자산
//   LEVEL 2  Report-local Semantics       리포트가 아는 컬럼·값·grain
//   LEVEL 3  Global Semantic Core         등록 Metric / Dimension / Ontology
//   LEVEL 4  Discovered Schema            Raw 스키마에서 런타임 발견
//
// 이 파일에서 가장 중요한 규칙 두 가지:
//
//   (a) **글로벌에서 못 찾았다고 곧바로 Schema RAG로 내려가지 않는다.**
//       리포트가 이미 아는 것을 Raw 스키마에서 다시 추측하는 것은 아는 것을 버리는 일이다.
//       "접수 유형"이 그 예다 — 글로벌 Dimension엔 없지만 lead_list 리포트는 안다.
//
//   (b) **등록 지표로 풀 수 있는 질문은 등록 지표로 푼다.**
//       "월별 계약실적"을 리포트 행에서 세면 기존과 다른 숫자가 나올 수 있다.
//       기존 정확도 계층이 덮는 질문은 계속 그 계층이 답한다.
import { loadRegistry } from '../agentic-bi/app/semantic/registry.js'
import { satisfies } from '../agentic-bi/semantic/resolver.js'
import { findReportsCovering, loadReportSemantics } from './reportSemantics.js'
import { AGGREGATION } from './requirement.js'
import { norm } from './text.js'
import { grainOfConcept } from './timeGrain.js'

export const LEVEL = {
  CERTIFIED_REPORT: 'CERTIFIED_REPORT',
  REPORT_COMPOSED: 'REPORT_COMPOSED',
  CERTIFIED_METRIC: 'CERTIFIED_METRIC',
  SEMANTIC_COMPOSED: 'SEMANTIC_COMPOSED',
  DISCOVERED: 'DISCOVERED',
  UNRESOLVED: 'UNRESOLVED',
  UNSUPPORTED: 'UNSUPPORTED',
}

/** 요구에서 해석해야 할 개념을 모은다. 개념만 — 컬럼 이름은 아직 없다. */
export function conceptsRequired(requirement) {
  const out = []
  for (const c of requirement.conditions || []) {
    out.push({ concept: c.concept, operator: c.operator, values: c.values, value: c.values?.[0] ?? null, kind: 'filter' })
  }
  for (const g of requirement.group_by || []) {
    // 단위 축('월'·'일자')은 리포트에 그런 이름의 컬럼이 없다. 기준 날짜 컬럼을
    // 그 단위로 잘라 쓰므로, 여기서 컬럼을 요구하면 멀쩡한 리포트가 탈락한다.
    if (grainOfConcept(g) && grainOfConcept(g) === requirement.output_grain) continue
    out.push({ concept: g, kind: 'dimension', value: null })
  }
  if (requirement.time?.time_concept) {
    out.push({ concept: requirement.time.time_concept, kind: 'time', value: null })
  }
  return out
}

// ── LEVEL 3: 글로벌 Semantic Core ────────────────────────────────────────────

/** 개념 이름이 등록 Dimension인가. id / label_ko / query_aliases 를 본다. */
export function resolveGlobalDimension(concept, registry = loadRegistry()) {
  const wanted = norm(concept)
  if (!wanted) return null
  for (const [id, d] of registry.dimensions) {
    if (norm(id) === wanted) return { id, dimension: d }
    if (d.label_ko && norm(d.label_ko) === wanted) return { id, dimension: d }
    if ((d.query_aliases || []).some((a) => norm(a) === wanted)) return { id, dimension: d }
  }
  return null
}

// 질문의 대상 개념 → 지표의 fact_entity. 지표 후보를 좁히는 데만 쓴다.
const OBJECT_TO_ENTITY = [
  [/출고|판매|리테일/, 'Delivery'],
  [/계약/, 'Contract'],
  [/영업기회|리드|기회/, 'Lead'],
  [/시승/, 'TestDrive'],
  [/활동|상담/, 'Activity'],
]

export function entityForObject(targetObject) {
  const text = String(targetObject || '')
  for (const [re, entity] of OBJECT_TO_ENTITY) if (re.test(text)) return entity
  return null
}

/**
 * 이 요구가 무엇을 세는가.
 *
 * "취소 계약 건수"는 계약이 아니라 **취소**를 센다. 실제 취소 건수 지표는
 * fact_entity가 Cancellation이라, 대상을 Contract로 보면 후보에 아예 못 들어온다 —
 * 그러면 "취소 포함 전체 건수"(달성률 분자 전용)가 대신 걸려 전혀 다른 숫자가 나간다
 * (2026-08-12 실측: 2,770 vs 실제 취소 건수).
 *
 * 단 "취소 포함"·"취소 제외"는 다르다. 그건 계약을 세되 취소를 어떻게 처리할지를
 * 말한 한정어다 — 대상은 여전히 계약이다.
 */
export function entityForRequirement(requirement) {
  const q = String(requirement?.question || '')
  const qualifier = requirement?.measure_qualifiers || {}
  if (/취소/.test(q) && !qualifier.include_cancelled && !qualifier.exclude_cancelled) {
    return 'Cancellation'
  }
  return entityForObject(requirement?.target_business_object)
}

/**
 * 요구를 만족할 수 있는 등록 지표 후보.
 * 시간 제약(월별/누적)은 여기서 이미 걸러진다 — 기존 satisfies()를 그대로 쓴다(지시 31장).
 */
export function certifiedMetricCandidates(requirement, registry = loadRegistry()) {
  const entity = entityForRequirement(requirement)
  if (!entity) return []
  const legacy = requirement.legacy_constraints
  const out = []
  for (const [id, m] of registry.metrics) {
    if (m.fact_entity !== entity) continue
    if (m.status === 'unresolved' || m.expression === 'unresolved') continue
    if (m.not_directly_compilable) continue
    if (!satisfies(m.semantic_signature, legacy)) continue
    if (!windowMatchesCumulative(m.semantic_signature, requirement.cumulative)) continue
    out.push({ metric_id: id, name_ko: m.name_ko, metric: m })
  }
  return out
}

// 그 칸만 세는 지표가 아닌 창들. year_to_date는 연초부터 쌓고, trailing은 최근 N개월을
// 굴린다 — 둘 다 "연도별/월별"이 요구한 '그 칸만'이 아니다.
const NOT_PER_BUCKET = new Set(['year_to_date', 'trailing'])

/**
 * 별/누적 요구와 지표의 창이 맞는가.
 *
 * satisfies()는 창을 **같은 값인지**로만 본다. 그래서 "연도별"처럼 창을 특정하지 않는
 * 요구에는 아무 제약이 안 걸려 연누적 지표가 그대로 후보로 남았다(2026-08-12 실측:
 * "연도별 계약실적" 후보에 contract_ytd_actual 포함). 여기서 그 구멍을 막는다.
 *
 * 후보를 **덜어내기만** 한다 — 없던 후보를 만들지 않으므로 기존 판정을 뒤집지 않는다.
 */
export function windowMatchesCumulative(signature, cumulative) {
  if (cumulative == null) return true
  const w = signature?.time?.calculation_window
  if (!w) return true
  if (cumulative === 'year') return w === 'year_to_date'
  if (cumulative === 'month') return w === 'month_to_date'
  return !NOT_PER_BUCKET.has(w)   // false = 칸별
}

/**
 * 요구를 라우팅한다.
 *
 * @returns {{level, reason, report?, metricCandidates?, unresolvedConcepts, globalMatches, reportMatches}}
 */
export function route(requirement, {
  registry = loadRegistry(),
  semanticsByReport = loadReportSemantics(),
} = {}) {
  const concepts = conceptsRequired(requirement)

  // 각 개념이 글로벌에 있는가 / 어느 리포트에 있는가를 먼저 전부 조사한다.
  // 한 계층이 실패했다고 바로 다음으로 떨어뜨리지 않기 위해서다.
  const globalMatches = concepts.map((c) => ({
    concept: c.concept,
    kind: c.kind,
    global: resolveGlobalDimension(c.concept, registry),
  }))
  const globalUnresolved = globalMatches.filter((m) => !m.global && m.kind !== 'time').map((m) => m.concept)

  const reportMatches = findReportsCovering(concepts, { semanticsByReport })
  const bestReport = reportMatches.find((r) => r.complete) || null

  // ── 목록을 달라고 했으면 리포트를 그대로 내보내는 것이 맞다(LEVEL 1) ──
  if (requirement.aggregation_intent === AGGREGATION.LIST && bestReport) {
    return {
      level: LEVEL.CERTIFIED_REPORT,
      reason: `요구한 개념을 모두 가진 등록 리포트가 있고, 질문이 목록을 요구했습니다.`,
      report: bestReport,
      concepts,
      globalMatches,
      reportMatches,
      unresolvedConcepts: [],
    }
  }

  // ── LEVEL 3 우선 판정 ──
  // 모든 개념이 등록 Dimension이고 요구를 만족하는 등록 지표가 있으면 기존 경로가 답한다.
  // 여기서 리포트로 새로 세면 기존과 다른 숫자가 나올 수 있다.
  const metricCandidates = certifiedMetricCandidates(requirement, registry)
  if (!globalUnresolved.length && metricCandidates.length) {
    return {
      level: LEVEL.CERTIFIED_METRIC,
      reason: '요구한 개념이 모두 등록 차원이고, 요구를 만족하는 등록 지표가 있습니다.',
      metricCandidates,
      concepts,
      globalMatches,
      reportMatches,
      unresolvedConcepts: [],
    }
  }

  // ── LEVEL 2 ──
  // 글로벌이 못 덮는 개념이 있다. 그 개념을 이미 아는 리포트가 있으면 그걸 쓴다.
  if (bestReport) {
    return {
      level: LEVEL.REPORT_COMPOSED,
      reason: `'${globalUnresolved.join(', ') || '일부 개념'}'은 등록 차원이 아니지만 `
        + `리포트 '${bestReport.report_id}'가 이미 아는 개념입니다.`,
      report: bestReport,
      metricCandidates,
      concepts,
      globalMatches,
      reportMatches,
      unresolvedConcepts: [],
    }
  }

  // 값이 리포트의 known_values와 어긋난 경우는 "모른다"가 아니라 "그 값이 없다"이다.
  // Schema RAG로 내려보내지 않고 되묻는다 — 조용히 다른 값으로 바꾸지 않기 위해서다.
  const mismatch = reportMatches.find((r) => r.valueMismatch.length && !r.unmatched.length)
  if (mismatch) {
    return {
      level: LEVEL.UNRESOLVED,
      reason: `리포트 '${mismatch.report_id}'가 그 개념을 알지만 요청한 값이 목록에 없습니다.`,
      valueMismatch: mismatch.valueMismatch,
      concepts,
      globalMatches,
      reportMatches,
      unresolvedConcepts: [],
    }
  }

  // ── LEVEL 4로 내려가기 전 마지막 확인 ──
  // 리포트도 글로벌도 모르는 개념만 남았을 때에만 Schema Discovery로 간다(지시 14장).
  const knownByReport = new Set()
  for (const r of reportMatches) for (const c of r.coverage) knownByReport.add(norm(c.concept))
  const trulyUnknown = concepts
    .filter((c) => c.kind !== 'time')
    .filter((c) => !resolveGlobalDimension(c.concept, registry))
    .filter((c) => !knownByReport.has(norm(c.concept)))
    .map((c) => c.concept)

  if (!trulyUnknown.length) {
    // 개념은 다 알려져 있는데 한 리포트가 전부 갖고 있지는 않다.
    // 여러 리포트를 가로질러 조합하는 것은 grain이 달라 위험하다 — 아직 지원하지 않는다.
    return {
      level: LEVEL.UNSUPPORTED,
      reason: '요구한 개념들이 서로 다른 리포트에 흩어져 있습니다. 여러 리포트를 가로지르는 조합은 grain이 달라 아직 지원하지 않습니다.',
      concepts,
      globalMatches,
      reportMatches,
      unresolvedConcepts: [],
    }
  }

  return {
    level: LEVEL.DISCOVERED,
    reason: `'${trulyUnknown.join(', ')}'은 등록 리포트·등록 차원 어디에도 없습니다. 스키마에서 찾아봅니다.`,
    concepts,
    globalMatches,
    reportMatches,
    unresolvedConcepts: trulyUnknown,
  }
}
