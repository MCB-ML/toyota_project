import { streamAssistantTurn } from '../../azureStream.js'
import { buildPlanTool } from '../ragTools.js'

// Stage 3 — pick the single best-matching Pattern Card from Stage 2's candidates (a
// classification call, not free-form plan authoring — every candidate is a fully
// hand-verified, already-ordered fragment chain, so letting the LLM invent a novel step
// sequence would only add risk without benefit at this knowledge base's scale). The actual
// ordered step list is then derived mechanically from the chosen pattern's fragment_ids.
export async function choosePattern(client, deployment, query, structured, patternCards) {
  if (!patternCards.length) return { pattern: null, reason: 'Pattern Card 후보 없음' }

  const cardsText = patternCards
    .map(p => `- ${p.pattern_id}: ${p.name} — ${p.description} (의도: ${(p.intent || []).join(', ')}, 연산: ${(p.operations || []).join(', ')}, 지표: ${(p.metrics || []).join(', ')}, 차원: ${(p.dimensions || []).join(', ')})`)
    .join('\n')

  const [call] = await streamAssistantTurn(client, {
    model: deployment,
    messages: [
      {
        role: 'system',
        content: `아래 Pattern Card 후보 중 사용자 질문에 가장 적합한 것 하나를 고르세요. 구조화된 질문 정보도 참고하세요.

# Pattern Card 후보
${cardsText}

# 구조화된 질문
${JSON.stringify(structured)}

# 지침
- 구조화된 질문의 operations에 "group_by"가 있거나, 질문에 "~별로/~마다/나눠서"처럼 여러 대상으로 쪼개 보고 싶다는 표현이 있으면, 의도(intent)가 "breakdown"(또는 연산에 "group_by")인 카드를 우선 고르세요.
- 의도가 "count"/"ratio"인 스칼라(단일 값) 카드는, 질문이 특정 대상 하나로 좁혀서 값 하나만 구하는 경우에만 고르세요 — 이름이나 지표명이 질문과 표면적으로 비슷해 보인다는 이유만으로 스칼라 카드를 고르지 마세요.`,
      },
      { role: 'user', content: query },
    ],
    tools: buildPlanTool(patternCards),
    temperature: 0,
  })

  if (!call?.args || call.name === 'reject_plan') {
    return { pattern: null, reason: call?.args?.reason || 'Pattern Card 선택 실패' }
  }
  const pattern = patternCards.find(p => p.pattern_id === call.args.pattern_id) || null
  return { pattern, reasoning: call.args.reasoning || null }
}

// Deterministic: a pattern's fragment_ids is already a dependency-ordered chain (authored
// that way in knowledgeBase/queryPatterns.js) — the last id is always the terminal
// (final_select) step, everything before it becomes a named CTE.
export function derivePlanSteps(pattern, fragments) {
  const byId = new Map(fragments.map(f => [f.fragment_id, f]))
  return pattern.fragment_ids.map((fragmentId, i) => {
    const fragment = byId.get(fragmentId)
    const isTerminal = i === pattern.fragment_ids.length - 1
    return {
      step_id: fragmentId,
      cte_name: fragmentId.replace(/^frag_/, ''),
      purpose: fragment?.description || fragmentId,
      fragment_id: fragmentId,
      is_terminal: isTerminal,
      required_tables: fragment?.input_tables || [],
    }
  })
}
