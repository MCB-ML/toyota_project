// 딜러 계약퍼널 — 이상현상 탐지 (요구사항정의서 2-1 "코드 — 규칙 기반").
//
// AI가 아니라 코드가 한다. 임계치를 넘는 변화를 기계적으로 찾아 목록으로 만들고,
// **왜 그런지는 설명하지 않는다** — 해석은 4장의 AI 몫이다(narrate.js).
//
// 4장 원칙 중 탐지 단계에서 코드가 지켜야 하는 것:
//   원칙 1  전환율만 보고 판단하지 않는다 — 절대치를 항상 같이 싣는다
//   원칙 2  비교 기준 시점을 결과에 명시한다("6월 대비 7월")
//   원칙 5  부분월은 예상 최종치로 환산한 값끼리만 비교한다
//   원칙 6  소표본(월 10건 미만)은 결론이 아니라 참고로 표시한다

/** 정의서 7장이 "개발사와 협의 필요"로 남긴 값. 여기 모아 두고 화면·API가 그대로 노출한다. */
export const THRESHOLDS = {
  /** 전월 대비 증감률이 이 값을 넘으면 이상으로 본다(%). */
  change_pct: 15,
  /** 이 건수 미만이면 %가 크게 흔들려 결론에 못 쓴다(정의서 4장 원칙 6). */
  small_sample: 10,
  /** 전환율 변화는 %p 기준으로 본다. */
  rate_change_pp: 5,
  /**
   * 집계에서 빠지거나 채널을 못 정한 비율의 상한(%).
   *
   * 화면에 건수를 띄워 두는 것만으로는 부족하다 — 사람이 매번 보지 않으면 이 비율이
   * 커져도 아무도 모른다. 넘으면 이상현상 목록에 올려 눈에 띄게 한다.
   * 2026-08-10 기준 집계 제외 1.55%, 시승 귀속 실패 0.04%.
   */
  data_loss_pct: 3,
}

/**
 * 전환율을 볼 퍼널 단계 쌍. 정의서가 핵심으로 본 지표다(7월 분석: 시승→계약 하락이 전사 공통).
 *
 * 기본값은 기회 시리즈가 없던 시절의 쌍이다. 호출부(insight.js)는 지표 레지스트리의
 * 퍼널 순서에서 이웃 쌍을 뽑아 넘긴다 — 활동→기회→시승→계약 전부를 본다.
 * 여기 하드코딩해 두면 지표를 늘려도 전환율은 옛 조합만 보게 된다.
 */
export const DEFAULT_STAGES = [['활동', '시승'], ['시승', '계약']]

const pct = (curr, prev) => (prev === 0 ? null : ((curr - prev) / prev) * 100)
const round1 = (v) => (v === null || v === undefined ? null : Number(v.toFixed(1)))

/**
 * 월별 시리즈에서 직전 달 대비 급변을 찾는다.
 *
 * @param {object} opts
 * @param {string} opts.metric        '활동' | '시승' | '계약' 등 표시용 이름
 * @param {object} opts.series        {'YYYY-MM': number} — 월별 값
 * @param {string} [opts.dimension]   'channel' | 'dealer' 등. 전체면 생략.
 * @param {string} [opts.member]      그 축의 값(예: '내방/내전')
 * @param {object} [opts.partial]     부분월 정보 {yearMonth, primary} — 있으면 그 달은 예상치로 비교
 * @returns {object[]} 이상현상 목록
 */
