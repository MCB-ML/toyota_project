import { readJsonBody } from './azureClient.js'
import { runWarehouseQuery } from './warehousePipeline.js'

// Handles POST /api/warehouse-query — natural language question → live Fabric SQL query.
export async function handleWarehouseQueryRequest(req, res) {
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.setHeader('X-Accel-Buffering', 'no')

  const sendEvent = (data) => res.write(`data: ${JSON.stringify(data)}\n\n`)

  try {
    const { message, history } = await readJsonBody(req)
    if (!message) {
      sendEvent({ type: 'error', message: '잘못된 요청입니다.' })
      return
    }
    await runWarehouseQuery({ message, history: history || [] }, { sendEvent })
  } catch (err) {
    console.error('[warehouse-query]', err.message)
    sendEvent({ type: 'error', message: `오류가 발생했습니다: ${err.message}` })
  } finally {
    sendEvent({ type: 'done' })
    res.end()
  }
}
