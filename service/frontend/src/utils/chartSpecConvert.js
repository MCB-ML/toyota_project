// 차트 종류를 바꿀 때 querySpec을 대상 chartCode 모양으로 변환한다.
//
// 왜 필요한가: 위젯을 저장하면 props가 통째로 버려지고(server/dashboardPagesHandler.js),
// 다시 열 때 chartCode + querySpec으로 props를 새로 만든다. 그런데 chartCode마다 querySpec의
// 키 이름이 다르다(server/widgetSchema.js의 buildWidgetPropsFromRows 참고):
//   bar(단일)/pie  : labelKey + valueKey
//   bar(다계열)/line/area/radar : xKey + yKeys (+ yLabels)
//   combo          : xKey + barKeys + lineKeys
//   scatter        : xKey + yKey
// 그래서 chartCode만 바꾸면 재조회 때 필요한 키가 없어 위젯이 깨진다. 여기서 변환한
// querySpec을 위젯에 그대로 저장하므로, 서버 재조회 로직은 손댈 필요가 없다.
//
// 클라이언트(편집 패널)에서 쓰지만 순수 함수라 서버에서도 그대로 import 가능하다.
import { DONUT_MAX_SLICES, RADAR_MIN_AXES, RADAR_MAX_AXES, checkDonutEligible } from '../../../backend/agentic-bi/chartEligibility.js'
import { inferTemporalGrain } from '../components/widgets/axisFormat.js'

const SPECIAL_CHART_CODES = new Set(['funnel_pyramid'])

// 이 위젯이 다루는 (차원 1개, 측정값 N개)를 chartCode에 상관없이 통일된 모양으로 뽑는다.
// 측정값이 0개면 변환 불가로 본다.
//
// dimensionKey/measureKeys는 변환할 때마다 스펙에 같이 심어두는 메타데이터다. 차트별
// 렌더링 키(xKey/yKeys/labelKey/valueKey/barKeys...)만 보고 원래 구조를 매번 역추론하면
// 정보가 새는 차트를 거칠 때 복구가 불가능해진다 — 산점도는 x/y가 둘 다 측정값이라
// 차원(예: time_month)을 아예 안 담고, 표는 측정값 목록을 안 담는다. 실제로 그래서
// "막대 -> 산점도 -> 꺾은선"을 거치면 x축이 측정값이 되어버리고(같은 컬럼이 축이자 계열),
// "표로 바꾸면 다시는 다른 차트로 못 돌아가는" 문제가 있었다(2026-07-29).
// rows를 넘기면, 스펙만으로 측정값을 알아낼 수 없을 때(대표적으로 챗봇이 처음부터 표로
// 만든 위젯 — querySpec에 xKey만 있고 값 컬럼 목록이 없다) 실제 데이터의 숫자 컬럼에서
// 추론한다. 이게 없으면 그런 위젯은 영영 다른 차트로 못 바꾼다.
function inferMeasuresFromRows(rows, dimKey) {
  const first = rows?.[0]
  if (!first) return []
  return Object.keys(first).filter((k) => k !== dimKey && typeof first[k] === 'number')
}

// 인증 리포트 표에서 온 컬럼 중 그대로 합산/평균하면 안 되는 것을 걸러낸다.
//
// 리포트의 계약목표는 팀(또는 SC) 단위 값이 활동유형 행마다 반복돼 있어서 그냥 SUM하면
// 중복 집계되고(한 팀 100이 3행에 반복 → 300), 진척률·전환률은 행 평균이 아니라
// 분자·분모를 재합산해 계산해야 한다. 차트로 만들 수 있는 건 additive 컬럼뿐이다.
// 금지 컬럼을 차트화하려면 등록된 프리셋(server/reports/projections/)을 써야 한다.
export function isChartableColumn(key, columnSemantics) {
  const sem = columnSemantics?.[key]
  if (!sem) return true // 리포트 컬럼이 아니면 기존과 동일하게 취급
  return !sem.direct_sum_forbidden && !sem.direct_average_forbidden
}

function filterChartableMeasures(measures, spec) {
  const sem = spec?.reportColumnSemantics
  if (!sem) return measures
  return measures.filter((m) => isChartableColumn(m, sem))
}

