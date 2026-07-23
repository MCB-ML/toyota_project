import 'dotenv/config'
import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { getPool } from '../db.js'
import { sqlSources } from './knowledgeBase/sqlSources.js'
import { businessRules } from './knowledgeBase/businessRules.js'
import { sqlFragments } from './knowledgeBase/sqlFragments.js'
import { queryPatterns } from './knowledgeBase/queryPatterns.js'

// Idempotent seeder for the Pattern/Fragment/Rule/Source knowledge base. Runs the same DDL
// db-init/002_rag_poc.sql would run on a fresh docker volume, but directly against whatever
// Postgres is already up — `CREATE TABLE IF NOT EXISTS`/indexes are safe to rerun, and every
// row upsert is `ON CONFLICT ... DO UPDATE` so this script is safe to run repeatedly.
// Usage: node seedKnowledgeBase.js

const __dirname = dirname(fileURLToPath(import.meta.url))
const DDL_PATH = join(__dirname, '..', 'db-init', '002_rag_poc.sql')

async function ensureSchema(pool) {
  const ddl = readFileSync(DDL_PATH, 'utf-8')
  await pool.query(ddl)
  console.log('Schema ensured (002_rag_poc.sql applied).')
}

async function upsertSources(pool) {
  for (const s of sqlSources) {
    await pool.query(
      `INSERT INTO sql_sources (source_sql_id, original_sql, dialect, source_document, verified, updated_at)
       VALUES ($1, $2, $3, $4, true, now())
       ON CONFLICT (source_sql_id) DO UPDATE SET
         original_sql = EXCLUDED.original_sql, dialect = EXCLUDED.dialect,
         source_document = EXCLUDED.source_document, updated_at = now()`,
      [s.source_sql_id, s.original_sql, s.dialect || 'tsql', s.source_document || null],
    )
  }
  console.log(`Upserted ${sqlSources.length} sql_sources.`)
}

async function upsertRules(pool) {
  for (const r of businessRules) {
    await pool.query(
      `INSERT INTO business_rules (rule_id, term, description, condition_expression, related_tables, related_columns, priority, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, now())
       ON CONFLICT (rule_id) DO UPDATE SET
         term = EXCLUDED.term, description = EXCLUDED.description, condition_expression = EXCLUDED.condition_expression,
         related_tables = EXCLUDED.related_tables, related_columns = EXCLUDED.related_columns, priority = EXCLUDED.priority,
         updated_at = now()`,
      [r.rule_id, r.term, r.description, r.condition_expression || null, r.related_tables || [], r.related_columns || [], r.priority ?? 0],
    )
  }
  console.log(`Upserted ${businessRules.length} business_rules.`)
}

async function upsertFragments(pool) {
  for (const f of sqlFragments) {
    await pool.query(
      `INSERT INTO sql_fragments (fragment_id, fragment_name, fragment_type, description, sql_template, input_tables, input_columns, output_columns, dependencies, business_rule_ids, dialect, verified, self_contained, group_by_placeholder, supported_dimensions, dimension_expressions, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, now())
       ON CONFLICT (fragment_id) DO UPDATE SET
         fragment_name = EXCLUDED.fragment_name, fragment_type = EXCLUDED.fragment_type, description = EXCLUDED.description,
         sql_template = EXCLUDED.sql_template, input_tables = EXCLUDED.input_tables, input_columns = EXCLUDED.input_columns,
         output_columns = EXCLUDED.output_columns, dependencies = EXCLUDED.dependencies, business_rule_ids = EXCLUDED.business_rule_ids,
         dialect = EXCLUDED.dialect, verified = EXCLUDED.verified, self_contained = EXCLUDED.self_contained,
         group_by_placeholder = EXCLUDED.group_by_placeholder, supported_dimensions = EXCLUDED.supported_dimensions,
         dimension_expressions = EXCLUDED.dimension_expressions, updated_at = now()`,
      [
        f.fragment_id, f.fragment_name, f.fragment_type || 'cte', f.description, f.sql_template,
        f.input_tables || [], JSON.stringify(f.input_columns || []), f.output_columns || [],
        f.dependencies || [], f.business_rule_ids || [], f.dialect || 'tsql', !!f.verified, !!f.self_contained,
        f.group_by_placeholder || null, f.supported_dimensions || [], JSON.stringify(f.dimension_expressions || {}),
      ],
    )
  }
  console.log(`Upserted ${sqlFragments.length} sql_fragments.`)
}

async function upsertPatterns(pool) {
  for (const p of queryPatterns) {
    await pool.query(
      `INSERT INTO query_patterns (pattern_id, name, description, intent, metrics, dimensions, required_tables, operations, fragment_ids, source_sql_id, verified, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, now())
       ON CONFLICT (pattern_id) DO UPDATE SET
         name = EXCLUDED.name, description = EXCLUDED.description, intent = EXCLUDED.intent, metrics = EXCLUDED.metrics,
         dimensions = EXCLUDED.dimensions, required_tables = EXCLUDED.required_tables, operations = EXCLUDED.operations,
         fragment_ids = EXCLUDED.fragment_ids, source_sql_id = EXCLUDED.source_sql_id, verified = EXCLUDED.verified,
         updated_at = now()`,
      [
        p.pattern_id, p.name, p.description, p.intent || [], p.metrics || [], p.dimensions || [],
        p.required_tables || [], p.operations || [], p.fragment_ids || [], p.source_sql_id || null, !!p.verified,
      ],
    )
  }
  console.log(`Upserted ${queryPatterns.length} query_patterns.`)
}

async function main() {
  const pool = getPool()
  await ensureSchema(pool)
  // Dependency order: sources first (patterns FK to them), rules/fragments have no FK
  // constraints on each other (soft refs) but this order matches how a reader would explore.
  await upsertSources(pool)
  await upsertRules(pool)
  await upsertFragments(pool)
  await upsertPatterns(pool)
  console.log('Knowledge base seed complete.')
  await pool.end()
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
