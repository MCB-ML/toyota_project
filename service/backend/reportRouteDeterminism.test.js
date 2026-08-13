// 경로·조건이 실행마다 갈리지 않는지:
//   node --test backend/reportRouteDeterminism.test.js
import assert from 'node:assert/strict'
import { test, describe } from 'node:test'

import { resolveReportRequest, SC_DISPLAY } from './agentic-bi/reportIntent.js'
import { ratioColumnForRateRequest, getReport, reportExtraParameters } from './reports/registry.js'

describe('질문에 적힌 단위값을 빠뜨리지 않는다 (No.47)', () => {
  test('"3회차"를 말했으면 회차 필터가 붙는다', () => {
    // 2026-08-11 실측: meet_round가 실행마다 붙었다 안 붙었다 했다.
    // 빠진 실행은 전체 회차 85행, 붙은 실행은 15행이다 — 오류가 안 나서 눈에 안 걸린다.
    const r = resolveReportRequest({
      report_id: 'hotboard_meeting', sc_display: SC_DISPLAY.TEAM_LEVEL, year: 2026, month: 4,
    }, '2026년 4월 3회차 미팅 진행한 이력은 총 몇건인지 확인해줘')
    assert.equal(r.needsClarification, false)
    assert.deepEqual(r.params.meet_round, ['3'])
  })

  test('사용자가 직접 말한 값을 덮지 않는다', () => {
    const r = resolveReportRequest({
      report_id: 'hotboard_meeting', sc_display: SC_DISPLAY.TEAM_LEVEL, year: 2026, month: 4,
      report_filters: [{ name: 'meet_round', values: ['5'] }],
    }, '2026년 4월 3회차 미팅')
    assert.deepEqual(r.params.meet_round, ['5'])
  })

  test('회차를 말하지 않았으면 채우지 않는다 — 전체 회차가 맞는 질문이다', () => {
    const r = resolveReportRequest({
      report_id: 'hotboard_meeting', sc_display: SC_DISPLAY.TEAM_LEVEL, year: 2026, month: 4,
    }, '2026년 4월 미팅 이력 보여줘')
    assert.equal(r.params.meet_round, undefined)
  })

  test('단위는 계약이 스스로 말한다 — 코드에 파라미터 이름을 박지 않았다', () => {
    // description이 그 말로 시작하는 것에서 단위를 읽는다. 리포트마다 이름이 다르므로
    // 이름을 박으면 다른 리포트에는 영영 안 걸린다.
    const p = reportExtraParameters(getReport('hotboard_meeting').contract).find((x) => x.name === 'meet_round')
    assert.match(p.description, /^회차/)
  })
})

describe('허용값이 선언된 필터를 빠뜨리지 않는다 (No.52)', () => {
  const Q = '2025년 12월의 sc 출고 현황을 보고 싶어. 평가 기준은 누적 취소율로, A 그룹에 대한 데이터를 보고 싶어. 렉서스 강남 딜러의 sc 별로 월평균 출고, 누적취소율, 연누적 출고, PMA IN, PMA OUT 보여줘'

  test('"누적 취소율"과 "A 그룹"이 필터로 붙는다', () => {
    // 2026-08-11 실측: 같은 리포트가 300행과 380행을 오갔다. 조건이 빠진 실행은
    // 전체 등급을 걸러진 결과인 양 내놓는다. GOLD 답안지도 이 두 값을 쓴다.
    const r = resolveReportRequest({
      report_id: 'sc_delivery_status', sc_display: SC_DISPLAY.ALL_SC, year: 2025, month: 12, dealer: ['렉서스 강남'],
    }, Q)
    assert.deepEqual(r.params.grp_category, ['누적 취소율'])
    assert.deepEqual(r.params.grp_name, ['A'])
  })

  test('한 글자 값은 묶는 말이 붙어야 인정한다', () => {
    // 이 리포트는 'A'라는 이름의 컬럼도 함께 낸다 — 질문에 A가 스쳤다고 등급을 걸면 안 된다.
    const r = resolveReportRequest({
      report_id: 'sc_delivery_status', sc_display: SC_DISPLAY.ALL_SC, year: 2025, month: 12,
    }, '2025년 12월 sc 출고 현황에서 A 컬럼도 보여줘')
    assert.equal(r.params.grp_name, undefined)
  })

  test('말하지 않은 등급은 채우지 않는다', () => {
    const r = resolveReportRequest({
      report_id: 'sc_delivery_status', sc_display: SC_DISPLAY.ALL_SC, year: 2025, month: 12,
    }, '2025년 12월 sc 출고 현황 보여줘')
    assert.equal(r.params.grp_name, undefined)
    assert.equal(r.params.grp_category, undefined)
  })

  test('사용자가 직접 말한 값을 덮지 않는다', () => {
    const r = resolveReportRequest({
      report_id: 'sc_delivery_status', sc_display: SC_DISPLAY.ALL_SC, year: 2025, month: 12,
      report_filters: [{ name: 'grp_name', values: ['B'] }],
    }, Q)
    assert.deepEqual(r.params.grp_name, ['B'])
  })
})

describe('비율을 물었으면 비율을 내는 경로로 간다 (No.51)', () => {
  test('PMA IN 비율은 그 컬럼을 가진 리포트를 지목한다', () => {
    // 시맨틱 레지스트리에 PMA 비율 지표가 없다 — 그 경로는 원값밖에 못 낸다.
    const t = ratioColumnForRateRequest("딜러별 연누적 출고에서 2025년 12월 렉서스 부산의 전시장별 PMA IN 비율을 '원형 차트'로 보여줘")
    assert.equal(t.report_id, 'sc_delivery_status')
    assert.equal(t.column, 'PMA IN 비중')
  })

  test('비율을 묻지 않았으면 개입하지 않는다', () => {
    assert.equal(ratioColumnForRateRequest('2025년 12월 렉서스 부산의 전시장별 PMA IN 건수'), null)
  })

  test('무엇의 비율인지가 질문에 없으면 개입하지 않는다', () => {
    // '비율'만 있고 대상이 없으면 어느 리포트로 갈지 정할 수 없다.
    assert.equal(ratioColumnForRateRequest('비율 보여줘'), null)
  })

  test('같은 질문이면 같은 곳을 지목한다', () => {
    const q = '전시장별 PMA IN 비율'
    const picks = new Set(Array.from({ length: 5 }, () => JSON.stringify(ratioColumnForRateRequest(q))))
    assert.equal(picks.size, 1)
  })
})
