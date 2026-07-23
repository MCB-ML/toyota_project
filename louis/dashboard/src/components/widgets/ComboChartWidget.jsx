import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import { COLORS } from './colors'

// 막대(bar_keys)와 선(line_keys)을 같은 x축 위에 함께 그린다 — 예: 실적(막대) + 목표추이(선).
export default function ComboChartWidget({
  title, data, x_key, bar_keys = [], line_keys = [], bar_labels, line_labels, height = 220,
}) {
  const barLabels = bar_labels?.length ? bar_labels : bar_keys
  const lineLabels = line_labels?.length ? line_labels : line_keys

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
      <h4 className="text-sm font-semibold text-gray-700 mb-3">{title}</h4>
      <ResponsiveContainer width="100%" height={height}>
        <ComposedChart data={data} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey={x_key} tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v} />
          <Tooltip formatter={(v) => v?.toLocaleString()} />
          <Legend />
          {bar_keys.map((key, i) => (
            <Bar key={key} dataKey={key} name={barLabels[i] || key} fill={COLORS[i % COLORS.length]} radius={[4, 4, 0, 0]} />
          ))}
          {line_keys.map((key, i) => (
            <Line
              key={key}
              type="monotone"
              dataKey={key}
              name={lineLabels[i] || key}
              stroke={COLORS[(bar_keys.length + i) % COLORS.length]}
              strokeWidth={2}
              dot={{ r: 3 }}
            />
          ))}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
