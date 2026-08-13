// Schema Graph — 테이블 사이의 관계를 등급이 붙은 엣지로 표현한다(스펙 10·11장).
//
// 엣지는 네 군데서 온다. 순서가 곧 신뢰 순서다(스펙 33장):
//   1. CERTIFIED     semantic/joins.yaml — GOLD SQL에서 확인된 조인
//   2. VALIDATED     이전 실행에서 런타임 검증을 통과한 발견 관계(디스크에 남긴다)
//   3. CURATED_FK    schema/tables/*.yaml 의 FK 선언
//   4. DISCOVERED    동일 컬럼명 + 타입 호환 + 키 모양 — 가장 약한 근거
//
// 등록되지 않은 관계라고 무조건 실패시키지 않는다(스펙 11장). 대신 DISCOVERED로 만들어
// 올려보내고, 실행 전에 런타임 검증(cardinality/fanout)을 반드시 거치게 한다.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { loadRegistry } from '../../agentic-bi/app/semantic/registry.js'
import { tablesOf } from '../catalog/metadataIndex.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const LEARNED_FILE = path.resolve(__dirname, '..', 'cache', 'validated-relationships.json')

const DEFAULT_SCHEMA = 'ktws'

export const EDGE_SOURCE = {
  CERTIFIED: 'CERTIFIED',
  VALIDATED: 'VALIDATED',
  CURATED_FK: 'CURATED_FK',
  DISCOVERED: 'DISCOVERED',
}

// 경로 순위에 그대로 쓰인다. 큰 값이 우선.
export const SOURCE_RANK = {
  [EDGE_SOURCE.CERTIFIED]: 400,
  [EDGE_SOURCE.VALIDATED]: 300,
  [EDGE_SOURCE.CURATED_FK]: 200,
  [EDGE_SOURCE.DISCOVERED]: 100,
}

const KEY_NAME = /(_key|_id|_no|_cd)$/i
const COMPATIBLE = [
  new Set(['varchar', 'nvarchar', 'char', 'nchar']),
  new Set(['int', 'bigint', 'smallint', 'tinyint']),
  new Set(['date', 'datetime', 'datetime2', 'smalldatetime']),
]

function typesCompatible(a, b) {
  if (a === b) return true
  return COMPATIBLE.some((g) => g.has(a) && g.has(b))
}

function qualify(table) {
  return table.includes('.') ? table : `${DEFAULT_SCHEMA}.${table}`
}

export function loadValidatedRelationships(file = LEARNED_FILE) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf-8'))
  } catch {
    return { relationships: [] }
  }
}

/**
 * 검증을 통과한 발견 관계를 기록한다(스펙 25장의 lifecycle).
 * **자동으로 CERTIFIED로 올리지 않는다** — 관측 횟수만 쌓고, 승격은 사람이 한다.
 */
export function recordValidatedRelationship(edgeKey, observation, file = LEARNED_FILE) {
  const store = loadValidatedRelationships(file)
  const found = store.relationships.find((r) => r.key === edgeKey)
  if (found) {
    found.observations = (found.observations || 0) + 1
    found.last_seen = observation.at
    found.last_fanout_ratio = observation.fanout_ratio ?? found.last_fanout_ratio
  } else {
    store.relationships.push({
      key: edgeKey,
      observations: 1,
      first_seen: observation.at,
      last_seen: observation.at,
      last_fanout_ratio: observation.fanout_ratio ?? null,
      status: EDGE_SOURCE.VALIDATED,
      promoted: false,
    })
  }
  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.writeFileSync(file, JSON.stringify(store, null, 2), 'utf-8')
  return store
}

export function edgeKey(e) {
  return `${e.from}.${e.left_key}->${e.to}.${e.right_key}`
}

/**
 * 그래프를 만든다.
 *
 * @returns {{edges: Array, adjacency: Map<string, Array>, nodes: Set<string>}}
 */
