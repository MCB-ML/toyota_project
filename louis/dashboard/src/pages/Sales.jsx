import { useState } from 'react'
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine
} from 'recharts'
import PageHeader from '../components/PageHeader'
import ChartCard from '../components/ChartCard'
import KPICard from '../components/KPICard'
import { salesDummy } from '../data/dummy'
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Minus } from 'lucide-react'

const STATUS_CONFIG = {
  ok: { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' },
  warning: { icon: AlertTriangle, color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200' },
  danger: { icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
}

export default function Sales() {
  const [brand, setBrand] = useState('all')
  const data = salesDummy.monthlyTargetVsActual

  const totalTarget = data.reduce((s, d) => s + (d.target || 0), 0)
  const totalActual = data.reduce((s, d) => s + (d.actual || 0), 0)
  const achievementRate = ((totalActual / (totalTarget - (data.find(d => d.forecast)?.target || 0))) * 100).toFixed(1)
  const forecasted = data.find(d => d.forecast)?.forecast || 0

  return (
    <div className="p-6 space-y-6">
      <PageHeader title="영업 현황" description="월별 계약·출고 실적 및 목표 달성률 분석 (일부 예측값 포함)" />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KPICard title="누적 목표" value={totalTarget.toLocaleString()} sub="2024년 전체" variant="blue" />
        <KPICard title="누적 실적" value={totalActual.toLocaleString()} sub={`달성률 ${achievementRate}%`} variant="green" />
        <KPICard title="12월 예측" value={forecasted.toLocaleString()} sub="AI 예측값 (더미)" variant="purple" />
        <KPICard title="알림 딜러" value={salesDummy.dealerRiskAlerts.filter(d => d.status !== 'ok').length.toString()}
          sub="목표 미달 위험" variant="red" />
      </div>

      <ChartCard title="월별 목표 vs 실적 추이" description="12월은 AI 예측값">
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data} margin={{ top: 8, right: 24, left: 0, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="month" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${(v / 1000).toFixed(1)}K`} domain={['auto', 'auto']} />
            <Tooltip formatter={(v) => v?.toLocaleString()} />
            <Legend />
            <ReferenceLine x="2024-12" stroke="#a855f7" strokeDasharray="4 4" label={{ value: '예측', position: 'top', fontSize: 10 }} />
            <Line type="monotone" dataKey="target" stroke="#94a3b8" strokeWidth={2} strokeDasharray="5 5" name="목표" dot={false} />
            <Line type="monotone" dataKey="actual" stroke="#1e3a5f" strokeWidth={2.5} name="실적" dot={{ r: 4 }} connectNulls={false} />
            <Line type="monotone" dataKey="forecast" stroke="#a855f7" strokeWidth={2} strokeDasharray="4 4" name="예측" dot={{ r: 5 }} connectNulls={false} />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard title="브랜드별 목표 달성률" description="누적 기준">
          <div className="space-y-4 py-4">
            {salesDummy.brandAchievementRate.map(b => (
              <div key={b.brand}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium text-gray-700">{b.brand}</span>
                  <span className={`font-semibold ${b.rate >= 90 ? 'text-green-600' : 'text-yellow-600'}`}>{b.rate}%</span>
                </div>
                <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${b.rate >= 90 ? 'bg-green-500' : 'bg-yellow-500'}`}
                    style={{ width: `${b.rate}%` }} />
                </div>
              </div>
            ))}
          </div>
        </ChartCard>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-1">딜러 위험 알림</h3>
          <p className="text-xs text-gray-400 mb-4">목표 달성률 기준 이상 감지 (더미 데이터)</p>
          <div className="space-y-2">
            {salesDummy.dealerRiskAlerts.map((alert, i) => {
              const cfg = STATUS_CONFIG[alert.status]
              const Icon = cfg.icon
              return (
                <div key={i} className={`flex items-start gap-3 rounded-xl px-4 py-3 border ${cfg.bg} ${cfg.border}`}>
                  <Icon size={15} className={`${cfg.color} flex-shrink-0 mt-0.5`} />
                  <div>
                    <p className={`text-xs font-semibold ${cfg.color}`}>{alert.dealer}</p>
                    <p className="text-xs text-gray-600">{alert.message}</p>
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
