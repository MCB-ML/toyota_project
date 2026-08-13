// Loads semantic/*.yaml + ontology/entities.yaml into an in-memory registry.
// This is the live runtime copy of agentic_bi_design/app/semantic/registry.js —
// ported from the CommonJS design skeleton to this project's ESM ("type":
// "module" in package.json). Logic is unchanged; only require/module.exports
// became import/export and __dirname uses the fileURLToPath pattern already
// used elsewhere in this server (see server/schemaLoader.js).
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { load as parseYaml } from 'js-yaml'
import { signatureOf } from '../../semantic/signature.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..', '..') // server/agentic-bi/

function loadYaml(relPath) {
  return parseYaml(fs.readFileSync(path.join(ROOT, relPath), 'utf8'))
}

let cache = null

export function loadRegistry({ force = false } = {}) {
  if (cache && !force) return cache

  const metricFiles = [
    'semantic/metrics/activity_metrics.yaml',
    'semantic/metrics/lead_metrics.yaml',
    'semantic/metrics/testdrive_metrics.yaml',
    'semantic/metrics/contract_metrics.yaml',
    'semantic/metrics/delivery_metrics.yaml',
    'semantic/metrics/target_metrics.yaml',
  ]

  const metrics = new Map()
  for (const f of metricFiles) {
    const doc = loadYaml(f)
    const sourceDependencyCatalog = doc.source_dependencies || {}
    for (const m of doc.metrics || []) {
      if (metrics.has(m.id)) {
        throw new Error(`Duplicate metric id '${m.id}' found in ${f} (already defined elsewhere)`)
      }
      // 2026-08-04 leo: source watermark 캐시는 SQL을 파싱하지 않고 metric YAML의
      // base_table -> source_dependencies catalog 연결만 사용한다.
      const declaredSources = Array.isArray(m.source_dependencies)
        ? m.source_dependencies
        : m.base_table && sourceDependencyCatalog[m.base_table]
          ? [sourceDependencyCatalog[m.base_table]]
          : []
      // Semantic Signature를 여기서 한 번 붙인다(스펙 13장 Normalized Metric Contract).
      // 기존 필드는 하나도 건드리지 않는다 — expression·source_evidence·required_filters는
      // 그대로다. signature는 "이 지표가 무슨 의미인가"를 코드가 읽기 위한 추가 정보다.
      const merged = { ...m, source_dependencies: declaredSources, _source_file: f }
      metrics.set(m.id, { ...merged, semantic_signature: signatureOf(merged) })
    }
  }

  const dimensions = new Map()
  for (const d of loadYaml('semantic/dimensions.yaml').dimensions || []) {
    dimensions.set(d.id, d)
  }

  const joins = new Map()
  for (const j of loadYaml('semantic/joins.yaml').joins || []) {
    joins.set(j.join_id, j)
  }

  const filters = new Map()
  for (const f of loadYaml('semantic/filters.yaml').filters || []) {
    filters.set(f.rule_id, f)
  }

  const entities = new Map()
  for (const e of loadYaml('ontology/entities.yaml').entities || []) {
    entities.set(e.id, e)
  }

  cache = { metrics, dimensions, joins, filters, entities }
  return cache
}
