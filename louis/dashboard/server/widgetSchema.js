// Widget type vocabulary shared by validation, prompt-building, and the
// deterministic prop-builder below. `type` values intentionally match the
// existing render_* tool names from chatTools.js so the client-side
// GeneratedWidget dispatcher (src/components/widgets/GeneratedWidget.jsx)
// can render both /api/chat chart replies and dashboard-customize widgets
// with the exact same components.
export const CHART_CODE_TO_WIDGET_TYPE = {
  bar: 'render_bar_chart',
  line: 'render_line_chart',
  area: 'render_area_chart',
  pie: 'render_pie_chart',
  scatter: 'render_scatter_chart',
  radar: 'render_radar_chart',
  combo: 'render_combo_chart',
  table: 'render_table',
  kpi: 'render_kpi_cards',
}

// render_kpi_cards widgets are now one-card-per-widget going forward (see
// dashboardPipeline.js), so the standard shape is title/value like every other
// widget type. Legacy stored widgets built before this change (no cardKey,
// props.cards bundle) skip this check — it only runs at creation time.
// render_bar_chart only requires x_key, not y_key/y_keys — a stored spec may carry
// either shape (buildWidgetPropsFromRows picks one), and requiring both here would
// reject valid single-series widgets.
export const WIDGET_REQUIRED_PROPS = {
  render_bar_chart: ['title', 'data', 'x_key'],
  render_line_chart: ['title', 'data', 'x_key', 'y_keys'],
  render_area_chart: ['title', 'data', 'x_key', 'y_keys'],
  render_kpi_cards: ['title', 'value'],
  render_table: ['title', 'columns', 'rows'],
  render_pie_chart: ['title', 'data'],
  render_scatter_chart: ['title', 'data', 'x_key', 'y_key'],
  render_radar_chart: ['title', 'data', 'x_key', 'y_keys'],
  render_combo_chart: ['title', 'data', 'x_key', 'bar_keys', 'line_keys'],
}

const CHART_COLORS = ['#3B82F6', '#1e3a5f', '#10B981', '#F59E0B', '#8B5CF6']

// Builds render_*-shaped widget props directly from live Fabric query result rows
// (server/fabricClient.js). There's no fixed metric catalog anymore, so the LLM that
// wrote the SQL also tells us which of its own SELECT column aliases to plot
// (labelKey/valueKey for bar/pie, xKey/yKeys for line/area/radar, etc.) — it never
// supplies the numbers themselves, only points at columns in real query results.
export function buildWidgetPropsFromRows(chartCode, rows, spec, title) {
  const type = CHART_CODE_TO_WIDGET_TYPE[chartCode]
  if (!type) throw new Error(`Unknown chart code: ${chartCode}`)
  const data = Array.isArray(rows) ? rows : []

  switch (chartCode) {
    case 'bar': {
      // 두 spec 모양을 다 받는다: labelKey/valueKey(단일 계열, 대부분의 경우) 또는
      // xKey/yKeys(누적/그룹 다계열 막대). orientation/stacked는 컬럼이 아니라 순수
      // 렌더링 옵션이라 두 경우 모두에 그대로 얹는다.
      const { labelKey, valueKey, xKey, yKeys, yLabels, orientation, stacked } = spec
      const base = { title, data, orientation, stacked }
      if (xKey && yKeys?.length) {
        return {
          type,
          props: { ...base, x_key: xKey, y_keys: yKeys, y_labels: yLabels?.length ? yLabels : yKeys },
        }
      }
      return { type, props: { ...base, x_key: labelKey, y_key: valueKey, color: CHART_COLORS[0] } }
    }
    case 'line': {
      const { xKey, yKeys, yLabels } = spec
      return { type, props: { title, data, x_key: xKey, y_keys: yKeys, y_labels: yLabels?.length ? yLabels : yKeys } }
    }
    case 'area': {
      const { xKey, yKeys, yLabels, stacked } = spec
      return {
        type,
        props: { title, data, x_key: xKey, y_keys: yKeys, y_labels: yLabels?.length ? yLabels : yKeys, stacked: stacked ?? true },
      }
    }
    case 'pie': {
      const { labelKey, valueKey } = spec
      return {
        type,
        props: { title, data: data.map(d => ({ name: String(d[labelKey]), value: Number(d[valueKey]) || 0 })) },
      }
    }
    case 'scatter': {
      const { xKey, yKey, xLabel, yLabel, seriesKey } = spec
      return {
        type,
        props: { title, data, x_key: xKey, y_key: yKey, x_label: xLabel, y_label: yLabel, series_key: seriesKey },
      }
    }
    case 'radar': {
      // x_key/y_keys는 line/area와 같은 모양이지만 의미가 다르다: x_key=각 축(각도) 항목,
      // y_keys=그 축들을 잇는 다각형(비교 대상)마다 하나씩.
      const { xKey, yKeys, yLabels } = spec
      return { type, props: { title, data, x_key: xKey, y_keys: yKeys, y_labels: yLabels?.length ? yLabels : yKeys } }
    }
    case 'combo': {
      const { xKey, barKeys, lineKeys, barLabels, lineLabels } = spec
      const bars = barKeys || []
      const lines = lineKeys || []
      return {
        type,
        props: {
          title, data, x_key: xKey,
          bar_keys: bars, line_keys: lines,
          bar_labels: barLabels?.length ? barLabels : bars,
          line_labels: lineLabels?.length ? lineLabels : lines,
        },
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
