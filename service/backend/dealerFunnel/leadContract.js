// 딜러 계약퍼널 — 기회·계약 집계 (요구사항정의서 3-2).
//
// 퍼널은 활동→기회→시승→계약인데 지금까지 코드가 만든 시리즈는 활동·시승 둘뿐이었다.
// 기회는 아예 조회하지 않았고(FCT_LEAD는 시승 채널 귀속용 조인으로만 쓰였다),
// 계약은 일별 예측(dailySeries.js)에서만 뽑혀 월별 추이·채널별 구성·이상탐지에
// 들어가지 못했다. 지표 정의 표에는 넷 다 적혀 있는데 그림에는 둘만 있었다.
//
// ── 채널 귀속 기준 ──────────────────────────────────────────────
// 기회·계약 모두 **기회 행의 기회생성 활동유형(FCT_LEAD.ca_act_tp)** 하나로 정한다.
// 기회는 그 값이 자기 행에 있고, 계약은 lead_key로 기회 행에 연결해 가져온다.
// 둘의 채널 분해를 같은 근거 위에 올려야 기회→계약 전환율을 채널별로 볼 수 있다.
//
// 시승(testDrive.js)은 여기에 2차 보완(같은 기회의 활동으로 채우기)이 하나 더 붙는데,
// 그건 정의서 3-4 ④가 시승에 대해서만 규정한 절차다. 여기 임의로 옮겨오지 않는다.
//
// 귀속에 실패한 건은 채널에 넣지 않고 따로 센다 — 임의 배정하면 채널 합계가 조용히
// 부풀려지고, 정합성 등식(3-5)이 깨진 걸 아무도 모른다.
// ──────────────────────────────────────────────────────────────
import { queryFabricCertified } from '../fabricClient.js'
import { CHANNEL_ORDER, classifyActivityType } from './channelMap.js'

const DB = 'KPI_W'

// tp_cd → tp_nm 을 반드시 접어서 쓴다. DIM_CRM_ACT_TYPE 은 82행인데 tp_cd 는 39종뿐이라
// (브랜드·이력이 갈린다) 그냥 조인하면 1건이 최대 6건으로 불어난다 — testDrive.js의
// 같은 주석 참고. 2026-08-10 실측에서 귀속 실패가 1,109 → 5,802로 찍혔던 버그다.
const TYPE_BY_CD = `
    type_by_cd AS (
        SELECT  CAST(tp_cd AS nvarchar(60)) AS tp_cd, MIN(tp_nm) AS tp_nm
        FROM    ktws.DIM_CRM_ACT_TYPE
        GROUP BY CAST(tp_cd AS nvarchar(60))
    )`

/**
 * 계약이 채널에 못 붙은 이유. 2026-08-11 실측(2026-01~08, 21,469건)에서 19.49%가
 * **계약에 lead_key 자체가 없는** 건이었다 — 조인 실패가 아니라 원천에 연결고리가 없다.
 * "귀속 실패 19%"로 뭉뚱그리면 매핑을 고쳐 줄일 수 있는 문제로 오해한다.
 */
const CONTRACT_ATTR_REASON = `
      CASE WHEN LC.tp_nm IS NOT NULL THEN NULL
           WHEN C.lead_key IS NULL   THEN '계약에 기회번호(lead_key)가 없음 — 기회를 거치지 않은 계약'
           WHEN LC.lead_key IS NULL  THEN '기회번호에 해당하는 기회 행을 찾지 못함'
           ELSE '기회 행에 기회생성 활동유형(ca_act_tp)이 없음' END`

const add = (map, key, n) => map.set(key, (map.get(key) ?? 0) + n)
const addCross = (outer, key, m, n) => {
  if (!outer.has(key)) outer.set(key, new Map())
  add(outer.get(key), m, n)
}
const asObject = (map, order = null) => {
  const keys = order ? order.filter((k) => map.has(k)) : [...map.keys()].sort()
  return Object.fromEntries(keys.map((k) => [k, map.get(k)]))
}
const crossAsObject = (outer, order = null) => {
  const keys = order ? order.filter((k) => outer.has(k)) : [...outer.keys()].sort()
  return Object.fromEntries(keys.map((k) => [k, asObject(outer.get(k))]))
}

/**
 * {tp_nm, dealer, month, cnt} 행을 채널·딜러·월 축으로 접는다.
 *
 * 활동(activityAggregate.js)과 달리 카테고리·기회진행 분해가 없다 — 기회·계약에는
 * 그 개념이 없다. 대신 귀속 실패를 반드시 드러낸다.
 *
 * @returns {{total, channel, dealer, month, month_by_channel, month_by_dealer,
 *            unattributed, unattributed_types, reconciliation}}
 */
