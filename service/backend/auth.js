// 신원의 유일한 출처(single source of truth)다.
//
// 로그인 자체는 어드민(FastAPI)이 맡는다 — 서비스 프런트는 어드민의
// /api/v1/auth/login/credentials 를 직접 부르고, 받은 토큰을 sessionStorage 에 담아
// 이후 서비스 API 호출마다 Authorization 헤더로 실어 보낸다.
// 이 모듈이 하는 일은 그 토큰을 받아 "누가 어느 딜러사 사람인가"로 바꾸는 것뿐이다.
//
// 왜 자체 검증인가:
//   어드민은 Python/FastAPI, 에이전트는 Node 로 런타임이 갈린다. 매 요청마다
//   어드민 /auth/check 를 부르면 LLM 한 번 호출에 HTTP 왕복이 몇 번씩 더 붙고,
//   어드민이 잠깐 죽으면 서비스 전체가 같이 멈춘다. 서명만 검증하면 그럴 일이 없다.
//   어드민과 같은 비밀키(SECRET_KEY)를 공유하므로 어드민이 발급한 토큰을 여기서
//   그대로 열어볼 수 있다.
//
// 자체 검증이 실패하면(키 배포가 어긋났거나 Azure AD 경로처럼 서명 방식이 다르면)
// 그때만 어드민 /auth/check 로 한 번 더 물어본다 — 로그인이 통째로 막히지는 않게.
import fs from 'node:fs'
import jwt from 'jsonwebtoken'
import { getPool } from './db.js'

export const SESSION_TTL_SECONDS = Number(process.env.SESSION_TTL_SECONDS) || 60 * 60
export const SESSION_COOKIE = 'toyota_session'

// 어드민 컨테이너의 SECRET_KEY 와 같은 값이어야 한다(docker-compose 는 둘 다
// ADMIN_SECRET_KEY 하나에서 채운다). 이름이 갈리는 건 어드민이 SECRET_KEY,
// 원본 에이전트가 JWT_SECRET 을 쓰던 흔적이라 양쪽 다 받아준다.
function sharedSecret() {
  return process.env.JWT_SECRET || process.env.ADMIN_SECRET_KEY || process.env.SECRET_KEY || null
}

// 어드민의 Microsoft 로그인 경로는 RS256 으로 서명한다 — 개인키는 어드민만 갖고,
// 여기서는 공개키로 검증만 한다. 공개키가 없으면(어드민을 안 띄운 개발 환경)
// HS256 토큰만 받아들인다.
let adminPublicKeyCache
function adminPublicKey() {
  if (adminPublicKeyCache !== undefined) return adminPublicKeyCache
  const inline = process.env.JWT_PUBLIC_KEY_BASE64
  const path = process.env.JWT_PUBLIC_KEY_PATH
  try {
    if (inline) adminPublicKeyCache = Buffer.from(inline, 'base64').toString('utf8')
    else if (path && fs.existsSync(path)) adminPublicKeyCache = fs.readFileSync(path, 'utf8')
    else adminPublicKeyCache = null
  } catch {
    adminPublicKeyCache = null
  }
  return adminPublicKeyCache
}

// 테스트에서 환경 변수를 바꿔가며 확인할 수 있게 열어둔다.
export function resetAuthKeyCache() {
  adminPublicKeyCache = undefined
}

// 개발 편의로 남겨둔 뒷문. 토큰이 없을 때 요청 본문의 scopeKey 를 신원으로 받아들인다.
// 위조가 가능하므로 운영에서는 절대 켜면 안 된다 — 그래서 기본값이 "운영이 아닐 때만"이다.
export function bodyIdentityAllowed() {
  if (process.env.AUTH_ALLOW_BODY_IDENTITY === 'true') return true
  if (process.env.AUTH_ALLOW_BODY_IDENTITY === 'false') return false
  return process.env.NODE_ENV !== 'production'
}

export function normalizeRole(value) {
  const role = String(value || '').trim().toLowerCase()
  return role === 'admin' || role === 'user' || role === 'viewer' ? role : 'viewer'
}

function firstText(...values) {
  return values.find((value) => value !== undefined && value !== null && String(value).trim() !== '') ?? null
}

export function headerValue(req, name) {
  const headers = req?.headers || {}
  const value = headers[name] || headers[name.toLowerCase()]
  return Array.isArray(value) ? value[0] : value
}

export function bearerToken(req) {
  const authorization = String(headerValue(req, 'authorization') || '').trim()
  const match = authorization.match(/^Bearer\s+(.+)$/i)
  return match ? match[1].trim() : null
}

function readCookie(req, name) {
  const raw = req?.headers?.cookie
  if (!raw) return null
  for (const part of raw.split(';')) {
    const [key, ...rest] = part.trim().split('=')
    if (key === name) return decodeURIComponent(rest.join('='))
  }
  return null
}

export function requestToken(req) {
  return bearerToken(req) || readCookie(req, SESSION_COOKIE)
}

