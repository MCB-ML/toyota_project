// 인증 리포트 파생 어댑터는 출고 목표에만 사용한다.
// 2026-08-05 leo: 계약 목표는 시맨틱 계층에서 FCT_CRM_TARGET_M을 직접 컴파일하도록 바뀌었다.
// 출고 목표는 별도 인증 리포트 형태를 사용하므로 이 어댑터에는 출고 지표만 남긴다.
import { executeReport } from '../../reports/executor.js'
import { rollupReportRows } from '../../reports/projection.js'
import { resolveFunnelPeriod, DIMENSION_MAP, FILTER_MAP } from './fromMetricIr.js'

export const TARGET_METRICS = {
  delivery_mtd_target: { report: 'sales_achievement_delivery', column: '목표', cumulative: false },
  delivery_ytd_target: { report: 'sales_achievement_delivery', column: '목표', cumulative: true },
}

// 시맨틱 차원 id → 이 리포트의 차원 컬럼. 퍼널과 이름이 겹치지만 리포트가 달라 따로 둔다.
const REPORT_DIMENSION = { ...DIMENSION_MAP }

// 시맨틱 차원 id → 이 리포트의 파라미터 이름(퍼널 GOLD와 명명이 다르다).
const REPORT_FILTER = {
  brand: 'Brand',
  dealer: 'DealerNm',
  showroom: 'GroupName',
  department: 'DeptNm',
  sales_consultant: 'ScName',
  active_status: 'ActiveYn',
}

const MONTH_LABEL = (m) => `${m}월`

/**
 * 이 리포트는 연 단위로 실행하고 월 행을 고르는 구조라, 퍼널 GOLD보다 기간 해석이 넓다.
 *
 * - MTD 지표: 한 달로 특정돼야 한다(여러 달을 주면 어느 달인지 알 수 없다).
 * - YTD 지표: "1월~4월"처럼 같은 해 안의 범위면 끝 월의 누적값이 곧 답이다.
 */
function resolveReportPeriod(timeRange, currentDate, cumulative) {
  const single = resolveFunnelPeriod(timeRange, currentDate)
  if (single) return single
  if (!cumulative) return null

  const now = new Date(`${currentDate}T00:00:00Z`)
  if (timeRange?.type === 'ytd') return { year: now.getUTCFullYear(), month: now.getUTCMonth() + 1 }

  if (timeRange?.type === 'absolute' && timeRange.start_date && timeRange.end_date) {
    const s = new Date(`${timeRange.start_date}T00:00:00Z`)
    const e = new Date(`${timeRange.end_date}T00:00:00Z`)
    if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) return null
    if (s.getUTCFullYear() !== e.getUTCFullYear()) return null   // 해를 넘기면 연누적이 성립 안 한다
    return { year: e.getUTCFullYear(), month: e.getUTCMonth() + 1 }
  }
  return null
}

/**
 * @returns {{rows, metricId, reportId, month}|null}
 *   null이면 이 질문은 이 리포트로 답할 수 없다 — 호출부가 기존 경로를 쓴다.
 */
// 2026-08-04 leo: 출고 목표 지표는 인증 리포트를 재생한다. 대시보드 재수화와 자연어 미리보기가
// 서로 다른 cache/access context를 쓰지 않도록 호출자의 접근 범위와 강제 갱신 여부를 전달한다.
export async function runTargetMetric(ir, { currentDate, accessContext, forceRefresh = false } = {}) {
  if (!ir || ir.metrics?.length !== 1 || ir.time_series_transform) return null

  const metricId = ir.metrics[0]
  const spec = TARGET_METRICS[metricId]
  if (!spec) return null

  const dims = ir.dimensions || []
  if (dims.length > 1) return null
  const grainName = dims.length ? REPORT_DIMENSION[dims[0]] : null
  if (dims.length && !grainName) return null

  const period = resolveReportPeriod(ir.time_range, currentDate, spec.cumulative)
  if (!period) return null

  const params = { Year: [String(period.year)] }
  for (const f of ir.filters || []) {
    const name = REPORT_FILTER[f.dimension]
    if (!name) return null                     // 못 거는 필터를 무시하면 값이 틀어진다
    if (f.operator && f.operator !== 'in') return null
    const values = (f.values || []).map((v) => String(v).trim()).filter(Boolean)
    if (values.length) params[name] = values
  }
  // SC 단위로 보려면 리포트를 SC 분기로 실행해야 한다(그래야 SC 열이 생긴다).
  if (grainName === 'SC' && !params.ScName) params.ScName = 'ALL'

  const result = await executeReport(spec.report, params, { accessContext, forceRefresh })

  // 목표 컬럼은 상위 grain 반복값이라 그냥 더하면 안 된다 — rollupReportRows가
  // 계약의 grain으로 중복 제거한다.
  const keep = grainName ? ['MonthAbbr', grainName] : ['MonthAbbr']
  const rolled = rollupReportRows(result, keep)

  const thisMonth = MONTH_LABEL(period.month)
  const prevMonth = period.month > 1 ? MONTH_LABEL(period.month - 1) : null

  const keyOf = (row) => (grainName ? String(row[grainName] ?? '') : '')
  const cur = new Map()
  const prev = new Map()
  for (const row of rolled.rows) {
    if (row.MonthAbbr === thisMonth) cur.set(keyOf(row), Number(row[spec.column]) || 0)
    else if (prevMonth && row.MonthAbbr === prevMonth) prev.set(keyOf(row), Number(row[spec.column]) || 0)
  }
  if (cur.size === 0) return null   // 그 달 데이터가 없으면 지어내지 않는다

  const rows = [...cur.entries()].map(([k, v]) => {
    // 리포트 값은 연누적이다. MTD는 전월 누적과의 차 — 1월이면 누적이 곧 당월이다.
    const value = spec.cumulative ? v : v - (prev.get(k) || 0)
    return grainName ? { [dims[0]]: k, [metricId]: value } : { [metricId]: value }
  })
  return { rows, metricId, reportId: spec.report, month: thisMonth }
}
