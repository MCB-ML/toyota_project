// 시간축(연/월/일) breakdown 회귀 테스트 — Node 내장 러너로 돌린다(외부 의존성 없음):
//   node --test server/agentic-bi/timeAxis.test.js
//
// 여기서 검증하는 핵심 불변식은 "지표마다 자기 기준 날짜 컬럼으로 쪼개진다"는 것이다.
// 같은 팩트 테이블(FCT_CONTRACT_KTWS)에 계약일과 출고일이 함께 있어서, 예전처럼 캘린더
// 테이블을 조인해 그룹핑하면 출고 지표가 조용히 계약일 기준으로 집계되던 문제가 있었다.
import { test, describe } from 'node:test'
import assert from 'node:assert/strict'

import { compileSingleMetricQuery, CompileError } from './app/semantic/compiler.js'
import { validateSemanticQuery } from './app/semantic/validator.js'
import { loadRegistry } from './app/semantic/registry.js'
import { applyTimeSeriesTransform } from './mergeMetricRows.js'

const CTX = { currentDate: '2026-07-28' }

function ir(metric, dimension, extra = {}) {
  return {
    metrics: [metric],
    dimensions: dimension ? [dimension] : [],
    filters: [],
    time_range: { type: 'absolute', start_date: '2025-01-01', end_date: '2025-12-31' },
    limit: 50,
    ...extra,
  }
}

