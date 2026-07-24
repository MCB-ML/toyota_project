/**
 * Loads semantic/*.yaml + ontology/*.yaml into an in-memory registry.
 * Uses js-yaml, which is already a dependency of louis/dashboard
 * (package.json) — no new dependency introduced.
 *
 * This is P3-adjacent scaffolding: SQLCompiler, IR Validator, and the
 * Dashboard Planner all need the same "what metrics/dimensions/joins exist"
 * lookup, so it's centralized here instead of each re-reading YAML files.
 */
const fs = require("fs");
const path = require("path");
const yaml = require("js-yaml");

const ROOT = path.resolve(__dirname, "..", "..");

function loadYaml(relPath) {
  const full = path.join(ROOT, relPath);
  return yaml.load(fs.readFileSync(full, "utf8"));
}

let cache = null;

/**
 * @returns {{
 *   metrics: Map<string, object>,
 *   dimensions: Map<string, object>,
 *   joins: Map<string, object>,
 *   filters: Map<string, object>,
 *   entities: Map<string, object>,
 * }}
 */
function loadRegistry({ force = false } = {}) {
  if (cache && !force) return cache;

  const metricFiles = [
    "semantic/metrics/activity_metrics.yaml",
    "semantic/metrics/lead_metrics.yaml",
    "semantic/metrics/testdrive_metrics.yaml",
    "semantic/metrics/contract_metrics.yaml",
    "semantic/metrics/delivery_metrics.yaml",
    "semantic/metrics/target_metrics.yaml",
  ];

  const metrics = new Map();
  for (const f of metricFiles) {
    const doc = loadYaml(f);
    for (const m of doc.metrics || []) {
      if (metrics.has(m.id)) {
        throw new Error(`Duplicate metric id '${m.id}' found in ${f} (already defined elsewhere)`);
      }
      metrics.set(m.id, { ...m, _source_file: f });
    }
  }

  const dimensions = new Map();
  for (const d of loadYaml("semantic/dimensions.yaml").dimensions || []) {
    dimensions.set(d.id, d);
  }

  const joins = new Map();
  for (const j of loadYaml("semantic/joins.yaml").joins || []) {
    joins.set(j.join_id, j);
  }

  const filters = new Map();
  for (const f of loadYaml("semantic/filters.yaml").filters || []) {
    filters.set(f.rule_id, f);
  }

  const entities = new Map();
  for (const e of loadYaml("ontology/entities.yaml").entities || []) {
    entities.set(e.id, e);
  }

  cache = { metrics, dimensions, joins, filters, entities };
  return cache;
}

module.exports = { loadRegistry };
