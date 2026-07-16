import BarChartWidget from './BarChartWidget'
import LineChartWidget from './LineChartWidget'
import KpiCardsWidget from './KpiCardsWidget'
import TableWidget from './TableWidget'
import PieChartWidget from './PieChartWidget'

// Dispatches on the render_* tool name (from /api/chat) or widget.type (from
// the dashboard-customize pipeline) — both use the exact same prop shapes.
// `height` is a layout concern (set by the dashboard page's resize handle), kept
// separate from `props` (the chart's data spec) — KpiCardsWidget just ignores it.
export default function GeneratedWidget({ name, props, height }) {
  switch (name) {
    case 'render_bar_chart': return <BarChartWidget {...props} height={height} />
    case 'render_line_chart': return <LineChartWidget {...props} height={height} />
    case 'render_kpi_cards': return <KpiCardsWidget {...props} />
    case 'render_table': return <TableWidget {...props} height={height} />
    case 'render_pie_chart': return <PieChartWidget {...props} height={height} />
    default: return null
  }
}
