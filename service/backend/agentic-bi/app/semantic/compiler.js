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
const TIME_GRAIN_SQL = {
  year: (col) => `CONVERT(char(4), ${col}, 112)`,
  month: (col) => `CONVERT(char(7), ${col}, 126)`,
  day: (col) => `CONVERT(char(10), ${col}, 23)`,
}

export function timeGrainExpr(grain, col) {
  const build = TIME_GRAIN_SQL[grain]
  if (!build) throw new CompileError(`unsupported time grain: ${grain}`, 'unsupported_time_grain')
  return build(col)
}

function resolveDimensionSqlExpr(dimDef, metric, ensureJoined, fromTable) {
  if (dimDef.derive_grain) {
    if (!metric.time_dimension) {
      throw new CompileError(
        `metric '${metric.id}' has no time_dimension, so '${dimDef.id}' cannot be used as a time breakdown`,
        'metric_has_no_time_dimension'
      )
    }
    return timeGrainExpr(dimDef.derive_grain, metric.time_dimension)
  }
  // 지표는 팩트별 차원 경로를 별도로 선언할 수 있다.
  // 공통 차원 기본값보다 먼저 적용해야 팩트 grain이 다른 지표도 올바른 경로로 집계된다.
  const column = metric.dimension_overrides?.[dimDef.id] || dimDef.column
  if (!ensureJoined(column.table)) {
    throw new CompileError(`'${fromTable}' -> '${column.table}' join path is not registered in joins.yaml`, 'unregistered_join_path')
  }
  return `${column.table}.${column.column}`
}

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

