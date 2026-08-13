// SemanticQueryValidator — live ESM port of agentic_bi_design/app/semantic/validator.js
import { loadRegistry } from './registry.js'

const MAX_RESULT_ROWS = 500
const TIME_DIMENSION_GRAINS = {
  time_day: 'day',
  time_month: 'month',
  time_year: 'year',
}

function getSupportedTimeGrains(metric) {
  if (Array.isArray(metric.supported_time_grains) && metric.supported_time_grains.length > 0) {
    return metric.supported_time_grains
  }
  return (metric.grain || []).filter((g) => ['day', 'month', 'year'].includes(g))
}

function checkMetricsExist(ir, registry, errors) {
  for (const metricId of ir.metrics) {
    if (!registry.metrics.has(metricId)) {
      errors.push({ code: 'unknown_metric', path: 'metrics', message: `등록되지 않은 metric: ${metricId}` })
    }
  }
}

function checkDimensionsExist(ir, registry, errors) {
  for (const dimId of ir.dimensions || []) {
    if (!registry.dimensions.has(dimId)) {
      errors.push({ code: 'unknown_dimension', path: 'dimensions', message: `등록되지 않은 dimension: ${dimId}` })
    }
  }
  if (ir.series_dimension && !registry.dimensions.has(ir.series_dimension)) {
    errors.push({ code: 'unknown_dimension', path: 'series_dimension', message: `등록되지 않은 series_dimension: ${ir.series_dimension}` })
  }
}

function checkFilterDimensionsExist(ir, registry, errors) {
  for (const f of ir.filters || []) {
    if (!registry.dimensions.has(f.dimension)) {
      errors.push({ code: 'unknown_filter_dimension', path: 'filters', message: `등록되지 않은 filter dimension: ${f.dimension}` })
    }
  }
}

// 시간축(연/월/일)으로 쪼갤 수 있는 지표인가 — 자기 기준 날짜 컬럼이 있으면 된다.
// 비율/전환/진척 지표는 base_table/time_dimension이 없지만, resolveMetricRows가 분자·분모를
// 각각 재귀로 풀어 dimension 기준으로 병합한 뒤 나누므로(agenticBiPipeline.js), 분자·분모가
// 둘 다 시간축을 지원하면 비율 지표도 그대로 따라온다.
function supportsTimeAxis(metric, registry) {
  if (metric.time_dimension) return true
  const num = metric.numerator_metric ? registry.metrics.get(metric.numerator_metric) : null
  const den = metric.denominator_metric ? registry.metrics.get(metric.denominator_metric) : null
  if (num && den) return Boolean(num.time_dimension && den.time_dimension)
  return false
}

// 2026-07-29: 이 함수는 머지(2539dd5)에서 두 갈래가 겹쳐 들어가며 중괄호가 깨져 있었다
// (바깥 dimId 루프가 안 닫힌 채 안쪽 루프가 시작 → 함수가 안 끝나 esbuild가 파일 뒤쪽
// export에서 실패). 아래는 두 갈래를 순서대로 살린 형태다:
//   1) derive_grain 시간축(time_year/month/day) — 지표에 기준 날짜 컬럼만 있으면 허용
//   2) derive_grain이 없는 구형 시간 차원 — 지표별 supported_time_grains/grain으로 검사
//   3) 그 외 일반 차원 — metric.dimensions 화이트리스트로 검사
// 지금 등록된 시간 차원은 셋 다 derive_grain을 갖고 있어 실제로는 1)에서 끝나고, 2)는
// derive_grain 없이 등록되는 시간 차원이 생길 때를 위한 안전망으로 남겨둔다.
function checkGrainCompatibility(ir, registry, errors) {
  for (const metricId of ir.metrics) {
    const metric = registry.metrics.get(metricId)
    if (!metric) continue
    const allowed = new Set(metric.dimensions || [])
    // series_dimension(계열 분리 축)도 breakdown 축과 같은 검사를 받아야 한다.
    const dimIds = [...(ir.dimensions || [])]
    if (ir.series_dimension) dimIds.push(ir.series_dimension)

    for (const dimId of dimIds) {
      const dimDef = registry.dimensions.get(dimId)
      // 시간축 차원(dimensions.yaml의 derive_grain)은 metric.dimensions 화이트리스트를 보지
      // 않는다 — 기준 날짜 컬럼만 있으면 연/월/일 어느 쪽으로든 쪼갤 수 있고, 그건 지표마다
      // 일일이 등록해줄 성질이 아니기 때문이다(등록 누락이 곧 "조회 불가"가 되던 문제).
      // 실제 SQL은 그 지표 자신의 time_dimension에서 파생된다 — app/semantic/compiler.js의
      // resolveDimensionSqlExpr 참고.
      if (dimDef?.derive_grain) {
        if (!supportsTimeAxis(metric, registry)) {
          errors.push({
            code: 'time_axis_unsupported',
            path: 'dimensions',
            message: `metric '${metricId}'은 기준 날짜 컬럼(time_dimension)이 없어 시간축 '${dimId}'으로 분해할 수 없음`,
          })
        }
        continue
      }

      const timeGrain = TIME_DIMENSION_GRAINS[dimId]
      if (timeGrain) {
        const supported = new Set(getSupportedTimeGrains(metric))
        if (!supported.has(timeGrain)) {
          errors.push({
            code: 'time_grain_incompatible',
            path: 'dimensions',
            message: `metric '${metricId}'은 ${timeGrain} 시간축 breakdown이 등록되어 있지 않음 (metric.supported_time_grains/grain: [${[...supported].join(', ')}])`,
          })
        }
        continue
      }

      if (allowed.size > 0 && !allowed.has(dimId)) {
        errors.push({
          code: 'grain_incompatible',
          path: 'dimensions',
          message: `metric '${metricId}'은 dimension '${dimId}'로 breakdown이 등록되어 있지 않음 (metric.dimensions: [${[...allowed].join(', ')}])`,
        })
      }
    }
  }
}

