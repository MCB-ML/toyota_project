// 이상현상 탐지 — 정의서 2-1(코드·규칙 기반) + 4장 원칙:
//   node --test backend/dealerFunnel/anomaly.test.js
import { test, describe } from 'node:test'
import assert from 'node:assert/strict'

import {
  THRESHOLDS, detectMonthOverMonth, detectRateChange, detectAnomalies, detectDataLoss, summarizeDealerSpread,
} from './anomaly.js'

describe('전월 대비 급변 탐지', () => {
  test('임계치를 넘어야 잡는다', () => {
    const under = detectMonthOverMonth({ metric: '활동', series: { '2026-05': 100, '2026-06': 110 } })
    assert.equal(under.length, 0, '10%는 임계치 15% 미만이라 안 잡혀야 한다')

    const over = detectMonthOverMonth({ metric: '활동', series: { '2026-05': 100, '2026-06': 80 } })
    assert.equal(over.length, 1)
    assert.equal(over[0].change_pct, -20)
    assert.equal(over[0].direction, '감소')
  })

  test('비교 시점을 결과에 명시한다 (원칙 2)', () => {
    const [a] = detectMonthOverMonth({ metric: '활동', series: { '2026-05': 100, '2026-06': 50 } })
    assert.equal(a.from_month, '2026-05')
    assert.equal(a.to_month, '2026-06')
    assert.equal(a.from_value, 100)
    assert.equal(a.to_value, 50)
  })

  test('부분월은 예상 최종치로 바꿔 비교한다 (원칙 5)', () => {
    // 8월 실적 300은 6일치다. 그대로 비교하면 -70%로 잡히지만, 예상 1,050으로 보면 증가다.
    const series = { '2026-07': 1000, '2026-08': 300 }
    const raw = detectMonthOverMonth({ metric: '활동', series })
    assert.equal(raw[0].direction, '감소')

    const withForecast = detectMonthOverMonth({
      metric: '활동', series, partial: { yearMonth: '2026-08', primary: 1050 },
    })
    assert.equal(withForecast.length, 0, '예상치로 보면 5% 증가라 임계치 미만')
  })

  test('예상치로 비교했으면 그 사실을 남긴다', () => {
    const [a] = detectMonthOverMonth({
      metric: '활동',
      series: { '2026-07': 1000, '2026-08': 300 },
      partial: { yearMonth: '2026-08', primary: 1400 },
    })
    assert.equal(a.forecast_used, true)
    assert.equal(a.change_pct, 40)
  })

  test('소표본은 표시하고 결론으로 쓰지 말라고 적는다 (원칙 6)', () => {
    const [a] = detectMonthOverMonth({ metric: '시승', series: { '2026-05': 8, '2026-06': 4 } })
    assert.equal(a.small_sample, true)
    assert.match(a.note, /참고용/)

    const [b] = detectMonthOverMonth({ metric: '시승', series: { '2026-05': 100, '2026-06': 50 } })
    assert.equal(b.small_sample, false)
    assert.equal(b.note, null)
  })

  test('직전 달이 0이면 증감률을 만들지 않는다 — 무한대를 내보내지 않는다', () => {
    assert.deepEqual(detectMonthOverMonth({ metric: '활동', series: { '2026-05': 0, '2026-06': 50 } }), [])
  })

  test('축(채널·딜러)을 함께 기록한다 (원칙 3)', () => {
    const [a] = detectMonthOverMonth({
      metric: '활동', series: { '2026-05': 100, '2026-06': 50 }, dimension: 'channel', member: '내방/내전',
    })
    assert.equal(a.dimension, 'channel')
    assert.equal(a.member, '내방/내전')
  })
})

