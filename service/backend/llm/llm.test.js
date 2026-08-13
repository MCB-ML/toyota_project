// 모델 레지스트리 · 파라미터 정책 · Responses 변환:
//   node --test backend/llm/llm.test.js
//
// 변환이 틀리면 증상이 "모델이 이상한 답을 한다"로 나타난다 — 툴 호출 하나가 조용히
// 빠져도 화면은 그냥 답을 못 찾은 것처럼 보인다. 그래서 전부 못 박아 둔다.
import { test, describe, afterEach, beforeEach } from 'node:test'
import assert from 'node:assert/strict'

import { DEFAULT_MODEL_ID, MODELS, listModels, pickModelId, resolveModel } from './models.js'
import { applyParamPolicy } from './params.js'
import { messagesToInput, outputToMessage, toolsToResponses, usageToChat } from './responsesTranslate.js'
import { eventsToChatChunks } from './responsesShim.js'

// 실제 .env가 있든 없든 같은 결과가 나와야 한다 — 개발자 기계에만 있는 키에 기대면
// CI에서 다른 이유로 깨지고, 그때 원인을 찾느라 시간을 쓴다. 매 테스트 전에 직접 채운다.
const ENV = ['AZURE_OPENAI_KEY', 'AZURE_OPENAI_ENDPOINT', 'LLM_LUNA_KEY', 'LLM_LUNA_ENDPOINT', 'LLM_CLAUDE_KEY', 'LLM_CLAUDE_ENDPOINT', 'LLM_CLAUDE_DEPLOYMENT']
const saved = Object.fromEntries(ENV.map((k) => [k, process.env[k]]))
const FAKE_KEY = 'test-key-절대-노출되면-안-되는-값'

beforeEach(() => {
  for (const k of ENV) process.env[k] = k.endsWith('_KEY') ? FAKE_KEY : `https://example.invalid/${k}`
  delete process.env.LLM_CLAUDE_DEPLOYMENT
})
afterEach(() => { for (const k of ENV) { if (saved[k] === undefined) delete process.env[k]; else process.env[k] = saved[k] } })

describe('모델 레지스트리', () => {
  test('요청한 세 모델이 등록돼 있다', () => {
    assert.deepEqual(MODELS.map((m) => m.id), ['gpt-4.1', 'gpt-5.6-luna', 'claude-sonnet-5'])
  })

  test('기본은 gpt-4.1 — 모델을 안 고르면 이걸로 돈다', () => {
    // 2026-08-11 luna로 옮겼다가 같은 코드로 나란히 재고 되돌렸다(평가 52건에서
    // 확인 필요 2건 대 7건). 기본이 무엇인지는 화면에서 안 보이므로 여기서 못 박아 둔다 —
    // 조용히 바뀌면 어느 모델이 답했는지 모른 채 결과만 달라진다.
    // 근거: docs/모델비교-luna-vs-gpt41.md
    assert.equal(DEFAULT_MODEL_ID, 'gpt-4.1')
    assert.equal(pickModelId(''), 'gpt-4.1')
    assert.equal(pickModelId(undefined), 'gpt-4.1')
  })

  test('모르는 모델을 요청하면 기본으로 되돌린다 — 오타 하나로 요청이 실패하지 않게', () => {
    assert.equal(pickModelId('gpt-9'), 'gpt-4.1')
  })

  test('키가 없는 모델은 고를 수 없다 — 요청해도 기본으로 되돌린다', () => {
    delete process.env.LLM_CLAUDE_KEY
    assert.equal(resolveModel('claude-sonnet-5').available, false)
    assert.equal(pickModelId('claude-sonnet-5'), 'gpt-4.1')
  })

  test('기본 모델의 키가 없어도 다른 모델로 몰래 대체하지 않는다', () => {
    // 기본이 못 쓰는 상태인데 조용히 다른 모델로 돌면, 사용자는 어느 모델이 답했는지
    // 모른 채 결과만 달라진다. pickModelId는 기본 id를 그대로 돌려주고
    // createLlmClient가 null을 내 화면에 오류로 알린다.
    delete process.env.AZURE_OPENAI_KEY
    assert.equal(resolveModel('gpt-4.1').available, false)
    assert.equal(pickModelId(''), 'gpt-4.1', '다른 모델로 바꿔치기하면 안 된다')
  })

  test('목록에 키를 절대 담지 않는다 — 빠진 환경변수 이름만 알린다', () => {
    delete process.env.LLM_CLAUDE_KEY
    const claude = listModels().find((m) => m.id === 'claude-sonnet-5')
    assert.equal(claude.available, false)
    assert.deepEqual(claude.missing, ['LLM_CLAUDE_KEY'])
    assert.ok(!JSON.stringify(listModels()).includes(FAKE_KEY), '키가 목록 응답에 섞여 있다')
    for (const m of listModels()) assert.ok(!('key' in m), `${m.id}에 키가 새어 나간다`)
  })

  test('deployment를 안 주면 모델 id를 쓴다', () => {
    assert.equal(resolveModel('claude-sonnet-5').deployment, 'claude-sonnet-5')
  })
})

