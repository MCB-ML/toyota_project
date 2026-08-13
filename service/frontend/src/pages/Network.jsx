import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine
} from 'recharts'
import PageHeader from '../components/PageHeader'
import ChartCard from '../components/ChartCard'
import KPICard from '../components/KPICard'
import { networkDummy } from '../data/dummy'
import { MapPin, TrendingUp, Building2 } from 'lucide-react'

const COVERAGE_CONFIG = {
  높음: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
  보통: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  낮음: { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-200' },
}

export default function Network() {
  const { brandMarketShare, pmaRateByRegion, crTrend, networkExpansionPlan } = networkDummy

  const totalDealers = pmaRateByRegion.reduce((s, r) => s + r.dealers, 0)
  const avgPma = (pmaRateByRegion.reduce((s, r) => s + r.pma_rate, 0) / pmaRateByRegion.length).toFixed(1)
  const latestCr = crTrend[crTrend.length - 1].cr_rate
  const latestShare = brandMarketShare[brandMarketShare.length - 1]

  return (
    <div className="p-6 space-y-6">
      <PageHeader title="네트워크 현황" description="딜러 네트워크 PMA 커버리지, CR 추이, 브랜드 점유율 (더미 데이터)" />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KPICard title="총 딜러수" value={`${totalDealers}개`} sub="전국 기준" variant="blue" />
        <KPICard title="평균 PMA 달성률" value={`${avgPma}%`} sub="지역 평균" variant="green" />
        <KPICard title="최근 CR율" value={`${latestCr}%`} sub="목표 75%" variant="purple" />
        <KPICard title="시장 점유율" value={`${(latestShare.lexus + latestShare.toyota).toFixed(1)}%`}
          sub={`Lexus ${latestShare.lexus}% + Toyota ${latestShare.toyota}%`} variant="navy" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard title="브랜드별 시장 점유율 추이" description="분기별 판매 점유율 (더미 데이터)">
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={brandMarketShare} margin={{ top: 8, right: 16, left: 0, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="quarter" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${v}%`} domain={[0, 5]} />
              <Tooltip formatter={(v) => `${v}%`} />
              <Legend />
              <Line type="monotone" dataKey="lexus" stroke="#1e3a5f" strokeWidth={2.5} name="Lexus" dot={{ r: 4 }} />
              <Line type="monotone" dataKey="toyota" stroke="#dc2626" strokeWidth={2.5} name="Toyota" dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="CR율 월별 추이" description="월별 고객 재방문율 vs 목표 75%">
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={crTrend} margin={{ top: 8, right: 16, left: 0, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${v}%`} domain={[60, 80]} />
              <Tooltip formatter={(v) => `${v}%`} />
              <Legend />
              <ReferenceLine y={75} stroke="#10b981" strokeDasharray="4 4"
                label={{ value: '목표 75%', position: 'right', fontSize: 10, fill: '#10b981' }} />
              <Line type="monotone" dataKey="cr_rate" stroke="#1e3a5f" strokeWidth={2.5} name="CR율" dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <ChartCard title="지역별 PMA 달성률" description="딜러 수 및 PMA 커버리지 현황">
        <div className="grid grid-cols-1 gap-2 py-2 sm:grid-cols-2">
          {pmaRateByRegion.map((r, i) => {
            const cfg = COVERAGE_CONFIG[r.coverage]
            return (
              <div key={i} className={`flex items-center gap-4 rounded-xl px-4 py-3 border ${cfg.bg} ${cfg.border}`}>
                <MapPin size={15} className={cfg.text} />
                <div className="flex-1">
                  <div className="flex justify-between items-center">
                    <span className={`text-sm font-semibold ${cfg.text}`}>{r.region}</span>
                    <span className="text-xs text-gray-500">{r.dealers}개 딜러</span>
                  </div>
                  <div className="mt-1.5 h-1.5 bg-white rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${r.pma_rate >= 85 ? 'bg-green-500' : r.pma_rate >= 75 ? 'bg-blue-500' : 'bg-red-400'}`}
                      style={{ width: `${r.pma_rate}%` }} />
                  </div>
                </div>
                <span className={`text-sm font-bold w-12 text-right ${cfg.text}`}>{r.pma_rate}%</span>
              </div>
            )
          })}
        </div>
      </ChartCard>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        <div className="flex items-center gap-2 mb-4">
          <Building2 size={16} className="text-blue-600" />
          <h3 className="text-sm font-semibold text-gray-700">딜러 네트워크 확장 계획</h3>
          <span className="text-xs text-gray-400">(더미 데이터)</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                {['연도', '계획 개소', '오픈 완료', '대상 지역', '상태'].map(h => (
                  <th key={h} className="px-4 py-2.5 text-left text-xs font-medium text-gray-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {networkExpansionPlan.map((row, i) => (
                <tr key={i} className="border-t border-gray-100">
                  <td className="px-4 py-3 font-semibold text-gray-800">{row.year}</td>
                  <td className="px-4 py-3 text-gray-700">{row.planned}개</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${row.opened > 0 ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {row.opened}개
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600 text-xs">{row.region}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${row.opened >= row.planned ? 'bg-green-50 text-green-700' : row.opened > 0 ? 'bg-yellow-50 text-yellow-700' : 'bg-gray-100 text-gray-500'}`}>
                      {row.opened >= row.planned ? '완료' : row.opened > 0 ? '진행중' : '예정'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
