const TREND_COLORS = { up: 'text-green-600', down: 'text-red-500', neutral: 'text-gray-500' }
const TREND_ARROWS = { up: '▲', down: '▼', neutral: '—' }

export default function KpiCardsWidget({ cards }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {cards.map((card, i) => (
        <div key={i} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <p className="text-xs text-gray-500 mb-1">{card.title}</p>
          <p className="text-xl font-bold text-gray-800">{card.value}</p>
          {card.sub && <p className="text-xs text-gray-400 mt-1">{card.sub}</p>}
          {card.trend && (
            <span className={`text-xs font-medium ${TREND_COLORS[card.trend]}`}>
              {TREND_ARROWS[card.trend]}
            </span>
          )}
        </div>
      ))}
    </div>
  )
}
