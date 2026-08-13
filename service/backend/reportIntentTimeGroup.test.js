import assert from 'node:assert/strict'
import { test } from 'node:test'

import { resolveReportRequest, SC_DISPLAY } from './agentic-bi/reportIntent.js'
import { DIMENSION_ALIASES, rollupReportRows } from './reports/projection.js'
import { getReport } from './reports/registry.js'

test('월별 인증 리포트는 group_by 누락 시에도 월 단위로 롤업한다', () => {
  const resolved = resolveReportRequest(
    { report_id: 'sales_achievement_contract', sc_display: SC_DISPLAY.TEAM_LEVEL, year: 2026 },
    '2026년 월별 계약의 타겟, 실적, 취소와 달성률을 차트로 보여줘',
  )

  assert.deepEqual(resolved.groupBy, ['월'])
  assert.deepEqual(DIMENSION_ALIASES.월, ['MonthAbbr'])
})

test('월 축 별칭 상세 행은 월별 롤업에서 하나의 시간 축 행으로 합쳐진다', () => {
  const { contract } = getReport('sales_achievement_contract')
  const measures = Object.fromEntries(Object.keys(contract.column_semantics).map((column) => [column, 1]))
  const dimensions = Object.fromEntries(contract.dimension_columns.branch_a.map((column) => [column, '공통']))
  const result = {
    reportId: 'sales_achievement_contract',
    branch: 'a',
    dimensionColumns: contract.dimension_columns.branch_a,
    rows: [
      { ...dimensions, MonthAbbr: 'Jan', 모델: '모델 A', ...measures },
      { ...dimensions, MonthAbbr: 'Jan', 모델: '모델 B', ...measures },
    ],
  }

  const rolled = rollupReportRows(result, ['월'])
  assert.equal(rolled.rows.length, 1)
  assert.equal(rolled.rows[0].MonthAbbr, 'Jan')
})

test('월별 계약 달성률은 실적과 취소를 함께 분자로 다시 계산한다', () => {
  const dimensions = {
    연도: 2026, MonthAbbr: 'Apr', 브랜드: '렉서스', 딜러: '렉서스 강남', 전시장: '강남', 팀: '영업1팀', 재직여부: '재직',
  }
  const result = {
    reportId: 'sales_achievement_contract',
    branch: 'a',
    dimensionColumns: ['연도', 'MonthAbbr', '브랜드', '딜러', '전시장', '팀', '재직여부', '모델'],
    rows: [
      { ...dimensions, 모델: '모델 A', 실적: 10, 취소: 2, 타겟: 100, 달성률: 0.12 },
      { ...dimensions, 모델: '모델 B', 실적: 15, 취소: 3, 타겟: 100, 달성률: 0.18 },
    ],
  }

  const { rows: [row] } = rollupReportRows(result, ['월'])
  assert.equal(row.실적, 25)
  assert.equal(row.취소, 5)
  assert.equal(row.타겟, 100, '차량 상세 행에 반복된 목표는 한 번만 집계한다')
  assert.equal(row.달성률, 0.3, '(실적 25 + 취소 5) / 타겟 100')
})
