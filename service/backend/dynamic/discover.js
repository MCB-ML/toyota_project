// LEVEL 4 — Schema Discovery. **여기까지 내려왔다는 것은 리포트도 글로벌 카탈로그도
// 그 개념을 모른다는 뜻이다**(지시 14장). 그때만 Raw 스키마를 뒤진다.
//
// 발견은 실행 허가가 아니다. 이 파일이 만드는 것은 전부 후보이고, 프로브를 통과한
// 것만 Physical Plan이 된다.
import { loadMetadataIndex, getTable, getColumn, ROLE } from './catalog/metadataIndex.js'
import { retrieveConcept, retrieveTables, RESOLUTION } from './retrieval/schemaRetriever.js'
import { buildSchemaGraph, recordValidatedRelationship, EDGE_SOURCE } from './graph/schemaGraph.js'
import { findJoinPaths } from './graph/joinPathResolver.js'
import { probeJoinCardinality, chooseJoinMode, VERDICT } from './validate/probes.js'
import { norm } from './text.js'

export class DiscoveryError extends Error {
  constructor(code, message, extra = {}) {
    super(message)
    this.name = 'DiscoveryError'
    this.code = code
    Object.assign(this, extra)
  }
}

/** 팩트 테이블만 root 후보다 — 차원 테이블을 root로 세면 무엇을 세는지가 흐려진다. */
function isFact(full) {
  return /\.FCT_/i.test(full)
}

/**
 * 개념들을 스키마 컬럼으로 해석한다. 하나라도 확정하지 못하면 실행하지 않는다.
 *
 * @returns {{resolved: Array, ambiguous: Array, unresolved: Array}}
 */
export function resolveConcepts(index, concepts) {
  const resolved = []
  const ambiguous = []
  const unresolved = []
  for (const c of concepts) {
    const r = retrieveConcept(index, { concept: c.concept, value: c.value, kind: c.kind })
    if (r.resolution === RESOLUTION.RESOLVED) {
      resolved.push({ ...c, ...r.selected, retrieval: r })
    } else if (r.resolution === RESOLUTION.AMBIGUOUS) {
      ambiguous.push({ ...c, retrieval: r })
    } else {
      unresolved.push({ ...c, retrieval: r })
    }
  }
  return { resolved, ambiguous, unresolved }
}

/**
 * root 팩트를 정한다.
 *
 * 발견한 컬럼이 전부 한 팩트에 있으면 그 팩트가 root다. 흩어져 있으면 질문의 대상 개념과
 * 가장 가까운 팩트를 root로 삼고 나머지는 관계로 붙인다.
 */
export function chooseRoot(index, requirement, resolvedConcepts) {
  const factHits = new Map()
  for (const r of resolvedConcepts) {
    if (!isFact(r.table)) continue
    factHits.set(r.table, (factHits.get(r.table) || 0) + 1)
  }
  if (factHits.size === 1) {
    const [table] = [...factHits.keys()]
    return { table, reason: '발견한 컬럼이 모두 이 팩트에 있습니다.', evidence: [...factHits.keys()] }
  }
  const byQuestion = retrieveTables(index, `${requirement.target_business_object} ${requirement.question}`, { limit: 20 })
    .filter((t) => isFact(t.table))
  if (factHits.size > 1) {
    // 여러 팩트에 걸쳐 있다. 질문의 대상 개념과 가장 가까운 팩트를 root로 본다.
    const ranked = byQuestion.filter((t) => factHits.has(t.table))
    if (ranked.length) return { table: ranked[0].table, reason: '여러 팩트에 걸쳐 있어 질문의 대상과 가장 가까운 팩트를 root로 삼습니다.', evidence: ranked.slice(0, 3) }
  }
  if (byQuestion.length) return { table: byQuestion[0].table, reason: '질문의 대상 개념과 가장 가까운 팩트입니다.', evidence: byQuestion.slice(0, 3) }
  throw new DiscoveryError('no_root', '무엇을 세야 하는지(root 팩트) 정하지 못했습니다.')
}

