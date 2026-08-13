// Requirement → Resolver → Fidelity Validator:
//   node --test backend/agentic-bi/semantic/fidelity.test.js
import { test, describe } from 'node:test'
import assert from 'node:assert/strict'

import { extractRequirement, isEmpty } from './requirement.js'
import { resolveMetric, satisfies, RESOLUTION } from './resolver.js'
import { validateFidelity, enforceSemanticFidelity } from './fidelity.js'
import { WINDOW, CONCEPT } from './signature.js'
import { loadRegistry } from '../app/semantic/registry.js'

describe('Requirement — 질문에서 요구만 뽑는다', () => {
  test('월별인데 누적이라는 말이 없으면 그 달만 센 값을 요구한 것이다', () => {
    const r = extractRequirement('2026년의 월별 판매 성취도를 보고 싶은데, 타겟과 실적, 달성률을 보여줘')
    assert.equal(r.time.output_grain, 'month')
    assert.equal(r.time.calculation_window, WINDOW.MONTH_TO_DATE)
  })

  test('"월별 누적"은 정상 요청이다 — 월 단위로 쪼갠 연누적', () => {
    // 이 둘을 한 필드로 뭉치면 표현 자체가 불가능해진다(평가 No.37).
    const r = extractRequirement('2026년 월별 누적 계약 건수를 보여줘')
    assert.equal(r.time.output_grain, 'month')
    assert.equal(r.time.calculation_window, WINDOW.YEAR_TO_DATE)
  })

  test('시간 표현이 없으면 시간 제약을 만들지 않는다', () => {
    const r = extractRequirement('계약 실적 알려줘')
    assert.equal(r.time.output_grain, null)
    assert.equal(r.time.calculation_window, null)
    // 시간에 대해선 아무 판단도 하지 않는다 — 남는 건 모집단 제약뿐이다.
    assert.deepEqual(r.constraints.map((c) => c.field), ['population.funnel_attributed'])
  })

  test('퍼널을 물었고 시간 표현도 없으면 제약이 하나도 없다', () => {
    assert.ok(isEmpty(extractRequirement('활동 퍼널 알려줘')), '근거가 없으면 이 레이어는 아무 판단도 하지 않아야 한다')
  })

  test('"취소 제외"는 취소 건수를 요구한 게 아니다', () => {
    const r = extractRequirement('취소 제외 계약 실적')
    assert.ok(!r.measures.some((m) => m.concept === CONCEPT.CANCELLED))
    assert.ok(extractRequirement('계약 취소 건수').measures.some((m) => m.concept === CONCEPT.CANCELLED))
  })

  test('비율·목표 요구를 읽는다', () => {
    const r = extractRequirement('목표 대비 달성률을 보여줘')
    assert.ok(r.measures.some((m) => m.concept === CONCEPT.RATE))
    assert.ok(r.measures.some((m) => m.concept === CONCEPT.TARGET))
  })
})

describe('Resolver — 바꿔야 할 지표를 결정론적으로 고른다', () => {
  const registry = loadRegistry({ force: true })

  test('연누적 지표를 월별 요구에 맞춰 월 지표로 바꾼다', () => {
    const req = extractRequirement('2026년 월별 계약 실적')
    const r = resolveMetric('contract_ytd_actual', req, registry)
    assert.equal(r.resolution, RESOLUTION.EXACT)
    assert.equal(r.metricId, 'contract_mtd_actual')
  })

  test('이미 맞는 지표는 건드리지 않는다', () => {
    const req = extractRequirement('2026년 월별 계약 실적')
    const r = resolveMetric('contract_mtd_actual', req, registry)
    assert.equal(r.resolution, RESOLUTION.EXACT)
    assert.equal(r.metricId, 'contract_mtd_actual')
  })

  test('같은 결과가 반복해서 나온다 — 후보가 여럿이어도 임의로 고르지 않는다', () => {
    const req = extractRequirement('2026년 월별 계약 목표')
    const picks = new Set()
    for (let i = 0; i < 5; i++) picks.add(resolveMetric('contract_ytd_target', req, registry).metricId)
    assert.equal(picks.size, 1, `실행마다 다른 지표를 골랐습니다: ${[...picks].join(', ')}`)
  })

  test('낼 수 있는 단위면 바꾸지 않는다 — 출력 단위는 능력이지 고정값이 아니다', () => {
    // supported_time_grains에 month가 있으면 기본값이 year라도 월별로 낼 수 있다.
    for (const [, m] of registry.metrics) {
      const s = m.semantic_signature
      if (s.time.supported_grains?.includes('month') && s.time.calculation_window === WINDOW.MONTH_TO_DATE) {
        assert.ok(satisfies(s, { time: { output_grain: 'month' } }), `${m.id}가 월별을 못 낸다고 판정됐습니다`)
      }
    }
  })

  test('대체할 등록 지표가 없으면 지어내지 않는다', () => {
    const r = resolveMetric('working_day_count_total', { time: { calculation_window: WINDOW.TRAILING } }, registry)
    assert.equal(r.resolution, RESOLUTION.UNRESOLVED)
    assert.equal(r.metricId, null)
  })
})

