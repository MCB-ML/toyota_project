import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { embedTexts } from './embedClient.js'
import { cosineSim, topKBySimilarity } from './cosine.js'

// 4-stage retrieval pipeline (schema → few-shot/cross-table → dependency backfill →
// glossary), adapted from a reference diagram the user brought in. The JSON-field
// sub-stage from that diagram is deliberately omitted: none of our 203 tables have
// a JSON-typed column (checked — all varchar/float/bigint), so there is nothing for
// it to retrieve in this schema.
const __dirname = dirname(fileURLToPath(import.meta.url))

function loadCache(name) {
  return JSON.parse(readFileSync(join(__dirname, name), 'utf-8')).items
}

const tableCorpus = loadCache('embeddings.json')
const fewShotCorpus = loadCache('fewshot_embeddings.json')
const glossaryCorpus = loadCache('glossary_embeddings.json')

const tableKey = t => `${t.db}::${t.id}`

// Stage 1 — schema search. Plain top-K cosine over all 203 table blurbs.
function stage1SchemaSearch(queryVector, k = 5) {
  return topKBySimilarity(queryVector, tableCorpus, k)
    .map(t => ({ db: t.db, id: t.id, ko: t.ko, score: t.score }))
}

// Stage 2 — few-shot retrieval, general (any example) + cross-table (is_cross_table
// examples only, searched as their own filtered pool so join-pattern coverage
// doesn't depend on the general top-K happening to include one).
//
// MIN_SCORE gates both pools: with only 2 cross-table examples in the whole bank
// (see fewShotSet.js), a plain top-2-of-2 on the cross pool would force both into
// every single query's context regardless of relevance — confirmed empirically
// (검증: "재고 수량이 많은 부품 TOP 10" scored the calendar-join example at 0.332,
// clearly irrelevant, yet it'd rank #1 of 2 with no gate). The threshold is a blunt
// instrument here — general-pool scores for genuinely irrelevant examples can still
// land above it — the real fix is authoring more cross-table few-shot examples so
// top-K has enough true candidates to rank among.
const MIN_SCORE = 0.35

function stage2FewShot(queryVector, { generalK = 4, crossK = 2 } = {}) {
  const strip = fs => ({ id: fs.id, topic: fs.topic, query_pattern: fs.query_pattern, tables: fs.tables, is_cross_table: fs.is_cross_table, sql: fs.sql, score: fs.score })

  const general = topKBySimilarity(queryVector, fewShotCorpus, generalK).filter(fs => fs.score >= MIN_SCORE)
  const crossPool = fewShotCorpus.filter(fs => fs.is_cross_table)
  const cross = topKBySimilarity(queryVector, crossPool, Math.min(crossK, crossPool.length)).filter(fs => fs.score >= MIN_SCORE)
  return { general: general.map(strip), cross: cross.map(strip) }
}

// Stage 3 — dependency resolution. Any table a retrieved few-shot example touches
// but Stage 1 didn't surface gets backfilled: a direct schema lookup (we already
// know its exact db+id from the few-shot's own `tables` field, so no need to
// re-search semantically) plus a few-shot search scoped to that missing table, so
// generate_sql gets a usage example for the table it otherwise wouldn't have context on.
function stage3Backfill(hitTables, fewShotResults) {
  const hitKeys = new Set(hitTables.map(tableKey))
  const referencedTables = new Map()
  for (const fs of [...fewShotResults.general, ...fewShotResults.cross]) {
    for (const t of fs.tables) referencedTables.set(tableKey(t), t)
  }

  const missingTables = [...referencedTables.values()].filter(t => !hitKeys.has(tableKey(t)))
  if (missingTables.length === 0) {
    return { missingTables: [], backfillSchema: [], backfillFewShot: [] }
  }

  const backfillSchema = missingTables
    .map(mt => tableCorpus.find(t => t.db === mt.db && t.id === mt.id))
    .filter(Boolean)
    .map(t => ({ db: t.db, id: t.id, ko: t.ko }))

  const missingKeys = new Set(missingTables.map(tableKey))
  const backfillFewShot = fewShotCorpus
    .filter(fs => fs.tables.some(t => missingKeys.has(tableKey(t))))
    .map(fs => ({ id: fs.id, topic: fs.topic, query_pattern: fs.query_pattern, tables: fs.tables, is_cross_table: fs.is_cross_table, sql: fs.sql }))

  return { missingTables, backfillSchema, backfillFewShot }
}

// Stage 4 — glossary search. No table filter: business terms cut across topics.
function stage4Glossary(queryVector, k = 3) {
  return topKBySimilarity(queryVector, glossaryCorpus, k)
    .map(g => ({ id: g.id, term: g.term, definition: g.definition, score: g.score }))
}

export async function runPipeline(query, opts = {}) {
  const [queryVector] = await embedTexts([query])

  const hitTables = stage1SchemaSearch(queryVector, opts.schemaK ?? 5)
  const fewShotResults = stage2FewShot(queryVector, opts)
  const { missingTables, backfillSchema, backfillFewShot } = stage3Backfill(hitTables, fewShotResults)
  const glossaryHits = stage4Glossary(queryVector, opts.glossaryK ?? 3)

  return {
    query,
    stage1: { hitTables },
    stage2: fewShotResults,
    stage3: { missingTables, backfillSchema, backfillFewShot },
    stage4: { glossaryHits },
  }
}

// Renders the merged context into prompt text for a SQL-generation LLM call —
// mirrors schemaLoader.js's renderTablesForPrompt() shape/spirit for the topic path.
export function renderPipelineForPrompt(result) {
  const lines = []

  lines.push('## 관련 테이블')
  for (const t of result.stage1.hitTables) lines.push(`- ${t.db}.${t.id}${t.ko ? ' — ' + t.ko : ''} (유사도 ${t.score.toFixed(3)})`)
  if (result.stage3.backfillSchema.length) {
    lines.push('\n## 보강된 테이블 (few-shot 예시가 참조했지만 스키마 검색에서 누락됨)')
    for (const t of result.stage3.backfillSchema) lines.push(`- ${t.db}.${t.id}${t.ko ? ' — ' + t.ko : ''}`)
  }

  lines.push('\n## 참고할 SQL 예시')
  const seen = new Set()
  for (const fs of [...result.stage2.general, ...result.stage2.cross, ...result.stage3.backfillFewShot]) {
    if (seen.has(fs.id)) continue
    seen.add(fs.id)
    lines.push(`\n**"${fs.query_pattern}"**${fs.is_cross_table ? ' (cross-table)' : ''}`)
    lines.push('```sql\n' + fs.sql + '\n```')
  }

  if (result.stage4.glossaryHits.length) {
    lines.push('\n## 관련 용어')
    for (const g of result.stage4.glossaryHits) lines.push(`- ${g.term}: ${g.definition}`)
  }

  return lines.join('\n')
}
