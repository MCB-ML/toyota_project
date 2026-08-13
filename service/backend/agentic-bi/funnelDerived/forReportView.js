// 퍼널 프리셋(차트/표)이 쓸 값을 GOLD에서 그 grain으로 다시 계산해 준다.
//
// 왜 필요한가: 프리셋은 상세 행을 접어서 값을 만드는데, GOLD는 상세용 CTE와
// 합계용 overall_* CTE를 따로 두고 자격 조건도 다르게 건다. 그래서 상세를 아무리
// 잘 접어도 화면 숫자가 나오지 않는다. 2026-04 실측(브랜드 TOYOTA+LEXUS):
//   계약 목표  상세합 25,288 / 화면 3,161 (활동유형 8종에 반복돼 8배)
//   기회 실적  상세합  8,655 / 화면 8,728
// 여기서 overall_* CTE에 grain을 주입해 돌리면 딜러 단위까지 화면과 정확히 맞는다.
import { queryFabricCertified } from '../../fabricClient.js'
import { buildBindParameters } from '../../reports/executor.js'
import { getReport } from '../../reports/registry.js'
import { buildFunnelMetricSql } from './buildFunnelMetricSql.js'
import { GRAIN_COLUMNS } from './metricSpecs.js'
import { FUNNEL_CHANNEL_ACTIVITY_TYPES } from '../../reports/projection.js'

const DB = 'KPI_W'

export const derivedKey = (values) => values.map((v) => String(v ?? '')).join('')

/**
 * 채널(관계형성활동/SC활동/내방·내전/온라인유입)별 값을 GOLD에서 다시 계산한다.
 *
 * 채널은 grain이 아니라 필터다 — BI에서 상단 버튼을 누르면 페이지 전체가 그 활동유형으로
 * 다시 계산된다. 그래서 common_tp_nm을 걸어 채널마다 한 번씩 돌린다.
 * 상세 행을 채널별로 더하면 자격 조건이 더 엄격해 값이 작게 나온다.
 *
 * 채널 값의 합은 단계 합계와 같지 않다 — 한 리드가 여러 활동유형에 걸치고 단계 사이를
 * 이동하기 때문이다. BI도 같은 성질이라 맞추려 하지 않는다.
 *
 * @returns {{grain, byKey: Map<channel, Map<groupKey, object>>}|null}
 */
export async function deriveFunnelChannels(result, groupDimensions, columns = null) {
  const { contract } = getReport(result.reportId)
  const sem = contract.column_semantics || {}
  // 채널 × 컬럼마다 쿼리가 하나씩 나간다. 15개 전부 돌리면 60개가 되어 27초가 걸렸다 —
  // 호출부가 실제로 쓰는 컬럼만 넘기면 4채널 × 4컬럼 = 16개로 줄어든다.
  const want = columns ? new Set(columns) : null
  const wanted = Object.entries(sem)
    .filter(([column, spec]) => spec.derived_metric && (!want || want.has(column)))
    .map(([column, spec]) => ({ column, metric: spec.derived_metric }))
  if (wanted.length === 0) return null

  const grain = (groupDimensions || []).filter((d) => GRAIN_COLUMNS[d])
  if (grain.length !== (groupDimensions || []).length) return null

  const channels = Object.entries(FUNNEL_CHANNEL_ACTIVITY_TYPES)
  const jobs = []
  for (const [channel, types] of channels) {
    // 채널의 활동유형만 남긴 파라미터. GOLD는 콤마로 구분된 문자열 하나로 받는다.
    const bind = { ...buildBindParameters(contract, result.params || {}) }
    bind.common_tp_nm = { type: 'nvarchar', value: types.join(',') }
    for (const { column, metric } of wanted) {
      jobs.push({ channel, column, metric, bind })
    }
  }

  const settled = await Promise.all(jobs.map(async (job) => {
    try {
      const sql = buildFunnelMetricSql(job.metric, grain, { valueAlias: job.column })
      return { ...job, rows: await queryFabricCertified(DB, sql, job.bind, { timeoutMs: 60000 }) }
    } catch {
      return { ...job, rows: null }
    }
  }))

  const byKey = new Map()
  let filled = 0
  for (const { channel, column, rows } of settled) {
    if (!rows) continue
    filled += 1
    if (!byKey.has(channel)) byKey.set(channel, new Map())
    const perGroup = byKey.get(channel)
    for (const row of rows) {
      const key = derivedKey(grain.map((d) => row[GRAIN_COLUMNS[d]]))
      if (!perGroup.has(key)) perGroup.set(key, {})
      perGroup.get(key)[column] = Number(row[column]) || 0
    }
  }
  return filled > 0 ? { grain, byKey } : null
}

