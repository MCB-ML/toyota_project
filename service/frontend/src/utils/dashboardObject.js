// Shared dashboard-object model used by the browser and the Node handlers.
// `type`/`props` are retained for the existing Recharts renderer, while
// `objectSpec`/`layout` are the durable, renderer-independent saved contract.
import { DEFAULT_CHART_COLOR_PALETTE } from './chartColors.js'
import { DEFAULT_KPI_CARD_SPEC } from './kpiCardSpec.js'
import { DEFAULT_CHART_TEXT_SIZES, DEFAULT_TABLE_TYPOGRAPHY } from './dashboardTypography.js'

export const DASHBOARD_OBJECT_MODEL_VERSION = 7

export const DASHBOARD_OBJECT_TYPES = [
  'chart',
  'table',
  'kpi-card',
  'summary-card',
  'alert',
  'recommendation-list',
  'filter-control',
  'section',
  'text',
]

const CHART_CODE_BY_WIDGET_TYPE = {
  render_bar_chart: 'bar',
  render_line_chart: 'line',
  render_area_chart: 'area',
  render_pie_chart: 'pie',
  render_scatter_chart: 'scatter',
  render_radar_chart: 'radar',
  render_funnel_chart: 'funnel',
  render_funnel_pyramid: 'funnel_pyramid',
  render_combo_chart: 'combo',
  render_table: 'table',
  render_kpi_cards: 'kpi',
}

const OBJECT_TYPE_BY_CHART_CODE = {
  table: 'table',
  kpi: 'kpi-card',
}

const SUPPORTED_CHART_KINDS = new Set(['bar', 'line', 'area', 'pie', 'scatter', 'radar', 'funnel', 'funnel_pyramid', 'combo', 'table', 'kpi'])

function asString(value, fallback = '') {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback
}

function isFiniteInteger(value) {
  return Number.isInteger(value) && Number.isFinite(value)
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function plainObject(value) {
  return isPlainObject(value) ? value : {}
}

function mergeObject(base, override) {
  const result = { ...base }
  for (const [key, value] of Object.entries(plainObject(override))) {
    result[key] = isPlainObject(value) && isPlainObject(base[key])
      ? mergeObject(base[key], value)
      : value
  }
  return result
}

function normalizeTableColumnVisibility(tableSpec) {
  const source = plainObject(tableSpec)
  if (!Array.isArray(source.columns)) return source
  return {
    ...source,
    columns: source.columns.map((rawColumn) => {
      const column = plainObject(rawColumn)
      const { hidden, visible, ...rest } = column
      // 2026-08-04 leo: 표 표시 여부가 hidden과 visible 두 반대 표현으로 섞여 있어
      // 편집기의 체크 의미가 뒤집혔다. 저장 모델을 visible 하나로 정규화한다.
      return {
        ...rest,
        visible: typeof visible === 'boolean' ? visible : hidden !== true,
      }
    }),
  }
}

function widgetTitle(widget) {
  return asString(widget.title, asString(widget.props?.title, '새 객체'))
}

function objectTypeFor(widget, chartCode) {
  if (DASHBOARD_OBJECT_TYPES.includes(widget.objectType)) return widget.objectType
  return OBJECT_TYPE_BY_CHART_CODE[chartCode] || 'chart'
}

function bindingFor(widget, chartCode) {
  const querySpec = plainObject(widget.querySpec)
  const props = plainObject(widget.props)
  if (chartCode === 'funnel_pyramid') {
    const channels = Array.isArray(querySpec.channels) && querySpec.channels.length
      ? querySpec.channels
      : Array.isArray(props.channels) ? props.channels : []
    return {
      x: querySpec.stageKey || props.stage_key || '단계',
      y: querySpec.totalKey || props.total_key || '단계 합계',
      series: channels.filter(Boolean),
      groupBy: null,
      orientation: 'vertical',
      stacked: true,
    }
  }
  const x = querySpec.xKey || querySpec.labelKey || props.x_key
  const singleValue = querySpec.valueKey || props.y_key
  const nonEmptyArray = (...values) => values.find((value) => Array.isArray(value) && value.length) || []
  const series = nonEmptyArray(querySpec.yKeys, props.y_keys, [
    ...nonEmptyArray(querySpec.barKeys, props.bar_keys),
    ...nonEmptyArray(querySpec.lineKeys, props.line_keys),
  ])
  return {
    x,
    y: singleValue,
    series: Array.isArray(series) ? series.filter(Boolean) : (singleValue ? [singleValue] : []),
    groupBy: querySpec.seriesKey || props.series_key,
    orientation: querySpec.orientation || props.orientation || 'vertical',
    stacked: querySpec.stacked ?? props.stacked ?? (chartCode === 'area'),
  }
}

function resultRowsFor(widget) {
  if (Array.isArray(widget?.props?.data)) return widget.props.data
  if (Array.isArray(widget?.props?.rows)) {
    return widget.props.rows.map((row) => {
      if (!Array.isArray(row)) return row
      return Object.fromEntries((widget.props.columns || []).map((column, index) => [column, row[index]]))
    })
  }
  return []
}

function isTemporalColumnValue(value) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return true
  const text = String(value ?? '').trim()
  return /^\d{4}(?:[-/.]\d{1,2}(?:[-/.]\d{1,2})?|\s*Q[1-4]|\s*W\d{1,2})/.test(text)
}

