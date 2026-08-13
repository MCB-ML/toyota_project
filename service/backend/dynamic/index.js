// Dynamic Semantic Query Planner — 오케스트레이터.
//
//   질문 → Semantic Requirement → Resolution Router → (계층별 실행) → Fidelity Gate → 결과
//
// LLM이 하는 일은 딱 두 가지다: 요구를 개념으로 옮겨 적는 것, 그리고 후보가 여럿일 때
// 등록 지표 중 하나를 고르는 것. SQL도, 조인도, 컬럼 선택도 LLM이 하지 않는다.
import { createLlmClient, missingConfigMessage } from '../llm/index.js'
import { streamAssistantTurn } from '../azureStream.js'
import { loadRegistry } from '../agentic-bi/app/semantic/registry.js'
import { compileSingleMetricQuery } from '../agentic-bi/app/semantic/compiler.js'
import { queryFabricWithTimeout, queryFabricCertified } from '../fabricClient.js'
import { executeReport } from '../reports/executor.js'
import { extractSemanticRequirement, AGGREGATION } from './requirement.js'
import { route, LEVEL, resolveGlobalDimension, entityForRequirement } from './resolutionRouter.js'
import { runReportComposed, ComposeError } from './execute/reportComposed.js'
import { buildDiscoveredPlan, DiscoveryError } from './discover.js'
import { compileDynamicPlan } from './compile/dynamicCompiler.js'
import { checkFidelity } from './validate/fidelityGate.js'
import { describeReportSemantics } from './reportSemantics.js'
import { createTrace } from './trace.js'
import { norm } from './text.js'
import { GRAIN_DIMENSION, bucketCount, widenForGrain, GRAIN_LABEL } from './timeGrain.js'
import { findDroppedValues } from './valueDictionary.js'

const FABRIC_DB = 'KPI_W'

