import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { load as parseYaml } from 'js-yaml'
import { glossary } from './schema/glossary.js'

// Two-tier loader for the warehouse semantic schema (schema/tables/*.yaml, 20개 KPI_W 테이블,
// rich 포맷: table/description/database/schema/grain/columns[{name,type,description}]/
// semantics{role,keys}/filters/dimensions/features/measures/display). Mirrors semanticCatalog.js's
// pattern: a small always-in-context index + full detail fetched on demand — except here "on
// demand" means reading one small YAML file per table instead of a JSON path lookup, because
// keeping every table's full column list in the prompt at once would blow the context budget.
//
// Intended flow for a future 그래프 생성 챗봇 (mirrors dashboardPipeline.js's Planner/Critic split):
//   1. 의도 분류: LLM tool-calls `classify_topic` against listTopicsForPrompt() (cheap, ~2-3K
//      토큰 컨텍스트) to pick one of the 6 topics (or reject if none fit).
//   2. loadTablesForTopic(topicId) reads only the 1-3 relevant table YAML files from disk.
//   3. renderTablesForPrompt(tables) formats just those into the second LLM call's context.
//
// __dirname-relative paths so this works regardless of CWD (vite dev vs `node server.js`).
const __dirname = dirname(fileURLToPath(import.meta.url))
const SCHEMA_DIR = join(__dirname, 'schema')
const TABLES_DIR = join(SCHEMA_DIR, 'tables')
const ROUTING_DIR = join(SCHEMA_DIR, 'routing')

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

// 도메인 용어 사전을 topic 목록과 함께 그대로 컨텍스트로 얹는다 — classify_topic이
// 사용자의 업계 용어/약어(코드, 줄임말 등)를 몰라서 엉뚱한 topic을 고르거나
// reject_topic을 호출하는 걸 줄이기 위함. 별도 LLM 리라이팅 호출 없이 기존
// classify_topic 호출 하나의 프롬프트에만 얹으므로 지연시간이 늘지 않는다.
// 항목이 12개뿐이라 검색 없이 전체를 항상 포함(server/rag-poc/의 임베딩 검색과 달리
// 여기선 결정론적 텍스트 삽입만 한다 — glossary.js 자체는 아무 판단도 하지 않음).
export function renderGlossaryForPrompt() {
  return glossary.map(g => `- ${g.term}: ${g.definition}`).join('\n')
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

export function listTopics() {
  return loadSchemaIndex().topics
}

export function listTableIndex() {
  return loadSchemaIndex().tables
}

// Reads and parses one table's full column definition from schema/tables/<file>.
// `ref` is either a filename (as stored in index.yaml) or {db, id}.
export function loadTableSchema(ref) {
  if (!ref) return null
  const filename = typeof ref === 'string' ? ref : ref.file || findTableFile(ref.db, ref.id)
  if (!filename) return null
  const raw = readFileSync(join(TABLES_DIR, filename), 'utf-8')
  return { ...parseYaml(raw), _raw: raw }
}

function findTableFile(db, id) {
  const entry = listTableIndex().find(t => t.db === db && t.id === id)
  return entry ? entry.file : null
}

// Core retrieval step: given a classified topic, load full detail for exactly the
// tables that topic references — never the whole 20-table catalog. A single bad
// reference (index.yaml entry missing/wrong `file`) is skipped rather than crashing
// the whole request — same "drop the broken one, keep the rest" approach as
// dashboardPagesHandler.js's rehydration.
export function loadTablesForTopic(topicId) {
  const topic = getTopic(topicId)
  if (!topic) return []
  return topic.tables
    .map(ref => {
      const schema = loadTableSchema(ref)
      if (!schema) {
        console.error(`[schemaLoader] 테이블 로드 실패 (topic=${topicId}):`, JSON.stringify(ref))
        return null
      }
      return { ...schema, key_cols: ref.key_cols || null, note: ref.note || null }
    })
    .filter(Boolean)
}

// 주제별 라우팅 규칙 + few-shot SQL 예시 (server/schema/routing/<topic>.md). 컬럼 정의만으로는
// LLM이 "같은 개념을 담은 여러 테이블 중 뭘 골라야 하는지"/"cross-db 조인 불가" 같은 걸
// 모르기 때문에 SQL 생성 프롬프트에 추가로 얹는다. 아직 작성 안 된 주제는 빈 문자열 —
// 나머지 파이프라인은 그대로 동작(신규 주제 추가 시 파일이 없어도 안 죽음).
export function loadRoutingNotes(topicId) {
  try {
    return readFileSync(join(ROUTING_DIR, `${topicId}.md`), 'utf-8')
  } catch {
    return ''
  }
}

// Compact text block for the second LLM call (chart-spec / SQL-generation stage) —
// flattens the rich per-table YAML into plain lines, not the raw YAML formatting.
export function renderTablesForPrompt(tables) {
  return tables
    .map(t => {
      const primaryKeys = new Set(t.semantics?.keys?.primary || [])
      const lines = [`### ${t.table} (${t.database}.${t.schema})${t.description ? ' — ' + t.description : ''}`]
      if (t.grain) lines.push(`Grain: ${t.grain}`)
      if (t.note) lines.push(`참고: ${t.note}`)
      if (t.key_cols?.length) lines.push(`주요 컬럼: ${t.key_cols.join(', ')}`)
      lines.push(...t.columns.map(c => `- ${c.name} (${c.type})${primaryKeys.has(c.name) ? ' [PK]' : ''}: ${c.description}`))
      if (t.filters?.length) lines.push(`필터 컬럼: ${t.filters.map(f => f.column).join(', ')}`)
      if (t.measures?.length) lines.push(`측정값(집계): ${t.measures.map(m => `${m.name}(${m.aggregation})`).join(', ')}`)
      if (t.display?.default_columns?.length) lines.push(`기본 표시 컬럼: ${t.display.default_columns.join(', ')}`)
      return lines.join('\n')
    })
    .join('\n\n')
}
