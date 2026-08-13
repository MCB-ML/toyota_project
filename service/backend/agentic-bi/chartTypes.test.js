// 차트 타입 가드레일 + querySpec 변환 회귀 테스트 (Node 내장 러너, 외부 의존성 없음):
//   node --test server/agentic-bi/chartTypes.test.js
import { test, describe } from 'node:test'
import assert from 'node:assert/strict'

import {
  checkDonutEligible, foldDonutRows, checkScatterEligible, checkRadarEligible,
  DONUT_MAX_SLICES, OTHER_SLICE_LABEL,
} from './chartEligibility.js'
import {
  readSpecShape, chartCodeOptionsFor, convertQuerySpec, seriesKeysFor, rowsFromWidgetProps,
} from '../../frontend/src/utils/chartSpecConvert.js'
import { buildWidgetPropsFromRows } from '../widgetSchema.js'
import { validateWidgetProps } from '../dashboardValidation.js'
import { updateDashboardObject, validateDashboardState } from '../../frontend/src/utils/dashboardObject.js'

const countMetric = { metric_type: 'base_metric', format: 'count' }
const ratioMetric = { metric_type: 'ratio_metric', format: 'percentage' }

describe('도넛 가드레일', () => {
  const rows = [{ d: 'A', v: 3 }, { d: 'B', v: 7 }]

  test('개수형 지표 + 2개 이상 카테고리면 통과', () => {
    assert.equal(checkDonutEligible(rows, 'v', countMetric).ok, true)
  })

  test('비율 지표는 거부(더해도 전체가 아님)', () => {
    const r = checkDonutEligible(rows, 'v', ratioMetric)
    assert.equal(r.ok, false)
    assert.match(r.reason, /비율/)
  })

  test('음수가 있으면 거부', () => {
    const r = checkDonutEligible([{ d: 'A', v: -1 }, { d: 'B', v: 5 }], 'v', countMetric)
    assert.equal(r.ok, false)
    assert.match(r.reason, /음수/)
  })

  test('카테고리 1개면 거부', () => {
    assert.equal(checkDonutEligible([{ d: 'A', v: 3 }], 'v', countMetric).ok, false)
  })

  test('합계가 0이면 거부', () => {
    assert.equal(checkDonutEligible([{ d: 'A', v: 0 }, { d: 'B', v: 0 }], 'v', countMetric).ok, false)
  })

  test('8개 이하면 접지 않는다', () => {
    const eight = Array.from({ length: 8 }, (_, i) => ({ d: `D${i}`, v: i + 1 }))
    assert.equal(foldDonutRows(eight, 'd', 'v').length, 8)
  })

  test('9개 이상이면 상위 7개 + 기타로 접는다', () => {
    const many = Array.from({ length: 14 }, (_, i) => ({ d: `D${i}`, v: i + 1 }))
    const folded = foldDonutRows(many, 'd', 'v')
    assert.equal(folded.length, DONUT_MAX_SLICES)
    assert.equal(folded[folded.length - 1].d, OTHER_SLICE_LABEL)
    // 접힌 뒤에도 총합은 보존돼야 한다
    const before = many.reduce((s, r) => s + r.v, 0)
    const after = folded.reduce((s, r) => s + r.v, 0)
    assert.equal(after, before)
  })
})

describe('산점도 / 레이더 가드레일', () => {
  test('산점도는 지표 정확히 2개 + 차원이 있어야 통과', () => {
    assert.equal(checkScatterEligible(['a', 'b'], 'sales_consultant').ok, true)
    assert.equal(checkScatterEligible(['a'], 'sales_consultant').ok, false)
    assert.equal(checkScatterEligible(['a', 'b', 'c'], 'sales_consultant').ok, false)
    assert.equal(checkScatterEligible(['a', 'b'], null).ok, false)
  })

  test('레이더는 축 3~8개', () => {
    const mk = (n) => Array.from({ length: n }, (_, i) => ({ d: i }))
    assert.equal(checkRadarEligible(mk(2)).ok, false)
    assert.equal(checkRadarEligible(mk(3)).ok, true)
    assert.equal(checkRadarEligible(mk(8)).ok, true)
    assert.equal(checkRadarEligible(mk(9)).ok, false)
  })
})

