import { test } from 'node:test'
import assert from 'node:assert/strict'

import {
  normalizeRequirement, resolveTimeExpression, extractSemanticRequirement,
  cumulativeAsked, applyCumulativeWindow, AGGREGATION,
} from './requirement.js'
import { loadReportSemantics, findReportsCovering, matchColumn, matchValue } from './reportSemantics.js'
import {
  route, LEVEL, resolveGlobalDimension, entityForObject, entityForRequirement, certifiedMetricCandidates,
} from './resolutionRouter.js'
import {
  splitPredicates, applyResidualFilters, countAtRowGrain, groupAtRowGrain, cellDate, ComposeError,
} from './execute/reportComposed.js'
import { checkFidelity, CODE } from './validate/fidelityGate.js'
import { compileDynamicPlan } from './compile/dynamicCompiler.js'
import { chooseJoinMode, VERDICT } from './validate/probes.js'
import { runDynamicQuery, selectMetric, narrowByPeriodShape } from './index.js'
import { findInventedNumbers } from './render/htmlView.js'
import { valuesMentionedIn, findDroppedValues } from './valueDictionary.js'

const TODAY = '2026-08-12'
const QR_QUESTION = "렉서스 강남에서 2026년 7월에 출고된 건 중, 접수 유형이 'QR 접수'가 몇 건인지 확인해줘."

// LLM이 이 질문에서 뽑아야 할 요구. 실제 LLM 대신 이 값을 주입해 나머지 전 단계를
// 결정론적으로 검사한다 — 모델이 흔들려도 파이프라인 자체의 회귀는 여기서 잡힌다.
const QR_RAW_REQUIREMENT = {
  target_business_object: '영업기회',
  aggregation_intent: AGGREGATION.COUNT,
  conditions: [
    { concept: '딜러', operator: 'eq', value: '렉서스 강남' },
    { concept: '접수 유형', operator: 'eq', value: 'QR 접수' },
  ],
  group_by: [],
  time: { time_concept: '출고일', expression: '2026년 7월' },
}

function qrRequirement() {
  return normalizeRequirement(QR_RAW_REQUIREMENT, { question: QR_QUESTION, today: TODAY })
}

// ── 기간 해석 ────────────────────────────────────────────────────────────────

test('기간 표현은 코드가 결정론적으로 해석한다', () => {
  assert.deepEqual(resolveTimeExpression('2026년 7월', TODAY), { start: '2026-07-01', end: '2026-07-31', grain: 'month' })
  assert.deepEqual(resolveTimeExpression('2026년 2월', TODAY), { start: '2026-02-01', end: '2026-02-28', grain: 'month' })
  assert.deepEqual(resolveTimeExpression('이번 달', TODAY), { start: '2026-08-01', end: '2026-08-31', grain: 'month' })
  assert.deepEqual(resolveTimeExpression('지난달', TODAY), { start: '2026-07-01', end: '2026-07-31', grain: 'month' })
  assert.deepEqual(resolveTimeExpression('올해', TODAY), { start: '2026-01-01', end: '2026-12-31', grain: 'year' })
  // 아직 오지 않은 달은 작년으로 본다 — 8월에 "12월"은 지난 12월이다.
  assert.equal(resolveTimeExpression('12월', TODAY).start, '2025-12-01')
  // 해석하지 못하면 지어내지 않는다.
  assert.equal(resolveTimeExpression('요즘', TODAY), null)
})

test('요구에는 테이블·컬럼이 들어가지 않는다', () => {
  const r = qrRequirement()
  assert.equal(r.target_business_object, '영업기회')
  assert.deepEqual(r.conditions.map((c) => c.concept), ['딜러', '접수 유형'])
  assert.equal(r.time.start, '2026-07-01')
  assert.equal(r.time.end, '2026-07-31')
  assert.equal(JSON.stringify(r).includes('FCT_'), false)
})

// ── Report-local Semantics ───────────────────────────────────────────────────

test('lead_list는 선언된 row grain을 가지고 집계에 쓸 수 있다', () => {
  const s = loadReportSemantics().get('lead_list')
  assert.equal(s.source, 'declared')
  assert.equal(s.composable, true)
  assert.equal(s.row_grain.unique_key, 'lead_key')
  assert.equal(s.row_grain.counting.operation, 'count_rows')
})

test('선언되지 않은 리포트는 자동 추출 골격만 갖고, 집계에 쓰이지 않는다', () => {
  const all = loadReportSemantics()
  const derived = [...all.values()].filter((s) => s.source === 'derived')
  assert.ok(derived.length >= 20, '21개 리포트가 자동 추출 골격이어야 한다')
  for (const s of derived) {
    assert.equal(s.composable, false, `${s.report_id}는 row grain 미선언이라 집계 불가여야 한다`)
    assert.ok(s.output_columns.length > 0, `${s.report_id}의 출력 컬럼은 계약에서 자동 추출되어야 한다`)
  }
})

test('접수 유형과 그 값은 리포트가 안다 — 글로벌 카탈로그가 아니라', () => {
  const s = loadReportSemantics().get('lead_list')
  const col = matchColumn(s, '접수 유형')
  assert.equal(col.label, '접수 유형')
  assert.equal(col.role, 'categorical_attribute')
  assert.deepEqual(matchValue(col, 'QR 접수'), { known: true, value: 'QR 접수' })
  assert.equal(matchValue(col, '전화 접수').known, false)
  // 글로벌 Dimension에는 없다 — 그래서 이 계층이 필요하다.
  assert.equal(resolveGlobalDimension('접수 유형'), null)
})

test('요구한 개념을 모두 가진 리포트를 찾는다', () => {
  const hits = findReportsCovering([
    { concept: '딜러', value: '렉서스 강남' },
    { concept: '접수 유형', value: 'QR 접수' },
    { concept: '출고일', kind: 'time' },
  ])
  const best = hits.find((h) => h.complete)
  assert.equal(best.report_id, 'lead_list')
})

// ── 라우팅 ───────────────────────────────────────────────────────────────────

test('QR 접수 질문은 REPORT_COMPOSED로 간다 — Schema RAG가 아니라', () => {
  const routed = route(qrRequirement())
  assert.equal(routed.level, LEVEL.REPORT_COMPOSED)
  assert.equal(routed.report.report_id, 'lead_list')
  assert.equal(routed.unresolvedConcepts.length, 0)
})

