import BarChartWidget from './BarChartWidget'
import LineChartWidget from './LineChartWidget'
import KpiCardsWidget from './KpiCardsWidget'
import TableWidget from './TableWidget'
import PieChartWidget from './PieChartWidget'

// Dispatches on the render_* tool name (from /api/chat) or widget.type (from
// the dashboard-customize pipeline) — both use the exact same prop shapes.
export default function GeneratedWidget({ name, props }) {
  switch (name) {
    case 'render_bar_chart': return <BarChartWidget {...props} />
    case 'render_line_chart': return <LineChartWidget {...props} />
    case 'render_kpi_cards': return <KpiCardsWidget {...props} />
    case 'render_table': return <TableWidget {...props} />
    case 'render_pie_chart': return <PieChartWidget {...props} />
    default: return null
  }
}
