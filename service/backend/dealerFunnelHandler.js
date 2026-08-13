// 딜러 계약퍼널 조회 API.
//
// GET /api/dealer-funnel/activity?from=2026-01-01&to=2026-08-01&brand=LEXUS
//
// 집계 규칙은 dealerFunnel/ 안에 있고 여기서는 입력 검증과 응답만 한다.
// Express(server.js)와 Vite 개발 서버(vite.config.js) 양쪽에서 같은 함수를 쓰므로
// req.query / res.json 같은 Express 전용 API를 쓰지 않는다 — 개발 서버는 raw req/res를 넘긴다.
import { getActivityFunnel } from './dealerFunnel/activityAggregate.js'
import { getTestDriveFunnel } from './dealerFunnel/testDrive.js'
import { getForecast } from './dealerFunnel/dailySeries.js'
import { getFunnelInsight } from './dealerFunnel/insight.js'
import { buildHtmlReport } from './dealerFunnel/htmlReport.js'
import { editHtmlReport } from './dealerFunnel/htmlEdit.js'
import { cachedFunnel } from './dealerFunnel/funnelCache.js'
import { readJsonBody } from './azureClient.js'

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/
const BRANDS = new Set(['LEXUS', 'TOYOTA'])

function sendJson(res, status, body) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.end(JSON.stringify(body))
}

/** 기본 기간: 올해 1월 1일 ~ 다음 달 1일. 당월은 미완성이라 화면이 따로 표시한다. */
export function defaultPeriod(now = new Date()) {
  const y = now.getUTCFullYear()
  const m = now.getUTCMonth() + 1
  const pad = (v) => String(v).padStart(2, '0')
  return { from: `${y}-01-01`, to: m === 12 ? `${y + 1}-01-01` : `${y}-${pad(m + 1)}-01` }
}

/** @returns {{from, to, brand}|{error: string}} */
export function parseActivityQuery(searchParams, now = new Date()) {
  const base = defaultPeriod(now)
  const from = String(searchParams.get('from') || base.from)
  const to = String(searchParams.get('to') || base.to)
  const raw = searchParams.get('brand')
  const brand = raw ? String(raw).toUpperCase() : null

  if (!ISO_DATE.test(from) || !ISO_DATE.test(to)) return { error: 'from/to는 YYYY-MM-DD 형식이어야 합니다.' }
  if (from >= to) return { error: 'from은 to보다 앞서야 합니다.' }
  if (brand && !BRANDS.has(brand)) return { error: `brand는 ${[...BRANDS].join(' 또는 ')} 여야 합니다.` }
  return { from, to, brand }
}

/** 조회 함수 하나를 감싸 같은 검증·오류 처리를 태운다. */
function makeHandler(label, run) {
  return async (req, res) => {
    const parsed = parseActivityQuery(new URL(req.url, 'http://localhost').searchParams)
    if (parsed.error) return sendJson(res, 400, { error: parsed.error })
    try {
      return sendJson(res, 200, await run(parsed, new URL(req.url, 'http://localhost')))
    } catch (error) {
      console.error(`[dealer-funnel] ${label} 실패:`, error)
      return sendJson(res, 500, { error: error.message || '집계 중 오류가 발생했습니다.' })
    }
  }
}

/** ?refresh=1 이면 캐시를 건너뛰고 Fabric에서 다시 만든다 — 화면의 '원본으로'가 쓴다. */
const wantsRefresh = (url) => ['1', 'true'].includes(String(url?.searchParams.get('refresh') || '').toLowerCase())

/**
 * 지표 목록 + 집계 시리즈 (GET /api/dealer-funnel/metrics).
 *
 * 화면의 지표 정의 표와 HTML 편집 챗봇이 같은 것을 본다. 정의를 화면에 따로 적어 두면
 * 조회하는 지표와 갈라지는데, 그게 실제로 벌어졌다 — 표에는 퍼널 4단계가 있고 그림에는
 * 둘뿐이었다. explain=false로 불러 LLM 해석은 건너뛴다(정의 표에는 필요 없다).
 */
export const handleDealerFunnelMetrics = makeHandler('지표 목록', async (p, url) => {
  const insight = await getFunnelInsight({ ...p, explain: false, refresh: wantsRefresh(url) })
  return {
    period: insight.period,
    as_of: insight.as_of,
    metrics: insight.metrics,
    issues: insight.metric_issues,
    series: Object.fromEntries(Object.keys(insight.monthly).map((id) => [id, {
      total: insight.funnel_totals?.[id] ?? null,
      month: insight.monthly[id],
      channel: insight.funnel_totals?.[`${id}_채널별`] ?? {},
      month_by_channel: insight.month_by_channel?.[id] ?? {},
      month_by_dealer: insight.month_by_dealer?.[id] ?? {},
    }])),
    forecast: insight.forecast,
    cache: insight.cache,
  }
})