test('등록 차원·등록 지표로 풀리는 질문은 기존 경로가 답한다', () => {
  const r = normalizeRequirement({
    target_business_object: '계약',
    aggregation_intent: AGGREGATION.COUNT,
    conditions: [{ concept: '딜러', operator: 'eq', value: '렉서스 강남' }],
    group_by: [],
    time: { time_concept: '계약일', expression: '2026년 7월' },
  }, { question: '2026년 7월 렉서스 강남 계약 건수', today: TODAY })
  const routed = route(r)
  assert.equal(routed.level, LEVEL.CERTIFIED_METRIC)
  assert.ok(routed.metricCandidates.length > 0)
})

test('"월별 계약실적"에 연누적 지표는 후보로도 오르지 않는다', () => {
  const r = normalizeRequirement({
    target_business_object: '계약',
    aggregation_intent: AGGREGATION.COUNT,
    conditions: [],
    group_by: ['월'],
    time: { expression: '올해' },
  }, { question: '월별 계약실적 보여줘', today: TODAY })
  const routed = route(r)
  const ids = (routed.metricCandidates || []).map((c) => c.metric_id)
  assert.ok(ids.length > 0, '월별로 낼 수 있는 지표는 있어야 한다')
  assert.ok(ids.every((id) => !id.includes('ytd')), `연누적 지표가 후보에 있으면 안 된다: ${ids.join(', ')}`)
})

test('리포트도 글로벌도 모르는 개념이라야 Schema Discovery로 내려간다', () => {
  const r = normalizeRequirement({
    target_business_object: '시승',
    aggregation_intent: AGGREGATION.COUNT,
    conditions: [{ concept: '시승 신청 경로', operator: 'eq', value: '카카오폼' }],
    group_by: [],
  }, { question: "시승 신청 경로가 '카카오폼'인 건수", today: TODAY })
  const routed = route(r)
  assert.equal(routed.level, LEVEL.DISCOVERED)
  assert.deepEqual(routed.unresolvedConcepts, ['시승 신청 경로'])
})

test('리포트가 아는 개념인데 값이 없으면 되묻는다 — 다른 값으로 바꾸지 않는다', () => {
  const r = normalizeRequirement({
    target_business_object: '영업기회',
    aggregation_intent: AGGREGATION.COUNT,
    conditions: [{ concept: '접수 유형', operator: 'eq', value: '전화 접수' }],
    group_by: [],
  }, { question: '전화 접수 건수', today: TODAY })
  const routed = route(r)
  assert.equal(routed.level, LEVEL.UNRESOLVED)
  assert.equal(routed.valueMismatch[0].value, '전화 접수')
  assert.ok(routed.valueMismatch[0].candidates.includes('QR 접수'))
})

// ── REPORT_COMPOSED 실행 ─────────────────────────────────────────────────────

test('내려보낼 조건과 행에서 걸 조건을 나눈다', () => {
  const requirement = qrRequirement()
  const routed = route(requirement)
  const { pushdown, residual, notes } = splitPredicates(requirement, routed.report.coverage, routed.report.semantics)

  // 딜러는 파라미터로 내려간다.
  assert.equal(pushdown.dealer_nm, '렉서스 강남')
  // 출고 여부는 내려가지만 기간은 못 내려간다 — 이 리포트에 출고일 기간 파라미터가 없다.
  assert.equal(pushdown.retail_yn, 'Y')
  assert.equal(pushdown.reg_from, undefined)

  const labels = residual.map((r) => r.label).sort()
  assert.deepEqual(labels, ['접수 유형', '출고일'])
  assert.ok(notes.some((n) => n.mode === 'residual' && n.why?.includes('기간 파라미터가 없다')))
})

test('행에서 거는 조건 — 날짜는 저장된 그대로 비교한다', () => {
  const rows = [
    { '출고일': new Date('2026-07-15T00:00:00Z'), '접수 유형': 'QR 접수' },
    { '출고일': new Date('2026-07-31T00:00:00Z'), '접수 유형': '수기 접수' },
    { '출고일': new Date('2026-08-01T00:00:00Z'), '접수 유형': 'QR 접수' },
    { '출고일': null, '접수 유형': 'QR 접수' },
  ]
  const { rows: out, applied } = applyResidualFilters(rows, [
    { label: '출고일', operator: 'between', values: ['2026-07-01', '2026-07-31'], role: 'date' },
    { label: '접수 유형', operator: 'eq', values: ['QR 접수'], role: 'categorical_attribute' },
  ])
  assert.equal(out.length, 1)
  assert.equal(applied[0].rows_after, 2)
  assert.equal(cellDate(new Date('2026-07-15T00:00:00Z')), '2026-07-15')
})

test('셈 방법은 계약이 선언한 것을 따른다 — COUNT(*)를 근거 없이 쓰지 않는다', () => {
  const grain = loadReportSemantics().get('lead_list').row_grain
  assert.equal(countAtRowGrain([{}, {}, {}], grain), 3)
  assert.throws(() => countAtRowGrain([{}], { entity: 'X' }), /근거가 없어/)
})

test('축별로 묶어 셀 수 있다', () => {
  const grain = loadReportSemantics().get('lead_list').row_grain
  const rows = [{ SC명: '김' }, { SC명: '김' }, { SC명: '이' }]
  assert.deepEqual(groupAtRowGrain(rows, ['SC명'], grain), [
    { 'SC명': '김', '건수': 2 },
    { 'SC명': '이', '건수': 1 },
  ])
})

// ── Fidelity Gate ────────────────────────────────────────────────────────────

test('요구한 조건이 빠지면 실행하지 않는다', () => {
  const r = qrRequirement()
  const f = checkFidelity(r, {
    aggregation: 'count_rows',
    applied_filters: [{ concept: '딜러', values: ['렉서스 강남'] }],   // 접수 유형이 빠졌다
    grouping: [],
    row_grain: { unique_key: 'lead_key' },
    requires_row_grain: true,
  })
  assert.equal(f.ok, false)
  assert.ok(f.violations.some((v) => v.code === CODE.MISSING_FILTER))
})

test('요구한 값이 다른 값으로 바뀌면 실행하지 않는다', () => {
  const r = qrRequirement()
  const f = checkFidelity(r, {
    aggregation: 'count_rows',
    applied_filters: [
      { concept: '딜러', values: ['렉서스 강남'] },
      { concept: '접수 유형', values: ['수기 접수'] },   // 조용한 대체
    ],
    grouping: [],
    row_grain: { unique_key: 'lead_key' },
    requires_row_grain: true,
  })
  assert.equal(f.ok, false)
  assert.ok(f.violations.some((v) => v.code === CODE.VALUE_SUBSTITUTED))
})

