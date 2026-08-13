// 조회 결과 캐시 — 무효화 규칙:
//   node --test backend/dealerFunnel/funnelCache.test.js
//
// SWR 동작 자체(fresh/stale/lock)는 dashboardResultCache.test.js가 이미 검증한다.
// 여기서는 딜러퍼널이 그 위에 얹은 것만 본다 — 무엇을 원천으로 선언했고, 워터마크를
// 못 읽을 때 어떻게 되는가.
import { test, describe, afterEach } from 'node:test'
import assert from 'node:assert/strict'

import { FUNNEL_SOURCES, fingerprintOf, funnelCachePolicy } from './funnelCache.js'

const ENV_KEYS = ['DEALER_FUNNEL_CACHE', 'DEALER_FUNNEL_CACHE_SOFT_TTL_SECONDS', 'DEALER_FUNNEL_CACHE_HARD_TTL_SECONDS']
afterEach(() => { for (const k of ENV_KEYS) delete process.env[k] })

describe('원천 선언', () => {
  test('파이프라인이 읽는 테이블을 전부 담는다', () => {
    // 하나라도 빠지면 그 테이블만 갱신됐을 때 옛 답이 그대로 남는다.
    const tables = FUNNEL_SOURCES.map((s) => s.table).sort()
    assert.deepEqual(tables, [
      'DIM_CRM_ACT_TYPE', 'DIM_MNG_DEALER', 'DIM_MNG_USER',
      'FCT_ACTIVITY_v2', 'FCT_CONTRACT_KTWS', 'FCT_LEAD',
    ])
  })

  test('전부 ETL_TIMESTAMP 워터마크를 쓰고 KPI_W.ktws에 있다', () => {
    for (const s of FUNNEL_SOURCES) {
      assert.equal(s.watermarkEnabled, true, `${s.table}의 워터마크가 꺼져 있다`)
      assert.equal(s.watermarkColumn, 'ETL_TIMESTAMP')
      assert.equal(s.database, 'KPI_W')
      assert.equal(s.schema, 'ktws')
    }
  })
})

describe('캐시 정책', () => {
  test('기본값은 soft 6시간 · hard 36시간 — 하루 단위 적재를 넉넉히 덮는다', () => {
    const p = funnelCachePolicy()
    assert.equal(p.enabled, true)
    assert.equal(p.softTtlSeconds, 6 * 3600)
    assert.equal(p.hardTtlSeconds, 36 * 3600)
  })

  test('hard가 soft보다 길다 — 반대면 stale 구간이 없어 SWR이 무의미해진다', () => {
    const p = funnelCachePolicy()
    assert.ok(p.hardTtlSeconds > p.softTtlSeconds)
  })

  test('환경변수로 끌 수 있다 — 원인 파악할 때 캐시부터 배제해야 한다', () => {
    process.env.DEALER_FUNNEL_CACHE = 'off'
    assert.equal(funnelCachePolicy().enabled, false)
  })

  test('잘못된 TTL 값은 기본값으로 되돌린다', () => {
    process.env.DEALER_FUNNEL_CACHE_SOFT_TTL_SECONDS = '0'
    process.env.DEALER_FUNNEL_CACHE_HARD_TTL_SECONDS = '이상한값'
    const p = funnelCachePolicy()
    assert.equal(p.softTtlSeconds, 6 * 3600)
    assert.equal(p.hardTtlSeconds, 36 * 3600)
  })
})

describe('워터마크 지문', () => {
  test('원천이 그대로면 지문도 그대로다 — 캐시가 유지된다', async () => {
    const stub = async () => ({ fingerprint: 'abc123', sources: [] })
    assert.equal(await fingerprintOf(false, stub), 'abc123')
  })

  test('ETL이 새로 돌면 지문이 바뀌어 캐시가 저절로 무효화된다', async () => {
    const before = await fingerprintOf(false, async () => ({ fingerprint: 'v1' }))
    const after = await fingerprintOf(false, async () => ({ fingerprint: 'v2' }))
    assert.notEqual(before, after)
  })

  test('워터마크를 못 읽어도 조회를 막지 않는다', async () => {
    // 최신성 판정이 안 된다고 화면까지 죽일 이유는 없다. 그 구간은 시간 TTL로 버틴다.
    const failing = async () => { throw new Error('Fabric 연결 실패') }
    assert.equal(await fingerprintOf(false, failing), 'unknown')
  })
})
