import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { createAzureClient, readJsonBody, getAzureConfig } from './azureClient.js'
import { streamAssistantTurn } from './azureStream.js'
import { TOOLS, buildSystemPrompt } from './chatTools.js'

// Handles POST /api/chat — free-form Q&A over the Toyota/Lexus data summary,
// with the model optionally calling render_* tools to attach charts/tables.
// Shared verbatim between the Vite dev middleware and the Express prod server;
// only `dataDir` (public/data in dev, dist/data in prod) differs between them.
export async function handleChatRequest(req, res, { dataDir }) {
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.setHeader('X-Accel-Buffering', 'no')

  const sendEvent = (data) => res.write(`data: ${JSON.stringify(data)}\n\n`)

  try {
    const client = createAzureClient()
    if (!client) {
      sendEvent({ type: 'error', message: 'Azure OpenAI 환경변수가 설정되지 않았습니다. .env 파일을 확인하세요.' })
      return res.end()
    }

    const { messages } = await readJsonBody(req)

    const summaryPath = join(dataDir, 'summary.json')
    if (!existsSync(summaryPath)) {
      sendEvent({ type: 'error', message: 'summary.json을 찾을 수 없습니다. generate_data.py를 먼저 실행하세요.' })
      return res.end()
    }
    const summary = JSON.parse(readFileSync(summaryPath, 'utf-8'))

    const { deployment } = getAzureConfig()
    const toolCalls = await streamAssistantTurn(client, {
      model: deployment,
      messages: [{ role: 'system', content: buildSystemPrompt(summary) }, ...messages],
      tools: TOOLS,
      onText: (text) => sendEvent({ type: 'text', text }),
    })

    for (const tc of toolCalls) {
      if (tc.args) {
        sendEvent({ type: 'component', name: tc.name, props: tc.args })
      } else {
        console.warn('[chat] Failed to parse tool call args:', tc)
      }
    }

    sendEvent({ type: 'done' })
    res.end()
  } catch (err) {
    console.error('[chat]', err.message)
    sendEvent({ type: 'error', message: `오류가 발생했습니다: ${err.message}` })
    res.end()
  }
}
