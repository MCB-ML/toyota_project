import { useEffect, useMemo, useState } from 'react'
import { RotateCcw, SlidersHorizontal, X } from 'lucide-react'
import { inferTemporalGrain } from './widgets/axisFormat'
import { inferredTableSpec } from './widgets/tableModel'
import { objectFilterCandidates } from './widgets/objectDataFilters'
import { applyTimeSeriesTransform, reverseCumulativeTimeSeriesTransform } from '../utils/timeSeriesTransform'
import { CHART_COLOR_PALETTES, DEFAULT_CHART_COLOR_PALETTE, chartPaletteBackground, chartPaletteColors, customChartPalette, isChartColor, seriesColorFor } from '../utils/chartColors'
import { chartCodeOptionsFor, convertQuerySpec, rowsFromWidgetProps, seriesKeysFor } from '../utils/chartSpecConvert'
import { normalizeKpiCardSpec, summaryItemStyleFor } from '../utils/kpiCardSpec'
import { normalizeChartTextSizes, normalizeTableTypography } from '../utils/dashboardTypography'
import { buildWidgetPropsFromRows } from '../../../backend/widgetSchema.js'

const EDITABLE_CHART_CODES = ['bar', 'line', 'area', 'pie', 'scatter', 'radar', 'funnel', 'funnel_pyramid', 'combo', 'table']
const CHART_TYPE_LABELS = {
  bar: '막대',
  line: '선',
  area: '영역',
  pie: '도넛',
  scatter: '산점도',
  radar: '레이더',
  funnel: '퍼널',
  funnel_pyramid: '퍼널 구조',
  combo: '콤보',
  table: '표',
}

const TIME_FORMAT_LABELS = {
  auto: '자동',
  raw: '원본 값',
  day: '일 (4/1)',
  month: '월 (2026.04)',
  week: '주 (2026 W14)',
  quarter: '분기 (2026 Q2)',
  year: '연 (2026)',
}

function seriesEntries(object) {
  const props = object.props || {}
  const querySpec = object.querySpec || {}
  const binding = object.objectSpec?.vizSpec?.binding || {}
  const columnMap = object.objectSpec?.vizSpec?.columnMap || {}
  if (object.chartCode === 'pie') {
    return [...new Set((props.data || []).map((item) => String(item.name)).filter(Boolean))]
      .map((key) => ({ key, label: key }))
  }
  if (object.chartCode === 'funnel_pyramid') {
    const channels = querySpec.channels?.length ? querySpec.channels : props.channels || []
    return channels.map((key) => ({ key, label: columnMap[key]?.label || key }))
  }
  if (object.chartCode === 'scatter' && props.series_key) {
    return [...new Set((props.data || []).map((item) => String(item[props.series_key])).filter(Boolean))]
      .map((key) => ({ key, label: key }))
  }
  const combinedKeys = [...(props.bar_keys || querySpec.barKeys || []), ...(props.line_keys || querySpec.lineKeys || [])]
  const keys = props.y_keys?.length
    ? props.y_keys
    : (querySpec.yKeys?.length ? querySpec.yKeys : (combinedKeys.length ? [...new Set(combinedKeys)] : (props.y_key || querySpec.valueKey ? [props.y_key || querySpec.valueKey] : binding.series || [])))
  const labels = props.y_labels || querySpec.yLabels || [...(props.bar_labels || querySpec.barLabels || []), ...(props.line_labels || querySpec.lineLabels || [])]
  return keys.map((key, index) => ({ key, label: columnMap[key]?.label || labels?.[index] || key }))
}

function firstConfiguredKeys(...values) {
  return values.find((value) => Array.isArray(value) && value.length) || []
}

function isRateSeries(entry) {
  return /(rate|ratio|achievement|percent|달성률|비율|률|율)/i.test(`${entry.key} ${entry.label}`)
}

function seriesPresentationState(object) {
  const props = object.props || {}
  const querySpec = object.querySpec || {}
  const columnMap = object.objectSpec?.vizSpec?.columnMap || {}
  const entries = seriesEntries(object)
  const barKeys = new Set(firstConfiguredKeys(querySpec.barKeys, props.bar_keys))
  const lineKeys = new Set(firstConfiguredKeys(querySpec.lineKeys, props.line_keys))
  const secondaryKeys = new Set(firstConfiguredKeys(querySpec.secondaryKeys, props.secondary_keys))
  return Object.fromEntries(entries.map((entry) => {
    const previous = columnMap[entry.key]?.series || {}
    const type = object.chartCode === 'combo'
      ? (lineKeys.has(entry.key) ? 'line' : barKeys.has(entry.key) ? 'bar' : previous.type || (isRateSeries(entry) ? 'line' : 'bar'))
      : previous.type || object.chartCode
    const axis = secondaryKeys.has(entry.key) ? 'right' : previous.axis || (object.chartCode === 'combo' && isRateSeries(entry) ? 'right' : 'left')
    return [entry.key, { type, axis }]
  }))
}

