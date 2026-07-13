import { randomUUID } from 'node:crypto'
import { createAzureClient, getAzureConfig } from './azureClient.js'
import { streamAssistantTurn } from './azureStream.js'
import {
  buildDashboardTools, buildDashboardSystemPrompt,
  buildWidgetQueryTools, buildWidgetQuerySystemPrompt,
  buildReviewTools, buildReviewPrompt,
} from './dashboardTools.js'
import { loadTablesForTopic, renderTablesForPrompt } from './schemaLoader.js'
import { queryFabric } from './fabricClient.js'
import { buildWidgetPropsFromRows } from './widgetSchema.js'
import { validateProposal, validateWidgetProps, isDuplicateWidget } from './dashboardValidation.js'

const STAGE_LABELS = {
  intent: '의도 분석 중...',
  load_schema: '관련 테이블 스키마 로드 중...',
  generate_sql: 'SQL 생성 중...',
  execute: 'Fabric 웨어하우스에 쿼리 실행 중...',
  patch: '레이아웃 patch 생성 중...',
  review: '검토 에이전트 확인 중...',
}

const ACTION_BY_TOOL = {
  propose_add_widget: 'add',
  propose_remove_widget: 'remove',
  propose_modify_widget: 'modify',
  propose_reorder_widgets: 'reorder',
  propose_resize_widget: 'resize',
}

const SIZE_LABEL = { sm: '작게', md: '보통', lg: '크게' }
// AI가 고르는 3단계 프리셋 → 실제 저장되는 연속값 weight. 드래그로는 이 사이 임의의
// 값으로도 조절 가능하다 (src/pages/ktws/Custom.jsx의 MIN/MAX_WEIGHT 범위 안에서).
const SIZE_TO_WEIGHT = { sm: 0.6, md: 1, lg: 2 }

function summarizeProposal(action, proposal, queryInfo) {
  if (action === 'add') return `"${queryInfo?.title}" 위젯을 ${queryInfo?.chart_type} 형태로 추가 (${queryInfo?.table_id})`
  if (action === 'modify') return `기존 위젯을 "${queryInfo?.title}"(${queryInfo?.chart_type}, ${queryInfo?.table_id})로 변경`
  if (action === 'remove') return `위젯 삭제 (id=${proposal.widgetId})`
  if (action === 'reorder') return `위젯 순서 변경 (id=${proposal.widgetId} → 위치 ${proposal.toIndex})`
  if (action === 'resize') return `위젯 크기 변경 (id=${proposal.widgetId} → ${SIZE_LABEL[proposal.size] || proposal.size})`
  return ''
}

