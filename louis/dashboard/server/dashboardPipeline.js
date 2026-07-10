import { randomUUID } from 'node:crypto'
import { createAzureClient, getAzureConfig } from './azureClient.js'
import { streamAssistantTurn } from './azureStream.js'
import {
  buildDashboardTools, buildDashboardSystemPrompt,
  buildReviewTools, buildReviewPrompt,
} from './dashboardTools.js'
import { getMetric, resolveMetricRaw, buildSqlForMetric } from './semanticCatalog.js'
import { buildWidgetProps } from './widgetSchema.js'
import { validateProposal, validateWidgetProps, isDuplicateWidget } from './dashboardValidation.js'

const STAGE_LABELS = {
  intent: '의도 분석 중...',
  mapping: '지표 매핑 중...',
  sql: 'SQL 생성 중...',
  chart_spec: '차트 스펙 생성 중...',
  patch: '레이아웃 patch 생성 중...',
  review: '검토 에이전트 확인 중...',
}

const ACTION_BY_TOOL = {
  propose_add_widget: 'add',
  propose_remove_widget: 'remove',
  propose_modify_widget: 'modify',
  propose_reorder_widgets: 'reorder',
}

function summarizeProposal(action, metric, proposal) {
  if (action === 'add') return `"${metric.label}" 지표를 ${proposal.chartCode} 형태로 추가 (제목: "${proposal.title}")`
  if (action === 'modify') return `기존 위젯을 "${metric.label}" 지표(${proposal.chartCode})로 변경 (제목: "${proposal.title}")`
  if (action === 'remove') return `위젯 삭제 (id=${proposal.widgetId})`
  if (action === 'reorder') return `위젯 순서 변경 (id=${proposal.widgetId} → 위치 ${proposal.toIndex})`
  return ''
}

// Orchestrates: 의도분류+상태읽기+metric매핑(1 LLM call, tool-calling)
// → SQL생성/차트스펙생성/패치생성(결정론적) → 검토 에이전트(1 LLM call).
// See louis/dashboard/README.md for the full stage-by-stage writeup.
export async function runDashboardPipeline({ message, history, dashboardState }, { dataDir, sendEvent }) {
  const stage = (name) => sendEvent({ type: 'stage', stage: name, label: STAGE_LABELS[name] })

  const client = createAzureClient()
  if (!client) {
    sendEvent({ type: 'error', message: 'Azure OpenAI 환경변수가 설정되지 않았습니다. .env 파일을 확인하세요.' })
    return
  }
  const { deployment } = getAzureConfig()

  // 1. 의도 분류 + 2. 현재 대시보드 상태 읽기(프롬프트 컨텍스트) + 3. metric 매핑
  stage('intent')
  stage('mapping')
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
    metricId: call.args.metric_id,
    chartCode: call.args.chart_type,
    title: call.args.title,
    widgetId: call.args.widget_id,
    toIndex: call.args.to_index,
  }

  const structural = validateProposal(proposal, dashboardState)
  if (!structural.ok) {
    sendEvent({ type: 'error', message: structural.reason })
    return
  }

  let sql = null
  let widget = null
  let patch = null
  let metric = null

  if (action === 'add' || action === 'modify') {
    // 4. SQL 생성 (표시용, 미실행)
    stage('sql')
    metric = getMetric(proposal.metricId)
    sql = buildSqlForMetric(proposal.metricId)

    // 5. 차트 스펙 생성 — 실제 데이터는 항상 semanticCatalog에서 가져온다 (LLM이 생성한 값 아님)
    stage('chart_spec')
    const rawData = resolveMetricRaw(proposal.metricId, dataDir)
    const built = buildWidgetProps(metric, proposal.chartCode, rawData, proposal.title)
    widget = {
      id: action === 'modify' ? proposal.widgetId : randomUUID(),
      type: built.type,
      metricId: proposal.metricId,
      createdAt: new Date().toISOString(),
      props: built.props,
    }

    const propCheck = validateWidgetProps(widget)
    if (!propCheck.ok) {
      sendEvent({ type: 'error', message: propCheck.reason })
      return
    }

    // 6. 레이아웃 patch 생성
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
  }

  const warning = widget && isDuplicateWidget(widget, dashboardState)
    ? '비슷한 위젯이 이미 대시보드에 있습니다.'
    : null

  // 7. 검토 에이전트
  stage('review')
  const summaryText = summarizeProposal(action, metric, proposal)
  const reviewCalls = await streamAssistantTurn(client, {
    model: deployment,
    messages: [{
      role: 'user',
      content: buildReviewPrompt({
        userMessage: message,
        summaryText,
        sql,
        metricLabel: metric?.label,
        chartCode: proposal.chartCode,
      }),
    }],
    tools: buildReviewTools(),
    toolChoice: { type: 'function', function: { name: 'review_verdict' } },
  })

  const verdict = reviewCalls[0]?.args || { approved: true, reason: '검토 응답을 받지 못해 기본 승인 처리되었습니다.' }
  sendEvent({ type: 'review_result', verdict: verdict.approved ? 'approved' : 'rejected', reason: verdict.reason })

  // 8. React 대시보드 반영은 클라이언트에서 "적용" 클릭 시 수행 — 여기서는 미리보기만 전달
  sendEvent({
    type: 'patch_ready',
    patch,
    sql,
    metricId: proposal.metricId ?? null,
    review: verdict,
    summaryText,
    previewWidget: widget,
    blocked: !verdict.approved,
    warning,
  })
}