function bindingFromQuerySpec(querySpec = {}, props = {}, chartCode) {
  if (chartCode === 'funnel_pyramid') {
    const channels = firstConfiguredKeys(querySpec.channels, props.channels)
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
  const y = querySpec.valueKey || querySpec.yKey || props.y_key
  const comboSeries = [
    ...firstConfiguredKeys(querySpec.barKeys, props.bar_keys),
    ...firstConfiguredKeys(querySpec.lineKeys, props.line_keys),
  ]
  const series = firstConfiguredKeys(querySpec.yKeys, props.y_keys, comboSeries, querySpec.measureKeys)
  return {
    x,
    y,
    series: Array.isArray(series) ? series.filter(Boolean) : (y ? [y] : []),
    groupBy: querySpec.seriesKey || props.series_key,
    orientation: querySpec.orientation || props.orientation || 'vertical',
    stacked: querySpec.stacked ?? props.stacked ?? chartCode === 'area',
  }
}

function columnMapForVisualization(object, rows, binding, seriesPresentation, targetSeries) {
  const existing = object.objectSpec?.vizSpec?.columnMap || {}
  const labelByKey = Object.fromEntries(targetSeries.map((entry) => [entry.key, entry.label || entry.key]))
  const rowFields = new Set((rows || []).flatMap((row) => Object.keys(row || {})))
  const fields = new Set([
    ...rowFields,
    binding.x,
    binding.y,
    binding.groupBy,
    ...(binding.series || []),
  ].filter(Boolean))
  return Object.fromEntries([...fields].map((field) => {
    const previous = existing[field] || {}
    const { series: ignoredSeries, ...previousColumn } = previous
    const role = field === binding.x || field === binding.groupBy ? 'dimension' : 'measure'
    const seriesInfo = (binding.series || []).includes(field) ? seriesPresentation[field] : null
    return [field, {
      ...previousColumn,
      label: previous.label || labelByKey[field] || field,
      role: previous.role || role,
      presentInResult: rowFields.has(field),
      ...(seriesInfo ? { series: seriesInfo } : {}),
    }]
  }))
}

function xField(object) {
  const binding = object.objectSpec?.vizSpec?.binding || {}
  return binding.x || object.props?.x_key || object.props?.label_key || object.querySpec?.xKey || object.querySpec?.labelKey || null
}

function activeTimeSeriesTransform(object) {
  return object.queryBundle?.transform?.type || object.querySpec?.timeSeriesTransform || null
}

function isNumericMetric(values) {
  const meaningful = values.filter((value) => value !== null && value !== undefined && String(value).trim() !== '')
  return meaningful.length > 0 && meaningful.every((value) => Number.isFinite(typeof value === 'number' ? value : Number(value)))
}

function timeSeriesContext(object) {
  // 도넛은 props가 name/value로 접혀 있어 원본 컬럼명으로 되돌려 받는다 —
  // 이 rows가 저장 시 buildWidgetPropsFromRows에 그대로 들어간다(nextRows).
  const rows = rowsFromWidgetProps(object.props || {}, { chartCode: object.chartCode, querySpec: object.querySpec })
  const fields = [...new Set(rows.flatMap((row) => Object.keys(row || {})))]
  const preferredTimeField = xField(object)
  const timeField = [preferredTimeField, ...fields].find((field) => {
    if (!field) return false
    const values = rows.map((row) => row?.[field]).filter((value) => value !== null && value !== undefined && String(value).trim() !== '')
    return values.length > 0 && Boolean(inferTemporalGrain(values))
  }) || null
  const configuredDimensions = Array.isArray(object.querySpec?.dimensionKeys)
    ? object.querySpec.dimensionKeys
    : []
  const dimensionFields = [...new Set([timeField, ...configuredDimensions].filter((field) => fields.includes(field)))]
  const metricFields = fields.filter((field) => !dimensionFields.includes(field) && isNumericMetric(rows.map((row) => row?.[field])))
  return { rows, timeField, dimensionFields: dimensionFields.length ? dimensionFields : (timeField ? [timeField] : []), metricFields }
}

function propsWithTimeSeriesRows(props, rows) {
  const next = { ...props }
  if (Array.isArray(props.data)) next.data = rows
  if (Array.isArray(props.rows)) {
    const columns = Array.isArray(props.columns) && props.columns.length ? props.columns : Object.keys(rows[0] || {})
    next.rows = Array.isArray(props.rows[0]) ? rows.map((row) => columns.map((field) => row?.[field])) : rows
  }
  return next
}

function summaryKpiItems(object) {
  const details = Array.isArray(object.props?.details) ? object.props.details : []
  if (!details.length) return []
  return [
    {
      key: object.props.primary_key,
      label: object.props.title || '대표 지표',
      role: 'primary',
    },
    ...details.map((detail, index) => ({
      key: detail.key,
      label: detail.title || `상세 지표 ${index + 1}`,
      role: 'detail',
    })),
  ]
}

function KpiTextStyleControls({ label, style, onChange }) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-gray-600">{label}</p>
      <label className="flex items-center justify-between gap-4 text-sm text-gray-700">
        <span>{'\uc81c\ubaa9 \ud06c\uae30'}</span>
        <span className="flex items-center gap-1"><input type="number" min="10" max="36" value={style.title.fontSize} onChange={(event) => onChange('title', 'fontSize', Number(event.target.value))} className="w-16 rounded-md border border-gray-300 px-2 py-1.5 text-right text-xs" /><span className="text-xs text-gray-400">px</span></span>
      </label>
      <label className="flex items-center justify-between gap-4 text-sm text-gray-700">
        <span>{'\uc81c\ubaa9 \uad75\uac8c'}</span>
        <input type="checkbox" checked={style.title.bold} onChange={(event) => onChange('title', 'bold', event.target.checked)} className="h-4 w-4 accent-blue-600" />
      </label>
      <label className="flex items-center justify-between gap-4 text-sm text-gray-700">
        <span>{'\uc81c\ubaa9 \uc0c9\uc0c1'}</span>
        <input type="color" value={style.title.color} onChange={(event) => onChange('title', 'color', event.target.value.toUpperCase())} title={'\uc81c\ubaa9 \uc0c9\uc0c1'} className="h-7 w-9 cursor-pointer rounded border border-gray-300 bg-white p-0.5" />
      </label>
      <label className="flex items-center justify-between gap-4 text-sm text-gray-700">
        <span>{'\ub370\uc774\ud130 \uac12 \ud06c\uae30'}</span>
        <span className="flex items-center gap-1"><input type="number" min="12" max="64" value={style.value.fontSize} onChange={(event) => onChange('value', 'fontSize', Number(event.target.value))} className="w-16 rounded-md border border-gray-300 px-2 py-1.5 text-right text-xs" /><span className="text-xs text-gray-400">px</span></span>
      </label>
      <label className="flex items-center justify-between gap-4 text-sm text-gray-700">
        <span>{'\ub370\uc774\ud130 \uac12 \uad75\uac8c'}</span>
        <input type="checkbox" checked={style.value.bold} onChange={(event) => onChange('value', 'bold', event.target.checked)} className="h-4 w-4 accent-blue-600" />
      </label>
      <label className="flex items-center justify-between gap-4 text-sm text-gray-700">
        <span>{'\ub370\uc774\ud130 \uac12 \uc0c9\uc0c1'}</span>
        <input type="color" value={style.value.color} onChange={(event) => onChange('value', 'color', event.target.value.toUpperCase())} title={'\ub370\uc774\ud130 \uac12 \uc0c9\uc0c1'} className="h-7 w-9 cursor-pointer rounded border border-gray-300 bg-white p-0.5" />
      </label>
    </div>
  )
}

function editorState(object) {
  const vizSpec = object.objectSpec?.vizSpec || {}
  const features = vizSpec.features || {}
  const binding = vizSpec.binding || {}
  const tableSpec = inferredTableSpec({
    columns: object.props?.columns,
    rows: object.props?.rows,
    tableSpec: object.objectSpec?.tableSpec,
    columnMap: vizSpec.columnMap,
  })
  const storedFilterFields = object.objectSpec?.dataFilters?.fields
  const filterCandidates = objectFilterCandidates({
    props: object.props,
    objectSpec: object.objectSpec,
    includeSingleValueFields: storedFilterFields,
    includeSingleValueTemporalFields: true,
  })
  return {
    chartCode: object.chartCode,
    title: object.title || object.props?.title || '',
    legend: features.legend !== false,
    legendPosition: features.legendPosition || 'auto',
    legendLabels: { ...(features.legendLabels || {}) },
    colorPalette: features.colorPalette || DEFAULT_CHART_COLOR_PALETTE,
    customPalette: customChartPalette(features.customPalette),
    seriesColors: { ...(features.seriesColors || {}) },
    labels: features.labels === true || features.labels === 'top',
    orientation: binding.orientation || object.props?.orientation || 'vertical',
    stacked: binding.stacked ?? object.props?.stacked ?? object.chartCode === 'area',
    runningTotal: activeTimeSeriesTransform(object) === 'cumulative',
    xAxisFormat: vizSpec.axis?.x?.format || 'auto',
    sortDirection: vizSpec.sort?.direction || 'asc',
    seriesPresentation: seriesPresentationState(object),
    tableDensity: tableSpec.density,
    tableStickyHeader: tableSpec.stickyHeader !== false && tableSpec.scroll?.stickyHeader !== false,
    tableStickyFirstColumn: tableSpec.scroll?.stickyFirstColumn === true,
    tablePageSize: tableSpec.pagination?.pageSize ? String(tableSpec.pagination.pageSize) : '0',
    tableColumns: tableSpec.columns,
    tableTypography: normalizeTableTypography(tableSpec.typography),
    chartTextSizes: normalizeChartTextSizes(features.textSizes),
    kpiSpec: normalizeKpiCardSpec(object.objectSpec?.kpiSpec),
    dataFilterFields: Array.isArray(storedFilterFields) ? storedFilterFields : filterCandidates.slice(0, 3).map((candidate) => candidate.field),
  }
}

