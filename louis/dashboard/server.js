import express from 'express'
import { createServer } from 'node:http'
import { readFileSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { config as loadDotenv } from 'dotenv'
import { AzureOpenAI } from 'openai'

loadDotenv()

const __dirname = dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = process.env.PORT || 3000

// ─── TOOLS (OpenAI function-calling format) ─────────────────────────────────
const TOOLS = [
  {
    type: 'function',
    function: {
      name: 'render_bar_chart',
      description: '막대 차트(Bar Chart)를 생성합니다. 카테고리별 수치 비교에 사용하세요.',
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          data: { type: 'array', items: { type: 'object' } },
          x_key: { type: 'string' },
          y_key: { type: 'string' },
          color: { type: 'string' },
        },
        required: ['title', 'data', 'x_key', 'y_key'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'render_line_chart',
      description: '선 차트(Line Chart)를 생성합니다. 시계열 추이 분석에 사용하세요.',
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          data: { type: 'array', items: { type: 'object' } },
          x_key: { type: 'string' },
          y_keys: { type: 'array', items: { type: 'string' } },
          y_labels: { type: 'array', items: { type: 'string' } },
        },
        required: ['title', 'data', 'x_key', 'y_keys'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'render_kpi_cards',
      description: 'KPI 지표 카드를 생성합니다.',
      parameters: {
        type: 'object',
        properties: {
          cards: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                title: { type: 'string' },
                value: { type: 'string' },
                sub: { type: 'string' },
                trend: { type: 'string', enum: ['up', 'down', 'neutral'] },
              },
              required: ['title', 'value'],
            },
          },
        },
        required: ['cards'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'render_table',
      description: '데이터 테이블을 생성합니다.',
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          columns: { type: 'array', items: { type: 'string' } },
          rows: { type: 'array', items: { type: 'array' } },
        },
        required: ['title', 'columns', 'rows'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'render_pie_chart',
      description: '파이/도넛 차트를 생성합니다.',
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          data: {
            type: 'array',
            items: {
              type: 'object',
              properties: { name: { type: 'string' }, value: { type: 'number' } },
              required: ['name', 'value'],
            },
          },
        },
        required: ['title', 'data'],
      },
    },
  },
]

function buildSystemPrompt(summary) {
  const invPct = (n) => ((n / summary.inventory.total_vehicles) * 100).toFixed(0)
  return `당신은 Toyota/Lexus Korea의 데이터 분석 AI 어시스턴트입니다.
아래의 실제 데이터를 기반으로 한국어로 분석 및 인사이트를 제공하세요.

# 현재 데이터 (${summary.last_updated} 기준)

## 차량 현황 (재고)
- 총 등록 차량: ${summary.inventory.total_vehicles.toLocaleString()}대
- Lexus: ${summary.inventory.lexus.toLocaleString()}대 (${invPct(summary.inventory.lexus)}%)
- Toyota: ${summary.inventory.toyota.toLocaleString()}대 (${invPct(summary.inventory.toyota)}%)
- 최초소유 차량: ${summary.inventory.first_owner.toLocaleString()}대
- 차종별 현황 (상위 10): ${JSON.stringify(summary.inventory.top_models)}
- 연도별 출고: ${JSON.stringify(summary.inventory.delivery_by_year)}

## 계약 현황
- 총 계약: ${summary.contracts.total.toLocaleString()}건
- 출고완료: ${summary.contracts.completed.toLocaleString()}건 (완료율 ${summary.contracts.completion_rate}%)
- Lexus 계약: ${summary.contracts.lexus.toLocaleString()}건 / Toyota 계약: ${summary.contracts.toyota.toLocaleString()}건
- 최근 12개월 추이: ${JSON.stringify(summary.contracts.monthly_trend_last12)}
- 차종별 계약 상위 10: ${JSON.stringify(summary.contracts.by_model_top10)}
- 계약 상태: ${JSON.stringify(summary.contracts.by_status)}

## FMS/PMS/SMS 쿠폰 현황
- 총 FMS 서비스: ${summary.fms_coupon.total_fms_services.toLocaleString()}건 (${summary.fms_coupon.unique_vins.toLocaleString()}대)
- FMS(무상점검 1~5차): ${summary.fms_coupon.fms_count.toLocaleString()}건
- PMS(연장 6~11차): ${summary.fms_coupon.pms_count.toLocaleString()}건
- SMS(스마트 12차~): ${summary.fms_coupon.sms_count.toLocaleString()}건
- CR 타겟 차량: ${summary.fms_coupon.cr_targets.toLocaleString()}대
- 연차별 잔여비율: ${JSON.stringify(summary.fms_coupon.remaining_by_age)}
- ${summary.fms_coupon.note}

# 응답 지침
1. 항상 한국어로 답변하세요
2. 구체적인 수치와 함께 인사이트를 제공하세요
3. 시각화가 필요하면 반드시 render_* 도구를 사용하여 차트/표를 생성하세요
4. 하나의 답변에 여러 개의 차트/표를 생성할 수 있습니다
5. 비율/퍼센트는 소수점 1자리까지 표시하세요`
}

