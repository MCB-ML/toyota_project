// EChartsWidget 의 차트 모듈 등록 누락을 잡는다.
//
// echarts/core 는 쓰는 시리즈를 직접 등록해야 하는데, 등록이 빠진 타입은 setOption 이
// 콘솔 에러("Series X is used but not imported")만 남기고 조용히 빈 화면이 된다 —
// 퍼널이 실제로 그랬다. 여기서는 앱과 같은 모듈 목록으로 모든 chartCode 를 SSR 렌더해
// "실제로 뭔가 그려졌는지"를 확인한다. 새 kind 를 echartsViz.js 에 추가하고 모듈 등록을
// 잊으면 이 테스트가 먼저 깨진다.
import test from 'node:test'
import assert from 'node:assert/strict'
import * as echarts from 'echarts/core'
import { SVGRenderer } from 'echarts/renderers'
import { ECHARTS_CHART_MODULES } from '../frontend/src/components/widgets/echartsChartModules.js'
import { compileEChartsWidget, isEChartsWidget } from '../frontend/src/components/widgets/echartsViz.js'

echarts.use([...ECHARTS_CHART_MODULES, SVGRenderer])

const ROWS = [
  { 항목: '활동', 실적: 42, 목표: 50 },
  { 항목: '기회', 실적: 31, 목표: 40 },
  { 항목: '계약', 실적: 17, 목표: 20 },
]

// 위젯 타입별 (props, objectSpec) — 에디터/서버가 만드는 모양을 최소로 재현한다.
const CASES = {
  render_bar_chart: {
    props: { title: 't', data: ROWS, x_key: '항목', y_keys: ['실적'], y_labels: ['실적'] },
    vizSpec: { kind: 'bar', binding: { x: '항목', series: ['실적'] } },
  },
  render_line_chart: {
    props: { title: 't', data: ROWS, x_key: '항목', y_keys: ['실적'], y_labels: ['실적'] },
    vizSpec: { kind: 'line', binding: { x: '항목', series: ['실적'] } },
  },
  render_area_chart: {
    props: { title: 't', data: ROWS, x_key: '항목', y_keys: ['실적'], y_labels: ['실적'] },
    vizSpec: { kind: 'area', binding: { x: '항목', series: ['실적'] } },
  },
  render_pie_chart: {
    props: { title: 't', data: ROWS.map((row) => ({ name: row.항목, value: row.실적 })) },
    vizSpec: { kind: 'pie' },
  },
  render_scatter_chart: {
    props: { title: 't', data: ROWS, x_key: '실적', y_key: '목표' },
    vizSpec: { kind: 'scatter', binding: { x: '실적', y: '목표' } },
  },
  render_radar_chart: {
    props: { title: 't', data: ROWS, x_key: '항목', y_keys: ['실적', '목표'], y_labels: ['실적', '목표'] },
    vizSpec: { kind: 'radar', binding: { x: '항목', series: ['실적', '목표'] } },
  },
  render_combo_chart: {
    props: { title: 't', data: ROWS, x_key: '항목', bar_keys: ['실적'], line_keys: ['목표'], bar_labels: ['실적'], line_labels: ['목표'] },
    vizSpec: { kind: 'combo', binding: { x: '항목', series: ['실적', '목표'] } },
  },
  render_funnel_chart: {
    props: { title: 't', data: ROWS, x_key: '항목', y_key: '실적', y_label: '실적' },
    vizSpec: { kind: 'funnel', binding: { x: '항목', y: '실적' } },
  },
}

function renderToSvg(name, { props, vizSpec }) {
  const objectSpec = { vizSpec: { renderer: 'echarts', ...vizSpec } }
  assert.equal(isEChartsWidget(name, objectSpec), true, `${name} 은 EChartsWidget 이 그린다`)
  const { option } = compileEChartsWidget(name, props, objectSpec, { width: 600, height: 320 })
  const chart = echarts.init(null, null, { renderer: 'svg', ssr: true, width: 600, height: 320 })
  try {
    chart.setOption(option)
    return chart.renderToSVGString()
  } finally {
    chart.dispose()
  }
}

for (const [name, definition] of Object.entries(CASES)) {
  test(`${name} 이 실제로 그려진다 (모듈 등록 누락 감지)`, () => {
    const svg = renderToSvg(name, definition)
    // 등록이 빠진 시리즈는 배경 요소만 남는다 — 데이터 도형(path)이 행 수 이상 있어야
    // "그려졌다"고 본다.
    const paths = (svg.match(/<path/g) || []).length
    assert.ok(paths >= ROWS.length, `${name}: path ${paths}개 — 시리즈가 그려지지 않았다(모듈 등록 확인)`)
  })
}
