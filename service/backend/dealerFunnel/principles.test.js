// 판단 원칙이 두 소비처에 같이 실리는지:
//   node --test backend/dealerFunnel/principles.test.js
//
// 원칙이 한쪽에만 있으면 같은 데이터를 놓고 화면의 AI 해석과 문서 안 문구가
// 다른 기준으로 쓰인다. 읽는 사람은 둘 중 뭘 믿어야 할지 모른다.
import { test, describe } from 'node:test'
import assert from 'node:assert/strict'

import { INTERPRETATION_PRINCIPLES, PRINCIPLES_BLOCK } from './principles.js'
import { SYSTEM_PROMPT } from './narrate.js'
import { buildDataBlock, EDIT_SYSTEM_PROMPT } from './htmlEdit.js'

const KEYS = [
  ['1', '전환율과 절대치'],
  ['2', '비교 기준 시점'],
  ['3', '세부모델/트림'],
  ['4', '가설은 데이터로 검증'],
  ['5', '부분월'],
  ['6', 'small_sample'],
  ['7', '관심모델없음'],
  ['7-1', 'over_100'],
  ['7-2', '채널 귀속 실패'],
  ['8', '지어내지 않는다'],
]

describe('원칙 본문', () => {
  test('정의서 4장 원칙 8가지 + 실측으로 덧붙인 7-1·7-2가 다 있다', () => {
    for (const [no, keyword] of KEYS) {
      assert.match(INTERPRETATION_PRINCIPLES, new RegExp(keyword), `원칙 ${no} 누락`)
    }
  })
})

describe('이상현상 해석(narrate)', () => {
  test('원칙을 그대로 싣는다', () => {
    assert.ok(SYSTEM_PROMPT.includes(INTERPRETATION_PRINCIPLES), '원칙 본문이 통째로 들어가야 한다')
  })

  test('역할과 출력 형식은 원칙과 별개로 남아 있다', () => {
    assert.match(SYSTEM_PROMPT, /분석가입니다/)
    assert.match(SYSTEM_PROMPT, /출력 형식:/)
    assert.match(SYSTEM_PROMPT, /마크다운을 쓰지 마세요/)
  })
})

describe('HTML 편집(htmlEdit)', () => {
  const block = buildDataBlock({
    metrics: [{ id: '계약', definition: 'Gross 기준', source: 'T', dateBasis: 'd', channelBasis: 'c', available: true }],
    series: { 계약: { total: 10, month: { '2026-07': 10 } } },
  })

  test('데이터 블록에 원칙을 함께 싣는다', () => {
    assert.ok(block.includes(INTERPRETATION_PRINCIPLES), '원칙 본문이 통째로 들어가야 한다')
    assert.match(block, /요구사항정의서 4장/)
  })

  test('적용 범위를 못박는다 — 레이아웃 바꾸는 일에까지 걸면 요청이 축소된다', () => {
    assert.match(PRINCIPLES_BLOCK, /새로 쓰는 문구/)
    assert.match(PRINCIPLES_BLOCK, /레이아웃·색·차트 종류를 바꾸는 일에는 해당하지 않습니다/)
  })

  test('시스템 프롬프트가 그 블록을 따르라고 지시한다 — 데이터로만 두면 읽고 지나친다', () => {
    assert.match(EDIT_SYSTEM_PROMPT, /문구를 쓸 때 지킬 판단 원칙/)
  })

  test('원칙은 지표 정의보다 앞에 온다 — 무엇을 쓸지보다 어떻게 쓸지가 먼저다', () => {
    assert.ok(block.indexOf('요구사항정의서 4장') < block.indexOf('[쓸 수 있는 데이터]'))
  })

  test('데이터가 없으면 원칙도 안 보낸다 — 빈 블록만 보내는 건 의미가 없다', () => {
    assert.equal(buildDataBlock(null), null)
  })
})