function inferColumnType(values, role) {
  const meaningful = values.filter((value) => value !== null && value !== undefined && String(value).trim() !== '')
  if (!meaningful.length) return role === 'measure' ? 'quantitative' : 'unknown'
  if (meaningful.every(isTemporalColumnValue)) return 'temporal'
  if (meaningful.every((value) => Number.isFinite(Number(String(value).replaceAll(',', ''))))) return 'quantitative'
  if (meaningful.every((value) => typeof value === 'boolean')) return 'boolean'
  return 'nominal'
}

function labelsByField(widget) {
  const querySpec = plainObject(widget.querySpec)
  const props = plainObject(widget.props)
  const labels = {}
  const assign = (fields, displayLabels) => {
    if (!Array.isArray(fields)) return
    fields.forEach((field, index) => {
      if (field) labels[field] = displayLabels?.[index] || labels[field] || field
    })
  }
  assign(querySpec.yKeys || props.y_keys, querySpec.yLabels || props.y_labels)
  assign(querySpec.barKeys || props.bar_keys, querySpec.barLabels || props.bar_labels)
  assign(querySpec.lineKeys || props.line_keys, querySpec.lineLabels || props.line_labels)
  const x = querySpec.xKey || querySpec.labelKey || props.x_key
  const y = querySpec.valueKey || querySpec.yKey || props.y_key
  if (x) labels[x] = querySpec.xLabel || props.x_label || labels[x] || x
  if (y) labels[y] = querySpec.valueLabel || props.y_label || labels[y] || y
  return labels
}

function seriesPresentationFor(widget, binding, chartCode) {
  const querySpec = plainObject(widget.querySpec)
  const props = plainObject(widget.props)
  const labels = labelsByField(widget)
  const existing = plainObject(widget.objectSpec?.vizSpec?.columnMap)
  const nonEmptyArray = (...values) => values.find((value) => Array.isArray(value) && value.length) || []
  const barKeys = nonEmptyArray(querySpec.barKeys, props.bar_keys, chartCode === 'bar' ? binding.series : [])
  const lineKeys = nonEmptyArray(querySpec.lineKeys, props.line_keys, chartCode === 'line' ? binding.series : [])
  const secondary = new Set(nonEmptyArray(querySpec.secondaryKeys, props.secondary_keys))
  return Object.fromEntries(binding.series.map((field) => [field, {
    label: labels[field] || field,
    type: lineKeys.includes(field) ? 'line' : barKeys.includes(field) ? 'bar' : existing[field]?.series?.type || (chartCode === 'area' ? 'area' : chartCode === 'scatter' ? 'scatter' : chartCode),
    axis: secondary.has(field) ? 'right' : existing[field]?.series?.axis || 'left',
  }]))
}