/**
 * @param result           executeReport 결과
 * @param groupDimensions  프리셋이 묶는 차원(예: ['브랜드','딜러'])
 * @returns {{grain: string[], byKey: Map<string, object>}|null}
 *   null이면 파생으로 채울 수 없는 요청이다 — 호출부는 기존 합산 결과를 그대로 쓴다.
 */
export async function deriveFunnelMeasures(result, groupDimensions) {
  const { contract } = getReport(result.reportId)
  const sem = contract.column_semantics || {}

  const wanted = Object.entries(sem)
    .filter(([, spec]) => spec.derived_metric)
    .map(([column, spec]) => ({ column, metric: spec.derived_metric }))
  if (wanted.length === 0) return null

  // GOLD가 나눌 수 있는 축만 남긴다. 활동유형처럼 DISTINCT가 분할되지 않는 축은
  // 애초에 GRAIN_COLUMNS에 없다 — 그런 grain이 섞이면 파생을 쓰지 않는다.
  const grain = (groupDimensions || []).filter((d) => GRAIN_COLUMNS[d])
  if (grain.length !== (groupDimensions || []).length) return null

  const bind = buildBindParameters(contract, result.params || {})

  // 지표마다 한 번씩 돌지만 서로 독립이라 동시에 보낸다 — 순차로 하면 9배 느리다.
  const settled = await Promise.all(wanted.map(async ({ column, metric }) => {
    try {
      // 값 컬럼을 리포트의 컬럼명으로 내보내 아래에서 그대로 덮어쓸 수 있게 한다.
      const sql = buildFunnelMetricSql(metric, grain, { valueAlias: column })
      const rows = await queryFabricCertified(DB, sql, bind, { timeoutMs: 60000 })
      return { column, rows }
    } catch {
      return { column, rows: null }   // 하나 실패해도 나머지는 살린다
    }
  }))

  // 리포트 합계 행이 곧 정답이다 — 파생값을 다 더한 값과 맞는지 대조한다.
  // 동시 조회 중 드물게 값이 0으로 오는 것을 관찰했는데(원인은 Fabric 쪽으로 보이며
  // 재현이 안 된다), 0은 "진짜 0"과 구분되지 않아 조용히 틀린 표가 나간다.
  // 합계와 어긋나는 컬럼은 아예 쓰지 않고 기존 합산값을 남긴다.
  const totalRow = result.rows.find((row) => {
    const rule = contract.total_row?.detect_by
    return rule && row[rule.column] === rule.equals
  })

  const byKey = new Map()
  const filled = []
  const rejected = []
  for (const { column, rows } of settled) {
    if (!rows) { rejected.push(`${column}(조회 실패)`); continue }

    if (totalRow) {
      const expected = Number(totalRow[column])
      const got = rows.reduce((sum, row) => sum + (Number(row[column]) || 0), 0)
      if (Number.isFinite(expected) && got !== expected) {
        rejected.push(`${column}(합 ${got} ≠ 합계행 ${expected})`)
        continue
      }
    }

    filled.push(column)
    for (const row of rows) {
      const key = derivedKey(grain.map((d) => row[GRAIN_COLUMNS[d]]))
      if (!byKey.has(key)) byKey.set(key, {})
      byKey.get(key)[column] = Number(row[column]) || 0
    }
  }
  return filled.length > 0 ? { grain, byKey, filled, rejected } : null
}
