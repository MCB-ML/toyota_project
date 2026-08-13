import { randomUUID } from 'node:crypto'
import { createClient } from 'redis'

// 2026-08-04 leo: 기존 프로세스 내 Map 캐시는 Docker app 워커 사이에 공유되지 않아 같은
// 대시보드 조회가 중복 실행됐다. Redis를 결과 캐시·lock·semaphore의 공통 저장소로 두고,
// Redis가 없는 로컬 개발 환경만 제한된 메모리 fallback으로 동작하게 한다.
const DEFAULT_MEMORY_MAX_ENTRIES = 500
const DEFAULT_REDIS_RETRY_COOLDOWN_MS = 30_000

function positiveInteger(value, fallback) {
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback
}

function nowMs() {
  return Date.now()
}

function normalizeTtlSeconds(value) {
  return Math.max(1, positiveInteger(value, 1))
}

// Redis가 없는 로컬 개발 환경에서도 화면을 막지 않기 위한 제한적 fallback이다. 여러
// app 워커 사이에서는 공유되지 않으므로 운영 환경의 기본 경로로 사용하면 안 된다.
export function createMemoryStore({ now = nowMs, maxEntries = DEFAULT_MEMORY_MAX_ENTRIES } = {}) {
  const entries = new Map()
  const locks = new Map()
  const semaphores = new Map()

  function purgeExpired(map) {
    const current = now()
    for (const [key, entry] of map) {
      if (entry.expiresAt <= current) map.delete(key)
    }
  }

  function trimEntries() {
    while (entries.size > maxEntries) entries.delete(entries.keys().next().value)
  }

  return {
    async get(key) {
      purgeExpired(entries)
      const entry = entries.get(key)
      if (!entry) return null
      entries.delete(key)
      entries.set(key, entry)
      return entry.value
    },
    async set(key, value, { ttlSeconds }) {
      entries.set(key, { value, expiresAt: now() + normalizeTtlSeconds(ttlSeconds) * 1000 })
      trimEntries()
    },
    async delete(key) {
      entries.delete(key)
    },
    async acquireLock(key, token, { ttlSeconds }) {
      purgeExpired(locks)
      if (locks.has(key)) return false
      locks.set(key, { token, expiresAt: now() + normalizeTtlSeconds(ttlSeconds) * 1000 })
      return true
    },
    async releaseLock(key, token) {
      const lock = locks.get(key)
      if (lock?.token === token) locks.delete(key)
    },
    async acquireSemaphore(key, token, { limit, ttlSeconds }) {
      purgeExpired(semaphores)
      const permits = semaphores.get(key) || new Map()
      const current = now()
      for (const [permitToken, expiresAt] of permits) {
        if (expiresAt <= current) permits.delete(permitToken)
      }
      if (permits.size >= limit) return false
      permits.set(token, current + normalizeTtlSeconds(ttlSeconds) * 1000)
      semaphores.set(key, permits)
      return true
    },
    async releaseSemaphore(key, token) {
      semaphores.get(key)?.delete(token)
    },
    async clear() {
      entries.clear()
      locks.clear()
      semaphores.clear()
    },
    diagnostics() {
      purgeExpired(entries)
      purgeExpired(locks)
      return { backend: 'memory', entries: entries.size, locks: locks.size, semaphores: semaphores.size }
    },
  }
}

const memoryStore = createMemoryStore({
  maxEntries: positiveInteger(process.env.DASHBOARD_MEMORY_CACHE_MAX_ENTRIES, DEFAULT_MEMORY_MAX_ENTRIES),
})

let redisClient = null
let redisConnectPromise = null
let redisUnavailableUntil = 0
let lastWarnedMessage = null

function redisUrl() {
  const value = String(process.env.REDIS_URL || '').trim()
  return value || null
}

function warnRedis(message) {
  if (lastWarnedMessage === message) return
  lastWarnedMessage = message
  console.warn(`[dashboard-cache] Redis를 사용할 수 없어 메모리 fallback을 사용합니다: ${message}`)
}

function markRedisUnavailable(error) {
  redisUnavailableUntil = Date.now() + positiveInteger(process.env.REDIS_RETRY_COOLDOWN_MS, DEFAULT_REDIS_RETRY_COOLDOWN_MS)
  warnRedis(error?.message || String(error || 'unknown Redis error'))
}

