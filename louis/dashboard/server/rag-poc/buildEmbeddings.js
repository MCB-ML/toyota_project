import { writeFileSync, existsSync, readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import 'dotenv/config'
import { buildTableCorpus } from './corpus.js'
import { embedTexts } from './embedClient.js'
import { fewShotSet, fewShotText } from './fewShotSet.js'
import { glossary, glossaryText } from './glossary.js'

// One-time (well, run-when-schema/few-shot/glossary changes) step: embeds all three
// corpora the 4-stage pipeline (pipeline.js) searches over, and caches vectors to
// disk so runCompare.js / pipeline runs don't re-embed on every query — only the
// live user question gets embedded per request.
const __dirname = dirname(fileURLToPath(import.meta.url))
const CACHES = {
  tables: join(__dirname, 'embeddings.json'),
  fewshot: join(__dirname, 'fewshot_embeddings.json'),
  glossary: join(__dirname, 'glossary_embeddings.json'),
}

async function buildCache(name, path, items, textFn, force) {
  if (existsSync(path) && !force) {
    const cached = JSON.parse(readFileSync(path, 'utf-8'))
    console.log(`${path} already exists (${cached.items.length} ${name}, model=${cached.model}). Use --force to rebuild.`)
    return
  }
  console.log(`Embedding ${items.length} ${name}...`)
  const t0 = Date.now()
  const vectors = await embedTexts(items.map(textFn))
  const elapsed = Date.now() - t0
  const withVectors = items.map((item, i) => ({ ...item, vector: vectors[i] }))
  writeFileSync(path, JSON.stringify({
    model: process.env.AZURE_OPENAI_EMBEDDING_DEPLOYMENT,
    builtAt: new Date().toISOString(),
    items: withVectors,
  }))
  console.log(`Wrote ${path} (${withVectors.length} vectors, dim=${vectors[0]?.length}, ${elapsed}ms)`)
}

async function main() {
  const force = process.argv.includes('--force')

  const tableCorpus = buildTableCorpus().map(c => ({ db: c.db, id: c.id, file: c.file, ko: c.ko, text: c.text }))
  await buildCache('tables', CACHES.tables, tableCorpus, c => c.text, force)

  await buildCache('fewshot examples', CACHES.fewshot, fewShotSet, fewShotText, force)

  await buildCache('glossary terms', CACHES.glossary, glossary, glossaryText, force)
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
