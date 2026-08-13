import 'dotenv/config'
import { createAzureClient, getAzureConfig } from '../azureClient.js'
import { streamAssistantTurn } from '../azureStream.js'
import {
  listTopicsForPrompt, buildTopicClassifierTools, loadTablesForTopic,
  renderTablesForPrompt, loadRoutingNotes,
} from '../schemaLoader.js'
import { buildQueryTools, buildQuerySystemPrompt } from '../warehouseTools.js'
import { queryFabric } from '../fabricClient.js'
import { runPipeline } from './pipeline.js'

// One query in, one JSON object out — logs exactly what the TOPIC path and the RAG path
// each picked (topic/pattern/fragments/rules) plus the SQL each produced, so a notebook (or
// anything else) can inspect routing decisions without re-implementing this wiring.
// Usage: node inspectQuery.mjs "<질문>" [--execute]

async function runTopicPath(client, deployment, query) {
  const t0 = Date.now()
  const topicCalls = await streamAssistantTurn(client, {
    model: deployment,
    messages: [
      { role: 'system', content: `사용자 질문을 아래 주제 중 하나로 분류하세요.\n\n${listTopicsForPrompt()}` },
      { role: 'user', content: query },
    ],
    tools: buildTopicClassifierTools(),
  })
  const classifyMs = Date.now() - t0
  const topicCall = topicCalls[0]
  if (!topicCall?.args || topicCall.name === 'reject_topic') {
    return { topic: null, tables: [], routingNotes: null, sql: null, error: 'topic 분류 실패 (reject_topic)', latencyMs: classifyMs }
  }
  const topic = topicCall.args.topic
  const tables = loadTablesForTopic(topic)
  const routingNotes = loadRoutingNotes(topic)
  const rendered = renderTablesForPrompt(tables) + (routingNotes ? `\n\n# 이 주제의 라우팅 규칙 + 예시\n${routingNotes}` : '')

  const t1 = Date.now()
  const sqlCalls = await streamAssistantTurn(client, {
    model: deployment,
    messages: [
      { role: 'system', content: buildQuerySystemPrompt(tables, rendered) },
      { role: 'user', content: query },
    ],
    tools: buildQueryTools(tables),
  })
  const sqlMs = Date.now() - t1
  const sqlCall = sqlCalls[0]

  return {
    topic,
    tables: tables.map(t => ({ db: t.database, id: t.table })),
    routingNotesLength: routingNotes?.length ?? 0,
    sql: sqlCall?.args?.sql ?? null,
    sqlDb: sqlCall?.args?.db ?? null,
    error: sqlCall?.args?.sql ? null : (sqlCall ? `SQL 생성 거부: ${JSON.stringify(sqlCall.args)}` : 'SQL 생성 실패(응답 없음)'),
    latencyMs: classifyMs + sqlMs,
  }
}

// Stage 9b's TOP-1 Fabric probe runs inside runPipeline() regardless of --execute (per the
// pipeline redesign plan) — --execute only controls whether we ALSO run the real-topN answer.
async function runRagPath(client, deployment, query) {
  const t0 = Date.now()
  const rag = await runPipeline({ query, client, deployment, opts: { liveValidate: true } })
  const latencyMs = Date.now() - t0

  return {
    ...rag,
    sql: rag.composedSql,
    error: rag.error || (rag.validation && rag.validation.liveCheckPassed === false ? rag.validation.error : null),
    latencyMs,
  }
}

async function maybeExecute(result, execute) {
  if (!execute || !result.sql) return result
  try {
    const rows = await queryFabric(result.sqlDb || 'KPI_W', result.sql)
    return { ...result, execRows: rows.slice(0, 50), execRowCount: rows.length }
  } catch (err) {
    return { ...result, execError: err.message }
  }
}

async function main() {
  const query = process.argv[2]
  const execute = process.argv.includes('--execute')
  if (!query) {
    console.error('Usage: node inspectQuery.mjs "<질문>" [--execute]')
    process.exit(1)
  }

  const client = createAzureClient()
  if (!client) throw new Error('Azure OpenAI env vars missing')
  const { deployment } = getAzureConfig()

  let [topicResult, ragResult] = await Promise.all([
    runTopicPath(client, deployment, query),
    runRagPath(client, deployment, query),
  ])
  topicResult = await maybeExecute(topicResult, execute)
  ragResult = await maybeExecute(ragResult, execute)

  console.log(JSON.stringify({ query, topic: topicResult, rag: ragResult }))
}

main().catch(err => {
  console.error(JSON.stringify({ error: err.message }))
  process.exit(1)
})
