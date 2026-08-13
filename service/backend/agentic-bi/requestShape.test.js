// Agentic BI request-shape guardrails:
//   node --test server/agentic-bi/requestShape.test.js
import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import {
  appendMentionedProjectionDimensions,
  applyKpiBundleIntent,
  applyMetricSelectionOverrides,
  applyTimeIntent,
  buildIrFromToolArgs,
  normalizeTemporalFilters,
} from '../agenticBiPipeline.js'
import { loadRegistry } from './app/semantic/registry.js'
import { detectAmbiguousSubject } from './ambiguityGuard.js'

const registry = loadRegistry()

function activityKpiIr(extra = {}) {
  return buildIrFromToolArgs({
    metric_ids: ['activity_mtd_actual', 'activity_mtd_target', 'activity_progress_rate_mtd'],
    dimension_id: 'none',
    dimension_ids: [],
    time_range_type: 'absolute',
    absolute_start_date: '2026-04-01',
    absolute_end_date: '2026-04-30',
    chart_type: 'auto',
    ...extra,
  })
}

describe('요청 문구의 시간 표현과 KPI 카드 형태', () => {
  // 2026-08-04 leo: 기존에는 모델이 "계약 진행률"을 계약 달성률로 골라 취소 포함 계약 건수를 분자로 사용했다. YAML 선언으로 PBIX 계약 퍼널 분자/계약 목표 지표로 바뀌는지 검증한다.
  test('계약 진행률 요청은 선언된 용어 보정으로 퍼널 계약 기준 진행률을 선택한다', () => {
    const selectedAchievement = buildIrFromToolArgs({
      metric_ids: ['contract_mtd_achievement_rate'],
      dimension_id: 'none',
      dimension_ids: [],
      time_range_type: 'absolute',
      absolute_start_date: '2026-04-01',
      absolute_end_date: '2026-04-30',
      chart_type: 'auto',
    })
    const ir = applyMetricSelectionOverrides('2026년 4월 계약 진행률을 보여줘', selectedAchievement, registry)

    assert.deepEqual(ir.metrics, ['contract_progress_rate_mtd'])
    const metric = registry.metrics.get(ir.metrics[0])
    assert.equal(metric.numerator_metric, 'contract_mtd_progress_actual_funnel')
    assert.equal(metric.denominator_metric, 'contract_mtd_target')
  })

  test('계약 달성률 요청은 용어 보정 대상이 아니므로 기존 취소 포함 계약 기준을 유지한다', () => {
    const selectedAchievement = buildIrFromToolArgs({
      metric_ids: ['contract_mtd_achievement_rate'],
      dimension_id: 'none',
      dimension_ids: [],
      time_range_type: 'absolute',
      absolute_start_date: '2026-04-01',
      absolute_end_date: '2026-04-30',
      chart_type: 'auto',
    })
    const ir = applyMetricSelectionOverrides('2026년 4월 계약 달성률을 보여줘', selectedAchievement, registry)

    assert.deepEqual(ir.metrics, ['contract_mtd_achievement_rate'])
  })

  // 2026-08-03 leo: 기존에는 시승 KPI 요청이 단일 실적 IR로 남아 요약 카드가 불완전했다. 선언형 KPI 묶음이 실적·목표·진행률을 모두 보완하는지 검증한다.
  test('시승 KPI 요약 요청은 LLM이 실적 하나만 골라도 선언된 목표·진척률을 함께 보완한다', () => {
    const message = '2026년 4월 시승 실적, 목표, 진행률 kpi 요약 카드 만들어줘'
    const onlyActual = buildIrFromToolArgs({
      metric_ids: ['testdrive_mtd_actual'],
      dimension_id: 'none',
      dimension_ids: [],
      time_range_type: 'absolute',
      absolute_start_date: '2026-04-01',
      absolute_end_date: '2026-04-30',
      chart_type: 'auto',
    })
    const ir = applyKpiBundleIntent(message, onlyActual, registry)

    assert.deepEqual(ir.metrics, [
      'testdrive_mtd_actual',
      'testdrive_mtd_target',
      'testdrive_progress_rate_mtd',
    ])
    assert.equal(ir.intent, 'compare_metric')
  })

  test('절대 기간의 년/월은 KPI 요청을 월별 차트로 바꾸지 않는다', () => {
    const message = '2026년 4월 영업 활동 실적, 목표, 진행률 을 kpi 요약 카드로 만들어줘'
    const ir = appendMentionedProjectionDimensions(message, applyTimeIntent(message, activityKpiIr()), registry)

    assert.deepEqual(ir.dimensions, [])
    assert.deepEqual(ir.object_filter_dimensions, [])
    assert.equal(ir.intent, 'compare_metric')
  })

  test('LLM이 날짜 리터럴 때문에 시간 차원을 골라도 명시적 분해 의도가 없으면 제거한다', () => {
    const message = '2026년 4월 영업 활동 실적, 목표, 진행률 을 kpi 요약 카드로 만들어줘'
    const ir = appendMentionedProjectionDimensions(
      message,
      activityKpiIr({ dimension_ids: ['time_year', 'time_month'] }),
      registry
    )

    assert.deepEqual(ir.dimensions, [])
  })

  test('월 필터 요청은 저장 객체 필터로 쓸 수 있게 time_month를 유지한다', () => {
    const message = '영업 활동 실적, 목표, 진행률 표를 만들고 월 필터도 붙여줘'
    const ir = appendMentionedProjectionDimensions(message, activityKpiIr(), registry)

    assert.ok(ir.dimensions.includes('time_month'))
    assert.ok(ir.object_filter_dimensions.includes('time_month'))
  })

  test('월별 요청은 시간축 요청으로 남긴다', () => {
    const message = '2026년 영업 활동 실적, 목표, 진행률을 월별로 보여줘'
    const ir = appendMentionedProjectionDimensions(message, applyTimeIntent(message, activityKpiIr()), registry)

    assert.ok(ir.dimensions.includes('time_month'))
    assert.equal(ir.intent, 'trend_over_time')
  })
})

