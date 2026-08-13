import { BarChart, Bar, LabelList, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { seriesColorFor } from './colors'
import { percentTick, numberTick, numberTooltip, valueAxisDomain, xAxisPresentation } from './axisFormat'
import ChartSurface, { chartViewport } from './ChartSurface'
import InteractiveLegend, { useLegendVisibility } from './InteractiveLegend'

export default function BarChartWidget({
  title, data, x_key, y_key, y_keys, y_labels,
  orientation = 'vertical', stacked = false, secondary_keys, height,
  show_legend, show_labels, legend_position, fill = false,
  x_axis_format = 'auto', sort_direction = 'asc', color_palette, custom_palette, series_colors, colors_by_key, background_color, filterToolbar,
}) {
  const keys = y_keys?.length ? y_keys : (y_key ? [y_key] : [])
  const labels = y_labels?.length ? y_labels : keys
  const horizontal = orientation === 'horizontal'
  const secondarySet = new Set(secondary_keys || [])
  const hasSecondary = !horizontal && secondarySet.size > 0
  const resolvedHeight = fill ? '100%' : (height ?? (keys.length > 2 ? 280 : 220))
  const xAxis = xAxisPresentation(data, x_key, { format: x_axis_format, sortDirection: sort_direction })
  const colorOverrides = { ...(colors_by_key || {}), ...(series_colors || {}) }
  const colorFor = (key, index) => seriesColorFor(key, index, { palette: color_palette, customPalette: custom_palette, overrides: colorOverrides })
  const legendItems = keys.map((key, index) => ({ key, label: labels[index] || key, type: 'bar', color: colorFor(key, index) }))
  const shouldShowLegend = show_legend === true || (show_legend === undefined && keys.length > 1)
  const legend = useLegendVisibility(legendItems)

  return (
    <ChartSurface
      title={title}
      toolbar={filterToolbar}
      backgroundColor={background_color}
      fill={fill}
      height={resolvedHeight}
      bottomPadding={horizontal ? 8 : xAxis.bottomPadding}
      legendPosition={legend_position}
      legend={shouldShowLegend ? ({ width, height: contentHeight }) => (
        <InteractiveLegend items={legendItems} hidden={legend.isHidden} onToggle={legend.toggle} position={legend_position} width={width} height={contentHeight} />
      ) : null}
    >
      {(size) => {
        const viewport = chartViewport(size, resolvedHeight)
        return (
        <ResponsiveContainer width={viewport.width} height={viewport.height}>
          <BarChart data={xAxis.data} layout={horizontal ? 'vertical' : 'horizontal'} margin={horizontal ? { top: viewport.marginTop, right: 12, left: 4, bottom: 2 } : { top: viewport.marginTop, right: 12, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            {horizontal ? (
              <>
                <XAxis type="number" tick={{ fontSize: viewport.tickFontSize }} tickFormatter={numberTick} domain={valueAxisDomain} />
                <YAxis type="category" dataKey={x_key} tick={{ fontSize: viewport.tickFontSize }} width={90} tickFormatter={xAxis.tickFormatter} />
              </>
            ) : (
              <>
                <XAxis dataKey={x_key} tick={{ fontSize: viewport.tickFontSize }} angle={-35} textAnchor="end" height={Math.max(viewport.xAxisHeight, xAxis.axisHeight)} tickFormatter={xAxis.tickFormatter} />
                <YAxis yAxisId="left" tick={{ fontSize: viewport.tickFontSize }} tickFormatter={numberTick} domain={valueAxisDomain} />
                {hasSecondary && <YAxis yAxisId="right" orientation="right" tick={{ fontSize: viewport.tickFontSize }} tickFormatter={percentTick} domain={valueAxisDomain} />}
              </>
            )}
            <Tooltip formatter={numberTooltip} labelFormatter={xAxis.labelFormatter} />
            {keys.map((key, index) => (
              !legend.isHidden(key) && <Bar key={key} dataKey={key} yAxisId={horizontal ? undefined : (secondarySet.has(key) ? 'right' : 'left')} name={labels[index] || key}
                fill={colorFor(key, index)} radius={horizontal ? [0, 4, 4, 0] : [4, 4, 0, 0]}
                stackId={secondarySet.has(key) ? undefined : (stacked ? 'stack' : undefined)}>
                {show_labels && <LabelList dataKey={key} position={horizontal ? 'right' : 'top'} formatter={numberTick} />}
              </Bar>
            ))}
          </BarChart>
        </ResponsiveContainer>
        )
      }}
    </ChartSurface>
  )
}
