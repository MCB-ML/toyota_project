// Widget type vocabulary shared by validation, prompt-building, and the
// deterministic prop-builder below. `type` values intentionally match the
// existing render_* tool names from chatTools.js so the client-side
// GeneratedWidget dispatcher (src/components/widgets/GeneratedWidget.jsx)
// can render both /api/chat chart replies and dashboard-customize widgets
// with the exact same components.
export const CHART_CODE_TO_WIDGET_TYPE = {
  bar: 'render_bar_chart',
  line: 'render_line_chart',
  pie: 'render_pie_chart',
  table: 'render_table',
  kpi: 'render_kpi_cards',
}

// render_kpi_cards widgets are now one-card-per-widget going forward (see
// dashboardPipeline.js), so the standard shape is title/value like every other
// widget type. Legacy stored widgets built before this change (no cardKey,
// props.cards bundle) skip this check — it only runs at creation time.
export const WIDGET_REQUIRED_PROPS = {
  render_bar_chart: ['title', 'data', 'x_key', 'y_key'],
  render_line_chart: ['title', 'data', 'x_key', 'y_keys'],
  render_kpi_cards: ['title', 'value'],
  render_table: ['title', 'columns', 'rows'],
  render_pie_chart: ['title', 'data'],
}

const CHART_COLORS = ['#3B82F6', '#1e3a5f', '#10B981', '#F59E0B', '#8B5CF6']

// Builds render_*-shaped widget props directly from live Fabric query result rows
// (server/fabricClient.js). There's no fixed metric catalog anymore, so the LLM that
// wrote the SQL also tells us which of its own SELECT column aliases to plot
// (labelKey/valueKey for bar/pie, xKey/yKeys for line) — it never supplies the
// numbers themselves, only points at columns in real query results.
export function buildWidgetPropsFromRows(chartCode, rows, spec, title) {
  const type = CHART_CODE_TO_WIDGET_TYPE[chartCode]
  if (!type) throw new Error(`Unknown chart code: ${chartCode}`)
  const data = Array.isArray(rows) ? rows : []

  switch (chartCode) {
    case 'bar': {
      const { labelKey, valueKey } = spec
      return { type, props: { title, data, x_key: labelKey, y_key: valueKey, color: CHART_COLORS[0] } }
    }
    case 'line': {
      const { xKey, yKeys, yLabels } = spec
      return { type, props: { title, data, x_key: xKey, y_keys: yKeys, y_labels: yLabels?.length ? yLabels : yKeys } }
    }
    case 'pie': {
      const { labelKey, valueKey } = spec
      return {
        type,
        props: { title, data: data.map(d => ({ name: String(d[labelKey]), value: Number(d[valueKey]) || 0 })) },
      }
    }
    case 'table': {
      const columns = data.length ? Object.keys(data[0]) : []
      return { type, props: { title, columns, rows: data.map(d => columns.map(c => d[c])) } }
    }
    case 'kpi': {
      const row = data[0] || {}
      // spec.cardKey selects a single column from the row — every KPI card is its
      // own widget now, so rehydrate only needs to re-derive that one card's value.
      // spec.cardTitle (if present) is the human-facing label chosen at creation time —
      // prefer it over the raw column alias, which for RAG-authored widgets is often a
      // technical name (e.g. "Percentage") rather than something meant to be displayed.
      if (spec.cardKey) {
        const value = row[spec.cardKey]
        return {
          type: 'render_kpi_cards',
          props: { title: spec.cardTitle || spec.cardKey, value: typeof value === 'number' ? value.toLocaleString() : String(value ?? '-') },
        }
      }
      // Legacy fallback: widgets saved before the per-card split stored no cardKey —
      // keep rendering them as the original bundled card grid.
      const cards = Object.entries(row).map(([key, value]) => ({
        title: key,
        value: typeof value === 'number' ? value.toLocaleString() : String(value ?? '-'),
      }))
      return { type: 'render_kpi_cards', props: { cards } }
    }
    default:
      throw new Error(`Unsupported chart code: ${chartCode}`)
  }
}
