/* ══════════════════════════════════════════════════════════════════════════
   [활동 퍼널 현황] 통합 쿼리 v3 — 11개 시각적 개체(GOLD 쿼리) 단일화
   ──────────────────────────────────────────────────────────────────────────
   v3 변경 : 출력 맨 앞에 [연도], [월] 컬럼 추가. 집계 그레인 = 연×월.
             @Year/@MonthNumber NULL이면 해당 축의 모든 값이 월별 행으로 나옴.
             리드 오픈 판정·자격활동 기간은 각 행의 '해당 월 월초~월말' 기준
             (원본 MTD 로직을 월별로 그대로 재현).
   지표순서 : 1.활동목표 2.활동실적 3.활동진척률 4.기회전환률 5.기회목표
              6.기회실적 7.기회진척률 8.계약전환률 9.계약목표 10.계약실적 11.계약진행률
   필터방식 : 다중 값 슬라이서는 전부 LIKE 패딩(',값1,값2,') 비교.
              STRING_SPLIT 미사용 → 8623 오류 방지. 값에 콤마 포함 시 필터 불가.
   @ScName  : NULL  → SC 열 미표시(딜러/전시장/팀 레벨 집계)
              'ALL' → SC 열 표시 + 전체 SC
              값    → SC 열 표시 + 해당 SC만 (콤마 다중 가능)
   ══════════════════════════════════════════════════════════════════════════ */

/* ── 기간 (NULL = 전체) ── */
DECLARE @Year        INT = NULL;   -- 연도 예)2026  / NULL=전체 연도
DECLARE @MonthNumber INT = NULL;   -- 월 1~12 예)5  / NULL=전체 월

/* ── 슬라이서 (NULL=전체, 여러 값은 콤마로 구분) ── */
DECLARE @Brand      NVARCHAR(MAX) = NULL;    -- DIM_MNG_USER[BRAND]
DECLARE @DealerNm   NVARCHAR(MAX) = NULL;    -- DIM_MNG_DEALER[dealer_nm]
DECLARE @GroupName  NVARCHAR(MAX) = NULL;    -- DIM_MNG_USER[group_name] 전시장
DECLARE @DeptNm     NVARCHAR(MAX) = NULL;    -- DIM_MNG_USER[dept_nm] 팀
DECLARE @ActYn      NVARCHAR(MAX) = NULL;    -- DIM_MNG_USER[active_yn] N'재직'/N'퇴직'
DECLARE @ScName     NVARCHAR(MAX) = NULL;    -- DIM_MNG_USER[name]  ※ NULL/'ALL'/값
DECLARE @CommonTpNm NVARCHAR(MAX) = NULL;    -- DIM_CRM_ACT_TYPE_ORDER[common_tp_nm]

/* ── 지표 선택 (NULL=전체 11지표 반환, 에이전트가 컬럼 선택용) ── */
DECLARE @metric NVARCHAR(MAX) = NULL;        -- 예) N'기회실적,기회진척률'

/* ── 파생 기간 : 선택된 연/월 조합의 달력 최소~최대 날짜 (인덱스 범위용) ── */
DECLARE @PeriodStart DATE, @PeriodEnd DATE;
SELECT @PeriodStart = MIN([Date]), @PeriodEnd = MAX([Date])
FROM ktws.DIM_CALENDAR_KTWS
WHERE (@Year        IS NULL OR [Year]        = @Year)
  AND (@MonthNumber IS NULL OR [MonthNumber] = @MonthNumber);

/* ── LIKE 패딩 변수 (콤마 뒤 공백 자동 제거 ', ' → ',') ── */
DECLARE @BrandPad      NVARCHAR(MAX) = N',' + REPLACE(@Brand,      N', ', N',') + N',';
DECLARE @DealerNmPad   NVARCHAR(MAX) = N',' + REPLACE(@DealerNm,   N', ', N',') + N',';
DECLARE @GroupNamePad  NVARCHAR(MAX) = N',' + REPLACE(@GroupName,  N', ', N',') + N',';
DECLARE @DeptNmPad     NVARCHAR(MAX) = N',' + REPLACE(@DeptNm,     N', ', N',') + N',';
DECLARE @ActYnPad      NVARCHAR(MAX) = N',' + REPLACE(@ActYn,      N', ', N',') + N',';
DECLARE @ScNamePad     NVARCHAR(MAX) = N',' + REPLACE(@ScName,     N', ', N',') + N',';
DECLARE @CommonTpNmPad NVARCHAR(MAX) = N',' + REPLACE(@CommonTpNm, N', ', N',') + N',';

