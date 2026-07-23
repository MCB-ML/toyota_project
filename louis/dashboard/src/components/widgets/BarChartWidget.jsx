import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import { COLORS } from './colors'

const valueTick = (v) => v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v

// orientation='horizontal'은 recharts의 (반대로 이름 붙은) layout="vertical"에 대응한다.
// y_keys가 여러 개면 stacked로 누적 막대, 아니면 나란히(그룹) 막대로 그린다.
export default function BarChartWidget({
  title, data, x_key, y_key, y_keys, y_labels, color = '#3B82F6',
  orientation = 'vertical', stacked = false, height = 220,
}) {
  const keys = y_keys?.length ? y_keys : [y_key]
  const labels = y_labels?.length ? y_labels : keys
  const horizontal = orientation === 'horizontal'

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
      <h4 className="text-sm font-semibold text-gray-700 mb-3">{title}</h4>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart
          data={data}
          layout={horizontal ? 'vertical' : 'horizontal'}
          margin={horizontal ? { top: 4, right: 16, left: 8, bottom: 4 } : { top: 4, right: 16, left: 0, bottom: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          {horizontal ? (
            <>
              <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={valueTick} />
              <YAxis type="category" dataKey={x_key} tick={{ fontSize: 11 }} width={90} />
            </>
          ) : (
            <>
              <XAxis dataKey={x_key} tick={{ fontSize: 11 }} angle={-30} textAnchor="end" />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={valueTick} />
            </>
          )}
          <Tooltip formatter={(v) => v?.toLocaleString()} />
          {keys.length > 1 && <Legend formatter={(v, e, i) => labels[i] || v} />}
          {keys.map((key, i) => (
            <Bar
              key={key}
              dataKey={key}
              name={labels[i] || key}
              fill={keys.length > 1 ? COLORS[i % COLORS.length] : color}
              radius={horizontal ? [0, 4, 4, 0] : [4, 4, 0, 0]}
              stackId={stacked ? 'stack' : undefined}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
