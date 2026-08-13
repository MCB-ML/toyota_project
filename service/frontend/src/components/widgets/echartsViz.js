import { chartPaletteBackground, chartPaletteColors, DEFAULT_CHART_COLOR_PALETTE, seriesColorFor } from '../../utils/chartColors.js'
import { formatDashboardValue } from '../../utils/dashboardObject.js'
import { normalizeChartTextSizes } from '../../utils/dashboardTypography.js'
import { formatTemporalAxisValue, sortChartData, truncateLabel, valueAxisDomain, xAxisPresentation } from './axisFormat.js'

const CHART_CODE_BY_WIDGET_TYPE = {
  render_bar_chart: 'bar',
  render_line_chart: 'line',
  render_area_chart: 'area',
  render_pie_chart: 'pie',
  render_scatter_chart: 'scatter',
  render_radar_chart: 'radar',
  render_funnel_chart: 'funnel',
  render_combo_chart: 'combo',
}

const CARTESIAN_KINDS = new Set(['bar', 'line', 'area', 'combo'])

function plainObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {}
}

function nonEmptyArray(...values) {
  return values.find((value) => Array.isArray(value) && value.length) || []
}

function unique(values) {
  return [...new Set(values.filter(Boolean))]
}

function displayLabel(field, labels, aliases, columnMap) {
  return aliases[field] || columnMap[field]?.label || labels[field] || field
}

function labelsByField(props, binding, aliases, columnMap) {
  const labels = {}
  const assign = (keys, values) => (keys || []).forEach((field, index) => {
    if (field) labels[field] = values?.[index] || labels[field] || field
  })
  assign(binding.series, binding.yLabels)
  assign(props.y_keys, props.y_labels)
  assign(props.bar_keys, props.bar_labels)
  assign(props.line_keys, props.line_labels)
  if (props.y_key) labels[props.y_key] = props.y_label || props.y_key
  return labels
}

