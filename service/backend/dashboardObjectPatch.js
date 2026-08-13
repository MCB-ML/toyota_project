import { buildWidgetPropsFromRows } from './widgetSchema.js'
import { getWidgetRows, normalizeDashboardObject, updateDashboardObject, validateDashboardObject } from '../frontend/src/utils/dashboardObject.js'
import { DEFAULT_CHART_COLOR_PALETTE, isChartColor, isChartColorPalette } from '../frontend/src/utils/chartColors.js'

const PATCHABLE_CHART_KINDS = new Set(['bar', 'line', 'area', 'pie', 'combo', 'table'])
const SORT_DIRECTIONS = new Set(['asc', 'desc', 'none'])
const AXIS_FORMATS = new Set(['auto', 'raw', 'day', 'month', 'week', 'quarter', 'year'])

function nonEmptyString(value) {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined
}

function firstConfigured(...values) {
  return values.find((value) => Array.isArray(value) && value.length) || []
}

function fieldsFor(widget) {
  const querySpec = widget.querySpec || {}
  const props = widget.props || {}
  const series = firstConfigured(querySpec.yKeys, props.y_keys, [
    ...firstConfigured(querySpec.barKeys, props.bar_keys),
    ...firstConfigured(querySpec.lineKeys, props.line_keys),
  ])
  const single = querySpec.valueKey || querySpec.yKey || props.y_key
  return {
    x: querySpec.xKey || querySpec.labelKey || props.x_key,
    values: Array.isArray(series) && series.length ? series.filter(Boolean) : (single ? [single] : []),
  }
}

function legendKeysFor(widget) {
  const { x, values } = fieldsFor(widget)
  if (widget.chartCode === 'pie' && x) return [...new Set(getWidgetRows(widget).map((row) => String(row?.[x] ?? '')).filter(Boolean))]
  if (widget.chartCode === 'scatter' && widget.props?.series_key) {
    return [...new Set(getWidgetRows(widget).map((row) => String(row?.[widget.props.series_key] ?? '')).filter(Boolean))]
  }
  return values
}

function normalizeLegendLabels(widget, input) {
  if (input === undefined) return null
  if (!input || typeof input !== 'object' || Array.isArray(input)) return { error: 'legend_labels must be an object.' }
  const allowed = new Set(legendKeysFor(widget))
  const labels = {}
  for (const [key, value] of Object.entries(input)) {
    if (!allowed.has(key)) return { error: `Unknown legend entry: ${key}` }
    if (typeof value !== 'string' || !value.trim() || value.trim().length > 80) return { error: 'Legend labels must be 1-80 characters.' }
    labels[key] = value.trim()
  }
  return { labels }
}

function normalizeSeriesColors(widget, input) {
  if (input === undefined) return null
  if (!input || typeof input !== 'object' || Array.isArray(input)) return { error: 'series_colors must be an object.' }
  const allowed = new Set(legendKeysFor(widget))
  const colors = {}
  for (const [key, value] of Object.entries(input)) {
    if (!allowed.has(key)) return { error: `Unknown series entry: ${key}` }
    if (!isChartColor(value)) return { error: `Invalid series color for ${key}. Use #RRGGBB.` }
    colors[key] = value.toUpperCase()
  }
  return { colors }
}

function querySpecForChartKind(widget, chartCode, presentation) {
  const current = widget.querySpec || {}
  const { x, values } = fieldsFor(widget)
  if (chartCode === 'table') return { ...current }
  if (!x || !values.length) return null
  if (chartCode === 'bar') {
    return values.length > 1
      ? { ...current, xKey: x, yKeys: values, orientation: presentation.orientation || current.orientation || 'vertical', stacked: presentation.stacked ?? current.stacked ?? false }
      : { ...current, labelKey: x, valueKey: values[0], orientation: presentation.orientation || current.orientation || 'vertical', stacked: presentation.stacked ?? current.stacked ?? false }
  }
  if (chartCode === 'line' || chartCode === 'area') return { ...current, xKey: x, yKeys: values, stacked: presentation.stacked ?? (chartCode === 'area') }
  if (chartCode === 'combo') {
    const barKeys = firstConfigured(current.barKeys, widget.props?.bar_keys, values.slice(0, 1))
    const lineKeys = firstConfigured(current.lineKeys, widget.props?.line_keys, values.slice(barKeys.length))
    return { ...current, xKey: x, barKeys, lineKeys, secondaryKeys: current.secondaryKeys || widget.props?.secondary_keys || [], stacked: presentation.stacked ?? current.stacked ?? false }
  }
  if (chartCode === 'pie') return { ...current, labelKey: x, valueKey: values[0] }
  return null
}

