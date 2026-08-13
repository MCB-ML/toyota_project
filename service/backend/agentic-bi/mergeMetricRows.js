// 여러 metric을 각각 독립적으로 실행한 결과(rows)를 dimension 값 기준으로 하나의
// 행 배열로 합친다 — agenticBiPipeline.js(위젯 생성 시점)와 dashboardPagesHandler.js
// (저장된 위젯 재조회/rehydrate 시점)가 정확히 같은 병합 로직을 써야 저장 전/후 값이
// 어긋나지 않으므로 공용 모듈로 분리했다.
//
// results: [{ metricId, rows }] — 각 rows는 dimId가 있으면 [{ [dimId]: value, [metricId]: value }, ...],
// dimId가 없으면(스칼라) [{ [metricId]: value }] 형태(단일 행)라고 가정한다.
function dimensionFields(value) {
  const fields = Array.isArray(value) ? value : (value ? [value] : [])
  return [...new Set(fields.filter(Boolean))]
}

function dimensionKey(row, fields) {
  return JSON.stringify(fields.map((field) => row?.[field] ?? null))
}

function dimensionsFromRow(row, fields) {
  return Object.fromEntries(fields.map((field) => [field, row?.[field] ?? null]))
}

function compareDimensionValues(left, right, fields) {
  for (const field of fields) {
    const comparison = String(left?.[field] ?? '').localeCompare(String(right?.[field] ?? ''), 'ko', { numeric: true })
    if (comparison !== 0) return comparison
  }
  return 0
}

export function mergeMetricRows(results, dimensionKeyFields) {
  const fields = dimensionFields(dimensionKeyFields)
  if (!fields.length) {
    const row = {}
    for (const { metricId, rows } of results) row[metricId] = rows[0]?.[metricId] ?? 0
    return [row]
  }
  const dimensionValues = new Map()
  const maps = results.map(({ rows, metricId }) => new Map((rows || []).map((row) => {
    const key = dimensionKey(row, fields)
    if (!dimensionValues.has(key)) dimensionValues.set(key, dimensionsFromRow(row, fields))
    return [key, row?.[metricId]]
  })))
  const allKeys = new Set(maps.flatMap((map) => [...map.keys()]))
  // 키 순서는 각 SQL의 GROUP BY가 반환한(=DB가 정한 임의) 순서를 그대로 물려받는다 —
  // ORDER BY 없이는 월(time_month, "YYYY-MM")도 뒤죽박죽으로 나온다. 문자열 정렬이면
  // "YYYY-MM" 같은 zero-padded 값은 시간순과 정확히 일치하고, 딜러/브랜드 같은 다른
  // 문자열 dimension도 최소한 예측 가능한(가나다/알파벳) 순서가 되므로 항상 정렬한다.
  const sortedKeys = [...allKeys].sort((left, right) => compareDimensionValues(dimensionValues.get(left), dimensionValues.get(right), fields))
  return sortedKeys.map((key) => {
    const row = { ...dimensionValues.get(key) }
    results.forEach(({ metricId }, i) => { row[metricId] = maps[i].get(key) ?? 0 })
    return row
  })
}

// ratio/conversion/progress_metric은 분자·분모를 각각 독립적으로 실행한 뒤 나눈 값이라
// SQL 한 줄로 재현 불가하다(sql=null) — 대신 분자/분모 각각의 SQL을 sqlQueries로 저장해두고,
// 재조회(rehydrate) 시 mergeMetricRows로 합친 뒤 이 함수로 나눗셈만 다시 적용하면 값이
// 저장 전/후 어긋나지 않는다. agenticBiPipeline.js(생성 시점)와 dashboardPagesHandler.js
// (rehydrate 시점)가 공유한다.
export function applyRatioDerivation(rows, { numerator, denominator, outputKey, zeroDenominatorResult = null }) {
  return rows.map((row) => {
    const numVal = row[numerator] ?? 0
    const denVal = row[denominator] ?? 0
    const ratio = denVal === 0 ? zeroDenominatorResult : numVal / denVal
    return { ...row, [outputKey]: ratio }
  })
}

// "전월 대비 증감률"/"누적" 요청 — 새 metric이 아니라, 이미 계산된 시계열 행(dimId가
// time_month/time_day처럼 시간순 정렬 가능한 차원일 때)에 대한 후처리 변환이다. 하나로
// 통합해두면 앞으로 새 시간 차원(예: 주별)이 추가돼도 이 함수를 그대로 재사용할 수 있다.
// generate 시점(agenticBiPipeline.js)과 rehydrate 시점(dashboardPagesHandler.js) 둘 다
// 재조회 후 이 함수를 다시 태워야 저장 전/후 값이 어긋나지 않는다.
const PERIOD_KEY_LENGTH = { year: 4, month: 7 }

function periodKeyOf(value, resetPeriod) {
  const len = PERIOD_KEY_LENGTH[resetPeriod]
  if (!len) return null
  return String(value ?? '').slice(0, len)
}

function numericValue(value) {
  const number = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(number) ? number : 0
}

export function applyTimeSeriesTransform(rows, { dimId, metricIds, transform, resetPeriod = null }) {
  const fields = dimensionFields(dimId)
  const sourceRows = Array.isArray(rows) ? rows : []
  if (!transform || transform === 'none' || !fields.length || !sourceRows.length) return sourceRows
  const timeField = fields.find((field) => field === 'time_year' || field === 'time_month' || field === 'time_day') || fields[0]
  const partitionFields = fields.filter((field) => field !== timeField)
  const partitionKey = (row) => dimensionKey(row, partitionFields)
  const sorted = [...sourceRows].sort((left, right) => {
    const partitionComparison = compareDimensionValues(left, right, partitionFields)
    return partitionComparison || String(left?.[timeField] ?? '').localeCompare(String(right?.[timeField] ?? ''), 'ko', { numeric: true })
  })

  if (transform === 'cumulative') {
    const runningByPartition = new Map()
    const periodByPartition = new Map()
    return sorted.map((row) => {
      const out = { ...row }
      const key = partitionKey(row)
      const running = runningByPartition.get(key) || {}
      const period = periodKeyOf(row?.[timeField], resetPeriod)
      if (resetPeriod && period !== periodByPartition.get(key)) {
        for (const metricId of metricIds || []) running[metricId] = 0
        periodByPartition.set(key, period)
      }
      for (const metricId of metricIds || []) {
        running[metricId] = (running[metricId] ?? 0) + numericValue(row[metricId])
        out[metricId] = running[metricId]
      }
      runningByPartition.set(key, running)
      return out
    })
  }

  if (transform === 'mom_change_pct') {
    // 직전 구간 값이 없거나(첫 구간) 0이면 증감률 자체가 정의되지 않으므로 null —
    // KPI 카드/차트 쪽 포맷터가 null을 "N/A"로 처리하는 기존 관례(applyRatioDerivation의
    // zeroDenominatorResult=null)와 동일하게 맞춘다.
    const previousByPartition = new Map()
    return sorted.map((row) => {
      const out = { ...row }
      const key = partitionKey(row)
      const prev = previousByPartition.get(key) || {}
      for (const metricId of metricIds || []) {
        const curr = numericValue(row[metricId])
        const prevVal = prev[metricId]
        out[metricId] = (prevVal === undefined || prevVal === 0) ? null : (curr - prevVal) / prevVal
        prev[metricId] = curr
      }
      previousByPartition.set(key, prev)
      return out
    })
  }

  return sorted
}
