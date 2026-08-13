// 딜러 계약퍼널 — 시승 파이프라인 (요구사항정의서 3-4).
//
// 시승은 활동 집계와 **별도 로직**이다. 활동처럼 그냥 세면 안 된다:
//
//   ① 원본        활동유형 = '기회진행-시승결과'
//   ② 시승취소 제외  활동결과 = '시승취소' 인 행 제외
//   ③ 중복제거     기회번호(lead_key)가 같으면 1건만 인정 — 한 기회가 여러 번 시승한 경우
//   ④ 채널·모델 귀속 기회번호로 원래 기회 행과 연결해 채널을 부여
//
// 2026-08-10 실측(2026-01~07): 32,833 → 27,235 → 20,108. ③에서 26%가 줄어든다.
// 중복제거를 빼먹으면 시승이 35% 부풀려지고, 시승→계약 전환율이 그만큼 낮게 나온다.
import { queryFabricCertified } from '../fabricClient.js'
import { CHANNEL_ORDER, classifyActivityType } from './channelMap.js'

const DB = 'KPI_W'
const TESTDRIVE_TYPE = '기회진행-시승결과'
const CANCELLED = '시승취소'

/**
 * 중복제거된 시승 1건마다 한 행. 채널은 정의서 3-4 ④ 순서로 정한다.
 *
 *   1차  기회 행(FCT_LEAD)의 기회생성 활동유형 ca_act_tp — "기회번호로 원래 기회 행과 연결"
 *   2차  1차가 비면, 같은 기회의 채널 활동 중 가장 이른 것으로 보완
 *
 * 귀속 근거를 **기간으로 자르지 않는다** — 기회가 지난달에 생기고 시승이 이번 달에
 * 일어나는 경우가 정상이라, 같은 기간으로 좁히면 그런 시승이 채널 미상이 된다.
 *
 * ── tp_cd 로 조인하면 안 된다 (중요) ──────────────────────────────
 * DIM_CRM_ACT_TYPE 은 82행인데 tp_cd 는 39종뿐이다(브랜드·이력이 갈려 P120은 6행).
 * ca_act_tp 를 tp_cd 에 그대로 조인하면 시승 1건이 최대 6건으로 불어난다 —
 * 2026-08-10 실측: 귀속 실패 1,109건이 5,802건으로 찍혔다. tp_cd 하나에 tp_nm 은
 * 한 종류뿐이므로, 이름만 중복 없이 뽑아 쓴다.
 * ──────────────────────────────────────────────────────────
 */
async function fetchTestDriveRows({ from, to, brand = null }) {
  const brandFilter = brand ? 'AND D.BRAND = @brand' : ''
  const sql = `
    WITH type_by_cd AS (
        -- tp_cd → tp_nm. tp_cd가 중복이라 반드시 접어서 쓴다(위 주석).
        SELECT  CAST(tp_cd AS nvarchar(60)) AS tp_cd, MIN(tp_nm) AS tp_nm
        FROM    ktws.DIM_CRM_ACT_TYPE
        GROUP BY CAST(tp_cd AS nvarchar(60))
    ),
    td AS (
        -- ①② 시승결과에서 시승취소를 뺀 뒤, ③ 기회번호마다 가장 이른 1건만 남긴다.
        SELECT  A.lead_key,
                A.act_dt_fr,
                A.sc_key,
                ROW_NUMBER() OVER (PARTITION BY A.lead_key ORDER BY A.act_dt_fr, A.act_pk) AS rn
        FROM    ktws.FCT_ACTIVITY_v2  AS A
        INNER JOIN ktws.DIM_CRM_ACT_TYPE AS T ON A.tp_key = T.tp_key
        WHERE   T.tp_nm = @td_type
          AND   (A.act_result IS NULL OR A.act_result <> @cancelled)
          AND   A.act_dt_fr >= @from AND A.act_dt_fr < @to
          AND   A.lead_key IS NOT NULL
    ),
    origin AS (
        -- 2차 보완. 같은 기회의 활동 중 시승결과가 아닌 가장 이른 것.
        SELECT  A.lead_key,
                T.tp_nm,
                ROW_NUMBER() OVER (PARTITION BY A.lead_key ORDER BY A.act_dt_fr, A.act_pk) AS rn
        FROM    ktws.FCT_ACTIVITY_v2  AS A
        INNER JOIN ktws.DIM_CRM_ACT_TYPE AS T ON A.tp_key = T.tp_key
        WHERE   T.tp_nm <> @td_type
          AND   A.lead_key IS NOT NULL
    )
    SELECT  COALESCE(C.tp_nm, O.tp_nm)       AS origin_tp_nm,
            CASE WHEN C.tp_nm IS NOT NULL THEN '기회행' ELSE '활동보완' END AS origin_source,
            D.BRAND                          AS brand,
            LTRIM(RTRIM(D.dealer_nm))        AS dealer,
            CONVERT(char(7), td.act_dt_fr, 126) AS month,
            COUNT(*)                         AS cnt
    FROM    td
    INNER JOIN ktws.DIM_MNG_USER   AS U ON td.sc_key = U.sc_key
    INNER JOIN ktws.DIM_MNG_DEALER AS D ON U.dealer_key = D.dealer_key
    LEFT  JOIN ktws.FCT_LEAD       AS L ON td.lead_key = L.lead_key
    LEFT  JOIN type_by_cd          AS C ON CAST(L.ca_act_tp AS nvarchar(60)) = C.tp_cd
    LEFT  JOIN origin              AS O ON td.lead_key = O.lead_key AND O.rn = 1
    WHERE   td.rn = 1
      ${brandFilter}
    GROUP BY COALESCE(C.tp_nm, O.tp_nm),
             CASE WHEN C.tp_nm IS NOT NULL THEN '기회행' ELSE '활동보완' END,
             D.BRAND, LTRIM(RTRIM(D.dealer_nm)), CONVERT(char(7), td.act_dt_fr, 126)`

  const bind = {
    from: { type: 'date', value: from },
    to: { type: 'date', value: to },
    td_type: { type: 'nvarchar', value: TESTDRIVE_TYPE },
    cancelled: { type: 'nvarchar', value: CANCELLED },
    ...(brand ? { brand: { type: 'nvarchar', value: brand } } : {}),
  }
  return queryFabricCertified(DB, sql, bind, { timeoutMs: 90000 })
}