/**
 * root의 셈 단위.
 *
 * 유일 키가 있으면 그것으로 센다. 없으면 "표의 한 행"을 단위로 삼되 **조인이 하나도 없을
 * 때만** 허용한다(requires_no_join). COUNT(*)가 위험한 이유는 조인이 행을 불려도 그대로
 * 세기 때문인데, 조인이 없으면 불어날 길 자체가 없다. 대신 무엇을 셌는지는 결과에 밝힌다.
 */
export function rootGrain(index, rootTable) {
  const t = getTable(index, rootTable)
  if (!t) throw new DiscoveryError('unknown_root', `스키마 인덱스에 없는 테이블입니다: ${rootTable}`)
  const declared = (t.declared_primary_keys || [])[0]
  if (declared) {
    return { entity: t.table, unique_key: declared, operation: 'count_distinct', evidence: '정의서 선언 PK' }
  }
  const pk = t.columns.find((c) => c.pk_candidate)
  if (pk) {
    return { entity: t.table, unique_key: pk.name, operation: 'count_distinct', evidence: `실측 유일성(distinct=${pk.distinct_count}, rows=${t.row_count})` }
  }
  const nearest = t.columns
    .filter((c) => c.distinct_count != null)
    .sort((a, b) => b.distinct_count - a.distinct_count)[0]
  return {
    entity: t.table,
    unique_key: null,
    operation: 'count',
    requires_no_join: true,
    evidence: `유일 키를 찾지 못했다 — ${rootTable}의 한 행을 1건으로 센다`,
    caveat: nearest
      ? `${rootTable}에는 유일 키가 없다(가장 가까운 ${nearest.name}도 ${nearest.distinct_count}/${t.row_count}). `
        + `표의 한 행을 1건으로 센 값이다.`
      : `${rootTable}에는 유일 키가 없어 표의 한 행을 1건으로 센 값이다.`,
  }
}

/** root의 기간 컬럼. 요구된 날짜 개념을 스키마에서 찾는다. */
export function resolveTimeColumn(index, rootTable, timeConcept) {
  if (!timeConcept) return null
  const r = retrieveConcept(index, { concept: timeConcept, kind: 'time' }, { restrictTables: [rootTable] })
  if (r.resolution !== RESOLUTION.RESOLVED) {
    throw new DiscoveryError('time_column_unresolved',
      `'${timeConcept}'에 해당하는 날짜 컬럼을 '${rootTable}'에서 확정하지 못했습니다.`, { retrieval: r })
  }
  return { column: r.selected.column, retrieval: r }
}

/**
 * 발견한 필터를 root에 붙일 방법을 정한다. 다른 테이블이면 관계를 찾고 프로브한다.
 *
 * @returns {{filters, joinTrace}}
 */
export async function planFilters(index, rootTable, resolvedConcepts, {
  timeScope = null,
  graph = buildSchemaGraph(index),
  probeFn = probeJoinCardinality,
  database = 'KPI_W',
  recordValidated = recordValidatedRelationship,
} = {}) {
  const filters = []
  const joinTrace = []

  for (const c of resolvedConcepts) {
    if (c.kind !== 'filter') continue
    const values = c.values || [c.matched_value ?? c.value]
    const operator = c.operator || 'eq'

    if (c.table === rootTable) {
      filters.push({ mode: 'direct', table: c.table, column: c.column, operator, values, concept: c.concept })
      continue
    }

    const paths = findJoinPaths(graph, rootTable, c.table, { maxHops: 1 })
    if (!paths.length) {
      throw new DiscoveryError('no_join_path',
        `'${c.concept}'이 있는 ${c.table}로 가는 관계 후보를 찾지 못했습니다.`, { root: rootTable, target: c.table })
    }

    // 후보 경로를 순서대로 프로브한다. 통과하는 첫 경로를 쓴다(지시 33장의 우선순위 순).
    let chosen = null
    for (const path of paths.slice(0, 3)) {
      const edge = path.edges[0]
      const probed = await probeFn(edge, { database, scope: timeScope })
      const mode = chooseJoinMode(probed, 'filter')
      joinTrace.push({
        concept: c.concept,
        edge: { from: edge.from, to: edge.to, left_key: edge.left_key, right_key: edge.right_key },
        source: edge.relationship_source,
        probe: probed,
        decision: mode,
      })
      if (mode.mode === 'BLOCKED') continue
      chosen = { path, edge, mode, probed }
      break
    }
    if (!chosen) {
      throw new DiscoveryError('unsafe_join',
        `'${c.concept}'을 붙일 안전한 관계를 찾지 못했습니다. ${joinTrace.at(-1)?.decision?.reason || ''}`.trim(),
        { joinTrace })
    }

    // 검증을 통과한 발견 관계는 기록해 둔다. 자동 승격은 하지 않는다(지시 18장).
    if (chosen.edge.relationship_source === EDGE_SOURCE.DISCOVERED) {
      try {
        recordValidated(chosen.edge.key, { at: new Date().toISOString(), fanout_ratio: chosen.probed.fanout_ratio })
      } catch { /* 기록 실패가 조회를 막을 이유는 없다 */ }
    }

    filters.push({
      mode: chosen.mode.mode === 'EXISTS' ? 'exists' : 'direct',
      table: c.table,
      column: c.column,
      operator,
      values,
      concept: c.concept,
      edge: { left_key: chosen.edge.left_key, right_key: chosen.edge.right_key },
      join_reason: chosen.mode.reason,
    })
  }

  return { filters, joinTrace }
}

