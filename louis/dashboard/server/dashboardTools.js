import { METRIC_CATALOG, listMetricsForPrompt } from './semanticCatalog.js'

const METRIC_IDS = Object.keys(METRIC_CATALOG)
const CHART_CODES = ['bar', 'line', 'pie', 'table', 'kpi']

// Planner tool schema — deliberately NOT the render_* schema from chatTools.js.
// The planner only ever picks a metric id + chart type + title; the real
// `data` array is always filled in afterward from the semantic catalog
// (see widgetSchema.buildWidgetProps), so the model has no channel through
// which to invent numbers.
export function buildDashboardTools() {
  return [
    {
      type: 'function',
      function: {
        name: 'propose_add_widget',
        description: '현재 대시보드에 새 위젯(차트/KPI카드/표)을 추가합니다.',
        parameters: {
          type: 'object',
          properties: {
            metric_id: { type: 'string', enum: METRIC_IDS, description: '사용할 지표 id (지표 카탈로그 중 하나)' },
            chart_type: { type: 'string', enum: CHART_CODES, description: '차트 형태' },
            title: { type: 'string', description: '위젯 제목 (한국어)' },
          },
          required: ['metric_id', 'chart_type', 'title'],
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
        description: '기존 위젯의 지표/차트 형태/제목을 변경합니다 (전체 교체).',
        parameters: {
          type: 'object',
          properties: {
            widget_id: { type: 'string' },
            metric_id: { type: 'string', enum: METRIC_IDS },
            chart_type: { type: 'string', enum: CHART_CODES },
            title: { type: 'string' },
          },
          required: ['widget_id', 'metric_id', 'chart_type', 'title'],
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
        name: 'reject_request',
        description: '요청이 대시보드 커스터마이징과 무관하거나, 카탈로그로 지원할 수 없는 지표를 요구하는 경우 사용합니다.',
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

// 검토 에이전트(critic) tool — deliberately narrow. Structural checks (metric
// exists, chart type allowed, widget id exists, widget cap) already happened
// in dashboardValidation.js before this call; the critic only judges whether
// the proposal actually matches the user's natural-language intent.
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

export function buildReviewPrompt({ userMessage, summaryText, sql, metricLabel, chartCode }) {
  return `당신은 대시보드 위젯 변경 제안을 검토하는 검토 에이전트입니다.
사용자 요청: "${userMessage}"
제안된 변경: ${summaryText}
선택된 지표: ${metricLabel || '(해당 없음)'} / 차트 형태: ${chartCode || '(해당 없음)'}
참고용 SQL(표시용, 실행되지 않음): ${sql || '(해당 없음)'}

이 제안이 사용자 요청 의도에 실제로 부합하는지만 판단하세요.
지표 존재 여부, 차트 타입 허용 여부, 위젯 개수 제한 등 형식적인 문제는 이미 별도로 검증되었으니 신경 쓰지 마세요.
review_verdict 도구를 반드시 호출해 응답하세요.`
}

export function buildDashboardSystemPrompt(dashboardState) {
  const widgetList = dashboardState.widgets.length
    ? dashboardState.widgets
        .map(w => `- id=${w.id} | type=${w.type} | metric=${w.metricId} | title="${w.props?.title || w.props?.cards?.[0]?.title || ''}"`)
        .join('\n')
    : '(현재 위젯 없음 — 빈 대시보드)'

  return `당신은 Toyota/Lexus Korea 대시보드를 사용자의 자연어 요청에 따라 커스터마이징하는 AI 에이전트입니다.
사용자가 대시보드에 위젯(차트/KPI카드/표)을 추가·삭제·수정·재정렬해달라고 요청하면, 아래 도구(tool) 중 하나를 반드시 호출하세요.
차트에 들어갈 실제 데이터는 시스템이 별도로 채워 넣으므로, 당신은 절대 데이터 값을 지어내지 말고 오직 metric_id / chart_type / title만 선택하세요.

# 사용 가능한 지표 카탈로그
${listMetricsForPrompt()}

# 현재 대시보드 상태
${widgetList}

# 지침
1. 사용자의 요청이 이 카탈로그로 표현 가능한 지표 추가/삭제/수정/재정렬이면 반드시 propose_* 도구 중 하나를 호출하세요.
2. 카탈로그에 없는 지표를 요구하거나, 대시보드 커스터마이징과 무관한 질문(일반 대화, 날씨 등)이면 reject_request를 호출하세요.
3. chart_type은 선택한 metric_id의 shape에 맞아야 합니다: kpi 지표 → kpi, breakdown 지표 → bar/pie/table, trend 지표 → line/bar/table.
4. 제거/수정/재정렬 시 widget_id는 반드시 위 "현재 대시보드 상태" 목록에 있는 값만 사용하세요.
5. 도구 호출과 함께, 사용자에게 보여줄 짧은 한국어 설명을 함께 답변하세요.`
}