describe('querySpec 변환', () => {
  const single = { labelKey: 'dealer', valueKey: 'cnt' }
  const multi = { xKey: 'time_month', yKeys: ['actual', 'target'], yLabels: ['실적', '목표'] }

  test('단일 측정값의 모양을 읽는다', () => {
    assert.deepEqual(readSpecShape('bar', single), { dimKey: 'dealer', measures: ['cnt'], labels: null })
  })

  test('bar -> pie -> bar 왕복이 원래 키로 돌아온다', () => {
    const toPie = convertQuerySpec('bar', 'pie', single)
    assert.equal(toPie.labelKey, 'dealer')
    assert.equal(toPie.valueKey, 'cnt')
    // 도넛으로 갈 땐 접기 플래그가 함께 붙어야 카테고리가 많아도 읽을 수 있다
    assert.equal(toPie.foldTopN, 8)
    // 되돌아올 땐 pie 전용 플래그(foldTopN)가 남지 않아야 한다
    const back = convertQuerySpec('pie', 'bar', toPie)
    assert.equal(back.labelKey, 'dealer')
    assert.equal(back.valueKey, 'cnt')
    assert.equal(back.foldTopN, undefined)
  })

  test('bar -> funnel 은 단일 측정값 퍼널 모양이 된다', () => {
    const toFunnel = convertQuerySpec('bar', 'funnel', single)
    assert.equal(toFunnel.labelKey, 'dealer')
    assert.equal(toFunnel.valueKey, 'cnt')
    assert.equal(toFunnel.foldTopN, undefined)
  })

  test('단일 측정값 bar -> line 은 xKey/yKeys 모양이 된다', () => {
    const line = convertQuerySpec('bar', 'line', single)
    assert.equal(line.xKey, 'dealer')
    assert.deepEqual(line.yKeys, ['cnt'])
  })

  test('다계열 bar -> combo 는 첫 계열이 막대, 나머지가 선', () => {
    const combo = convertQuerySpec('bar', 'combo', multi)
    assert.deepEqual(combo.barKeys, ['actual'])
    assert.deepEqual(combo.lineKeys, ['target'])
    assert.equal(combo.xKey, 'time_month')
  })

  test('측정값 2개면 scatter 로 갈 때 x/y 로 배정된다', () => {
    const sc = convertQuerySpec('bar', 'scatter', multi)
    assert.equal(sc.xKey, 'actual')
    assert.equal(sc.yKey, 'target')
  })

  test('표시 옵션(누적/가로/색)은 타입을 바꿔도 유지된다', () => {
    const withOpts = { ...multi, stacked: true, orientation: 'horizontal', colorsBySeries: { actual: '#ff0000' } }
    const line = convertQuerySpec('bar', 'line', withOpts)
    assert.equal(line.stacked, true)
    assert.equal(line.orientation, 'horizontal')
    assert.deepEqual(line.colorsBySeries, { actual: '#ff0000' })
  })

  test('선택 가능한 차트 종류가 측정값 개수에 따라 달라진다', () => {
    const one = chartCodeOptionsFor('bar', single)
    assert.ok(one.includes('pie'))
    assert.ok(one.includes('funnel'))
    assert.ok(!one.includes('scatter'))
    assert.ok(!one.includes('combo'))

    const two = chartCodeOptionsFor('bar', multi)
    assert.ok(two.includes('scatter'))
    assert.ok(two.includes('combo'))
    assert.ok(two.includes('radar'))
    assert.ok(!two.includes('pie'))
    assert.ok(!two.includes('funnel'))

    const three = chartCodeOptionsFor('bar', { xKey: 'd', yKeys: ['a', 'b', 'c'] })
    assert.ok(!three.includes('scatter'), '측정값 3개면 산점도 후보에서 빠져야 한다')
  })

  test('kpi 는 어떤 경우에도 전환 후보가 아니다', () => {
    assert.ok(!chartCodeOptionsFor('bar', single).includes('kpi'))
    assert.ok(!chartCodeOptionsFor('bar', multi).includes('kpi'))
  })

  test('피라미드 퍼널 구조는 전용 데이터 모양이라 일반 차트로 변환하지 않는다', () => {
    const spec = {
      stageKey: '단계',
      totalKey: '단계 합계',
      channels: ['관계형성활동', 'SC활동', '내방/내전', '온라인유입'],
    }
    assert.deepEqual(chartCodeOptionsFor('funnel_pyramid', spec), ['funnel_pyramid'])
    assert.equal(convertQuerySpec('funnel_pyramid', 'bar', spec), spec)
    assert.deepEqual(seriesKeysFor('funnel_pyramid', spec), [
      { key: '관계형성활동', label: '관계형성활동' },
      { key: 'SC활동', label: 'SC활동' },
      { key: '내방/내전', label: '내방/내전' },
      { key: '온라인유입', label: '온라인유입' },
    ])
  })

  test('색 지정 대상 계열 목록', () => {
    assert.deepEqual(seriesKeysFor('bar', multi), [
      { key: 'actual', label: '실적' }, { key: 'target', label: '목표' },
    ])
    // pie 는 컬럼이 아니라 카테고리 값이 색 대상
    const rows = [{ dealer: 'A', cnt: 1 }, { dealer: 'B', cnt: 2 }]
    assert.deepEqual(seriesKeysFor('pie', single, rows), [
      { key: 'A', label: 'A' }, { key: 'B', label: 'B' },
    ])
    assert.deepEqual(seriesKeysFor('funnel', single, rows), [
      { key: 'A', label: 'A' }, { key: 'B', label: 'B' },
    ])
  })
})