describe('전환율 변화 탐지', () => {
  test('%p 임계치를 넘으면 잡고, 절대치를 함께 싣는다 (원칙 1)', () => {
    const [a] = detectRateChange({
      from: '시승', to: '계약',
      fromSeries: { '2026-05': 1000, '2026-06': 1000 },
      toSeries: { '2026-05': 300, '2026-06': 200 },
    })
    assert.equal(a.from_rate_pct, 30)
    assert.equal(a.to_rate_pct, 20)
    assert.equal(a.change_pp, -10)
    // 비율만 보면 착시가 생긴다 — 분모·분자가 같이 있어야 판단할 수 있다.
    assert.deepEqual(a.from_volume, { 시승: 1000, 계약: 300 })
    assert.deepEqual(a.to_volume, { 시승: 1000, 계약: 200 })
  })

  test('물량이 줄며 비율만 오르는 경우도 그대로 드러난다 (원칙 1의 착시)', () => {
    const [a] = detectRateChange({
      from: '시승', to: '계약',
      fromSeries: { '2026-05': 1000, '2026-06': 100 },
      toSeries: { '2026-05': 200, '2026-06': 40 },
    })
    assert.equal(a.direction, '상승')       // 20% → 40%
    assert.equal(a.to_volume.시승, 100)     // 그런데 물량은 1/10
  })

  test('분모가 0인 달은 건너뛴다', () => {
    assert.deepEqual(detectRateChange({
      from: '시승', to: '계약',
      fromSeries: { '2026-05': 0, '2026-06': 100 },
      toSeries: { '2026-05': 0, '2026-06': 50 },
    }), [])
  })
})

describe('전체 탐지', () => {
  const monthly = {
    활동: { '2026-05': 1000, '2026-06': 500, '2026-07': 520 },
    시승: { '2026-05': 200, '2026-06': 100, '2026-07': 100 },
    계약: { '2026-05': 60, '2026-06': 10, '2026-07': 10 },
  }

  test('큰 변화가 위로, 소표본은 아래로 정렬된다', () => {
    const r = detectAnomalies({ monthly })
    assert.ok(r.anomalies.length > 0)
    const firstSmall = r.anomalies.findIndex((a) => a.small_sample)
    const lastBig = r.anomalies.map((a) => a.small_sample).lastIndexOf(false)
    if (firstSmall >= 0) assert.ok(firstSmall > lastBig, '소표본이 큰 변화보다 앞에 오면 안 된다')
  })

  test('임계치를 결과에 같이 낸다 — 화면·AI가 기준을 알 수 있게', () => {
    const r = detectAnomalies({ monthly })
    assert.deepEqual(r.thresholds, THRESHOLDS)
  })

  test('퍼널 단계 전환율도 함께 본다', () => {
    const r = detectAnomalies({ monthly })
    assert.ok(r.anomalies.some((a) => a.kind === 'rate_change'))
  })

  test('limit으로 AI에 넘길 양을 제한하고 잘렸는지 알린다', () => {
    const r = detectAnomalies({ monthly, limit: 2 })
    assert.equal(r.anomalies.length, 2)
    assert.equal(r.truncated, true)
  })

  test('데이터가 없어도 터지지 않는다', () => {
    const r = detectAnomalies({ monthly: {} })
    assert.equal(r.total, 0)
    assert.deepEqual(r.anomalies, [])
  })
})

