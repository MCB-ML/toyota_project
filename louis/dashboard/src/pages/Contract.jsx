import { useEffect, useState } from 'react'
import { FileText, CheckCircle, CalendarCheck, TrendingUp } from 'lucide-react'
import KPICard from '../components/KPICard'
import ChartCard from '../components/ChartCard'
import PageHeader from '../components/PageHeader'
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts'

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16']

export default function Contract() {
  const [data, setData] = useState(null)

  useEffect(() => {
    fetch('/data/contract.json').then(r => r.json()).then(setData)
  }, [])

  if (!data) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-400">데이터 로딩 중...</div>
      </div>
    )
  }

  const completionRate = ((data.kpi.completed / data.kpi.total) * 100).toFixed(1)

  const brandData = data.by_brand.map(d => ({
    name: d.brand === 'Lexus' ? 'Lexus' : d.brand === 'Toyota' ? 'Toyota' : d.brand,
    value: d.count,
  }))

  const salesTypeTop = data.by_sales_type.slice(0, 6)

  return (
    <div className="p-6">
      <PageHeader
        title="계약관리"
        description="차량 계약 및 출고 현황 (Karete 통합 데이터 기준)"
      />

      {/* KPI */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <KPICard
          title="총 계약 건수"
          value={data.kpi.total.toLocaleString()}
          sub="전체 이력"
          color="blue"
          icon={FileText}
        />
        <KPICard
          title="출고 완료"
          value={data.kpi.completed.toLocaleString()}
          sub={`완료율 ${completionRate}%`}
          color="green"
          icon={CheckCircle}
        />
        <KPICard
          title="Lexus 계약"
          value={data.kpi.lexus.toLocaleString()}
          sub={`전체의 ${((data.kpi.lexus / data.kpi.total) * 100).toFixed(0)}%`}
          color="navy"
          icon={FileText}
        />
        <KPICard
          title="Toyota 계약"
          value={data.kpi.toyota.toLocaleString()}
          sub={`전체의 ${((data.kpi.toyota / data.kpi.total) * 100).toFixed(0)}%`}
          color="red"
          icon={TrendingUp}
        />
      </div>

      {/* Monthly trend - full width */}
      <div className="mb-6">
        <ChartCard title="월별 계약 건수 추이 (최근 12개월)">
          <ResponsiveContainer width="100%" height={220}>
            <LineChart
              data={data.by_month.slice(-12)}
              margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => v.toLocaleString()} />
              <Tooltip formatter={v => v.toLocaleString()} />
              <Line
                type="monotone"
                dataKey="count"
                name="계약 건수"
                stroke="#3B82F6"
                strokeWidth={2.5}
                dot={{ r: 4, fill: '#3B82F6' }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Row 2 */}
      <div className="grid grid-cols-3 gap-6 mb-6">
        {/* Top models */}
        <ChartCard title="차종별 계약 건수 (상위 10)" className="col-span-2">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart
              data={data.by_model.slice(0, 10)}
              layout="vertical"
              margin={{ top: 0, right: 30, left: 70, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={v => `${(v / 10000).toFixed(0)}만`} />
              <YAxis type="category" dataKey="model" tick={{ fontSize: 11 }} width={90} />
              <Tooltip formatter={v => v.toLocaleString()} />
              <Bar dataKey="count" name="계약 건수" fill="#10B981" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Brand pie */}
        <ChartCard title="브랜드별 계약 비율">
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={brandData}
                cx="50%"
                cy="40%"
                innerRadius={55}
                outerRadius={85}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                labelLine={true}
              >
                {brandData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i]} />
                ))}
              </Pie>
              <Tooltip formatter={v => v.toLocaleString()} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Row 3 */}
      <div className="grid grid-cols-2 gap-6">
        {/* By year */}
        <ChartCard title="연도별 계약 건수 추이 (2015~2026)">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data.by_year} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="year" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${(v / 10000).toFixed(0)}만`} />
              <Tooltip formatter={v => v.toLocaleString()} />
              <Bar dataKey="count" name="계약 건수" fill="#3B82F6" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* By status */}
        <ChartCard title="계약 상태별 분포">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart
              data={data.by_status.slice(0, 6)}
              margin={{ top: 5, right: 20, left: 0, bottom: 30 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="stat" tick={{ fontSize: 11 }} angle={-20} textAnchor="end" />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${(v / 10000).toFixed(0)}만`} />
              <Tooltip formatter={v => v.toLocaleString()} />
              <Bar dataKey="count" name="건수" radius={[3, 3, 0, 0]}>
                {data.by_status.slice(0, 6).map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  )
}
