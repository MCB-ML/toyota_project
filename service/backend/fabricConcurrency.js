import { randomUUID } from 'node:crypto'
import { runtimeStore } from './cache/runtimeStore.js'

// 2026-08-04 leo: 페이지 객체와 인증 리포트가 각각 병렬로 Fabric을 호출하면 app 워커 전체의
// 부하 상한이 없었다. Redis ZSET permit으로 모든 워커가 공유하는 실행 상한을 적용한다.
function positiveInteger(value, fallback) {
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// 모든 Fabric 실행 경로가 이 gate를 지나므로 queryBundle 내부 병렬 쿼리, certified
// report, watermark 확인까지 합쳐도 한 app/Redis 클러스터의 상한을 넘지 않는다.
export async function runWithFabricConcurrency(task, {
  store = runtimeStore,
  limit = positiveInteger(process.env.DASHBOARD_GLOBAL_MAX_CONCURRENCY, 8),
  timeoutMs = positiveInteger(process.env.DASHBOARD_GLOBAL_QUEUE_TIMEOUT_MS, 120_000),
  permitTtlSeconds = positiveInteger(process.env.DASHBOARD_GLOBAL_PERMIT_TTL_SECONDS, 90),
} = {}) {
  const key = 'dashboard:fabric:global-permits'
  const token = randomUUID()
  const startedAt = Date.now()
  while (!(await store.acquireSemaphore(key, token, { limit, ttlSeconds: permitTtlSeconds }))) {
    if (Date.now() - startedAt >= timeoutMs) {
      throw new Error('Fabric 조회 대기열이 가득 차 시간 내 실행하지 못했습니다. 잠시 후 다시 시도해 주세요.')
    }
    await sleep(100)
  }
  try {
    return await task()
  } finally {
    await store.releaseSemaphore(key, token)
  }
}