describe('추이 질문의 시간 grain', () => {
  function trendIr(extra = {}) {
    return buildIrFromToolArgs({
      metric_ids: ['activity_mtd_actual'],
      dimension_id: 'time_month',
      time_range_type: 'absolute',
      absolute_start_date: '2026-01-01',
      absolute_end_date: '2026-12-31',
      chart_type: 'line',
      ...extra,
    })
  }
  const dims = (message, extra) => appendMentionedProjectionDimensions(message, trendIr(extra), registry).dimensions

  test('"월별 추이"는 월만 남긴다 — 일자까지 붙으면 선 그래프가 12점이 아니라 215점이 된다', () => {
    assert.deepEqual(dims('2026년 월별 활동실적 추이를 선 그래프로 보여줘'), ['time_month'])
  })

  test('질문이 grain을 명시하면 그 grain만 쓴다', () => {
    assert.deepEqual(dims('2026년 일별 활동실적 추이'), ['time_day'])
    assert.deepEqual(dims('2026년 연도별 활동실적 추이'), ['time_year'])
  })

  test('grain을 안 밝힌 추이는 월로 본다 — 시간축은 있어야 추이가 성립한다', () => {
    assert.deepEqual(dims('2026년 활동실적 변화 보여줘'), ['time_month'])
    assert.deepEqual(dims('2026년 활동실적 추이', { dimension_id: 'none' }), ['time_month'])
  })

  test('차원이 교체돼도 반영된다 — 개수만 비교하면 조용히 버려진다', () => {
    // time_month 1개 → time_day 1개. 길이가 같아 예전에는 원본 IR이 그대로 돌아갔다.
    const ir = trendIr()
    const next = appendMentionedProjectionDimensions('2026년 일별 활동실적 추이', ir, registry)
    assert.notEqual(next, ir, '변경이 반영되지 않고 원본 IR이 그대로 돌아왔다')
    assert.deepEqual(next.dimensions, ['time_day'])
  })
})

