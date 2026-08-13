// IR 보정 규칙 — 질문에 근거가 있을 때만 서버가 채우거나 고친다:
//   node --test backend/irNormalize.test.js
import { test, describe } from 'node:test'
import assert from 'node:assert/strict'

import {
  ensureTemporalDimension, widenTimeRangeForTrend, addSiblingMetricsNamedInQuestion, preferMonthlyMetrics,
} from './agenticBiPipeline.js'

describe('시간 축 보정', () => {
  test('"월별"인데 time_month가 없으면 채운다', () => {
    const ir = { metrics: ['activity_mtd_actual'], dimensions: ['activity_group'] }
    const out = ensureTemporalDimension(ir, '2026년 월별 활동 트렌드 보여줘')
    assert.deepEqual(out.dimensions, ['time_month', 'activity_group'])
  })

  test('이미 있으면 그대로 둔다', () => {
    const ir = { metrics: ['activity_mtd_actual'], dimensions: ['time_month'] }
    assert.equal(ensureTemporalDimension(ir, '월별로 보여줘'), ir)
  })

  test('시간 표현이 없으면 손대지 않는다', () => {
    const ir = { metrics: ['activity_mtd_actual'], dimensions: ['dealer'] }
    assert.equal(ensureTemporalDimension(ir, '딜러별 활동 실적'), ir)
  })

  test('지표가 그 축을 지원하지 않으면 넣지 않는다 — 검증에서 막히면 답 자체가 실패한다', () => {
    const ir = { metrics: ['contract_ytd_actual'], dimensions: [] }   // time_month 미지원
    assert.equal(ensureTemporalDimension(ir, '월별 계약 보여줘'), ir)
  })
})

describe('기간 보정 — 월별 추이인데 기간이 한 달인 모순', () => {
  test('질문에 연도가 있으면 그 해 전체로 넓힌다', () => {
    const ir = { time_grain: 'month', time_range: { type: 'mtd' } }
    const out = widenTimeRangeForTrend(ir, '2026년 김승진의 월별 활동 트렌드')
    assert.deepEqual(out.time_range, { type: 'absolute', start_date: '2026-01-01', end_date: '2026-12-31' })
  })

  test('연도가 없으면 연초부터로 넓힌다', () => {
    const ir = { time_grain: 'month', time_range: { type: 'mtd' } }
    assert.deepEqual(widenTimeRangeForTrend(ir, '월별 활동 트렌드').time_range, { type: 'ytd' })
  })

  test('월 단위 추이가 아니면 손대지 않는다 — 당월 한 건을 묻는 질문을 넓히면 안 된다', () => {
    const day = { time_grain: 'day', time_range: { type: 'mtd' } }
    assert.equal(widenTimeRangeForTrend(day, '이번 달 일별 추이'), day)
    const noGrain = { time_range: { type: 'mtd' } }
    assert.equal(widenTimeRangeForTrend(noGrain, '이번 달 실적'), noGrain)
  })

  test('기간이 이미 넓으면 그대로 둔다', () => {
    const ir = { time_grain: 'month', time_range: { type: 'ytd' } }
    assert.equal(widenTimeRangeForTrend(ir, '2026년 월별 추이'), ir)
  })
})

describe('형제 지표 보완', () => {
  test('질문에 이름이 있는 형제 지표를 채운다', () => {
    const ir = { metrics: ['delivery_ytd_pma_in'] }
    const out = addSiblingMetricsNamedInQuestion(ir, '2025년 12월 렉서스 부산의 PMA IN과 PMA OUT 건수를 알려줘')
    assert.deepEqual(out.metrics, ['delivery_ytd_pma_in', 'delivery_ytd_pma_out'])
  })

  test('질문에 이름이 없으면 늘리지 않는다 — 막연한 말로 지표가 붙으면 안 된다', () => {
    const ir = { metrics: ['delivery_ytd_pma_in'] }
    assert.equal(addSiblingMetricsNamedInQuestion(ir, 'PMA IN 건수 알려줘').metrics.length, 1)
    assert.equal(addSiblingMetricsNamedInQuestion(ir, '출고 실적도 같이 보여줘').metrics.length, 1)
  })

  test('이미 둘 다 골랐으면 중복으로 넣지 않는다', () => {
    const ir = { metrics: ['delivery_ytd_pma_in', 'delivery_ytd_pma_out'] }
    assert.equal(addSiblingMetricsNamedInQuestion(ir, 'PMA IN과 PMA OUT').metrics.length, 2)
  })

  test('지표가 없으면 그대로', () => {
    const ir = { metrics: [] }
    assert.equal(addSiblingMetricsNamedInQuestion(ir, 'PMA IN과 PMA OUT'), ir)
  })
})

describe('월별 추이에는 월 지표를 쓴다', () => {
  test('"월별"인데 연누적 지표를 골랐으면 월 지표로 바꾼다', () => {
    // 2026-08-11 실측(평가 No.13): 10회 중 2회가 contract_ytd_*를 골랐다. 4월 달성률이
    // 월 기준 0.29인데 연누적 기준 0.80 — 표는 8행으로 똑같이 나와 눈으로는 안 걸린다.
    const ir = { metrics: ['contract_ytd_actual', 'contract_ytd_target'] }
    const out = preferMonthlyMetrics(ir, '2026년의 월별 판매 성취도 — 타겟, 실적, 취소, 달성률')
    assert.deepEqual(out.metrics, ['contract_mtd_actual', 'contract_mtd_target'])
  })

  test('"누적"이라고 쓴 질문은 건드리지 않는다 — 연간 누적을 월별로 보는 건 정상 요청이다', () => {
    const ir = { metrics: ['contract_ytd_actual'] }
    assert.equal(preferMonthlyMetrics(ir, '2026년 김승진의 연간 누적 계약을 월별로'), ir)
    assert.equal(preferMonthlyMetrics(ir, '월별 연누적 출고 추이'), ir)
  })

  test('"월별"이 없으면 손대지 않는다', () => {
    const ir = { metrics: ['contract_ytd_actual'] }
    assert.equal(preferMonthlyMetrics(ir, '2026년 계약 실적 알려줘'), ir)
  })

  test('월 지표가 없는 연누적 지표는 그대로 둔다 — 없는 지표로 바꾸면 실행이 실패한다', () => {
    const ir = { metrics: ['delivery_ytd_pma_in'] }
    assert.equal(preferMonthlyMetrics(ir, '월별 PMA IN 추이'), ir)
  })
})
