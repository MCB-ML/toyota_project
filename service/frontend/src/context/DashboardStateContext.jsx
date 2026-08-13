import { createContext, useContext, useReducer, useState, useCallback, useEffect, useMemo, useRef } from 'react'
import { createEmptyDashboardState, applyPatchToState } from '../utils/applyDashboardPatch'
import { normalizeDashboardState, withObjectRuntime } from '../utils/dashboardObject'
import { useUser } from '../auth/UserContext'
import { authHeaders as buildAuthHeaders } from '../auth/session'

// 빌더(KTWS 대시보드 커스텀) 캔버스 상태. 서버(server/dashboardPagesHandler.js → Postgres
// dashboard_saved_pages)에는 (scopeKey, name)으로 저장된다. scopeKey는 개인 계정이 아니라
// 본사/딜러사 단위('hq' | 'dealer:<dealerId>')라 같은 소속이면 누가 저장해도 공유된다.
// name은 사용자가 정한 저장 이름 — 한 scope당 최대 5개까지 저장 가능(서버에서 강제).
// 저장본은 "배포"(deploy)를 통해 좌측 탭 하나(targetPageKey)의 기본 화면을 대체할 수 있고,
// 롤백하면 그 탭은 다시 기본(Default) 화면으로 돌아간다 — DeployableTab이 그 표시를 담당.
// Undo/redo history stays in-memory only — it is never sent to the server, so it resets
// on reload (accepted limitation, not in scope here).
// 일반 편집은 명시적 save()로 서버에 반영한다. 단, 저장된 페이지의 그리드 이동/리사이즈는
// 위치를 잃지 않도록 짧게 debounce한 자동 저장을 사용한다 — 이 자동 저장은 "마지막으로
// 저장된 위젯 집합의 순수 이동/리사이즈"일 때만 발동한다(persistedIdsRef). 객체를 추가/삭제한
// 뒤에는 명시적 저장까지 서버에 아무것도 보내지 않으므로, 저장 없이 새로고침·페이지 전환하면
// 그 객체들은 사라진다(의도된 동작). name === null은 아직 한 번도
// 저장 안 된 "새 페이지"를 뜻하므로 레이아웃도 로컬 상태로만 남는다.
const DashboardStateContext = createContext(null)
const MAX_HISTORY = 20

function reducer(state, action) {
  switch (action.type) {
    case 'apply': {
      const next = applyPatchToState(state.present, action.patch)
      return { ...state, present: next, past: [...state.past, state.present].slice(-MAX_HISTORY), future: [], changeSource: 'user' }
    }
    case 'undo': {
      if (state.past.length === 0) return state
      const previous = state.past[state.past.length - 1]
      return { ...state, present: previous, past: state.past.slice(0, -1), future: [state.present, ...state.future], changeSource: 'user' }
    }
    case 'redo': {
      if (state.future.length === 0) return state
      const [next, ...rest] = state.future
      return { ...state, present: next, past: [...state.past, state.present], future: rest, changeSource: 'user' }
    }
    case 'reset':
      return { ...state, present: createEmptyDashboardState(), past: [], future: [], persistedVersion: 0, changeSource: 'user' }
    case 'loaded': {
      const present = normalizeDashboardState(action.present)
      return { present, past: [], future: [], status: 'ready', persistedVersion: present.version, changeSource: 'system' }
    }
    case 'hydrated_object':
    case 'hydrated_objects': {
      const hydratedById = new Map(
        (action.type === 'hydrated_object' ? [action.widget] : action.widgets)
          .filter(Boolean)
          .map((widget) => [widget.id, widget]),
      )
      return {
        ...state,
        present: {
          ...state.present,
          widgets: state.present.widgets.map((widget) => (
            // Keep local title/layout/spec edits made while the SQL request was
            // in flight. Rehydration is allowed to replace only runtime data.
            hydratedById.has(widget.id)
              ? (() => {
                  const hydrated = hydratedById.get(widget.id)
                  return { ...widget, type: hydrated.type, props: hydrated.props, runtime: hydrated.runtime }
                })()
              : widget
          )),
        },
        changeSource: 'system',
      }
    }
    case 'saved':
      // A save may finish after another local edit. Keep that newer edit dirty
      // instead of incorrectly marking it as persisted.
      if (state.present.version !== action.savedLocalVersion) {
        return {
          ...state,
          persistedVersion: action.version,
          changeSource: 'user',
        }
      }
      return {
        ...state,
        present: { ...state.present, version: action.version },
        persistedVersion: action.version,
        changeSource: 'system',
      }
    case 'load_failed':
      return { present: createEmptyDashboardState(), past: [], future: [], status: 'ready', persistedVersion: 0, changeSource: 'system' }
    default:
      return state
  }
}

