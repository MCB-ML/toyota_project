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
  funnel: 'render_funnel_chart',
  funnel_pyramid: 'render_funnel_pyramid',
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
  render_funnel_chart: ['title', 'data', 'x_key', 'y_key'],
  render_funnel_pyramid: ['title', 'data', 'stage_key', 'channels'],
  render_combo_chart: ['title', 'data', 'x_key', 'bar_keys', 'line_keys'],
}

import { foldDonutRows } from './agentic-bi/chartEligibility.js'

const CHART_COLORS = ['#3B82F6', '#1e3a5f', '#10B981', '#F59E0B', '#8B5CF6']

function formatKpiValue(value, percentageFormat = false) {
  if (value == null) return '-'
  if (percentageFormat && typeof value === 'number') return `${(value * 100).toFixed(1)}%`
  return typeof value === 'number' ? value.toLocaleString() : String(value)
}

// Builds render_*-shaped widget props directly from live Fabric query result rows
// (server/fabricClient.js). There's no fixed metric catalog anymore, so the LLM that
// wrote the SQL also tells us which of its own SELECT column aliases to plot
// (labelKey/valueKey for bar/pie, xKey/yKeys for line/area/radar, etc.) — it never
// supplies the numbers themselves, only points at columns in real query results.
//
// spec.colorsBySeries({계열키: hex})가 있으면 props.colors_by_key로 그대로 흘려보낸다 —
// 위젯 저장 시 props는 통째로 버려지고(dashboardPagesHandler.js) 재조회 때 chartCode +
// querySpec으로 다시 만들어지므로, 사용자가 고른 색이 살아남으려면 querySpec에 있어야 한다.
// chartCode별로 케이스가 9개라 각 case에 끼워 넣는 대신 여기 한 곳에서 얹는다(색을 안 쓰는
// table/kpi에도 붙지만 그 위젯들이 무시하므로 무해하다).
export function buildWidgetPropsFromRows(chartCode, rows, spec, title) {
  const built = buildWidgetPropsFromRowsCore(chartCode, rows, spec, title)
  if (!spec?.colorsBySeries) return built
  return { ...built, props: { ...built.props, colors_by_key: spec.colorsBySeries } }
}

