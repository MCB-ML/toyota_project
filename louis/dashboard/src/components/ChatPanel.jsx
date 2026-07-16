import { useState, useRef, useEffect, useCallback } from 'react'
import { Send, Bot, User, Loader2, X, RefreshCw } from 'lucide-react'
import { useDashboardState } from '../context/DashboardStateContext'
import StageTrace from './StageTrace'
import PatchPreviewCard from './PatchPreviewCard'
import GeneratedWidget from './widgets/GeneratedWidget'

// TURN-scope lifecycle guard (see server/lifecycle.js for the full rationale): tags
// each past assistant turn with how it actually resolved, so the server can tell a
// cleanly `applied`/text-only turn apart from one whose proposal never took effect
// (rejected by the review agent, blocked, or discarded by the user) before treating
// it as accepted precedent for a brand-new request.
function outcomeOf(m) {
  if (m.role !== 'assistant') return undefined
  if (m.error) return 'error'
  if (m.rejected) return 'rejected'
  if (m.patch) {
    if (m.patchStatus === 'applied') return 'applied'
    if (m.patchStatus === 'discarded') return 'discarded'
    if (m.patch.blocked) return 'rejected' // review agent didn't approve it — can never be applied even while still shown as "pending"
    return 'pending'
  }
  return undefined
}

async function* iterateSSEEvents(response) {
  const reader = response.body.getReader()
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
      try { yield JSON.parse(line.slice(6)) } catch { /* skip malformed */ }
    }
  }
}

