import { readJsonBody } from './azureClient.js'
import { runAgenticBiQuery } from './agenticBiPipeline.js'

// Handles POST /api/agentic-bi-ask — 실험용 Ontology/Semantic Layer 기반 Agentic BI
// 파이프라인(agentic_bi_design/ 설계 산출물의 라이브 실행 버전).
export async function handleAgenticBiRequest(req, res) {
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.setHeader('X-Accel-Buffering', 'no')

  const sendEvent = (data) => res.write(`data: ${JSON.stringify(data)}\n\n`)

  try {
    const { message } = await readJsonBody(req)
    if (!message) {
      sendEvent({ type: 'error', message: '잘못된 요청입니다.' })
      return
    }
    await runAgenticBiQuery({ message }, { sendEvent })
  } catch (err) {
    console.error('[agentic-bi-ask]', err)
    sendEvent({ type: 'error', message: `오류가 발생했습니다: ${err.message}` })
  } finally {
    sendEvent({ type: 'done' })
    res.end()
  }
}
