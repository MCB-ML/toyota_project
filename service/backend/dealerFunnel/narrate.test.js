// AI 해석 — 정의서 4장. LLM을 부르지 않는 부분(프롬프트·페이로드)만 검증한다:
//   node --test backend/dealerFunnel/narrate.test.js
import { test, describe } from 'node:test'
import assert from 'node:assert/strict'

import { SYSTEM_PROMPT, buildUserPayload, narrateAnomalies } from './narrate.js'

describe('시스템 프롬프트 (정의서 4장 원칙)', () => {
  test('원칙 7가지가 모두 들어 있다', () => {
    // 원칙이 하나라도 빠지면 그 판단을 AI가 안 한다 — 문구가 바뀌어도 개념은 남아야 한다.
    for (const keyword of [
      '전환율과 절대치',       // 1
      '비교 기준 시점',        // 2
      '시점',                 // 3
      '가설',                 // 4
      '부분월',               // 5
      'small_sample',         // 6
      '관심모델없음',          // 7
    ]) {
      assert.match(SYSTEM_PROMPT, new RegExp(keyword), `원칙 누락: ${keyword}`)
    }
  })

  test('전환율 100% 초과는 코호트가 다르다고 못박는다', () => {
    // 시승→계약이 147%로 나오는 달이 있다(2026-08-11 실측). 각 단계를 자기 기준일로
    // 따로 센 값의 비라서인데, 안 알려주면 AI가 "전환율 급등"으로 쓴다.
    assert.match(SYSTEM_PROMPT, /over_100/)
    assert.match(SYSTEM_PROMPT, /순서대로 지난 비율이 아니다/)
  })

  test('채널 귀속 실패가 있으면 비중을 100% 기준으로 말하지 말라고 적는다', () => {
    // 계약의 19.5%는 채널 미상이다 — 채널별 합을 전체로 착각하면 비중이 다 틀어진다.
    assert.match(SYSTEM_PROMPT, /채널 귀속 실패/)
    assert.match(SYSTEM_PROMPT, /채널 미상/)
  })

  test('마크다운을 쓰지 말라고 적는다 — 그대로 글자로 나온다', () => {
    // Claude가 실제로 "## 해석"으로 시작하는 답을 냈다(2026-08-11). 이 문구는
    // white-space: pre-line 으로 그대로 표시되므로 기호가 화면에 그냥 보인다.
    assert.match(SYSTEM_PROMPT, /마크다운을 쓰지 마세요/)
  })

  test('숫자를 다시 계산하지 말라고 못박는다 (4-8 역할 분리)', () => {
    assert.match(SYSTEM_PROMPT, /숫자를 다시 계산하지 마세요/)
  })

  test('데이터에 없는 사실을 지어내지 말라고 적는다', () => {
    assert.match(SYSTEM_PROMPT, /지어내지/)
  })
})

describe('AI에 넘기는 페이로드', () => {
  const base = {
    period: { from: '2026-01-01', to: '2026-09-01' },
    brand: null,
    anomalies: [{ kind: 'month_over_month', metric: '활동', change_pct: -20 }],
    forecast: { 활동: { primary: 1000 } },
    funnelTotals: { 활동: 5000 },
  }

  test('탐지 임계치를 함께 넘긴다 — AI가 기준을 알아야 판단할 수 있다', () => {
    const p = JSON.parse(buildUserPayload(base))
    assert.equal(p.탐지기준.전월대비_증감률_임계치_퍼센트, 15)
    assert.equal(p.탐지기준.소표본_기준_건수, 10)
  })

  test('브랜드를 안 주면 전체로 적는다', () => {
    assert.equal(JSON.parse(buildUserPayload(base)).조회범위.브랜드, '전체')
    assert.equal(JSON.parse(buildUserPayload({ ...base, brand: 'LEXUS' })).조회범위.브랜드, 'LEXUS')
  })

  test('요약만 넘긴다 — 원문 로그 필드가 섞이면 안 된다 (4-8)', () => {
    const p = JSON.parse(buildUserPayload(base))
    // 활동 로그 수준 필드(활동번호·고객명 등)가 있으면 요약이 아니라 원문을 넘긴 것이다.
    const flat = JSON.stringify(p)
    for (const raw of ['활동번호', '고객명', 'act_pk', 'lead_key', 'cust']) {
      assert.ok(!flat.includes(raw), `원문 필드가 섞였습니다: ${raw}`)
    }
  })
})

describe('해석 호출', () => {
  test('이상현상이 없으면 LLM을 부르지 않고 그대로 알린다', async () => {
    const r = await narrateAnomalies({ period: {}, brand: null, anomalies: [] })
    assert.match(r.text, /임계치를 넘는 변화가 없습니다/)
  })
})
