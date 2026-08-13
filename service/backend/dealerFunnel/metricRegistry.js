// 딜러 계약퍼널 — 지표 레지스트리 (요구사항정의서 3-2 · 6장).
//
// 지표 정의가 있어야 할 곳은 한 곳이다. 여기가 그 한 곳이다.
//
// 전에는 정의가 화면(HtmlReport.jsx의 METRICS 상수)에 **글자로만** 있었다. 사람은 읽지만
// 코드는 못 읽는 형태라, 표에는 퍼널 4단계가 다 적혀 있는데 실제로 조회하는 건 활동·시승
// 둘뿐인 상태를 아무도 못 잡았다. 정의와 조회가 갈라지면 갈라진 걸 알아채는 장치가 없다.
//
// 그래서 정의 옆에 **로더**를 붙였다. 표에 지표를 적으려면 그 지표를 실제로 가져오는
// 함수를 같이 적어야 하고, 화면의 지표 표도 이 레지스트리를 받아서 그린다.
// 정의만 있고 데이터가 없는 지표는 이제 구조적으로 생길 수 없다.
import { getActivityFunnel } from './activityAggregate.js'
import { getTestDriveFunnel } from './testDrive.js'
import { getLeadFunnel, getContractFunnel } from './leadContract.js'

/**
 * 퍼널 4단계. 순서가 곧 퍼널 순서다 — 차트 축과 표 행이 이 순서를 따른다.
 *
 * required=true 인 지표는 조회에 실패하면 전체가 실패한다. 활동·시승은 정합성 검증과
 * 파이프라인 단계 표시의 근간이라 없으면 문서가 의미를 잃는다. 나머지는 실패해도
 * "조회 실패"로 표시하고 나머지 지표로 문서를 만든다 — 지표를 늘린 것 때문에
 * 지금까지 잘 나오던 화면이 통째로 죽으면 안 된다.
 */
export const METRIC_CATALOG = [
  {
    id: '활동',
    label: '활동 (Activity)',
    definition: '3-1 매핑에 해당하는 모든 고객 접촉 기록. 판매 목적 여부와 무관하게 전부 포함.',
    source: 'ktws.FCT_ACTIVITY_v2 × ktws.DIM_CRM_ACT_TYPE',
    dateBasis: '활동일자 (act_dt_fr)',
    channelBasis: '활동유형명(tp_nm) 직접 매핑 — 정의서 3-1',
    axes: ['month', 'channel', 'dealer'],
    spec: '정의서 3-1 · 3-5',
    required: true,
  },
  {
    id: '기회',
    label: '기회 (Opportunity)',
    definition: '구매 관심이 포착된 건. 채널·유형과 무관하게 전부 셉니다.',
    source: 'ktws.FCT_LEAD',
    dateBasis: '기회생성일자 (lead_reg_dt)',
    channelBasis: '기회 행의 기회생성 활동유형(ca_act_tp)',
    axes: ['month', 'channel', 'dealer'],
    spec: '정의서 3-2',
    required: false,
  },
  {
    id: '시승',
    label: '시승 (Test Drive)',
    definition: '기회진행-시승결과 → 시승취소 제외 → 기회번호(시승) 중복제거. 1기회당 1건.',
    source: 'ktws.FCT_ACTIVITY_v2 (3-4 별도 파이프라인)',
    dateBasis: '시승 활동일자 (act_dt_fr)',
    channelBasis: '기회 행(ca_act_tp) 1차 → 같은 기회의 활동으로 2차 보완 — 정의서 3-4 ④',
    axes: ['month', 'channel', 'dealer'],
    spec: '정의서 3-4',
    required: true,
  },
  {
    id: '계약',
    label: '계약 (Contract)',
    definition: 'Gross 기준 — 취소·반려된 건도 그대로 포함. 취소율은 별도 참고 지표로만 관리.',
    source: 'ktws.FCT_CONTRACT_KTWS (채널은 lead_key로 기회 행에 연결)',
    dateBasis: '계약일자 (contract_dt)',
    channelBasis: '기회 행의 기회생성 활동유형(ca_act_tp) — 기회와 같은 근거',
    axes: ['month', 'channel', 'dealer'],
    spec: '정의서 3-2',
    required: false,
    highlight: true,
  },
]

export const METRIC_IDS = METRIC_CATALOG.map((m) => m.id)

/** 지표별 로더. 카탈로그에 지표를 넣으려면 여기에도 넣어야 한다 — 정의만 있는 지표를 막는다. */
const LOADERS = {
  활동: getActivityFunnel,
  기회: getLeadFunnel,
  시승: getTestDriveFunnel,
  계약: getContractFunnel,
}

/** 카탈로그와 로더가 어긋나면 부팅 시점에 터뜨린다. 런타임에 조용히 빈 지표가 되는 것보다 낫다. */
for (const { id } of METRIC_CATALOG) {
  if (!LOADERS[id]) throw new Error(`지표 '${id}'에 로더가 없습니다 — metricRegistry.js의 LOADERS에 추가하세요.`)
}

/**
 * 지표마다 모양이 다른 반환값(활동은 category·excluded가, 시승은 stages가 더 있다)에서
 * **모든 지표가 공통으로 갖는 축만** 뽑아 같은 모양으로 맞춘다. 차트와 이상탐지는
 * 이 공통 모양만 보면 되고, 지표별 고유 정보는 raw로 따로 들고 간다.
 */
export function toSeries(result) {
  return {
    total: result?.reconciliation?.total ?? result?.total ?? 0,
    month: result?.month || {},
    channel: result?.channel || {},
    dealer: result?.dealer || {},
    month_by_channel: result?.month_by_channel || {},
    month_by_dealer: result?.month_by_dealer || {},
    unattributed: result?.unattributed ?? 0,
  }
}

/**
 * 카탈로그의 지표를 전부 가져온다.
 *
 * 로더 하나가 실패해도 나머지는 살린다(allSettled). required 지표가 실패하면 그때만 던진다.
 *
 * @returns {Promise<{series: object, raw: object, issues: {metric, message}[]}>}
 */
export async function loadMetrics({ from, to, brand = null }) {
  const settled = await Promise.allSettled(
    METRIC_CATALOG.map((m) => LOADERS[m.id]({ from, to, brand })),
  )

  const series = {}
  const raw = {}
  const issues = []

  settled.forEach((outcome, i) => {
    const metric = METRIC_CATALOG[i]
    if (outcome.status === 'fulfilled') {
      raw[metric.id] = outcome.value
      series[metric.id] = toSeries(outcome.value)
      return
    }
    const message = outcome.reason?.message || '조회에 실패했습니다.'
    if (metric.required) throw outcome.reason
    // 빈 값이 아니라 "실패했다"로 남긴다. 0으로 채우면 실적이 0인 것과 구분이 안 된다.
    console.error(`[dealer-funnel] 지표 '${metric.id}' 조회 실패:`, message)
    issues.push({ metric: metric.id, message })
  })

  return { series, raw, issues }
}

/**
 * 화면·AI에 넘기는 지표 목록. 조회 결과가 있으면 실제로 잡힌 건수까지 붙인다 —
 * "정의는 있는데 값이 없는 지표"가 눈에 바로 보이게.
 */
export function describeMetrics({ series = {}, issues = [] } = {}) {
  const failed = new Map(issues.map((i) => [i.metric, i.message]))
  return METRIC_CATALOG.map((m) => ({
    ...m,
    available: Boolean(series[m.id]),
    total: series[m.id]?.total ?? null,
    error: failed.get(m.id) ?? null,
  }))
}
