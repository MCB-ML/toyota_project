import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine
} from 'recharts'
import PageHeader from '../../components/PageHeader'
import ChartCard from '../../components/ChartCard'
import KPICard from '../../components/KPICard'
import { fvdVocDummy } from '../../data/dummy'
import { TrendingUp, TrendingDown, Lightbulb, AlertCircle } from 'lucide-react'

const PRIORITY_CFG = {
  High: { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-200' },
  Medium: { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200' },
  Low: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
}

export default function FvdVoc() {
  const { npsMonthly, csiSsiQuarterly, categoryVoc, topIssues, improvementSuggestions } = fvdVocDummy

  const latestNps = npsMonthly[npsMonthly.length - 1]
  const prevNps = npsMonthly[npsMonthly.length - 2]
  const latestCsi = csiSsiQuarterly[csiSsiQuarterly.length - 1]
  const highPriorityCount = categoryVoc.filter(c => c.priority === 'High').length

  return (
    <div className="p-6 space-y-6">
      <PageHeader title="VOC 분석" description="NPS 고객 VOC 텍스트 분석 및 CSI/SSI 기반 개선 과제 도출 (더미 데이터)" />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KPICard title="이번달 NPS" value={latestNps.nps.toString()} sub={`전월 대비 ${latestNps.nps > prevNps.nps ? '+' : ''}${(latestNps.nps - prevNps.nps).toFixed(0)}p`} variant="blue" />
        <KPICard title="CSI (최근 분기)" value={latestCsi.csi.toString()} sub={`목표 ${latestCsi.csi_target}`} variant="green" />
        <KPICard title="SSI (최근 분기)" value={latestCsi.ssi.toString()} sub={`목표 ${latestCsi.ssi_target}`} variant="purple" />
        <KPICard title="고우선 개선 카테고리" value={`${highPriorityCount}개`} sub="부정율 60% 이상" variant="red" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard title="월별 NPS 추이" description="응답 건수 포함">
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={npsMonthly} margin={{ top: 8, right: 16, left: 0, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 10 }} />
              <YAxis yAxisId="left" domain={[55, 80]} tick={{ fontSize: 11 }} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} tickFormatter={v => `${(v / 1000).toFixed(1)}K`} />
              <Tooltip />
              <Legend />
              <ReferenceLine yAxisId="left" y={70} stroke="#10b981" strokeDasharray="4 4"
                label={{ value: '목표 70', position: 'right', fontSize: 10, fill: '#10b981' }} />
              <Line yAxisId="left" type="monotone" dataKey="nps" stroke="#1e3a5f" strokeWidth={2.5} name="NPS" dot={{ r: 3 }} />
              <Bar yAxisId="right" dataKey="responses" fill="#e0f2fe" name="응답건수" radius={[2, 2, 0, 0]} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="분기별 CSI / SSI" description="목표: CSI 800, SSI 790">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={csiSsiQuarterly} margin={{ top: 8, right: 16, left: 0, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="quarter" tick={{ fontSize: 11 }} />
              <YAxis domain={[760, 820]} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <ReferenceLine y={800} stroke="#1e3a5f" strokeDasharray="4 4" />
              <ReferenceLine y={790} stroke="#dc2626" strokeDasharray="4 4" />
              <Bar dataKey="csi" fill="#1e3a5f" name="CSI" radius={[4, 4, 0, 0]} />
              <Bar dataKey="ssi" fill="#dc2626" name="SSI" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <ChartCard title="카테고리별 부정 VOC 분포" description="건수 및 부정 응답 비율 — 우선 개선 항목 식별">
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={categoryVoc} layout="vertical" margin={{ top: 4, right: 80, left: 100, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 11 }} domain={[0, 100]} tickFormatter={v => `${v}%`} />
            <YAxis type="category" dataKey="category" tick={{ fontSize: 11 }} />
            <Tooltip formatter={(v, name) => name === '부정 비율' ? `${v}%` : v.toLocaleString()} />
            <Legend />
            <Bar dataKey="negative_rate" fill="#ef4444" name="부정 비율" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle size={15} className="text-red-500" />
            <h3 className="text-sm font-semibold text-gray-700">주요 불만 TOP 5</h3>
          </div>
          <div className="space-y-3">
            {topIssues.map((issue, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-red-50 text-red-600 text-xs font-bold flex items-center justify-center flex-shrink-0">{issue.rank}</span>
                <div className="flex-1">
                  <p className="text-sm text-gray-800">{issue.issue}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-gray-400">{issue.category}</span>
                    <span className="text-xs text-gray-400">·</span>
                    <span className="text-xs text-gray-500">{issue.count}건</span>
                    <span className={`text-xs font-medium ${issue.change > 0 ? 'text-red-500' : 'text-green-600'}`}>
                      {issue.change > 0 ? `▲${issue.change}` : `▼${Math.abs(issue.change)}`}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb size={15} className="text-yellow-500" />
            <h3 className="text-sm font-semibold text-gray-700">AI 개선 과제 제안</h3>
          </div>
          <div className="space-y-3">
            {improvementSuggestions.map((s, i) => {
              const cfg = PRIORITY_CFG[s.impact]
              return (
                <div key={i} className={`rounded-xl px-3 py-2.5 border ${cfg.bg} ${cfg.border}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-[10px] font-bold ${cfg.text}`}>{s.impact}</span>
                    <span className="text-[10px] text-gray-400">{s.deadline}</span>
                  </div>
                  <p className="text-xs text-gray-800">{s.action}</p>
                  <p className="text-[10px] text-gray-500 mt-0.5">기대효과: {s.kpi}</p>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
