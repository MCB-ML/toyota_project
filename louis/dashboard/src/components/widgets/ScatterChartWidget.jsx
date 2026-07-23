import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import { COLORS } from './colors'

// series_key가 있으면 그 컬럼 값별로 점을 나눠 색을 다르게 찍는다(없으면 단일 계열).
export default function ScatterChartWidget({ title, data, x_key, y_key, x_label, y_label, series_key, height = 220 }) {
  const groups = series_key ? Array.from(new Set(data.map(d => d[series_key]))) : [null]
  const seriesData = groups.map(g => (g === null ? data : data.filter(d => d[series_key] === g)))

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
      <h4 className="text-sm font-semibold text-gray-700 mb-3">{title}</h4>
      <ResponsiveContainer width="100%" height={height}>
        <ScatterChart margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis type="number" dataKey={x_key} name={x_label || x_key} tick={{ fontSize: 11 }} />
          <YAxis type="number" dataKey={y_key} name={y_label || y_key} tick={{ fontSize: 11 }} />
          <Tooltip cursor={{ strokeDasharray: '3 3' }} formatter={(v) => v?.toLocaleString()} />
          {groups.length > 1 && <Legend />}
          {groups.map((g, i) => (
            <Scatter key={g ?? 'all'} name={g ?? title} data={seriesData[i]} fill={COLORS[i % COLORS.length]} />
          ))}
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  )
}