// 어드민이 만든 토큰은 클레임 이름이 다르다. 특히 sub 에 이메일이 아니라 user_id(uuid)를
// 넣으므로, 이메일 전용 클레임이 있으면 그쪽을 먼저 본다 — sub 를 그대로 쓰면 사용량
// 기록의 user_email 에 uuid 가 박힌다.
function claimsToUser(claims, source) {
  const email = firstText(claims.email, claims.user_email, claims.upn, claims.preferred_username, claims.sub)
  return {
    email: email ? String(email).trim().toLowerCase() : null,
    name: firstText(claims.name, claims.user_name),
    role: normalizeRole(firstText(claims.role, claims.user_role) || 'user'),
    companyId: firstText(claims.company_id, claims.default_company, claims.defaultCompany),
    scopeKey: firstText(claims.scope_key, claims.scopeKey),
    source,
  }
}

// 서명만으로 판별한다. DB 도, 어드민도 부르지 않는다.
export function verifySession(req) {
  const token = requestToken(req)
  if (!token) return null

  // 어드민의 credential 로그인 토큰(HS256, 공유 SECRET_KEY). 대부분이 이쪽이다.
  const secret = sharedSecret()
  if (secret) {
    try {
      return claimsToUser(jwt.verify(token, secret, { algorithms: ['HS256'] }), 'token')
    } catch {
      // 아래에서 RS256 으로 한 번 더 시도한다
    }
  }

  // 어드민의 Microsoft 로그인 토큰(RS256).
  const publicKey = adminPublicKey()
  if (!publicKey) return null
  try {
    return claimsToUser(jwt.verify(token, publicKey, { algorithms: ['RS256'] }), 'token')
  } catch {
    return null // 만료·위조·서명 불일치 — 전부 "로그인 안 됨"으로 취급
  }
}

// 설정된 주소가 하나라도 있으면 그것만 쓴다. 예전에는 기본값 두 개를 항상 뒤에
// 붙였는데, 그 주소에 아무것도 없는 환경에서는 요청마다 연결 실패를 두 번 더 기다렸다.
function adminAuthBaseUrls() {
  const configured = [
    process.env.ADMIN_API_INTERNAL_URL,
    process.env.ADMIN_API_URL,
    process.env.PUBLIC_ADMIN_API_URL,
  ].filter(Boolean)
  const bases = configured.length ? configured : ['http://admin-backend:8080', 'http://localhost:8090']
  return bases.map((value) => String(value).replace(/\/+$/, ''))
    .filter((value, index, list) => list.indexOf(value) === index)
}

function tokenCheckUrl(base, token) {
  if (base.endsWith('/api/v1')) return `${base}/auth/check/${encodeURIComponent(token)}`
  return `${base}/api/v1/auth/check/${encodeURIComponent(token)}`
}

// 자체 검증이 안 될 때의 폴백. 어드민에게 "이 토큰 누구 것이냐"를 직접 묻는다.
//
// 주의: 어드민의 /auth/check 는 관리자 계정이 아니면 403 을 준다(어드민 화면 접근
// 판정용이라 그렇다). 우리는 일반 사용자도 받아야 하므로 403 응답이라도 본문에
// 이메일이 실려 있으면 신원으로 인정한다 — 서명 검증은 어드민이 이미 끝냈다.
// 닿지 않는 주소를 매 요청 다시 두드리지 않는다. 어드민이 내려가 있으면 그 사이의
// 모든 요청이 연결 타임아웃만큼 느려지는데, 어차피 답은 같다.
const adminCheckCooldown = new Map()
const ADMIN_CHECK_COOLDOWN_MS = 30_000

function adminCheckTimeoutMs() {
  const parsed = Number(process.env.ADMIN_AUTH_CHECK_TIMEOUT_MS)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 2000
}

export function resetAdminCheckCooldown() {
  adminCheckCooldown.clear()
}

export async function checkAdminToken(token) {
  if (!token || typeof fetch !== 'function') return null
  const now = Date.now()
  for (const base of adminAuthBaseUrls()) {
    const cooldownUntil = adminCheckCooldown.get(base)
    if (cooldownUntil && cooldownUntil > now) continue
    try {
      const response = await fetch(tokenCheckUrl(base, token), {
        method: 'GET',
        signal: AbortSignal.timeout(adminCheckTimeoutMs()),
      })
      adminCheckCooldown.delete(base)
      const data = await response.json().catch(() => ({}))
      const result = data?.result || {}
      const email = firstText(result.email, result.userEmail, data.email)
      const role = firstText(result.role, result.userRole, result.user_role, data.role)
      if (email && (response.ok || response.status === 403)) {
        return {
          email: String(email).trim().toLowerCase(),
          name: firstText(result.name, result.userName, data.name),
          role: normalizeRole(role),
          companyId: null,
          scopeKey: null,
          source: 'admin-check',
        }
      }
      if (response.status === 401) return null
    } catch (error) {
      adminCheckCooldown.set(base, Date.now() + ADMIN_CHECK_COOLDOWN_MS)
      console.warn(`[auth] 어드민 토큰 확인 실패 (${base}):`, error.message)
    }
  }
  return null
}