test('"강남" → "렉서스 강남" 같은 정규화는 막지 않는다', () => {
  const r = normalizeRequirement({
    target_business_object: '영업기회',
    aggregation_intent: AGGREGATION.COUNT,
    conditions: [{ concept: '딜러', operator: 'eq', value: '강남' }],
    group_by: [],
  }, { question: '강남 건수', today: TODAY })
  const f = checkFidelity(r, {
    aggregation: 'count_rows',
    applied_filters: [{ concept: '딜러', values: ['렉서스 강남'] }],
    grouping: [],
    row_grain: { unique_key: 'lead_key' },
    requires_row_grain: true,
  })
  assert.equal(f.ok, true)
})

test('기준 날짜가 바뀌면 실행하지 않는다 — 출고일을 계약일로 걸면 다른 숫자다', () => {
  const r = qrRequirement()
  const f = checkFidelity(r, {
    aggregation: 'count_rows',
    time_column_concept: '계약일',
    applied_filters: r.conditions.map((c) => ({ concept: c.concept, values: c.values })),
    grouping: [],
    row_grain: { unique_key: 'lead_key' },
    requires_row_grain: true,
  })
  assert.ok(f.violations.some((v) => v.code === CODE.TIME_ROLE_MISMATCH))
})

test('질문에서 읽은 기간과 계획의 기간이 다르면 실행하지 않는다', () => {
  const r = qrRequirement()
  const f = checkFidelity(r, {
    aggregation: 'count_rows',
    time_start: '2026-01-01',
    time_end: '2026-12-31',
    applied_filters: r.conditions.map((c) => ({ concept: c.concept, values: c.values })),
    grouping: [],
    row_grain: { unique_key: 'lead_key' },
    requires_row_grain: true,
  })
  assert.ok(f.violations.some((v) => v.code === CODE.TIME_RANGE_MISMATCH))
})

// ── 팬아웃 판단 ──────────────────────────────────────────────────────────────

test('팬아웃은 DISTINCT로 덮지 않고 EXISTS로 바꾼다', () => {
  const safe = chooseJoinMode({ verdict: VERDICT.SAFE, fanout_ratio: 1 }, 'filter')
  assert.equal(safe.mode, 'JOIN')

  const fanout = chooseJoinMode({ verdict: VERDICT.FANOUT, fanout_ratio: 5.15 }, 'filter')
  assert.equal(fanout.mode, 'EXISTS')

  // 값을 꺼내 써야 하는 조인이면 EXISTS로 못 바꾼다 — 조용히 DISTINCT를 넣지 않고 막는다.
  const blocked = chooseJoinMode({ verdict: VERDICT.FANOUT, fanout_ratio: 5.15 }, 'projection')
  assert.equal(blocked.mode, 'BLOCKED')
  assert.match(blocked.reason, /DISTINCT로 덮으면/)

  assert.equal(chooseJoinMode({ verdict: VERDICT.NO_MATCH }, 'filter').mode, 'BLOCKED')
})

// ── Dynamic Compiler ─────────────────────────────────────────────────────────

test('값은 전부 바인딩으로 나간다 — SQL에 리터럴이 박히지 않는다', () => {
  const { sql, params } = compileDynamicPlan({
    root_table: 'ktws.FCT_TESTDRIVE',
    measure: { operation: 'count_distinct', column: 'td_key' },
    time: { column: 'req_dt', start: '2026-07-01', end: '2026-07-31' },
    filters: [{ mode: 'direct', table: 'ktws.FCT_TESTDRIVE', column: 'req_path', operator: 'eq', values: ["카카오'폼"] }],
    group_by: [],
  })
  assert.match(sql, /^SELECT/)
  assert.match(sql, /COUNT\(DISTINCT \[FCT_TESTDRIVE\]\.\[td_key\]\)/)
  assert.equal(sql.includes('카카오'), false, '값이 SQL 문자열에 들어가면 안 된다')
  assert.equal(Object.values(params).find((p) => p.value === "카카오'폼").type, 'nvarchar')
  assert.equal(params.dp0.type, 'date')
})

