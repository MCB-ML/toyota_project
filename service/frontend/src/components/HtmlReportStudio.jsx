import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useModel } from '../llm/ModelContext'
import {
  AlertTriangle, Code2, Download, ExternalLink, Eye, Loader2, Maximize2,
  Database, FileDown, Minimize2, RefreshCw, RotateCcw, Redo2, Send, Sparkles, Undo2,
} from 'lucide-react'

// 단일 HTML 대시보드 작업대 — 챗봇으로 고치고, 그 자리에서 본다.
//
// 새 탭 미리보기는 "고쳤다 → 탭 열었다 → 확인했다 → 탭 닫았다"를 매 턴 반복하게
// 만든다. 그 사이에 방금 뭘 시켰는지가 흐려져서, 정작 원하는 모습에 다가가는 데
// 필요한 짧은 왕복이 안 된다. 그래서 미리보기를 화면 안에 붙박이로 둔다.
//
// iframe에 srcDoc으로 넣는다. Blob URL은 매번 새 URL을 만들어 되돌리기가 잦은
// 이 화면에서 누수가 나기 쉽고, 문자열을 그대로 넣으면 상태와 화면이 항상 같다.
//
// sandbox에서 allow-same-origin을 **일부러 뺐다.** allow-scripts와 함께 주면
// 문서가 부모 앱과 같은 출처가 되어 세션·토큰에 손댈 수 있다. 뺀 상태로도
// 스크립트는 돌아가므로(고립된 출처) 인터랙티브한 차트를 만들어 달라고 해도 된다.
const SANDBOX = 'allow-scripts allow-popups allow-modals allow-forms'

const HEIGHTS = [
  { key: 'md', label: '보통', px: 760 },
  { key: 'lg', label: '크게', px: 1100 },
  { key: 'xl', label: '전체 문서', px: 2200 },
]

// 무엇을 시킬 수 있는지 안 보이면 사람들은 "글씨 키워줘"에서 멈춘다.
// 구조를 바꾸는 지시가 된다는 걸 보기로 알린다.
const PRESETS = [
  '기회와 계약도 월별 추이 차트에 넣어줘',
  '활동→기회→시승→계약 전환율을 표로 만들어줘',
  '맨 위에 경영진용 요약 3줄을 추가해줘',
  '채널별 구성을 가로 막대 대신 도넛 차트로 바꿔줘',
  'A4 한 장에 인쇄되도록 여백과 글자 크기를 맞춰줘',
]

const kb = (bytes) => `${(Number(bytes ?? 0) / 1024).toFixed(1)}KB`

/**
 * 미리보기 전용 테마 고정.
 *
 * 생성된 문서는 prefers-color-scheme를 따르는데, 밝은 작업 화면 한가운데서
 * 미리보기만 까맣게 뜨면 "내가 만든 게 이게 맞나" 싶어진다. 문서 자체는 건드리지
 * 않는다 — 내려받는 파일에는 이 속성이 들어가지 않는다.
 */
export function withPreviewTheme(html, theme) {
  if (!html || theme === 'auto') return html
  return html.replace(/<html\b([^>]*)>/i, (m, attrs) =>
    `<html${attrs.replace(/\s*data-theme="[^"]*"/i, '')} data-theme="${theme}">`)
}

/** 버전 목록에서 현재 위치를 잘라내고 새 버전을 얹는다(되돌린 뒤 새로 고치면 앞의 것은 버린다). */
function pushVersion(state, version) {
  return { list: [...state.list.slice(0, state.cursor + 1), version], cursor: state.cursor + 1 }
}

/**
 * 한 턴이 얼마나 걸렸고 얼마나 썼는지. 안 보이면 "왜 이렇게 느리지"를 사람이 추측하게 되고,
 * 전체 재작성으로 빠진 턴(mode=document)과 블록만 고친 턴을 구분할 수 없다.
 */
