// Tool-call schemas for the RAG pipeline's LLM-driven stages: Stage 0 (structure the raw
// question), Stage 3 (turn retrieved Pattern Cards into an ordered execution plan), and
// Stage 7 (generate one fragment's SQL body in isolation). Parallel to warehouseTools.js but
// scoped to rag-poc/ — these never touch the TOPIC classification path.

export function buildStructureTool() {
  return [
    {
      type: 'function',
      function: {
        name: 'structure_question',
        description: '사용자의 자연어 질문을 지표/차원/기간/필터/연산으로 구조화합니다.',
        parameters: {
          type: 'object',
          properties: {
            intent: { type: 'array', items: { type: 'string' }, description: "예: ['count'], ['ratio','conversion']" },
            metrics: { type: 'array', items: { type: 'string' }, description: '질문이 요구하는 측정값 이름(한글), 예: ["활동건수"]' },
            dimensions: { type: 'array', items: { type: 'string' }, description: '집계 기준 차원(한글), 예: ["딜러","월"]' },
            time_range: { type: 'string', description: '질문에 언급된 기간(자연어 그대로, 예: "2026년 4월", "이번달", 언급 없으면 빈 문자열)' },
            filters: { type: 'array', items: { type: 'string' }, description: '질문에 명시된 추가 필터 조건(자연어)' },
            operations: { type: 'array', items: { type: 'string' }, description: '예: ["join","filter","sum","ratio","group_by"]' },
            estimated_complexity: { type: 'string', enum: ['simple', 'complex'] },
            entities: {
              type: 'object',
              description: '질문에 실제로 언급된 슬라이서 값. 언급 안 됐으면 해당 필드를 아예 넣지 마세요(추측 금지) — 이 값이 모든 SQL 조각 생성에 동일하게 쓰이므로, 언급되지 않은 값을 지어내면 안 됩니다.',
              properties: {
                dealer: { type: 'string', description: '딜러/지점명(예: "렉서스 강남") — 실제 언급된 경우만' },
                brand: { type: 'string' },
                group_name: { type: 'string' },
                dept_nm: { type: 'string' },
                active_yn: { type: 'string', enum: ['재직', '퇴사'] },
                potential: { type: 'string', enum: ['HOT', 'WARM', 'COLD'], description: '리드 관심도 — 실제 언급된 경우만(예: "HOT 고객만")' },
                close_yn: { type: 'string', description: '리드 관리 탭 상태(예: "관리"/"중지") — 실제 언급된 경우만' },
              },
            },
          },
          required: ['intent', 'metrics', 'dimensions', 'operations', 'estimated_complexity'],
        },
      },
    },
  ]
}

export function buildPlanTool(patternCards) {
  const patternIds = patternCards.map(p => p.pattern_id)
  return [
    {
      type: 'function',
      function: {
        name: 'generate_query_plan',
        description: '구조화된 질문과 검색된 Pattern Card를 바탕으로 SQL 생성 단계를 순서대로 계획합니다. 각 단계는 반드시 아래 후보 Pattern Card 중 하나를 참조해야 합니다 — SQL을 직접 쓰지 마세요.',
        parameters: {
          type: 'object',
          properties: {
            pattern_id: { type: 'string', enum: patternIds, description: '이 질문에 가장 적합한 Pattern Card 하나를 고르세요.' },
            reasoning: { type: 'string', description: '왜 이 Pattern Card를 골랐는지 한 문장 — 특히 스칼라(intent=count/ratio) 카드를 골랐다면 breakdown 카드를 배제한 이유를 밝히세요.' },
          },
          required: ['pattern_id', 'reasoning'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'reject_plan',
        description: '검색된 Pattern Card 중 이 질문에 맞는 게 하나도 없을 때 사용합니다.',
        parameters: { type: 'object', properties: { reason: { type: 'string' } }, required: ['reason'] },
      },
    },
  ]
}

export function buildFragmentSqlTool(selfContained = false) {
  const sqlBodyDescription = selfContained
    ? '이 fragment의 SQL 본문. 참고 템플릿이 이미 완결된 다중 CTE(;WITH ... SELECT) 쿼리입니다 — 그 구조(모든 CTE 정의 포함)를 통째로 그대로 유지하고, 확정된 파라미터 값에 해당하는 리터럴만 교체하세요. CTE를 생략하거나 마지막 SELECT만 남기지 마세요.'
    : '이 fragment 하나의 SELECT 본문. 다른 CTE를 새로 만들거나 WITH로 시작하지 말고, 오직 이 fragment의 SELECT 문 하나만 작성하세요. 상위 CTE를 참조할 땐 주어진 이름을 정확히 그대로 쓰세요.'
  return [
    {
      type: 'function',
      function: {
        name: 'generate_fragment_sql',
        description: '주어진 SQL Fragment 하나의 본문을 사용자 질문에 맞게 채워서 작성합니다.',
        parameters: {
          type: 'object',
          properties: {
            sql_body: { type: 'string', description: sqlBodyDescription },
          },
          required: ['sql_body'],
        },
      },
    },
  ]
}