// 2026-07-29: 실사용에서 "16개 딜러를 도넛으로"가 '허용치 8 초과'로 막혔다 — 접기 함수는
// 있었는데 단일 지표 경로에 연결이 빠져 있었다. 그리고 다지표 도넛은 rows를 직접 접고
// 합산해서 저장 후 새로고침하면 접힘이 풀리고 값이 전부 0이 되는 버그가 있었다.
// 두 가지 모두 "표시에 영향 주는 건 querySpec에 남긴다"는 원칙으로 고쳤고, 여기서 고정한다.
// 2026-07-29: 편집 패널에서 타입을 여러 번 바꾸다 페이지가 멈춘다는 제보로 조사하다 발견.
// 차트별 렌더링 키만 보고 구조를 역추론하던 탓에 (1) 산점도를 거치면 차원(time_month)이
// 사라져 x축이 측정값이 되고 그 컬럼이 축이자 계열인 기형 차트가 됐고, (2) 표로 바꾸면
// 측정값 목록이 사라져 다른 차트로 되돌아갈 수 없었다.
describe('타입을 연달아 바꿔도 구조가 망가지지 않는다', () => {
  const start = { xKey: 'time_month', yKeys: ['pma_in', 'pma_out'], yLabels: ['IN', 'OUT'] }

  test('산점도를 거쳐도 차원이 보존된다', () => {
    const sc = convertQuerySpec('bar', 'scatter', start)
    assert.equal(readSpecShape('scatter', sc).dimKey, 'time_month')
    // 산점도 -> 꺾은선에서 x축이 다시 차원이어야 한다(측정값이 축이 되면 안 됨)
    const line = convertQuerySpec('scatter', 'line', sc)
    assert.equal(line.xKey, 'time_month')
    assert.deepEqual(line.yKeys, ['pma_in', 'pma_out'])
  })

  const monthRows = Array.from({ length: 12 }, (_, i) => ({
    time_month: `2025-${String(i + 1).padStart(2, '0')}`, pma_in: i + 1, pma_out: (i + 1) * 2,
  }))

  test('표로 바꿔도 다시 차트로 돌아올 수 있다', () => {
    const tbl = convertQuerySpec('bar', 'table', start)
    const opts = chartCodeOptionsFor('table', tbl, monthRows)
    assert.ok(opts.includes('bar'), `표에서 되돌아갈 수 없음: ${opts.join(',')}`)
    const back = convertQuerySpec('table', 'bar', tbl)
    assert.equal(back.xKey, 'time_month')
    assert.deepEqual(back.yKeys, ['pma_in', 'pma_out'])
  })

  test('챗봇이 처음부터 표로 만든 위젯(측정값 목록 없음)도 데이터에서 추론해 되돌린다', () => {
    // renderMultiSeriesAndRespond 의 table 분기는 querySpec 에 xKey 만 남긴다
    const chatbotTable = { xKey: 'time_month' }
    const shape = readSpecShape('table', chatbotTable, monthRows)
    assert.equal(shape.dimKey, 'time_month')
    assert.deepEqual(shape.measures, ['pma_in', 'pma_out'], '숫자 컬럼에서 측정값을 추론해야 한다')

    const opts = chartCodeOptionsFor('table', chatbotTable, monthRows)
    assert.ok(opts.includes('bar'))
    const back = convertQuerySpec('table', 'bar', chatbotTable, monthRows)
    assert.equal(back.xKey, 'time_month')
    assert.deepEqual(back.yKeys, ['pma_in', 'pma_out'])
  })

  test('데이터가 없으면 추론하지 않는다(엉뚱한 차트를 만들지 않음)', () => {
    assert.deepEqual(chartCodeOptionsFor('table', { xKey: 'time_month' }, []), ['table'])
  })

  test('여러 번 오가도 차원/측정값이 그대로다', () => {
    let spec = start, code = 'bar'
    for (const to of ['scatter', 'line', 'table', 'area', 'combo', 'bar']) {
      spec = convertQuerySpec(code, to, spec); code = to
    }
    const shape = readSpecShape(code, spec)
    assert.equal(shape.dimKey, 'time_month')
    assert.deepEqual(shape.measures, ['pma_in', 'pma_out'])
  })

  test('항목이 많으면 레이더는 후보에서 빠진다(축이 겹쳐 못 읽음)', () => {
    const mk = (n) => Array.from({ length: n }, (_, i) => ({ time_month: `m${i}`, pma_in: i, pma_out: i }))
    assert.ok(!chartCodeOptionsFor('bar', start, mk(12)).includes('radar'))
    assert.ok(chartCodeOptionsFor('bar', start, mk(5)).includes('radar'))
    assert.ok(!chartCodeOptionsFor('bar', start, mk(2)).includes('radar'))
  })
})

