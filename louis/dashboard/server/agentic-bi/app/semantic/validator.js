// SemanticQueryValidator — live ESM port of agentic_bi_design/app/semantic/validator.js
import { loadRegistry } from './registry.js'

const MAX_RESULT_ROWS = 500

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
}

function checkFilterDimensionsExist(ir, registry, errors) {
  for (const f of ir.filters || []) {
    if (!registry.dimensions.has(f.dimension)) {
      errors.push({ code: 'unknown_filter_dimension', path: 'filters', message: `등록되지 않은 filter dimension: ${f.dimension}` })
    }
  }
}

function checkGrainCompatibility(ir, registry, errors) {
  for (const metricId of ir.metrics) {
    const metric = registry.metrics.get(metricId)
    if (!metric) continue
    const allowed = new Set(metric.dimensions || [])
    for (const dimId of ir.dimensions || []) {
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
  checkNoDuplicateMetrics(ir, errors)
  checkResultSizeBound(ir, errors)

  return { ok: errors.length === 0, errors }
}
