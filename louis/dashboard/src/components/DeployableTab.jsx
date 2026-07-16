import { useEffect, useState } from 'react'
import { Loader2, Filter } from 'lucide-react'
import { useUser } from '../auth/UserContext'
import { useScopes } from '../hooks/useScopes'
import WidgetGrid from './WidgetGrid'

const DEFAULT_VIEW = 'default' // 필터 미선택 = 이 탭의 원래 하드코딩 화면

function scopeKeyForUser(user) {
  if (user.role === 'hq') return 'hq'
  if (user.role === 'dealer') return `dealer:${user.dealerId}`
  return null
}

// 좌측 탭 하나를 감싸서, 해당 소속이 배포해 둔 커스텀 대시보드가 있으면 그걸 보여주고
// 없으면 기존 하드코딩 페이지(children)를 그대로 보여준다.
// - 딜러사: 자기 소속의 배포본만 자동으로 보임(필터 없음).
// - 본사: 상단에 본사/딜러사 필터가 추가되어, 각 소속이 이 탭에 배포한 커스텀 페이지를
//   골라서 미리보기할 수 있다. 필터를 "기본 화면"으로 두면 원래 하드코딩 페이지가 보인다.
export default function DeployableTab({ pageKey, children }) {
  const { user } = useUser()
  const scopes = useScopes()
  const isHq = user.role === 'hq'
  const ownScopeKey = scopeKeyForUser(user)

  const [viewScopeKey, setViewScopeKey] = useState(isHq ? DEFAULT_VIEW : ownScopeKey)
  const [deployed, setDeployed] = useState(null) // null=없음/기본, undefined=로딩 중, 객체=배포된 대시보드

  // 탭이 바뀌면 본사는 다시 "기본 화면"부터 보게 한다(직전 탭에서 고른 딜러사 필터가 새 탭까지 안 남도록).
  useEffect(() => { setViewScopeKey(isHq ? DEFAULT_VIEW : ownScopeKey) }, [pageKey, isHq, ownScopeKey])

  useEffect(() => {
    if (!viewScopeKey || viewScopeKey === DEFAULT_VIEW) { setDeployed(null); return }
    let cancelled = false
    setDeployed(undefined)
    fetch(`/api/dashboard-pages/deployed?scopeKey=${encodeURIComponent(viewScopeKey)}&pageKey=${encodeURIComponent(pageKey)}`)
      .then(res => { if (!res.ok) throw new Error(`HTTP ${res.status}`); return res.json() })
      .then(data => { if (!cancelled) setDeployed(data.deployed ? data : null) })
      .catch(err => {
        console.error('[dashboard-pages] 배포 콘텐츠 조회 실패:', err)
        if (!cancelled) setDeployed(null)
      })
    return () => { cancelled = true }
  }, [viewScopeKey, pageKey])

  return (
    <div>
      {isHq && (
        <div className="px-6 pt-4 flex items-center gap-2">
          <Filter size={13} className="text-gray-400" />
          <select
            value={viewScopeKey}
            onChange={(e) => setViewScopeKey(e.target.value)}
            title="본사/딜러사 배포 필터"
            className="text-xs font-medium px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-600"
          >
            <option value={DEFAULT_VIEW}>기본 화면</option>
            {scopes.map(s => (
              <option key={s.scopeKey} value={s.scopeKey}>
                {s.role === 'hq' ? '본사 배포' : `${s.dealerName} 배포`}
              </option>
            ))}
          </select>
        </div>
      )}

      {viewScopeKey === DEFAULT_VIEW ? (
        children
      ) : deployed === undefined ? (
        <div className="p-12 flex items-center justify-center">
          <Loader2 size={28} className="text-gray-300 animate-spin" />
        </div>
      ) : deployed ? (
        <div className="p-6">
          <WidgetGrid widgets={deployed.widgets} readOnly />
        </div>
      ) : isHq ? (
        // 본사가 필터로 특정 소속을 골라 미리보기하는데 그 소속이 이 탭에 배포한 게 없는 경우.
        // 딜러사 본인 뷰(isHq=false)는 미배포 시 이 분기 대신 아래 children(기본 화면)으로 빠진다.
        <div className="m-6 bg-white rounded-2xl shadow-sm border border-gray-100 p-12 flex flex-col items-center justify-center text-center">
          <p className="text-sm text-gray-500">이 소속이 배포한 커스텀 페이지가 없습니다.</p>
        </div>
      ) : (
        children
      )}
    </div>
  )
}
