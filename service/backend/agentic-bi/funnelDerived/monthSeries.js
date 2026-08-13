// 퍼널 GOLD를 달마다 돌려 월별 시리즈를 만든다.
//
// GOLD의 연·월 파라미터는 스칼라라 한 번에 한 달만 계산된다. 월 축이 붙은 질문은
// 그래서 GOLD 파생이 성립하지 않았고, 기존 컴파일러로 넘어가 값이 갈렸다
// (2026-08-05 실측, 2026-04 렉서스 강남: 기회 GOLD 1,350 vs 컴파일러 1,330,
// 계약 GOLD 264 vs 302). 단건으로 물으면 맞고 "월별로" 물으면 틀리는 종류의 오답이라
// 달마다 GOLD를 돌려 이어 붙인다.
//
// 달마다 SQL 본문은 동일하고 바인드만 다르다 — 그래서 저장된 위젯 재조회도
// 같은 SQL에 months 목록만 다시 먹이면 전체 기간이 복원된다.

import { queryFabricCertified } from '../../fabricClient.js'

const FABRIC_DB = 'KPI_W'

/**
 * @param {string} sql            달마다 공통인 GOLD 파생 SQL
 * @param {{time_month: string, params: object}[]} months
 * @param {{sourceKey: string, outputAlias?: string}} opts
 * @returns {Promise<object[]>} time_month 이 붙은 행 묶음
 */
export async function runFunnelMonthSeries(sql, months, { sourceKey, outputAlias } = {}) {
  const key = outputAlias && outputAlias !== sourceKey ? outputAlias : sourceKey
  const perMonth = await Promise.all(months.map(async ({ time_month, params }) => {
    const rows = await queryFabricCertified(FABRIC_DB, sql, params, { timeoutMs: 60000 })
    return rows.map((r) => {
      const { [sourceKey]: value, ...rest } = r
      return { ...rest, time_month, [key]: value }
    })
  }))
  return perMonth.flat()
}
