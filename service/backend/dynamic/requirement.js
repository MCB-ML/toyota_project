// Semantic Requirement — 질문이 **무엇을 요구했는지**만 적는다(지시 3·12장).
//
// 여기에는 table/column/metric_id가 들어오지 않는다. 개념(concept)과 값만 적는다.
// 무엇으로 그 개념을 실현할지는 뒤의 Resolution Router가 정한다 — 그래야
// "글로벌 Dimension에 없다"는 사실이 곧 실패가 되지 않는다.
//
// LLM이 채우는 부분과 코드가 정하는 부분을 나눈다:
//   LLM  — 개념 이름, 값, 집계 의도, 그룹 축
//   코드 — 날짜 해석, 출력 단위/누적 여부(기존 requirement.js 재사용), 형식 검증
// 날짜를 LLM에 맡기면 같은 질문이 실행마다 다른 기간으로 갈린다.
import { extractRequirement as extractLegacyConstraints } from '../agentic-bi/semantic/requirement.js'
import { loadRegistry } from '../agentic-bi/app/semantic/registry.js'
import { norm } from './text.js'
import { GRAIN_CONCEPT, GRAIN_LABEL, grainOfConcept } from './timeGrain.js'
import { WINDOW } from '../agentic-bi/semantic/signature.js'

export const AGGREGATION = {
  COUNT: 'count',
  COUNT_DISTINCT: 'count_distinct',
  SUM: 'sum',
  AVERAGE: 'average',
  RATIO: 'ratio',
  LIST: 'list',
}

export const OPERATOR = { EQ: 'eq', IN: 'in', BETWEEN: 'between', GTE: 'gte', LTE: 'lte' }

/** LLM에게 주는 유일한 출력 형식. SQL·테이블·컬럼 자리가 아예 없다. */
export const REQUIREMENT_TOOL = {
  type: 'function',
  function: {
    name: 'set_semantic_requirement',
    description:
      '사용자 질문이 요구한 것을 개념 단위로 적습니다. 데이터베이스 테이블·컬럼·지표 ID·SQL을 '
      + '절대 쓰지 마세요. 사용자가 말한 업무 용어를 그대로 개념 이름으로 쓰면 됩니다.',
    parameters: {
      type: 'object',
      properties: {
        target_business_object: {
          type: 'string',
          description: '무엇을 세거나 보려는가. 사용자 표현 그대로. 예: 영업기회, 출고, 계약, 활동, 리드',
        },
        aggregation_intent: {
          type: 'string',
          enum: Object.values(AGGREGATION),
          description: 'count=건수, count_distinct=중복 없는 건수, sum=합, average=평균, ratio=비율, list=목록',
        },
        conditions: {
          type: 'array',
          description: '질문이 건 조건. 질문에 근거가 있는 것만 넣습니다.',
          items: {
            type: 'object',
            properties: {
              concept: { type: 'string', description: '조건이 걸린 개념. 예: 딜러, 접수 유형, 출고일, 관심도' },
              operator: { type: 'string', enum: Object.values(OPERATOR) },
              value: { type: 'string', description: 'eq/gte/lte일 때의 값. 사용자가 말한 그대로.' },
              values: { type: 'array', items: { type: 'string' }, description: 'in/between일 때의 값들' },
            },
            required: ['concept', 'operator'],
          },
        },
        group_by: {
          type: 'array',
          items: { type: 'string' },
          description: '나눠서 보자고 요구한 축. 예: 딜러별 → 딜러. 요구가 없으면 빈 배열.',
        },
        time: {
          type: 'object',
          description: '기간 조건. 어떤 날짜를 기준으로 했는지(등록일/계약일/출고일 등)를 time_concept에 적습니다.',
          properties: {
            time_concept: { type: 'string', description: '기준 날짜 개념. 예: 출고일, 계약일, 등록일' },
            expression: { type: 'string', description: '사용자가 말한 기간 표현 그대로. 예: 2026년 7월, 이번 달, 지난주' },
          },
        },
      },
      required: ['target_business_object', 'aggregation_intent'],
    },
  },
}

