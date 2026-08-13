// 2026-08-04 leo: 활성 기간 결과를 60초마다 다시 조회하면 다수 사용자의 객체가 많을 때 Fabric
// 부하가 급증한다. 결과 데이터는 한 시간 동안 유지하고, 만료 뒤의 자동 갱신 또는 사용자의 강제
// 새로고침만 새 값을 Redis에 기록하도록 공통 정책을 하나로 고정한다.
function positiveInteger(value, fallback) {
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback
}

function envSeconds(name, fallback) {
  return positiveInteger(process.env[name], fallback)
}

// 2026-08-04 leo: 객체별 soft/hard TTL을 열어 두면 같은 대시보드에서도 갱신 주기가 달라져 운영
// 예측이 어려워진다. 신버전은 cacheEnabled와 mode만 객체에 보관하고 결과 TTL은 서비스 정책으로
// 통일한다. ETL_TIMESTAMP 확인 주기는 DATA_SOURCE_WATERMARK_TTL_SECONDS로 별도 관리한다.
export function resolveResultCachePolicy(refreshPolicy = {}) {
  const configured = refreshPolicy && typeof refreshPolicy === 'object' ? refreshPolicy : {}
  const softTtlSeconds = envSeconds('DASHBOARD_RESULT_CACHE_TTL_SECONDS', 3600)
  const staleGraceSeconds = envSeconds('DASHBOARD_RESULT_CACHE_STALE_GRACE_SECONDS', 300)
  const hardTtlSeconds = Math.max(
    softTtlSeconds + 1,
    softTtlSeconds + staleGraceSeconds,
  )
  return {
    enabled: configured.cacheEnabled !== false,
    mode: configured.mode || 'on-load',
    softTtlSeconds,
    hardTtlSeconds,
  }
}
