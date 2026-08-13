// Deterministic Dynamic Compiler — 검증된 Physical Plan을 SQL로 바꾼다(지시 23장).
//
// LLM은 이 파일에 아무것도 쓰지 않는다. 여기 들어오는 것은 이미
// (a) 개념 → 컬럼 해석이 끝났고 (b) 관계가 런타임 프로브를 통과한 계획뿐이다.
// 값은 전부 드라이버 바인딩으로 나간다 — 값을 SQL 문자열에 끼워 넣는 경로가 없다.
//
// ── v1이 지원하는 범위 ──────────────────────────────────────────
//   COUNT / COUNT DISTINCT
//   root 팩트의 기간 조건
//   root 컬럼의 categorical 필터
//   1-hop 관계 너머 컬럼의 필터 (프로브 결과에 따라 JOIN 또는 EXISTS)
//   root 또는 검증된 1-hop 차원의 group by
//
// 지원하지 않는 것(의도적):
//   인증 지표 expression + 발견 조인의 결합 — 지표의 필터·조인 의미를 여기서 절반만
//   재현하면 "오류 없이 틀린 숫자"가 나온다. 그 조합은 REPORT_COMPOSED 또는
//   기존 Semantic Compiler가 담당한다.
// ────────────────────────────────────────────────────────────

export class CompileError extends Error {
  constructor(code, message) {
    super(message)
    this.name = 'CompileError'
    this.code = code
  }
}

// 대괄호로 감싸므로 이름 안에 ']'가 있으면 감싸기가 깨진다. 그 외에는 한글 컬럼 별칭
// (예: [건수])을 허용한다 — 결과 컬럼 이름은 사용자가 읽는 것이라 한글이 정상이다.
function ident(name) {
  if (!/^[A-Za-z0-9_가-힣 ]+$/.test(String(name))) throw new CompileError('bad_identifier', `허용되지 않은 식별자: ${name}`)
  return `[${name}]`
}

function qualified(full) {
  const parts = String(full).split('.')
  if (parts.length !== 2) throw new CompileError('bad_table', `테이블 이름 형식 오류: ${full}`)
  return `${ident(parts[0])}.${ident(parts[1])}`
}

function alias(full) {
  return String(full).split('.')[1]
}

const OPERATOR_SQL = {
  eq: (col, ps) => `${col} = ${ps[0]}`,
  in: (col, ps) => `${col} IN (${ps.join(', ')})`,
  gte: (col, ps) => `${col} >= ${ps[0]}`,
  lte: (col, ps) => `${col} <= ${ps[0]}`,
  between: (col, ps) => `${col} BETWEEN ${ps[0]} AND ${ps[1]}`,
}

/**
 * @param {object} plan Physical Plan
 *   {
 *     root_table, root_alias?,
 *     measure: {operation: 'count'|'count_distinct', column?},
 *     time: {column, start, end}|null,
 *     filters: [{mode:'direct'|'exists', table, column, operator, values,
 *                edge?: {left_key, right_key}, extra?: [{column, operator, values}]}],
 *     group_by: [{mode:'direct'|'joined', table, column, label, edge?}],
 *     limit?: number
 *   }
 * @returns {{sql: string, params: object, plan: object}}
 */