function makeJoinResolver(registry, fromTable, { requiredInnerJoinTables = [] } = {}) {
  const requiredInnerJoins = new Set(requiredInnerJoinTables)
  const joinedTables = new Set([fromTable])
  const joinClauses = []

  const adjacency = []
  for (const j of registry.joins.values()) {
    if (j.kind === 'EXISTS_SUBQUERY') continue
    const joinKeyword = (targetTable) => requiredInnerJoins.has(targetTable) ? 'INNER JOIN' : 'LEFT JOIN'
    adjacency.push({ a: j.from.table, b: j.to.table, sql: `${joinKeyword(j.to.table)} ${qualified(j.to.table)} ON ${j.from.table}.${j.from.column} = ${j.to.table}.${j.to.column}` })
    adjacency.push({ a: j.to.table, b: j.from.table, sql: `${joinKeyword(j.from.table)} ${qualified(j.from.table)} ON ${j.to.table}.${j.to.column} = ${j.from.table}.${j.from.column}` })
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

  const dims = [...new Set((ir.dimensions || []).filter(Boolean))]
  if (dims.length > 4) {
    throw new CompileError('compileSingleMetricQuery는 dimension 4개까지만 지원', 'too_many_dimensions')
  }
  const dimDefs = dims.map((dimensionId) => {
    const dimension = registry.dimensions.get(dimensionId)
    if (!dimension) throw new CompileError(`unknown dimension: ${dimensionId}`, 'unknown_dimension')
    return { id: dimensionId, ...dimension }
  })

  const timeWindow = resolveTimeWindow(ir.time_range, ctx.currentDate)

  const params = {}
  let paramIdx = 0
  const nextParam = (value) => {
    const name = `p${paramIdx++}`
    params[name] = value
    return `@${name}`
  }

  const fromTable = metric.base_table
  const { ensureJoined, joinClauses } = makeJoinResolver(registry, fromTable, {
    requiredInnerJoinTables: metric.required_inner_join_tables || [],
  })
  // 2026-08-05 leo: 모든 카탈로그 조인을 INNER JOIN으로 바꾸지 않고도 지표별 관계 존재를 강제한다.
  // 월별 계약 지표는 유효 사용자 모집단을 맞추기 위해 이 규칙을 사용한다.
  for (const table of metric.required_inner_join_tables || []) {
    if (!ensureJoined(table)) {
      throw new CompileError(`metric '${metric.id}' requires inner join table '${table}', but no join path is registered`, 'unregistered_join_path')
    }
  }

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
  // 2026-08-05 leo: PBIX 월별 계약 지표는 일반 유효 사용자 제외 규칙은 적용하되,
  // 전역 딜러명 비어 있지 않음 조건은 쓰지 않는다. 두 정책을 독립 선언해 원본 모집단을 정확히 맞춘다.
  const applyDefaultScScope = metric.apply_default_sc_scope !== false
  const applyDefaultDealerScope = metric.apply_default_dealer_scope !== false
  const userDirectlyReachable = hasDirectEdge(registry, fromTable, 'DIM_MNG_USER')
  const dealerDirectlyReachable = hasDirectEdge(registry, fromTable, 'DIM_MNG_DEALER')
  if (applyDefaultScScope && userDirectlyReachable && ensureJoined('DIM_MNG_USER')) {
    for (const ruleId of ['br_exclude_front_sc', 'br_exclude_staff_names', 'br_exclude_test_users']) {
      whereClauses.push(registry.filters.get(ruleId).sql_fragment)
    }
  }
  if (applyDefaultDealerScope && (dealerDirectlyReachable || userDirectlyReachable) && ensureJoined('DIM_MNG_DEALER')) {
    whereClauses.push(registry.filters.get('br_dealer_scope').sql_fragment)
  }

  if (metric.metric_filter && metric.metric_filter !== 'unresolved') {
    // 2026-08-03 leo: 기존에는 metric_filter가 다른 테이블 컬럼을 참조해도 조인을 보장하지 않아 실행 시 컬럼 오류가 났다. 메트릭 선언의 의존 테이블을 먼저 조인해 일반 컴파일 경로를 안전하게 만든다.
    for (const table of metric.metric_filter_tables || []) {
      if (!ensureJoined(table)) {
        throw new CompileError(
          `metric '${metric.id}'의 metric_filter에 필요한 테이블 '${table}'로 가는 조인 경로가 등록되어 있지 않음`,
          'unregistered_join_path'
        )
      }
    }
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

  const ignoredFilterDimensions = new Set(metric.ignored_filter_dimensions || [])
  for (const f of ir.filters || []) {
    // 2026-08-05 leo: 상위 grain 지표는 차량 필터를 비적용으로 선언할 수 있다.
    // 선언된 차원만 건너뛰어 필터를 숨기거나 잘못된 팩트 조인을 시도하지 않으면서 PBIX 동작을 보존한다.
    if (ignoredFilterDimensions.has(f.dimension)) continue
    const dim = registry.dimensions.get(f.dimension)
    if (!dim) throw new CompileError(`unknown filter dimension: ${f.dimension}`, 'unknown_dimension')
    const col = resolveDimensionSqlExpr({ id: f.dimension, ...dim }, metric, ensureJoined, fromTable)
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
  const appliedImpliedFilters = new Set()
  for (const dimDef of dimDefs) {
    const col = resolveDimensionSqlExpr(dimDef, metric, ensureJoined, fromTable)
    selectCols.push(`${col} AS [${dimDef.id}]`)
    groupByCols.push(col)
    // dimensions.yaml의 implies_filter — 이 dimension으로 breakdown/필터할 때만 조건부로
    // 딸려오는 스코프 필터(예: activity_subgroup -> br_dashboard_activity_subgroup_scope).
    // 모든 metric에 전역으로 박아두면 근거 없이 수치가 바뀌므로, 그 dimension을 실제로
    // 쓸 때만 주입한다 — filters.yaml 해당 rule의 note 참고.
    if (dimDef.implies_filter && !appliedImpliedFilters.has(dimDef.implies_filter)) {
      const impliedRule = registry.filters.get(dimDef.implies_filter)
      if (impliedRule?.sql_fragment) whereClauses.push(impliedRule.sql_fragment)
      appliedImpliedFilters.add(dimDef.implies_filter)
    }
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