describe('도넛 접기/합산이 querySpec으로 재현된다', () => {
  const many = Array.from({ length: 16 }, (_, i) => ({ dealer: `D${i + 1}`, v: (i + 1) * 10 }))

  test('카테고리 16개도 거부되지 않고 8개로 접힌다(총합 보존)', () => {
    const spec = { labelKey: 'dealer', valueKey: 'v', foldTopN: 8 }
    const built = buildWidgetPropsFromRows('pie', many, spec, 'T')
    assert.equal(built.props.data.length, 8)
    assert.equal(built.props.data[7].name, OTHER_SLICE_LABEL)
    const before = many.reduce((s, r) => s + r.v, 0)
    const after = built.props.data.reduce((s, d) => s + d.value, 0)
    assert.equal(after, before)
  })

  test('foldTopN 없이는 접지 않는다(다른 차트 종류에 영향 없음)', () => {
    const built = buildWidgetPropsFromRows('pie', many, { labelKey: 'dealer', valueKey: 'v' }, 'T')
    assert.equal(built.props.data.length, 16)
  })

  test('같은 raw rows + 같은 querySpec 이면 재조회 결과가 생성 시점과 동일하다', () => {
    const spec = { labelKey: 'dealer', valueKey: 'v', foldTopN: 8 }
    const first = buildWidgetPropsFromRows('pie', many, spec, 'T')
    const rehydrated = buildWidgetPropsFromRows('pie', many, spec, 'T')
    assert.deepEqual(rehydrated.props.data, first.props.data)
  })

  test('다지표 도넛: sumKeys 로 합산 컬럼을 재조회 때도 다시 만들어낸다', () => {
    const raw = [
      { pma: 'IN', a: 30, b: 0, c: 0 },
      { pma: 'OUT', a: 0, b: 20, c: 0 },
      { pma: 'ETC', a: 0, b: 0, c: 5 },
    ]
    const spec = { labelKey: 'pma', valueKey: '__donut_value', sumKeys: ['a', 'b', 'c'], foldTopN: 8 }
    const built = buildWidgetPropsFromRows('pie', raw, spec, 'T')
    assert.deepEqual(built.props.data, [
      { name: 'IN', value: 30 }, { name: 'OUT', value: 20 }, { name: 'ETC', value: 5 },
    ])
    // 재조회(같은 raw rows)에서도 값이 0으로 무너지지 않아야 한다
    assert.deepEqual(buildWidgetPropsFromRows('pie', raw, spec, 'T').props.data, built.props.data)
  })
})