export function buildSchemaGraph(index, {
  registry = safeRegistry(),
  validated = loadValidatedRelationships(),
  includeDiscovered = true,
} = {}) {
  const edges = []
  const seen = new Set()

  const push = (e) => {
    const key = edgeKey(e)
    if (seen.has(key)) return
    seen.add(key)
    edges.push({ ...e, key })
  }

  // 1) Certified — joins.yaml
  for (const j of registry?.joins?.values() || []) {
    const from = qualify(j.from.table)
    const to = qualify(j.to.table)
    push({
      from,
      to,
      left_key: j.from.column,
      right_key: j.to.column,
      kind: j.kind,
      relationship_source: EDGE_SOURCE.CERTIFIED,
      certification_status: EDGE_SOURCE.CERTIFIED,
      cardinality: j.kind === 'EXISTS_SUBQUERY' ? 'unknown' : 'many_to_one',
      confidence: 0.99,
      fanout_risk: j.fanout_risk || 'low',
      // EXISTS_SUBQUERY로 등록된 관계는 평범한 JOIN으로 강등할 수 없다(joins.yaml 주석 참고).
      exists_only: j.kind === 'EXISTS_SUBQUERY',
      evidence: [{ type: 'certified_join', detail: j.join_id }],
    })
  }

  // 2) 정의서 FK 선언
  for (const t of tablesOf(index)) {
    for (const fk of t.declared_foreign_keys || []) {
      push({
        from: t.full,
        to: qualify(fk.to_table),
        left_key: fk.column,
        right_key: fk.to_column,
        kind: 'LEFT',
        relationship_source: EDGE_SOURCE.CURATED_FK,
        certification_status: EDGE_SOURCE.CURATED_FK,
        cardinality: 'unknown',
        confidence: 0.7,
        fanout_risk: 'unknown',
        evidence: [{ type: 'curated_fk', detail: fk.description || `${t.table}.${fk.column} → ${fk.to_table}.${fk.to_column}` }],
      })
    }
  }

  // 3) 이름/타입으로 발견한 후보
  if (includeDiscovered) {
    for (const e of discoverEdges(index)) push(e)
  }

  // 4) 이전에 런타임 검증을 통과한 관계는 등급을 올린다(승격이 아니라 순위 가산이다).
  const validatedKeys = new Map((validated.relationships || []).map((r) => [r.key, r]))
  for (const e of edges) {
    const hit = validatedKeys.get(e.key)
    if (hit && e.relationship_source === EDGE_SOURCE.DISCOVERED) {
      e.relationship_source = EDGE_SOURCE.VALIDATED
      e.confidence = Math.max(e.confidence, 0.8)
      e.observations = hit.observations
      e.evidence = [...e.evidence, { type: 'previously_validated', detail: `검증 통과 ${hit.observations}회` }]
    }
  }

  const adjacency = new Map()
  const nodes = new Set()
  for (const e of edges) {
    nodes.add(e.from)
    nodes.add(e.to)
    if (!adjacency.has(e.from)) adjacency.set(e.from, [])
    if (!adjacency.has(e.to)) adjacency.set(e.to, [])
    adjacency.get(e.from).push({ ...e, direction: 'forward' })
    // 역방향도 탐색 가능하되, 카디널리티는 뒤집어 표시한다.
    adjacency.get(e.to).push({
      ...e,
      direction: 'reverse',
      from: e.to,
      to: e.from,
      left_key: e.right_key,
      right_key: e.left_key,
      cardinality: e.cardinality === 'many_to_one' ? 'one_to_many' : e.cardinality,
    })
  }

  return { edges, adjacency, nodes }
}

function safeRegistry() {
  try {
    return loadRegistry()
  } catch {
    return { joins: new Map() }
  }
}

/**
 * 등록되지 않은 조인 후보를 찾는다(스펙 11장).
 * 근거: 같은 컬럼명 + 타입 호환 + 키 모양. 한쪽이 PK 후보면 many_to_one으로 본다.
 * 이 단계는 "후보"만 만든다 — 실행 허가는 런타임 검증이 준다.
 */
export function discoverEdges(index) {
  const out = []
  const tables = tablesOf(index)
  const byColumn = new Map()
  for (const t of tables) {
    for (const c of t.columns) {
      if (!KEY_NAME.test(c.name)) continue
      const key = c.name.toLowerCase()
      if (!byColumn.has(key)) byColumn.set(key, [])
      byColumn.get(key).push({ t, c })
    }
  }
  for (const [name, owners] of byColumn) {
    if (owners.length < 2) continue
    // 같은 이름을 가진 테이블이 너무 많으면(예: 공통 감사 컬럼) 관계 근거로 약하다.
    if (owners.length > 8) continue
    for (const left of owners) {
      for (const right of owners) {
        if (left.t.full === right.t.full) continue
        if (!typesCompatible(left.c.data_type, right.c.data_type)) continue
        // 오른쪽이 유일키일 때만 방향 있는 후보로 삼는다. 양쪽 다 유일하지 않으면
        // 다대다라 조용히 팬아웃한다 — 후보로 만들되 위험을 표시해 둔다.
        const rightUnique = Boolean(right.c.pk_candidate)
        out.push({
          from: left.t.full,
          to: right.t.full,
          left_key: left.c.name,
          right_key: right.c.name,
          kind: 'LEFT',
          relationship_source: EDGE_SOURCE.DISCOVERED,
          certification_status: EDGE_SOURCE.DISCOVERED,
          cardinality: rightUnique ? 'many_to_one' : 'unknown',
          confidence: rightUnique ? 0.5 : 0.3,
          fanout_risk: rightUnique ? 'low' : 'unknown',
          evidence: [
            { type: 'shared_column_name', detail: name },
            { type: 'type_compatible', detail: `${left.c.data_type} / ${right.c.data_type}` },
            rightUnique
              ? { type: 'right_unique', detail: `${right.t.full}.${right.c.name} distinct=${right.c.distinct_count} rows=${right.t.row_count}` }
              : { type: 'right_not_unique', detail: `${right.t.full}.${right.c.name} distinct=${right.c.distinct_count} rows=${right.t.row_count}` },
          ],
        })
      }
    }
  }
  return out
}
