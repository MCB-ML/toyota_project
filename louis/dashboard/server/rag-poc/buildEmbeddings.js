import 'dotenv/config'
import { buildTableCorpus } from './corpus.js'
import { embedTexts } from './embedClient.js'
import { queryPatterns, patternText } from './knowledgeBase/queryPatterns.js'
import { sqlFragments } from './knowledgeBase/sqlFragments.js'
import { businessRules } from './knowledgeBase/businessRules.js'
import { glossary, glossaryText } from '../schema/glossary.js'
import { COLLECTIONS, getOrCreateCollection, recreateCollection, getClient } from './chromaClient.js'

// Embeds every corpus the 10-stage pipeline (pipeline.js) searches over and upserts them into
// their Chroma collections — only the live user question gets embedded per request after this.
// Run whenever schema/knowledgeBase content changes: `node buildEmbeddings.js --force`.
export async function buildCollection(name, collectionName, items, idFn, textFn, metaFn, force) {
  const collection = force ? await recreateCollection(collectionName) : await getOrCreateCollection(collectionName)

  if (!force) {
    const existing = await collection.count()
    if (existing > 0) {
      console.log(`${collectionName} already has ${existing} ${name} — skipping (use --force to rebuild).`)
      return
    }
  }

  console.log(`Embedding ${items.length} ${name}...`)
  const t0 = Date.now()
  const documents = items.map(textFn)
  const embeddings = await embedTexts(documents)
  const elapsed = Date.now() - t0

  await collection.upsert({
    ids: items.map(idFn),
    embeddings,
    documents,
    metadatas: items.map(metaFn),
  })
  console.log(`Upserted ${items.length} ${name} into ${collectionName} (dim=${embeddings[0]?.length}, ${elapsed}ms)`)
}

function fragmentText(f) {
  return `이름: ${f.fragment_name}\n설명: ${f.description}`
}

function ruleText(r) {
  return `용어: ${r.term}\n설명: ${r.description}`
}

async function dropLegacyCollections() {
  const client = getClient()
  try {
    await client.deleteCollection({ name: 'ktws_fewshot' })
    console.log('Dropped legacy ktws_fewshot collection.')
  } catch {
    console.log('ktws_fewshot collection not present — nothing to drop.')
  }
}

async function main() {
  const force = process.argv.includes('--force')

  if (process.argv.includes('--drop-legacy')) {
    await dropLegacyCollections()
  }

  const tableCorpus = buildTableCorpus()
  await buildCollection(
    'tables', COLLECTIONS.TABLES, tableCorpus,
    c => `${c.db}::${c.id}`,
    c => c.text,
    c => ({ db: c.db, id: c.id, file: c.file, ko: c.ko || '' }),
    force,
  )

  await buildCollection(
    'query patterns', COLLECTIONS.PATTERNS, queryPatterns,
    p => p.pattern_id,
    patternText,
    p => ({ pattern_id: p.pattern_id, name: p.name }),
    force,
  )

  await buildCollection(
    'sql fragments', COLLECTIONS.FRAGMENTS, sqlFragments,
    f => f.fragment_id,
    fragmentText,
    f => ({ fragment_id: f.fragment_id, fragment_name: f.fragment_name }),
    force,
  )

  await buildCollection(
    'business rules', COLLECTIONS.RULES, businessRules,
    r => r.rule_id,
    ruleText,
    r => ({ rule_id: r.rule_id, term: r.term }),
    force,
  )

  await buildCollection(
    'glossary terms', COLLECTIONS.GLOSSARY, glossary,
    g => g.id,
    glossaryText,
    g => ({ term: g.term, definition: g.definition }),
    force,
  )
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
