import test from 'node:test'
import assert from 'node:assert/strict'
import {
  applyMandatoryAccessFilters,
  authorizeDashboardObject,
  buildAccessScopeHash,
  buildAccessScopeKey,
  dashboardAccessContextFor,
  resolveDataAccessContext,
} from './dashboardAccessControl.js'

test('default access context preserves the public behavior', () => {
  const context = resolveDataAccessContext()
  assert.equal(buildAccessScopeKey(context), 'public')
  assert.equal(authorizeDashboardObject({}, context).allowed, true)
  const plan = { filters: [{ dimension: 'dealer', operator: 'in', values: ['렉서스 강남'] }] }
  assert.deepEqual(applyMandatoryAccessFilters(plan, context), plan)
})

test('future scoped contexts are hashed and inject only structured mandatory filters', () => {
  const context = {
    principalId: 'user-1',
    tenantId: 'ktws',
    roleIds: ['dealer-reader'],
    organizationIds: ['dealer-11'],
    scopeVersion: 'v2',
    mandatoryFilters: [{ dimension: 'dealer', operator: 'in', values: ['렉서스 강남'] }],
  }
  const key = buildAccessScopeKey(context)
  assert.match(key, /^scope:[a-f0-9]{64}$/)
  assert.match(buildAccessScopeHash(context), /^[a-f0-9]{64}$/)
  const plan = applyMandatoryAccessFilters({ filters: [] }, context)
  assert.deepEqual(plan.filters, context.mandatoryFilters)
})

// 캐시 키에 accessScopeHash 가 그대로 들어가므로, 이 해시가 갈리는 것이 곧
// "캐시가 공유되지 않는다"는 뜻이다. 반대로 같으면 공유된다.
test('신원이 없으면 예전과 같은 public 범위다 — 기존 테스트·내부 경로 호환', () => {
  assert.equal(buildAccessScopeKey(dashboardAccessContextFor({})), 'public')
})

test('딜러사가 다르면 캐시가 갈린다', () => {
  const a = buildAccessScopeHash(dashboardAccessContextFor({ scopeKey: 'dealer:렉서스 강남' }))
  const b = buildAccessScopeHash(dashboardAccessContextFor({ scopeKey: 'dealer:토요타 분당' }))
  assert.notEqual(a, b)
})

test('배포본은 딜러사 안에서 공유된다 — 같은 scopeKey 면 누가 보든 같은 키', () => {
  const a = buildAccessScopeHash(dashboardAccessContextFor({ scopeKey: 'dealer:렉서스 강남' }))
  const b = buildAccessScopeHash(dashboardAccessContextFor({ scopeKey: 'dealer:렉서스 강남' }))
  assert.equal(a, b)
})

test('개인 작업본은 같은 딜러사 동료와도 캐시가 갈린다', () => {
  const mine = buildAccessScopeHash(dashboardAccessContextFor({ scopeKey: 'dealer:렉서스 강남', ownerEmail: 'a@dealer.example' }))
  const peer = buildAccessScopeHash(dashboardAccessContextFor({ scopeKey: 'dealer:렉서스 강남', ownerEmail: 'b@dealer.example' }))
  const shared = buildAccessScopeHash(dashboardAccessContextFor({ scopeKey: 'dealer:렉서스 강남' }))
  assert.notEqual(mine, peer)
  // 개인 작업본 캐시는 배포본(딜러사 공유) 캐시와도 다르다 — 배포 전 결과가
  // 배포본 화면에 먼저 보이는 일이 없다.
  assert.notEqual(mine, shared)
})

test('스코프 있는 컨텍스트는 public 으로 떨어지지 않는다', () => {
  assert.notEqual(buildAccessScopeKey(dashboardAccessContextFor({ scopeKey: 'hq' })), 'public')
})