describe('추이 의도 인식', () => {
  function ir(dimension_id = 'none') {
    return buildIrFromToolArgs({
      metric_ids: ['activity_mtd_actual'],
      dimension_id,
      time_range_type: 'absolute',
      absolute_start_date: '2026-01-01',
      absolute_end_date: '2026-12-31',
      chart_type: 'auto',
    })
  }
  const dims = (message) => appendMentionedProjectionDimensions(message, ir(), registry).dimensions

  test('명사형이 아닌 추이 표현도 시간축을 붙인다', () => {
    // "어떻게 변했는지"가 안 걸려서 "올해 계약이 어떻게 변했는지"에 누적값 하나만 답했다.
    for (const message of [
      '올해 활동실적 어떻게 변했는지 보여줘',
      '올해 활동실적 흐름 보여줘',
      '올해 활동실적 증감 보여줘',
      '올해 활동실적 추세 보여줘',
      '올해 활동실적 변동 보여줘',
    ]) {
      assert.deepEqual(dims(message), ['time_month'], message)
    }
  })

  test('추이 표현이 없으면 시간축을 붙이지 않는다 — KPI 카드가 차트로 바뀌면 안 된다', () => {
    assert.deepEqual(dims('2026년 4월 활동실적 알려줘'), [])
    assert.deepEqual(dims('2026년 4월 활동실적 kpi 카드로 만들어줘'), [])
  })
})

describe('대상이 빠진 "목표/실적" 되묻기', () => {
  // "4월 목표 알려줘"는 계약·출고·활동·기회 중 무엇인지 정할 수 없다. LLM에 맡기면
  // 실행마다 다른 것을 골라 같은 질문에 다른 답이 나갔다(2026-08-03 하네스에서 확인).
  test('대상이 없으면 되묻는다', () => {
    for (const message of [
      '2026년 4월 목표 알려줘',
      '4월 실적 현황 보여줘',
      '올해 목표 얼마야',
      '2026년 4월 목표를 딜러별로 보여줘',
    ]) {
      const hit = detectAmbiguousSubject(message)
      assert.ok(hit, `되물어야 하는데 통과시켰다: ${message}`)
      assert.ok(hit.options.length >= 3, message)
    }
  })

  test('선택지는 원래 문장에 대상만 끼워 넣는다 — 기간·필터가 유지된다', () => {
    const hit = detectAmbiguousSubject('2026년 4월 목표를 딜러별로 보여줘')
    for (const option of hit.options) {
      assert.match(option, /2026년 4월/, option)
      assert.match(option, /딜러별로 보여줘/, option)
    }
    assert.ok(hit.options.includes('2026년 4월 계약 목표를 딜러별로 보여줘'))
  })

  test('대상이 있으면 되묻지 않는다', () => {
    for (const message of [
      '2026년 4월 계약 목표 알려줘',
      '2026년 4월 출고 목표 알려줘',
      '2026년 4월 활동실적 알려줘',
      '2026년 4월 기회 실적 알려줘',
      '2026년 4월 시승 실적 알려줘',
    ]) {
      assert.equal(detectAmbiguousSubject(message), null, `잘못 되물었다: ${message}`)
    }
  })

  test('화면·리포트 이름을 물으면 되묻지 않는다', () => {
    // '목표 관리', '목표 저장 현황'은 등록된 리포트 이름이지 모호한 요청이 아니다.
    for (const message of [
      '2026년 4월 목표 관리 표 보여줘',
      '2026년 4월 목표 저장 현황 보여줘',
      '2026년 4월 판매 성취도 보여줘',
      '2026년 4월 퍼널 전체 지표 보여줘',
      '2026년 4월에 등록된 영업기회 명세 목록을 뽑아줘',
    ]) {
      assert.equal(detectAmbiguousSubject(message), null, `잘못 되물었다: ${message}`)
    }
  })

  test('되묻기 선택지는 그 자체로 다시 물으면 통과한다 — 무한 되묻기가 안 된다', () => {
    const hit = detectAmbiguousSubject('2026년 4월 목표 알려줘')
    for (const option of hit.options) {
      assert.equal(detectAmbiguousSubject(option), null, `선택지가 또 되묻힌다: ${option}`)
    }
  })
})