function init() {
  return { present: createEmptyDashboardState(), past: [], future: [], status: 'idle', persistedVersion: 0, changeSource: 'system' }
}

async function readJsonOrThrow(res) {
  if (res.ok) return res.json()
  const body = await res.json().catch(() => ({}))
  throw new Error(body.message || `HTTP ${res.status}`)
}

export function DashboardStateProvider({ children, scopeKey }) {
  const { ai365 } = useUser()
  // 서비스 백엔드는 이제 모든 대시보드 API 에서 신원을 요구한다(운영에서는 토큰이
  // 없으면 401). 배포·롤백뿐 아니라 조회·저장에도 같은 헤더를 실어야 한다.
  const authHeaders = useMemo(() => buildAuthHeaders({}, ai365), [ai365?.token])
  const jsonHeaders = useMemo(() => buildAuthHeaders({ 'Content-Type': 'application/json' }, ai365), [ai365?.token])
  const [state, dispatch] = useReducer(reducer, undefined, init)
  const [name, setName] = useState(null) // 현재 열려 있는 저장본 이름 — null이면 아직 저장 안 된 새 페이지
  const [savedPages, setSavedPages] = useState([]) // [{ name, targetPageKey, isDeployed, isTemplate, updatedAt }]
  const [templates, setTemplates] = useState([]) // 본사가 지정해 둔 템플릿 목록 — [{ name, updatedAt }]
  const [dirty, setDirty] = useState(false) // 마지막 save() 이후 편집이 있었는지
  const [saveStatus, setSaveStatus] = useState('idle') // idle | saving | error
  const [selectedWidgetId, setSelectedWidgetId] = useState(null) // 저장하지 않는 현재 선택 상태
  const suppressDirty = useRef(false) // 서버에서 막 불러온 직후 1회는 dirty로 잡지 않기 위한 플래그
  const stateRef = useRef(state)
  const nameRef = useRef(name)
  const layoutSaveTimerRef = useRef(null)
  // 마지막으로 서버에 저장된 시점의 위젯 id 집합. 레이아웃 자동 저장의 가드다 —
  // 새 객체가 캔버스에 놓이면 그리드가 배치 커밋을 내고, 그게 자동 저장을 타면
  // "저장" 버튼을 안 눌렀는데도 새 객체가 서버에 남는다(저장처럼 보이던 버그).
  // 그래서 지금 캔버스의 위젯 집합이 이 집합과 같을 때(순수 이동/리사이즈)만
  // 자동 저장하고, 추가/삭제가 섞여 있으면 명시적 저장까지 아무것도 보내지 않는다.
  // null 은 "서버 저장본 없음"(새 페이지·템플릿 초안) — 자동 저장 대상이 아니다.
  const persistedIdsRef = useRef(null)

  const widgetIdSet = (widgets) => new Set((widgets || []).map((widget) => widget.id))

  const matchesPersistedStructure = () => {
    const persisted = persistedIdsRef.current
    if (!persisted) return false
    const current = stateRef.current.present.widgets
    if (current.length !== persisted.size) return false
    return current.every((widget) => persisted.has(widget.id))
  }

  useEffect(() => { stateRef.current = state }, [state])
  useEffect(() => { nameRef.current = name }, [name])
  useEffect(() => () => {
    if (layoutSaveTimerRef.current) window.clearTimeout(layoutSaveTimerRef.current)
  }, [])

  const refreshList = useCallback(() => {
    if (!scopeKey) return Promise.resolve([])
    return fetch(`/api/dashboard-pages/list?scopeKey=${encodeURIComponent(scopeKey)}`, { headers: authHeaders })
      .then(readJsonOrThrow)
      .then(({ pages }) => { setSavedPages(pages); return pages })
      .catch(err => { console.error('[dashboard-pages] 목록 조회 실패:', err); return [] })
  }, [authHeaders, scopeKey])

  // 본사가 지정해 둔 템플릿 목록 — scope와 무관하게 누구나 볼 수 있다.
  const refreshTemplates = useCallback(() => {
    return fetch('/api/dashboard-pages/templates', { headers: authHeaders })
      .then(readJsonOrThrow)
      .then(({ templates: list }) => { setTemplates(list); return list })
      .catch(err => { console.error('[dashboard-pages] 템플릿 목록 조회 실패:', err); return [] })
  }, [authHeaders])

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
        persistedIdsRef.current = null // 서버 저장본이 없는 새 페이지
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
    fetch(`/api/dashboard-pages?scopeKey=${encodeURIComponent(scopeKey)}&name=${encodeURIComponent(name)}`, { headers: authHeaders })
      .then(readJsonOrThrow)
      .then(present => {
        if (cancelled) return
        suppressDirty.current = true
        persistedIdsRef.current = widgetIdSet(present.widgets) // 서버 저장본이 곧 기준선
        dispatch({ type: 'loaded', present })
      })
      .catch(err => {
        if (cancelled) return
        console.error('[dashboard-pages] 불러오기 실패:', err)
        persistedIdsRef.current = null
        dispatch({ type: 'load_failed' })
      })
    return () => { cancelled = true }
  }, [authHeaders, scopeKey, name])

  // 일반 편집은 dirty만 표시한다. 레이아웃 커밋만 scheduleLayoutSave()에서 자동 저장한다.
  useEffect(() => {
    if (state.status !== 'ready') return
    if (state.changeSource !== 'user') {
      suppressDirty.current = false
      return
    }
    if (suppressDirty.current) { suppressDirty.current = false; return }
    setDirty(true)
  }, [state.present, state.status, state.changeSource])

  // 2026-08-04 leo: 메타데이터는 즉시 보여주고, loading 객체는 한 번의 페이지 batch 요청으로 재수화한다.
  // 서버가 페이지 동시성 및 전역 Fabric permit을 관리하므로 브라우저 탭 하나가 수십 개의
  // SQL 요청을 동시에 보내지 않는다. 객체별 오류 runtime은 응답에서 그대로 유지된다.
  useEffect(() => {
    if (!scopeKey || !name || state.status !== 'ready') return
    const pending = state.present.widgets.filter((widget) => widget.runtime?.status === 'loading')
    if (!pending.length) return
    let cancelled = false
    fetch('/api/dashboard-pages/data', {
      method: 'POST',
      headers: jsonHeaders,
      body: JSON.stringify({ scopeKey, name, objectIds: pending.map((widget) => widget.id) }),
    })
      .then(readJsonOrThrow)
      .then(({ widgets }) => {
        if (!cancelled) dispatch({ type: 'hydrated_objects', widgets: (widgets || []).map((widget) => withObjectRuntime(widget, widget.runtime)) })
      })
      .catch((err) => {
        if (!cancelled) {
          dispatch({
            type: 'hydrated_objects',
            widgets: pending.map((widget) => withObjectRuntime(widget, { status: 'error', message: err.message })),
          })
        }
      })
    return () => { cancelled = true }
  }, [jsonHeaders, scopeKey, name, state.status, state.present.widgets])

  // 저장 안 된 변경사항이 있는 채로 탭을 닫거나 새로고침하면 브라우저가 한 번 더 확인한다.
  useEffect(() => {
    if (!dirty) return
    const handler = (e) => { e.preventDefault(); e.returnValue = '' }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [dirty])

  useEffect(() => {
    if (selectedWidgetId && !state.present.widgets.some((widget) => widget.id === selectedWidgetId)) {
      setSelectedWidgetId(null)
    }
  }, [selectedWidgetId, state.present.widgets])

  // 저장된 다른 이름의 대시보드로 전환.
  const switchTo = useCallback((nextName) => { setName(nextName) }, [])

  // 빈 캔버스로 시작하는 "새 페이지" — 이름은 만들 때 바로 받는다(UI가 프롬프트로 물어본 뒤
  // 넘겨준다). 아직 서버에 저장되진 않은 상태이므로, 이 이름 그대로 처음 save()가 만든다.
  const newPage = useCallback((pageName) => {
    suppressDirty.current = true
    persistedIdsRef.current = null // 첫 save() 전까지 서버 저장본이 없다 — 자동 저장 금지
    dispatch({ type: 'loaded', present: createEmptyDashboardState() })
    setName(pageName)
  }, [])

  // 지금 캔버스를 저장한다. name이 이미 있으면(새 페이지 생성 시 정한 이름, 또는 기존
  // 저장본을 편집 중) 그 이름으로 덮어쓰고, 없으면 인자로 받은 이름을 대신 쓴다(한도 5개
  // 초과 시 서버가 거부).
  const persistCurrentState = useCallback((targetName, { silent = false } = {}) => {
    if (!targetName || !scopeKey) return Promise.reject(new Error('저장할 이름이 없습니다.'))
    const snapshot = stateRef.current
    const savedLocalVersion = snapshot.present.version
    setSaveStatus('saving')
    return fetch('/api/dashboard-pages', {
      method: 'PUT',
      headers: jsonHeaders,
      body: JSON.stringify({ scopeKey, name: targetName, baseVersion: snapshot.persistedVersion, dashboardState: snapshot.present }),
    })
      .then(readJsonOrThrow)
      .then((result) => refreshList().then(() => result))
      .then((result) => {
        const current = stateRef.current
        const hasNewerEdit = current.present.version !== savedLocalVersion
        stateRef.current = {
          ...current,
          present: hasNewerEdit ? current.present : { ...current.present, version: result.version },
          persistedVersion: result.version,
          changeSource: hasNewerEdit ? 'user' : 'system',
        }
        // 명시적 저장이 새 기준선이다 — 이 시점의 위젯 집합부터 다시 레이아웃
        // 자동 저장이 허용된다.
        persistedIdsRef.current = widgetIdSet(snapshot.present.widgets)
        dispatch({ type: 'saved', version: result.version, savedLocalVersion })
        setName(targetName)
        if (!hasNewerEdit) setDirty(false)
        setSaveStatus('idle')
        return result
      })
      .catch((error) => {
        setSaveStatus('error')
        if (!silent) throw error
        console.error('[dashboard-pages] 자동 레이아웃 저장 실패:', error)
        return null
      })
  }, [jsonHeaders, scopeKey, refreshList])

  const scheduleLayoutSave = useCallback(() => {
    const targetName = nameRef.current
    if (!targetName || !scopeKey) return
    if (layoutSaveTimerRef.current) window.clearTimeout(layoutSaveTimerRef.current)
    layoutSaveTimerRef.current = window.setTimeout(() => {
      layoutSaveTimerRef.current = null
      // The user may have switched pages while the timer was waiting.
      if (nameRef.current !== targetName) return
      if (stateRef.current.present.version === stateRef.current.persistedVersion) return
      // 자동 저장은 저장된 위젯들의 순수 이동/리사이즈만 다룬다. 객체를 추가/삭제한
      // 상태라면 여기서 멈춘다 — 안 그러면 저장 버튼을 안 눌렀는데 새 객체가 서버에
      // 남는다. 이 경우 dirty 로 남아 있다가 명시적 저장 때 한꺼번에 반영되고,
      // 저장 없이 새로고침·페이지 전환하면 서버 저장본으로 되돌아가 다 사라진다.
      if (!matchesPersistedStructure()) return
      persistCurrentState(targetName, { silent: true })
    }, 500)
  }, [scopeKey, persistCurrentState])

  const applyPatch = useCallback((patch, options = {}) => {
    const current = stateRef.current
    const nextPresent = applyPatchToState(current.present, patch)
    // Keep the snapshot current until React commits the reducer update. This is
    // what makes a stop-resize followed immediately by auto-save durable.
    stateRef.current = { ...current, present: nextPresent, changeSource: 'user' }
    dispatch({ type: 'apply', patch })
    if (options.persist === 'layout') scheduleLayoutSave()
  }, [scheduleLayoutSave])
  const undo = useCallback(() => dispatch({ type: 'undo' }), [])
  const redo = useCallback(() => dispatch({ type: 'redo' }), [])
  const reset = useCallback(() => dispatch({ type: 'reset' }), [])

  const save = useCallback((newName) => {
    if (layoutSaveTimerRef.current) {
      window.clearTimeout(layoutSaveTimerRef.current)
      layoutSaveTimerRef.current = null
    }
    return persistCurrentState(newName ?? name)
  }, [name, persistCurrentState])

  // 2026-08-04 leo: 강제 새로고침은 Redis 결과·watermark 캐시를 모두 우회한다. 저장 객체의 정의나 현재
  // 편집 상태는 건드리지 않고 runtime만 다시 받아오므로 차트 설정/레이아웃과 충돌하지 않는다.
  const refreshPageData = useCallback(() => {
    if (!scopeKey || !name) return Promise.reject(new Error('새로고침할 저장 대시보드가 없습니다.'))
    const widgets = stateRef.current.present.widgets
    return fetch('/api/dashboard-pages/data', {
      method: 'POST',
      headers: jsonHeaders,
      body: JSON.stringify({ scopeKey, name, objectIds: widgets.map((widget) => widget.id), forceRefresh: true }),
    })
      .then(readJsonOrThrow)
      .then(({ widgets: hydrated }) => {
        dispatch({ type: 'hydrated_objects', widgets: (hydrated || []).map((widget) => withObjectRuntime(widget, widget.runtime)) })
      })
  }, [jsonHeaders, scopeKey, name])

  const refreshObjectData = useCallback((objectId) => {
    if (!scopeKey || !name || !objectId) return Promise.reject(new Error('새로고침할 객체가 없습니다.'))
    return fetch('/api/dashboard-pages/object-data', {
      method: 'POST',
      headers: jsonHeaders,
      body: JSON.stringify({ scopeKey, name, objectId, forceRefresh: true }),
    })
      .then(readJsonOrThrow)
      .then(({ widget }) => dispatch({ type: 'hydrated_object', widget: withObjectRuntime(widget, widget.runtime) }))
  }, [jsonHeaders, scopeKey, name])

  // 저장본 삭제(한도 슬롯 확보용). 지금 열려 있는 이름을 지우면 남은 것 중 최근 것으로 전환하고,
  // 하나도 안 남으면 빈 새 페이지로 돌아간다. 지운 저장본이 템플릿으로 지정돼 있었을 수도 있으니
  // 템플릿 목록도 같이 새로고침한다 — 안 그러면 삭제된 템플릿이 "템플릿 불러오기" 드롭다운에
  // 유령처럼 남아 선택해도 404가 난다.
  const deletePage = useCallback((targetName) => {
    if (!scopeKey) return Promise.resolve()
    return fetch(`/api/dashboard-pages?scopeKey=${encodeURIComponent(scopeKey)}&name=${encodeURIComponent(targetName)}`, {
      method: 'DELETE',
      headers: authHeaders,
    })
      .then(readJsonOrThrow)
      .then(() => Promise.all([refreshList(), refreshTemplates()]))
      .then(([pages]) => {
        if (targetName !== name) return
        if (pages.length) { setName(pages[0].name); return }
        suppressDirty.current = true
        persistedIdsRef.current = null
        dispatch({ type: 'loaded', present: createEmptyDashboardState() })
        setName(null)
      })
  }, [authHeaders, scopeKey, name, refreshList, refreshTemplates])

  // 지금 열려 있는 저장본을 좌측 탭(targetPageKey)에 배포 — 그 탭의 기존 배포는 자동 해제.
  const deploy = useCallback((targetPageKey) => {
    if (!scopeKey || !name || !targetPageKey) return Promise.reject(new Error('배포 대상이 없습니다.'))
    return fetch('/api/dashboard-pages/deploy', {
      method: 'POST',
      headers: jsonHeaders,
      body: JSON.stringify({ scopeKey, name, targetPageKey }),
    })
      .then(readJsonOrThrow)
      .then(() => refreshList())
  }, [jsonHeaders, scopeKey, name, refreshList])

  // 템플릿(본사가 지정한 저장본)의 위젯을 지금 캔버스에 채운다 — 아직 저장은 안 된 초안
  // 상태이므로, 이어서 save()로 이름을 정해야 scope에 실제로 남는다.
  const loadTemplate = useCallback((templateName) => {
    return fetch(`/api/dashboard-pages/template?name=${encodeURIComponent(templateName)}`, { headers: authHeaders })
      .then(readJsonOrThrow)
      .then(({ widgets }) => {
        suppressDirty.current = true
        persistedIdsRef.current = null // 초안 — save() 전에는 서버에 아무것도 없다
        dispatch({ type: 'loaded', present: { version: 0, widgets } })
        setName(null)
      })
  }, [authHeaders])

  // 본사 전용: 지금 열려 있는(본사) 저장본을 템플릿으로 지정/해제.
  const setTemplateFlag = useCallback((isTemplate) => {
    if (!scopeKey || !name) return Promise.reject(new Error('대상이 없습니다.'))
    return fetch('/api/dashboard-pages/template', {
      method: 'POST',
      headers: jsonHeaders,
      body: JSON.stringify({ scopeKey, name, isTemplate }),
    })
      .then(readJsonOrThrow)
      .then(() => Promise.all([refreshList(), refreshTemplates()]))
  }, [jsonHeaders, scopeKey, name, refreshList, refreshTemplates])

  // targetPageKey를 기본(Default) 화면으로 롤백(배포 해제) — 저장본 자체는 남는다.
  const rollback = useCallback((targetPageKey) => {
    if (!scopeKey || !targetPageKey) return Promise.reject(new Error('롤백 대상이 없습니다.'))
    return fetch('/api/dashboard-pages/rollback', {
      method: 'POST',
      headers: jsonHeaders,
      body: JSON.stringify({ scopeKey, targetPageKey }),
    })
      .then(readJsonOrThrow)
      .then(() => refreshList())
  }, [jsonHeaders, scopeKey, refreshList])

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
    saveStatus,
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
    refreshPageData,
    refreshObjectData,
    selectedWidgetId,
    setSelectedWidgetId,
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
