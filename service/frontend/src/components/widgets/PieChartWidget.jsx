import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { seriesColorFor } from './colors'
import { truncateLabel, numberTooltip, sortChartData } from './axisFormat'
import ChartSurface, { chartViewport } from './ChartSurface'
import InteractiveLegend, { useLegendVisibility } from './InteractiveLegend'

export default function PieChartWidget({
  title, data, height = 220, show_legend, show_labels, legend_position, fill = false,
  sort_direction = 'asc', legend_labels = {}, color_palette, custom_palette, series_colors, colors_by_key, background_color, filterToolbar,
}) {
  const resolvedHeight = fill ? '100%' : height
  const colorOverrides = { ...(colors_by_key || {}), ...(series_colors || {}) }
  const chartData = sortChartData(data, 'name', sort_direction).map((item, index) => ({
    ...item,
    legendColor: seriesColorFor(item.name, index, { palette: color_palette, customPalette: custom_palette, overrides: colorOverrides }),
  }))
  const labelFor = (name) => legend_labels[name] || name
  const legendItems = chartData.map((item) => ({ key: item.name, label: labelFor(item.name), type: 'bar', color: item.legendColor }))
  const legend = useLegendVisibility(legendItems)
  const visibleData = chartData.filter((item) => !legend.isHidden(item.name))

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
          <PieChart>
            <Pie data={visibleData} cx="50%" cy="50%" innerRadius="55%" outerRadius="80%" dataKey="value" nameKey="name"
              label={show_labels === false ? false : ({ name, percent }) => `${truncateLabel(labelFor(name), 8)} ${(percent * 100).toFixed(0)}%`}
              labelLine={false}>
              {visibleData.map((item, index) => <Cell key={item.name || index} fill={item.legendColor} />)}
            </Pie>
            <Tooltip formatter={numberTooltip} labelFormatter={labelFor} />
          </PieChart>
        </ResponsiveContainer>
        )
      }}
    </ChartSurface>
  )
}