describe('기간을 필터로 표현한 IR 정규화', () => {
  const ir = (filters, timeRange = { type: 'mtd' }) => ({
    metrics: ['contract_mtd_activity_actual'], dimensions: [], filters, time_range: timeRange,
  })
  const f = (dimension, ...values) => ({ dimension, operator: 'in', values })

  test('연·월 필터는 기간으로 옮긴다', () => {
    // 그대로 두면 전용 컴파일러가 DIM_CALENDAR_KTWS를 조인하지 않아
    // "multi-part identifier ... could not be bound"로 답이 통째로 빈다.
    const r = normalizeTemporalFilters(ir([f('dealer', '렉서스 강남'), f('time_year', '2026'), f('time_month', '4')]))
    assert.deepEqual(r.time_range, { type: 'absolute', start_date: '2026-04-01', end_date: '2026-04-30' })
    assert.deepEqual(r.filters.map((x) => x.dimension), ['dealer'])
  })

  test('연만 주면 그 해 전체', () => {
    const r = normalizeTemporalFilters(ir([f('time_year', '2026')]))
    assert.deepEqual(r.time_range, { type: 'absolute', start_date: '2026-01-01', end_date: '2026-12-31' })
  })

  test('일까지 주면 그 하루', () => {
    const r = normalizeTemporalFilters(ir([f('time_year', '2026'), f('time_month', '4'), f('time_day', '15')]))
    assert.deepEqual(r.time_range, { type: 'absolute', start_date: '2026-04-15', end_date: '2026-04-15' })
  })

  test('연속된 여러 달은 이어 붙인다', () => {
    const r = normalizeTemporalFilters(ir([f('time_year', '2026'), f('time_month', '1', '2', '3')]))
    assert.deepEqual(r.time_range, { type: 'absolute', start_date: '2026-01-01', end_date: '2026-03-31' })
  })

  test('구간 하나로 못 줄이면 건드리지 않는다', () => {
    // 비연속 월을 min~max로 이으면 사이 달까지 들어가 값이 부풀어진다.
    for (const filters of [
      [f('time_year', '2026'), f('time_month', '1', '3')],
      [f('time_year', '2025', '2026')],
    ]) {
      assert.deepEqual(normalizeTemporalFilters(ir(filters)).time_range, { type: 'mtd' })
    }
  })

  test('명시적 기간이 있으면 그쪽이 이긴다 — 필터만 걷어낸다', () => {
    const explicit = { type: 'absolute', start_date: '2026-05-01', end_date: '2026-05-31' }
    const r = normalizeTemporalFilters(ir([f('time_year', '2026')], explicit))
    assert.deepEqual(r.time_range, explicit)
    assert.deepEqual(r.filters, [])
  })

  test('기간 필터가 없으면 그대로 둔다', () => {
    const original = ir([f('dealer', '렉서스 강남')])
    assert.equal(normalizeTemporalFilters(original), original)
  })
})

describe('되묻기 문구의 조사', () => {
  test('받침에 따라 을/를, 이/가를 가른다', () => {
    // "목표을"처럼 어색한 조사가 사용자에게 그대로 보였다.
    assert.match(detectAmbiguousSubject('2026년 4월 목표 알려줘').question, /목표를 말씀하시는/)
    assert.match(detectAmbiguousSubject('2026년 4월 목표 알려줘').question, /목표가 각각/)
    assert.match(detectAmbiguousSubject('2026년 4월 실적 현황 보여줘').question, /실적을 말씀하시는/)
    assert.match(detectAmbiguousSubject('2026년 4월 실적 현황 보여줘').question, /실적이 각각/)
  })
})
