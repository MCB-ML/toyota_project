// Semantic Signature — "이 지표가 무슨 의미인가"를 코드가 읽을 수 있는 구조로.
//
// 왜 필요한가: 지금은 LLM이 metric id를 먼저 고르고, 코드는 그게 질문과 맞는지 확인할
// 방법이 없다. "월별 계약실적"에 contract_ytd_actual이 선택돼도 SQL은 성공하고 표도
// 8행으로 똑같이 나온다 — 4월 달성률만 0.29 대신 0.80이 된다(2026-08-11 실측, 10회 중 2회).
//
// 이름 규칙(_mtd_/_ytd_)으로 사후 교체하는 안전망은 이미 있지만, 그건 "잘못 고른 뒤
// 되돌리는" 방식이라 규칙에 없는 새 형태가 나오면 못 막는다. Signature는 **고르기 전에**
// 호환 여부를 판정하기 위한 것이다.
//
// ── 이 파일이 하는 일 ────────────────────────────────────────────
// YAML에 semantic_signature가 **적혀 있으면 그대로 쓴다**(사람이 검토한 값이 진실).
// 없으면 기존 메타데이터에서 추론하되, 추론의 근거와 확신도를 함께 남긴다 —
// 이름만 보고 단정하지 않는다는 뜻이다(스펙 4장 note).
// ────────────────────────────────────────────────────────────

/** 측정 개념. 지표 id·이름·expression에서 읽는다. */
export const CONCEPT = {
  ACTUAL: 'actual',
  TARGET: 'target',
  CANCELLED: 'cancelled',
  RATE: 'rate',
  AVERAGE: 'average',
  COUNT: 'count',
  UNKNOWN: 'unknown',
}

/** 절대치인가 비율인가. 조합 가능 여부를 가르는 가장 굵은 축이다. */
export const KIND = { ABSOLUTE: 'absolute', RATIO: 'ratio' }

/**
 * 계산 창(calculation window) — **출력 단위(grain)와 다른 개념이다.**
 *
 *   period        각 구간을 그 구간만으로 계산 (월별 계약 = 그 달 계약)
 *   year_to_date  연초부터 그 구간까지 누적
 *   month_to_date 월초부터 그 시점까지 누적
 *   trailing      최근 N개월 이동
 *
 * "월별 YTD"는 output_grain=month + calculation_window=year_to_date 다.
 * 둘을 한 필드로 뭉치면 이 요청을 표현할 수 없다(스펙 5장).
 */
export const WINDOW = {
  PERIOD: 'period',
  YEAR_TO_DATE: 'year_to_date',
  MONTH_TO_DATE: 'month_to_date',
  TRAILING: 'trailing',
}

const has = (s, ...parts) => parts.some((p) => String(s || '').includes(p))

/**
 * 퍼널 귀속 조건. 이 셋을 모두 요구하는 계약 지표는 "활동·시승을 거쳐 들어온 계약"만
 * 센다 — 전체 계약이 아니라 **좁은 모집단**이다.
 *
 * 2026-08-11 실측(평가 No.13): "월별 판매 성취도 — 타겟·실적·취소·달성률" 4회 중 1회가
 * contract_mtd_activity_actual을 골랐다. 나머지 3회(인증 리포트 1 + contract_mtd_actual 2)는
 * 서로 값이 같았다 — GOLD와 일치하는 쪽이 그쪽이고, 퍼널 지표가 오답이다.
 * 표는 똑같이 8행이라 눈으로는 안 걸린다.
 *
 * 셋을 모두 요구할 때만 본다. 하나씩은 퍼널 귀속의 표시가 아니다 —
 * br_qualified_lead_def 하나만 쓰는 lead_mtd_actual은 그냥 표준 영업기회 지표다.
 */
const FUNNEL_ATTRIBUTION_RULES = ['br_qualified_lead_def', 'br_tp_grp_scope', 'br_act_result_exclusion']

function isFunnelAttributed(metric) {
  const required = metric.required_filters || []
  return FUNNEL_ATTRIBUTION_RULES.every((r) => required.includes(r))
}

/**
 * 지표 id에서 계산 창을 읽는다. 근거가 약하면 null을 돌려 호출부가 확신도를 낮추게 한다.
 *
 * `_mtd_`만 보면 `contract_progress_rate_mtd`처럼 **끝에 붙은** 경우를 놓친다 —
 * 그러면 당월 진행률이 period로 잡혀 mtd 지표와 호환 판정이 어긋난다(2026-08-11 실측).
 */
function windowFromId(id) {
  const s = `_${String(id || '')}_`
  if (has(s, '_ytd_')) return WINDOW.YEAR_TO_DATE
  if (has(s, '_mtd_')) return WINDOW.MONTH_TO_DATE
  if (has(s, 'trailing')) return WINDOW.TRAILING
  return null
}

/**
 * 이름에서 개념을 읽을 때 괄호 안 설명은 버린다.
 *
 * "당월 계약 실적 (전체실적, 취소 제외)"의 '취소'는 이 지표가 취소 건수라는 뜻이 아니라
 * 취소를 뺐다는 뜻이고, "연누적 계약 전체 건수 (취소 포함, 달성률 분자 전용)"의 '률'은
 * 이 지표가 비율이라는 뜻이 아니라 어디에 쓰이는지 적어 둔 것이다. 괄호를 그대로 읽으면
 * 실적이 취소로, 건수가 비율로 뒤집힌다 — 셋 다 실제로 뒤집혔다.
 */
const withoutParenthetical = (s) => String(s || '').replace(/[(（][^)）]*[)）]/g, ' ')