export function readSpecShape(chartCode, spec = {}, rows = null) {
  if (chartCode === 'funnel_pyramid') {
    return {
      dimKey: spec.stageKey || '단계',
      measures: Array.isArray(spec.channels) ? spec.channels : [],
      labels: Array.isArray(spec.channels) ? spec.channels : null,
    }
  }
  if (spec.dimensionKey && spec.measureKeys?.length) {
    return {
      dimKey: spec.dimensionKey,
      measures: filterChartableMeasures(spec.measureKeys, spec),
      labels: spec.measureLabels || null,
    }
  }
  // 아래는 이 메타데이터가 없던 시절에 저장된 위젯을 위한 추론 경로(하위호환).
  if (chartCode === 'combo') {
    const measures = [...(spec.barKeys || []), ...(spec.lineKeys || [])]
    return { dimKey: spec.xKey, measures, labels: spec.barLabels || spec.lineLabels }
  }
  if (chartCode === 'scatter') {
    return { dimKey: spec.seriesKey || spec.xKey, measures: [spec.xKey, spec.yKey].filter(Boolean), labels: null }
  }
  if (spec.xKey && spec.yKeys?.length) {
    return { dimKey: spec.xKey, measures: spec.yKeys, labels: spec.yLabels }
  }
  if (chartCode === 'funnel') {
    return { dimKey: spec.labelKey || spec.xKey, measures: [spec.valueKey || spec.yKey].filter(Boolean), labels: null }
  }
  // bar(단일) / pie
  if (spec.labelKey && spec.valueKey) {
    return { dimKey: spec.labelKey, measures: [spec.valueKey], labels: null }
  }
  // 여기까지 왔으면 스펙에 값 컬럼이 없다(표가 대표적) — 데이터에서 추론해 본다.
  // 리포트 표는 숫자 컬럼이라고 다 합산해도 되는 게 아니라서 여기서도 걸러낸다.
  const dimKey = spec.xKey || spec.labelKey || null
  return {
    dimKey,
    measures: dimKey ? filterChartableMeasures(inferMeasuresFromRows(rows, dimKey), spec) : [],
    labels: null,
  }
}

// 이 차원이 시간 축인가(월/일/분기...). 시간 추이를 도넛·퍼널로 바꾸면 "1월이 전체의
// 8%" 같은 무의미한 그림이 된다 — 시간 축 위젯에는 그 둘을 제안하지 않는다.
function isTemporalDimension(rows, dimKey) {
  if (!dimKey) return false
  if (/^time([_A-Z]|$)/.test(String(dimKey))) return true // semantic layer 시간 차원(time_month 등)
  const values = (rows || []).map((row) => row?.[dimKey]).filter((value) => value !== null && value !== undefined)
  return values.length > 0 && inferTemporalGrain(values) !== null
}

