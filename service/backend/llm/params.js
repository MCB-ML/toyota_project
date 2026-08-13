// 모델마다 다른 파라미터 규칙을 한 곳에서 흡수한다.
//
// 2026-08-11 실측 — 같은 요청을 세 모델에 그대로 보내면 둘이 400을 뱉는다:
//   gpt-4.1        temperature 0.2 OK · max_tokens OK
//   gpt-5.6-luna   temperature 0.2 → 400 "Only the default (1) value is supported"
//                  max_tokens      → 400 "Use 'max_completion_tokens' instead"
//   claude-sonnet-5 temperature 0.2 → 400 · temperature 1 은 OK
//
// 호출부(narrate·htmlEdit·각 파이프라인)가 모델별 분기를 갖게 두면 모델을 추가할 때마다
// 그 분기를 전부 찾아 고쳐야 한다. 여기서 한 번 걸러 내보낸다.

/** temperature를 못 바꾸는 모델에서 지정값을 버릴 때 남길 안내. 화면이 그대로 보여준다. */
export const FIXED_TEMPERATURE_NOTE = '이 모델은 temperature를 조정할 수 없습니다(항상 기본값). 같은 질문에도 답이 조금씩 달라질 수 있습니다.'

/**
 * 요청 파라미터를 그 모델이 받는 형태로 바꾼다.
 *
 * 못 받는 값은 **버린다**. 남겨서 400을 받으면 사용자에게는 그냥 "실패"로 보이고,
 * 원인이 temperature 하나였다는 걸 알 방법이 없다.
 *
 * @param {{params?: {temperature?: boolean, maxTokensParam?: string}}} spec 모델 명세
 * @param {object} params chat.completions.create()에 넘기려던 값
 */
export function applyParamPolicy(spec, params) {
  const policy = spec?.params || {}
  const out = { ...params }

  if (policy.temperature === false) delete out.temperature

  const key = policy.maxTokensParam || 'max_tokens'
  if (key !== 'max_tokens' && out.max_tokens !== undefined) {
    out[key] = out.max_tokens
    delete out.max_tokens
  }

  return out
}

/** 클라이언트를 감싸 모든 호출에 정책을 태운다. 호출부는 감싼 줄도 모른다. */
export function withParamPolicy(client, spec) {
  return {
    chat: {
      completions: {
        create: (params) => client.chat.completions.create(applyParamPolicy(spec, params)),
      },
    },
  }
}
