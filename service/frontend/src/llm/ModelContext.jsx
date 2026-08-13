import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

// 어떤 LLM 모델을 쓸지 앱 전체가 한 곳에서 정한다.
//
// 기능마다 따로 고르게 하면 "챗봇은 Claude인데 대시보드는 GPT"인 상태가 생기고, 결과를
// 비교할 때 무엇 때문에 달라졌는지 알 수 없다. 한 번 고르면 챗·대시보드 커스텀·
// Agentic BI·HTML 편집·이상현상 해석이 전부 그 모델로 간다.
//
// 고른 값은 브라우저에 남긴다(서버에 저장하지 않는다) — 사람마다 다른 모델로 시험해 보는
// 게 이 기능의 목적이라, 한 사람의 선택이 다른 사람 화면까지 바꾸면 안 된다.
const STORAGE_KEY = 'toyota.llm.model'

const ModelContext = createContext(null)

export function ModelProvider({ children }) {
  const [models, setModels] = useState([])
  const [modelId, setModelId] = useState(() => {
    try { return localStorage.getItem(STORAGE_KEY) || '' } catch { return '' }
  })
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetch('/api/llm/models', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((body) => {
        if (cancelled || !body) return
        setModels(body.models || [])
        // 저장된 선택이 더 이상 못 쓰는 모델이면(키가 빠졌거나 목록에서 없어졌으면)
        // 조용히 기본값으로 되돌린다. 안 그러면 매 요청이 서버에서 기본값으로 떨어지는데
        // 화면에는 고른 모델이 그대로 떠 있어서 무엇으로 답했는지 어긋난다.
        const usable = (body.models || []).filter((m) => m.available).map((m) => m.id)
        setModelId((prev) => (prev && usable.includes(prev) ? prev : body.defaultModelId || usable[0] || ''))
      })
      .catch(() => { /* 목록을 못 받으면 서버 기본 모델로 동작한다 */ })
      .finally(() => { if (!cancelled) setLoaded(true) })
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    try { if (modelId) localStorage.setItem(STORAGE_KEY, modelId) } catch { /* 사생활 모드 등 */ }
  }, [modelId])

  const value = useMemo(() => ({
    models,
    modelId,
    loaded,
    setModelId,
    current: models.find((m) => m.id === modelId) || null,
    /** 요청 본문에 얹을 조각. 아직 목록을 못 받았으면 아무것도 안 보낸다(서버 기본값). */
    modelBody: modelId ? { modelId } : {},
    /** GET 요청용 쿼리 조각. */
    modelQuery: modelId ? `model=${encodeURIComponent(modelId)}` : '',
  }), [models, modelId, loaded])

  return <ModelContext.Provider value={value}>{children}</ModelContext.Provider>
}

/** 모델 선택이 없어도 앱은 돌아야 한다 — Provider 밖에서 부르면 빈 값을 준다. */
export function useModel() {
  return useContext(ModelContext) || {
    models: [], modelId: '', loaded: false, current: null,
    setModelId: () => {}, modelBody: {}, modelQuery: '',
  }
}

export const useModelBody = () => useModel().modelBody

export default ModelContext