function checkTrendShape(ir, errors) {
  if (ir.intent !== 'trend_over_time') return
  if (!['day', 'month'].includes(ir.time_grain)) {
    errors.push({ code: 'missing_time_grain', path: 'time_grain', message: 'trend_over_time은 time_grain(day|month)이 필요함' })
  }
  const expectedTimeDimension = ir.time_grain === 'day' ? 'time_day' : ir.time_grain === 'month' ? 'time_month' : null
  if (expectedTimeDimension && !(ir.dimensions || []).includes(expectedTimeDimension)) {
    errors.push({ code: 'missing_time_dimension', path: 'dimensions', message: `trend_over_time ${ir.time_grain} 분석은 ${expectedTimeDimension} dimension이 필요함` })
  }
}

function checkJoinPathExists(ir, registry, errors) {
  if (registry.joins.size === 0) {
    errors.push({ code: 'no_joins_registered', path: '$', message: 'joins.yaml이 비어있음 — 컴파일 불가' })
  }
}

function checkRequiredFiltersPresent(ir, registry, errors) {
  for (const metricId of ir.metrics) {
    const metric = registry.metrics.get(metricId)
    if (!metric) continue
    for (const ruleId of metric.required_filters || []) {
      if (ruleId === 'unresolved') continue
      if (!registry.filters.has(ruleId)) {
        errors.push({ code: 'missing_filter_rule', path: 'metrics', message: `metric '${metricId}'이 참조하는 filter rule '${ruleId}'이 filters.yaml에 없음` })
      }
    }
  }
}

function checkAuthorizationScope(ir, userContext, authorizationScope, errors) {
  if (!authorizationScope || authorizationScope.dealerScope == null) return
  const dealerFilter = (ir.filters || []).find((f) => f.dimension === 'dealer')
  const requested = dealerFilter ? dealerFilter.values : null
  if (requested) {
    const allowed = new Set(authorizationScope.dealerScope)
    const forbidden = requested.filter((v) => !allowed.has(v))
    if (forbidden.length > 0) {
      errors.push({ code: 'authorization_violation', path: 'filters', message: `조회 권한 밖의 딜러 요청: ${forbidden.join(', ')}` })
    }
  }
}

function checkTimeRangeClear(ir, errors) {
  const tr = ir.time_range
  if (!tr) return errors.push({ code: 'missing_time_range', path: 'time_range', message: 'time_range 누락' })
  if (tr.type === 'relative' && tr.anchor_date !== 'runtime_context') {
    errors.push({ code: 'ambiguous_time_anchor', path: 'time_range.anchor_date', message: 'anchor_date가 runtime_context가 아님' })
  }
}

function checkNoDuplicateMetrics(ir, errors) {
  if (new Set(ir.metrics).size !== ir.metrics.length) {
    errors.push({ code: 'duplicate_metric', path: 'metrics', message: '동일 metric 중복 요청' })
  }
}

function checkResultSizeBound(ir, errors) {
  const limit = ir.limit ?? 50
  if (limit > MAX_RESULT_ROWS) {
    errors.push({ code: 'result_too_large', path: 'limit', message: `limit(${limit})이 최대 허용치(${MAX_RESULT_ROWS})를 초과` })
  }
  const dimCount = (ir.dimensions || []).length
  if (dimCount >= 3 && limit > 100) {
    errors.push({ code: 'cardinality_risk', path: 'dimensions', message: '3개 이상 dimension breakdown + 큰 limit 조합' })
  }
}

export function validateSemanticQuery(ir, { userContext = {}, authorizationScope = null } = {}) {
  const registry = loadRegistry()
  const errors = []

  checkMetricsExist(ir, registry, errors)
  checkDimensionsExist(ir, registry, errors)
  checkFilterDimensionsExist(ir, registry, errors)
  checkGrainCompatibility(ir, registry, errors)
  checkJoinPathExists(ir, registry, errors)
  checkRequiredFiltersPresent(ir, registry, errors)
  checkAuthorizationScope(ir, userContext, authorizationScope, errors)
  checkTimeRangeClear(ir, errors)
  checkTrendShape(ir, errors)
  checkNoDuplicateMetrics(ir, errors)
  checkResultSizeBound(ir, errors)

  return { ok: errors.length === 0, errors }
}
