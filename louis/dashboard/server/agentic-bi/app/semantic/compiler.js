// Deterministic Semantic Compiler — live ESM port of
// agentic_bi_design/app/semantic/compiler.js (same logic, verified there
// against 11+ metric/dimension combinations; see agentic_bi_design/tests/test_report.md
// for the 7 real bugs found and fixed during that verification pass).
import { loadRegistry } from './registry.js'

export class CompileError extends Error {
  constructor(message, code) {
    super(message)
    this.code = code
  }
}

function resolveTimeWindow(timeRange, currentDate) {
  // currentDate("YYYY-MM-DD")는 UTC 자정으로 파싱된다 — 월/연초 계산도 UTC getter/생성자로
  // 일관되게 처리해야 한다. 로컬(KST, UTC+9) getter로 연/월을 뽑고 로컬 Date 생성자로 만든
  // "월초"를 sqlDate()의 toISOString()(UTC)으로 직렬화하면 하루가 앞당겨지는 버그가 있었다
  // (예: currentDate=2026-07-24 -> 로컬 월초는 07-01 00:00 KST = 06-30 15:00 UTC -> "2026-06-30").
  const now = new Date(currentDate)
  if (timeRange.type === 'mtd' || (timeRange.type === 'relative' && timeRange.unit === 'month' && timeRange.value === 0)) {
    const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
    return { start, end: now, grain: 'month' }
  }
  if (timeRange.type === 'ytd') {
    const start = new Date(Date.UTC(now.getUTCFullYear(), 0, 1))
    return { start, end: now, grain: 'year' }
  }
  if (timeRange.type === 'relative') {
    const start = new Date(now)
    if (timeRange.unit === 'month') start.setMonth(start.getMonth() - timeRange.value)
    else if (timeRange.unit === 'day') start.setDate(start.getDate() - timeRange.value)
    else if (timeRange.unit === 'year') start.setFullYear(start.getFullYear() - timeRange.value)
    else if (timeRange.unit === 'week') start.setDate(start.getDate() - timeRange.value * 7)
    return { start, end: now, grain: timeRange.unit }
  }
  if (timeRange.type === 'absolute') {
    return { start: new Date(timeRange.start_date), end: new Date(timeRange.end_date), grain: 'day' }
  }
  throw new CompileError(`unsupported time_range.type: ${timeRange.type}`, 'unsupported_time_range')
}

function sqlDate(d) {
  return d.toISOString().slice(0, 10)
}

// GOLD SQL 원문은 전부 ktws.FCT_*/ktws.DIM_* 처럼 스키마를 명시한다(fabricClient의
// KPI_W DB에 dbo 기본 스키마가 아니라 ktws 스키마 아래 테이블이 있음 — 실제 Fabric
// 실행에서 "Invalid object name 'FCT_CONTRACT_KTWS'" 로 확인됨). FROM/JOIN의 객체 참조에만
// 붙이면 되고, 그 뒤의 컬럼 한정자(FCT_CONTRACT_KTWS.col)는 스키마 없이도 T-SQL에서
// 그대로 유효하다(별칭을 안 줬을 때는 베이스 오브젝트명으로 계속 한정 가능).
const SCHEMA = 'ktws'
function qualified(table) {
  return `${SCHEMA}.${table}`
}

function hasDirectEdge(registry, a, b) {
  for (const j of registry.joins.values()) {
    if (j.kind === 'EXISTS_SUBQUERY') continue
    if ((j.from.table === a && j.to.table === b) || (j.to.table === a && j.from.table === b)) return true
  }
  return false
}

function makeJoinResolver(registry, fromTable) {
  const joinedTables = new Set([fromTable])
  const joinClauses = []

  const adjacency = []
  for (const j of registry.joins.values()) {
    if (j.kind === 'EXISTS_SUBQUERY') continue
    adjacency.push({ a: j.from.table, b: j.to.table, sql: `LEFT JOIN ${qualified(j.to.table)} ON ${j.from.table}.${j.from.column} = ${j.to.table}.${j.to.column}` })
    adjacency.push({ a: j.to.table, b: j.from.table, sql: `LEFT JOIN ${qualified(j.from.table)} ON ${j.to.table}.${j.to.column} = ${j.from.table}.${j.from.column}` })
  }

  const isFactTable = (t) => t.startsWith('FCT_')

  function ensureJoined(targetTable) {
    if (joinedTables.has(targetTable)) return true
    const visited = new Set(joinedTables)
    const queue = [...joinedTables].map((t) => ({ table: t, path: [] }))
    while (queue.length) {
      const { table, path } = queue.shift()
      if (table !== fromTable && isFactTable(table)) continue
      const edges = adjacency.filter((e) => e.a === table)
      for (const e of edges) {
        if (visited.has(e.b)) continue
        const newPath = [...path, e]
        if (e.b === targetTable) {
          for (const step of newPath) {
            joinClauses.push(step.sql)
            joinedTables.add(step.b)
          }
          return true
        }
        visited.add(e.b)
        queue.push({ table: e.b, path: newPath })
      }
    }
    return false
  }

  return { ensureJoined, joinClauses, joinedTables }
}

