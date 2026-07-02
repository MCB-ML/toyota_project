import { useState } from 'react'
import {
  RadarChart, PolarGrid, PolarAngleAxis, Radar,
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine
} from 'recharts'
import PageHeader from '../../components/PageHeader'
import ChartCard from '../../components/ChartCard'
import KPICard from '../../components/KPICard'
import { kpiDealerDummy } from '../../data/dummy'
import { TrendingUp, TrendingDown } from 'lucide-react'

const COLORS = ['#1e3a5f', '#dc2626', '#16a34a', '#d97706', '#9333ea', '#0891b2']

export default function KpiDealer() {
  const [selectedDealers, setSelectedDealers] = useState(['수성점', '분당점', '강남점'])
  const { kpiItems, targets, dealerScores, quarterlyNps, yearEndForecast, kpiDescriptions } = kpiDealerDummy

  const radarData = kpiItems.map(k => {
    const obj = { kpi: k }
    selectedDealers.forEach(d => {
      const row = dealerScores.find(r => r.dealer === d)
      if (row) obj[d] = row[k]
    })
    return obj
  })

  const toggleDealer = (dealer) => {
    setSelectedDealers(prev =>
      prev.includes(dealer)
        ? prev.filter(d => d !== dealer)
        : prev.length < 3 ? [...prev, dealer] : prev
    )
  }

  return (
    <div className="p-6 space-y-6">
      <PageHeader title="KPI 분석" description="딜러별 NPS·TCM·Trade-In·OP·AR·VC 실적 및 연말 예측 (더미 데이터)" />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-6">
        {kpiItems.map((k, i) => {
          const f = yearEndForecast[k]
          const onTrack = f.forecast >= f.target
          return (
            <div key={k} className="bg-white rounded-xl border border-gray-100 p-3 shadow-sm">
              <p className="text-[10px] text-gray-400 mb-0.5">{kpiDescriptions[k]}</p>
              <p className="text-xs font-semibold text-gray-500">{k}</p>
              <p className="text-xl font-bold text-gray-800 mt-1">{f.current}</p>
              <div className="flex items-center gap-1 mt-1">
                {onTrack ? <TrendingUp size={11} className="text-green-500" /> : <TrendingDown size={11} className="text-red-500" />}
                <span className={`text-[10px] ${onTrack ? 'text-green-600' : 'text-red-500'}`}>
                  예측 {f.forecast} / 목표 {f.target}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-1">딜러별 KPI 레이더 비교</h3>
          <p className="text-xs text-gray-400 mb-3">최대 3개 딜러 선택</p>
          <div className="flex flex-wrap gap-1.5 mb-4">
            {dealerScores.map((d, i) => (
              <button key={d.dealer} onClick={() => toggleDealer(d.dealer)}
                className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${selectedDealers.includes(d.dealer)
                  ? 'border-blue-500 bg-blue-50 text-blue-700 font-medium'
                  : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}>
                {d.dealer}
              </button>
            ))}
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <RadarChart data={radarData} cx="50%" cy="50%" outerRadius={90}>
              <PolarGrid stroke="#e5e7eb" />
              <PolarAngleAxis dataKey="kpi" tick={{ fontSize: 10 }} />
              {selectedDealers.map((dealer, i) => (
                <Radar key={dealer} name={dealer} dataKey={dealer}
                  stroke={COLORS[i]} fill={COLORS[i]} fillOpacity={0.1} />
              ))}
              <Legend />
              <Tooltip />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        <ChartCard title="분기별 NPS 추이" description="Lexus·Toyota·목표 비교">
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={quarterlyNps} margin={{ top: 8, right: 24, left: 0, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="quarter" tick={{ fontSize: 11 }} />
              <YAxis domain={[60, 95]} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <ReferenceLine y={85} stroke="#10b981" strokeDasharray="4 4"
                label={{ value: '목표 85', position: 'insideTopRight', fontSize: 10, fill: '#10b981' }} />
              <Line type="monotone" dataKey="lexus" stroke="#1e3a5f" strokeWidth={2.5} name="Lexus" dot={{ r: 4 }} />
              <Line type="monotone" dataKey="toyota" stroke="#dc2626" strokeWidth={2.5} name="Toyota" dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <ChartCard title="딜러별 KPI 종합 점수" description="목표 대비 현황 — 녹색: 목표 이상, 황색: 5% 미만 미달, 적색: 5% 이상 미달">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-3 py-2.5 text-left text-xs font-medium text-gray-500">딜러</th>
                <th className="px-3 py-2.5 text-left text-xs font-medium text-gray-500">브랜드</th>
                {kpiItems.map(k => (
                  <th key={k} className="px-3 py-2.5 text-center text-xs font-medium text-gray-500">{k}</th>
                ))}
                <th className="px-3 py-2.5 text-center text-xs font-medium text-gray-500">평균</th>
              </tr>
            </thead>
            <tbody>
              {dealerScores.map((d, i) => {
                const avg = (kpiItems.reduce((s, k) => s + d[k], 0) / kpiItems.length).toFixed(0)
                return (
                  <tr key={i} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="px-3 py-2.5 font-medium text-gray-800">{d.dealer}</td>
                    <td className="px-3 py-2.5 text-xs text-gray-500">{d.brand}</td>
                    {kpiItems.map(k => {
                      const gap = d[k] - targets[k]
                      const color = gap >= 0 ? 'bg-green-50 text-green-700' : gap >= -5 ? 'bg-yellow-50 text-yellow-700' : 'bg-red-50 text-red-600'
                      return (
                        <td key={k} className="px-3 py-2.5 text-center">
                          <span className={`inline-block px-1.5 py-0.5 rounded text-xs font-semibold ${color}`}>{d[k]}</span>
                        </td>
                      )
                    })}
                    <td className="px-3 py-2.5 text-center font-bold text-gray-700">{avg}</td>
                  </tr>
                )
              })}
              <tr className="border-t border-gray-200 bg-gray-50">
                <td colSpan={2} className="px-3 py-2 text-xs font-semibold text-gray-500">목표</td>
                {kpiItems.map(k => (
                  <td key={k} className="px-3 py-2 text-center text-xs font-bold text-blue-600">{targets[k]}</td>
                ))}
                <td />
              </tr>
            </tbody>
          </table>
        </div>
      </ChartCard>
    </div>
  )
}
