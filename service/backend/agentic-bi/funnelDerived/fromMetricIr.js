// 지표 IR → GOLD 파생 SQL. 조건이 맞지 않으면 null을 돌려 기존 컴파일러로 넘긴다.
//
// 여기서 "조건이 맞는다"는 건 GOLD가 그 질문에 답할 수 있다는 뜻이다. GOLD는 한 달치를
// @year/@month/@day로 받는 구조라, 여러 달에 걸친 추이나 GOLD에 없는 축(모델 등)은
// 파생으로 만들 수 없다. 그런 질문은 예전처럼 기존 지표 SQL이 처리한다.
import { buildFunnelMetricSql } from './buildFunnelMetricSql.js'
import { FUNNEL_METRICS } from './metricSpecs.js'

/** 시맨틱 지표 id → 퍼널 파생 지표 id. */
export const METRIC_MAP = {
  activity_mtd_actual: 'activity_actual',
  activity_mtd_target: 'activity_target',
  lead_mtd_actual: 'lead_actual',
  lead_mtd_target: 'lead_target',
  // 2026-08-03 leo: 기존에는 퍼널 표의 영업기회 전체실적을 자연어 질의에서 인증 CTE로 연결할 수 없었다. 별도 메트릭을 전체실적 CTE에 매핑해 정의가 다른 활동실적과 혼용되지 않게 한다.
  lead_mtd_total_actual: 'lead_total_actual',
  contract_mtd_activity_actual: 'contract_actual',
  contract_mtd_total_actual_funnel: 'contract_total_actual',
  contract_mtd_progress_actual_funnel: 'contract_progress_actual',
  contract_mtd_target_funnel: 'contract_target',
  testdrive_mtd_actual: 'testdrive_activity_completed',
  testdrive_mtd_actual_form_basis: 'testdrive_activity_form_excluding_cancelled',
  testdrive_mtd_total_lead_actual: 'testdrive_total_lead_distinct',
  testdrive_mtd_total_actual: 'testdrive_total_actual_sum',
  testdrive_mtd_target: 'testdrive_target',
  contract_mtd_testdrive_actual: 'contract_testdrive_activity_actual',
  contract_mtd_testdrive_total_actual: 'contract_testdrive_total_actual',
}

/** 시맨틱 차원 id → GOLD grain 이름. 여기 없는 축은 파생으로 못 나눈다. */
export const DIMENSION_MAP = {
  brand: '브랜드',
  dealer: '딜러',
  showroom: '전시장',
  department: '팀',
  sales_consultant: 'SC',
}

/** 시맨틱 차원 id → GOLD 파라미터. 필터는 grain보다 넓게 지원한다. */
export const FILTER_MAP = {
  brand: 'brand',
  dealer: 'dealer_nm',
  showroom: 'group_name',
  department: 'dept_nm',
  sales_consultant: 'sc_name',
  active_status: 'active_yn',
  activity_type: 'common_tp_nm',
}

const pad = (n) => String(n).padStart(2, '0')
const isLastDayOfMonth = (d) => d.getUTCDate() === new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate()

/**
 * time_range를 GOLD의 @year/@month/@day로 바꾼다.
 * GOLD는 항상 그 달 1일부터 @day(없으면 말일)까지라, 그 모양이 아니면 null이다.
 */
export function resolveFunnelPeriod(timeRange, currentDate) {
  const now = new Date(`${currentDate}T00:00:00Z`)

  if (!timeRange || timeRange.type === 'mtd') {
    return { year: now.getUTCFullYear(), month: now.getUTCMonth() + 1, day: now.getUTCDate() }
  }
  if (timeRange.type === 'absolute' && timeRange.start_date && timeRange.end_date) {
    const s = new Date(`${timeRange.start_date}T00:00:00Z`)
    const e = new Date(`${timeRange.end_date}T00:00:00Z`)
    if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) return null
    // GOLD는 월 1일부터 시작하는 한 달치만 계산한다.
    if (s.getUTCDate() !== 1) return null
    if (s.getUTCFullYear() !== e.getUTCFullYear() || s.getUTCMonth() !== e.getUTCMonth()) return null
    return {
      year: s.getUTCFullYear(),
      month: s.getUTCMonth() + 1,
      day: isLastDayOfMonth(e) ? null : e.getUTCDate(),
    }
  }
  // ytd·relative(여러 달)·주차 등은 GOLD 한 달 구조로 표현할 수 없다.
  return null
}

