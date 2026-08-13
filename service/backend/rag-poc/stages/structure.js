import { streamAssistantTurn } from '../../azureStream.js'
import { buildStructureTool } from '../ragTools.js'
import { renderGlossaryForPrompt } from '../../schemaLoader.js'

// Stage 0 — turn the raw NL question into a structured summary that drives every downstream
// retrieval stage (Stage 1 table search, Stage 2 pattern search) instead of raw question text.
// 도메인 용어집을 함께 얹는 이유: RAG 경로는 원래 이 용어집을 Stage 6(패턴 확정 후, SQL
// 생성 직전)에서만 검색해 썼는데, 그러면 "딜러사" 같은 업계 용어를 Stage 0가 아무 사전지식
// 없이 잘못 구조화한 뒤라 이미 늦다 — 여기서 잘못되면 Stage 1/2 임베딩 검색까지 같이
// 오염된다. TOPIC 경로(schemaLoader.renderGlossaryForPrompt)가 이미 항목이 적어서
// (17개) 검색 없이 전체를 통째로 프롬프트에 얹는 방식을 쓰고 있어 그대로 재사용한다 —
// 별도 임베딩 호출이나 top-k/임계치가 필요 없다.
export async function structureQuestion(client, deployment, query) {
  const [call] = await streamAssistantTurn(client, {
    model: deployment,
    messages: [
      { role: 'system', content: `사용자 질문을 구조화하세요. 확신 없는 필드는 빈 배열/빈 문자열로 두세요. entities는 질문에 실제로 언급된 값만 넣으세요 — 추측 금지.\n\n도메인 용어집(업계 용어/약어 해석에 참고):\n${renderGlossaryForPrompt()}` },
      { role: 'user', content: query },
    ],
    tools: buildStructureTool(),
    toolChoice: { type: 'function', function: { name: 'structure_question' } },
    temperature: 0,
  })
  return call?.args || { intent: [], metrics: [], dimensions: [], time_range: '', filters: [], operations: [], estimated_complexity: 'simple', entities: {} }
}

// Query vector text for Stage 1/2 — denser than the raw question, weighted toward the
// signal that actually distinguishes patterns/tables (metrics/dimensions/operations).
export function renderStructuredForEmbedding(structured, fallbackQuery) {
  const parts = [
    structured.metrics?.length ? `측정값: ${structured.metrics.join(', ')}` : '',
    structured.dimensions?.length ? `차원: ${structured.dimensions.join(', ')}` : '',
    structured.intent?.length ? `의도: ${structured.intent.join(', ')}` : '',
    structured.operations?.length ? `연산: ${structured.operations.join(', ')}` : '',
    structured.filters?.length ? `필터: ${structured.filters.join(', ')}` : '',
  ].filter(Boolean)
  return parts.length ? parts.join('\n') : fallbackQuery
}

function pad2(n) { return String(n).padStart(2, '0') }
function toISODate(d) { return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}` }

// Stage 0.5 — DETERMINISTIC (no LLM) date/entity resolution, computed exactly once per
// pipeline run and handed identically to every Stage 7 call. This is the fix for the
// cross-fragment inconsistency bug found during verification: independent, parallel Stage 7
// calls each guessing "이번달" on their own (one landing on GETDATE()-relative math, one on
// a stale hardcoded literal copied from the reference template, one inventing a wrong year)
// produced multi-CTE SQL where different CTEs silently disagreed on the month — syntactically
// valid, semantically broken, and invisible to Stage 9's lint/live-execution checks. Doing the
// date math once in JS and injecting the literal values removes the ambiguity entirely.
const YEAR_MONTH_RE = /(\d{4})\s*년\s*(\d{1,2})\s*월/

export function resolveParameters(structured, query, now = new Date()) {
  const text = `${structured.time_range || ''} ${query || ''}`
  const explicit = text.match(YEAR_MONTH_RE)
  const year = explicit ? Number(explicit[1]) : now.getFullYear()
  const month = explicit ? Number(explicit[2]) : now.getMonth() + 1 // 1-12

  const monthStart = new Date(year, month - 1, 1)
  const monthEnd = new Date(year, month, 0) // day 0 of next month = last day of this month

  const entities = structured.entities || {}
  return {
    today: toISODate(now),
    yearMonth: `${year}-${pad2(month)}`,
    year, month,
    monthStart: toISODate(monthStart),
    monthEnd: toISODate(monthEnd),
    dealer: entities.dealer || null,
    brand: entities.brand || null,
    group_name: entities.group_name || null,
    dept_nm: entities.dept_nm || null,
    active_yn: entities.active_yn || '재직', // GOLD 쿼리들의 기본값(사용자가 퇴사자 포함을 명시하지 않는 한)
    potential: entities.potential || null,
    close_yn: entities.close_yn || null,
  }
}

// 딜러/브랜드/그룹/부서처럼 사용자가 명시해야만 값이 채워지는 엔티티들 — 미지정이면
// null로 남는다. renderResolvedParams()가 "값이 없다"를 침묵(줄 생략)이 아니라 명시적으로
// 알려줘야, Stage 7이 템플릿에 박힌 예제 리터럴(예: sql_template 저작 시 썼던 특정
// 딜러명)을 "미지정이니 조건째로 지워야 하는 것"과 "확정된 값으로 교체해야 하는 것"을
// 헷갈리지 않는다.
// key -> [세팅됐을 때 쓸 라벨(기존 문구 그대로), 미지정 목록에 쓸 짧은 이름]
const OPTIONAL_ENTITY_FIELDS = [
  ['dealer', '딜러명', '딜러'],
  ['brand', '브랜드', '브랜드'],
  ['group_name', '그룹', '그룹'],
  ['dept_nm', '부서', '부서'],
  ['potential', '관심도', '관심도'],
  ['close_yn', '관리탭', '관리탭'],
]

export function renderResolvedParams(resolvedParams) {
  const lines = [
    `오늘 날짜: ${resolvedParams.today}`,
    `"이번달"/기간 미지정 시 사용할 연월: ${resolvedParams.yearMonth} (월초 ${resolvedParams.monthStart}, 월말 ${resolvedParams.monthEnd})`,
    `재직 여부 기본값: '${resolvedParams.active_yn}'`,
  ]

  const unset = []
  for (const [key, setLabel, unsetLabel] of OPTIONAL_ENTITY_FIELDS) {
    if (resolvedParams[key]) lines.push(`${setLabel}: '${resolvedParams[key]}'`)
    else unset.push(unsetLabel)
  }
  if (unset.length) {
    lines.push(`미지정(사용자가 언급 안 함) — 템플릿에 이 종류의 WHERE 조건이 있다면 리터럴을 유지하지 말고 그 조건 자체를 삭제할 것: ${unset.join(', ')}`)
  }

  return lines.join('\n')
}
