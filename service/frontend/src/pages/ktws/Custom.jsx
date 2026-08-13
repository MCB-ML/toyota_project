import { useState, useCallback, useRef, useEffect } from 'react'
import { Send, Loader2, ChevronRight, Layers, ShieldCheck, Search, AlertTriangle, Undo2, Redo2, Code2, Download, CornerDownRight, RotateCcw } from 'lucide-react'
import PageHeader from '../../components/PageHeader'
import { useModel } from '../../llm/ModelContext'
import { jsonAuthHeaders } from '../../auth/session'

// Dynamic Semantic Query Planner 콘솔.
//
// 두 단계를 **일부러 분리**한다.
//   숫자   결정론적 경로가 낸다 — 요구 추출 → 라우팅 → 인증 자산 → 검증 → 실행.
//   그림   LLM이 HTML을 직접 쓴다. 차트 종류·배치·구성은 모델 재량이다.
//
// 예전에는 그림도 툴 스키마(chart_type/label_key/value_key/y_keys/…)에 가둬 놨는데,
// 스키마가 예상 못 한 요청마다 축 매핑이 어긋나 빈 차트·뒤바뀐 축이 났다. HTML 작성
// 탭이 같은 문제를 재량을 열어서 풀었으므로 여기도 같은 방식을 쓴다.
//
// 화면은 **턴을 쌓는다.** 한 턴은 {질문, 숫자, 그림 버전들}이고, 두 가지를 서로 다른
// 입력창으로 이어간다:
//   "이어서 묻기"  새 조회. 앞 턴의 요구를 함께 보내 "그럼 8월은?"이 통하게 한다.
//   "화면 고치기"  조회를 다시 하지 않고 그 턴의 문서만 다시 쓴다.
// 둘을 한 입력창에 섞으면 사용자는 방금 자기가 조회를 다시 시킨 건지 그림만 고친 건지
// 알 수 없고, 그러면 숫자가 바뀌었는지도 모른다.

// allow-same-origin을 일부러 뺐다 — allow-scripts와 함께 주면 문서가 부모 앱과 같은
// 출처가 되어 세션·토큰에 손댈 수 있다. 뺀 상태로도 스크립트는 돈다(고립된 출처).
const SANDBOX = 'allow-scripts allow-popups allow-modals allow-forms'

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

