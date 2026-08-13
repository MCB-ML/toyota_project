import { useEffect, useMemo, useState } from 'react'
import BarChartWidget from './BarChartWidget'
import LineChartWidget from './LineChartWidget'
import AreaChartWidget from './AreaChartWidget'
import ScatterChartWidget from './ScatterChartWidget'
import RadarChartWidget from './RadarChartWidget'
import ComboChartWidget from './ComboChartWidget'
import FunnelPyramidWidget from './FunnelPyramidWidget'
import KpiCardsWidget from './KpiCardsWidget'
import TableWidget from './TableWidget'
import PieChartWidget from './PieChartWidget'
import EChartsWidget from './EChartsWidget'
import { isEChartsWidget } from './echartsViz'
import ObjectDataFilterBar from './ObjectDataFilterBar'
import { aggregateChartRows, cascadedObjectFilterControls, configuredObjectFilterControls, filterObjectRows, objectRowsFromProps } from './objectDataFilters'
import { chartPaletteBackground } from '../../utils/chartColors'

function labelsFor(keys, labels, aliases, columnMap) {
  return (keys || []).map((key, index) => aliases[key] || columnMap[key]?.label || labels?.[index] || key)
}

function configuredKeys(value, fallback = []) {
  return Array.isArray(value) && value.length ? value.filter(Boolean) : fallback.filter(Boolean)
}

