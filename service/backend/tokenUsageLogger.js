import { AsyncLocalStorage } from 'node:async_hooks'
import { getPool } from './db.js'

const tokenUsageContext = new AsyncLocalStorage()
const AGENT_TYPES = new Set(['main', 'sql', 'sql_2', 'rag', 'powerbi', 'chart'])

function firstString(...values) {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value.trim()
  }
  return null
}

function normalizeAgentType(value, fallback = 'main') {
  const normalized = firstString(value, fallback) || 'main'
  return AGENT_TYPES.has(normalized) ? normalized : 'main'
}

function normalizeTokenCount(value) {
  const number = Number(value)
  return Number.isFinite(number) && number > 0 ? Math.trunc(number) : 0
}

function isUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || ''))
}

function usageTokenCounts(usage = {}) {
  return {
    inputTokens: normalizeTokenCount(usage.prompt_tokens ?? usage.input_tokens ?? usage.promptTokens ?? usage.inputTokens),
    outputTokens: normalizeTokenCount(usage.completion_tokens ?? usage.output_tokens ?? usage.completionTokens ?? usage.outputTokens),
  }
}

function headerValue(req, name) {
  if (!req?.headers) return null
  const value = req.headers[name.toLowerCase()] ?? req.headers[name]
  return Array.isArray(value) ? firstString(...value) : firstString(value)
}

// defaults.identity 는 auth.js 가 토큰에서 검증해낸 신원이다.
// 그게 있으면 요청 본문·헤더의 값은 아예 보지 않는다 — 본문 값은 누구나 바꿔 보낼 수
// 있어서, 둘을 섞으면 남의 딜러사 이름으로 사용량이 기록되거나 그 범위의 데이터가 열린다.
// 신원이 없는 경우(개발 환경에서 토큰 없이 부를 때)에만 예전처럼 본문을 훑는다.
export function buildTokenUsageContext(req, body = {}, defaults = {}) {
  const user = body?.user || {}
  const dashboardState = body?.dashboardState || {}
  const identity = defaults.identity || null
  return {
    scopeKey: identity?.scopeKey || firstString(
      body?.scopeKey,
      user?.scopeKey,
      dashboardState?.scopeKey,
      headerValue(req, 'x-scope-key'),
      defaults.scopeKey,
      'hq',
    ),
    userEmail: identity ? (identity.email || null) : (firstString(
      body?.userEmail,
      user?.email,
      user?.userEmail,
      headerValue(req, 'x-user-email'),
      defaults.userEmail,
    )?.toLowerCase() || null),
    sessionId: firstString(body?.sessionId, defaults.sessionId),
    messageId: firstString(body?.messageId, defaults.messageId),
    agentType: normalizeAgentType(defaults.agentType || body?.agentType),
  }
}

export function withTokenUsageContext(context, fn) {
  return tokenUsageContext.run(context || {}, fn)
}

export function getTokenUsageContext() {
  return tokenUsageContext.getStore() || {}
}

async function resolveCompanyInfoId(pool, scopeKey) {
  const key = firstString(scopeKey, 'hq')
  const result = await pool.query(
    'SELECT company_info_id FROM dbo."ScopeCompany_map" WHERE scope_key = $1',
    [key],
  )
  if (result.rows[0]?.company_info_id) return result.rows[0].company_info_id
  if (key !== 'hq') return resolveCompanyInfoId(pool, 'hq')
  return null
}

async function existingSessionId(pool, value) {
  if (!isUuid(value)) return null
  const result = await pool.query('SELECT 1 FROM agent."Chat_session" WHERE session_id = $1', [value])
  return result.rowCount ? value : null
}

async function existingMessageId(pool, value) {
  if (!isUuid(value)) return null
  const result = await pool.query('SELECT 1 FROM agent."Chat_message" WHERE message_id = $1', [value])
  return result.rowCount ? value : null
}

export async function recordTokenUsage({ usage, agentType, modelId = null, latencyMs, succeeded = true, errorMessage = null } = {}) {
  const context = getTokenUsageContext()
  const { inputTokens, outputTokens } = usageTokenCounts(usage)
  const pool = getPool()

  try {
    const companyInfoId = await resolveCompanyInfoId(pool, context.scopeKey)
    if (!companyInfoId) {
      console.warn('[token-usage] skipped: no company mapping for scope', context.scopeKey || 'hq')
      return
    }

    const sessionId = await existingSessionId(pool, context.sessionId)
    const messageId = await existingMessageId(pool, context.messageId)

    await pool.query(
      `INSERT INTO agent."TokenUsage_log"
        (company_info_id, user_email, session_id, message_id, agent_type, model_id,
         input_tokens, output_tokens, latency_ms, succeeded, error_message)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [
        companyInfoId,
        context.userEmail || null,
        sessionId,
        messageId,
        normalizeAgentType(agentType, context.agentType),
        modelId || null,
        inputTokens,
        outputTokens,
        Number.isFinite(Number(latencyMs)) ? Math.max(0, Math.trunc(Number(latencyMs))) : null,
        Boolean(succeeded),
        errorMessage ? String(errorMessage).slice(0, 4000) : null,
      ],
    )
  } catch (err) {
    console.warn('[token-usage] failed to write usage log:', err.message)
  }
}