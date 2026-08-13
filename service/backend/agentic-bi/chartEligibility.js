// 도넛/산점도/레이더는 아무 데이터에나 그리면 조용히 거짓말을 하는 차트다. 여기서
// "이 데이터로 이 차트를 그려도 되는가"를 결정론적으로 판정하고, 안 되면 왜 안 되는지를
// 사용자에게 보여줄 한 줄 사유와 함께 막대로 폴백시킨다.
//
// 전부 순수 함수다(레지스트리/DB 접근 없음) — 호출부가 metric 정보를 넘겨준다.
// 반환: { ok: true } 또는 { ok: false, reason: '사용자에게 보여줄 한국어 사유' }

// 도넛 슬라이스 상한. 넘으면 거부가 아니라 상위 (N-1)개 + "기타"로 접는다 —
// "전체 딜러별"처럼 지극히 평범한 breakdown이 카테고리 수 때문에 도넛이 아예 안 되면
// 사용자가 기능이 고장난 걸로 받아들인다.
export const DONUT_MAX_SLICES = 8
export const DONUT_MIN_SLICES = 2
export const OTHER_SLICE_LABEL = '기타'

const RATIO_LIKE_TYPES = ['ratio_metric', 'conversion_metric', 'progress_metric']

function isRatioLike(metric) {
  return RATIO_LIKE_TYPES.includes(metric?.metric_type) || metric?.format === 'percentage'
}

// 도넛: 부분의 합이 전체가 되어야 의미가 있다.
// - 비율/퍼센트 지표는 더해도 전체가 아니다(달성률 3개를 더한 원은 아무 뜻이 없다)
// - 음수가 있으면 면적으로 표현 불가
// - 카테고리가 1개면 원 하나뿐이라 정보가 없다
export function checkDonutEligible(rows, valueKey, metric) {
  if (isRatioLike(metric)) {
    return { ok: false, reason: '비율(%) 지표는 더해서 100%가 되는 값이 아니라 도넛으로 표시하면 왜곡됩니다 — 막대로 표시했습니다.' }
  }
  const values = rows.map((r) => Number(r[valueKey]))
  if (values.some((v) => !Number.isFinite(v))) {
    return { ok: false, reason: '숫자가 아닌 값이 있어 도넛으로 표시할 수 없어 막대로 표시했습니다.' }
  }
  if (values.some((v) => v < 0)) {
    return { ok: false, reason: '음수 값이 있어 도넛(면적 비율)으로 표시할 수 없어 막대로 표시했습니다.' }
  }
  if (rows.length < DONUT_MIN_SLICES) {
    return { ok: false, reason: '항목이 하나뿐이라 도넛으로 나눌 게 없어 막대로 표시했습니다.' }
  }
  if (values.reduce((a, b) => a + b, 0) <= 0) {
    return { ok: false, reason: '합계가 0이라 도넛 비율을 계산할 수 없어 막대로 표시했습니다.' }
  }
  return { ok: true }
}

// 슬라이스가 너무 많으면 값 기준 상위 (maxSlices-1)개만 남기고 나머지를 "기타" 하나로
// 합친다. 원본 rows는 건드리지 않는다. 총합은 보존된다.
//
// 카테고리가 많다고 도넛을 거부하지 않는 이유: "전체 딜러별"처럼 지극히 평범한 breakdown이
// 카테고리 수 때문에 아예 안 되면 사용자는 기능이 고장난 걸로 받아들인다. 상위 몇 개 +
// 기타가 원래 도넛의 관용적인 표현이기도 하다.
export function foldDonutRows(rows, labelKey, valueKey, maxSlices = DONUT_MAX_SLICES) {
  if (rows.length <= maxSlices) return rows
  const sorted = [...rows].sort((a, b) => (Number(b[valueKey]) || 0) - (Number(a[valueKey]) || 0))
  const head = sorted.slice(0, maxSlices - 1)
  const restTotal = sorted.slice(maxSlices - 1).reduce((sum, r) => sum + (Number(r[valueKey]) || 0), 0)
  return [...head, { [labelKey]: OTHER_SLICE_LABEL, [valueKey]: restTotal }]
}

// 산점도: 점 하나가 (x, y) 두 측정값을 가져야 한다. 즉 "지표 2개 + 차원 1개"일 때만
// 성립한다(차원 값 하나가 점 하나). 지표가 1개면 y축이 없고, 3개 이상이면 어느 둘을
// 고를지 근거가 없다.
export function checkScatterEligible(metricIds, dimId) {
  if (!dimId) {
    return { ok: false, reason: '산점도는 점을 구분할 기준(차원)이 필요해 막대로 표시했습니다.' }
  }
  if (metricIds.length !== 2) {
    return { ok: false, reason: `산점도는 X축·Y축에 쓸 지표가 정확히 2개여야 하는데 ${metricIds.length}개라 막대로 표시했습니다.` }
  }
  return { ok: true }
}

// 레이더(5각형): 축이 3개 미만이면 다각형이 안 되고, 너무 많으면 라벨이 겹쳐 못 읽는다.
export const RADAR_MIN_AXES = 3
export const RADAR_MAX_AXES = 8

export function checkRadarEligible(rows) {
  if (rows.length < RADAR_MIN_AXES) {
    return { ok: false, reason: `레이더 차트는 축이 최소 ${RADAR_MIN_AXES}개 필요한데 ${rows.length}개라 막대로 표시했습니다.` }
  }
  if (rows.length > RADAR_MAX_AXES) {
    return { ok: false, reason: `항목이 ${rows.length}개로 많아 레이더로는 겹쳐 보여서 막대로 표시했습니다.` }
  }
  return { ok: true }
}

// 호출부가 family 문자열 하나로 판정을 위임할 수 있게 하는 진입점.
// ctx: { rows, valueKey, metric, metricIds, dimId }
export function checkChartEligible(family, ctx) {
  if (family === 'donut' || family === 'pie') return checkDonutEligible(ctx.rows, ctx.valueKey, ctx.metric)
  if (family === 'scatter') return checkScatterEligible(ctx.metricIds || [], ctx.dimId)
  if (family === 'radar') return checkRadarEligible(ctx.rows)
  return { ok: true }
}
