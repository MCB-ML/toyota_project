import { queryFabric } from '../../fabricClient.js'
import { loadTableSchema } from '../../schemaLoader.js'
import { lintSql } from '../sqlLint.js'
import { composeSql, generateStepSql } from './generate.js'

function knownColumnsFor(fragments) {
  const byTable = {}
  for (const f of fragments) {
    for (const key of f.input_tables || []) {
      const [db, id] = key.split('::')
      if (byTable[id]) continue
      const schema = loadTableSchema({ db, id })
      if (schema) byTable[id] = (schema.columns || []).map(c => c.name)
    }
  }
  return byTable
}

// Stage 9a — advisory structural lint. Never blocks; just attached to the result for
// visibility (a real SQL parser isn't worth adding for T-SQL's dialect quirks — see
// sqlLint.js's header comment).
export function lintStructural(sql, fragments) {
  const knownTables = new Set(fragments.flatMap(f => (f.input_tables || []).map(k => k.split('::')[1])))
  return lintSql(sql, knownTables, knownColumnsFor(fragments))
}

// Stage 9b — live, authoritative check: compose at topN:1 and actually run it via Fabric.
export async function validateLive(stepResults, sqlDb) {
  try {
    const probeSql = composeSql(stepResults, { topN: 1 })
    await queryFabric(sqlDb, probeSql)
    return { passed: true, error: null }
  } catch (err) {
    return { passed: false, error: err.message }
  }
}

// Stage 10 — identify which step most likely caused a Fabric error and regenerate ONLY that
// step, capped at 2 attempts total.
function findOffendingStepIndex(errorMessage, stepResults) {
  const objectMatch = errorMessage.match(/Invalid object name '([^']+)'/i)
  if (objectMatch) {
    const missingName = objectMatch[1].split('.').pop().toLowerCase()
    const idx = stepResults.findIndex(s => s.cte_name.toLowerCase() === missingName)
    if (idx !== -1) return idx
  }
  // SQL Server names the offending CTE directly for this one, e.g. "No column name was
  // specified for column 1 of 'activity_leads_mtd'." — a bare SELECT COUNT(*)/expression
  // with no alias inside a CTE. Check this before the generic column-name fallback below,
  // since it identifies the step precisely instead of guessing via substring search.
  const namedCteMatch = errorMessage.match(/column \d+ of '([^']+)'/i)
  if (namedCteMatch) {
    const idx = stepResults.findIndex(s => s.cte_name.toLowerCase() === namedCteMatch[1].toLowerCase())
    if (idx !== -1) return idx
  }
  const columnMatch = errorMessage.match(/Invalid column name '([^']+)'/i)
  if (columnMatch) {
    const missingCol = columnMatch[1].toLowerCase()
    for (let i = stepResults.length - 1; i >= 0; i--) {
      if (stepResults[i].sql_body?.toLowerCase().includes(missingCol)) return i
    }
  }
  return stepResults.length - 1 // fall back to the terminal step
}

export async function repairAndRevalidate({ client, deployment, query, sqlDb, steps, fragmentsById, rulesByFragmentId, stepResults, resolvedParams, maxAttempts = 2 }) {
  let current = stepResults
  let lastCheck = await validateLive(current, sqlDb)
  let attempts = 0

  while (!lastCheck.passed && attempts < maxAttempts) {
    attempts++
    const badIdx = findOffendingStepIndex(lastCheck.error, current)
    const step = steps[badIdx]
    const fragment = fragmentsById.get(step.fragment_id)
    const upstreamSteps = steps.slice(0, badIdx).map((s, i) => ({ cte_name: s.cte_name, output_columns: fragmentsById.get(s.fragment_id)?.output_columns || [] }))

    const repaired = await generateStepSql(client, deployment, {
      query, step, fragment,
      rules: rulesByFragmentId.get(step.fragment_id) || [],
      upstreamSteps, resolvedParams,
      repairContext: `이전 SQL:\n${current[badIdx].sql_body}\n\nFabric 오류: ${lastCheck.error}`,
    })

    current = current.map((s, i) => (i === badIdx ? repaired : s))
    lastCheck = await validateLive(current, sqlDb)
  }

  return { stepResults: current, liveCheckPassed: lastCheck.passed, error: lastCheck.error, repairAttempts: attempts }
}
