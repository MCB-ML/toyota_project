import { Bug } from 'lucide-react'

// 평가/디버그용 — LLM이 어떤 topic을 왜 골랐는지, 어떤 테이블/컬럼 스키마를 읽었는지,
// 어떤 SQL을 생성했는지를 그대로 보여준다. 기본은 접힌 상태(<details>) — 일반 사용
// 흐름을 방해하지 않고 필요할 때만 펼쳐서 라우팅/쿼리 생성 결과를 검증하는 용도.
export default function DebugTrace({ entries }) {
  if (!entries?.length) return null
  return (
    <details className="w-full text-[11px] text-gray-500 border border-gray-200 rounded-lg bg-gray-50">
      <summary className="cursor-pointer select-none font-medium text-gray-600 px-2.5 py-1.5 flex items-center gap-1.5">
        <Bug size={11} />
        디버그 정보 ({entries.length})
      </summary>
      <div className="flex flex-col gap-2 px-2.5 pb-2.5">
        {entries.map((e, i) => (
          <div key={i} className="border-t border-gray-200 pt-2">
            <p className="font-semibold text-gray-600 mb-1">{e.label}</p>

            {e.detail.topic !== undefined && (
              <p>
                topic: <span className="font-mono text-gray-700">{e.detail.topic}</span>
                {e.detail.reasoning && <span className="text-gray-400"> — {e.detail.reasoning}</span>}
              </p>
            )}

            {e.detail.tables && (
              <ul className="list-disc list-inside space-y-0.5">
                {e.detail.tables.map((t, j) => (
                  <li key={j} className="font-mono text-gray-700">
                    {t.db}.{t.id} <span className="text-gray-400">({t.columns.join(', ')})</span>
                  </li>
                ))}
              </ul>
            )}

            {e.detail.sql && (
              <>
                <p className="text-gray-400 mt-1">{e.detail.db}.{e.detail.table}</p>
                <pre className="whitespace-pre-wrap break-all bg-white border border-gray-200 rounded p-1.5 mt-0.5 font-mono text-gray-700">{e.detail.sql}</pre>
              </>
            )}
          </div>
        ))}
      </div>
    </details>
  )
}
