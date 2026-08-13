import { createHash } from 'node:crypto'

// 2026-08-04 leo: 현재는 사용자·조직 권한 테이블이 없지만, 이후 SQL 문자열을 직접 수정하지
// 않고 Semantic Query IR의 검증된 filter만 강제할 수 있도록 접근 범위 인터페이스를 먼저 둔다.
function stableValue(value) {
  if (Array.isArray(value)) return value.map(stableValue)
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stableValue(value[key])]))
  }
  return value ?? null
}

function hash(value) {
  return createHash('sha256').update(JSON.stringify(stableValue(value)), 'utf8').digest('hex')
}

function normalizedFilters(filters) {
  if (!Array.isArray(filters)) return []
  return filters
    .filter((filter) => filter && typeof filter === 'object' && typeof filter.dimension === 'string')
    .map((filter) => ({
      dimension: filter.dimension,
      operator: filter.operator || 'in',
      values: Array.isArray(filter.values) ? [...filter.values].map(String).sort() : [],
    }))
    .sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)))
}

// 인증이 붙기 전의 기본 컨텍스트. 테스트와 신원이 필요 없는 내부 경로만 쓴다.
// 실제 요청 경로는 아래 dashboardAccessContextFor 로 검증된 신원을 실어야 한다 —
// 이 기본값은 모든 사용자가 같은 캐시 키를 갖게 되므로 그대로 두면 안 된다.
export function resolveDataAccessContext(_request = null) {
  return {
    principalId: null,
    tenantId: null,
    roleIds: [],
    organizationIds: [],
    scopeVersion: 'public-v1',
    mandatoryFilters: [],
    source: 'default-public',
  }
}

// 검증된 신원으로 캐시·필터 범위를 만든다.
//
// 캐시 키(buildAccessScopeHash)에 이 값이 그대로 들어가므로, 무엇을 싣느냐가 곧
// "누가 그 캐시를 공유하느냐"다:
//   - 배포본·템플릿: { scopeKey }        → 같은 딜러사(및 그걸 보는 본사)가 한 캐시를 쓴다.
//   - 개인 작업본:   { scopeKey, owner } → 소유자만 쓴다. 같은 딜러사 동료도 키가 다르다.
//   - 채팅/에이전트: { scopeKey }        → 결과 자체가 딜러사 범위라 딜러사 공유가 맞다.
//
// scopeKey 를 빼먹으면 public 키로 떨어져 딜러사 사이에 캐시가 섞이므로 기본값을 두지 않는다.
export function dashboardAccessContextFor({ scopeKey = null, ownerEmail = null } = {}) {
  if (!scopeKey && !ownerEmail) return resolveDataAccessContext()
  return {
    principalId: ownerEmail || null,
    tenantId: scopeKey || null,
    roleIds: [],
    organizationIds: [],
    scopeVersion: 'scoped-v1',
    mandatoryFilters: [],
    source: 'verified-identity',
  }
}

export function buildAccessScopeKey(context = resolveDataAccessContext()) {
  const normalized = {
    principalId: context.principalId || null,
    tenantId: context.tenantId || null,
    roleIds: [...(context.roleIds || [])].map(String).sort(),
    organizationIds: [...(context.organizationIds || [])].map(String).sort(),
    scopeVersion: context.scopeVersion || 'public-v1',
    mandatoryFilters: normalizedFilters(context.mandatoryFilters),
  }
  const isPublic = normalized.principalId === null && normalized.tenantId === null &&
    normalized.roleIds.length === 0 && normalized.organizationIds.length === 0 &&
    normalized.mandatoryFilters.length === 0 && normalized.scopeVersion === 'public-v1'
  return isPublic ? 'public' : `scope:${hash(normalized)}`
}

export function buildAccessScopeHash(context = resolveDataAccessContext()) {
  return hash({ accessScopeKey: buildAccessScopeKey(context) })
}

// 컴파일된 SQL 뒤에 문자열로 조건을 덧붙이지 않는다. 이후 정책 저장소를 연결하면 이 함수가
// 검증된 Semantic Query IR filter만 추가한 뒤 기존 validator/compiler를 다시 통과시킨다.
export function applyMandatoryAccessFilters(queryPlan, context = resolveDataAccessContext()) {
  const mandatoryFilters = normalizedFilters(context.mandatoryFilters)
  if (!mandatoryFilters.length) return queryPlan
  return {
    ...queryPlan,
    filters: [...(Array.isArray(queryPlan?.filters) ? queryPlan.filters : []), ...mandatoryFilters],
  }
}

export function authorizeDashboardObject(_object, _context = resolveDataAccessContext()) {
  // 기본 공개 범위는 현재 동작을 바꾸지 않는다. 후속 구현에서 객체의 scope/owner/role 정책을
  // 여기에서 판정하고, 호출자는 false일 때만 403을 반환하면 된다.
  return { allowed: true, reason: null }
}