const SYSTEM_PROMPT = `당신은 사용자의 데이터 질문을 "요구 사항"으로 옮겨 적는 역할입니다.

반드시 지킬 것:
- set_semantic_requirement 도구를 정확히 한 번 호출합니다.
- SQL, 테이블 이름, 컬럼 이름, 지표 ID를 쓰지 마세요. 그것을 고르는 것은 당신의 일이 아닙니다.
- 사용자가 쓴 업무 용어를 그대로 개념 이름으로 씁니다. 예를 들어 "접수 유형"은 "접수 유형"이라고 적습니다.
  그 개념이 등록되어 있는지 없는지 걱정하지 마세요 — 확인은 뒤에서 합니다.
- 질문에 근거가 없는 조건은 넣지 않습니다. 추측해서 채우면 사용자가 묻지 않은 답이 나갑니다.
- 기간은 사용자가 말한 표현을 그대로 expression에 적습니다. 날짜 계산은 하지 마세요.`

// 이어서 묻기. "그럼 수기 접수는?"에는 딜러도 기간도 없지만, 사람은 앞 질문의
// 조건을 그대로 이어서 말한 것이다. 그래서 직전 요구를 함께 보여주고 **이번 턴의
// 완성된 요구**를 다시 쓰게 한다(차이만 받지 않는다 — 차이 병합은 어느 쪽이 이겼는지
// 코드도 사람도 못 읽는 상태를 만든다).
//
// 이어받아도 안전한 이유: 기간은 여전히 질문 원문에서 코드가 따로 읽어(time_from_question)
// 계획과 대조한다. 모델이 앞 기간을 잘못 끌고 오면 TIME_RANGE_MISMATCH로 걸린다.
const FOLLOW_UP_RULES = `

이어서 묻는 질문일 때
- 바로 앞 요구가 함께 주어집니다. 이번 질문이 **바꾸지 않은 조건은 그대로 이어받아** 적으세요.
  예: 앞이 "렉서스 강남 / 2026년 7월 / 출고일"이고 이번이 "그럼 수기 접수는?"이면
  딜러·기간·기준 날짜를 그대로 두고 접수 유형만 바꿉니다.
- 이번 질문이 바꾼 것만 바꿉니다. "8월은?"이면 기간만 바꾸고 나머지는 유지합니다.
- 주제가 완전히 바뀌면(다른 업무 객체를 묻거나 앞 조건과 무관한 질문) 이어받지 말고 새로 씁니다.
- 이어받든 새로 쓰든 **이번 턴의 완성된 요구 전체**를 내보냅니다. 차이만 적지 마세요.`

function previousBlock(previous) {
  if (!previous) return ''
  const compact = {
    target_business_object: previous.target_business_object,
    aggregation_intent: previous.aggregation_intent,
    conditions: (previous.conditions || []).map((c) => ({ concept: c.concept, operator: c.operator, values: c.values })),
    group_by: previous.group_by || [],
    time: previous.time ? { time_concept: previous.time.time_concept, expression: previous.time.expression } : null,
  }
  return `[바로 앞 질문]\n${previous.question}\n\n[바로 앞 요구]\n${JSON.stringify(compact, null, 1)}\n\n[이번 질문]\n`
}

/**
 * @param {object} opts
 * @param {string} opts.question
 * @param {string} opts.today  'YYYY-MM-DD'
 * @param {object|null} [opts.previous] 직전 턴의 정규화된 요구 — 이어서 묻기용
 * @param {(args: {system: string, user: string, tools: object[], toolChoice: object}) => Promise<Array<{name: string, args: object}>>} opts.llm
 */