describe('모델별 파라미터 정책', () => {
  const luna = MODELS.find((m) => m.id === 'gpt-5.6-luna')
  const gpt = MODELS.find((m) => m.id === 'gpt-4.1')
  const claude = MODELS.find((m) => m.id === 'claude-sonnet-5')

  test('gpt-4.1은 지금까지처럼 그대로 보낸다', () => {
    const out = applyParamPolicy(gpt, { temperature: 0.2, max_tokens: 4096, messages: [] })
    assert.equal(out.temperature, 0.2)
    assert.equal(out.max_tokens, 4096)
  })

  test('Luna는 temperature를 버리고 max_completion_tokens로 바꾼다', () => {
    // 실측: temperature 0.2 → 400(기본값 1만 허용), max_tokens → 400.
    const out = applyParamPolicy(luna, { temperature: 0.2, max_tokens: 4096 })
    assert.ok(!('temperature' in out))
    assert.ok(!('max_tokens' in out))
    assert.equal(out.max_completion_tokens, 4096)
  })

  test('Claude는 temperature만 버린다 — max_tokens는 어댑터가 바꾼다', () => {
    const out = applyParamPolicy(claude, { temperature: 0.3, max_tokens: 1024 })
    assert.ok(!('temperature' in out))
    assert.equal(out.max_tokens, 1024)
  })

  test('원본 객체를 건드리지 않는다 — 호출부가 같은 params를 재사용할 수 있다', () => {
    const params = { temperature: 0.2, max_tokens: 10 }
    applyParamPolicy(luna, params)
    assert.equal(params.temperature, 0.2)
    assert.equal(params.max_tokens, 10)
  })
})

