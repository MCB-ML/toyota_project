import { embedTexts } from './embedClient.js'
import { structureQuestion, renderStructuredForEmbedding, resolveParameters } from './stages/structure.js'
import { stage1SchemaSearch, stage2PatternSearch, stage4ResolveFragments, stage5Backfill, stage6RulesAndGlossary, searchTables } from './stages/retrieve.js'
import { choosePattern, derivePlanSteps } from './stages/plan.js'
import { generateStepSql, composeSql } from './stages/generate.js'
import { lintStructural, repairAndRevalidate } from './stages/validate.js'
import { decideRollup, applyRollup } from './stages/rollup.js'
import { resolveGroupDimension } from './knowledgeBase/dimensions.js'

// Stage 3.5 — DETERMINISTIC (no LLM), same spirit as Stage 0.5's date resolution: a fragment
// that declares `group_by_placeholder` has its {{PLACEHOLDER}} swapped for the SQL expression
// of whichever dimension (딜러/브랜드/전시장/부서/SC 등) the user actually asked for, picked
// from `supported_dimensions`. This is what lets ONE fragment pair serve every "~별" question
// instead of a fragment being hand-duplicated per dimension (design-scaling-improvements.md §2).
// Returns null (pattern not usable) if a fragment needs substitution but no supported
// dimension was requested/detected — caller treats that like "no pattern matched" rather than
// shipping SQL with a literal unsubstituted {{...}} placeholder.
function substituteGroupDimensions(fragments, structured) {
  const resolved = []
  for (const fragment of fragments) {
    if (!fragment.group_by_placeholder) {
      resolved.push(fragment)
      continue
    }
    const dim = resolveGroupDimension(structured.dimensions, fragment.supported_dimensions)
    if (!dim) return null
    // dimensions.js의 기본 표현식은 DIM_MNG_USER 별칭 u를 가정한다 — 이 fragment가 다른
    // 테이블/별칭으로 같은 dimension을 표현해야 하면(예: DIM_MNG_DEALER를 d로 조인)
    // fragment.dimension_expressions가 그 dimension id에 대해 카탈로그 기본값을 덮어쓴다.
    const expression = fragment.dimension_expressions?.[dim.id] || dim.expression
    const placeholder = new RegExp(`\\{\\{${fragment.group_by_placeholder}\\}\\}`, 'g')
    resolved.push({ ...fragment, sql_template: fragment.sql_template.replace(placeholder, expression), _resolvedDimension: dim.id })
  }
  return resolved
}

export { searchTables }

// 10-stage pipeline: structure -> schema search -> pattern search -> plan -> fragment
// resolution -> backfill -> rules/glossary -> per-step generation -> compose -> validate/repair.
// See louis/dashboard 대화 세션 계획(curious-gathering-fern.md) for the full design rationale.

async function retrieveCore(query, opts = {}) {
  const structured = await structureQuestion(opts.client, opts.deployment, query)
  const resolvedParams = resolveParameters(structured, query, opts.now)
  const embeddingText = renderStructuredForEmbedding(structured, query)
  const [queryVector] = await embedTexts([embeddingText])

  const hitTables = await stage1SchemaSearch(queryVector, opts.schemaK ?? 5)
  const patternCards = await stage2PatternSearch(queryVector, opts.patternK ?? 4)
  const { pattern, reasoning, reason } = await choosePattern(opts.client, opts.deployment, query, structured, patternCards)

  if (!pattern) {
    return { structured, resolvedParams, queryVector, hitTables, patternCards, pattern: null, rejectReason: reason || 'no pattern matched' }
  }

  const { fragments: rawFragments, unresolvedIds } = await stage4ResolveFragments(pattern, queryVector)

  // Stage 3.5 — GROUP_DIM 치환. 이 pattern의 fragment 중 하나라도 dimension 파라미터화
  // 대상인데 사용자 질문에서 지원되는 dimension을 못 찾으면, SQL에 {{...}}가 그대로 남는
  // 대신 pattern 자체를 거부한다(= no pattern matched와 동일하게 취급).
  const fragments = substituteGroupDimensions(rawFragments, structured)
  if (!fragments) {
    return { structured, resolvedParams, queryVector, hitTables, patternCards, pattern: null, rejectReason: '이 패턴이 요구하는 차원(딜러/브랜드/전시장/부서/SC 등)을 질문에서 찾지 못함' }
  }

  const steps = derivePlanSteps(pattern, fragments)
  const backfill = stage5Backfill(hitTables, fragments)
  const { rules, glossary } = await stage6RulesAndGlossary(fragments, queryVector, opts.glossaryK ?? 3)

  return { structured, resolvedParams, queryVector, hitTables, patternCards, pattern, reasoning, fragments, unresolvedIds, steps, backfill, rules, glossary }
}

// Lightweight path for runCompare.js's ~30-query batch eval — everything through Stage 6
// (structure/schema/pattern/plan/backfill/rules, all cheap: 2 LLM calls + DB/Chroma lookups)
// but stops before Stage 7's per-step generation and Stage 9's Fabric round-trip.
export async function runRetrieval({ query, client, deployment, opts = {} }) {
  const core = await retrieveCore(query, { ...opts, client, deployment })
  return {
    query,
    stage0_structured: core.structured,
    resolvedParams: core.resolvedParams,
    stage1_tables: core.hitTables,
    stage2_patterns: core.patternCards.map(p => ({ pattern_id: p.pattern_id, name: p.name, score: p.score, fragment_ids: p.fragment_ids })),
    stage3_plan: core.pattern ? { pattern_id: core.pattern.pattern_id, reasoning: core.reasoning } : null,
    stage4_fragments: (core.fragments || []).map(f => ({ fragment_id: f.fragment_id, fragment_name: f.fragment_name })),
    stage5_backfill: core.backfill || { missingTables: [] },
    stage6_rules: (core.rules || []).map(r => ({ rule_id: r.rule_id, term: r.term })),
    stage6_glossary: core.glossary || [],
    tables: core.pattern ? [...(core.fragments || []).flatMap(f => f.input_tables || [])].map(k => { const [db, id] = k.split('::'); return { db, id } }) : [],
    error: core.pattern ? null : core.rejectReason,
  }
}