/** 그룹 축. root 컬럼만 v1에서 지원한다 — 조인 너머 축은 팬아웃 판단이 한 겹 더 필요하다. */
export function planGrouping(rootTable, resolvedConcepts) {
  const out = []
  for (const c of resolvedConcepts) {
    if (c.kind !== 'dimension') continue
    if (c.table !== rootTable) {
      throw new DiscoveryError('grouping_off_root',
        `'${c.concept}'은 root(${rootTable}) 밖의 컬럼이라 v1에서는 나눠 볼 수 없습니다.`)
    }
    out.push({ mode: 'direct', table: c.table, column: c.column, label: c.concept })
  }
  return out
}

/**
 * 발견 경로 전체 — 개념 해석 → root → grain → 관계 검증 → Physical Plan.
 */
export async function buildDiscoveredPlan(requirement, concepts, {
  index = loadMetadataIndex(),
  database = 'KPI_W',
  probeFn = probeJoinCardinality,
} = {}) {
  const { resolved, ambiguous, unresolved } = resolveConcepts(index, concepts)
  if (ambiguous.length) {
    throw new DiscoveryError('ambiguous_concept',
      ambiguous.map((a) => `'${a.concept}': ${a.retrieval.note}`).join('\n'),
      { clarification: true, candidates: ambiguous })
  }
  if (unresolved.length) {
    throw new DiscoveryError('unresolved_concept',
      unresolved.map((u) => `'${u.concept}': ${u.retrieval.note}`).join('\n'),
      { candidates: unresolved })
  }

  const root = chooseRoot(index, requirement, resolved)
  const grain = rootGrain(index, root.table)
  const time = resolveTimeColumn(index, root.table, requirement.time?.time_concept)
  const timeScope = time && requirement.time?.start
    ? { column: time.column, start: requirement.time.start, end: requirement.time.end }
    : null

  const { filters, joinTrace } = await planFilters(index, root.table, resolved, { timeScope, database, probeFn })
  const group_by = planGrouping(root.table, resolved)

  // 유일 키 없이 행을 세는 것은 조인이 없을 때만 허용한다. 조인이 하나라도 붙으면
  // 행이 불어나도 알아챌 방법이 없다 — 그때는 세지 않는다.
  if (grain.requires_no_join && filters.some((f) => f.mode !== 'direct' || f.table !== root.table)) {
    throw new DiscoveryError(
      'row_grain_unknown',
      `'${root.table}'에는 유일 키가 없는데 다른 테이블을 붙여야 합니다 — 무엇을 한 건으로 셀지 근거가 없어 실행하지 않습니다.`
    )
  }

  return {
    plan: {
      root_table: root.table,
      measure: { operation: grain.operation, column: grain.unique_key },
      time: timeScope,
      filters,
      group_by,
    },
    provenance: {
      root,
      grain,
      time: time ? { concept: requirement.time?.time_concept, column: time.column } : null,
      resolved: resolved.map((r) => ({
        concept: r.concept, table: r.table, column: r.column, matched_value: r.matched_value,
        status: r.status, score: r.score, evidence: r.evidence,
      })),
      joins: joinTrace,
    },
  }
}

export { VERDICT, ROLE, getColumn, norm }
