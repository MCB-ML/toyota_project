import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { seriesColorFor } from './colors'
import { numberTick, numberTooltip, sortChartData, valueAxisDomain } from './axisFormat'
import ChartSurface, { chartViewport } from './ChartSurface'
import InteractiveLegend, { useLegendVisibility } from './InteractiveLegend'

export default function ScatterChartWidget({
  title, data, x_key, y_key, x_label, y_label, series_key, height = 220, fill = false,
  sort_direction = 'asc', legend_labels = {}, show_legend, legend_position = 'bottom', color_palette, custom_palette, series_colors, colors_by_key, background_color, filterToolbar,
}) {
  const chartData = sortChartData(data, x_key, sort_direction)
  const groups = series_key ? Array.from(new Set(chartData.map((datum) => datum[series_key]))) : [null]
  const seriesData = groups.map((group) => (group === null ? chartData : chartData.filter((datum) => datum[series_key] === group)))
  const resolvedHeight = fill ? '100%' : height
  const colorOverrides = { ...(colors_by_key || {}), ...(series_colors || {}) }
  if (colors_by_key?.[title] && !colorOverrides.__all__) colorOverrides.__all__ = colors_by_key[title]
  const colorFor = (key, index) => seriesColorFor(key, index, { palette: color_palette, customPalette: custom_palette, overrides: colorOverrides })
  const legendItems = groups.map((group, index) => ({ key: group ?? '__all__', label: legend_labels[group] || group || title, type: 'scatter', color: colorFor(group ?? '__all__', index) }))
  const legend = useLegendVisibility(legendItems)

  return (
    <ChartSurface
      title={title}
      toolbar={filterToolbar}
      backgroundColor={background_color}
      fill={fill}
      height={resolvedHeight}
      legendPosition={legend_position}
      legend={show_legend !== false && groups.length > 1 ? ({ width, height: contentHeight }) => (
        <InteractiveLegend items={legendItems} hidden={legend.isHidden} onToggle={legend.toggle} position={legend_position} width={width} height={contentHeight} />
      ) : null}
    >
      {(size) => {
        const viewport = chartViewport(size, resolvedHeight)
        return (
        <ResponsiveContainer width={viewport.width} height={viewport.height}>
          <ScatterChart margin={{ top: viewport.marginTop, right: 12, left: 0, bottom: 2 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis type="number" dataKey={x_key} name={x_label || x_key} tick={{ fontSize: viewport.tickFontSize }} tickFormatter={numberTick} />
            <YAxis type="number" dataKey={y_key} name={y_label || y_key} tick={{ fontSize: viewport.tickFontSize }} tickFormatter={numberTick} domain={valueAxisDomain} />
            <Tooltip cursor={{ strokeDasharray: '3 3' }} formatter={numberTooltip} />
            {groups.map((group, index) => !legend.isHidden(group ?? '__all__') && <Scatter key={group ?? 'all'} name={legend_labels[group] || group || title} data={seriesData[index]} fill={colorFor(group ?? '__all__', index)} />)}
          </ScatterChart>
        </ResponsiveContainer>
        )
      }}
    </ChartSurface>
  )
}
