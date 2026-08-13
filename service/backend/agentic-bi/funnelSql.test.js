// 퍼널 지표 SQL 구조 회귀 테스트:
//   node --test server/agentic-bi/funnelSql.test.js
//
// 이 두 지표는 조건 하나만 빠져도 값이 조용히 달라진다(에러가 안 남). 라이브 조회로만
// 확인하면 회귀를 못 잡으므로, GOLD v3와 맞춘 조건들이 SQL에 실제로 들어가는지 문자열로
// 고정한다. 예전 구현에서 빠져 있던 것 3가지 — 월별 상대 기간 / SC 상관 / 활동유형 상관.
import { test, describe } from 'node:test'
import assert from 'node:assert/strict'

import { buildLeadActualSql, buildContractActualSql } from './funnelSql.js'
import { loadRegistry } from './app/semantic/registry.js'
import { CompileError } from './app/semantic/compiler.js'

const registry = loadRegistry()
const RANGE = { startDate: '2025-01-01', endDate: '2025-12-31' }

function leadSql(over = {}) {
  const ir = { metrics: ['lead_mtd_actual'], dimensions: [], filters: [], ...over }
  return buildLeadActualSql({ ir, metric: registry.metrics.get('lead_mtd_actual'), registry, ...RANGE })
}
function contractSql(over = {}) {
  const ir = { metrics: ['contract_mtd_activity_actual'], dimensions: [], filters: [], ...over }
  return buildContractActualSql({ ir, metric: registry.metrics.get('contract_mtd_activity_actual'), registry, ...RANGE })
}

