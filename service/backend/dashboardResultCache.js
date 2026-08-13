import { createHash, randomUUID } from 'node:crypto'
import { runtimeStore } from './cache/runtimeStore.js'

// 2026-08-04 leo: 동일한 객체를 여러 사용자가 동시에 열면 Fabric이 중복 실행됐고, 오래된
// 결과를 기다리느라 화면이 멈출 수 있었다. Redis lock 기반 single-flight와 SWR soft/hard TTL을
// 공통 구현으로 제공해 fresh·stale·강제 새로고침을 일관되게 처리한다.
function stableStringify(value) {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`
  if (value && typeof value === 'object') {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(',')}}`
  }
  return JSON.stringify(value ?? null)
}

function keyFor(namespace, keyParts) {
  const hash = createHash('sha256').update(stableStringify(keyParts), 'utf8').digest('hex')
  return `dashboard:result:${namespace}:${hash}`
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function parseEntry(raw) {
  if (!raw) return null
  try {
    const entry = JSON.parse(raw)
    if (!entry || entry.version !== 1 || !Number.isFinite(entry.fetchedAt) || !Number.isFinite(entry.softExpiresAt) || !Number.isFinite(entry.hardExpiresAt)) return null
    return entry
  } catch {
    return null
  }
}

function cacheMetadata(entry, state, key, refreshing = false) {
  return {
    state,
    refreshing,
    fetchedAt: new Date(entry.fetchedAt).toISOString(),
    softExpiresAt: new Date(entry.softExpiresAt).toISOString(),
    hardExpiresAt: new Date(entry.hardExpiresAt).toISOString(),
    cacheKey: key,
  }
}

// Redis와 메모리 fallback 모두에서 동작하는 공통 SWR 결과 캐시. 테스트에서는 별도 store와
// 시계를 주입할 수 있어 Fabric/Redis 없이도 fresh/stale/강제 재조회 경로를 검증할 수 있다.
export function createDashboardResultCache({ store = runtimeStore, now = () => Date.now(), logger = console } = {}) {
  async function read(key) {
    return parseEntry(await store.get(key))
  }

  async function waitForEntry(key, timeoutMs) {
    const startedAt = now()
    while (now() - startedAt < timeoutMs) {
      await sleep(100)
      const entry = await read(key)
      if (entry && entry.hardExpiresAt > now()) return entry
    }
    return null
  }

  async function refresh({ key, loader, policy, forceRefresh }) {
    const lockKey = `${key}:lock`
    const lockTtlSeconds = Math.max(policy.hardTtlSeconds, Number(process.env.DASHBOARD_CACHE_LOCK_TTL_SECONDS) || 90)

    for (let attempt = 0; attempt < 2; attempt += 1) {
      const token = randomUUID()
      const ownsLock = await store.acquireLock(lockKey, token, { ttlSeconds: lockTtlSeconds })
      if (ownsLock) {
        try {
          const current = await read(key)
          if (!forceRefresh && current && current.softExpiresAt > now()) return current
          const value = await loader()
          const fetchedAt = now()
          const entry = {
            version: 1,
            value,
            fetchedAt,
            softExpiresAt: fetchedAt + policy.softTtlSeconds * 1000,
            hardExpiresAt: fetchedAt + policy.hardTtlSeconds * 1000,
          }
          await store.set(key, JSON.stringify(entry), { ttlSeconds: policy.hardTtlSeconds })
          return entry
        } finally {
          await store.releaseLock(lockKey, token)
        }
      }

      const entry = await waitForEntry(key, lockTtlSeconds * 1000)
      if (entry) return entry
    }

    // lock 소유 프로세스가 비정상 종료했거나 Redis가 전환된 경우에도 화면을 무한 대기시키지
    // 않는다. 마지막 시도는 결과를 직접 계산해 fallback 저장소에 남긴다.
    const value = await loader()
    const fetchedAt = now()
    const entry = {
      version: 1,
      value,
      fetchedAt,
      softExpiresAt: fetchedAt + policy.softTtlSeconds * 1000,
      hardExpiresAt: fetchedAt + policy.hardTtlSeconds * 1000,
    }
    await store.set(key, JSON.stringify(entry), { ttlSeconds: policy.hardTtlSeconds })
    return entry
  }

  return {
    async execute({ namespace = 'query', keyParts, policy, forceRefresh = false, loader }) {
      if (!policy?.enabled) {
        const value = await loader()
        const fetchedAt = now()
        return {
          value,
          cache: {
            state: 'bypassed',
            refreshing: false,
            fetchedAt: new Date(fetchedAt).toISOString(),
            softExpiresAt: null,
            hardExpiresAt: null,
            cacheKey: null,
          },
        }
      }

      const key = keyFor(namespace, keyParts)
      const entry = forceRefresh ? null : await read(key)
      if (entry && entry.softExpiresAt > now()) {
        return { value: entry.value, cache: cacheMetadata(entry, 'fresh', key) }
      }
      if (entry && entry.hardExpiresAt > now()) {
        // stale 데이터는 즉시 돌려주고, 같은 key를 가진 다른 요청까지 한 번의 refresh에 합친다.
        void refresh({ key, loader, policy, forceRefresh: false }).catch((error) => {
          logger.warn?.(`[dashboard-cache] stale background refresh failed: ${error.message}`)
        })
        return { value: entry.value, cache: cacheMetadata(entry, 'stale', key, true) }
      }

      const refreshed = await refresh({ key, loader, policy, forceRefresh })
      return { value: refreshed.value, cache: cacheMetadata(refreshed, forceRefresh ? 'refreshed' : 'miss', key) }
    },
  }
}

export const dashboardResultCache = createDashboardResultCache()