/**
 * 조회 결과를 캐시에 태운다.
 *
 * 원천이 하루 단위로만 바뀌므로 같은 날 같은 질문에 Fabric을 다시 칠 이유가 없다.
 * 캐시 상태(fresh/stale/miss)와 만든 시각을 응답에 함께 실어, 화면이 "언제 값인지"를
 * 말할 수 있게 한다 — 안 보이면 데이터가 안 바뀐 건지 캐시가 안 풀린 건지 모른다.
 */
function cachedHandler(label, name, run) {
  return makeHandler(label, async (parsed, url) => {
    const { value, cache } = await cachedFunnel({
      name,
      params: parsed,
      forceRefresh: wantsRefresh(url),
      loader: () => run(parsed),
    })
    return { ...value, cache }
  })
}

export const handleDealerFunnelActivity = cachedHandler('활동 집계', 'activity', getActivityFunnel)
export const handleDealerFunnelTestDrive = cachedHandler('시승 집계', 'testdrive', getTestDriveFunnel)
export const handleDealerFunnelForecast = cachedHandler('부분월 예측', 'forecast', getForecast)

// explain=false 면 AI를 부르지 않고 탐지까지만 — 쿼터·장애에 화면이 묶이지 않게.
export const handleDealerFunnelInsight = makeHandler('이상탐지·해석', (p, url) =>
  getFunnelInsight({
    ...p,
    explain: url?.searchParams.get('explain') !== 'false',
    refresh: wantsRefresh(url),
    modelId: url?.searchParams.get('model') || null,
  }))

/**
 * 단일 HTML 대시보드 (정의서 2-2 (a)).
 *
 * 브라우저에서 바로 열리고 파일 하나로 공유되는 형태다. 외부 요청이 없어 사내망·오프라인에서도
 * 그대로 열린다 — 그게 이 산출물의 요건이라 CDN을 쓰지 않는다.
 */
export async function handleDealerFunnelReport(req, res) {
  const url = new URL(req.url, 'http://localhost')
  const parsed = parseActivityQuery(url.searchParams)
  if (parsed.error) return sendJson(res, 400, { error: parsed.error })

  try {
    const insight = await getFunnelInsight({
      ...parsed,
      explain: url.searchParams.get('explain') !== 'false',
      refresh: wantsRefresh(url),
      modelId: url.searchParams.get('model') || null,
    })
    const html = buildHtmlReport(insight)
    const stamp = new Date().toISOString().slice(0, 10)
    const name = `dealer-funnel-${parsed.brand ? `${parsed.brand.toLowerCase()}-` : ''}${stamp}.html`
    res.statusCode = 200
    res.setHeader('Content-Type', 'text/html; charset=utf-8')
    // 미리보기가 아니라 파일로 받는 게 기본 — 공유가 목적이다.
    if (url.searchParams.get('download') !== 'false') {
      res.setHeader('Content-Disposition', `attachment; filename="${name}"`)
    }
    return res.end(html)
  } catch (error) {
    console.error('[dealer-funnel] HTML 생성 실패:', error)
    return sendJson(res, 500, { error: error.message || 'HTML 생성 중 오류가 발생했습니다.' })
  }
}

// 문서 하나가 통째로 오간다. 넉넉히 잡되 상한은 둔다 — 없으면 붙여넣기 한 번에
// LLM 호출이 컨텍스트 초과로 실패하고, 그 비용은 이미 다 나간 뒤다.
const MAX_HTML_BYTES = 400_000

/**
 * 챗봇으로 HTML 고치기 (POST /api/dealer-funnel/report-edit).
 *
 * 서버는 문서를 들고 있지 않다. 화면이 매 턴 현재 문서 전문을 보내고 고쳐진 전문을
 * 받아 간다 — 버전 이력과 되돌리기는 화면 쪽에 있다(대시보드 커스텀과 같은 방식).
 */
export async function handleDealerFunnelReportEdit(req, res) {
  let body
  try {
    body = await readJsonBody(req)
  } catch {
    return sendJson(res, 400, { error: '잘못된 요청 본문입니다.' })
  }

  const html = typeof body?.html === 'string' ? body.html : ''
  const instruction = typeof body?.instruction === 'string' ? body.instruction.trim() : ''
  if (!html.trim()) return sendJson(res, 400, { error: '수정할 HTML이 없습니다.' })
  if (!instruction) return sendJson(res, 400, { error: '무엇을 바꿀지 적어 주세요.' })
  if (Buffer.byteLength(html, 'utf8') > MAX_HTML_BYTES) {
    return sendJson(res, 413, { error: `문서가 너무 큽니다(${Math.round(MAX_HTML_BYTES / 1000)}KB 초과).` })
  }

  try {
    const result = await editHtmlReport({ html, instruction, data: body?.data, history: body?.history, modelId: body?.modelId })
    // AI 쪽 실패(설정 없음·잘린 응답)는 서버 버그가 아니라 상류 문제라 502로 구분한다.
    if (result.error) return sendJson(res, 502, { error: result.error })
    return sendJson(res, 200, result)
  } catch (error) {
    console.error('[dealer-funnel] HTML 편집 실패:', error)
    return sendJson(res, 500, { error: error.message || 'HTML 편집 중 오류가 발생했습니다.' })
  }
}
