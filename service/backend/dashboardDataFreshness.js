import { createHash, randomUUID } from 'node:crypto'
import { runtimeStore } from './cache/runtimeStore.js'
import { queryFabric } from './fabricClient.js'
import { loadRegistry } from './agentic-bi/app/semantic/registry.js'
import { getReport } from './reports/registry.js'

// 2026-08-04 leo: SQL 문자열 파싱으로 원본 Gold 테이블을 추론하면 CTE·별칭·인증 리포트에서
// 오판할 수 있다. Metric/Report metadata에 선언된 source dependency만 허용하고,
// MAX(ETL_TIMESTAMP) 결과를 정확히 1시간 Redis에 보관해 안전하게 최신성을 판정한다.
const IDENTIFIER_RE = /^[A-Za-z_][A-Za-z0-9_]*$/
const DEFAULT_DATABASE = 'KPI_W'
const DEFAULT_SCHEMA = 'ktws'

function positiveInteger(value, fallback) {
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback
}

export function watermarkTtlSeconds() {
  return positiveInteger(process.env.DATA_SOURCE_WATERMARK_TTL_SECONDS, 3600)
}

function hash(value) {
  return createHash('sha256').update(JSON.stringify(value), 'utf8').digest('hex')
}

function quoteIdentifier(value, label) {
  const normalized = String(value || '')
  if (!IDENTIFIER_RE.test(normalized)) throw new Error(`허용되지 않은 데이터 소스 ${label}: ${normalized}`)
  return `[${normalized}]`
}

function serializeWatermark(value) {
  if (value instanceof Date) return value.toISOString()
  if (value === undefined || value === null) return null
  return String(value)
}

export function normalizeSourceDependency(input, defaultDatabase = DEFAULT_DATABASE) {
  if (!input || typeof input !== 'object') return null
  const table = input.table || input.base_table
  if (!table) return null
  const database = input.database || input.db || defaultDatabase
  const schema = input.schema || DEFAULT_SCHEMA
  const watermarkEnabled = input.watermarkEnabled ?? input.watermark_enabled ?? true
  const watermarkColumn = input.watermarkColumn || input.watermark_column || 'ETL_TIMESTAMP'
  const sourceId = input.sourceId || input.source_id || `${database}.${schema}.${table}`
  // 실행 전에 모든 식별자를 확인해 metadata 오기입이 SQL injection 경로가 되지 않게 한다.
  quoteIdentifier(database, 'database')
  quoteIdentifier(schema, 'schema')
  quoteIdentifier(table, 'table')
  if (watermarkEnabled) quoteIdentifier(watermarkColumn, 'watermark column')
  return { sourceId, database, schema, table, watermarkEnabled: Boolean(watermarkEnabled), watermarkColumn }
}

function metricDependencies(metricId, registry, database, visited = new Set()) {
  if (!metricId || visited.has(metricId)) return []
  visited.add(metricId)
  const metric = registry.metrics.get(metricId)
  if (!metric) return []
  const declared = Array.isArray(metric.source_dependencies) ? metric.source_dependencies : []
  const own = declared.length
    ? declared.map((dependency) => normalizeSourceDependency(dependency, database)).filter(Boolean)
    : metric.base_table
      ? [normalizeSourceDependency({ source_id: `metric:${metric.base_table}`, table: metric.base_table }, database)]
      : []
  const linkedMetricIds = [
    ...(Array.isArray(metric.dependencies) ? metric.dependencies : []),
    metric.numerator_metric,
    metric.denominator_metric,
  ].filter(Boolean)
  return [...own, ...linkedMetricIds.flatMap((id) => metricDependencies(id, registry, database, visited))]
}

function dedupeDependencies(dependencies) {
  return [...new Map(dependencies.filter(Boolean).map((dependency) => [
    `${dependency.database}.${dependency.schema}.${dependency.table}.${dependency.watermarkColumn}.${dependency.watermarkEnabled}`,
    dependency,
  ])).values()].sort((a, b) => a.sourceId.localeCompare(b.sourceId))
}

// source_dependencies는 metric YAML의 명시 선언을 우선한다. 아직 선언하지 않은 기존
// metric은 이미 검증된 base_table semantic metadata에서만 의존성을 만든다. SQL 파싱은 없다.
export function sourceDependenciesForQueryBundle(bundle, { registry = loadRegistry() } = {}) {
  const queries = Array.isArray(bundle?.queries) ? bundle.queries : []
  return dedupeDependencies(queries.flatMap((query) => {
    if (query.execution?.source === 'target-report' && query.execution.reportId) {
      return sourceDependenciesForReport(query.execution.reportId)
    }
    const declared = Array.isArray(query.sourceDependencies)
      ? query.sourceDependencies
      : Array.isArray(query.source_dependencies)
        ? query.source_dependencies
        : null
    if (declared?.length) return declared.map((dependency) => normalizeSourceDependency(dependency, query.db || DEFAULT_DATABASE)).filter(Boolean)
    return metricDependencies(query.metricId, registry, query.db || DEFAULT_DATABASE)
  }))
}

export function sourceDependenciesForReport(reportId) {
  const report = getReport(reportId)
  const dependencies = Array.isArray(report.contract.source_dependencies) ? report.contract.source_dependencies : []
  return dedupeDependencies(dependencies.map((dependency) => (
    normalizeSourceDependency(dependency, report.contract.execution?.database || DEFAULT_DATABASE)
  )).filter(Boolean))
}