export async function extractSemanticRequirement({ question, today, llm, previous = null }) {
  const calls = await llm({
    system: previous ? SYSTEM_PROMPT + FOLLOW_UP_RULES : SYSTEM_PROMPT,
    user: `${previousBlock(previous)}${question}`,
    tools: [REQUIREMENT_TOOL],
    toolChoice: { type: 'function', function: { name: REQUIREMENT_TOOL.function.name } },
  })
  const raw = calls?.find((c) => c.name === REQUIREMENT_TOOL.function.name)?.args
  if (!raw) {
    const err = new Error('질문에서 요구 사항을 뽑지 못했습니다.')
    err.code = 'requirement_extraction_failed'
    throw err
  }
  return normalizeRequirement(raw, { question, today, previous })
}

/**
 * LLM이 준 요구를 코드가 확정한다. 날짜는 여기서만 계산된다.
 */
export function normalizeRequirement(raw, { question, today, previous = null }) {
  const conditions = []
  for (const c of raw.conditions || []) {
    const concept = String(c.concept || '').trim()
    if (!concept) continue
    const operator = Object.values(OPERATOR).includes(c.operator) ? c.operator : OPERATOR.EQ
    const values = (c.values?.length ? c.values : [c.value]).map((v) => (v == null ? null : String(v).trim())).filter((v) => v)
    if (!values.length) continue
    conditions.push({ concept, operator, values })
  }

  // 기간. LLM 표현 → 코드가 해석. 해석 실패는 조용히 넘기지 않고 남긴다.
  let time = null
  const expression = raw.time?.expression?.trim() || null
  const timeConcept = raw.time?.time_concept?.trim() || null
  if (expression || timeConcept) {
    const range = resolveTimeExpression(expression, today)
    time = {
      time_concept: timeConcept,
      expression,
      start: range?.start || null,
      end: range?.end || null,
      grain: range?.grain || null,
      implies_grain: range?.implies_grain || null,
      unresolved: expression ? !range : false,
    }
  }

  // 이어서 묻기에서 기간이 빠졌으면 앞 턴의 기간을 잇는다. "그럼 수기 접수는?"에는
  // 기간이 없지만 사람은 앞의 기간을 그대로 말한 것이다. 조용히 잇지 않고 남긴다 —
  // 잇지 않으면 전 기간이 되어 숫자가 통째로 커지고, 이었다는 사실을 안 남기면
  // 왜 이 기간인지 아무도 모른다.
  const carried = []
  if (!time && previous?.time?.start) {
    time = { ...previous.time, carried_over: true }
    carried.push({ field: 'time', from: previous.question, value: `${time.start} ~ ${time.end}` })
  }

  // 질문에서 직접 읽은 기간. LLM이 준 것과 다르면 뒤의 Fidelity 게이트가 잡는다.
  const questionRange = resolveTimeExpression(question, today)

  // 기존 안전망 그대로 재사용 — 월별을 연누적으로 바꿔치기하는 사고를 계속 막는다(지시 31장).
  const legacy = extractLegacyConstraints(question)

  const stripped = stripMeasureQualifiers(conditions)
  const org = resolveOrgAxes(question, stripped.conditions, (raw.group_by || []).map((g) => String(g).trim()).filter(Boolean))

  // 단위 축은 코드가 확정한다. "월별"이라는 근거가 질문에 있으면 축은 '월'이다 —
  // 모델이 group_by에 '계약일'이라 써 보내면 등록 차원이 아니라 조용히 버려졌다.
  // 단위는 "월별" 같은 말에서 오는 게 우선이고, 없으면 달을 나열한 사실에서 유추한다.
  const impliedGrain = time?.implies_grain || questionRange?.implies_grain || null
  // legacy는 아래에서 유추분을 얹어 변형하므로, **변형 전에** 단어에서 온 것인지 기록해 둔다.
  // 안 그러면 유추로 채운 값이 "질문에 그 단어가 있었다"로 둔갑해 근거가 뒤바뀐다.
  const grainFromWord = legacy.time?.output_grain || null
  const outputGrain = grainFromWord || impliedGrain || null

  // 유추한 단위도 기존 제약과 같은 자격으로 등록한다. 창(누적 여부)은 아래
  // cumulative 축이 따로 맡는다 — 창 값을 여기서 하나로 못박으면 비율·평균처럼
  // period 창을 쓰는 지표가 근거 없이 탈락한다.
  if (impliedGrain === 'month' && !grainFromWord) {
    legacy.time.output_grain = 'month'
    legacy.constraints.push({
      field: 'time.output_grain', expected: 'month', strength: 'hard',
      evidence: `달을 나열함(${time?.expression || questionRange?.expression || ''})`,
    })
  }
  const grainAxis = applyGrainAxis(outputGrain, org.group_by, time?.time_concept,
    grainFromWord ? 'question_word' : 'month_enumeration')

  // 누적의 시작점을 기간에 반영한다. 그리고 공유 파서가 모든 '누적'을 연누적으로
  // 보내므로, 월누적이면 여기서 창을 바로잡는다(이 legacy 객체는 호출마다 새로 만들어져
  // 이 요청 안에서만 쓰인다 — 기존 Agentic BI 경로에는 영향이 없다).
  const cumulative = cumulativeAsked(question, outputGrain)
  const cumulativeNotes = []
  if (time?.start) {
    const adjusted = applyCumulativeWindow(cumulative, time)
    if (adjusted.note) {
      time = { ...time, ...adjusted.range }
      cumulativeNotes.push(adjusted.note)
    }
  }
  // 질문 원문에서 읽은 기간에도 같은 보정을 건다. 안 걸면 "7월 연누적"에서
  // 질문 기간(7월)과 계획 기간(1~7월)이 달라 멀쩡한 계획이 오탐으로 막힌다.
  const questionRangeAdjusted = questionRange
    ? applyCumulativeWindow(cumulative, questionRange).range
    : null

  if (cumulative === CUMULATIVE.MONTH && legacy.time.calculation_window !== WINDOW.MONTH_TO_DATE) {
    legacy.time.calculation_window = WINDOW.MONTH_TO_DATE
    cumulativeNotes.push('월누적은 그 달 1일부터라 월 단위 창 지표를 씁니다.')
  }

  return {
    question,
    today,
    target_business_object: String(raw.target_business_object || '').trim() || null,
    aggregation_intent: Object.values(AGGREGATION).includes(raw.aggregation_intent) ? raw.aggregation_intent : AGGREGATION.COUNT,
    conditions: org.conditions,
    group_by: grainAxis.group_by,
    output_grain: outputGrain,
    // 별/누적. null이면 제약 없음이다 — 근거 없이 막지 않는다.
    cumulative,
    cumulative_notes: cumulativeNotes,
    output_grain_source: grainFromWord ? 'question_word' : (impliedGrain ? 'month_enumeration' : null),
    org_axis_notes: org.notes,
    measure_qualifiers: measureQualifiers(question),
    stripped_conditions: stripped.removed,
    grain_axis_notes: grainAxis.notes,
    carried_over: carried,
    follows: previous ? previous.question : null,
    time,
    time_from_question: questionRangeAdjusted,
    legacy_constraints: legacy,
  }
}

