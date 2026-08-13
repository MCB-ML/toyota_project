// 퍼널 지표(기회실적/계약실적) SQL 빌더 — GOLD "활동 퍼널 현황 통합 쿼리 v3"의
// lead_actual / cntrct_actual CTE 구조를 그대로 재현한다.
//
// 왜 별도 모듈인가: SQL을 만드는 부분만 순수 함수로 떼어내면 DB 없이 문자열을 단위
// 테스트할 수 있다. 이 두 지표는 조건 하나만 빠져도 값이 조용히 달라지는데(아래 참고)
// 라이브 조회로만 확인하려면 회귀를 잡을 방법이 없다.
//
// ── GOLD와 맞춘 핵심(예전 구현에 전부 빠져 있던 것들) ──────────────────────────
// 1) 월별 상대 기간: 자격 활동·리드 오픈 판정 기간이 조회 구간 전체가 아니라
//    "그 행이 속한 달의 월초~월말"이다. 예전엔 구간 전체를 하나의 창으로 써서,
//    월별로 쪼개면 1월 리드의 8월 활동이 1월에 잡혔다.
// 2) SC 상관: 리드를 담당한 SC와 활동을 남긴 SC(그리고 계약을 올린 SC)가 같아야 한다.
// 3) 활동유형 상관: 리드/활동/계약의 common_tp_nm이 서로 같아야 한다.
// 예전 구현은 "구간 전체의 자격 리드 풀"에 lead_key가 있기만 하면 카운트해서
// GOLD보다 값이 크게 나왔다.
//
// filters.yaml의 sql_fragment는 별칭 없는 기본 테이블명으로 쓰여 있는데, GOLD 구조에선
// DIM_CRM_ACT_TYPE이 바깥(리드/계약의 유형)과 안쪽(활동의 유형) 양쪽에 등장해 별칭이
// 필수다 — 등록된 규칙을 그대로 쓰되 테이블 한정자만 별칭으로 바꿔 끼운다(withAlias).
import { CompileError, timeGrainExpr } from './app/semantic/compiler.js'

const SCHEMA = 'ktws'

function withAlias(fragment, table, alias) {
  return fragment.split(`${table}.`).join(`${alias}.`)
}

function sqlLiteral(value) {
  return `N'${String(value).replace(/'/g, "''")}'`
}

// 이 컴파일러들이 실제로 JOIN해 두는 테이블만 dimension으로 허용한다. 지원 안 하는 축을
// 조용히 통과시키면 "잘못된 열 이름"이 나거나 엉뚱한 조인이 생기므로 명확히 거부한다.
// actTypeAlias: 이 쿼리에서 "그 행의 활동유형"을 담고 있는 별칭(리드=lct, 계약=ct).
function resolveFunnelDimension(dimDef, { anchorCol, actTypeAlias }) {
  if (!dimDef) return { expr: null, extraJoin: null }

  if (dimDef.derive_grain) {
    // 시간축은 캘린더 조인 없이 그 지표 자신의 앵커 날짜에서 파생한다 — 나머지 지표와
    // 같은 규칙(app/semantic/compiler.js의 TIME_GRAIN_SQL).
    return { expr: timeGrainExpr(dimDef.derive_grain, anchorCol), extraJoin: null }
  }

  const { table, column } = dimDef.column
  if (table === 'DIM_MNG_USER' || table === 'DIM_MNG_DEALER') {
    return { expr: `${table}.${column}`, extraJoin: null }
  }
  if (table === 'DIM_CRM_ACT_TYPE') {
    // 활동그룹/세부분류 — 이 쿼리에서 유형 테이블은 별칭으로 들어와 있다.
    return { expr: `${actTypeAlias}.${column}`, extraJoin: null }
  }
  if (table === 'DIM_CRM_ACT_TYPE_ORDER') {
    // 활동유형(common_tp_nm) — GOLD도 같은 방식으로 조인한다.
    return {
      expr: `DIM_CRM_ACT_TYPE_ORDER.${column}`,
      extraJoin: `INNER JOIN ${SCHEMA}.DIM_CRM_ACT_TYPE_ORDER ON ${actTypeAlias}.common_tp_nm = DIM_CRM_ACT_TYPE_ORDER.common_tp_nm`,
    }
  }
  throw new CompileError(
    `퍼널 지표는 '${dimDef.id}' 차원으로 분해할 수 없습니다(이 쿼리가 조인하지 않는 테이블: ${table}).`,
    'unsupported_funnel_dimension',
  )
}

