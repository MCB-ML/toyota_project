// 딜러 계약퍼널 — 조회 결과 캐시.
//
// 원천 데이터는 아무리 자주 바뀌어도 하루 단위다. 그런데 화면을 열 때마다 Fabric 쿼리
// 10번과 LLM 해석 1번이 새로 나갔다. 같은 날 같은 답을 매번 다시 만들고 있었던 셈이다.
//
// **캐시를 새로 만들지 않는다.** 대시보드 쪽에 이미 Redis SWR 캐시(dashboardResultCache)와
// MAX(ETL_TIMESTAMP) 기반 최신성 판정(dashboardDataFreshness)이 있고, 분산 락으로
// single-flight까지 한다. 여기서 또 만들면 무효화 규칙이 두 벌이 되고 둘이 어긋난다.
//
// ── 왜 시간 TTL만으로 하지 않는가 ────────────────────────────────
// "하루 한 번"이라고 TTL 24시간을 걸면 두 가지가 다 틀린다. ETL이 새벽 3시에 돌면
// 아침에 어제 값을 보고, ETL이 밀리면 없는 데이터를 새 값으로 착각한다.
// 캐시 키에 **원천 테이블의 워터마크 지문**을 넣으면 ETL이 돌아야 키가 바뀐다 —
// 새 적재가 곧 무효화다. 워터마크 조회 자체도 1시간 캐시된다(그쪽 모듈이 한다).
// TTL은 그 위의 안전망일 뿐이다.
// ──────────────────────────────────────────────────────────────
import { dashboardResultCache } from '../dashboardResultCache.js'
import { normalizeSourceDependency, resolveSourceFingerprint } from '../dashboardDataFreshness.js'

/** 이 파이프라인이 읽는 테이블 전부. 하나라도 빠지면 그 테이블만 갱신됐을 때 옛 답이 남는다. */
export const FUNNEL_SOURCES = [
  { source_id: 'funnel:activity', table: 'FCT_ACTIVITY_v2' },
  { source_id: 'funnel:lead', table: 'FCT_LEAD' },
  { source_id: 'funnel:contract', table: 'FCT_CONTRACT_KTWS' },
  { source_id: 'funnel:act_type', table: 'DIM_CRM_ACT_TYPE' },
  { source_id: 'funnel:user', table: 'DIM_MNG_USER' },
  { source_id: 'funnel:dealer', table: 'DIM_MNG_DEALER' },
].map((s) => normalizeSourceDependency(s))

const positive = (value, fallback) => {
  const n = Number(value)
  return Number.isFinite(n) && n > 0 ? n : fallback
}

/**
 * soft를 넘기면 **옛 값을 바로 주고 뒤에서 새로 만든다**(SWR). 그래서 사용자가 갱신을
 * 기다리는 일은 첫 조회와 hard 만료 뒤뿐이다. hard는 하루를 넉넉히 넘겨 잡는다 —
 * Fabric이 잠깐 죽어도 어제 값으로 화면이 뜨는 편이 빈 화면보다 낫다.
 */
export function funnelCachePolicy() {
  return {
    enabled: process.env.DEALER_FUNNEL_CACHE !== 'off',
    softTtlSeconds: positive(process.env.DEALER_FUNNEL_CACHE_SOFT_TTL_SECONDS, 6 * 3600),
    hardTtlSeconds: positive(process.env.DEALER_FUNNEL_CACHE_HARD_TTL_SECONDS, 36 * 3600),
  }
}

/**
 * 워터마크 지문. 실패해도 조회를 막지 않는다 — 최신성 판정이 안 된다고 화면까지
 * 죽일 이유는 없다. 대신 지문을 'unknown'으로 두어 그 구간은 시간 TTL로만 버틴다.
 */
export async function fingerprintOf(forceRefresh, resolve = resolveSourceFingerprint) {
  try {
    const { fingerprint } = await resolve(FUNNEL_SOURCES, { forceRefresh })
    return fingerprint
  } catch (error) {
    console.warn('[dealer-funnel] 워터마크 확인 실패 — 시간 TTL로만 캐시합니다:', error.message)
    return 'unknown'
  }
}

/**
 * 캐시를 태워 loader를 실행한다.
 *
 * @param {{name: string, params: object, loader: Function, forceRefresh?: boolean}} input
 * @returns {Promise<{value: any, cache: object}>}
 */
export async function cachedFunnel({ name, params, loader, forceRefresh = false }) {
  const policy = funnelCachePolicy()
  if (!policy.enabled) return { value: await loader(), cache: { state: 'disabled' } }

  const fingerprint = await fingerprintOf(forceRefresh)
  return dashboardResultCache.execute({
    namespace: `dealer-funnel:${name}`,
    keyParts: { ...params, fingerprint },
    policy,
    forceRefresh,
    loader,
  })
}
