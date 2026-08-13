import { useMemo } from 'react'
import { formatDashboardValue } from '../../utils/dashboardObject'
import { DEFAULT_CHART_COLOR_PALETTE, seriesColorFor } from '../../utils/chartColors'

const DEFAULT_STAGES = ['활동', '기회', '영업기회', '시승', '계약']
const DISPLAY_STAGE = {
  영업기회: '기회',
}
const STAGE_WIDTH_FRACTION = {
  활동: 1,
  기회: 0.82,
  영업기회: 0.82,
  시승: 0.64,
  계약: 0.46,
}
const DEFAULT_CHANNELS = ['관계형성활동', 'SC활동', '내방/내전', '온라인유입']
const DEFAULT_CHANNEL_COLORS = {
  관계형성활동: '#3b5f8a',
  SC활동: '#7fa0cc',
  '내방/내전': '#d9534f',
  온라인유입: '#e8918e',
}
const CHANNEL_HEADER = {
  관계형성활동: { name: '관계형성활동', sub: '(재구매/소개)', category: '기존고객' },
  SC활동: { name: 'SC활동', sub: '(잠재고객/판촉)', category: '기존고객' },
  '내방/내전': { name: '내방/내전', sub: '(신규유입)', category: '신규유입' },
  온라인유입: { name: '온라인유입', sub: '(신규유입)', category: '신규유입' },
}
const DOMAIN_STYLE = {
  기존고객: { label: 'KTWS의 관리 영역', fill: '#eef1f6', stroke: '#3b5f8a', startStageIndex: 1 },
  신규유입: { label: '마케팅활동의 관리 영역', fill: '#fbeceb', stroke: '#d9534f', startStageIndex: 0 },
}
const NON_CHANNEL_FIELDS = new Set([
  '연도', '월', '브랜드', '딜러', '전시장', '팀', 'SC',
  '단계', '단계 합계', '전체 전환율', '항목',
])

function numberValue(value) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0
  const parsed = Number(String(value ?? '').replaceAll(',', '').replace('%', ''))
  return Number.isFinite(parsed) ? parsed : 0
}

function positive(value) {
  return Math.max(0, numberValue(value))
}

function inferChannels(rows, configured) {
  if (Array.isArray(configured) && configured.length) return configured.filter(Boolean)
  const fields = [...new Set(rows.flatMap((row) => Object.keys(row || {})))]
  const numericFields = fields.filter((field) => (
    !NON_CHANNEL_FIELDS.has(field)
    && rows.some((row) => Number.isFinite(Number(String(row?.[field] ?? '').replaceAll(',', '').replace('%', ''))))
  ))
  return numericFields.length ? numericFields : DEFAULT_CHANNELS
}

function stageOrder(rows, stageKey) {
  const seen = [...new Set(rows.map((row) => row?.[stageKey]).filter(Boolean))]
  return [
    ...DEFAULT_STAGES.filter((stage) => seen.includes(stage)),
    ...seen.filter((stage) => !DEFAULT_STAGES.includes(stage)),
  ]
}

function aggregateStages(rows, stageKey, totalKey, channels) {
  const groups = new Map()
  for (const row of rows) {
    if (row?.항목 && row.항목 !== '퍼널 숫자') continue
    const stage = row?.[stageKey]
    if (!stage) continue
    if (!groups.has(stage)) {
      groups.set(stage, {
        stage,
        displayStage: DISPLAY_STAGE[stage] || stage,
        total: 0,
        channels: Object.fromEntries(channels.map((channel) => [channel, 0])),
      })
    }
    const target = groups.get(stage)
    for (const channel of channels) target.channels[channel] += positive(row?.[channel])
    const explicitTotal = positive(row?.[totalKey])
    if (explicitTotal > 0 && channels.every((channel) => positive(row?.[channel]) === 0)) target.total += explicitTotal
  }

  for (const target of groups.values()) {
    const channelTotal = channels.reduce((sum, channel) => sum + target.channels[channel], 0)
    if (channelTotal > 0) target.total = channelTotal
  }

  const ordered = stageOrder(rows, stageKey)
  return ordered.map((stage) => groups.get(stage)).filter(Boolean)
}

function formatCount(value) {
  return formatDashboardValue(value, { compact: Number(value) >= 10000 })
}

function formatPercentNumber(value) {
  if (!Number.isFinite(value)) return '-'
  return `${value.toFixed(1)}%`
}

function channelColor(channel, index, props) {
  return props.series_colors?.[channel]
    || props.channel_colors?.[channel]
    || props.channel_meta?.[channel]?.color
    || DEFAULT_CHANNEL_COLORS[channel]
    || seriesColorFor(channel, index, {
      palette: props.color_palette || DEFAULT_CHART_COLOR_PALETTE,
      customPalette: props.custom_palette,
      overrides: props.series_colors,
    })
}

function mergedObject(defaults, overrides) {
  return {
    ...defaults,
    ...(overrides && typeof overrides === 'object' && !Array.isArray(overrides) ? overrides : {}),
  }
}

