import { readFileSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import 'dotenv/config'
import { createAzureClient, getAzureConfig } from '../azureClient.js'
import { streamAssistantTurn } from '../azureStream.js'
import { listTopicsForPrompt, buildTopicClassifierTools, loadTablesForTopic } from '../schemaLoader.js'
import { embedTexts } from './embedClient.js'
import { topKBySimilarity } from './cosine.js'
import { evalQueries } from './evalSet.js'
import { runPipeline } from './pipeline.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const EMBEDDINGS_PATH = join(__dirname, 'embeddings.json')
const RESULTS_PATH = join(__dirname, 'results.json')

const tableKey = t => `${t.db}::${t.id}`

// gtSet empty (out_of_scope queries) => correct behavior is retrieving nothing.
function scoreRetrieval(retrieved, groundTruth) {
  const gtSet = new Set(groundTruth.map(tableKey))
  const retSet = new Set(retrieved.map(tableKey))
  if (gtSet.size === 0) {
    const correctlyRejected = retSet.size === 0
    return { recall: 1, precision: correctlyRejected ? 1 : 0, correctlyRejected, fullHit: correctlyRejected }
  }
  let intersect = 0
  for (const k of retSet) if (gtSet.has(k)) intersect++
  const recall = intersect / gtSet.size
  const precision = retSet.size === 0 ? 0 : intersect / retSet.size
  return { recall, precision, correctlyRejected: null, fullHit: recall === 1 }
}

function buildClassifierSystemPrompt() {
  return `사용자의 질문을 아래 주제 목록 중 하나로 분류하세요. 목록의 어느 주제와도 관련 없거나 데이터 조회가 아닌 질문이면 반드시 reject_topic을 호출하세요.\n\n${listTopicsForPrompt()}`
}

async function runTopicClassification(client, deployment, query) {
  const t0 = Date.now()
  const calls = await streamAssistantTurn(client, {
    model: deployment,
    messages: [
      { role: 'system', content: buildClassifierSystemPrompt() },
      { role: 'user', content: query },
    ],
    tools: buildTopicClassifierTools(),
    toolChoice: 'required',
  })
  const latencyMs = Date.now() - t0

  const call = calls[0]
  if (!call?.args || call.name === 'reject_topic') {
    return { topic: null, tables: [], latencyMs, reason: call?.args?.reason ?? null }
  }
  const topic = call.args.topic
  const tables = loadTablesForTopic(topic).map(t => ({ db: t.db, id: t.id }))
  return { topic, tables, latencyMs, reason: call.args.reasoning ?? null }
}

async function runRagRetrieval(query, corpus, k) {
  const t0 = Date.now()
  const [queryVector] = await embedTexts([query])
  const top = topKBySimilarity(queryVector, corpus, k)
  const latencyMs = Date.now() - t0
  return { tables: top.map(t => ({ db: t.db, id: t.id, score: t.score })), latencyMs }
}

// The "tables" a 4-stage pipeline run actually hands to SQL generation are Stage 1's
// hit_tables plus whatever Stage 3 backfilled — those two lists are what's comparable
// to topic classification's / plain top-K RAG's retrieved-table sets. Stage 2's
// few-shot/cross-few-shot and Stage 4's glossary aren't tables, so they're excluded
// from this scoring (they're evaluated qualitatively, not against the table ground truth).
async function runPipelineRetrieval(query) {
  const t0 = Date.now()
  const result = await runPipeline(query)
  const latencyMs = Date.now() - t0
  const merged = [...result.stage1.hitTables, ...result.stage3.backfillSchema]
  const seen = new Set()
  const tables = merged.filter(t => {
    const k = tableKey(t)
    if (seen.has(k)) return false
    seen.add(k)
    return true
  })
  return { tables, latencyMs, missingTables: result.stage3.missingTables, fewShotHits: result.stage2.general.length + result.stage2.cross.length }
}

function avg(arr) { return arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null }

async function main() {
  const client = createAzureClient()
  if (!client) throw new Error('Azure OpenAI env vars missing (see .env.example)')
  const { deployment } = getAzureConfig()

  const cache = JSON.parse(readFileSync(EMBEDDINGS_PATH, 'utf-8'))
  const corpus = cache.items // [{db, id, file, ko, vector}]
  console.log(`Loaded ${corpus.length} table embeddings (model=${cache.model})`)

  const perQuery = []
  for (const q of evalQueries) {
    process.stdout.write(`[${q.id}] ${q.query} ... `)

    const topicResult = await runTopicClassification(client, deployment, q.query)
    const ragK3 = await runRagRetrieval(q.query, corpus, 3)
    const ragK5 = await runRagRetrieval(q.query, corpus, 5)
    const pipeline4 = await runPipelineRetrieval(q.query)

    const topicScore = scoreRetrieval(topicResult.tables, q.tables)
    const ragK3Score = scoreRetrieval(ragK3.tables, q.tables)
    const ragK5Score = scoreRetrieval(ragK5.tables, q.tables)
    const pipeline4Score = scoreRetrieval(pipeline4.tables, q.tables)
    const topicCorrect = topicResult.topic === q.topic

    console.log(`topic=${topicResult.topic ?? '(reject)'} (${topicResult.latencyMs}ms) | ragK3 recall=${ragK3Score.recall.toFixed(2)} | pipeline4 recall=${pipeline4Score.recall.toFixed(2)} (${pipeline4.latencyMs}ms)`)

    perQuery.push({
      id: q.id, category: q.category, query: q.query,
      groundTruth: { topic: q.topic, tables: q.tables, primary: q.primary },
      topicClassification: { ...topicResult, score: topicScore, topicCorrect },
      ragK3: { ...ragK3, score: ragK3Score },
      ragK5: { ...ragK5, score: ragK5Score },
      pipeline4: { ...pipeline4, score: pipeline4Score },
    })
  }

  const summary = {
    n: perQuery.length,
    topicClassification: {
      topicAccuracy: avg(perQuery.map(p => p.topicClassification.topicCorrect ? 1 : 0)),
      avgRecall: avg(perQuery.map(p => p.topicClassification.score.recall)),
      avgPrecision: avg(perQuery.map(p => p.topicClassification.score.precision)),
      fullHitRate: avg(perQuery.map(p => p.topicClassification.score.fullHit ? 1 : 0)),
      avgLatencyMs: avg(perQuery.map(p => p.topicClassification.latencyMs)),
    },
    ragK3: {
      avgRecall: avg(perQuery.map(p => p.ragK3.score.recall)),
      avgPrecision: avg(perQuery.map(p => p.ragK3.score.precision)),
      fullHitRate: avg(perQuery.map(p => p.ragK3.score.fullHit ? 1 : 0)),
      avgLatencyMs: avg(perQuery.map(p => p.ragK3.latencyMs)),
    },
    ragK5: {
      avgRecall: avg(perQuery.map(p => p.ragK5.score.recall)),
      avgPrecision: avg(perQuery.map(p => p.ragK5.score.precision)),
      fullHitRate: avg(perQuery.map(p => p.ragK5.score.fullHit ? 1 : 0)),
      avgLatencyMs: avg(perQuery.map(p => p.ragK5.latencyMs)),
    },
    pipeline4: {
      avgRecall: avg(perQuery.map(p => p.pipeline4.score.recall)),
      avgPrecision: avg(perQuery.map(p => p.pipeline4.score.precision)),
      fullHitRate: avg(perQuery.map(p => p.pipeline4.score.fullHit ? 1 : 0)),
      avgLatencyMs: avg(perQuery.map(p => p.pipeline4.latencyMs)),
    },
    byCategory: {},
  }

  const categories = [...new Set(perQuery.map(p => p.category))]
  for (const cat of categories) {
    const rows = perQuery.filter(p => p.category === cat)
    summary.byCategory[cat] = {
      n: rows.length,
      topicRecall: avg(rows.map(p => p.topicClassification.score.recall)),
      topicPrecision: avg(rows.map(p => p.topicClassification.score.precision)),
      ragK3Recall: avg(rows.map(p => p.ragK3.score.recall)),
      ragK3Precision: avg(rows.map(p => p.ragK3.score.precision)),
      pipeline4Recall: avg(rows.map(p => p.pipeline4.score.recall)),
      pipeline4Precision: avg(rows.map(p => p.pipeline4.score.precision)),
    }
  }

  writeFileSync(RESULTS_PATH, JSON.stringify({ summary, perQuery }, null, 2))
  console.log('\n=== Summary ===')
  console.log(JSON.stringify(summary, null, 2))
  console.log(`\nWrote ${RESULTS_PATH}`)
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
