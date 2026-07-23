import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { load as parseYaml } from 'js-yaml'

// Table-level corpus for the RAG POC. Independent of schemaLoader.js's
// topic-based index — reads the same schema/index.yaml + schema/tables/*.yaml
// but flattens every one of the 20 tables into a single embeddable blurb,
// with no topic grouping. This is the thing we're comparing against the
// existing classify_topic → loadTablesForTopic flow.
const __dirname = dirname(fileURLToPath(import.meta.url))
const SCHEMA_DIR = join(__dirname, '..', 'schema')
const TABLES_DIR = join(SCHEMA_DIR, 'tables')

const MAX_COLS_IN_TEXT = 60 // cap wide tables so boilerplate columns don't drown the signal

export function buildTableCorpus() {
  const index = parseYaml(readFileSync(join(SCHEMA_DIR, 'index.yaml'), 'utf-8'))
  return index.tables.map(entry => {
    const raw = readFileSync(join(TABLES_DIR, entry.file), 'utf-8')
    const schema = parseYaml(raw)
    const cols = (schema.columns || []).slice(0, MAX_COLS_IN_TEXT)
    const colText = cols.map(c => c.description ? `${c.name}(${c.description})` : c.name).join(', ')
    const synText = entry.syn?.length ? entry.syn.join(', ') : ''

    const lines = [`테이블: ${entry.db}.${entry.id}`]
    if (entry.ko) lines.push(`설명: ${entry.ko}`)
    if (schema.description) lines.push(`상세: ${schema.description}`)
    if (synText) lines.push(`동의어: ${synText}`)
    lines.push(`컬럼: ${colText}`)

    return {
      db: entry.db,
      id: entry.id,
      file: entry.file,
      ko: entry.ko || null,
      text: lines.join('\n'),
    }
  })
}
