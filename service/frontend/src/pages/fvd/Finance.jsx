import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import PageHeader from '../../components/PageHeader'
import ChartCard from '../../components/ChartCard'
import KPICard from '../../components/KPICard'
import { fvdFinanceDummy } from '../../data/dummy'
import { TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react'

const HEALTH_CFG = {
  good: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', label: '양호' },
  warning: { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200', label: '주의' },
  danger: { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-200', label: '위험' },
}
const REVENUE_COLORS = ['#1e3a5f', '#2563eb', '#3b82f6', '#60a5fa', '#93c5fd']

export default function FvdFinance() {
  const { dealerFsSummary, quarterlyTrend, revenueBreakdown } = fvdFinanceDummy

  const totalRevenue = dealerFsSummary.reduce((s, d) => s + d.revenue, 0)
  const totalProfit = dealerFsSummary.reduce((s, d) => s + d.profit, 0)
  const avgMargin = (totalProfit / totalRevenue * 100).toFixed(1)
  const dangerCount = dealerFsSummary.filter(d => d.health === 'danger').length

  return (
    <div className="p-6 space-y-6">
      <PageHeader title="딜러 재무 (DLR FS)" description="딜러별 재무 현황 Dashboard — 매출·비용·수익 비교 분석 및 위험 예측 (더미 데이터)" />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KPICard title="딜러 총 매출" value={`${(totalRevenue / 1000).toFixed(0)}억`} sub="전체 딜러 합계" variant="blue" />
        <KPICard title="총 수익" value={`${(totalProfit / 1000).toFixed(1)}억`} sub={`평균 영업이익률 ${avgMargin}%`} variant="green" />
        <KPICard title="재무 위험 딜러" value={`${dangerCount}개`} sub="적자 또는 이익률 3% 미만" variant="red" />
        <KPICard title="분기 추세" value="개선" sub="평균 수익 +△8.5% (Q3 vs Q2)" variant="purple" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard title="딜러별 매출·수익 비교" description="단위: 백만원">
          <ResponsiveContainer width="100%" height={270}>
            <BarChart data={dealerFsSummary} margin={{ top: 8, right: 16, left: 0, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="dealer" tick={{ fontSize: 10 }} angle={-20} textAnchor="end" />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${(v / 1000).toFixed(0)}K`} />
              <Tooltip formatter={v => `${v.toLocaleString()}백만`} />
              <Legend />
              <Bar dataKey="revenue" fill="#3b82f6" name="매출" radius={[4, 4, 0, 0]} />
              <Bar dataKey="cost" fill="#94a3b8" name="비용" radius={[4, 4, 0, 0]} />
              <Bar dataKey="profit" name="수익"
                radius={[4, 4, 0, 0]}
                fill="#22c55e"
                label={{ position: 'top', formatter: v => v < 0 ? `▼${Math.abs(v)}` : '', fontSize: 10, fill: '#dc2626' }} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="분기별 평균 재무 추이" description="2024년 딜러 평균 (Q4는 예측값)">
          <ResponsiveContainer width="100%" height={270}>
            <LineChart data={quarterlyTrend} margin={{ top: 8, right: 24, left: 0, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="quarter" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${(v / 1000).toFixed(0)}K`} />
              <Tooltip formatter={v => `${v.toLocaleString()}백만`} />
              <Legend />
              <Line type="monotone" dataKey="avg_revenue" stroke="#3b82f6" strokeWidth={2.5} name="평균 매출" dot={{ r: 4 }} />
              <Line type="monotone" dataKey="avg_cost" stroke="#94a3b8" strokeWidth={2} strokeDasharray="5 5" name="평균 비용" dot={{ r: 3 }} />
              <Line type="monotone" dataKey="avg_profit" stroke="#22c55e" strokeWidth={2.5} name="평균 수익" dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard title="매출 구성 비율" description="전체 딜러 평균">
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={revenueBreakdown} cx="50%" cy="50%" innerRadius={55} outerRadius={85}
                dataKey="value" nameKey="category"
                label={({ category, value }) => `${category} ${value}%`} labelLine={true}>
                {revenueBreakdown.map((_, i) => <Cell key={i} fill={REVENUE_COLORS[i]} />)}
              </Pie>
              <Tooltip formatter={v => `${v}%`} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">딜러별 재무 건전성</h3>
          <div className="space-y-2">
            {dealerFsSummary.map((d, i) => {
              const cfg = HEALTH_CFG[d.health]
              return (
                <div key={i} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 border ${cfg.bg} ${cfg.border}`}>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-800">{d.dealer}</span>
                      <span className={`text-xs font-bold ${cfg.text}`}>{cfg.label}</span>
                    </div>
                    <div className="flex gap-3 mt-0.5 text-xs text-gray-500">
                      <span>매출 {d.revenue.toLocaleString()}M</span>
                      <span>수익 {d.profit >= 0 ? '+' : ''}{d.profit.toLocaleString()}M</span>
                      <span className={d.margin < 0 ? 'text-red-500 font-semibold' : ''}>이익률 {d.margin}%</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