export function compileSingleMetricQuery(ir, ctx) {
  const registry = loadRegistry()

  if (ir.metrics.length !== 1) {
    throw new CompileError(
      'compileSingleMetricQuery는 단일 metric만 지원 — 여러 metric은 orchestration 레이어에서 각각 컴파일 후 조합할 것',
      'multi_metric_not_supported'
    )
  }
  const metric = registry.metrics.get(ir.metrics[0])
  if (!metric) throw new CompileError(`unknown metric: ${ir.metrics[0]}`, 'unknown_metric')
  if (metric.status === 'unresolved' || metric.expression === 'unresolved') {
    throw new CompileError(`metric '${metric.id}'는 아직 expression이 unresolved — 컴파일 불가`, 'metric_not_compilable')
  }
  if (metric.not_directly_compilable) {
    throw new CompileError(`metric '${metric.id}'는 다른 metric의 재집계(aggregate-of-aggregate) 또는 EXISTS 상관 서브쿼리가 필요해 v1 컴파일러로 표현 불가${metric.not_directly_compilable_reason ? `: ${metric.not_directly_compilable_reason}` : ''}`, 'not_directly_compilable')
  }

  const dims = ir.dimensions || []
  if (dims.length > 1) {
    throw new CompileError('compileSingleMetricQuery는 dimension 1개까지만 지원', 'too_many_dimensions_for_v1')
  }
  const dimDef = dims[0] ? registry.dimensions.get(dims[0]) : null
  if (dims[0] && !dimDef) throw new CompileError(`unknown dimension: ${dims[0]}`, 'unknown_dimension')

  const timeWindow = resolveTimeWindow(ir.time_range, ctx.currentDate)

  const params = {}
  let paramIdx = 0
  const nextParam = (value) => {
    const name = `p${paramIdx++}`
    params[name] = value
    return `@${name}`
  }

  const fromTable = metric.base_table
  const { ensureJoined, joinClauses } = makeJoinResolver(registry, fromTable)

  const whereClauses = []

  for (const ruleId of metric.required_filters || []) {
    const rule = registry.filters.get(ruleId)
    if (!rule) throw new CompileError(`metric '${metric.id}'가 참조하는 filter rule '${ruleId}'을 찾을 수 없음`, 'missing_filter_rule')
    if (!rule.sql_fragment) {
      throw new CompileError(`filter rule '${ruleId}'은 sql_fragment가 없는 문서용 규칙 — required_filters에 직접 넣을 수 없음`, 'non_compilable_filter_rule')
    }
    if (rule.applies_to_entity) {
      const entity = registry.entities.get(rule.applies_to_entity)
      const table = entity?.source_tables?.[0]
      if (table && !ensureJoined(table)) {
        throw new CompileError(`filter rule '${ruleId}'에 필요한 테이블 '${table}'로 가는 조인 경로 없음`, 'unregistered_join_path')
      }
    }
    whereClauses.push(rule.sql_fragment)
  }

  // SC 스코프 필터는 fromTable에서 DIM_MNG_USER로 가는 "직접"(1-hop) 조인이 있을 때만
  // 주입한다 — 일반 ensureJoined() BFS를 그대로 쓰면 FCT_SALES_TARGET_DAILY(dealer_key만
  // 있고 sc_key가 없음)처럼 sc_key가 없는 팩트도 DIM_MNG_DEALER를 거쳐 DIM_MNG_USER까지
  // 도달해버린다 — 그런데 DIM_MNG_DEALER->DIM_MNG_USER는 1(딜러):다(SC) 관계라 팩트가
  // 이미 딜러 단위로 집계돼 있으면 SC 수만큼 조용히 팬아웃(중복 합산)된다. 직접 엣지가
  //있는 팩트(activity/lead/contract/target_m/target_d)만 안전하다고 보고, 나머지는
  // "SC와 무관한 팩트"로 취급해 조용히 건너뛴다(거짓으로 "제한 없음"을 주장하지 않으면서도
  // 관계 없는 필터를 억지로 붙이지 않음).
  const userDirectlyReachable = hasDirectEdge(registry, fromTable, 'DIM_MNG_USER')
  const dealerDirectlyReachable = hasDirectEdge(registry, fromTable, 'DIM_MNG_DEALER')
  if (userDirectlyReachable && ensureJoined('DIM_MNG_USER')) {
    for (const ruleId of ['br_exclude_front_sc', 'br_exclude_staff_names', 'br_exclude_test_users']) {
      whereClauses.push(registry.filters.get(ruleId).sql_fragment)
    }
  }
  if ((dealerDirectlyReachable || userDirectlyReachable) && ensureJoined('DIM_MNG_DEALER')) {
    whereClauses.push(registry.filters.get('br_dealer_scope').sql_fragment)
  }

  if (metric.metric_filter && metric.metric_filter !== 'unresolved') {
    whereClauses.push(metric.metric_filter)
  } else if (metric.metric_filter === 'unresolved') {
    throw new CompileError(`metric '${metric.id}'의 metric_filter가 unresolved — 컴파일 불가`, 'metric_filter_unresolved')
  }

  const timeCol = metric.time_dimension || null
  if (timeCol) {
    const startParam = nextParam(sqlDate(timeWindow.start))
    const endParam = nextParam(sqlDate(timeWindow.end))
    whereClauses.push(`${timeCol} BETWEEN ${startParam} AND ${endParam}`)
  }

  for (const f of ir.filters || []) {
    const dim = registry.dimensions.get(f.dimension)
    if (!dim) throw new CompileError(`unknown filter dimension: ${f.dimension}`, 'unknown_dimension')
    if (!ensureJoined(dim.column.table)) {
      throw new CompileError(`'${fromTable}' → '${dim.column.table}' 조인 경로가 joins.yaml에 등록되어 있지 않음`, 'unregistered_join_path')
    }
    const col = `${dim.column.table}.${dim.column.column}`
    if (f.operator === 'in') {
      whereClauses.push(`${col} IN (${f.values.map((v) => nextParam(v)).join(', ')})`)
    } else if (f.operator === 'not_in') {
      whereClauses.push(`${col} NOT IN (${f.values.map((v) => nextParam(v)).join(', ')})`)
    } else if (f.operator === 'eq') {
      whereClauses.push(`${col} = ${nextParam(f.values[0])}`)
    } else if (f.operator === 'gte') {
      whereClauses.push(`${col} >= ${nextParam(f.values[0])}`)
    } else if (f.operator === 'lte') {
      whereClauses.push(`${col} <= ${nextParam(f.values[0])}`)
    } else if (f.operator === 'between') {
      whereClauses.push(`${col} BETWEEN ${nextParam(f.values[0])} AND ${nextParam(f.values[1])}`)
    }
  }

  const selectCols = []
  const groupByCols = []
  if (dimDef) {
    if (!ensureJoined(dimDef.column.table)) {
      throw new CompileError(`'${fromTable}' → '${dimDef.column.table}' 조인 경로가 joins.yaml에 등록되어 있지 않음`, 'unregistered_join_path')
    }
    const col = `${dimDef.column.table}.${dimDef.column.column}`
    selectCols.push(`${col} AS [${dimDef.id}]`)
    groupByCols.push(col)
  }
  selectCols.push(`${metric.expression} AS [${metric.id}]`)

  const sql = [
    `SELECT ${selectCols.join(', ')}`,
    `FROM ${qualified(fromTable)}`,
    ...joinClauses,
    whereClauses.length ? `WHERE ${whereClauses.join('\n  AND ')}` : '',
    groupByCols.length ? `GROUP BY ${groupByCols.join(', ')}` : '',
    ir.sort?.length ? `ORDER BY ${ir.sort.map((s) => `[${s.field}] ${s.direction.toUpperCase()}`).join(', ')}` : '',
  ].filter(Boolean).join('\n')

  return { sql, params, metricId: metric.id, metric }
}

export { resolveTimeWindow }
