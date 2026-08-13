import test from 'node:test'
import assert from 'node:assert/strict'
import { createMemoryStore } from './cache/runtimeStore.js'
import {
  normalizeSourceDependency,
  resolveSourceFingerprint,
  sourceDependenciesForQueryBundle,
  sourceDependenciesForReport,
  watermarkSqlFor,
  watermarkTtlSeconds,
} from './dashboardDataFreshness.js'
import { loadRegistry } from './agentic-bi/app/semantic/registry.js'
import { listReports } from './reports/registry.js'

test('semantic metric base_table becomes a declared source dependency without SQL parsing', () => {
  const dependencies = sourceDependenciesForQueryBundle({
    queries: [{ metricId: 'activity_mtd_actual', db: 'KPI_W', sql: 'SELECT this text is never parsed' }],
  }, { registry: loadRegistry() })

  assert.equal(dependencies.length, 1)
  assert.equal(dependencies[0].table, 'FCT_ACTIVITY_v2')
  assert.equal(dependencies[0].watermarkColumn, 'ETL_TIMESTAMP')
})

test('every registered certified report has an explicit dependency set', () => {
  for (const report of listReports()) {
    assert.ok(Array.isArray(report.contract.source_dependencies), `${report.report_id} source_dependencies missing`)
    assert.ok(report.contract.source_dependencies.length > 0, `${report.report_id} source_dependencies empty`)
    assert.ok(sourceDependenciesForReport(report.report_id).length > 0)
  }
})

test('target-report query bundles use the registered report dependencies', () => {
  const dependencies = sourceDependenciesForQueryBundle({
    queries: [{
      metricId: 'delivery_mtd_target',
      db: 'KPI_W',
      sql: '-- registered report replay',
      execution: { source: 'target-report', reportId: 'sales_achievement_delivery' },
    }],
  })
  const expected = sourceDependenciesForReport('sales_achievement_delivery')
  assert.deepEqual(dependencies, expected)
})

test('watermark reads are cached for the configured one-hour default and force refresh bypasses it', async () => {
  const store = createMemoryStore()
  const dependency = normalizeSourceDependency({ source_id: 'activity', database: 'KPI_W', table: 'FCT_ACTIVITY_v2' })
  let calls = 0
  const query = async () => [{ watermark: `2026-08-04T00:00:0${++calls}.000Z` }]

  const first = await resolveSourceFingerprint([dependency], { store, executeWatermarkQuery: query })
  const second = await resolveSourceFingerprint([dependency], { store, executeWatermarkQuery: query })
  const forced = await resolveSourceFingerprint([dependency], { store, executeWatermarkQuery: query, forceRefresh: true })

  assert.equal(watermarkTtlSeconds(), 3600)
  assert.equal(calls, 2)
  assert.equal(first.fingerprint, second.fingerprint)
  assert.notEqual(second.fingerprint, forced.fingerprint)
})

test('concurrent widgets sharing a source execute one watermark query', async () => {
  const store = createMemoryStore()
  const dependency = normalizeSourceDependency({ source_id: 'lead', database: 'KPI_W', table: 'FCT_LEAD' })
  let calls = 0
  const query = async () => {
    calls += 1
    await new Promise((resolve) => setTimeout(resolve, 20))
    return [{ watermark: '2026-08-04T01:00:00.000Z' }]
  }

  await Promise.all([
    resolveSourceFingerprint([dependency], { store, executeWatermarkQuery: query }),
    resolveSourceFingerprint([dependency], { store, executeWatermarkQuery: query }),
  ])

  assert.equal(calls, 1)
})

test('only metadata identifiers can produce a watermark query', () => {
  assert.match(watermarkSqlFor(normalizeSourceDependency({ table: 'FCT_LEAD' })), /MAX\(\[ETL_TIMESTAMP\]\)/)
  assert.throws(() => normalizeSourceDependency({ table: 'FCT_LEAD; DROP TABLE users' }), /허용되지 않은 데이터 소스/)
})
