import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import { FUNNEL_METRICS } from './metricSpecs.js'
import { buildFromMetricIr } from './fromMetricIr.js'
import { listCompilableMetrics } from '../tools.js'
import { loadRegistry } from '../app/semantic/registry.js'

const IR = (metrics) => ({
  metrics,
  dimensions: [],
  filters: [],
  time_range: { type: 'absolute', start_date: '2026-04-01', end_date: '2026-04-30' },
})

describe('certified funnel metric catalog', () => {
  // 2026-08-03 leo: 기존에는 퍼널 표의 일부 원자값이 메트릭 명세에서 빠져 자연어 객체가 표 전체를 재현하지 못했다. 보고서의 모든 원자 컬럼이 인증 CTE 명세에 연결됐는지 검증한다.
  test('registers every funnel atomic value', () => {
    const columns = [
      '영업활동 건 수', '영업활동 당월 목표',
      '영업기회 건 수(당월활동실적)', '영업기회 건 수(당월전체실적)', '영업기회 당월 목표',
      '계약건수(당월활동실적)', '계약건수(당월전체실적)', '계약 당월 목표',
      '시승건수(당월활동실적/시승완료)', '시승건수(당월활동실적/시승취소건 제외)',
      '시승건수(당월전체실적/lead_key 기준)', '시승건수(당월전체실적/actual_cnt 기준)', '시승 당월 목표',
      '시승에서 계약으로 당월활동실적', '시승에서 계약으로 당월전체실적',
    ]
    const registered = new Set(Object.values(FUNNEL_METRICS).map((spec) => spec.report_column))
    for (const column of columns) assert.ok(registered.has(column), `missing funnel column: ${column}`)
  })

  // 2026-08-03 leo: 기존에는 시승 목표와 진행률 분자가 같은 일반 지표로 처리돼 퍼널 표의 서로 다른 모집단을 잃었다. 각 메트릭이 올바른 인증 CTE로 파생되는지 검증한다.
  test('maps testdrive target and progress numerator to distinct CTEs', () => {
    const target = buildFromMetricIr(IR(['testdrive_mtd_target']), { currentDate: '2026-07-31' })
    const progressActual = buildFromMetricIr(IR(['testdrive_mtd_total_actual']), { currentDate: '2026-07-31' })
    assert.equal(target.funnelMetricId, 'testdrive_target')
    assert.equal(progressActual.funnelMetricId, 'testdrive_total_actual_sum')
    assert.match(target.sql, /overall_td_target/)
    assert.match(progressActual.sql, /overall_td_total_actual_sum/)
  })

  // 2026-08-03 leo: 기존에는 인증 퍼널 메트릭이 후보 목록에서 빠져 LLM이 유사한 일반 지표로 대체했다. 모든 시승 관련 원자 지표와 진행률이 선택 후보인지 검증한다.
  test('exposes the new testdrive metrics to natural-language selection', () => {
    const ids = new Set(listCompilableMetrics().map((metric) => metric.id))
    for (const id of [
      'testdrive_mtd_actual',
      'testdrive_mtd_actual_form_basis',
      'testdrive_mtd_total_lead_actual',
      'testdrive_mtd_total_actual',
      'testdrive_mtd_target',
      'testdrive_progress_rate_mtd',
      'contract_mtd_testdrive_actual',
      'contract_mtd_testdrive_total_actual',
    ]) assert.ok(ids.has(id), `metric unavailable to LLM: ${id}`)
  })

  // 2026-08-03 leo: 기존에는 시승 진행률이 리드매칭 실적을 분자로 사용해 퍼널 표와 값이 달랐다. 전체실적 actual_cnt 기준 분자를 사용하도록 고정한다.
  test('uses the certified total-actual numerator for testdrive progress', () => {
    const metric = loadRegistry().metrics.get('testdrive_progress_rate_mtd')
    assert.equal(metric.numerator_metric, 'testdrive_mtd_total_actual')
    assert.equal(metric.denominator_metric, 'testdrive_mtd_target')
  })

  // 2026-08-04 leo: 계약 진행률이 일반 계약 실적 또는 실행 불가 SC 재집계값을 분자로 쓰면 PBIX와 모집단이 달라진다. cntrct_funnel_(mtd)_coalesce에 대응하는 인증 CTE를 쓰는지 검증한다.
  test('uses the certified coalesce numerator for contract progress', () => {
    const metric = loadRegistry().metrics.get('contract_progress_rate_mtd')
    const numerator = buildFromMetricIr(IR(['contract_mtd_progress_actual_funnel']), { currentDate: '2026-07-31' })

    assert.equal(metric.numerator_metric, 'contract_mtd_progress_actual_funnel')
    assert.equal(metric.denominator_metric, 'contract_mtd_target')
    assert.equal(numerator.funnelMetricId, 'contract_progress_actual')
    assert.match(numerator.sql, /overall_contract_progress_count/)
  })
})
