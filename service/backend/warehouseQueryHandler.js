import { readJsonBody } from './azureClient.js'
import { runWarehouseQuery } from './warehousePipeline.js'
import { buildTokenUsageContext, withTokenUsageContext } from './tokenUsageLogger.js'
import { requireIdentity } from './auth.js'

// Handles POST /api/warehouse-query — natural language question → live Fabric SQL query.
export async function handleWarehouseQueryRequest(req, res) {
  // SSE 헤더를 내보내기 전에 인증을 끝낸다 — 스트림이 열린 뒤에는 401 을 알릴 수 없다.
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
    const { message, history } = body
    if (!message) {
      sendEvent({ type: 'error', message: '잘못된 요청입니다.' })
      return
    }
    await withTokenUsageContext(buildTokenUsageContext(req, body, { agentType: 'main', identity }), async () => {
      await runWarehouseQuery({ message, history: history || [], modelId: body?.modelId }, { sendEvent })
    })
  } catch (err) {
    console.error('[warehouse-query]', err.message)
    sendEvent({ type: 'error', message: `오류가 발생했습니다: ${err.message}` })
  } finally {
    sendEvent({ type: 'done' })
    res.end()
  }
}