// 사용자/딜러 스코프 + IR 필터 — GOLD의 elig_user에 해당. 두 빌더가 공유한다.
function buildScopeClauses(ir, registry) {
  const clauses = [
    registry.filters.get('br_exclude_front_sc').sql_fragment,
    registry.filters.get('br_exclude_staff_names').sql_fragment,
    registry.filters.get('br_exclude_test_users').sql_fragment,
    registry.filters.get('br_dealer_scope').sql_fragment,
  ]
  for (const f of ir.filters || []) {
    const dim = registry.dimensions.get(f.dimension)
    if (!dim) continue
    if (dim.derive_grain) continue // 시간 필터는 앵커 날짜 BETWEEN으로 이미 처리됨
    const { table, column } = dim.column
    // 스코프 절은 바깥 쿼리에 붙으므로 유형 테이블은 그 쿼리의 별칭을 써야 한다.
    const col = table === 'DIM_CRM_ACT_TYPE' ? null : `${table}.${column}`
    if (!col) continue
    clauses.push(`${col} IN (${f.values.map(sqlLiteral).join(', ')})`)
  }
  return clauses
}

// GOLD의 lead_actual CTE — 리드 등록월 기준, 오픈 판정·자격활동은 그 달 안에서.
export function buildLeadActualSql({ ir, metric, registry, startDate, endDate }) {
  const dimId = ir.dimensions?.[0] || null
  const dimDef = dimId ? registry.dimensions.get(dimId) : null
  const { expr: dimExpr, extraJoin } = resolveFunnelDimension(dimDef, {
    anchorCol: 'FCT_LEAD.lead_reg_dt',
    actTypeAlias: 'lct',
  })

  const monthStart = 'DATEFROMPARTS(YEAR(FCT_LEAD.lead_reg_dt), MONTH(FCT_LEAD.lead_reg_dt), 1)'
  const monthEnd = 'EOMONTH(FCT_LEAD.lead_reg_dt)'
  // br_qualified_lead_def의 @MonthEnd 자리표시자를 "그 리드가 속한 달의 말일"로 바인딩한다
  // (예전엔 조회 구간의 끝 날짜를 넣어서, 여러 달을 조회하면 판정 기준이 마지막 달로 쏠렸다).
  const qualifiedLeadDef = registry.filters.get('br_qualified_lead_def').sql_fragment.replace('@MonthEnd', monthEnd)

  const scopeClauses = buildScopeClauses(ir, registry)

  const qualifyingActivity = [
    `EXISTS (`,
    `    SELECT 1`,
    `    FROM ${SCHEMA}.FCT_ACTIVITY_v2`,
    `    INNER JOIN ${SCHEMA}.DIM_CRM_ACT_TYPE AS act ON FCT_ACTIVITY_v2.tp_key = act.tp_key`,
    `    WHERE FCT_ACTIVITY_v2.lead_key = FCT_LEAD.lead_key`,
    // SC 상관·활동유형 상관은 걸지 않는다 — Power BI 측정값에 없는 조건이라
    // 걸면 화면보다 적게 나온다(2026-04 재직 기준 SC 상관 −45, 유형 상관 −27).
    // 자세한 근거는 server/reports/contracts/activity_funnel_status.yaml의
    // deviations.pbi_measure_alignment 참고. 활동그룹·부재중은 PBI도 적용하므로 유지.
    `      AND ${withAlias(registry.filters.get('br_tp_grp_scope').sql_fragment, 'DIM_CRM_ACT_TYPE', 'act')}`,
    `      AND ${registry.filters.get('br_act_result_exclusion').sql_fragment}`,
    `      AND FCT_ACTIVITY_v2.act_dt_fr >= ${monthStart}`,
    `      AND FCT_ACTIVITY_v2.act_dt_fr <= ${monthEnd}`,
    `)`,
  ].join('\n')

  const whereClauses = [
    `FCT_LEAD.lead_reg_dt BETWEEN '${startDate}' AND '${endDate}'`,
    qualifiedLeadDef,
    qualifyingActivity,
    ...scopeClauses,
  ]

  return [
    `SELECT ${dimExpr ? `${dimExpr} AS [${dimId}], ` : ''}COUNT(DISTINCT FCT_LEAD.lead_key) AS [${metric.id}]`,
    `FROM ${SCHEMA}.FCT_LEAD`,
    `INNER JOIN ${SCHEMA}.DIM_CRM_ACT_TYPE AS lct ON FCT_LEAD.tp_key = lct.tp_key`,
    `LEFT JOIN ${SCHEMA}.DIM_MNG_USER ON FCT_LEAD.cl_sc_key = DIM_MNG_USER.sc_key`,
    `LEFT JOIN ${SCHEMA}.DIM_MNG_DEALER ON DIM_MNG_USER.dealer_key = DIM_MNG_DEALER.dealer_key`,
    extraJoin,
    `WHERE ${whereClauses.join('\n  AND ')}`,
    dimExpr ? `GROUP BY ${dimExpr}` : '',
  ].filter(Boolean).join('\n')
}

