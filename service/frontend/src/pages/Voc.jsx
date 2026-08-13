import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import PageHeader from '../components/PageHeader'
import ChartCard from '../components/ChartCard'
import KPICard from '../components/KPICard'
import { vocDummy } from '../data/dummy'
import { ThumbsUp, ThumbsDown, MessageSquare } from 'lucide-react'

const SENTIMENT_COLORS = {
  positive: '#22c55e',
  neutral: '#94a3b8',
  negative: '#ef4444',
}
const PIE_COLORS = ['#22c55e', '#94a3b8', '#ef4444']

export default function Voc() {
  const { sentimentTrend, categoryBreakdown, topPositive, topNegative, npsDistribution } = vocDummy

  const latestSentiment = sentimentTrend[sentimentTrend.length - 1]
  const totalVoc = categoryBreakdown.reduce((s, c) => s + c.count, 0)
  const avgPositive = (categoryBreakdown.reduce((s, c) => s + c.positive, 0) / categoryBreakdown.length).toFixed(0)

  return (
    <div className="p-6 space-y-6">
      <PageHeader title="VOC 분석" description="고객 의견 감성 분석 및 NPS 카테고리별 현황 (더미 데이터)" />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KPICard title="총 VOC 건수" value={totalVoc.toLocaleString()} sub="2024년 누적" variant="blue" />
        <KPICard title="긍정 비율" value={`${latestSentiment.positive}%`} sub="최근 월 기준" variant="green" />
        <KPICard title="부정 비율" value={`${latestSentiment.negative}%`} sub="최근 월 기준" variant="red" />
        <KPICard title="카테고리 평균 긍정" value={`${avgPositive}%`} sub="전체 카테고리" variant="purple" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard title="월별 감성 추이" description="긍정/중립/부정 비율 변화">
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={sentimentTrend} margin={{ top: 8, right: 16, left: 0, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${v}%`} domain={[0, 100]} />
              <Tooltip formatter={(v) => `${v}%`} />
              <Legend />
              <Area type="monotone" dataKey="positive" stackId="1" stroke={SENTIMENT_COLORS.positive}
                fill={SENTIMENT_COLORS.positive} fillOpacity={0.7} name="긍정" />
              <Area type="monotone" dataKey="neutral" stackId="1" stroke={SENTIMENT_COLORS.neutral}
                fill={SENTIMENT_COLORS.neutral} fillOpacity={0.5} name="중립" />
              <Area type="monotone" dataKey="negative" stackId="1" stroke={SENTIMENT_COLORS.negative}
                fill={SENTIMENT_COLORS.negative} fillOpacity={0.7} name="부정" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="NPS 분포" description="추천/중립/비추천 구성 비율">
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={npsDistribution} cx="50%" cy="50%" innerRadius={60} outerRadius={100}
                dataKey="value" nameKey="score"
                label={({ score, value }) => `${score}: ${value}%`} labelLine={true}>
                {npsDistribution.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
              </Pie>
              <Tooltip formatter={(v) => `${v}%`} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <ChartCard title="카테고리별 VOC 현황" description="건수 및 긍정/부정 비율">
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={categoryBreakdown} layout="vertical" margin={{ top: 4, right: 16, left: 80, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={v => `${v}%`} domain={[0, 100]} />
            <YAxis type="category" dataKey="category" tick={{ fontSize: 11 }} />
            <Tooltip formatter={(v) => `${v}%`} />
            <Legend />
            <Bar dataKey="positive" fill="#22c55e" name="긍정" stackId="a" />
            <Bar dataKey="negative" fill="#ef4444" name="부정" stackId="a" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center gap-2 mb-4">
            <ThumbsUp size={16} className="text-green-600" />
            <h3 className="text-sm font-semibold text-gray-700">긍정 VOC 상위 의견</h3>
          </div>
          <ol className="space-y-2">
            {topPositive.map((v, i) => (
              <li key={i} className="flex items-start gap-3 text-sm">
                <span className="w-5 h-5 rounded-full bg-green-100 text-green-700 text-xs font-bold flex items-center justify-center flex-shrink-0">{i + 1}</span>
                <span className="text-gray-700">{v}</span>
              </li>
            ))}
          </ol>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center gap-2 mb-4">
            <ThumbsDown size={16} className="text-red-500" />
            <h3 className="text-sm font-semibold text-gray-700">개선 필요 VOC 상위 의견</h3>
          </div>
          <ol className="space-y-2">
            {topNegative.map((v, i) => (
              <li key={i} className="flex items-start gap-3 text-sm">
                <span className="w-5 h-5 rounded-full bg-red-100 text-red-600 text-xs font-bold flex items-center justify-center flex-shrink-0">{i + 1}</span>
                <span className="text-gray-700">{v}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  )
}
