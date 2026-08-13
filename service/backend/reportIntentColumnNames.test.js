// 질문에 이름이 그대로 적힌 열을 빠뜨리지 않는지:
//   node --test backend/reportIntentColumnNames.test.js
import assert from 'node:assert/strict'
import { test, describe } from 'node:test'

import { resolveReportRequest, SC_DISPLAY } from './agentic-bi/reportIntent.js'

const FIVE_METRICS = '2026년 4월 렉서스 부산 전시장 영업6팀의 고객수, HOT영업기회, 전체영업기회, 기회창출영업기회_3개월평균, NPS 값 보여줘'

describe('질문에 적힌 열 이름', () => {
  test('별칭이 없는 열도 이름이 적혀 있으면 빠뜨리지 않는다', () => {
    // 2026-08-11 실측(평가 No.34): 다섯 열을 물었는데 넷만 나왔다.
    // '기회창출영업기회_3개월평균'은 별칭 항목이 없어 안 잡혔고, 나머지 넷이 잡히는
    // 바람에 LLM이 고른 목록이 통째로 교체되며 조용히 탈락했다.
    const resolved = resolveReportRequest({
      report_id: 'sc_card_monthly',
      sc_display: SC_DISPLAY.TEAM_LEVEL,
      year: 2026,
      month: 4,
      selected_columns: ['고객수', 'HOT영업기회', '전체영업기회', '기회창출영업기회_3개월평균', 'NPS'],
    }, FIVE_METRICS)

    for (const col of ['고객수', 'HOT영업기회', '전체영업기회', '기회창출영업기회_3개월평균', 'NPS']) {
      assert.ok(resolved.selectedColumns.includes(col), `물어본 열이 빠졌습니다: ${col}`)
    }
  })

  test('밑줄을 띄어쓰기로 적어도 같은 열로 본다', () => {
    const resolved = resolveReportRequest({
      report_id: 'sc_card_monthly', sc_display: SC_DISPLAY.TEAM_LEVEL, year: 2026, month: 4, selected_columns: [],
    }, '2026년 4월 기회창출영업기회 3개월평균 보여줘')
    assert.ok(resolved.selectedColumns.includes('기회창출영업기회_3개월평균'))
  })

  test('별칭이 선언된 열은 맨 이름으로 딸려오지 않는다', () => {
    // '계약'은 별칭을 '계약 건수'·'계약 실적'으로만 두고 맨 이름을 일부러 뺐다.
    // 계약 얘기가 나오는 질문마다 그 열이 붙으면 묻지 않은 지표가 답에 섞인다.
    const resolved = resolveReportRequest({
      report_id: 'sc_card_monthly', sc_display: SC_DISPLAY.TEAM_LEVEL, year: 2026, month: 4, selected_columns: [],
    }, '2026년 4월 계약 관련해서 고객수 알려줘')
    assert.ok(resolved.selectedColumns.includes('고객수'))
    assert.ok(!resolved.selectedColumns.includes('계약'), '맨 이름으로 계약 열이 딸려왔습니다')
  })

  test('별칭이 없는 계약에서 이름 하나가 걸려도 LLM이 고른 열을 버리지 않는다', () => {
    // funnel_full_structure는 column_aliases가 없다. 이름 매칭을 교체 기준으로 쓰면
    // 질문이 열 하나를 이름으로 부르는 순간 나머지가 통째로 날아간다 — No.34와 같은 사고다.
    const resolved = resolveReportRequest({
      report_id: 'funnel_full_structure',
      sc_display: SC_DISPLAY.TEAM_LEVEL,
      base_year: 2026,
      base_month: 4,
      selected_columns: ['영업활동 건 수', '영업활동 당월 목표', '영업활동 진행률'],
    }, '2026년 4월 영업활동 진행률 포함해서 실적과 목표 보여줘')

    for (const col of ['영업활동 건 수', '영업활동 당월 목표', '영업활동 진행률']) {
      assert.ok(resolved.selectedColumns.includes(col), `LLM이 고른 열이 날아갔습니다: ${col}`)
    }
  })

  test('질문에 열 이름이 하나도 없으면 LLM이 고른 목록을 쓴다', () => {
    const resolved = resolveReportRequest({
      report_id: 'sc_card_monthly', sc_display: SC_DISPLAY.TEAM_LEVEL, year: 2026, month: 4, selected_columns: ['NPS'],
    }, '2026년 4월 상황 알려줘')
    assert.deepEqual(resolved.selectedColumns, ['NPS'])
  })
})