export function aggregateAttributedRows(rows) {
  const channel = new Map()
  const dealer = new Map()
  const month = new Map()
  const monthByChannel = new Map()
  const monthByDealer = new Map()
  const unattributedTypes = new Map()
  let total = 0
  let unattributed = 0

  for (const r of rows) {
    const cnt = Number(r.cnt) || 0
    const m = String(r.month)
    const d = String(r.dealer ?? '').trim() || '(딜러 미상)'

    total += cnt
    add(month, m, cnt)
    add(dealer, d, cnt)
    addCross(monthByDealer, d, m, cnt)

    const hit = classifyActivityType(r.tp_nm)
    if (hit.channel) {
      add(channel, hit.channel, cnt)
      addCross(monthByChannel, hit.channel, m, cnt)
      continue
    }
    // 매핑에 없거나(기회진행 유형·신규 유형) 애초에 귀속할 근거가 없는 건.
    // 이유를 뭉뚱그리면 "채널 귀속 실패 19%"만 남아서 고칠 수 있는 문제인지 아닌지를 모른다 —
    // 매핑을 추가해 줄일 수 있는 건과 원천에 연결고리가 없어 못 줄이는 건은 다른 문제다.
    unattributed += cnt
    add(unattributedTypes, r.tp_nm ? String(r.tp_nm) : (r.attr_reason || '(활동유형 없음)'), cnt)
  }

  const channelSum = [...channel.values()].reduce((a, b) => a + b, 0)
  const dealerSum = [...dealer.values()].reduce((a, b) => a + b, 0)

  return {
    total,
    channel: asObject(channel, CHANNEL_ORDER),
    dealer: asObject(dealer),
    month: asObject(month),
    month_by_channel: crossAsObject(monthByChannel, CHANNEL_ORDER),
    month_by_dealer: crossAsObject(monthByDealer),
    unattributed,
    unattributed_types: asObject(unattributedTypes),
    reconciliation: {
      ok: channelSum + unattributed === total && dealerSum === total,
      total,
      channel: channelSum,
      unattributed,
      dealer: dealerSum,
      note: '채널 + 귀속실패 = 총계 = 딜러 합계 (정의서 3-5)',
    },
  }
}

/**
 * 기회 — FCT_LEAD, 기회생성일자(lead_reg_dt) 기준.
 *
 * 건수는 SUM(cnt)다. 테이블 정의상 cnt가 영업기회카운트이므로 COUNT(*)로 세면
 * 카운트가 1이 아닌 행에서 어긋난다.
 */
async function fetchLeadRows({ from, to, brand = null }) {
  const sql = `
    WITH ${TYPE_BY_CD}
    SELECT  T.tp_nm                              AS tp_nm,
            LTRIM(RTRIM(D.dealer_nm))            AS dealer,
            CONVERT(char(7), L.lead_reg_dt, 126) AS month,
            SUM(L.cnt)                           AS cnt
    FROM    ktws.FCT_LEAD          AS L
    INNER JOIN ktws.DIM_MNG_USER   AS U ON L.cl_sc_key = U.sc_key
    INNER JOIN ktws.DIM_MNG_DEALER AS D ON U.dealer_key = D.dealer_key
    LEFT  JOIN type_by_cd          AS T ON CAST(L.ca_act_tp AS nvarchar(60)) = T.tp_cd
    WHERE   L.lead_reg_dt >= @from AND L.lead_reg_dt < @to
      ${brand ? 'AND D.BRAND = @brand' : ''}
    GROUP BY T.tp_nm, LTRIM(RTRIM(D.dealer_nm)), CONVERT(char(7), L.lead_reg_dt, 126)`

  return queryFabricCertified(DB, sql, {
    from: { type: 'date', value: from },
    to: { type: 'date', value: to },
    ...(brand ? { brand: { type: 'nvarchar', value: brand } } : {}),
  }, { timeoutMs: 90000 })
}

/**
 * 계약 — FCT_CONTRACT_KTWS, 계약일자(contract_dt) 기준. **Gross**(취소·반려 포함, 3-2).
 *
 * 기회 행 조인을 lead_key 하나로 접은 CTE를 거친다. FCT_LEAD의 grain이 lead_key라
 * 원래는 1:1이지만, 중복이 하나라도 생기면 SUM(C.cnt)가 그 배수로 불어나고 계약 총계가
 * 조용히 틀린다 — 조인 전에 접어서 그 경로를 아예 막는다.
 */
async function fetchContractRows({ from, to, brand = null }) {
  const sql = `
    WITH ${TYPE_BY_CD},
    lead_channel AS (
        SELECT  L.lead_key, MIN(T.tp_nm) AS tp_nm
        FROM    ktws.FCT_LEAD AS L
        LEFT JOIN type_by_cd  AS T ON CAST(L.ca_act_tp AS nvarchar(60)) = T.tp_cd
        GROUP BY L.lead_key
    )
    SELECT  LC.tp_nm                              AS tp_nm,
            ${CONTRACT_ATTR_REASON}               AS attr_reason,
            LTRIM(RTRIM(D.dealer_nm))             AS dealer,
            CONVERT(char(7), C.contract_dt, 126)  AS month,
            SUM(C.cnt)                            AS cnt
    FROM    ktws.FCT_CONTRACT_KTWS AS C
    INNER JOIN ktws.DIM_MNG_USER   AS U ON C.cn_sc_key = U.sc_key
    INNER JOIN ktws.DIM_MNG_DEALER AS D ON U.dealer_key = D.dealer_key
    LEFT  JOIN lead_channel        AS LC ON C.lead_key = LC.lead_key
    WHERE   C.contract_dt >= @from AND C.contract_dt < @to
      ${brand ? 'AND D.BRAND = @brand' : ''}
    GROUP BY LC.tp_nm, ${CONTRACT_ATTR_REASON},
             LTRIM(RTRIM(D.dealer_nm)), CONVERT(char(7), C.contract_dt, 126)`

  return queryFabricCertified(DB, sql, {
    from: { type: 'date', value: from },
    to: { type: 'date', value: to },
    ...(brand ? { brand: { type: 'nvarchar', value: brand } } : {}),
  }, { timeoutMs: 90000 })
}

export async function getLeadFunnel({ from, to, brand = null }) {
  const rows = await fetchLeadRows({ from, to, brand })
  return { period: { from, to, brand }, ...aggregateAttributedRows(rows) }
}

export async function getContractFunnel({ from, to, brand = null }) {
  const rows = await fetchContractRows({ from, to, brand })
  return { period: { from, to, brand }, ...aggregateAttributedRows(rows) }
}