describe('시간축 파생 — 지표마다 자기 날짜 컬럼을 쓴다', () => {
  test('출고 지표는 출고일(last_retail_sales_dt)로 월별 집계된다', () => {
    const { sql } = compileSingleMetricQuery(ir('delivery_ytd_actual', 'time_month'), CTX)
    assert.match(sql, /CONVERT\(char\(7\), FCT_CONTRACT_KTWS\.last_retail_sales_dt, 126\) AS \[time_month\]/)
    assert.match(sql, /GROUP BY CONVERT\(char\(7\), FCT_CONTRACT_KTWS\.last_retail_sales_dt, 126\)/)
  })

  test('계약 지표는 같은 팩트라도 계약일(contract_dt)로 집계된다', () => {
    const { sql } = compileSingleMetricQuery(ir('contract_ytd_actual', 'time_month'), CTX)
    assert.match(sql, /CONVERT\(char\(7\), FCT_CONTRACT_KTWS\.contract_dt, 126\)/)
    assert.doesNotMatch(sql, /last_retail_sales_dt, 126/)
  })

  test('시간축 breakdown은 캘린더 테이블을 조인하지 않는다', () => {
    const { sql } = compileSingleMetricQuery(ir('delivery_ytd_actual', 'time_month'), CTX)
    assert.doesNotMatch(sql, /DIM_CALENDAR_KTWS/)
  })

  test('연/일 grain도 같은 컬럼에서 파생된다', () => {
    const y = compileSingleMetricQuery(ir('delivery_ytd_actual', 'time_year'), CTX).sql
    const d = compileSingleMetricQuery(ir('delivery_ytd_actual', 'time_day'), CTX).sql
    assert.match(y, /CONVERT\(char\(4\), FCT_CONTRACT_KTWS\.last_retail_sales_dt, 112\) AS \[time_year\]/)
    assert.match(d, /CONVERT\(char\(10\), FCT_CONTRACT_KTWS\.last_retail_sales_dt, 23\) AS \[time_day\]/)
  })

  test('기간 필터는 raw 컬럼 BETWEEN을 유지한다(인덱스 사용)', () => {
    const { sql } = compileSingleMetricQuery(ir('delivery_ytd_actual', 'time_month'), CTX)
    assert.match(sql, /FCT_CONTRACT_KTWS\.last_retail_sales_dt BETWEEN @p\d+ AND @p\d+/)
  })

  test('시간축을 필터로도 쓸 수 있다', () => {
    const spec = ir('delivery_ytd_actual', null, {
      filters: [{ dimension: 'time_month', operator: 'in', values: ['2025-03'] }],
    })
    const { sql, params } = compileSingleMetricQuery(spec, CTX)
    assert.match(sql, /CONVERT\(char\(7\), FCT_CONTRACT_KTWS\.last_retail_sales_dt, 126\) IN \(@p\d+\)/)
    assert.ok(Object.values(params).includes('2025-03'))
  })

  test('기준 날짜가 없는 지표는 명확한 오류를 낸다', () => {
    assert.throws(
      () => compileSingleMetricQuery(ir('working_day_count_total', 'time_month'), CTX),
      (err) => err instanceof CompileError && err.code === 'metric_has_no_time_dimension',
    )
  })

  test('비시간축 breakdown은 기존 조인 경로 그대로다', () => {
    const { sql } = compileSingleMetricQuery(ir('delivery_ytd_actual', 'dealer'), CTX)
    assert.match(sql, /DIM_MNG_DEALER\.dealer_nm AS \[dealer\]/)
    assert.match(sql, /GROUP BY DIM_MNG_DEALER\.dealer_nm/)
  })

  // 2026-08-03 leo: 기존에는 시승 목표를 flat SQL로 직접 컴파일해 퍼널 GOLD와 필터 정의가 달라질 수 있었다. 해당 지표가 일반 컴파일러를 우회하고 인증 파생 경로로만 실행되는지 검증한다.
  test('인증 퍼널 시승 목표는 일반 SQL 컴파일을 허용하지 않는다', () => {
    assert.throws(
      () => compileSingleMetricQuery(ir('testdrive_mtd_target', null), CTX),
      (err) => err instanceof CompileError && err.code === 'metric_not_compilable',
    )
  })

  test('월별 계약 지표는 검증된 유효 사용자와 목표 원본을 따른다', () => {
    const query = (metric, filters = []) => compileSingleMetricQuery(ir(metric, 'time_month', { filters }), CTX).sql
    const actual = query('contract_mtd_actual', [{ dimension: 'brand', operator: 'in', values: ['LEXUS'] }])
    const cancelled = query('contract_mtd_cancelled')
    const total = query('contract_mtd_total_including_cancelled')
    const target = query('contract_mtd_target', [
      { dimension: 'brand', operator: 'in', values: ['LEXUS'] },
      { dimension: 'vehicle_year', operator: 'in', values: ['2026'] },
    ])

    for (const sql of [actual, cancelled, total, target]) {
      assert.match(sql, /INNER JOIN ktws\.DIM_MNG_USER/)
      assert.match(sql, /INNER JOIN ktws\.DIM_MNG_DEALER/)
      assert.match(sql, /facade_sc_yn IS NULL OR DIM_MNG_USER\.facade_sc_yn NOT LIKE/)
      assert.match(sql, /DIM_MNG_USER\.user_id IS NULL OR DIM_MNG_USER\.user_id NOT IN/)
      assert.doesNotMatch(sql, /dealer_nm IS NOT NULL/)
    }
    assert.match(actual, /SUM\(CASE WHEN FCT_CONTRACT_KTWS\.cancel_dt IS NULL/)
    assert.match(cancelled, /SUM\(CASE WHEN FCT_CONTRACT_KTWS\.cancel_dt IS NOT NULL/)
    assert.match(total, /SUM\(FCT_CONTRACT_KTWS\.cnt\)/)
    assert.match(target, /FROM ktws\.FCT_CRM_TARGET_M/)
    assert.match(target, /INNER JOIN ktws\.DIM_CRM_ACT_TYPE/)
    assert.match(target, /DIM_CRM_ACT_TYPE\.common_tp_nm = N'계약'/)
    assert.match(target, /DIM_MNG_USER\.BRAND IN \(@p\d+\)/)
    assert.doesNotMatch(target, /FCT_SALES_TARGET_DAILY|DIM_VEHIC_SPEC/)
  })
})

describe('검증기 — 시간 컬럼만 있으면 연/월/일이 열린다', () => {
  test('원래 막히던 질문(연누적 출고 월별)이 통과한다', () => {
    assert.equal(validateSemanticQuery(ir('delivery_ytd_actual', 'time_month')).ok, true)
  })

  test('비율 지표는 분자·분모가 시간 컬럼을 가지면 통과한다', () => {
    assert.equal(validateSemanticQuery(ir('delivery_ytd_achievement_rate', 'time_month')).ok, true)
  })

  test('시간 컬럼이 없으면 사유가 분명한 오류로 막힌다', () => {
    const r = validateSemanticQuery(ir('working_day_progress_ratio', 'time_month'))
    assert.equal(r.ok, false)
    assert.equal(r.errors[0].code, 'time_axis_unsupported')
  })

  test('비시간축 화이트리스트 검사는 그대로 살아있다', () => {
    // activity 지표에 등록되지 않은 차원(vehicle_model)은 계속 막혀야 한다.
    const r = validateSemanticQuery(ir('activity_mtd_actual', 'vehicle_model'))
    assert.equal(r.ok, false)
    assert.equal(r.errors[0].code, 'grain_incompatible')
  })

  test('time_dimension이 있는 모든 지표가 연/월/일 전부 통과한다', () => {
    const registry = loadRegistry()
    for (const [id, metric] of registry.metrics) {
      if (!metric.time_dimension) continue
      for (const dim of ['time_year', 'time_month', 'time_day']) {
        const r = validateSemanticQuery(ir(id, dim))
        assert.equal(r.ok, true, `${id} + ${dim} 이 막힘: ${JSON.stringify(r.errors)}`)
      }
    }
  })
})

describe('주기 경계 누적', () => {
  const rows = [
    { time_month: '2025-11', m: 1 },
    { time_month: '2025-12', m: 2 },
    { time_month: '2026-01', m: 4 },
    { time_month: '2026-02', m: 8 },
  ]

  test('연 경계에서 리셋된다', () => {
    const out = applyTimeSeriesTransform(rows, {
      dimId: 'time_month', metricIds: ['m'], transform: 'cumulative', resetPeriod: 'year',
    })
    assert.deepEqual(out.map((r) => r.m), [1, 3, 4, 12])
  })

  test('월 경계에서 리셋된다(일별 + 월누적 지표)', () => {
    const daily = [
      { time_day: '2026-01-30', m: 1 },
      { time_day: '2026-01-31', m: 2 },
      { time_day: '2026-02-01', m: 5 },
    ]
    const out = applyTimeSeriesTransform(daily, {
      dimId: 'time_day', metricIds: ['m'], transform: 'cumulative', resetPeriod: 'month',
    })
    assert.deepEqual(out.map((r) => r.m), [1, 3, 5])
  })

  test('resetPeriod를 안 주면 기존 단순 러닝섬과 동일하다', () => {
    const out = applyTimeSeriesTransform(rows, { dimId: 'time_month', metricIds: ['m'], transform: 'cumulative' })
    assert.deepEqual(out.map((r) => r.m), [1, 3, 7, 15])
  })

  test('입력 순서가 뒤섞여도 시간순으로 누적된다', () => {
    const shuffled = [rows[3], rows[0], rows[2], rows[1]]
    const out = applyTimeSeriesTransform(shuffled, {
      dimId: 'time_month', metricIds: ['m'], transform: 'cumulative', resetPeriod: 'year',
    })
    assert.deepEqual(out.map((r) => r.time_month), ['2025-11', '2025-12', '2026-01', '2026-02'])
    assert.deepEqual(out.map((r) => r.m), [1, 3, 4, 12])
  })

  test('증감률은 resetPeriod와 무관하게 기존 동작을 유지한다', () => {
    const out = applyTimeSeriesTransform(rows, {
      dimId: 'time_month', metricIds: ['m'], transform: 'mom_change_pct', resetPeriod: 'year',
    })
    assert.equal(out[0].m, null)
    assert.equal(out[1].m, 1)
  })
})