// ── 별(grain) vs 누적(window) ────────────────────────────────────────────────
//
// **절대 섞으면 안 되는 두 축이다.**
//   별   "월별"·"연도별" — 그 칸만 센다. 각 달/각 해가 서로 독립이다.
//   누적 "연누적"·"YTD"  — 시작점부터 쌓아 센다.
//
// 표는 둘 다 8행으로 똑같이 나온다. 값만 다르다(2026-08-11 실측: 4월 달성률 0.29 vs 0.80).
// 그래서 사람이 눈으로 못 거르고 코드가 갈라야 한다.
//
// 여기서 뽑는 것은 **질문이 누적을 말했는가**뿐이다. 어느 지표가 누적인지는
// 지표의 semantic_signature가 알고 있다.
// 누적의 **시작점**이 어디냐가 이 축의 전부다(업무 정의, 2026-08-12 확인):
//   연누적  1월 1일 ~ 지정된 월
//   월누적  지정된 월 1일 ~ 지정일
// 시작점이 다르면 같은 "7월 누적"이 전혀 다른 숫자가 된다.
export const CUMULATIVE = { YEAR: 'year', MONTH: 'month' }

const YEAR_CUMULATIVE_WORD = /연\s*누적|연\s*누계|년\s*누적|YTD|ytd/
const MONTH_CUMULATIVE_WORD = /월\s*누적|월\s*누계|당월\s*누적|MTD|mtd/
const BARE_CUMULATIVE_WORD = /누적|누계/
const NOT_CUMULATIVE_WORD = /해당\s*월만|그\s*달만|당월만|각\s*달|각\s*해|달마다|해마다/

