import { randomUUID } from 'node:crypto'
import { createAzureClient, getAzureConfig } from './azureClient.js'
import { streamAssistantTurn } from './azureStream.js'
import {
  buildDashboardTools, buildDashboardSystemPrompt,
  buildWidgetQueryTools, buildWidgetQuerySystemPrompt,
  buildRagChartSpecTools, buildRagChartSpecPrompt,
  buildReviewTools, buildReviewPrompt,
} from './dashboardTools.js'
import { loadTablesForTopic, renderTablesForPrompt, loadRoutingNotes } from './schemaLoader.js'
import { sanitizeHistoryForClassification } from './lifecycle.js'
import { queryFabricWithTimeout, MAX_ROWS_BEFORE_REASK, tooManyRowsMessage } from './fabricClient.js'
import { buildWidgetPropsFromRows } from './widgetSchema.js'
import { validateProposal, validateWidgetProps, isDuplicateWidget, MAX_WIDGETS } from './dashboardValidation.js'
import { SIZE_TO_SPAN } from '../src/utils/gridLayout.js'
import { runPipeline } from './rag-poc/pipeline.js'
import { getPatternsByIds } from './rag-poc/kb.js'

const STAGE_LABELS = {
  intent: '의도 분석 중...',
  rag_plan: 'Pattern Card 매칭 중...',
  chart_spec: '차트 형태 결정 중...',
  load_schema: '관련 테이블 스키마 로드 중...',
  generate_sql: 'SQL 생성 중...',
  execute: 'Fabric 웨어하우스에 쿼리 실행 중...',
  patch: '레이아웃 patch 생성 중...',
  review: '검토 에이전트 확인 중...',
}

// RAG(rag-poc/pipeline.js) 우선 시도 — chatHandler.js의 fetchLiveTopicData와 같은 전략.
// 미매칭/실행검증실패/빈 결과 등 어떤 이유로든 실패하면 null을 반환해 TOPIC 경로로
// 폴백시킨다. RAG는 SQL을 이미 실행까지 마친 뒤라 실제 결과 컬럼명을 알 수 있으므로,
// 그 컬럼명만 enum으로 준 아주 작은 2차 LLM 호출(set_chart_spec)로 축 매핑을 고르게 한다 —
// run_widget_query처럼 SQL을 새로 쓰게 하지 않으므로 컬럼명을 지어낼 위험이 없다.
async function tryRagWidget(client, deployment, message, sendEvent) {
  let rag
  try {
    rag = await runPipeline({ query: message, client, deployment, opts: { liveValidate: true } })
  } catch {
    return null
  }
  if (rag.error || rag.validation?.liveCheckPassed === false) return null

  sendEvent({ type: 'debug', label: 'RAG pattern 선택', detail: { pattern: rag.stage3_plan.pattern_id } })

  sendEvent({ type: 'stage', stage: 'execute', label: STAGE_LABELS.execute })
  let rows
  try {
    rows = await queryFabricWithTimeout(rag.sqlDb, rag.composedSql)
  } catch (err) {
    // 타임아웃은 TOPIC으로 조용히 폴백시키지 않는다 — 같은 원인(무거운 쿼리)으로 TOPIC도
    // 오래 걸릴 가능성이 높으므로, 재시도 대신 바로 사용자에게 되묻는다.
    if (err.isTimeout) {
      sendEvent({ type: 'text', text: err.message })
      return 'REASK'
    }
    return null
  }
  if (!rows.length) return null
  if (rows.length > MAX_ROWS_BEFORE_REASK) {
    sendEvent({ type: 'text', text: tooManyRowsMessage(rows.length) })
    return 'REASK' // 재시도 대신 TOPIC 폴백도 건너뛴다 — 같은 조건이면 TOPIC도 똑같이 많이 나옴
  }

  const [pattern] = await getPatternsByIds([rag.stage3_plan.pattern_id])
  const outputColumns = Object.keys(rows[0])

  sendEvent({ type: 'stage', stage: 'chart_spec', label: STAGE_LABELS.chart_spec })
  const specCalls = await streamAssistantTurn(client, {
    model: deployment,
    messages: [
      { role: 'system', content: buildRagChartSpecPrompt(pattern, outputColumns) },
      { role: 'user', content: message },
    ],
    tools: buildRagChartSpecTools(outputColumns),
    toolChoice: { type: 'function', function: { name: 'set_chart_spec' } },
  })
  const spec = specCalls[0]?.args
  if (!spec) return null

  return {
    db: rag.sqlDb,
    table: `RAG:${pattern.pattern_id}`,
    sql: rag.composedSql,
    chartCode: spec.chart_type,
    querySpec: { labelKey: spec.label_key, valueKey: spec.value_key, xKey: spec.x_key, yKeys: spec.y_keys },
    title: spec.title || pattern.name,
    size: spec.size,
    rows,
    ragPatternId: pattern.pattern_id,
  }
}

