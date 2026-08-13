// 세션 확인 API.
//
// 로그인 자체는 어드민(/api/v1/auth/login/credentials)이 맡는다 — 여기에는 login 이 없다.
// 프런트는 어드민에서 받은 토큰을 들고 와 이 엔드포인트로 "아직 유효한가, 내 딜러사는
// 어디인가"를 확인한다. 어드민 로그인 응답에 scopeKey 가 비어 있는 경우(예전 토큰,
// Microsoft 로그인 경로)도 여기서 DB 를 한 번 보고 채워준다.
import { resolveIdentityWithScope, clearSessionCookieHeader } from './auth.js'

function sendJson(res, status, body, extraHeaders = {}) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  for (const [key, value] of Object.entries(extraHeaders)) res.setHeader(key, value)
  res.end(JSON.stringify(body))
}

export async function handleMe(req, res) {
  let user
  try {
    user = await resolveIdentityWithScope(req)
  } catch (err) {
    console.error('[auth] 세션 확인 실패:', err)
    return sendJson(res, 500, { message: '세션을 확인하지 못했습니다.' })
  }

  if (!user?.email) return sendJson(res, 401, { message: '로그인이 필요합니다.' })

  // 딜러사 매핑이 없으면 어느 범위의 데이터를 보여줄지 정할 수 없다.
  // 기본값으로 밀어넣으면 남의 딜러사 데이터가 보일 수 있으므로 여기서 막는다.
  if (!user.scopeKey) {
    return sendJson(res, 403, { message: '이 계정에 연결된 딜러사가 없습니다. 관리자에게 문의해 주세요.' })
  }

  return sendJson(res, 200, {
    user: { email: user.email, name: user.name, role: user.role, scopeKey: user.scopeKey },
  })
}

// 토큰은 프런트가 sessionStorage 에서 지운다. 서버가 할 일은 쿠키 세션을 쓰던 경로가
// 남아 있을 때 그걸 함께 정리해주는 것뿐이라 항상 성공으로 답한다.
export async function handleLogout(_req, res) {
  return sendJson(res, 200, { ok: true }, { 'Set-Cookie': clearSessionCookieHeader() })
}
