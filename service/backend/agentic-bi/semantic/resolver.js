// Resolver — 요구를 만족하는 등록 지표를 찾는다(스펙 6장).
//
// LLM이 고른 것을 **검사**할 뿐 아니라, 틀렸을 때 **무엇으로 바꿔야 하는지**까지
// 결정론적으로 내놓는다. 후보 선정에 LLM을 쓰지 않는 게 요점이다 — 같은 질문에
// 매번 같은 답이 나와야 하기 때문이다.
//
// 판정 등급(스펙 6장):
//   EXACT       요구를 그대로 만족하는 등록 지표가 있다
//   COMPOSABLE  등록 지표들의 조합으로 만들 수 있다 (비율 = 분자/분모)
//   DERIVABLE   등록된 파생 규칙으로 유도할 수 있다
//   UNRESOLVED  못 만든다 — 지어내지 않고 그렇게 보고한다
import { loadRegistry } from '../app/semantic/registry.js'

export const RESOLUTION = {
  EXACT: 'EXACT',
  COMPOSABLE: 'COMPOSABLE',
  DERIVABLE: 'DERIVABLE',
  UNRESOLVED: 'UNRESOLVED',
}

/**
 * signature가 요구 제약을 만족하는가. 요구가 null인 항목은 검사하지 않는다.
 *
 * 출력 단위는 **낼 수 있으면 만족**으로 본다 — supported_time_grains가 [month, year]인
 * 지표는 월별로도 낼 수 있으므로, 기본값이 year라는 이유로 바꿔치기하면 안 된다.
 * 계산 창은 그렇지 않다 — 그건 지표가 무엇을 세는지 자체라 바꿔 낼 수 없다.
 */
export function satisfies(signature, requirement) {
  const t = requirement?.time || {}
  const supported = signature.time.supported_grains?.length ? signature.time.supported_grains : [signature.time.output_grain]
  if (t.output_grain && !supported.includes(t.output_grain)) return false
  if (t.calculation_window && signature.time.calculation_window !== t.calculation_window) return false

  // 모집단. 퍼널을 물었다는 근거가 없는데 퍼널 지표가 오면 다른 숫자가 나온다.
  // 반대 방향은 막지 않는다 — 퍼널을 물었을 때 넓은 지표가 오는 건 여기서 판단하지 않는다.
  const p = requirement?.population || {}
  if (p.funnel_attributed === false && signature.population?.funnel_attributed) return false
  return true
}

/**
 * 지금 고른 지표를 요구에 맞는 등록 지표로 바꾼다.
 *
 * 같은 개념·같은 대상을 유지한 채 **계산 창만 다른** 형제를 찾는다. 개념까지 바꾸면
 * 질문에 없던 지표를 끌어오는 것이라 더 위험하다 — 그 경우는 UNRESOLVED로 둔다.
 *
 * @returns {{resolution: string, metricId: string|null, reason: string}}
 */
export function resolveMetric(metricId, requirement, registry = loadRegistry()) {
  const current = registry.metrics.get(metricId)
  if (!current) return { resolution: RESOLUTION.UNRESOLVED, metricId: null, reason: `등록되지 않은 지표: ${metricId}` }

  if (satisfies(current.semantic_signature, requirement)) {
    return { resolution: RESOLUTION.EXACT, metricId, reason: '요구를 그대로 만족합니다' }
  }

  const sig = current.semantic_signature
  const candidates = []
  for (const [id, m] of registry.metrics) {
    if (id === metricId) continue
    const s = m.semantic_signature
    // 개념·종류·측정 대상은 유지한다 — 바꾸는 건 시간 축뿐이다.
    if (s.measure.concept !== sig.measure.concept) continue
    if (s.measure.kind !== sig.measure.kind) continue
    if (s.entity !== sig.entity) continue
    if (!satisfies(s, requirement)) continue
    candidates.push(id)
  }

  if (!candidates.length) {
    return { resolution: RESOLUTION.UNRESOLVED, metricId: null, reason: `${metricId}는 요구와 맞지 않는데 같은 개념의 대체 지표가 없습니다` }
  }

  // 여러 개면 이름이 가장 가까운 것을 고른다 — contract_ytd_actual → contract_mtd_actual처럼
  // 창만 바뀐 형제가 이름도 가장 비슷하다. 임의로 고르면 결과가 갈린다.
  candidates.sort((a, b) => nameDistance(metricId, a) - nameDistance(metricId, b) || a.localeCompare(b))
  return { resolution: RESOLUTION.EXACT, metricId: candidates[0], reason: `요구에 맞는 등록 지표로 대체합니다 (${metricId} → ${candidates[0]})` }
}

/** 토큰 단위로 얼마나 다른가. 짧은 편집거리보다 지표 id 규칙(밑줄 구분)에 잘 맞는다. */
function nameDistance(a, b) {
  const A = a.split('_')
  const B = b.split('_')
  const shared = A.filter((t) => B.includes(t)).length
  return A.length + B.length - 2 * shared
}