const ACTION_BY_TOOL = {
  propose_add_widget: 'add',
  propose_remove_widget: 'remove',
  propose_modify_widget: 'modify',
  propose_reorder_widgets: 'reorder',
  propose_resize_widget: 'resize',
}

const SIZE_LABEL = { sm: '작게', md: '보통', lg: '크게' }

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
      ...sanitizeHistoryForClassification(history),
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

  // 평가/디버그용 — 어떤 topic을 왜 골랐는지 클라이언트로 그대로 흘려보낸다.
  // 실제 라우팅 판단에는 관여하지 않는 관찰용 이벤트.
  if (proposal.topic) {
    sendEvent({ type: 'debug', label: 'topic 선택', detail: { topic: proposal.topic, reasoning: call.args.reasoning || null } })
  }

  let sql = null
  let widget = null
  let previewWidget = null
  let patch = null
  let queryInfo = null

  if (action === 'add' || action === 'modify') {
    // 4a. RAG(Pattern Card) 우선 시도 — chatHandler.js와 같은 전략. 실패하면 null이 와서
    // 기존 TOPIC 경로(4b)로 폴백한다.
    stage('rag_plan')
    let resolved = await tryRagWidget(client, deployment, message, sendEvent)
    if (resolved === 'REASK') return

    if (!resolved) {
      // 4b. 관련 테이블 스키마 로드 — 전체 20개 중 이 topic에 연결된 1~7개만
      stage('load_schema')
      const tables = loadTablesForTopic(proposal.topic)
      if (!tables.length) {
        sendEvent({ type: 'error', message: `"${proposal.topic}" 주제에 연결된 테이블이 없습니다.` })
        return
      }
      sendEvent({
        type: 'debug',
        label: '스키마 로드',
        detail: { tables: tables.map(t => ({ database: t.database, table: t.table, columns: t.columns.map(c => c.name) })) },
      })

      // 5. SQL 생성 + 차트 스펙 — 실제 실행될 SELECT를 LLM이 작성
      stage('generate_sql')
      const routingNotes = loadRoutingNotes(proposal.topic)
      const sqlCalls = await streamAssistantTurn(client, {
        model: deployment,
        messages: [
          { role: 'system', content: buildWidgetQuerySystemPrompt(renderTablesForPrompt(tables), routingNotes) },
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

      const topicQueryInfo = sqlCall.args
      if (!tables.some(t => t.database === topicQueryInfo.db && t.table === topicQueryInfo.table_id)) {
        sendEvent({ type: 'error', message: `허용되지 않은 테이블입니다: ${topicQueryInfo.db}.${topicQueryInfo.table_id}` })
        return
      }

      // 6. 실제 실행 — fabricClient.js가 SELECT/WITH 외에는 거부
      stage('execute')
      let rows
      try {
        rows = await queryFabricWithTimeout(topicQueryInfo.db, topicQueryInfo.sql)
      } catch (err) {
        if (err.isTimeout) {
          sendEvent({ type: 'text', text: err.message })
          return
        }
        console.error(`[dashboard-customize] 쿼리 실행 실패 (db=${topicQueryInfo.db}):`, topicQueryInfo.sql, '\n', err.message)
        sendEvent({ type: 'error', message: `쿼리 실행 실패: ${err.message}`, sql: topicQueryInfo.sql })
        return
      }
      if (rows.length > MAX_ROWS_BEFORE_REASK) {
        sendEvent({ type: 'text', text: tooManyRowsMessage(rows.length) })
        return
      }

      resolved = {
        db: topicQueryInfo.db,
        table: `${topicQueryInfo.db}.${topicQueryInfo.table_id}`,
        sql: topicQueryInfo.sql,
        chartCode: topicQueryInfo.chart_type,
        querySpec: {
          labelKey: topicQueryInfo.label_key,
          valueKey: topicQueryInfo.value_key,
          xKey: topicQueryInfo.x_key,
          yKeys: topicQueryInfo.y_keys,
        },
        title: topicQueryInfo.title,
        size: topicQueryInfo.size,
        rows,
      }
    }

    sql = resolved.sql
    queryInfo = { title: resolved.title, chart_type: resolved.chartCode, table_id: resolved.table }
    sendEvent({ type: 'debug', label: 'SQL 생성', detail: { db: resolved.db, table: resolved.table, sql: resolved.sql } })

    const baseWidgetFields = {
      db: resolved.db,
      table: resolved.table,
      sql: resolved.sql,
      chartCode: resolved.chartCode,
      title: resolved.title,
      topic: proposal.topic,
      // RAG(Pattern Card) 경로로 만들어졌을 때만 채워지는 메타데이터 — 디버깅/추적용, 렌더링에는 안 쓰임.
      ragPatternId: resolved.ragPatternId ?? null,
      createdAt: new Date().toISOString(),
    }

    // KPI를 새로 추가할 때는 한 행의 컬럼 각각을 독립된 위젯(카드 하나 = 위젯 하나)으로
    // 쪼갠다 — 사용자가 카드 하나하나를 따로 옮기고 크기 조절할 수 있도록. (수정/다른
    // 차트 타입은 기존처럼 위젯 하나.)
    let addWidgets = null

    if (resolved.chartCode === 'kpi' && action === 'add') {
      const row = resolved.rows[0] || {}
      const slotsLeft = Math.max(0, MAX_WIDGETS - dashboardState.widgets.length)
      const entries = Object.entries(row).slice(0, slotsLeft)
      if (!entries.length) {
        sendEvent({ type: 'error', message: `위젯 개수 제한(${MAX_WIDGETS}개)에 도달했습니다. 기존 위젯을 먼저 삭제해주세요.` })
        return
      }
      // 컬럼이 하나뿐이면(RAG 스칼라 패턴 대부분이 이 경우) 그 컬럼의 SQL 별칭 대신
      // 위젯 자체의 title(예: "영업기회→계약 전환율")을 카드 제목으로 쓴다 — RAG 경로는
      // SQL이 미리 저작된 fragment 템플릿이라 컬럼 별칭이 "Percentage"/"cnt"처럼 기술적인
      // 이름일 때가 많고, TOPIC 경로처럼 LLM이 매번 한국어 별칭을 새로 짓지 않기 때문.
      // 컬럼이 여러 개면(대부분 TOPIC 경로) 각자 다른 값을 담고 있으므로 계속 컬럼명을 쓴다.
      addWidgets = entries.map(([key, value]) => {
        // querySpec.cardTitle로 저장해야 살아남는다 — props는 저장 시 벗겨지고(다음
        // 로드 때 sql 재실행으로 다시 채움) widget.title은 이 요청에서 나온 모든 카드가
        // 공유하는 하나의 값이라 카드별로 다른 제목을 못 담는다.
        const cardTitle = entries.length === 1 ? resolved.title : key
        return {
          id: randomUUID(),
          ...baseWidgetFields,
          type: 'render_kpi_cards',
          querySpec: { ...resolved.querySpec, cardKey: key, cardTitle },
          // 자리(left/top/right/bottom)는 아직 없음 — WidgetGrid가 렌더 시 첫 빈 자리로 채워 넣는다.
          sizeHint: SIZE_TO_SPAN.sm,
          props: {
            title: cardTitle,
            value: typeof value === 'number' ? value.toLocaleString() : String(value ?? '-'),
          },
        }
      })
      for (const w of addWidgets) {
        const propCheck = validateWidgetProps(w)
        if (!propCheck.ok) {
          sendEvent({ type: 'error', message: propCheck.reason })
          return
        }
      }
      widget = addWidgets[0]
      // 미리보기는 카드들을 한데 모아 보여준다 — 실제로 추가되는 건 개별 위젯들이다.
      previewWidget = { type: 'render_kpi_cards', props: { cards: addWidgets.map(w => w.props) } }
    } else {
      // 기존 kpi 카드 하나를 수정하는 경우, 그 카드가 어느 컬럼이었는지(cardKey)를 유지한다.
      // cardTitle도 같이 저장해야 다음 로드 때(props가 벗겨진 뒤) 제목이 다시 컬럼명으로
      // 돌아가지 않는다 — add 경로와 동일한 이유.
      const cardKey = resolved.chartCode === 'kpi'
        ? (dashboardState.widgets.find(w => w.id === proposal.widgetId)?.querySpec?.cardKey ?? Object.keys(resolved.rows[0] || {})[0])
        : undefined
      const querySpec = cardKey !== undefined ? { ...resolved.querySpec, cardKey, cardTitle: resolved.title } : resolved.querySpec
      const built = buildWidgetPropsFromRows(resolved.chartCode, resolved.rows, querySpec, resolved.title)

      widget = {
        id: action === 'modify' ? proposal.widgetId : randomUUID(),
        ...baseWidgetFields,
        type: built.type,
        querySpec,
        // 자리(left/top/right/bottom)는 아직 없음 — WidgetGrid가 렌더 시 첫 빈 자리로
        // 배치하고, 그 결과를 커밋하면서 sizeHint 대신 실제 좌표로 정착시킨다.
        sizeHint: SIZE_TO_SPAN[resolved.size] || SIZE_TO_SPAN.md,
        props: built.props,
      }

      const propCheck = validateWidgetProps(widget)
      if (!propCheck.ok) {
        sendEvent({ type: 'error', message: propCheck.reason })
        return
      }
      previewWidget = widget
    }

    // 7. 레이아웃 patch 생성
    stage('patch')
    patch = addWidgets
      ? { baseVersion: dashboardState.version, ops: addWidgets.map(w => ({ op: 'add', widget: w })) }
      : action === 'add'
        ? { baseVersion: dashboardState.version, ops: [{ op: 'add', widget }] }
        : { baseVersion: dashboardState.version, ops: [{ op: 'update', widgetId: proposal.widgetId, widget }] }
  } else if (action === 'remove') {
    stage('patch')
    patch = { baseVersion: dashboardState.version, ops: [{ op: 'remove', widgetId: proposal.widgetId }] }
  } else if (action === 'reorder') {
    stage('patch')
    patch = { baseVersion: dashboardState.version, ops: [{ op: 'move', widgetId: proposal.widgetId, toIndex: proposal.toIndex }] }
  } else if (action === 'resize') {
    // 데이터/차트는 그대로 — 위젯 크기(그리드 칸 수)만 바꾸므로 스키마 로드/SQL/실행 전부 생략
    stage('patch')
    const existing = dashboardState.widgets.find(w => w.id === proposal.widgetId)
    const span = SIZE_TO_SPAN[proposal.size] || SIZE_TO_SPAN.md
    widget = typeof existing.left === 'number' && typeof existing.top === 'number'
      // 이미 자리가 있으면 왼쪽/위 모서리는 유지하고 칸 수만 바꾼다.
      ? { ...existing, right: existing.left + span.w, bottom: existing.top + span.h }
      // 자리가 없던(레거시) 위젯이면 sizeHint만 갱신 — 배치는 WidgetGrid가 맡는다.
      : { ...existing, sizeHint: span }
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
    previewWidget: previewWidget ?? widget,
    blocked: !verdict.approved,
    warning,
  })
}