function conceptFrom(metric) {
  const id = metric.id || ''
  const name = withoutParenthetical(metric.name_ko)
  if (has(id, '_rate', '_ratio') || has(name, '률', '율')) return CONCEPT.RATE
  if (has(id, '_target') || has(name, '목표', '타겟')) return CONCEPT.TARGET
  if (has(id, 'cancel') || has(name, '취소')) return CONCEPT.CANCELLED
  if (has(id, '_avg', 'average') || has(name, '평균')) return CONCEPT.AVERAGE
  if (has(id, '_actual') || has(name, '실적')) return CONCEPT.ACTUAL
  if (metric.aggregation === 'count_distinct' || has(id, '_count')) return CONCEPT.COUNT
  return CONCEPT.UNKNOWN
}

/**
 * 출력 단위. metric.default_time_grain을 쓰되, 그게 계산 창과 뒤섞여 선언된 경우가 있어
 * supported_time_grains로 보정한다 — 연 단위만 지원하면 월별로 못 쪼갠다.
 */
function grainsFrom(metric) {
  // grain은 대개 배열이지만 `grain: unresolved`처럼 문자열인 지표가 있다 —
  // 배열로 단정하면 로더 전체가 죽는다(2026-08-11 실측, funnelCatalog 3건).
  const declared = Array.isArray(metric.grain) ? metric.grain : []
  const supported = metric.supported_time_grains || declared.filter((g) => ['day', 'month', 'year'].includes(g))
  const preferred = metric.default_time_grain
  const output = preferred && (!supported.length || supported.includes(preferred)) ? preferred : supported[0] || null
  // 기본값과 **낼 수 있는 것**을 나눠 둔다. supported_time_grains가 [month, year]인 지표는
  // 둘 다 낼 수 있는데, 기본값만 보고 판정하면 멀쩡한 지표를 바꿔치기하게 된다.
  return { output, supported: supported.length ? supported : output ? [output] : [] }
}

/**
 * 지표 하나의 Semantic Signature.
 *
 * @returns {{
 *   entity, measure: {concept, kind}, time: {output_grain, calculation_window, cumulative},
 *   aggregation: {semantic_type}, source: 'declared'|'inferred', confidence: 'high'|'medium'|'low',
 *   evidence: string[]
 * }}
 */
export function signatureOf(metric) {
  // 사람이 적어 둔 게 있으면 그대로 쓴다 — 추론은 어디까지나 미등록분을 위한 임시다.
  if (metric.semantic_signature) {
    return { ...metric.semantic_signature, source: 'declared', confidence: 'high', evidence: ['semantic_signature'] }
  }

  const evidence = []
  const concept = conceptFrom(metric)
  evidence.push(`concept←${concept === CONCEPT.UNKNOWN ? 'unknown' : 'id/name'}`)

  const kind = concept === CONCEPT.RATE ? KIND.RATIO : KIND.ABSOLUTE
  const idWindow = windowFromId(metric.id)
  if (idWindow) evidence.push(`window←id(${metric.id})`)

  const { output: grain, supported: supportedGrains } = grainsFrom(metric)
  if (grain) evidence.push(`grain←${metric.default_time_grain ? 'default_time_grain' : 'supported_time_grains'}`)

  // 계산 창을 id에서 못 읽으면 grain으로 되짚는다. year 단위 지표는 대개 연누적이지만
  // 확신할 수 없으므로 확신도를 낮춰 표시한다 — 이 값으로 후보를 탈락시킬 때 근거가 된다.
  let window = idWindow
  let confidence = idWindow ? 'high' : 'medium'
  if (!window) {
    window = grain === 'year' ? WINDOW.YEAR_TO_DATE : WINDOW.PERIOD
    evidence.push(`window←grain(${grain})추정`)
    confidence = 'low'
  }
  if (concept === CONCEPT.UNKNOWN) confidence = 'low'

  return {
    entity: metric.fact_entity || null,
    measure: { concept, kind },
    time: {
      output_grain: grain,
      supported_grains: supportedGrains,
      calculation_window: window,
      // 누적 여부는 창에서 따라온다 — period만 비누적이다.
      cumulative: window === WINDOW.YEAR_TO_DATE || window === WINDOW.MONTH_TO_DATE,
    },
    // 무엇을 세는가와 별개로 **누구를 세는가**. 같은 개념·같은 시간축이라도 모집단이
    // 다르면 다른 숫자가 나온다 — signature에 없으면 이 차이를 판정할 수 없다.
    population: { funnel_attributed: isFunnelAttributed(metric) },
    aggregation: { semantic_type: metric.additive_behavior?.across_time || metric.aggregation || null },
    source: 'inferred',
    confidence,
    evidence,
  }
}

/**
 * 마이그레이션 분류(스펙 14장). 59개를 이름만 보고 한 번에 바꾸지 않기 위한 것이다.
 *
 *   AUTO_SAFE        id에 창이 명시돼 있고 개념도 읽힌다 — 그대로 써도 된다
 *   REVIEW_REQUIRED  둘 중 하나가 약하다 — 사람이 YAML에 적어 두는 게 낫다
 *   AMBIGUOUS        근거가 없다 — 반드시 사람이 정해야 한다
 */
export function migrationClass(metric) {
  const sig = signatureOf(metric)
  if (sig.source === 'declared') return 'DECLARED'
  if (sig.confidence === 'high' && sig.measure.concept !== CONCEPT.UNKNOWN && sig.time.output_grain) return 'AUTO_SAFE'
  if (sig.confidence === 'low') return 'AMBIGUOUS'
  return 'REVIEW_REQUIRED'
}
