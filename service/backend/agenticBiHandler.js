import { readJsonBody } from './azureClient.js'
import { runAgenticBiQuery } from './agenticBiPipeline.js'
import { dashboardAccessContextFor } from './dashboardAccessControl.js'
import { buildTokenUsageContext, withTokenUsageContext } from './tokenUsageLogger.js'
import { requireIdentity } from './auth.js'

// Handles POST /api/agentic-bi-ask — 실험용 Ontology/Semantic Layer 기반 Agentic BI
// 파이프라인(agentic_bi_design/ 설계 산출물의 라이브 실행 버전).
export async function handleAgenticBiRequest(req, res) {
  // 인증은 SSE 헤더를 내보내기 전에 끝낸다. 스트림이 한 번 열리면 상태 코드를
  // 바꿀 수 없어서 401 을 알릴 방법이 없다.
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

  // 서버 콘솔에도 그대로 찍는다 — DebugTrace 패널(브라우저)을 안 열어도 npm run dev
  // 터미널에서 LLM이 어떤 지표를 골랐는지/SQL을 어떻게 컴파일했는지 바로 볼 수 있게.
  // debug/error/rejected 만 찍는다 — stage/component/text 는 UI 흐름용이라 노이즈만 됨.
  const sendEvent = (data) => {
    if (data.type === 'debug') {
      console.log(`[agentic-bi-ask][debug] ${data.label}\n${data.detail}`)
    } else if (data.type === 'error') {
      console.error(`[agentic-bi-ask][error] ${data.message}`)
    } else if (data.type === 'rejected') {
      console.warn(`[agentic-bi-ask][rejected] ${data.reason}`)
    }
    res.write(`data: ${JSON.stringify(data)}\n\n`)
  }

  try {
    const { message, dashboardState, history } = body
    if (!message) {
      sendEvent({ type: 'error', message: '잘못된 요청입니다.' })
      return
    }
    console.log(`[agentic-bi-ask] question: ${message}`)
    // 2026-08-04 leo: 현재 public 범위는 기존 결과를 보존하지만, 이후 권한 테이블을 연결하면
    // 자연어 질의 단계부터 mandatory filter와 캐시 범위가 같은 context를 사용해야 한다.
    await withTokenUsageContext(buildTokenUsageContext(req, body, { agentType: 'main', identity }), async () => {
      // 캐시는 딜러사 단위로 공유한다 — 채팅 결과의 원천 데이터가 딜러사 범위라서
      // 같은 딜러사 안에서는 공유가 맞고, 딜러사 사이에는 섞이면 안 된다.
      await runAgenticBiQuery({ message, dashboardState, history, modelId: body?.modelId }, {
        sendEvent,
        accessContext: dashboardAccessContextFor({ scopeKey: identity.scopeKey }),
      })
    })
  } catch (err) {
    console.error('[agentic-bi-ask]', err)
    sendEvent({ type: 'error', message: `오류가 발생했습니다: ${err.message}` })
  } finally {
    sendEvent({ type: 'done' })
    res.end()
  }
}
