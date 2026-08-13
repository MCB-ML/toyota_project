import { executeReport } from './executor.js'

function paramValue(params, ...names) {
  for (const name of names) {
    if (Object.prototype.hasOwnProperty.call(params || {}, name)) return params[name]
  }
  return null
}

function currentMonthLimit(year, now = new Date()) {
  const currentYear = now.getFullYear()
  if (Number(year) === currentYear) return now.getMonth() + 1
  return 12
}

function publicReportParams(params = {}) {
  return Object.fromEntries(
    Object.entries(params || {}).filter(([key]) => !String(key).startsWith('__')),
  )
}

export function funnelMonthSeriesForParams(reportId, params = {}, reportView = null, now = new Date()) {
  if (reportId !== 'funnel_full_structure') return []
  if (!reportView || !reportView.startsWith('funnel_')) return []
  if (paramValue(params, 'MonthNumber', 'month') !== null) return []

  const year = Number(paramValue(params, 'Year', 'year') || now.getFullYear())
  if (!Number.isInteger(year) || year < 2000 || year > 2100) return []
  return Array.from({ length: currentMonthLimit(year, now) }, (_, index) => index + 1)
}

export async function executeReportWithView(reportId, params = {}, {
  reportView = null,
  accessContext,
  forceRefresh = false,
} = {}) {
  // 2026-08-04 leo: 월별 리포트 뷰는 여러 인증 리포트를 순차 실행한다. 각 월 실행에도 같은
  // Redis cache/access context/강제 새로고침을 전달해 개별 실행 정책이 갈라지지 않게 한다.
  const cleanParams = publicReportParams(params)
  const months = funnelMonthSeriesForParams(reportId, cleanParams, reportView)
  if (!months.length) return executeReport(reportId, cleanParams, { accessContext, forceRefresh })

  const year = Number(paramValue(cleanParams, 'Year', 'year') || new Date().getFullYear())
  const results = []
  for (const month of months) {
    const result = await executeReport(reportId, {
      ...cleanParams,
      Year: year,
      year,
      MonthNumber: month,
      month,
    }, { accessContext, forceRefresh })
    results.push(result)
  }

  const base = results[0]
  return {
    ...base,
    params: {
      ...base.params,
      MonthNumber: null,
      month: null,
    },
    rows: results.flatMap((result) => {
      const resultYear = paramValue(result.params, 'Year', 'year')
      const resultMonth = paramValue(result.params, 'MonthNumber', 'month')
      return result.rows.map((row) => ({
        ...row,
        연도: resultYear,
        월: `${resultMonth}월`,
        __reportYear: resultYear,
        __reportMonth: resultMonth,
      }))
    }),
    dimensionColumns: ['연도', '월', ...base.dimensionColumns],
    fetchedAt: results.map((result) => result.fetchedAt).sort().at(-1),
    cached: results.every((result) => result.cached),
    cache: results.some((result) => result.cache?.state === 'stale')
      ? { ...base.cache, state: 'stale', refreshing: true }
      : results.every((result) => result.cache?.state === 'fresh')
        ? { ...base.cache, state: 'fresh', refreshing: false }
        : { ...base.cache, state: 'miss', refreshing: false },
    expandedMonths: months,
  }
}
