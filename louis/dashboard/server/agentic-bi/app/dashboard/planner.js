// DashboardPlanner — live ESM port of agentic_bi_design/app/dashboard/planner.js
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { load as parseYaml } from 'js-yaml'
import { loadRegistry } from '../semantic/registry.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..', '..')

let componentRegistryCache = null
export function loadComponentRegistry() {
  if (componentRegistryCache) return componentRegistryCache
  const doc = parseYaml(fs.readFileSync(path.join(ROOT, 'frontend/component-registry/component_registry.yaml'), 'utf8'))
  componentRegistryCache = new Map(doc.components.map((c) => [c.type, c]))
  return componentRegistryCache
}

export function pickComponentType(metricId, rowCount, semanticRegistry) {
  const metric = semanticRegistry.metrics.get(metricId)
  const isRatioLike = ['ratio_metric', 'conversion_metric', 'progress_metric'].includes(metric?.metric_type)

  if (rowCount === 1) return 'kpi_card'
  if (rowCount > 30) return 'detail_table' // 카테고리 많으면 비율이어도 표로 — bar_chart의 max_categories 초과 방지
  if (isRatioLike) return 'bar_chart' // 비율의 breakdown은 막대로 — 도넛(합계형) 금지
  return 'bar_chart'
}

export function planDashboard({ dashboardId, title, compiledQueries, executionResults }) {
  const semanticRegistry = loadRegistry()
  const componentRegistry = loadComponentRegistry()

  const components = []
  let x = 0, y = 0
  const COLS = 12

  compiledQueries.forEach((cq, idx) => {
    const result = executionResults.find((r) => r.metricId === cq.metricId)
    const rowCount = result?.rows?.length ?? 0
    const type = pickComponentType(cq.metricId, rowCount, semanticRegistry)
    const w = type === 'kpi_card' ? 3 : type === 'detail_table' ? 12 : 6
    const h = type === 'kpi_card' ? 2 : 4
    if (x + w > COLS) { x = 0; y += h }

    components.push({
      id: `${cq.metricId}_${idx}`,
      type,
      title: semanticRegistry.metrics.get(cq.metricId)?.name_ko || cq.metricId,
      query_ref: cq.metricId,
      metric: cq.metricId,
      position: { x, y, w, h },
    })
    x += w
  })

  return {
    dashboard_id: dashboardId,
    title,
    layout: { columns: COLS, row_height: 80 },
    global_filters: [],
    components,
  }
}