function validatePresentation(presentation) {
  if (!presentation || typeof presentation !== 'object' || Array.isArray(presentation)) return 'Presentation changes are required.'
  const allowed = new Set(['title', 'chart_type', 'show_legend', 'legend_position', 'show_labels', 'stacked', 'orientation', 'sort_direction', 'x_axis_format', 'legend_labels', 'color_palette', 'series_colors'])
  if (!Object.keys(presentation).some((key) => allowed.has(key))) return 'No supported presentation changes were provided.'
  if (presentation.chart_type && !PATCHABLE_CHART_KINDS.has(presentation.chart_type)) return `Unsupported chart type: ${presentation.chart_type}`
  if (presentation.orientation && !['vertical', 'horizontal'].includes(presentation.orientation)) return 'orientation must be vertical or horizontal.'
  if (presentation.legend_position && !['auto', 'top', 'bottom', 'left', 'right', 'hidden'].includes(presentation.legend_position)) return 'Unsupported legend position.'
  if (presentation.sort_direction && !SORT_DIRECTIONS.has(presentation.sort_direction)) return 'sort_direction must be asc, desc, or none.'
  if (presentation.x_axis_format && !AXIS_FORMATS.has(presentation.x_axis_format)) return 'Unsupported x_axis_format.'
  if (presentation.color_palette && !isChartColorPalette(presentation.color_palette)) return `Unsupported color_palette. Use a registered palette such as ${DEFAULT_CHART_COLOR_PALETTE}, vivid, soft, accessible, or custom.`
  for (const key of ['show_legend', 'show_labels', 'stacked']) {
    if (presentation[key] !== undefined && typeof presentation[key] !== 'boolean') return `${key} must be true or false.`
  }
  return null
}

export function applyDashboardPresentationPatch(widgetInput, presentation) {
  const validationError = validatePresentation(presentation)
  if (validationError) return { ok: false, reason: validationError }

  const widget = normalizeDashboardObject(widgetInput)
  const legendLabels = normalizeLegendLabels(widget, presentation.legend_labels)
  if (legendLabels?.error) return { ok: false, reason: legendLabels.error }
  const seriesColors = normalizeSeriesColors(widget, presentation.series_colors)
  if (seriesColors?.error) return { ok: false, reason: seriesColors.error }
  const chartCode = presentation.chart_type || widget.chartCode
  const title = nonEmptyString(presentation.title) || widget.title
  let querySpec = widget.querySpec || {}
  let props = { ...(widget.props || {}), title }

  if (presentation.chart_type && presentation.chart_type !== widget.chartCode) {
    const rows = getWidgetRows(widget)
    if (!rows.length) return { ok: false, reason: 'Load chart data before changing chart type.' }
    querySpec = querySpecForChartKind(widget, chartCode, presentation)
    if (!querySpec) return { ok: false, reason: 'The current result fields cannot render the requested chart type.' }
    try {
      props = { ...buildWidgetPropsFromRows(chartCode, rows, querySpec, title).props, title }
    } catch (error) {
      return { ok: false, reason: `Could not change chart type: ${error.message}` }
    }
  }

  if (chartCode === 'bar' && presentation.orientation) querySpec = { ...querySpec, orientation: presentation.orientation }
  if (['bar', 'area', 'combo'].includes(chartCode) && presentation.stacked !== undefined) {
    querySpec = { ...querySpec, stacked: presentation.stacked }
  }
  if (chartCode === 'bar' && presentation.orientation) props.orientation = presentation.orientation
  if (['bar', 'area', 'combo'].includes(chartCode) && presentation.stacked !== undefined) props.stacked = presentation.stacked

  const next = updateDashboardObject(widget, {
    objectType: chartCode === 'table' ? 'table' : 'chart',
    chartCode,
    type: presentation.chart_type && presentation.chart_type !== widget.chartCode
      ? buildWidgetPropsFromRows(chartCode, getWidgetRows(widget), querySpec, title).type
      : widget.type,
    title,
    querySpec,
    props,
    objectSpec: {
      vizSpec: {
        kind: chartCode,
        ...(chartCode === 'table' ? { renderer: 'table' } : {}),
        binding: {
          ...(chartCode === 'bar' && presentation.orientation ? { orientation: presentation.orientation } : {}),
          ...(['bar', 'area', 'combo'].includes(chartCode) && presentation.stacked !== undefined ? { stacked: presentation.stacked } : {}),
        },
        features: {
          ...(presentation.legend_position === 'hidden' ? { legend: false, legendPosition: 'hidden' } : {}),
          ...(presentation.show_legend !== undefined ? { legend: presentation.show_legend } : {}),
          ...(presentation.legend_position && presentation.legend_position !== 'hidden' ? { legend: true, legendPosition: presentation.legend_position } : {}),
          ...(presentation.show_labels !== undefined ? { labels: presentation.show_labels ? 'top' : false } : {}),
          ...(legendLabels ? { legendLabels: legendLabels.labels } : {}),
          ...(presentation.color_palette ? { colorPalette: presentation.color_palette } : {}),
          ...(presentation.color_palette && !seriesColors ? { seriesColors: {} } : {}),
          ...(seriesColors ? { seriesColors: seriesColors.colors } : {}),
        },
        ...(presentation.x_axis_format ? { axis: { x: { format: presentation.x_axis_format } } } : {}),
        ...(presentation.sort_direction ? { sort: { direction: presentation.sort_direction } } : {}),
      },
    },
  })
  const issues = validateDashboardObject(next)
  return issues.length ? { ok: false, reason: issues.join(' ') } : { ok: true, widget: next }
}
