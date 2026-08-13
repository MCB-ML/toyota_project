import { useEffect, useState } from 'react'
import { Ticket, Users, AlertCircle, BarChart2 } from 'lucide-react'
import KPICard from '../components/KPICard'
import ChartCard from '../components/ChartCard'
import PageHeader from '../components/PageHeader'
import {
  BarChart, Bar, LineChart, Line, ComposedChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, Cell, ReferenceLine,
} from 'recharts'

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4']
const FMS_COLOR = '#3B82F6'
const PMS_COLOR = '#10B981'
const SMS_COLOR = '#F59E0B'

const CustomAgeTick = ({ x, y, payload }) => (
  <g transform={`translate(${x},${y})`}>
    <text x={0} y={0} dy={16} textAnchor="middle" fill="#6B7280" fontSize={12}>
      {payload.value}년차
    </text>
  </g>
)

export default function Coupon() {
  const [data, setData] = useState(null)

  useEffect(() => {
    fetch('/data/coupon.json').then(r => r.json()).then(setData)
  }, [])

  if (!data) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-400">데이터 로딩 중...</div>
      </div>
    )
  }

  const ageData = data.by_age.map(d => ({
    ...d,
    avg_remaining_ratio: +d.avg_remaining_ratio.toFixed(1),
    pct_has_remaining: +d.pct_has_remaining.toFixed(1),
    vehicle_count: Math.round(d.vehicle_count / 1000),
  }))

  const fmsDetailData = data.fms_detail.filter(d => d.FMS_GROUP === 'FMS').map(d => ({
    label: d.FMS_LABEL,
    count: d.count,
  }))
  const pmsDetailData = data.fms_detail.filter(d => d.FMS_GROUP === 'PMS').map(d => ({
    label: d.FMS_LABEL,
    count: d.count,
  }))

  const groupData = data.by_fms_group.filter(d => d.group !== '기타')

  return (
    <div className="p-6">
      <PageHeader
        title="쿠폰관리"
        description="FMS / PMS / SMS 서비스 쿠폰 사용 현황 및 CR 예측 (Agora + BPKTWS 기준)"
      />

      {/* KPI */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <KPICard
          title="총 FMS 서비스 건수"
          value={data.kpi.total_fms.toLocaleString()}
          sub={`${data.kpi.unique_vins.toLocaleString()}대 차량`}
          color="blue"
          icon={Ticket}
        />
        <KPICard
          title="FMS 사용 건수"
          value={data.kpi.fms_count.toLocaleString()}
          sub="표준 FMS (1~5차)"
          color="purple"
          icon={BarChart2}
        />
        <KPICard
          title="PMS 사용 건수"
          value={data.kpi.pms_count.toLocaleString()}
          sub="연장 PMS (6~11차)"
          color="green"
          icon={BarChart2}
        />
        <KPICard
          title="CR 타겟 차량"
          value={data.kpi.cr_targets.toLocaleString()}
          sub="잔여 쿠폰 보유 차량"
          color="orange"
          icon={AlertCircle}
        />
      </div>

      {/* 연차별 FMS 잔여비율 — 핵심 차트 */}
      <div className="mb-6">
        <ChartCard title="연차별 FMS 잔여비율 및 잔여쿠폰 보유 차량 비율">
          <ResponsiveContainer width="100%" height={260}>
            <ComposedChart data={ageData} margin={{ top: 10, right: 30, left: 0, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="VEHICLE_AGE_YEAR" tick={<CustomAgeTick />} />
              <YAxis
                yAxisId="left"
                unit="%"
                domain={[0, 110]}
                tick={{ fontSize: 11 }}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                unit="천대"
                tick={{ fontSize: 11 }}
              />
              <Tooltip
                formatter={(value, name) => {
                  if (name === '분석 차량 수') return [`${value}천대`, name]
                  return [`${value}%`, name]
                }}
              />
              <Legend />
              <Bar
                yAxisId="right"
                dataKey="vehicle_count"
                name="분석 차량 수"
                fill="#E5E7EB"
                radius={[3, 3, 0, 0]}
                barSize={30}
              />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="avg_remaining_ratio"
                name="평균 FMS 잔여비율"
                stroke="#3B82F6"
                strokeWidth={2.5}
                dot={{ r: 5, fill: '#3B82F6' }}
              />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="pct_has_remaining"
                name="잔여쿠폰 보유 차량 비율"
                stroke="#10B981"
                strokeWidth={2.5}
                strokeDasharray="5 3"
                dot={{ r: 4, fill: '#10B981' }}
              />
            </ComposedChart>
          </ResponsiveContainer>
          <p className="text-xs text-gray-400 mt-2 text-center">
            * FMS 표준 쿠폰 5회 기준 / 1연차 = 출고 후 1년
          </p>
        </ChartCard>
      </div>

      {/* Row 2 */}
      <div className="grid grid-cols-3 gap-6 mb-6">
        {/* FMS/PMS/SMS group */}
        <ChartCard title="서비스 유형별 건수 (FMS / PMS / SMS)">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={groupData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="group" tick={{ fontSize: 13, fontWeight: 600 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${(v / 10000).toFixed(0)}만`} />
              <Tooltip formatter={v => v.toLocaleString()} />
              <Bar dataKey="count" name="건수" radius={[5, 5, 0, 0]}>
                {groupData.map((d, i) => (
                  <Cell key={i} fill={d.group === 'FMS' ? FMS_COLOR : d.group === 'PMS' ? PMS_COLOR : SMS_COLOR} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* FMS 차수별 */}
        <ChartCard title="FMS 차수별 사용 건수 (1~5차)">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={fmsDetailData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${(v / 10000).toFixed(0)}만`} />
              <Tooltip formatter={v => v.toLocaleString()} />
              <Bar dataKey="count" name="건수" fill={FMS_COLOR} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* PMS 차수별 */}
        <ChartCard title="PMS 차수별 사용 건수 (1~6차)">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={pmsDetailData.slice(0, 6)} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${(v / 10000).toFixed(0)}만`} />
              <Tooltip formatter={v => v.toLocaleString()} />
              <Bar dataKey="count" name="건수" fill={PMS_COLOR} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Row 3 — monthly trend + CR by age */}
      <div className="grid grid-cols-2 gap-6">
        {/* Monthly trend */}
        <ChartCard title="월별 FMS 서비스 건수 추이 (최근 12개월)">
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
                name="FMS 건수"
                stroke="#3B82F6"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* CR target by age */}
        <ChartCard title="연차별 CR 타겟 차량 수 (잔여쿠폰 보유)">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart
              data={data.cr_by_age}
              margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="VEHICLE_AGE_YEAR" tick={{ fontSize: 11 }} tickFormatter={v => `${v}년차`} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${(v / 10000).toFixed(0)}만`} />
              <Tooltip
                formatter={v => v.toLocaleString()}
                labelFormatter={v => `${v}연차`}
              />
              <Bar dataKey="count" name="CR 타겟" fill="#EF4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-3 p-3 bg-orange-50 rounded-lg border border-orange-100">
            <p className="text-xs text-orange-700 font-medium">
              총 CR 타겟: {data.kpi.cr_targets.toLocaleString()}대
              &nbsp;— 잔여 FMS 쿠폰 보유 + 다음 1년 내 사용 확률이 낮은 차량 (LightGBM 예측)
            </p>
          </div>
        </ChartCard>
      </div>
    </div>
  )
}
