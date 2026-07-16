import { createContext, useContext, useReducer, useState, useCallback, useEffect, useRef } from 'react'
import { createEmptyDashboardState, applyPatchToState } from '../utils/applyDashboardPatch'

// 빌더(KTWS 대시보드 커스텀) 캔버스 상태. 서버(server/dashboardPagesHandler.js → Postgres
// dashboard_saved_pages)에는 (scopeKey, name)으로 저장된다. scopeKey는 개인 계정이 아니라
// 본사/딜러사 단위('hq' | 'dealer:<dealerId>')라 같은 소속이면 누가 저장해도 공유된다.
// name은 사용자가 정한 저장 이름 — 한 scope당 최대 5개까지 저장 가능(서버에서 강제).
// 저장본은 "배포"(deploy)를 통해 좌측 탭 하나(targetPageKey)의 기본 화면을 대체할 수 있고,
// 롤백하면 그 탭은 다시 기본(Default) 화면으로 돌아간다 — DeployableTab이 그 표시를 담당.
// Undo/redo history stays in-memory only — it is never sent to the server, so it resets
// on reload (accepted limitation, not in scope here).
const DashboardStateContext = createContext(null)
const MAX_HISTORY = 20
const DEFAULT_NAME = '기본'

function reducer(state, action) {
  switch (action.type) {
    case 'apply': {
      const next = applyPatchToState(state.present, action.patch)
      return { ...state, present: next, past: [...state.past, state.present].slice(-MAX_HISTORY), future: [] }
    }
    case 'undo': {
      if (state.past.length === 0) return state
      const previous = state.past[state.past.length - 1]
      return { ...state, present: previous, past: state.past.slice(0, -1), future: [state.present, ...state.future] }
    }
    case 'redo': {
      if (state.future.length === 0) return state
      const [next, ...rest] = state.future
      return { ...state, present: next, past: [...state.past, state.present], future: rest }
    }
    case 'reset':
      return { ...state, present: createEmptyDashboardState(), past: [], future: [] }
    case 'loaded':
      return { present: action.present, past: [], future: [], status: 'ready' }
    case 'load_failed':
      return { present: createEmptyDashboardState(), past: [], future: [], status: 'ready' }
    default:
      return state
  }
}

function init() {
  return { present: createEmptyDashboardState(), past: [], future: [], status: 'idle' }
}

async function readJsonOrThrow(res) {
  if (res.ok) return res.json()
  const body = await res.json().catch(() => ({}))
  throw new Error(body.message || `HTTP ${res.status}`)
}

