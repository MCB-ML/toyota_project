import { useState, useRef, useEffect, useCallback } from 'react'
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import { Send, Bot, User, Loader2, Sparkles, RefreshCw } from 'lucide-react'

const COLORS = ['#1e3a5f', '#2563eb', '#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe', '#e0f2fe']
const TREND_COLORS = { up: 'text-green-600', down: 'text-red-500', neutral: 'text-gray-500' }
const TREND_ARROWS = { up: '▲', down: '▼', neutral: '—' }

const SAMPLE_QUESTIONS = [
  '전체 차량 현황과 브랜드별 비율을 분석해줘',
  'FMS 쿠폰 잔여 현황과 CR 타겟 수치를 알려줘',
  '최근 12개월 계약 추이를 차트로 보여줘',
  '연차별 FMS 사용률이 낮은 구간은 어디야?',
  '렉서스와 토요타 차종별 등록 현황 비교해줘',
]

function BarChartComponent({ title, data, x_key, y_key, color = '#3B82F6' }) {
  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
      <h4 className="text-sm font-semibold text-gray-700 mb-3">{title}</h4>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 4, right: 16, left: 0, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey={x_key} tick={{ fontSize: 11 }} angle={-30} textAnchor="end" />
          <YAxis tick={{ fontSize: 11 }} tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v} />
          <Tooltip formatter={(v) => v.toLocaleString()} />
          <Bar dataKey={y_key} fill={color} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

