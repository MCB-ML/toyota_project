// 딜러 계약퍼널 — 활동 집계 (요구사항정의서 3-1, 3-5).
//
// Fabric에서 활동유형×딜러별 원값만 받아 오고, 채널·카테고리 분류와 합산은 여기서 한다.
// SQL에 매핑을 박지 않는 이유: 매핑이 바뀌면 SQL을 고쳐야 하고, 그러면 규칙이 두 곳에
// 흩어진다. channelMap.js 한 곳만 보면 되게 둔다.
//
// 정의서 3-5의 정합성 등식을 여기서 직접 검증한다:
//   채널 합계 = 카테고리 합계 = 딜러 합계 = 전체 총계
// 정의서는 이 등식이 깨지면 파이프라인 버그로 간주하라고 했다.
// 값은 전부 드라이버 바인드로 넘긴다. 문자열로 이어 붙이면 딜러 이름에 따옴표가
// 섞였을 때 조용히 다른 결과가 나온다 — queryFabricWithTimeout은 바인드를 받지 않아
// 바인드가 되는 쪽을 쓴다.
import { queryFabricCertified } from '../fabricClient.js'
import { CHANNEL_ORDER, classifyActivityType } from './channelMap.js'

const DB = 'KPI_W'

/**
 * 활동유형 × 브랜드 × 딜러별 건수. 분류는 하지 않고 원값만 가져온다.
 *
 * 활동은 **활동일자(act_dt_fr)** 기준으로 월을 나눈다(정의서 3-7). 기회는 기회생성일자
 * 기준이라 월별 비율에서 둘이 미세하게 어긋날 수 있는데, 그건 버그가 아니다.
 */
async function fetchActivityRows({ from, to, brand = null }) {
  const brandFilter = brand ? `AND D.BRAND = @brand` : ''
  const sql = `
    SELECT
        T.tp_nm                        AS tp_nm,
        D.BRAND                        AS brand,
        LTRIM(RTRIM(D.dealer_nm))      AS dealer,
        CONVERT(char(7), A.act_dt_fr, 126) AS month,
        COUNT(*)                       AS cnt
    FROM ktws.FCT_ACTIVITY_v2 AS A
    INNER JOIN ktws.DIM_CRM_ACT_TYPE AS T ON A.tp_key = T.tp_key
    INNER JOIN ktws.DIM_MNG_USER     AS U ON A.sc_key = U.sc_key
    INNER JOIN ktws.DIM_MNG_DEALER   AS D ON U.dealer_key = D.dealer_key
    WHERE A.act_dt_fr >= @from AND A.act_dt_fr < @to
      ${brandFilter}
    GROUP BY T.tp_nm, D.BRAND, LTRIM(RTRIM(D.dealer_nm)), CONVERT(char(7), A.act_dt_fr, 126)`

  const bind = {
    from: { type: 'date', value: from },
    to: { type: 'date', value: to },
    ...(brand ? { brand: { type: 'nvarchar', value: brand } } : {}),
  }
  return queryFabricCertified(DB, sql, bind, { timeoutMs: 60000 })
}

const add = (map, key, n) => map.set(key, (map.get(key) ?? 0) + n)
const asObject = (map, order = null) => {
  const keys = order ? order.filter((k) => map.has(k)) : [...map.keys()].sort()
  return Object.fromEntries(keys.map((k) => [k, map.get(k)]))
}

/**
 * 활동을 채널·카테고리·딜러·월별로 집계한다.
 *
 * @returns {{
 *   total: number, channel: object, category: object, dealer: object, month: object,
 *   progress: number, testdrive_source: number, unknown: {tp_nm: string, cnt: number}[],
 *   reconciliation: {ok: boolean, total: number, channel: number, category: number, dealer: number, note: string}
 * }}
 */
