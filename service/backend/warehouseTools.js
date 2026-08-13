// Stage-2 tool schema: given the table definitions for a classified topic
// (schemaLoader.loadTablesForTopic), the LLM picks one table and writes a real
// T-SQL SELECT against it. The query is then actually executed via fabricClient.js —
// unlike dashboardPipeline.js's SQL, this one is NOT display-only.
export function buildQueryTools(tables) {
  return [
    {
      type: 'function',
      function: {
        name: 'run_query',
        description: '선택한 테이블에 대해 사용자 질문에 답할 SELECT 쿼리를 작성하고 실행을 요청합니다.',
        parameters: {
          type: 'object',
          properties: {
            db: { type: 'string', enum: [...new Set(tables.map(t => t.database))], description: '쿼리 대상 DB' },
            table_id: { type: 'string', enum: tables.map(t => t.table), description: '쿼리 대상 테이블' },
            sql: {
              type: 'string',
              description: 'T-SQL SELECT 쿼리 1개. SELECT 또는 WITH로 시작해야 하며 세미콜론/주석 없이 작성. TOP N으로 결과 수를 제한할 것 (기본 TOP 100).',
            },
            title: { type: 'string', description: '결과를 설명하는 한글 제목' },
          },
          required: ['db', 'table_id', 'sql', 'title'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'reject_query',
        description: '로드된 테이블 정보만으로는 질문에 답할 SQL을 만들 수 없을 때 사용합니다.',
        parameters: {
          type: 'object',
          properties: { reason: { type: 'string' } },
          required: ['reason'],
        },
      },
    },
  ]
}

export function buildQuerySystemPrompt(tables, renderedTables) {
  const sample = tables[0]
  const qualifiedExample = sample ? `${sample.schema}.${sample.table}` : '<schema>.<table>'
  return `당신은 Toyota/Lexus Korea Fabric 데이터 웨어하우스에 대해 T-SQL(SQL Server 방언) SELECT 쿼리를 작성하는 에이전트입니다.
아래에 주어진 테이블/컬럼 정보만 사용하세요 — 목록에 없는 테이블이나 컬럼을 지어내지 마세요.

# 사용 가능한 테이블
${renderedTables}

# 지침
1. run_query 도구를 호출해 실제 실행될 SQL을 제시하세요. 반드시 SELECT 또는 WITH로 시작해야 합니다.
2. **FROM/JOIN 절의 테이블명은 반드시 스키마를 포함해 \`<schema>.<table>\` 형태로 쓰세요** (예: \`${qualifiedExample}\`) — 스키마 없이 테이블명만 쓰면 "Invalid object name" 오류가 납니다. 스키마는 위 테이블 정보의 \`(database.schema)\` 부분에 나와 있습니다.
3. 반드시 TOP N을 사용해 결과 행 수를 제한하세요 (기본 100, 집계/요약 질문이면 더 적게).
4. 여러 테이블에 걸친 조인이 필요하면, 위 목록에 있는 테이블 중에서만 조인하세요. 확신이 없으면 조인 없이 단일 테이블로 답변 가능한 형태로 좁히세요.
5. 이 목록의 테이블/컬럼으로 답할 수 없는 질문이면 reject_query를 호출하세요.
6. title은 결과를 설명하는 짧은 한국어 문구로 작성하세요.`
}
