import { KPI_CARD_PADDING, normalizeKpiCardSpec, summaryItemStyleFor } from '../../utils/kpiCardSpec'

const TREND_COLORS = { up: 'text-green-600', down: 'text-red-500', neutral: 'text-gray-500' }
const TREND_ARROWS = { up: '▲', down: '▼', neutral: '—' }

const HORIZONTAL_ALIGN = { left: 'text-left', center: 'text-center', right: 'text-right' }
const VERTICAL_ALIGN = { top: 'justify-start', center: 'justify-center', bottom: 'justify-end' }

function StatCard({ title, value, sub, trend, fill, cardSpec }) {
  const spec = normalizeKpiCardSpec(cardSpec)
  return (
    <div className={`overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm ${KPI_CARD_PADDING[spec.padding]} ${fill ? 'h-full min-h-0' : ''}`}>
      <div className={`flex min-h-0 w-full flex-col ${HORIZONTAL_ALIGN[spec.align]} ${fill ? `h-full ${VERTICAL_ALIGN[spec.verticalAlign]}` : ''}`}>
      <p className={`min-w-0 break-words ${spec.title.bold ? 'font-bold' : 'font-normal'}`} style={{ color: spec.title.color, fontSize: `${spec.title.fontSize}px`, lineHeight: 1.35 }}>{title}</p>
      <p className={`mt-0.5 min-w-0 break-words tabular-nums ${spec.value.bold ? 'font-bold' : 'font-normal'}`} style={{ color: spec.value.color, fontSize: `${spec.value.fontSize}px`, lineHeight: 1.2 }}>{value}</p>
      {sub && <p className="mt-1 min-w-0 break-words text-xs leading-4 text-gray-400">{sub}</p>}
      {trend && (
        <span className={`text-xs font-medium ${TREND_COLORS[trend]}`}>
          {TREND_ARROWS[trend]}
        </span>
      )}
      </div>
    </div>
  )
}

function TextPair({ title, value, style }) {
  return (
    <div className={`min-w-0 ${HORIZONTAL_ALIGN[style.align]}`}>
      <p className={`min-w-0 break-words ${style.title.bold ? 'font-bold' : 'font-normal'}`} style={{ color: style.title.color, fontSize: `${style.title.fontSize}px`, lineHeight: 1.35 }}>{title}</p>
      <p className={`mt-0.5 min-w-0 break-words tabular-nums ${style.value.bold ? 'font-bold' : 'font-normal'}`} style={{ color: style.value.color, fontSize: `${style.value.fontSize}px`, lineHeight: 1.2 }}>{value}</p>
    </div>
  )
}

function SummaryCard({ title, value, details, primary_key: primaryKey, fill, cardSpec }) {
  const spec = normalizeKpiCardSpec(cardSpec)
  const primaryStyle = summaryItemStyleFor(spec, primaryKey, 'primary')
  return (
    <div className={`overflow-hidden rounded-xl border border-gray-100 border-l-4 bg-white shadow-sm ${KPI_CARD_PADDING[spec.padding]} ${fill ? 'h-full min-h-0' : ''}`} style={{ borderLeftColor: spec.accentColor }}>
      <div className="grid h-full min-h-0 grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] gap-3">
        <div className={`flex min-w-0 flex-col ${fill ? VERTICAL_ALIGN[spec.verticalAlign] : ''}`}>
          <TextPair title={title} value={value} style={primaryStyle} />
        </div>
        <div className="flex min-w-0 flex-col justify-center gap-1.5">
          {details.map((detail) => {
            return <TextPair key={detail.key} title={detail.title} value={detail.value} style={summaryItemStyleFor(spec, detail.key)} />
          })}
        </div>
      </div>
    </div>
  )
}

// 위젯 하나 = 카드 하나(title/value/sub/trend)가 기본 형태 — 대시보드 그리드에서
// 카드별로 옮기고 크기를 조절할 수 있다. 그리드 칸을 리사이즈해도 카드가 그 칸을
// 꽉 채우도록 fill(h-full)로 렌더 — 안 그러면 카드는 원래 크기 그대로인데 칸만
// 커져서 빈 공간이 남는다. `cards` 배열은 이 변경 전에 저장된 옛 대시보드(카드
// 묶음 하나가 위젯 하나)를 그대로 보여주기 위한 하위 호환 경로.
export default function KpiCardsWidget({ title, value, sub, trend, details, primary_key: primaryKey, fill = false, cardSpec }) {
  if (Array.isArray(details) && details.length) {
    return <SummaryCard title={title} value={value} details={details} primary_key={primaryKey} fill={fill} cardSpec={cardSpec} />
  }
  return <StatCard title={title} value={value} sub={sub} trend={trend} fill={fill} cardSpec={cardSpec} />
}
