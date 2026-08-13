import { useEffect, useRef, useState } from 'react'
import { AlertTriangle, Check, ChevronDown, Cpu } from 'lucide-react'
import { useModel } from '../llm/ModelContext'

// 모델 선택기. 사이드바 아래에 두어 어느 화면에서도 지금 무엇으로 답하는지 보이게 한다.
//
// 못 쓰는 모델도 목록에 남기고 **왜 못 쓰는지**를 함께 보여준다. 지워버리면
// "왜 이 모델이 안 보이지"를 사람이 추측해야 한다.
export default function ModelPicker({ compact = false }) {
  const { models, modelId, setModelId, current } = useModel()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return undefined
    const onDown = (e) => { if (!ref.current?.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  if (!models.length) return null

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`flex w-full items-center gap-2 rounded-md border border-gray-200 bg-white px-2.5 py-2 text-left hover:border-gray-400 ${compact ? 'text-xs' : 'text-sm'}`}
      >
        <Cpu size={14} className="flex-shrink-0 text-gray-400" />
        <span className="min-w-0 flex-1 truncate">
          <span className="block truncate font-medium text-gray-900">{current?.label || modelId || '모델 선택'}</span>
          {!compact && <span className="block truncate text-[11px] text-gray-500">AI 기능 전체에 적용</span>}
        </span>
        <ChevronDown size={14} className={`flex-shrink-0 text-gray-400 transition ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute bottom-full left-0 z-50 mb-1 w-72 rounded-lg border border-gray-200 bg-white p-1 shadow-lg">
          {models.map((m) => (
            <button
              key={m.id}
              type="button"
              disabled={!m.available}
              onClick={() => { setModelId(m.id); setOpen(false) }}
              className={`flex w-full items-start gap-2 rounded-md px-2 py-2 text-left ${
                m.available ? 'hover:bg-gray-50' : 'cursor-not-allowed opacity-60'
              }`}
            >
              <span className="mt-0.5 w-4 flex-shrink-0">
                {m.id === modelId && <Check size={14} className="text-gray-900" />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-baseline gap-1.5">
                  <span className="text-sm font-medium text-gray-900">{m.label}</span>
                  {m.isDefault && <span className="rounded bg-gray-100 px-1 text-[10px] text-gray-600">기본</span>}
                </span>
                <span className="mt-0.5 block text-[11px] text-gray-500">{m.note}</span>
                {/* temperature를 못 바꾸는 모델은 같은 질문에도 답이 흔들린다 — 미리 알린다. */}
                {m.available && m.fixedTemperature && (
                  <span className="mt-0.5 block text-[11px] text-amber-700">
                    temperature 고정 — 같은 질문에도 답이 조금씩 달라집니다
                  </span>
                )}
                {!m.available && (
                  <span className="mt-0.5 flex items-start gap-1 text-[11px] text-red-700">
                    <AlertTriangle size={11} className="mt-0.5 flex-shrink-0" />
                    {m.missing?.join(', ')} 없음 — .env를 확인하세요
                  </span>
                )}
              </span>
            </button>
          ))}
          <p className="border-t border-gray-100 px-2 py-1.5 text-[11px] text-gray-400">
            챗봇 · 대시보드 커스텀 · Agentic BI · HTML 편집 · 이상현상 해석에 모두 적용됩니다.
          </p>
        </div>
      )}
    </div>
  )
}
