import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Truck, FileText, Ticket, TrendingUp, Car, Users } from 'lucide-react'
import KPICard from '../components/KPICard'
import ChartCard from '../components/ChartCard'
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts'

const COLORS = ['#3B82F6', '#EB0A1E', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899']

export default function Home() {
  const [inv, setInv] = useState(null)
  const [con, setCon] = useState(null)
  const [coup, setCoup] = useState(null)

  useEffect(() => {
    fetch('/data/inventory.json').then(r => r.json()).then(setInv)
    fetch('/data/contract.json').then(r => r.json()).then(setCon)
    fetch('/data/coupon.json').then(r => r.json()).then(setCoup)
  }, [])

  if (!inv || !con || !coup) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-400">데이터 로딩 중...</div>
      </div>
    )
  }

  const brandData = [
    { name: 'Lexus', value: inv.kpi.lexus },
    { name: 'Toyota', value: inv.kpi.toyota },
  ]

  const fmsGroupData = coup.by_fms_group.filter(d => d.group !== '기타')

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-800">대시보드 홈</h1>
        <p className="text-sm text-gray-500 mt-1">Toyota / Lexus 데이터 통합 현황</p>
      </div>

      {/* Quick Nav */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { to: '/inventory', label: '재고관리', desc: '차량 현황', icon: Truck, color: 'bg-blue-600' },
          { to: '/contract', label: '계약관리', desc: '계약 현황', icon: FileText, color: 'bg-emerald-600' },
          { to: '/coupon', label: '쿠폰관리', desc: 'FMS/PMS/SMS', icon: Ticket, color: 'bg-purple-600' },
        ].map(({ to, label, desc, icon: Icon, color }) => (
          <Link
            key={to}
            to={to}
            className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow flex items-center gap-4"
          >
            <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center`}>
              <Icon size={24} className="text-white" />
            </div>
            <div>
              <p className="font-semibold text-gray-800">{label}</p>
              <p className="text-xs text-gray-500">{desc}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* KPI Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <KPICard
          title="총 등록 차량"
          value={inv.kpi.total.toLocaleString()}
          sub="Lexus + Toyota"
          color="blue"
          icon={Car}
        />
        <KPICard
          title="총 계약 건수"
          value={con.kpi.total.toLocaleString()}
          sub="출고완료 포함"
          color="green"
          icon={FileText}
        />
        <KPICard
          title="FMS 서비스 건수"
          value={coup.kpi.total_fms.toLocaleString()}
          sub="Agora + BPKTWS"
          color="purple"
          icon={Ticket}
        />
        <KPICard
          title="CR 타겟 차량"
          value={coup.kpi.cr_targets.toLocaleString()}
          sub="잔여 쿠폰 보유"
          color="orange"
          icon={Users}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-2 gap-6">
        {/* Brand split */}
        <ChartCard title="브랜드별 차량 비율">
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={brandData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={85}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {brandData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i]} />
                ))}
              </Pie>
              <Tooltip formatter={v => v.toLocaleString()} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* FMS Group */}
        <ChartCard title="FMS/PMS/SMS 서비스 현황">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={fmsGroupData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="group" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${(v / 10000).toFixed(0)}만`} />
              <Tooltip formatter={v => v.toLocaleString()} />
              <Bar dataKey="count" name="건수" radius={[4, 4, 0, 0]}>
                {fmsGroupData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Monthly contract trend */}
        <ChartCard title="월별 계약 건수 추이 (최근 12개월)" className="col-span-2">
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={con.by_month.slice(-12)} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => v.toLocaleString()} />
              <Tooltip formatter={v => v.toLocaleString()} />
              <Line type="monotone" dataKey="count" name="계약 건수" stroke="#10B981" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  )
}
