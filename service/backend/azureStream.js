import { recordTokenUsage } from './tokenUsageLogger.js'

// Shared streaming + tool-call-accumulation loop, used by both the free-form
// /api/chat handler and the dashboard-customize pipeline's planner/critic calls.
export async function streamAssistantTurn(client, { model, messages, tools, toolChoice = 'auto', temperature, onText, agentType }) {
  const startedAt = Date.now()
  let usage = null

  // 툴이 없으면 tools·tool_choice를 아예 보내지 않는다. 빈 채로 보내면 Azure가
  // 400 "tool_choice is only allowed when tools are specified"로 거절한다 —
  // 툴 없이 글만 받으려는 호출부(정의서 규칙 기반 SQL 생성)가 여기서 막혔다.
  const hasTools = Array.isArray(tools) && tools.length > 0
  const createStream = (includeUsage) => client.chat.completions.create({
    model,
    max_tokens: 4096,
    stream: true,
    messages,
    ...(hasTools ? { tools, tool_choice: toolChoice } : {}),
    ...(temperature !== undefined ? { temperature } : {}),
    ...(includeUsage ? { stream_options: { include_usage: true } } : {}),
  })

  let stream
  try {
    stream = await createStream(true)
  } catch (err) {
    if (!/stream_options|include_usage/i.test(err.message || '')) throw err
    console.warn('[azure-stream] usage chunks unsupported; retrying without stream_options')
    stream = await createStream(false)
  }

  const toolCallBuffers = {}
  try {
    for await (const chunk of stream) {
      if (chunk.usage) usage = chunk.usage
      const delta = chunk.choices?.[0]?.delta
      if (!delta) continue
      if (delta.content && onText) onText(delta.content)
      if (delta.tool_calls) {
        for (const tc of delta.tool_calls) {
          const idx = tc.index
          if (!toolCallBuffers[idx]) toolCallBuffers[idx] = { name: '', arguments: '' }
          if (tc.function?.name) toolCallBuffers[idx].name += tc.function.name
          if (tc.function?.arguments) toolCallBuffers[idx].arguments += tc.function.arguments
        }
      }
    }

    await recordTokenUsage({
      usage: usage || {},
      agentType,
      latencyMs: Date.now() - startedAt,
      succeeded: true,
    })

    // 이름 없는 툴 콜은 버린다. 어차피 실행할 수 없는데, 남기면 호출부가 "인자 파싱 실패"로
    // 경고를 찍어서 진짜 파싱 실패와 구분이 안 된다.
    //
    // 2026-08-11: gpt-5.6-luna에서 실제로 나왔다. 이 모델은 temperature를 고정(1)만
    // 지원해서 chatHandler가 의도한 temperature 0이 안 걸리고, 실행마다 결과가 달라지는데
    // 그중 한 판에서 이름 없는 델타가 섞였다(같은 요청 재시도에서는 재현되지 않음).
    return Object.values(toolCallBuffers)
      .filter(tc => {
        if (tc.name.trim()) return true
        console.warn(`[azure-stream] 이름 없는 툴 콜을 버립니다 (args ${tc.arguments.length}자)`)
        return false
      })
      .map(tc => {
        try {
          return { name: tc.name, args: JSON.parse(tc.arguments) }
        } catch {
          return { name: tc.name, args: null }
        }
      })
  } catch (err) {
    await recordTokenUsage({
      usage: usage || {},
      agentType,
      latencyMs: Date.now() - startedAt,
      succeeded: false,
      errorMessage: err.message,
    })
    throw err
  }
}
