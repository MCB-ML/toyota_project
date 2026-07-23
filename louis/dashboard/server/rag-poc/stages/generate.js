import { streamAssistantTurn } from '../../azureStream.js'
import { buildFragmentSqlTool } from '../ragTools.js'
import { loadTableSchema } from '../../schemaLoader.js'
import { renderResolvedParams } from './structure.js'

function renderTableColumns(inputTables) {
  return inputTables
    .map(key => {
      const [db, id] = key.split('::')
      const schema = loadTableSchema({ db, id })
      if (!schema) return `- ${db}.${id}: (스키마 조회 실패)`
      const cols = (schema.columns || []).map(c => c.name).join(', ')
      return `- ${schema.database}.${schema.schema}.${schema.table}: ${cols}`
    })
    .join('\n')
}

function renderUpstream(upstreamSteps) {
  if (!upstreamSteps.length) return '(없음 — 이 단계는 실제 테이블만 참조합니다)'
  return upstreamSteps
    .map(s => `- ${s.cte_name}(${(s.output_columns || []).join(', ') || '컬럼 미상'}) — 이미 만들어진 CTE, 이름 그대로 참조하세요`)
    .join('\n')
}

// Stage 7 — generate ONE fragment's SQL body in isolation. The prompt intentionally contains
// nothing about sibling patterns/fragments — only this fragment's own reference template,
// its business rules, its input tables' real columns, and upstream CTE names it may
// reference. This is the direct fix for the old pipeline's bug: cramming ~20 competing
// full-SQL examples into one prompt made the model drop CTEs it had "seen" but wasn't
// focused on reproducing.
export async function generateStepSql(client, deployment, { query, step, fragment, rules, upstreamSteps, resolvedParams, repairContext }) {
  const rulesText = rules.length
    ? rules.map(r => `- ${r.term}: ${r.description}${r.condition_expression ? ` (\`${r.condition_expression}\`)` : ''}`).join('\n')
    : '(해당 없음)'
  const upstreamText = renderUpstream(upstreamSteps)
  const columnsText = renderTableColumns(fragment.input_tables || [])
  const paramsText = renderResolvedParams(resolvedParams)

  const outputColumnsText = (fragment.output_columns || []).length
    ? fragment.output_columns.join(', ')
    : '(정해진 출력 컬럼 없음)'

  const cteRule = fragment.self_contained
    ? '3. **이 fragment는 self_contained입니다 — 참고 템플릿 자체가 이미 완결된 다중 CTE(`;WITH ... SELECT`) 쿼리입니다.** 템플릿에 있는 모든 CTE 정의를 하나도 빠짐없이 그대로 포함하고, 마지막 SELECT까지 통째로 재현하세요 — 일부 CTE만 남기거나 마지막 SELECT만 뽑아내지 마세요. 리터럴만 아래 확정된 파라미터 값으로 교체합니다.'
    : '3. 새로운 CTE를 만들거나 WITH 키워드를 쓰지 마세요 — 오직 이 fragment의 SELECT 문 하나만 작성합니다.'

  const system = `당신은 이 SQL Fragment 하나만 작성하는 에이전트입니다. 아래 참고 템플릿은 검증된 GOLD SQL에서 그대로 가져온 것입니다. **반드시 지킬 것:**
1. 참고 템플릿의 조인(FROM/JOIN) 대상과 구조를 그대로 유지하세요 — 템플릿에 없는 테이블/CTE를 새로 조인하지 마세요(아래 "참조 가능한 상위 CTE"에 나열된 것이라도, 템플릿이 실제로 참조하지 않으면 조인하지 마세요).
2. 출력 컬럼은 정확히 "# 이 fragment가 반드시 출력해야 하는 컬럼"과 개수·순서·별칭이 일치해야 합니다 — SELECT COUNT(*)처럼 별칭 없는 표현식을 쓰지 마세요(다운스트림 SQL 조각이 이 컬럼명으로 참조합니다).
${cteRule}
4. **WHERE 절 조건은 참고 템플릿에 있는 것만 쓰세요 — "확정된 파라미터 값"은 템플릿이 이미 그 종류의 조건(연월/딜러 등)을 걸고 있을 때 그 리터럴을 교체하는 용도일 뿐입니다.** 템플릿에 연월/딜러 조건이 아예 없다면(예: 전체 기간·전체 딜러 합계를 의도한 목록형 쿼리), 사용자가 명시적으로 요청하지 않은 이상 새로 추가하지 마세요 — 없는 조건을 임의로 추가하면 합계 범위가 좁아져 오답이 됩니다.
5. **"확정된 파라미터 값"의 "미지정" 목록에 있는 종류(딜러/브랜드/그룹/부서)의 조건이 템플릿에 있다면, 그 리터럴을 유지하지 말고 WHERE 조건 자체를 통째로 삭제하세요.** 템플릿의 리터럴(예: 특정 딜러명)은 이 fragment를 검증할 때 쓴 예시일 뿐 실제 요청 값이 아닙니다 — 미지정인데 그 예시 리터럴을 그대로 남겨두면 사용자가 요청하지 않은 범위로 결과가 좁아져 오답이 됩니다.

# 이 fragment가 반드시 출력해야 하는 컬럼
${outputColumnsText}

# 확정된 파라미터 값 (반드시 이 값을 그대로 사용 — 같은 질문을 처리하는 다른 SQL 조각들도 전부 이 동일한 값을 쓰므로, 여기서 벗어나면 조각끼리 날짜/조건이 어긋나 조립된 SQL 전체가 깨집니다.)
${paramsText}

# 이 fragment의 역할
${fragment.description}

# 참고 SQL 템플릿 (조인 구조와 출력 컬럼을 그대로 유지, 리터럴만 위 확정된 파라미터 값으로 교체)
\`\`\`sql
${fragment.sql_template}
\`\`\`

# 적용되는 업무 규칙
${rulesText}

# 사용 가능한 실제 테이블/컬럼
${columnsText || '(이 fragment는 실제 테이블을 직접 참조하지 않습니다 — 아래 상위 CTE만 참조)'}

# 참조 가능한 상위 CTE (이름 그대로 사용, 이 CTE들의 SQL은 이미 다른 곳에서 생성됨)
${upstreamText}
${repairContext ? `\n# 이전 시도 오류 — 반드시 수정할 것\n${repairContext}` : ''}`

  const [call] = await streamAssistantTurn(client, {
    model: deployment,
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: query },
    ],
    tools: buildFragmentSqlTool(!!fragment.self_contained),
    toolChoice: { type: 'function', function: { name: 'generate_fragment_sql' } },
  })

  return { step_id: step.step_id, cte_name: step.cte_name, sql_body: call?.args?.sql_body || null }
}