describe('기회실적 — GOLD lead_actual 구조', () => {
  test('자격활동 기간이 조회구간이 아니라 그 리드의 달이다', () => {
    const sql = leadSql()
    assert.match(sql, /act_dt_fr >= DATEFROMPARTS\(YEAR\(FCT_LEAD\.lead_reg_dt\), MONTH\(FCT_LEAD\.lead_reg_dt\), 1\)/)
    assert.match(sql, /act_dt_fr <= EOMONTH\(FCT_LEAD\.lead_reg_dt\)/)
    // 자격활동 조건에 조회구간 리터럴이 들어가면 예전(구간 전체 창) 회귀다.
    const existsBlock = sql.slice(sql.indexOf('EXISTS ('))
    assert.doesNotMatch(existsBlock, /act_dt_fr BETWEEN '2025-01-01'/)
  })

  test('리드 오픈 판정도 그 리드의 달 말일 기준이다', () => {
    assert.match(leadSql(), /close_dt > EOMONTH\(FCT_LEAD\.lead_reg_dt\)/)
  })

  test('SC 상관·활동유형 상관은 걸지 않는다 — Power BI 측정값 기준', () => {
    // GOLD v3는 11개 시각적 개체를 한 쿼리로 합치면서 이 상관 조건을 붙였는데,
    // Power BI 측정값에는 없다. 걸면 화면보다 적게 나온다(2026-04 재직: −45, −27).
    // 되살아나면 챗봇 숫자가 다시 화면과 어긋나므로 부재를 고정한다.
    const sql = leadSql()
    assert.doesNotMatch(sql, /FCT_ACTIVITY_v2\.sc_key = FCT_LEAD\.cl_sc_key/)
    assert.doesNotMatch(sql, /act\.common_tp_nm = lct\.common_tp_nm/)
  })

  test('비상관 IN (풀) 방식이 사라졌다', () => {
    assert.doesNotMatch(leadSql(), /lead_key IN \(/)
  })

  test('등록된 필터 규칙을 그대로 쓴다(부재중 제외, 관계형성/기회창출)', () => {
    const sql = leadSql()
    assert.match(sql, /act\.tp_grp_1 IN \(N'관계형성', N'기회창출'\)/)
    assert.match(sql, /act_result <> N'부재중'/)
  })
})

describe('계약실적 — GOLD cntrct_actual 구조', () => {
  test('리드가 계약월 안에 등록됐는지 상관으로 확인한다', () => {
    const sql = contractSql()
    assert.match(sql, /l\.lead_key = FCT_CONTRACT_KTWS\.lead_key/)
    assert.match(sql, /l\.lead_reg_dt >= DATEFROMPARTS\(YEAR\(FCT_CONTRACT_KTWS\.contract_dt\)/)
    assert.match(sql, /l\.lead_reg_dt <= EOMONTH\(FCT_CONTRACT_KTWS\.contract_dt\)/)
  })

  test('리드·활동 양쪽에 SC 상관과 활동유형 상관이 있다', () => {
    // 검증된 1-1 GOLD(funnel_full_structure)의 contract_activity_count가 갖고 있는 조건:
    //   INNER JOIN lead_activity_pool ON I.lead_key = LP.lead_key AND I.cn_sc_key = LP.sc_key
    //   INNER JOIN valid_type ON I.tp_key = IVT.tp_key AND IVT.common_tp_nm = LP.common_tp_nm
    //
    // 2026-07-29에 이 둘을 뺐다가(브랜드 필터가 빠진 스크린샷을 기준으로 삼은 실수)
    // 계약이 +52 과다가 됐다. 되살아나면 다시 틀리므로 존재를 고정한다.
    //   상관 없음 1,586 → 유형 상관 1,539 → SC 상관까지 1,533 (1-1 리포트 1,534)
    const sql = contractSql()
    assert.match(sql, /l\.cl_sc_key = FCT_CONTRACT_KTWS\.cn_sc_key/)      // 리드 쪽 SC
    assert.match(sql, /lct\.common_tp_nm = ct\.common_tp_nm/)             // 리드 쪽 유형
    assert.match(sql, /FCT_ACTIVITY_v2\.sc_key = FCT_CONTRACT_KTWS\.cn_sc_key/) // 활동 쪽 SC
    assert.match(sql, /act\.common_tp_nm = ct\.common_tp_nm/)             // 활동 쪽 유형
  })

  test('계약실적의 자격활동에는 활동그룹·부재중을 걸지 않는다 (기회실적과 다름)', () => {
    // 상관 조건 2개만 복원하면 값이 맞는다 — 활동그룹·부재중까지 걸면 과소 집계된다.
    // 기회실적은 반대로 이 둘을 걸어야 맞는다(8,728 = 웹 BI 일치). 정의가 서로 다르다.
    const sql = contractSql()
    const actBlock = sql.slice(sql.indexOf('AND EXISTS ('))
    assert.doesNotMatch(actBlock, /tp_grp_1/)
    assert.doesNotMatch(actBlock, /부재중/)
    // 기회실적 쪽에는 남아있어야 한다.
    assert.match(leadSql(), /tp_grp_1 IN \(N'관계형성', N'기회창출'\)/)
    assert.match(leadSql(), /act_result <> N'부재중'/)
  })

  test('EXISTS 2중 중첩이고 비상관 풀 방식이 아니다', () => {
    const sql = contractSql()
    assert.equal((sql.match(/EXISTS \(/g) || []).length, 2)
    assert.doesNotMatch(sql, /lead_key IN \(/)
  })

  test('취소 제외 조건이 없다 — GOLD 일치(의도된 변경)', () => {
    // GOLD의 cntrct_actual에는 cancel_dt 조건이 없다. 예전 구현은 걸고 있었고,
    // "GOLD와 완전히 일치" 결정으로 뺐다. 되살아나면 값이 다시 갈리므로 고정한다.
    assert.doesNotMatch(contractSql(), /cancel_dt/)
  })
})

describe('차원(breakdown) 처리', () => {
  test('시간축은 캘린더 조인 없이 앵커 날짜에서 파생한다', () => {
    const lead = leadSql({ dimensions: ['time_month'] })
    assert.match(lead, /CONVERT\(char\(7\), FCT_LEAD\.lead_reg_dt, 126\) AS \[time_month\]/)
    assert.match(lead, /GROUP BY CONVERT\(char\(7\), FCT_LEAD\.lead_reg_dt, 126\)/)
    assert.doesNotMatch(lead, /DIM_CALENDAR_KTWS/)

    const contract = contractSql({ dimensions: ['time_month'] })
    assert.match(contract, /CONVERT\(char\(7\), FCT_CONTRACT_KTWS\.contract_dt, 126\)/)
    assert.doesNotMatch(contract, /DIM_CALENDAR_KTWS/)
  })

  test('활동유형은 DIM_CRM_ACT_TYPE_ORDER를 조인해 쓴다', () => {
    const sql = contractSql({ dimensions: ['activity_type'] })
    assert.match(sql, /INNER JOIN ktws\.DIM_CRM_ACT_TYPE_ORDER ON ct\.common_tp_nm = DIM_CRM_ACT_TYPE_ORDER\.common_tp_nm/)
    assert.match(sql, /GROUP BY DIM_CRM_ACT_TYPE_ORDER\.common_tp_nm/)
  })

  test('SC/딜러 차원은 이미 조인된 테이블을 쓴다', () => {
    assert.match(leadSql({ dimensions: ['sales_consultant'] }), /GROUP BY DIM_MNG_USER\.name/)
    assert.match(leadSql({ dimensions: ['dealer'] }), /GROUP BY DIM_MNG_DEALER\.dealer_nm/)
  })

  test('조인하지 않는 테이블의 차원은 깨진 SQL 대신 명확한 오류를 낸다', () => {
    assert.throws(
      () => leadSql({ dimensions: ['vehicle_model'] }),
      (e) => e instanceof CompileError && e.code === 'unsupported_funnel_dimension',
    )
  })
})

describe('필터', () => {
  test('딜러 필터 값이 이스케이프되어 들어간다', () => {
    const sql = leadSql({ filters: [{ dimension: 'dealer', operator: 'in', values: ["렉서스 강남", "O'Brien"] }] })
    assert.match(sql, /DIM_MNG_DEALER\.dealer_nm IN \(N'렉서스 강남', N'O''Brien'\)/)
  })

  test('사용자·딜러 스코프(GOLD elig_user)가 항상 붙는다', () => {
    const sql = leadSql()
    assert.match(sql, /창구SC/)
    assert.match(sql, /고객지원팀/)
    assert.match(sql, /dealer_nm IS NOT NULL/)
  })
})

describe('계약전환률 지표 등록', () => {
  test('영업기회→계약 전환율이 퍼널 지표를 분자·분모로 쓴다', () => {
    const m = registry.metrics.get('lead_to_contract_conversion_rate')
    assert.ok(m, '지표가 등록되어 있어야 한다')
    assert.equal(m.numerator_metric, 'contract_mtd_activity_actual')
    assert.equal(m.denominator_metric, 'lead_mtd_actual')
    assert.equal(m.format, 'percentage')
    assert.equal(m.zero_denominator_result, null)
  })
})
