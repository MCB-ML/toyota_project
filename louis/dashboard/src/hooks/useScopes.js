import { useEffect, useState } from 'react'

// 소속(본사/딜러사) 디렉터리는 세션 동안 거의 안 바뀌므로 모듈 스코프에 한 번만 캐시한다.
let cache = null

// 본사 계정이 탭 상단 필터(어느 딜러사/본사 배포본을 볼지)를 채우는 데 쓰는 전체 목록.
export function useScopes() {
  const [scopes, setScopes] = useState(cache ?? [])

  useEffect(() => {
    if (cache) return
    fetch('/api/scopes')
      .then(res => { if (!res.ok) throw new Error(`HTTP ${res.status}`); return res.json() })
      .then(({ scopes: list }) => { cache = list; setScopes(list) })
      .catch(err => console.error('[scopes] 조회 실패:', err))
  }, [])

  return scopes
}