export function detectMonthOverMonth({
  metric, series, dimension = null, member = null, partial = null, skipMonth = null,
}) {
  const months = Object.keys(series).sort()
  if (months.length < 2) return []

  // 원칙 5: 부분월은 실적 대신 예상 최종치로 바꿔 놓고 비교한다. 안 그러면 항상 감소로 잡힌다.
  const valueAt = (m) => (partial && partial.yearMonth === m ? partial.primary : Number(series[m] ?? 0))

  const out = []
  for (let i = 1; i < months.length; i += 1) {
    const prevMonth = months[i - 1]
    const currMonth = months[i]

    // 예상치를 만들 수 없는 축(채널·딜러)에서는 부분월을 아예 비교하지 않는다.
    // 6일치 실적을 한 달과 맞대면 전 축이 -70%로 잡히고, 그걸 본 AI가 "전사적 급감"이라고
    // 단정한다 — 2026-08-10 실측으로 실제 그런 오답이 나왔다. 축마다 예측을 따로 만들려면
    // 표본이 작아 신뢰할 수 없으므로(원칙 6), 비교하지 않는 쪽을 택한다.
    if (skipMonth && (prevMonth === skipMonth || currMonth === skipMonth)) continue

    const prev = valueAt(prevMonth)
    const curr = valueAt(currMonth)
    const change = pct(curr, prev)
    if (change === null || Math.abs(change) < THRESHOLDS.change_pct) continue

    const small = Math.max(curr, prev) < THRESHOLDS.small_sample
    out.push({
      kind: 'month_over_month',
      metric,
      dimension,
      member,
      from_month: prevMonth,
      to_month: currMonth,
      from_value: prev,
      to_value: curr,
      change_pct: round1(change),
      direction: change > 0 ? '증가' : '감소',
      // 원칙 5: 예상치로 비교했으면 그 사실을 결과에 남긴다.
      forecast_used: Boolean(partial && (partial.yearMonth === currMonth || partial.yearMonth === prevMonth)),
      // 원칙 6: 소표본은 결론이 아니라 참고.
      small_sample: small,
      note: small ? `월 ${THRESHOLDS.small_sample}건 미만이라 %가 크게 흔들립니다 — 참고용입니다.` : null,
    })
  }
  return out
}

/**
 * 단계 간 전환율 변화. 원칙 1대로 비율과 절대치를 함께 싣는다.
 *
 * @param {object} opts
 * @param {string} opts.from   상위 단계 이름(예: '시승')
 * @param {string} opts.to     하위 단계 이름(예: '계약')
 * @param {object} opts.fromSeries {'YYYY-MM': number}
 * @param {object} opts.toSeries   {'YYYY-MM': number}
 */
export function detectRateChange({ from, to, fromSeries, toSeries }) {
  const months = Object.keys(fromSeries).filter((m) => m in toSeries).sort()
  const out = []
  for (let i = 1; i < months.length; i += 1) {
    const p = months[i - 1]
    const c = months[i]
    const pf = Number(fromSeries[p] ?? 0)
    const cf = Number(fromSeries[c] ?? 0)
    if (!pf || !cf) continue
    const pRate = (Number(toSeries[p] ?? 0) / pf) * 100
    const cRate = (Number(toSeries[c] ?? 0) / cf) * 100
    const diff = cRate - pRate
    if (Math.abs(diff) < THRESHOLDS.rate_change_pp) continue

    out.push({
      kind: 'rate_change',
      metric: `${from}→${to} 전환율`,
      from_month: p,
      to_month: c,
      from_rate_pct: round1(pRate),
      to_rate_pct: round1(cRate),
      change_pp: round1(diff),
      direction: diff > 0 ? '상승' : '하락',
      // 원칙 1: 비율만 보면 착시가 생긴다 — 분모·분자 절대치를 같이 준다.
      from_volume: { [from]: pf, [to]: Number(toSeries[p] ?? 0) },
      to_volume: { [from]: cf, [to]: Number(toSeries[c] ?? 0) },
      small_sample: Math.max(cf, pf) < THRESHOLDS.small_sample,
      // 100%를 넘으면 같은 건이 두 단계를 순서대로 지난 게 아니라는 뜻이다.
      // 2026-08-11 실측: 시승→계약이 5월에 147%였다 — 시승 없이 바로 계약된 건과,
      // 시승은 지난달·계약은 이번 달인 건이 섞여서다. 표시하지 않으면 AI도 사람도
      // "전환율 급등"으로 읽는다.
      over_100: Math.max(pRate, cRate) > 100,
    })
  }
  return out
}

// 무엇을 먼저 보여줄지. 딜러 축을 켜면 항목이 수십 개로 늘어나 전체 신호가 묻힌다.
const SCOPE_RANK = { data_loss: 0, total: 1, channel: 2, dealer: 3 }
const scopeOf = (a) => (a.kind === 'data_loss' ? 'data_loss' : a.dimension || 'total')

