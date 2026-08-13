import test from 'node:test'
import assert from 'node:assert/strict'
import { resolveResultCachePolicy } from './dashboardRefreshPolicy.js'

test('result cache uses one service-wide hour regardless of an object refreshPolicy TTL', () => {
  const previousTtl = process.env.DASHBOARD_RESULT_CACHE_TTL_SECONDS
  const previousGrace = process.env.DASHBOARD_RESULT_CACHE_STALE_GRACE_SECONDS
  process.env.DASHBOARD_RESULT_CACHE_TTL_SECONDS = '3600'
  process.env.DASHBOARD_RESULT_CACHE_STALE_GRACE_SECONDS = '300'

  try {
    const policy = resolveResultCachePolicy({ softTtlSeconds: 60, hardTtlSeconds: 90 })
    assert.equal(policy.softTtlSeconds, 3600)
    assert.equal(policy.hardTtlSeconds, 3900)
  } finally {
    if (previousTtl === undefined) delete process.env.DASHBOARD_RESULT_CACHE_TTL_SECONDS
    else process.env.DASHBOARD_RESULT_CACHE_TTL_SECONDS = previousTtl
    if (previousGrace === undefined) delete process.env.DASHBOARD_RESULT_CACHE_STALE_GRACE_SECONDS
    else process.env.DASHBOARD_RESULT_CACHE_STALE_GRACE_SECONDS = previousGrace
  }
})
