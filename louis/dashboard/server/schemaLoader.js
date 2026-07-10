import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { load as parseYaml } from 'js-yaml'

// Two-tier loader for the warehouse semantic schema (louis/docs/정의서/ 병합 결과에서
// 파생, 187개 실업무 테이블). Mirrors semanticCatalog.js's pattern: a small always-in-context
// index + full detail fetched on demand — except here "on demand" means reading one small
// YAML file per table instead of a JSON path lookup, because the underlying catalog is far
// too large (187 tables × 컬럼 상세 ≈ 150K 토큰) to keep entirely in memory-as-prompt-text.
//
// Intended flow for a future 그래프 생성 챗봇 (mirrors dashboardPipeline.js's Planner/Critic split):
//   1. 의도 분류: LLM tool-calls `classify_topic` against listTopicsForPrompt() (cheap, ~2-3K
//      토큰 컨텍스트) to pick one of the 11 topics (or reject if none fit).
//   2. loadTablesForTopic(topicId) reads only the 1-3 relevant table YAML files from disk.
//   3. renderTablesForPrompt(tables) formats just those into the second LLM call's context.
//
// __dirname-relative paths so this works regardless of CWD (vite dev vs `node server.js`).
const __dirname = dirname(fileURLToPath(import.meta.url))
const SCHEMA_DIR = join(__dirname, 'schema')
const TABLES_DIR = join(SCHEMA_DIR, 'tables')

let _index = null

function loadSchemaIndex() {
  if (_index) return _index
  const raw = readFileSync(join(SCHEMA_DIR, 'index.yaml'), 'utf-8')
  _index = parseYaml(raw)
  return _index
}

// Compact, always-affordable text block for the intent-classification prompt.
export function listTopicsForPrompt() {
  const { topics } = loadSchemaIndex()
  return topics
    .map(t => `- ${t.topic}: ${t.ko} (키워드: ${t.keywords.join('/')})`)
    .join('\n')
}

// OpenAI function-calling tool schema for the classification step — same shape as
// dashboardTools.js's buildDashboardTools(), so a future pipeline can reuse
// azureStream.js's streamAssistantTurn() unchanged.
export function buildTopicClassifierTools() {
  const { topics } = loadSchemaIndex()
  return [
    {
      type: 'function',
      function: {
        name: 'classify_topic',
        description: '사용자 질문을 아래 주제 목록 중 하나로 분류합니다. 어느 것도 맞지 않으면 reject_topic을 호출하세요.',
        parameters: {
          type: 'object',
          properties: {
            topic: { type: 'string', enum: topics.map(t => t.topic) },
            reasoning: { type: 'string', description: '왜 이 주제로 분류했는지 1문장' },
          },
          required: ['topic'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'reject_topic',
        description: '질문이 아래 주제 목록 중 어느 것과도 관련이 없을 때 사용합니다.',
        parameters: {
          type: 'object',
          properties: { reason: { type: 'string' } },
          required: ['reason'],
        },
      },
    },
  ]
}

export function getTopic(topicId) {
  const { topics } = loadSchemaIndex()
  return topics.find(t => t.topic === topicId) || null
}

export function listTableIndex() {
  return loadSchemaIndex().tables
}

// Reads and parses one table's full column definition from schema/tables/<file>.
// `ref` is either a filename (as stored in index.yaml) or {db, id}.
export function loadTableSchema(ref) {
  const filename = typeof ref === 'string' ? ref : findTableFile(ref.db, ref.id)
  if (!filename) return null
  const raw = readFileSync(join(TABLES_DIR, filename), 'utf-8')
  return { ...parseYaml(raw), _raw: raw }
}

function findTableFile(db, id) {
  const entry = listTableIndex().find(t => t.db === db && t.id === id)
  return entry ? entry.file : null
}

// Core retrieval step: given a classified topic, load full detail for exactly the
// tables that topic references — never the whole 187-table catalog.
export function loadTablesForTopic(topicId) {
  const topic = getTopic(topicId)
  if (!topic) return []
  return topic.tables.map(ref => ({
    ...loadTableSchema(ref.file),
    key_cols: ref.key_cols || null,
    note: ref.note || null,
  }))
}

// Compact text block for the second LLM call (chart-spec / SQL-generation stage) —
// only the columns, not the raw YAML formatting.
export function renderTablesForPrompt(tables) {
  return tables
    .map(t => {
      const lines = [`### ${t.id} (${t.db})${t.ko ? ' — ' + t.ko : ''}`]
      if (t.note) lines.push(`참고: ${t.note}`)
      if (t.key_cols?.length) lines.push(`주요 컬럼: ${t.key_cols.join(', ')}`)
      lines.push(...t.cols.map(c => `- ${c.n} (${c.t})${c.ko ? ': ' + c.ko : ''}${c.pk ? ' [PK]' : ''}`))
      return lines.join('\n')
    })
    .join('\n\n')
}
