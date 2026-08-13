// 스트리밍 + 툴 콜 누적:
//   node --test backend/azureStream.test.js
//
// 모델마다 델타를 흘리는 방식이 조금씩 다르다. 여기가 그 차이를 흡수하는 자리라서,
// 실제로 겪은 모양을 그대로 재현해 둔다.
import { test, describe } from 'node:test'
import assert from 'node:assert/strict'

import { streamAssistantTurn } from './azureStream.js'

/** 청크 배열을 그대로 흘리는 가짜 클라이언트. */
const fakeClient = (chunks) => ({
  chat: { completions: { create: async () => (async function* () { for (const c of chunks) yield c })() } },
})

const toolDelta = (index, fn, extra = {}) => ({ choices: [{ delta: { tool_calls: [{ index, function: fn, ...extra }] } }] })

describe('툴 콜 누적', () => {
  test('이름은 첫 델타, 인자는 조각으로 와서 이어 붙는다', async () => {
    const calls = await streamAssistantTurn(fakeClient([
      toolDelta(0, { name: 'get_sales', arguments: '' }, { id: 'call_1' }),
      toolDelta(0, { arguments: '{"month"' }),
      toolDelta(0, { arguments: ':"2026-07"}' }),
    ]), { model: 'm', messages: [], tools: [] })

    assert.deepEqual(calls, [{ name: 'get_sales', args: { month: '2026-07' } }])
  })

  test('여러 툴 콜을 index로 나눠 담는다', async () => {
    const calls = await streamAssistantTurn(fakeClient([
      toolDelta(0, { name: 'a', arguments: '{}' }),
      toolDelta(1, { name: 'b', arguments: '{"x":1}' }),
    ]), { model: 'm', messages: [], tools: [] })

    assert.deepEqual(calls.map((c) => c.name), ['a', 'b'])
    assert.deepEqual(calls[1].args, { x: 1 })
  })

  test('이름 없는 툴 콜은 버린다 — 실행할 수 없는데 남기면 파싱 실패로 오해된다', async () => {
    // gpt-5.6-luna에서 실제로 나온 모양(2026-08-11). 유효한 콜은 살아야 한다.
    const calls = await streamAssistantTurn(fakeClient([
      toolDelta(0, { name: 'render_kpi_cards', arguments: '{"cards":[]}' }),
      toolDelta(1, { arguments: '' }),
    ]), { model: 'm', messages: [], tools: [] })

    assert.equal(calls.length, 1)
    assert.equal(calls[0].name, 'render_kpi_cards')
  })

  test('인자가 깨지면 args=null로 남긴다 — 이름은 살려 호출부가 무엇이 실패했는지 알게', () => {
    return streamAssistantTurn(fakeClient([
      toolDelta(0, { name: 'get_sales', arguments: '{깨진 JSON' }),
    ]), { model: 'm', messages: [], tools: [] }).then((calls) => {
      assert.deepEqual(calls, [{ name: 'get_sales', args: null }])
    })
  })

  test('텍스트 델타는 onText로 흘린다', async () => {
    let text = ''
    await streamAssistantTurn(fakeClient([
      { choices: [{ delta: { content: '안녕' } }] },
      { choices: [{ delta: { content: '하세요' } }] },
    ]), { model: 'm', messages: [], tools: [], onText: (t) => { text += t } })

    assert.equal(text, '안녕하세요')
  })

  test('빈 델타와 usage 전용 청크에도 터지지 않는다', async () => {
    // Luna는 마지막에 빈 delta({})를, Responses 어댑터는 choices:[] + usage를 흘린다.
    const calls = await streamAssistantTurn(fakeClient([
      { choices: [{ delta: {} }] },
      { choices: [], usage: { prompt_tokens: 10, completion_tokens: 2 } },
    ]), { model: 'm', messages: [], tools: [] })

    assert.deepEqual(calls, [])
  })
})
