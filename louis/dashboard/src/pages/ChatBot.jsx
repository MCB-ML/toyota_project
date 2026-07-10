import { useState, useRef, useEffect, useCallback } from 'react'
import { Send, Bot, User, Loader2, Sparkles, RefreshCw } from 'lucide-react'
import GeneratedWidget from '../components/widgets/GeneratedWidget'

const SAMPLE_QUESTIONS = [
  '전체 차량 현황과 브랜드별 비율을 분석해줘',
  'FMS 쿠폰 잔여 현황과 CR 타겟 수치를 알려줘',
  '최근 12개월 계약 추이를 차트로 보여줘',
  '연차별 FMS 사용률이 낮은 구간은 어디야?',
  '렉서스와 토요타 차종별 등록 현황 비교해줘',
]

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
            <GeneratedWidget name={comp.name} props={comp.props} />
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
