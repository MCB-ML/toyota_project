import test from 'node:test'
import assert from 'node:assert/strict'
import { createMemoryStore } from './cache/runtimeStore.js'
import { createDashboardResultCache } from './dashboardResultCache.js'

const policy = { enabled: true, softTtlSeconds: 1, hardTtlSeconds: 10 }

test('dashboard result cache returns fresh result without rerunning the loader', async () => {
  let clock = 1_000
  let runs = 0
  const cache = createDashboardResultCache({ store: createMemoryStore({ now: () => clock }), now: () => clock })
  const input = { namespace: 'test', keyParts: { query: 'a' }, policy, loader: async () => ({ run: ++runs }) }

  const first = await cache.execute(input)
  const second = await cache.execute(input)

  assert.deepEqual(first.value, { run: 1 })
  assert.equal(first.cache.state, 'miss')
  assert.deepEqual(second.value, { run: 1 })
  assert.equal(second.cache.state, 'fresh')
  assert.equal(runs, 1)
})

test('stale result is returned immediately and refreshed in the background', async () => {
  let clock = 1_000
  let runs = 0
  const store = createMemoryStore({ now: () => clock })
  const cache = createDashboardResultCache({ store, now: () => clock, logger: { warn() {} } })
  const input = { namespace: 'test', keyParts: { query: 'stale' }, policy, loader: async () => ({ run: ++runs }) }

  await cache.execute(input)
  clock = 2_500
  const stale = await cache.execute(input)
  await new Promise((resolve) => setTimeout(resolve, 0))
  const refreshed = await cache.execute(input)

  assert.deepEqual(stale.value, { run: 1 })
  assert.equal(stale.cache.state, 'stale')
  assert.equal(stale.cache.refreshing, true)
  assert.deepEqual(refreshed.value, { run: 2 })
  assert.equal(refreshed.cache.state, 'fresh')
})

test('force refresh bypasses a fresh result and replaces it', async () => {
  let runs = 0
  const cache = createDashboardResultCache({ store: createMemoryStore() })
  const input = { namespace: 'test', keyParts: { query: 'force' }, policy, loader: async () => ({ run: ++runs }) }

  await cache.execute(input)
  const refreshed = await cache.execute({ ...input, forceRefresh: true })

  assert.deepEqual(refreshed.value, { run: 2 })
  assert.equal(refreshed.cache.state, 'refreshed')
})

test('concurrent requests for the same key use one loader execution', async () => {
  let runs = 0
  const cache = createDashboardResultCache({ store: createMemoryStore() })
  const input = {
    namespace: 'test',
    keyParts: { query: 'single-flight' },
    policy,
    loader: async () => {
      runs += 1
      await new Promise((resolve) => setTimeout(resolve, 25))
      return { run: runs }
    },
  }

  const [first, second] = await Promise.all([cache.execute(input), cache.execute(input)])

  assert.equal(runs, 1)
  assert.deepEqual(first.value, { run: 1 })
  assert.deepEqual(second.value, { run: 1 })
})