describe('딜러 축과 데이터 손실 (원칙 3 · 파이프라인 건강)', () => {
  test('딜러별 급변을 축과 함께 잡는다', () => {
    const r = detectAnomalies({
      monthly: { 활동: { '2026-05': 1000, '2026-06': 900 } },
      byDealer: {
        활동: {
          '렉서스 강남': { '2026-05': 500, '2026-06': 250 },
          '렉서스 부산': { '2026-05': 500, '2026-06': 650 },
        },
      },
    })
    const dealers = r.anomalies.filter((a) => a.dimension === 'dealer')
    assert.equal(dealers.length, 2)
    assert.deepEqual(dealers.map((a) => a.member).sort(), ['렉서스 강남', '렉서스 부산'])
  })

  test('여러 딜러가 같은 방향이면 전사 패턴으로 요약한다', () => {
    // 7월 분석 문서가 "8개 중 6개 딜러 동시 하락 → 전사적 리소스 재배분"이라고 판단한 방식.
    const byDealer = { 활동: {} }
    for (let i = 1; i <= 5; i += 1) byDealer.활동[`딜러${i}`] = { '2026-05': 100, '2026-06': 60 }
    const r = detectAnomalies({ monthly: { 활동: { '2026-05': 500, '2026-06': 300 } }, byDealer })
    const [spread] = r.dealer_spread
    assert.equal(spread.same_direction_count, 5)
    assert.equal(spread.dominant_direction, '감소')
    assert.equal(spread.pattern, '전사 패턴 가능성')
    assert.equal(spread.total_dealers, 5)
  })

  test('한 곳만 움직이면 개별 딜러 이슈로 본다', () => {
    const r = detectAnomalies({
      monthly: { 활동: { '2026-05': 500, '2026-06': 460 } },
      byDealer: {
        활동: {
          '렉서스 강남': { '2026-05': 100, '2026-06': 60 },
          '렉서스 부산': { '2026-05': 400, '2026-06': 400 },
        },
      },
    })
    assert.equal(r.dealer_spread[0].pattern, '개별 딜러 이슈 가능성')
    assert.equal(r.dealer_spread[0].same_direction_count, 1)
  })

  test('데이터 손실이 임계치를 넘으면 목록 맨 위에 올린다', () => {
    const r = detectAnomalies({
      monthly: { 활동: { '2026-05': 1000, '2026-06': 500 } },
      dataLoss: { excluded: { total: 800, source_rows: 10000, no_activity_type: 700, no_organization: 100 } },
    })
    assert.equal(r.data_loss_count, 1)
    assert.equal(r.anomalies[0].kind, 'data_loss')
    assert.equal(r.anomalies[0].loss_pct, 8)
  })

  test('손실이 임계치 미만이면 올리지 않는다 — 늘 떠 있으면 경고가 무뎌진다', () => {
    const r = detectAnomalies({
      monthly: {},
      dataLoss: { excluded: { total: 155, source_rows: 10000 } },   // 1.55% — 현재 수준
    })
    assert.equal(r.data_loss_count, 0)
  })

  test('정렬 순서: 데이터 손실 → 전체 → 채널 → 딜러', () => {
    const r = detectAnomalies({
      monthly: { 활동: { '2026-05': 1000, '2026-06': 500 } },
      byChannel: { 활동: { '내방/내전': { '2026-05': 100, '2026-06': 20 } } },
      byDealer: { 활동: { '렉서스 강남': { '2026-05': 100, '2026-06': 10 } } },
      dataLoss: { excluded: { total: 800, source_rows: 10000 } },
    })
    const scopes = r.anomalies.map((a) => (a.kind === 'data_loss' ? 'loss' : a.dimension || 'total'))
    assert.deepEqual(scopes.slice(0, 4), ['loss', 'total', 'channel', 'dealer'])
  })
})

describe('부분월을 축 단위에서 빼는 처리 (원칙 5의 축 레벨 적용)', () => {
  const monthly = { 활동: { '2026-07': 60000, '2026-08': 18000 } }
  const byChannel = { 활동: { '내방/내전': { '2026-07': 5000, '2026-08': 1500 } } }
  const byDealer = { 활동: { '렉서스 강남': { '2026-07': 8000, '2026-08': 2400 } } }
  const partial = { 활동: { yearMonth: '2026-08', primary: 55000 } }

  test('전체 축은 예상치로 비교하고, 채널·딜러 축은 그 달을 건너뛴다', () => {
    const r = detectAnomalies({ monthly, byChannel, byDealer, partial })
    // 축 단위에 8월이 남아 있으면 -70%가 잡혀 "전사적 급감"이라는 오답이 나온다.
    const axis = r.anomalies.filter((a) => a.dimension)
    assert.deepEqual(axis, [], '축 단위에서 부분월 비교가 남아 있으면 안 된다')
    assert.deepEqual(r.axis_partial_month_skipped, ['2026-08'])
  })

  test('건너뛴 달을 결과에 적는다 — 왜 축별 항목이 없는지 알 수 있게', () => {
    const r = detectAnomalies({ monthly, byChannel, byDealer, partial })
    assert.ok(r.axis_partial_month_skipped.includes('2026-08'))
  })

  test('부분월이 없으면 축 단위도 정상 비교한다', () => {
    const r = detectAnomalies({
      monthly: { 활동: { '2026-06': 60000, '2026-07': 40000 } },
      byChannel: { 활동: { '내방/내전': { '2026-06': 5000, '2026-07': 2000 } } },
    })
    assert.ok(r.anomalies.some((a) => a.dimension === 'channel'))
    assert.deepEqual(r.axis_partial_month_skipped, [])
  })
})
