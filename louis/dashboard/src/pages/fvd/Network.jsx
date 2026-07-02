import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine
} from 'recharts'
import PageHeader from '../../components/PageHeader'
import ChartCard from '../../components/ChartCard'
import KPICard from '../../components/KPICard'
import { fvdNetworkDummy } from '../../data/dummy'

const BRANDS = ['lexus', 'toyota', 'bmw', 'benz', 'audi']
const BRAND_COLORS = { lexus: '#1e3a5f', toyota: '#dc2626', bmw: '#2563eb', benz: '#16a34a', audi: '#d97706' }

export default function FvdNetwork() {
  const { brandMarketShare, pmaDealerStatus, crMonthly } = fvdNetworkDummy

  const latestShare = brandMarketShare[brandMarketShare.length - 1]
  const avgDefense = (pmaDealerStatus.reduce((s, d) => s + d.defense_rate, 0) / pmaDealerStatus.length).toFixed(1)
  const latestCr = crMonthly[crMonthly.length - 1].self_cr

  return (
    <div className="p-6 space-y-6">
      <PageHeader title="네트워크/PMA/CR" description="브랜드 시장 점유율, PMA 판매·방어율, 서비스 CR 현황 분석 (더미 데이터)" />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KPICard title="Lexus 점유율" value={`${latestShare.lexus}%`} sub="수입 프리미엄 기준" variant="navy" />
        <KPICard title="Toyota 점유율" value={`${latestShare.toyota}%`} sub="수입차 전체 기준" variant="red" />
        <KPICard title="평균 PMA 방어율" value={`${avgDefense}%`} sub="딜러 평균" variant="green" />
        <KPICard title="자사 CR율" value={`${latestCr}%`} sub="목표 75%" variant="blue" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard title="브랜드별 시장 점유율 추이" description="분기별 신차 출고 점유율 (Kaida 데이터 기준, 더미)">
          <ResponsiveContainer width="100%" height={270}>
            <LineChart data={brandMarketShare} margin={{ top: 8, right: 16, left: 0, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="quarter" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${v}%`} />
              <Tooltip formatter={v => `${v}%`} />
              <Legend />
              {BRANDS.map(b => (
                <Line key={b} type="monotone" dataKey={b} stroke={BRAND_COLORS[b]} strokeWidth={b === 'lexus' || b === 'toyota' ? 2.5 : 1.5}
                  strokeDasharray={b === 'bmw' || b === 'benz' || b === 'audi' ? '4 4' : undefined}
                  name={b.charAt(0).toUpperCase() + b.slice(1)} dot={{ r: b === 'lexus' || b === 'toyota' ? 4 : 2 }} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="자사/타사 CR 월별 추이" description="서비스 입고 기준 (목표: 75%)">
          <ResponsiveContainer width="100%" height={270}>
            <BarChart data={crMonthly} margin={{ top: 8, right: 16, left: 0, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 10 }} />
              <YAxis tickFormatter={v => `${v}%`} domain={[0, 100]} tick={{ fontSize: 11 }} />
              <Tooltip formatter={v => `${v}%`} />
              <Legend />
              <ReferenceLine y={75} stroke="#1e3a5f" strokeDasharray="4 4"
                label={{ value: '목표 75%', position: 'insideTopRight', fontSize: 10, fill: '#1e3a5f' }} />
              <Bar dataKey="self_cr" stackId="a" fill="#1e3a5f" name="자사 CR" />
              <Bar dataKey="comp_cr" stackId="a" fill="#cbd5e1" name="타사 CR" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <ChartCard title="딜러별 PMA 판매·방어·공격율" description="PMA In: 자사 PMA 내 판매, PMA Out: 타 PMA 공략 (더미 데이터)">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                {['딜러', '지역', 'PMA 총판매', 'PMA In', 'PMA Out', '방어율', '공격율', '평가'].map(h => (
                  <th key={h} className="px-3 py-2.5 text-left text-xs font-medium text-gray-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pmaDealerStatus.map((d, i) => {
                const grade = d.defense_rate >= 85 ? { label: '우수', color: 'text-green-700 bg-green-50' }
                  : d.defense_rate >= 78 ? { label: '양호', color: 'text-blue-700 bg-blue-50' }
                  : { label: '개선필요', color: 'text-red-600 bg-red-50' }
                return (
                  <tr key={i} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="px-3 py-2.5 font-medium text-gray-800">{d.dealer}</td>
                    <td className="px-3 py-2.5 text-gray-500">{d.region}</td>
                    <td className="px-3 py-2.5">{d.pma_sales}</td>
                    <td className="px-3 py-2.5">{d.pma_in}</td>
                    <td className="px-3 py-2.5">{d.pma_out}</td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-1.5">
                        <div className="w-12 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-green-400 rounded-full" style={{ width: `${d.defense_rate}%` }} />
                        </div>
                        <span className="text-xs font-semibold">{d.defense_rate}%</span>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-xs text-gray-600">{d.attack_rate}%</td>
                    <td className="px-3 py-2.5">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${grade.color}`}>{grade.label}</span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </ChartCard>
    </div>
  )
}