/**
 * 질문이 어떤 누적을 요구했는가.
 *
 * @returns {'year'|'month'|false|null}
 *   'year'  연초부터
 *   'month' 그 달 1일부터
 *   false   누적이 아니다(칸별) — "월별"·"연도별"이 그 근거다
 *   null    요구 없음(제약 걸지 않음)
 */
export function cumulativeAsked(question, outputGrain) {
  const q = String(question || '')
  if (NOT_CUMULATIVE_WORD.test(q)) return false
  // 월/연을 명시한 쪽이 먼저다. "월별 누적"처럼 단위와 맨 누적이 같이 오면 아래 bare로 간다.
  if (MONTH_CUMULATIVE_WORD.test(q)) return CUMULATIVE.MONTH
  if (YEAR_CUMULATIVE_WORD.test(q)) return CUMULATIVE.YEAR
  // 그냥 "누적"이면 연초부터로 본다 — 기존 판정과 같다(평가 No.37: "월별 누적"→연누적).
  if (BARE_CUMULATIVE_WORD.test(q)) return CUMULATIVE.YEAR
  // "월별"·"연도별"이라고만 했으면 누적이 아니다 — 그 칸만 센다.
  return outputGrain ? false : null
}

/**
 * 누적의 시작점을 기간에 반영한다.
 *
 * "7월 연누적"은 7월 한 달이 아니라 **1월 1일~7월 말**이다. 이걸 안 맞추면
 * 지표만 연누적이고 기간은 한 달이라, 7월치가 연누적으로 나간다.
 */
export function applyCumulativeWindow(cumulative, range) {
  if (!range?.start || !range?.end) return { range, note: null }
  if (cumulative === CUMULATIVE.YEAR) {
    const start = `${range.end.slice(0, 4)}-01-01`
    if (start === range.start) return { range, note: null }
    return {
      range: { ...range, start },
      note: `연누적은 1월부터입니다 — 기간을 ${start} ~ ${range.end}로 잡았습니다.`,
    }
  }
  if (cumulative === CUMULATIVE.MONTH) {
    const start = `${range.end.slice(0, 7)}-01`
    if (start === range.start) return { range, note: null }
    return {
      range: { ...range, start },
      note: `월누적은 그 달 1일부터입니다 — 기간을 ${start} ~ ${range.end}로 잡았습니다.`,
    }
  }
  return { range, note: null }
}

// ── 측정 한정어 ──────────────────────────────────────────────────────────────
//
// "취소 포함"·"취소 제외"는 **조건이 아니라 어느 지표를 쓸지를 정하는 말**이다.
// 조건으로 두면 등록 차원에 그런 축이 없어서 스키마 발견 경로로 흘러가고, 엉뚱한
// 컬럼 모호로 되묻게 된다(2026-08-12 실측: "취소 포함 계약 건수" → '계약일' 컬럼 모호).
//
// 공유 파서(semantic/requirement.js)는 '포함'과 '제외'를 같은 한정어로 묶어 둘 다
// 측정 개념에서 빼 버린다. 그런데 이 둘은 **서로 다른 지표**를 가리킨다:
//   취소 제외 → contract_mtd_actual                     (실적)
//   취소 포함 → contract_mtd_total_including_cancelled  (취소 포함 전체)
// 그래서 여기서 따로 가른다. 공유 파서는 그대로 둔다 — 기존 경로가 같이 쓴다.
const INCLUDE_CANCELLED = /취소\s*(포함|포괄)|취소까지/
const EXCLUDE_CANCELLED = /취소\s*(제외|빼고|뺀|미포함)/