// `pageKey` gates dashboard-customization mode: when set (currently only on
// KTWS 대시보드 커스텀), the panel talks to /api/dashboard-customize and can
// propose+apply widget patches instead of plain text-only chat.
export default function ChatPanel({ open, onClose, title = 'AI 어시스턴트', subtitle, pageKey }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const bottomRef = useRef(null)
  const { dashboardState, applyPatch, undo: undoDashboard } = useDashboardState()

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, open])

  const sendMessage = useCallback(async (text) => {
    const userText = (text || input).trim()
    if (!userText || isLoading) return

    setInput('')
    setIsLoading(true)
    setMessages(prev => [...prev, { role: 'user', text: userText }])

    const history = messages.map(m => {
      const outcome = outcomeOf(m)
      const entry = {
        role: m.role,
        content: m.text || m.rejected || m.patch?.summaryText || '',
      }
      if (outcome) entry.outcome = outcome
      return entry
    })
    history.push({ role: 'user', content: userText })

    const assistantId = Date.now()
    setMessages(prev => [...prev, {
      id: assistantId, role: 'assistant', text: '', streaming: true,
      stages: [], components: [], patch: null, patchStatus: 'pending', rejected: null,
    }])
    const patchMessage = (updates) => setMessages(prev => prev.map(m => (
      m.id === assistantId ? { ...m, ...updates } : m
    )))

    try {
      const endpoint = pageKey ? '/api/dashboard-customize' : '/api/chat'
      const body = pageKey
        ? { message: userText, history, dashboardState }
        : { messages: history }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)

      for await (const event of iterateSSEEvents(res)) {
        if (event.type === 'text') {
          setMessages(prev => prev.map(m => (
            m.id === assistantId ? { ...m, text: m.text + event.text } : m
          )))
        } else if (event.type === 'stage') {
          setMessages(prev => prev.map(m => (
            m.id === assistantId ? { ...m, stages: [...(m.stages || []), { stage: event.stage, label: event.label }] } : m
          )))
        } else if (event.type === 'component') {
          setMessages(prev => prev.map(m => (
            m.id === assistantId
              ? { ...m, components: [...(m.components || []), { name: event.name, props: event.props }] }
              : m
          )))
        } else if (event.type === 'patch_ready') {
          patchMessage({ patch: event, patchStatus: 'pending', streaming: false })
        } else if (event.type === 'rejected') {
          patchMessage({ rejected: event.reason, streaming: false })
        } else if (event.type === 'error') {
          patchMessage({ error: event.message, streaming: false })
        } else if (event.type === 'done') {
          patchMessage({ streaming: false })
        }
      }
    } catch (err) {
      patchMessage({ error: `연결 오류: ${err.message}`, streaming: false })
    } finally {
      setIsLoading(false)
    }
  }, [input, messages, isLoading, pageKey, dashboardState])

  const handleApplyPatch = (messageId, payload) => {
    applyPatch(payload.patch)
    setMessages(prev => prev.map(m => (m.id === messageId ? { ...m, patchStatus: 'applied' } : m)))
  }

  const handleCancelPatch = (messageId) => {
    setMessages(prev => prev.map(m => (m.id === messageId ? { ...m, patchStatus: 'discarded' } : m)))
  }

  const handleUndoPatch = (messageId) => {
    undoDashboard()
    setMessages(prev => prev.map(m => (m.id === messageId ? { ...m, patchStatus: 'discarded' } : m)))
  }

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

  return (
    <>
      {open && (
        <div className="fixed inset-0 bg-black/20 z-40" onClick={onClose} />
      )}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-sm bg-white border-l border-gray-200 shadow-2xl z-50 flex flex-col
          transition-transform duration-200 ${open ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-[#1e3a5f] flex items-center justify-center flex-shrink-0">
              <Bot size={15} className="text-white" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-gray-800 text-sm truncate">{title}</p>
              {subtitle && <p className="text-[11px] text-gray-400 truncate">{subtitle}</p>}
            </div>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            {messages.length > 0 && (
              <button onClick={clearChat} title="새 대화" className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors">
                <RefreshCw size={14} />
              </button>
            )}
            <button onClick={onClose} title="닫기" className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors">
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center gap-3 px-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-[#1e3a5f] flex items-center justify-center">
                <Bot size={22} className="text-white" />
              </div>
              <p className="text-sm text-gray-500">
                {pageKey ? '대시보드에 추가/삭제하고 싶은 내용을 말해보세요.' : '무엇이든 물어보세요.'}
              </p>
            </div>
          ) : (
            messages.map((msg, i) => (
              <div key={i} className={`flex gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'user' ? 'bg-[#1e3a5f]' : 'bg-gradient-to-br from-blue-500 to-blue-700'}`}>
                  {msg.role === 'user' ? <User size={12} className="text-white" /> : <Bot size={12} className="text-white" />}
                </div>
                <div className={`max-w-[85%] flex flex-col gap-1.5 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                  {msg.text && (
                    <div className={`rounded-2xl px-3.5 py-2 text-[13px] leading-relaxed whitespace-pre-wrap ${msg.role === 'user'
                      ? 'bg-[#1e3a5f] text-white rounded-tr-sm'
                      : 'bg-gray-100 text-gray-800 rounded-tl-sm'}`}>
                      {msg.text}
                    </div>
                  )}
                  {msg.stages?.length > 0 && (
                    <StageTrace stages={msg.stages} finished={!msg.streaming} />
                  )}
                  {msg.components?.map((comp, i) => (
                    <div key={i} className="w-full min-w-[260px]">
                      <GeneratedWidget name={comp.name} props={comp.props} />
                    </div>
                  ))}
                  {msg.rejected && (
                    <div className="bg-gray-50 border border-gray-200 text-gray-600 text-xs rounded-xl px-3.5 py-2.5">
                      {msg.rejected}
                    </div>
                  )}
                  {msg.patch && (
                    <PatchPreviewCard
                      payload={msg.patch}
                      status={msg.patchStatus}
                      onApply={() => handleApplyPatch(msg.id, msg.patch)}
                      onCancel={() => handleCancelPatch(msg.id)}
                      onUndo={() => handleUndoPatch(msg.id)}
                    />
                  )}
                  {msg.error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl px-3.5 py-2">
                      {msg.error}
                    </div>
                  )}
                  {msg.streaming && !msg.text && !msg.stages?.length && (
                    <div className="flex items-center gap-1.5 px-1">
                      <Loader2 size={12} className="animate-spin text-blue-500" />
                      <span className="text-[11px] text-gray-400">생각 중...</span>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="border-t border-gray-200 px-3 py-3 flex-shrink-0">
          <div className="flex gap-2 items-end">
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              placeholder="메시지를 입력하세요 (Shift+Enter: 줄바꿈)"
              rows={1}
              className="flex-1 resize-none rounded-xl border border-gray-300 px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 min-h-[40px] max-h-[100px]"
              onInput={e => {
                e.target.style.height = 'auto'
                e.target.style.height = Math.min(e.target.scrollHeight, 100) + 'px'
              }}
            />
            <button
              onClick={() => sendMessage()}
              disabled={isLoading || !input.trim()}
              className="w-10 h-10 bg-[#1e3a5f] hover:bg-[#2d547a] disabled:opacity-40 text-white rounded-xl flex items-center justify-center transition-colors flex-shrink-0"
            >
              {isLoading ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
