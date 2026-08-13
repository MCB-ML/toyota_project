// Deterministic routing for HTML-style funnel object requests:
//   node --test server/agentic-bi/funnelRouting.test.js
import { test, describe } from 'node:test'
import assert from 'node:assert/strict'

import { detectCertifiedFunnelRequest } from '../agenticBiPipeline.js'
import { SC_DISPLAY } from './reportIntent.js'

describe('역삼각형 퍼널 객체 라우팅', () => {
  test('사용자가 말한 평시 퍼널 문장은 전용 퍼널 객체로 고정 라우팅된다', () => {
    const detected = detectCertifiedFunnelRequest(
      '2026년 계약 퍼널을 역삼각형 퍼널 구조 역삼각형처럼 만들어줘. 관계형성활동, SC활동, 내방/내전, 온라인유입 채널이 보이고 단계별 전환률이 보이게 해줘. 월 필터와 딜러 필터를 붙이고 SC는 팀 단위로 봐줘.',
    )

    assert.ok(detected)
    assert.equal(detected.argsList.length, 1)
    assert.equal(detected.argsList[0].report_id, 'funnel_full_structure')
    assert.equal(detected.argsList[0].report_view, 'funnel_pyramid_chart')
    assert.equal(detected.argsList[0].year, 2026)
    assert.equal(detected.argsList[0].month, null)
    assert.equal(detected.argsList[0].sc_display, SC_DISPLAY.TEAM_LEVEL)
  })

  test('표와 퍼널 객체를 같이 요청하면 두 객체를 같이 만든다', () => {
    const detected = detectCertifiedFunnelRequest(
      '2026년 계약 퍼널 평시 퍼널 객체랑 표로 보기도 같이 만들어줘. 월 필터와 딜러 필터를 붙이고 SC는 팀 단위로 봐줘.',
    )

    assert.deepEqual(detected?.argsList.map((args) => args.report_view), [
      'funnel_pyramid_chart',
      'funnel_pyramid_table',
    ])
  })
})
