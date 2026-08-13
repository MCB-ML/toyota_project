import { useCallback, useEffect, useMemo, useState } from 'react'
import { ChevronDown, ChevronRight, Eye, History, Loader2, Pin, RotateCcw, X } from 'lucide-react'
import { useUser } from '../auth/UserContext'
import { authHeaders as buildAuthHeaders } from '../auth/session'
import WidgetGrid from './WidgetGrid'

function formatWhen(iso) {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso || '-'
  const pad = (value) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

async function readJsonOrThrow(res) {
  const body = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(body.message || `HTTP ${res.status}`)
  return body
}

export default function DeployHistoryPanel({ scopeKey, pageKey, onPinned }) {
  const { ai365 } = useUser()
  const authHeaders = useMemo(() => buildAuthHeaders({}, ai365), [ai365?.token])
  const jsonHeaders = useMemo(() => buildAuthHeaders({ 'Content-Type': 'application/json' }, ai365), [ai365?.token])
  const [open, setOpen] = useState(false)
  const [state, setState] = useState({ status: 'idle', history: [], canPin: false })
  const [pinning, setPinning] = useState(null)
  const [error, setError] = useState(null)
  const [preview, setPreview] = useState(null)

  const load = useCallback(() => {
    if (!scopeKey || !pageKey) return
    setState((prev) => ({ ...prev, status: 'loading' }))
    fetch(`/api/dashboard-pages/deploy-history?scopeKey=${encodeURIComponent(scopeKey)}&pageKey=${encodeURIComponent(pageKey)}`, {
      headers: authHeaders,
    })
      .then(async (res) => {
        if (res.status === 401) return { denied: true, message: '로그인이 필요하거나 세션이 만료되었습니다.' }
        if (res.status === 403) return { denied: true, message: '이 소속의 배포 이력을 볼 권한이 없습니다.' }
        return readJsonOrThrow(res)
      })
      .then((data) => {
        if (data.denied) {
          setState({ status: 'denied', history: [], canPin: false, message: data.message })
          return
        }
        setState({ status: 'ready', history: data.history || [], canPin: !!data.canPin })
      })
      .catch((err) => setState({ status: 'error', history: [], canPin: false, message: err.message }))
  }, [authHeaders, pageKey, scopeKey])

  useEffect(() => { load() }, [load])
  useEffect(() => { setOpen(false); setError(null); setPreview(null) }, [scopeKey, pageKey])

  const previewVersion = (entry) => {
    setPreview({ entry, status: 'loading', widgets: [] })
    const ask = (withData, objectIds) => fetch('/api/dashboard-pages/deploy-preview', {
      method: 'POST',
      headers: jsonHeaders,
      body: JSON.stringify({ scopeKey, pageKey, pageId: entry.pageId, version: entry.version, withData, objectIds }),
    }).then(readJsonOrThrow)

    ask(false)
      .then((data) => {
        setPreview((current) => (current?.entry.id === entry.id ? { ...current, status: 'ready', widgets: data.widgets || [] } : current))
        const pending = (data.widgets || []).filter((widget) => widget.runtime?.status === 'loading')
        if (!pending.length) return null
        return ask(true, pending.map((widget) => widget.id)).then(({ widgets }) => {
          const byId = new Map((widgets || []).map((widget) => [widget.id, widget]))
          setPreview((current) => (current?.entry.id === entry.id
            ? { ...current, widgets: current.widgets.map((widget) => byId.get(widget.id) || widget) }
            : current))
          return null
        })
      })
      .catch((err) => {
        setPreview((current) => (current?.entry.id === entry.id ? { ...current, status: 'error', message: err.message } : current))
      })
  }

  const pin = (entry) => {
    setPinning(entry.id)
    setError(null)
    fetch('/api/dashboard-pages/deploy-version', {
      method: 'POST',
      headers: jsonHeaders,
      body: JSON.stringify({ scopeKey, targetPageKey: pageKey, pageId: entry.pageId, version: entry.version }),
    })
      .then(readJsonOrThrow)
      .then(() => { setPreview(null); load(); onPinned?.() })
      .catch((err) => setError(err.message))
      .finally(() => setPinning(null))
  }

  return (
    <div className="mx-6 mt-4 rounded-lg border border-gray-200 bg-white">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center gap-2 rounded-lg px-4 py-3 text-left text-sm font-medium text-gray-700 hover:bg-gray-50"
      >
        {open ? <ChevronDown size={15} className="text-gray-400" /> : <ChevronRight size={15} className="text-gray-400" />}
        <History size={15} className="text-gray-400" />
        배포 이력
        {state.status === 'ready' && <span className="text-xs font-normal text-gray-400">{state.history.length}건</span>}
        {state.status === 'loading' && <Loader2 size={13} className="animate-spin text-gray-300" />}
      </button>

      {open && (
        <div className="border-t border-gray-100 px-4 py-3">
          {state.status === 'error' && <p className="py-4 text-center text-xs text-red-500">이력을 불러오지 못했습니다. {state.message}</p>}
          {state.status === 'denied' && <p className="py-4 text-center text-xs text-gray-400">{state.message}</p>}
          {(state.status === 'idle' || state.status === 'loading') && <p className="py-4 text-center text-xs text-gray-300">불러오는 중</p>}
          {state.status === 'ready' && state.history.length === 0 && <p className="py-6 text-center text-xs text-gray-400">아직 이 화면에 배포된 기록이 없습니다.</p>}
          {error && <p className="mb-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>}

          {state.status === 'ready' && state.history.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-left text-gray-400">
                    <th className="py-2 pr-3 font-medium">배포 시각</th>
                    <th className="py-2 pr-3 font-medium">저장본</th>
                    <th className="py-2 pr-3 font-medium">작업자</th>
                    <th className="py-2 font-medium" />
                  </tr>
                </thead>
                <tbody>
                  {state.history.map((entry) => (
                    <tr key={entry.id} className="border-t border-gray-50">
                      <td className="py-2 pr-3 whitespace-nowrap text-gray-500">
                        {formatWhen(entry.createdAt)}
                        {entry.isCurrent && entry.activatedAt && formatWhen(entry.activatedAt) !== formatWhen(entry.createdAt) && (
                          <span className="block text-[10px] text-gray-400">{formatWhen(entry.activatedAt)} 다시 적용</span>
                        )}
                      </td>
                      <td className="py-2 pr-3 text-gray-700">
                        {entry.pageName || <span className="text-gray-300">삭제됨</span>}
                        {entry.isCurrent && <span className="ml-1.5 rounded bg-green-50 px-1.5 py-0.5 text-[10px] font-semibold text-green-600">사용 중</span>}
                      </td>
                      <td className="py-2 pr-3 text-gray-500">{(entry.actorEmail || '').split('@')[0] || '-'}</td>
                      <td className="py-2 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          {entry.restorable && (
                            <button type="button" onClick={() => previewVersion(entry)} className="inline-flex items-center gap-1 rounded-md border border-gray-200 px-2 py-1 font-medium text-gray-600 hover:bg-gray-50">
                              <Eye size={11} />미리보기
                            </button>
                          )}
                          {state.canPin && entry.restorable && !entry.isCurrent && (
                            <button type="button" onClick={() => pin(entry)} disabled={pinning !== null} className="inline-flex items-center gap-1 rounded-md border border-gray-200 px-2 py-1 font-medium text-gray-600 hover:bg-blue-50 hover:text-blue-600 disabled:opacity-50">
                              {pinning === entry.id ? <Loader2 size={11} className="animate-spin" /> : <RotateCcw size={11} />}
                              이 버전으로
                            </button>
                          )}
                          {entry.isCurrent && <Pin size={12} className="text-green-500" />}
                          {!entry.restorable && !entry.isCurrent && <span className="text-gray-300">복원 불가</span>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!state.canPin && <p className="mt-3 text-[11px] text-gray-400">조회 권한만 있습니다. 공용 대시보드를 바꾸려면 해당 소속 계정이거나 본사 관리자여야 합니다.</p>}
            </div>
          )}
        </div>
      )}

      {preview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-6" onClick={() => setPreview(null)}>
          <div className="flex max-h-full w-full max-w-6xl flex-col overflow-hidden rounded-lg bg-white shadow-xl" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-center gap-3 border-b border-gray-100 px-5 py-3">
              <Eye size={16} className="text-gray-400" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-gray-800">{preview.entry.pageName}</p>
                <p className="text-[11px] text-gray-400">{formatWhen(preview.entry.createdAt)} 배포 · {(preview.entry.actorEmail || '').split('@')[0]}</p>
              </div>
              {state.canPin && !preview.entry.isCurrent && preview.status === 'ready' && (
                <button type="button" onClick={() => pin(preview.entry)} disabled={pinning !== null} className="inline-flex items-center gap-1.5 rounded-lg bg-[#1a73e8] px-3 py-2 text-xs font-medium text-white hover:bg-[#1765cc] disabled:opacity-50">
                  {pinning === preview.entry.id ? <Loader2 size={13} className="animate-spin" /> : <RotateCcw size={13} />}
                  이 버전으로 고정
                </button>
              )}
              <button type="button" onClick={() => setPreview(null)} className="rounded-lg p-2 text-gray-400 hover:bg-gray-100" title="닫기">
                <X size={16} />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-auto bg-[#f7f8fa] p-5">
              {preview.status === 'loading' && <div className="flex items-center justify-center py-20"><Loader2 size={26} className="animate-spin text-gray-300" /></div>}
              {preview.status === 'error' && <p className="py-20 text-center text-sm text-red-500">{preview.message}</p>}
              {preview.status === 'ready' && (preview.widgets.length ? <WidgetGrid widgets={preview.widgets} readOnly /> : <p className="py-20 text-center text-sm text-gray-400">이 버전에는 위젯이 없습니다.</p>)}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
