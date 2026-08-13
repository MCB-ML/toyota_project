// 지표 + grain → GOLD에서 파생된 SQL.
//
// 두 가지를 보장한다:
//   1. 계산식은 GOLD의 CTE를 그대로 쓴다(옮겨 적지 않는다).
//   2. grain=[] 이면 GOLD 합계 행과 같은 값이 나온다 — 상세를 더하지 않고
//      그 grain에서 집계를 다시 하므로 DISTINCT 카운트도 정확하다.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { parseCtes, collectRequired, injectGrain } from './cteGraph.js'
import { FUNNEL_METRICS, GRAIN_COLUMNS } from './metricSpecs.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const GOLD_PATH = path.resolve(__dirname, '..', '..', 'reports', 'sql', 'funnel_full_structure.sql')

let cache = null
function gold() {
  if (!cache) {
    const sql = fs.readFileSync(GOLD_PATH, 'utf8')
    cache = { sql, ctes: parseCtes(sql), header: sql.slice(0, sql.search(/;?\s*\bWITH\b/i)) }
  }
  return cache
}

/** 테스트에서 GOLD를 다시 읽게 한다. */
export function resetGoldCache() { cache = null }

export function listFunnelMetrics() {
  return Object.entries(FUNNEL_METRICS).map(([id, s]) => ({ id, ...s }))
}

/**
 * @param {string} metricId  FUNNEL_METRICS의 키
 * @param {string[]} grain   ['딜러'] 등. []이면 전사 합계 한 줄.
 * @param {object} opts
 *   valueAlias   값 컬럼 이름(기본 'value'). 지표 경로는 metric id를 쓴다.
 *   grainAliases grain 이름 → 출력 컬럼 이름. 지표 경로는 dimension id를 쓴다.
 */
export function buildFunnelMetricSql(metricId, grain = [], { valueAlias = 'value', grainAliases = {} } = {}) {
  const spec = FUNNEL_METRICS[metricId]
  if (!spec) throw new Error(`퍼널 파생 지표가 아닙니다: ${metricId} (가능: ${Object.keys(FUNNEL_METRICS).join(', ')})`)

  const unknown = grain.filter((g) => !GRAIN_COLUMNS[g])
  if (unknown.length) {
    throw new Error(`이 지표로 나눌 수 없는 단위입니다: ${unknown.join(', ')} (가능: ${Object.keys(GRAIN_COLUMNS).join(', ')})`)
  }

  const { ctes, header } = gold()
  const names = collectRequired([spec.aggregate_cte], ctes)
  const cols = grain.map((g) => GRAIN_COLUMNS[g])

  // grain을 넣을 CTE를 정한다. pool을 거치는 지표는 pool에 먼저 넣고,
  // 집계 CTE는 pool이 내보낸 컬럼을 그대로 GROUP BY 한다.
  const viaPool = spec.grain_source !== 'vu'
  const rendered = names.map((name) => {
    const cte = ctes.get(name)
    if (cols.length === 0) return `${name} AS (${cte.body})`

    if (name === spec.grain_source && viaPool) {
      // pool: VU에서 컬럼을 끌어와 DISTINCT 목록에 추가한다.
      const body = injectGrain(cte.body, cols.map((c) => `VU.${c}`), [], { distinct: true })
      return `${name} AS (${body})`
    }
    if (name === spec.aggregate_cte) {
      const src = viaPool ? cols : cols.map((c) => `VU.${c}`)
      const body = injectGrain(cte.body, src, src)
      return `${name} AS (${body})`
    }
    return `${name} AS (${cte.body})`
  })

  const projected = grain.map((g, i) => {
    const alias = grainAliases[g]
    return alias && alias !== cols[i] ? `${cols[i]} AS [${alias}]` : cols[i]
  })
  const selectCols = [...projected, `cnt AS [${valueAlias}]`].join(', ')
  const orderBy = cols.length ? `\nORDER BY ${cols.join(', ')}` : ''

  return `${header};WITH ${rendered.join(',\n')}
SELECT ${selectCols}
FROM ${spec.aggregate_cte}${orderBy}`
}
