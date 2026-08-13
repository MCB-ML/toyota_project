import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { seriesColorFor } from './colors'
import { percentTick, numberTick, numberTooltip, valueAxisDomain, xAxisPresentation } from './axisFormat'
import ChartSurface, { chartViewport } from './ChartSurface'
import InteractiveLegend, { useLegendVisibility } from './InteractiveLegend'

export default function ComboChartWidget({
  title, data, x_key, bar_keys = [], line_keys = [], bar_labels, line_labels, secondary_keys, stacked = false, height,
  show_legend, show_labels, legend_position, fill = false,
  x_axis_format = 'auto', sort_direction = 'asc', color_palette, custom_palette, series_colors, colors_by_key, background_color, filterToolbar,
}) {
  const barLabels = bar_labels?.length ? bar_labels : bar_keys
  const lineLabels = line_labels?.length ? line_labels : line_keys
  const secondarySet = new Set(secondary_keys || [])
  const hasSecondary = secondarySet.size > 0
  const seriesCount = bar_keys.length + line_keys.length
  const resolvedHeight = fill ? '100%' : (height ?? (seriesCount > 2 ? 280 : 220))
  const xAxis = xAxisPresentation(data, x_key, { format: x_axis_format, sortDirection: sort_direction })
  const colorOverrides = { ...(colors_by_key || {}), ...(series_colors || {}) }
  const colorFor = (key, index) => seriesColorFor(key, index, { palette: color_palette, customPalette: custom_palette, overrides: colorOverrides })
  const legendItems = [
    ...bar_keys.map((key, index) => ({ key, label: barLabels[index] || key, type: 'bar', color: colorFor(key, index) })),
    ...line_keys.map((key, index) => ({ key, label: lineLabels[index] || key, type: 'line', color: colorFor(key, bar_keys.length + index) })),
  ]
  const legend = useLegendVisibility(legendItems)

  return (
    <ChartSurface
      title={title}
      toolbar={filterToolbar}
      backgroundColor={background_color}
      fill={fill}
      height={resolvedHeight}
      bottomPadding={xAxis.bottomPadding}
      legendPosition={legend_position}
      legend={show_legend !== false ? ({ width, height: contentHeight }) => (
        <InteractiveLegend items={legendItems} hidden={legend.isHidden} onToggle={legend.toggle} position={legend_position} width={width} height={contentHeight} />
      ) : null}
    >
      {(size) => {
        const viewport = chartViewport(size, resolvedHeight)
        return (
        <ResponsiveContainer width={viewport.width} height={viewport.height}>
          <ComposedChart data={xAxis.data} margin={{ top: viewport.marginTop, right: 12, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey={x_key} tick={{ fontSize: viewport.tickFontSize }} angle={-35} textAnchor="end" height={Math.max(viewport.xAxisHeight, xAxis.axisHeight)} tickFormatter={xAxis.tickFormatter} />
            <YAxis yAxisId="left" tick={{ fontSize: viewport.tickFontSize }} tickFormatter={numberTick} domain={valueAxisDomain} />
            {hasSecondary && <YAxis yAxisId="right" orientation="right" tick={{ fontSize: viewport.tickFontSize }} tickFormatter={percentTick} domain={valueAxisDomain} />}
            <Tooltip formatter={numberTooltip} labelFormatter={xAxis.labelFormatter} />
            {bar_keys.map((key, index) => !legend.isHidden(key) && <Bar key={key} dataKey={key} yAxisId={secondarySet.has(key) ? 'right' : 'left'} name={barLabels[index] || key} fill={colorFor(key, index)} radius={[4, 4, 0, 0]} stackId={stacked ? `bar-${secondarySet.has(key) ? 'right' : 'left'}` : undefined} label={show_labels ? { position: 'top', formatter: numberTick } : false} />)}
            {line_keys.map((key, index) => !legend.isHidden(key) && <Line key={key} type="monotone" dataKey={key} yAxisId={secondarySet.has(key) ? 'right' : 'left'} name={lineLabels[index] || key} stroke={colorFor(key, bar_keys.length + index)} strokeWidth={2} dot={{ r: 3 }} label={show_labels ? { position: 'top', formatter: numberTick } : false} />)}
          </ComposedChart>
        </ResponsiveContainer>
        )
      }}
    </ChartSurface>
  )
}
