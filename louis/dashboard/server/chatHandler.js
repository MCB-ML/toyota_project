import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { createAzureClient, readJsonBody, getAzureConfig } from './azureClient.js'
import { streamAssistantTurn } from './azureStream.js'
import { TOOLS, buildSystemPrompt } from './chatTools.js'
import { buildTopicClassifierTools, loadTablesForTopic, renderTablesForPrompt, getTopic } from './schemaLoader.js'
import { buildWidgetQueryTools, buildWidgetQuerySystemPrompt } from './dashboardTools.js'
import { queryFabricWithTimeout, MAX_ROWS_BEFORE_REASK, tooManyRowsMessage } from './fabricClient.js'
import { buildWidgetPropsFromRows } from './widgetSchema.js'
import { sanitizeHistoryForClassification } from './lifecycle.js'
import { runPipeline } from './rag-poc/pipeline.js'
import { getPatternsByIds } from './rag-poc/kb.js'

const STAGE_LABELS = {
  rag_plan: 'Pattern Card 매칭 중...',
  load_schema: '관련 테이블 스키마 로드 중...',
  generate_sql: 'SQL 생성 중...',
  execute: 'Fabric 웨어하우스에 쿼리 실행 중...',
}

// widgetSchema.js의 buildWidgetPropsFromRows는 'kpi'(단일 행, 컬럼명 그대로 카드화)와
// 'table'(다중 행, 컬럼명 그대로 표로) 둘 다 labelKey/valueKey 같은 축 매핑 없이 컬럼명만으로
// 동작한다 — 그래서 RAG의 Pattern Card가 이미 갖고 있는 intent만으로 차트 타입을 결정할 수
// 있고, 이 결정을 위한 별도 LLM 호출이 필요 없다. bar/line/pie는 축 매핑 정보가 없어서 범위 밖.
function chartTypeForIntent(intent) {
  const listy = ['breakdown', 'list', 'trend'].some(k => intent?.includes(k))
  return listy ? 'table' : 'kpi'
}

// RAG(rag-poc/pipeline.js) 우선 시도 → Pattern Card 미매칭이거나 Stage9b 실행 검증 실패 시
// 기존 TOPIC 분류 방식(fetchLiveTopicDataViaTopic)으로 폴백. RAG는 26개 Pattern Card로
// 커버되는 범위만 다루므로 TOPIC을 완전히 대체하면 그 밖의 질문에 대한 기존 커버리지가
// 퇴보한다 — GOLD 검증된 15개 측정값 기준 RAG 14~15/15 vs TOPIC 8~9/15
// (server/rag-poc/test-report.md).
async function fetchLiveTopicData(client, deployment, { topic, reasoning, message, sendEvent }) {
  sendEvent({ type: 'stage', stage: 'rag_plan', label: STAGE_LABELS.rag_plan })
  let rag
  try {
    rag = await runPipeline({ query: message, client, deployment, opts: { liveValidate: true } })
  } catch (err) {
    // Postgres/Chroma 장애 등 검색 단계 자체가 죽은 경우도 TOPIC 폴백으로 흡수한다.
    rag = { error: err.message }
  }

  if (!rag.error && rag.validation?.liveCheckPassed !== false) {
    sendEvent({ type: 'debug', label: 'RAG pattern 선택', detail: { pattern: rag.stage3_plan.pattern_id } })
    sendEvent({ type: 'stage', stage: 'execute', label: STAGE_LABELS.execute })
    try {
      const rows = await queryFabricWithTimeout(rag.sqlDb, rag.composedSql)
      if (rows.length > MAX_ROWS_BEFORE_REASK) {
        sendEvent({ type: 'text', text: tooManyRowsMessage(rows.length) })
        return
      }
      const [pattern] = await getPatternsByIds([rag.stage3_plan.pattern_id])
      const chartType = chartTypeForIntent(pattern?.intent)
      const built = buildWidgetPropsFromRows(chartType, rows, {}, pattern?.name || rag.stage3_plan.pattern_id)
      sendEvent({ type: 'component', name: built.type, props: built.props })
      return
    } catch (err) {
      // 타임아웃은 TOPIC으로 조용히 폴백시키지 않는다 — 같은 원인(무거운 쿼리)으로 TOPIC도
      // 오래 걸릴 가능성이 높으므로, 재시도 대신 바로 사용자에게 되묻는다.
      if (err.isTimeout) {
        sendEvent({ type: 'text', text: err.message })
        return
      }
      // 그 외 표시용 실행 실패(드묾 — Stage9b가 이미 검증했지만)는 TOPIC 경로로 폴백.
    }
  }

  await fetchLiveTopicDataViaTopic(client, deployment, { topic, reasoning, message, sendEvent })
}

