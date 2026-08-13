// 딜러 계약퍼널 — 부분월(진행 중인 달) 예상 최종치 (요구사항정의서 3-6).
//
// **부분월 실적을 그대로 전월과 비교하면 항상 "감소"로 잘못 나온다.** 정의서는 이 변환을
// 파이프라인 단계에서 강제하라고 못박았다(3-6, 4장 원칙 5). 이 프로젝트에서도 같은 일을
// 겪었다 — 2026-08은 6일치뿐이라 연누적이 0으로 보였고 결함으로 의심했다.
//
// 세 가지 방법을 모두 낸다. ①이 기본(대표)값이고 ②·③은 참고용으로 함께 제시한다.
//
//   ① 평일·주말 페이스  기준일까지의 평일평균·주말평균을 남은 평일·주말 일수에 곱해 더한다
//   ② 과거 진척률      최근 N개월의 "같은 날짜까지 누적 / 그 달 전체" 비율 평균으로 역산
//   ③ 단순 페이스      기준일까지 실적 ÷ 기준일 × 그 달 전체 일수
//
// 계산은 전부 순수 함수다 — 일별 건수만 주면 되고 DB를 타지 않는다.

/** 'YYYY-MM-DD' → UTC Date. 시간대에 끌려 하루가 밀리지 않게 UTC로 고정한다. */
function toUtc(iso) {
  const [y, m, d] = String(iso).split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d))
}

const iso = (date) => date.toISOString().slice(0, 10)

/** 토·일. 공휴일은 정의서에 언급이 없어 넣지 않는다 — 넣으려면 달력 차원이 필요하다. */
export function isWeekend(isoDate) {
  const day = toUtc(isoDate).getUTCDay()
  return day === 0 || day === 6
}

export function daysInMonth(yearMonth) {
  const [y, m] = String(yearMonth).split('-').map(Number)
  return new Date(Date.UTC(y, m, 0)).getUTCDate()
}

/** 그 달의 모든 날짜(ISO). */
export function monthDays(yearMonth) {
  const [y, m] = String(yearMonth).split('-').map(Number)
  return Array.from({ length: daysInMonth(yearMonth) }, (_, i) => iso(new Date(Date.UTC(y, m - 1, i + 1))))
}

/**
 * 한 지표의 부분월 예상 최종치.
 *
 * @param {object} opts
 * @param {string} opts.yearMonth   'YYYY-MM'
 * @param {object} opts.daily       {'YYYY-MM-DD': number} — 그 달의 일별 실적(없는 날은 0으로 본다)
 * @param {string} opts.asOf        기준일 'YYYY-MM-DD'. 이 날까지가 확정 실적이다.
 * @param {object[]} [opts.history] 과거 완료월 [{yearMonth, daily}] — ②에 쓴다. 없으면 ②는 null.
 * @returns {{
 *   actual_so_far: number, days_elapsed: number, days_in_month: number,
 *   method1_forecast: number, method2_forecast: number|null, method3_forecast: number,
 *   weekday_avg: number, weekend_avg: number, hist_ratio_pct: number|null,
 *   primary: number, complete: boolean
 * }}
 */
export function forecastPartialMonth({ yearMonth, daily = {}, asOf, history = [] }) {
  const days = monthDays(yearMonth)
  const total = days.length
  const asOfDay = toUtc(asOf).getUTCDate()
  const elapsed = days.slice(0, asOfDay)
  const remaining = days.slice(asOfDay)

  const at = (d) => Number(daily[d] ?? 0)
  const actual = elapsed.reduce((s, d) => s + at(d), 0)

  // 달이 이미 끝났으면 예측하지 않는다 — 확정 실적이 곧 최종치다.
  if (!remaining.length) {
    return {
      actual_so_far: actual,
      days_elapsed: elapsed.length,
      days_in_month: total,
      method1_forecast: actual,
      method2_forecast: actual,
      method3_forecast: actual,
      weekday_avg: 0,
      weekend_avg: 0,
      hist_ratio_pct: null,
      primary: actual,
      complete: true,
    }
  }

  // ① 평일·주말 페이스
  const split = (list) => ({
    weekday: list.filter((d) => !isWeekend(d)),
    weekend: list.filter((d) => isWeekend(d)),
  })
  const past = split(elapsed)
  const left = split(remaining)
  const avg = (list) => (list.length ? list.reduce((s, d) => s + at(d), 0) / list.length : 0)
  const weekdayAvg = avg(past.weekday)
  const weekendAvg = avg(past.weekend)
  const method1 = actual + weekdayAvg * left.weekday.length + weekendAvg * left.weekend.length

  // ③ 단순 페이스
  const method3 = elapsed.length ? (actual / elapsed.length) * total : 0

  // ② 과거 진척률 — 같은 "날짜"까지의 누적 비율. 달마다 길이가 달라도 날짜 기준으로 맞춘다.
  const ratios = []
  for (const h of history) {
    const hDays = monthDays(h.yearMonth)
    const hAt = (d) => Number(h.daily?.[d] ?? 0)
    const hTotal = hDays.reduce((s, d) => s + hAt(d), 0)
    if (!hTotal) continue                       // 실적이 아예 없는 달은 비율을 만들 수 없다
    const upTo = hDays.slice(0, asOfDay).reduce((s, d) => s + hAt(d), 0)
    ratios.push(upTo / hTotal)
  }
  const histRatio = ratios.length ? ratios.reduce((s, v) => s + v, 0) / ratios.length : null
  const method2 = histRatio && histRatio > 0 ? actual / histRatio : null

  const round = (v) => (v === null ? null : Math.round(v))
  return {
    actual_so_far: actual,
    days_elapsed: elapsed.length,
    days_in_month: total,
    method1_forecast: round(method1),
    method2_forecast: round(method2),
    method3_forecast: round(method3),
    weekday_avg: Number(weekdayAvg.toFixed(2)),
    weekend_avg: Number(weekendAvg.toFixed(2)),
    hist_ratio_pct: histRatio === null ? null : Number((histRatio * 100).toFixed(1)),
    primary: round(method1),      // 정의서 3-6: ①을 대표값으로 쓴다
    complete: false,
  }
}

/**
 * 월별 시리즈에서 마지막 달만 부분월로 보고 예측을 붙인다.
 *
 * @param {object} dailyByMonth {'YYYY-MM': {'YYYY-MM-DD': number}}
 * @param {string} asOf         기준일. 보통 데이터가 있는 마지막 날.
 * @param {number} lookback     ②에 쓸 과거 완료월 수(정의서 기본 3)
 */
export function forecastLatestMonth(dailyByMonth, asOf, lookback = 3) {
  const months = Object.keys(dailyByMonth).sort()
  if (!months.length) return null
  const target = asOf.slice(0, 7)
  const history = months
    .filter((m) => m < target)
    .slice(-lookback)
    .map((m) => ({ yearMonth: m, daily: dailyByMonth[m] }))

  return {
    yearMonth: target,
    as_of: asOf,
    lookback_months: history.length,
    ...forecastPartialMonth({ yearMonth: target, daily: dailyByMonth[target] || {}, asOf, history }),
  }
}
