// chat.completions ↔ Responses API 형식 변환. 순수 함수만 둔다 — 네트워크 없이 검증하려고.
//
// 여기서 틀리면 증상이 "모델이 이상한 답을 한다"로 나타난다. 툴 호출 하나가 조용히 빠져도
// 화면은 그냥 답을 못 찾은 것처럼 보인다. 그래서 변환은 전부 테스트로 못 박는다.

/**
 * chat 툴 스키마 → Responses 툴 스키마.
 * chat은 {type:'function', function:{name, description, parameters}}로 한 겹 감싸고,
 * Responses는 그걸 편다.
 */
export function toolsToResponses(tools) {
  return (tools || []).map((t) => {
    const fn = t.function ?? t
    return {
      type: 'function',
      name: fn.name,
      description: fn.description,
      parameters: fn.parameters,
    }
  })
}

const textOf = (content) => {
  if (typeof content === 'string') return content
  if (Array.isArray(content)) return content.map((p) => p?.text ?? '').join('')
  return String(content ?? '')
}

/**
 * chat messages → Responses input.
 *
 * assistant의 tool_calls와 role:'tool' 결과까지 옮긴다. 이게 빠지면 여러 턴짜리
 * 툴 대화에서 모델이 자기가 방금 뭘 불렀는지 모르고 같은 툴을 되풀이해 부른다.
 */
export function messagesToInput(messages) {
  const input = []
  for (const m of messages || []) {
    if (m.role === 'tool') {
      input.push({ type: 'function_call_output', call_id: m.tool_call_id, output: textOf(m.content) })
      continue
    }
    if (m.role === 'assistant' && m.tool_calls?.length) {
      if (m.content) input.push({ role: 'assistant', content: textOf(m.content) })
      for (const tc of m.tool_calls) {
        input.push({
          type: 'function_call',
          call_id: tc.id,
          name: tc.function?.name,
          arguments: tc.function?.arguments ?? '{}',
        })
      }
      continue
    }
    // system도 그대로 넘긴다 — Responses는 role:'system'을 받는다.
    input.push({ role: m.role, content: textOf(m.content) })
  }
  return input
}

/** Responses output[] → chat message. 텍스트는 이어 붙이고 툴 호출은 tool_calls로 모은다. */
export function outputToMessage(output) {
  let content = ''
  const toolCalls = []
  for (const item of output || []) {
    if (item.type === 'message') {
      for (const part of item.content || []) {
        if (part.type === 'output_text') content += part.text ?? ''
      }
      continue
    }
    if (item.type === 'function_call') {
      toolCalls.push({
        id: item.call_id ?? item.id,
        type: 'function',
        function: { name: item.name, arguments: item.arguments ?? '{}' },
      })
    }
    // reasoning 등 나머지 항목은 버린다 — chat 쪽에 대응하는 자리가 없다.
  }
  return {
    role: 'assistant',
    content: content || null,
    ...(toolCalls.length ? { tool_calls: toolCalls } : {}),
  }
}

/**
 * Responses usage → chat usage.
 * 이름이 다를 뿐 같은 값이다. 토큰 사용량 기록(tokenUsageLogger)이 chat 이름만 알기 때문에
 * 여기서 맞춰 두지 않으면 Claude로 쓴 토큰이 전부 0으로 남는다.
 */
export function usageToChat(usage) {
  if (!usage) return undefined
  const prompt = usage.input_tokens ?? usage.prompt_tokens ?? 0
  const completion = usage.output_tokens ?? usage.completion_tokens ?? 0
  const cached = usage.input_tokens_details?.cached_tokens ?? usage.prompt_tokens_details?.cached_tokens
  return {
    prompt_tokens: prompt,
    completion_tokens: completion,
    total_tokens: usage.total_tokens ?? prompt + completion,
    ...(cached !== undefined ? { prompt_tokens_details: { cached_tokens: cached } } : {}),
  }
}