// GOLD의 cntrct_actual CTE — 계약월 기준, 자격 리드/활동은 그 달 안에서, SC·유형 상관.
//
// 주의: GOLD의 이 CTE에는 취소 제외 조건이 없다. 예전 구현은 br_contract_cancel_exclusion을
// 걸고 있었는데, "GOLD와 완전히 일치" 결정에 따라 뺐다 — 상관 조건 추가로 값이 작아지는
// 것과 반대로, 취소 건이 포함되어 커지는 변화가 동시에 일어난다.
export function buildContractActualSql({ ir, metric, registry, startDate, endDate }) {
  const dimId = ir.dimensions?.[0] || null
  const dimDef = dimId ? registry.dimensions.get(dimId) : null
  const { expr: dimExpr, extraJoin } = resolveFunnelDimension(dimDef, {
    anchorCol: 'FCT_CONTRACT_KTWS.contract_dt',
    actTypeAlias: 'ct',
  })

  const monthStart = 'DATEFROMPARTS(YEAR(FCT_CONTRACT_KTWS.contract_dt), MONTH(FCT_CONTRACT_KTWS.contract_dt), 1)'
  const monthEnd = 'EOMONTH(FCT_CONTRACT_KTWS.contract_dt)'
  const qualifiedLeadDef = withAlias(
    registry.filters.get('br_qualified_lead_def').sql_fragment.replace('@MonthEnd', monthEnd),
    'FCT_LEAD', 'l',
  )

  const scopeClauses = buildScopeClauses(ir, registry)

  // 안쪽: 그 리드에 "계약과 같은 활동유형·같은 SC"의 활동이 계약월 안에 있었는가.
  //
  // 이 두 상관 조건은 검증된 1-1 GOLD(funnel_full_structure)의 contract_activity_count가
  // 그대로 갖고 있다:
  //     INNER JOIN lead_activity_pool LP ON I.lead_key = LP.lead_key AND I.cn_sc_key = LP.sc_key
  //     INNER JOIN valid_type IVT ON I.tp_key = IVT.tp_key AND IVT.common_tp_nm = LP.common_tp_nm
  //
  // 2026-07-29에 "Power BI 정렬"이라며 이 둘을 뺀 적이 있는데, 그때 기준으로 삼은
  // 스크린샷에 브랜드 필터가 빠져 있어 잘못된 기준이었다. 올바른 기준(재직 + 브랜드
  // TOYOTA·LEXUS)으로 다시 재보니 빼면 +52 과다였다:
  //     현재(상관 없음) 1,586 → 유형 상관 1,539 → SC 상관까지 1,533
  //     검증된 1-1 리포트 1,534 / Power BI 웹 1,536 (차이는 조회 시점 변동)
  // 활동그룹(tp_grp_1)·부재중은 계약 쪽에 걸지 않는 게 맞다 — 이 둘만 복원하면 값이 맞는다.
  const qualifyingActivity = [
    `AND EXISTS (`,
    `        SELECT 1`,
    `        FROM ${SCHEMA}.FCT_ACTIVITY_v2`,
    // 이 조인은 참조하는 조건이 없어도 지우면 안 된다 — 활동유형이 등록되지 않은 활동을
    // 걸러내는 암묵적 필터로 작동한다(빼면 2026-04 기준 1,611 → 1,787). GOLD/PBI 모두 있다.
    `        INNER JOIN ${SCHEMA}.DIM_CRM_ACT_TYPE AS act ON FCT_ACTIVITY_v2.tp_key = act.tp_key`,
    `        WHERE FCT_ACTIVITY_v2.lead_key = l.lead_key`,
    `          AND FCT_ACTIVITY_v2.lead_key IS NOT NULL`,
    `          AND act.common_tp_nm = ct.common_tp_nm`,
    `          AND FCT_ACTIVITY_v2.sc_key = FCT_CONTRACT_KTWS.cn_sc_key`,
    `          AND FCT_ACTIVITY_v2.act_dt_fr >= ${monthStart}`,
    `          AND FCT_ACTIVITY_v2.act_dt_fr <= ${monthEnd}`,
    `    )`,
  ].join('\n')

  // 바깥: 그 계약의 리드가 같은 SC·같은 유형으로 계약월 안에 등록되고 오픈 상태였는가.
  const qualifiedLead = [
    `EXISTS (`,
    `    SELECT 1`,
    `    FROM ${SCHEMA}.FCT_LEAD AS l`,
    `    INNER JOIN ${SCHEMA}.DIM_CRM_ACT_TYPE AS lct ON l.tp_key = lct.tp_key`,
    `    WHERE l.lead_key = FCT_CONTRACT_KTWS.lead_key`,
    `      AND l.cl_sc_key = FCT_CONTRACT_KTWS.cn_sc_key`,
    `      AND lct.common_tp_nm = ct.common_tp_nm`,
    `      AND l.lead_reg_dt >= ${monthStart}`,
    `      AND l.lead_reg_dt <= ${monthEnd}`,
    `      AND ${qualifiedLeadDef}`,
    qualifyingActivity,
    `)`,
  ].join('\n')

  const whereClauses = [
    `FCT_CONTRACT_KTWS.contract_dt BETWEEN '${startDate}' AND '${endDate}'`,
    qualifiedLead,
    ...scopeClauses,
  ]

  return [
    `SELECT ${dimExpr ? `${dimExpr} AS [${dimId}], ` : ''}COALESCE(SUM(FCT_CONTRACT_KTWS.cnt), 0) AS [${metric.id}]`,
    `FROM ${SCHEMA}.FCT_CONTRACT_KTWS`,
    `INNER JOIN ${SCHEMA}.DIM_CRM_ACT_TYPE AS ct ON FCT_CONTRACT_KTWS.tp_key = ct.tp_key`,
    `LEFT JOIN ${SCHEMA}.DIM_MNG_USER ON FCT_CONTRACT_KTWS.cn_sc_key = DIM_MNG_USER.sc_key`,
    `LEFT JOIN ${SCHEMA}.DIM_MNG_DEALER ON DIM_MNG_USER.dealer_key = DIM_MNG_DEALER.dealer_key`,
    extraJoin,
    `WHERE ${whereClauses.join('\n  AND ')}`,
    dimExpr ? `GROUP BY ${dimExpr}` : '',
  ].filter(Boolean).join('\n')
}
