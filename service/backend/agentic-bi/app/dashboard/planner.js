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
  const document = parseYaml(fs.readFileSync(path.join(ROOT, 'frontend/component-registry/component_registry.yaml'), 'utf8'))
  componentRegistryCache = new Map(document.components.map((component) => [component.type, component]))
  return componentRegistryCache
}

const CHART_TYPE_KEYWORDS = [
  { type: 'donut_chart', re: /도넛|도너츠|파이|원형|pie|donut/i },
  { type: 'line_chart', re: /꺾은선|꺽은선|라인|선\s*그래프|선그래프|추이|트렌드|line/i },
  { type: 'area_chart', re: /영역\s*(그래프|차트)?|면적|area/i },
]

export function requestedComponentType(message) {
  if (!message) return null
  for (const { type, re } of CHART_TYPE_KEYWORDS) {
    if (re.test(message)) return type
  }
  return null
}

function preferredComponentType(preferredChartType) {
  if (preferredChartType === 'table') return 'detail_table'
  if (preferredChartType === 'line') return 'line_chart'
  if (preferredChartType === 'area') return 'area_chart'
  if (preferredChartType === 'bar') return 'bar_chart'
  if (preferredChartType === 'donut' || preferredChartType === 'pie') return 'donut_chart'
  return null
}

export function pickComponentType(metricId, rowCount, semanticRegistry, { preferredChartType, isTimeSeries, message } = {}) {
  const metric = semanticRegistry.metrics.get(metricId)
  const isRatioLike = ['ratio_metric', 'conversion_metric', 'progress_metric'].includes(metric?.metric_type)
  const preferred = preferredComponentType(preferredChartType)

  // 사용자가 차트 종류를 명시했으면 행 수로 표를 강제하지 않는다. 객체 변경은 기존
  // 차트 종류도 preferredChartType으로 전달하므로, 30개가 넘는 범주도 의도대로 유지된다.
  if (preferred) return preferred
  if (rowCount === 1) return 'kpi_card'
  if (rowCount > 30) return 'detail_table'
  if (isTimeSeries && (!preferredChartType || preferredChartType === 'auto')) return 'line_chart'
  const requested = requestedComponentType(message)
  if (requested === 'donut_chart') {
    if (!isRatioLike) return 'donut_chart'
  } else if (requested === 'line_chart' || requested === 'area_chart') {
    return requested
  }
  if (isRatioLike) return 'bar_chart'
  return 'bar_chart'
}

export function planDashboard({
  dashboardId,
  title,
  compiledQueries,
  executionResults,
  preferredChartType,
  isTimeSeries = false,
  message = title,
}) {
  const semanticRegistry = loadRegistry()
  const componentRegistry = loadComponentRegistry()
  const components = []
  let x = 0
  let y = 0
  const columns = 12

  compiledQueries.forEach((compiledQuery, index) => {
    const result = executionResults.find((item) => item.metricId === compiledQuery.metricId)
    const rowCount = result?.rows?.length ?? 0
    const type = pickComponentType(compiledQuery.metricId, rowCount, semanticRegistry, { preferredChartType, isTimeSeries, message })
    const definition = componentRegistry.get(type)
    const width = type === 'kpi_card' ? 3 : type === 'detail_table' ? 12 : 6
    const height = type === 'kpi_card' ? 2 : 6
    if (x + width > columns) {
      x = 0
      y += height
    }

    components.push({
      id: `${compiledQuery.metricId}_${index}`,
      type,
      title: semanticRegistry.metrics.get(compiledQuery.metricId)?.name_ko || compiledQuery.metricId,
      query_ref: compiledQuery.metricId,
      metric: compiledQuery.metricId,
      position: { x, y, w: width, h: height },
      renderer: definition?.react_component,
    })
    x += width
  })

  return {
    dashboard_id: dashboardId,
    title,
    layout: { columns, row_height: 80 },
    global_filters: [],
    components,
  }
}
