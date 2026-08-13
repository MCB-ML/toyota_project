import assert from 'node:assert/strict'
import { test } from 'node:test'

import { resolveReportRequest, SC_DISPLAY } from './agentic-bi/reportIntent.js'
import { getReport } from './reports/registry.js'

test('월별 계약 판매성취도는 선언된 열 가지 객체 필터를 보존하고 SC 열을 포함한다', () => {
  const resolved = resolveReportRequest({
    report_id: 'sales_achievement_contract',
    sc_display: SC_DISPLAY.TEAM_LEVEL,
    year: 2026,
    object_filter_dimension_ids: [
      'brand', 'dealer', 'showroom', 'department', 'active_status',
      'sales_consultant', 'vehicle_model', 'vehicle_variant', 'vehicle_year', 'grade_sfx',
    ],
  }, '2026년 월별 계약판매성취도를 표로 보여주고 필터를 만들어줘')

  assert.equal(resolved.needsClarification, false)
  assert.equal(resolved.params.ScName, 'ALL')
  assert.deepEqual(resolved.objectFilterFields, ['브랜드', '딜러', '전시장', '팀', '재직여부', 'SC', '모델', '차종', '연식', 'SFX'])
  assert.deepEqual(resolved.groupBy, ['월', '브랜드', '딜러', '전시장', '팀', '재직여부', 'SC', '모델', '차종', '연식', 'SFX'])
})
test('월별 계약 인증 리포트는 MTD 기준 및 검증된 유효 사용자 경로를 사용한다', () => {
  const { sqlText } = getReport('sales_achievement_contract')

  assert.match(sqlText, /F\.contract_dt >= A\.month_start/)
  assert.doesNotMatch(sqlText, /F\.contract_dt >= A\.year_start/)
  assert.match(sqlText, /A\.common_tp_nm = N'계약'/)
  assert.match(sqlText, /INNER JOIN ktws\.DIM_MNG_USER\s+U\s+ON F\.sc_key\s+= U\.sc_key/)
  assert.match(sqlText, /ISNULL\(T\.mval, 0\) AS tgt_mtd/)
  assert.doesNotMatch(sqlText, /ROWS UNBOUNDED PRECEDING\) AS tgt_ytd/)
})