// Orchestrates: 의도분류+상태읽기+topic매핑(LLM #1) → 관련 테이블 로드(결정론적)
// → SQL생성+차트스펙(LLM #2, 실제 Fabric에 실행됨) → 패치생성(결정론적) → 검토(LLM #3).
// See louis/dashboard/README.md for the full stage-by-stage writeup.
export async function runDashboardPipeline({ message, history, dashboardState }, { sendEvent }) {
  const stage = (name) => sendEvent({ type: 'stage', stage: name, label: STAGE_LABELS[name] })

  const client = createAzureClient()
  if (!client) {
    sendEvent({ type: 'error', message: 'Azure OpenAI 환경변수가 설정되지 않았습니다. .env 파일을 확인하세요.' })
    return
  }
  const { deployment } = getAzureConfig()

  // 1. 의도 분류 + 2. 현재 대시보드 상태 읽기(프롬프트 컨텍스트) + 3. 주제(topic) 매핑
  stage('intent')
  const toolCalls = await streamAssistantTurn(client, {
    model: deployment,
    messages: [
      { role: 'system', content: buildDashboardSystemPrompt(dashboardState) },
      ...history,
      { role: 'user', content: message },
    ],
    tools: buildDashboardTools(),
    onText: (text) => sendEvent({ type: 'text', text }),
  })

  const call = toolCalls[0]
  if (!call || !call.args) {
    sendEvent({ type: 'error', message: '요청을 이해하지 못했습니다. 다시 말씀해주세요.' })
    return
  }

  if (call.name === 'reject_request') {
    sendEvent({ type: 'rejected', reason: call.args.reason })
    return
  }

  const action = ACTION_BY_TOOL[call.name]
  if (!action) {
    sendEvent({ type: 'error', message: `알 수 없는 처리입니다: ${call.name}` })
    return
  }

  const proposal = {
    action,
    topic: call.args.topic,
    widgetId: call.args.widget_id,
    toIndex: call.args.to_index,
    size: call.args.size,
  }

  const structural = validateProposal(proposal, dashboardState)
  if (!structural.ok) {
    sendEvent({ type: 'error', message: structural.reason })
    return
  }

  let sql = null
  let widget = null
  let patch = null
  let queryInfo = null

  if (action === 'add' || action === 'modify') {
    // 4. 관련 테이블 스키마 로드 — 전체 187개 중 이 topic에 연결된 1~3개만
    stage('load_schema')
    const tables = loadTablesForTopic(proposal.topic)
    if (!tables.length) {
      sendEvent({ type: 'error', message: `"${proposal.topic}" 주제에 연결된 테이블이 없습니다.` })
      return
    }

    // 5. SQL 생성 + 차트 스펙 — 실제 실행될 SELECT를 LLM이 작성
    stage('generate_sql')
    const sqlCalls = await streamAssistantTurn(client, {
      model: deployment,
      messages: [
        { role: 'system', content: buildWidgetQuerySystemPrompt(renderTablesForPrompt(tables)) },
        { role: 'user', content: message },
      ],
      tools: buildWidgetQueryTools(tables),
    })

    const sqlCall = sqlCalls[0]
    if (!sqlCall || !sqlCall.args) {
      sendEvent({ type: 'error', message: 'SQL을 생성하지 못했습니다.' })
      return
    }
    if (sqlCall.name === 'reject_widget_query') {
      sendEvent({ type: 'rejected', reason: sqlCall.args.reason, topic: proposal.topic })
      return
    }

    queryInfo = sqlCall.args
    if (!tables.some(t => t.db === queryInfo.db && t.id === queryInfo.table_id)) {
      sendEvent({ type: 'error', message: `허용되지 않은 테이블입니다: ${queryInfo.db}.${queryInfo.table_id}` })
      return
    }
    sql = queryInfo.sql

    // 6. 실제 실행 — fabricClient.js가 SELECT/WITH 외에는 거부
    stage('execute')
    let rows
    try {
      rows = await queryFabric(queryInfo.db, sql)
    } catch (err) {
      sendEvent({ type: 'error', message: `쿼리 실행 실패: ${err.message}` })
      return
    }

    const built = buildWidgetPropsFromRows(queryInfo.chart_type, rows, {
      labelKey: queryInfo.label_key,
      valueKey: queryInfo.value_key,
      xKey: queryInfo.x_key,
      yKeys: queryInfo.y_keys,
    }, queryInfo.title)

    widget = {
      id: action === 'modify' ? proposal.widgetId : randomUUID(),
      type: built.type,
      table: `${queryInfo.db}.${queryInfo.table_id}`,
      topic: proposal.topic,
      weight: SIZE_TO_WEIGHT[queryInfo.size] || SIZE_TO_WEIGHT.md,
      createdAt: new Date().toISOString(),
      props: built.props,
    }

    const propCheck = validateWidgetProps(widget)
    if (!propCheck.ok) {
      sendEvent({ type: 'error', message: propCheck.reason })
      return
    }

    // 7. 레이아웃 patch 생성
    stage('patch')
    patch = action === 'add'
      ? { baseVersion: dashboardState.version, ops: [{ op: 'add', widget }] }
      : { baseVersion: dashboardState.version, ops: [{ op: 'update', widgetId: proposal.widgetId, widget }] }
  } else if (action === 'remove') {
    stage('patch')
    patch = { baseVersion: dashboardState.version, ops: [{ op: 'remove', widgetId: proposal.widgetId }] }
  } else if (action === 'reorder') {
    stage('patch')
    patch = { baseVersion: dashboardState.version, ops: [{ op: 'move', widgetId: proposal.widgetId, toIndex: proposal.toIndex }] }
  } else if (action === 'resize') {
    // 데이터/차트는 그대로 — 위젯 크기(그리드 폭)만 바꾸므로 스키마 로드/SQL/실행 전부 생략
    stage('patch')
    const existing = dashboardState.widgets.find(w => w.id === proposal.widgetId)
    widget = { ...existing, weight: SIZE_TO_WEIGHT[proposal.size] || SIZE_TO_WEIGHT.md }
    patch = { baseVersion: dashboardState.version, ops: [{ op: 'update', widgetId: proposal.widgetId, widget }] }
  }

  const warning = widget && isDuplicateWidget(widget, dashboardState)
    ? '비슷한 위젯이 이미 대시보드에 있습니다.'
    : null

  // 8. 검토 에이전트
  stage('review')
  const summaryText = summarizeProposal(action, proposal, queryInfo)
  const reviewCalls = await streamAssistantTurn(client, {
    model: deployment,
    messages: [{
      role: 'user',
      content: buildReviewPrompt({
        userMessage: message,
        summaryText,
        sql,
        tableLabel: queryInfo?.table_id,
        chartCode: queryInfo?.chart_type,
      }),
    }],
    tools: buildReviewTools(),
    toolChoice: { type: 'function', function: { name: 'review_verdict' } },
  })

  const verdict = reviewCalls[0]?.args || { approved: true, reason: '검토 응답을 받지 못해 기본 승인 처리되었습니다.' }
  sendEvent({ type: 'review_result', verdict: verdict.approved ? 'approved' : 'rejected', reason: verdict.reason })

  // 9. React 대시보드 반영은 클라이언트에서 "적용" 클릭 시 수행 — 여기서는 미리보기만 전달
  sendEvent({
    type: 'patch_ready',
    patch,
    sql,
    topic: proposal.topic ?? null,
    review: verdict,
    summaryText,
    previewWidget: widget,
    blocked: !verdict.approved,
    warning,
  })
}
