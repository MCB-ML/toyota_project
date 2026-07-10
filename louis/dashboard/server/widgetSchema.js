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

export const ALLOWED_CHART_CODES_BY_SHAPE = {
  kpi: ['kpi'],
  breakdown: ['bar', 'pie', 'table'],
  trend: ['line', 'bar', 'table'],
}

export const WIDGET_REQUIRED_PROPS = {
  render_bar_chart: ['title', 'data', 'x_key', 'y_key'],
  render_line_chart: ['title', 'data', 'x_key', 'y_keys'],
  render_kpi_cards: ['cards'],
  render_table: ['title', 'columns', 'rows'],
  render_pie_chart: ['title', 'data'],
}

const CHART_COLORS = ['#3B82F6', '#1e3a5f', '#10B981', '#F59E0B', '#8B5CF6']

function formatKpiValue(raw) {
  if (typeof raw === 'number') return raw.toLocaleString()
  return String(raw ?? '')
}

// Builds the final render_*-shaped widget props. `rawData` always comes from
// semanticCatalog.resolveMetricRaw() (real, pre-aggregated JSON) — the LLM
// only ever chose the metric id, chart code, and title; it never supplies
// numbers directly, so hallucinated data is structurally impossible here.
export function buildWidgetProps(metric, chartCode, rawData, title) {
  const type = CHART_CODE_TO_WIDGET_TYPE[chartCode]
  if (!type) throw new Error(`Unknown chart code: ${chartCode}`)

  if (metric.shape === 'kpi') {
    const cards = metric.cardsFrom.map(({ key, title: cardTitle, sub }) => ({
      title: cardTitle,
      value: formatKpiValue(rawData?.[key]),
      sub,
    }))
    return { type: 'render_kpi_cards', props: { cards } }
  }

  const { labelKey, valueKey } = metric.fields
  const data = Array.isArray(rawData) ? rawData : []

  switch (chartCode) {
    case 'bar':
      return { type, props: { title, data, x_key: labelKey, y_key: valueKey, color: CHART_COLORS[0] } }
    case 'line':
      return { type, props: { title, data, x_key: labelKey, y_keys: [valueKey], y_labels: [metric.label] } }
    case 'pie':
      return {
        type,
        props: { title, data: data.map(d => ({ name: String(d[labelKey]), value: Number(d[valueKey]) || 0 })) },
      }
    case 'table':
      return {
        type,
        props: { title, columns: [labelKey, valueKey], rows: data.map(d => [d[labelKey], d[valueKey]]) },
      }
    default:
      throw new Error(`Unsupported chart code for shape "${metric.shape}": ${chartCode}`)
  }
}
