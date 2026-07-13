import { readJsonBody } from './azureClient.js'
import { runDashboardPipeline } from './dashboardPipeline.js'

// Handles POST /api/dashboard-customize. The client sends its full current
// widget state on every turn (dashboardState) — this IS the "현재 대시보드
// JSON 상태 읽기" stage; the server holds no state of its own.
export async function handleDashboardCustomizeRequest(req, res) {
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.setHeader('X-Accel-Buffering', 'no')

  const sendEvent = (data) => res.write(`data: ${JSON.stringify(data)}\n\n`)

  try {
    const { message, history, dashboardState } = await readJsonBody(req)
    if (!message || !dashboardState) {
      sendEvent({ type: 'error', message: '잘못된 요청입니다.' })
      return
    }
    await runDashboardPipeline({ message, history: history || [], dashboardState }, { sendEvent })
  } catch (err) {
    console.error('[dashboard-customize]', err.message)
    sendEvent({ type: 'error', message: `오류가 발생했습니다: ${err.message}` })
  } finally {
    sendEvent({ type: 'done' })
    res.end()
  }
}
