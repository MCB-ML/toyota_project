// Certified Report 결과 캐시.
//
// 이 리포트는 실측 17~20초짜리다. 저장된 위젯은 페이지를 열 때마다 재조회되므로
// (dashboardPagesHandler.js의 rehydrateWidget) 캐시가 없으면 방문할 때마다 그 시간을
// 그대로 문다. 게다가 rehydrateWidgets는 위젯들을 동시에 재조회해서, 이런 위젯이
// 여러 개면 웨어하우스에 20초짜리 쿼리가 동시에 걸린다.
//
// 캐시하는 것은 "원본 결과 행"이다. 롤업(group_by)과 컬럼 선택은 이 위에서 메모리로
// 처리하므로 캐시 1건이 딜러별·전시장별·팀별 등 모든 뷰를 커버한다.
import { createHash } from 'node:crypto'

// 마감된 과거 기간이라도 값이 완전히 고정되지는 않는다 — 기회/계약 실적은 리드의
// 현재 상태(close_dt, last_retail_sales_dt 등)로 판정되어 나중에도 조금씩 움직인다
// (Power BI 화면과 기회실적이 73건 차이 났던 게 그 사례). 그래서 무기한 캐시는 안 되고
// 과거 기간도 만료를 둔다.
export const TTL_CLOSED_PERIOD_MS = 6 * 60 * 60 * 1000 // 6시간
export const TTL_OPEN_PERIOD_MS = 10 * 60 * 1000       // 10분 — 당월(또는 기간 미지정)

// 항목 수 상한. 한 건이 1천 행 × 17컬럼 수준이라 수십 건이면 수 MB다.
export const MAX_ENTRIES = 20

const store = new Map() // key -> { rows, fetchedAt, expiresAt }

/**
 * 캐시 키. 스펙대로 report_id·version·sql 해시·모든 파라미터를 포함한다.
 * group_by/selected_columns는 넣지 않는다 — 그건 조회 결과를 가공하는 단계라
 * 같은 원본을 공유해야 캐시가 제 역할을 한다.
 *
 * authorizationScope도 키에 넣는다. 지금은 항상 null이지만(서버 인증 미구현),
 * 나중에 범위가 생겼을 때 다른 권한의 사용자가 남의 결과를 받는 일이 없어야 한다.
 */
export function cacheKey({ reportId, version, sqlHash, params, authorizationScope = null }) {
  const canonical = JSON.stringify({
    reportId,
    version,
    sqlHash,
    // 키 순서에 흔들리지 않도록 정렬해서 직렬화
    params: Object.fromEntries(Object.entries(params).sort(([a], [b]) => a.localeCompare(b))),
    authorizationScope,
  })
  return createHash('sha256').update(canonical, 'utf8').digest('hex')
}

/** 조회 대상 기간이 이미 지난 달인지 — TTL을 정하는 데 쓴다. */
export function isClosedPeriod(params, now = new Date()) {
  const Year = params?.Year ?? params?.year
  const MonthNumber = params?.MonthNumber ?? params?.month
  if (!Year || !MonthNumber) return false // 기간을 안 좁혔으면 당월이 섞여 있다
  const y = now.getFullYear()
  const m = now.getMonth() + 1
  return Year < y || (Year === y && MonthNumber < m)
}

export function ttlFor(params, now = new Date()) {
  return isClosedPeriod(params, now) ? TTL_CLOSED_PERIOD_MS : TTL_OPEN_PERIOD_MS
}

export function getCached(key, now = Date.now()) {
  const hit = store.get(key)
  if (!hit) return null
  if (hit.expiresAt <= now) {
    store.delete(key)
    return null
  }
  // 최근 사용을 뒤로 보내 오래된 것부터 밀려나게 한다.
  store.delete(key)
  store.set(key, hit)
  return hit
}

export function setCached(key, rows, ttlMs, now = Date.now()) {
  store.set(key, { rows, fetchedAt: now, expiresAt: now + ttlMs })
  while (store.size > MAX_ENTRIES) {
    const oldest = store.keys().next().value
    store.delete(oldest)
  }
  return store.get(key)
}

export function clearCache() {
  store.clear()
}

export function cacheSize() {
  return store.size
}