describe('모집단 — 누구를 세는가', () => {
  test('한 답 안에서 모집단이 섞이면 맞춘다', () => {
    // 2026-08-11 실측(평가 No.13): 4회 중 1회가 실적만 퍼널 기준으로 골랐다.
    // 타겟·취소는 아니어서 한 표 안에서 분자와 분모의 모집단이 달랐다.
    // 나머지 3회(인증 리포트 + contract_mtd_actual)는 값이 서로 같았다 — 그쪽이 GOLD다.
    const ir = { metrics: ['contract_mtd_activity_actual', 'contract_mtd_target', 'contract_mtd_cancelled'] }
    const { ir: next, repairs } = validateFidelity(ir, '2026년의 월별 판매 성취도를 보고 싶은데, 타겟, 실적, 취소, 달성률을 보고싶어')
    assert.deepEqual(next.metrics, ['contract_mtd_actual', 'contract_mtd_target', 'contract_mtd_cancelled'])
    assert.match(repairs[0].reason, /퍼널/)
  })

  test('지표가 하나뿐이면 건드리지 않는다 — 섞일 수가 없다', () => {
    // 2026-08-11 실측(평가 No.5): "계약건수"는 어느 쪽으로 읽어도 맞는 질문이라
    // GOLD가 당월활동실적 264와 당월전체실적 469를 **둘 다** 정답으로 둔다.
    // 넓은 지표로 되돌리면 둘 중 어느 것도 아닌 값이 나간다.
    const ir = { metrics: ['contract_mtd_activity_actual'] }
    const { ir: next, repairs } = validateFidelity(ir, '2026년 4월 렉서스강남 계약건수 알려줘')
    assert.deepEqual(next.metrics, ['contract_mtd_activity_actual'])
    assert.equal(repairs.length, 0)
  })

  test('전부 퍼널 지표면 건드리지 않는다 — 그것도 섞인 게 아니다', () => {
    const ir = { metrics: ['contract_mtd_activity_actual', 'contract_mtd_testdrive_actual'] }
    const { ir: next } = validateFidelity(ir, '2026년 4월 계약 건수')
    assert.deepEqual(next.metrics, ['contract_mtd_activity_actual', 'contract_mtd_testdrive_actual'])
  })

  test('퍼널을 물었으면 퍼널 지표를 그대로 둔다', () => {
    for (const q of ['2026년 4월 활동 퍼널 현황', '시승을 거친 계약 실적', '영업기회 기준 계약 건수']) {
      const { ir: next } = validateFidelity({ metrics: ['contract_mtd_activity_actual'] }, q)
      assert.deepEqual(next.metrics, ['contract_mtd_activity_actual'], `퍼널 근거가 있는데 바뀌었습니다: ${q}`)
    }
  })

  test('퍼널 귀속은 세 규칙을 모두 요구할 때만이다', () => {
    // br_qualified_lead_def 하나만 쓰는 lead_mtd_actual은 표준 영업기회 지표라
    // 좁은 모집단이 아니다 — 여기에 걸리면 주력 지표가 통째로 바뀐다.
    const { metrics } = loadRegistry({ force: true })
    assert.equal(metrics.get('lead_mtd_actual').semantic_signature.population.funnel_attributed, false)
    assert.equal(metrics.get('contract_mtd_activity_actual').semantic_signature.population.funnel_attributed, true)
    assert.equal(metrics.get('contract_mtd_actual').semantic_signature.population.funnel_attributed, false)
  })

  test('SC 단위 목표처럼 정상적인 제약 차이는 건드리지 않는다', () => {
    // delivery_mtd_target_sc는 delivery_mtd_target보다 제약이 많지만 모집단이 좁은 게
    // 아니라 단위가 다르다. "제약 적은 쪽 선호" 같은 규칙이면 여기서 값이 망가진다.
    const { ir: next } = validateFidelity({ metrics: ['delivery_mtd_target_sc'] }, '2026년 4월 출고 목표')
    assert.deepEqual(next.metrics, ['delivery_mtd_target_sc'])
  })
})

