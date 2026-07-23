import { createAzureClient, getAzureConfig } from './azureClient.js'
import { streamAssistantTurn } from './azureStream.js'
import {
  listTopicsForPrompt, buildTopicClassifierTools, loadTablesForTopic, renderTablesForPrompt,
} from './schemaLoader.js'
import { buildQueryTools, buildQuerySystemPrompt } from './warehouseTools.js'
import { queryFabric } from './fabricClient.js'
import { runPipeline } from './rag-poc/pipeline.js'

const STAGE_LABELS = {
  rag_plan: 'Pattern Card 매칭 중...',
  intent: '의도 분석 중...',
  load_schema: '관련 테이블 스키마 로드 중...',
  generate_sql: 'SQL 생성 중...',
  execute: 'Fabric 웨어하우스에 쿼리 실행 중...',
}

// 실제 LLM → SQL 생성 → Fabric 라이브 실행 파이프라인.
// dashboardPipeline.js와 달리 여기서 생성된 SQL은 표시용이 아니라 실제로 fabricClient.js를
// 통해 웨어하우스에 실행된다.
//
// RAG(rag-poc/pipeline.js, Pattern Card/Fragment 기반)를 우선 시도하고, Pattern Card가
// 매칭되지 않거나(rag.error) Stage9b 실행 검증에 실패하면(liveCheckPassed:false) 기존
// TOPIC 분류 방식으로 폴백한다 — RAG는 26개 Pattern Card로 커버되는 범위만 다루므로, TOPIC을
// 완전히 대체하면 그 밖의 질문에 대한 기존 커버리지가 퇴보하기 때문이다. GOLD 검증된 15개
// 측정값 기준 RAG 14~15/15 vs TOPIC 8~9/15로 정확도 차이가 크다(server/rag-poc/test-report.md).
export async function runWarehouseQuery({ message, history }, { sendEvent }) {
  const client = createAzureClient()
  if (!client) {
    sendEvent({ type: 'error', message: 'Azure OpenAI 환경변수가 설정되지 않았습니다. .env 파일을 확인하세요.' })
    return
  }
  const { deployment } = getAzureConfig()

  sendEvent({ type: 'stage', stage: 'rag_plan', label: STAGE_LABELS.rag_plan })
  let rag
  try {
    rag = await runPipeline({ query: message, client, deployment, opts: { liveValidate: true } })
  } catch (err) {
    // Postgres/Chroma 장애 등 검색 단계 자체가 죽은 경우도 TOPIC 폴백으로 흡수한다.
    rag = { error: err.message }
  }

  if (!rag.error && rag.validation?.liveCheckPassed !== false) {
    sendEvent({ type: 'stage', stage: 'execute', label: STAGE_LABELS.execute })
    try {
      const rows = await queryFabric(rag.sqlDb, rag.composedSql)
      sendEvent({
        type: 'query_result',
        topic: rag.stage3_plan.pattern_id, // 기존 필드 슬롯 재사용(이름은 topic 그대로, 값은 RAG pattern_id)
        db: rag.sqlDb,
        table_id: rag.tables[0]?.id ?? rag.stage3_plan.pattern_id,
        sql: rag.composedSql,
        title: rag.stage3_plan.pattern_id,
        rowCount: rows.length,
        rows,
      })
      return
    } catch {
      // 표시용 실행에서 실패하면(Stage9b가 이미 topN:1로 검증했지만 드물게 재현될 수 있음)
      // 아래로 흘러 TOPIC 경로로 폴백한다.
    }
  }

  await runWarehouseQueryViaTopic({ message, history }, { sendEvent, client, deployment })
}

// 기존 TOPIC 분류 기반 흐름 — RAG가 매칭 실패했거나 검증에 실패했을 때의 폴백.
async function runWarehouseQueryViaTopic({ message, history }, { sendEvent, client, deployment }) {
  const stage = (name) => sendEvent({ type: 'stage', stage: name, label: STAGE_LABELS[name] })

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

  // 2. 스키마 로드 — 해당 topic에 연결된 테이블만 (전체 20개 중 1~7개)
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
  if (!tables.some(t => t.database === db && t.table === table_id)) {
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
