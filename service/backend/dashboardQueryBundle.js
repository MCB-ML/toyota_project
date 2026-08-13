import { queryFabric, queryFabricCertified } from './fabricClient.js'
import { mergeMetricRows, applyRatioDerivation, applyTimeSeriesTransform } from './agentic-bi/mergeMetricRows.js'
import { runTargetMetric } from './agentic-bi/funnelDerived/fromSalesAchievement.js'
import { runFunnelMonthSeries } from './agentic-bi/funnelDerived/monthSeries.js'

// 2026-08-03 leo: 기존에는 target-report가 certified 실행 모드 검증에서 제외되어 저장 객체 재조회가 실패했다. 등록된 리포트 재실행도 인증된 실행 원본으로 허용한다.
const CERTIFIED_REPLAY_SOURCES = new Set(['funnel-derived', 'target-report'])

function asArray(value) {
  return Array.isArray(value) ? value : []
}

function dimensionFields(value) {
  return Array.isArray(value) ? value.filter(Boolean) : (value ? [value] : [])
}

function metricKeys(object, bundle) {
  const spec = object.querySpec || {}
  const configured = [
    ...asArray(spec.yKeys),
    ...asArray(spec.barKeys),
    ...asArray(spec.lineKeys),
    ...asArray(spec.sumKeys),
    ...(spec.valueKey ? [spec.valueKey] : []),
  ]
  const derived = asArray(bundle.derivations).map((item) => item?.outputKey).filter(Boolean)
  return [...new Set([...configured, ...derived, ...bundle.queries.map((item) => item.metricId).filter(Boolean)])]
}

function alignRowsToMetricId(rows, metricId, dimensionKey) {
  if (!metricId || !Array.isArray(rows)) return rows
  const dimensions = new Set(dimensionFields(dimensionKey))
  return rows.map((row) => {
    if (!row || typeof row !== 'object' || Object.prototype.hasOwnProperty.call(row, metricId)) return row

    const valueColumns = Object.keys(row).filter((key) => !dimensions.has(key))
    // Older saved widgets can contain SQL compiled for an SC-specific metric
    // variant while the query bundle keeps the requested metric id. A query
    // bundle executes one metric per SQL statement, so a single value column is
    // safe to align before merge/ratio derivation.
    if (valueColumns.length !== 1) return row
    return { ...row, [metricId]: row[valueColumns[0]] }
  })
}

export function normalizeQueryBundle(object) {
  const persisted = object?.queryBundle && typeof object.queryBundle === 'object' ? object.queryBundle : {}
  const legacyQueries = asArray(object?.sqlQueries)
  const queries = asArray(persisted.queries).length
    ? persisted.queries
    : legacyQueries.length
      ? legacyQueries
      : object?.sql
        ? [{ metricId: object?.topic || object?.id, db: object?.db, sql: object.sql }]
        : []

  return {
    version: Number.isInteger(persisted.version) ? persisted.version : 1,
    queries: queries
      .filter((query) => query?.sql)
      .map((query, index) => ({
        id: query.id || `${query.metricId || object?.id || 'query'}_${index + 1}`,
        metricId: query.metricId || object?.topic || object?.id,
        db: query.db || object?.db,
        sql: query.sql,
        ...(query.execution ? { execution: query.execution } : {}),
        // 2026-08-04 leo: 저장 객체도 실행 당시 선언된 source dependency를 보존해야 SQL 파싱
        // 없이 watermark fingerprint를 재구성할 수 있다.
        ...(Array.isArray(query.sourceDependencies) ? { sourceDependencies: query.sourceDependencies } : {}),
        ...(Array.isArray(query.source_dependencies) ? { sourceDependencies: query.source_dependencies } : {}),
      })),
    merge: {
      dimensionKey: persisted.merge?.dimensionKey ?? object?.querySpec?.dimensionKeys ?? object?.querySpec?.xKey ?? object?.querySpec?.labelKey ?? null,
    },
    derivations: asArray(persisted.derivations).length
      ? persisted.derivations
      : [object?.querySpec?.ratioMeta, ...asArray(object?.querySpec?.derivations)].filter(Boolean),
    transform: persisted.transform || (object?.querySpec?.timeSeriesTransform
      ? {
          type: object.querySpec.timeSeriesTransform,
          ...(object.querySpec.cumulativeResetPeriod ? { resetPeriod: object.querySpec.cumulativeResetPeriod } : {}),
        }
      : null),
  }
}

// 2026-08-03 leo: 기존에는 저장된 인증 리포트를 SQL executor로 보내거나 미지원 모드로 거절했다. target-report는 SQL 대신 등록된 리포트 executor로 재조회한다.
function todayIso() {
  return new Date().toISOString().slice(0, 10)
}

