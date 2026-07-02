import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts'
import PageHeader from '../../components/PageHeader'
import ChartCard from '../../components/ChartCard'
import KPICard from '../../components/KPICard'
import { paymentDummy } from '../../data/dummy'

const CARD_COLORS = ['#1e3a5f', '#2563eb', '#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe']

export default function PaymentMgmt() {
  const { monthlySummary, cardCompanyBreakdown, dealerCardUsage } = paymentDummy

  const latestMonth = monthlySummary[monthlySummary.length - 1]
  const totalFee = cardCompanyBreakdown.reduce((s, c) => s + c.fee_amount, 0)
  const totalCardAmount = cardCompanyBreakdown.reduce((s, c) => s + c.amount, 0)
  const avgFeeRate = (cardCompanyBreakdown.reduce((s, c) => s + c.fee_rate * c.amount, 0) / totalCardAmount).toFixed(2)

  return (
    <div className="p-6 space-y-6">
      <PageHeader title="카드결제 관리" description="딜러별·카드사별 카드 사용 현황 및 수수료 분석 (더미 데이터)" />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KPICard title="이번달 카드 결제액" value={`${latestMonth.card.toLocaleString()}백만`} sub={`판매액 대비 ${latestMonth.ratio}%`} variant="blue" />
        <KPICard title="카드결제 비중" value={`${latestMonth.ratio}%`} sub="전월 대비 +0.8%p" variant="green" />
        <KPICard title="총 카드 수수료" value={`${totalFee.toFixed(0)}백만`} sub="이번달 기준" variant="red" />
        <KPICard title="평균 수수료율" value={`${avgFeeRate}%`} sub="카드사 가중평균" variant="purple" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard title="월별 판매액 대비 카드결제 추이" description="단위: 백만원">
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={monthlySummary} margin={{ top: 8, right: 16, left: 0, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${(v / 1000).toFixed(0)}K`} />
              <Tooltip formatter={v => `${v.toLocaleString()}백만`} />
              <Legend />
              <Line type="monotone" dataKey="sales" stroke="#94a3b8" strokeWidth={2} strokeDasharray="5 5" name="총 판매액" dot={false} />
              <Line type="monotone" dataKey="card" stroke="#1e3a5f" strokeWidth={2.5} name="카드결제액" dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="카드사별 결제 비중" description="이번달 기준">
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={cardCompanyBreakdown} cx="50%" cy="50%" innerRadius={55} outerRadius={85}
                dataKey="amount" nameKey="company"
                label={({ company, percent }) => `${company} ${(percent * 100).toFixed(0)}%`}
                labelLine={false}>
                {cardCompanyBreakdown.map((_, i) => <Cell key={i} fill={CARD_COLORS[i]} />)}
              </Pie>
              <Tooltip formatter={v => `${v.toLocaleString()}백만`} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <ChartCard title="카드사별 수수료 분석" description="결제금액·수수료율·수수료 금액 (더미 데이터)">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                {['카드사', '결제금액 (백만)', '수수료율 (%)', '수수료 금액 (백만)', '비중'].map(h => (
                  <th key={h} className="px-4 py-2.5 text-left text-xs font-medium text-gray-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cardCompanyBreakdown.map((c, i) => (
                <tr key={i} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-2.5 font-medium text-gray-800">{c.company}</td>
                  <td className="px-4 py-2.5">{c.amount.toLocaleString()}</td>
                  <td className="px-4 py-2.5">
                    <span className={`font-semibold ${c.fee_rate > 2.0 ? 'text-red-500' : 'text-gray-700'}`}>{c.fee_rate}%</span>
                  </td>
                  <td className="px-4 py-2.5">{c.fee_amount.toFixed(1)}</td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-blue-400"
                          style={{ width: `${(c.amount / totalCardAmount) * 100}%` }} />
                      </div>
                      <span className="text-xs text-gray-500">{((c.amount / totalCardAmount) * 100).toFixed(0)}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ChartCard>

      <ChartCard title="딜러별 카드 사용 현황" description="카드결제액 및 대당 수수료 (더미 데이터)">
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={dealerCardUsage} margin={{ top: 8, right: 16, left: 0, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="dealer" tick={{ fontSize: 11 }} angle={-20} textAnchor="end" />
            <YAxis yAxisId="left" tick={{ fontSize: 11 }} tickFormatter={v => `${v}백만`} />
            <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} tickFormatter={v => `${v}%`} domain={[60, 90]} />
            <Tooltip />
            <Legend />
            <Bar yAxisId="left" dataKey="amount" fill="#1e3a5f" name="결제액(백만)" radius={[4, 4, 0, 0]} />
            <Line yAxisId="right" type="monotone" dataKey="ratio" stroke="#f59e0b" strokeWidth={2} name="비중(%)" dot={{ r: 4 }} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  )
}