function columnMapFor(widget, binding, chartCode) {
  const rows = resultRowsFor(widget)
  const existing = plainObject(widget.objectSpec?.vizSpec?.columnMap)
  const labels = labelsByField(widget)
  const seriesPresentation = seriesPresentationFor(widget, binding, chartCode)
  const dataFields = new Set(rows.flatMap((row) => Object.keys(plainObject(row))))
  const fields = new Set([
    ...Object.keys(existing),
    ...dataFields,
    binding.x,
    binding.y,
    binding.groupBy,
    ...binding.series,
  ].filter(Boolean))

  return Object.fromEntries([...fields].map((field) => {
    const role = field === binding.x || field === binding.groupBy ? 'dimension' : 'measure'
    const values = rows.map((row) => row?.[field])
    const previous = plainObject(existing[field])
    return [field, {
      label: asString(previous.label, labels[field] || field),
      role: previous.role || role,
      type: previous.type || inferColumnType(values, role),
      presentInResult: dataFields.has(field),
      ...(seriesPresentation[field] ? { series: seriesPresentation[field] } : {}),
    }]
  }))
}

function defaultObjectSpec(widget, objectType, chartCode) {
  const binding = bindingFor(widget, chartCode)
  const rowCount = Array.isArray(widget.props?.data) ? widget.props.data.length : 0
  const querySpec = plainObject(widget.querySpec)
  const derivations = Array.isArray(widget.queryBundle?.derivations) && widget.queryBundle.derivations.length
    ? widget.queryBundle.derivations
    : [querySpec.ratioMeta].filter(Boolean)
  return {
    visual: {
      contentAlign: 'left',
      verticalAlign: 'top',
      density: 'comfortable',
    },
    vizSpec: {
      kind: chartCode,
      renderer: objectType === 'table' ? 'table' : chartCode === 'funnel_pyramid' ? 'custom' : 'echarts',
      binding,
      ...(derivations.length ? { derivations } : {}),
      columnMap: columnMapFor(widget, binding, chartCode),
      features: {
        legend: binding.series.length > 1 || chartCode === 'pie',
        legendPosition: 'auto',
        legendLabels: {},
        colorPalette: DEFAULT_CHART_COLOR_PALETTE,
        seriesColors: {},
        textSizes: DEFAULT_CHART_TEXT_SIZES,
        labels: false,
        tooltip: true,
      },
      axis: {
        x: { format: 'auto' },
      },
      sort: { direction: 'asc' },
      rowCount,
    },
    tableSpec: objectType === 'table' ? {
      density: 'comfortable',
      typography: DEFAULT_TABLE_TYPOGRAPHY,
      showHeader: true,
      stickyHeader: true,
      scroll: { x: true, y: true, stickyHeader: true, stickyFirstColumn: true },
      pagination: false,
      emptyText: '조회된 데이터가 없습니다.',
    } : undefined,
    kpiSpec: objectType === 'kpi-card' ? DEFAULT_KPI_CARD_SPEC : undefined,
    filterSpec: objectType === 'filter-control' ? {
      scope: 'page',
      controls: [],
    } : undefined,
  }
}

function defaultQueryBundle(widget) {
  const querySpec = plainObject(widget.querySpec)
  const queries = Array.isArray(widget.queryBundle?.queries) && widget.queryBundle.queries.length
    ? widget.queryBundle.queries
    : Array.isArray(widget.sqlQueries) && widget.sqlQueries.length
      ? widget.sqlQueries
      : asString(widget.sql)
        ? [{ metricId: widget.topic || widget.id, db: widget.db, sql: widget.sql }]
        : []

  return {
    version: Number.isInteger(widget.queryBundle?.version) ? widget.queryBundle.version : 2,
    queries: queries.filter((query) => query?.sql).map((query, index) => ({
      id: query.id || `${query.metricId || widget.id || 'query'}_${index + 1}`,
      metricId: query.metricId || widget.topic || widget.id,
      db: query.db || widget.db,
      sql: query.sql,
      ...(query.execution ? { execution: query.execution } : {}),
      // 2026-08-04 leo: source dependency는 결과 행이 아니라 실행 계획 metadata다. 저장본에도
      // 유지해 페이지 재진입 시 watermark cache 키를 같은 기준으로 재구성한다.
      ...(Array.isArray(query.sourceDependencies) ? { sourceDependencies: query.sourceDependencies } : {}),
      ...(Array.isArray(query.source_dependencies) ? { sourceDependencies: query.source_dependencies } : {}),
    })),
    merge: {
      dimensionKey: widget.queryBundle?.merge?.dimensionKey ?? querySpec.dimensionKeys ?? querySpec.xKey ?? querySpec.labelKey ?? null,
    },
    derivations: Array.isArray(widget.queryBundle?.derivations)
      ? widget.queryBundle.derivations
      : [querySpec.ratioMeta, ...(querySpec.derivations || [])].filter(Boolean),
    transform: widget.queryBundle?.transform || (querySpec.timeSeriesTransform
      ? {
          type: querySpec.timeSeriesTransform,
          ...(querySpec.cumulativeResetPeriod ? { resetPeriod: querySpec.cumulativeResetPeriod } : {}),
        }
      : null),
  }
}