// 대상 chartCode가 이 데이터 모양으로 그려질 수 있는가.
// 챗봇 경로의 가드레일(server/agentic-bi/chartEligibility.js)과 같은 기준을 UI에도 건다 —
// 여기서 제안한 종류는 전환 후 실제로 그려져야 한다. "바꿨더니 에러/빈 화면"은 이 목록의
// 버그다.
// - line/area: 시간 축일 때만 — "딜러별"처럼 항목 비교 축에 선을 그리면 항목 사이에
//   없는 연속 관계가 있는 것처럼 보인다(챗봇 파이프라인의 선차트 폴백과 같은 원칙).
//   rows 를 모르는 호출은 기존처럼 관대하게 허용한다.
// - pie(도넛): 측정값 1개 + 도넛 자격(음수·비숫자·합계 0·항목 1개 거부) + 비율 지표 아님
//   + 시간 축 아님(월별 추이의 각 달은 전체의 부분이 아니다)
// - funnel: 측정값 1개 + 시간 축 아님 + 음수 없음 + 단계 2~8개(단계가 그보다 많으면 못 읽는다)
// - scatter: 측정값이 정확히 2개여야 한다(x, y)
// - radar: 축(카테고리)이 3~8개일 때만 — 12개월짜리 레이더는 겹쳐서 못 읽는다.
// - kpi: 행이 1개일 때만 의미가 있어 전환 후보에서 제외
// - 리포트 뷰 위젯: 서버가 재조회 때 reportView projection으로 차트 종류를 다시 정하므로
//   (server/reports/projection.js REPORT_VIEW_PRESETS), 여기서 바꾼 값은 다음 로드에서
//   projection과 충돌해 깨진다. 전환을 제안하지 않는다.
export function chartCodeOptionsFor(chartCode, spec = {}, rows = null) {
  if (SPECIAL_CHART_CODES.has(chartCode)) return [chartCode]
  if (spec.reportView || spec.reportId) return [chartCode]
  const { dimKey, measures } = readSpecShape(chartCode, spec, rows)
  if (!dimKey || measures.length === 0) return [chartCode]
  const rowCount = rows?.length ?? null
  const temporal = isTemporalDimension(rows, dimKey)
  const options = rows == null || temporal ? ['bar', 'line', 'area'] : ['bar']
  if (measures.length === 1 && !temporal) {
    const valueKey = measures[0]
    const ratioLike = Boolean(spec.percentageFormat || spec.ratioMeta)
    const donut = rows?.length
      ? checkDonutEligible(rows, valueKey, ratioLike ? { format: 'percentage' } : null)
      : { ok: !ratioLike }
    if (donut.ok) options.push('pie')
    const values = (rows || []).map((row) => Number(row?.[valueKey]))
    // 비율 지표는 퍼널도 거른다 — 달성률 나열은 단계 감소가 아니라서 역삼각형이 거짓말이 된다.
    // rows 를 모르는 호출(챗봇 restyle 등)은 데이터 검증 없이 통과시키고, 아는 호출(편집
    // 패널)만 행 수·음수를 실제로 검사한다.
    const funnelable = !ratioLike && (rowCount === null || (
      rowCount >= 2 && rowCount <= 8 && values.every((value) => Number.isFinite(value) && value >= 0)
    ))
    if (funnelable) options.push('funnel')
  }
  if (measures.length > 1) {
    options.push('combo')
    if (rowCount === null || (rowCount >= RADAR_MIN_AXES && rowCount <= RADAR_MAX_AXES)) options.push('radar')
  }
  if (measures.length === 2) options.push('scatter')
  options.push('table')
  return options.includes(chartCode) ? options : [chartCode, ...options]
}

// 렌더링 옵션(컬럼이 아니라 표시 방식)은 대상 차트가 쓰든 안 쓰든 그대로 넘긴다 —
// bar에서 line으로 갔다가 다시 bar로 돌아왔을 때 누적/가로 설정이 사라지지 않게 하기 위함.
const CARRY_OVER_KEYS = [
  'orientation', 'stacked', 'secondaryKeys', 'colorsBySeries',
  'timeSeriesTransform', 'cumulativeResetPeriod', 'ratioMeta', 'percentageFormat',
  'metricLabels', 'dimensionKey', 'measureKeys', 'measureLabels',
  'reportId', 'reportView', 'reportParams', 'reportGroupBy', 'reportSelectedColumns', 'reportColumnSemantics',
]

function carryOver(spec) {
  const out = {}
  for (const k of CARRY_OVER_KEYS) if (spec[k] !== undefined) out[k] = spec[k]
  return out
}

export function convertQuerySpec(fromChartCode, toChartCode, spec = {}, rows = null) {
  if (fromChartCode === toChartCode) return spec
  if (SPECIAL_CHART_CODES.has(fromChartCode) || SPECIAL_CHART_CODES.has(toChartCode)) return spec
  const { dimKey, measures, labels } = readSpecShape(fromChartCode, spec, rows)
  if (!dimKey || measures.length === 0) return spec

  // 원래 구조(차원/측정값)를 결과 스펙에 항상 같이 남긴다 — 이게 없으면 산점도·표처럼
  // 렌더링 키에 구조가 다 안 담기는 차트를 거칠 때 복구가 불가능해진다(readSpecShape 주석).
  const base = {
    ...carryOver(spec),
    dimensionKey: dimKey,
    measureKeys: measures,
    ...(labels?.length ? { measureLabels: labels } : {}),
  }

  if (toChartCode === 'pie') {
    // 측정값이 여러 개면 첫 번째만 쓴다 — 호출부(chartCodeOptionsFor)가 이미 걸러내지만
    // 직접 호출되는 경우를 대비해 조용히 깨지지 않게 한다.
    // foldTopN을 함께 붙여야 카테고리가 많은 위젯을 도넛으로 바꿔도 상위 N개 + "기타"로
    // 접힌다 — 안 붙이면 편집 패널로 바꾼 도넛만 슬라이스가 수십 개로 나와 챗봇이 만든
    // 도넛과 동작이 달라진다.
    return { ...base, labelKey: dimKey, valueKey: measures[0], foldTopN: DONUT_MAX_SLICES }
  }
  if (toChartCode === 'funnel') {
    return { ...base, labelKey: dimKey, valueKey: measures[0] }
  }
  if (toChartCode === 'bar' && measures.length === 1) {
    return { ...base, labelKey: dimKey, valueKey: measures[0] }
  }
  if (toChartCode === 'combo') {
    // 첫 계열은 막대, 나머지는 선 — "실적은 막대, 목표는 선" 관례에 맞춘 기본 배치.
    return { ...base, xKey: dimKey, barKeys: measures.slice(0, 1), lineKeys: measures.slice(1) }
  }
  if (toChartCode === 'scatter') {
    return { ...base, xKey: measures[0], yKey: measures[1], seriesKey: undefined }
  }
  if (toChartCode === 'table') {
    // table은 rows의 컬럼을 그대로 표로 만든다(widgetSchema.js) — 병합 기준만 남긴다.
    return { ...base, xKey: dimKey }
  }
  // bar(다계열) / line / area / radar
  return { ...base, xKey: dimKey, yKeys: measures, ...(labels?.length ? { yLabels: labels } : {}) }
}

