// AI365(데이터 에이전트) 이메일/비밀번호 로그인 헬퍼.
// MSAL(회사 Microsoft 계정) 로그인과는 완전히 별개인 인증 경로다.
// 성공 시 응답을 앱 내부에서 쓰기 좋은 세션 형태(normalizeSession)로 정규화해서 돌려준다.
import { adaptUrlToPageHost } from '../utils/runtimeHost'

const DEFAULT_LOGIN_URL =
  'https://mcloud-dataagent-api-c0bjb0htc6bsg7fm.koreasouth-01.azurewebsites.net/auth/login'

// 로컬 개발에서 CORS가 막히면 .env에서 VITE_AI365_LOGIN_URL=/api/ai365/login 로 두면
// vite dev 서버 프록시(vite.config.js)를 거쳐 우회된다. 비어 있으면 위 staging URL을 직접 호출.
// 빌드에 localhost:8090 이 박힌 채 LAN 으로 접속한 경우에는 접속한 호스트의 8090 으로
// 바꿔 부른다 — 안 그러면 LAN 기기가 자기 자신의 8090 에 로그인하려다 실패한다.
const LOGIN_URL = adaptUrlToPageHost(import.meta.env.VITE_AI365_LOGIN_URL || DEFAULT_LOGIN_URL)

function firstPresent(...values) {
  return values.find((value) => value !== undefined && value !== null && String(value).trim() !== '') ?? null
}

function normalized(value) {
  return String(value ?? '').trim().toLowerCase()
}

export function isAdminSession(session) {
  const raw = session?.raw || {}
  const rawUser = raw.user || raw
  return [
    session?.role,
    session?.authority,
    rawUser.userRole,
    rawUser.user_role,
    rawUser.role,
    raw.userRole,
    raw.user_role,
    raw.role,
  ].some((value) => normalized(value) === 'admin')
}

// 로그인 성공 응답 스키마가 아직 확정되지 않아서, 흔한 필드명들을 방어적으로 모두 훑어
// 내부 표준 세션 형태로 맞춘다. 실제 스키마가 확정되면 여기만 손보면 된다.
export function normalizeSession(result, email) {
  const r = result || {}
  // 응답이 { user: { name, email }, accessToken, ... } 처럼 사용자 정보를 user에 감싸는 형태라,
  // user 래퍼가 있으면 그 안을 우선으로 읽는다. 딜러명(DEALER_NM)이 user.name에 실려온다.
  const u = r.user || r
  const companyName = firstPresent(r.defaultCompanyName, r.companyName, u.defaultCompanyName, u.companyName)
  const scopeKey = firstPresent(r.scopeKey, r.scope_key, u.scopeKey, u.scope_key)
  const role = firstPresent(u.userRole, u.user_role, u.role, u.roleName, r.userRole, r.user_role, r.role, r.roleName)
  const access = firstPresent(u.userAccess, u.user_access, u.access, u.permission, r.userAccess, r.user_access, r.access, r.permission)
  const department = firstPresent(
    companyName,
    u.userDepartment,
    u.user_department,
    u.department,
    u.departmentName,
    u.dept,
    u.deptName,
    r.userDepartment,
    r.user_department,
    r.department,
  )
  const dealerKey = normalized(scopeKey) === 'hq'
    ? 'hq'
    : firstPresent(companyName, u.dealerName, u.dealer_name, department, u.name, u.userName, u.username, r.name, email)
  return {
    token: firstPresent(r.token, r.accessToken, r.access_token, r.jwt),
    email: firstPresent(u.email, r.email, email),
    // name = 딜러명(딜러 구분/쿼리 조건). user.name → 없으면 최상위 name → 최후엔 email.
    name: dealerKey,
    // 권한(role)·부서명 — 지금은 API가 안 내려줄 수 있어 없으면 null.
    authority: firstPresent(u.authority, role, access, r.authority),
    role,
    access,
    department,
    defaultCompany: firstPresent(r.defaultCompany, r.default_company, u.defaultCompany, u.default_company),
    defaultCompanyName: companyName,
    scopeKey,
    raw: r, // 원본 result 보존 — 스키마 확정 후 추가 필드 활용 대비
  }
}

function toKoreanError(message, status) {
  const msg = String(message || '')
  if (/invalid email or password/i.test(msg)) {
    return '이메일 또는 비밀번호가 올바르지 않습니다.'
  }
  return msg || `로그인 실패 (${status})`
}

// 이메일/비밀번호로 AI365 로그인. 성공 시 정규화된 세션 객체를 반환하고,
// 실패(자격 오류/서버 오류/네트워크 오류)는 한글 메시지를 담아 throw 한다.
export async function loginAi365(email, password) {
  let res
  let data
  try {
    res = await fetch(LOGIN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    data = await res.json().catch(() => null)
  } catch {
    // fetch 자체 실패(네트워크 단절, CORS 차단 등)
    throw new Error('로그인 서버에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.')
  }

  if (!res.ok || !data || data.success === false) {
    throw new Error(toKoreanError(data?.message, res.status))
  }

  return normalizeSession(data.result ?? data, email)
}
