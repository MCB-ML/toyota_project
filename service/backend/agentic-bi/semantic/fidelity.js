// Fidelity Validator — 실행 직전 마지막 방어선(스펙 8장).
//
// 이 레이어가 존재하는 이유는 하나다: **LLM이 잘못 골라도 잘못된 숫자가 실행되면 안 된다.**
// 지금까지 잡힌 결함은 전부 같은 모양이었다 — 쿼리는 성공하고 표도 멀쩡한데 값만 다르다.
// 사람이 눈으로 못 거르니 코드가 걸러야 한다.
//
// 판정은 결정론적이다. 같은 질문·같은 IR이면 항상 같은 결론이 나온다.
//
// ── 이 레이어가 하지 않는 것 ──────────────────────────────────
// 질문에 근거가 없으면 아무것도 바꾸지 않는다. Requirement가 비어 있으면 IR은 그대로
// 통과한다 — 추측으로 고치기 시작하면 값이 갈리는 문제를 방향만 바꿔 다시 만든다.
// ────────────────────────────────────────────────────────────
import { loadRegistry } from '../app/semantic/registry.js'
import { extractRequirement, isEmpty, STRENGTH } from './requirement.js'
import { resolveMetric, satisfies, RESOLUTION } from './resolver.js'

/**
 * IR의 지표들이 질문의 요구와 맞는지 검사하고, 어긋난 것은 등록 지표로 교체한다.
 *
 * @returns {{ir: object, violations: Array, repairs: Array, requirement: object}}
 */
export function validateFidelity(ir, question, registry = loadRegistry()) {
  let requirement = extractRequirement(question)
  const chosen = ir?.metrics || []
  if (isEmpty(requirement) || !chosen.length) return { ir, violations: [], repairs: [], requirement }
  requirement = withPopulationOnlyWhenMixed(requirement, chosen, registry)

  const violations = []
  const repairs = []
  const next = []

  for (const id of chosen) {
    const metric = registry.metrics.get(id)
    if (!metric) {
      // 등록되지 않은 지표는 이 레이어가 손댈 수 없다 — 기존 경로가 처리한다.
      next.push(id)
      continue
    }
    if (satisfies(metric.semantic_signature, requirement)) {
      next.push(id)
      continue
    }

    const r = resolveMetric(id, requirement, registry)
    const detail = describeMismatch(metric.semantic_signature, requirement)
    if (r.resolution === RESOLUTION.EXACT && r.metricId && r.metricId !== id) {
      repairs.push({ from: id, to: r.metricId, reason: detail })
      next.push(r.metricId)
    } else {
      // 대체할 등록 지표가 없다. 지어내지 않고 그대로 두되 위반으로 남긴다 —
      // 여기서 임의 지표를 만들면 근거 없는 숫자가 화면에 나간다.
      violations.push({ metric: id, strength: STRENGTH.HARD, detail, resolution: r.resolution })
      next.push(id)
    }
  }

  if (!repairs.length) return { ir, violations, repairs, requirement }
  return { ir: { ...ir, metrics: next }, violations, repairs, requirement }
}

/**
 * 모집단 제약은 **한 답 안에서 모집단이 섞였을 때만** 건다.
 *
 * 2026-08-11 실측(평가 No.5): "2026년 4월 렉서스강남 계약건수"의 정답은 퍼널 리포트의
 * 두 컬럼이다 — 당월활동실적 264, 당월전체실적 469. 어느 쪽으로 읽어도 맞는 질문이라
 * GOLD가 둘 다 정답으로 둔다. 그런데 "퍼널 언급이 없으면 넓은 지표로" 규칙이 264를 내던
 * 지표를 바꿔버려 둘 중 어느 것도 아닌 값이 나갔다.
 *
 * 진짜 문제는 퍼널 지표를 쓴 것이 아니라 **섞은 것**이었다. No.13은 실적만 퍼널 기준이고
 * 타겟·취소는 아니어서, 한 표 안에서 분모와 분자의 모집단이 달랐다. 지표가 하나뿐이면
 * 섞일 수가 없으니 그건 질문을 어떻게 읽느냐의 문제이지 정합성 문제가 아니다.
 */
function withPopulationOnlyWhenMixed(requirement, chosen, registry) {
  if (requirement.population?.funnel_attributed !== false) return requirement
  const flags = chosen
    .map((id) => registry.metrics.get(id)?.semantic_signature?.population?.funnel_attributed)
    .filter((v) => v !== undefined)
  const mixed = flags.includes(true) && flags.includes(false)
  if (mixed) return requirement
  return {
    ...requirement,
    population: {},
    constraints: requirement.constraints.filter((c) => c.field !== 'population.funnel_attributed'),
  }
}

function describeMismatch(sig, requirement) {
  const parts = []
  const t = requirement.time || {}
  if (t.output_grain && sig.time.output_grain !== t.output_grain) {
    parts.push(`출력 단위가 ${t.output_grain}이어야 하는데 ${sig.time.output_grain}입니다`)
  }
  if (t.calculation_window && sig.time.calculation_window !== t.calculation_window) {
    parts.push(`계산 창이 ${label(t.calculation_window)}이어야 하는데 ${label(sig.time.calculation_window)}입니다`)
  }
  if (requirement.population?.funnel_attributed === false && sig.population?.funnel_attributed) {
    parts.push('퍼널을 거친 건만 세는 지표인데 질문에 퍼널·활동·시승 언급이 없습니다')
  }
  return parts.join(', ')
}

const label = (w) =>
  ({ period: '해당 기간', month_to_date: '당월', year_to_date: '연누적', trailing: '최근 N개월' })[w] || w

/**
 * 파이프라인에 끼우는 형태. 기존 정규화 함수들과 같은 서명(ir, message, sendEvent)이라
 * 호출 순서에 그대로 얹힌다.
 */
export function enforceSemanticFidelity(ir, message, sendEvent = () => {}) {
  const { ir: nextIr, violations, repairs } = validateFidelity(ir, message)

  for (const r of repairs) {
    sendEvent({
      type: 'debug',
      label: '의미 검증 — 지표 교체',
      detail: `${r.from} → ${r.to}: ${r.reason}`,
    })
  }
  for (const v of violations) {
    sendEvent({
      type: 'debug',
      label: '의미 검증 — 불일치',
      detail: `${v.metric}: ${v.detail} (대체 지표가 없어 그대로 실행합니다)`,
    })
  }
  return nextIr
}