/**
 * 정렬 순서: 데이터 손실 → 전체 → 채널 → 딜러, 각 안에서 변화가 큰 것부터.
 * 소표본은 무조건 뒤로 민다 — 결론으로 쓸 수 없는 걸 맨 위에 놓지 않는다(원칙 6).
 * 데이터 손실을 맨 앞에 두는 이유: 그 위에서 계산한 모든 증감률이 함께 흔들린다.
 */
function rank(list) {
  return [...list].sort((a, b) => {
    if (a.small_sample !== b.small_sample) return a.small_sample ? 1 : -1
    const sa = SCOPE_RANK[scopeOf(a)]
    const sb = SCOPE_RANK[scopeOf(b)]
    if (sa !== sb) return sa - sb
    const av = Math.abs(a.change_pct ?? a.change_pp ?? a.loss_pct ?? 0)
    const bv = Math.abs(b.change_pct ?? b.change_pp ?? b.loss_pct ?? 0)
    return bv - av
  })
}

/**
 * "특정 딜러 이슈인가, 전사 패턴인가" — 정의서 4장 원칙 3이 실제로 묻는 것.
 *
 * 딜러별 이상현상을 낱개로 스무 개 늘어놓으면 사람도 AI도 못 읽는다. 같은 지표·같은
 * 구간에서 **몇 개 딜러가 같은 방향으로 움직였는지**로 접는다. 7월 분석 문서가
 * "8개 중 6개 딜러에서 동시 하락 → 전사적 리소스 재배분"이라고 결론 낸 방식 그대로다.
 */
export function summarizeDealerSpread(anomalies, dealerCount = null) {
  const groups = new Map()
  for (const a of anomalies) {
    if (a.dimension !== 'dealer') continue
    const key = `${a.metric}|${a.from_month}|${a.to_month}`
    if (!groups.has(key)) {
      groups.set(key, { metric: a.metric, from_month: a.from_month, to_month: a.to_month, 증가: [], 감소: [] })
    }
    groups.get(key)[a.direction].push({ dealer: a.member, change_pct: a.change_pct })
  }

  return [...groups.values()]
    .map((g) => {
      const moved = g.증가.length + g.감소.length
      const dominant = g.감소.length >= g.증가.length ? '감소' : '증가'
      const sameWay = dominant === '감소' ? g.감소.length : g.증가.length
      return {
        kind: 'dealer_spread',
        metric: g.metric,
        from_month: g.from_month,
        to_month: g.to_month,
        moved_dealers: moved,
        total_dealers: dealerCount,
        dominant_direction: dominant,
        same_direction_count: sameWay,
        // 여러 딜러가 같은 방향이면 전사 패턴, 한두 곳이면 개별 이슈.
        pattern: sameWay >= 3 ? '전사 패턴 가능성' : '개별 딜러 이슈 가능성',
        dealers: [...g.감소, ...g.증가]
          .sort((x, y) => Math.abs(y.change_pct) - Math.abs(x.change_pct))
          .slice(0, 8),
      }
    })
    .sort((a, b) => b.same_direction_count - a.same_direction_count)
}

/**
 * 데이터 손실(집계 제외·채널 귀속 실패)이 임계치를 넘었는지 본다.
 *
 * 이건 "실적 변화"가 아니라 **파이프라인 건강 상태**다. 그래도 같은 목록에 올린다 —
 * 따로 두면 아무도 안 본다. 손실이 커지면 그 위에서 계산한 모든 증감률이 흔들린다.
 */