function buildStageLayouts(stages, channels, stageWidths) {
  const rowH = 66
  const gapH = 44
  const top = 88
  const centerX = 432
  const maxW = 560
  return stages.map((stage, stageIndex) => {
    const rowW = maxW * (stageWidths[stage.stage] || stageWidths[stage.displayStage] || 0.5)
    const x1 = centerX - rowW / 2
    const y1 = top + stageIndex * (rowH + gapH)
    const segW = rowW / Math.max(channels.length, 1)
    return {
      ...stage,
      x1,
      x2: x1 + rowW,
      y1,
      y2: y1 + rowH,
      rowH,
      segments: channels.map((channel, channelIndex) => ({
        key: channel,
        x1: x1 + channelIndex * segW,
        x2: x1 + (channelIndex + 1) * segW,
        value: stage.channels[channel] || 0,
        colorIndex: channelIndex,
      })),
    }
  })
}

function rateFor(value, base) {
  return base > 0 ? (value / base) * 100 : null
}

function segmentMetrics(layouts, stageIndex, channel, value) {
  const current = layouts[stageIndex]
  const previous = layouts[stageIndex - 1]
  const base = layouts[0]
  const pct = current.total > 0 ? (value / current.total) * 100 : null
  return {
    pct,
    vsPrev: stageIndex === 0 ? null : rateFor(value, previous?.channels[channel]),
    vsBase: stageIndex <= 1 ? null : rateFor(value, base?.channels[channel]),
  }
}

function textSizing(width) {
  if (width > 120) return { value: 16, sub: 12, dy: 18 }
  if (width > 74) return { value: 13, sub: 10, dy: 16 }
  return { value: 11, sub: 8.5, dy: 13 }
}

