export default function KPICard({ title, value, sub, color, variant, icon: Icon }) {
  color = color || variant || 'blue'
  const colorMap = {
    blue:   { bg: 'bg-blue-50',   icon: 'bg-blue-100 text-blue-600',   val: 'text-blue-700' },
    red:    { bg: 'bg-red-50',    icon: 'bg-red-100 text-red-600',     val: 'text-red-700' },
    green:  { bg: 'bg-green-50',  icon: 'bg-green-100 text-green-600', val: 'text-green-700' },
    purple: { bg: 'bg-purple-50', icon: 'bg-purple-100 text-purple-600', val: 'text-purple-700' },
    orange: { bg: 'bg-orange-50', icon: 'bg-orange-100 text-orange-600', val: 'text-orange-700' },
    navy:   { bg: 'bg-slate-50',  icon: 'bg-slate-100 text-slate-600',  val: 'text-slate-700' },
  }
  const c = colorMap[color] || colorMap.blue

  return (
    <div className={`rounded-xl p-5 ${c.bg} border border-white shadow-sm`}>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-gray-500 mb-1 truncate">{title}</p>
          <p className={`text-2xl font-bold ${c.val} leading-tight`}>{value}</p>
          {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
        </div>
        {Icon && (
          <div className={`w-10 h-10 rounded-lg ${c.icon} flex items-center justify-center ml-3 flex-shrink-0`}>
            <Icon size={20} />
          </div>
        )}
      </div>
    </div>
  )
}