describe('변환 결과가 실제로 렌더 가능한 위젯을 만든다', () => {
  const rows = [
    { dealer: 'A', actual: 3, target: 5 },
    { dealer: 'B', actual: 7, target: 6 },
    { dealer: 'C', actual: 2, target: 9 },
  ]

  test('단일 측정값: 전환 가능한 모든 타입이 필수 prop 검사를 통과한다', () => {
    const spec = { labelKey: 'dealer', valueKey: 'actual' }
    for (const to of chartCodeOptionsFor('bar', spec)) {
      const next = convertQuerySpec('bar', to, spec)
      const built = buildWidgetPropsFromRows(to, rows, next, 'T')
      const check = validateWidgetProps({ type: built.type, props: built.props })
      assert.equal(check.ok, true, `${to} 실패: ${check.reason}`)
    }
  })

  test('다계열: 전환 가능한 모든 타입이 필수 prop 검사를 통과한다', () => {
    const spec = { xKey: 'dealer', yKeys: ['actual', 'target'] }
    for (const to of chartCodeOptionsFor('bar', spec)) {
      const next = convertQuerySpec('bar', to, spec)
      const built = buildWidgetPropsFromRows(to, rows, next, 'T')
      const check = validateWidgetProps({ type: built.type, props: built.props })
      assert.equal(check.ok, true, `${to} 실패: ${check.reason}`)
    }
  })
})

// 인증 리포트 표를 차트로 바꿀 때의 가드.
// 이 표에는 "숫자지만 그대로 합산하면 틀리는" 컬럼이 섞여 있다 — 계약목표는 팀 단위
// 값이 활동유형 행마다 반복돼 있고(SUM하면 중복), 비율은 행 평균이 의미가 없다.
describe('리포트 컬럼 의미론 가드', () => {
  const reportColumnSemantics = {
    활동실적: { type: 'additive' },
    기회실적: { type: 'additive' },
    계약목표: { type: 'repeated_higher_grain_value', direct_sum_forbidden: true },
    계약진행률: { type: 'higher_grain_ratio', direct_average_forbidden: true },
  }
  const rows = [
    { 활동유형: '전화', 활동실적: 8, 기회실적: 3, 계약목표: 100, 계약진행률: 0.5 },
    { 활동유형: '방문', 활동실적: 5, 기회실적: 2, 계약목표: 100, 계약진행률: 0.5 },
  ]

  test('추론 경로에서 금지 컬럼이 측정값 후보에서 빠진다', () => {
    const spec = { xKey: '활동유형', reportColumnSemantics }
    const { measures } = readSpecShape('table', spec, rows)
    assert.deepEqual(measures, ['활동실적', '기회실적'])
  })

  test('명시적 measureKeys에서도 금지 컬럼이 걸러진다', () => {
    const spec = {
      dimensionKey: '활동유형',
      measureKeys: ['활동실적', '계약목표', '계약진행률'],
      reportColumnSemantics,
    }
    const { measures } = readSpecShape('bar', spec, rows)
    assert.deepEqual(measures, ['활동실적'])
  })

  test('색 지정 계열 목록에도 금지 컬럼이 안 나온다', () => {
    const spec = { xKey: '활동유형', reportColumnSemantics }
    const keys = seriesKeysFor('bar', spec, rows).map((s) => s.key)
    assert.equal(keys.includes('계약목표'), false)
    assert.equal(keys.includes('계약진행률'), false)
  })

  test('semantics가 없으면 기존 동작 그대로 — 숫자 컬럼을 전부 쓴다', () => {
    const { measures } = readSpecShape('table', { xKey: '활동유형' }, rows)
    assert.deepEqual(measures, ['활동실적', '기회실적', '계약목표', '계약진행률'])
  })

  test('금지 컬럼을 뺀 뒤에도 남는 측정값으로 차트 종류를 고를 수 있다', () => {
    const spec = { xKey: '활동유형', reportColumnSemantics }
    const options = chartCodeOptionsFor('table', spec, rows)
    assert.ok(options.includes('bar'))
    assert.ok(options.includes('combo'), '측정값 2개가 남으므로 combo가 가능해야 한다')
  })
})