function TurnCost({ meta }) {
  if (!meta) return null
  const parts = [meta.model, `${meta.seconds.toFixed(1)}초`].filter(Boolean)
  if (meta.applied?.length) parts.push(`블록 ${meta.applied.join(', ')}`)
  else if (meta.mode === 'document') parts.push('문서 전체 재작성')
  if (meta.usage?.completion) parts.push(`출력 ${meta.usage.completion.toLocaleString('ko-KR')}토큰`)
  if (meta.usage?.cached) parts.push(`입력 캐시 ${meta.usage.cached.toLocaleString('ko-KR')}`)
  return <p className="mt-1.5 text-[11px] text-gray-400">{parts.join(' · ')}</p>
}

/**
 * 이번 턴에 돌린 조회. **접어 두되 늘 붙인다.**
 *
 * 정의서 규칙으로 그때그때 만든 SQL이라 대조할 정답이 없다 — 숫자가 의심스러울 때
 * 사람이 볼 수 있는 근거는 이 SQL뿐이다. 안 보이는 곳에 두면 아무도 안 본다.
 */
function QueryDetails({ query }) {
  if (!query) return null
  const failed = Boolean(query.error)
  return (
    <details className={`mt-2 rounded border px-2 py-1.5 ${failed ? 'border-red-200 bg-red-50' : 'border-gray-200 bg-white'}`}>
      <summary className={`cursor-pointer text-[11px] ${failed ? 'text-red-700' : 'text-gray-500'}`}>
        <Database size={11} className="mr-1 inline" />
        {failed ? '조회 실패 — SQL 보기' : `조회 ${query.rows}행${query.truncated ? ` / 전체 ${query.truncated}` : ''} · ${query.elapsedMs}ms — SQL 보기`}
      </summary>
      {failed && <p className="mt-1.5 text-[11px] text-red-700">{query.error}</p>}
      <pre className="mt-1.5 max-h-64 overflow-auto whitespace-pre-wrap break-all rounded bg-gray-50 p-2 font-mono text-[10px] leading-relaxed text-gray-700">
        {query.sql}
      </pre>
    </details>
  )
}

function StatDelta({ stats }) {
  if (!stats?.before || !stats?.after) return null
  const rows = [
    ['용량', kb(stats.before.bytes), kb(stats.after.bytes)],
    ['섹션', stats.before.sections, stats.after.sections],
    ['표', stats.before.tables, stats.after.tables],
    ['차트', stats.before.charts, stats.after.charts],
  ].filter(([, b, a]) => String(b) !== String(a))
  if (!rows.length) return <p className="mt-1.5 text-[11px] text-gray-400">뼈대는 그대로입니다.</p>
  return (
    <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-gray-500">
      {rows.map(([label, b, a]) => (
        <span key={label} className="tabular-nums">{label} {b} → {a}</span>
      ))}
    </div>
  )
}

