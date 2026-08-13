import test from 'node:test'
import assert from 'node:assert/strict'
import jwt from 'jsonwebtoken'

import {
  bodyIdentityAllowed,
  canAccessScope,
  resetAdminCheckCooldown,
  resetAuthKeyCache,
  resolveIdentity,
  verifySession,
} from './auth.js'

const SECRET = 'test-shared-secret'

function withEnv(overrides, fn) {
  const saved = {}
  for (const [key, value] of Object.entries(overrides)) {
    saved[key] = process.env[key]
    if (value === undefined) delete process.env[key]
    else process.env[key] = value
  }
  resetAuthKeyCache()
  try {
    return fn()
  } finally {
    for (const [key, value] of Object.entries(saved)) {
      if (value === undefined) delete process.env[key]
      else process.env[key] = value
    }
    resetAuthKeyCache()
  }
}

function reqWithToken(token) {
  return { headers: { authorization: `Bearer ${token}` } }
}

// 어드민의 credential 로그인이 만드는 것과 같은 모양의 토큰.
function adminCredentialToken(claims = {}, secret = SECRET) {
  return jwt.sign(
    { sub: 'e7c2f5b0-0000-4000-8000-000000000001', email: 'sc@dealer.example', name: '김담당', role: 'user', mode: 'credential', ...claims },
    secret,
    { expiresIn: 3600 }
  )
}

test('어드민이 공유 키로 서명한 토큰을 그대로 받아들인다', () => {
  withEnv({ JWT_SECRET: SECRET, ADMIN_SECRET_KEY: undefined, SECRET_KEY: undefined }, () => {
    const identity = verifySession(reqWithToken(adminCredentialToken()))
    assert.equal(identity.email, 'sc@dealer.example')
    assert.equal(identity.role, 'user')
    assert.equal(identity.source, 'token')
  })
})

test('sub 가 uuid 여도 이메일 클레임을 신원으로 쓴다 — 사용량 기록에 uuid 가 박히면 안 된다', () => {
  withEnv({ JWT_SECRET: SECRET }, () => {
    const identity = verifySession(reqWithToken(adminCredentialToken()))
    assert.notEqual(identity.email, 'e7c2f5b0-0000-4000-8000-000000000001')
  })
})

test('ADMIN_SECRET_KEY 로도 같은 토큰이 열린다 — 어드민 쪽 환경 변수 이름이 그것이다', () => {
  withEnv({ JWT_SECRET: undefined, ADMIN_SECRET_KEY: SECRET, SECRET_KEY: undefined }, () => {
    assert.equal(verifySession(reqWithToken(adminCredentialToken())).email, 'sc@dealer.example')
  })
})

test('다른 키로 서명된 토큰은 거절한다', () => {
  withEnv({ JWT_SECRET: SECRET, ADMIN_SECRET_KEY: undefined, SECRET_KEY: undefined, JWT_PUBLIC_KEY_PATH: undefined, JWT_PUBLIC_KEY_BASE64: undefined }, () => {
    assert.equal(verifySession(reqWithToken(adminCredentialToken({}, 'wrong-secret'))), null)
  })
})

test('만료된 토큰은 로그인 안 된 것으로 본다', () => {
  withEnv({ JWT_SECRET: SECRET, JWT_PUBLIC_KEY_PATH: undefined, JWT_PUBLIC_KEY_BASE64: undefined }, () => {
    const expired = jwt.sign({ email: 'sc@dealer.example' }, SECRET, { expiresIn: -10 })
    assert.equal(verifySession(reqWithToken(expired)), null)
  })
})

test('토큰이 없으면 신원도 없다', () => {
  assert.equal(verifySession({ headers: {} }), null)
})

test('쿠키로 실려 온 토큰도 받는다', () => {
  withEnv({ JWT_SECRET: SECRET }, () => {
    const token = adminCredentialToken()
    const identity = verifySession({ headers: { cookie: `toyota_session=${encodeURIComponent(token)}; other=1` } })
    assert.equal(identity.email, 'sc@dealer.example')
  })
})

test('개발 환경에서는 토큰이 없을 때 본문의 scopeKey 를 임시 신원으로 받는다', async () => {
  await withEnv({ AUTH_ALLOW_BODY_IDENTITY: 'true' }, async () => {
    assert.equal(bodyIdentityAllowed(), true)
    const identity = await resolveIdentity({ headers: {} }, { scopeKey: 'dealer:렉서스 강남', userEmail: 'SC@Dealer.example' })
    assert.equal(identity.scopeKey, 'dealer:렉서스 강남')
    assert.equal(identity.email, 'sc@dealer.example')
    assert.equal(identity.source, 'body-dev')
  })
})

test('운영에서는 본문 신원을 받지 않는다 — 위조가 가능하다', async () => {
  await withEnv({ AUTH_ALLOW_BODY_IDENTITY: 'false' }, async () => {
    assert.equal(bodyIdentityAllowed(), false)
    assert.equal(await resolveIdentity({ headers: {} }, { scopeKey: 'hq' }), null)
  })
})

test('토큰을 보냈는데 검증에 실패하면 본문 신원으로 넘어가지 않는다', async () => {
  await withEnv({
    JWT_SECRET: SECRET,
    ADMIN_SECRET_KEY: undefined,
    SECRET_KEY: undefined,
    JWT_PUBLIC_KEY_PATH: undefined,
    JWT_PUBLIC_KEY_BASE64: undefined,
    AUTH_ALLOW_BODY_IDENTITY: 'true',
    // 폴백이 실제 어드민을 찾아 나가지 않도록 닿지 않는 주소만 준다.
    ADMIN_API_INTERNAL_URL: 'http://127.0.0.1:1',
    ADMIN_API_URL: undefined,
    PUBLIC_ADMIN_API_URL: undefined,
    ADMIN_AUTH_CHECK_TIMEOUT_MS: '200',
  }, async () => {
    resetAdminCheckCooldown()
    const forged = adminCredentialToken({ role: 'admin' }, 'attacker-secret')
    const identity = await resolveIdentity(reqWithToken(forged), { scopeKey: 'hq' })
    assert.equal(identity, null)
  })
})

test('본사는 모든 소속을 보고, 딜러사는 자기 것만 본다', () => {
  const hq = { scopeKey: 'hq' }
  const dealer = { scopeKey: 'dealer:렉서스 강남' }
  const other = 'dealer:토요타 분당'

  assert.equal(canAccessScope(hq, other), true)
  assert.equal(canAccessScope(dealer, dealer.scopeKey), true)
  assert.equal(canAccessScope(dealer, other), false)
  assert.equal(canAccessScope(dealer, 'hq'), false)
  assert.equal(canAccessScope({ scopeKey: null }, 'hq'), false)
  assert.equal(canAccessScope(dealer, null), false)
})
