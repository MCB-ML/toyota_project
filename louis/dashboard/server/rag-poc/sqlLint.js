// Lightweight, regex-based structural lint for the composed T-SQL — advisory only (Stage 9a).
// No real SQL parser exists in this project and T-SQL's bracket identifiers/EOMONTH/multi-CTE
// syntax make generic JS SQL parsers a poor fit; the AUTHORITATIVE check is Stage 9b's live
// Fabric round-trip. This just gives an early, cheap "does this look sane" signal.

const CTE_NAME_RE = /\bWITH\s+(\w+)\s+AS\s*\(|,\s*(\w+)\s+AS\s*\(/gi
const FROM_JOIN_RE = /\b(?:FROM|JOIN)\s+(?:(\w+)\.)?(\w+)\s+AS\s+(\w+)/gi
// Bracketed identifiers (`u.[name]`) can contain spaces; plain identifiers can't — matching
// them with one loosely-bounded pattern let the space alternative swallow trailing SQL
// keywords (e.g. captured "tp_grp_1 IN" as a "column"). Two explicit alternatives instead.
const ALIAS_COLUMN_RE = /\b([A-Za-z_][A-Za-z0-9_]*)\.(?:\[([^\]]+)\]|([A-Za-z_][A-Za-z0-9_]*))/g

function extractCteNames(sql) {
  const names = new Set()
  let m
  CTE_NAME_RE.lastIndex = 0
  while ((m = CTE_NAME_RE.exec(sql))) names.add((m[1] || m[2]).toLowerCase())
  return names
}

// alias -> { table: 'DB::TABLE' | null (CTE), schema, name }
function extractAliasMap(sql, cteNames) {
  const aliasMap = new Map()
  let m
  FROM_JOIN_RE.lastIndex = 0
  while ((m = FROM_JOIN_RE.exec(sql))) {
    const [, schema, name, alias] = m
    const isCte = cteNames.has(name.toLowerCase())
    aliasMap.set(alias.toLowerCase(), { schema: schema || null, name, isCte })
  }
  return aliasMap
}

/**
 * @param {string} sql - composed SQL to lint
 * @param {Set<string>|string[]} knownTables - table names (bare, case-insensitive) that were
 *   actually given to Stage 7 for this pattern's steps
 * @param {Record<string, string[]>} knownColumnsByTable - table name (case-insensitive key) -> column list
 */
export function lintSql(sql, knownTables, knownColumnsByTable = {}) {
  const known = new Set([...knownTables].map(t => t.toUpperCase()))
  const columnsByTable = {}
  for (const [table, cols] of Object.entries(knownColumnsByTable)) {
    columnsByTable[table.toUpperCase()] = new Set(cols.map(c => c.toUpperCase()))
  }

  const cteNames = extractCteNames(sql)
  const aliasMap = extractAliasMap(sql, cteNames)

  const unknownTables = []
  for (const { name, isCte } of aliasMap.values()) {
    if (isCte) continue
    if (!known.has(name.toUpperCase())) unknownTables.push(name)
  }

  const unknownColumns = []
  const seen = new Set()
  let m
  ALIAS_COLUMN_RE.lastIndex = 0
  while ((m = ALIAS_COLUMN_RE.exec(sql))) {
    const [, alias, bracketedColumn, plainColumn] = m
    const column = bracketedColumn || plainColumn
    const info = aliasMap.get(alias.toLowerCase())
    if (!info || info.isCte) continue // can't validate CTE-sourced columns without their declared output_columns
    const cols = columnsByTable[info.name.toUpperCase()]
    if (!cols) continue // unknown table already reported above
    const key = `${info.name}.${column}`
    if (cols.has(column.toUpperCase()) || seen.has(key)) continue
    seen.add(key)
    unknownColumns.push(key)
  }

  return { unknownTables: [...new Set(unknownTables)], unknownColumns }
}
