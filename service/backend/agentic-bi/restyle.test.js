// 챗봇 restyle(차트 종류·색 변경) 회귀 테스트:
//   node --test server/agentic-bi/restyle.test.js
//
// 핵심은 "허용된 범위 안에서만 바뀐다"는 것 — 범위 밖 요청에 조용히 다른 걸 하거나
// 깨진 위젯을 만들면 안 되고, 사유를 돌려줘야 한다.
import { test, describe } from 'node:test'
import assert from 'node:assert/strict'

import { applyRestyle, describeRestyleOptions, renderRestyleCatalogForPrompt } from './restyleWidget.js'
import { validateWidgetProps } from '../dashboardValidation.js'
import { chartCodeOptionsFor } from '../../frontend/src/utils/chartSpecConvert.js'

const rows = [
  { time_month: '2025-01', pma_in: 3, pma_out: 5 },
  { time_month: '2025-02', pma_in: 4, pma_out: 6 },
  { time_month: '2025-03', pma_in: 7, pma_out: 2 },
]

function makeWidget(over = {}) {
  return {
    id: 'w-1',
    title: '월별 IN/OUT',
    chartCode: 'bar',
    type: 'render_bar_chart',
    db: 'KPI_W',
    sql: 'SELECT ...',
    left: 0, top: 0, right: 6, bottom: 4,
    querySpec: { xKey: 'time_month', yKeys: ['pma_in', 'pma_out'], yLabels: ['IN', 'OUT'] },
    props: { title: '월별 IN/OUT', data: rows, x_key: 'time_month', y_keys: ['pma_in', 'pma_out'] },
    ...over,
  }
}

describe('허용 범위 강제', () => {
  test('허용된 종류로는 바뀐다', () => {
    const r = applyRestyle(makeWidget(), { chartType: 'line' })
    assert.equal(r.ok, true)
    assert.equal(r.widget.chartCode, 'line')
    assert.equal(r.widget.type, 'render_line_chart')
  })

  test('허용되지 않은 종류는 거부하고 가능한 목록을 알려준다', () => {
    // 측정값이 2개라 도넛(값 1개 전용)은 불가
    const r = applyRestyle(makeWidget(), { chartType: 'pie' })
    assert.equal(r.ok, false)
    assert.match(r.error, /도넛/)
    assert.match(r.error, /가능/)
    assert.equal(r.widget, undefined, '거부 시 위젯을 만들면 안 된다')
  })

  test('항목이 많으면 레이더도 거부된다(축이 겹쳐 못 읽음)', () => {
    const many = Array.from({ length: 12 }, (_, i) => ({ time_month: `2025-${i}`, pma_in: i, pma_out: i }))
    const w = makeWidget({ props: { data: many } })
    assert.equal(applyRestyle(w, { chartType: 'radar' }).ok, false)
    // 3~8개면 허용
    const few = makeWidget({ props: { data: many.slice(0, 5) } })
    assert.equal(applyRestyle(few, { chartType: 'radar' }).ok, true)
  })

  test('전환 가능한 모든 종류가 실제로 렌더 가능한 위젯을 만든다', () => {
    const w = makeWidget()
    for (const to of chartCodeOptionsFor(w.chartCode, w.querySpec, rows)) {
      if (to === w.chartCode) continue
      const r = applyRestyle(w, { chartType: to })
      assert.equal(r.ok, true, `${to} 전환 실패: ${r.error}`)
      const check = validateWidgetProps({ type: r.widget.type, props: r.widget.props })
      assert.equal(check.ok, true, `${to} 위젯이 유효하지 않음: ${check.reason}`)
    }
  })

  test('데이터가 없으면 바꾸지 않는다', () => {
    const r = applyRestyle(makeWidget({ props: { data: [] } }), { chartType: 'line' })
    assert.equal(r.ok, false)
    assert.match(r.error, /데이터가 없어/)
  })

  test('위젯을 못 찾으면 사유를 돌려준다', () => {
    assert.equal(applyRestyle(null, { chartType: 'line' }).ok, false)
  })
})