export function compileDynamicPlan(plan) {
  if (!plan?.root_table) throw new CompileError('no_root', 'root 테이블이 없습니다.')
  const rootAlias = alias(plan.root_table)

  const params = {}
  let idx = 0
  const bind = (value, type) => {
    const name = `dp${idx++}`
    params[name] = { type: type || (typeof value === 'number' ? 'int' : 'nvarchar'), value }
    return `@${name}`
  }

  const where = []
  const joins = []
  const joinedTables = new Set([plan.root_table])

  // ── 기간 ──
  if (plan.time?.column) {
    if (!plan.time.start || !plan.time.end) throw new CompileError('bad_time', '기간의 시작/끝이 모두 필요합니다.')
    where.push(`${ident(rootAlias)}.${ident(plan.time.column)} BETWEEN ${bind(plan.time.start, 'date')} AND ${bind(plan.time.end, 'date')}`)
  }

  // ── 필터 ──
  for (const f of plan.filters || []) {
    const build = OPERATOR_SQL[f.operator]
    if (!build) throw new CompileError('bad_operator', `지원하지 않는 연산자: ${f.operator}`)

    if (f.mode === 'exists') {
      if (!f.edge?.left_key || !f.edge?.right_key) throw new CompileError('bad_edge', 'EXISTS 조인에 키가 없습니다.')
      const sub = alias(f.table)
      const conds = [`${ident(sub)}.${ident(f.edge.right_key)} = ${ident(rootAlias)}.${ident(f.edge.left_key)}`]
      conds.push(build(`${ident(sub)}.${ident(f.column)}`, f.values.map((v) => bind(v))))
      for (const extra of f.extra || []) {
        const eBuild = OPERATOR_SQL[extra.operator]
        if (!eBuild) throw new CompileError('bad_operator', `지원하지 않는 연산자: ${extra.operator}`)
        conds.push(eBuild(`${ident(sub)}.${ident(extra.column)}`, extra.values.map((v) => bind(v))))
      }
      where.push(`EXISTS (SELECT 1 FROM ${qualified(f.table)} ${ident(sub)} WHERE ${conds.join(' AND ')})`)
      continue
    }

    if (f.table !== plan.root_table) {
      if (!f.edge?.left_key || !f.edge?.right_key) throw new CompileError('bad_edge', '조인 키가 없습니다.')
      if (!joinedTables.has(f.table)) {
        joins.push(`INNER JOIN ${qualified(f.table)} ${ident(alias(f.table))} ON ${ident(alias(f.table))}.${ident(f.edge.right_key)} = ${ident(rootAlias)}.${ident(f.edge.left_key)}`)
        joinedTables.add(f.table)
      }
    }
    const target = `${ident(alias(f.table))}.${ident(f.column)}`
    where.push(build(target, f.values.map((v) => bind(v))))
  }

  // ── 그룹 축 ──
  const selectCols = []
  const groupCols = []
  for (const g of plan.group_by || []) {
    if (g.table !== plan.root_table && !joinedTables.has(g.table)) {
      if (!g.edge?.left_key || !g.edge?.right_key) throw new CompileError('bad_edge', '그룹 축 조인 키가 없습니다.')
      joins.push(`LEFT JOIN ${qualified(g.table)} ${ident(alias(g.table))} ON ${ident(alias(g.table))}.${ident(g.edge.right_key)} = ${ident(rootAlias)}.${ident(g.edge.left_key)}`)
      joinedTables.add(g.table)
    }
    const expr = `${ident(alias(g.table))}.${ident(g.column)}`
    selectCols.push(`${expr} AS ${ident(g.label || g.column)}`)
    groupCols.push(expr)
  }

  // ── 측정 ──
  const op = plan.measure?.operation
  let measureSql
  if (op === 'count') {
    measureSql = 'COUNT(*)'
  } else if (op === 'count_distinct') {
    if (!plan.measure.column) throw new CompileError('no_distinct_key', 'COUNT DISTINCT에 셀 키가 없습니다.')
    measureSql = `COUNT(DISTINCT ${ident(rootAlias)}.${ident(plan.measure.column)})`
  } else {
    throw new CompileError('unsupported_measure', `v1 동적 컴파일러가 지원하지 않는 집계입니다: ${op}`)
  }
  selectCols.push(`${measureSql} AS ${ident('건수')}`)

  const sql = [
    `SELECT ${selectCols.join(', ')}`,
    `FROM ${qualified(plan.root_table)} ${ident(rootAlias)}`,
    ...joins,
    where.length ? `WHERE ${where.join('\n  AND ')}` : '',
    groupCols.length ? `GROUP BY ${groupCols.join(', ')}` : '',
    groupCols.length ? `ORDER BY ${measureSql} DESC` : '',
  ].filter(Boolean).join('\n')

  // 실행기가 다시 확인하지만, 컴파일러 자신도 자기가 만든 것이 SELECT인지 본다.
  if (!/^SELECT\b/i.test(sql.trimStart())) {
    throw new CompileError('not_select', '컴파일 결과가 SELECT가 아닙니다.')
  }
  return { sql, params, plan }
}