describe('Responses 변환 — 요청', () => {
  test('chat 툴 스키마의 function 래퍼를 편다', () => {
    const [t] = toolsToResponses([{
      type: 'function',
      function: { name: 'get_sales', description: '조회', parameters: { type: 'object', properties: {} } },
    }])
    assert.equal(t.type, 'function')
    assert.equal(t.name, 'get_sales')
    assert.equal(t.description, '조회')
    assert.deepEqual(t.parameters, { type: 'object', properties: {} })
    assert.ok(!('function' in t))
  })

  test('system·user·assistant를 그대로 옮긴다', () => {
    const input = messagesToInput([
      { role: 'system', content: '규칙' },
      { role: 'user', content: '질문' },
      { role: 'assistant', content: '답' },
    ])
    assert.deepEqual(input, [
      { role: 'system', content: '규칙' },
      { role: 'user', content: '질문' },
      { role: 'assistant', content: '답' },
    ])
  })

  test('툴 호출과 그 결과까지 옮긴다', () => {
    // 이게 빠지면 여러 턴짜리 툴 대화에서 모델이 같은 툴을 되풀이해 부른다.
    const input = messagesToInput([
      { role: 'user', content: '매출?' },
      { role: 'assistant', content: null, tool_calls: [{ id: 'call_1', function: { name: 'get_sales', arguments: '{"month":"2026-07"}' } }] },
      { role: 'tool', tool_call_id: 'call_1', content: '{"total":100}' },
    ])
    assert.deepEqual(input[1], { type: 'function_call', call_id: 'call_1', name: 'get_sales', arguments: '{"month":"2026-07"}' })
    assert.deepEqual(input[2], { type: 'function_call_output', call_id: 'call_1', output: '{"total":100}' })
  })

  test('배열 content도 문자열로 편다', () => {
    const input = messagesToInput([{ role: 'user', content: [{ type: 'text', text: '가' }, { type: 'text', text: '나' }] }])
    assert.equal(input[0].content, '가나')
  })
})

describe('Responses 변환 — 응답', () => {
  test('텍스트 조각을 이어 붙인다', () => {
    const m = outputToMessage([{ type: 'message', content: [{ type: 'output_text', text: '가' }, { type: 'output_text', text: '나' }] }])
    assert.equal(m.content, '가나')
    assert.ok(!('tool_calls' in m))
  })

  test('function_call을 chat tool_calls 모양으로 바꾼다', () => {
    const m = outputToMessage([
      { type: 'reasoning', summary: [] },
      { type: 'function_call', call_id: 'call_9', name: 'get_sales', arguments: '{"month":"2026-07"}' },
    ])
    assert.equal(m.content, null)
    assert.equal(m.tool_calls.length, 1)
    assert.deepEqual(m.tool_calls[0], {
      id: 'call_9', type: 'function', function: { name: 'get_sales', arguments: '{"month":"2026-07"}' },
    })
  })

  test('빈 출력에도 터지지 않는다', () => {
    assert.equal(outputToMessage(undefined).content, null)
  })

  test('usage 이름을 chat 쪽으로 맞춘다 — 안 맞추면 Claude 토큰이 전부 0으로 기록된다', () => {
    const u = usageToChat({ input_tokens: 100, output_tokens: 20, total_tokens: 120, input_tokens_details: { cached_tokens: 40 } })
    assert.equal(u.prompt_tokens, 100)
    assert.equal(u.completion_tokens, 20)
    assert.equal(u.total_tokens, 120)
    assert.equal(u.prompt_tokens_details.cached_tokens, 40)
  })

  test('usage가 없으면 undefined — 0으로 채우면 안 쓴 것과 구분이 안 된다', () => {
    assert.equal(usageToChat(null), undefined)
  })
})

