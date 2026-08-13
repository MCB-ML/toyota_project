// 인증 리포트 GOLD에서 CTE를 이름별로 잘라내고 의존 관계를 세운다.
//
// 왜 파싱까지 하나: 지표별 SQL을 손으로 옮겨 적으면 GOLD가 바뀔 때 조용히 갈린다.
// 실제로 그 일이 있었다 — 독립 SQL로 계산한 계약목표가 560,790, GOLD 합계는 3,161이었다.
// 여기서 뽑아 쓰면 정의가 한 곳(GOLD)에만 존재한다.

/**
 * 문자열 리터럴과 주석을 건너뛰며 괄호 깊이를 세는 스캐너.
 * 단순 정규식으로는 CTE 본문 안의 서브쿼리 괄호나 N',' 안의 괄호에서 깨진다.
 */
function scan(sql, start, onDepthZero) {
  let depth = 0
  for (let i = start; i < sql.length; i += 1) {
    const c = sql[i]
    if (c === "'") { // 문자열 리터럴 — '' 이스케이프 포함
      i += 1
      while (i < sql.length && !(sql[i] === "'" && sql[i + 1] !== "'")) i += sql[i] === "'" ? 2 : 1
      continue
    }
    if (c === '-' && sql[i + 1] === '-') { while (i < sql.length && sql[i] !== '\n') i += 1; continue }
    if (c === '/' && sql[i + 1] === '*') { i = sql.indexOf('*/', i); if (i < 0) return sql.length; i += 1; continue }
    if (c === '(') depth += 1
    else if (c === ')') {
      depth -= 1
      if (depth === 0) return i
    } else if (depth === 0 && onDepthZero && onDepthZero(c, i)) return i
  }
  return -1
}

/**
 * `;WITH a AS (...), b AS (...) SELECT ...` 를 이름 → 본문으로 쪼갠다.
 * 본문은 바깥 괄호를 뺀 알맹이다.
 */
export function parseCtes(sql) {
  const withIdx = sql.search(/;?\s*\bWITH\b/i)
  if (withIdx < 0) throw new Error('WITH 절을 찾지 못했습니다 — GOLD 구조가 바뀌었습니다.')

  const ctes = new Map()
  const re = /(^|[\s,;])([a-zA-Z_][a-zA-Z_0-9]*)\s+AS\s*\(/g
  re.lastIndex = withIdx

  let m = re.exec(sql)
  while (m) {
    const name = m[2]
    const open = m.index + m[0].length - 1
    const close = scan(sql, open)
    if (close < 0) throw new Error(`CTE ${name}의 괄호가 닫히지 않았습니다.`)
    // 서브쿼리 안의 "X AS (" 는 CTE가 아니다 — 이미 담은 CTE 본문 범위에 들어가면 건너뛴다.
    const inside = [...ctes.values()].some((c) => open > c.start && close < c.end)
    if (!inside) ctes.set(name, { name, body: sql.slice(open + 1, close), start: open, end: close })
    re.lastIndex = close
    m = re.exec(sql)
  }
  if (ctes.size === 0) throw new Error('CTE를 하나도 찾지 못했습니다.')
  return ctes
}

/** 본문에서 다른 CTE 이름을 참조하는지 훑어 의존 목록을 만든다. */
export function dependenciesOf(cte, ctes) {
  const deps = new Set()
  for (const name of ctes.keys()) {
    if (name === cte.name) continue
    // FROM/JOIN 뒤에 오는 이름만 의존으로 본다(컬럼명과 우연히 겹치는 경우 배제).
    const re = new RegExp(`\\b(?:FROM|JOIN)\\s+${name}\\b`, 'i')
    if (re.test(cte.body)) deps.add(name)
  }
  return [...deps]
}

/**
 * 주어진 CTE들을 실행하는 데 필요한 CTE 전부를, 선언 순서를 지켜 돌려준다.
 * (SQL Server의 WITH는 앞에 선언된 것만 참조할 수 있다)
 */
export function collectRequired(rootNames, ctes) {
  const need = new Set()
  const visit = (name) => {
    if (need.has(name)) return
    const cte = ctes.get(name)
    if (!cte) throw new Error(`GOLD에 없는 CTE입니다: ${name}`)
    need.add(name)
    for (const d of dependenciesOf(cte, ctes)) visit(d)
  }
  for (const n of rootNames) visit(n)
  return [...ctes.keys()].filter((n) => need.has(n))
}

/**
 * `SELECT <집계> AS cnt FROM ...` 형태의 CTE 본문에 grain 컬럼과 GROUP BY를 넣는다.
 *
 * overall_* CTE들은 GROUP BY가 없는 전사 집계라 이 변환만으로 임의 grain이 된다 —
 * 상세 행을 더하는 게 아니라 그 grain에서 집계를 다시 하는 것이라 DISTINCT도 정확하다.
 */
export function injectGrain(body, selectExprs, groupExprs, { distinct = false } = {}) {
  if (selectExprs.length === 0) return body

  const kw = distinct ? /SELECT\s+DISTINCT\s/i : /SELECT\s/i
  const m = body.match(kw)
  if (!m) throw new Error(`SELECT${distinct ? ' DISTINCT' : ''}를 찾지 못했습니다: ${body.slice(0, 60)}`)
  const at = m.index + m[0].length

  const withCols = `${body.slice(0, at)}${selectExprs.join(', ')}, ${body.slice(at)}`
  if (groupExprs.length === 0) return withCols

  // GROUP BY는 본문 맨 끝에 붙인다. overall_* 본문에는 ORDER BY가 없다(테스트가 고정).
  return `${withCols}\n    GROUP BY ${groupExprs.join(', ')}`
}