export function DashboardStateProvider({ children, scopeKey }) {
  const [state, dispatch] = useReducer(reducer, undefined, init)
  const [name, setName] = useState(null) // 현재 열려 있는 저장본 이름
  const [savedPages, setSavedPages] = useState([]) // [{ name, targetPageKey, isDeployed, updatedAt }]
  const skipNextSave = useRef(false)

  const refreshList = useCallback(() => {
    if (!scopeKey) return Promise.resolve([])
    return fetch(`/api/dashboard-pages/list?scopeKey=${encodeURIComponent(scopeKey)}`)
      .then(readJsonOrThrow)
      .then(({ pages }) => { setSavedPages(pages); return pages })
      .catch(err => { console.error('[dashboard-pages] 목록 조회 실패:', err); return [] })
  }, [scopeKey])

  // 소속(scope) 확정 시 저장된 목록부터 불러오고, 가장 최근 이름(없으면 기본값)을 연다.
  useEffect(() => {
    if (!scopeKey) {
      dispatch({ type: 'load_failed' })
      return
    }
    let cancelled = false
    refreshList().then(pages => {
      if (cancelled) return
      setName(pages[0]?.name ?? DEFAULT_NAME)
    })
    return () => { cancelled = true }
  }, [scopeKey, refreshList])

  // 열려는 이름이 정해지면 그 저장본을 서버에서 로드.
  useEffect(() => {
    if (!scopeKey || !name) return
    let cancelled = false
    fetch(`/api/dashboard-pages?scopeKey=${encodeURIComponent(scopeKey)}&name=${encodeURIComponent(name)}`)
      .then(readJsonOrThrow)
      .then(present => {
        if (cancelled) return
        skipNextSave.current = true
        dispatch({ type: 'loaded', present })
      })
      .catch(err => {
        if (cancelled) return
        console.error('[dashboard-pages] 불러오기 실패:', err)
        dispatch({ type: 'load_failed' })
      })
    return () => { cancelled = true }
  }, [scopeKey, name])

  // 위젯 상태 변경 시 현재 이름으로 서버에 저장(로드 직후 1회는 echo 방지로 스킵).
  useEffect(() => {
    if (state.status !== 'ready' || !scopeKey || !name) return
    if (skipNextSave.current) { skipNextSave.current = false; return }
    fetch('/api/dashboard-pages', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scopeKey, name, dashboardState: state.present }),
    })
      .then(() => refreshList()) // updated_at 갱신 반영(정렬/타임스탬프)
      .catch(err => console.error('[dashboard-pages] 저장 실패:', err))
  }, [state.present, state.status, scopeKey, name, refreshList])

  const applyPatch = useCallback((patch) => dispatch({ type: 'apply', patch }), [])
  const undo = useCallback(() => dispatch({ type: 'undo' }), [])
  const redo = useCallback(() => dispatch({ type: 'redo' }), [])
  const reset = useCallback(() => dispatch({ type: 'reset' }), [])

  // 저장된 다른 이름의 대시보드로 전환(이후 자동 저장 대상도 그 이름으로 바뀐다).
  const switchTo = useCallback((nextName) => { setName(nextName) }, [])

  // 지금 편집 중인 내용을 새 이름으로 저장(한도 5개 초과 시 서버가 거부)하고 그 이름으로 전환.
  const saveAs = useCallback((newName) => {
    if (!newName || !scopeKey) return Promise.reject(new Error('scopeKey가 없습니다.'))
    return fetch('/api/dashboard-pages', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scopeKey, name: newName, dashboardState: state.present }),
    })
      .then(readJsonOrThrow)
      .then(() => refreshList())
      .then(() => setName(newName))
  }, [scopeKey, state.present, refreshList])

  // 저장본 삭제(한도 슬롯 확보용). 지금 열려 있는 이름을 지우면 남은 것 중 최근 것으로 전환.
  const deletePage = useCallback((targetName) => {
    if (!scopeKey) return Promise.resolve()
    return fetch(`/api/dashboard-pages?scopeKey=${encodeURIComponent(scopeKey)}&name=${encodeURIComponent(targetName)}`, {
      method: 'DELETE',
    })
      .then(readJsonOrThrow)
      .then(() => refreshList())
      .then(pages => {
        if (targetName === name) setName(pages[0]?.name ?? DEFAULT_NAME)
      })
  }, [scopeKey, name, refreshList])

  // 지금 열려 있는 저장본을 좌측 탭(targetPageKey)에 배포 — 그 탭의 기존 배포는 자동 해제.
  const deploy = useCallback((targetPageKey) => {
    if (!scopeKey || !name || !targetPageKey) return Promise.reject(new Error('배포 대상이 없습니다.'))
    return fetch('/api/dashboard-pages/deploy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scopeKey, name, targetPageKey }),
    })
      .then(readJsonOrThrow)
      .then(() => refreshList())
  }, [scopeKey, name, refreshList])

  // targetPageKey를 기본(Default) 화면으로 롤백(배포 해제) — 저장본 자체는 남는다.
  const rollback = useCallback((targetPageKey) => {
    if (!scopeKey || !targetPageKey) return Promise.reject(new Error('롤백 대상이 없습니다.'))
    return fetch('/api/dashboard-pages/rollback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scopeKey, targetPageKey }),
    })
      .then(readJsonOrThrow)
      .then(() => refreshList())
  }, [scopeKey, refreshList])

  const value = {
    dashboardState: state.present,
    isLoading: state.status !== 'ready',
    applyPatch,
    undo,
    redo,
    reset,
    canUndo: state.past.length > 0,
    canRedo: state.future.length > 0,
    name,
    savedPages,
    switchTo,
    saveAs,
    deletePage,
    deploy,
    rollback,
  }

  return (
    <DashboardStateContext.Provider value={value}>
      {children}
    </DashboardStateContext.Provider>
  )
}

export function useDashboardState() {
  const ctx = useContext(DashboardStateContext)
  if (!ctx) throw new Error('useDashboardState must be used within a DashboardStateProvider')
  return ctx
}
