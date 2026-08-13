// GOLD의 어느 CTE가 어느 지표인지만 적는다 — 계산식은 여기 없다.
//
// 지표 정의를 다시 쓰지 않는 게 핵심이다. 예를 들어 계약목표의
// `T.common_tp_nm = N'계약'` 필터는 GOLD의 overall_contract_target 안에 있고,
// 독립 SQL로 옮겨 적었을 때 그 줄이 빠져 560,790(정답 3,161)이 나왔다.

/** 요청 grain 이름 → valid_user(VU)의 컬럼. GOLD가 조직 계층을 여기서 만든다. */
export const GRAIN_COLUMNS = {
  브랜드: 'brand_nm',
  딜러: 'dealer_nm',
  전시장: 'group_name',
  팀: 'dept_nm',
  SC: 'sc_name',
}

/**
 * aggregate_cte: 값을 내는 CTE(GROUP BY 없는 전사 집계).
 * grain_source : grain 컬럼을 어디서 끌어올지.
 *   - 'vu'   : aggregate_cte 안에 valid_user AS VU가 조인돼 있다.
 *   - CTE명  : 그 CTE에 먼저 grain을 넣고, aggregate_cte는 그 컬럼을 그대로 쓴다.
 * report_column: 1-1 리포트의 대응 컬럼 — 합계 대조로 정확성을 검증하는 데 쓴다.
 */
export const FUNNEL_METRICS = {
  activity_actual: {
    name_ko: '영업활동 실적',
    aggregate_cte: 'overall_activity_actual',
    grain_source: 'vu',
    report_column: '영업활동 건 수',
  },
  activity_target: {
    name_ko: '영업활동 목표',
    aggregate_cte: 'overall_activity_target',
    grain_source: 'vu',
    report_column: '영업활동 당월 목표',
  },
  lead_actual: {
    name_ko: '영업기회 실적 (당월활동실적)',
    aggregate_cte: 'overall_lead_activity_count',
    // 이 CTE는 pool에서 COUNT(DISTINCT)만 한다 — grain은 pool에 넣어야 한다.
    grain_source: 'overall_lead_activity_pool',
    report_column: '영업기회 건 수(당월활동실적)',
  },
  lead_target: {
    name_ko: '영업기회 목표',
    aggregate_cte: 'overall_lead_target',
    grain_source: 'vu',
    report_column: '영업기회 당월 목표',
  },
  // 2026-08-03 leo: 기존에는 퍼널 표에 있는 영업기회 전체실적이 명세에 없어 동일 화면의 원자값을 재현할 수 없었다. 인증 GOLD의 전체실적 CTE를 독립 명세로 등록한다.
  lead_total_actual: {
    name_ko: '영업기회 실적 (당월전체실적)',
    aggregate_cte: 'overall_lead_total_count',
    grain_source: 'vu',
    report_column: '영업기회 건 수(당월전체실적)',
  },
  contract_actual: {
    name_ko: '계약 실적 (당월활동실적)',
    aggregate_cte: 'overall_contract_activity_count',
    grain_source: 'vu',
    report_column: '계약건수(당월활동실적)',
  },
  contract_target: {
    name_ko: '계약 목표',
    aggregate_cte: 'overall_contract_target',
    grain_source: 'vu',
    report_column: '계약 당월 목표',
  },
  // 2026-08-03 leo: 기존에는 시승·계약 퍼널의 세부 원자값이 일반 SQL로 흩어져 Power BI 기준과 모집단이 달라질 수 있었다. 검증된 GOLD CTE와 보고서 컬럼을 한 명세에 고정한다.
  contract_total_actual: {
    name_ko: '계약 실적 (당월전체실적)',
    aggregate_cte: 'overall_contract_total_count',
    grain_source: 'vu',
    report_column: '계약건수(당월전체실적)',
  },
  contract_progress_actual: {
    name_ko: '계약 진행률 분자 (당월활동실적)',
    aggregate_cte: 'overall_contract_progress_count',
    grain_source: 'vu',
    // 대응하는 표시 컬럼이 없다. GOLD는 이 값을 [계약 진행률]의 분자로만 쓰고 건수로는
    // 내보내지 않는다 — 표시되는 [계약건수(당월활동실적)]는 다른 CTE(CAC)다.
    // 2026-08-05 실측(2026-04 렉서스 강남): 이 값 208, 표시 계약건수 264.
    // 전에는 report_column에 '계약건수(당월활동실적)'가 적혀 있었다. 컬럼이 실재하니
    // 구조 테스트는 통과했지만, 값을 대조하자 56 차이로 드러났다.
    report_column: null,
  },
  testdrive_activity_completed: {
    name_ko: '시승 실적 (당월활동실적/시승완료)',
    aggregate_cte: 'overall_td_completed_lead_match',
    grain_source: 'vu',
    report_column: '시승건수(당월활동실적/시승완료)',
  },
  testdrive_activity_form_excluding_cancelled: {
    name_ko: '시승 실적 (당월활동실적/시승취소 제외)',
    aggregate_cte: 'overall_td_form_without_cancel',
    grain_source: 'vu',
    report_column: '시승건수(당월활동실적/시승취소건 제외)',
  },
  testdrive_total_lead_distinct: {
    name_ko: '시승 실적 (당월전체실적/리드 기준)',
    aggregate_cte: 'overall_td_total_lead_distinct',
    grain_source: 'overall_td_completed_total_leads',
    report_column: '시승건수(당월전체실적/lead_key 기준)',
  },
  testdrive_total_actual_sum: {
    name_ko: '시승 실적 (당월전체실적/실적 건수 기준)',
    aggregate_cte: 'overall_td_total_actual_sum',
    grain_source: 'vu',
    report_column: '시승건수(당월전체실적/actual_cnt 기준)',
  },
  testdrive_target: {
    name_ko: '시승 당월 목표',
    aggregate_cte: 'overall_td_target',
    grain_source: 'vu',
    report_column: '시승 당월 목표',
  },
  contract_testdrive_activity_actual: {
    name_ko: '시승에서 계약 (당월활동실적)',
    aggregate_cte: 'overall_contract_td_activity_count',
    grain_source: 'vu',
    report_column: '시승에서 계약으로 당월활동실적',
  },
  contract_testdrive_total_actual: {
    name_ko: '시승에서 계약 (당월전체실적)',
    aggregate_cte: 'overall_contract_td_total_count',
    grain_source: 'vu',
    report_column: '시승에서 계약으로 당월전체실적',
  },
}

const LEGACY_METRIC_ALIASES = {
  testdrive_actual: 'testdrive_activity_completed',
  testdrive_no_cancel: 'testdrive_activity_form_excluding_cancelled',
  testdrive_total_lead: 'testdrive_total_lead_distinct',
  testdrive_total_actual: 'testdrive_total_actual_sum',
  testdrive_to_contract_actual: 'contract_testdrive_activity_actual',
  testdrive_to_contract_total: 'contract_testdrive_total_actual',
}

for (const [alias, target] of Object.entries(LEGACY_METRIC_ALIASES)) {
  Object.defineProperty(FUNNEL_METRICS, alias, {
    value: FUNNEL_METRICS[target],
    enumerable: false,
    configurable: true,
  })
}
