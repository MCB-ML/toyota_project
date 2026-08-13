// 딜러 계약퍼널 — 일별 실적 조회 + 부분월 예측 연결 (요구사항정의서 3-6).
//
// 예측 계산 자체는 forecast.js(순수 함수)가 한다. 여기서는 Fabric에서 일별 건수만
// 가져와 넘긴다 — 계산을 SQL에 박으면 검증할 수 없다.
import { queryFabricCertified } from '../fabricClient.js'
import { forecastLatestMonth } from './forecast.js'
import { CHANNEL_MAP } from './channelMap.js'

const DB = 'KPI_W'
const TESTDRIVE_TYPE = '기회진행-시승결과'
const CANCELLED = '시승취소'

/** 채널 매핑 대상 활동유형을 SQL IN 목록으로. 매핑이 바뀌면 여기도 따라간다. */
const CHANNEL_TYPES = Object.keys(CHANNEL_MAP)

const dayKey = (v) => {
  if (v instanceof Date) return v.toISOString().slice(0, 10)
  return String(v).slice(0, 10)
}

/** {'YYYY-MM': {'YYYY-MM-DD': n}} 로 접는다. */
function byMonth(rows) {
  const out = {}
  for (const r of rows) {
    const day = dayKey(r.day)
    const month = day.slice(0, 7)
    out[month] = out[month] || {}
    out[month][day] = (out[month][day] ?? 0) + (Number(r.cnt) || 0)
  }
  return out
}

/**
 * 활동 일별 건수. 채널 매핑 대상만 센다 — 기회진행까지 넣으면 "활동" 정의가 달라진다.
 */
async function fetchActivityDaily({ from, to, brand = null }) {
  const inList = CHANNEL_TYPES.map((_, i) => `@t${i}`).join(', ')
  const sql = `
    SELECT CONVERT(char(10), A.act_dt_fr, 126) AS day, COUNT(*) AS cnt
    FROM   ktws.FCT_ACTIVITY_v2  AS A
    INNER JOIN ktws.DIM_CRM_ACT_TYPE AS T ON A.tp_key = T.tp_key
    INNER JOIN ktws.DIM_MNG_USER     AS U ON A.sc_key = U.sc_key
    INNER JOIN ktws.DIM_MNG_DEALER   AS D ON U.dealer_key = D.dealer_key
    WHERE  A.act_dt_fr >= @from AND A.act_dt_fr < @to
      AND  T.tp_nm IN (${inList})
      ${brand ? 'AND D.BRAND = @brand' : ''}
    GROUP BY CONVERT(char(10), A.act_dt_fr, 126)`
  const bind = {
    from: { type: 'date', value: from },
    to: { type: 'date', value: to },
    ...Object.fromEntries(CHANNEL_TYPES.map((t, i) => [`t${i}`, { type: 'nvarchar', value: t }])),
    ...(brand ? { brand: { type: 'nvarchar', value: brand } } : {}),
  }
  return queryFabricCertified(DB, sql, bind, { timeoutMs: 90000 })
}

/** 시승 일별 건수. 3-4 파이프라인(취소 제외 + 기회번호 중복제거)을 거친 값이다. */
async function fetchTestDriveDaily({ from, to, brand = null }) {
  const sql = `
    WITH td AS (
        SELECT A.lead_key, A.act_dt_fr, A.sc_key,
               ROW_NUMBER() OVER (PARTITION BY A.lead_key ORDER BY A.act_dt_fr, A.act_pk) AS rn
        FROM   ktws.FCT_ACTIVITY_v2 AS A
        INNER JOIN ktws.DIM_CRM_ACT_TYPE AS T ON A.tp_key = T.tp_key
        WHERE  T.tp_nm = @td_type
          AND  (A.act_result IS NULL OR A.act_result <> @cancelled)
          AND  A.act_dt_fr >= @from AND A.act_dt_fr < @to
          AND  A.lead_key IS NOT NULL
    )
    SELECT CONVERT(char(10), td.act_dt_fr, 126) AS day, COUNT(*) AS cnt
    FROM   td
    INNER JOIN ktws.DIM_MNG_USER   AS U ON td.sc_key = U.sc_key
    INNER JOIN ktws.DIM_MNG_DEALER AS D ON U.dealer_key = D.dealer_key
    WHERE  td.rn = 1
      ${brand ? 'AND D.BRAND = @brand' : ''}
    GROUP BY CONVERT(char(10), td.act_dt_fr, 126)`
  const bind = {
    from: { type: 'date', value: from },
    to: { type: 'date', value: to },
    td_type: { type: 'nvarchar', value: TESTDRIVE_TYPE },
    cancelled: { type: 'nvarchar', value: CANCELLED },
    ...(brand ? { brand: { type: 'nvarchar', value: brand } } : {}),
  }
  return queryFabricCertified(DB, sql, bind, { timeoutMs: 90000 })
}

