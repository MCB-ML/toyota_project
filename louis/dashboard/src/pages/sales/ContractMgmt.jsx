import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import PageHeader from '../../components/PageHeader'
import ChartCard from '../../components/ChartCard'
import KPICard from '../../components/KPICard'
import { contractMgmtDummy } from '../../data/dummy'
import { AlertTriangle, CheckCircle, TrendingDown, TrendingUp, Building2, Store } from 'lucide-react'
import { useUser } from '../../auth/UserContext'
import { filterByDealerAccess } from '../../auth/access'

const RISK_CFG = {
  ok: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', Icon: CheckCircle },
  warning: { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-700', Icon: AlertTriangle },
  danger: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-600', Icon: AlertTriangle },
}

export default function ContractMgmt() {
  const { user } = useUser()
  const { dealerTargetStatus, dealerSfxDetail, monthlyContractTrend, trafficTrend, riskAlerts } = contractMgmtDummy

  // 본사 계정 → 전체 딜러, 딜러사 계정 → 본인 dealerId 행만. 다른 딜러/계열사 데이터는 여기서 걸러진다.
  const visibleDealerStatus = filterByDealerAccess(dealerTargetStatus, user)
  const visibleSfxDetail = filterByDealerAccess(dealerSfxDetail, user)
  const visibleRiskAlerts = filterByDealerAccess(riskAlerts, user)

  const totalTarget = visibleDealerStatus.reduce((s, d) => s + d.target, 0)
  const totalContract = visibleDealerStatus.reduce((s, d) => s + d.contract, 0)
  const totalDelivery = visibleDealerStatus.reduce((s, d) => s + d.delivery, 0)
  const riskCount = visibleDealerStatus.filter(d => d.risk !== 'ok').length

  return (
    <div className="p-6 space-y-6">
      <PageHeader title="계약/출고 관리" description="딜러별·SFX별 월타겟 달성 예측 및 리스크 모니터링 (더미 데이터 포함)" />

      <div className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-medium border
        ${user.role === 'hq' ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-amber-50 border-amber-200 text-amber-700'}`}>
        {user.role === 'hq' ? <Building2 size={14} /> : <Store size={14} />}
        {user.role === 'hq'
          ? '현재 보기: 본사 계정 — 전체 딜러사 데이터를 조회 중입니다.'
          : `현재 보기: ${user.dealer} 계정 (${user.group}) — 본인 딜러사 데이터만 조회 가능하며, 다른 딜러사·계열사 데이터는 조회되지 않습니다.`}
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KPICard title="이번달 계약 목표" value={totalTarget.toLocaleString()} sub="딜러 합계" variant="blue" />
        <KPICard title="현재 계약 건수" value={totalContract.toLocaleString()} sub={`달성률 ${((totalContract / totalTarget) * 100).toFixed(0)}%`} variant="green" />
        <KPICard title="출고 완료" value={totalDelivery.toLocaleString()} sub={`계약 대비 ${((totalDelivery / totalContract) * 100).toFixed(0)}%`} variant="purple" />
        <KPICard title="위험 딜러" value={`${riskCount}개`} sub="목표 미달 위험" variant="red" />
      </div>

      {user.role === 'hq' ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <ChartCard title="월별 계약/출고 추이" description="2024년 누적 · 전체 딜러 합계 (본사 전용)">
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={monthlyContractTrend} margin={{ top: 8, right: 16, left: 0, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${(v / 1000).toFixed(1)}K`} />
                <Tooltip formatter={v => v.toLocaleString()} />
                <Legend />
                <Line type="monotone" dataKey="contract" stroke="#1e3a5f" strokeWidth={2.5} name="계약" dot={{ r: 3 }} />
                <Line type="monotone" dataKey="delivery" stroke="#10b981" strokeWidth={2.5} name="출고" dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="쇼룸 트래픽 추이" description="최근 5개월 · 전체 딜러 합계 (본사 전용)">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={trafficTrend} margin={{ top: 8, right: 16, left: 0, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={v => v.toLocaleString()} />
                <Legend />
                <Bar dataKey="showroom" fill="#3b82f6" name="쇼룸 방문" radius={[4, 4, 0, 0]} />
                <Bar dataKey="test_drive" fill="#93c5fd" name="시승" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-white/60 px-5 py-4 text-xs text-gray-400">
          월별 계약/출고 추이·쇼룸 트래픽 추이는 전 딜러 합산 지표라 본사 계정에서만 제공됩니다.
        </div>
      )}

      <ChartCard
        title="딜러사별 목표 달성 현황"
        description={user.role === 'hq' ? '이번달 기준 · 전체 딜러 (더미 데이터)' : `이번달 기준 · ${user.dealer} (더미 데이터)`}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                {['딜러사', '계열사', '브랜드', '월 목표', '계약', '출고', '달성률', '상태'].map(h => (
                  <th key={h} className="px-4 py-2.5 text-left text-xs font-medium text-gray-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visibleDealerStatus.map((d, i) => {
                const rate = ((d.contract / d.target) * 100).toFixed(0)
                const cfg = RISK_CFG[d.risk]
                return (
                  <tr key={i} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-2.5 font-medium text-gray-800">{d.dealer}</td>
                    <td className="px-4 py-2.5 text-gray-500">{d.group}</td>
                    <td className="px-4 py-2.5 text-gray-500">{d.brand}</td>
                    <td className="px-4 py-2.5">{d.target}</td>
                    <td className="px-4 py-2.5">{d.contract}</td>
                    <td className="px-4 py-2.5">{d.delivery}</td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${d.risk === 'ok' ? 'bg-green-400' : d.risk === 'warning' ? 'bg-yellow-400' : 'bg-red-400'}`}
                            style={{ width: `${Math.min(100, rate)}%` }} />
                        </div>
                        <span className="text-xs font-semibold">{rate}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cfg.bg} ${cfg.text} border ${cfg.border}`}>
                        {d.risk === 'ok' ? '정상' : d.risk === 'warning' ? '주의' : '위험'}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </ChartCard>

      <ChartCard
        title="딜러사별 · SFX별 계약/출고 현황"
        description={user.role === 'hq' ? '이번달 기준 · 전체 딜러 (더미 데이터)' : `이번달 기준 · ${user.dealer} (더미 데이터)`}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                {['딜러사', '계열사', 'SFX', '모델', '월 목표', '계약', '출고', '달성률', '상태'].map(h => (
                  <th key={h} className="px-4 py-2.5 text-left text-xs font-medium text-gray-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visibleSfxDetail.map((d, i) => {
                const rate = ((d.contract / d.target) * 100).toFixed(0)
                const cfg = RISK_CFG[d.risk]
                return (
                  <tr key={i} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-2.5 font-medium text-gray-800">{d.dealer}</td>
                    <td className="px-4 py-2.5 text-gray-500">{d.group}</td>
                    <td className="px-4 py-2.5 text-gray-700">{d.sfx}</td>
                    <td className="px-4 py-2.5 text-gray-500">{d.model}</td>
                    <td className="px-4 py-2.5">{d.target}</td>
                    <td className="px-4 py-2.5">{d.contract}</td>
                    <td className="px-4 py-2.5">{d.delivery}</td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${d.risk === 'ok' ? 'bg-green-400' : d.risk === 'warning' ? 'bg-yellow-400' : 'bg-red-400'}`}
                            style={{ width: `${Math.min(100, rate)}%` }} />
                        </div>
                        <span className="text-xs font-semibold">{rate}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cfg.bg} ${cfg.text} border ${cfg.border}`}>
                        {d.risk === 'ok' ? '정상' : d.risk === 'warning' ? '주의' : '위험'}
                      </span>
                    </td>
                  </tr>
                )
              })}
              {visibleSfxDetail.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-6 text-center text-xs text-gray-400">조회 가능한 SFX 데이터가 없습니다.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </ChartCard>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">AI 리스크 알림</h3>
        <div className="space-y-2">
          {visibleRiskAlerts.length === 0 && (
            <p className="text-xs text-gray-400">현재 딜러사에 발생한 리스크 알림이 없습니다.</p>
          )}
          {visibleRiskAlerts.map((a, i) => {
            const cfg = RISK_CFG[a.type]
            const Icon = cfg.Icon
            return (
              <div key={i} className={`flex items-start gap-3 rounded-xl px-4 py-3 border ${cfg.bg} ${cfg.border}`}>
                <Icon size={15} className={`${cfg.text} flex-shrink-0 mt-0.5`} />
                <div className="flex-1">
                  <p className={`text-xs font-semibold ${cfg.text}`}>{a.dealer}</p>
                  <p className="text-xs text-gray-600">{a.msg}</p>
                </div>
                <span className="text-xs text-gray-400 flex-shrink-0">잔여 {a.daysLeft}일</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
