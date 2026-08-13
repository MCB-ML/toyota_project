import test from 'node:test'
import assert from 'node:assert/strict'
import { executeCachedQueryBundle } from './dashboardObjectExecution.js'
import { createDashboardResultCache } from './dashboardResultCache.js'
import { createMemoryStore } from './cache/runtimeStore.js'
import { dashboardAccessContextFor } from './dashboardAccessControl.js'

// 운영 캐싱 정책의 핵심 계약:
//   객체가 화면에 그려질 때 원본 테이블의 MAX(ETL_TIMESTAMP)(watermark)를 확인하고,
//   그 값이 캐시 키(sourceFingerprint)에 들어간다. ETL 이 새로 돌면 키가 갈려
//   저장된 SQL 이 재실행되고, 안 돌았으면 같은 딜러사 안에서 캐시를 공유한다.
//   이 경로는 개인 작업본과 배포본이 같은 rehydrate 코드를 쓰므로 배포본에도 그대로다.

const OBJECT = {
  id: 'obj-1',
  queryBundle: {
    version: 1,
    queries: [{
      id: 'q1',
      metricId: 'contract_count',
      db: 'KPI_W',
      sql: 'SELECT 1 AS value',
      sourceDependencies: [{ table: 'FCT_CONTRACT_KTWS' }],
    }],
  },
}

function harness({ fingerprints }) {
  let clock = 1_000
  const cache = createDashboardResultCache({ store: createMemoryStore({ now: () => clock }), now: () => clock })
  let executions = 0
  let fingerprintCalls = 0
  const watermarkForceFlags = []
  const deps = [{ sourceId: 'KPI_W.ktws.FCT_CONTRACT_KTWS', database: 'KPI_W', schema: 'ktws', table: 'FCT_CONTRACT_KTWS', watermarkEnabled: true, watermarkColumn: 'ETL_TIMESTAMP' }]
  const run = (accessContext, { forceRefresh = false } = {}) => executeCachedQueryBundle(OBJECT, {
    accessContext,
    forceRefresh,
    resultCache: cache,
    resolveDependencies: () => deps,
    resolveFingerprint: async (_deps, { forceRefresh: watermarkForce } = {}) => {
      fingerprintCalls += 1
      watermarkForceFlags.push(Boolean(watermarkForce))
      const index = Math.min(fingerprintCalls - 1, fingerprints.length - 1)
      return { fingerprint: fingerprints[index], sources: [] }
    },
    executeBundle: async () => ({ rows: [{ value: ++executions }], queryResults: [] }),
  })
  return { run, executions: () => executions, watermarkForceFlags }
}

test('배포본: 같은 딜러사가 다시 보면 ETL 이 그대로인 한 SQL 을 재실행하지 않는다', async () => {
  const { run, executions } = harness({ fingerprints: ['etl-v1', 'etl-v1'] })
  const shared = dashboardAccessContextFor({ scopeKey: 'dealer:토요타 용산' })

  const first = await run(shared)   // 딜러사의 첫 사용자가 열었다
  const second = await run(shared)  // 같은 딜러사의 다른 사용자가 열었다

  assert.equal(first.cache.state, 'miss')
  assert.equal(second.cache.state, 'fresh')
  assert.equal(executions(), 1)
  assert.deepEqual(second.rows, first.rows)
})

test('배포본: ETL_TIMESTAMP 가 갱신되면(fingerprint 변경) 저장된 SQL 이 재실행된다', async () => {
  const { run, executions } = harness({ fingerprints: ['etl-v1', 'etl-v2'] })
  const shared = dashboardAccessContextFor({ scopeKey: 'dealer:토요타 용산' })

  const before = await run(shared)
  const after = await run(shared)   // watermark TTL 이 지나 새 MAX(ETL_TIMESTAMP)를 읽은 뒤

  assert.equal(executions(), 2)     // 키가 갈려 재실행됐다
  assert.equal(after.cache.state, 'miss')
  assert.notEqual(after.sourceFingerprint, before.sourceFingerprint)
})

test('강제 새로고침은 watermark 확인까지 우회 신호를 전달한다', async () => {
  const { run, watermarkForceFlags } = harness({ fingerprints: ['etl-v1'] })
  const shared = dashboardAccessContextFor({ scopeKey: 'dealer:토요타 용산' })

  await run(shared)                                          // 일반 진입 — watermark 캐시 사용
  const result = await run(shared, { forceRefresh: true })   // 사용자의 명시적 새로고침

  // resolveFingerprint 가 forceRefresh=true 로 불려야 캐시된 watermark 를 지나쳐
  // 지금 시점의 MAX(ETL_TIMESTAMP)를 다시 읽는다.
  assert.deepEqual(watermarkForceFlags, [false, true])
  assert.equal(result.cache.state, 'refreshed')
})

test('딜러사가 다르면 같은 SQL 이라도 캐시를 공유하지 않는다', async () => {
  const { run, executions } = harness({ fingerprints: ['etl-v1', 'etl-v1'] })

  await run(dashboardAccessContextFor({ scopeKey: 'dealer:토요타 용산' }))
  await run(dashboardAccessContextFor({ scopeKey: 'dealer:렉서스 강남' }))

  assert.equal(executions(), 2)
})