// ─── /api/chat  SSE endpoint ─────────────────────────────────────────────────
app.post('/api/chat', async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.setHeader('X-Accel-Buffering', 'no') // disable nginx buffering on Azure

  const sendEvent = (data) => res.write(`data: ${JSON.stringify(data)}\n\n`)

  try {
    const apiKey = process.env.AZURE_OPENAI_KEY
    const endpoint = process.env.AZURE_OPENAI_ENDPOINT
    const deployment = process.env.AZURE_OPENAI_DEPLOYMENT
    const apiVersion = process.env.AZURE_OPENAI_API_VERSION || '2025-04-01-preview'

    if (!apiKey || !endpoint || !deployment) {
      sendEvent({ type: 'error', message: 'Azure OpenAI 환경변수가 설정되지 않았습니다.' })
      return res.end()
    }

    // Parse body
    const rawBody = await new Promise((resolve, reject) => {
      const chunks = []
      req.on('data', c => chunks.push(c))
      req.on('end', () => resolve(Buffer.concat(chunks).toString()))
      req.on('error', reject)
    })
    const { messages } = JSON.parse(rawBody)

    // Load summary.json (served from public/data/ — dist/data/ after build)
    const summaryPath = join(__dirname, 'dist', 'data', 'summary.json')
    if (!existsSync(summaryPath)) {
      sendEvent({ type: 'error', message: 'summary.json을 찾을 수 없습니다. generate_data.py를 먼저 실행 후 빌드하세요.' })
      return res.end()
    }
    const summary = JSON.parse(readFileSync(summaryPath, 'utf-8'))

    const client = new AzureOpenAI({ apiKey, endpoint, deployment, apiVersion })

    const stream = await client.chat.completions.create({
      model: deployment,
      max_tokens: 4096,
      stream: true,
      messages: [{ role: 'system', content: buildSystemPrompt(summary) }, ...messages],
      tools: TOOLS,
      tool_choice: 'auto',
    })

    const toolCallBuffers = {}
    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta
      if (!delta) continue
      if (delta.content) sendEvent({ type: 'text', text: delta.content })
      if (delta.tool_calls) {
        for (const tc of delta.tool_calls) {
          const idx = tc.index
          if (!toolCallBuffers[idx]) toolCallBuffers[idx] = { name: '', arguments: '' }
          if (tc.function?.name) toolCallBuffers[idx].name += tc.function.name
          if (tc.function?.arguments) toolCallBuffers[idx].arguments += tc.function.arguments
        }
      }
    }

    for (const tc of Object.values(toolCallBuffers)) {
      try {
        sendEvent({ type: 'component', name: tc.name, props: JSON.parse(tc.arguments) })
      } catch { /* skip malformed */ }
    }

    sendEvent({ type: 'done' })
    res.end()
  } catch (err) {
    console.error('[/api/chat]', err.message)
    sendEvent({ type: 'error', message: `오류: ${err.message}` })
    res.end()
  }
})

// ─── Serve React build (dist/) ────────────────────────────────────────────────
const distPath = join(__dirname, 'dist')
app.use(express.static(distPath))
// SPA fallback — all non-API routes serve index.html (Express 5 syntax)
app.get('/{*path}', (req, res) => {
  res.sendFile(join(distPath, 'index.html'))
})

// ─── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`Toyota Dashboard running on http://localhost:${PORT}`)
})