describe('dashboard page save validation accepts every chart code', () => {
  const rows = [
    { dealer: 'A', actual: 3, target: 5 },
    { dealer: 'B', actual: 7, target: 6 },
    { dealer: 'C', actual: 2, target: 9 },
  ]
  const cases = [
    ['bar', { labelKey: 'dealer', valueKey: 'actual' }],
    ['line', { xKey: 'dealer', yKeys: ['actual', 'target'] }],
    ['area', { xKey: 'dealer', yKeys: ['actual', 'target'] }],
    ['pie', { labelKey: 'dealer', valueKey: 'actual' }],
    ['pie', { labelKey: 'dealer', valueKey: 'actual', foldTopN: 2 }],
    ['funnel', { labelKey: 'dealer', valueKey: 'actual' }],
    ['funnel_pyramid', {
      stageKey: '단계',
      totalKey: '단계 합계',
      channels: ['관계형성활동', 'SC활동', '내방/내전', '온라인유입'],
    }],
    ['scatter', { xKey: 'actual', yKey: 'target' }],
    ['radar', { xKey: 'dealer', yKeys: ['actual', 'target'] }],
    ['combo', { xKey: 'dealer', barKeys: ['actual'], lineKeys: ['target'] }],
    ['table', { xKey: 'dealer' }],
    ['kpi', { cardKey: 'actual', cardTitle: 'T' }],
  ]

  const objectFor = ([chartCode, querySpec], index) => {
    const sourceRows = chartCode === 'funnel_pyramid'
      ? [
          { 단계: '활동', '단계 합계': 30, 관계형성활동: 10, SC활동: 20, '내방/내전': 0, 온라인유입: 0 },
          { 단계: '영업기회', '단계 합계': 12, 관계형성활동: 4, SC활동: 8, '내방/내전': 0, 온라인유입: 0 },
        ]
      : rows
    const built = buildWidgetPropsFromRows(chartCode, sourceRows, querySpec, 'T')
    return {
      id: `object_${index}`,
      db: 'KPI_W',
      sql: 'SELECT 1',
      topic: 'actual',
      chartCode,
      title: 'T',
      type: built.type,
      querySpec,
      props: built.props,
    }
  }

  for (const [index, entry] of cases.entries()) {
    const [chartCode, querySpec] = entry
    const label = querySpec.foldTopN ? `${chartCode} folded` : chartCode
    test(`${label} saves as a one-widget page`, () => {
      const issues = validateDashboardState({ version: 0, widgets: [objectFor(entry, index)] })
      assert.deepEqual(issues, [], `${label} rejected: ${issues.join(' | ')}`)
    })
  }

  test('all chart codes save together on one page', () => {
    const widgets = cases.map((entry, index) => objectFor(entry, index))
    assert.deepEqual(validateDashboardState({ version: 0, widgets }), [])
  })

  test('chart type changes replace stale renderer props', () => {
    const original = objectFor(['bar', { labelKey: 'dealer', valueKey: 'actual' }], 99)
    const querySpec = convertQuerySpec('bar', 'line', original.querySpec, rows)
    const built = buildWidgetPropsFromRows('line', rows, querySpec, 'T')
    const updated = updateDashboardObject(original, {
      chartCode: 'line',
      objectType: 'chart',
      type: built.type,
      querySpec,
      props: built.props,
      objectSpec: {
        vizSpec: {
          kind: 'line',
          renderer: 'echarts',
          binding: { x: 'dealer', series: ['actual'] },
          features: {},
        },
      },
    })

    assert.equal(updated.chartCode, 'line')
    assert.equal(updated.type, 'render_line_chart')
    assert.deepEqual(updated.props.y_keys, ['actual'])
    assert.equal(updated.props.y_key, undefined)
    assert.equal(updated.objectSpec.vizSpec.kind, 'line')
    assert.deepEqual(updated.objectSpec.vizSpec.binding.series, ['actual'])
    assert.deepEqual(validateDashboardState({ version: 0, widgets: [updated] }), [])
  })
})