IF @ScName IS NULL
BEGIN
    /* ═════════════════════════════════════════════════════════════════
       분기 A : SC 열 없음 — 연×월 × 딜러/전시장/팀 × 유형 레벨 집계
       (계약목표·계약진행률은 연×월×팀 소계 레벨, 유형 무시)
       ═════════════════════════════════════════════════════════════════ */
    ;WITH
    elig_user AS (
        SELECT u.sc_key, dlr.dealer_nm, u.group_name, u.dept_nm
        FROM ktws.DIM_MNG_USER        AS u
        LEFT JOIN ktws.DIM_MNG_DEALER AS dlr ON u.dealer_key = dlr.dealer_key
        WHERE ISNULL(u.facade_sc_yn, N'') <> N'창구SC'
          AND u.[name] NOT IN (N'고객지원팀', N'TOYOTA YM')
          AND u.user_id NOT IN
              (EXCLUDED_USER_ID_1,EXCLUDED_USER_ID_2)
          AND dlr.dealer_nm IS NOT NULL AND LTRIM(RTRIM(dlr.dealer_nm)) <> N''
          AND (@BrandPad     IS NULL OR @BrandPad     LIKE N'%,' + u.BRAND       + N',%')
          AND (@DealerNmPad  IS NULL OR @DealerNmPad  LIKE N'%,' + dlr.dealer_nm + N',%')
          AND (@GroupNamePad IS NULL OR @GroupNamePad LIKE N'%,' + u.group_name  + N',%')
          AND (@DeptNmPad    IS NULL OR @DeptNmPad    LIKE N'%,' + u.dept_nm     + N',%')
          AND (@ActYnPad     IS NULL OR @ActYnPad     LIKE N'%,' + u.active_yn   + N',%')
    ),
    /* 1. 활동 목표 */
    act_target AS (
        SELECT c.[Year] AS yr, c.[MonthNumber] AS mn,
               eu.dealer_nm, eu.group_name, eu.dept_nm, aord.common_tp_nm,
               SUM(f.target_cnt) AS v
        FROM ktws.FCT_CRM_TARGET_D       AS f
        JOIN ktws.DIM_CALENDAR_KTWS      AS c    ON f.daily_dt     = c.[Date]
        JOIN ktws.DIM_CRM_ACT_TYPE       AS t    ON f.type_cd      = t.tp_key
        JOIN ktws.DIM_CRM_ACT_TYPE_ORDER AS aord ON t.common_tp_nm = aord.common_tp_nm
        JOIN elig_user                   AS eu   ON f.sc_key       = eu.sc_key
        WHERE t.tp_grp_1 IN (N'관계형성', N'기회창출')
          AND (@Year        IS NULL OR c.[Year]        = @Year)
          AND (@MonthNumber IS NULL OR c.[MonthNumber] = @MonthNumber)
          AND (@CommonTpNmPad IS NULL OR @CommonTpNmPad LIKE N'%,' + aord.common_tp_nm + N',%')
        GROUP BY c.[Year], c.[MonthNumber],
                 eu.dealer_nm, eu.group_name, eu.dept_nm, aord.common_tp_nm
    ),
    /* 2. 활동 실적 */
    act_actual AS (
        SELECT c.[Year] AS yr, c.[MonthNumber] AS mn,
               eu.dealer_nm, eu.group_name, eu.dept_nm, aord.common_tp_nm,
               SUM(f.actual_cnt) AS v
        FROM ktws.FCT_ACTIVITY_v2        AS f
        JOIN ktws.DIM_CALENDAR_KTWS      AS c    ON f.act_dt_fr    = c.[Date]
        JOIN ktws.DIM_CRM_ACT_TYPE       AS t    ON f.tp_key       = t.tp_key
        JOIN ktws.DIM_CRM_ACT_TYPE_ORDER AS aord ON t.common_tp_nm = aord.common_tp_nm
        JOIN elig_user                   AS eu   ON f.sc_key       = eu.sc_key
        WHERE t.tp_grp_1 IN (N'관계형성', N'기회창출')
          AND (@Year        IS NULL OR c.[Year]        = @Year)
          AND (@MonthNumber IS NULL OR c.[MonthNumber] = @MonthNumber)
          AND (@CommonTpNmPad IS NULL OR @CommonTpNmPad LIKE N'%,' + aord.common_tp_nm + N',%')
        GROUP BY c.[Year], c.[MonthNumber],
                 eu.dealer_nm, eu.group_name, eu.dept_nm, aord.common_tp_nm
    ),
    /* 5. 기회 목표 */
    lead_target AS (
        SELECT c.[Year] AS yr, c.[MonthNumber] AS mn,
               eu.dealer_nm, eu.group_name, eu.dept_nm, aord.common_tp_nm,
               SUM(f.target_cnt) AS v
        FROM ktws.FCT_CRM_TARGET_M       AS f
        JOIN ktws.DIM_CALENDAR_KTWS      AS c    ON f.monthly_dt   = c.[Date]
        JOIN ktws.DIM_CRM_ACT_TYPE       AS t    ON f.tp_key       = t.tp_key
        JOIN ktws.DIM_CRM_ACT_TYPE_ORDER AS aord ON t.common_tp_nm = aord.common_tp_nm
        JOIN elig_user                   AS eu   ON f.sc_key       = eu.sc_key
        WHERE t.tp_grp_1 IN (N'관계형성', N'기회창출')
          AND (@Year        IS NULL OR c.[Year]        = @Year)
          AND (@MonthNumber IS NULL OR c.[MonthNumber] = @MonthNumber)
          AND (@CommonTpNmPad IS NULL OR @CommonTpNmPad LIKE N'%,' + aord.common_tp_nm + N',%')
        GROUP BY c.[Year], c.[MonthNumber],
                 eu.dealer_nm, eu.group_name, eu.dept_nm, aord.common_tp_nm
    ),
    /* 6. 기회 실적 : 리드 등록월 기준. 오픈 판정·자격활동은 해당 월 월초~월말 */
    lead_actual AS (
        SELECT lc.[Year] AS yr, lc.[MonthNumber] AS mn,
               eu.dealer_nm, eu.group_name, eu.dept_nm, aord.common_tp_nm,
               COUNT(DISTINCT l.lead_key) AS v
        FROM ktws.FCT_LEAD               AS l
        JOIN ktws.DIM_CALENDAR_KTWS      AS lc   ON l.lead_reg_dt   = lc.[Date]
        JOIN elig_user                   AS eu   ON l.cl_sc_key     = eu.sc_key
        JOIN ktws.DIM_CRM_ACT_TYPE       AS lct  ON l.tp_key        = lct.tp_key
        JOIN ktws.DIM_CRM_ACT_TYPE_ORDER AS aord ON lct.common_tp_nm = aord.common_tp_nm
        WHERE (@Year        IS NULL OR lc.[Year]        = @Year)
          AND (@MonthNumber IS NULL OR lc.[MonthNumber] = @MonthNumber)
          AND ( l.close_dt > EOMONTH(l.lead_reg_dt)
             OR l.close_dt IS NULL
             OR l.last_retail_sales_dt IS NOT NULL )
          AND (@CommonTpNmPad IS NULL OR @CommonTpNmPad LIKE N'%,' + aord.common_tp_nm + N',%')
          AND EXISTS (
                SELECT 1
                FROM ktws.FCT_ACTIVITY_v2  AS a
                JOIN ktws.DIM_CRM_ACT_TYPE AS act ON a.tp_key = act.tp_key
                WHERE a.lead_key = l.lead_key
                  AND a.sc_key  = l.cl_sc_key
                  AND act.common_tp_nm = lct.common_tp_nm
                  AND act.tp_grp_1 IN (N'관계형성', N'기회창출')
                  AND ( a.act_result IS NULL OR a.act_result <> N'부재중' )
                  AND a.act_dt_fr >= DATEFROMPARTS(YEAR(l.lead_reg_dt), MONTH(l.lead_reg_dt), 1)
                  AND a.act_dt_fr <= EOMONTH(l.lead_reg_dt)
          )
        GROUP BY lc.[Year], lc.[MonthNumber],
                 eu.dealer_nm, eu.group_name, eu.dept_nm, aord.common_tp_nm
    ),
    /* 10. 계약 실적 : 계약월 기준. 자격 리드/활동은 계약월 월초~월말 */
    cntrct_actual AS (
        SELECT YEAR(c.contract_dt) AS yr, MONTH(c.contract_dt) AS mn,
               eu.dealer_nm, eu.group_name, eu.dept_nm, aord.common_tp_nm,
               SUM(c.cnt) AS v
        FROM ktws.FCT_CONTRACT_KTWS      AS c
        JOIN elig_user                   AS eu   ON c.cn_sc_key     = eu.sc_key
        JOIN ktws.DIM_CRM_ACT_TYPE       AS ct   ON c.tp_key        = ct.tp_key
        JOIN ktws.DIM_CRM_ACT_TYPE_ORDER AS aord ON ct.common_tp_nm = aord.common_tp_nm
        WHERE c.contract_dt >= @PeriodStart AND c.contract_dt <= @PeriodEnd
          AND (@Year        IS NULL OR YEAR(c.contract_dt)  = @Year)
          AND (@MonthNumber IS NULL OR MONTH(c.contract_dt) = @MonthNumber)
          AND (@CommonTpNmPad IS NULL OR @CommonTpNmPad LIKE N'%,' + aord.common_tp_nm + N',%')
          AND EXISTS (
                SELECT 1
                FROM ktws.FCT_LEAD         AS l
                JOIN ktws.DIM_CRM_ACT_TYPE AS lct ON l.tp_key = lct.tp_key
                WHERE l.lead_key   = c.lead_key
                  AND l.cl_sc_key  = c.cn_sc_key
                  AND lct.common_tp_nm = ct.common_tp_nm
                  AND l.lead_reg_dt >= DATEFROMPARTS(YEAR(c.contract_dt), MONTH(c.contract_dt), 1)
                  AND l.lead_reg_dt <= EOMONTH(c.contract_dt)
                  AND ( l.close_dt > EOMONTH(c.contract_dt)
                     OR l.close_dt IS NULL
                     OR l.last_retail_sales_dt IS NOT NULL )
                  AND EXISTS (
                        SELECT 1
                        FROM ktws.FCT_ACTIVITY_v2  AS a
                        JOIN ktws.DIM_CRM_ACT_TYPE AS act ON a.tp_key = act.tp_key
                        WHERE a.lead_key = l.lead_key
                          AND a.sc_key   = c.cn_sc_key
                          AND act.common_tp_nm = ct.common_tp_nm
                          AND act.tp_grp_1 IN (N'관계형성', N'기회창출')
                          AND ( a.act_result IS NULL OR a.act_result <> N'부재중' )
                          AND a.lead_key IS NOT NULL
                          AND a.act_dt_fr >= DATEFROMPARTS(YEAR(c.contract_dt), MONTH(c.contract_dt), 1)
                          AND a.act_dt_fr <= EOMONTH(c.contract_dt)
                  )
          )
        GROUP BY YEAR(c.contract_dt), MONTH(c.contract_dt),
                 eu.dealer_nm, eu.group_name, eu.dept_nm, aord.common_tp_nm
    ),
    /* 9/11. 계약 목표 (common_tp_nm='계약'만, 유형 무시 → 연×월×팀 소계) */
    cntrct_target AS (
        SELECT c.[Year] AS yr, c.[MonthNumber] AS mn,
               eu.dealer_nm, eu.group_name, eu.dept_nm,
               CAST(NULL AS NVARCHAR(200)) AS common_tp_nm,
               SUM(t.target_cnt) AS v
        FROM ktws.FCT_CRM_TARGET_M  AS t
        JOIN ktws.DIM_CALENDAR_KTWS AS c   ON t.monthly_dt = c.[Date]
        JOIN ktws.DIM_CRM_ACT_TYPE  AS tct ON t.tp_key     = tct.tp_key
        JOIN elig_user              AS eu  ON t.sc_key     = eu.sc_key
        WHERE (@Year        IS NULL OR c.[Year]        = @Year)
          AND (@MonthNumber IS NULL OR c.[MonthNumber] = @MonthNumber)
          AND tct.common_tp_nm = N'계약'
        GROUP BY c.[Year], c.[MonthNumber], eu.dealer_nm, eu.group_name, eu.dept_nm
    ),
    /* 계약 실적 연×월×팀 소계 (계약 진행률 분자용) */
    cntrct_actual_sc AS (
        SELECT yr, mn, dealer_nm, group_name, dept_nm, SUM(v) AS v
        FROM cntrct_actual
        GROUP BY yr, mn, dealer_nm, group_name, dept_nm
    ),
    grid AS (
        SELECT yr, mn, dealer_nm, group_name, dept_nm, common_tp_nm FROM act_target
        UNION SELECT yr, mn, dealer_nm, group_name, dept_nm, common_tp_nm FROM act_actual
        UNION SELECT yr, mn, dealer_nm, group_name, dept_nm, common_tp_nm FROM lead_target
        UNION SELECT yr, mn, dealer_nm, group_name, dept_nm, common_tp_nm FROM lead_actual
        UNION SELECT yr, mn, dealer_nm, group_name, dept_nm, common_tp_nm FROM cntrct_actual
    ),
    detail AS (
        SELECT
            g.yr, g.mn, g.dealer_nm, g.group_name, g.dept_nm, g.common_tp_nm,
            ISNULL(at1.v,0) AS act_tgt,
            ISNULL(aa1.v,0) AS act_act,
            ISNULL(lt1.v,0) AS lead_tgt,
            ISNULL(la1.v,0) AS lead_act,
            ISNULL(ca1.v,0) AS cntrct_act,
            ct1.v           AS cntrct_tgt_sc,
            casc.v          AS cntrct_act_sc,
            ROW_NUMBER() OVER (
                PARTITION BY g.yr, g.mn, g.dealer_nm, g.group_name, g.dept_nm
                ORDER BY g.common_tp_nm
            ) AS sc_first
        FROM grid AS g
        LEFT JOIN act_target       AS at1  ON at1.yr=g.yr AND at1.mn=g.mn AND at1.dealer_nm=g.dealer_nm AND at1.group_name=g.group_name AND at1.dept_nm=g.dept_nm AND at1.common_tp_nm=g.common_tp_nm
        LEFT JOIN act_actual       AS aa1  ON aa1.yr=g.yr AND aa1.mn=g.mn AND aa1.dealer_nm=g.dealer_nm AND aa1.group_name=g.group_name AND aa1.dept_nm=g.dept_nm AND aa1.common_tp_nm=g.common_tp_nm
        LEFT JOIN lead_target      AS lt1  ON lt1.yr=g.yr AND lt1.mn=g.mn AND lt1.dealer_nm=g.dealer_nm AND lt1.group_name=g.group_name AND lt1.dept_nm=g.dept_nm AND lt1.common_tp_nm=g.common_tp_nm
        LEFT JOIN lead_actual      AS la1  ON la1.yr=g.yr AND la1.mn=g.mn AND la1.dealer_nm=g.dealer_nm AND la1.group_name=g.group_name AND la1.dept_nm=g.dept_nm AND la1.common_tp_nm=g.common_tp_nm
        LEFT JOIN cntrct_actual    AS ca1  ON ca1.yr=g.yr AND ca1.mn=g.mn AND ca1.dealer_nm=g.dealer_nm AND ca1.group_name=g.group_name AND ca1.dept_nm=g.dept_nm AND ca1.common_tp_nm=g.common_tp_nm
        LEFT JOIN cntrct_target    AS ct1  ON ct1.yr=g.yr AND ct1.mn=g.mn AND ct1.dealer_nm=g.dealer_nm AND ct1.group_name=g.group_name AND ct1.dept_nm=g.dept_nm
        LEFT JOIN cntrct_actual_sc AS casc ON casc.yr=g.yr AND casc.mn=g.mn AND casc.dealer_nm=g.dealer_nm AND casc.group_name=g.group_name AND casc.dept_nm=g.dept_nm
    )
    SELECT
        [연도], [월], [딜러], [전시장], [팀], [활동유형],
        [활동목표], [활동실적], [활동진척률],
        [기회전환률], [기회목표], [기회실적], [기회진척률],
        [계약전환률], [계약목표], [계약실적], [계약진행률]
    FROM (
        SELECT
            0 AS ord,
            yr           AS [연도],
            mn           AS [월],
            dealer_nm    AS [딜러],
            group_name   AS [전시장],
            dept_nm      AS [팀],
            common_tp_nm AS [활동유형],
            act_tgt      AS [활동목표],
            act_act      AS [활동실적],
            CASE WHEN act_tgt=0 THEN 1.0 ELSE CAST(act_act AS float)/act_tgt END        AS [활동진척률],
            CASE WHEN act_act=0 THEN NULL ELSE CAST(lead_act AS float)/act_act END       AS [기회전환률],
            lead_tgt     AS [기회목표],
            lead_act     AS [기회실적],
            CASE WHEN lead_tgt=0 THEN 0.0 ELSE CAST(lead_act AS float)/lead_tgt END      AS [기회진척률],
            CASE WHEN lead_act=0 THEN NULL ELSE CAST(cntrct_act AS float)/lead_act END   AS [계약전환률],
            cntrct_tgt_sc AS [계약목표],
            cntrct_act    AS [계약실적],
            CASE WHEN cntrct_tgt_sc IS NULL THEN NULL
                 WHEN cntrct_tgt_sc=0 THEN 1.0
                 ELSE CAST(ISNULL(cntrct_act_sc,0) AS float)/cntrct_tgt_sc END           AS [계약진행률]
        FROM detail

        UNION ALL

        SELECT
            1 AS ord,
            NULL AS [연도], NULL AS [월],
            N'합계' AS [딜러], NULL AS [전시장], NULL AS [팀], NULL AS [활동유형],
            SUM(act_tgt)  AS [활동목표],
            SUM(act_act)  AS [활동실적],
            CASE WHEN SUM(act_tgt)=0 THEN 1.0 ELSE CAST(SUM(act_act) AS float)/SUM(act_tgt) END      AS [활동진척률],
            CASE WHEN SUM(act_act)=0 THEN NULL ELSE CAST(SUM(lead_act) AS float)/SUM(act_act) END     AS [기회전환률],
            SUM(lead_tgt) AS [기회목표],
            SUM(lead_act) AS [기회실적],
            CASE WHEN SUM(lead_tgt)=0 THEN 0.0 ELSE CAST(SUM(lead_act) AS float)/SUM(lead_tgt) END    AS [기회진척률],
            CASE WHEN SUM(lead_act)=0 THEN NULL ELSE CAST(SUM(cntrct_act) AS float)/SUM(lead_act) END AS [계약전환률],
            SUM(CASE WHEN sc_first=1 THEN ISNULL(cntrct_tgt_sc,0) ELSE 0 END)                         AS [계약목표],
            SUM(cntrct_act) AS [계약실적],
            CASE WHEN SUM(CASE WHEN sc_first=1 THEN ISNULL(cntrct_tgt_sc,0) ELSE 0 END)=0 THEN NULL
                 ELSE CAST(SUM(CASE WHEN sc_first=1 THEN ISNULL(cntrct_act_sc,0) ELSE 0 END) AS float)
                      / SUM(CASE WHEN sc_first=1 THEN ISNULL(cntrct_tgt_sc,0) ELSE 0 END) END         AS [계약진행률]
        FROM detail
    ) AS final_result
    ORDER BY ord, [연도], [월], [딜러], [전시장], [팀], [활동유형];
