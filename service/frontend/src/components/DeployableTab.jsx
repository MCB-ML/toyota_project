import { useEffect, useMemo, useState } from 'react'
import { Filter, Loader2 } from 'lucide-react'
import { useUser } from '../auth/UserContext'
import { authHeaders as buildAuthHeaders } from '../auth/session'
import { useScopes } from '../hooks/useScopes'
import DeployHistoryPanel from './DeployHistoryPanel'
import WidgetGrid from './WidgetGrid'

function scopeKeyForUser(user) {
  if (user.role === 'hq') return 'hq'
  if (user.role === 'dealer') return `dealer:${user.dealerId}`
  return null
}

export default function DeployableTab({ pageKey, children }) {
  const { user, ai365 } = useUser()
  const scopes = useScopes()
  const isHq = user.role === 'hq'
  const ownScopeKey = scopeKeyForUser(user)
  const authHeaders = useMemo(() => buildAuthHeaders({}, ai365), [ai365?.token])
  const jsonHeaders = useMemo(() => buildAuthHeaders({ 'Content-Type': 'application/json' }, ai365), [ai365?.token])

  const [viewScopeKey, setViewScopeKey] = useState(ownScopeKey)
  const [reloadKey, setReloadKey] = useState(0)
  const [deployed, setDeployed] = useState(null)

  useEffect(() => { setViewScopeKey(ownScopeKey) }, [pageKey, ownScopeKey])

  useEffect(() => {
    if (!viewScopeKey) { setDeployed(null); return undefined }
    let cancelled = false
    setDeployed(undefined)
    fetch(`/api/dashboard-pages/deployed?scopeKey=${encodeURIComponent(viewScopeKey)}&pageKey=${encodeURIComponent(pageKey)}`, { headers: authHeaders })
      .then((res) => { if (!res.ok) throw new Error(`HTTP ${res.status}`); return res.json() })
      .then((data) => {
        if (cancelled) return
        if (!data.deployed) { setDeployed(null); return }
        setDeployed(data)
        const pending = data.widgets.filter((widget) => widget.runtime?.status === 'loading')
        if (!pending.length) return
        fetch('/api/dashboard-pages/deployed-data', {
          method: 'POST',
          headers: jsonHeaders,
          body: JSON.stringify({ scopeKey: viewScopeKey, pageKey, objectIds: pending.map((widget) => widget.id) }),
        })
          .then((response) => {
            if (!response.ok) throw new Error(`HTTP ${response.status}`)
            return response.json()
          })
          .then(({ widgets }) => {
            if (cancelled) return
            const hydratedById = new Map((widgets || []).map((widget) => [widget.id, widget]))
            setDeployed((current) => current && ({
              ...current,
              widgets: current.widgets.map((item) => hydratedById.get(item.id) || item),
            }))
          })
          .catch((error) => {
            if (cancelled) return
            setDeployed((current) => current && ({
              ...current,
              widgets: current.widgets.map((item) => pending.some((widget) => widget.id === item.id)
                ? { ...item, runtime: { status: 'error', message: error.message } }
                : item),
            }))
          })
      })
      .catch((err) => {
        console.error('[dashboard-pages] 배포 콘텐츠 조회 실패:', err)
        if (!cancelled) setDeployed(null)
      })
    return () => { cancelled = true }
  }, [authHeaders, jsonHeaders, pageKey, reloadKey, viewScopeKey])

  return (
    <div>
      {isHq && (
        <div className="px-6 pt-4 flex items-center gap-2">
          <Filter size={13} className="text-gray-400" />
          <select
            value={viewScopeKey || ''}
            onChange={(event) => setViewScopeKey(event.target.value)}
            title="본사/딜러사 배포 필터"
            className="text-xs font-medium px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-600"
          >
            {scopes.map((scope) => (
              <option key={scope.scopeKey} value={scope.scopeKey}>
                {scope.role === 'hq' ? 'TMKR' : `${scope.dealerName}`}
              </option>
            ))}
          </select>
        </div>
      )}

      {viewScopeKey && (
        <DeployHistoryPanel
          scopeKey={viewScopeKey}
          pageKey={pageKey}
          onPinned={() => setReloadKey((value) => value + 1)}
        />
      )}

      {deployed === undefined ? (
        <div className="p-12 flex items-center justify-center">
          <Loader2 size={28} className="text-gray-300 animate-spin" />
        </div>
      ) : deployed ? (
        <div className="p-6">
          <WidgetGrid widgets={deployed.widgets} readOnly />
        </div>
      ) : isHq ? (
        <div className="m-6 bg-white rounded-lg shadow-sm border border-gray-100 p-12 flex flex-col items-center justify-center text-center">
          <p className="text-sm text-gray-500">이 소속이 배포한 커스텀 페이지가 없습니다.</p>
        </div>
      ) : (
        children
      )}
    </div>
  )
}