describe('계열 색', () => {
  test('올바른 색은 querySpec.colorsBySeries에 반영된다', () => {
    const r = applyRestyle(makeWidget(), { colors: [{ series: 'pma_in', color: '#ff0000' }] })
    assert.equal(r.ok, true)
    assert.deepEqual(r.widget.querySpec.colorsBySeries, { pma_in: '#ff0000' })
    // 렌더 props까지 흘러가야 실제로 색이 바뀐다
    assert.deepEqual(r.widget.props.colors_by_key, { pma_in: '#ff0000' })
  })

  test('모르는 계열은 건너뛰고 알려준다', () => {
    const r = applyRestyle(makeWidget(), {
      colors: [{ series: '없는계열', color: '#ff0000' }, { series: 'pma_out', color: '#00ff00' }],
    })
    assert.equal(r.ok, true)
    assert.deepEqual(r.widget.querySpec.colorsBySeries, { pma_out: '#00ff00' })
    assert.ok(r.notes.some((n) => n.includes('없는계열')))
  })

  test('#RRGGBB 형식이 아니면 거부한다', () => {
    const r = applyRestyle(makeWidget(), { colors: [{ series: 'pma_in', color: '빨강' }] })
    assert.equal(r.ok, false, '적용할 색이 하나도 없으면 패치를 만들지 않는다')
    assert.ok(r.notes.some((n) => n.includes('#RRGGBB')))
  })

  test('종류와 색을 한 번에 바꿀 수 있다', () => {
    const r = applyRestyle(makeWidget(), { chartType: 'line', colors: [{ series: 'pma_in', color: '#123456' }] })
    assert.equal(r.ok, true)
    assert.equal(r.widget.chartCode, 'line')
    assert.deepEqual(r.widget.querySpec.colorsBySeries, { pma_in: '#123456' })
  })

  test('바꿀 내용이 없으면 패치를 만들지 않는다', () => {
    assert.equal(applyRestyle(makeWidget(), {}).ok, false)
  })
})

describe('위젯 정체성 보존', () => {
  test('위치·SQL·id는 그대로 유지된다', () => {
    const w = makeWidget()
    const r = applyRestyle(w, { chartType: 'area' })
    assert.equal(r.ok, true)
    for (const k of ['id', 'db', 'sql', 'left', 'top', 'right', 'bottom']) {
      assert.deepEqual(r.widget[k], w[k], `${k}가 바뀌면 안 된다`)
    }
  })

  test('표 위젯도 행을 복원해 차트로 되돌릴 수 있다', () => {
    const tableWidget = makeWidget({
      chartCode: 'table',
      type: 'render_table',
      querySpec: { xKey: 'time_month' },
      props: {
        title: '월별 IN/OUT',
        columns: ['time_month', 'pma_in', 'pma_out'],
        rows: rows.map((r) => [r.time_month, r.pma_in, r.pma_out]),
      },
    })
    const r = applyRestyle(tableWidget, { chartType: 'bar' })
    assert.equal(r.ok, true, r.error)
    assert.equal(r.widget.chartCode, 'bar')
    assert.equal(r.widget.querySpec.xKey, 'time_month')
    assert.deepEqual(r.widget.querySpec.yKeys, ['pma_in', 'pma_out'])
  })
})

describe('프롬프트용 카탈로그', () => {
  test('바꿀 수 있는 종류와 계열을 함께 보여준다', () => {
    const info = describeRestyleOptions(makeWidget())
    assert.equal(info.current, 'bar')
    assert.ok(info.changeableTo.includes('line'))
    assert.ok(!info.changeableTo.includes('bar'), '현재 종류는 후보에서 빠져야 한다')
    assert.deepEqual(info.seriesLabels, ['IN', 'OUT'])
  })

  test('KPI 카드와 데이터 없는 위젯은 목록에서 빠진다', () => {
    const text = renderRestyleCatalogForPrompt({
      widgets: [
        makeWidget(),
        makeWidget({ id: 'w-kpi', chartCode: 'kpi', title: 'KPI' }),
        makeWidget({ id: 'w-empty', title: '빈 위젯', props: { data: [] } }),
      ],
    })
    assert.ok(text.includes('w-1'))
    assert.ok(!text.includes('w-kpi'))
    assert.ok(!text.includes('w-empty'))
  })
})