describe('KPI card title persistence', () => {
  test('a stored object title wins over the creation-time card title during rehydration', () => {
    const built = buildWidgetPropsFromRows(
      'kpi',
      [{ activity_mtd_actual: 47718 }],
      { cardKey: 'activity_mtd_actual', cardTitle: '당월 영업활동 실적' },
      '사용자가 수정한 카드 제목',
    )

    assert.equal(built.props.title, '사용자가 수정한 카드 제목')
    assert.equal(built.props.value, '47,718')
  })
})

describe('horizontal bar charts swap their axes', () => {
  const props = {
    title: 'T',
    data: [{ d: 'A', cnt: 3 }, { d: 'B', cnt: 7 }, { d: 'C', cnt: 2 }],
    x_key: 'd',
    y_keys: ['cnt'],
  }
  const specFor = (orientation) => ({
    vizSpec: {
      kind: 'bar',
      renderer: 'echarts',
      binding: { x: 'd', series: ['cnt'], orientation },
      features: {},
    },
  })
  const axisTypes = (option) => ({
    x: (Array.isArray(option.xAxis) ? option.xAxis : [option.xAxis]).map((axis) => axis.type),
    y: (Array.isArray(option.yAxis) ? option.yAxis : [option.yAxis]).map((axis) => axis.type),
  })

  test('vertical bars keep the category axis on x', async () => {
    const { compileEChartsWidget } = await import('../../frontend/src/components/widgets/echartsViz.js')
    const { option } = compileEChartsWidget('render_bar_chart', props, specFor('vertical'), { width: 720, height: 360 })
    assert.deepEqual(axisTypes(option), { x: ['category'], y: ['value'] })
    assert.equal(option.series[0].yAxisIndex, 0)
    assert.equal(option.series[0].xAxisIndex, undefined)
  })

  test('horizontal bars put the category axis on y', async () => {
    const { compileEChartsWidget } = await import('../../frontend/src/components/widgets/echartsViz.js')
    const { option } = compileEChartsWidget('render_bar_chart', props, specFor('horizontal'), { width: 720, height: 360 })
    assert.deepEqual(axisTypes(option), { x: ['value'], y: ['category'] })
    assert.equal(option.series[0].xAxisIndex, 0)
    assert.equal(option.series[0].yAxisIndex, undefined)
    const categoryAxis = Array.isArray(option.yAxis) ? option.yAxis[0] : option.yAxis
    assert.deepEqual(categoryAxis.data, ['A', 'B', 'C'])
  })
})

