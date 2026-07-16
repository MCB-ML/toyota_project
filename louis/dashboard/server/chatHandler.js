import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { createAzureClient, readJsonBody, getAzureConfig } from './azureClient.js'
import { streamAssistantTurn } from './azureStream.js'
import { TOOLS, buildSystemPrompt } from './chatTools.js'
import { buildTopicClassifierTools, loadTablesForTopic, renderTablesForPrompt } from './schemaLoader.js'
import { buildWidgetQueryTools, buildWidgetQuerySystemPrompt } from './dashboardTools.js'
import { queryFabric } from './fabricClient.js'
import { buildWidgetPropsFromRows } from './widgetSchema.js'
import { sanitizeHistoryForClassification } from './lifecycle.js'

const STAGE_LABELS = {
  load_schema: '관련 테이블 스키마 로드 중...',
  generate_sql: 'SQL 생성 중...',
  execute: 'Fabric 웨어하우스에 쿼리 실행 중...',
}

// Stage 2+3: given a topic the planner picked, load its tables, have the model
// write a real T-SQL SELECT, run it live against Fabric, and shape the rows into
// render_*-compatible props. Mirrors dashboardPipeline.js's 'add widget' branch,
// minus the layout-patch step (chat just shows the result inline).
async function fetchLiveTopicData(client, deployment, { topic, message, sendEvent }) {
  sendEvent({ type: 'stage', stage: 'load_schema', label: STAGE_LABELS.load_schema })
  const tables = loadTablesForTopic(topic)
  if (!tables.length) {
    sendEvent({ type: 'error', message: `"${topic}" 주제에 연결된 테이블이 없습니다.` })
    return
  }

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
  if (!tables.some(t => t.db === queryInfo.db && t.id === queryInfo.table_id)) {
    sendEvent({ type: 'error', message: `허용되지 않은 테이블입니다: ${queryInfo.db}.${queryInfo.table_id}` })
    return
  }

  sendEvent({ type: 'stage', stage: 'execute', label: STAGE_LABELS.execute })
  let rows
  try {
    rows = await queryFabric(queryInfo.db, queryInfo.sql)
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
        await fetchLiveTopicData(client, deployment, { topic: tc.args.topic, message: lastUserMessage, sendEvent })
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