export function layoutForDashboardObject(widget) {
  const source = plainObject(widget.layout)
  const left = source.x ?? widget.left
  const top = source.y ?? widget.top
  const right = widget.right
  const bottom = widget.bottom
  const w = source.w ?? (isFiniteInteger(left) && isFiniteInteger(right) ? right - left : widget.sizeHint?.w)
  const h = source.h ?? (isFiniteInteger(top) && isFiniteInteger(bottom) ? bottom - top : widget.sizeHint?.h)

  return {
    i: asString(source.i, asString(widget.id)),
    ...(isFiniteInteger(left) ? { x: left } : {}),
    ...(isFiniteInteger(top) ? { y: top } : {}),
    ...(isFiniteInteger(w) && w > 0 ? { w } : {}),
    ...(isFiniteInteger(h) && h > 0 ? { h } : {}),
    minW: Number.isInteger(source.minW) ? source.minW : 2,
    minH: Number.isInteger(source.minH) ? source.minH : 4,
    maxW: Number.isInteger(source.maxW) ? source.maxW : 12,
    maxH: Number.isInteger(source.maxH) ? source.maxH : 16,
  }
}

export function syncLegacyLayout(widget) {
  const layout = layoutForDashboardObject(widget)
  if (!isFiniteInteger(layout.x) || !isFiniteInteger(layout.y) || !isFiniteInteger(layout.w) || !isFiniteInteger(layout.h)) {
    return { ...widget, layout }
  }
  return {
    ...widget,
    layout,
    left: layout.x,
    top: layout.y,
    right: layout.x + layout.w,
    bottom: layout.y + layout.h,
  }
}

export function normalizeDashboardObject(widget) {
  const input = plainObject(widget)
  const chartCode = input.chartCode || CHART_CODE_BY_WIDGET_TYPE[input.type] || input.objectSpec?.vizSpec?.kind || 'bar'
  const objectType = objectTypeFor(input, chartCode)
  const title = widgetTitle(input)
  const suppliedObjectSpec = plainObject(input.objectSpec)
  const objectSpec = mergeObject(defaultObjectSpec(input, objectType, chartCode), {
    ...suppliedObjectSpec,
    vizSpec: plainObject(suppliedObjectSpec.vizSpec),
  })
  if (objectType === 'table') {
    objectSpec.vizSpec = { ...objectSpec.vizSpec, kind: 'table', renderer: 'table' }
    objectSpec.tableSpec = normalizeTableColumnVisibility(objectSpec.tableSpec)
  }
  const normalized = syncLegacyLayout({
    ...input,
    objectModelVersion: DASHBOARD_OBJECT_MODEL_VERSION,
    objectType,
    title,
    chartCode,
    objectSpec,
    queryBundle: defaultQueryBundle(input),
    refreshPolicy: mergeObject({ mode: 'on-load' }, input.refreshPolicy),
  })
  return normalized
}

export function createDashboardObject(widget) {
  return normalizeDashboardObject(widget)
}

export function toStoredDashboardObject(widget) {
  const normalized = normalizeDashboardObject(widget)
  const { props, runtime, loadError, sql, sqlQueries, ...stored } = normalized
  return stored
}

export function withObjectRuntime(widget, runtime) {
  return { ...normalizeDashboardObject(widget), runtime: { status: 'ready', ...runtime } }
}

export function getWidgetRows(widget) {
  if (Array.isArray(widget?.props?.data)) return widget.props.data
  if (Array.isArray(widget?.props?.rows)) {
    return widget.props.rows.map((row) => {
      if (!Array.isArray(row)) return row
      return Object.fromEntries((widget.props.columns || []).map((column, index) => [column, row[index]]))
    })
  }
  return []
}

