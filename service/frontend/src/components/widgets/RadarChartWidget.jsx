import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { seriesColorFor } from './colors'
import { truncateLabel, numberTick, numberTooltip, xAxisPresentation } from './axisFormat'
import ChartSurface, { chartViewport } from './ChartSurface'
import InteractiveLegend, { useLegendVisibility } from './InteractiveLegend'

export default function RadarChartWidget({
  title, data, x_key, y_keys = [], y_labels, height = 220, fill = false,
  sort_direction = 'asc', x_axis_format = 'auto', show_legend, legend_position = 'bottom', color_palette, custom_palette, series_colors, colors_by_key, background_color, filterToolbar,
}) {
  const labels = y_labels?.length ? y_labels : y_keys
  const resolvedHeight = fill ? '100%' : height
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
      legendPosition={legend_position}
      legend={show_legend !== false ? ({ width, height: contentHeight }) => (
        <InteractiveLegend items={legendItems} hidden={legend.isHidden} onToggle={legend.toggle} position={legend_position} width={width} height={contentHeight} />
      ) : null}
    >
      {(size) => {
        const viewport = chartViewport(size, resolvedHeight)
        return (
        <ResponsiveContainer width={viewport.width} height={viewport.height}>
          <RadarChart data={xAxis.data} cx="50%" cy="50%" outerRadius="75%">
            <PolarGrid />
            <PolarAngleAxis dataKey={x_key} tick={{ fontSize: viewport.tickFontSize }} tickFormatter={(value) => truncateLabel(xAxis.tickFormatter(value), 10)} />
            <PolarRadiusAxis tick={{ fontSize: Math.max(8, viewport.tickFontSize - 1) }} tickFormatter={numberTick} />
            <Tooltip formatter={numberTooltip} labelFormatter={xAxis.labelFormatter} />
            {y_keys.map((key, index) => !legend.isHidden(key) && <Radar key={key} name={labels[index] || key} dataKey={key} stroke={colorFor(key, index)} fill={colorFor(key, index)} fillOpacity={0.3} />)}
          </RadarChart>
        </ResponsiveContainer>
        )
      }}
    </ChartSurface>
  )
}