function LineChartComponent({ title, data, x_key, y_keys, y_labels }) {
  const labels = y_labels || y_keys
  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
      <h4 className="text-sm font-semibold text-gray-700 mb-3">{title}</h4>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey={x_key} tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v} />
          <Tooltip formatter={(v) => v?.toLocaleString()} />
          <Legend formatter={(v, e, i) => labels[i] || v} />
          {y_keys.map((key, i) => (
            <Line key={key} type="monotone" dataKey={key} stroke={COLORS[i % COLORS.length]}
              strokeWidth={2} dot={{ r: 3 }} name={labels[i] || key} />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

function KpiCardsComponent({ cards }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {cards.map((card, i) => (
        <div key={i} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <p className="text-xs text-gray-500 mb-1">{card.title}</p>
          <p className="text-xl font-bold text-gray-800">{card.value}</p>
          {card.sub && <p className="text-xs text-gray-400 mt-1">{card.sub}</p>}
          {card.trend && (
            <span className={`text-xs font-medium ${TREND_COLORS[card.trend]}`}>
              {TREND_ARROWS[card.trend]}
            </span>
          )}
        </div>
      ))}
    </div>
  )
}

function TableComponent({ title, columns, rows }) {
  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
      <h4 className="text-sm font-semibold text-gray-700 mb-3">{title}</h4>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-gray-50">
              {columns.map((col, i) => (
                <th key={i} className="px-3 py-2 text-left font-medium text-gray-600">{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, ri) => (
              <tr key={ri} className="border-t border-gray-50 hover:bg-gray-50">
                {row.map((cell, ci) => (
                  <td key={ci} className="px-3 py-2 text-gray-700">
                    {typeof cell === 'number' ? cell.toLocaleString() : cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function PieChartComponent({ title, data }) {
  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
      <h4 className="text-sm font-semibold text-gray-700 mb-3">{title}</h4>
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" innerRadius={50} outerRadius={80}
            dataKey="value" nameKey="name" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            labelLine={false}>
            {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
          </Pie>
          <Tooltip formatter={(v) => v.toLocaleString()} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}

function GeneratedComponent({ name, props }) {
  switch (name) {
    case 'render_bar_chart': return <BarChartComponent {...props} />
    case 'render_line_chart': return <LineChartComponent {...props} />
    case 'render_kpi_cards': return <KpiCardsComponent {...props} />
    case 'render_table': return <TableComponent {...props} />
    case 'render_pie_chart': return <PieChartComponent {...props} />
    default: return null
  }
}

function MessageBubble({ msg }) {
  const isUser = msg.role === 'user'
  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${isUser ? 'bg-[#1e3a5f]' : 'bg-gradient-to-br from-blue-500 to-blue-700'}`}>
        {isUser ? <User size={14} className="text-white" /> : <Bot size={14} className="text-white" />}
      </div>
      <div className={`max-w-[80%] ${isUser ? 'items-end' : 'items-start'} flex flex-col gap-2`}>
        {msg.text && (
          <div className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${isUser
            ? 'bg-[#1e3a5f] text-white rounded-tr-sm'
            : 'bg-white border border-gray-200 text-gray-800 rounded-tl-sm shadow-sm'}`}>
            {msg.text}
          </div>
        )}
        {msg.components?.map((comp, i) => (
          <div key={i} className="w-full min-w-[320px]">
            <GeneratedComponent name={comp.name} props={comp.props} />
          </div>
        ))}
        {msg.error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl px-4 py-2.5">
            {msg.error}
          </div>
        )}
      </div>
    </div>
  )
}

export default function ChatBot() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const bottomRef = useRef(null)
  const textareaRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = useCallback(async (text) => {
    const userText = (text || input).trim()
    if (!userText || isLoading) return

    setInput('')
    setIsLoading(true)

    const newUserMsg = { role: 'user', text: userText }
    setMessages(prev => [...prev, newUserMsg])

    const history = messages.map(m => ({
      role: m.role,
      content: m.text || '(차트/표 생성됨)',
    }))
    history.push({ role: 'user', content: userText })

    const assistantId = Date.now()
    setMessages(prev => [...prev, { id: assistantId, role: 'assistant', text: '', components: [], streaming: true }])

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history }),
      })

      if (!res.ok) throw new Error(`HTTP ${res.status}`)

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop()

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const json = line.slice(6)
          let event
          try { event = JSON.parse(json) } catch { continue }

          if (event.type === 'text') {
            setMessages(prev => prev.map(m =>
              m.id === assistantId ? { ...m, text: m.text + event.text } : m
            ))
          } else if (event.type === 'component') {
            setMessages(prev => prev.map(m =>
              m.id === assistantId
                ? { ...m, components: [...(m.components || []), { name: event.name, props: event.props }] }
                : m
            ))
          } else if (event.type === 'error') {
            setMessages(prev => prev.map(m =>
              m.id === assistantId ? { ...m, error: event.message, streaming: false } : m
            ))
          } else if (event.type === 'done') {
            setMessages(prev => prev.map(m =>
              m.id === assistantId ? { ...m, streaming: false } : m
            ))
          }
        }
      }
    } catch (err) {
      setMessages(prev => prev.map(m =>
        m.id === assistantId ? { ...m, error: `연결 오류: ${err.message}`, streaming: false } : m
      ))
    } finally {
      setIsLoading(false)
    }
  }, [input, messages, isLoading])

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const clearChat = () => {
    setMessages([])
    setInput('')
  }

  const isEmpty = messages.length === 0

  return (
    <div className="flex flex-col h-full bg-[#f0f2f5]">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-[#1e3a5f] flex items-center justify-center">
            <Sparkles size={16} className="text-white" />
          </div>
          <div>
            <h1 className="font-semibold text-gray-800 text-base">AI 데이터 어시스턴트</h1>
            <p className="text-xs text-gray-400">Toyota/Lexus Korea 데이터 기반 인사이트</p>
          </div>
        </div>
        {!isEmpty && (
          <button onClick={clearChat} className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <RefreshCw size={13} />새 대화
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
        {isEmpty ? (
          <div className="flex flex-col items-center justify-center h-full gap-8 pb-16">
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-[#1e3a5f] flex items-center justify-center mx-auto mb-4">
                <Sparkles size={28} className="text-white" />
              </div>
              <h2 className="text-xl font-semibold text-gray-800 mb-2">Toyota/Lexus 데이터 분석</h2>
              <p className="text-sm text-gray-500 max-w-md">
                차량 현황, 계약 추이, FMS/PMS/SMS 쿠폰 데이터를 자연어로 질문하세요.<br />
                AI가 차트와 인사이트를 자동으로 생성합니다.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-2 w-full max-w-xl">
              {SAMPLE_QUESTIONS.map((q, i) => (
                <button key={i} onClick={() => sendMessage(q)}
                  className="text-left text-sm bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-700 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-all shadow-sm">
                  {q}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg, i) => (
            <div key={i}>
              <MessageBubble msg={msg} />
              {msg.streaming && (
                <div className="flex items-center gap-2 ml-11 mt-2">
                  <Loader2 size={14} className="animate-spin text-blue-500" />
                  <span className="text-xs text-gray-400">분석 중...</span>
                </div>
              )}
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="bg-white border-t border-gray-200 px-6 py-4">
        <div className="flex gap-3 items-end max-w-4xl mx-auto">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            placeholder="데이터에 대해 질문하세요 (Shift+Enter: 줄바꿈)"
            rows={1}
            className="flex-1 resize-none rounded-xl border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 min-h-[44px] max-h-[120px]"
            style={{ height: 'auto' }}
            onInput={e => {
              e.target.style.height = 'auto'
              e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'
            }}
          />
          <button onClick={() => sendMessage()} disabled={isLoading || !input.trim()}
            className="w-11 h-11 bg-[#1e3a5f] hover:bg-[#2d547a] disabled:opacity-40 text-white rounded-xl flex items-center justify-center transition-colors flex-shrink-0">
            {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          </button>
        </div>
      </div>
    </div>
  )
}