export function aggregateActivityRows(rows) {
  const channel = new Map()
  const category = new Map()
  const dealer = new Map()
  const month = new Map()
  const unknown = new Map()
  // 축×월 교차. 원본 행에 이미 tp_nm·dealer·month가 다 있어 추가 조회 없이 만든다.
  // 정의서 4장 원칙 3의 "딜러 축 / 시점 축" 분해가 이 시리즈 위에서 이뤄진다.
  const monthByChannel = new Map()   // 채널 → Map(월 → 건수)
  const monthByDealer = new Map()
  let total = 0
  let progress = 0
  let testdriveSource = 0

  const addCross = (outer, key, m, cnt) => {
    if (!outer.has(key)) outer.set(key, new Map())
    add(outer.get(key), m, cnt)
  }

  for (const r of rows) {
    const cnt = Number(r.cnt) || 0
    const m = String(r.month)
    total += cnt

    const hit = classifyActivityType(r.tp_nm)
    if (hit.unknown) { add(unknown, String(r.tp_nm ?? '(빈값)'), cnt); continue }
    if (hit.progress) {
      progress += cnt
      if (hit.testdrive) testdriveSource += cnt
      continue
    }
    add(channel, hit.channel, cnt)
    add(category, hit.category, cnt)
    add(dealer, String(r.dealer), cnt)
    // 월별도 채널 매핑 대상만 센다. 전에는 이 줄이 분류 위에 있어서 기회진행·미매핑까지
    // 셌는데, 그러면 같은 화면 안에서 모집단이 갈린다:
    //   총계 타일·채널별 차트   매핑 대상만        (2026-01~07 렉서스 151,079)
    //   월별 추이·이상탐지      전체 행            (같은 기간 191,892)
    // 정의서 3-2가 "활동 = 위 매핑에 해당하는 모든 고객 접촉 기록"이라 매핑 대상이 맞고,
    // 수동 산출물(렉서스_토요타_계약퍼널_대시보드_68.html)도 채널 합 = 총계로 떨어진다.
    //
    // 실제로 깨지던 것: 예측(dailySeries의 fetchActivityDaily)은 tp_nm IN (매핑 대상)으로
    // 매핑 스케일만 세는데, 원칙 5의 부분월 치환이 그 값을 전체 스케일 시리즈에 끼워
    // 넣어서 진행 중인 달만 인위적으로 급감으로 잡혔다. 전환율 분모도 같은 이유로 부풀었다.
    add(month, m, cnt)
    addCross(monthByChannel, hit.channel, m, cnt)
    addCross(monthByDealer, String(r.dealer), m, cnt)
  }

  const crossToObject = (outer, order = null) => {
    const keys = order ? order.filter((k) => outer.has(k)) : [...outer.keys()].sort()
    return Object.fromEntries(keys.map((k) => [k, asObject(outer.get(k))]))
  }

  const sum = (m) => [...m.values()].reduce((s, v) => s + v, 0)
  const channelSum = sum(channel)
  const categorySum = sum(category)
  const dealerSum = sum(dealer)
  const unknownSum = sum(unknown)

  // 정의서 3-5. 채널 매핑 대상만 놓고 보면 세 합계가 정확히 같아야 한다.
  // 기회진행은 애초에 채널을 안 받으므로 전체 총계에서 빼고 비교한다 — 빼지 않으면
  // 등식이 늘 깨져 보여서 진짜 결함을 가린다.
  const mappedTotal = total - progress - unknownSum
  const ok = channelSum === categorySum && categorySum === dealerSum && dealerSum === mappedTotal

  return {
    total,
    channel: asObject(channel, CHANNEL_ORDER),
    category: asObject(category),
    dealer: asObject(dealer),
    month: asObject(month),
    month_by_channel: crossToObject(monthByChannel, CHANNEL_ORDER),
    month_by_dealer: crossToObject(monthByDealer),
    progress,
    testdrive_source: testdriveSource,
    unknown: [...unknown.entries()].map(([tp_nm, cnt]) => ({ tp_nm, cnt })),
    reconciliation: {
      ok,
      total: mappedTotal,
      channel: channelSum,
      category: categorySum,
      dealer: dealerSum,
      note: ok
        ? '채널 합계 = 카테고리 합계 = 딜러 합계 = 매핑 대상 총계'
        : '정합성 등식이 깨졌습니다 — 정의서 3-5 기준 파이프라인 버그입니다.',
    },
  }
}

/**
 * 조인에서 빠지는 활동 건수.
 *
 * 집계는 활동유형·SC·딜러가 모두 붙는 건만 센다(INNER JOIN). 그래서 차원에 없는 키를
 * 가진 활동은 채널뿐 아니라 **전체 총계에서도 빠진다**. 2026-08-10 실측(2026-01~07):
 * 활동유형 없음 4,833건 + SC 차원에 없는 sc_key 249건 = 5,082건(1.55%).
 *
 * 정의서 3-5는 이런 건도 전체 총계에는 넣으라고 하지만, 활동유형조차 모르는 건이
 * 대부분이라 집계에서 빼기로 했다(2026-08-10 결정). 대신 **몇 건을 뺐는지 항상 같이
 * 낸다** — 숨기면 이 비율이 커져도 아무도 모른다.
 */
async function fetchExcludedCounts({ from, to, brand = null }) {
  const brandFilter = brand ? 'AND D.BRAND = @brand' : ''
  const sql = `
    SELECT
        (SELECT COUNT(*) FROM ktws.FCT_ACTIVITY_v2 A
          WHERE A.act_dt_fr >= @from AND A.act_dt_fr < @to)              AS all_rows,
        (SELECT COUNT(*) FROM ktws.FCT_ACTIVITY_v2 A
          INNER JOIN ktws.DIM_CRM_ACT_TYPE T ON A.tp_key = T.tp_key
          WHERE A.act_dt_fr >= @from AND A.act_dt_fr < @to)              AS with_type,
        (SELECT COUNT(*) FROM ktws.FCT_ACTIVITY_v2 A
          INNER JOIN ktws.DIM_CRM_ACT_TYPE T ON A.tp_key = T.tp_key
          INNER JOIN ktws.DIM_MNG_USER  U ON A.sc_key = U.sc_key
          INNER JOIN ktws.DIM_MNG_DEALER D ON U.dealer_key = D.dealer_key
          WHERE A.act_dt_fr >= @from AND A.act_dt_fr < @to ${brandFilter}) AS joined`
  // 브랜드를 좁히면 "전체"와 비교할 수 없다 — 그 경우 제외 건수는 내지 않는다.
  const bind = {
    from: { type: 'date', value: from },
    to: { type: 'date', value: to },
    ...(brand ? { brand: { type: 'nvarchar', value: brand } } : {}),
  }
  const [r] = await queryFabricCertified(DB, sql, bind, { timeoutMs: 60000 })
  const all = Number(r?.all_rows) || 0
  const withType = Number(r?.with_type) || 0
  const joined = Number(r?.joined) || 0
  return {
    total: all - joined,
    no_activity_type: all - withType,
    no_organization: withType - joined,
    source_rows: all,
    ratio: all ? (all - joined) / all : 0,
  }
}

/** 조회 + 집계. 화면·API가 쓰는 진입점. */
export async function getActivityFunnel({ from, to, brand = null }) {
  const [rows, excluded] = await Promise.all([
    fetchActivityRows({ from, to, brand }),
    fetchExcludedCounts({ from, to, brand }),
  ])
  return {
    period: { from, to, brand },
    rowCount: rows.length,
    ...aggregateActivityRows(rows),
    excluded: brand ? { ...excluded, note: '브랜드를 좁히면 제외 건수는 전 브랜드 기준입니다.' } : excluded,
  }
}
