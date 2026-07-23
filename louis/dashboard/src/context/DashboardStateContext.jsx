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
// 저장은 자동이 아니라 명시적 save() 호출로만 서버에 반영된다 — name === null은 아직 한
// 번도 저장 안 된 "새 페이지"를 뜻하며, 로컬 편집만 쌓이다가 처음 save() 할 때 이름을 받는다.
const DashboardStateContext = createContext(null)
const MAX_HISTORY = 20

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
  const [name, setName] = useState(null) // 현재 열려 있는 저장본 이름 — null이면 아직 저장 안 된 새 페이지
  const [savedPages, setSavedPages] = useState([]) // [{ name, targetPageKey, isDeployed, isTemplate, updatedAt }]
  const [templates, setTemplates] = useState([]) // 본사가 지정해 둔 템플릿 목록 — [{ name, updatedAt }]
  const [dirty, setDirty] = useState(false) // 마지막 save() 이후 편집이 있었는지
  const suppressDirty = useRef(false) // 서버에서 막 불러온 직후 1회는 dirty로 잡지 않기 위한 플래그

  const refreshList = useCallback(() => {
    if (!scopeKey) return Promise.resolve([])
    return fetch(`/api/dashboard-pages/list?scopeKey=${encodeURIComponent(scopeKey)}`)
      .then(readJsonOrThrow)
      .then(({ pages }) => { setSavedPages(pages); return pages })
      .catch(err => { console.error('[dashboard-pages] 목록 조회 실패:', err); return [] })
  }, [scopeKey])

  // 본사가 지정해 둔 템플릿 목록 — scope와 무관하게 누구나 볼 수 있다.
  const refreshTemplates = useCallback(() => {
    return fetch('/api/dashboard-pages/templates')
      .then(readJsonOrThrow)
      .then(({ templates: list }) => { setTemplates(list); return list })
      .catch(err => { console.error('[dashboard-pages] 템플릿 목록 조회 실패:', err); return [] })
  }, [])

  useEffect(() => { refreshTemplates() }, [refreshTemplates])

  // 소속(scope) 확정 시 저장된 목록부터 불러오고, 가장 최근 저장본을 연다. 저장본이 하나도
  // 없으면 서버에 물어볼 것도 없이 바로 빈 "새 페이지"로 시작한다.
  useEffect(() => {
    if (!scopeKey) {
      dispatch({ type: 'load_failed' })
      return
    }
    let cancelled = false
    refreshList().then(pages => {
      if (cancelled) return
      if (pages.length) {
        setName(pages[0].name)
      } else {
        suppressDirty.current = true
        dispatch({ type: 'loaded', present: createEmptyDashboardState() })
        setName(null)
      }
    })
    return () => { cancelled = true }
  }, [scopeKey, refreshList])

  // 열려는 이름이 정해지면 그 저장본을 서버에서 로드. name이 null(새 페이지)이면 로드할
  // 서버 저장본이 없으므로 건드리지 않는다 — newPage()/deletePage()가 캔버스를 직접 비운다.
  useEffect(() => {
    if (!scopeKey || !name) return
    let cancelled = false
    fetch(`/api/dashboard-pages?scopeKey=${encodeURIComponent(scopeKey)}&name=${encodeURIComponent(name)}`)
      .then(readJsonOrThrow)
      .then(present => {
        if (cancelled) return
        suppressDirty.current = true
        dispatch({ type: 'loaded', present })
      })
      .catch(err => {
        if (cancelled) return
        console.error('[dashboard-pages] 불러오기 실패:', err)
        dispatch({ type: 'load_failed' })
      })
    return () => { cancelled = true }
  }, [scopeKey, name])

  // 자동저장은 없다 — 편집이 생기면 dirty만 표시해 두고, 실제 서버 반영은 save()를 명시적으로
  // 호출할 때만 일어난다(로드/새 페이지 직후 1회는 suppressDirty로 스킵해 echo를 막는다).
  useEffect(() => {
    if (state.status !== 'ready') return
    if (suppressDirty.current) { suppressDirty.current = false; return }
    setDirty(true)
  }, [state.present, state.status])

  // 저장 안 된 변경사항이 있는 채로 탭을 닫거나 새로고침하면 브라우저가 한 번 더 확인한다.
  useEffect(() => {
    if (!dirty) return
    const handler = (e) => { e.preventDefault(); e.returnValue = '' }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [dirty])

  const applyPatch = useCallback((patch) => dispatch({ type: 'apply', patch }), [])
  const undo = useCallback(() => dispatch({ type: 'undo' }), [])
  const redo = useCallback(() => dispatch({ type: 'redo' }), [])
  const reset = useCallback(() => dispatch({ type: 'reset' }), [])

  // 저장된 다른 이름의 대시보드로 전환.
  const switchTo = useCallback((nextName) => { setName(nextName) }, [])

  // 빈 캔버스로 시작하는 "새 페이지" — 이름은 만들 때 바로 받는다(UI가 프롬프트로 물어본 뒤
  // 넘겨준다). 아직 서버에 저장되진 않은 상태이므로, 이 이름 그대로 처음 save()가 만든다.
  const newPage = useCallback((pageName) => {
    suppressDirty.current = true
    dispatch({ type: 'loaded', present: createEmptyDashboardState() })
    setName(pageName)
  }, [])

  // 지금 캔버스를 저장한다. name이 이미 있으면(새 페이지 생성 시 정한 이름, 또는 기존
  // 저장본을 편집 중) 그 이름으로 덮어쓰고, 없으면 인자로 받은 이름을 대신 쓴다(한도 5개
  // 초과 시 서버가 거부).
  const save = useCallback((newName) => {
    const targetName = newName ?? name
    if (!targetName || !scopeKey) return Promise.reject(new Error('저장할 이름이 없습니다.'))
    return fetch('/api/dashboard-pages', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scopeKey, name: targetName, dashboardState: state.present }),
    })
      .then(readJsonOrThrow)
      .then(() => refreshList())
      .then(() => { setName(targetName); setDirty(false) })
  }, [scopeKey, name, state.present, refreshList])

  // 저장본 삭제(한도 슬롯 확보용). 지금 열려 있는 이름을 지우면 남은 것 중 최근 것으로 전환하고,
  // 하나도 안 남으면 빈 새 페이지로 돌아간다. 지운 저장본이 템플릿으로 지정돼 있었을 수도 있으니
  // 템플릿 목록도 같이 새로고침한다 — 안 그러면 삭제된 템플릿이 "템플릿 불러오기" 드롭다운에
  // 유령처럼 남아 선택해도 404가 난다.
  const deletePage = useCallback((targetName) => {
    if (!scopeKey) return Promise.resolve()
    return fetch(`/api/dashboard-pages?scopeKey=${encodeURIComponent(scopeKey)}&name=${encodeURIComponent(targetName)}`, {
      method: 'DELETE',
    })
      .then(readJsonOrThrow)
      .then(() => Promise.all([refreshList(), refreshTemplates()]))
      .then(([pages]) => {
        if (targetName !== name) return
        if (pages.length) { setName(pages[0].name); return }
        suppressDirty.current = true
        dispatch({ type: 'loaded', present: createEmptyDashboardState() })
        setName(null)
      })
  }, [scopeKey, name, refreshList, refreshTemplates])

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

  // 템플릿(본사가 지정한 저장본)의 위젯을 지금 캔버스에 채운다 — 아직 저장은 안 된 초안
  // 상태이므로, 이어서 save()로 이름을 정해야 scope에 실제로 남는다.
  const loadTemplate = useCallback((templateName) => {
    return fetch(`/api/dashboard-pages/template?name=${encodeURIComponent(templateName)}`)
      .then(readJsonOrThrow)
      .then(({ widgets }) => {
        suppressDirty.current = true
        dispatch({ type: 'loaded', present: { version: 0, widgets } })
        setName(null)
      })
  }, [])

  // 본사 전용: 지금 열려 있는(본사) 저장본을 템플릿으로 지정/해제.
  const setTemplateFlag = useCallback((isTemplate) => {
    if (!scopeKey || !name) return Promise.reject(new Error('대상이 없습니다.'))
    return fetch('/api/dashboard-pages/template', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scopeKey, name, isTemplate }),
    })
      .then(readJsonOrThrow)
      .then(() => Promise.all([refreshList(), refreshTemplates()]))
  }, [scopeKey, name, refreshList, refreshTemplates])

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
    dirty,
    savedPages,
    switchTo,
    newPage,
    save,
    deletePage,
    deploy,
    rollback,
    templates,
    loadTemplate,
    setTemplateFlag,
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