function isRateField(field, label) {
  return /rate|ratio|achievement|percent|\uB2EC\uC131\uB960|\uBE44\uC728|%/i.test(`${field} ${label}`)
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function numeric(value) {
  const parsed = typeof value === 'number' ? value : Number(String(value ?? '').replaceAll(',', ''))
  return Number.isFinite(parsed) ? parsed : null
}

function valueFormatter(value, rate = false) {
  return formatDashboardValue(value, rate ? { percent: true, decimals: 0 } : {})
}

function axisBound(which) {
  return ({ min, max }) => valueAxisDomain[which === 'min' ? 0 : 1](which === 'min' ? min : max)
}

function resolveLegendPosition(features, seriesCount, kind) {
  const requested = features.legendPosition || 'auto'
  if (requested === 'hidden' || features.legend === false) return 'hidden'
  if (features.legend !== true && seriesCount <= 1 && kind !== 'pie') return 'hidden'
  if (requested !== 'auto') return requested
  return seriesCount >= 5 ? 'bottom' : 'bottom'
}

function responsiveTextSize(size, compact, minimum = 8) {
  return compact ? Math.max(minimum, size - 1) : size
}

function legendOption(position, names, viewport, configuredTextSizes) {
  if (position === 'hidden' || !names.length) return { show: false }
  const compact = viewport.width > 0 && viewport.width < 440
  const textSizes = normalizeChartTextSizes(configuredTextSizes)
  const fontSize = responsiveTextSize(textSizes.legend, compact)
  const itemSize = Math.max(9, Math.min(14, fontSize))
  const common = {
    show: true,
    type: names.length > 5 ? 'scroll' : 'plain',
    data: names,
    itemWidth: itemSize,
    itemHeight: itemSize,
    itemGap: compact ? Math.max(7, fontSize - 2) : Math.max(9, fontSize + 1),
    textStyle: { color: '#475569', fontSize },
    tooltip: { show: true },
  }
  if (position === 'top') return { ...common, top: 4, left: 'center' }
  if (position === 'left') return { ...common, left: 4, top: 'middle', orient: 'vertical' }
  if (position === 'right') return { ...common, right: 4, top: 'middle', orient: 'vertical' }
  return { ...common, bottom: 2, left: 'center' }
}

function gridFor(position, axisHeight, hasRightAxis, viewport, hasDataZoom = false) {
  const sideLegend = position === 'left' || position === 'right'
  const extraBottom = hasDataZoom ? (position === 'bottom' ? 46 : 24) : 0
  return {
    left: sideLegend && position === 'left' ? 104 : 58,
    right: sideLegend && position === 'right' ? 110 : (hasRightAxis ? 64 : 22),
    top: position === 'top' ? 42 : 16,
    // The axis height already includes the rotated tick labels. Keep only a
    // narrow legend gutter below it so chart cards use their full height.
    bottom: Math.max(axisHeight + (position === 'bottom' ? 12 : 6) + extraBottom, viewport.height < 190 ? 46 : 48),
    containLabel: true,
  }
}

function zoomOption(legendPosition, horizontal = false) {
  const bottom = legendPosition === 'bottom' ? 24 : 2
  const axisIndex = horizontal ? { yAxisIndex: 0 } : { xAxisIndex: 0 }
  return [
    {
      type: 'inside',
      ...axisIndex,
      filterMode: 'filter',
      zoomOnMouseWheel: true,
      moveOnMouseWheel: false,
      moveOnMouseMove: true,
      preventDefaultMouseMove: false,
    },
    {
      type: 'slider',
      ...axisIndex,
      start: 0,
      end: 100,
      height: 8,
      bottom,
      showDetail: false,
      brushSelect: false,
      borderColor: 'transparent',
      backgroundColor: '#E2E8F0',
      fillerColor: 'rgba(37, 99, 235, 0.28)',
      dataBackground: {
        lineStyle: { color: '#CBD5E1', width: 1 },
        areaStyle: { color: 'rgba(203, 213, 225, 0.32)' },
      },
      selectedDataBackground: {
        lineStyle: { color: '#93C5FD', width: 1 },
        areaStyle: { color: 'rgba(147, 197, 253, 0.26)' },
      },
      handleSize: 12,
      handleStyle: { color: '#64748B', borderColor: '#64748B' },
      moveHandleSize: 0,
    },
  ]
}

function runtimeSpec(name, inputProps, inputObjectSpec) {
  const props = plainObject(inputProps)
  const objectSpec = plainObject(inputObjectSpec)
  const vizSpec = plainObject(objectSpec.vizSpec)
  const binding = plainObject(vizSpec.binding)
  const features = plainObject(vizSpec.features)
  const columnMap = plainObject(vizSpec.columnMap)
  const aliases = plainObject(features.legendLabels)
  const kind = vizSpec.kind || CHART_CODE_BY_WIDGET_TYPE[name] || 'bar'
  const rows = Array.isArray(props.data) ? props.data : []
  const labels = labelsByField(props, binding, aliases, columnMap)
  const usesNormalizedPieRows = kind === 'pie' && rows.some((row) => row?.name !== undefined || row?.value !== undefined)
  const x = usesNormalizedPieRows ? 'name' : (binding.x || props.x_key || props.label_key || (kind === 'pie' ? 'name' : null))
  const y = usesNormalizedPieRows ? 'value' : (binding.y || props.y_key || props.value_key || (kind === 'pie' ? 'value' : null))
  const declaredSeries = nonEmptyArray(binding.series, props.y_keys, [
    ...nonEmptyArray(props.bar_keys),
    ...nonEmptyArray(props.line_keys),
  ])
  const series = unique(declaredSeries.length ? declaredSeries : (y ? [y] : []))
  const lineKeys = new Set(nonEmptyArray(props.line_keys, binding.lineKeys))
  const barKeys = new Set(nonEmptyArray(props.bar_keys, binding.barKeys))
  const secondaryKeys = new Set(nonEmptyArray(props.secondary_keys, binding.secondaryKeys))
  const presentation = series.map((field) => {
    const column = plainObject(columnMap[field])
    const seriesMeta = plainObject(column.series)
    const label = displayLabel(field, labels, aliases, columnMap)
    // Per-column series types are meaningful only for a combo chart. Older
    // objects can retain a stale columnMap type after a chart-type change, so
    // a regular bar/line/area chart must follow its current chartCode.
    const type = kind === 'combo'
      ? (seriesMeta.type || (lineKeys.has(field) ? 'line' : 'bar'))
      : (kind === 'area' ? 'area' : kind === 'line' ? 'line' : 'bar')
    const axis = seriesMeta.axis || (secondaryKeys.has(field) || (kind === 'combo' && isRateField(field, label)) ? 'right' : 'left')
    return { field, label, type, axis }
  })
  return {
    kind,
    props,
    rows,
    x,
    y,
    groupBy: binding.groupBy || props.series_key,
    series: presentation,
    features: {
      legend: features.legend,
      legendPosition: features.legendPosition || 'auto',
      labels: features.labels === true || features.labels === 'top',
      tooltip: features.tooltip !== false,
      stacked: binding.stacked ?? props.stacked ?? kind === 'area',
      orientation: binding.orientation || props.orientation || 'vertical',
      colorPalette: features.colorPalette || DEFAULT_CHART_COLOR_PALETTE,
      customPalette: plainObject(features.customPalette),
      seriesColors: plainObject(features.seriesColors),
      textSizes: normalizeChartTextSizes(features.textSizes),
      smooth: features.smooth !== false,
    },
    axis: plainObject(vizSpec.axis),
    sortDirection: plainObject(vizSpec.sort).direction || props.sort_direction || 'asc',
    aliases,
    columnMap,
  }
}

function applyDisplayTransforms(rows, transforms) {
  let next = Array.isArray(rows) ? rows.map((row) => ({ ...row })) : []
  for (const transform of Array.isArray(transforms) ? transforms : []) {
    if (!transform || typeof transform !== 'object' || !transform.field) continue
    const field = transform.field
    const target = transform.as || `${field}_${transform.type}`
    if (transform.type === 'cumulativeSum' || transform.type === 'runningTotal') {
      let total = 0
      next = next.map((row) => {
        total += numeric(row[field]) || 0
        return { ...row, [target]: total }
      })
    }
    if (transform.type === 'percentOfTotal') {
      const total = next.reduce((sum, row) => sum + (numeric(row[field]) || 0), 0)
      next = next.map((row) => ({ ...row, [target]: total ? (numeric(row[field]) || 0) / total : 0 }))
    }
    if (transform.type === 'movingAverage') {
      const windowSize = Math.max(1, Math.floor(Number(transform.windowSize) || 3))
      next = next.map((row, index) => {
        const values = next.slice(Math.max(0, index - windowSize + 1), index + 1).map((item) => numeric(item[field])).filter((value) => value !== null)
        return { ...row, [target]: values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null }
      })
    }
  }
  return next
}

function cartesianOption(spec, viewport) {
  const rows = applyDisplayTransforms(spec.rows, spec.transforms)
  const xPresentation = xAxisPresentation(rows, spec.x, { format: spec.axis?.x?.format || 'auto', sortDirection: spec.sortDirection })
  const hasRightAxis = spec.series.some((series) => series.axis === 'right')
  const legendPosition = resolveLegendPosition(spec.features, spec.series.length, spec.kind)
  const seriesNames = spec.series.map((series) => series.label)
  const categoryCount = xPresentation.data.length
  const horizontal = spec.kind === 'bar' && spec.features.orientation === 'horizontal'
  const hasDataZoom = categoryCount > 28
  const compact = viewport.width > 0 && viewport.width < 440
  const axisFontSize = responsiveTextSize(spec.features.textSizes.axis, compact)
  const labelFontSize = responsiveTextSize(spec.features.textSizes.label, compact)
  const visibleBarCount = Math.max(1, spec.series.filter((series) => series.type !== 'line' && series.type !== 'area').length)
  const plotWidth = Math.max(220, (Number(viewport.width) || 720) - (hasRightAxis ? 128 : 84))
  const categoryExtent = horizontal
    ? Math.max(160, (Number(viewport.height) || 320) - 56)
    : plotWidth
  const barMaxWidth = Math.max(7, Math.min(compact ? 18 : 24, Math.floor((categoryExtent / Math.max(categoryCount, 1)) * 0.58 / visibleBarCount)))
  const labelInterval = categoryCount > 18 ? Math.max(1, Math.ceil(categoryCount / 12) - 1) : 0
  const categories = xPresentation.data.map((row) => formatTemporalAxisValue(row?.[spec.x], spec.axis?.x?.format || 'auto', xPresentation.grain))
  const optionSeries = spec.series.map((series, index) => {
    const color = seriesColorFor(series.field, index, { palette: spec.features.colorPalette, customPalette: spec.features.customPalette, overrides: spec.features.seriesColors })
    const isArea = series.type === 'area'
    const isLine = series.type === 'line' || isArea
    const isRate = series.axis === 'right' || isRateField(series.field, series.label)
    return {
      name: series.label,
      type: isLine ? 'line' : 'bar',
      ...(horizontal
        ? { xAxisIndex: series.axis === 'right' ? 1 : 0 }
        : { yAxisIndex: series.axis === 'right' ? 1 : 0 }),
      data: xPresentation.data.map((row) => numeric(row?.[series.field])),
      smooth: isLine ? spec.features.smooth : undefined,
      connectNulls: isLine,
      showSymbol: isLine ? xPresentation.data.length <= 60 : undefined,
      symbolSize: compact ? 5 : 7,
      barMaxWidth,
      barGap: '18%',
      stack: spec.features.stacked && !isRate ? `axis-${series.axis}` : undefined,
      itemStyle: { color, borderRadius: isLine ? undefined : (horizontal ? [0, 4, 4, 0] : [4, 4, 0, 0]) },
      lineStyle: isLine ? { color, width: compact ? 2 : 2.5 } : undefined,
      areaStyle: isArea ? { color, opacity: 0.24 } : undefined,
      label: spec.features.labels ? {
        show: true,
        position: isLine ? 'top' : (horizontal ? 'right' : 'top'),
        color: '#475569',
        fontSize: labelFontSize,
        formatter: ({ value }) => valueFormatter(value, isRate),
      } : { show: false },
      emphasis: { focus: 'series' },
    }
  })
  const tooltip = spec.features.tooltip ? {
    show: true,
    trigger: 'axis',
    axisPointer: { type: spec.kind === 'bar' ? 'shadow' : 'cross' },
    appendToBody: true,
    formatter: (params) => {
      const points = Array.isArray(params) ? params : [params]
      const title = escapeHtml(points[0]?.axisValueLabel || points[0]?.axisValue || '')
      const values = points.map((point) => {
        const series = spec.series.find((item) => item.label === point.seriesName)
        const rate = series?.axis === 'right' || isRateField(series?.field, series?.label)
        return `<div style="display:flex;justify-content:space-between;gap:16px">${point.marker || ''}<span>${escapeHtml(point.seriesName)}</span><b>${escapeHtml(valueFormatter(point.value, rate))}</b></div>`
      }).join('')
      return `<div style="min-width:130px"><strong>${title}</strong>${values}</div>`
    },
  } : { show: false }
  const categoryAxis = {
    type: 'category',
    data: categories,
    boundaryGap: spec.kind === 'line' || spec.kind === 'area' ? false : true,
    axisLine: { lineStyle: { color: '#94A3B8' } },
    axisTick: { alignWithLabel: true },
    ...(horizontal ? { inverse: true } : {}),
    axisLabel: {
      color: '#64748B',
      fontSize: axisFontSize,
      rotate: horizontal ? 0 : 35,
      margin: 12,
      interval: labelInterval,
      hideOverlap: true,
      formatter: (value) => truncateLabel(value, horizontal ? 16 : (xPresentation.grain ? 10 : 12)),
    },
  }
  const valueAxes = [
    {
      type: 'value',
      min: axisBound('min'),
      max: axisBound('max'),
      splitLine: { lineStyle: { type: 'dashed', color: '#E5E7EB' } },
      axisLabel: { color: '#64748B', fontSize: axisFontSize, formatter: (value) => valueFormatter(value) },
    },
    ...(hasRightAxis ? [{
      type: 'value',
      min: axisBound('min'),
      max: axisBound('max'),
      position: horizontal ? 'top' : 'right',
      splitLine: { show: false },
      axisLabel: { color: '#64748B', fontSize: axisFontSize, formatter: (value) => valueFormatter(value, true) },
    }] : []),
  ]
  return {
    option: {
      animationDuration: 260,
      color: chartPaletteColors(spec.features.colorPalette, spec.features.customPalette),
      backgroundColor: chartPaletteBackground(spec.features.colorPalette, spec.features.customPalette),
      grid: gridFor(legendPosition, horizontal ? 0 : xPresentation.axisHeight, hasRightAxis, viewport, hasDataZoom),
      legend: legendOption(legendPosition, seriesNames, viewport, spec.features.textSizes),
      tooltip,
      ...(hasDataZoom ? { dataZoom: zoomOption(legendPosition, horizontal) } : {}),
      xAxis: horizontal ? valueAxes : categoryAxis,
      yAxis: horizontal ? categoryAxis : valueAxes,
      series: optionSeries,
    },
    bottomPadding: horizontal ? 0 : xPresentation.bottomPadding,
    scrollWidth: null,
  }
}

function pieOption(spec, viewport) {
  const rows = sortChartData(spec.rows, spec.x, spec.sortDirection)
  const legendPosition = resolveLegendPosition(spec.features, rows.length, spec.kind)
  const compact = viewport.width > 0 && viewport.width < 440
  const labelFontSize = responsiveTextSize(spec.features.textSizes.label, compact)
  const data = rows.map((row, index) => {
    const name = String(row?.[spec.x] ?? row?.name ?? '')
    return {
      name: spec.aliases[name] || name,
      value: numeric(row?.[spec.y] ?? row?.value) || 0,
      itemStyle: { color: seriesColorFor(name, index, { palette: spec.features.colorPalette, customPalette: spec.features.customPalette, overrides: spec.features.seriesColors }) },
    }
  })
  return {
    option: {
      animationDuration: 260,
      backgroundColor: chartPaletteBackground(spec.features.colorPalette, spec.features.customPalette),
      tooltip: spec.features.tooltip ? { trigger: 'item', valueFormatter: (value) => valueFormatter(value) } : { show: false },
      legend: legendOption(legendPosition, data.map((item) => item.name), viewport, spec.features.textSizes),
      series: [{
        type: 'pie',
        radius: ['42%', '72%'],
        center: legendPosition === 'bottom' ? ['50%', '43%'] : ['50%', '50%'],
        avoidLabelOverlap: true,
        minAngle: 2,
        label: spec.features.labels ? { show: true, formatter: ({ name, percent }) => `${truncateLabel(name, 10)} ${percent}%`, fontSize: labelFontSize } : { show: false },
        labelLine: { show: spec.features.labels },
        emphasis: { scale: true, scaleSize: 6 },
        data,
      }],
    },
    bottomPadding: 8,
  }
}

function scatterOption(spec, viewport) {
  const rows = sortChartData(spec.rows, spec.x, spec.sortDirection)
  const groups = spec.groupBy ? unique(rows.map((row) => String(row?.[spec.groupBy] ?? ''))) : ['__all__']
  const legendPosition = resolveLegendPosition(spec.features, groups.length, spec.kind)
  const compact = viewport.width > 0 && viewport.width < 440
  const axisFontSize = responsiveTextSize(spec.features.textSizes.axis, compact)
  const series = groups.map((group, index) => {
    const name = group === '__all__' ? spec.props.title || 'Series' : spec.aliases[group] || group
    return {
      name,
      type: 'scatter',
      symbolSize: compact ? 8 : 10,
      itemStyle: { color: seriesColorFor(group, index, { palette: spec.features.colorPalette, customPalette: spec.features.customPalette, overrides: spec.features.seriesColors }) },
      data: rows.filter((row) => group === '__all__' || String(row?.[spec.groupBy] ?? '') === group).map((row) => [numeric(row?.[spec.x]), numeric(row?.[spec.y])]),
    }
  })
  return {
    option: {
      animationDuration: 260,
      backgroundColor: chartPaletteBackground(spec.features.colorPalette, spec.features.customPalette),
      grid: { left: 58, right: 22, top: legendPosition === 'top' ? 42 : 18, bottom: legendPosition === 'bottom' ? 36 : 28, containLabel: true },
      legend: groups.length > 1 && spec.features.legend !== false ? legendOption(legendPosition, series.map((item) => item.name), viewport, spec.features.textSizes) : { show: false },
      tooltip: spec.features.tooltip ? { trigger: 'item', formatter: (point) => `${escapeHtml(point.seriesName)}<br/>${escapeHtml(valueFormatter(point.value?.[0]))}, ${escapeHtml(valueFormatter(point.value?.[1]))}` } : { show: false },
      xAxis: { type: 'value', name: spec.props.x_label || spec.x, axisLabel: { color: '#64748B', fontSize: axisFontSize, formatter: valueFormatter }, splitLine: { lineStyle: { type: 'dashed', color: '#E5E7EB' } } },
      yAxis: { type: 'value', name: spec.props.y_label || spec.y, axisLabel: { color: '#64748B', fontSize: axisFontSize, formatter: valueFormatter }, splitLine: { lineStyle: { type: 'dashed', color: '#E5E7EB' } } },
      series,
    },
    bottomPadding: 8,
  }
}

function radarOption(spec, viewport) {
  const rows = sortChartData(spec.rows, spec.x, spec.sortDirection)
  const compact = viewport.width > 0 && viewport.width < 440
  const axisFontSize = responsiveTextSize(spec.features.textSizes.axis, compact)
  const max = Math.max(1, ...rows.flatMap((row) => spec.series.map((series) => numeric(row?.[series.field]) || 0)))
  const indicators = rows.map((row) => ({ name: truncateLabel(formatTemporalAxisValue(row?.[spec.x], spec.axis?.x?.format || 'auto'), 10), max: valueAxisDomain[1](max) }))
  const legendPosition = resolveLegendPosition(spec.features, spec.series.length, spec.kind)
  const series = spec.series.map((item, index) => {
    const color = seriesColorFor(item.field, index, { palette: spec.features.colorPalette, customPalette: spec.features.customPalette, overrides: spec.features.seriesColors })
    return {
      name: item.label,
      value: rows.map((row) => numeric(row?.[item.field]) || 0),
      lineStyle: { color, width: 2 },
      itemStyle: { color },
      areaStyle: { color, opacity: 0.17 },
    }
  })
  return {
    option: {
      animationDuration: 260,
      backgroundColor: chartPaletteBackground(spec.features.colorPalette, spec.features.customPalette),
      legend: legendOption(legendPosition, series.map((item) => item.name), viewport, spec.features.textSizes),
      tooltip: spec.features.tooltip ? { trigger: 'item' } : { show: false },
      radar: { indicator: indicators, radius: compact ? '54%' : '66%', center: legendPosition === 'bottom' ? ['50%', '44%'] : ['50%', '52%'], axisName: { color: '#64748B', fontSize: axisFontSize }, splitLine: { lineStyle: { color: '#E5E7EB' } }, splitArea: { show: false } },
      series: [{ type: 'radar', data: series }],
    },
    bottomPadding: 8,
  }
}

function funnelOption(spec, viewport) {
  const rows = spec.rows
  const compact = viewport.width > 0 && viewport.width < 440
  const labelFontSize = responsiveTextSize(spec.features.textSizes.label, compact)
  const data = rows.map((row, index) => {
    const name = String(row?.[spec.x] ?? '')
    return {
      name: spec.aliases[name] || name,
      value: numeric(row?.[spec.y]) || 0,
      itemStyle: {
        color: seriesColorFor(name, index, {
          palette: spec.features.colorPalette,
          customPalette: spec.features.customPalette,
          overrides: spec.features.seriesColors,
        }),
      },
    }
  })
  const legendPosition = resolveLegendPosition(spec.features, data.length, spec.kind)
  return {
    option: {
      animationDuration: 260,
      backgroundColor: chartPaletteBackground(spec.features.colorPalette, spec.features.customPalette),
      tooltip: spec.features.tooltip ? {
        trigger: 'item',
        formatter: (point) => `${escapeHtml(point.name)}<br/><b>${escapeHtml(valueFormatter(point.value))}</b>`,
      } : { show: false },
      legend: legendOption(legendPosition, data.map((item) => item.name), viewport, spec.features.textSizes),
      series: [{
        type: 'funnel',
        sort: 'none',
        left: compact ? '8%' : '14%',
        top: legendPosition === 'top' ? 42 : 16,
        bottom: legendPosition === 'bottom' ? 34 : 14,
        width: compact ? '84%' : '72%',
        minSize: '34%',
        maxSize: '100%',
        gap: 4,
        label: {
          show: true,
          position: 'inside',
          color: '#fff',
          fontSize: labelFontSize,
          fontWeight: 600,
          formatter: ({ name, value }) => `${truncateLabel(name, compact ? 8 : 12)}\n${valueFormatter(value)}`,
        },
        labelLine: { show: false },
        itemStyle: { borderColor: '#fff', borderWidth: 1, borderRadius: 3 },
        emphasis: { label: { fontSize: labelFontSize + 1 } },
        data,
      }],
    },
    bottomPadding: 8,
  }
}

function readableTextColor(color) {
  const hex = String(color || '').replace('#', '').trim()
  const normalized = hex.length === 3 ? hex.split('').map((part) => `${part}${part}`).join('') : hex
  if (!/^[0-9a-f]{6}$/i.test(normalized)) return '#FFFFFF'
  const channels = [0, 2, 4].map((offset) => Number.parseInt(normalized.slice(offset, offset + 2), 16) / 255)
  const [red, green, blue] = channels.map((channel) => (channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4))
  return (red * 0.2126) + (green * 0.7152) + (blue * 0.0722) > 0.45 ? '#172033' : '#FFFFFF'
}

export function compileEChartsWidget(name, props, objectSpec, viewport = {}) {
  const spec = runtimeSpec(name, props, objectSpec)
  spec.transforms = plainObject(objectSpec?.vizSpec).transforms
  if (!spec.rows.length) return { option: { title: { text: '표시할 데이터가 없습니다.', left: 'center', top: 'middle', textStyle: { color: '#94A3B8', fontSize: 12, fontWeight: 'normal' } } }, bottomPadding: 8, kind: spec.kind }
  if (CARTESIAN_KINDS.has(spec.kind)) return { ...cartesianOption(spec, viewport), kind: spec.kind }
  if (spec.kind === 'pie') return { ...pieOption(spec, viewport), kind: spec.kind }
  if (spec.kind === 'scatter') return { ...scatterOption(spec, viewport), kind: spec.kind }
  if (spec.kind === 'radar') return { ...radarOption(spec, viewport), kind: spec.kind }
  if (spec.kind === 'funnel') return { ...funnelOption(spec, viewport), kind: spec.kind }
  return { option: { title: { text: '지원하지 않는 차트 유형입니다.', left: 'center', top: 'middle', textStyle: { color: '#94A3B8', fontSize: 12, fontWeight: 'normal' } } }, bottomPadding: 8, kind: spec.kind }
}

export function isEChartsWidget(name, objectSpec) {
  const renderer = plainObject(objectSpec?.vizSpec).renderer
  return Boolean(CHART_CODE_BY_WIDGET_TYPE[name]) && renderer !== 'recharts'
}
