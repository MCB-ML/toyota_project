// 모델 하나를 골라 클라이언트를 만든다. LLM을 부르는 모든 곳이 여기만 거친다.
//
// 호출부는 모델 id만 넘기면 된다 — 어느 리소스인지, 어떤 API를 타는지, 배포 이름이
// 무엇인지는 여기서 끝난다. 모델을 늘려도 호출부는 그대로다.
import { AzureOpenAI } from 'openai'
import { createResponsesClient } from './responsesShim.js'
import { DEFAULT_MODEL_ID, listModels, MODELS, pickModelId, resolveModel } from './models.js'
import { withParamPolicy } from './params.js'

export { DEFAULT_MODEL_ID, listModels, MODELS, pickModelId, resolveModel }

// 같은 모델을 매 요청마다 새로 만들면 커넥션이 계속 새로 열린다. id로 재사용한다.
const clients = new Map()

/**
 * @param {string} [modelId] 없거나 못 쓰는 모델이면 기본 모델로 되돌린다.
 * @returns {{client: object, model: string, spec: object}|null} 설정이 없으면 null
 */
export function createLlmClient(modelId) {
  const id = pickModelId(modelId)
  const spec = resolveModel(id)
  if (!spec?.available) return null

  if (!clients.has(id)) {
    const transport = spec.api === 'responses'
      ? createResponsesClient(spec)
      : new AzureOpenAI({
        apiKey: spec.key,
        endpoint: spec.endpoint,
        deployment: spec.deployment,
        apiVersion: spec.apiVersion,
      })
    // 모델마다 다른 파라미터 규칙은 여기서 흡수한다 — 호출부는 늘 같은 값을 보낸다.
    clients.set(id, withParamPolicy(transport, spec))
  }

  // model은 배포 이름이다. 호출부가 `model: getAzureConfig().deployment`로 쓰던 자리를
  // 그대로 대신한다 — 리소스마다 배포 이름이 달라서 id를 그냥 쓰면 404가 난다.
  return { client: clients.get(id), model: spec.deployment, spec }
}

/** 설정이 없을 때 화면에 그대로 보여줄 문구. 어느 환경변수가 비었는지까지 말한다. */
export function missingConfigMessage(modelId) {
  const spec = resolveModel(pickModelId(modelId)) || resolveModel(DEFAULT_MODEL_ID)
  return `${spec?.label ?? modelId} 설정이 없습니다(${spec?.missing?.join(', ') || '환경변수 확인 필요'}).`
}
