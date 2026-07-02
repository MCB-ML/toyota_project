import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import PageHeader from '../../components/PageHeader'
import ChartCard from '../../components/ChartCard'
import KPICard from '../../components/KPICard'
import { dsdStockDummy } from '../../data/dummy'
import { AlertTriangle, Package, TrendingUp } from 'lucide-react'

const STATUS_CFG = {
  critical: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-600', label: '심각부족' },
  shortage: { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-600', label: '부족' },
  ok: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', label: '정상' },
  surplus: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', label: '과잉' },
}
const PIE_COLORS = ['#1e3a5f', '#2563eb', '#3b82f6', '#60a5fa', '#93c5fd', '#cbd5e1']

export default function DsdStockMatch() {
  const { sfxContractRatio, colorDistribution, contractChangeTrend } = dsdStockDummy

  const critical = sfxContractRatio.filter(s => s.status === 'critical').length
  const shortage = sfxContractRatio.filter(s => s.status === 'shortage').length
  const avgWait = (sfxContractRatio.reduce((s, d) => s + d.wait_days, 0) / sfxContractRatio.length).toFixed(0)

  return (
    <div className="p-6 space-y-6">
      <PageHeader title="계약/재고 매칭" description="SFX·Color별 계약 현황 및 Matching Stock 분석 — 언매치 리스크 사전 방지 (더미 데이터)" />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KPICard title="심각 부족 SFX" value={`${critical}개`} sub="대기 70일 이상" variant="red" />
        <KPICard title="부족 SFX" value={`${shortage}개`} sub="대기 30~69일" variant="orange" />
        <KPICard title="평균 예상 대기일" value={`${avgWait}일`} sub="전 SFX 평균" variant="blue" />
        <KPICard title="계약 변경 건수" value={contractChangeTrend[contractChangeTrend.length - 1].changes.toString()} sub="이번달 (SFX+Color)" variant="purple" />
      </div>

      <ChartCard title="SFX별 계약·재고 현황 및 예상 대기일" description="재고 현황 vs 계약 수요 — 색상으로 위험도 표시 (더미)">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                {['SFX', '계약 대수', '현재 재고', '예상 대기(일)', '상태'].map(h => (
                  <th key={h} className="px-4 py-2.5 text-left text-xs font-medium text-gray-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sfxContractRatio.map((s, i) => {
                const cfg = STATUS_CFG[s.status]
                const matchRate = ((s.stock / s.contracts) * 100).toFixed(0)
                return (
                  <tr key={i} className={`border-t border-gray-100 hover:opacity-90 ${s.status === 'critical' ? 'bg-red-50/30' : ''}`}>
                    <td className="px-4 py-2.5 font-medium text-gray-800 text-xs">{s.sfx}</td>
                    <td className="px-4 py-2.5">{s.contracts}</td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${Number(matchRate) >= 20 ? 'bg-green-400' : Number(matchRate) >= 10 ? 'bg-yellow-400' : 'bg-red-400'}`}
                            style={{ width: `${Math.min(100, matchRate * 3)}%` }} />
                        </div>
                        <span>{s.stock} ({matchRate}%)</span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={`font-semibold ${s.wait_days >= 60 ? 'text-red-500' : s.wait_days >= 30 ? 'text-orange-500' : 'text-gray-700'}`}>
                        {s.wait_days}일
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
                        {cfg.label}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </ChartCard>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard title="Color 계약 비중" description="이번달 전체 계약 기준">
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={colorDistribution} cx="50%" cy="50%" innerRadius={55} outerRadius={85}
                dataKey="pct" nameKey="color"
                label={({ color, pct }) => `${color} ${pct}%`} labelLine={false}>
                {colorDistribution.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
              </Pie>
              <Tooltip formatter={v => `${v}%`} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="계약 변경 이력 추이" description="SFX·Color 변경 건수 월별 추이">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={contractChangeTrend} margin={{ top: 8, right: 16, left: 0, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="sfx_change" fill="#1e3a5f" name="SFX 변경" radius={[4, 4, 0, 0]} stackId="a" />
              <Bar dataKey="color_change" fill="#60a5fa" name="Color 변경" radius={[4, 4, 0, 0]} stackId="a" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  )
}