export function measureQualifiers(question) {
  const q = String(question || '')
  return {
    include_cancelled: INCLUDE_CANCELLED.test(q),
    exclude_cancelled: EXCLUDE_CANCELLED.test(q) && !INCLUDE_CANCELLED.test(q),
  }
}

// 조건 자리에 오면 안 되는 개념들. 측정을 고르는 말이지 거르는 축이 아니다.
const QUALIFIER_CONCEPT = /^(취소|취소포함|취소제외|취소여부|취소상태|계약상태|퍼널기준|시승기준|활동기준)$/

/** 조건에서 측정 한정어를 떼낸다. 조용히 버리지 않고 무엇을 뗐는지 남긴다. */
export function stripMeasureQualifiers(conditions) {
  const kept = []
  const removed = []
  for (const c of conditions) {
    if (QUALIFIER_CONCEPT.test(norm(c.concept))) {
      removed.push({ concept: c.concept, values: c.values, why: '측정을 고르는 말이지 거르는 축이 아닙니다' })
      continue
    }
    kept.push(c)
  }
  return { conditions: kept, removed }
}

// ── 조직 축 확정 ─────────────────────────────────────────────────────────────
//
// "렉서스 강남"은 딜러 이름이면서 전시장 이름이다(딜러 16곳이 전부 전시장 62곳에 들어
// 있다 — dimensionValues.js의 실측 주석 참고). 그래서 LLM이 실행마다 딜러로도, 전시장으로도
// 붙인다. 두 축은 모집단이 다르다 — 2026-08-12 실측: 같은 "렉서스 강남 7월 출고"가
// 딜러 기준 3,081행, 전시장 기준 962행. 오류도 안 나고 표도 멀쩡한데 숫자만 다르다.
//
// 그래서 어느 축인지는 LLM의 그때그때 판단이 아니라 **질문에 있는 단서**로 정한다.
// 단서가 없으면 넓은 단위인 딜러를 쓴다 — dimensionValues.js의 DIMENSION_FALLBACK이
// 이미 같은 정책을 쓰고 있고, 딜러에 없는 이름이면 거기서 전시장으로 옮겨준다.
const ORG_AXES = [
  { concept: '딜러', dimension: 'dealer', cue: /딜러|대리점/ },
  { concept: '전시장', dimension: 'showroom', cue: /전시장|쇼룸|지점/ },
  { concept: '팀', dimension: 'department', cue: /팀|부서/ },
]
const WIDEST_ORG = ORG_AXES[0]

function orgAxisOf(concept, registry) {
  const wanted = norm(concept)
  for (const axis of ORG_AXES) {
    if (norm(axis.concept) === wanted) return axis
    const d = registry?.dimensions?.get(axis.dimension)
    if (!d) continue
    if (norm(d.label_ko) === wanted) return axis
    if ((d.query_aliases || []).some((a) => norm(a) === wanted)) return axis
  }
  return null
}

/**
 * 조건·축의 조직 개념을 질문의 단서에 맞춘다.
 *
 * @returns {{conditions, group_by, notes}} notes는 무엇을 왜 바꿨는지 — trace에 남긴다
 */
export function resolveOrgAxes(question, conditions, groupBy, registry = safeRegistry()) {
  const q = String(question || '')
  const cited = ORG_AXES.find((a) => a.cue.test(q)) || null
  const notes = []

  const fix = (concept, where) => {
    const axis = orgAxisOf(concept, registry)
    if (!axis) return concept
    const target = cited || WIDEST_ORG
    if (axis.concept === target.concept) return concept
    notes.push({
      where,
      from: concept,
      to: target.concept,
      why: cited
        ? `질문에 '${q.match(cited.cue)[0]}'라는 단서가 있습니다.`
        : `질문에 딜러·전시장·팀 중 무엇인지 단서가 없어 넓은 단위인 딜러로 봅니다.`,
    })
    return target.concept
  }

  return {
    conditions: conditions.map((c) => ({ ...c, concept: fix(c.concept, 'condition') })),
    group_by: groupBy.map((g) => fix(g, 'group_by')),
    notes,
  }
}

