// 서비스 API 를 부를 때 붙일 인증 헤더를 만드는 곳.
//
// 로그인은 어드민(/api/v1/auth/login/credentials)이 처리하고, 받은 토큰은
// UserContext 가 sessionStorage 에 담는다. 서비스 백엔드(auth.js)는 그 토큰의 서명을
// 검증해 "누가 어느 딜러사 사람인가"를 정한다 — 토큰을 안 보내면 운영에서는 401 이다.
//
// 컴포넌트마다 헤더를 손으로 만들면 한 군데 빠뜨렸을 때 그 화면만 조용히 401 이 되므로
// 여기 한 곳으로 모은다. React 훅이 아닌 평범한 함수라 컨텍스트 밖(유틸·이벤트 핸들러)
// 에서도 쓸 수 있다.

export const AI365_STORAGE_KEY = 'toyota_dashboard_ai365_session'

export function storedSession() {
  try {
    const raw = sessionStorage.getItem(AI365_STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function sessionToken(session) {
  return (session || storedSession())?.token || null
}

// session 을 넘기면 그걸 쓰고, 안 넘기면 sessionStorage 에서 읽는다.
// 컨텍스트에 이미 세션이 있는 컴포넌트는 넘기는 편이 한 박자 빠르다.
export function authHeaders(extra = {}, session = null) {
  const token = sessionToken(session)
  return token ? { ...extra, Authorization: `Bearer ${token}` } : { ...extra }
}

export function jsonAuthHeaders(session = null) {
  return authHeaders({ 'Content-Type': 'application/json' }, session)
}

// fetch 의 얇은 껍데기. 헤더만 채워 넣고 나머지는 그대로 넘긴다.
export function apiFetch(input, init = {}, session = null) {
  return fetch(input, { ...init, headers: authHeaders(init.headers || {}, session) })
}

// 새로고침 뒤 "이 토큰이 아직 유효한가, 내 딜러사는 어디인가"를 서버에 확인한다.
// 어드민 토큰에 scopeKey 가 실려 오지 않는 경로(Microsoft 로그인 등)에서는
// 서버가 계정을 조회해 채워준다.
export async function fetchCurrentSession() {
  try {
    const res = await apiFetch('/api/auth/me')
    if (!res.ok) return null
    const data = await res.json()
    return data?.user || null
  } catch {
    return null
  }
}

// 서버 쪽에 쿠키 세션이 남아 있을 때를 위한 정리. 실패해도 클라이언트 세션은 지운다.
export async function logoutServerSession() {
  try {
    await apiFetch('/api/auth/logout', { method: 'POST' })
  } catch {
    // 무시
  }
}