export default function FunnelPyramidWidget({
  title,
  data,
  stage_key = '단계',
  total_key = '단계 합계',
  channels: configuredChannels,
  channel_colors,
  color_palette,
  custom_palette,
  series_colors,
  legend_labels,
  stage_widths,
  channel_meta,
  domain_meta,
  background_color,
  height,
  fill = false,
  filterToolbar,
}) {
  const rows = Array.isArray(data) ? data : []
  const channels = useMemo(() => inferChannels(rows, configuredChannels), [rows, configuredChannels])
  const stages = useMemo(() => aggregateStages(rows, stage_key, total_key, channels), [rows, stage_key, total_key, channels])
  const stageWidths = useMemo(() => mergedObject(STAGE_WIDTH_FRACTION, stage_widths), [stage_widths])
  const channelMeta = useMemo(() => mergedObject(CHANNEL_HEADER, channel_meta), [channel_meta])
  const domainMeta = useMemo(() => mergedObject(DOMAIN_STYLE, domain_meta), [domain_meta])
  const domainOrder = useMemo(() => [...new Set(channels.map((channel) => channelMeta[channel]?.category).filter(Boolean))], [channels, channelMeta])
  const layouts = useMemo(() => buildStageLayouts(stages, channels, stageWidths), [stages, channels, stageWidths])
  const paletteProps = { channel_colors, color_palette, custom_palette, series_colors, channel_meta: channelMeta }
  const svgHeight = layouts.length ? layouts.at(-1).y2 + 44 : 360
  const chartHeight = fill ? '100%' : Math.max(330, (height || 420) - 54)
  const firstRow = layouts[0]

  return (
    <div
      className={`rounded-lg border border-gray-100 bg-white px-3 pt-2 shadow-sm ${fill ? 'flex h-full min-h-0 flex-col' : ''}`}
      style={{ paddingBottom: 10, backgroundColor: background_color || '#FFFFFF', ...(fill ? undefined : { minHeight: height || 420 }) }}
    >
      <div className="mb-2 flex shrink-0 items-center justify-between gap-2">
        <h4 className="min-w-0 flex-1 truncate text-sm font-semibold leading-5 text-gray-800">{title}</h4>
        {filterToolbar}
      </div>

      {!layouts.length ? (
        <div className="flex min-h-48 items-center justify-center text-xs text-slate-400">조회된 데이터가 없습니다.</div>
      ) : (
        <div className={`${fill ? 'min-h-0 flex-1' : ''} overflow-hidden`}>
          <svg
            viewBox={`0 0 900 ${svgHeight}`}
            className="block w-full"
            style={{ height: chartHeight }}
            role="img"
            aria-label={title}
            preserveAspectRatio="xMidYMin meet"
          >
            {firstRow && domainOrder.map((category) => {
              const segs = firstRow.segments.filter((segment) => channelMeta[segment.key]?.category === category)
              if (!segs.length) return null
              const x1 = Math.min(...segs.map((segment) => segment.x1))
              const x2 = Math.max(...segs.map((segment) => segment.x2))
              const style = domainMeta[category] || DOMAIN_STYLE[category]
              return (
                <g key={category}>
                  <rect x={x1 + 3} y="4" width={x2 - x1 - 6} height="24" rx="5" fill={style.fill} stroke={style.stroke} strokeWidth="1.5" />
                  <text x={(x1 + x2) / 2} y="20" textAnchor="middle" className="text-[12px] font-bold" fill={style.stroke}>
                    {style.label}
                  </text>
                </g>
              )
            })}

            {firstRow?.segments.map((segment) => {
              const header = channelMeta[segment.key] || { name: legend_labels?.[segment.key] || segment.key, sub: '' }
              const midX = (segment.x1 + segment.x2) / 2
              const color = channelColor(segment.key, segment.colorIndex, paletteProps)
              return (
                <g key={segment.key}>
                  <text x={midX} y="52" textAnchor="middle" className="text-[12px] font-bold" fill={color}>{header.name}</text>
                  {header.sub && <text x={midX} y="67" textAnchor="middle" className="text-[9.5px]" fill={color} opacity="0.86">{header.sub}</text>}
                </g>
              )
            })}

            {layouts.slice(0, -1).map((layout, stageIndex) => {
              const next = layouts[stageIndex + 1]
              const rate = layout.total > 0 ? (next.total / layout.total) * 100 : null
              return (
                <g key={`${layout.stage}-transition`}>
                  {layout.segments.map((segment) => {
                    const nextSegment = next.segments.find((item) => item.key === segment.key)
                    if (!nextSegment) return null
                    const color = channelColor(segment.key, segment.colorIndex, paletteProps)
                    return (
                      <polygon
                        key={segment.key}
                        points={`${segment.x1},${layout.y2} ${segment.x2},${layout.y2} ${nextSegment.x2},${next.y1} ${nextSegment.x1},${next.y1}`}
                        fill={color}
                        opacity="0.3"
                      />
                    )
                  })}
                  <text x="18" y={layout.y2 + 10} className="fill-slate-500 text-[12px]">
                    {`${layout.displayStage}->${next.displayStage}`}
                  </text>
                  <text x="18" y={layout.y2 + 28} className="fill-slate-500 text-[12px]">
                    {formatPercentNumber(rate)}
                  </text>
                </g>
              )
            })}

            {layouts.map((layout, stageIndex) => (
              <g key={layout.stage}>
                {layout.segments.map((segment) => {
                  const width = Math.max(segment.x2 - segment.x1, 0)
                  const value = segment.value
                  const metrics = segmentMetrics(layouts, stageIndex, segment.key, value)
                  const color = channelColor(segment.key, segment.colorIndex, paletteProps)
                  const midX = (segment.x1 + segment.x2) / 2
                  const sizing = textSizing(width)
                  const tuple = `(${formatPercentNumber(metrics.vsBase)}/${formatPercentNumber(metrics.vsPrev)})`
                  return (
                    <g key={segment.key}>
                      <rect x={segment.x1} y={layout.y1} width={width} height={layout.rowH} fill={color}>
                        <title>{`${layout.displayStage} / ${legend_labels?.[segment.key] || segment.key}: ${formatCount(value)} (${tuple})`}</title>
                      </rect>
                      {width > 42 && (
                        <>
                          <text x={midX} y={layout.y1 + layout.rowH / 2 - sizing.dy} textAnchor="middle" dominantBaseline="central" className="fill-white font-semibold" style={{ fontSize: sizing.value }}>
                            {formatCount(value)}
                          </text>
                          <text x={midX} y={layout.y1 + layout.rowH / 2} textAnchor="middle" dominantBaseline="central" className="fill-white" opacity="0.95" style={{ fontSize: sizing.sub }}>
                            {tuple}
                          </text>
                          <text x={midX} y={layout.y1 + layout.rowH / 2 + sizing.dy} textAnchor="middle" dominantBaseline="central" className="fill-white" opacity="0.9" style={{ fontSize: sizing.sub }}>
                            비중 {formatPercentNumber(metrics.pct)}
                          </text>
                        </>
                      )}
                    </g>
                  )
                })}
                <text x="18" y={layout.y1 + layout.rowH / 2 - 8} className="fill-slate-900 text-[13px] font-bold">{layout.displayStage}</text>
                <text x="18" y={layout.y1 + layout.rowH / 2 + 13} className="fill-slate-500 text-[12px]">{formatCount(layout.total)}건</text>
              </g>
            ))}

            {firstRow && domainOrder.map((category) => {
              const segs = firstRow.segments.filter((segment) => channelMeta[segment.key]?.category === category)
              if (!segs.length) return null
              const x1 = Math.min(...segs.map((segment) => segment.x1))
              const x2 = Math.max(...segs.map((segment) => segment.x2))
              const style = domainMeta[category] || DOMAIN_STYLE[category] || {}
              const topIndex = Number.isInteger(style.startStageIndex) ? style.startStageIndex : 0
              const topRow = layouts[topIndex] || firstRow
              const bottomRow = layouts.at(-1)
              return (
                <rect
                  key={`${category}-outline`}
                  x={x1}
                  y={topRow.y1}
                  width={x2 - x1}
                  height={bottomRow.y2 - topRow.y1}
                  fill="none"
                  stroke="#1a1d29"
                  strokeWidth="2"
                  strokeDasharray="7,5"
                />
              )
            })}
          </svg>
        </div>
      )}
    </div>
  )
}