/**
 * 단위가 요구됐으면 축을 그 단위로 확정한다.
 *
 * 지우는 것: 같은 단위를 가리키는 다른 말('월별'·'달'), 그리고 기준 날짜 개념
 * ('계약일'·'출고일') — 후자는 **축이 아니라 어느 날짜를 볼지**를 말한 것이고,
 * 축으로 두면 날짜 하나하나가 한 줄이 되거나(일 단위) 해석되지 않아 사라진다.
 */
export function applyGrainAxis(outputGrain, groupBy, timeConcept, source = 'question_word') {
  if (!outputGrain) return { group_by: groupBy, notes: [] }
  const canonical = GRAIN_CONCEPT[outputGrain]
  const notes = []
  const kept = []
  for (const g of groupBy) {
    if (grainOfConcept(g)) {
      if (norm(g) !== norm(canonical)) notes.push({ from: g, to: canonical, why: '같은 단위를 가리키는 다른 말' })
      continue
    }
    if (timeConcept && norm(g) === norm(timeConcept)) {
      notes.push({ from: g, to: canonical, why: `'${g}'은 기준 날짜이지 축이 아닙니다` })
      continue
    }
    kept.push(g)
  }
  if (!groupBy.some((g) => norm(g) === norm(canonical))) {
    const why = source === 'month_enumeration'
      ? '질문이 달을 나열해 월 단위로 봅니다'
      : `질문에 '${GRAIN_LABEL[outputGrain]}'이 있어 축을 확정했습니다`
    notes.push({ from: null, to: canonical, why })
  }
  return { group_by: [canonical, ...kept], notes }
}

function safeRegistry() {
  try {
    return loadRegistry()
  } catch {
    return { dimensions: new Map() }
  }
}

// ── 기간 표현 해석 ────────────────────────────────────────────────────────────
// 결정론적이다. 같은 질문·같은 기준일이면 항상 같은 기간이 나온다.

// "1,2,3,4,5,6월" · "1~6월" — 나열과 범위. 마지막 숫자에만 '월'이 붙는다.
const MONTH_SPAN = /(?:(20\d{2})\s*년\s*)?(?<!\d)(\d{1,2}(?:\s*[,~\-·]\s*\d{1,2})+)\s*월/
const HALF_YEAR = /(?:(20\d{2})\s*년\s*)?(상반기|하반기)/
const YEAR_MONTH = /(20\d{2})\s*년\s*(\d{1,2})\s*월/
const YEAR_MONTH_ISO = /(20\d{2})[-/.](\d{1,2})(?![-/.\d])/
const YEAR_ONLY = /(20\d{2})\s*년(?!\s*\d{1,2}\s*월)/
const MONTH_ONLY = /(?<!\d)(\d{1,2})\s*월(?!\s*\d)/
const ISO_RANGE = /(20\d{2}-\d{2}-\d{2})\s*(?:~|-|부터|에서)\s*(20\d{2}-\d{2}-\d{2})/
const THIS_MONTH = /이번\s*달|당월|금월|이달/
const LAST_MONTH = /지난\s*달|전월|저번\s*달/
const THIS_YEAR = /올해|금년|당해/
const LAST_YEAR = /작년|지난해|전년/

function pad(n) { return String(n).padStart(2, '0') }
function monthRange(year, month) {
  const end = new Date(Date.UTC(year, month, 0))
  return { start: `${year}-${pad(month)}-01`, end: `${year}-${pad(month)}-${pad(end.getUTCDate())}`, grain: 'month' }
}
function yearRange(year) {
  return { start: `${year}-01-01`, end: `${year}-12-31`, grain: 'year' }
}