// Stage 8 — pure JS, no LLM. Assembles `WITH cte1 AS (...), cte2 AS (...), <final select>`.
// `topN` is injected into the terminal SELECT here (not by Stage 7) so the same step results
// can be recomposed at topN:1 for Stage 9b's cheap validation vs. the real answer's topN.
// `topN` defaults to null (no cap) — a blind TOP 100 either wastes the cap on small aggregates
// or silently truncates real listings. Callers that WANT a cap (Stage 9b's cheap probe) pass
// topN explicitly; the real answer relies on queryFabricWithTimeout's execution-time guard
// (fabricClient.js) plus a post-execution row-count check instead of a pre-emptive limit.
export function composeSql(stepResults, { topN = null } = {}) {
  const ctes = stepResults.slice(0, -1)
  const terminal = stepResults[stepResults.length - 1]
  if (!terminal?.sql_body) throw new Error('composeSql: terminal step has no sql_body')

  const withClause = ctes.length
    ? `WITH ${ctes.map(s => `${s.cte_name} AS (\n${s.sql_body}\n)`).join(',\n')}\n`
    : ''

  const terminalSql = topN ? injectTopN(terminal.sql_body, topN) : terminal.sql_body
  return `${withClause}${terminalSql}`
}

// Finds the first SELECT at paren-depth 0 and injects TOP N there. A plain fragment's
// sql_body starts with SELECT at depth 0 directly. A self_contained fragment's sql_body
// starts with `;WITH cte AS (...), ...` — every SELECT inside a CTE definition sits at
// depth >= 1, so this still lands on the true terminal SELECT instead of matching nothing.
function injectTopN(sql, topN) {
  if (/\bTOP\s+\d+\b/i.test(sql)) return sql // already has one (shouldn't happen, but don't double up)
  const selectRe = /\bSELECT\b/gi
  let match
  while ((match = selectRe.exec(sql))) {
    const before = sql.slice(0, match.index)
    const depth = (before.match(/\(/g) || []).length - (before.match(/\)/g) || []).length
    if (depth === 0) {
      return `${sql.slice(0, match.index)}SELECT TOP ${topN}${sql.slice(match.index + 6)}`
    }
  }
  return sql // no depth-0 SELECT found — leave unchanged rather than risk malformed SQL
}