export function formatDashboardValue(value, { compact = false, percent = false, decimals } = {}) {
  if (value === null || value === undefined || value === '') return '-'
  const numeric = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(numeric)) return String(value)
  if (percent) {
    return new Intl.NumberFormat('ko-KR', {
      style: 'percent',
      maximumFractionDigits: decimals ?? 1,
      minimumFractionDigits: decimals ?? 0,
    }).format(numeric)
  }
  return new Intl.NumberFormat('ko-KR', {
    notation: compact ? 'compact' : 'standard',
    maximumFractionDigits: decimals ?? (Number.isInteger(numeric) ? 0 : 2),
  }).format(numeric)
}

export function validateDashboardObject(candidate) {
  const object = normalizeDashboardObject(candidate)
  const issues = []
  if (!asString(object.id)) issues.push('객체 id가 필요합니다.')
  if (!DASHBOARD_OBJECT_TYPES.includes(object.objectType)) issues.push(`지원하지 않는 객체 유형입니다: ${object.objectType}`)
  if (!asString(object.title)) issues.push('객체 제목이 필요합니다.')
  if (!SUPPORTED_CHART_KINDS.has(object.chartCode)) issues.push(`지원하지 않는 차트 유형입니다: ${object.chartCode}`)
  const hasReplaySource = object.queryBundle?.queries?.length || asString(object.querySpec?.reportId)
  if (object.objectType !== 'text' && object.objectType !== 'section' && !hasReplaySource) {
    issues.push('데이터 객체에는 재조회할 queryBundle.queries가 필요합니다.')
  }
  const rows = resultRowsFor(object)
  const usesNormalizedPieRows = object.chartCode === 'pie'
    && rows.some((row) => row?.name !== undefined || row?.value !== undefined)
  if (rows.length && !usesNormalizedPieRows) {
    const available = new Set(rows.flatMap((row) => Object.keys(plainObject(row))))
    const binding = object.objectSpec?.vizSpec?.binding || {}
    const fields = [binding.x, binding.y, binding.groupBy, ...(binding.series || [])].filter(Boolean)
    for (const field of fields) {
      if (!available.has(field)) issues.push(`결과 컬럼에 없는 필드가 차트에 연결되어 있습니다: ${field}`)
    }
  }
  const layout = object.layout
  for (const key of ['x', 'y', 'w', 'h']) {
    if (layout[key] !== undefined && (!isFiniteInteger(layout[key]) || layout[key] < 0)) {
      issues.push(`layout.${key}는 0 이상의 정수여야 합니다.`)
    }
  }
  if (layout.w !== undefined && layout.w < layout.minW) issues.push('layout.w가 최소 너비보다 작습니다.')
  if (layout.h !== undefined && layout.h < layout.minH) issues.push('layout.h가 최소 높이보다 작습니다.')
  return issues
}

export function validateDashboardState(state) {
  if (!state || !Array.isArray(state.widgets)) return ['dashboardState.widgets 배열이 필요합니다.']
  const ids = new Set()
  const issues = []
  for (const widget of state.widgets) {
    const widgetIssues = validateDashboardObject(widget)
    if (widgetIssues.length) issues.push(...widgetIssues.map((issue) => `${widget?.id || '(새 객체)'}: ${issue}`))
    if (widget?.id && ids.has(widget.id)) issues.push(`중복 객체 id입니다: ${widget.id}`)
    ids.add(widget?.id)
  }
  return issues
}

export function normalizeDashboardState(state) {
  return {
    version: Number.isInteger(state?.version) ? state.version : 0,
    widgets: Array.isArray(state?.widgets) ? state.widgets.map(normalizeDashboardObject) : [],
  }
}

export function updateDashboardObject(widget, changes) {
  const current = normalizeDashboardObject(widget)
  const contractChanged = (changes.chartCode !== undefined && changes.chartCode !== current.chartCode)
    || (changes.objectType !== undefined && changes.objectType !== current.objectType)
  const next = normalizeDashboardObject({
    ...current,
    ...changes,
    props: changes.props ? (contractChanged ? changes.props : { ...current.props, ...changes.props }) : current.props,
    objectSpec: changes.objectSpec ? (contractChanged ? changes.objectSpec : mergeObject(current.objectSpec, changes.objectSpec)) : current.objectSpec,
    layout: changes.layout ? { ...current.layout, ...changes.layout, i: current.id } : current.layout,
  })
  return next
}
