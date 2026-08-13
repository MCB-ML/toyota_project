// Azure Responses API를 chat.completions 모양으로 감싼다.
//
// 이 코드베이스의 LLM 호출은 전부 `client.chat.completions.create(...)` 하나로 모여 있고,
// 스트리밍·툴 콜 누적은 azureStream.js가 그 청크 모양을 전제로 돌아간다. Claude를 쓰겠다고
// 그 계약을 바꾸면 대시보드·에이전틱BI·챗까지 전부 손봐야 하고, 모델을 하나 더 붙일 때마다
// 같은 일이 반복된다. 그래서 **모양을 맞추는 쪽을 어댑터로** 만든다 — 호출부는 어느 API를
// 타는지 몰라도 된다.
//
// 옮기는 것은 셋뿐이다:
//   요청   messages → input · tools(function 래핑) → tools(평면)
//   응답   output[] → choices[0].message(content, tool_calls)
//   스트림 response.* SSE 이벤트 → choices[0].delta 청크
//
// Anthropic 네이티브(/anthropic/v1/messages)도 열려 있지만 Responses를 골랐다. 이 경로는
// 위 세 가지만 옮기면 되는데, 네이티브는 system 분리·content 블록·thinking 블록까지
// 규칙이 더 갈려서 옮길 표면이 넓다.
import { toolsToResponses, messagesToInput, outputToMessage, usageToChat } from './responsesTranslate.js'

const SSE_DATA = /^data:\s*(.*)$/

/** SSE 본문을 이벤트 객체로 흘린다. */
async function* readSse(response) {
  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop()
    for (const line of lines) {
      const m = line.match(SSE_DATA)
      if (!m || m[1] === '[DONE]') continue
      try { yield JSON.parse(m[1]) } catch { /* 조각난 줄은 버린다 */ }
    }
  }
}

const toolCallChunk = (index, fields) => ({
  choices: [{ delta: { tool_calls: [{ index, ...fields }] } }],
})

/**
 * Responses 스트림 이벤트를 chat.completions 청크로 바꾼다.
 *
 * azureStream.js가 보는 건 delta.content와 delta.tool_calls[].function 뿐이다.
 * 툴 인자는 조각으로 오므로 index를 붙여 그대로 흘린다 — 누적은 그쪽이 한다.
 *
 * ── 이벤트 순서가 두 가지다 (2026-08-11 실측) ────────────────────────
 * 툴만 부르는 판:
 *   output_item.added {type:"function_call", name:"render_bar_chart"}  ← 이름이 여기
 *   function_call_arguments.delta …
 *   output_item.done  {type:"function_call", name:…, arguments:…}
 *
 * 텍스트를 먼저 내고 툴을 부르는 판:
 *   output_item.added {type:"message"}          ← 툴이 아니라고 나온다
 *   output_text.delta …
 *   function_call_arguments.delta  item_id=msg_…  ← 같은 id로 인자만 온다
 *   output_item.done  {type:"function_call", name:"render_bar_chart", …}
 *                                                ← **이름이 여기서 처음 나온다**
 *
 * 즉 added만 보면 두 번째 판에서 이름을 영영 못 받는다. 실제로 챗에서 Claude가
 * 위젯을 하나도 못 만들었다 — 이름 없는 툴 콜로 버려졌다.
 * 그래서 added·done 양쪽에서 이름을 받되, 이미 받았으면 다시 내보내지 않는다
 * (호출부가 name을 += 로 이어 붙여서 두 번 주면 "render_bar_chartrender_bar_chart"가 된다).
 * ────────────────────────────────────────────────────────────────
 */
export async function* eventsToChatChunks(events) {
  const slots = new Map()
  let nextIndex = 0
  // 어느 이벤트에서 먼저 보이든 같은 자리를 준다 — added가 없을 수도 있다.
  const slotFor = (key) => {
    const k = String(key)
    if (!slots.has(k)) slots.set(k, { index: nextIndex++, named: false, argsSeen: false })
    return slots.get(k)
  }

  for await (const event of events) {
    switch (event.type) {
      case 'response.output_text.delta':
        if (event.delta) yield { choices: [{ delta: { content: event.delta } }] }
        break

      case 'response.output_item.added':
      case 'response.output_item.done': {
        const item = event.item
        if (item?.type !== 'function_call') break
        const slot = slotFor(item.id ?? event.output_index)
        if (!slot.named && item.name) {
          slot.named = true
          yield toolCallChunk(slot.index, {
            id: item.call_id ?? item.id,
            type: 'function',
            function: { name: item.name, arguments: '' },
          })
        }
        // 인자 델타가 한 번도 안 왔으면 done에 실린 전문을 쓴다.
        if (!slot.argsSeen && item.arguments) {
          slot.argsSeen = true
          yield toolCallChunk(slot.index, { function: { arguments: item.arguments } })
        }
        break
      }

      case 'response.function_call_arguments.delta': {
        const slot = slotFor(event.item_id ?? event.output_index)
        slot.argsSeen = true
        yield toolCallChunk(slot.index, { function: { arguments: event.delta ?? '' } })
        break
      }

      case 'response.completed':
        // 마지막에 usage만 실린 청크를 하나 흘린다 — stream_options.include_usage와 같은 모양.
        if (event.response?.usage) yield { choices: [], usage: usageToChat(event.response.usage) }
        break

      case 'error':
      case 'response.failed':
        throw new Error(event.response?.error?.message || event.message || 'Responses 스트림이 실패했습니다.')

      default:
        break
    }
  }
}

const toChatChunks = (response) => eventsToChatChunks(readSse(response))

async function callResponses({ endpoint, key, body, signal }) {
  const res = await fetch(`${String(endpoint).replace(/\/$/, '')}/responses`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'api-key': key },
    body: JSON.stringify(body),
    signal,
  })
  if (!res.ok) {
    const text = await res.text()
    let message = `${res.status} ${res.statusText}`
    try { message = JSON.parse(text)?.error?.message || message } catch { /* 본문이 JSON이 아니면 상태만 */ }
    throw new Error(message)
  }
  return res
}

/**
 * chat.completions.create()와 같은 자리에 꽂히는 클라이언트를 만든다.
 *
 * @param {{endpoint: string, key: string, deployment: string}} config
 */
export function createResponsesClient({ endpoint, key, deployment }) {
  async function create(params) {
    const body = {
      model: params.model || deployment,
      input: messagesToInput(params.messages),
      ...(params.tools?.length ? { tools: toolsToResponses(params.tools) } : {}),
      // Responses는 max_tokens가 아니라 max_output_tokens다. 이름만 바꾼다.
      ...(params.max_tokens ? { max_output_tokens: params.max_tokens } : {}),
      ...(params.temperature !== undefined ? { temperature: params.temperature } : {}),
      ...(params.stream ? { stream: true } : {}),
    }

    const res = await callResponses({ endpoint, key, body, signal: params.signal })
    if (params.stream) return toChatChunks(res)

    const payload = await res.json()
    if (payload.status === 'failed') throw new Error(payload.error?.message || '모델 호출이 실패했습니다.')
    return {
      choices: [{
        message: outputToMessage(payload.output),
        // incomplete는 출력 상한에 걸린 것 — chat의 'length'와 같은 뜻이다.
        finish_reason: payload.status === 'incomplete' ? 'length' : 'stop',
        index: 0,
      }],
      usage: usageToChat(payload.usage),
      model: payload.model,
    }
  }

  return { chat: { completions: { create } } }
}