test('팬아웃 나는 관계는 EXISTS로 컴파일된다', () => {
  const { sql } = compileDynamicPlan({
    root_table: 'ktws.FCT_CONTRACT_KTWS',
    measure: { operation: 'count', column: null },
    time: null,
    filters: [{
      mode: 'exists',
      table: 'ktws.FCT_ACTIVITY_v2',
      column: 'visit_type',
      operator: 'eq',
      values: ['QR 접수'],
      edge: { left_key: 'lead_key', right_key: 'lead_key' },
      extra: [{ column: 'act_tp', operator: 'in', values: ['P107', 'P108'] }],
    }],
    group_by: [],
  })
  assert.match(sql, /EXISTS \(SELECT 1 FROM \[ktws\]\.\[FCT_ACTIVITY_v2\]/)
  assert.equal(/INNER JOIN \[ktws\]\.\[FCT_ACTIVITY_v2\]/.test(sql), false)
})

test('식별자에 이상한 문자가 오면 컴파일하지 않는다', () => {
  assert.throws(() => compileDynamicPlan({
    root_table: 'ktws.FCT_X; DROP TABLE Y',
    measure: { operation: 'count' },
    filters: [],
    group_by: [],
  }), /허용되지 않은 식별자|테이블 이름 형식/)
})

// ── 종단 (Acceptance) ────────────────────────────────────────────────────────

const LEAD_ROWS = [
  // 강남 + 7월 출고 + QR → 세어야 할 2건
  { 'SC명': '진주영', '출고일': new Date('2026-07-10T00:00:00Z'), '접수 유형': 'QR 접수' },
  { 'SC명': '김건호', '출고일': new Date('2026-07-28T00:00:00Z'), '접수 유형': 'QR 접수' },
  // 7월이지만 수기 접수
  { 'SC명': '박종갑', '출고일': new Date('2026-07-11T00:00:00Z'), '접수 유형': '수기 접수' },
  // QR이지만 8월 출고
  { 'SC명': '이정수', '출고일': new Date('2026-08-03T00:00:00Z'), '접수 유형': 'QR 접수' },
  // 접수 유형이 비어 있는 행
  { 'SC명': '한필주', '출고일': new Date('2026-07-05T00:00:00Z'), '접수 유형': null },
]

function fakeDeps(rows = LEAD_ROWS, capture = {}) {
  return {
    llm: async ({ tools }) => {
      const name = tools[0].function.name
      if (name === 'set_semantic_requirement') return [{ name, args: QR_RAW_REQUIREMENT }]
      throw new Error(`이 테스트에서 부르면 안 되는 도구: ${name}`)
    },
    runReport: async (reportId, params) => {
      capture.reportId = reportId
      capture.params = params
      return { reportId, title: '영업기회 목록', rows, dimensionColumns: [], cached: false, fetchedAt: new Date().toISOString() }
    },
    // 값 정규화는 웨어하우스를 읽으므로 테스트에서는 원래 값을 그대로 쓴다.
    canonicalize: async () => null,
    runSql: async () => { throw new Error('REPORT_COMPOSED 경로는 SQL을 직접 실행하지 않는다') },
  }
}

test('Acceptance — QR 접수 질문이 전용 Metric/Dimension 없이 처리된다', async () => {
  const capture = {}
  const events = []
  const result = await runDynamicQuery(
    { question: QR_QUESTION, today: TODAY },
    { ...fakeDeps(LEAD_ROWS, capture), sendEvent: (e) => events.push(e) },
  )

  assert.equal(result.ok, true)
  assert.equal(result.level, LEVEL.REPORT_COMPOSED)
  assert.equal(result.value, 2)

  // 등록 리포트를 그대로 실행했고, 받아주는 조건만 내려보냈다.
  assert.equal(capture.reportId, 'lead_list')
  assert.equal(capture.params.dealer_nm, '렉서스 강남')
  assert.equal(capture.params.retail_yn, 'Y')

  // Trace가 provenance를 남긴다.
  const trace = result.trace
  assert.equal(trace.resolution_level, LEVEL.REPORT_COMPOSED)
  assert.equal(trace.source, 'lead_list')
  assert.equal(trace.discovered_schema_used, false, 'Schema RAG로 내려가면 안 된다')

  const executed = trace.stages.find((s) => s.name === 'executed')
  assert.equal(executed.stats.fetched, 5)
  assert.equal(executed.stats.after_filter, 2)
  assert.equal(executed.stats.row_grain.unique_key, 'lead_key')

  // Fidelity 게이트를 실제로 통과했다.
  assert.equal(trace.stages.find((s) => s.name === 'fidelity').ok, true)
})

test('Acceptance — 리포트가 모르는 값이면 숫자를 내지 않고 되묻는다', async () => {
  const events = []
  const result = await runDynamicQuery(
    { question: "접수 유형이 '전화 접수'인 건수", today: TODAY },
    {
      ...fakeDeps(),
      llm: async ({ tools }) => [{
        name: tools[0].function.name,
        args: {
          target_business_object: '영업기회',
          aggregation_intent: AGGREGATION.COUNT,
          conditions: [{ concept: '접수 유형', operator: 'eq', value: '전화 접수' }],
          group_by: [],
        },
      }],
      sendEvent: (e) => events.push(e),
    },
  )
  assert.equal(result.ok, false)
  assert.equal(result.unsupported, true)
  assert.match(result.message, /전화 접수/)
  assert.match(result.message, /QR 접수/)
  assert.equal(events.some((e) => e.type === 'result'), false, '숫자를 내보내면 안 된다')
})

// ── LEVEL 4: Schema Discovery ────────────────────────────────────────────────
// 이 경로는 하베스트된 메타데이터 인덱스가 있어야 돈다. 없으면 건너뛴다 —
// 인덱스 수집은 웨어하우스를 읽는 작업이라 CI에서 항상 있다고 가정할 수 없다.

import { existsSync } from 'node:fs'
import { loadMetadataIndex, indexPath, describeIndex } from './catalog/metadataIndex.js'
import { retrieveConcept, RESOLUTION as RETRIEVAL } from './retrieval/schemaRetriever.js'
import { buildDiscoveredPlan } from './discover.js'

const HAS_INDEX = existsSync(indexPath())

test('값으로 컬럼을 찾는다 — 이름으로는 못 찾는 컬럼도', { skip: !HAS_INDEX && '메타데이터 인덱스 없음' }, () => {
  const index = loadMetadataIndex()
  const r = retrieveConcept(index, { concept: '시승 신청 경로', value: '카카오폼', kind: 'filter' })
  assert.equal(r.resolution, RETRIEVAL.RESOLVED)
  assert.equal(r.selected.table, 'ktws.FCT_TESTDRIVE')
  assert.equal(r.selected.column, 'req_path')
  // 확정의 근거는 값이다 — 이름 유사도가 아니다.
  assert.ok(r.selected.evidence.some((e) => e.type === 'value_exact'))
})

test('값이 어디에도 없으면 가장 비슷한 컬럼으로 대체하지 않는다', { skip: !HAS_INDEX && '메타데이터 인덱스 없음' }, () => {
  const index = loadMetadataIndex()
  const r = retrieveConcept(index, { concept: '시승 신청 경로', value: '텔레파시', kind: 'filter' })
  assert.notEqual(r.resolution, RETRIEVAL.RESOLVED)
})

test('발견 경로는 유일 키 없이 조인이 붙으면 세지 않는다', { skip: !HAS_INDEX && '메타데이터 인덱스 없음' }, async () => {
  const index = loadMetadataIndex()
  // FCT_TESTDRIVE에는 유일 키가 없다 — 조인 없이 root 컬럼만 걸 때만 셀 수 있다.
  const built = await buildDiscoveredPlan(
    normalizeRequirement({
      target_business_object: '시승',
      aggregation_intent: AGGREGATION.COUNT,
      conditions: [{ concept: '시승 신청 경로', operator: 'eq', value: '카카오폼' }],
      group_by: [],
    }, { question: '카카오폼 시승 신청 건수', today: TODAY }),
    [{ concept: '시승 신청 경로', kind: 'filter', operator: 'eq', values: ['카카오폼'], value: '카카오폼' }],
    { index },
  )
  assert.equal(built.plan.root_table, 'ktws.FCT_TESTDRIVE')
  assert.equal(built.plan.measure.operation, 'count')
  assert.ok(built.provenance.grain.caveat, '무엇을 셌는지 유보를 반드시 남긴다')
  const { sql } = compileDynamicPlan(built.plan)
  assert.match(sql, /COUNT\(\*\) AS \[건수\]/)
  assert.equal(sql.includes('JOIN'), false)
})

test('메타데이터 인덱스는 큐레이션 테이블과 발견 테이블을 구분한다', { skip: !HAS_INDEX && '메타데이터 인덱스 없음' }, () => {
  const d = describeIndex(loadMetadataIndex())
  assert.ok(d.tables > d.curated_tables, '카탈로그 밖 테이블이 있어야 이 계층이 의미가 있다')
  assert.ok(d.value_profiled_columns > 0, '값 색인이 있어야 값으로 컬럼을 찾을 수 있다')
})

// ── 그림 검사 ────────────────────────────────────────────────────────────────

test('SVG 좌표를 지어낸 숫자로 세지 않는다', () => {
  const rows = [{ '접수 유형': '수기 접수', '건수': 137 }, { '접수 유형': 'QR 접수', '건수': 11 }]
  // 실제 모델 출력과 같은 모양 — 좌표는 속성에, 사람이 읽는 값은 <text> 안에 있다.
  const html = `<svg viewBox="0 0 400 260"><rect x="100" y="215.1" width="145" height="199.9"/>
    <text x="105" y="250">137</text><text x="260" y="250">11</text>
    <text x="20" y="100">200</text><text x="20" y="180">100</text></svg>
    <p>합계 148건</p>`
  assert.deepEqual(findInventedNumbers(html, rows), [], '좌표·축눈금·합계는 지어낸 수가 아니다')
})

test('사람이 읽는 자리에 있는 낯선 숫자는 잡는다', () => {
  const rows = [{ '접수 유형': 'QR 접수', '건수': 11 }]
  const html = '<p>전년 동기 <strong>1,284</strong>건 대비 늘었습니다.</p>'
  assert.deepEqual(findInventedNumbers(html, rows), ['1,284'])
})

// ── 이어서 묻기 ──────────────────────────────────────────────────────────────

test('이어 묻는 질문에 기간이 없으면 앞 턴의 기간을 잇는다', () => {
  const first = qrRequirement()
  const next = normalizeRequirement({
    target_business_object: '영업기회',
    aggregation_intent: AGGREGATION.COUNT,
    conditions: [
      { concept: '딜러', operator: 'eq', value: '렉서스 강남' },
      { concept: '접수 유형', operator: 'eq', value: '수기 접수' },
    ],
    group_by: [],
    // LLM이 기간을 안 실어 보냈다 — 사람은 앞의 기간을 그대로 말한 것이다.
  }, { question: '그럼 수기 접수는?', today: TODAY, previous: first })

  assert.equal(next.time.start, '2026-07-01')
  assert.equal(next.time.end, '2026-07-31')
  assert.equal(next.time.carried_over, true)
  assert.equal(next.carried_over[0].field, 'time')
  assert.equal(next.follows, QR_QUESTION)
})

test('이어 묻는 질문이 기간을 말했으면 앞 기간을 잇지 않는다', () => {
  const first = qrRequirement()
  const next = normalizeRequirement({
    target_business_object: '영업기회',
    aggregation_intent: AGGREGATION.COUNT,
    conditions: [{ concept: '딜러', operator: 'eq', value: '렉서스 강남' }],
    group_by: [],
    time: { time_concept: '출고일', expression: '8월' },
  }, { question: '8월은?', today: TODAY, previous: first })

  assert.equal(next.time.start, '2026-08-01')
  assert.equal(next.time.carried_over, undefined)
  assert.deepEqual(next.carried_over, [])
})

test('앞 요구를 모델에게 실제로 넘긴다 — 이어받을 근거가 프롬프트에 있어야 한다', async () => {
  const first = qrRequirement()
  let seen = null
  await extractSemanticRequirement({
    question: '그럼 수기 접수는?',
    today: TODAY,
    previous: first,
    llm: async (args) => {
      seen = args
      return [{ name: args.tools[0].function.name, args: { target_business_object: '영업기회', aggregation_intent: 'count', conditions: [] } }]
    },
  })
  assert.match(seen.user, /\[바로 앞 질문\]/)
  assert.match(seen.user, /QR 접수/)
  assert.match(seen.user, /\[이번 질문\]\n그럼 수기 접수는\?$/)
  assert.match(seen.system, /이어서 묻는 질문일 때/)
})

test('첫 질문에는 이어받기 규칙을 붙이지 않는다', async () => {
  let seen = null
  await extractSemanticRequirement({
    question: QR_QUESTION,
    today: TODAY,
    llm: async (args) => {
      seen = args
      return [{ name: args.tools[0].function.name, args: QR_RAW_REQUIREMENT }]
    },
  })
  assert.equal(seen.user, QR_QUESTION)
  assert.equal(/이어서 묻는 질문일 때/.test(seen.system), false)
})

test('이어받은 기간이 이번 질문과 어긋나면 실행을 막는다', () => {
  // 모델이 "8월은?"에 앞의 7월을 그대로 끌고 온 경우. 질문에서 코드가 직접 읽은
  // 기간(8월)과 계획(7월)이 달라 Fidelity 게이트가 잡는다.
  const first = qrRequirement()
  const wrong = normalizeRequirement({
    target_business_object: '영업기회',
    aggregation_intent: AGGREGATION.COUNT,
    conditions: [],
    group_by: [],
    time: { time_concept: '출고일', expression: '2026년 7월' },
  }, { question: '8월은?', today: TODAY, previous: first })

  const f = checkFidelity(wrong, {
    aggregation: 'count_rows',
    time_start: wrong.time.start,
    time_end: wrong.time.end,
    applied_filters: [],
    grouping: [],
    row_grain: { unique_key: 'lead_key' },
    requires_row_grain: true,
  })
  assert.equal(f.ok, false)
  assert.ok(f.violations.some((v) => v.code === CODE.TIME_RANGE_MISMATCH))
})

// ── 별(단위) vs 누적(창) ─────────────────────────────────────────────────────
//
// 이 둘을 섞으면 표는 같은 행 수로 나오고 값만 달라진다 — 사람이 눈으로 못 거른다.

function contractRequirement(question) {
  return normalizeRequirement(
    { target_business_object: '계약', aggregation_intent: AGGREGATION.COUNT, conditions: [], group_by: [] },
    { question, today: TODAY },
  )
}

test('"월별"·"연도별"은 단위이고 누적이 아니다', () => {
  assert.equal(contractRequirement('월별 계약실적').output_grain, 'month')
  assert.equal(contractRequirement('월별 계약실적').cumulative, false)
  assert.equal(contractRequirement('연도별 계약실적').output_grain, 'year')
  assert.equal(contractRequirement('연도별 계약실적').cumulative, false)
  assert.equal(contractRequirement('일별 계약실적').output_grain, 'day')
})

test('"연누적"은 연 누적이고 단위 요구가 아니다', () => {
  const r = contractRequirement('연누적 계약실적')
  assert.equal(r.cumulative, 'year')
  assert.equal(r.output_grain, null)
})

test('"월별 누적"은 단위(월)와 누적(연초부터)을 동시에 요구한 것이다', () => {
  const r = contractRequirement('월별 누적 계약실적')
  assert.equal(r.output_grain, 'month')
  // 달마다 한 줄이되 값은 연초부터의 누계다 — "월누적"(그 달 1일부터)과 다르다.
  assert.equal(r.cumulative, 'year')
})

test('MTD는 월누적이다 — 그 달 1일부터 지정일까지', () => {
  const r = contractRequirement('MTD 계약')
  assert.equal(r.cumulative, 'month')
  // "월별"(달마다 한 줄)이 아니라 한 구간의 누계다.
  assert.equal(r.output_grain, null)
})

test('"연도별"에 연누적 지표가 후보로 남지 않는다', () => {
  const ids = certifiedMetricCandidates(contractRequirement('연도별 계약실적')).map((c) => c.metric_id)
  assert.ok(ids.length > 0, '연도별로 낼 수 있는 지표는 있어야 한다')
  assert.ok(ids.every((id) => !id.includes('ytd')), `연누적 지표가 섞이면 안 된다: ${ids.join(', ')}`)
})

test('"연누적"에는 칸별 지표가 후보로 남지 않는다', () => {
  const ids = certifiedMetricCandidates(contractRequirement('연누적 계약실적')).map((c) => c.metric_id)
  assert.ok(ids.length > 0)
  assert.ok(ids.every((id) => id.includes('ytd')), `칸별 지표가 섞이면 안 된다: ${ids.join(', ')}`)
})

test('달을 나열하면 월 단위 요구로 읽고, 이동합계 지표를 배제한다', () => {
  const r = contractRequirement('계약을 1,2,3,4,5,6월 보여줘')
  assert.equal(r.output_grain, 'month')
  assert.equal(r.output_grain_source, 'month_enumeration')
  const ids = certifiedMetricCandidates(r).map((c) => c.metric_id)
  assert.ok(ids.length > 0)
  assert.ok(ids.every((id) => !id.includes('trailing')), `이동합계가 섞이면 안 된다: ${ids.join(', ')}`)
})

test('별을 요구했는데 누적 지표로 계획하면 실행을 막는다', () => {
  const r = contractRequirement('연도별 계약실적')
  const f = checkFidelity(r, { calculation_window: 'year_to_date', output_grain: 'year', grain_axis_present: true, grain_buckets: 3 })
  assert.equal(f.ok, false)
  assert.ok(f.violations.some((v) => v.code === CODE.CUMULATIVE_MISMATCH))
})

test('단위를 요구했는데 축이 빠지거나 기간이 한 칸이면 실행을 막는다', () => {
  const r = contractRequirement('월별 계약실적')
  const noAxis = checkFidelity(r, { output_grain: 'month', grain_axis_present: false, grain_buckets: 8, calculation_window: 'month_to_date' })
  assert.ok(noAxis.violations.some((v) => v.code === CODE.MISSING_GROUPING))

  const oneBucket = checkFidelity(r, {
    output_grain: 'month', grain_axis_present: true, grain_buckets: 1,
    calculation_window: 'month_to_date', time_start: '2026-07-01', time_end: '2026-07-31',
  })
  assert.ok(oneBucket.violations.some((v) => v.code === CODE.GRAIN_WINDOW_TOO_NARROW))
})

// ── 기간 표현 ────────────────────────────────────────────────────────────────

test('달 나열·범위를 한 달로 접지 않는다', () => {
  assert.deepEqual(resolveTimeExpression('1,2,3,4,5,6월', TODAY), { start: '2026-01-01', end: '2026-06-30', grain: 'month', implies_grain: 'month' })
  assert.deepEqual(resolveTimeExpression('1~6월', TODAY), { start: '2026-01-01', end: '2026-06-30', grain: 'month', implies_grain: 'month' })
  assert.equal(resolveTimeExpression('2026년 1~6월', TODAY).start, '2026-01-01')
  assert.equal(resolveTimeExpression('상반기', TODAY).end, '2026-06-30')
  assert.equal(resolveTimeExpression('2026년 하반기', TODAY).start, '2026-07-01')
  // 띄엄띄엄한 나열은 시작~끝 한 구간으로 표현할 수 없다 — 넓혀 답하지 않고 못 푼 것으로 둔다.
  assert.equal(resolveTimeExpression('1,3,5월', TODAY), null)
})

test('단위 축은 코드가 확정한다 — 기준 날짜를 축으로 주면 바꿔 놓는다', () => {
  const r = normalizeRequirement({
    target_business_object: '계약', aggregation_intent: AGGREGATION.COUNT, conditions: [],
    group_by: ['계약일'],   // 모델이 기준 날짜를 축으로 보냈다
    time: { time_concept: '계약일', expression: '올해' },
  }, { question: '월별 계약실적', today: TODAY })
  assert.deepEqual(r.group_by, ['월'])
  assert.ok(r.grain_axis_notes.some((n) => n.from === '계약일'))
})

// ── 값 사전 — 요구 추출이 흘린 조건 잡기 ────────────────────────────────────

test('질문에 통째로 들어 있는 값만 집어낸다', () => {
  const values = ['RX', 'RX350h', 'NX', 'ES']
  assert.deepEqual(valuesMentionedIn('RX350h 계약 보여줘', values), ['RX350h'], '더 긴 쪽이 사용자가 말한 것이다')
  assert.deepEqual(valuesMentionedIn('RX 모델 계약', values), ['RX'])
  assert.deepEqual(valuesMentionedIn('계약 건수 알려줘', values), [])
})

test('질문에 있는 값이 조건으로 안 걸렸으면 찾아낸다', async () => {
  const fakeQuery = async () => [{ v: 'RX' }, { v: 'NX' }, { v: 'ES' }]
  const dropped = await findDroppedValues('RX 모델 계약을 연누적으로 보여줘', [], {
    dimensions: ['vehicle_model'], query: fakeQuery,
  })
  assert.equal(dropped.length, 1)
  assert.equal(dropped[0].value, 'RX')

  // 이미 걸려 있으면 사라진 것이 아니다.
  const ok = await findDroppedValues('RX 모델 계약을 연누적으로 보여줘', [{ concept: '모델', values: ['RX'] }], {
    dimensions: ['vehicle_model'], query: fakeQuery,
  })
  assert.deepEqual(ok, [])
})

test('요구 추출이 조건을 흘리면 숫자를 내보내지 않는다', async () => {
  const events = []
  const result = await runDynamicQuery(
    { question: 'RX 모델 계약을 연누적으로 보여줘', today: TODAY },
    {
      // 모델이 조건을 통째로 빠뜨린 상황을 그대로 재현한다.
      llm: async ({ tools }) => [{
        name: tools[0].function.name,
        args: tools[0].function.name === 'set_semantic_requirement'
          ? { target_business_object: '계약', aggregation_intent: AGGREGATION.COUNT, conditions: [], group_by: [] }
          : { metric_id: 'contract_ytd_actual' },
      }],
      findDropped: async () => [{ dimension: 'vehicle_model', value: 'RX', label: '모델' }],
      runSql: async () => { throw new Error('실행되면 안 된다 — 조건이 빠진 계획이다') },
      sendEvent: (e) => events.push(e),
    },
  )
  assert.equal(result.ok, false)
  assert.equal(events.some((e) => e.type === 'result'), false, '숫자가 나가면 안 된다')
  const fidelity = result.trace.stages.find((s) => s.name === 'fidelity')
  assert.ok(fidelity.violations.some((v) => v.code === 'MISSING_FILTER' && v.detail.includes('RX')))
})

// ── 연누적 vs 월누적 ─────────────────────────────────────────────────────────
//
// 업무 정의(2026-08-12 확인):
//   연누적  1월 1일 ~ 지정된 월
//   월누적  지정된 월 1일 ~ 지정일
// 시작점이 다르면 같은 "7월 누적"이 전혀 다른 숫자가 된다.

test('누적은 연/월 두 종류로 갈린다', () => {
  assert.equal(cumulativeAsked('7월 연누적 계약', null), 'year')
  assert.equal(cumulativeAsked('7월 월누적 계약', null), 'month')
  assert.equal(cumulativeAsked('MTD 계약', null), 'month')
  assert.equal(cumulativeAsked('YTD 계약', null), 'year')
  // 맨 "누적"은 연초부터로 본다(기존 판정과 동일 — 평가 No.37).
  assert.equal(cumulativeAsked('월별 누적 계약', 'month'), 'year')
  assert.equal(cumulativeAsked('월별 계약', 'month'), false)
  assert.equal(cumulativeAsked('계약 건수', null), null)
})

test('누적의 시작점을 기간에 반영한다', () => {
  const july = { start: '2026-07-01', end: '2026-07-31' }
  assert.equal(applyCumulativeWindow('year', july).range.start, '2026-01-01', '연누적은 1월부터')
  assert.equal(applyCumulativeWindow('year', july).range.end, '2026-07-31', '끝은 그대로')
  assert.equal(applyCumulativeWindow('month', july).range.start, '2026-07-01', '월누적은 그 달 1일부터')
  // 이미 맞으면 손대지 않는다.
  assert.equal(applyCumulativeWindow('month', july).note, null)
  assert.equal(applyCumulativeWindow(false, july).range.start, '2026-07-01')
})

test('"7월 연누적"은 7월 한 달이 아니라 1~7월이다', () => {
  const r = normalizeRequirement({
    target_business_object: '계약', aggregation_intent: AGGREGATION.COUNT, conditions: [], group_by: [],
    time: { time_concept: '계약일', expression: '2026년 7월' },
  }, { question: '2026년 7월 연누적 계약 건수', today: TODAY })
  assert.equal(r.cumulative, 'year')
  assert.equal(r.time.start, '2026-01-01')
  assert.equal(r.time.end, '2026-07-31')
  // 질문에서 읽은 기간에도 같은 보정이 걸려야 게이트가 오탐하지 않는다.
  assert.equal(r.time_from_question.start, '2026-01-01')
})

test('"7월 월누적"은 7월 1일부터 7월까지다', () => {
  const r = normalizeRequirement({
    target_business_object: '계약', aggregation_intent: AGGREGATION.COUNT, conditions: [], group_by: [],
    time: { time_concept: '계약일', expression: '2026년 7월' },
  }, { question: '2026년 7월 월누적 계약 건수', today: TODAY })
  assert.equal(r.cumulative, 'month')
  assert.equal(r.time.start, '2026-07-01')
  assert.equal(r.time.end, '2026-07-31')
})

test('월누적에는 월 창 지표만, 연누적에는 연 창 지표만 후보로 남는다', () => {
  const monthly = certifiedMetricCandidates(contractRequirement('월누적 계약실적'))
  assert.ok(monthly.length > 0)
  assert.ok(monthly.every((c) => c.metric.semantic_signature.time.calculation_window === 'month_to_date'),
    `월누적에 다른 창이 섞이면 안 된다: ${monthly.map((c) => c.metric_id).join(', ')}`)

  const yearly = certifiedMetricCandidates(contractRequirement('연누적 계약실적'))
  assert.ok(yearly.length > 0)
  assert.ok(yearly.every((c) => c.metric.semantic_signature.time.calculation_window === 'year_to_date'))
})

test('누적 시작점이 틀린 계획은 실행하지 않는다', () => {
  const r = contractRequirement('7월 연누적 계약')
  const wrong = checkFidelity(r, {
    calculation_window: 'year_to_date', time_start: '2026-07-01', time_end: '2026-07-31', applied_filters: [],
  })
  assert.ok(wrong.violations.some((v) => v.code === CODE.CUMULATIVE_MISMATCH && v.detail.includes('1월 1일')))

  const right = checkFidelity(r, {
    calculation_window: 'year_to_date', time_start: '2026-01-01', time_end: '2026-07-31', applied_filters: [],
  })
  assert.equal(right.violations.some((v) => v.code === CODE.CUMULATIVE_MISMATCH), false)
})

test('월누적 계획이 달을 넘어가면 실행하지 않는다', () => {
  const r = contractRequirement('7월 월누적 계약')
  const f = checkFidelity(r, {
    calculation_window: 'month_to_date', time_start: '2026-01-01', time_end: '2026-07-31', applied_filters: [],
  })
  assert.ok(f.violations.some((v) => v.code === CODE.CUMULATIVE_MISMATCH && v.detail.includes('달을 넘어')))
})

// ── 지표 선택은 LLM이 하지 않는다 ────────────────────────────────────────────
//
// 후보가 갈리는 자리는 대개 업무적으로 큰 차이다 — 취소 포함/제외, 실적/목표.
// 근거가 있으면 코드가 정하고, 없으면 되묻는다.

function metricRequirement(question, expression = null) {
  return normalizeRequirement({
    target_business_object: '계약', aggregation_intent: AGGREGATION.COUNT, conditions: [], group_by: [],
    time: expression ? { time_concept: '계약일', expression } : undefined,
  }, { question, today: TODAY })
}

test('질문이 말한 측정 개념으로 후보를 좁힌다', () => {
  const pick = (q, expr) => {
    const r = metricRequirement(q, expr)
    return selectMetric(certifiedMetricCandidates(r), r).metric_id
  }
  assert.equal(pick('2026년 7월 계약 건수', '2026년 7월'), 'contract_mtd_actual', '근거가 없으면 실적이다')
  assert.equal(pick('2026년 7월 계약 목표', '2026년 7월'), 'contract_mtd_target')
  assert.equal(pick('2026년 7월 연누적 계약 건수', '2026년 7월'), 'contract_ytd_actual', '취소 포함본이 아니라 실적')
})

test('기간의 모양이 창을 가른다 — 한 달을 집어 말하면 그 달만 세는 지표다', () => {
  const r = metricRequirement('2026년 7월 계약 건수', '2026년 7월')
  const pool = certifiedMetricCandidates(r).filter((c) => c.metric.semantic_signature.measure.concept === 'actual')
  assert.ok(pool.length > 1, '좁히기 전에는 후보가 여럿이어야 의미 있는 검사다')
  const narrowed = narrowByPeriodShape(pool, r)
  assert.deepEqual(narrowed.map((c) => c.metric_id), ['contract_mtd_actual'])
})

test('근거 없이 후보가 여럿이면 고르지 않고 되묻는다', () => {
  // 기간을 말하지 않았다 — 당월인지 연누적인지 가릴 근거가 없다.
  const r = metricRequirement('계약 건수 알려줘')
  const candidates = certifiedMetricCandidates(r)
  assert.ok(candidates.length > 1)
  assert.throws(
    () => selectMetric(candidates, r),
    (err) => err.clarification === true && err.code === 'metric_ambiguous' && err.options.length > 1,
  )
})

test('지표 선택에 LLM을 부르지 않는다', async () => {
  let llmCalls = 0
  const result = await runDynamicQuery(
    { question: '2026년 7월 계약 건수', today: TODAY },
    {
      llm: async ({ tools }) => {
        llmCalls += 1
        assert.equal(tools[0].function.name, 'set_semantic_requirement', 'LLM은 요구 추출에만 쓰인다')
        return [{ name: tools[0].function.name, args: {
          target_business_object: '계약', aggregation_intent: AGGREGATION.COUNT, conditions: [], group_by: [],
          time: { time_concept: '계약일', expression: '2026년 7월' },
        } }]
      },
      findDropped: async () => [],
      runSql: async () => [{ contract_mtd_actual: 2488 }],
      sendEvent: () => {},
    },
  )
  assert.equal(result.ok, true)
  assert.equal(llmCalls, 1, '요구 추출 한 번뿐이어야 한다')
  const executed = result.trace.stages.find((s) => s.name === 'executed')
  assert.equal(executed.metric_id, 'contract_mtd_actual')
})

// ── 측정 한정어 vs 대상 ──────────────────────────────────────────────────────
//
// "취소"가 붙는 세 질문은 서로 다른 것을 센다. 실측(2026-07)으로 산술이 맞는다:
//   취소 제외 2,488 + 취소 282 = 취소 포함 2,770

test('측정 한정어는 조건이 아니라 지표를 고르는 말이다', () => {
  const r = normalizeRequirement({
    target_business_object: '계약', aggregation_intent: AGGREGATION.COUNT,
    conditions: [{ concept: '취소 포함', operator: 'eq', value: 'Y' }],   // 모델이 조건으로 보냈다
    group_by: [],
  }, { question: '2026년 7월 취소 포함 계약 건수', today: TODAY })

  assert.deepEqual(r.conditions, [], '조건에서 떼내야 한다')
  assert.equal(r.stripped_conditions[0].concept, '취소 포함')
  assert.equal(r.measure_qualifiers.include_cancelled, true)
})

test('"취소 포함"과 "취소 제외"는 서로 다른 지표다', () => {
  const pick = (q) => {
    const r = normalizeRequirement({
      target_business_object: '계약', aggregation_intent: AGGREGATION.COUNT, conditions: [], group_by: [],
      time: { time_concept: '계약일', expression: '2026년 7월' },
    }, { question: q, today: TODAY })
    return selectMetric(certifiedMetricCandidates(r), r).metric_id
  }
  assert.equal(pick('2026년 7월 취소 포함 계약 건수'), 'contract_mtd_total_including_cancelled')
  assert.equal(pick('2026년 7월 취소 제외 계약 건수'), 'contract_mtd_actual')
  assert.equal(pick('2026년 7월 계약 건수'), 'contract_mtd_actual')
})

test('"취소 계약 건수"는 계약이 아니라 취소를 센다', () => {
  const r = normalizeRequirement({
    target_business_object: '계약', aggregation_intent: AGGREGATION.COUNT, conditions: [], group_by: [],
    time: { time_concept: '계약일', expression: '2026년 7월' },
  }, { question: '2026년 7월 취소 계약 건수', today: TODAY })

  assert.equal(entityForRequirement(r), 'Cancellation')
  assert.equal(selectMetric(certifiedMetricCandidates(r), r).metric_id, 'contract_mtd_cancelled')
})

test('"취소 포함/제외"는 대상을 바꾸지 않는다 — 계약을 세되 취소 처리만 다르다', () => {
  for (const q of ['2026년 7월 취소 포함 계약 건수', '2026년 7월 취소 제외 계약 건수']) {
    const r = normalizeRequirement({
      target_business_object: '계약', aggregation_intent: AGGREGATION.COUNT, conditions: [], group_by: [],
    }, { question: q, today: TODAY })
    assert.equal(entityForRequirement(r), 'Contract', q)
  }
})
