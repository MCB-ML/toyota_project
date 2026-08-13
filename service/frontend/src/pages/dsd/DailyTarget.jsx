import {
  ComposedChart, Bar, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine
} from 'recharts'
import PageHeader from '../../components/PageHeader'
import ChartCard from '../../components/ChartCard'
import KPICard from '../../components/KPICard'
import { dsdTargetDummy } from '../../data/dummy'
import { CheckCircle, Target } from 'lucide-react'

export default function DsdDailyTarget() {
  const { dailyContractTrend, modelDailyTarget, automationStats } = dsdTargetDummy

  const totalContracts = dailyContractTrend.reduce((s, d) => s + (d.contract || 0), 0)
  const totalTarget = dailyContractTrend.reduce((s, d) => s + (d.target || 0), 0)
  const achieveRate = ((totalContracts / totalTarget) * 100).toFixed(1)

  return (
    <div className="p-6 space-y-6">
      <PageHeader title="일별 타겟 분배" description="모델별 일별 계약·판매 타겟 자동 분배 및 달성 현황 모니터링 (더미 데이터)" />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KPICard title="월 타겟" value={automationStats.total_monthly_target.toLocaleString()} sub="전체 모델 합계" variant="blue" />
        <KPICard title="자동 분배 비율" value={`${automationStats.accuracy_rate}%`} sub={`수기 조정 ${automationStats.manual_adjusted}건`} variant="green" />
        <KPICard title="이번달 계약 달성률" value={`${achieveRate}%`} sub="일별 누적 기준" variant="purple" />
        <KPICard title="평균 일별 오차" value={`${automationStats.avg_deviation}%`} sub="타겟 vs 실제 편차" variant="navy" />
      </div>

      <ChartCard title="일별 계약·출고 추이" description="11월 기준 (주말: 회색 배경 구간)">
        <ResponsiveContainer width="100%" height={280}>
          <ComposedChart data={dailyContractTrend} margin={{ top: 8, right: 16, left: 0, bottom: 16 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="day" tick={{ fontSize: 9 }} interval={1} angle={-45} textAnchor="end" />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Legend />
            <Bar dataKey="target" fill="#e2e8f0" name="일별 타겟" radius={[2, 2, 0, 0]} />
            <Bar dataKey="contract" fill="#1e3a5f" name="계약" radius={[2, 2, 0, 0]} />
            <Line type="monotone" dataKey="delivery" stroke="#10b981" strokeWidth={1.5} name="출고" dot={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="모델별 타겟 분배 현황" description="월 타겟 → 일평균/주말/평일 자동 분배 (더미 데이터)">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                {['모델', '월 목표', '일평균', '주말 평균', '평일 평균', '주말배율', '상태'].map(h => (
                  <th key={h} className="px-4 py-2.5 text-left text-xs font-medium text-gray-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {modelDailyTarget.map((m, i) => {
                const ratio = (m.weekend_avg / m.weekday_avg).toFixed(1)
                return (
                  <tr key={i} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-2.5 font-medium text-gray-800">{m.model}</td>
                    <td className="px-4 py-2.5">{m.monthly}</td>
                    <td className="px-4 py-2.5 font-semibold text-blue-700">{m.daily_avg}</td>
                    <td className="px-4 py-2.5 text-green-600">{m.weekend_avg}</td>
                    <td className="px-4 py-2.5 text-gray-600">{m.weekday_avg}</td>
                    <td className="px-4 py-2.5">
                      <span className="text-xs font-semibold text-orange-600">×{ratio}</span>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="flex items-center gap-1 text-xs text-green-600">
                        <CheckCircle size={12} />자동분배
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </ChartCard>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {[
          { label: '총 월 타겟', value: automationStats.total_monthly_target.toLocaleString(), sub: '모델 합계', color: 'bg-blue-50 border-blue-200' },
          { label: '자동 분배', value: automationStats.auto_distributed.toLocaleString(), sub: `전체의 ${automationStats.accuracy_rate}%`, color: 'bg-green-50 border-green-200' },
          { label: '수기 조정', value: automationStats.manual_adjusted.toString(), sub: `편차 avg ${automationStats.avg_deviation}%`, color: 'bg-yellow-50 border-yellow-200' },
        ].map((c, i) => (
          <div key={i} className={`rounded-2xl border p-5 ${c.color}`}>
            <p className="text-xs text-gray-500 mb-1">{c.label}</p>
            <p className="text-2xl font-bold text-gray-800">{c.value}</p>
            <p className="text-xs text-gray-400 mt-1">{c.sub}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