export function todayISO(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** compiler.js의 @p0 placeholder를 리터럴로 굳힌다 — 기존 경로와 완전히 같은 방식. */
function materializeSql(sql, params) {
  return sql.replace(/@(p\d+)\b/g, (_, key) => {
    const value = params[key]
    if (typeof value === 'number') return String(value)
    return `N'${String(value).replace(/'/g, "''")}'`
  })
}

function makeLlm(client, model) {
  return async ({ system, user, tools, toolChoice }) => streamAssistantTurn(client, {
    model,
    messages: [{ role: 'system', content: system }, { role: 'user', content: user }],
    tools,
    toolChoice,
    temperature: 0,
  })
}

// ── LEVEL 3: 등록 지표 ────────────────────────────────────────────────────────
//
// **지표 선택에 LLM을 쓰지 않는다.** 후보가 여럿이면 그 차이는 대개 업무적으로 큰
// 것이다 — 취소 포함/제외, 실적/목표, 전체/퍼널 기준. 어느 쪽인지는 질문에 근거가
// 있을 때만 코드가 정하고, 없으면 되묻는다.
//
// 2026-08-12 실측: "2026년 7월 연누적 계약 건수"에 모델이
// contract_ytd_total_including_cancelled(취소 포함, 20,139)를 골랐다. 취소 제외
// 실적을 물은 사람은 그 차이를 화면에서 알 방법이 없다.

/** 질문이 요구한 측정 개념. 근거가 없으면 '실적'으로 본다. */
function requestedMeasureConcept(requirement) {
  const measures = requirement.legacy_constraints?.measures || []
  const has = (concept) => measures.some((m) => m.concept === concept)
  if (requirement.aggregation_intent === AGGREGATION.RATIO || has('rate')) return 'rate'
  if (has('target')) return 'target'
  // 한정어가 명시적이면 그것이 가장 강한 근거다. "취소 포함"과 "취소 제외"는
  // 서로 다른 지표를 가리킨다 — 공유 파서는 둘을 같게 보므로 여기서 가른다.
  if (requirement.measure_qualifiers?.include_cancelled) return 'cancelled'
  if (requirement.measure_qualifiers?.exclude_cancelled) return 'actual'
  if (has('cancelled')) return 'cancelled'
  return 'actual'
}

/**
 * 후보를 질문의 측정 개념으로 좁힌다.
 * 좁혔더니 하나도 안 남으면 좁히지 않은 목록을 돌려준다 — 근거로 전부를 날리지 않는다.
 */
export function narrowByMeasureConcept(candidates, requirement) {
  const wanted = requestedMeasureConcept(requirement)
  const narrowed = candidates.filter((c) => {
    const m = c.metric.semantic_signature.measure
    return wanted === 'rate' ? m.kind === 'ratio' : m.concept === wanted
  })
  return { wanted, candidates: narrowed.length ? narrowed : candidates }
}

/**
 * 질문이 말한 기간의 모양으로 좁힌다.
 *
 * "2026년 7월 계약 건수"에는 누적이라는 말이 없지만 **한 달을 콕 집어 말한 것**이
 * 근거다 — 그 달만 세는 지표가 맞고, 연누적을 쓰면 1~7월이 나간다.
 * 기간을 아예 말하지 않았으면 근거가 없으므로 좁히지 않는다(그때는 되묻는다).
 */
export function narrowByPeriodShape(pool, requirement) {
  const t = requirement.time
  if (!t?.start || !t?.end) return pool
  const months = bucketCount('month', t.start, t.end)
  let preferred = null
  if (months === 1) preferred = 'month_to_date'
  else if (t.start.endsWith('-01-01') && months >= 12) preferred = 'year_to_date'
  if (!preferred) return pool
  const hit = pool.filter((c) => c.metric.semantic_signature.time.calculation_window === preferred)
  return hit.length ? hit : pool
}

/** 쓸 지표를 정한다. 하나로 좁혀지지 않으면 고르지 않고 되묻는다. */
export function selectMetric(candidates, requirement) {
  const { wanted, candidates: narrowed } = narrowByMeasureConcept(candidates, requirement)
  const pool = narrowByPeriodShape(narrowed, requirement)
  if (pool.length === 1) {
    return { metric_id: pool[0].metric_id, why: `요구한 '${wanted}' 개념을 만족하는 등록 지표가 하나입니다.` }
  }
  const err = new Error(
    ['어느 기준으로 셀지 확인이 필요합니다. 아래 중 어느 것인가요?', ...pool.map((c) => `- ${c.name_ko}`)].join('\n')
  )
  err.clarification = true
  err.code = 'metric_ambiguous'
  err.options = pool.map((c) => c.name_ko)
  throw err
}

function buildMetricIr(requirement, metricId, registry) {
  const metric = registry.metrics.get(metricId)
  const window = metric?.semantic_signature?.time?.calculation_window || null
  const filters = []
  const applied = []
  for (const cond of requirement.conditions || []) {
    const hit = resolveGlobalDimension(cond.concept, registry)
    if (!hit) continue
    filters.push({ dimension: hit.id, operator: cond.operator === 'in' ? 'in' : cond.operator, values: cond.values })
    applied.push({ concept: cond.concept, values: cond.values })
  }

  const dimensions = []
  // 단위 축은 요구에서 확정된 것을 그대로 쓴다 — group_by 텍스트 해석에 다시 맡기지 않는다.
  if (requirement.output_grain) dimensions.push(GRAIN_DIMENSION[requirement.output_grain])
  for (const g of requirement.group_by || []) {
    const hit = resolveGlobalDimension(g, registry)
    if (hit && !dimensions.includes(hit.id)) dimensions.push(hit.id)
  }

  const notes = []
  let start = requirement.time?.start || null
  let end = requirement.time?.end || null

  // 단위를 요구했는데 기간이 한 칸뿐이면 묶어도 한 줄이다 — 요구한 추이가 사라진다.
  // 넓히되 임의로 넓히지 않고, 넓혔다는 사실을 남긴다.
  if (requirement.output_grain) {
    if (!start || !end) {
      // 기간을 말하지 않았다. 당월(mtd)로 떨어뜨리면 월별이 1행이 된다.
      const year = (requirement.today || '').slice(0, 4)
      start = `${year}-01-01`
      end = requirement.today
      notes.push(`${GRAIN_LABEL[requirement.output_grain]}을 요구했는데 기간을 말하지 않아 ${year}년 연초부터로 잡았습니다.`)
    }
    const widened = widenForGrain(requirement.output_grain, { start, end }, { today: requirement.today, question: requirement.question })
    if (widened) {
      start = widened.start
      end = widened.end
      notes.push(widened.reason)
    }
  }

  // 기간을 말하지 않았을 때의 기본값은 **지표의 창을 따른다.**
  // 연누적 지표에 당월(mtd) 창을 씌우면 8월만 센 값이 "2026 연누적"으로 나간다 —
  // 표는 한 줄로 멀쩡하고 값만 틀린다(2026-08-12 실측: 96, 실제 연누적은 그보다 훨씬 크다).
  let time
  if (start && end) {
    time = { type: 'absolute', start_date: start, end_date: end }
  } else if (requirement.cumulative === 'month') {
    time = { type: 'mtd' }
    notes.push('월누적이라 기간을 이번 달 1일부터로 잡았습니다.')
  } else if (requirement.cumulative === 'year' || window === 'year_to_date') {
    time = { type: 'ytd' }
    notes.push('연누적이라 기간을 연초부터로 잡았습니다.')
  } else {
    time = { type: 'mtd' }
  }
  return { ir: { metrics: [metricId], dimensions, filters, time_range: time }, applied, notes }
}

// ── 실행 ─────────────────────────────────────────────────────────────────────

/**
 * @param {object} input {question, history?: [{question, requirement}], modelId?, today?}
 * @param {object} deps  {sendEvent, llm?, runReport?, runSql?, accessContext?}
 */
export async function runDynamicQuery(input, deps = {}) {
  const sendEvent = deps.sendEvent || (() => {})
  const today = input.today || todayISO()
  const trace = createTrace({ question: input.question, today })

  const stage = (label) => sendEvent({ type: 'stage', stage: label, label })

  let llm = deps.llm
  if (!llm) {
    const made = createLlmClient(input.modelId)
    if (!made) {
      sendEvent({ type: 'error', message: missingConfigMessage(input.modelId) })
      return { ok: false, trace: trace.toJSON() }
    }
    llm = makeLlm(made.client, made.model)
  }

  // ── 1. 요구 추출 ──
  // 직전 턴의 요구를 함께 넘긴다 — "그럼 수기 접수는?"처럼 앞을 이어 말한 질문을
  // 처음부터 다시 해석하면 딜러·기간이 통째로 빠져 숫자가 달라진다.
  stage('요구 사항 파악 중...')
  const previous = Array.isArray(input.history) ? [...input.history].reverse().find((h) => h?.requirement)?.requirement || null : null
  const requirement = await extractSemanticRequirement({ question: input.question, today, llm, previous })
  trace.stage('semantic_requirement', { requirement })
  trace.requirement = requirement
  sendEvent({ type: 'debug', label: 'Semantic Requirement', detail: requirement })

  // ── 2. 라우팅 ──
  stage('어느 자산으로 답할지 정하는 중...')
  const routed = route(requirement)
  trace.stage('resolution', {
    level: routed.level,
    reason: routed.reason,
    report_candidates: routed.reportMatches.slice(0, 5).map((r) => ({ report_id: r.report_id, complete: r.complete, score: r.score, unmatched: r.unmatched })),
    global_matches: routed.globalMatches.map((m) => ({ concept: m.concept, dimension: m.global?.id || null })),
    unresolved_concepts: routed.unresolvedConcepts,
    catalog: describeReportSemantics(),
  })
  sendEvent({ type: 'debug', label: `해결 계층: ${routed.level}`, detail: { reason: routed.reason } })

  try {
    switch (routed.level) {
      case LEVEL.CERTIFIED_REPORT: return await runCertifiedReport({ requirement, routed, trace, sendEvent, deps })
      case LEVEL.REPORT_COMPOSED: return await runComposed({ requirement, routed, trace, sendEvent, deps })
      case LEVEL.CERTIFIED_METRIC: return await runCertifiedMetric({ requirement, routed, trace, sendEvent, deps })
      case LEVEL.DISCOVERED: return await runDiscovered({ requirement, routed, trace, sendEvent, deps })
      default: return unresolved({ routed, trace, sendEvent })
    }
  } catch (err) {
    if (err.clarification) {
      trace.resolve(LEVEL.UNRESOLVED, routed.level, {})
      trace.stage('clarification', { code: err.code, message: err.message })
      sendEvent({ type: 'text', text: err.message })
      if (err.options?.length) sendEvent({ type: 'text', text: `후보: ${err.options.join(' / ')}` })
      sendEvent({ type: 'trace', trace: trace.toJSON() })
      return { ok: false, clarification: true, message: err.message, trace: trace.toJSON() }
    }
    if (err instanceof ComposeError || err instanceof DiscoveryError) {
      trace.resolve(LEVEL.UNSUPPORTED, routed.level, {})
      trace.stage('blocked', { code: err.code, message: err.message })
      sendEvent({ type: 'text', text: `이 질문은 안전하게 답할 수 없습니다.\n${err.message}` })
      sendEvent({ type: 'trace', trace: trace.toJSON() })
      return { ok: false, unsupported: true, message: err.message, trace: trace.toJSON() }
    }
    throw err
  }
}

function unresolved({ routed, trace, sendEvent }) {
  trace.resolve(routed.level, null, {})
  trace.stage('unresolved', { reason: routed.reason, valueMismatch: routed.valueMismatch || null })
  let text = routed.reason
  if (routed.valueMismatch?.length) {
    text += '\n' + routed.valueMismatch
      .map((v) => `'${v.concept}'에 '${v.value}'는 없습니다. 있는 값: ${v.candidates.join(' / ')}`)
      .join('\n')
  }
  sendEvent({ type: 'text', text })
  sendEvent({ type: 'trace', trace: trace.toJSON() })
  return { ok: false, unsupported: true, message: text, trace: trace.toJSON() }
}

async function runCertifiedReport({ requirement, routed, trace, sendEvent, deps }) {
  const runReport = deps.runReport || executeReport
  const { semantics, coverage } = routed.report
  const params = {}
  for (const cond of requirement.conditions || []) {
    const hit = coverage.find((c) => norm(c.concept) === norm(cond.concept))
    const param = typeof hit?.column?.pushdown_parameter === 'string'
      ? hit.column.pushdown_parameter
      : semantics.pushdown?.[hit?.column?.concept]?.parameter
    if (param) params[param] = cond.values.join(',')
  }
  sendEvent({ type: 'stage', stage: 'execute', label: '등록 리포트 실행 중...' })
  const result = await runReport(semantics.report_id, params)
  trace.resolve(LEVEL.CERTIFIED_REPORT, semantics.report_id, {})
  trace.stage('executed', { report_id: semantics.report_id, params, rows: result.rows.length })
  sendEvent({ type: 'result', kind: 'table', title: result.title, columns: result.dimensionColumns, rows: result.rows.slice(0, 200) })
  sendEvent({ type: 'trace', trace: trace.toJSON() })
  return { ok: true, level: LEVEL.CERTIFIED_REPORT, rows: result.rows, trace: trace.toJSON() }
}

async function runComposed({ requirement, routed, trace, sendEvent, deps }) {
  sendEvent({ type: 'stage', stage: 'execute', label: '등록 리포트의 검증된 행집합 위에서 집계 중...' })
  const composed = await runReportComposed(requirement, routed, deps)

  // 실행 직전 대조. 여기서 막히면 숫자를 내보내지 않는다.
  const appliedFilters = composed.applied_filters
  const timeColumn = composed.residual.find((r) => r.role === 'date')
  const plan = {
    entity: entityForRequirement(requirement),
    aggregation: routed.report.semantics.row_grain?.counting?.operation || 'count_rows',
    time_column_concept: requirement.time?.time_concept || null,
    time_start: timeColumn?.values?.[0] || requirement.time?.start || null,
    time_end: timeColumn?.values?.[1] || requirement.time?.end || null,
    applied_filters: appliedFilters,
    // 축 이름은 요구('월')와 결과 컬럼('출고일(월별)')이 다르다 — 이름 대신
    // 아래 grain_axis_present로 그 축이 실제로 들어갔는지 본다.
    grouping: null,
    requires_row_grain: true,
    row_grain: routed.report.semantics.row_grain,
    output_grain: requirement.output_grain || null,
    grain_axis_present: !requirement.output_grain || composed.groupSpecs.some((g) => g.grain === requirement.output_grain),
    grain_buckets: requirement.output_grain && requirement.time?.start
      ? bucketCount(requirement.output_grain, requirement.time.start, requirement.time.end)
      : null,
  }
  // 리포트 경로는 리포트가 정의한 업무 객체를 센다 — 질문의 대상 개념과 리포트 엔티티가
  // 다를 수 있으므로(예: 출고된 "영업기회") 엔티티 비교는 하지 않는다.
  plan.entity = null

  const fidelity = checkFidelity(requirement, plan)
  trace.stage('fidelity', fidelity)
  if (!fidelity.ok) {
    const detail = fidelity.violations.map((v) => `- [${v.code}] ${v.detail}`).join('\n')
    trace.resolve(LEVEL.UNSUPPORTED, routed.report.report_id, {})
    sendEvent({ type: 'text', text: `계획이 질문과 어긋나 실행을 멈췄습니다.\n${detail}` })
    sendEvent({ type: 'trace', trace: trace.toJSON() })
    return { ok: false, unsupported: true, trace: trace.toJSON() }
  }

  trace.resolve(LEVEL.REPORT_COMPOSED, routed.report.report_id, { discovered: false })
  trace.stage('executed', {
    report_id: routed.report.report_id,
    pushdown: composed.params,
    residual: composed.residual,
    canonicalization: composed.canonicalization,
    stats: composed.stats,
    value: composed.value,
  })

  sendEvent({
    type: 'result',
    kind: composed.groupRows ? 'table' : 'value',
    title: `${routed.report.title} — 조건에 맞는 건수`,
    value: composed.value,
    rows: composed.groupRows || undefined,
    columns: composed.groupRows ? [...composed.groupLabels, '건수'] : undefined,
    provenance: {
      report_id: routed.report.report_id,
      row_grain: routed.report.semantics.row_grain,
      pushdown: composed.params,
      residual: composed.residual.map((r) => `${r.label} ${r.operator} ${r.values.join(' ~ ')}`),
      fetched: composed.stats.fetched,
      after_filter: composed.stats.after_filter,
    },
  })
  sendEvent({ type: 'trace', trace: trace.toJSON() })
  return { ok: true, level: LEVEL.REPORT_COMPOSED, value: composed.value, composed, trace: trace.toJSON() }
}

async function runCertifiedMetric({ requirement, routed, trace, sendEvent, deps }) {
  const registry = loadRegistry()
  const picked = selectMetric(routed.metricCandidates, requirement)
  const { ir, applied, notes } = buildMetricIr(requirement, picked.metric_id, registry)
  const metric = registry.metrics.get(picked.metric_id)
  const fidelityExtra = []
  
  for (const n of notes) sendEvent({ type: 'debug', label: '기간 보정', detail: n })

  const plan = {
    entity: metric.fact_entity,
    // 등록 지표의 SQL 집계함수(SUM/COUNT DISTINCT)는 질문의 "건수/합계"와 층이 다르다 —
    // 업무상 건수가 SUM(cnt)인 것은 정상이다. 대신 지표가 절대값인지 비율인지를 본다.
    aggregation: null,
    measure_kind: metric.semantic_signature?.measure?.kind || null,
    time_column_concept: requirement.time?.time_concept || null,
    time_start: ir.time_range.start_date || null,
    time_end: ir.time_range.end_date || null,
    applied_filters: applied,
    grouping: requirement.group_by || [],
    requires_row_grain: false,
    calculation_window: metric.semantic_signature?.time?.calculation_window || null,
    output_grain: requirement.output_grain || null,
    grain_axis_present: !requirement.output_grain || ir.dimensions.includes(GRAIN_DIMENSION[requirement.output_grain]),
    grain_buckets: requirement.output_grain && ir.time_range.type === 'absolute'
      ? bucketCount(requirement.output_grain, ir.time_range.start_date, ir.time_range.end_date)
      : null,
  }
  // 지표 자신의 시간 컬럼이 곧 기준 날짜다 — 개념 이름 비교는 의미가 없으므로 끈다.
  plan.time_column_concept = null
  // 축 이름 대조도 끈다 — 요구는 '월'이라 쓰고 IR은 time_month라 쓴다. 대신 아래
  // grain_axis_present로 "그 축이 실제로 들어갔는가"를 본다.
  plan.grouping = null

  // 요구 추출이 조건을 통째로 흘렸는지는 게이트가 못 본다 — 요구에 없으면 대조할
  // 것이 없기 때문이다. 그래서 질문 원문을 값 사전과 직접 맞춘다.
  // 2026-08-12 실측: "RX 모델 계약을 연누적으로" 3회 중 2회가 모델 조건을 빠뜨려
  // 전체 17,217을 RX 실적(1,931)인 것처럼 내보냈다.
  try {
    const dropped = await (deps.findDropped || findDroppedValues)(requirement.question, applied)
    for (const d of dropped) {
      fidelityExtra.push({ code: 'MISSING_FILTER', severity: 'hard',
        detail: `질문에 있는 ${d.label} '${d.value}'가 조건으로 걸리지 않았습니다.` })
    }
  } catch { /* 값 목록을 못 읽으면 이 검사만 건너뛴다 */ }

  const fidelity = checkFidelity(requirement, plan)
  fidelity.violations.push(...fidelityExtra)
  if (fidelityExtra.length) fidelity.ok = false
  trace.stage('fidelity', fidelity)
  if (!fidelity.ok) {
    const detail = fidelity.violations.map((v) => `- [${v.code}] ${v.detail}`).join('\n')
    trace.resolve(LEVEL.UNSUPPORTED, picked.metric_id, {})
    sendEvent({ type: 'text', text: `계획이 질문과 어긋나 실행을 멈췄습니다.\n${detail}` })
    sendEvent({ type: 'trace', trace: trace.toJSON() })
    return { ok: false, unsupported: true, trace: trace.toJSON() }
  }

  sendEvent({ type: 'stage', stage: 'execute', label: '등록 지표로 조회 중...' })
  const compiled = compileSingleMetricQuery(ir, { currentDate: requirement.today })
  const sql = materializeSql(compiled.sql, compiled.params)
  const runSql = deps.runSql || ((db, text) => queryFabricWithTimeout(db, text, 30000))
  const rows = await runSql(FABRIC_DB, sql)

  trace.resolve(LEVEL.CERTIFIED_METRIC, picked.metric_id, { discovered: false })
  trace.stage('executed', { metric_id: picked.metric_id, why: picked.why, ir, sql, rows: rows.length })
  sendEvent({
    type: 'result',
    kind: rows.length === 1 && !ir.dimensions.length ? 'value' : 'table',
    title: metric.name_ko,
    value: rows.length === 1 ? rows[0][picked.metric_id] : undefined,
    rows,
    provenance: { metric_id: picked.metric_id, sql },
  })
  sendEvent({ type: 'trace', trace: trace.toJSON() })
  return { ok: true, level: LEVEL.CERTIFIED_METRIC, rows, sql, trace: trace.toJSON() }
}

async function runDiscovered({ requirement, routed, trace, sendEvent, deps }) {
  sendEvent({ type: 'stage', stage: 'discover', label: '등록 자산에 없는 개념 — 스키마에서 찾는 중...' })
  const built = await buildDiscoveredPlan(requirement, routed.concepts, deps.discovery || {})
  trace.stage('discovery', built.provenance)
  sendEvent({ type: 'debug', label: '스키마 발견', detail: built.provenance })

  const plan = {
    entity: null,
    aggregation: built.plan.measure.operation,
    time_column_concept: null,
    time_start: built.plan.time?.start || null,
    time_end: built.plan.time?.end || null,
    applied_filters: built.plan.filters.map((f) => ({ concept: f.concept, values: f.values })),
    grouping: built.plan.group_by.map((g) => g.label),
    requires_row_grain: true,
    row_grain: built.provenance.grain,
  }
  const fidelity = checkFidelity(requirement, plan)
  trace.stage('fidelity', fidelity)
  if (!fidelity.ok) {
    const detail = fidelity.violations.map((v) => `- [${v.code}] ${v.detail}`).join('\n')
    trace.resolve(LEVEL.UNSUPPORTED, built.plan.root_table, { discovered: true })
    sendEvent({ type: 'text', text: `계획이 질문과 어긋나 실행을 멈췄습니다.\n${detail}` })
    sendEvent({ type: 'trace', trace: trace.toJSON() })
    return { ok: false, unsupported: true, trace: trace.toJSON() }
  }

  const compiled = compileDynamicPlan(built.plan)
  sendEvent({ type: 'stage', stage: 'execute', label: '검증된 계획으로 조회 중...' })
  const runSql = deps.runSqlBound || queryFabricCertified
  const rows = await runSql(FABRIC_DB, compiled.sql, compiled.params)

  trace.resolve(LEVEL.DISCOVERED, built.plan.root_table, { discovered: true })
  trace.stage('executed', { sql: compiled.sql, params: compiled.params, rows: rows.length })
  // 셈 단위에 유보가 있으면 숫자와 함께 말한다. 숫자만 내보내면 사용자는 그것이
  // 업무상의 "건수"라고 읽는다.
  if (built.provenance.grain.caveat) {
    sendEvent({ type: 'text', text: `⚠ ${built.provenance.grain.caveat}` })
  }
  sendEvent({
    type: 'result',
    kind: built.plan.group_by.length ? 'table' : 'value',
    title: `${requirement.target_business_object || '건수'}`,
    value: built.plan.group_by.length ? undefined : rows[0]?.['건수'],
    rows,
    provenance: { root_table: built.plan.root_table, grain: built.provenance.grain, sql: compiled.sql, joins: built.provenance.joins },
  })
  sendEvent({ type: 'trace', trace: trace.toJSON() })
  return { ok: true, level: LEVEL.DISCOVERED, rows, sql: compiled.sql, trace: trace.toJSON() }
}

export { LEVEL }