// 기존 TOPIC 분류 기반 흐름 — RAG가 매칭 실패했거나 검증에 실패했을 때의 폴백.
// Stage 2+3: given a topic the planner picked, load its tables, have the model
// write a real T-SQL SELECT, run it live against Fabric, and shape the rows into
// render_*-compatible props. Mirrors dashboardPipeline.js's 'add widget' branch,
// minus the layout-patch step (chat just shows the result inline).
async function fetchLiveTopicDataViaTopic(client, deployment, { topic, reasoning, message, sendEvent }) {
  sendEvent({ type: 'debug', label: 'topic 선택', detail: { topic, reasoning: reasoning || null } })

  sendEvent({ type: 'stage', stage: 'load_schema', label: STAGE_LABELS.load_schema })
  const tables = loadTablesForTopic(topic)
  if (!tables.length) {
    sendEvent({ type: 'error', message: `"${topic}" 주제에 연결된 테이블이 없습니다.` })
    return
  }
  sendEvent({
    type: 'debug',
    label: '스키마 로드',
    detail: { tables: tables.map(t => ({ database: t.database, table: t.table, columns: t.columns.map(c => c.name) })) },
  })

  sendEvent({ type: 'stage', stage: 'generate_sql', label: STAGE_LABELS.generate_sql })
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
    sendEvent({ type: 'text', text: sqlCall.args.reason || '요청하신 데이터를 찾지 못했습니다.' })
    return
  }

  const queryInfo = sqlCall.args
  if (!tables.some(t => t.database === queryInfo.db && t.table === queryInfo.table_id)) {
    sendEvent({ type: 'error', message: `허용되지 않은 테이블입니다: ${queryInfo.db}.${queryInfo.table_id}` })
    return
  }
  sendEvent({ type: 'debug', label: 'SQL 생성', detail: { db: queryInfo.db, table: queryInfo.table_id, sql: queryInfo.sql } })

  sendEvent({ type: 'stage', stage: 'execute', label: STAGE_LABELS.execute })
  let rows
  try {
    rows = await queryFabricWithTimeout(queryInfo.db, queryInfo.sql)
  } catch (err) {
    if (err.isTimeout) {
      sendEvent({ type: 'text', text: err.message })
      return
    }
    sendEvent({ type: 'error', message: `쿼리 실행 실패: ${err.message}` })
    return
  }
  if (rows.length > MAX_ROWS_BEFORE_REASK) {
    sendEvent({ type: 'text', text: tooManyRowsMessage(rows.length) })
    return
  }

  const built = buildWidgetPropsFromRows(queryInfo.chart_type, rows, {
    labelKey: queryInfo.label_key,
    valueKey: queryInfo.value_key,
    xKey: queryInfo.x_key,
    yKeys: queryInfo.y_keys,
  }, queryInfo.title)

  sendEvent({ type: 'component', name: built.type, props: built.props })
}

// Handles POST /api/chat — free-form Q&A over the Toyota/Lexus data summary,
// with the model optionally calling render_* tools to attach charts/tables, or
// classify_topic when the static summary doesn't cover what was asked (in which
// case fetchLiveTopicData() runs a real text2SQL query against Fabric).
// Shared verbatim between the Vite dev middleware and the Express prod server;
// only `dataDir` (public/data in dev, dist/data in prod) differs between them.
export async function handleChatRequest(req, res, { dataDir }) {
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.setHeader('X-Accel-Buffering', 'no')

  const sendEvent = (data) => res.write(`data: ${JSON.stringify(data)}\n\n`)

  try {
    const client = createAzureClient()
    if (!client) {
      sendEvent({ type: 'error', message: 'Azure OpenAI 환경변수가 설정되지 않았습니다. .env 파일을 확인하세요.' })
      return res.end()
    }

    const { messages } = await readJsonBody(req)

    const summaryPath = join(dataDir, 'summary.json')
    if (!existsSync(summaryPath)) {
      sendEvent({ type: 'error', message: 'summary.json을 찾을 수 없습니다. generate_data.py를 먼저 실행하세요.' })
      return res.end()
    }
    const summary = JSON.parse(readFileSync(summaryPath, 'utf-8'))

    const { deployment } = getAzureConfig()
    const lastUserMessage = [...messages].reverse().find(m => m.role === 'user')?.content || ''
    const toolCalls = await streamAssistantTurn(client, {
      model: deployment,
      messages: [{ role: 'system', content: buildSystemPrompt(summary) }, ...sanitizeHistoryForClassification(messages)],
      tools: [...TOOLS, ...buildTopicClassifierTools()],
      temperature: 0,
      onText: (text) => sendEvent({ type: 'text', text }),
    })

    for (const tc of toolCalls) {
      if (tc.name === 'reject_topic') continue
      if (tc.name === 'classify_topic') {
        if (!tc.args) {
          console.warn('[chat] Failed to parse classify_topic args:', tc)
          continue
        }
        // 모델이 enum을 벗어난 topic 값(예: 'reject_topic' 자체를 topic으로 착각)을 줄 때가
        // 있다 — 그대로 loadTablesForTopic에 넘기면 "'X' 주제에 연결된 테이블이 없습니다"라는
        // 혼란스러운 에러가 난다. 알려진 topic이 아니면 거부로 처리한다.
        if (!getTopic(tc.args.topic)) {
          console.warn('[chat] classify_topic returned unknown topic:', tc.args.topic)
          sendEvent({ type: 'text', text: '요청하신 데이터를 찾지 못했습니다.' })
          continue
        }
        await fetchLiveTopicData(client, deployment, { topic: tc.args.topic, reasoning: tc.args.reasoning, message: lastUserMessage, sendEvent })
        continue
      }
      if (tc.args) {
        sendEvent({ type: 'component', name: tc.name, props: tc.args })
      } else {
        console.warn('[chat] Failed to parse tool call args:', tc)
      }
    }

    sendEvent({ type: 'done' })
    res.end()
  } catch (err) {
    console.error('[chat]', err.message)
    sendEvent({ type: 'error', message: `오류가 발생했습니다: ${err.message}` })
    res.end()
  }
}