/**
 * @returns {{start, end, grain}|null} 해석하지 못하면 null — 지어내지 않는다.
 */
export function resolveTimeExpression(expression, today) {
  const text = String(expression || '')
  if (!text) return null
  const base = new Date(`${today}T00:00:00Z`)
  if (Number.isNaN(base.getTime())) return null

  const iso = text.match(ISO_RANGE)
  if (iso) return { start: iso[1], end: iso[2], grain: 'day' }

  // 나열·범위를 단일 월로 접지 않는다. "1,2,3,4,5,6월"의 마지막 "6월"만 잡으면
  // 6개월을 물었는데 한 달이 나가고, 오류는 안 난다(2026-08-12 실측).
  const span = text.match(MONTH_SPAN)
  if (span) {
    const year = span[1] ? Number(span[1]) : base.getUTCFullYear()
    const months = span[2].split(/[,~\-·]/).map((m) => Number(m.trim())).filter((m) => m >= 1 && m <= 12)
    if (months.length >= 2) {
      const lo = Math.min(...months)
      const hi = Math.max(...months)
      // 나열이 띄엄띄엄하면(1,3,5월) 시작~끝 한 구간으로 표현할 수 없다.
      // 넓혀서 답하면 묻지 않은 달이 섞이므로 해석하지 못한 것으로 둔다.
      const contiguous = span[2].includes('~') || span[2].includes('-')
        || months.length === hi - lo + 1
      if (contiguous) {
        const from = monthRange(year, lo)
        const to = monthRange(year, hi)
        // 달을 여러 개 나열했다는 것은 그 달들을 **따로 보고 싶다**는 뜻이다.
        // "1,2,3,4,5,6월을 보여줘"에 한 줄로 합산해 주면 물어본 것이 아니다.
        // (반기·연도는 다르다 — 그건 기간을 부른 이름일 뿐이라 여기서 단위를 유추하지 않는다.)
        return { start: from.start, end: to.end, grain: 'month', implies_grain: hi > lo ? 'month' : null }
      }
      return null
    }
  }

  const half = text.match(HALF_YEAR)
  if (half) {
    const year = half[1] ? Number(half[1]) : base.getUTCFullYear()
    return half[2] === '상반기'
      ? { start: monthRange(year, 1).start, end: monthRange(year, 6).end, grain: 'month' }
      : { start: monthRange(year, 7).start, end: monthRange(year, 12).end, grain: 'month' }
  }

  const ym = text.match(YEAR_MONTH) || text.match(YEAR_MONTH_ISO)
  if (ym) {
    const month = Number(ym[2])
    if (month >= 1 && month <= 12) return monthRange(Number(ym[1]), month)
  }

  if (THIS_MONTH.test(text)) return monthRange(base.getUTCFullYear(), base.getUTCMonth() + 1)
  if (LAST_MONTH.test(text)) {
    const d = new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth() - 1, 1))
    return monthRange(d.getUTCFullYear(), d.getUTCMonth() + 1)
  }
  if (THIS_YEAR.test(text)) return yearRange(base.getUTCFullYear())
  if (LAST_YEAR.test(text)) return yearRange(base.getUTCFullYear() - 1)

  const yearOnly = text.match(YEAR_ONLY)
  if (yearOnly) return yearRange(Number(yearOnly[1]))

  // "7월"처럼 연도가 없으면 기준일의 연도로 본다. 기준일보다 뒤면 작년으로 내린다 —
  // 8월에 "12월"을 물으면 아직 오지 않은 달이라 작년을 뜻할 가능성이 높다.
  const monthOnly = text.match(MONTH_ONLY)
  if (monthOnly) {
    const month = Number(monthOnly[1])
    if (month >= 1 && month <= 12) {
      const year = month > base.getUTCMonth() + 1 ? base.getUTCFullYear() - 1 : base.getUTCFullYear()
      return monthRange(year, month)
    }
  }
  return null
}