export default function GeneratedWidget({ name, props: inputProps, height, fill = false, objectSpec }) {
  const props = inputProps && typeof inputProps === 'object' ? inputProps : {}
  const vizSpec = objectSpec?.vizSpec || {}
  const features = vizSpec.features || {}
  const derivations = Array.isArray(vizSpec.derivations) ? vizSpec.derivations : []
  const binding = vizSpec.binding || {}
  const columnMap = vizSpec.columnMap || {}
  const aliases = features.legendLabels || {}
  const colorPalette = features.colorPalette
  const customPalette = features.customPalette || {}
  const seriesColors = features.seriesColors || {}
  const backgroundColor = chartPaletteBackground(colorPalette, customPalette)
  const xAxisFormat = vizSpec.axis?.x?.format || 'auto'
  const sortDirection = vizSpec.sort?.direction || 'asc'
  const objectRows = useMemo(() => objectRowsFromProps(props), [props])
  const configuredFilters = useMemo(() => configuredObjectFilterControls({ props, objectSpec }), [props, objectSpec])
  const [filterValues, setFilterValues] = useState({})
  const cascadedFilters = useMemo(() => cascadedObjectFilterControls(objectRows, configuredFilters, filterValues), [objectRows, configuredFilters, filterValues])
  const filteredRows = useMemo(() => filterObjectRows(objectRows, filterValues), [objectRows, filterValues])
  const filterSignature = configuredFilters.map((control) => control.field).join('|')

  useEffect(() => {
    setFilterValues((current) => {
      const allowed = new Set(configuredFilters.flatMap((control) => control.options.map((option) => `${control.field}:${option.value}`)))
      const next = Object.fromEntries(Object.entries(current).filter(([field, value]) => allowed.has(`${field}:${value}`)))
      return Object.keys(next).length === Object.keys(current).length ? current : next
    })
  }, [filterSignature])

  const filterToolbar = configuredFilters.length ? <ObjectDataFilterBar controls={cascadedFilters} values={filterValues} onChange={(field, value) => setFilterValues((current) => {
    const next = { ...current }
    if (value) next[field] = value
    else delete next[field]
    return next
  })} /> : null
  const bindingSeries = Array.isArray(binding.series) ? binding.series : []
  const mappedBars = bindingSeries.filter((key) => columnMap[key]?.series?.type !== 'line')
  const mappedLines = bindingSeries.filter((key) => columnMap[key]?.series?.type === 'line')
  const mappedSecondary = bindingSeries.filter((key) => columnMap[key]?.series?.axis === 'right')
  const yKeys = configuredKeys(props.y_keys, bindingSeries)
  const barKeys = configuredKeys(props.bar_keys, name === 'render_combo_chart' ? mappedBars : (name === 'render_bar_chart' ? bindingSeries : []))
  const lineKeys = configuredKeys(props.line_keys, name === 'render_combo_chart' ? mappedLines : (name === 'render_line_chart' ? bindingSeries : []))
  const aggregateableChart = ['render_bar_chart', 'render_line_chart', 'render_area_chart', 'render_combo_chart', 'render_funnel_chart'].includes(name)
  const chartValueFields = [...new Set([...yKeys, ...barKeys, ...lineKeys, props.y_key].filter(Boolean))]
  const data = Array.isArray(props.data)
    ? (aggregateableChart ? aggregateChartRows(filteredRows, props.x_key || binding.x, chartValueFields, derivations) : filteredRows)
    : []
  const presentationProps = {
    ...props,
    data,
    ...(name === 'render_table' ? { rows: filteredRows } : {}),
    y_keys: yKeys,
    bar_keys: barKeys,
    line_keys: lineKeys,
    secondary_keys: configuredKeys(props.secondary_keys, mappedSecondary),
    show_legend: features.legend,
    legend_position: features.legendPosition,
    show_labels: features.labels === true || features.labels === 'top',
    x_axis_format: xAxisFormat,
    sort_direction: sortDirection,
    color_palette: colorPalette,
    custom_palette: customPalette,
    series_colors: seriesColors,
    background_color: backgroundColor,
    legend_labels: aliases,
    y_labels: labelsFor(yKeys, props.y_labels, aliases, columnMap),
    bar_labels: labelsFor(barKeys, props.bar_labels, aliases, columnMap),
    line_labels: labelsFor(lineKeys, props.line_labels, aliases, columnMap),
    ...(props.y_key ? { y_labels: [aliases[props.y_key] || columnMap[props.y_key]?.label || props.y_label || props.y_key] } : {}),
    ...(name === 'render_bar_chart' && binding.orientation ? { orientation: binding.orientation } : {}),
    ...(binding.stacked !== undefined ? { stacked: binding.stacked } : {}),
  }

  // Chart objects use one renderer-independent vizSpec. ECharts is the
  // default implementation; an explicit legacy renderer remains available
  // for a narrow rollback path while saved objects are being migrated.
  if (isEChartsWidget(name, objectSpec)) {
    return <EChartsWidget name={name} props={presentationProps} objectSpec={objectSpec} height={height} fill={fill} filterToolbar={filterToolbar} />
  }

  switch (name) {
    case 'render_bar_chart': return <BarChartWidget {...presentationProps} height={height} fill={fill} filterToolbar={filterToolbar} />
    case 'render_line_chart': return <LineChartWidget {...presentationProps} height={height} fill={fill} filterToolbar={filterToolbar} />
    case 'render_area_chart': return <AreaChartWidget {...presentationProps} height={height} fill={fill} filterToolbar={filterToolbar} />
    case 'render_scatter_chart': return <ScatterChartWidget {...presentationProps} height={height} fill={fill} filterToolbar={filterToolbar} />
    case 'render_radar_chart': return <RadarChartWidget {...presentationProps} height={height} fill={fill} filterToolbar={filterToolbar} />
    case 'render_combo_chart': return <ComboChartWidget {...presentationProps} height={height} fill={fill} filterToolbar={filterToolbar} />
    case 'render_funnel_pyramid': return <FunnelPyramidWidget {...presentationProps} height={height} fill={fill} filterToolbar={filterToolbar} />
    case 'render_kpi_cards': return <KpiCardsWidget {...presentationProps} fill={fill} cardSpec={objectSpec?.kpiSpec} />
    case 'render_table': return <TableWidget {...presentationProps} height={height} fill={fill} tableSpec={objectSpec?.tableSpec} columnMap={columnMap} filterToolbar={filterToolbar} />
    case 'render_pie_chart': return <PieChartWidget {...presentationProps} height={height} fill={fill} filterToolbar={filterToolbar} />
    default: return null
  }
}
