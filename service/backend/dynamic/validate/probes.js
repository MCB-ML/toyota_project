// Probe Executor + Cardinality/Fanout Validator (지시 19장).
//
// 발견한 관계를 그대로 실행하지 않는다. 본 쿼리 앞에 작고 읽기 전용인 집계 하나를 던져
// **실제 데이터에서** 행이 몇 배로 불어나는지 센다. 이름과 타입이 맞다는 것은 관계가
// 있다는 뜻이지 grain이 보존된다는 뜻이 아니다.
//
// 비용 통제: 기간 조건을 프로브에도 그대로 걸고, 집계만 돌려받는다(행을 가져오지 않는다).
import { queryFabricCertified } from '../../fabricClient.js'

export const VERDICT = {
  SAFE: 'SAFE',              // grain 보존 — 그대로 조인해도 된다
  FANOUT: 'FANOUT',          // 행이 불어난다 — EXISTS/semi-join으로 바꿔야 한다
  NO_MATCH: 'NO_MATCH',      // 붙는 행이 없다 — 조인해도 결과가 0이 된다
  UNKNOWN: 'UNKNOWN',        // 프로브를 못 돌렸다
}

// 이 배수를 넘으면 팬아웃으로 본다. 1.0을 조금 넘는 것도 팬아웃이다 —
// 5% 부풀어 오른 숫자는 눈으로 안 걸린다.
const FANOUT_THRESHOLD = 1.0001

function ident(name) {
  if (!/^[A-Za-z0-9_]+$/.test(String(name))) throw new Error(`허용되지 않은 식별자: ${name}`)
  return `[${name}]`
}

function qualified(full) {
  const [schema, table] = String(full).split('.')
  if (!schema || !table) throw new Error(`테이블 이름 형식 오류: ${full}`)
  return `${ident(schema)}.${ident(table)}`
}

/**
 * root 테이블에 edge를 붙였을 때 행이 몇 배가 되는지 잰다.
 *
 * @param {object} edge {from, to, left_key, right_key}
 * @param {object} scope {column, start, end} root의 기간 조건 — 프로브 비용을 여기서 줄인다
 * @returns {{verdict, root_rows, joined_rows, matched_root_rows, fanout_ratio, match_ratio, sql}}
 */
export async function probeJoinCardinality(edge, {
  database = 'KPI_W',
  scope = null,
  extraPredicate = null,
  query = queryFabricCertified,
} = {}) {
  const root = qualified(edge.from)
  const target = qualified(edge.to)
  const params = {}
  const where = []
  if (scope?.column && scope?.start && scope?.end) {
    params.probe_start = { type: 'date', value: scope.start }
    params.probe_end = { type: 'date', value: scope.end }
    where.push(`r.${ident(scope.column)} BETWEEN @probe_start AND @probe_end`)
  }
  if (extraPredicate?.sql) {
    where.push(extraPredicate.sql)
    Object.assign(params, extraPredicate.params || {})
  }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : ''

  const sql = `
SELECT
  (SELECT COUNT(*) FROM ${root} r ${whereSql}) AS root_rows,
  (SELECT COUNT(*) FROM ${root} r
     INNER JOIN ${target} t ON r.${ident(edge.left_key)} = t.${ident(edge.right_key)}
   ${whereSql}) AS joined_rows,
  (SELECT COUNT(*) FROM ${root} r
   ${whereSql}${whereSql ? ' AND' : 'WHERE'} EXISTS (
     SELECT 1 FROM ${target} t WHERE t.${ident(edge.right_key)} = r.${ident(edge.left_key)})) AS matched_root_rows`

  let row
  try {
    const rows = await query(database, sql, params)
    row = rows[0]
  } catch (err) {
    return { verdict: VERDICT.UNKNOWN, error: err.message, sql }
  }

  const rootRows = Number(row?.root_rows ?? 0)
  const joinedRows = Number(row?.joined_rows ?? 0)
  const matched = Number(row?.matched_root_rows ?? 0)
  const fanoutRatio = matched > 0 ? Number((joinedRows / matched).toFixed(4)) : 0
  const matchRatio = rootRows > 0 ? Number((matched / rootRows).toFixed(4)) : 0

  let verdict = VERDICT.SAFE
  if (matched === 0) verdict = VERDICT.NO_MATCH
  else if (fanoutRatio > FANOUT_THRESHOLD) verdict = VERDICT.FANOUT

  return {
    verdict,
    root_rows: rootRows,
    joined_rows: joinedRows,
    matched_root_rows: matched,
    fanout_ratio: fanoutRatio,
    match_ratio: matchRatio,
    threshold: FANOUT_THRESHOLD,
    sql,
  }
}

/**
 * 프로브 결과로 조인 방식을 정한다.
 *
 * 팬아웃이 났다고 COUNT(DISTINCT)로 덮지 않는다(지시 20장). 필터로만 쓰는 조인이면
 * EXISTS로 바꾸면 grain이 그대로 보존된다 — 숨기는 게 아니라 의미를 맞추는 것이다.
 *
 * @param {'filter'|'projection'} usage 그 조인을 조건으로만 쓰는가, 값을 꺼내 쓰는가
 */
export function chooseJoinMode(probe, usage) {
  if (probe.verdict === VERDICT.SAFE) {
    return { mode: 'JOIN', reason: `팬아웃 없음(배수 ${probe.fanout_ratio})` }
  }
  if (probe.verdict === VERDICT.FANOUT) {
    if (usage === 'filter') {
      return { mode: 'EXISTS', reason: `팬아웃 ${probe.fanout_ratio}배 — 조건으로만 쓰므로 EXISTS로 바꿔 grain을 보존합니다.` }
    }
    return {
      mode: 'BLOCKED',
      reason: `팬아웃 ${probe.fanout_ratio}배인데 이 조인에서 값을 꺼내 써야 합니다. `
        + `EXISTS로 바꿀 수 없고, DISTINCT로 덮으면 조용히 다른 숫자가 됩니다.`,
    }
  }
  if (probe.verdict === VERDICT.NO_MATCH) {
    return { mode: 'BLOCKED', reason: '이 관계로 붙는 행이 하나도 없습니다 — 관계가 잘못됐을 가능성이 높습니다.' }
  }
  return { mode: 'BLOCKED', reason: `관계를 검증하지 못했습니다(${probe.error || '원인 불명'}).` }
}
