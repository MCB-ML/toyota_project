import { useState } from 'react'
import { CheckCircle2, XCircle, ChevronDown, ChevronRight, Undo2 } from 'lucide-react'
import GeneratedWidget from './widgets/GeneratedWidget'

// Renders a proposed dashboard patch (patch_ready SSE payload) as a preview
// card in the chat — nothing here is reflected on the live dashboard until
// the user clicks 적용 (Apply), which calls onApply().
export default function PatchPreviewCard({ payload, status, onApply, onCancel, onUndo }) {
  const [sqlOpen, setSqlOpen] = useState(false)
  const { sql, review, summaryText, previewWidget, blocked, warning } = payload

  return (
    <div className="w-full min-w-[280px] rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      <div className="px-3.5 py-2.5 border-b border-gray-100">
        <p className="text-[13px] text-gray-700">{summaryText}</p>
      </div>

      <div className="px-3.5 py-2 flex items-start gap-1.5 text-[11px] border-b border-gray-100">
        {review?.approved
          ? <CheckCircle2 size={13} className="text-green-500 flex-shrink-0 mt-0.5" />
          : <XCircle size={13} className="text-red-500 flex-shrink-0 mt-0.5" />}
        <span className={review?.approved ? 'text-gray-500' : 'text-red-600'}>{review?.reason}</span>
      </div>

      {warning && (
        <div className="px-3.5 py-2 text-[11px] text-amber-700 bg-amber-50 border-b border-amber-100">{warning}</div>
      )}

      {previewWidget && (
        <div className="px-3.5 py-3">
          <GeneratedWidget name={previewWidget.type} props={previewWidget.props} />
        </div>
      )}

      {sql && (
        <div className="border-t border-gray-100">
          <button
            onClick={() => setSqlOpen(v => !v)}
            className="w-full flex items-center gap-1 px-3.5 py-2 text-[11px] text-gray-400 hover:text-gray-600"
          >
            {sqlOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
            생성된 SQL (표시용)
          </button>
          {sqlOpen && (
            <div className="px-3.5 pb-3">
              <pre className="text-[10px] bg-gray-900 text-gray-100 rounded-lg p-2.5 overflow-x-auto whitespace-pre-wrap">{sql}</pre>
              <p className="text-[10px] text-gray-400 mt-1.5">이 쿼리는 표시용이며 실행되지 않습니다. 실제 데이터는 로컬 데이터셋 기준입니다.</p>
            </div>
          )}
        </div>
      )}

      <div className="px-3.5 py-2.5 border-t border-gray-100">
        {status === 'pending' && (
          <div className="flex gap-2">
            <button
              onClick={onCancel}
              className="flex-1 text-xs font-medium py-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50"
            >
              취소
            </button>
            <button
              onClick={onApply}
              disabled={blocked}
              title={blocked ? '검토 에이전트가 승인하지 않아 적용할 수 없습니다.' : undefined}
              className="flex-1 text-xs font-medium py-1.5 rounded-lg bg-[#1e3a5f] text-white hover:bg-[#2d547a] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              적용
            </button>
          </div>
        )}
        {status === 'applied' && (
          <button onClick={onUndo} className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800">
            <Undo2 size={12} /> 적용됨 · 실행취소
          </button>
        )}
        {status === 'discarded' && (
          <p className="text-xs text-gray-400">취소됨</p>
        )}
      </div>
    </div>
  )
}