async function executeBundleQuery(query, {
  executeReadOnly, executeCertified, executeTargetMetric, executeMonthSeries,
}) {
  const execution = query.execution
  if (!execution || execution.mode === 'read_only') return executeReadOnly(query.db, query.sql)

  if (execution.mode === 'certified' && execution.source === 'target-report') {
    if (!execution.input || typeof execution.input !== 'object' || Array.isArray(execution.input)) {
      throw new Error(`인증 리포트 재실행 입력이 올바르지 않습니다: ${query.metricId}`)
    }
    const result = await executeTargetMetric(execution.input)
    if (!result) throw new Error(`인증 리포트에서 지표를 재조회할 수 없습니다: ${query.metricId}`)
    if (!execution.outputAlias) return result.rows
    const sourceKey = execution.input.metrics?.[0]
    return result.rows.map((row) => {
      const { [sourceKey]: value, ...rest } = row
      return { ...rest, [execution.outputAlias]: value }
    })
  }

  // 월별 GOLD 파생은 달마다 같은 SQL을 다른 바인드로 돌린 결과다. params 하나로
  // 재생하면 조용히 첫 달만 남으므로 months 목록을 통째로 다시 돌린다.
  if (execution.mode === 'certified' && execution.source === 'funnel-derived-monthly') {
    if (!Array.isArray(execution.months) || !execution.months.length) {
      throw new Error(`월별 인증 재실행 목록이 비어 있습니다: ${query.metricId}`)
    }
    return executeMonthSeries(query.sql, execution.months, {
      sourceKey: execution.sourceKey,
      outputAlias: execution.outputAlias,
    })
  }

  if (execution.mode === 'certified' && CERTIFIED_REPLAY_SOURCES.has(execution.source)) {
    if (!execution.params || typeof execution.params !== 'object' || Array.isArray(execution.params)) {
      throw new Error(`인증 재실행 파라미터가 올바르지 않습니다: ${query.metricId}`)
    }
    return executeCertified(query.db, query.sql, execution.params)
  }

  throw new Error(`지원하지 않는 대시보드 쿼리 실행 모드입니다: ${execution.mode || 'unknown'}`)
}

export async function executeQueryBundle(
  object,
  {
    executeReadOnly = queryFabric,
    executeCertified = queryFabricCertified,
    // 2026-08-04 leo: target-report 재생도 일반 queryBundle과 같은 접근 범위/강제 새로고침을
    // 전달하지 않으면 인증 리포트만 다른 캐시 정책을 갖게 된다.
    executeTargetMetric = (input, options) => runTargetMetric(input, { currentDate: todayIso(), ...options }),
    executeMonthSeries = runFunnelMonthSeries,
    accessContext,
    forceRefresh = false,
  } = {},
) {
  const bundle = normalizeQueryBundle(object)
  if (!bundle.queries.length) return { rows: null, bundle, queryResults: [] }

  const settled = await Promise.allSettled(bundle.queries.map(async (query) => ({
    ...query,
    rows: await executeBundleQuery(query, {
      executeReadOnly,
      executeCertified,
      executeTargetMetric: (input) => executeTargetMetric(input, { accessContext, forceRefresh }),
      executeMonthSeries,
    }),
  })))
  const queryResults = settled.map((result, index) => (
    result.status === 'fulfilled'
      ? { id: result.value.id, metricId: result.value.metricId, status: 'ready', rowCount: result.value.rows.length }
      : { id: bundle.queries[index].id, metricId: bundle.queries[index].metricId, status: 'error', message: result.reason?.message || 'Query execution failed' }
  ))
  const failures = queryResults.filter((result) => result.status === 'error')
  if (failures.length) {
    const detail = failures.map((result) => `${result.metricId}: ${result.message}`).join('; ')
    throw new Error(`One or more dashboard queries failed: ${detail}`)
  }

  const completed = settled.map((result) => ({
    ...result.value,
    rows: alignRowsToMetricId(result.value.rows, result.value.metricId, bundle.merge.dimensionKey),
  }))
  let rows = completed.length === 1
    ? completed[0].rows
    : mergeMetricRows(completed.map((result) => ({ metricId: result.metricId, rows: result.rows })), bundle.merge.dimensionKey)

  for (const derivation of bundle.derivations) {
    rows = applyRatioDerivation(rows, derivation)
  }

  if (bundle.transform?.type && bundle.merge.dimensionKey) {
    rows = applyTimeSeriesTransform(rows, {
      dimId: bundle.merge.dimensionKey,
      metricIds: metricKeys(object, bundle),
      transform: bundle.transform.type,
      resetPeriod: bundle.transform.resetPeriod ?? null,
    })
  }

  return { rows, bundle, queryResults }
}
