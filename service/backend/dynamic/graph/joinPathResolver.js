// Join Path Resolver — root 테이블에서 목표 테이블까지 가는 경로 후보를 만든다.
//
// 무한 탐색하지 않는다(스펙 33장): 홉 수 상한, 후보 수 상한, 신뢰도 임계, Certified 우선.
// 여기서 나온 경로는 전부 "후보"다. 어느 것을 쓸지는 런타임 검증이 정한다.
import { EDGE_SOURCE, SOURCE_RANK } from './schemaGraph.js'

const DEFAULT_MAX_HOPS = 2
const DEFAULT_MAX_PATHS = 8

/** 경로 하나의 순위 점수. 낮은 홉 · 높은 등급 · 낮은 팬아웃 위험이 앞선다. */
export function scorePath(edges) {
  let score = 0
  for (const e of edges) {
    score += SOURCE_RANK[e.relationship_source] ?? 0
    if (e.fanout_risk === 'high') score -= 150
    else if (e.fanout_risk === 'unknown') score -= 60
    else if (e.fanout_risk === 'medium') score -= 30
    if (e.cardinality === 'one_to_many') score -= 100
    if (e.cardinality === 'unknown') score -= 40
  }
  // 홉이 늘수록 의미가 흐려진다 — 같은 등급이면 짧은 쪽.
  score -= (edges.length - 1) * 120
  return score
}

/**
 * @returns {Array<{target, edges, hops, score, worst_source, has_unknown_cardinality}>}
 */
export function findJoinPaths(graph, rootTable, targetTable, {
  maxHops = DEFAULT_MAX_HOPS,
  maxPaths = DEFAULT_MAX_PATHS,
  minSource = EDGE_SOURCE.DISCOVERED,
} = {}) {
  if (rootTable === targetTable) {
    return [{ target: targetTable, edges: [], hops: 0, score: 1000, worst_source: EDGE_SOURCE.CERTIFIED, has_unknown_cardinality: false }]
  }
  const minRank = SOURCE_RANK[minSource] ?? 0
  const found = []

  const walk = (current, visited, edges) => {
    if (edges.length >= maxHops) return
    for (const edge of graph.adjacency.get(current) || []) {
      if ((SOURCE_RANK[edge.relationship_source] ?? 0) < minRank) continue
      if (visited.has(edge.to)) continue
      const next = [...edges, edge]
      if (edge.to === targetTable) {
        found.push(next)
        continue
      }
      walk(edge.to, new Set([...visited, edge.to]), next)
    }
  }
  walk(rootTable, new Set([rootTable]), [])

  const paths = found.map((edges) => ({
    target: targetTable,
    edges,
    hops: edges.length,
    score: scorePath(edges),
    worst_source: edges.reduce(
      (worst, e) => ((SOURCE_RANK[e.relationship_source] ?? 0) < (SOURCE_RANK[worst] ?? 0) ? e.relationship_source : worst),
      EDGE_SOURCE.CERTIFIED
    ),
    has_unknown_cardinality: edges.some((e) => e.cardinality !== 'many_to_one'),
    requires_exists: edges.some((e) => e.exists_only),
  }))

  paths.sort((a, b) => b.score - a.score || a.hops - b.hops)
  // 같은 테이블 쌍을 같은 키로 지나가는 중복 경로는 하나만 남긴다.
  const unique = []
  const seen = new Set()
  for (const p of paths) {
    const sig = p.edges.map((e) => e.key).join('|')
    if (seen.has(sig)) continue
    seen.add(sig)
    unique.push(p)
    if (unique.length >= maxPaths) break
  }
  return unique
}

/** 여러 목표 테이블에 대한 경로를 한 번에 찾는다. 하나라도 못 찾으면 그 항목은 빈 배열이다. */
export function resolveJoinTargets(graph, rootTable, targetTables, options = {}) {
  const out = new Map()
  for (const target of new Set(targetTables)) {
    out.set(target, findJoinPaths(graph, rootTable, target, options))
  }
  return out
}