export default function DashboardObjectEditor({ object, onSave, onClose }) {
  const [form, setForm] = useState(() => editorState(object))
  const activeChartCode = form.chartCode || object.chartCode
  const sourceIsChart = EDITABLE_CHART_CODES.includes(object.chartCode)
  const isChart = EDITABLE_CHART_CODES.includes(activeChartCode) && activeChartCode !== 'table'
  const isTable = activeChartCode === 'table' || (!sourceIsChart && object.objectType === 'table')
  const isKpiCard = object.objectType === 'kpi-card' || activeChartCode === 'kpi'
  const supportsLabels = ['bar', 'line', 'area', 'pie', 'funnel', 'combo'].includes(activeChartCode)
  const supportsLegend = ['bar', 'line', 'area', 'pie', 'radar', 'scatter', 'funnel', 'funnel_pyramid', 'combo'].includes(activeChartCode)
  const supportsPalette = isChart
  const supportsStacked = ['bar', 'area', 'combo'].includes(activeChartCode)
  const series = useMemo(() => seriesEntries(object), [object])
  const chartRows = useMemo(
    () => rowsFromWidgetProps(object.props || {}, { chartCode: object.chartCode, querySpec: object.querySpec }),
    [object.props, object.chartCode, object.querySpec],
  )
  const chartTypeOptions = useMemo(() => {
    if (!sourceIsChart) return []
    return chartCodeOptionsFor(object.chartCode, object.querySpec || {}, chartRows).filter((code) => EDITABLE_CHART_CODES.includes(code))
  }, [sourceIsChart, object.chartCode, object.querySpec, chartRows])
  const kpiSummaryItems = useMemo(() => summaryKpiItems(object), [object])
  const filterCandidates = useMemo(() => objectFilterCandidates({
    props: object.props,
    objectSpec: object.objectSpec,
    includeSingleValueFields: object.objectSpec?.dataFilters?.fields,
    includeSingleValueTemporalFields: true,
  }), [object])
  const selectedPalette = useMemo(() => {
    const palette = CHART_COLOR_PALETTES.find((item) => item.id === form.colorPalette) || CHART_COLOR_PALETTES[0]
    return {
      ...palette,
      colors: chartPaletteColors(form.colorPalette, form.customPalette),
      backgroundColor: chartPaletteBackground(form.colorPalette, form.customPalette),
    }
  }, [form.colorPalette, form.customPalette])
  const xKey = xField(object)
  const timeSeries = useMemo(() => timeSeriesContext(object), [object])
  const currentTimeSeriesTransform = activeTimeSeriesTransform(object)
  const temporalGrain = useMemo(() => inferTemporalGrain(timeSeries.rows.map((row) => row?.[timeSeries.timeField || xKey])), [timeSeries, xKey])
  const supportsSort = isChart && (Boolean(xKey) || activeChartCode === 'pie')
  const supportsAxisFormat = isChart && activeChartCode !== 'pie' && Boolean(temporalGrain)
  const supportsRunningTotal = activeChartCode !== 'funnel_pyramid'
    && (isChart || isTable)
    && Boolean(timeSeries.timeField)
    && timeSeries.metricFields.length > 0
    && (!currentTimeSeriesTransform || currentTimeSeriesTransform === 'cumulative')
  const editorLabel = activeChartCode === 'table' ? '표 설정' : object.objectType === 'kpi-card' ? '지표 카드 설정' : '차트 설정'

  useEffect(() => setForm(editorState(object)), [object])

  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }))
  const updatePalette = (colorPalette) => setForm((current) => {
    if (colorPalette === current.colorPalette) return current
    if (colorPalette === 'custom') {
      return {
        ...current,
        colorPalette,
        seriesColors: {},
        customPalette: {
          colors: chartPaletteColors(current.colorPalette, current.customPalette),
          backgroundColor: chartPaletteBackground(current.colorPalette, current.customPalette),
        },
      }
    }
    // A fixed palette is a complete theme, so stale per-series overrides must
    // not mask its colors.
    return { ...current, colorPalette, seriesColors: {} }
  })
  const updateLegendLabel = (key, value) => setForm((current) => ({
    ...current,
    legendLabels: { ...current.legendLabels, [key]: value },
  }))
  const updateSeriesColor = (key, value) => setForm((current) => ({
    ...current,
    seriesColors: { ...current.seriesColors, [key]: value.toUpperCase() },
  }))
  const updateCustomPaletteBackground = (value) => setForm((current) => ({
    ...current,
    customPalette: { ...current.customPalette, backgroundColor: value.toUpperCase() },
  }))
  const updateKpiSpec = (section, key, value) => setForm((current) => ({
    ...current,
    kpiSpec: section
      ? { ...current.kpiSpec, [section]: { ...current.kpiSpec[section], [key]: value } }
      : { ...current.kpiSpec, [key]: value },
  }))
  const updateKpiSummaryItem = (item, section, key, value) => setForm((current) => {
    const style = summaryItemStyleFor(current.kpiSpec, item.key, item.role)
    const nextStyle = section
      ? { ...style, [section]: { ...style[section], [key]: value } }
      : { ...style, [key]: value }
    return {
      ...current,
      kpiSpec: {
        ...current.kpiSpec,
        summaryItems: { ...current.kpiSpec.summaryItems, [item.key]: nextStyle },
      },
    }
  })
  const resetSeriesColor = (key) => setForm((current) => {
    const { [key]: ignored, ...seriesColors } = current.seriesColors
    return { ...current, seriesColors }
  })
  const updateSeriesPresentation = (key, changes) => setForm((current) => ({
    ...current,
    seriesPresentation: {
      ...current.seriesPresentation,
      [key]: { ...(current.seriesPresentation[key] || {}), ...changes },
    },
  }))
  const updateTableColumn = (field, changes) => setForm((current) => ({
    ...current,
    tableColumns: current.tableColumns.map((column) => column.field === field ? { ...column, ...changes } : column),
  }))
  const updateTableTypography = (key, value) => setForm((current) => ({
    ...current,
    tableTypography: { ...current.tableTypography, [key]: value },
  }))
  const updateChartTextSize = (key, value) => setForm((current) => ({
    ...current,
    chartTextSizes: { ...current.chartTextSizes, [key]: value },
  }))
  const updateDataFilterField = (field, enabled) => setForm((current) => ({
    ...current,
    dataFilterFields: enabled
      ? [...new Set([...current.dataFilterFields, field])]
      : current.dataFilterFields.filter((item) => item !== field),
  }))
  const save = () => {
    const title = form.title.trim()
    if (!title) return
    const targetChartCode = sourceIsChart ? activeChartCode : object.chartCode
    const chartCodeChanged = sourceIsChart && targetChartCode !== object.chartCode
    const targetIsChart = EDITABLE_CHART_CODES.includes(targetChartCode) && targetChartCode !== 'table'
    const targetIsTable = targetChartCode === 'table'
    const targetSupportsLabels = ['bar', 'line', 'area', 'pie', 'combo'].includes(targetChartCode)
    const targetSupportsLegend = ['bar', 'line', 'area', 'pie', 'radar', 'scatter', 'funnel_pyramid', 'combo'].includes(targetChartCode)
    const targetSupportsPalette = targetIsChart
    const targetSupportsStacked = ['bar', 'area', 'combo'].includes(targetChartCode)
    const targetSupportsAxisFormat = targetIsChart && targetChartCode !== 'pie' && Boolean(temporalGrain)
    const targetSupportsSort = targetIsChart && (Boolean(xKey) || targetChartCode === 'pie')
    const nextRows = !supportsRunningTotal || form.runningTotal === (currentTimeSeriesTransform === 'cumulative')
      ? timeSeries.rows
      : form.runningTotal
        ? applyTimeSeriesTransform(timeSeries.rows, { dimId: timeSeries.dimensionFields, metricIds: timeSeries.metricFields, transform: 'cumulative' })
        : reverseCumulativeTimeSeriesTransform(timeSeries.rows, { dimId: timeSeries.dimensionFields, metricIds: timeSeries.metricFields })
    const baseQuerySpec = { ...(object.querySpec || {}) }
    if (supportsRunningTotal) delete baseQuerySpec.timeSeriesTransform
    let querySpec = chartCodeChanged
      ? convertQuerySpec(object.chartCode, targetChartCode, baseQuerySpec, chartRows)
      : { ...baseQuerySpec }
    const targetSeries = sourceIsChart ? seriesKeysFor(targetChartCode, querySpec, nextRows) : series
    const targetSeriesKeys = targetSeries.map((entry) => entry.key)
    const legendLabels = Object.fromEntries(Object.entries(form.legendLabels).filter(([key, value]) => key && String(value).trim()))
    const allowedSeries = new Set(targetSeriesKeys)
    const seriesColors = form.colorPalette === 'custom'
      ? Object.fromEntries(Object.entries(form.seriesColors).filter(([key, value]) => allowedSeries.has(key) && isChartColor(value)))
      : {}
    const customPalette = customChartPalette(form.customPalette)
    const labelFor = (key) => legendLabels[key] || targetSeries.find((entry) => entry.key === key)?.label || key
    const secondaryFromSpec = new Set(firstConfiguredKeys(querySpec.secondaryKeys))
    const targetSecondaryKeys = targetSeriesKeys.filter((key) => form.seriesPresentation[key]?.axis === 'right' || secondaryFromSpec.has(key))
    let barKeys = []
    let lineKeys = []
    if (targetChartCode === 'combo') {
      const specBarKeys = firstConfiguredKeys(querySpec.barKeys).filter((key) => targetSeriesKeys.includes(key))
      const specLineKeys = firstConfiguredKeys(querySpec.lineKeys).filter((key) => targetSeriesKeys.includes(key))
      const formBarKeys = targetSeriesKeys.filter((key) => form.seriesPresentation[key]?.type === 'bar')
      const formLineKeys = targetSeriesKeys.filter((key) => form.seriesPresentation[key]?.type === 'line')
      const useSpecDefaults = chartCodeChanged && (!formBarKeys.length || !formLineKeys.length)
      barKeys = useSpecDefaults ? specBarKeys : formBarKeys
      lineKeys = useSpecDefaults ? specLineKeys : formLineKeys
      if (!barKeys.length && targetSeriesKeys.length) barKeys = [targetSeriesKeys[0]]
      if (!lineKeys.length && targetSeriesKeys.length > 1) lineKeys = targetSeriesKeys.filter((key) => !barKeys.includes(key))
    }
    const seriesPresentation = Object.fromEntries(targetSeries.map((entry) => {
      const previous = form.seriesPresentation[entry.key] || {}
      const type = targetChartCode === 'combo'
        ? (lineKeys.includes(entry.key) ? 'line' : 'bar')
        : targetChartCode === 'area' ? 'area' : targetChartCode
      return [entry.key, {
        type,
        axis: targetSecondaryKeys.includes(entry.key) ? 'right' : previous.axis || 'left',
      }]
    }))
    querySpec = {
      ...querySpec,
      ...(targetChartCode === 'bar' ? { orientation: form.orientation } : {}),
      ...(targetSupportsStacked ? { stacked: form.stacked } : {}),
      ...(['bar', 'line', 'area', 'combo'].includes(targetChartCode) ? { secondaryKeys: targetSecondaryKeys } : {}),
      ...(targetChartCode === 'combo' ? {
        barKeys,
        lineKeys,
        barLabels: barKeys.map(labelFor),
        lineLabels: lineKeys.map(labelFor),
      } : {}),
      ...(supportsRunningTotal && form.runningTotal ? { timeSeriesTransform: 'cumulative' } : {}),
    }
    const queryBundle = supportsRunningTotal ? {
      ...(object.queryBundle || {}),
      transform: form.runningTotal ? { type: 'cumulative' } : null,
    } : object.queryBundle
    // 스펙에 원본 키가 없는 도넛(예: 챗봇이 키 없이 만든 것)은 rows가 name/value 그대로다.
    // 그때는 로컬 재빌드에만 name/value를 키로 쓴다 — 저장되는 querySpec은 건드리지 않아야
    // 서버 재조회(원본 컬럼의 raw rows 기준)와 어긋나지 않는다.
    const buildSpec = targetChartCode === 'pie' && (!querySpec.labelKey || !querySpec.valueKey)
      && nextRows.length && nextRows.every((row) => row && typeof row === 'object' && 'name' in row && 'value' in row)
      ? { ...querySpec, labelKey: 'name', valueKey: 'value' }
      : querySpec
    const builtWidget = sourceIsChart ? buildWidgetPropsFromRows(targetChartCode, nextRows, buildSpec, title) : null
    const runtimeProps = sourceIsChart
      ? builtWidget.props
      : supportsRunningTotal ? propsWithTimeSeriesRows(object.props || {}, nextRows) : (object.props || {})
    const targetBinding = sourceIsChart ? bindingFromQuerySpec(querySpec, runtimeProps, targetChartCode) : null
    const targetColumnMap = sourceIsChart ? columnMapForVisualization(object, nextRows, targetBinding, seriesPresentation, targetSeries) : null
    const dataFilters = { fields: form.dataFilterFields.filter((field) => filterCandidates.some((candidate) => candidate.field === field)) }
    const inferredTargetTableSpec = sourceIsChart && targetIsTable ? inferredTableSpec({
      columns: runtimeProps.columns,
      rows: runtimeProps.rows,
      tableSpec: object.objectSpec?.tableSpec,
      columnMap: targetColumnMap,
    }) : null
    const tableColumns = form.tableColumns.length ? form.tableColumns : (inferredTargetTableSpec?.columns || [])
    const tableSpec = targetIsTable ? {
      ...(inferredTargetTableSpec || object.objectSpec?.tableSpec || {}),
      columns: tableColumns.map((column) => ({
        field: column.field,
        headerName: column.headerName || column.field,
        align: column.align || 'left',
        minWidth: column.minWidth,
        width: column.width,
        maxWidth: column.maxWidth,
        pinned: column.pinned,
        sortable: column.sortable !== false,
        filter: column.filter === true,
        resizable: column.resizable !== false,
        // 2026-08-04 leo: "컬럼 표시" 체크 상태를 그대로 visible에 저장한다. 과거의
        // hidden 반대 의미 저장을 없애 새로고침 뒤에도 설정과 화면이 일치하게 한다.
        visible: column.visible !== false,
        cellRenderer: column.cellRenderer,
        ...(column.format ? { format: column.format } : {}),
        ...(column.progress ? { progress: column.progress } : {}),
        ...(Array.isArray(column.toneRules) ? { toneRules: column.toneRules } : {}),
      })),
      density: form.tableDensity,
      typography: normalizeTableTypography(form.tableTypography),
      showHeader: true,
      stickyHeader: form.tableStickyHeader,
      scroll: {
        ...((inferredTargetTableSpec || object.objectSpec?.tableSpec || {}).scroll || {}),
        x: true,
        y: true,
        stickyHeader: form.tableStickyHeader,
        stickyFirstColumn: form.tableStickyFirstColumn,
      },
      pagination: form.tablePageSize === '0' ? false : { pageSize: Number(form.tablePageSize) },
    } : null
    const nextObjectSpec = !sourceIsChart && isKpiCard ? {
      kpiSpec: normalizeKpiCardSpec(form.kpiSpec),
    } : targetIsTable ? {
      ...(object.objectSpec?.visual ? { visual: object.objectSpec.visual } : {}),
      dataFilters,
      vizSpec: {
        kind: 'table',
        renderer: 'table',
        binding: targetBinding,
        columnMap: targetColumnMap,
        features: {},
        rowCount: nextRows.length,
      },
      tableSpec,
    } : {
      ...(object.objectSpec?.visual ? { visual: object.objectSpec.visual } : {}),
      dataFilters,
      vizSpec: {
        kind: targetChartCode,
        renderer: targetChartCode === 'funnel_pyramid' ? 'custom' : 'echarts',
        binding: targetBinding,
        columnMap: targetColumnMap,
        ...(Array.isArray(object.objectSpec?.vizSpec?.derivations) ? { derivations: object.objectSpec.vizSpec.derivations } : {}),
        features: {
          ...(targetIsChart ? { textSizes: normalizeChartTextSizes(form.chartTextSizes) } : {}),
          ...(targetSupportsLegend ? { legend: form.legend, legendPosition: form.legendPosition, legendLabels } : {}),
          ...(targetSupportsPalette ? { colorPalette: form.colorPalette, customPalette, seriesColors } : {}),
          ...(targetSupportsLabels ? { labels: form.labels ? 'top' : false } : {}),
        },
        ...(targetSupportsAxisFormat ? { axis: { x: { format: form.xAxisFormat } } } : {}),
        ...(targetSupportsSort ? { sort: { direction: form.sortDirection } } : {}),
        rowCount: nextRows.length,
      },
    }
    onSave({
      title,
      ...(sourceIsChart ? {
        chartCode: targetChartCode,
        objectType: targetIsTable ? 'table' : 'chart',
        type: builtWidget.type,
      } : {}),
      querySpec,
      queryBundle,
      props: {
        ...runtimeProps,
        title,
        ...(targetChartCode === 'bar' ? { orientation: form.orientation } : {}),
        ...(targetSupportsStacked ? { stacked: form.stacked } : {}),
        ...(targetChartCode === 'combo' ? {
          bar_keys: barKeys,
          line_keys: lineKeys,
          bar_labels: barKeys.map(labelFor),
          line_labels: lineKeys.map(labelFor),
          secondary_keys: targetSecondaryKeys,
        } : {}),
      },
      objectSpec: nextObjectSpec,
    })
  }

  const availableFormats = temporalGrain ? ['auto', temporalGrain, 'raw'] : ['auto', 'raw']

  return (
    <div className="fixed inset-0 z-[70] flex justify-end bg-black/20">
      <aside className="h-full w-full max-w-sm bg-white shadow-2xl border-l border-gray-200 p-5 overflow-y-auto" onMouseDown={(event) => event.stopPropagation()}>
        <div className="flex items-start justify-between gap-3 mb-6">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-800"><SlidersHorizontal size={16} className="text-blue-600" /> {editorLabel}</div>
            <p className="mt-1 text-xs text-gray-400 truncate">{object.title}</p>
          </div>
          <button type="button" onClick={onClose} title="닫기" className="p-1.5 rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-700"><X size={16} /></button>
        </div>

        <label className="block text-xs font-medium text-gray-600 mb-1.5" htmlFor="dashboard-object-title">제목</label>
        <input id="dashboard-object-title" value={form.title} onChange={(event) => update('title', event.target.value)} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500" />

        {sourceIsChart && chartTypeOptions.length > 1 && (
          <label className="mt-5 flex items-center justify-between gap-4 text-sm text-gray-700">
            <span>차트 종류</span>
            <select value={activeChartCode} onChange={(event) => update('chartCode', event.target.value)} className="min-w-[120px] rounded-md border border-gray-300 bg-white px-2 py-1.5 text-xs">
              {chartTypeOptions.map((code) => <option key={code} value={code}>{CHART_TYPE_LABELS[code] || code}</option>)}
            </select>
          </label>
        )}

        {supportsRunningTotal && (
          <div className="mt-5 border-t border-gray-100 pt-4">
            <label className="flex items-center justify-between gap-4 text-sm text-gray-700">
              <span>{'\uae30\uac04 \ub204\uc801 \ud45c\uc2dc'}</span>
              <input type="checkbox" checked={form.runningTotal} onChange={(event) => update('runningTotal', event.target.checked)} className="h-4 w-4 accent-blue-600" />
            </label>
          </div>
        )}

        {isChart && (
          <div className="mt-6 space-y-4 border-t border-gray-100 pt-5">
            {activeChartCode === 'bar' && (
              <label className="flex items-center justify-between gap-4 text-sm text-gray-700">
                방향
                <select value={form.orientation} onChange={(event) => update('orientation', event.target.value)} className="rounded-md border border-gray-300 px-2 py-1.5 text-xs bg-white">
                  <option value="vertical">세로 막대</option><option value="horizontal">가로 막대</option>
                </select>
              </label>
            )}
            {supportsStacked && <label className="flex items-center justify-between gap-4 text-sm text-gray-700">{activeChartCode === 'combo' ? '막대 누적' : '누적 표시'}<input type="checkbox" checked={form.stacked} onChange={(event) => update('stacked', event.target.checked)} className="h-4 w-4 accent-blue-600" /></label>}
            {supportsSort && (
              <label className="flex items-center justify-between gap-4 text-sm text-gray-700">
                {activeChartCode === 'pie' ? '항목 정렬' : '가로 축 정렬'}
                <select value={form.sortDirection} onChange={(event) => update('sortDirection', event.target.value)} className="rounded-md border border-gray-300 px-2 py-1.5 text-xs bg-white">
                  <option value="asc">오름차순</option><option value="desc">내림차순</option><option value="none">원본 순서</option>
                </select>
              </label>
            )}
            {supportsAxisFormat && (
              <label className="flex items-center justify-between gap-4 text-sm text-gray-700">
                시간 축 형식
                <select value={form.xAxisFormat} onChange={(event) => update('xAxisFormat', event.target.value)} className="rounded-md border border-gray-300 px-2 py-1.5 text-xs bg-white">
                  {availableFormats.map((format) => <option key={format} value={format}>{TIME_FORMAT_LABELS[format]}</option>)}
                </select>
              </label>
            )}
            {supportsLegend && (
              <>
                <label className="flex items-center justify-between gap-4 text-sm text-gray-700">범례 표시<input type="checkbox" checked={form.legend} onChange={(event) => update('legend', event.target.checked)} className="h-4 w-4 accent-blue-600" /></label>
                {form.legend && (
                  <label className="flex items-center justify-between gap-4 text-sm text-gray-700">
                    범례 위치
                    <select value={form.legendPosition} onChange={(event) => update('legendPosition', event.target.value)} className="rounded-md border border-gray-300 px-2 py-1.5 text-xs bg-white">
                      <option value="auto">자동</option><option value="top">위</option><option value="bottom">아래</option><option value="left">왼쪽</option><option value="right">오른쪽</option>
                    </select>
                  </label>
                )}
              </>
            )}
            {supportsLabels && <label className="flex items-center justify-between gap-4 text-sm text-gray-700">값 레이블 표시<input type="checkbox" checked={form.labels} onChange={(event) => update('labels', event.target.checked)} className="h-4 w-4 accent-blue-600" /></label>}
          </div>
        )}

        {isChart && (
          <div className="mt-6 space-y-3 border-t border-gray-100 pt-5">
            <p className="text-xs font-medium text-gray-600">{'\ucc28\ud2b8 \ud14d\uc2a4\ud2b8 \ud06c\uae30'}</p>
            <label className="flex items-center justify-between gap-4 text-sm text-gray-700">
              <span>{'\uc81c\ubaa9'}</span>
              <span className="flex items-center gap-1"><input type="number" min="10" max="28" value={form.chartTextSizes.title} onChange={(event) => updateChartTextSize('title', Number(event.target.value))} className="w-16 rounded-md border border-gray-300 px-2 py-1.5 text-right text-xs" /><span className="text-xs text-gray-400">px</span></span>
            </label>
            <label className="flex items-center justify-between gap-4 text-sm text-gray-700">
              <span>{'\ucd95 \ub208\uae08'}</span>
              <span className="flex items-center gap-1"><input type="number" min="8" max="24" value={form.chartTextSizes.axis} onChange={(event) => updateChartTextSize('axis', Number(event.target.value))} className="w-16 rounded-md border border-gray-300 px-2 py-1.5 text-right text-xs" /><span className="text-xs text-gray-400">px</span></span>
            </label>
            <label className="flex items-center justify-between gap-4 text-sm text-gray-700">
              <span>{'\ubc94\ub840'}</span>
              <span className="flex items-center gap-1"><input type="number" min="8" max="24" value={form.chartTextSizes.legend} onChange={(event) => updateChartTextSize('legend', Number(event.target.value))} className="w-16 rounded-md border border-gray-300 px-2 py-1.5 text-right text-xs" /><span className="text-xs text-gray-400">px</span></span>
            </label>
            <label className="flex items-center justify-between gap-4 text-sm text-gray-700">
              <span>{'\uac12 \ub808\uc774\ube14'}</span>
              <span className="flex items-center gap-1"><input type="number" min="8" max="24" value={form.chartTextSizes.label} onChange={(event) => updateChartTextSize('label', Number(event.target.value))} className="w-16 rounded-md border border-gray-300 px-2 py-1.5 text-right text-xs" /><span className="text-xs text-gray-400">px</span></span>
            </label>
          </div>
        )}

        {isKpiCard && (
          <div className="mt-6 space-y-5 border-t border-gray-100 pt-5">
            <div className="space-y-3">
              <p className="text-xs font-medium text-gray-600">{'\uce74\ub4dc \ubc30\uce58'}</p>
              <label className="flex items-center justify-between gap-4 text-sm text-gray-700">
                <span>{'\uac00\ub85c \uc815\ub82c'}</span>
                <select value={form.kpiSpec.align} onChange={(event) => updateKpiSpec(null, 'align', event.target.value)} className="rounded-md border border-gray-300 bg-white px-2 py-1.5 text-xs">
                  <option value="left">{'\uc67c\ucabd'}</option><option value="center">{'\uac00\uc6b4\ub370'}</option><option value="right">{'\uc624\ub978\ucabd'}</option>
                </select>
              </label>
              <label className="flex items-center justify-between gap-4 text-sm text-gray-700">
                <span>{'\uc138\ub85c \uc815\ub82c'}</span>
                <select value={form.kpiSpec.verticalAlign} onChange={(event) => updateKpiSpec(null, 'verticalAlign', event.target.value)} className="rounded-md border border-gray-300 bg-white px-2 py-1.5 text-xs">
                  <option value="top">{'\uc704'}</option><option value="center">{'\uac00\uc6b4\ub370'}</option><option value="bottom">{'\uc544\ub798'}</option>
                </select>
              </label>
              <label className="flex items-center justify-between gap-4 text-sm text-gray-700">
                <span>{'\ub0b4\ubd80 \uc5ec\ubc31'}</span>
                <select value={form.kpiSpec.padding} onChange={(event) => updateKpiSpec(null, 'padding', event.target.value)} className="rounded-md border border-gray-300 bg-white px-2 py-1.5 text-xs">
                  <option value="compact">{'\uc791\uac8c'}</option><option value="comfortable">{'\ubcf4\ud1b5'}</option><option value="spacious">{'\ub113\uac8c'}</option>
                </select>
              </label>
              {kpiSummaryItems.length > 0 && (
                <label className="flex items-center justify-between gap-4 text-sm text-gray-700">
                  <span>{'\uac15\uc870\uc120 \uc0c9\uc0c1'}</span>
                  <input type="color" value={form.kpiSpec.accentColor} onChange={(event) => updateKpiSpec(null, 'accentColor', event.target.value.toUpperCase())} title={'\uac15\uc870\uc120 \uc0c9\uc0c1'} className="h-7 w-9 cursor-pointer rounded border border-gray-300 bg-white p-0.5" />
                </label>
              )}
            </div>

            <div className="space-y-3 border-t border-gray-100 pt-5">
              <p className="text-xs font-medium text-gray-600">{'\uc81c\ubaa9 \uc11c\uc2dd'}</p>
              <label className="flex items-center justify-between gap-4 text-sm text-gray-700">
                <span>{'\ud06c\uae30'}</span>
                <span className="flex items-center gap-1"><input type="number" min="10" max="36" value={form.kpiSpec.title.fontSize} onChange={(event) => updateKpiSpec('title', 'fontSize', Number(event.target.value))} className="w-16 rounded-md border border-gray-300 px-2 py-1.5 text-right text-xs" /><span className="text-xs text-gray-400">px</span></span>
              </label>
              <label className="flex items-center justify-between gap-4 text-sm text-gray-700">
                <span>{'\uad75\uac8c'}</span>
                <input type="checkbox" checked={form.kpiSpec.title.bold} onChange={(event) => updateKpiSpec('title', 'bold', event.target.checked)} className="h-4 w-4 accent-blue-600" />
              </label>
              <label className="flex items-center justify-between gap-4 text-sm text-gray-700">
                <span>{'\uc0c9\uc0c1'}</span>
                <input type="color" value={form.kpiSpec.title.color} onChange={(event) => updateKpiSpec('title', 'color', event.target.value.toUpperCase())} title={'\uc81c\ubaa9 \uc0c9\uc0c1'} className="h-7 w-9 cursor-pointer rounded border border-gray-300 bg-white p-0.5" />
              </label>
            </div>

            <div className="space-y-3 border-t border-gray-100 pt-5">
              <p className="text-xs font-medium text-gray-600">{'\ub370\uc774\ud130 \uac12 \uc11c\uc2dd'}</p>
              <label className="flex items-center justify-between gap-4 text-sm text-gray-700">
                <span>{'\ud06c\uae30'}</span>
                <span className="flex items-center gap-1"><input type="number" min="12" max="64" value={form.kpiSpec.value.fontSize} onChange={(event) => updateKpiSpec('value', 'fontSize', Number(event.target.value))} className="w-16 rounded-md border border-gray-300 px-2 py-1.5 text-right text-xs" /><span className="text-xs text-gray-400">px</span></span>
              </label>
              <label className="flex items-center justify-between gap-4 text-sm text-gray-700">
                <span>{'\uad75\uac8c'}</span>
                <input type="checkbox" checked={form.kpiSpec.value.bold} onChange={(event) => updateKpiSpec('value', 'bold', event.target.checked)} className="h-4 w-4 accent-blue-600" />
              </label>
              <label className="flex items-center justify-between gap-4 text-sm text-gray-700">
                <span>{'\uc0c9\uc0c1'}</span>
                <input type="color" value={form.kpiSpec.value.color} onChange={(event) => updateKpiSpec('value', 'color', event.target.value.toUpperCase())} title={'\ub370\uc774\ud130 \uac12 \uc0c9\uc0c1'} className="h-7 w-9 cursor-pointer rounded border border-gray-300 bg-white p-0.5" />
              </label>
            </div>

            {kpiSummaryItems.length > 0 && (
              <div className="space-y-5 border-t border-gray-100 pt-5">
                <p className="text-xs font-medium text-gray-600">{'\uc694\uc57d \ud56d\ubaa9\ubcc4 \uc11c\uc2dd'}</p>
                {kpiSummaryItems.map((item) => {
                  const style = summaryItemStyleFor(form.kpiSpec, item.key, item.role)
                  return (
                    <section key={item.key} className="space-y-3 border-t border-gray-100 pt-4">
                      <p className="truncate text-sm font-semibold text-gray-800" title={item.label}>{item.label}</p>
                      <label className="flex items-center justify-between gap-4 text-sm text-gray-700">
                        <span>{'\uac00\ub85c \uc815\ub82c'}</span>
                        <select value={style.align} onChange={(event) => updateKpiSummaryItem(item, null, 'align', event.target.value)} className="rounded-md border border-gray-300 bg-white px-2 py-1.5 text-xs">
                          <option value="left">{'\uc67c\ucabd'}</option><option value="center">{'\uac00\uc6b4\ub370'}</option><option value="right">{'\uc624\ub978\ucabd'}</option>
                        </select>
                      </label>
                      <KpiTextStyleControls label={item.role === 'primary' ? '\ub300\ud45c \uc9c0\ud45c' : '\uc0c1\uc138 \uc9c0\ud45c'} style={style} onChange={(section, key, value) => updateKpiSummaryItem(item, section, key, value)} />
                    </section>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {isTable && (
          <>
            <div className="mt-6 space-y-4 border-t border-gray-100 pt-5">
              <label className="flex items-center justify-between gap-4 text-sm text-gray-700">
                표 밀도
                <select value={form.tableDensity} onChange={(event) => update('tableDensity', event.target.value)} className="rounded-md border border-gray-300 bg-white px-2 py-1.5 text-xs">
                  <option value="compact">촘촘하게</option><option value="comfortable">보통</option><option value="spacious">여유 있게</option>
                </select>
              </label>
              <label className="flex items-center justify-between gap-4 text-sm text-gray-700">
                페이지 행 수
                <select value={form.tablePageSize} onChange={(event) => update('tablePageSize', event.target.value)} className="rounded-md border border-gray-300 bg-white px-2 py-1.5 text-xs">
                  <option value="0">전체</option><option value="10">10행</option><option value="20">20행</option><option value="50">50행</option>
                </select>
              </label>
              <label className="flex items-center justify-between gap-4 text-sm text-gray-700">헤더 고정<input type="checkbox" checked={form.tableStickyHeader} onChange={(event) => update('tableStickyHeader', event.target.checked)} className="h-4 w-4 accent-blue-600" /></label>
              <label className="flex items-center justify-between gap-4 text-sm text-gray-700">첫 열 고정<input type="checkbox" checked={form.tableStickyFirstColumn} onChange={(event) => update('tableStickyFirstColumn', event.target.checked)} className="h-4 w-4 accent-blue-600" /></label>
            </div>
            {form.tableColumns.length > 0 && (
              <div className="mt-6 border-t border-gray-100 pt-5">
                <p className="mb-3 text-xs font-medium text-gray-600">컬럼 표시</p>
                <div className="space-y-2.5">
                  {form.tableColumns.map((column) => (
                    <div key={column.field} className="grid grid-cols-[minmax(0,1fr)_76px_86px_18px] items-center gap-2">
                      <input value={column.headerName || column.field} onChange={(event) => updateTableColumn(column.field, { headerName: event.target.value })} aria-label={`${column.field} \uC5F4 \uC774\uB984`} className="min-w-0 rounded-md border border-gray-300 px-1.5 py-1.5 text-xs text-gray-700" />
                      <select value={column.align || 'left'} onChange={(event) => updateTableColumn(column.field, { align: event.target.value })} aria-label={`${column.headerName} 정렬`} className="min-w-0 rounded-md border border-gray-300 bg-white px-1.5 py-1.5 text-xs">
                        <option value="left">왼쪽</option><option value="center">가운데</option><option value="right">오른쪽</option>
                      </select>
                      <select value={column.cellRenderer || 'text'} onChange={(event) => updateTableColumn(column.field, { cellRenderer: event.target.value })} aria-label={`${column.headerName} 표시 형식`} className="min-w-0 rounded-md border border-gray-300 bg-white px-1.5 py-1.5 text-xs">
                        <option value="text">텍스트</option><option value="number">숫자</option><option value="percent">퍼센트</option><option value="status-badge">상태</option><option value="progress-bar">{'\uc9c4\ud589\ub960 \ub9c9\ub300'}</option><option value="trend">증감</option><option value="date">날짜</option>
                      </select>
                      <input type="checkbox" checked={column.visible !== false} onChange={(event) => updateTableColumn(column.field, { visible: event.target.checked })} aria-label={`${column.headerName} 표시`} title="표시" className="h-4 w-4 accent-blue-600" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {isTable && (
          <div className="mt-6 space-y-3 border-t border-gray-100 pt-5">
            <p className="text-xs font-medium text-gray-600">{'\ud45c \ud14d\uc2a4\ud2b8 \ud06c\uae30'}</p>
            <label className="flex items-center justify-between gap-4 text-sm text-gray-700">
              <span>{'\uc81c\ubaa9'}</span>
              <span className="flex items-center gap-1"><input type="number" min="10" max="28" value={form.tableTypography.titleFontSize} onChange={(event) => updateTableTypography('titleFontSize', Number(event.target.value))} className="w-16 rounded-md border border-gray-300 px-2 py-1.5 text-right text-xs" /><span className="text-xs text-gray-400">px</span></span>
            </label>
            <label className="flex items-center justify-between gap-4 text-sm text-gray-700">
              <span>{'\ud5e4\ub354'}</span>
              <span className="flex items-center gap-1"><input type="number" min="9" max="24" value={form.tableTypography.headerFontSize} onChange={(event) => updateTableTypography('headerFontSize', Number(event.target.value))} className="w-16 rounded-md border border-gray-300 px-2 py-1.5 text-right text-xs" /><span className="text-xs text-gray-400">px</span></span>
            </label>
            <label className="flex items-center justify-between gap-4 text-sm text-gray-700">
              <span>{'\ubcf8\ubb38'}</span>
              <span className="flex items-center gap-1"><input type="number" min="9" max="24" value={form.tableTypography.bodyFontSize} onChange={(event) => updateTableTypography('bodyFontSize', Number(event.target.value))} className="w-16 rounded-md border border-gray-300 px-2 py-1.5 text-right text-xs" /><span className="text-xs text-gray-400">px</span></span>
            </label>
          </div>
        )}

        {(isChart || isTable) && filterCandidates.length > 0 && (
          <div className="mt-6 border-t border-gray-100 pt-5">
            <p className="mb-3 text-xs font-medium text-gray-600">객체 필터</p>
            <div className="space-y-2.5">
              {filterCandidates.map((candidate) => (
                <label key={candidate.field} className="flex items-center justify-between gap-3 text-sm text-gray-700">
                  <span className="min-w-0 truncate" title={candidate.label}>{candidate.label}</span>
                  <input type="checkbox" checked={form.dataFilterFields.includes(candidate.field)} onChange={(event) => updateDataFilterField(candidate.field, event.target.checked)} aria-label={`${candidate.label} 객체 필터`} className="h-4 w-4 shrink-0 accent-blue-600" />
                </label>
              ))}
            </div>
          </div>
        )}

        {activeChartCode === 'combo' && series.length > 0 && (
          <div className="mt-6 border-t border-gray-100 pt-5">
            <p className="mb-3 text-xs font-medium text-gray-600">계열 표시 방식</p>
            <div className="space-y-2.5">
              {series.map((entry) => (
                <div key={entry.key} className="grid grid-cols-[minmax(0,1fr)_72px_72px] items-center gap-2">
                  <span className="truncate text-xs text-gray-500" title={entry.label}>{entry.label}</span>
                  <select value={form.seriesPresentation[entry.key]?.type || 'bar'} onChange={(event) => updateSeriesPresentation(entry.key, { type: event.target.value })} aria-label={`${entry.label} 표시 방식`} className="min-w-0 rounded-md border border-gray-300 px-1.5 py-1.5 text-xs bg-white">
                    <option value="bar">막대</option><option value="line">선</option>
                  </select>
                  <select value={form.seriesPresentation[entry.key]?.axis || 'left'} onChange={(event) => updateSeriesPresentation(entry.key, { axis: event.target.value })} aria-label={`${entry.label} 축`} className="min-w-0 rounded-md border border-gray-300 px-1.5 py-1.5 text-xs bg-white">
                    <option value="left">왼쪽 축</option><option value="right">오른쪽 축</option>
                  </select>
                </div>
              ))}
            </div>
          </div>
        )}

        {supportsPalette && series.length > 0 && (
          <div className="mt-6 border-t border-gray-100 pt-5">
            <p className="text-xs font-medium text-gray-600 mb-3">{'\uceec\ub7ec \ud314\ub808\ud2b8'}</p>
            <div className="flex items-center gap-2">
              <select value={form.colorPalette} onChange={(event) => updatePalette(event.target.value)} className="min-w-0 flex-1 rounded-md border border-gray-300 bg-white px-2.5 py-2 text-sm text-gray-700">
                {CHART_COLOR_PALETTES.map((palette) => <option key={palette.id} value={palette.id}>{palette.label}</option>)}
              </select>
              <span className="flex shrink-0" aria-label={`${selectedPalette.label} 색상`}>
                {selectedPalette.colors.slice(0, 5).map((color) => <span key={color} className="-ml-1 first:ml-0 h-4 w-4 rounded-full border-2 border-white" style={{ backgroundColor: color }} />)}
              </span>
            </div>
            {form.colorPalette === 'custom' && (
              <div className="mt-4 space-y-3 rounded-md border border-gray-200 bg-gray-50 p-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-medium text-gray-600">{'\uc0ac\uc6a9\uc790 \uc9c0\uc815 \ud314\ub808\ud2b8'}</span>
                  <label className="flex items-center gap-2 text-xs text-gray-500">
                    {'\uac1d\uccb4 \ubc30\uacbd'}
                    <input type="color" value={form.customPalette.backgroundColor} onChange={(event) => updateCustomPaletteBackground(event.target.value)} title={'\uac1d\uccb4 \ubc30\uacbd \uc0c9\uc0c1'} className="h-7 w-9 cursor-pointer rounded border border-gray-300 bg-white p-0.5" />
                  </label>
                </div>
                <div className="mt-3 space-y-2">
                  {series.map((entry, index) => {
                    const currentColor = seriesColorFor(entry.key, index, { palette: 'custom', customPalette: form.customPalette, overrides: form.seriesColors })
                    const overridden = Boolean(form.seriesColors[entry.key])
                    return (
                      <div key={entry.key} className="flex min-w-0 items-center gap-2">
                        <span className="min-w-0 flex-1 truncate text-xs text-gray-500" title={entry.label}>{entry.label}</span>
                        <input type="color" value={currentColor} onChange={(event) => updateSeriesColor(entry.key, event.target.value)} title={`${entry.label} ${'\uc0c9\uc0c1'}`} className="h-7 w-9 cursor-pointer rounded border border-gray-300 bg-white p-0.5" />
                        <button type="button" onClick={() => resetSeriesColor(entry.key)} disabled={!overridden} title={'\uae30\ubcf8 \uc0c9\uc0c1\uc73c\ub85c \ub3cc\ub9ac\uae30'} className="flex h-7 w-7 items-center justify-center rounded border border-gray-200 text-gray-400 hover:bg-gray-50 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-30"><RotateCcw size={13} /></button>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {supportsLegend && series.length > 0 && (
          <div className="mt-6 border-t border-gray-100 pt-5">
            <p className="text-xs font-medium text-gray-600 mb-3">범례 이름</p>
            <div className="space-y-2">
              {series.map((entry) => (
                <label key={entry.key} className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-2 items-center text-xs">
                  <span className="truncate text-gray-400" title={entry.label}>{entry.label}</span>
                  <input value={form.legendLabels[entry.key] ?? ''} onChange={(event) => updateLegendLabel(entry.key, event.target.value)} placeholder={entry.label} className="min-w-0 rounded-md border border-gray-300 px-2 py-1.5 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </label>
              ))}
            </div>
          </div>
        )}

        <div className="mt-8 flex gap-2"><button type="button" onClick={onClose} className="flex-1 rounded-md border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50">취소</button><button type="button" onClick={save} disabled={!form.title.trim()} className="flex-1 rounded-md bg-[#1e3a5f] px-3 py-2 text-sm font-medium text-white hover:bg-[#2d547a] disabled:opacity-40">적용</button></div>
      </aside>
    </div>
  )
}