// 도넛 위젯은 props.data가 [{name, value}]로 접혀 저장된다(widgetSchema pie case).
// 편집 패널이 원본 컬럼명으로 되돌리지 못하면 "도넛에서 저장만 눌러도 깨지는" 회귀가
// 재발한다 — 표→도넛→저장→막대 전체 사이클을 고정한다.
describe('도넛 props 원본 행 복원', () => {
  const raw = [
    { 활동유형: '전화', 건수: 42 },
    { 활동유형: '방문', 건수: 31 },
    { 활동유형: '시승', 건수: 17 },
  ]
  const pieSpec = convertQuerySpec('table', 'pie', { xKey: '활동유형' }, raw)
  const pieProps = buildWidgetPropsFromRows('pie', raw, pieSpec, '당월 영업활동 실적표').props

  test('name/value로 접힌 도넛 rows를 querySpec 키로 되돌린다', () => {
    const restored = rowsFromWidgetProps({ data: pieProps.data }, { chartCode: 'pie', querySpec: pieSpec })
    assert.deepEqual(restored, raw)
  })

  test('복원된 rows로 도넛을 다시 저장해도 값이 유지된다', () => {
    const restored = rowsFromWidgetProps({ data: pieProps.data }, { chartCode: 'pie', querySpec: pieSpec })
    const resaved = buildWidgetPropsFromRows('pie', restored, pieSpec, '당월 영업활동 실적표').props
    assert.deepEqual(resaved.data, pieProps.data)
  })

  test('도넛 → 막대 전환이 원본 컬럼명으로 빌드된다', () => {
    const restored = rowsFromWidgetProps({ data: pieProps.data }, { chartCode: 'pie', querySpec: pieSpec })
    const barSpec = convertQuerySpec('pie', 'bar', pieSpec, restored)
    const barProps = buildWidgetPropsFromRows('bar', restored, barSpec, '당월 영업활동 실적표').props
    assert.equal(barProps.x_key, '활동유형')
    assert.deepEqual(barProps.data, raw)
    assert.ok(!JSON.stringify(barProps).includes('undefined'))
  })

  test('스펙 키가 이미 rows에 있으면(원본 행) 복원을 건드리지 않는다', () => {
    const untouched = rowsFromWidgetProps({ data: raw }, { chartCode: 'pie', querySpec: pieSpec })
    assert.deepEqual(untouched, raw)
  })

  test('pie가 아니거나 스펙 키가 없으면 기존 동작 그대로다', () => {
    const asIs = [{ name: 'A', value: 1 }]
    assert.deepEqual(rowsFromWidgetProps({ data: asIs }, { chartCode: 'pie', querySpec: {} }), asIs)
    assert.deepEqual(rowsFromWidgetProps({ data: asIs }), asIs)
  })
})

// "2026년 4월 딜러별 실적을 라인차트로" — 항목 비교 축(딜러)에 선을 그리면 항목 사이에
// 없는 연속 관계가 있는 것처럼 보인다. 선/영역은 시간 축일 때만 제안한다(챗봇 파이프라인의
// 막대 폴백과 같은 원칙). 이 회귀가 풀리면 "딜러가 x축인 선차트"가 다시 생긴다.
describe('선/영역은 시간 축에서만 제안된다', () => {
  const byDealer = [
    { dealer_name: '렉서스 강남', activity_cnt: 42 },
    { dealer_name: '토요타 분당', activity_cnt: 31 },
  ]
  const byMonth = [
    { time_month: '2026-01', activity_cnt: 10 },
    { time_month: '2026-02', activity_cnt: 12 },
    { time_month: '2026-03', activity_cnt: 9 },
  ]

  test('딜러별(항목 축) 위젯에는 선/영역이 빠진다', () => {
    const options = chartCodeOptionsFor('bar', { labelKey: 'dealer_name', valueKey: 'activity_cnt' }, byDealer)
    assert.ok(!options.includes('line'))
    assert.ok(!options.includes('area'))
    assert.ok(options.includes('bar'))
  })

  test('딜러별 도넛에서도 선으로는 못 가고 막대로는 돌아갈 수 있다', () => {
    const options = chartCodeOptionsFor('pie', { labelKey: 'dealer_name', valueKey: 'activity_cnt' }, byDealer)
    assert.ok(!options.includes('line'))
    assert.ok(options.includes('bar'))
    assert.ok(options.includes('pie'))
  })

  test('월별(시간 축) 위젯에는 선/영역이 제안된다', () => {
    const options = chartCodeOptionsFor('bar', { xKey: 'time_month', yKeys: ['activity_cnt'] }, byMonth)
    assert.ok(options.includes('line'))
    assert.ok(options.includes('area'))
  })

  test('rows를 모르는 호출(챗봇 restyle)은 기존처럼 관대하다', () => {
    const options = chartCodeOptionsFor('bar', { labelKey: 'dealer_name', valueKey: 'activity_cnt' }, null)
    assert.ok(options.includes('line'))
  })
})
