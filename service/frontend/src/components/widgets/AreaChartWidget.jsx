import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { seriesColorFor } from './colors'
import { percentTick, numberTick, numberTooltip, valueAxisDomain, xAxisPresentation } from './axisFormat'
import ChartSurface, { chartViewport } from './ChartSurface'
import InteractiveLegend, { useLegendVisibility } from './InteractiveLegend'

export default function AreaChartWidget({
  title, data, x_key, y_keys = [], y_labels, stacked = true, secondary_keys, height,
  show_legend, show_labels, legend_position, fill = false,
  x_axis_format = 'auto', sort_direction = 'asc', color_palette, custom_palette, series_colors, colors_by_key, background_color, filterToolbar,
}) {
  const labels = y_labels?.length ? y_labels : y_keys
  const secondarySet = new Set(secondary_keys || [])
  const hasSecondary = secondarySet.size > 0
  const resolvedHeight = fill ? '100%' : (height ?? (y_keys.length > 2 ? 280 : 220))
  const xAxis = xAxisPresentation(data, x_key, { format: x_axis_format, sortDirection: sort_direction })
  const colorOverrides = { ...(colors_by_key || {}), ...(series_colors || {}) }
  const colorFor = (key, index) => seriesColorFor(key, index, { palette: color_palette, customPalette: custom_palette, overrides: colorOverrides })
  const legendItems = y_keys.map((key, index) => ({ key, label: labels[index] || key, type: 'area', color: colorFor(key, index) }))
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
          <AreaChart data={xAxis.data} margin={{ top: viewport.marginTop, right: 12, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey={x_key} tick={{ fontSize: viewport.tickFontSize }} angle={-35} textAnchor="end" height={Math.max(viewport.xAxisHeight, xAxis.axisHeight)} tickFormatter={xAxis.tickFormatter} />
            <YAxis yAxisId="left" tick={{ fontSize: viewport.tickFontSize }} tickFormatter={numberTick} domain={valueAxisDomain} />
            {hasSecondary && <YAxis yAxisId="right" orientation="right" tick={{ fontSize: viewport.tickFontSize }} tickFormatter={percentTick} domain={valueAxisDomain} />}
            <Tooltip formatter={numberTooltip} labelFormatter={xAxis.labelFormatter} />
            {y_keys.map((key, index) => !legend.isHidden(key) && <Area key={key} type="monotone" dataKey={key} yAxisId={secondarySet.has(key) ? 'right' : 'left'} name={labels[index] || key} stroke={colorFor(key, index)} fill={colorFor(key, index)} fillOpacity={0.35} strokeWidth={2} stackId={secondarySet.has(key) ? undefined : (stacked ? 'stack' : undefined)} label={show_labels ? { position: 'top', formatter: numberTick } : false} />)}
          </AreaChart>
        </ResponsiveContainer>
        )
      }}
    </ChartSurface>
  )
}
