import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import { COLORS } from './colors'

// x_key는 각 축(각도)의 항목(예: 지표명), y_keys는 그 축들을 잇는 다각형 하나씩(예: 비교 대상들).
export default function RadarChartWidget({ title, data, x_key, y_keys, y_labels, height = 220 }) {
  const labels = y_labels?.length ? y_labels : y_keys

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
      <h4 className="text-sm font-semibold text-gray-700 mb-3">{title}</h4>
      <ResponsiveContainer width="100%" height={height}>
        <RadarChart data={data} cx="50%" cy="50%" outerRadius="75%">
          <PolarGrid />
          <PolarAngleAxis dataKey={x_key} tick={{ fontSize: 11 }} />
          <PolarRadiusAxis tick={{ fontSize: 10 }} />
          <Tooltip formatter={(v) => v?.toLocaleString()} />
          <Legend formatter={(v, e, i) => labels[i] || v} />
          {y_keys.map((key, i) => (
            <Radar
              key={key}
              name={labels[i] || key}
              dataKey={key}
              stroke={COLORS[i % COLORS.length]}
              fill={COLORS[i % COLORS.length]}
              fillOpacity={0.3}
            />
          ))}
        </RadarChart>
      </ResponsiveContainer>
    </div>
  )
}