// 핸들러가 신원을 얻는 유일한 통로.
// 토큰이 있으면 그것만 믿고, 없을 때만(개발) 본문 값을 임시로 받아들인다.
//
// 주의: 어드민 토큰은 scope_key 를 싣지 않는다. 그 경우 scopeKey 가 null 인 채로
// 돌아가므로, 스코프가 필요한 곳은 resolveIdentityWithScope 를 써야 한다.
export async function resolveIdentity(req, body = null) {
  const fromToken = verifySession(req)
  if (fromToken) return fromToken

  const token = requestToken(req)
  if (token) {
    const checked = await checkAdminToken(token)
    if (checked) return checked
    // 토큰을 보냈는데 검증에 실패한 건 "위조되었거나 만료됨"이다.
    // 본문 값으로 대신 통과시키면 검증을 우회하는 통로가 되므로 여기서 끊는다.
    return null
  }

  if (!bodyIdentityAllowed() || !body?.scopeKey) return null
  return {
    email: body.userEmail ? String(body.userEmail).trim().toLowerCase() : null,
    name: null,
    role: 'user',
    companyId: null,
    scopeKey: body.scopeKey,
    source: 'body-dev', // 사용량 기록에서 출처를 구분할 수 있게 남긴다
  }
}

// 스코프가 꼭 필요한 경로용.
//
// 어드민이 발급한 토큰에는 scope_key 가 없는 경우가 많다(payload 는
// sub/email/name/role/mode/exp 뿐). 토큰 모양에 기대지 않고 이메일로 계정을 한 번
// 조회해 채운다. scope_key 가 이미 실려 있으면 이 경로를 타지 않는다.
export async function resolveIdentityWithScope(req, body = null, db = null) {
  const identity = await resolveIdentity(req, body)
  if (!identity || identity.scopeKey) return identity

  const pool = db || getPool()
  const { scopeForCompanyId } = await import('./dashboardScope.js')
  if (identity.companyId) {
    const scopeKey = await scopeForCompanyId(identity.companyId, pool)
    if (scopeKey) return { ...identity, scopeKey }
  }
  if (!identity.email) return identity

  try {
    // 본사(TMKR)는 딜러사 매핑 없이 회사명으로만 구분되던 시기가 있어 그 경우도 흡수한다.
    const { rows } = await pool.query(
      `SELECT v.company_info_id,
              v.user_role,
              COALESCE(m.scope_key,
                       CASE WHEN lower(v.company_info_name) IN ('tmkr', 'hq', 'admin') THEN 'hq' END) AS scope_key
         FROM dbo."v_user_company" v
         LEFT JOIN dbo."ScopeCompany_map" m ON m.company_info_id = v.company_info_id
        WHERE lower(v.user_email) = $1
        LIMIT 1`,
      [identity.email]
    )
    const row = rows[0]
    if (!row) return identity
    return {
      ...identity,
      scopeKey: row.scope_key || null,
      companyId: row.company_info_id || identity.companyId || null,
      // 토큰의 role 보다 DB 를 믿는다 — 권한을 낮춰도 발급된 토큰은 만료 전까지 살아 있다.
      role: normalizeRole(row.user_role || identity.role),
    }
  } catch (err) {
    // 조회 실패는 "스코프 없음"으로 둔다 — 기본값으로 채우면 남의 딜러사가 열린다.
    console.error('[auth] 스코프 조회 실패:', err.message)
    return identity
  }
}

// 스코프까지 확정된 신원을 요구한다. 없으면 응답을 직접 마무리하고 null 을 준다.
// 호출부는 null 이면 그대로 return 하면 된다.
export async function requireIdentity(req, res, { body = null, db = null, sendJson } = {}) {
  const reply = sendJson || ((response, status, payload) => {
    response.statusCode = status
    response.setHeader('Content-Type', 'application/json; charset=utf-8')
    response.end(JSON.stringify(payload))
  })

  const identity = await resolveIdentityWithScope(req, body, db)
  if (!identity?.email && !identity?.scopeKey) {
    reply(res, 401, { message: '로그인이 필요합니다.' })
    return null
  }
  if (!identity.scopeKey) {
    // 로그인은 됐는데 딜러사 매핑이 없다. 기본값으로 밀어넣으면 남의 데이터가 보인다.
    reply(res, 403, { message: '이 계정에 연결된 딜러사가 없습니다. 관리자에게 문의해 주세요.' })
    return null
  }
  return identity
}

// 쿠키로 세션을 유지하던 경로가 남아 있을 때를 위한 정리용.
// 지금 프런트는 토큰을 sessionStorage 에 담으므로 평소에는 쓰이지 않는다.
export function clearSessionCookieHeader() {
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`
}

// 요청이 특정 스코프의 데이터를 만지려 할 때 그럴 자격이 있는지 본다.
// 본사(hq)는 전체를 보고, 딜러사는 자기 것만 본다.
export function canAccessScope(identity, targetScopeKey) {
  if (!identity?.scopeKey || !targetScopeKey) return false
  if (identity.scopeKey === targetScopeKey) return true
  return identity.scopeKey === 'hq'
}
