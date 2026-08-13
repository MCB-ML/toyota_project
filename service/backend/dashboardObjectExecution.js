import { createHash } from 'node:crypto'
import { executeQueryBundle, normalizeQueryBundle } from './dashboardQueryBundle.js'
import { resolveDataAccessContext, buildAccessScopeHash } from './dashboardAccessControl.js'
import { sourceDependenciesForObject, resolveSourceFingerprint } from './dashboardDataFreshness.js'
import { resolveResultCachePolicy } from './dashboardRefreshPolicy.js'
import { dashboardResultCache } from './dashboardResultCache.js'

// 2026-08-04 leo: queryBundle의 여러 SQL/merge/ratio/누적 변환을 따로 캐시하면 재실행 결과가
// 달라질 수 있었다. 최종 객체 결과를 source fingerprint와 접근 범위를 포함한 하나의 키로
// 캐시해 일반 Semantic Query와 인증 리포트가 같은 정책을 사용하도록 한다.
function hash(text) {
  return createHash('sha256').update(String(text || ''), 'utf8').digest('hex')
}

function queryPlanIdentity(bundle) {
  return bundle.queries.map((query) => ({
    id: query.id,
    metricId: query.metricId,
    database: query.db,
    sqlHash: hash(query.sql),
    execution: query.execution || null,
    sourceDependencies: query.sourceDependencies || query.source_dependencies || null,
  }))
}

// 일반 compiled query와 ratio/queryBundle을 한 단위로 캐시한다. SQL 단위가 아니라 최종
// merge/ratio/누적 변환 전 결과 묶음을 캐시하므로, 재수화 때 원래의 모든 파생 계산을 그대로
// 재현하면서도 같은 대시보드 객체의 Fabric 재실행을 막을 수 있다.
export async function executeCachedQueryBundle(object, {
  accessContext = resolveDataAccessContext(),
  forceRefresh = false,
  executeBundle = executeQueryBundle,
  resolveDependencies = sourceDependenciesForObject,
  resolveFingerprint = resolveSourceFingerprint,
  resultCache = dashboardResultCache,
} = {}) {
  const bundle = normalizeQueryBundle(object)
  if (!bundle.queries.length) return { rows: null, bundle, queryResults: [], cache: { state: 'bypassed', refreshing: false } }

  const sourceDependencies = resolveDependencies({ ...object, queryBundle: bundle })
  const sourceState = await resolveFingerprint(sourceDependencies, { forceRefresh })
  const policy = resolveResultCachePolicy(object.refreshPolicy)
  const { value, cache } = await resultCache.execute({
    namespace: 'query-bundle',
    forceRefresh,
    policy,
    keyParts: {
      version: bundle.version,
      queries: queryPlanIdentity(bundle),
      merge: bundle.merge,
      derivations: bundle.derivations,
      transform: bundle.transform,
      sourceFingerprint: sourceState.fingerprint,
      accessScopeHash: buildAccessScopeHash(accessContext),
    },
    loader: () => executeBundle(object, { accessContext, forceRefresh }),
  })
  return { ...value, cache, sourceFingerprint: sourceState.fingerprint, sourceStates: sourceState.sources }
}