END
ELSE
BEGIN
    /* ═════════════════════════════════════════════════════════════════
       분기 B : SC 열 포함 — 'ALL'=전체 SC / 값=해당 SC만 (콤마 다중)
       (계약목표·계약진행률은 연×월×SC 소계 레벨, 유형 무시)
       ═════════════════════════════════════════════════════════════════ */
    ;WITH
    elig_user AS (
        SELECT u.sc_key, dlr.dealer_nm, u.group_name, u.dept_nm, u.[name]
        FROM ktws.DIM_MNG_USER        AS u
        LEFT JOIN ktws.DIM_MNG_DEALER AS dlr ON u.dealer_key = dlr.dealer_key
        WHERE ISNULL(u.facade_sc_yn, N'') <> N'창구SC'
          AND u.[name] NOT IN (N'고객지원팀', N'TOYOTA YM')
          AND u.user_id NOT IN
              (EXCLUDED_USER_ID_1,EXCLUDED_USER_ID_2)
          AND dlr.dealer_nm IS NOT NULL AND LTRIM(RTRIM(dlr.dealer_nm)) <> N''
          AND (@ScName = N'ALL' OR @ScNamePad LIKE N'%,' + u.[name] + N',%')
          AND (@BrandPad     IS NULL OR @BrandPad     LIKE N'%,' + u.BRAND       + N',%')
          AND (@DealerNmPad  IS NULL OR @DealerNmPad  LIKE N'%,' + dlr.dealer_nm + N',%')
          AND (@GroupNamePad IS NULL OR @GroupNamePad LIKE N'%,' + u.group_name  + N',%')
          AND (@DeptNmPad    IS NULL OR @DeptNmPad    LIKE N'%,' + u.dept_nm     + N',%')
          AND (@ActYnPad     IS NULL OR @ActYnPad     LIKE N'%,' + u.active_yn   + N',%')
    ),
    /* 1. 활동 목표 */
    act_target AS (
        SELECT c.[Year] AS yr, c.[MonthNumber] AS mn,
               eu.dealer_nm, eu.group_name, eu.dept_nm, eu.[name], aord.common_tp_nm,
               SUM(f.target_cnt) AS v
        FROM ktws.FCT_CRM_TARGET_D       AS f
        JOIN ktws.DIM_CALENDAR_KTWS      AS c    ON f.daily_dt     = c.[Date]
        JOIN ktws.DIM_CRM_ACT_TYPE       AS t    ON f.type_cd      = t.tp_key
        JOIN ktws.DIM_CRM_ACT_TYPE_ORDER AS aord ON t.common_tp_nm = aord.common_tp_nm
        JOIN elig_user                   AS eu   ON f.sc_key       = eu.sc_key
        WHERE t.tp_grp_1 IN (N'관계형성', N'기회창출')
          AND (@Year        IS NULL OR c.[Year]        = @Year)
          AND (@MonthNumber IS NULL OR c.[MonthNumber] = @MonthNumber)
          AND (@CommonTpNmPad IS NULL OR @CommonTpNmPad LIKE N'%,' + aord.common_tp_nm + N',%')
        GROUP BY c.[Year], c.[MonthNumber],
                 eu.dealer_nm, eu.group_name, eu.dept_nm, eu.[name], aord.common_tp_nm
    ),
    /* 2. 활동 실적 */
    act_actual AS (
        SELECT c.[Year] AS yr, c.[MonthNumber] AS mn,
               eu.dealer_nm, eu.group_name, eu.dept_nm, eu.[name], aord.common_tp_nm,
               SUM(f.actual_cnt) AS v
        FROM ktws.FCT_ACTIVITY_v2        AS f
        JOIN ktws.DIM_CALENDAR_KTWS      AS c    ON f.act_dt_fr    = c.[Date]
        JOIN ktws.DIM_CRM_ACT_TYPE       AS t    ON f.tp_key       = t.tp_key
        JOIN ktws.DIM_CRM_ACT_TYPE_ORDER AS aord ON t.common_tp_nm = aord.common_tp_nm
        JOIN elig_user                   AS eu   ON f.sc_key       = eu.sc_key
        WHERE t.tp_grp_1 IN (N'관계형성', N'기회창출')
          AND (@Year        IS NULL OR c.[Year]        = @Year)
          AND (@MonthNumber IS NULL OR c.[MonthNumber] = @MonthNumber)
          AND (@CommonTpNmPad IS NULL OR @CommonTpNmPad LIKE N'%,' + aord.common_tp_nm + N',%')
        GROUP BY c.[Year], c.[MonthNumber],
                 eu.dealer_nm, eu.group_name, eu.dept_nm, eu.[name], aord.common_tp_nm
    ),
    /* 5. 기회 목표 */
    lead_target AS (
        SELECT c.[Year] AS yr, c.[MonthNumber] AS mn,
               eu.dealer_nm, eu.group_name, eu.dept_nm, eu.[name], aord.common_tp_nm,
               SUM(f.target_cnt) AS v
        FROM ktws.FCT_CRM_TARGET_M       AS f
        JOIN ktws.DIM_CALENDAR_KTWS      AS c    ON f.monthly_dt   = c.[Date]
        JOIN ktws.DIM_CRM_ACT_TYPE       AS t    ON f.tp_key       = t.tp_key
        JOIN ktws.DIM_CRM_ACT_TYPE_ORDER AS aord ON t.common_tp_nm = aord.common_tp_nm
        JOIN elig_user                   AS eu   ON f.sc_key       = eu.sc_key
        WHERE t.tp_grp_1 IN (N'관계형성', N'기회창출')
          AND (@Year        IS NULL OR c.[Year]        = @Year)
          AND (@MonthNumber IS NULL OR c.[MonthNumber] = @MonthNumber)
          AND (@CommonTpNmPad IS NULL OR @CommonTpNmPad LIKE N'%,' + aord.common_tp_nm + N',%')
        GROUP BY c.[Year], c.[MonthNumber],
                 eu.dealer_nm, eu.group_name, eu.dept_nm, eu.[name], aord.common_tp_nm
    ),
    /* 6. 기회 실적 : 리드 등록월 기준. 오픈 판정·자격활동은 해당 월 월초~월말 */
    lead_actual AS (
        SELECT lc.[Year] AS yr, lc.[MonthNumber] AS mn,
               eu.dealer_nm, eu.group_name, eu.dept_nm, eu.[name], aord.common_tp_nm,
               COUNT(DISTINCT l.lead_key) AS v
        FROM ktws.FCT_LEAD               AS l
        JOIN ktws.DIM_CALENDAR_KTWS      AS lc   ON l.lead_reg_dt   = lc.[Date]
        JOIN elig_user                   AS eu   ON l.cl_sc_key     = eu.sc_key
        JOIN ktws.DIM_CRM_ACT_TYPE       AS lct  ON l.tp_key        = lct.tp_key
        JOIN ktws.DIM_CRM_ACT_TYPE_ORDER AS aord ON lct.common_tp_nm = aord.common_tp_nm
        WHERE (@Year        IS NULL OR lc.[Year]        = @Year)
          AND (@MonthNumber IS NULL OR lc.[MonthNumber] = @MonthNumber)
          AND ( l.close_dt > EOMONTH(l.lead_reg_dt)
             OR l.close_dt IS NULL
             OR l.last_retail_sales_dt IS NOT NULL )
          AND (@CommonTpNmPad IS NULL OR @CommonTpNmPad LIKE N'%,' + aord.common_tp_nm + N',%')
          AND EXISTS (
                SELECT 1
                FROM ktws.FCT_ACTIVITY_v2  AS a
                JOIN ktws.DIM_CRM_ACT_TYPE AS act ON a.tp_key = act.tp_key
                WHERE a.lead_key = l.lead_key
                  AND a.sc_key  = l.cl_sc_key
                  AND act.common_tp_nm = lct.common_tp_nm
                  AND act.tp_grp_1 IN (N'관계형성', N'기회창출')
                  AND ( a.act_result IS NULL OR a.act_result <> N'부재중' )
                  AND a.act_dt_fr >= DATEFROMPARTS(YEAR(l.lead_reg_dt), MONTH(l.lead_reg_dt), 1)
                  AND a.act_dt_fr <= EOMONTH(l.lead_reg_dt)
          )
        GROUP BY lc.[Year], lc.[MonthNumber],
                 eu.dealer_nm, eu.group_name, eu.dept_nm, eu.[name], aord.common_tp_nm
    ),
    /* 10. 계약 실적 : 계약월 기준. 자격 리드/활동은 계약월 월초~월말 */
    cntrct_actual AS (
        SELECT YEAR(c.contract_dt) AS yr, MONTH(c.contract_dt) AS mn,
               eu.dealer_nm, eu.group_name, eu.dept_nm, eu.[name], aord.common_tp_nm,
               SUM(c.cnt) AS v
        FROM ktws.FCT_CONTRACT_KTWS      AS c
        JOIN elig_user                   AS eu   ON c.cn_sc_key     = eu.sc_key
        JOIN ktws.DIM_CRM_ACT_TYPE       AS ct   ON c.tp_key        = ct.tp_key
        JOIN ktws.DIM_CRM_ACT_TYPE_ORDER AS aord ON ct.common_tp_nm = aord.common_tp_nm
        WHERE c.contract_dt >= @PeriodStart AND c.contract_dt <= @PeriodEnd
          AND (@Year        IS NULL OR YEAR(c.contract_dt)  = @Year)
          AND (@MonthNumber IS NULL OR MONTH(c.contract_dt) = @MonthNumber)
          AND (@CommonTpNmPad IS NULL OR @CommonTpNmPad LIKE N'%,' + aord.common_tp_nm + N',%')
          AND EXISTS (
                SELECT 1
                FROM ktws.FCT_LEAD         AS l
                JOIN ktws.DIM_CRM_ACT_TYPE AS lct ON l.tp_key = lct.tp_key
                WHERE l.lead_key   = c.lead_key
                  AND l.cl_sc_key  = c.cn_sc_key
                  AND lct.common_tp_nm = ct.common_tp_nm
                  AND l.lead_reg_dt >= DATEFROMPARTS(YEAR(c.contract_dt), MONTH(c.contract_dt), 1)
                  AND l.lead_reg_dt <= EOMONTH(c.contract_dt)
                  AND ( l.close_dt > EOMONTH(c.contract_dt)
                     OR l.close_dt IS NULL
                     OR l.last_retail_sales_dt IS NOT NULL )
                  AND EXISTS (
                        SELECT 1
                        FROM ktws.FCT_ACTIVITY_v2  AS a
                        JOIN ktws.DIM_CRM_ACT_TYPE AS act ON a.tp_key = act.tp_key
                        WHERE a.lead_key = l.lead_key
                          AND a.sc_key   = c.cn_sc_key
                          AND act.common_tp_nm = ct.common_tp_nm
                          AND act.tp_grp_1 IN (N'관계형성', N'기회창출')
                          AND ( a.act_result IS NULL OR a.act_result <> N'부재중' )
                          AND a.lead_key IS NOT NULL
                          AND a.act_dt_fr >= DATEFROMPARTS(YEAR(c.contract_dt), MONTH(c.contract_dt), 1)
                          AND a.act_dt_fr <= EOMONTH(c.contract_dt)
                  )
          )
        GROUP BY YEAR(c.contract_dt), MONTH(c.contract_dt),
                 eu.dealer_nm, eu.group_name, eu.dept_nm, eu.[name], aord.common_tp_nm
    ),
    /* 9/11. 계약 목표 (common_tp_nm='계약'만, 유형 무시 → 연×월×SC 소계) */
    cntrct_target AS (
        SELECT c.[Year] AS yr, c.[MonthNumber] AS mn,
               eu.dealer_nm, eu.group_name, eu.dept_nm, eu.[name],
               CAST(NULL AS NVARCHAR(200)) AS common_tp_nm,
               SUM(t.target_cnt) AS v
        FROM ktws.FCT_CRM_TARGET_M  AS t
        JOIN ktws.DIM_CALENDAR_KTWS AS c   ON t.monthly_dt = c.[Date]
        JOIN ktws.DIM_CRM_ACT_TYPE  AS tct ON t.tp_key     = tct.tp_key
        JOIN elig_user              AS eu  ON t.sc_key     = eu.sc_key
        WHERE (@Year        IS NULL OR c.[Year]        = @Year)
          AND (@MonthNumber IS NULL OR c.[MonthNumber] = @MonthNumber)
          AND tct.common_tp_nm = N'계약'
        GROUP BY c.[Year], c.[MonthNumber],
                 eu.dealer_nm, eu.group_name, eu.dept_nm, eu.[name]
    ),
    /* 계약 실적 연×월×SC 소계 (계약 진행률 분자용) */
    cntrct_actual_sc AS (
        SELECT yr, mn, dealer_nm, group_name, dept_nm, [name], SUM(v) AS v
        FROM cntrct_actual
        GROUP BY yr, mn, dealer_nm, group_name, dept_nm, [name]
    ),
    grid AS (
        SELECT yr, mn, dealer_nm, group_name, dept_nm, [name], common_tp_nm FROM act_target
        UNION SELECT yr, mn, dealer_nm, group_name, dept_nm, [name], common_tp_nm FROM act_actual
        UNION SELECT yr, mn, dealer_nm, group_name, dept_nm, [name], common_tp_nm FROM lead_target
        UNION SELECT yr, mn, dealer_nm, group_name, dept_nm, [name], common_tp_nm FROM lead_actual
        UNION SELECT yr, mn, dealer_nm, group_name, dept_nm, [name], common_tp_nm FROM cntrct_actual
    ),
    detail AS (
        SELECT
            g.yr, g.mn, g.dealer_nm, g.group_name, g.dept_nm, g.[name], g.common_tp_nm,
            ISNULL(at1.v,0) AS act_tgt,
            ISNULL(aa1.v,0) AS act_act,
            ISNULL(lt1.v,0) AS lead_tgt,
            ISNULL(la1.v,0) AS lead_act,
            ISNULL(ca1.v,0) AS cntrct_act,
            ct1.v           AS cntrct_tgt_sc,
            casc.v          AS cntrct_act_sc,
            ROW_NUMBER() OVER (
                PARTITION BY g.yr, g.mn, g.dealer_nm, g.group_name, g.dept_nm, g.[name]
                ORDER BY g.common_tp_nm
            ) AS sc_first
        FROM grid AS g
        LEFT JOIN act_target       AS at1  ON at1.yr=g.yr AND at1.mn=g.mn AND at1.dealer_nm=g.dealer_nm AND at1.group_name=g.group_name AND at1.dept_nm=g.dept_nm AND at1.[name]=g.[name] AND at1.common_tp_nm=g.common_tp_nm
        LEFT JOIN act_actual       AS aa1  ON aa1.yr=g.yr AND aa1.mn=g.mn AND aa1.dealer_nm=g.dealer_nm AND aa1.group_name=g.group_name AND aa1.dept_nm=g.dept_nm AND aa1.[name]=g.[name] AND aa1.common_tp_nm=g.common_tp_nm
        LEFT JOIN lead_target      AS lt1  ON lt1.yr=g.yr AND lt1.mn=g.mn AND lt1.dealer_nm=g.dealer_nm AND lt1.group_name=g.group_name AND lt1.dept_nm=g.dept_nm AND lt1.[name]=g.[name] AND lt1.common_tp_nm=g.common_tp_nm
        LEFT JOIN lead_actual      AS la1  ON la1.yr=g.yr AND la1.mn=g.mn AND la1.dealer_nm=g.dealer_nm AND la1.group_name=g.group_name AND la1.dept_nm=g.dept_nm AND la1.[name]=g.[name] AND la1.common_tp_nm=g.common_tp_nm
        LEFT JOIN cntrct_actual    AS ca1  ON ca1.yr=g.yr AND ca1.mn=g.mn AND ca1.dealer_nm=g.dealer_nm AND ca1.group_name=g.group_name AND ca1.dept_nm=g.dept_nm AND ca1.[name]=g.[name] AND ca1.common_tp_nm=g.common_tp_nm
        LEFT JOIN cntrct_target    AS ct1  ON ct1.yr=g.yr AND ct1.mn=g.mn AND ct1.dealer_nm=g.dealer_nm AND ct1.group_name=g.group_name AND ct1.dept_nm=g.dept_nm AND ct1.[name]=g.[name]
        LEFT JOIN cntrct_actual_sc AS casc ON casc.yr=g.yr AND casc.mn=g.mn AND casc.dealer_nm=g.dealer_nm AND casc.group_name=g.group_name AND casc.dept_nm=g.dept_nm AND casc.[name]=g.[name]
    )
    SELECT
        [연도], [월], [딜러], [전시장], [팀], [SC], [활동유형],
        [활동목표], [활동실적], [활동진척률],
        [기회전환률], [기회목표], [기회실적], [기회진척률],
        [계약전환률], [계약목표], [계약실적], [계약진행률]
    FROM (
        SELECT
            0 AS ord,
            yr           AS [연도],
            mn           AS [월],
            dealer_nm    AS [딜러],
            group_name   AS [전시장],
            dept_nm      AS [팀],
            [name]       AS [SC],
            common_tp_nm AS [활동유형],
            act_tgt      AS [활동목표],
            act_act      AS [활동실적],
            CASE WHEN act_tgt=0 THEN 1.0 ELSE CAST(act_act AS float)/act_tgt END        AS [활동진척률],
            CASE WHEN act_act=0 THEN NULL ELSE CAST(lead_act AS float)/act_act END       AS [기회전환률],
            lead_tgt     AS [기회목표],
            lead_act     AS [기회실적],
            CASE WHEN lead_tgt=0 THEN 0.0 ELSE CAST(lead_act AS float)/lead_tgt END      AS [기회진척률],
            CASE WHEN lead_act=0 THEN NULL ELSE CAST(cntrct_act AS float)/lead_act END   AS [계약전환률],
            cntrct_tgt_sc AS [계약목표],
            cntrct_act    AS [계약실적],
            CASE WHEN cntrct_tgt_sc IS NULL THEN NULL
                 WHEN cntrct_tgt_sc=0 THEN 1.0
                 ELSE CAST(ISNULL(cntrct_act_sc,0) AS float)/cntrct_tgt_sc END           AS [계약진행률]
        FROM detail

        UNION ALL

        SELECT
            1 AS ord,
            NULL AS [연도], NULL AS [월],
            N'합계' AS [딜러], NULL AS [전시장], NULL AS [팀], NULL AS [SC], NULL AS [활동유형],
            SUM(act_tgt)  AS [활동목표],
            SUM(act_act)  AS [활동실적],
            CASE WHEN SUM(act_tgt)=0 THEN 1.0 ELSE CAST(SUM(act_act) AS float)/SUM(act_tgt) END      AS [활동진척률],
            CASE WHEN SUM(act_act)=0 THEN NULL ELSE CAST(SUM(lead_act) AS float)/SUM(act_act) END     AS [기회전환률],
            SUM(lead_tgt) AS [기회목표],
            SUM(lead_act) AS [기회실적],
            CASE WHEN SUM(lead_tgt)=0 THEN 0.0 ELSE CAST(SUM(lead_act) AS float)/SUM(lead_tgt) END    AS [기회진척률],
            CASE WHEN SUM(lead_act)=0 THEN NULL ELSE CAST(SUM(cntrct_act) AS float)/SUM(lead_act) END AS [계약전환률],
            SUM(CASE WHEN sc_first=1 THEN ISNULL(cntrct_tgt_sc,0) ELSE 0 END)                         AS [계약목표],
            SUM(cntrct_act) AS [계약실적],
            CASE WHEN SUM(CASE WHEN sc_first=1 THEN ISNULL(cntrct_tgt_sc,0) ELSE 0 END)=0 THEN NULL
                 ELSE CAST(SUM(CASE WHEN sc_first=1 THEN ISNULL(cntrct_act_sc,0) ELSE 0 END) AS float)
                      / SUM(CASE WHEN sc_first=1 THEN ISNULL(cntrct_tgt_sc,0) ELSE 0 END) END         AS [계약진행률]
        FROM detail
    ) AS final_result
    ORDER BY ord, [연도], [월], [딜러], [전시장], [팀], [SC], [활동유형];
