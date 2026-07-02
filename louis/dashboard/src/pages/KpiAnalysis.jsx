import { useState } from 'react'
import {
  RadarChart, PolarGrid, PolarAngleAxis, Radar,
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine
} from 'recharts'
import PageHeader from '../components/PageHeader'
import ChartCard from '../components/ChartCard'
import KPICard from '../components/KPICard'
import { kpiDummy } from '../data/dummy'
import { TrendingUp, TrendingDown, Target } from 'lucide-react'

const KPI_COLORS = {
  NPS: '#1e3a5f',
  TCM: '#2563eb',
  VC: '#16a34a',
  OP: '#d97706',
  AR: '#9333ea',
}

export default function KpiAnalysis() {
  const [selectedKpi, setSelectedKpi] = useState('NPS')
  const { dealerScores, monthlyNpsTrend, yearEndForecast, varianceFactors, kpiDescriptions } = kpiDummy

  const radarData = kpiDummy.kpiTypes.map(k => ({ kpi: k, ...Object.fromEntries(dealerScores.map(d => [d.dealer, d[k]])) }))

  const selectedDealer = dealerScores[0]

  return (
    <div className="p-6 space-y-6">
      <PageHeader title="KPI 분석" description="딜러별 NPS/TCM/VC/OP/AR 지표 및 연말 예측 (더미 데이터)" />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        {kpiDummy.kpiTypes.map(k => {
          const f = yearEndForecast[k]
          const onTrack = f.forecast >= f.target
          return (
            <div key={k} className={`bg-white rounded-2xl border p-4 cursor-pointer transition-all shadow-sm ${selectedKpi === k ? 'ring-2 ring-blue-500 border-blue-300' : 'border-gray-100 hover:border-gray-300'}`}
              onClick={() => setSelectedKpi(k)}>
              <p className="text-xs text-gray-500 mb-0.5">{k}</p>
              <p className="text-xl font-bold text-gray-800">{f.current}</p>
              <div className="flex items-center gap-1 mt-1">
                {onTrack
                  ? <TrendingUp size={12} className="text-green-500" />
                  : <TrendingDown size={12} className="text-red-500" />}
                <span className={`text-xs ${onTrack ? 'text-green-600' : 'text-red-500'}`}>
                  연말 예측 {f.forecast} (목표 {f.target})
                </span>
              </div>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard title="딜러별 KPI 레이더" description="현재 시점 상위 딜러 비교 (더미 데이터)">
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={radarData} cx="50%" cy="50%" outerRadius={100}>
              <PolarGrid stroke="#e5e7eb" />
              <PolarAngleAxis dataKey="kpi" tick={{ fontSize: 11 }} />
              {dealerScores.slice(0, 3).map((d, i) => (
                <Radar key={d.dealer} name={d.dealer} dataKey={d.dealer}
                  stroke={Object.values(KPI_COLORS)[i]} fill={Object.values(KPI_COLORS)[i]} fillOpacity={0.1} />
              ))}
              <Legend />
              <Tooltip />
            </RadarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="NPS 월별 추이" description="Lexus vs Toyota 비교">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyNpsTrend} margin={{ top: 8, right: 24, left: 0, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis domain={[60, 95]} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <ReferenceLine y={85} stroke="#10b981" strokeDasharray="4 4"
                label={{ value: '목표 85', position: 'right', fontSize: 10, fill: '#10b981' }} />
              <Line type="monotone" dataKey="lexus" stroke="#1e3a5f" strokeWidth={2.5} name="Lexus" dot={{ r: 3 }} />
              <Line type="monotone" dataKey="toyota" stroke="#dc2626" strokeWidth={2.5} name="Toyota" dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <ChartCard title="딜러별 KPI 점수표" description="전체 딜러 KPI 비교 (더미 데이터)">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">딜러</th>
                {kpiDummy.kpiTypes.map(k => (
                  <th key={k} className="px-4 py-3 text-center text-xs font-medium text-gray-500">{k}</th>
                ))}
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">평균</th>
              </tr>
            </thead>
            <tbody>
              {dealerScores.map((d, i) => {
                const avg = (kpiDummy.kpiTypes.reduce((s, k) => s + d[k], 0) / kpiDummy.kpiTypes.length).toFixed(0)
                return (
                  <tr key={i} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-700">{d.dealer}</td>
                    {kpiDummy.kpiTypes.map(k => (
                      <td key={k} className="px-4 py-3 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded-lg text-xs font-semibold ${d[k] >= 85 ? 'bg-green-50 text-green-700' : d[k] >= 75 ? 'bg-blue-50 text-blue-700' : 'bg-red-50 text-red-600'}`}>
                          {d[k]}
                        </span>
                      </td>
                    ))}
                    <td className="px-4 py-3 text-center font-semibold text-gray-700">{avg}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </ChartCard>

      <ChartCard title="변동 요인 분석" description="주요 KPI 변동 원인 (더미 데이터)">
        <div className="space-y-3 py-2">
          {varianceFactors.map((v, i) => (
            <div key={i} className="flex items-center gap-4">
              <span className={`w-14 text-center text-xs font-semibold px-2 py-0.5 rounded-full ${v.impact > 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                {v.kpi}
              </span>
              <div className="flex-1">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-700">{v.factor}</span>
                  <span className={`font-semibold ${v.impact > 0 ? 'text-green-600' : 'text-red-500'}`}>
                    {v.impact > 0 ? '+' : ''}{v.impact}
                  </span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${v.impact > 0 ? 'bg-green-400' : 'bg-red-400'}`}
                    style={{ width: `${Math.abs(v.impact) / 4 * 100}%`, marginLeft: v.impact < 0 ? `${(1 - Math.abs(v.impact) / 4) * 100}%` : '0' }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </ChartCard>
    </div>
  )
}
