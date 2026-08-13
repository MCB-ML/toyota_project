// GOLD 파생 값과 인증 리포트 값을 대조한다 — 라이브 DB가 필요해 npm test 에 넣지 않는다.
//
//   node backend/reports/parity.mjs                 # 기본(2026-04, 전사)
//   node backend/reports/parity.mjs --year 2026 --month 4 --dealer "렉서스 강남"
//   node backend/reports/parity.mjs --grain 딜러    # 축을 나눠도 합이 맞는지
//
// 왜 필요한가: 파생 경로는 GOLD의 CTE를 잘라 다시 조립한다. 조립기를 넓힐 때마다
// 정의가 조용히 갈릴 수 있고, 그건 오류가 아니라 **다른 숫자**로 나타난다.
// 2026-08-05 실측 사례: 월 축이 붙으면 파생이 성립하지 않아 기존 컴파일러로 넘어갔고
// 영업기회가 1,350 대신 1,330, 계약이 264 대신 302로 나왔다. 이 하네스는 그런 어긋남을
// 사람이 눈으로 찾지 않고 잡기 위한 것이다.
//
// 대조 기준은 metricSpecs.js 의 report_column — funnel_full_structure(퍼널 전체 구조)
// 리포트의 합계 행이다. 파생 CTE를 잘라온 바로 그 GOLD라, 여기서 어긋나면 조립이 틀린 것이다.
import 'dotenv/config'

import { buildFunnelMetricSql } from '../agentic-bi/funnelDerived/buildFunnelMetricSql.js'
import { FUNNEL_METRICS } from '../agentic-bi/funnelDerived/metricSpecs.js'
import { queryFabricCertified } from '../fabricClient.js'
import { executeReport } from './executor.js'

const args = process.argv.slice(2)
const flag = (name, fallback = null) => {
  const i = args.indexOf(`--${name}`)
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback
}

const YEAR = Number(flag('year', '2026'))
const MONTH = Number(flag('month', '4'))
const DEALER = flag('dealer')
const GRAIN = flag('grain') ? flag('grain').split(',').map((s) => s.trim()) : []

const bindFor = () => ({
  year: { type: 'int', value: YEAR },
  month: { type: 'int', value: MONTH },
  day: { type: 'int', value: null },
  brand: { type: 'nvarchar', value: null },
  dealer_nm: { type: 'nvarchar', value: DEALER },
  group_name: { type: 'nvarchar', value: null },
  dept_nm: { type: 'nvarchar', value: null },
  active_yn: { type: 'nvarchar', value: null },
  sc_name: { type: 'nvarchar', value: null },
  common_tp_nm: { type: 'nvarchar', value: null },
})

const num = (v) => (v === null || v === undefined || v === '' ? null : Number(v))

/**
 * 인증 리포트의 합계 행. GOLD가 grand_total CTE로 직접 만들어 집계구분='합계'로 표시한다
 * (계약 total_row.detect_by). 상세를 더해서 만들지 않는다 — 목표처럼 상위 grain에서
 * 반복되는 컬럼이 섞여 있어 더하면 부풀려진다.
 */
async function certifiedTotals() {
  const result = await executeReport('funnel_full_structure', {
    year: [String(YEAR)],
    month: [String(MONTH)],
    ...(DEALER ? { dealer_nm: [DEALER] } : {}),
  })
  const totals = result.rows.filter((r) => String(r['집계구분'] ?? '') === '합계')
  if (!totals.length) return { row: null, rowCount: result.rows.length }
  return { row: totals[totals.length - 1], rowCount: result.rows.length }
}

async function derivedTotal(metricId) {
  const sql = buildFunnelMetricSql(metricId, GRAIN, { valueAlias: 'v' })
  const rows = await queryFabricCertified('KPI_W', sql, bindFor(), { timeoutMs: 60000 })
  // grain을 나눠도 합계는 같아야 한다 — 이게 축을 넓힐 때 깨지는지 보는 지점이다.
  return rows.reduce((s, r) => s + (num(r.v) ?? 0), 0)
}

const scope = [`${YEAR}-${String(MONTH).padStart(2, '0')}`, DEALER || '전사', GRAIN.length ? `grain=[${GRAIN}]` : 'grain=[]']
console.log(`대조 범위: ${scope.join(' · ')}\n`)

const { row, rowCount } = await certifiedTotals()
if (!row) {
  console.log(`인증 리포트에서 합계 행을 찾지 못했습니다 (상세 ${rowCount}행). 조건을 바꿔 보세요.`)
  process.exit(1)
}

const results = []
for (const [metricId, spec] of Object.entries(FUNNEL_METRICS)) {
  const expected = num(row[spec.report_column])
  if (expected === null) { results.push({ metricId, spec, skip: '리포트에 컬럼 없음' }); continue }
  try {
    const actual = await derivedTotal(metricId)
    results.push({ metricId, spec, expected, actual, ok: actual === expected })
  } catch (error) {
    results.push({ metricId, spec, expected, error: error.message.slice(0, 60) })
  }
}

const pad = (s, n) => String(s).padEnd(n)
const money = (v) => (v === null || v === undefined ? '-' : Number(v).toLocaleString('ko-KR'))
console.log(`${pad('지표', 38)}${pad('리포트', 12)}${pad('파생', 12)}판정`)
console.log('-'.repeat(74))
for (const r of results) {
  if (r.skip) { console.log(`${pad(r.metricId, 38)}${pad('-', 24)}건너뜀 (${r.skip})`); continue }
  if (r.error) { console.log(`${pad(r.metricId, 38)}${pad(money(r.expected), 12)}${pad('-', 12)}오류: ${r.error}`); continue }
  const verdict = r.ok ? '일치' : `불일치 (차 ${money(r.actual - r.expected)})`
  console.log(`${pad(r.metricId, 38)}${pad(money(r.expected), 12)}${pad(money(r.actual), 12)}${verdict}`)
}

const compared = results.filter((r) => !r.skip && !r.error)
const failed = compared.filter((r) => !r.ok)
console.log('-'.repeat(74))
console.log(`대조 ${compared.length}건 · 일치 ${compared.length - failed.length} · 불일치 ${failed.length}`
  + `${results.some((r) => r.error) ? ` · 오류 ${results.filter((r) => r.error).length}` : ''}`)
process.exit(failed.length ? 1 : 0)
