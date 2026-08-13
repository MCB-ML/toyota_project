import { embedTexts } from '../embedClient.js'
import { listTableIndex } from '../../schemaLoader.js'
import { COLLECTIONS, getOrCreateCollection, toScore } from '../chromaClient.js'
import { getPatternsByIds, getFragmentsByIds, getBusinessRulesByIds } from '../kb.js'

const tableKey = t => `${t.db}::${t.id}`

async function queryCollection(collectionName, queryVector, k, where) {
  const collection = await getOrCreateCollection(collectionName)
  const res = await collection.query({ queryEmbeddings: [queryVector], nResults: k, ...(where ? { where } : {}) })
  const ids = res.ids[0] || []
  const metadatas = res.metadatas[0] || []
  const distances = res.distances[0] || []
  return ids.map((id, i) => ({ id, score: toScore(distances[i]), ...(metadatas[i] || {}) }))
}

// Stage 1 — schema search. Unchanged shape from the old pipeline, just fed the Stage-0
// structured-summary text (renderStructuredForEmbedding) by the caller instead of raw NL.
export async function stage1SchemaSearch(queryVector, k = 5) {
  const rows = await queryCollection(COLLECTIONS.TABLES, queryVector, k)
  return rows.map(r => ({ db: r.db, id: r.id, ko: r.ko, score: r.score }))
}

const MIN_SCORE = 0.3

// Stage 2 — Pattern Card search. Chroma only carries pattern_id/name in metadata (never
// fragment_ids/SQL) — full rows (fragment_ids, required_tables, etc.) are fetched from
// Postgres right after, so downstream stages always work off authoritative data, not
// whatever happened to survive Chroma's metadata JSON round-trip.
export async function stage2PatternSearch(queryVector, k = 4) {
  const rows = await queryCollection(COLLECTIONS.PATTERNS, queryVector, k)
  const hits = rows.filter(r => r.score >= MIN_SCORE)
  if (!hits.length) return []
  const fullRows = await getPatternsByIds(hits.map(h => h.id))
  const scoreById = new Map(hits.map(h => [h.id, h.score]))
  return fullRows.map(p => ({ ...p, score: scoreById.get(p.pattern_id) }))
}

// Stage 4 — resolve a chosen pattern's fragment_ids to full fragment rows (ID lookup, no
// vector search needed — the Pattern Card already carries the exact ordered chain). Falls
// back to a Chroma fragment search only if a fragment_id somehow doesn't resolve (e.g. stale
// pattern data pointing at a since-removed fragment).
export async function stage4ResolveFragments(pattern, queryVector) {
  if (!pattern) return { fragments: [], unresolvedIds: [] }
  const fragments = await getFragmentsByIds(pattern.fragment_ids)
  const resolvedIds = new Set(fragments.map(f => f.fragment_id))
  const unresolvedIds = pattern.fragment_ids.filter(id => !resolvedIds.has(id))
  if (unresolvedIds.length && queryVector) {
    const fallback = await queryCollection(COLLECTIONS.FRAGMENTS, queryVector, unresolvedIds.length)
    const fallbackRows = await getFragmentsByIds(fallback.map(f => f.id))
    fragments.push(...fallbackRows)
  }
  return { fragments, unresolvedIds }
}

// Stage 5 — gap check: which tables a resolved fragment needs but Stage 1 didn't surface.
// Deterministic index lookup (schemaLoader already holds index.yaml in memory), no search.
export function stage5Backfill(hitTables, fragments) {
  const hitKeys = new Set(hitTables.map(tableKey))
  const referenced = new Map()
  for (const f of fragments) {
    for (const key of f.input_tables || []) {
      const [db, id] = key.split('::')
      if (db && id) referenced.set(key, { db, id })
    }
  }
  const missingTables = [...referenced.values()].filter(t => !hitKeys.has(tableKey(t)))
  if (!missingTables.length) return { missingTables: [] }
  const tableIndex = listTableIndex()
  const backfillSchema = missingTables
    .map(mt => tableIndex.find(t => t.db === mt.db && t.id === mt.id))
    .filter(Boolean)
    .map(t => ({ db: t.db, id: t.id, ko: t.ko }))
  return { missingTables: backfillSchema }
}

// Stage 6 — business rules referenced by the resolved fragments (direct ID fetch) UNION a
// glossary semantic search for terms in the raw question not already covered by a rule.
export async function stage6RulesAndGlossary(fragments, queryVector, k = 3) {
  const ruleIds = [...new Set(fragments.flatMap(f => f.business_rule_ids || []))]
  const rules = ruleIds.length ? await getBusinessRulesByIds(ruleIds) : []
  const glossaryRows = await queryCollection(COLLECTIONS.GLOSSARY, queryVector, k)
  const glossary = glossaryRows.map(r => ({ id: r.id, term: r.term, definition: r.definition, score: r.score }))
  return { rules, glossary }
}

// Exposed so runCompare.js's plain top-K comparison arms can reuse the exact same Chroma
// query instead of duplicating stage1's logic with a different k.
export async function searchTables(query, k) {
  const [queryVector] = await embedTexts([query])
  return stage1SchemaSearch(queryVector, k)
}
