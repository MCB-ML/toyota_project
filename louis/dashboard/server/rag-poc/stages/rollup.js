import { streamAssistantTurn } from '../../azureStream.js'

// Stage 8b — breakdown 패턴(pat_*_list_by_org류)은 저작 시점에 고정된 다차원(딜러+그룹+
// 부서+SC+활동유형 등)으로 GROUP BY하도록 만들어져 있다. 사용자가 그중 일부 차원만
// 요청해도(예: "딜러사별"만) 패턴 자체를 바꿀 방법이 없어 항상 전체 차원으로 쪼개져
// 나온다 — 이 단계가 그 결과를 사용자가 실제로 요청한 차원까지만 다시 SUM해서 접는다.
export function buildRollupTools(outputColumns) {
  return [
    {
      type: 'function',
      function: {
        name: 'set_rollup',
        description: '이미 만들어진 쿼리 결과가 사용자가 요청한 것보다 더 잘게 쪼개져 있는지 판단하고, 필요하면 남길 차원과 합산할 수치 컬럼을 지정합니다.',
        parameters: {
          type: 'object',
          properties: {
            needed: { type: 'boolean', description: '결과를 사용자가 요청한 차원 수준으로 다시 집계해야 하면 true, 이미 딱 맞으면 false' },
            keep_dimensions: { type: 'array', items: { type: 'string', enum: outputColumns }, description: 'GROUP BY로 남길 차원 컬럼 — 사용자가 실제로 요청한 것만' },
            measure_columns: { type: 'array', items: { type: 'string', enum: outputColumns }, description: 'SUM으로 다시 합산할 수치 컬럼' },
          },
          required: ['needed'],
        },
      },
    },
  ]
}

export function buildRollupPrompt(query, structured, outputColumns) {
  return `당신은 이미 실행 가능하게 만들어진 쿼리의 결과가 사용자가 요청한 것보다 더 세분화돼 있는지 판단하는 에이전트입니다.
이 쿼리 자체를 다시 쓰는 게 아니라, 이미 나온 결과를 사용자가 원하는 차원까지만 다시 집계할지만 결정합니다.

# 사용자 질문
${query}

# 구조화된 질문이 요청한 차원
${(structured.dimensions || []).join(', ') || '(명시된 차원 없음)'}

# 이 쿼리가 실제로 출력하는 컬럼(현재 GROUP BY 기준)
${outputColumns.join(', ')}

# 지침
1. 위 출력 컬럼 중 사용자가 실제로 요청한 차원에 해당하는 컬럼만 keep_dimensions로 남기세요.
   예: 사용자가 "딜러사별"만 요청했는데 출력 컬럼에 그룹/부서/SC이름/활동유형까지 있으면, 그 나머지는 keep_dimensions에서 빼야 합니다.
2. 건수/합계처럼 숫자인 컬럼은 measure_columns로 지정하세요 — 이후 SUM으로 다시 합산됩니다.
3. 출력 컬럼이 이미 사용자가 요청한 차원과 정확히 일치하면(더 잘게 쪼갤 게 없으면) needed=false로 답하세요.
4. keep_dimensions/measure_columns는 반드시 "이 쿼리가 실제로 출력하는 컬럼" 목록에 있는 이름만 쓰세요 — 없는 컬럼명을 지어내지 마세요.`
}

export async function decideRollup(client, deployment, { query, structured, outputColumns }) {
  if (!outputColumns || outputColumns.length < 2) return null // 차원이 1개뿐이면(스칼라) 롤업 대상이 아님
  const [call] = await streamAssistantTurn(client, {
    model: deployment,
    messages: [
      { role: 'system', content: buildRollupPrompt(query, structured, outputColumns) },
      { role: 'user', content: query },
    ],
    tools: buildRollupTools(outputColumns),
    toolChoice: { type: 'function', function: { name: 'set_rollup' } },
    temperature: 0,
  })
  const args = call?.args
  if (!args?.needed || !args.keep_dimensions?.length || !args.measure_columns?.length) return null
  return { keepDimensions: args.keep_dimensions, measureColumns: args.measure_columns }
}

// T-SQL은 WITH(CTE) 정의를 서브쿼리/derived table 안에 중첩하는 것을 허용하지 않는다
// ("Incorrect syntax near 'WITH'") — 그래서 이미 조립된 SQL 문자열을 통째로
// `FROM (...) AS base`로 감싸는 방식은 안쪽 패턴에 CTE가 하나라도 있으면 깨진다.
// 대신 stepResults를 직접 받아 terminal 스텝을 "base"라는 CTE 하나로 그대로 이어붙이고,
// 롤업 집계는 그 WITH 체인 뒤에 오는 최종 SELECT로 둔다 — 안쪽에 CTE가 0개든 여러
// 개든 항상 유효한 하나의 WITH 체인이 된다.
function stripOrderBy(sql) {
  return sql.replace(/\bORDER\s+BY\s+[\s\S]*$/i, '').trimEnd()
}

// 결정론적 — Stage 9b가 이미 실행까지 검증한 stepResults를 그대로 이어붙여 다시 집계한다.
// keep/measure 컬럼은 decideRollup()의 enum 제약 덕분에 항상 실제 출력 컬럼 중에서만
// 오므로, 존재하지 않는 컬럼명을 참조해 깨질 위험이 없다.
export function applyRollup(stepResults, { keepDimensions, measureColumns }, topN) {
  const ctes = stepResults.slice(0, -1)
  const terminal = stepResults[stepResults.length - 1]
  const cteClauses = ctes.map(s => `${s.cte_name} AS (\n${s.sql_body}\n)`)
  cteClauses.push(`base AS (\n${stripOrderBy(terminal.sql_body)}\n)`)

  const dims = keepDimensions.map(c => `[${c}]`)
  const sums = measureColumns.map(c => `SUM([${c}]) AS [${c}]`)
  const selectList = [...dims, ...sums].join(', ')
  const groupBy = dims.join(', ')
  const topClause = topN ? `TOP ${topN} ` : ''
  return `WITH ${cteClauses.join(',\n')}\nSELECT ${topClause}${selectList}\nFROM base\nGROUP BY ${groupBy}\nORDER BY ${groupBy}`
}
