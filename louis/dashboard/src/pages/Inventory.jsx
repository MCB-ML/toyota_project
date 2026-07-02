import { useEffect, useState } from 'react'
import { Car, TrendingUp, Award, CalendarCheck } from 'lucide-react'
import KPICard from '../components/KPICard'
import ChartCard from '../components/ChartCard'
import PageHeader from '../components/PageHeader'
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts'

const COLORS = ['#3B82F6', '#EB0A1E', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16']

const MODEL_LABEL = {
  ES: 'ES (렉서스)', NX: 'NX (렉서스)', RX: 'RX (렉서스)', UX: 'UX (렉서스)',
  LC: 'LC (렉서스)', LS: 'LS (렉서스)', LX: 'LX (렉서스)', RC: 'RC (렉서스)',
  CAM: 'Camry', RAV: 'RAV4', PRI: 'Prius', CHR: 'C-HR',
  HI: 'Highlander', CAR: 'Corolla', VEL: 'Vellfire',
}

export default function Inventory() {
  const [data, setData] = useState(null)

  useEffect(() => {
    fetch('/data/inventory.json').then(r => r.json()).then(setData)
  }, [])

  if (!data) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-400">데이터 로딩 중...</div>
      </div>
    )
  }

  const modelData = data.by_model.map(d => ({
    ...d,
    label: MODEL_LABEL[d.model] || d.model,
  }))

  const foData = [
    { name: '최초소유', value: data.first_owner_dist['최초소유'] },
    { name: '비최초소유', value: data.first_owner_dist['비최초소유'] },
  ]

  return (
    <div className="p-6">
      <PageHeader
        title="재고관리"
        description="등록 차량 현황 및 출고 통계 (Karete 통합 데이터 기준)"
      />

      {/* KPI */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <KPICard
          title="총 등록 차량"
          value={data.kpi.total.toLocaleString()}
          sub="Lexus + Toyota"
          color="blue"
          icon={Car}
        />
        <KPICard
          title="Lexus"
          value={data.kpi.lexus.toLocaleString()}
          sub={`전체의 ${((data.kpi.lexus / data.kpi.total) * 100).toFixed(0)}%`}
          color="navy"
          icon={Award}
        />
        <KPICard
          title="Toyota"
          value={data.kpi.toyota.toLocaleString()}
          sub={`전체의 ${((data.kpi.toyota / data.kpi.total) * 100).toFixed(0)}%`}
          color="red"
          icon={Car}
        />
        <KPICard
          title="최초소유 차량"
          value={data.kpi.first_owner.toLocaleString()}
          sub={`전체의 ${((data.kpi.first_owner / data.kpi.total) * 100).toFixed(0)}%`}
          color="green"
          icon={CalendarCheck}
        />
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-3 gap-6 mb-6">
        {/* Top models bar */}
        <ChartCard title="차종별 등록 대수 (상위 15)" className="col-span-2">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={modelData}
              layout="vertical"
              margin={{ top: 0, right: 30, left: 60, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={v => `${(v / 10000).toFixed(0)}만`} />
              <YAxis type="category" dataKey="label" tick={{ fontSize: 11 }} width={90} />
              <Tooltip formatter={v => v.toLocaleString()} />
              <Bar dataKey="count" name="대수" fill="#3B82F6" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Ownership pie */}
        <ChartCard title="최초 소유 비율">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={foData}
                cx="50%"
                cy="45%"
                innerRadius={60}
                outerRadius={90}
                dataKey="value"
                label={({ name, percent }) => `${name}\n${(percent * 100).toFixed(0)}%`}
              >
                {foData.map((_, i) => (
                  <Cell key={i} fill={i === 0 ? '#3B82F6' : '#E5E7EB'} />
                ))}
              </Pie>
              <Tooltip formatter={v => v.toLocaleString()} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-2 gap-6">
        {/* Delivery by year */}
        <ChartCard title="연도별 출고 대수 추이 (2015~2026)">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data.by_year} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="year" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${(v / 10000).toFixed(0)}만`} />
              <Tooltip formatter={v => v.toLocaleString()} />
              <Bar dataKey="count" name="출고 대수" fill="#10B981" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Model year distribution */}
        <ChartCard title="모델연도별 차량 분포">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data.by_model_year} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="model_year" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${(v / 10000).toFixed(0)}만`} />
              <Tooltip formatter={v => v.toLocaleString()} />
              <Bar dataKey="count" name="대수" fill="#8B5CF6" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  )
}