END

/* ══════════════════════════════════════════════════════════════════════════
   [사용 가이드]
   ● 출력 그레인 = 연×월. [연도], [월] 컬럼이 맨 앞에 표시됨.
       @Year=2026, @MonthNumber=5 → 26년 5월 1행 세트
       @Year=2026, @MonthNumber=NULL → 26년 1~12월이 월별 행으로 나옴
       @Year=NULL → 전체 연도 월별 행 (@MonthNumber로 특정 월만 교차 선택 가능)
   ● 월별 로직: 각 월 행의 리드 오픈 판정(close_dt)·자격 활동 기간은 그 행의
       월초~월말 기준. 즉 v3의 한 달 행 = 원본 MTD 쿼리를 그 달로 실행한 결과.
   ● @ScName 3분기:
       NULL   → SC 열 없음. 연×월×딜러/전시장/팀×유형 레벨로 집계.
       N'ALL' → SC 열 표시 + 전체 SC.
       값     → SC 열 표시 + 해당 SC만. 콤마 다중 가능: N'강민성,강민석'
   ● 다중 값 슬라이서(브랜드/딜러/전시장/팀/재직/SC/활동유형):
       LIKE 패딩(',값1,값2,') 비교 → STRING_SPLIT 미사용(8623 방지).
       콤마 뒤 공백 자동 제거. 값 자체에 콤마가 든 데이터는 필터 불가.
   ● @metric: 컬럼은 항상 전부 계산됨. 에이전트가 필요한 컬럼만 골라 노출.
   ● 계약목