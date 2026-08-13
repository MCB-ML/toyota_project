// 딜러 계약퍼널 — 집계 → 탐지 → 해석을 잇는 진입점 (요구사항정의서 2-1, 4-8).
//
// 순서가 곧 역할 분리다:
//   1) 집계   Fabric에서 월별 시리즈를 만든다 (코드)
//   2) 탐지   임계치를 넘는 변화를 찾는다 (코드)
//   3) 해석   왜 그런지 설명한다 (AI) — 1·2의 결과만 받는다
//
// AI를 안 부르는 경로(explain=false)도 남겨 둔다. 탐지까지는 LLM 없이 항상 돌아야
// 화면이 쿼터·장애에 안 묶인다.
import { getForecast } from './dailySeries.js'
import { detectAnomalies } from './anomaly.js'
import { narrateAnomalies } from './narrate.js'
import { describeMetrics, loadMetrics, METRIC_IDS } from './metricRegistry.js'
import { cachedFunnel } from './funnelCache.js'

/** 계약은 아직 별도 집계 모듈이 없다 — 예측 쪽 일별 시리즈에서 월별로 접어 쓴다. */
function monthlyFromForecastSeries(forecastEntry) {
  return forecastEntry?.monthly ?? null
}

// 캐시 키를 만드는 규칙. runFunnelInsight()의 기본값과 **똑같이** 맞춘다 — 여기서 어긋나면
// explain을 생략한 호출과 explain:true 호출이 다른 키를 받아 캐시가 조용히 빗나간다.
export function cacheKey({ from, to, brand = null, explain = true, question = null, modelId = null }) {
  // question이 있으면 해석이 달라진다 — 같은 키로 묶으면 다른 질문에 같은 답이 나온다.
  // 모델도 마찬가지다. 다만 explain=false면 LLM을 안 부르므로 결과가 모델과 무관하다 —
  // 그때까지 모델별로 키를 쪼개면 집계까지 모델 수만큼 다시 돌린다.
  return {
    from,
    to,
    brand: brand ?? null,
    explain: Boolean(explain),
    question: question ?? null,
    ...(explain ? { modelId: modelId ?? null } : {}),
  }
}

/**
 * 집계 → 탐지 → 해석 한 벌. Fabric 쿼리 9번과 LLM 해석 1번이 여기 들어 있어서,
 * 이 함수가 캐시의 단위다. 화면의 /insight · /metrics · /report.html이 모두 이걸 탄다.
 *
 * @param {{refresh?: boolean}} params refresh=true면 캐시를 건너뛰고 다시 만든다.
 */
export async function getFunnelInsight(params) {
  const { refresh = false, ...rest } = params
  const { value, cache } = await cachedFunnel({
    name: 'insight',
    params: cacheKey(rest),
    forceRefresh: refresh,
    loader: () => runFunnelInsight(rest),
  })
  // 화면이 "지금 보는 게 언제 만든 값인지" 말할 수 있어야 한다. 캐시가 보이지 않으면
  // 데이터가 안 바뀐 건지 캐시가 안 풀린 건지 사용자가 구분할 방법이 없다.
  return { ...value, cache }
}

async function runFunnelInsight({ from, to, brand = null, explain = true, question = null, modelId = null }) {
  // 지표 목록을 여기서 다시 적지 않는다. 레지스트리가 가진 것을 전부 가져온다 —
  // 그래야 지표를 추가할 때 카탈로그 한 곳만 고치면 차트·이상탐지까지 따라온다.
  const [metrics, forecastResult] = await Promise.all([
    loadMetrics({ from, to, brand }),
    getForecast({ from, to, brand }),
  ])
  const { series, raw, issues } = metrics
  const activity = raw.활동
  const testdrive = raw.시승

  // 축×월 교차. 원본 행에서 만들어져 추가 조회가 없다 — 정의서 4장 원칙 3의
  // 시점·딜러 분해가 이 위에서 이뤄진다.
  const pick = (key) => Object.fromEntries(Object.entries(series).map(([id, s]) => [id, s[key]]))
  const monthly = pick('month')
  const byChannel = pick('month_by_channel')
  const byDealer = pick('month_by_dealer')

  const partial = {}
  for (const [metric, f] of Object.entries(forecastResult.forecast || {})) {
    if (f && !f.complete) partial[metric] = { yearMonth: f.yearMonth, primary: f.primary }
  }

  // 예측이 없는 지표를 그냥 두면 진행 중인 달이 전월과 그대로 비교돼 무조건 "급감"으로
  // 잡힌다(원칙 5). 레지스트리에 지표를 추가하고 dailySeries.js에 일별 조회를 빼먹으면
  // 정확히 그 일이 벌어지므로, 조용히 넘기지 않고 로그를 남긴다.
  const missingForecast = Object.keys(series).filter((id) => !forecastResult.forecast?.[id])
  if (missingForecast.length) {
    console.warn(`[dealer-funnel] 예측 없는 지표: ${missingForecast.join(', ')} — 부분월 비교를 건너뜁니다.`)
  }

  const detected = detectAnomalies({
    monthly,
    byChannel,
    byDealer,
    partial,
    // 퍼널 순서의 이웃 쌍 — 활동→기회, 기회→시승, 시승→계약. 지표를 늘리면 따라 늘어난다.
    stages: METRIC_IDS.slice(0, -1).map((id, i) => [id, METRIC_IDS[i + 1]]),
    // 파이프라인 건강 상태도 같은 목록에서 본다 — 따로 두면 아무도 안 본다.
    dataLoss: {
      excluded: activity.excluded,
      testDriveUnattributed: { count: testdrive.unattributed, total: testdrive.total },
      // 기회·계약도 같은 잣대로. 채널별 차트가 전체의 몇 %를 그리고 있는지가 여기서 드러난다.
      metricUnattributed: ['기회', '계약']
        .filter((id) => raw[id]?.unattributed > 0)
        .map((id) => ({
          metric: id,
          count: raw[id].unattributed,
          total: raw[id].total,
          detail: Object.entries(raw[id].unattributed_types || {})
            .sort((a, b) => b[1] - a[1]).slice(0, 3)
            .map(([reason, n]) => `${reason} ${n.toLocaleString('ko-KR')}건`).join(' · '),
        })),
    },
  })

  const funnelTotals = {
    // 지표별 총계·채널별을 레지스트리 순서(퍼널 순서)대로 편다.
    ...Object.fromEntries(Object.entries(series).flatMap(([id, s]) => [
      [id, s.total],
      [`${id}_채널별`, s.channel],
    ])),
    시승_파이프라인: testdrive.stages,
    집계_제외: activity.excluded,
  }

  const result = {
    period: { from, to, brand },
    as_of: forecastResult.as_of,
    monthly,
    month_by_channel: byChannel,
    month_by_dealer: byDealer,
    forecast: forecastResult.forecast,
    detection: detected,
    funnel_totals: funnelTotals,
    // 지표 정의를 결과에 함께 싣는다 — 화면의 지표 표도, HTML 편집 챗봇도 이걸 본다.
    metrics: describeMetrics({ series, issues }),
    metric_issues: issues,
    narration: null,
  }

  if (explain) {
    result.narration = await narrateAnomalies({
      period: { from, to },
      brand,
      anomalies: detected.anomalies,
      dealerSpread: detected.dealer_spread,
      forecast: forecastResult.forecast,
      funnelTotals,
      question,
      modelId,
    })
  }
  return result
}

export { monthlyFromForecastSeries }
