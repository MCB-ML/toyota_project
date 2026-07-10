import { createContext, useContext, useReducer, useCallback, useEffect } from 'react'
import { createEmptyDashboardState, applyPatchToState } from '../utils/applyDashboardPatch'

// Pilot scope: this context backs a single page (KTWS 대시보드 커스텀). If a
// second page needs AI customization later, key STORAGE_KEY/state by pageKey.
const DashboardStateContext = createContext(null)
const STORAGE_KEY = 'toyota_dashboard_layout_ktws_custom'
const MAX_HISTORY = 20

function loadStored() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : createEmptyDashboardState()
  } catch {
    return createEmptyDashboardState()
  }
}

function persist(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // localStorage 접근 불가 시(시크릿 모드 등) 저장만 포기하고 넘어간다
  }
}

function init() {
  return { present: loadStored(), past: [], future: [] }
}

function reducer(state, action) {
  switch (action.type) {
    case 'apply': {
      const next = applyPatchToState(state.present, action.patch)
      return { present: next, past: [...state.past, state.present].slice(-MAX_HISTORY), future: [] }
    }
    case 'undo': {
      if (state.past.length === 0) return state
      const previous = state.past[state.past.length - 1]
      return { present: previous, past: state.past.slice(0, -1), future: [state.present, ...state.future] }
    }
    case 'redo': {
      if (state.future.length === 0) return state
      const [next, ...rest] = state.future
      return { present: next, past: [...state.past, state.present], future: rest }
    }
    case 'reset':
      return { present: createEmptyDashboardState(), past: [], future: [] }
    default:
      return state
  }
}

export function DashboardStateProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, undefined, init)

  useEffect(() => { persist(state.present) }, [state.present])

  const applyPatch = useCallback((patch) => dispatch({ type: 'apply', patch }), [])
  const undo = useCallback(() => dispatch({ type: 'undo' }), [])
  const redo = useCallback(() => dispatch({ type: 'redo' }), [])
  const reset = useCallback(() => dispatch({ type: 'reset' }), [])

  const value = {
    dashboardState: state.present,
    applyPatch,
    undo,
    redo,
    reset,
    canUndo: state.past.length > 0,
    canRedo: state.future.length > 0,
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