// 위젯 props에서 "객체 배열" 형태의 원본 행을 꺼낸다. 차트 위젯은 props.data가 그대로
// 그 모양이지만, 두 종류는 저장 시 원본 컬럼명이 사라져 되돌려야 한다:
//   - 표: props.columns(컬럼명) + props.rows(2차원 배열) (widgetSchema.js table case)
//   - 도넛(pie): props.data가 [{name, value}]로 접힌다 (widgetSchema.js pie case).
//     querySpec에 labelKey/valueKey가 남아 있으면 원래 컬럼명으로 복원한다 — 안 하면
//     편집 패널의 저장/차트 전환이 name/value 행 위에서 원본 키를 찾다 전부 undefined가
//     되어 위젯이 깨진다(도넛에서 저장만 눌러도 깨지던 버그).
// 편집 패널과 챗봇 restyle이 같은 변환을 쓰도록 공용 함수로 둔다.
export function rowsFromWidgetProps(props = {}, { chartCode = null, querySpec = null } = {}) {
  if (Array.isArray(props.data)) {
    const rows = props.data
    const labelKey = querySpec?.labelKey
    const valueKey = querySpec?.valueKey
    if (
      chartCode === 'pie' && labelKey && valueKey && rows.length &&
      rows.every((row) => row && typeof row === 'object' && 'name' in row && 'value' in row) &&
      !(labelKey in (rows[0] || {}))
    ) {
      return rows.map((row) => ({ [labelKey]: row.name, [valueKey]: row.value }))
    }
    return rows
  }
  const { columns, rows } = props
  if (!columns?.length || !rows?.length) return []
  return rows.map((r) => Object.fromEntries(columns.map((c, i) => [c, r[i]])))
}

// 편집 패널의 "계열" 목록 — 색을 지정할 키와 표시 이름을 함께 준다.
// pie는 컬럼이 아니라 카테고리 값 하나하나가 색 대상이므로 rows에서 뽑는다.
export function seriesKeysFor(chartCode, spec = {}, rows = []) {
  if (chartCode === 'funnel_pyramid') {
    const channels = Array.isArray(spec.channels) && spec.channels.length
      ? spec.channels
      : [...new Set(rows.flatMap((row) => Object.keys(row || {})))].filter((key) => (
          !['연도', '월', '브랜드', '딜러', '전시장', '팀', 'SC', '단계', '단계 합계', '전체 전환율', '항목'].includes(key)
          && rows.some((row) => Number.isFinite(Number(String(row?.[key] ?? '').replaceAll(',', '').replace('%', ''))))
        ))
    return channels.map((key) => ({ key, label: key }))
  }
  if (chartCode === 'pie' || chartCode === 'funnel') {
    const labelKey = spec.labelKey
    return [...new Set(rows.map((r) => String(r[labelKey])))].map((name) => ({ key: name, label: name }))
  }
  const { measures, labels } = readSpecShape(chartCode, spec, rows)
  return measures.map((key, i) => ({ key, label: labels?.[i] || key }))
}
