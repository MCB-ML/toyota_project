const TREND_COLORS = { up: 'text-green-600', down: 'text-red-500', neutral: 'text-gray-500' }
const TREND_ARROWS = { up: '▲', down: '▼', neutral: '—' }

function StatCard({ title, value, sub, trend, fill }) {
  return (
    <div className={`bg-white rounded-xl p-4 shadow-sm border border-gray-100 ${fill ? 'h-full flex flex-col justify-center' : ''}`}>
      <p className="text-xs text-gray-500 mb-1">{title}</p>
      <p className="text-xl font-bold text-gray-800">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
      {trend && (
        <span className={`text-xs font-medium ${TREND_COLORS[trend]}`}>
          {TREND_ARROWS[trend]}
        </span>
      )}
    </div>
  )
}

// 위젯 하나 = 카드 하나(title/value/sub/trend)가 기본 형태 — 대시보드 그리드에서
// 카드별로 옮기고 크기를 조절할 수 있다. 그리드 칸을 리사이즈해도 카드가 그 칸을
// 꽉 채우도록 fill(h-full)로 렌더 — 안 그러면 카드는 원래 크기 그대로인데 칸만
// 커져서 빈 공간이 남는다. `cards` 배열은 이 변경 전에 저장된 옛 대시보드(카드
// 묶음 하나가 위젯 하나)를 그대로 보여주기 위한 하위 호환 경로.
export default function KpiCardsWidget({ title, value, sub, trend, cards }) {
  if (cards) {
    return (
      <div className="grid grid-cols-2 gap-3">
        {cards.map((card, i) => <StatCard key={i} {...card} />)}
      </div>
    )
  }
  return <StatCard title={title} value={value} sub={sub} trend={trend} fill />
}