describe('Responses 스트림 → chat 청크', () => {
  const collect = async (events) => {
    const out = []
    for await (const c of eventsToChatChunks((async function* () { for (const e of events) yield e })())) out.push(c)
    return out
  }
  // azureStream.js가 하는 누적을 그대로 흉내 낸다 — 실제 소비 형태로 검증한다.
  const accumulate = (chunks) => {
    const buf = {}
    for (const c of chunks) {
      for (const tc of c.choices?.[0]?.delta?.tool_calls || []) {
        buf[tc.index] = buf[tc.index] || { name: '', arguments: '' }
        if (tc.function?.name) buf[tc.index].name += tc.function.name
        if (tc.function?.arguments) buf[tc.index].arguments += tc.function.arguments
      }
    }
    return Object.values(buf)
  }

  test('툴만 부르는 판 — 이름이 added에 실려 온다', async () => {
    const calls = accumulate(await collect([
      { type: 'response.output_item.added', output_index: 0, item: { type: 'function_call', id: 'fc_1', call_id: 'call_1', name: 'render_bar_chart', arguments: '' } },
      { type: 'response.function_call_arguments.delta', item_id: 'fc_1', output_index: 0, delta: '{"title"' },
      { type: 'response.function_call_arguments.delta', item_id: 'fc_1', output_index: 0, delta: ':"재고"}' },
      { type: 'response.output_item.done', output_index: 0, item: { type: 'function_call', id: 'fc_1', call_id: 'call_1', name: 'render_bar_chart', arguments: '{"title":"재고"}' } },
    ]))
    assert.deepEqual(calls, [{ name: 'render_bar_chart', arguments: '{"title":"재고"}' }])
  })

  test('텍스트를 먼저 내는 판 — 이름이 done에만 실려 온다', async () => {
    // 2026-08-11 실측. added는 type:"message"라 툴이 아니라고 나오고, 인자 델타는
    // 그 message id로 온다. done에서야 type이 function_call로 바뀌며 이름이 나온다.
    const chunks = await collect([
      { type: 'response.output_item.added', output_index: 0, item: { type: 'message', id: 'msg_1' } },
      { type: 'response.output_text.delta', delta: '재고 데이터를 ' },
      { type: 'response.function_call_arguments.delta', item_id: 'msg_1', output_index: 0, delta: '{"title":"재고"}' },
      { type: 'response.output_item.done', output_index: 0, item: { type: 'function_call', id: 'msg_1', call_id: 'call_9', name: 'render_bar_chart', arguments: '{"title":"재고"}' } },
    ])
    const text = chunks.map((c) => c.choices?.[0]?.delta?.content || '').join('')
    assert.equal(text, '재고 데이터를 ')
    assert.deepEqual(accumulate(chunks), [{ name: 'render_bar_chart', arguments: '{"title":"재고"}' }])
  })

  test('이름을 두 번 내보내지 않는다 — 호출부가 += 로 이어 붙인다', async () => {
    const calls = accumulate(await collect([
      { type: 'response.output_item.added', output_index: 0, item: { type: 'function_call', id: 'fc_1', name: 'get_sales', arguments: '' } },
      { type: 'response.function_call_arguments.delta', item_id: 'fc_1', delta: '{}' },
      { type: 'response.output_item.done', output_index: 0, item: { type: 'function_call', id: 'fc_1', name: 'get_sales', arguments: '{}' } },
    ]))
    assert.equal(calls[0].name, 'get_sales')      // get_salesget_sales 가 아니어야 한다
    assert.equal(calls[0].arguments, '{}')        // 인자도 두 번 붙지 않는다
  })

  test('툴 여러 개를 index로 나눠 담는다', async () => {
    const calls = accumulate(await collect([
      { type: 'response.output_item.added', output_index: 0, item: { type: 'function_call', id: 'fc_a', name: 'a', arguments: '' } },
      { type: 'response.function_call_arguments.delta', item_id: 'fc_a', delta: '{"x":1}' },
      { type: 'response.output_item.added', output_index: 1, item: { type: 'function_call', id: 'fc_b', name: 'b', arguments: '' } },
      { type: 'response.function_call_arguments.delta', item_id: 'fc_b', delta: '{"y":2}' },
    ]))
    assert.deepEqual(calls, [{ name: 'a', arguments: '{"x":1}' }, { name: 'b', arguments: '{"y":2}' }])
  })

  test('completed의 usage를 chat 이름으로 흘린다', async () => {
    const chunks = await collect([
      { type: 'response.completed', response: { usage: { input_tokens: 10, output_tokens: 3 } } },
    ])
    assert.equal(chunks.at(-1).usage.prompt_tokens, 10)
    assert.equal(chunks.at(-1).usage.completion_tokens, 3)
  })

  test('실패 이벤트는 오류로 올린다', async () => {
    await assert.rejects(
      () => collect([{ type: 'response.failed', response: { error: { message: '한도 초과' } } }]),
      /한도 초과/,
    )
  })
})