/** 파이프라인 단계별 건수. 중복제거가 실제로 얼마나 줄이는지 화면에 보여주기 위한 값. */
async function fetchPipelineStages({ from, to }) {
  const sql = `
    SELECT
      COUNT(*)                                                            AS raw_rows,
      SUM(CASE WHEN A.act_result = @cancelled THEN 0 ELSE 1 END)          AS after_cancel,
      COUNT(DISTINCT CASE WHEN A.act_result = @cancelled THEN NULL ELSE A.lead_key END) AS after_dedup
    FROM ktws.FCT_ACTIVITY_v2 AS A
    INNER JOIN ktws.DIM_CRM_ACT_TYPE AS T ON A.tp_key = T.tp_key
    WHERE T.tp_nm = @td_type AND A.act_dt_fr >= @from AND A.act_dt_fr < @to`
  const bind = {
    from: { type: 'date', value: from },
    to: { type: 'date', value: to },
    td_type: { type: 'nvarchar', value: TESTDRIVE_TYPE },
    cancelled: { type: 'nvarchar', value: CANCELLED },
  }
  const [r] = await queryFabricCertified(DB, sql, bind, { timeoutMs: 60000 })
  const raw = Number(r?.raw_rows) || 0
  const afterCancel = Number(r?.after_cancel) || 0
  const afterDedup = Number(r?.after_dedup) || 0
  return {
    raw,
    after_cancel: afterCancel,
    after_dedup: afterDedup,
    cancelled: raw - afterCancel,
    deduped: afterCancel - afterDedup,
  }
}

const add = (map, key, n) => map.set(key, (map.get(key) ?? 0) + n)
const asObject = (map, order = null) => {
  const keys = order ? order.filter((k) => map.has(k)) : [...map.keys()].sort()
  return Object.fromEntries(keys.map((k) => [k, map.get(k)]))
}

/**
 * 중복제거된 시승을 채널·딜러·월별로 집계한다.
 *
 * 귀속 실패(원래 기회를 만든 활동이 기회진행 유형뿐이거나 아예 없는 경우)는 채널을
 * 임의로 주지 않고 unattributed 로 따로 센다 — 정의서 3-5의 정합성 등식과 같은 취지다.
 */
export function aggregateTestDriveRows(rows) {
  const channel = new Map()
  const dealer = new Map()
  const month = new Map()
  const source = new Map()   // 채널을 무엇으로 정했는지 — 기회행 / 활동보완
  const monthByChannel = new Map()
  const monthByDealer = new Map()
  let total = 0
  let unattributed = 0

  const addCross = (outer, key, m, cnt) => {
    if (!outer.has(key)) outer.set(key, new Map())
    add(outer.get(key), m, cnt)
  }

  for (const r of rows) {
    const cnt = Number(r.cnt) || 0
    const m = String(r.month)
    total += cnt
    add(dealer, String(r.dealer), cnt)
    add(month, m, cnt)
    addCross(monthByDealer, String(r.dealer), m, cnt)

    const hit = classifyActivityType(r.origin_tp_nm)
    if (hit.channel) {
      add(channel, hit.channel, cnt)
      add(source, String(r.origin_source ?? '기회행'), cnt)
      addCross(monthByChannel, hit.channel, m, cnt)
    } else unattributed += cnt
  }

  const crossToObject = (outer, order = null) => {
    const keys = order ? order.filter((k) => outer.has(k)) : [...outer.keys()].sort()
    return Object.fromEntries(keys.map((k) => [k, asObject(outer.get(k))]))
  }

  const channelSum = [...channel.values()].reduce((s, v) => s + v, 0)
  const dealerSum = [...dealer.values()].reduce((s, v) => s + v, 0)
  return {
    total,
    channel: asObject(channel, CHANNEL_ORDER),
    dealer: asObject(dealer),
    month: asObject(month),
    month_by_channel: crossToObject(monthByChannel, CHANNEL_ORDER),
    month_by_dealer: crossToObject(monthByDealer),
    // 정의서 3-4 ④의 1차(기회행)와 2차(활동보완)가 각각 몇 건인지. 보완 비중이 커지면
    // 기회 행의 ca_act_tp가 비고 있다는 뜻이라 원천 데이터를 봐야 한다.
    attribution_source: asObject(source),
    unattributed,
    reconciliation: {
      ok: channelSum + unattributed === total && dealerSum === total,
      total,
      channel: channelSum,
      dealer: dealerSum,
      unattributed,
      note: '채널 합계 + 귀속실패 = 시승 총계, 딜러 합계 = 시승 총계',
    },
  }
}

/** 조회 + 집계. 화면·API가 쓰는 진입점. */
export async function getTestDriveFunnel({ from, to, brand = null }) {
  const [rows, stages] = await Promise.all([
    fetchTestDriveRows({ from, to, brand }),
    fetchPipelineStages({ from, to }),
  ])
  return { period: { from, to, brand }, stages, ...aggregateTestDriveRows(rows) }
}