export function sourceDependenciesForObject(object, options = {}) {
  if (object?.querySpec?.reportId) return sourceDependenciesForReport(object.querySpec.reportId)
  return sourceDependenciesForQueryBundle(object?.queryBundle || object, options)
}

export function watermarkSqlFor(source) {
  if (!source?.watermarkEnabled) return null
  return `SELECT MAX(${quoteIdentifier(source.watermarkColumn, 'watermark column')}) AS [watermark]\nFROM ${quoteIdentifier(source.schema, 'schema')}.${quoteIdentifier(source.table, 'table')}`
}

function parseWatermarkEntry(raw) {
  if (!raw) return null
  try { return JSON.parse(raw) } catch { return null }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function waitForWatermark(cacheKey, priorCheckedAt, store, timeoutMs = 30_000) {
  const startedAt = Date.now()
  while (Date.now() - startedAt < timeoutMs) {
    await sleep(100)
    const entry = parseWatermarkEntry(await store.get(cacheKey))
    if (entry && entry.checkedAt !== priorCheckedAt) return entry
  }
  return null
}

async function loadWatermark(source, { forceRefresh, store, executeWatermarkQuery }) {
  if (!source.watermarkEnabled) return { sourceId: source.sourceId, status: 'disabled', watermark: null }
  const cacheKey = `dashboard:watermark:${hash(source)}`
  const initial = parseWatermarkEntry(await store.get(cacheKey))
  if (!forceRefresh && initial) return initial

  // 2026-08-04 leo: 페이지 내 여러 위젯이 같은 source를 쓸 때 기존 구현은 캐시 미스
  // 순간 MAX(ETL_TIMESTAMP)를 각각 실행했다. source별 lock과 double-read로 1회만 조회하고
  // 나머지 요청은 그 결과를 재사용한다. force refresh도 같은 시점의 확인 결과를 공유한다.
  const lockKey = `${cacheKey}:lock`
  const token = randomUUID()
  const lockTtlSeconds = Number(process.env.DATA_SOURCE_WATERMARK_LOCK_TTL_SECONDS) || 30
  const ownsLock = await store.acquireLock(lockKey, token, { ttlSeconds: lockTtlSeconds })
  if (!ownsLock) {
    const refreshed = await waitForWatermark(cacheKey, initial?.checkedAt, store, lockTtlSeconds * 1000)
    if (refreshed) return refreshed
  } else {
    try {
      const afterLock = parseWatermarkEntry(await store.get(cacheKey))
      // 이미 다른 force refresh가 끝났다면 같은 source를 다시 조회하지 않는다.
      if (afterLock && (!forceRefresh || afterLock.checkedAt !== initial?.checkedAt)) return afterLock
      const rows = await executeWatermarkQuery(source.database, watermarkSqlFor(source))
      const entry = {
        sourceId: source.sourceId,
        status: 'ready',
        watermark: serializeWatermark(rows?.[0]?.watermark),
        checkedAt: new Date().toISOString(),
      }
      await store.set(cacheKey, JSON.stringify(entry), { ttlSeconds: watermarkTtlSeconds() })
      return entry
    } catch (error) {
      // ETL_TIMESTAMP가 없는 예외 테이블 또는 권한 부족이 대시보드 자체를 깨지 않게 한다.
      // 결과 캐시 TTL은 계속 적용되며 운영 로그로 source metadata 보완 대상을 찾을 수 있다.
      console.warn(`[dashboard-cache] ${source.sourceId} watermark 확인 실패: ${error.message}`)
      return { sourceId: source.sourceId, status: 'unavailable', watermark: null }
    } finally {
      await store.releaseLock(lockKey, token)
    }
  }

  // lock 보유 프로세스가 비정상 종료해도 watermark 확인만으로 화면을 막지 않는다. 이 경우
  // 현재 요청이 직접 확인하고 결과 cache TTL로 보호한다.
  try {
    const rows = await executeWatermarkQuery(source.database, watermarkSqlFor(source))
    const entry = {
      sourceId: source.sourceId,
      status: 'ready',
      watermark: serializeWatermark(rows?.[0]?.watermark),
      checkedAt: new Date().toISOString(),
    }
    await store.set(cacheKey, JSON.stringify(entry), { ttlSeconds: watermarkTtlSeconds() })
    return entry
  } catch (error) {
    console.warn(`[dashboard-cache] ${source.sourceId} watermark 확인 실패: ${error.message}`)
    return { sourceId: source.sourceId, status: 'unavailable', watermark: null }
  }
}

export async function resolveSourceFingerprint(dependencies, {
  forceRefresh = false,
  store = runtimeStore,
  executeWatermarkQuery = queryFabric,
} = {}) {
  const normalized = dedupeDependencies(dependencies || [])
  if (!normalized.length) return { fingerprint: 'no-sources', sources: [] }
  const sources = await Promise.all(normalized.map((source) => loadWatermark(source, { forceRefresh, store, executeWatermarkQuery })))
  const canonical = sources
    .map(({ sourceId, status, watermark }) => ({ sourceId, status, watermark }))
    .sort((a, b) => a.sourceId.localeCompare(b.sourceId))
  return { fingerprint: hash(canonical), sources }
}
