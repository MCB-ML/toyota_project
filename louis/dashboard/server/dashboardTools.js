import { listTopicsForPrompt, listTopics } from './schemaLoader.js'

const CHART_CODES = ['bar', 'line', 'pie', 'table', 'kpi']
const SIZE_CODES = ['sm', 'md', 'lg']

// Stage-1 planner tool schema — picks an action + which of the 11 schema topics
// the request is about. It does NOT pick chart_type/columns here, because at this
// point we haven't loaded the real table/column list yet (that only happens after
// a topic is chosen — see schemaLoader.loadTablesForTopic). Stage 2's
// run_widget_query tool (below) handles chart type + real SQL once the actual
// columns are known.
export function buildDashboardTools() {
  const topicIds = listTopics().map(t => t.topic)
  return [
    {
      type: 'function',
      function: {
        name: 'propose_add_widget',
        description: '현재 대시보드에 새 위젯(차트/KPI카드/표)을 추가합니다.',
        parameters: {
          type: 'object',
          properties: {
            topic: { type: 'string', enum: topicIds, description: '요청과 가장 관련있는 주제' },
          },
          required: ['topic'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'propose_remove_widget',
        description: '현재 대시보드에서 기존 위젯을 제거합니다.',
        parameters: {
          type: 'object',
          properties: {
            widget_id: { type: 'string', description: '제거할 위젯의 id (현재 대시보드 상태 목록에서 확인)' },
          },
          required: ['widget_id'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'propose_modify_widget',
        description: '기존 위젯이 다루는 데이터/주제를 변경합니다 (전체 교체).',
        parameters: {
          type: 'object',
          properties: {
            widget_id: { type: 'string' },
            topic: { type: 'string', enum: topicIds },
          },
          required: ['widget_id', 'topic'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'propose_reorder_widgets',
        description: '기존 위젯의 표시 순서를 변경합니다.',
        parameters: {
          type: 'object',
          properties: {
            widget_id: { type: 'string' },
            to_index: { type: 'integer', minimum: 0 },
          },
          required: ['widget_id', 'to_index'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'propose_resize_widget',
        description: '기존 위젯의 크기(너비 비중)만 바꿉니다. 데이터/차트 종류는 그대로 유지 — "이거 크게/작게 만들어줘", "그래프가 너무 빼곡해" 같은 요청에 사용하세요. 사용자가 화면에서 직접 드래그로도 자유롭게 조절할 수 있으며, 여기서는 그 3단계 근사치를 지정합니다.',
        parameters: {
          type: 'object',
          properties: {
            widget_id: { type: 'string' },
            size: { type: 'string', enum: SIZE_CODES, description: 'sm=작게, md=보통(기본), lg=크게 — 같은 줄의 옆 위젯이 반대로 줄어들며 자동으로 맞춰집니다' },
          },
          required: ['widget_id', 'size'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'reject_request',
        description: '요청이 대시보드 커스터마이징과 무관하거나, 지원되는 주제로 표현할 수 없는 경우 사용합니다.',
        parameters: {
          type: 'object',
          properties: {
            reason: { type: 'string', description: '거절 사유 (한국어, 사용자에게 보여줄 짧은 설명)' },
          },
          required: ['reason'],
        },
      },
    },
  ]
}

export function buildDashboardSystemPrompt(dashboardState) {
  const widgetList = dashboardState.widgets.length
    ? dashboardState.widgets
        .map(w => `- id=${w.id} | type=${w.type} | table=${w.table || '?'} | title="${w.props?.title || w.props?.cards?.[0]?.title || ''}"`)
        .join('\n')
    : '(현재 위젯 없음 — 빈 대시보드)'

  return `당신은 Toyota/Lexus Korea 대시보드를 사용자의 자연어 요청에 따라 커스터마이징하는 AI 에이전트입니다.
사용자가 대시보드에 위젯(차트/KPI카드/표)을 추가·삭제·수정·재정렬해달라고 요청하면, 아래 도구(tool) 중 하나를 반드시 호출하세요.
실제 데이터는 다음 단계에서 실시간 웨어하우스 조회로 채워지므로, 지금은 어떤 주제(topic)의 데이터인지만 고르세요.

# 사용 가능한 주제
${listTopicsForPrompt()}

# 현재 대시보드 상태
${widgetList}

# 지침
1. 사용자의 요청이 위 주제 중 하나로 표현 가능한 추가/삭제/수정/재정렬이면 반드시 propose_* 도구 중 하나를 호출하세요.
2. 크기만 바꿔달라는 요청("크게 해줘", "너무 빼곡해", "작게 줄여줘")이면 propose_resize_widget을 호출하세요 — 데이터는 다시 조회하지 않습니다.
3. 위 주제 어디에도 해당하지 않거나, 대시보드 커스터마이징과 무관한 질문(일반 대화, 날씨 등)이면 reject_request를 호출하세요.
4. 제거/수정/재정렬/크기변경 시 widget_id는 반드시 위 "현재 대시보드 상태" 목록에 있는 값만 사용하세요.
5. 도구 호출과 함께, 사용자에게 보여줄 짧은 한국어 설명을 함께 답변하세요.`
}

// Stage-2 tool — only called after loadTablesForTopic() has loaded the real
// table/column definitions for the chosen topic. The LLM writes an actual T-SQL
// SELECT (executed live via fabricClient.js, not display-only) and tells us which
// of its own column aliases to plot, so widgetSchema.buildWidgetPropsFromRows()
// never has to guess at column names.
export function buildWidgetQueryTools(tables) {
  return [
    {
      type: 'function',
      function: {
        name: 'run_widget_query',
        description: '선택한 테이블에 실제 실행할 SELECT 쿼리를 작성하고, 결과를 어떤 차트로 그릴지 지정합니다.',
        parameters: {
          type: 'object',
          properties: {
            db: { type: 'string', enum: [...new Set(tables.map(t => t.db))], description: '쿼리 대상 DB' },
            table_id: { type: 'string', enum: tables.map(t => t.id), description: '쿼리 대상 테이블' },
            sql: {
              type: 'string',
              description: 'T-SQL SELECT 쿼리 1개. SELECT 또는 WITH로 시작. TOP N으로 결과를 제한할 것(기본 50, kpi는 TOP 1).',
            },
            chart_type: { type: 'string', enum: CHART_CODES },
            title: { type: 'string', description: '위젯 제목 (한국어)' },
            size: { type: 'string', enum: SIZE_CODES, description: '위젯 너비. sm=1/3, md=1/2(기본값, 생략 가능), lg=전체폭. 시계열 line 차트나 컬럼이 많은 table은 lg를 권장.' },
            label_key: { type: 'string', description: 'bar/pie일 때 카테고리(라벨) 컬럼의 SQL 별칭' },
            value_key: { type: 'string', description: 'bar/pie일 때 수치 컬럼의 SQL 별칭' },
            x_key: { type: 'string', description: 'line일 때 x축(보통 날짜/기간) 컬럼의 SQL 별칭' },
            y_keys: { type: 'array', items: { type: 'string' }, description: 'line일 때 y축 값 컬럼(들)의 SQL 별칭' },
          },
          required: ['db', 'table_id', 'sql', 'chart_type', 'title'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'reject_widget_query',
        description: '로드된 테이블 정보로는 요청에 맞는 위젯 쿼리를 만들 수 없을 때 사용합니다.',
        parameters: {
          type: 'object',
          properties: { reason: { type: 'string' } },
          required: ['reason'],
        },
      },
    },
  ]
}

export function buildWidgetQuerySystemPrompt(renderedTables) {
  return `당신은 대시보드 위젯에 쓸 데이터를 Toyota/Lexus Korea Fabric 웨어하우스에서 T-SQL로 조회하는 에이전트입니다.
아래 테이블/컬럼 정보만 사용하세요 — 목록에 없는 테이블/컬럼을 지어내지 마세요.

# 사용 가능한 테이블
${renderedTables}

# 지침
1. run_widget_query 도구로 실제 실행될 SELECT와 차트 타입을 함께 지정하세요.
2. bar/pie는 label_key/value_key를, line은 x_key/y_keys를 SQL에서 실제로 사용한 컬럼 별칭과 정확히 동일하게 지정하세요.
3. table은 SELECT한 컬럼이 그대로 표 컬럼이 되므로 별도 key 지정이 필요 없습니다.
4. kpi는 결과가 정확히 1행이 되도록 집계하고, 각 컬럼 별칭을 카드 제목으로 쓸 한국어로 지으세요 (예: SELECT COUNT(*) AS 총계약건수).
5. 반드시 TOP N으로 결과 행을 제한하세요 (기본 50, kpi는 TOP 1).
6. size는 생략하면 md(1/2폭)로 처리됩니다. 시계열 line 차트나 컬럼이 많은 table은 lg(전체폭)를 지정하세요.
7. 로드된 테이블만으로 답할 수 없으면 reject_widget_query를 호출하세요.`
}

// 검토 에이전트(critic) tool — deliberately narrow. Structural checks (topic
// exists, widget id exists, widget cap) already happened in dashboardValidation.js
// before this call; the critic only judges whether the proposal actually matches
// the user's natural-language intent.
export function buildReviewTools() {
  return [
    {
      type: 'function',
      function: {
        name: 'review_verdict',
        description: '제안된 대시보드 변경(패치)이 사용자 요청 의도에 부합하는지 검토합니다.',
        parameters: {
          type: 'object',
          properties: {
            approved: { type: 'boolean' },
            reason: { type: 'string', description: '판단 근거 (한국어, 1~2문장)' },
          },
          required: ['approved', 'reason'],
        },
      },
    },
  ]
}

export function buildReviewPrompt({ userMessage, summaryText, sql, tableLabel, chartCode }) {
  return `당신은 대시보드 위젯 변경 제안을 검토하는 검토 에이전트입니다.
사용자 요청: "${userMessage}"
제안된 변경: ${summaryText}
선택된 테이블: ${tableLabel || '(해당 없음)'} / 차트 형태: ${chartCode || '(해당 없음)'}
실제로 실행된 SQL: ${sql || '(해당 없음)'}

이 제안이 사용자 요청 의도에 실제로 부합하는지만 판단하세요.
주제/테이블 존재 여부, 위젯 개수 제한 등 형식적인 문제는 이미 별도로 검증되었으니 신경 쓰지 마세요.
review_verdict 도구를 반드시 호출해 응답하세요.`
}