/**
 * buildFromMetricIr가 null을 돌린 이유를 사람 말로 돌려준다.
 *
 * 왜 필요한가: null만 돌리면 호출부가 조용히 다른 정의로 넘어간다. 어느 조건에
 * 걸렸는지 남겨 두면 "무엇을 넓히면 GOLD로 답할 수 있는지"가 로그로 쌓인다.
 */
export function derivedUnavailableReason(ir) {
  if (!ir || ir.metrics?.length !== 1) return '지표가 하나가 아님'
  if (!METRIC_MAP[ir.metrics[0]]) return 'GOLD에 정의가 없는 지표'
  if (ir.time_series_transform) return '추이 변환은 여러 달이 필요'
  const bad = (ir.dimensions || []).filter((d) => !DIMENSION_MAP[d])
  if (bad.length) return `GOLD에 없는 축: ${bad.join(', ')}`
  if (!resolveFunnelPeriod(ir.time_range, todayISOForReason())) {
    return 'GOLD는 그 달 1일~N일만 계산 (연간·주차·월 중간 시작 불가)'
  }
  for (const f of ir.filters || []) {
    if (!FILTER_MAP[f.dimension]) return `GOLD에 없는 필터: ${f.dimension}`
    if (f.operator && f.operator !== 'in') return `지원하지 않는 연산자: ${f.operator}`
    if ((f.values || []).some((v) => String(v).includes(','))) return '필터 값에 콤마가 있어 구분자와 충돌'
  }
  return '조건 불명'
}

const todayISOForReason = () => new Date().toISOString().slice(0, 10)

/**
 * @returns {{sql, bind, metricId, funnelMetricId, grain}|null}
 *   null이면 이 질문은 파생으로 답할 수 없다 — 호출부가 기존 경로를 쓴다.
 */
export function buildFromMetricIr(ir, { currentDate }) {
  if (!ir || ir.metrics?.length !== 1) return null
  if (ir.time_series_transform) return null   // 추이 후처리는 여러 달이 필요하다

  const metricId = ir.metrics[0]
  const funnelId = METRIC_MAP[metricId]
  if (!funnelId || !FUNNEL_METRICS[funnelId]) return null

  const dims = ir.dimensions || []
  // 축은 여러 개를 받는다. buildFunnelMetricSql이 처음부터 배열을 받아 GROUP BY를
  // 만들고 있었는데 여기서만 하나로 막고 있었다 — 구조적 한계가 아니라 보수적 가드였다.
  // 2축 이상이 막히면 "딜러별 전시장별"이 기존 컴파일러로 넘어가 값이 갈렸다.
  // 2026-08-05 패리티 실측: grain=[] · 딜러 · 딜러,전시장 · 딜러,전시장,팀 에서
  // 15개 지표의 합이 GOLD 합계 행과 모두 일치했다(backend/reports/parity.mjs).
  const grainNames = dims.map((d) => DIMENSION_MAP[d])
  if (grainNames.some((g) => !g)) return null   // GOLD에 없는 축(모델·주차 등)

  const period = resolveFunnelPeriod(ir.time_range, currentDate)
  if (!period) return null

  // 필터는 GOLD가 콤마로 구분된 문자열 하나로 받는다.
  const filterValues = {}
  for (const f of ir.filters || []) {
    const param = FILTER_MAP[f.dimension]
    if (!param) return null                       // 못 거는 필터를 조용히 무시하면 값이 틀린다
    if (f.operator && f.operator !== 'in') return null
    const values = (f.values || []).map((v) => String(v).trim()).filter(Boolean)
    if (values.some((v) => v.includes(','))) return null  // 콤마 구분과 충돌
    if (values.length) filterValues[param] = values.join(',')
  }

  const sql = buildFunnelMetricSql(funnelId, grainNames, {
    valueAlias: metricId,
    grainAliases: Object.fromEntries(grainNames.map((g, i) => [g, dims[i]])),
  })

  const bind = {
    year: { type: 'int', value: period.year },
    month: { type: 'int', value: period.month },
    day: { type: 'int', value: period.day },
  }
  for (const p of ['brand', 'dealer_nm', 'group_name', 'dept_nm', 'active_yn', 'sc_name', 'common_tp_nm']) {
    bind[p] = { type: 'nvarchar', value: filterValues[p] ?? null }
  }

  return { sql, bind, metricId, funnelMetricId: funnelId, grain: grainNames }
}
