// 부분월 예측 — 정의서 3-6:
//   node --test backend/dealerFunnel/forecast.test.js
import { test, describe } from 'node:test'
import assert from 'node:assert/strict'

import {
  isWeekend, daysInMonth, monthDays, forecastPartialMonth, forecastLatestMonth,
} from './forecast.js'

/** 그 달 모든 날에 같은 값을 채운다. */
const flat = (yearMonth, value) => Object.fromEntries(monthDays(yearMonth).map((d) => [d, value]))

describe('달력', () => {
  test('말일은 달마다 다르다 — 윤년 포함', () => {
    assert.equal(daysInMonth('2026-02'), 28)
    assert.equal(daysInMonth('2024-02'), 29)
    assert.equal(daysInMonth('2026-04'), 30)
    assert.equal(daysInMonth('2026-08'), 31)
  })

  test('주말은 토·일', () => {
    assert.equal(isWeekend('2026-08-08'), true)   // 토
    assert.equal(isWeekend('2026-08-09'), true)   // 일
    assert.equal(isWeekend('2026-08-10'), false)  // 월
  })
})

describe('부분월 예상 최종치 (정의서 3-6)', () => {
  test('① 평일·주말 페이스 — 매일 같은 값이면 일수 비례로 늘어난다', () => {
    // 2026-08은 31일. 10일까지 매일 10건이면 실적 100, 예상은 310 근처여야 한다.
    const r = forecastPartialMonth({ yearMonth: '2026-08', daily: flat('2026-08', 10), asOf: '2026-08-10' })
    assert.equal(r.actual_so_far, 100)
    assert.equal(r.days_elapsed, 10)
    assert.equal(r.days_in_month, 31)
    assert.equal(r.method1_forecast, 310)
    assert.equal(r.method3_forecast, 310)
  })

  test('① 평일과 주말 수준이 다르면 남은 요일 구성을 반영한다', () => {
    // 평일 100, 주말 10. 단순 페이스(③)와 값이 달라져야 한다 — 그게 ①을 쓰는 이유다.
    const daily = Object.fromEntries(monthDays('2026-08').map((d) => [d, isWeekend(d) ? 10 : 100]))
    const r = forecastPartialMonth({ yearMonth: '2026-08', daily, asOf: '2026-08-10' })
    assert.equal(r.weekday_avg, 100)
    assert.equal(r.weekend_avg, 10)
    // 8월 전체 평일 21일 · 주말 10일 → 21*100 + 10*10 = 2,200
    assert.equal(r.method1_forecast, 2200)
    assert.notEqual(r.method1_forecast, r.method3_forecast)
  })

  test('③ 단순 페이스 — 기준일까지 실적 ÷ 기준일 × 그 달 일수', () => {
    const daily = { '2026-08-01': 30, '2026-08-02': 30, '2026-08-03': 30 }
    const r = forecastPartialMonth({ yearMonth: '2026-08', daily, asOf: '2026-08-03' })
    assert.equal(r.actual_so_far, 90)
    assert.equal(r.method3_forecast, 930)   // 90/3*31
  })

  test('② 과거 진척률 — 같은 날짜까지의 누적 비율로 역산한다', () => {
    // 과거 두 달 모두 매일 균등이면 10일까지의 비율은 10/31, 10/30.
    const history = [
      { yearMonth: '2026-06', daily: flat('2026-06', 10) },   // 30일
      { yearMonth: '2026-07', daily: flat('2026-07', 10) },   // 31일
    ]
    const r = forecastPartialMonth({
      yearMonth: '2026-08', daily: flat('2026-08', 10), asOf: '2026-08-10', history,
    })
    // 비율 평균 = (10/30 + 10/31)/2 ≈ 0.3280 → 100 / 0.3280 ≈ 305
    assert.equal(r.hist_ratio_pct, 32.8)
    assert.equal(r.method2_forecast, 305)
  })

  test('② 이력이 없으면 null — 0으로 채워 그럴듯한 값을 만들지 않는다', () => {
    const r = forecastPartialMonth({ yearMonth: '2026-08', daily: flat('2026-08', 10), asOf: '2026-08-10' })
    assert.equal(r.method2_forecast, null)
    assert.equal(r.hist_ratio_pct, null)
  })

  test('② 실적이 0인 과거월은 비율 계산에서 뺀다 — 0으로 나누지 않는다', () => {
    const history = [
      { yearMonth: '2026-06', daily: {} },                    // 실적 없음
      { yearMonth: '2026-07', daily: flat('2026-07', 10) },
    ]
    const r = forecastPartialMonth({
      yearMonth: '2026-08', daily: flat('2026-08', 10), asOf: '2026-08-10', history,
    })
    assert.equal(r.hist_ratio_pct, 32.3)    // 10/31 만 반영
    assert.ok(Number.isFinite(r.method2_forecast))
  })

  test('①을 대표값으로 쓴다 (정의서 3-6)', () => {
    const r = forecastPartialMonth({ yearMonth: '2026-08', daily: flat('2026-08', 10), asOf: '2026-08-10' })
    assert.equal(r.primary, r.method1_forecast)
  })

  test('달이 끝났으면 예측하지 않는다 — 확정 실적이 최종치다', () => {
    const r = forecastPartialMonth({ yearMonth: '2026-07', daily: flat('2026-07', 10), asOf: '2026-07-31' })
    assert.equal(r.complete, true)
    assert.equal(r.actual_so_far, 310)
    assert.equal(r.method1_forecast, 310)
    assert.equal(r.primary, 310)
  })

  test('빈 달에서도 터지지 않는다', () => {
    const r = forecastPartialMonth({ yearMonth: '2026-08', daily: {}, asOf: '2026-08-10' })
    assert.equal(r.actual_so_far, 0)
    assert.equal(r.method1_forecast, 0)
    assert.equal(r.method3_forecast, 0)
  })

  test('실적이 없는 날은 0으로 본다 — 기록이 빠진 날을 평균에서 빼면 과대추정된다', () => {
    // 1~10일 중 3일만 기록이 있어도 분모는 10일이다.
    const daily = { '2026-08-01': 10, '2026-08-05': 10, '2026-08-09': 10 }
    const r = forecastPartialMonth({ yearMonth: '2026-08', daily, asOf: '2026-08-10' })
    assert.equal(r.actual_so_far, 30)
    assert.equal(r.days_elapsed, 10)
    assert.equal(r.method3_forecast, 93)     // 30/10*31
  })
})

describe('월별 시리즈에서 마지막 달 예측', () => {
  test('마지막 달만 부분월로 보고 앞 3개월을 이력으로 쓴다', () => {
    const dailyByMonth = {
      '2026-05': flat('2026-05', 10),
      '2026-06': flat('2026-06', 10),
      '2026-07': flat('2026-07', 10),
      '2026-08': flat('2026-08', 10),
    }
    const r = forecastLatestMonth(dailyByMonth, '2026-08-10')
    assert.equal(r.yearMonth, '2026-08')
    assert.equal(r.lookback_months, 3)
    assert.equal(r.actual_so_far, 100)
    assert.ok(r.method2_forecast > 0)
  })

  test('이력이 3개월보다 적으면 있는 만큼만 쓴다', () => {
    const r = forecastLatestMonth({ '2026-07': flat('2026-07', 10), '2026-08': flat('2026-08', 10) }, '2026-08-10')
    assert.equal(r.lookback_months, 1)
  })

  test('데이터가 없으면 null', () => {
    assert.equal(forecastLatestMonth({}, '2026-08-10'), null)
  })
})