export default function HtmlReportStudio({ brand, sourceUrl, metricsUrl, downloadName }) {
  const [history, setHistory] = useState({ list: [], cursor: -1 })
  const [loadedBrand, setLoadedBrand] = useState(null)
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState(null)
  // 지표 카탈로그 + 집계 시리즈. 편집 요청마다 같이 보내서, 문서에 안 박힌 지표도
  // 챗봇이 골라 쓸 수 있게 한다 — 이게 없으면 "기회도 넣어줘"에 지어내거나 거절한다.
  const [data, setData] = useState(null)

  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  // 진행 중에 아무 변화가 없으면 멈춘 건지 도는 건지 알 수 없다. 초를 세어 보여준다.
  const [elapsed, setElapsed] = useState(0)

  const [height, setHeight] = useState('md')
  const [wide, setWide] = useState(false)
  const [showCode, setShowCode] = useState(false)
  const [draft, setDraft] = useState('')

  const { modelBody, current: currentModel } = useModel()
  const bottomRef = useRef(null)
  const seq = useRef(0)
  const nextId = () => { seq.current += 1; return seq.current }

  const current = history.list[history.cursor] || null
  const edited = history.cursor > 0
  const canUndo = history.cursor > 0
  const canRedo = history.cursor < history.list.length - 1

  const load = useCallback(async (refresh = false) => {
    setLoading(true)
    setLoadError(null)
    const bust = (url) => (refresh ? `${url}${url.includes('?') ? '&' : '?'}refresh=1` : url)
    // 지표 조회는 따로 띄운다 — 실패해도 문서는 보여야 한다. 챗봇이 새 지표를 못 쓸 뿐이다.
    fetch(bust(metricsUrl), { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((body) => setData(body))
      .catch(() => setData(null))
    try {
      const r = await fetch(bust(sourceUrl), { credentials: 'include' })
      const text = await r.text()
      if (!r.ok) {
        // 실패하면 JSON 오류 본문이 온다 — HTML 자리에 그걸 그대로 띄우면 원인이 안 보인다.
        let message = `원본 생성 실패 (${r.status})`
        try { message = JSON.parse(text).error || message } catch { /* 본문이 JSON이 아니면 상태코드로 */ }
        throw new Error(message)
      }
      setHistory({ list: [{ html: text, label: '원본', summary: '서버가 생성한 원본입니다.' }], cursor: 0 })
      setMessages([])
      setLoadedBrand(brand)
    } catch (e) {
      setLoadError(e.message)
    } finally {
      setLoading(false)
    }
  }, [sourceUrl, metricsUrl, brand])

  // 첫 진입과 "고친 게 없는 상태에서의 브랜드 변경"만 자동으로 다시 불러온다.
  // 편집본이 있는데 자동으로 갈아끼우면 브랜드 버튼 한 번에 작업이 통째로 날아간다.
  useEffect(() => {
    if (!history.list.length || (!edited && brand !== loadedBrand)) load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brand])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }) }, [messages, busy])

  useEffect(() => {
    if (!busy) return undefined
    setElapsed(0)
    const started = Date.now()
    const t = setInterval(() => setElapsed(Math.round((Date.now() - started) / 1000)), 500)
    return () => clearInterval(t)
  }, [busy])
  useEffect(() => { if (showCode) setDraft(current?.html ?? '') }, [showCode, history.cursor])

  // 미리보기는 라이트로 고정한다 — PDF도 라이트로 나가므로 화면과 결과물이 같다.
  // 문서 자체의 다크모드 지원은 그대로다(보는 사람 환경을 따른다).
  const previewHtml = useMemo(() => withPreviewTheme(current?.html ?? '', 'light'), [current])

  const send = useCallback(async (text) => {
    const instruction = (text ?? input).trim()
    if (!instruction || busy || !current) return
    setInput('')
    setMessages((m) => [...m, { id: nextId(), role: 'user', text: instruction }])
    setBusy(true)
    const startedAt = Date.now()

    // 이력은 지시와 요약만 넘긴다 — 문서 전문은 아래 html에 한 번만 실린다.
    const apiHistory = messages
      .filter((m) => m.text || m.summary)
      .map((m) => ({ role: m.role, content: m.text || m.summary }))

    try {
      const r = await fetch('/api/dealer-funnel/report-edit', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...modelBody, html: current.html, instruction, history: apiHistory, data }),
      })
      const body = await r.json()
      if (!r.ok) throw new Error(body.error || `수정 실패 (${r.status})`)

      setHistory((h) => pushVersion(h, { html: body.html, label: instruction, summary: body.summary }))
      setMessages((m) => [...m, {
        id: nextId(), role: 'assistant', summary: body.summary,
        warnings: body.warnings || [], stats: { before: body.before, after: body.after },
        meta: {
          seconds: (Date.now() - startedAt) / 1000,
          mode: body.mode, applied: body.applied, usage: body.usage,
          model: currentModel?.label || null,
        },
        query: body.fetched || null,
      }])
    } catch (e) {
      setMessages((m) => [...m, { id: nextId(), role: 'assistant', error: e.message }])
    } finally {
      setBusy(false)
    }
  }, [input, busy, current, messages, data, modelBody, currentModel])

  const applyDraft = () => {
    if (!draft.trim() || draft === current?.html) return
    setHistory((h) => pushVersion(h, { html: draft, label: '직접 수정', summary: '코드를 직접 고쳤습니다.' }))
    setMessages((m) => [...m, { id: nextId(), role: 'assistant', summary: '코드를 직접 고친 내용을 적용했습니다.', warnings: [] }])
  }

  /**
   * PDF로 뽑는다 — 브라우저 인쇄 대화상자를 거친다.
   *
   * 라이브러리를 쓰지 않는다. html2canvas 계열은 화면을 그림으로 떠서 글자가 픽셀이 되고
   * 표를 복사할 수 없다. 브라우저 인쇄는 글자를 글자로 남기고 페이지 나눔도 CSS가 정한다.
   *
   * **미리보기 iframe이 아니라 전용 iframe을 새로 만든다.** 미리보기는 문서 안 스크립트를
   * 돌리려고 allow-scripts로 띄우는데, 그러면 부모가 print()를 부를 수 없다(다른 출처).
   * 여기서는 반대로 allow-scripts를 빼고 allow-same-origin을 준다 — 스크립트가 안 도니
   * 같은 출처여도 안전하고, 차트는 인라인 SVG라 스크립트 없이 그대로 그려진다.
   */
  const exportPdf = () => {
    if (!current) return
    const frame = document.createElement('iframe')
    // 화면 밖이되 실제 크기를 준다 — 0×0이면 레이아웃이 잡히지 않아 빈 페이지가 인쇄된다.
    frame.style.cssText = 'position:fixed;left:-10000px;top:0;width:1024px;height:1400px;border:0;'
    frame.setAttribute('sandbox', 'allow-same-origin allow-modals')
    frame.srcdoc = withPreviewTheme(current.html, 'light')
    frame.onload = () => {
      try {
        frame.contentWindow.focus()
        frame.contentWindow.print()
      } catch (e) {
        setMessages((m) => [...m, { id: nextId(), role: 'assistant', error: `PDF 내보내기에 실패했습니다: ${e.message}` }])
      }
      // 인쇄 대화상자가 떠 있는 동안 지우면 취소된다. 넉넉히 두고 치운다.
      setTimeout(() => frame.remove(), 120_000)
    }
    document.body.appendChild(frame)
  }

  const download = () => {
    if (!current) return
    const url = URL.createObjectURL(new Blob([current.html], { type: 'text/html;charset=utf-8' }))
    const a = document.createElement('a')
    a.href = url
    a.download = downloadName
    a.click()
    URL.revokeObjectURL(url)
  }

  // 새 탭은 서버 원본이 아니라 **지금 보고 있는 편집본**을 연다. 편집한 뒤에 새 탭을
  // 열었더니 안 고친 문서가 뜨면 "왜 안 바뀌었지"로 한참 헤맨다.
  const openInTab = () => {
    if (!current) return
    const url = URL.createObjectURL(new Blob([current.html], { type: 'text/html;charset=utf-8' }))
    window.open(url, '_blank', 'noopener')
    setTimeout(() => URL.revokeObjectURL(url), 60_000)
  }

  const heightPx = HEIGHTS.find((h) => h.key === height)?.px ?? 760

  const toolBtn = (active) =>
    `rounded px-2 py-1 text-xs ${active ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-100'}`

  return (
    <section className="rounded-lg border border-gray-200 bg-white">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-5 py-4">
        <div>
          <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-900">
            <Sparkles size={14} className="text-gray-400" />
            HTML 작업대 — 챗봇으로 고치고 그 자리에서 봅니다
          </h2>
          <p className="mt-1 text-xs text-gray-500">
            말한 대로 고칠 블록만 다시 씁니다. 마음에 안 들면 되돌리면 되니 편하게 시켜 보세요.
            {edited && <span className="ml-1 text-gray-900">· 편집본 {history.cursor}번째</span>}
          </p>
          {/* 캐시된 값을 방금 조회한 값으로 착각하면 "왜 어제 숫자지"를 한참 헤맨다. */}
          {data?.cache?.fetchedAt && (
            <p className="mt-0.5 text-[11px] text-gray-400">
              데이터 {new Date(data.cache.fetchedAt).toLocaleString('ko-KR', { hour12: false })} 기준
              {data.cache.state === 'stale' && ' · 뒤에서 새로 조회 중'}
              {data.cache.state === 'fresh' && ' · 캐시'}
              {' · ETL이 새로 돌면 자동으로 갱신됩니다'}
            </p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-1">
          <button type="button" className={toolBtn(false)} disabled={!canUndo}
            onClick={() => setHistory((h) => ({ ...h, cursor: h.cursor - 1 }))}
            title="한 단계 되돌리기">
            <span className="flex items-center gap-1"><Undo2 size={13} />되돌리기</span>
          </button>
          <button type="button" className={toolBtn(false)} disabled={!canRedo}
            onClick={() => setHistory((h) => ({ ...h, cursor: h.cursor + 1 }))}
            title="되돌린 것을 다시 적용">
            <span className="flex items-center gap-1"><Redo2 size={13} />다시</span>
          </button>
          <button type="button" className={toolBtn(false)} onClick={() => load(false)} title="캐시된 원본으로 되돌립니다 — 편집본은 버려집니다">
            <span className="flex items-center gap-1"><RotateCcw size={13} />원본으로</span>
          </button>
          {/* 캐시를 건너뛰고 Fabric에서 다시 만든다. 20초 넘게 걸리므로 원본으로와 나눠 둔다 —
              대개는 캐시로 충분하고, 방금 적재된 걸 봐야 할 때만 이쪽이다. */}
          <button type="button" className={toolBtn(false)} onClick={() => load(true)} title="Fabric에서 다시 집계합니다 (20초 이상 걸립니다)">
            <span className="flex items-center gap-1"><RefreshCw size={13} />데이터 새로 조회</span>
          </button>
          <span className="mx-1 h-4 w-px bg-gray-200" />
          <button type="button" className={toolBtn(showCode)} onClick={() => setShowCode((v) => !v)}>
            <span className="flex items-center gap-1">{showCode ? <Eye size={13} /> : <Code2 size={13} />}{showCode ? '미리보기' : '코드'}</span>
          </button>
          <button type="button" className={toolBtn(false)} onClick={download} disabled={!current}>
            <span className="flex items-center gap-1"><Download size={13} />HTML</span>
          </button>
          <button type="button" className={toolBtn(false)} onClick={exportPdf} disabled={!current}
            title="브라우저 인쇄 대화상자에서 '대상'을 PDF로 저장으로 고르세요">
            <span className="flex items-center gap-1"><FileDown size={13} />PDF</span>
          </button>
          <button type="button" className={toolBtn(false)} onClick={openInTab} disabled={!current}>
            <span className="flex items-center gap-1"><ExternalLink size={13} />새 탭</span>
          </button>
        </div>
      </div>

      {brand !== loadedBrand && edited && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-200 bg-amber-50 px-5 py-2.5 text-xs text-amber-900">
          <span>브랜드 선택이 바뀌었지만 편집본을 지키려고 문서를 그대로 뒀습니다 — 지금 미리보기는 이전 브랜드 기준입니다.</span>
          <button type="button" onClick={load} className="rounded border border-amber-400 px-2 py-1 font-medium hover:bg-amber-100">
            새 브랜드로 다시 생성 (편집본 버림)
          </button>
        </div>
      )}

      {loadError && (
        <div className="m-5 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {loadError}
          <button type="button" onClick={load} className="ml-2 underline">다시 시도</button>
        </div>
      )}

      <div className={`grid gap-0 ${wide ? '' : 'lg:grid-cols-[360px_1fr]'}`}>
        {/* ── 챗 ────────────────────────────────────────────────── */}
        {!wide && (
          <div className="flex flex-col border-b border-gray-100 lg:border-b-0 lg:border-r" style={{ height: heightPx + 96 }}>
            <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
              {/* 챗봇이 쓸 수 있는 지표를 먼저 보여준다. 안 보이면 "문서에 있는 것만 되겠지"
                  하고 구조만 바꾸는 지시에서 멈춘다 — 실제로는 지표를 새로 넣을 수 있다. */}
              {data?.metrics?.length > 0 && (
                <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2">
                  <div className="text-[11px] font-medium text-gray-600">챗봇이 쓸 수 있는 지표</div>
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {data.metrics.map((m) => (
                      <span key={m.id} title={m.available ? `${m.definition}\n기간 기준 ${m.dateBasis}` : m.error}
                        className={`rounded px-1.5 py-0.5 text-[11px] ${m.available ? 'bg-white text-gray-700 ring-1 ring-gray-200' : 'bg-red-50 text-red-700 ring-1 ring-red-200'}`}>
                        {m.id}{m.available ? ` ${Number(m.total ?? 0).toLocaleString('ko-KR')}` : ' 조회 실패'}
                      </span>
                    ))}
                  </div>
                  <p className="mt-1.5 text-[11px] text-gray-500">
                    문서에 없는 지표도 넣어 달라고 하면 됩니다 — 위 집계를 그대로 씁니다.
                  </p>
                </div>
              )}

              {!messages.length && (
                <div className="space-y-2">
                  <p className="text-xs text-gray-500">이렇게 시켜 보세요 — 구조를 바꾸는 지시도 됩니다.</p>
                  {PRESETS.map((p) => (
                    <button key={p} type="button" onClick={() => send(p)} disabled={busy || !current}
                      className="block w-full rounded-md border border-gray-200 px-3 py-2 text-left text-xs text-gray-700 hover:border-gray-400 hover:bg-gray-50 disabled:opacity-50">
                      {p}
                    </button>
                  ))}
                </div>
              )}

              {messages.map((m) => m.role === 'user' ? (
                // 원하는 모습에 다가가는 길은 대개 "같은 지시를 조금 고쳐 다시"다.
                // 되돌리기로 한 칸 물러난 뒤 이 버튼으로 문구만 손보면 한 바퀴가 끝난다.
                <div key={m.id} className="ml-6 group">
                  <div className="rounded-lg rounded-br-sm bg-gray-900 px-3 py-2 text-sm text-white">{m.text}</div>
                  <button type="button" onClick={() => setInput(m.text)}
                    className="mt-0.5 w-full text-right text-[11px] text-gray-400 opacity-0 transition group-hover:opacity-100 hover:text-gray-900">
                    이 지시 고쳐서 다시
                  </button>
                </div>
              ) : (
                <div key={m.id} className={`mr-6 rounded-lg rounded-bl-sm border px-3 py-2 text-sm ${m.error ? 'border-red-200 bg-red-50 text-red-700' : 'border-gray-200 bg-gray-50 text-gray-800'}`}>
                  {m.error || m.summary}
                  {!m.error && <TurnCost meta={m.meta} />}
                  <QueryDetails query={m.query} />
                  {!m.error && <StatDelta stats={m.stats} />}
                  {m.warnings?.map((w) => (
                    <p key={w} className="mt-2 flex gap-1.5 rounded border border-amber-200 bg-amber-50 px-2 py-1.5 text-[11px] text-amber-900">
                      <AlertTriangle size={12} className="mt-0.5 flex-shrink-0" />{w}
                    </p>
                  ))}
                </div>
              ))}

              {busy && (
                <div className="mr-6 flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-500">
                  <Loader2 size={14} className="animate-spin" />
                  고칠 블록을 다시 쓰는 중입니다… <span className="tabular-nums text-gray-400">{elapsed}초</span>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            <div className="border-t border-gray-100 p-3">
              <div className="flex items-end gap-2">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
                  }}
                  rows={2}
                  placeholder={current ? '무엇을 어떻게 바꿀까요?  (Enter 전송 · Shift+Enter 줄바꿈)' : '원본을 불러오는 중입니다…'}
                  disabled={!current || busy}
                  className="min-h-[52px] flex-1 resize-none rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-900 disabled:bg-gray-50"
                />
                <button type="button" onClick={() => send()} disabled={!input.trim() || busy || !current}
                  className="rounded-md bg-gray-900 p-2.5 text-white hover:bg-gray-800 disabled:opacity-40">
                  {busy ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── 미리보기 ──────────────────────────────────────────── */}
        <div className="min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 bg-gray-50 px-4 py-2">
            <div className="flex items-center gap-1">
              {HEIGHTS.map(({ key, label }) => (
                <button key={key} type="button" onClick={() => setHeight(key)} className={toolBtn(height === key)}>{label}</button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              {current && <span className="text-[11px] tabular-nums text-gray-400">{kb(new Blob([current.html]).size)}</span>}
              <button type="button" onClick={() => setWide((v) => !v)} className={toolBtn(wide)}>
                <span className="flex items-center gap-1">{wide ? <Minimize2 size={12} /> : <Maximize2 size={12} />}{wide ? '챗 열기' : '넓게'}</span>
              </button>
            </div>
          </div>

          {showCode ? (
            <div className="p-4" style={{ height: heightPx + 56 }}>
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                spellCheck={false}
                className="h-[calc(100%-44px)] w-full resize-none rounded-md border border-gray-200 p-3 font-mono text-[11px] leading-relaxed outline-none focus:border-gray-900"
              />
              <div className="mt-2 flex items-center gap-2">
                <button type="button" onClick={applyDraft} disabled={!draft.trim() || draft === current?.html}
                  className="rounded-md bg-gray-900 px-3 py-1.5 text-xs text-white hover:bg-gray-800 disabled:opacity-40">
                  적용 (새 버전으로)
                </button>
                <button type="button" onClick={() => setDraft(current?.html ?? '')} className="text-xs text-gray-500 hover:text-gray-900">
                  되돌리기
                </button>
                <span className="text-[11px] text-gray-400">챗봇이 못 잡아내는 자리는 여기서 직접 고칩니다.</span>
              </div>
            </div>
          ) : (
            <div className="overflow-auto bg-gray-100 p-4" style={{ height: heightPx + 56 }}>
              {loading && <p className="p-6 text-sm text-gray-500">Fabric에서 집계해 HTML을 생성하는 중입니다…</p>}
              {!loading && current && (
                <iframe
                  key={history.cursor}
                  title="HTML 대시보드 미리보기"
                  srcDoc={previewHtml}
                  sandbox={SANDBOX}
                  className="mx-auto block border-0 bg-white shadow-sm"
                  style={{ width: '100%', height: heightPx }}
                />
              )}
            </div>
          )}
        </div>
      </div>

      <p className="border-t border-gray-100 px-5 py-3 text-xs text-gray-500">
        미리보기는 문서를 격리해서 띄웁니다(부모 화면의 로그인 정보에 접근할 수 없습니다).
        높이는 고정이라 문서가 길면 미리보기 안에서 스크롤됩니다 — 전체를 한눈에 보려면 &lsquo;전체 문서&rsquo;를 고르세요.
        {edited && ' 지금 내려받으면 서버 원본이 아니라 편집본이 저장됩니다.'}
      </p>
    </section>
  )
}