function buildWidgetPropsFromRowsCore(chartCode, rows, spec, title) {
  const type = CHART_CODE_TO_WIDGET_TYPE[chartCode]
  if (!type) throw new Error(`Unknown chart code: ${chartCode}`)
  const data = Array.isArray(rows) ? rows : []

  switch (chartCode) {
    case 'bar': {
      // 두 spec 모양을 다 받는다: labelKey/valueKey(단일 계열, 대부분의 경우) 또는
      // xKey/yKeys(누적/그룹 다계열 막대). orientation/stacked는 컬럼이 아니라 순수
      // 렌더링 옵션이라 두 경우 모두에 그대로 얹는다.
      const { labelKey, valueKey, xKey, yKeys, yLabels, orientation, stacked, secondaryKeys } = spec
      const base = { title, data, orientation, stacked, secondary_keys: secondaryKeys }
      if (xKey && yKeys?.length) {
        return {
          type,
          props: { ...base, x_key: xKey, y_keys: yKeys, y_labels: yLabels?.length ? yLabels : yKeys },
        }
      }
      return { type, props: { ...base, x_key: labelKey, y_key: valueKey, color: CHART_COLORS[0] } }
    }
    case 'line': {
      const { xKey, yKeys, yLabels, secondaryKeys } = spec
      return { type, props: { title, data, x_key: xKey, y_keys: yKeys, y_labels: yLabels?.length ? yLabels : yKeys, secondary_keys: secondaryKeys } }
    }
    case 'area': {
      const { xKey, yKeys, yLabels, stacked, secondaryKeys } = spec
      return {
        type,
        props: { title, data, x_key: xKey, y_keys: yKeys, y_labels: yLabels?.length ? yLabels : yKeys, stacked: stacked ?? true, secondary_keys: secondaryKeys },
      }
    }
    case 'pie': {
      // sumKeys: 서로 겹치지 않게 쪼개진 지표 여러 개(예: PMA IN/OUT/ETC)를 한 슬라이스
      // 값으로 합친다 — valueKey 컬럼을 여기서 만들어 낸다.
      // foldTopN: 슬라이스가 그보다 많으면 상위 (N-1)개 + "기타"로 접는다.
      //
      // 둘 다 rows를 미리 가공해서 넘기는 대신 querySpec 플래그로 둔 이유: 위젯을 저장하면
      // props가 버려지고 재조회 때 이 함수가 raw rows로 다시 호출된다
      // (dashboardPagesHandler.js). 호출부에서 rows를 직접 접어 보내면 새로고침 후
      // 접힘이 풀리고(카테고리 16개가 그대로), 합산 컬럼은 아예 없어서 값이 전부 0이 된다.
      const { labelKey, valueKey, sumKeys, foldTopN } = spec
      let pieRows = data
      if (sumKeys?.length) {
        pieRows = pieRows.map(d => ({ ...d, [valueKey]: sumKeys.reduce((sum, k) => sum + (Number(d[k]) || 0), 0) }))
      }
      if (foldTopN) pieRows = foldDonutRows(pieRows, labelKey, valueKey, foldTopN)
      return {
        type,
        props: { title, data: pieRows.map(d => ({ name: String(d[labelKey]), value: Number(d[valueKey]) || 0 })) },
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
    case 'funnel': {
      const { labelKey, valueKey, xKey, yKey, valueLabel } = spec
      return { type, props: { title, data, x_key: labelKey || xKey, y_key: valueKey || yKey, y_label: valueLabel || valueKey || yKey } }
    }
    case 'funnel_pyramid': {
      const channels = Array.isArray(spec.channels) && spec.channels.length
        ? spec.channels
        : ['관계형성활동', 'SC활동', '내방/내전', '온라인유입']
      return {
        type,
        props: {
          title,
          data,
          stage_key: spec.stageKey || '단계',
          total_key: spec.totalKey || '단계 합계',
          channels,
          channel_colors: spec.channelColors || {},
          stage_widths: spec.stageWidthFractions || spec.stageWidths || {},
          channel_meta: spec.channelMeta || {},
          domain_meta: spec.domainMeta || {},
        },
      }
    }
    case 'combo': {
      const { xKey, barKeys, lineKeys, barLabels, lineLabels, secondaryKeys, stacked } = spec
      const bars = barKeys || []
      const lines = lineKeys || []
      return {
        type,
        props: {
          title, data, x_key: xKey,
          bar_keys: bars, line_keys: lines,
          bar_labels: barLabels?.length ? barLabels : bars,
          line_labels: lineLabels?.length ? lineLabels : lines,
          secondary_keys: secondaryKeys,
          stacked: stacked ?? false,
        },
      }
    }
    case 'table': {
      const columns = data.length ? Object.keys(data[0]) : []
      return { type, props: { title, columns, rows: data.map(d => columns.map(c => d[c])) } }
    }
    case 'kpi': {
      const row = data[0] || {}
      if (Array.isArray(spec.kpiItems) && spec.kpiItems.length) {
        const items = spec.kpiItems.filter((item) => item?.key)
        const [primary, ...details] = items
        if (primary) {
          return {
            type: 'render_kpi_cards',
            props: {
              title: primary.title || primary.key,
              primary_key: primary.key,
              value: formatKpiValue(row[primary.key], primary.percentageFormat),
              details: details.map((item) => ({
                key: item.key,
                title: item.title || item.key,
                value: formatKpiValue(row[item.key], item.percentageFormat),
              })),
            },
          }
        }
      }
      // spec.cardKey selects a single column from the row — every KPI card is its
      // own widget now, so rehydrate only needs to re-derive that one card's value.
      // spec.cardTitle (if present) is the human-facing label chosen at creation time —
      // prefer it over the raw column alias, which for RAG-authored widgets is often a
      // technical name (e.g. "Percentage") rather than something meant to be displayed.
      if (spec.cardKey) {
        const value = row[spec.cardKey]
        return {
          type: 'render_kpi_cards',
          // The dashboard object's title is user-owned. `cardTitle` is only the
          // creation-time fallback for a query result that has not been named yet.
          props: { title: title || spec.cardTitle || spec.cardKey, value: formatKpiValue(value, spec.percentageFormat) },
        }
      }
      const [primary, ...details] = Object.keys(row).map((key) => ({ key, title: key }))
      return {
        type: 'render_kpi_cards',
        props: {
          title: primary?.title || title,
          primary_key: primary?.key,
          value: primary ? formatKpiValue(row[primary.key]) : '-',
          details: details.map((item) => ({ key: item.key, title: item.title, value: formatKpiValue(row[item.key]) })),
        },
      }
    }
    default:
      throw new Error(`Unsupported chart code: ${chartCode}`)
  }
}
