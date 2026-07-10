import { Check, Loader2 } from 'lucide-react'

// Renders the pipeline's stage-progress trace (의도 분석 중... → ... → 검토 에이전트 확인 중...)
// as the SSE stream comes in. `finished` marks the whole turn as concluded
// (patch_ready / rejected / error received) so the last stage stops spinning.
export default function StageTrace({ stages, finished }) {
  if (!stages.length) return null
  return (
    <div className="flex flex-col gap-1 pl-1">
      {stages.map((s, i) => {
        const active = i === stages.length - 1 && !finished
        return (
          <div key={`${s.stage}-${i}`} className="flex items-center gap-2 text-[11px] text-gray-400">
            {active
              ? <Loader2 size={11} className="animate-spin text-blue-500 flex-shrink-0" />
              : <Check size={11} className="text-green-500 flex-shrink-0" />}
            <span className={active ? 'text-gray-600' : ''}>{s.label}</span>
          </div>
        )
      })}
    </div>
  )
}
