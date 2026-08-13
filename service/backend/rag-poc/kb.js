import { getPool } from '../db.js'

// Runtime read layer over the Pattern/Fragment/Rule/Source knowledge base (Postgres).
// `WHERE id = ANY($1)` does NOT preserve input order, so every lookup here re-sorts
// results to match the caller's id order — callers rely on that (e.g. a pattern's
// fragment_ids is a dependency-ordered chain, Stage 7 walks it in order).

function reorderById(rows, ids, idKey) {
  const byId = new Map(rows.map(r => [r[idKey], r]))
  return ids.map(id => byId.get(id)).filter(Boolean)
}

export async function getSource(sourceSqlId) {
  if (!sourceSqlId) return null
  const { rows } = await getPool().query('SELECT * FROM sql_sources WHERE source_sql_id = $1', [sourceSqlId])
  return rows[0] || null
}

export async function getBusinessRulesByIds(ruleIds) {
  if (!ruleIds?.length) return []
  const { rows } = await getPool().query('SELECT * FROM business_rules WHERE rule_id = ANY($1)', [ruleIds])
  return reorderById(rows, ruleIds, 'rule_id')
}

export async function getFragmentsByIds(fragmentIds) {
  if (!fragmentIds?.length) return []
  const { rows } = await getPool().query('SELECT * FROM sql_fragments WHERE fragment_id = ANY($1)', [fragmentIds])
  return reorderById(rows, fragmentIds, 'fragment_id')
}

export async function getPatternsByIds(patternIds) {
  if (!patternIds?.length) return []
  const { rows } = await getPool().query('SELECT * FROM query_patterns WHERE pattern_id = ANY($1)', [patternIds])
  return reorderById(rows, patternIds, 'pattern_id')
}