describe('Fidelity Validator — 실행 직전 방어', () => {
  test('월별을 물었는데 연누적 지표가 왔으면 교체한다', () => {
    const ir = { metrics: ['contract_ytd_actual', 'contract_ytd_target'], dimensions: ['month'] }
    const { ir: next, repairs } = validateFidelity(ir, '2026년 월별 계약 실적과 목표')
    assert.deepEqual(next.metrics, ['contract_mtd_actual', 'contract_mtd_target'])
    assert.equal(repairs.length, 2)
    assert.match(repairs[0].reason, /계산 창/)
  })

  test('"월별 누적"이면 연누적 지표를 그대로 둔다', () => {
    // 여기서 월 지표로 바꾸면 이 레이어가 정상 요청을 망가뜨린다.
    const ir = { metrics: ['contract_ytd_actual'] }
    const { ir: next, repairs } = validateFidelity(ir, '2026년 월별 누적 계약 실적')
    assert.deepEqual(next.metrics, ['contract_ytd_actual'])
    assert.equal(repairs.length, 0)
  })

  test('요구가 없으면 IR을 그대로 통과시킨다', () => {
    const ir = { metrics: ['contract_ytd_actual'] }
    const { ir: next, repairs, violations } = validateFidelity(ir, '계약 실적 알려줘')
    assert.equal(next, ir, '근거 없이 IR을 바꾸면 안 된다')
    assert.equal(repairs.length + violations.length, 0)
  })

  test('등록되지 않은 지표는 손대지 않는다 — 기존 경로가 처리한다', () => {
    const ir = { metrics: ['some_unregistered_metric'] }
    const { ir: next } = validateFidelity(ir, '2026년 월별 실적')
    assert.deepEqual(next.metrics, ['some_unregistered_metric'])
  })

  test('바꿀 수 없으면 그대로 실행하되 위반으로 남긴다', () => {
    const ir = { metrics: ['working_day_count_total'] }
    const { ir: next, violations } = validateFidelity(ir, '2026년 일별 영업일수')
    assert.deepEqual(next.metrics, ['working_day_count_total'], '대체가 없으면 지어내지 않는다')
    assert.equal(violations.length, 1)
    assert.equal(violations[0].strength, 'hard')
  })

  test('교체 사실을 화면에 알린다 — 조용히 바꾸면 안 된다', () => {
    const events = []
    enforceSemanticFidelity({ metrics: ['contract_ytd_actual'] }, '2026년 월별 계약 실적', (e) => events.push(e))
    assert.equal(events.length, 1)
    assert.match(events[0].label, /의미 검증/)
    assert.match(events[0].detail, /contract_ytd_actual → contract_mtd_actual/)
  })

  test('sendEvent 없이도 부를 수 있다 — 기존 정규화 함수들과 같은 서명', () => {
    // (ir, message, sendEvent = () => {}) — 이래야 호출 순서에 그냥 얹힌다.
    assert.deepEqual(enforceSemanticFidelity({ metrics: [] }, '월별 실적'), { metrics: [] })
    assert.deepEqual(enforceSemanticFidelity({ metrics: ['contract_ytd_actual'] }, '2026년 월별 계약 실적').metrics, ['contract_mtd_actual'])
  })
})