/**
 * 기회 일별 건수. 기회생성일자(lead_reg_dt) 기준 — leadContract.js의 월별 집계와 같은 기준이다.
 *
 * 예측이 없으면 안 된다. 진행 중인 달을 예상 최종치로 환산하지 못하면 이상탐지가
 * 그 달을 전월과 그대로 맞대고 "급감"으로 잡는다(정의서 4장 원칙 5).
 */
async function fetchLeadDaily({ from, to, brand = null }) {
  const sql = `
    SELECT CONVERT(char(10), L.lead_reg_dt, 126) AS day, SUM(L.cnt) AS cnt
    FROM   ktws.FCT_LEAD           AS L
    INNER JOIN ktws.DIM_MNG_USER   AS U ON L.cl_sc_key = U.sc_key
    INNER JOIN ktws.DIM_MNG_DEALER AS D ON U.dealer_key = D.dealer_key
    WHERE  L.lead_reg_dt >= @from AND L.lead_reg_dt < @to
      ${brand ? 'AND D.BRAND = @brand' : ''}
    GROUP BY CONVERT(char(10), L.lead_reg_dt, 126)`
  const bind = {
    from: { type: 'date', value: from },
    to: { type: 'date', value: to },
    ...(brand ? { brand: { type: 'nvarchar', value: brand } } : {}),
  }
  return queryFabricCertified(DB, sql, bind, { timeoutMs: 90000 })
}

/** 계약 일별 건수. **Gross** — 취소·반려 포함(정의서 3-2). */
async function fetchContractDaily({ from, to, brand = null }) {
  const sql = `
    SELECT CONVERT(char(10), C.contract_dt, 126) AS day, SUM(C.cnt) AS cnt
    FROM   ktws.FCT_CONTRACT_KTWS AS C
    INNER JOIN ktws.DIM_MNG_USER   AS U ON C.cn_sc_key = U.sc_key
    INNER JOIN ktws.DIM_MNG_DEALER AS D ON U.dealer_key = D.dealer_key
    WHERE  C.contract_dt >= @from AND C.contract_dt < @to
      ${brand ? 'AND D.BRAND = @brand' : ''}
    GROUP BY CONVERT(char(10), C.contract_dt, 126)`
  const bind = {
    from: { type: 'date', value: from },
    to: { type: 'date', value: to },
    ...(brand ? { brand: { type: 'nvarchar', value: brand } } : {}),
  }
  return queryFabricCertified(DB, sql, bind, { timeoutMs: 90000 })
}

/** 데이터가 있는 마지막 날. 기준일(asOf)을 데이터에서 정한다 — 오늘로 잡으면 아직 안 들어온 날까지 분모에 들어간다. */
function lastDayWithData(dailyByMonth) {
  const days = Object.values(dailyByMonth).flatMap((m) => Object.keys(m))
  return days.length ? days.sort().at(-1) : null
}

/**
 * 활동·시승·계약 각각의 일별 시리즈와 마지막 달 예측.
 *
 * asOf는 **세 지표에서 가장 이른 마지막 날**로 맞춘다. 지표마다 데이터가 들어오는 시점이
 * 달라서 각자 기준일을 쓰면, 어떤 지표는 더 긴 기간을 두고 예측해 서로 비교가 안 된다.
 */
export async function getForecast({ from, to, brand = null, lookback = 3 }) {
  const [activity, lead, testdrive, contract] = await Promise.all([
    fetchActivityDaily({ from, to, brand }),
    fetchLeadDaily({ from, to, brand }),
    fetchTestDriveDaily({ from, to, brand }),
    fetchContractDaily({ from, to, brand }),
  ])

  // 순서는 퍼널 순서(metricRegistry.METRIC_CATALOG)를 따른다 — 예측 표의 행 순서가 된다.
  const series = {
    활동: byMonth(activity),
    기회: byMonth(lead),
    시승: byMonth(testdrive),
    계약: byMonth(contract),
  }

  const lastDays = Object.values(series).map(lastDayWithData).filter(Boolean)
  const asOf = lastDays.length ? lastDays.sort()[0] : null
  if (!asOf) return { period: { from, to, brand }, as_of: null, forecast: {}, note: '기간에 데이터가 없습니다.' }

  const forecast = {}
  for (const [name, dailyByMonth] of Object.entries(series)) {
    forecast[name] = forecastLatestMonth(dailyByMonth, asOf, lookback)
  }
  return {
    period: { from, to, brand },
    as_of: asOf,
    lookback_months: lookback,
    forecast,
    note: '① 평일·주말 페이스가 대표값입니다(정의서 3-6). 부분월은 이 값으로 환산한 뒤에만 전월과 비교하세요.',
  }
}
