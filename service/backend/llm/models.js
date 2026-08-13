// 쓸 수 있는 LLM 모델 목록.
//
// 모델을 늘리는 일이 코드를 고치는 일이 되면 안 된다. 여기 한 줄과 .env 세 줄이면 끝나고,
// 키는 절대 소스에 들어오지 않는다(.env는 gitignore 대상).
//
// ── api 종류를 왜 나누는가 ────────────────────────────────────────
// 같은 Azure 리소스처럼 보여도 받는 API가 다르다. 2026-08-11 실측:
//   toyota-poc-aoai (gpt-5.6-luna)          /openai/deployments/…/chat/completions  200
//   toyota-poc-aoai-claude (claude-sonnet-5) 같은 경로                                404
//                                            /openai/v1/responses                    200
// 그래서 Claude는 Responses API로 부르고, 기존 호출부가 그대로 쓰도록 chat.completions
// 모양으로 감싼다(responsesShim.js). 호출부는 어느 쪽인지 몰라도 된다.
// ────────────────────────────────────────────────────────────────

/**
 * @typedef {object} ModelSpec
 * @property {string} id        화면·API에서 쓰는 식별자
 * @property {string} label     사람이 읽는 이름
 * @property {'chat'|'responses'} api  호출 방식
 * @property {string} envPrefix .env 접두사 — {PREFIX}_KEY/_ENDPOINT/_DEPLOYMENT/_API_VERSION
 */
export const MODELS = [
  {
    id: 'gpt-4.1',
    label: 'GPT-4.1',
    // 2026-08-11 같은 코드·같은 평가 52건으로 luna와 나란히 재고 기본으로 되돌렸다.
    // 확인 필요 2건 대 7건, 틀린 값 0건 대 1건. 근거는 docs/모델비교-luna-vs-gpt41.md.
    note: '기본 모델 — temperature 0을 받아 같은 질문에 같은 답이 나온다',
    api: 'chat',
    envPrefix: 'AZURE_OPENAI',
    params: { temperature: true, maxTokensParam: 'max_tokens' },
    default: true,
  },
  {
    id: 'gpt-5.6-luna',
    label: 'GPT-5.6 Luna',
    note: 'toyota-poc-aoai',
    api: 'chat',
    envPrefix: 'LLM_LUNA',
    // 2026-08-11 실측: temperature 0.2 → 400(기본값 1만 허용), max_tokens → 400(max_completion_tokens).
    //
    // seed를 고정해 봤지만 되돌렸다. 호출 하나만 보면 확실히 듣는다 —
    // 같은 질문 6회가 seed 있으면 1종, 없으면 3종이었다. 그런데 **파이프라인 전체로는
    // 차이가 없다**: 평가 8건을 각 5회씩 seed 있음/없음으로 돌리니 흔들린 항목이
    // 5건 대 4건으로, 오히려 없는 쪽이 조금 나았다. 질문 하나가 LLM을 여러 번 부르고
    // 그 입력이 실행마다 조금씩 달라서, 같은 seed라도 같은 지점에서 갈리지 않는다.
    // top_p는 아예 거부한다(400). 다시 시도하기 전에 이 측정부터 다시 보라.
    params: { temperature: false, maxTokensParam: 'max_completion_tokens' },
  },
  {
    id: 'claude-sonnet-5',
    label: 'Claude Sonnet 5',
    note: 'toyota-poc-aoai-claude · Responses API',
    api: 'responses',
    envPrefix: 'LLM_CLAUDE',
    // temperature 0.2 → 400. max_tokens는 어댑터가 max_output_tokens로 바꾼다.
    params: { temperature: false, maxTokensParam: 'max_tokens' },
  },
]

export const DEFAULT_MODEL_ID = MODELS.find((m) => m.default)?.id ?? MODELS[0].id

const env = (prefix, suffix) => process.env[`${prefix}_${suffix}`]

/**
 * 모델 하나의 접속 정보. 키가 없으면 available=false — 목록에는 남기되 못 고르게 한다.
 * 목록에서 아예 빼면 "왜 이 모델이 안 보이지"를 사람이 추측해야 한다.
 */
export function resolveModel(id) {
  const spec = MODELS.find((m) => m.id === id)
  if (!spec) return null
  const key = env(spec.envPrefix, 'KEY')
  const endpoint = env(spec.envPrefix, 'ENDPOINT')
  // deployment는 대개 모델 id와 같다. 배포 이름을 다르게 준 경우만 .env로 덮어쓴다.
  const deployment = env(spec.envPrefix, 'DEPLOYMENT') || spec.id
  const apiVersion = env(spec.envPrefix, 'API_VERSION') || '2024-12-01-preview'
  return {
    ...spec,
    key,
    endpoint,
    deployment,
    apiVersion,
    available: Boolean(key && endpoint),
    missing: [!key && `${spec.envPrefix}_KEY`, !endpoint && `${spec.envPrefix}_ENDPOINT`].filter(Boolean),
  }
}

/** 요청이 보낸 모델 id를 믿을 수 있는 값으로 바꾼다. 모르는 값·못 쓰는 모델이면 기본으로 되돌린다. */
export function pickModelId(requested) {
  const wanted = String(requested || '').trim()
  if (!wanted) return DEFAULT_MODEL_ID
  const resolved = resolveModel(wanted)
  if (resolved?.available) return wanted
  return DEFAULT_MODEL_ID
}

/** 화면에 줄 목록. 키는 절대 담지 않는다 — 어떤 환경변수가 비었는지만 알린다. */
export function listModels() {
  return MODELS.map((spec) => {
    const r = resolveModel(spec.id)
    return {
      id: spec.id,
      label: spec.label,
      note: spec.note,
      api: spec.api,
      fixedTemperature: spec.params?.temperature === false,
      isDefault: spec.id === DEFAULT_MODEL_ID,
      available: r.available,
      missing: r.missing,
    }
  })
}