const LEVEL_STYLE = {
  CERTIFIED_REPORT: { label: '인증 리포트', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', Icon: ShieldCheck },
  REPORT_COMPOSED: { label: '리포트 조합', cls: 'bg-teal-50 text-teal-700 border-teal-200', Icon: Layers },
  CERTIFIED_METRIC: { label: '인증 지표', cls: 'bg-blue-50 text-blue-700 border-blue-200', Icon: ShieldCheck },
  SEMANTIC_COMPOSED: { label: '시맨틱 조합', cls: 'bg-indigo-50 text-indigo-700 border-indigo-200', Icon: Layers },
  DISCOVERED: { label: '스키마 발견', cls: 'bg-amber-50 text-amber-700 border-amber-200', Icon: Search },
  UNRESOLVED: { label: '확인 필요', cls: 'bg-orange-50 text-orange-700 border-orange-200', Icon: AlertTriangle },
  UNSUPPORTED: { label: '실행 차단', cls: 'bg-rose-50 text-rose-700 border-rose-200', Icon: AlertTriangle },
}

const EXAMPLES = [
  "렉서스 강남에서 2026년 7월에 출고된 건 중, 접수 유형이 'QR 접수'가 몇 건인지 확인해줘.",
  '렉서스 강남 딜러 7월 출고를 접수 유형별로 나눠줘',
  '2026년 7월 렉서스 강남 딜러 계약 건수',
]

// 무엇을 시킬 수 있는지 안 보이면 "글씨 키워줘"에서 멈춘다.
const RENDER_PRESETS = ['가로 막대로 바꿔줘', '비중(%)도 같이 보여줘', '표만 남기고 차트는 빼줘', '숫자를 크게 강조해줘']
const FOLLOW_UP_PRESETS = ['그럼 수기 접수는?', '8월은?', 'SC별로 나눠줘', '전시장별로 나눠줘']

function LevelBadge({ level }) {
  const s = LEVEL_STYLE[level]
  if (!s) return null
  const { Icon } = s
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-xs font-medium ${s.cls}`}>
      <Icon size={12} />{s.label}
    </span>
  )
}

function Line({ label, children }) {
  return (
    <div className="flex gap-3">
      <div className="w-40 shrink-0 text-gray-400">{label}</div>
      <div className="text-gray-700 break-all">{children}</div>
    </div>
  )
}

// 숫자는 그림이 실패해도 남아야 한다 — 그래서 문서와 별개로 항상 그린다.
function ResultFacts({ result }) {
  const rows = result.rows || []
  const columns = result.columns || (rows[0] ? Object.keys(rows[0]) : [])
  return (
    <details className="bg-white rounded-xl border border-gray-200">
      <summary className="cursor-pointer px-4 py-3 text-sm text-gray-600">
        조회된 값 {result.kind === 'value' ? `— ${Number(result.value).toLocaleString()}` : `— ${rows.length}행`}
      </summary>
      <div className="px-4 pb-4">
        {result.kind === 'value' ? (
          <div className="text-3xl font-semibold text-[#1e3a5f]">{Number(result.value).toLocaleString()}</div>
        ) : (
          <div className="overflow-x-auto max-h-[320px] border border-gray-100 rounded-lg">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 sticky top-0">
                <tr>{columns.map(c => <th key={c} className="text-left px-3 py-2 font-medium text-gray-600 whitespace-nowrap">{c}</th>)}</tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={i} className="border-t border-gray-50">
                    {columns.map(c => <td key={c} className="px-3 py-1.5 whitespace-nowrap text-gray-700">{String(row[c] ?? '')}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </details>
  )
}

function Provenance({ provenance }) {
  if (!provenance) return null
  const grain = provenance.row_grain || provenance.grain
  return (
    <details className="bg-white rounded-xl border border-gray-200">
      <summary className="cursor-pointer px-4 py-3 text-sm text-gray-600">이 숫자가 나온 경로</summary>
      <div className="px-4 pb-4 text-sm space-y-2">
        {provenance.report_id && <Line label="등록 리포트">{provenance.report_id}</Line>}
        {provenance.metric_id && <Line label="등록 지표">{provenance.metric_id}</Line>}
        {provenance.root_table && <Line label="root 테이블">{provenance.root_table}</Line>}
        {grain && (
          <Line label="셈 단위">
            {grain.entity} 1건 = {grain.unique_key || '표의 한 행'}
            {grain.caveat && <div className="mt-1 text-amber-700">⚠ {grain.caveat}</div>}
          </Line>
        )}
        {provenance.pushdown && Object.keys(provenance.pushdown).length > 0 && (
          <Line label="리포트에 내려보낸 조건">
            {Object.entries(provenance.pushdown).map(([k, v]) => `${k}=${v}`).join(', ')}
          </Line>
        )}
        {provenance.residual?.length > 0 && <Line label="실행 후 행에서 건 조건">{provenance.residual.join(' · ')}</Line>}
        {provenance.fetched != null && (
          <Line label="행 수">{provenance.fetched.toLocaleString()}행 조회 → {provenance.after_filter.toLocaleString()}행</Line>
        )}
        {provenance.joins?.length > 0 && (
          <Line label="관계 검증">
            {provenance.joins.map((j, i) => (
              <div key={i} className="text-xs">
                {j.edge.from}.{j.edge.left_key} → {j.edge.to}.{j.edge.right_key}
                {' · '}{j.source}{' · '}팬아웃 {j.probe?.fanout_ratio}배 → {j.decision?.mode}
              </div>
            ))}
          </Line>
        )}
        {provenance.sql && (
          <details className="pt-1">
            <summary className="cursor-pointer text-gray-500 text-xs">생성된 SQL 보기</summary>
            <pre className="mt-2 p-3 bg-gray-50 rounded-lg text-xs overflow-x-auto whitespace-pre">{provenance.sql}</pre>
          </details>
        )}
      </div>
    </details>
  )
}

function Turn({ turn, onRender, busy }) {
  const [instruction, setInstruction] = useState('')
  const [showCode, setShowCode] = useState(false)
  const current = turn.docs.list[turn.docs.cursor] || null
  const canUndo = turn.docs.cursor > 0
  const canRedo = turn.docs.cursor >= 0 && turn.docs.cursor < turn.docs.list.length - 1
  const level = turn.trace?.resolution_level

  const apply = (text) => {
    const t = (text ?? instruction).trim()
    if (!t || turn.rendering) return
    setInstruction('')
    onRender(turn.id, t, current?.html || null)
  }

  const download = () => {
    if (!current?.html) return
    const blob = new Blob([current.html], { type: 'text/html;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `query-${new Date().toISOString().slice(0, 10)}.html`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-3 border-l-2 border-gray-100 pl-4">
      <div className="flex items-center gap-3 flex-wrap">
        {turn.isFollowUp && <CornerDownRight size={14} className="text-gray-300 -ml-6" />}
        <div className="text-sm font-medium text-gray-800">{turn.question}</div>
        {level && <LevelBadge level={level} />}
        {turn.trace?.discovered_schema_used && (
          <span className="text-xs px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-amber-700">발견 스키마 사용</span>
        )}
        {turn.trace?.requirement?.carried_over?.length > 0 && (
          <span className="text-xs px-2 py-0.5 rounded-md bg-gray-50 border border-gray-200 text-gray-500"
            title={turn.trace.requirement.carried_over.map(c => `${c.field}: ${c.value}`).join(', ')}>
            앞 질문에서 이어받음
          </span>
        )}
      </div>

      {turn.loading && (
        <div className="text-sm text-gray-500 space-y-1">
          {turn.stages.map((s, i) => <div key={i} className="flex items-center gap-1.5"><ChevronRight size={12} />{s}</div>)}
        </div>
      )}

      {turn.error && <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-xl p-4 text-sm">{turn.error}</div>}

      {/* 되묻기·실행 차단. 숫자를 안 내보내는 것이 정상 동작이므로 눈에 띄게 둔다. */}
      {turn.text && (
        <div className="bg-orange-50 border border-orange-200 text-orange-800 rounded-xl p-4 text-sm whitespace-pre-wrap">{turn.text}</div>
      )}

      {turn.result && (
        <>
          <ResultFacts result={turn.result} />

          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-2.5 border-b border-gray-100">
              <span className="text-sm text-gray-600 flex-1 truncate">
                {turn.rendering ? '화면 만드는 중...' : current?.summary || '화면'}
                {turn.docs.cursor > 0 && <span className="ml-1 text-gray-400">· 편집본 {turn.docs.cursor}번째</span>}
              </span>
              <button onClick={() => onRender(turn.id, null, null, turn.docs.cursor - 1)} disabled={!canUndo}
                title="되돌리기" className="p-1.5 rounded-md text-gray-500 hover:bg-gray-50 disabled:opacity-30"><Undo2 size={15} /></button>
              <button onClick={() => onRender(turn.id, null, null, turn.docs.cursor + 1)} disabled={!canRedo}
                title="다시 실행" className="p-1.5 rounded-md text-gray-500 hover:bg-gray-50 disabled:opacity-30"><Redo2 size={15} /></button>
              <button onClick={() => setShowCode(v => !v)} title="HTML 보기"
                className={`p-1.5 rounded-md hover:bg-gray-50 ${showCode ? 'text-blue-600' : 'text-gray-500'}`}><Code2 size={15} /></button>
              <button onClick={download} disabled={!current} title="내려받기"
                className="p-1.5 rounded-md text-gray-500 hover:bg-gray-50 disabled:opacity-30"><Download size={15} /></button>
            </div>

            {turn.renderError && (
              <div className="m-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg p-3 text-sm">
                화면을 만들지 못했습니다: {turn.renderError}
                <div className="text-xs text-rose-500 mt-1">조회된 값은 위에 그대로 있습니다.</div>
              </div>
            )}

            {current?.warnings?.length > 0 && (
              <div className="mx-4 mt-4 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg p-3 text-xs space-y-1">
                {current.warnings.map((w, i) => <div key={i}>⚠ {w}</div>)}
              </div>
            )}

            {showCode && current && (
              <pre className="m-4 p-3 bg-gray-50 rounded-lg text-xs overflow-auto max-h-[400px] whitespace-pre">{current.html}</pre>
            )}

            {current && !showCode && (
              <iframe key={turn.docs.cursor} title="결과 화면" srcDoc={current.html} sandbox={SANDBOX}
                className="w-full border-0" style={{ height: 700 }} />
            )}

            {!current && turn.rendering && (
              <div className="p-10 text-center text-sm text-gray-400 flex items-center justify-center gap-2">
                <Loader2 size={16} className="animate-spin" />AI가 화면을 그리는 중입니다
              </div>
            )}

            <div className="border-t border-gray-100 p-3 space-y-2">
              <div className="flex gap-2">
                <input
                  value={instruction}
                  onChange={e => setInstruction(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); apply() } }}
                  placeholder="이 화면을 어떻게 고칠까요? (조회는 다시 하지 않습니다)"
                  disabled={turn.rendering || !current}
                  className="flex-1 px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-blue-400 text-sm disabled:bg-gray-50"
                />
                <button onClick={() => apply()} disabled={turn.rendering || !instruction.trim() || !current}
                  className="px-3 py-2 rounded-lg bg-gray-900 text-white disabled:opacity-40 text-sm flex items-center gap-1.5">
                  {turn.rendering ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}화면 고치기
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {RENDER_PRESETS.map(p => (
                  <button key={p} onClick={() => apply(p)} disabled={turn.rendering || !current}
                    className="text-xs px-2 py-1 rounded-md bg-gray-50 border border-gray-200 text-gray-600 hover:bg-blue-50 disabled:opacity-40">{p}</button>
                ))}
              </div>
            </div>
          </div>

          <Provenance provenance={turn.result.provenance} />
        </>
      )}

      {turn.trace && (
        <details className="bg-white rounded-xl border border-gray-200">
          <summary className="cursor-pointer px-4 py-3 text-sm text-gray-600">전체 Trace</summary>
          <pre className="mx-4 mb-4 p-3 bg-gray-50 rounded-lg text-xs overflow-x-auto whitespace-pre-wrap">
            {JSON.stringify(turn.trace, null, 2)}
          </pre>
        </details>
      )}
    </div>
  )
}

export default function KtwsCustom() {
  const [question, setQuestion] = useState('')
  const [turns, setTurns] = useState([])
  const [loading, setLoading] = useState(false)
  const { modelBody } = useModel() || { modelBody: {} }
  const endRef = useRef(null)
  const nextId = useRef(1)
  // setTurns 콜백 안에서 현재 상태를 훔쳐 읽으면 StrictMode에서 두 번 실행돼 어긋난다.
  // 읽기 전용 거울을 따로 둔다.
  const turnsRef = useRef(turns)
  useEffect(() => { turnsRef.current = turns }, [turns])

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [turns.length])

  const patchTurn = useCallback((id, u) => {
    setTurns(prev => prev.map(t => (t.id === id ? { ...t, ...(typeof u === 'function' ? u(t) : u) } : t)))
  }, [])

  // 그림 생성. 조회와 분리되어 있어 여기서 실패해도 숫자는 화면에 남는다.
  // cursor만 주면 조회도 생성도 하지 않고 이미 만든 버전 사이를 오간다.
  const render = useCallback(async (turnId, instruction = null, previousHtml = null, cursor = null) => {
    if (cursor != null) {
      patchTurn(turnId, t => ({ docs: { ...t.docs, cursor } }))
      return
    }
    const turn = turnsRef.current.find(t => t.id === turnId)
    if (!turn?.result) return

    patchTurn(turnId, { rendering: true })
    try {
      const res = await fetch('/api/dynamic-query/render', {
        method: 'POST',
        headers: jsonAuthHeaders(),
        body: JSON.stringify({
          ...modelBody,
          question: turn.question,
          columns: turn.result.columns || null,
          rows: turn.result.rows || [],
          value: turn.result.value ?? null,
          title: turn.result.title || null,
          provenance: turn.result.provenance || null,
          level: turn.trace?.resolution_level || null,
          instruction,
          html: previousHtml,
        }),
      })
      const data = await res.json()
      if (!res.ok || data.error) {
        patchTurn(turnId, { renderError: data.error || `HTTP ${res.status}`, rendering: false })
        return
      }
      patchTurn(turnId, t => {
        const kept = t.docs.list.slice(0, t.docs.cursor + 1)
        return {
          renderError: null,
          rendering: false,
          docs: { list: [...kept, { html: data.html, summary: data.summary, warnings: data.warnings || [] }], cursor: kept.length },
        }
      })
    } catch (err) {
      patchTurn(turnId, { renderError: `연결 오류: ${err.message}`, rendering: false })
    }
  }, [modelBody, patchTurn])

  const ask = useCallback(async (text) => {
    const q = (text ?? question).trim()
    if (!q || loading) return
    setLoading(true)
    setQuestion('')

    // 앞 턴들의 확정된 요구를 함께 보낸다 — 서버는 대화 상태를 저장하지 않는다.
    const history = turnsRef.current
      .filter(t => t.trace?.requirement)
      .slice(-3)
      .map(t => ({ question: t.question, requirement: t.trace.requirement }))

    const id = nextId.current++
    const isFollowUp = history.length > 0
    setTurns(prev => [...prev, {
      id, question: q, isFollowUp, loading: true, rendering: false,
      stages: [], text: '', result: null, trace: null, error: null, renderError: null,
      docs: { list: [], cursor: -1 },
    }])

    let result = null
    try {
      const res = await fetch('/api/dynamic-query', {
        method: 'POST',
        headers: jsonAuthHeaders(),
        body: JSON.stringify({ ...modelBody, message: q, history }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)

      for await (const e of iterateSSEEvents(res)) {
        if (e.type === 'stage') patchTurn(id, t => ({ stages: [...t.stages, e.label] }))
        else if (e.type === 'text') patchTurn(id, t => ({ text: t.text + e.text }))
        else if (e.type === 'result') { result = e; patchTurn(id, { result: e }) }
        else if (e.type === 'trace') patchTurn(id, { trace: e.trace })
        else if (e.type === 'error') patchTurn(id, { error: e.message })
      }
    } catch (err) {
      patchTurn(id, { error: `연결 오류: ${err.message}` })
    } finally {
      patchTurn(id, { loading: false })
      setLoading(false)
    }

    // 숫자가 나왔을 때만 그림을 그린다. 되묻기·차단이면 그릴 것이 없다.
    if (result) await render(id)
  }, [question, loading, modelBody, patchTurn, render])

  const canFollowUp = turns.some(t => t.trace?.requirement)

  return (
    <div className="p-6 space-y-6 max-w-6xl">
      <PageHeader
        title="Dynamic Semantic Query Planner (실험)"
        description="숫자는 코드가 냅니다 — 등록 리포트·지표가 이미 아는 의미를 먼저 쓰고, 둘 다 모를 때만 스키마에서 찾습니다. 그림은 AI가 HTML로 직접 그립니다. 앞 질문을 이어받아 계속 물을 수 있고, 화면만 고칠 때는 조회를 다시 하지 않습니다."
      />

      {turns.length > 0 && (
        <div className="space-y-8">
          {turns.map(t => <Turn key={t.id} turn={t} onRender={render} />)}
          <div ref={endRef} />
        </div>
      )}

      {/* 입력창을 아래에 둔다 — 대화가 쌓이는 화면이라 마지막 답 옆에 다음 질문이 와야 한다. */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 sticky bottom-4 shadow-sm">
        <div className="flex gap-2">
          <input
            value={question}
            onChange={e => setQuestion(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); ask() } }}
            placeholder={canFollowUp
              ? '이어서 물어보세요 — 앞 조건을 그대로 이어받습니다 (예: "그럼 8월은?")'
              : "예: 렉서스 강남 딜러에서 2026년 7월에 출고된 건 중 접수 유형이 'QR 접수'가 몇 건?"}
            className="flex-1 px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:border-blue-400 text-sm"
            disabled={loading}
          />
          <button onClick={() => ask()} disabled={loading || !question.trim()}
            className="px-4 py-2.5 rounded-lg bg-[#1e3a5f] text-white disabled:opacity-40 flex items-center gap-2 text-sm">
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            {canFollowUp ? '이어서 조회' : '조회'}
          </button>
          {turns.length > 0 && (
            <button onClick={() => { setTurns([]); setQuestion('') }} disabled={loading} title="대화 비우기"
              className="px-3 py-2.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40">
              <RotateCcw size={16} />
            </button>
          )}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {(canFollowUp ? FOLLOW_UP_PRESETS : EXAMPLES).map(ex => (
            <button key={ex} onClick={() => ask(ex)} disabled={loading}
              className="text-xs px-2.5 py-1 rounded-md bg-gray-50 border border-gray-200 text-gray-600 hover:bg-blue-50 hover:border-blue-200 disabled:opacity-40">
              {ex.length > 44 ? `${ex.slice(0, 44)}…` : ex}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
