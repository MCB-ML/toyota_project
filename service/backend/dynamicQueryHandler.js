import { readJsonBody } from './azureClient.js'
import { runDynamicQuery } from './dynamic/index.js'
import { renderResultHtml } from './dynamic/render/htmlView.js'
import { buildTokenUsageContext, withTokenUsageContext } from './tokenUsageLogger.js'
import { requireIdentity } from './auth.js'

// POST /api/dynamic-query — Dynamic Semantic Query Planner.
// RAG 테스트 탭이 쓰던 Pattern Card Text2SQL을 대체한다. 다른 탭(챗봇·Agentic BI·
// HTML 작업대)은 이 경로를 타지 않는다 — 기존 실행 경로는 그대로다.
export async function handleDynamicQueryRequest(req, res) {
  // SSE 헤더를 내보내기 전에 인증을 끝낸다 — 스트림이 열린 뒤에는 401을 알릴 수 없다.
  let body
  try {
    body = await readJsonBody(req)
  } catch {
    res.statusCode = 400
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    return res.end(JSON.stringify({ message: '잘못된 요청 본문입니다.' }))
  }
  const identity = await requireIdentity(req, res, { body })
  if (!identity) return

  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.setHeader('X-Accel-Buffering', 'no')

  const sendEvent = (data) => res.write(`data: ${JSON.stringify(data)}\n\n`)

  try {
    const question = String(body?.message || '').trim()
    if (!question) {
      sendEvent({ type: 'error', message: '질문이 비어 있습니다.' })
      return
    }
    await withTokenUsageContext(buildTokenUsageContext(req, body, { agentType: 'dynamic-planner', identity }), async () => {
      // history는 화면이 들고 있다가 매 턴 통째로 보낸다(챗봇·대시보드 경로와 같은 방식) —
      // 서버는 대화 상태를 저장하지 않는다.
      const history = Array.isArray(body?.history) ? body.history.slice(-4) : []
      await runDynamicQuery({ question, history, modelId: body?.modelId }, { sendEvent })
    })
  } catch (err) {
    console.error('[dynamic-query]', err.message)
    sendEvent({ type: 'error', message: `오류가 발생했습니다: ${err.message}` })
  } finally {
    sendEvent({ type: 'done' })
    res.end()
  }
}

// 결과 문서가 이 크기를 넘으면 편집 요청을 받지 않는다 — dealerFunnel 쪽과 같은 취지지만
// 여기 문서는 차트 하나 + 표라 훨씬 작다. 넘었다면 표시할 행이 과한 것이다.
const MAX_VIEW_HTML_BYTES = 300_000

// POST /api/dynamic-query/render — 조회 결과를 화면(HTML)으로 만든다.
//
// 조회와 분리한 이유: 숫자는 결정론적 경로가 내고, 그림은 LLM이 자유롭게 그린다.
// 그림 생성이 실패해도 이미 나온 숫자는 그대로 남는다. 후속 지시("막대로 바꿔줘")도
// 같은 엔드포인트로 들어온다 — 그때는 조회를 다시 하지 않는다.
export async function handleDynamicRenderRequest(req, res) {
  let body
  try {
    body = await readJsonBody(req)
  } catch {
    res.statusCode = 400
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    return res.end(JSON.stringify({ error: '잘못된 요청 본문입니다.' }))
  }
  const identity = await requireIdentity(req, res, { body })
  if (!identity) return

  const sendJson = (status, payload) => {
    res.statusCode = status
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    res.end(JSON.stringify(payload))
  }

  if (body?.html && Buffer.byteLength(String(body.html), 'utf8') > MAX_VIEW_HTML_BYTES) {
    return sendJson(413, { error: `문서가 너무 큽니다(${Math.round(MAX_VIEW_HTML_BYTES / 1000)}KB 초과).` })
  }

  try {
    const result = await withTokenUsageContext(
      buildTokenUsageContext(req, body, { agentType: 'dynamic-render', identity }),
      () => renderResultHtml({
        question: String(body?.question || ''),
        columns: body?.columns || null,
        rows: body?.rows || [],
        value: body?.value ?? null,
        title: body?.title || null,
        provenance: body?.provenance || null,
        level: body?.level || null,
        instruction: body?.instruction || null,
        html: body?.html || null,
        history: body?.history || [],
        modelId: body?.modelId,
      }),
    )
    // AI 쪽 실패(설정 없음·잘린 응답·외부 참조)는 서버 버그가 아니라 상류 문제라 502로 구분한다.
    if (result.error) return sendJson(502, { error: result.error })
    return sendJson(200, result)
  } catch (err) {
    console.error('[dynamic-render]', err.message)
    return sendJson(500, { error: err.message || '화면 생성 중 오류가 발생했습니다.' })
  }
}
