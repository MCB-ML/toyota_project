// Shared streaming + tool-call-accumulation loop, used by both the free-form
// /api/chat handler and the dashboard-customize pipeline's planner/critic calls.
export async function streamAssistantTurn(client, { model, messages, tools, toolChoice = 'auto', onText }) {
  const stream = await client.chat.completions.create({
    model,
    max_tokens: 4096,
    stream: true,
    messages,
    tools,
    tool_choice: toolChoice,
  })

  const toolCallBuffers = {}
  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta
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

  return Object.values(toolCallBuffers).map(tc => {
    try {
      return { name: tc.name, args: JSON.parse(tc.arguments) }
    } catch {
      return { name: tc.name, args: null }
    }
  })
}
