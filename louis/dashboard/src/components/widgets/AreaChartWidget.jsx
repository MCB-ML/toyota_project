import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import { COLORS } from './colors'

// x_key/y_keys는 LineChartWidget과 같은 spec — 시계열 위에 누적/비누적 면적으로 그린다.
export default function AreaChartWidget({ title, data, x_key, y_keys, y_labels, stacked = true, height = 220 }) {
  const labels = y_labels?.length ? y_labels : y_keys

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
      <h4 className="text-sm font-semibold text-gray-700 mb-3">{title}</h4>
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey={x_key} tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v} />
          <Tooltip formatter={(v) => v?.toLocaleString()} />
          <Legend formatter={(v, e, i) => labels[i] || v} />
          {y_keys.map((key, i) => (
            <Area
              key={key}
              type="monotone"
              dataKey={key}
              name={labels[i] || key}
              stroke={COLORS[i % COLORS.length]}
              fill={COLORS[i % COLORS.length]}
              fillOpacity={0.35}
              strokeWidth={2}
              stackId={stacked ? 'stack' : undefined}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