// Full path: retrieval + Stage 7 per-step generation + Stage 8 compose + Stage 9/10
// validate-and-repair. opts.liveValidate (default true) gates Stage 9b's Fabric round-trip —
// smoke tests (demoPipeline.js) pass liveValidate:false to skip it.
export async function runPipeline({ query, client, deployment, opts = {} }) {
  const core = await retrieveCore(query, { ...opts, client, deployment })

  const base = {
    query,
    stage0_structured: core.structured,
    resolvedParams: core.resolvedParams,
    stage1_tables: core.hitTables,
    stage2_patterns: core.patternCards.map(p => ({ pattern_id: p.pattern_id, name: p.name, score: p.score, fragment_ids: p.fragment_ids })),
  }

  if (!core.pattern) {
    return { ...base, stage3_plan: null, composedSql: null, sqlDb: null, error: core.rejectReason }
  }

  const { fragments, steps, backfill, rules } = core
  const fragmentsById = new Map(fragments.map(f => [f.fragment_id, f]))
  const rulesById = new Map(rules.map(r => [r.rule_id, r]))
  const rulesByFragmentId = new Map(fragments.map(f => [f.fragment_id, (f.business_rule_ids || []).map(id => rulesById.get(id)).filter(Boolean)]))

  const { resolvedParams } = core
  const stepResults = await Promise.all(
    steps.map((step, i) => {
      const fragment = fragmentsById.get(step.fragment_id)
      const upstreamSteps = steps.slice(0, i).map(s => ({ cte_name: s.cte_name, output_columns: fragmentsById.get(s.fragment_id)?.output_columns || [] }))
      return generateStepSql(client, deployment, { query, step, fragment, rules: rulesByFragmentId.get(step.fragment_id) || [], upstreamSteps, resolvedParams })
    }),
  )

  // 기본값 없음(null) — TOP 100을 무조건 박는 대신, 실행 시간(queryFabricWithTimeout)과
  // 행 수(호출부가 실행 후 직접 체크)로 "정말 크거나 느린 경우"만 걸러 사용자에게 되묻는다
  // (design-scaling-improvements.md §1). 호출부가 명시적으로 topN을 넘기면 그대로 존중한다.
  const topN = opts.topN ?? null
  let finalStepResults = stepResults
  let validation = { structuralWarnings: lintStructural(composeSql(stepResults, { topN }), fragments), liveCheckPassed: null, repairAttempts: 0, error: null }

  const sqlDb = fragments[0]?.input_tables?.[0]?.split('::')[0] || 'KPI_W'

  if (opts.liveValidate !== false) {
    const repaired = await repairAndRevalidate({
      client, deployment, query, sqlDb, steps, fragmentsById, rulesByFragmentId, stepResults, resolvedParams,
    })
    finalStepResults = repaired.stepResults
    validation.liveCheckPassed = repaired.liveCheckPassed
    validation.repairAttempts = repaired.repairAttempts
    validation.error = repaired.error
  }

  // Stage 8b — breakdown 패턴은 저작 시점에 고정된 다차원(딜러+그룹+부서+SC+유형 등)으로
  // GROUP BY하므로, 사용자가 그중 일부 차원만 요청했으면(예: "딜러사별"만) 검증된 내부
  // 쿼리를 서브쿼리로 감싸 그 차원까지만 다시 SUM해서 접는다. 스칼라 패턴(intent에
  // breakdown이 없음)은 애초에 접을 다차원이 없으므로 시도하지 않는다.
  let composedSql = composeSql(finalStepResults, { topN })
  let rollup = null
  if (core.pattern.intent?.includes('breakdown')) {
    const terminalFragment = fragments[fragments.length - 1]
    rollup = await decideRollup(client, deployment, {
      query, structured: core.structured, outputColumns: terminalFragment?.output_columns || [],
    }).catch(() => null)
    if (rollup) {
      composedSql = applyRollup(finalStepResults, rollup, topN)
    }
  }

  return {
    ...base,
    stage3_plan: { pattern_id: core.pattern.pattern_id, reasoning: core.reasoning, steps: steps.map(s => ({ step_id: s.step_id, cte_name: s.cte_name, purpose: s.purpose })) },
    stage4_fragments: fragments.map(f => ({ fragment_id: f.fragment_id, fragment_name: f.fragment_name, fragment_type: f.fragment_type })),
    stage5_backfill: backfill,
    stage6_rules: rules.map(r => ({ rule_id: r.rule_id, term: r.term })),
    stage6_glossary: core.glossary,
    stage7_steps: finalStepResults,
    stage8_rollup: rollup,
    composedSql, sqlDb, validation,
    tables: [...new Set(fragments.flatMap(f => f.input_tables || []))].map(k => { const [db, id] = k.split('::'); return { db, id } }),
    error: null,
  }
}
