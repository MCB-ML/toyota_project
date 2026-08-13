// 인증 리포트 표의 단위 변경:
//   node --test server/agentic-bi/regroupReportWidget.test.js
import { test, describe } from 'node:test'
import assert from 'node:assert/strict'

import {
  regroupableWidgets, currentDimensions, renderRegroupCatalogForPrompt,
  buildRegroupReportWidgetTool, resolveRegroup,
} from './regroupReportWidget.js'

const widget = (over = {}) => ({
  id: 'w1',
  title: '월 목표 관리 (계층별)',
  type: 'render_table',
  querySpec: {
    reportId: 'target_management_month',
    reportView: null,
    reportParams: { Year: '2026', Month: '4' },
    reportGroupBy: null,
  },
  props: {
    columns: ['연도', '월', '딜러', '전시장', '부서', '활동유형', '판매목표대수', '계약목표', '활동목표'],
    rows: [],
  },
  ...over,
})

describe('대상 위젯 고르기', () => {
  test('인증 리포트 표만 대상이다', () => {
    const plain = { id: 'w9', querySpec: { metricId: 'activity_mtd_actual' }, props: { columns: ['a'] } }
    assert.deepEqual(regroupableWidgets({ widgets: [widget(), plain] }).map((w) => w.id), ['w1'])
  })

  test('퍼널 프리셋은 제외한다 — 표시 형태가 고정이라 grain을 바꾸면 뷰가 깨진다', () => {
    const funnel = widget({ id: 'w2', querySpec: { ...widget().querySpec, reportView: 'funnel_core_wide' } })
    assert.equal(regroupableWidgets({ widgets: [funnel] }).length, 0)
  })

  test('차원은 계약의 측정값을 뺀 나머지다', () => {
    assert.deepEqual(currentDimensions(widget()), ['연도', '월', '딜러', '전시장', '부서', '활동유형'])
  })

  test('이미 접은 위젯은 그 단위가 현재 차원이다', () => {
    const rolled = widget({ querySpec: { ...widget().querySpec, reportGroupBy: ['딜러'] } })
    assert.deepEqual(currentDimensions(rolled), ['딜러'])
  })

  test('카탈로그와 툴 enum이 실제 위젯 id를 담는다', () => {
    assert.match(renderRegroupCatalogForPrompt({ widgets: [widget()] }), /w1 \| "월 목표 관리/)
    const tool = buildRegroupReportWidgetTool({ widgets: [widget()] })
    assert.deepEqual(tool.function.parameters.properties.widget_id.enum, ['w1'])
  })
})

describe('무엇을 빼고 무엇을 남길지', () => {
  test('지목한 차원만 빠지고 순서는 유지된다', () => {
    const r = resolveRegroup(widget(), { drop_dimensions: ['활동유형'] })
    assert.ok(r.ok)
    assert.deepEqual(r.groupBy, ['연도', '월', '딜러', '전시장', '부서'])
    assert.deepEqual(r.dropped, ['활동유형'])
  })

  test('공백·별칭이 달라도 찾는다', () => {
    // LLM이 '활동 유형'으로 쓰거나 화면 이름('팀')과 데이터 이름('부서')이 다를 수 있다.
    assert.deepEqual(resolveRegroup(widget(), { drop_dimensions: ['활동 유형'] }).dropped, ['활동유형'])
    assert.deepEqual(resolveRegroup(widget(), { drop_dimensions: ['팀'] }).dropped, ['부서'])
  })

  test('남길 것만 지정할 수도 있다', () => {
    const r = resolveRegroup(widget(), { keep_dimensions: ['딜러'] })
    assert.deepEqual(r.groupBy, ['딜러'])
  })

  test('없는 컬럼은 조용히 무시하지 않고 알린다', () => {
    const r = resolveRegroup(widget(), { drop_dimensions: ['모델'] })
    assert.equal(r.ok, false)
    assert.match(r.error, /없는 컬럼/)
    assert.match(r.error, /현재 단위/)
  })

  test('차원을 모두 빼면 거절한다 — 표가 성립하지 않는다', () => {
    const r = resolveRegroup(widget(), { drop_dimensions: ['연도', '월', '딜러', '전시장', '부서', '활동유형'] })
    assert.equal(r.ok, false)
  })

  test('바뀔 것이 없으면 알린다 — 조용히 재조회하지 않는다', () => {
    const rolled = widget({ querySpec: { ...widget().querySpec, reportGroupBy: ['딜러'] } })
    assert.equal(resolveRegroup(rolled, { keep_dimensions: ['딜러'] }).ok, false)
  })

  test('무엇을 할지 안 주면 거절한다', () => {
    assert.equal(resolveRegroup(widget(), {}).ok, false)
    assert.equal(resolveRegroup(undefined, { drop_dimensions: ['활동유형'] }).ok, false)
  })
})
