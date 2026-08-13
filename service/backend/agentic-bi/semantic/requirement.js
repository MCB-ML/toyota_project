// Semantic Requirement — 질문이 **요구한 것**만 뽑는다(스펙 5장).
//
// 실행 IR("어떤 metric id를 쓸지")보다 앞선다. 지금 구조는 LLM이 곧바로 metric id를
// 고르기 때문에, 고른 게 질문과 맞는지 판단할 기준 자체가 없다. 요구를 먼저 따로
// 적어 두면 그 기준이 생긴다.
//
// ── 이 파일의 규칙 ────────────────────────────────────────────
// **질문에 근거가 있을 때만 값을 채운다.** 근거가 없으면 null이고, null은 "제약 없음"이다.
// 추측해서 채우면 Validator가 LLM의 정상적인 선택을 근거 없이 뒤집는다 — 그게 지금
// 고치려는 문제(조용히 값이 갈리는 것)를 반대 방향으로 다시 만드는 길이다.
// ────────────────────────────────────────────────────────────
import { CONCEPT, KIND, WINDOW } from './signature.js'

/** 제약의 세기. HARD만 실행을 막는다(스펙 8장). */
export const STRENGTH = { HARD: 'hard', SOFT: 'soft' }

const MONTHLY = /월별|월 별|달별|월간 추이|매월/
const YEARLY = /연도별|년도별|해마다/
const DAILY = /일별|일 별|날짜별|일자별/
const CUMULATIVE = /누적|누계|YTD|ytd/
const NOT_CUMULATIVE = /해당\s*월만|그\s*달만|당월만/

/** 질문이 비율을 요구했다는 근거. 라우팅(reports/registry.js)도 같은 기준을 쓴다. */
export const RATE_ASKED = /비율|비중|퍼센트|%|달성률|진행률|진척률|전환율|증감률/
const RATE = RATE_ASKED
const TARGET = /목표|타겟|target/i
const CANCELLED = /취소/
const CANCEL_QUALIFIER = /취소\s*(제외|포함|빼|뺀|미포함)/

/**
 * 질문에서 Semantic Requirement를 뽑는다.
 *
 * @returns {{
 *   time: {output_grain: string|null, calculation_window: string|null},
 *   measures: Array<{concept: string, kind: string}>,
 *   constraints: Array<{field: string, expected: any, strength: string, evidence: string}>
 * }}
 */
export function extractRequirement(question) {
  const q = String(question || '')
  const constraints = []

  // ── 출력 단위 ──
  let outputGrain = null
  if (MONTHLY.test(q)) outputGrain = 'month'
  else if (DAILY.test(q)) outputGrain = 'day'
  else if (YEARLY.test(q)) outputGrain = 'year'
  if (outputGrain) {
    constraints.push({ field: 'time.output_grain', expected: outputGrain, strength: STRENGTH.HARD, evidence: q.match(MONTHLY)?.[0] || q.match(DAILY)?.[0] || q.match(YEARLY)?.[0] })
  }

  // ── 계산 창 ──
  // 여기가 이 레이어의 핵심이다. "월별"만으로 창을 period로 단정하면 안 된다 —
  // "월별 누적"은 정상 요청이고(평가 No.37), 창은 year_to_date여야 한다.
  let window = null
  if (CUMULATIVE.test(q) && !NOT_CUMULATIVE.test(q)) {
    window = WINDOW.YEAR_TO_DATE
    constraints.push({ field: 'time.calculation_window', expected: window, strength: STRENGTH.HARD, evidence: q.match(CUMULATIVE)[0] })
  } else if (outputGrain === 'month') {
    // 월별인데 누적이라는 말이 없으면 그 달만 센 값을 요구한 것이다.
    // 연누적 지표를 쓰면 표 모양은 같은데 값이 달라진다(2026-08-11 실측: 달성률 0.29 vs 0.80).
    window = WINDOW.MONTH_TO_DATE
    constraints.push({ field: 'time.calculation_window', expected: window, strength: STRENGTH.HARD, evidence: '월별(누적 언급 없음)' })
  }

  // ── 측정 개념 ──
  // 요구된 개념을 열거만 한다. "이것만" 이라는 뜻이 아니다 — 질문이 명시한 것이 결과에
  // 있어야 한다는 뜻이다(빠지는 쪽이 실제 사고였다: 평가 No.28·37·50).
  const measures = []
  if (RATE.test(q)) measures.push({ concept: CONCEPT.RATE, kind: KIND.RATIO, evidence: q.match(RATE)[0] })
  if (TARGET.test(q)) measures.push({ concept: CONCEPT.TARGET, kind: KIND.ABSOLUTE, evidence: q.match(TARGET)[0] })
  // "취소 제외"는 취소 건수를 요구한 게 아니다 — 실적의 조건이다.
  if (CANCELLED.test(q) && !CANCEL_QUALIFIER.test(q)) measures.push({ concept: CONCEPT.CANCELLED, kind: KIND.ABSOLUTE, evidence: '취소' })

  // ── 모집단 ──
  // 퍼널 지표(활동·시승을 거쳐 들어온 것만 세는 지표)를 쓰려면 질문에 근거가 있어야 한다.
  // "월별 판매 성취도"처럼 그냥 실적을 물은 질문에 퍼널 지표가 오면 값이 달라진다.
  // 근거가 있으면 null을 둔다 — 제약 없음, 즉 퍼널 지표든 아니든 통과다.
  const funnelAsked = FUNNEL_EVIDENCE.test(q)
  if (!funnelAsked) {
    constraints.push({ field: 'population.funnel_attributed', expected: false, strength: STRENGTH.HARD, evidence: '퍼널·활동·시승 언급 없음' })
  }

  return {
    time: { output_grain: outputGrain, calculation_window: window },
    population: funnelAsked ? {} : { funnel_attributed: false },
    measures,
    constraints,
  }
}

/**
 * 퍼널 경로를 물었다는 근거.
 *
 * 이 말들이 있으면 좁은 모집단(활동·시승을 거친 건)을 요구한 것으로 본다.
 * 없으면 전체를 물은 것이다 — 퍼널 페이지 질문은 대부분 이 말들을 쓴다.
 */
const FUNNEL_EVIDENCE = /퍼널|활동|시승|리드|영업기회|기회창출|전환/

/** 제약이 하나도 없으면 이 레이어는 아무 판단도 하지 않는다. */
export function isEmpty(requirement) {
  return !requirement?.constraints?.length && !requirement?.measures?.length
}
