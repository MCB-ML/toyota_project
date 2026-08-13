// GET /api/llm/models — 화면의 모델 선택기가 읽는 목록.
//
// 키는 절대 나가지 않는다. 못 쓰는 모델도 목록에는 남기고 **왜 못 쓰는지**(어떤 환경변수가
// 비었는지)를 함께 준다 — 목록에서 지워버리면 "왜 이 모델이 안 보이지"를 사람이 추측한다.
import { DEFAULT_MODEL_ID, listModels } from './llm/index.js'

export async function handleListLlmModels(req, res) {
  res.statusCode = 200
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.end(JSON.stringify({ models: listModels(), defaultModelId: DEFAULT_MODEL_ID }))
}