export function detectDataLoss({ excluded = null, testDriveUnattributed = null, metricUnattributed = [] }) {
  const out = []
  const check = (label, lost, base, detail) => {
    if (!base || !lost) return
    const ratio = (lost / base) * 100
    if (ratio < THRESHOLDS.data_loss_pct) return
    out.push({
      kind: 'data_loss',
      metric: label,
      lost_count: lost,
      base_count: base,
      loss_pct: round1(ratio),
      threshold_pct: THRESHOLDS.data_loss_pct,
      detail,
      small_sample: false,
      note: '이 비율 위에서 계산한 증감률은 그만큼 신뢰도가 떨어집니다.',
    })
  }

  if (excluded) {
    check('활동 집계 제외', excluded.total, excluded.source_rows,
      `활동유형 미등록 ${excluded.no_activity_type ?? 0}건 · 조직 미매핑 ${excluded.no_organization ?? 0}건`)
  }
  if (testDriveUnattributed) {
    check('시승 채널 귀속 실패', testDriveUnattributed.count, testDriveUnattributed.total,
      '원래 기회를 만든 활동을 찾지 못해 채널을 정하지 못한 시승')
  }
  // 기회·계약처럼 나중에 붙는 지표도 같은 잣대로 본다. 2026-08-11 실측에서 계약의 약 19%가
  // lead_key 없이 들어오는 게 여기서 잡혔다 — 채널별 차트가 전체의 80%만 그리고 있다는 뜻이라,
  // 이걸 안 띄우면 채널 비중을 100% 기준으로 잘못 읽는다.
  for (const m of metricUnattributed) {
    check(`${m.metric} 채널 귀속 실패`, m.count, m.total, m.detail)
  }
  return out
}

/**
 * 집계 결과 묶음에서 이상현상을 모은다.
 *
 * @param {object} input
 * @param {object} input.monthly    {지표: {'YYYY-MM': number}} — 전체 월별
 * @param {object} [input.byChannel] {지표: {채널: {'YYYY-MM': number}}}
 * @param {object} [input.byDealer]  {지표: {딜러: {'YYYY-MM': number}}} — 원칙 3의 딜러 축
 * @param {object} [input.partial]  {지표: {yearMonth, primary}} — 부분월 예상 최종치
 * @param {object} [input.dataLoss] {excluded, testDriveUnattributed}
 * @param {number} [input.limit]    상위 몇 건만 (AI에 넘길 양을 제한)
 */
export function detectAnomalies({
  monthly = {}, byChannel = {}, byDealer = {}, partial = {}, dataLoss = null, limit = 20,
  stages = DEFAULT_STAGES,
}) {
  const found = []

  const skipped = new Set()
  for (const [metric, series] of Object.entries(monthly)) {
    found.push(...detectMonthOverMonth({ metric, series, partial: partial[metric] }))

    // 축 단위에는 예상 최종치가 없다 → 부분월을 비교에서 뺀다(위 skipMonth 주석 참고).
    const skipMonth = partial[metric]?.yearMonth ?? null
    if (skipMonth) skipped.add(skipMonth)

    for (const [member, memberSeries] of Object.entries(byChannel[metric] || {})) {
      found.push(...detectMonthOverMonth({ metric, series: memberSeries, dimension: 'channel', member, skipMonth }))
    }
    // 원칙 3: 특정 딜러 이슈인지 전사 패턴인지 가리려면 딜러 축이 있어야 한다.
    for (const [member, memberSeries] of Object.entries(byDealer[metric] || {})) {
      found.push(...detectMonthOverMonth({ metric, series: memberSeries, dimension: 'dealer', member, skipMonth }))
    }
  }

  if (dataLoss) found.push(...detectDataLoss(dataLoss))

  for (const [from, to] of stages) {
    if (monthly[from] && monthly[to]) {
      found.push(...detectRateChange({ from, to, fromSeries: monthly[from], toSeries: monthly[to] }))
    }
  }

  const ranked = rank(found)
  const dealerCount = new Set(Object.values(byDealer).flatMap((m) => Object.keys(m))).size || null
  return {
    thresholds: THRESHOLDS,
    total: ranked.length,
    small_sample_count: ranked.filter((a) => a.small_sample).length,
    data_loss_count: ranked.filter((a) => a.kind === 'data_loss').length,
    // 축 단위에서 비교하지 않은 달. AI와 화면이 "왜 8월 딜러별이 없나"를 알 수 있어야 한다.
    axis_partial_month_skipped: [...skipped],
    anomalies: ranked.slice(0, limit),
    // 딜러 낱개는 잘려도, "몇 곳이 같이 움직였나"는 전부 남긴다 — 원칙 3의 판단 근거다.
    dealer_spread: summarizeDealerSpread(found, dealerCount),
    truncated: ranked.length > limit,
  }
}