async function connectedRedisClient() {
  const url = redisUrl()
  if (!url) return null
  if (Date.now() < redisUnavailableUntil) return null
  if (redisClient?.isReady) return redisClient
  if (redisConnectPromise) return redisConnectPromise

  const client = redisClient || createClient({
    url,
    socket: {
      connectTimeout: positiveInteger(process.env.REDIS_CONNECT_TIMEOUT_MS, 1500),
      reconnectStrategy: false,
    },
  })
  redisClient = client
  client.on('error', markRedisUnavailable)
  redisConnectPromise = client.connect()
    .then(() => {
      redisUnavailableUntil = 0
      lastWarnedMessage = null
      return client
    })
    .catch((error) => {
      markRedisUnavailable(error)
      return null
    })
    .finally(() => { redisConnectPromise = null })
  return redisConnectPromise
}

async function withRedis(operation, fallback) {
  const client = await connectedRedisClient()
  if (!client) return fallback()
  try {
    return await operation(client)
  } catch (error) {
    markRedisUnavailable(error)
    return fallback()
  }
}

export const runtimeStore = {
  async get(key) {
    return withRedis((client) => client.get(key), () => memoryStore.get(key))
  },
  async set(key, value, { ttlSeconds }) {
    const options = { EX: normalizeTtlSeconds(ttlSeconds) }
    return withRedis(
      async (client) => {
        await client.set(key, value, options)
        // Redis 연결이 잠깐 끊겼을 때도 같은 프로세스의 stale 응답이 남도록 함께 둔다.
        await memoryStore.set(key, value, { ttlSeconds })
      },
      () => memoryStore.set(key, value, { ttlSeconds }),
    )
  },
  async delete(key) {
    return withRedis(
      async (client) => {
        await client.del(key)
        await memoryStore.delete(key)
      },
      () => memoryStore.delete(key),
    )
  },
  async acquireLock(key, token = randomUUID(), { ttlSeconds }) {
    return withRedis(
      async (client) => (await client.set(key, token, { NX: true, EX: normalizeTtlSeconds(ttlSeconds) })) === 'OK',
      () => memoryStore.acquireLock(key, token, { ttlSeconds }),
    )
  },
  async releaseLock(key, token) {
    const releaseScript = 'if redis.call("get", KEYS[1]) == ARGV[1] then return redis.call("del", KEYS[1]) else return 0 end'
    return withRedis(
      async (client) => {
        await client.eval(releaseScript, { keys: [key], arguments: [token] })
        await memoryStore.releaseLock(key, token)
      },
      () => memoryStore.releaseLock(key, token),
    )
  },
  async acquireSemaphore(key, token, { limit, ttlSeconds }) {
    const semaphoreScript = [
      'local now = tonumber(ARGV[1])',
      'local limit = tonumber(ARGV[2])',
      'local expiresAt = tonumber(ARGV[3])',
      'redis.call("ZREMRANGEBYSCORE", KEYS[1], "-inf", now)',
      'if redis.call("ZCARD", KEYS[1]) >= limit then return 0 end',
      'redis.call("ZADD", KEYS[1], expiresAt, ARGV[4])',
      'redis.call("PEXPIRE", KEYS[1], tonumber(ARGV[5]))',
      'return 1',
    ].join('\n')
    return withRedis(
      async (client) => Number(await client.eval(semaphoreScript, {
        keys: [key],
        arguments: [String(Date.now()), String(limit), String(Date.now() + normalizeTtlSeconds(ttlSeconds) * 1000), token, String(normalizeTtlSeconds(ttlSeconds) * 1000)],
      })) === 1,
      () => memoryStore.acquireSemaphore(key, token, { limit, ttlSeconds }),
    )
  },
  async releaseSemaphore(key, token) {
    return withRedis(
      async (client) => {
        await client.zRem(key, token)
        await memoryStore.releaseSemaphore(key, token)
      },
      () => memoryStore.releaseSemaphore(key, token),
    )
  },
  async diagnostics() {
    const client = await connectedRedisClient()
    if (client) return { backend: 'redis', ready: client.isReady, fallback: memoryStore.diagnostics() }
    return { ...memoryStore.diagnostics(), redisConfigured: Boolean(redisUrl()) }
  },
}

export async function closeRuntimeStore() {
  if (redisClient?.isOpen) await redisClient.quit().catch(() => redisClient.disconnect())
  redisClient = null
  redisConnectPromise = null
}
