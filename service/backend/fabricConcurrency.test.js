import test from 'node:test'
import assert from 'node:assert/strict'
import { createMemoryStore } from './cache/runtimeStore.js'
import { runWithFabricConcurrency } from './fabricConcurrency.js'

test('global Fabric permit limits concurrent work', async () => {
  const store = createMemoryStore()
  let active = 0
  let maximum = 0
  const work = () => runWithFabricConcurrency(async () => {
    active += 1
    maximum = Math.max(maximum, active)
    await new Promise((resolve) => setTimeout(resolve, 20))
    active -= 1
  }, { store, limit: 1, timeoutMs: 2_000, permitTtlSeconds: 5 })

  await Promise.all([work(), work(), work()])
  assert.equal(maximum, 1)
})
