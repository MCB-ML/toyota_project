import { createAzureClient, getAzureConfig } from './azureClient.js'
import { streamAssistantTurn } from './azureStream.js'
import {
  listTopicsForPrompt, buildTopicClassifierTools, loadTablesForTopic, renderTablesForPrompt,
} from './schemaLoader.js'
import { buildQueryTools, buildQuerySystemPrompt } from './warehouseTools.js'
import { queryFabric } from './fabricClient.js'

const STAGE_LABELS = {
  intent: '의도 분석 중...',
  load_schema: '관련 테이블 스키마 로드 중...',
  generate_sql: 'SQL 생성 중...',
  execute: 'Fabric 웨어하우스에 쿼리 실행 중...',
}

// 실제 LLM → SQL 생성 → Fabric 라이브 실행 파이프라인.
// dashboardPipeline.js와 달리 여기서 생성된 SQL은 표시용이 아니라 실제로 fabricClient.js를
// 통해 웨어하우스에 실행된다.
export async function runWarehouseQuery({ message, history }, { sendEvent }) {
  const stage = (name) => sendEvent({ type: 'stage', stage: name, label: STAGE_LABELS[name] })

  const client = createAzureClient()
  if (!client) {
    sendEvent({ type: 'error', message: 'Azure OpenAI 환경변수가 설정되지 않았습니다. .env 파일을 확인하세요.' })
    return
  }
  const { deployment } = getAzureConfig()

  // 1. 의도 분류 — 어느 topic(테이블 그룹)에 해당하는 질문인지
  stage('intent')
  const topicCalls = await streamAssistantTurn(client, {
    model: deployment,
    messages: [
      { role: 'system', content: `사용자 질문을 아래 주제 중 하나로 분류하세요.\n\n${listTopicsForPrompt()}` },
      ...history,
      { role: 'user', content: message },
    ],
    tools: buildTopicClassifierTools(),
  })

  const topicCall = topicCalls[0]
  if (!topicCall || !topicCall.args) {
    sendEvent({ type: 'error', message: '질문을 이해하지 못했습니다. 다시 말씀해주세요.' })
    return
  }
  if (topicCall.name === 'reject_topic') {
    sendEvent({ type: 'rejected', reason: topicCall.args.reason })
    return
  }

  // 2. 스키마 로드 — 해당 topic에 연결된 테이블만 (전체 187개 중 1~3개)
  stage('load_schema')
  const tables = loadTablesForTopic(topicCall.args.topic)
  if (!tables.length) {
    sendEvent({ type: 'error', message: `"${topicCall.args.topic}" 주제에 연결된 테이블이 없습니다.` })
    return
  }

  // 3. SQL 생성 — 로드된 테이블/컬럼 정보만으로 실제 실행될 SELECT 작성
  stage('generate_sql')
  const sqlCalls = await streamAssistantTurn(client, {
    model: deployment,
    messages: [
      { role: 'system', content: buildQuerySystemPrompt(tables, renderTablesForPrompt(tables)) },
      { role: 'user', content: message },
    ],
    tools: buildQueryTools(tables),
  })

  const sqlCall = sqlCalls[0]
  if (!sqlCall || !sqlCall.args) {
    sendEvent({ type: 'error', message: 'SQL을 생성하지 못했습니다.' })
    return
  }
  if (sqlCall.name === 'reject_query') {
    sendEvent({ type: 'rejected', reason: sqlCall.args.reason, topic: topicCall.args.topic })
    return
  }

  const { db, table_id, sql, title } = sqlCall.args
  if (!tables.some(t => t.db === db && t.id === table_id)) {
    sendEvent({ type: 'error', message: `허용되지 않은 테이블입니다: ${db}.${table_id}` })
    return
  }

  // 4. 실제 실행 — fabricClient.js가 SELECT/WITH 외에는 거부
  stage('execute')
  let rows
  try {
    rows = await queryFabric(db, sql)
  } catch (err) {
    sendEvent({ type: 'error', message: `쿼리 실행 실패: ${err.message}` })
    return
  }

  sendEvent({
    type: 'query_result',
    topic: topicCall.args.topic,
    db, table_id, sql, title,
    rowCount: rows.length,
    rows,
  })
}
