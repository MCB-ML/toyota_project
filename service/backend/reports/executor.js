// Certified Report 실행기.
//
// 등록된 SQL을 "그대로" 실행한다 — 지표별로 쪼개거나 애플리케이션에서 다시 집계하지
// 않는다. 이 리포트의 계약목표·계약진행률은 활동유형보다 상위 grain에서 계산돼
// 상세 행에 반복되고 합계 행에서만 중복 제거되는데, 그 규칙이 SQL 안에만 있기 때문이다.
import { getReport, sha256, sqlSha256Matches, ReportError } from './registry.js'
import { validateReportParameters } from './parameterValidator.js'
import { queryFabricCertified } from '../fabricClient.js'
import { resolveDataAccessContext, buildAccessScopeHash } from '../dashboardAccessControl.js'
import { sourceDependenciesForReport, resolveSourceFingerprint } from '../dashboardDataFreshness.js'
import { resolveResultCachePolicy } from '../dashboardRefreshPolicy.js'
import { dashboardResultCache } from '../dashboardResultCache.js'

// 계약의 파라미터 정의 → 드라이버 바인딩용 {name: {type, value}}.
// 계약에 없는 이름은 여기까지 오지 못한다(validateReportParameters가 먼저 거른다).
export function buildBindParameters(contract, params) {
  const bind = {}
  for (const spec of contract.parameters) {
    bind[spec.name] = { type: spec.sql_type, value: params[spec.name] ?? null }
  }
  return bind
}

function paramValue(params, ...names) {
  for (const name of names) {
    if (Object.prototype.hasOwnProperty.call(params || {}, name)) return params[name]
  }
  return null
}

/**
 * @param reportId  등록된 리포트 id
 * @param rawParams 사용자/에이전트가 요청한 파라미터
 * @param authorizationScope  ⚠ 현재 서버에 인증이 없어 보안 경계가 아니다.
 *                            registry의 계약 authorization.enforced 주석 참고.
 */
export async function executeReport(reportId, rawParams = {}, {
  authorizationScope = null,
  accessContext = resolveDataAccessContext(),
  timeoutMs,
  noCache = false,
  forceRefresh = false,
} = {}) {
  const report = getReport(reportId)
  const { contract, sqlText } = report

  const validated = validateReportParameters(contract, rawParams, authorizationScope)
  if (!validated.ok) {
    throw new ReportError('invalid_parameters', validated.errors.join('\n'))
  }

  // 실행 직전 한 번 더 대조한다. 레지스트리 로드 이후 누군가(코드든 사람이든)
  // sqlText를 건드렸다면 여기서 걸린다.
  if (!sqlSha256Matches(sqlText, contract.sql_sha256)) {
    throw new ReportError('sql_hash_mismatch', '실행 직전 SQL 해시가 계약과 다릅니다. 실행을 중단합니다.')
  }

  // 2026-08-04 leo: 기존 Map 캐시는 app 프로세스마다 갈라져 Docker 워커가 여러 개면
  // 같은 리포트를 중복 실행했다. 등록 SQL/파라미터/접근범위/sourceFingerprint를 한 키로
  // 묶는 Redis SWR 계층으로 통일해 일반 대시보드 queryBundle과 같은 원칙으로 재사용한다.
  const sourceDependencies = sourceDependenciesForReport(reportId)
  const sourceState = await resolveSourceFingerprint(sourceDependencies, { forceRefresh: noCache || forceRefresh })
  // 2026-08-04 leo: 인증 리포트만 과거 기간 TTL을 다르게 적용하면 동일 대시보드의 갱신 주기가
  // 예측되지 않았다. 일반 queryBundle과 같은 한 시간 결과 캐시 정책을 사용한다.
  const policy = resolveResultCachePolicy()
  const { value: rows, cache } = await dashboardResultCache.execute({
    namespace: 'certified-report',
    forceRefresh: noCache || forceRefresh,
    policy,
    keyParts: {
      reportId,
      version: contract.version,
      sqlHash: contract.sql_sha256,
      params: validated.params,
      accessScopeHash: buildAccessScopeHash(accessContext),
      sourceFingerprint: sourceState.fingerprint,
    },
    loader: async () => {
      const bind = buildBindParameters(contract, validated.params)
      return queryFabricCertified(contract.execution.database, sqlText, bind, { timeoutMs })
    },
  })

  return {
    reportId,
    version: contract.version,
    title: contract.title,
    params: validated.params,
    rows,
    // 캐시된 값을 "지금 값"처럼 보여주지 않기 위해 조회 시각을 함께 돌려준다.
    fetchedAt: cache.fetchedAt,
    cached: cache.state === 'fresh' || cache.state === 'stale',
    cache,
    sourceFingerprint: sourceState.fingerprint,
    // ScName이 NULL이면 SC 열이 없는 표(분기 A), 아니면 SC 열이 있는 표(분기 B).
    branch: paramValue(validated.params, 'ScName', 'sc_name') === null ? 'a' : 'b',
    dimensionColumns:
      paramValue(validated.params, 'ScName', 'sc_name') === null
        ? contract.dimension_columns.branch_a
        : contract.dimension_columns.branch_b,
    columnSemantics: contract.column_semantics,
  }
}
