/* ── 파라미터 ──
   원본에서 파라미터 DECLARE 4개를 제거했다. mssql 드라이버가
   request.input()으로 바인딩해 주입한다(문자열 치환 금지).
     @year @month @common_tp_nm @tp_grp_1

   콤마 패딩 변수 0개에 CASE NULL 가드를 넣었다 — Fabric에서
   ',' + NULL + ',' 가 NULL이 아니라 ',,' 가 되어 "NULL=전체"가
   "NULL=결과 없음"으로 뒤집히기 때문이다(라이브로 확인된 문제).
   그 밖의 계산 로직과 페이지 고정 상수는 원문 그대로다. */

/* ===== 기간 ===== */
DECLARE @day INT = NULL; -- NULL이면 월말 기준 MTD, 특정 일자면 해당 일자까지 MTD

DECLARE @month_start DATE = DATEFROMPARTS(@year, @month, 1);
DECLARE @as_of_date DATE = CASE WHEN @day IS NULL THEN EOMONTH(@month_start) ELSE DATEFROMPARTS(@year, @month, @day) END;
DECLARE @ref_date DATE = @as_of_date;

/* ===== 출력 필터: NULL 또는 ''이면 전체 활동유형 ===== */

/* ===== 퍼널 페이지 고정 조건 ===== */
DECLARE @exclude_facade NVARCHAR(50) = N'창구SC';
DECLARE @exclude_name NVARCHAR(MAX) = N'고객지원팀,TOYOTA YM';
DECLARE @exclude_user_ids NVARCHAR(MAX) = NEXCLUDED_USER_ID_1,EXCLUDED_USER_ID_2;

/*
  브랜드/딜러/전시장/팀/SC 슬라이서 조건은 적용하지 않는다.
  퍼널 페이지의 고정 제외조건을 통과한 전체 SC만 사용한다.
*/
;WITH valid_user AS (
    SELECT DISTINCT U.sc_key
    FROM ktws.DIM_MNG_USER AS U
    WHERE ISNULL(U.facade_sc_yn, N'') COLLATE DATABASE_DEFAULT <> @exclude_facade COLLATE DATABASE_DEFAULT
      AND NOT EXISTS (SELECT 1 FROM STRING_SPLIT(@exclude_name, N',') AS X WHERE LTRIM(RTRIM(X.value)) COLLATE DATABASE_DEFAULT = U.name COLLATE DATABASE_DEFAULT)
      AND NOT EXISTS (SELECT 1 FROM STRING_SPLIT(@exclude_user_ids, N',') AS X WHERE LTRIM(RTRIM(X.value)) COLLATE DATABASE_DEFAULT = U.user_id COLLATE DATABASE_DEFAULT)
),
valid_common_type AS (
    SELECT T.tp_grp_1, T.common_tp_nm, MIN(O.tp_grp_1_order) AS grp_ord, MIN(O.tp_order) AS tp_ord
    FROM ktws.DIM_CRM_ACT_TYPE AS T
    LEFT JOIN ktws.DIM_CRM_ACT_TYPE_ORDER AS O ON T.common_tp_nm = O.common_tp_nm
    WHERE (NULLIF(LTRIM(RTRIM(@tp_grp_1)), N'') IS NULL OR EXISTS (SELECT 1 FROM STRING_SPLIT(@tp_grp_1, N',') AS X WHERE LTRIM(RTRIM(X.value)) COLLATE DATABASE_DEFAULT = T.tp_grp_1 COLLATE DATABASE_DEFAULT))
      AND (NULLIF(LTRIM(RTRIM(@common_tp_nm)), N'') IS NULL OR EXISTS (SELECT 1 FROM STRING_SPLIT(@common_tp_nm, N',') AS X WHERE LTRIM(RTRIM(X.value)) COLLATE DATABASE_DEFAULT = O.common_tp_nm COLLATE DATABASE_DEFAULT))
    GROUP BY T.tp_grp_1, T.common_tp_nm
),
valid_type AS (
    SELECT DISTINCT T.tp_key, T.tp_cd, T.tp_grp_1, T.common_tp_nm
    FROM ktws.DIM_CRM_ACT_TYPE AS T
    INNER JOIN valid_common_type AS VCT ON T.tp_grp_1 = VCT.tp_grp_1 AND T.common_tp_nm = VCT.common_tp_nm
),
frame_key AS (
    SELECT VU.sc_key, VCT.tp_grp_1, VCT.common_tp_nm
    FROM valid_user AS VU
    CROSS JOIN valid_common_type AS VCT
),

/* ===== 영업활동 ===== */
activity_actual AS (
    SELECT A.sc_key, VT.tp_grp_1, VT.common_tp_nm, SUM(ISNULL(A.actual_cnt, 0)) AS cnt
    FROM ktws.FCT_ACTIVITY_v2 AS A
    INNER JOIN valid_user AS VU ON A.sc_key = VU.sc_key
    INNER JOIN valid_type AS VT ON A.tp_key = VT.tp_key
    WHERE A.act_dt_fr >= @month_start AND A.act_dt_fr < DATEADD(DAY, 1, @as_of_date)
    GROUP BY A.sc_key, VT.tp_grp_1, VT.common_tp_nm
),
activity_target AS (
    SELECT TG.sc_key, VT.tp_grp_1, VT.common_tp_nm, SUM(ISNULL(TG.target_cnt, 0)) AS cnt
    FROM ktws.FCT_CRM_TARGET_D AS TG
    INNER JOIN valid_user AS VU ON TG.sc_key = VU.sc_key
    INNER JOIN valid_type AS VT ON TG.type_cd = VT.tp_key
    WHERE TG.daily_dt >= @month_start AND TG.daily_dt < DATEADD(DAY, 1, @as_of_date)
    GROUP BY TG.sc_key, VT.tp_grp_1, VT.common_tp_nm
),

/* ===== 영업기회 ===== */
lead_activity_seed AS (
    SELECT DISTINCT A.sc_key, VT.tp_grp_1, VT.common_tp_nm, A.lead_key
    FROM ktws.FCT_ACTIVITY_v2 AS A
    INNER JOIN valid_user AS VU ON A.sc_key = VU.sc_key
    INNER JOIN valid_type AS VT ON A.tp_key = VT.tp_key
    WHERE A.act_dt_fr >= @month_start AND A.act_dt_fr < DATEADD(DAY, 1, @as_of_date)
      AND A.act_result <> N'부재중'
      AND A.lead_key IS NOT NULL
),
lead_activity_pool AS (
    SELECT DISTINCT LAS.sc_key, LAS.tp_grp_1, LAS.common_tp_nm, G.lead_key
    FROM lead_activity_seed AS LAS
    INNER JOIN ktws.FCT_LEAD AS G ON LAS.lead_key = G.lead_key AND LAS.sc_key = G.cl_sc_key
    WHERE G.lead_reg_dt >= @month_start AND G.lead_reg_dt < DATEADD(DAY, 1, @as_of_date)
      AND (G.close_dt > @ref_date OR G.close_dt IS NULL OR G.last_retail_sales_dt IS NOT NULL)
),
lead_activity_count AS (
    SELECT G.cl_sc_key AS sc_key, ACT_TP.tp_grp_1, ACT_TP.common_tp_nm, COUNT(DISTINCT G.lead_key) AS cnt
    FROM ktws.FCT_LEAD AS G
    INNER JOIN valid_user AS VU ON G.cl_sc_key = VU.sc_key
    INNER JOIN (
        SELECT DISTINCT ACT.lead_key, ACT_B.tp_grp_1, ACT_B.common_tp_nm
        FROM ktws.FCT_ACTIVITY_v2 AS ACT
        INNER JOIN ktws.DIM_CRM_ACT_TYPE AS ACT_B ON ACT.tp_key = ACT_B.tp_key
        LEFT JOIN ktws.DIM_CRM_ACT_TYPE_ORDER AS ACT_F ON ACT_B.common_tp_nm = ACT_F.common_tp_nm
        WHERE ACT.act_dt_fr >= @month_start AND ACT.act_dt_fr < DATEADD(DAY, 1, @as_of_date)
          AND ACT.act_result <> N'부재중'
          AND ACT.lead_key IS NOT NULL
          AND (NULLIF(LTRIM(RTRIM(@tp_grp_1)), N'') IS NULL OR EXISTS (SELECT 1 FROM STRING_SPLIT(@tp_grp_1, N',') AS X WHERE LTRIM(RTRIM(X.value)) COLLATE DATABASE_DEFAULT = ACT_B.tp_grp_1 COLLATE DATABASE_DEFAULT))
          AND (NULLIF(LTRIM(RTRIM(@common_tp_nm)), N'') IS NULL OR EXISTS (SELECT 1 FROM STRING_SPLIT(@common_tp_nm, N',') AS X WHERE LTRIM(RTRIM(X.value)) COLLATE DATABASE_DEFAULT = ACT_F.common_tp_nm COLLATE DATABASE_DEFAULT))
    ) AS ACT_TP ON G.lead_key = ACT_TP.lead_key
    WHERE G.lead_reg_dt >= @month_start AND G.lead_reg_dt < DATEADD(DAY, 1, @as_of_date)
      AND (G.close_dt > @ref_date OR G.close_dt IS NULL OR G.last_retail_sales_dt IS NOT NULL)
    GROUP BY G.cl_sc_key, ACT_TP.tp_grp_1, ACT_TP.common_tp_nm
),
lead_total_count AS (
    SELECT G.cl_sc_key AS sc_key, B.tp_grp_1, F.common_tp_nm, SUM(NULLIF(G.cnt, 0)) AS cnt
    FROM ktws.FCT_LEAD AS G
    INNER JOIN valid_user AS VU ON G.cl_sc_key = VU.sc_key
    INNER JOIN ktws.DIM_CRM_ACT_TYPE AS B ON G.tp_key = B.tp_key
    INNER JOIN ktws.DIM_CRM_ACT_TYPE_ORDER AS F ON B.common_tp_nm = F.common_tp_nm
    WHERE G.lead_reg_dt >= @month_start AND G.lead_reg_dt < DATEADD(DAY, 1, @as_of_date)
      AND (NULLIF(LTRIM(RTRIM(@tp_grp_1)), N'') IS NULL OR EXISTS (SELECT 1 FROM STRING_SPLIT(@tp_grp_1, N',') AS X WHERE LTRIM(RTRIM(X.value)) COLLATE DATABASE_DEFAULT = B.tp_grp_1 COLLATE DATABASE_DEFAULT))
      AND (NULLIF(LTRIM(RTRIM(@common_tp_nm)), N'') IS NULL OR EXISTS (SELECT 1 FROM STRING_SPLIT(@common_tp_nm, N',') AS X WHERE LTRIM(RTRIM(X.value)) COLLATE DATABASE_DEFAULT = F.common_tp_nm COLLATE DATABASE_DEFAULT))
      AND (G.close_dt > @ref_date OR G.close_dt IS NULL OR G.last_retail_sales_dt IS NOT NULL)
    GROUP BY G.cl_sc_key, B.tp_grp_1, F.common_tp_nm
),
lead_target AS (
    SELECT TM.sc_key, VT.tp_grp_1, VT.common_tp_nm, SUM(ISNULL(TM.target_cnt, 0)) AS cnt
    FROM ktws.FCT_CRM_TARGET_M AS TM
    INNER JOIN valid_user AS VU ON TM.sc_key = VU.sc_key
    INNER JOIN valid_type AS VT ON TM.tp_key = VT.tp_key
    WHERE TM.monthly_dt >= @month_start AND TM.monthly_dt < DATEADD(DAY, 1, @as_of_date)
    GROUP BY TM.sc_key, VT.tp_grp_1, VT.common_tp_nm
),

/* ===== 계약 ===== */
contract_activity_count AS (
    SELECT I.cn_sc_key AS sc_key, LP.tp_grp_1, LP.common_tp_nm, SUM(ISNULL(I.cnt, 0)) AS cnt
    FROM ktws.FCT_CONTRACT_KTWS AS I
    INNER JOIN lead_activity_pool AS LP ON I.lead_key = LP.lead_key AND I.cn_sc_key = LP.sc_key
    WHERE I.contract_dt >= @month_start AND I.contract_dt < DATEADD(DAY, 1, @as_of_date)
    GROUP BY I.cn_sc_key, LP.tp_grp_1, LP.common_tp_nm
),
contract_total_count AS (
    SELECT I.cn_sc_key AS sc_key, SUM(ISNULL(I.cnt, 0)) AS cnt
    FROM ktws.FCT_CONTRACT_KTWS AS I
    INNER JOIN valid_user AS VU ON I.cn_sc_key = VU.sc_key
    WHERE I.contract_dt >= @month_start AND I.contract_dt < DATEADD(DAY, 1, @as_of_date)
    GROUP BY I.cn_sc_key
),
contract_target AS (
    SELECT TM.sc_key, SUM(ISNULL(TM.target_cnt, 0)) AS cnt
    FROM ktws.FCT_CRM_TARGET_M AS TM
    INNER JOIN valid_user AS VU ON TM.sc_key = VU.sc_key
    INNER JOIN ktws.DIM_CRM_ACT_TYPE AS T ON TM.tp_key = T.tp_key
    WHERE T.common_tp_nm = N'계약'
      AND TM.monthly_dt >= @month_start AND TM.monthly_dt < DATEADD(DAY, 1, @as_of_date)
    GROUP BY TM.sc_key
),
contract_progress_activity_seed AS (
    SELECT DISTINCT A.sc_key, VT.tp_grp_1, VT.common_tp_nm, A.lead_key
    FROM ktws.FCT_ACTIVITY_v2 AS A
    INNER JOIN valid_user AS VU ON A.sc_key = VU.sc_key
    INNER JOIN valid_type AS VT ON A.tp_key = VT.tp_key
    WHERE A.act_dt_fr >= @month_start AND A.act_dt_fr < DATEADD(DAY, 1, @as_of_date)
      AND (A.act_result <> N'부재중' OR A.act_result IS NULL)
      AND A.lead_key IS NOT NULL
),
contract_progress_lead_pool AS (
    SELECT DISTINCT A.sc_key, A.tp_grp_1, A.common_tp_nm, G.lead_key
    FROM contract_progress_activity_seed AS A
    INNER JOIN ktws.FCT_LEAD AS G ON A.lead_key = G.lead_key AND A.sc_key = G.cl_sc_key
    WHERE G.lead_reg_dt >= @month_start AND G.lead_reg_dt < DATEADD(DAY, 1, @as_of_date)
      AND (G.close_dt > EOMONTH(@as_of_date) OR G.close_dt IS NULL)
),
contract_progress_count AS (
    SELECT I.cn_sc_key AS sc_key, LP.tp_grp_1, LP.common_tp_nm, SUM(ISNULL(I.cnt, 0)) AS cnt
    FROM ktws.FCT_CONTRACT_KTWS AS I
    INNER JOIN contract_progress_lead_pool AS LP ON I.lead_key = LP.lead_key AND I.cn_sc_key = LP.sc_key
    WHERE I.contract_dt >= @month_start AND I.contract_dt < DATEADD(DAY, 1, @as_of_date)
    GROUP BY I.cn_sc_key, LP.tp_grp_1, LP.common_tp_nm
),

/* ===== 시승: 당월활동실적 기준 ===== */
td_activity_seed AS (
    SELECT DISTINCT A.sc_key, VT.tp_grp_1, VT.common_tp_nm, A.lead_key
    FROM ktws.FCT_ACTIVITY_v2 AS A
    INNER JOIN valid_user AS VU ON A.sc_key = VU.sc_key
    INNER JOIN valid_type AS VT ON A.tp_key = VT.tp_key
    WHERE A.act_dt_fr >= @month_start AND A.act_dt_fr < DATEADD(DAY, 1, @as_of_date)
      AND (A.act_result <> N'부재중' OR A.act_result IS NULL)
      AND (A.contact_tp <> N'MSG' OR A.contact_tp IS NULL)
      AND A.lead_key IS NOT NULL
),
td_lead_pool AS (
    SELECT DISTINCT TAS.sc_key, TAS.tp_grp_1, TAS.common_tp_nm, G.lead_key
    FROM td_activity_seed AS TAS
    INNER JOIN ktws.FCT_LEAD AS G ON TAS.lead_key = G.lead_key AND TAS.sc_key = G.cl_sc_key
    WHERE G.lead_reg_dt >= @month_start AND G.lead_reg_dt < DATEADD(DAY, 1, @as_of_date)
      AND (G.close_dt > @ref_date OR G.close_dt IS NULL OR G.last_retail_sales_dt IS NOT NULL)
),
td_completed_lead_match AS (
    SELECT A.sc_key, TLP.tp_grp_1, TLP.common_tp_nm, COUNT(DISTINCT A.lead_key) AS cnt
    FROM ktws.FCT_ACTIVITY_v2 AS A
    INNER JOIN td_lead_pool AS TLP ON A.lead_key = TLP.lead_key AND A.sc_key = TLP.sc_key
    WHERE A.act_dt_fr >= @month_start AND A.act_dt_fr < DATEADD(DAY, 1, @as_of_date)
      AND A.act_tp = N'P113'
      AND A.act_result = N'시승완료'
      AND A.lead_key IS NOT NULL
    GROUP BY A.sc_key, TLP.tp_grp_1, TLP.common_tp_nm
),
td_form_without_cancel AS (
    SELECT A.sc_key, TLP.tp_grp_1, TLP.common_tp_nm, SUM(ISNULL(A.actual_cnt, 0)) AS cnt
    FROM ktws.FCT_ACTIVITY_v2 AS A
    INNER JOIN td_lead_pool AS TLP ON A.lead_key = TLP.lead_key AND A.sc_key = TLP.sc_key
    WHERE A.act_dt_fr >= @month_start AND A.act_dt_fr < DATEADD(DAY, 1, @as_of_date)
      AND A.act_tp = N'P113'
      AND (A.act_result <> N'시승취소' OR A.act_result IS NULL)
      AND A.lead_key IS NOT NULL
    GROUP BY A.sc_key, TLP.tp_grp_1, TLP.common_tp_nm
),

/* ===== 시승: 당월전체실적 기준 ===== */
lead_set_all_calendar AS (
    SELECT DISTINCT G.cl_sc_key AS sc_key, VT.tp_grp_1, VT.common_tp_nm, G.lead_key
    FROM ktws.FCT_LEAD AS G
    INNER JOIN valid_user AS VU ON G.cl_sc_key = VU.sc_key
    INNER JOIN valid_type AS VT ON G.tp_key = VT.tp_key
    WHERE G.lead_key IS NOT NULL
),
td_total_lead_distinct AS (
    SELECT A.sc_key, LS.tp_grp_1, LS.common_tp_nm, COUNT(DISTINCT A.lead_key) AS cnt
    FROM ktws.FCT_ACTIVITY_v2 AS A
    INNER JOIN lead_set_all_calendar AS LS ON A.lead_key = LS.lead_key AND A.sc_key = LS.sc_key
    WHERE A.act_dt_fr >= @month_start AND A.act_dt_fr < DATEADD(DAY, 1, @as_of_date)
      AND A.act_tp = N'P113'
      AND A.act_result = N'시승완료'
      AND A.lead_key IS NOT NULL
    GROUP BY A.sc_key, LS.tp_grp_1, LS.common_tp_nm
),
td_total_actual_sum AS (
    SELECT A.sc_key, LS.tp_grp_1, LS.common_tp_nm, SUM(ISNULL(A.actual_cnt, 0)) AS cnt
    FROM ktws.FCT_ACTIVITY_v2 AS A
    INNER JOIN lead_set_all_calendar AS LS ON A.lead_key = LS.lead_key AND A.sc_key = LS.sc_key
    WHERE A.act_dt_fr >= @month_start AND A.act_dt_fr < DATEADD(DAY, 1, @as_of_date)
      AND A.act_tp = N'P113'
      AND A.act_result = N'시승완료'
      AND A.lead_key IS NOT NULL
    GROUP BY A.sc_key, LS.tp_grp_1, LS.common_tp_nm
),
td_target AS (
    SELECT TD.sc_key, SUM(ISNULL(TD.target_cnt, 0)) AS cnt
    FROM ktws.FCT_CRM_TARGET_D AS TD
    INNER JOIN valid_user AS VU ON TD.sc_key = VU.sc_key
    INNER JOIN ktws.DIM_CRM_ACT_TYPE AS T ON TD.type_cd = T.tp_key
    WHERE T.tp_cd = N'P113'
      AND TD.daily_dt >= @month_start AND TD.daily_dt < DATEADD(DAY, 1, @as_of_date)
    GROUP BY TD.sc_key
),

/* ===== 시승 -> 계약 ===== */
contract_td_pool AS (
    SELECT DISTINCT LAS.sc_key, LAS.tp_grp_1, LAS.common_tp_nm, G.lead_key
    FROM lead_activity_seed AS LAS
    INNER JOIN ktws.FCT_LEAD AS G ON LAS.lead_key = G.lead_key AND LAS.sc_key = G.cl_sc_key
    WHERE G.lead_reg_dt >= @month_start AND G.lead_reg_dt < DATEADD(DAY, 1, @as_of_date)
      AND G.td_yn = N'Y'
      AND (G.close_dt > @ref_date OR G.close_dt IS NULL OR G.last_retail_sales_dt IS NOT NULL)
),
contract_td_activity_count AS (
    SELECT I.cn_sc_key AS sc_key, CTP.tp_grp_1, CTP.common_tp_nm, SUM(ISNULL(I.cnt, 0)) AS cnt
    FROM ktws.FCT_CONTRACT_KTWS AS I
    INNER JOIN contract_td_pool AS CTP ON I.lead_key = CTP.lead_key AND I.cn_sc_key = CTP.sc_key
    WHERE I.contract_dt >= @month_start AND I.contract_dt < DATEADD(DAY, 1, @as_of_date)
    GROUP BY I.cn_sc_key, CTP.tp_grp_1, CTP.common_tp_nm
),
td_completed_total_leads AS (
    SELECT DISTINCT A.sc_key, LS.tp_grp_1, LS.common_tp_nm, A.lead_key
    FROM ktws.FCT_ACTIVITY_v2 AS A
    INNER JOIN lead_set_all_calendar AS LS ON A.lead_key = LS.lead_key AND A.sc_key = LS.sc_key
    WHERE A.act_dt_fr >= @month_start AND A.act_dt_fr < DATEADD(DAY, 1, @as_of_date)
      AND A.act_tp = N'P113'
      AND A.act_result = N'시승완료'
      AND A.lead_key IS NOT NULL
),
contract_td_total_count AS (
    SELECT I.cn_sc_key AS sc_key, TL.tp_grp_1, TL.common_tp_nm, SUM(ISNULL(I.cnt, 0)) AS cnt
    FROM ktws.FCT_CONTRACT_KTWS AS I
    INNER JOIN td_completed_total_leads AS TL ON I.lead_key = TL.lead_key AND I.cn_sc_key = TL.sc_key
    WHERE I.contract_dt >= @month_start AND I.contract_dt < DATEADD(DAY, 1, @as_of_date)
    GROUP BY I.cn_sc_key, TL.tp_grp_1, TL.common_tp_nm
),


type_result_raw AS (
SELECT FK.tp_grp_1 AS [활동유형분류],
       FK.common_tp_nm AS [활동유형],
       SUM(CAST(COALESCE(AA.cnt, 0) AS BIGINT)) AS [영업활동 건 수],
       SUM(CAST(COALESCE(AT.cnt, 0) AS BIGINT)) AS [영업활동 당월 목표],
       SUM(CAST(COALESCE(LAC.cnt, 0) AS BIGINT)) AS [영업기회 건 수(당월활동실적)],
       SUM(CAST(COALESCE(LTC.cnt, 0) AS BIGINT)) AS [영업기회 건 수(당월전체실적)],
       SUM(CAST(COALESCE(LT.cnt, 0) AS BIGINT)) AS [영업기회 당월 목표],
       SUM(CAST(COALESCE(CAC.cnt, 0) AS BIGINT)) AS [계약건수(당월활동실적)],
       SUM(CAST(COALESCE(CTC.cnt, 0) AS BIGINT)) AS [계약건수(당월전체실적)],
       SUM(CAST(COALESCE(CT.cnt, 0) AS BIGINT)) AS [계약 당월 목표],
       SUM(CAST(COALESCE(CPC.cnt, 0) AS BIGINT)) AS [계약 진행 실적],
       SUM(CAST(COALESCE(TDCLM.cnt, 0) AS BIGINT)) AS [시승건수(당월활동실적/시승완료)],
       SUM(CAST(COALESCE(TDFC.cnt, 0) AS BIGINT)) AS [시승건수(당월활동실적/시승취소건 제외)],
       SUM(CAST(COALESCE(TDTLD.cnt, 0) AS BIGINT)) AS [시승건수(당월전체실적/lead_key 기준)],
       SUM(CAST(COALESCE(TDTAS.cnt, 0) AS BIGINT)) AS [시승건수(당월전체실적/actual_cnt 기준)],
       SUM(CAST(COALESCE(TDT.cnt, 0) AS BIGINT)) AS [시승 당월 목표],
       SUM(CAST(COALESCE(CTDAC.cnt, 0) AS BIGINT)) AS [시승에서 계약으로 당월활동실적],
       SUM(CAST(COALESCE(CTDTC.cnt, 0) AS BIGINT)) AS [시승에서 계약으로 당월전체실적],
       MIN(CAST(SORT.grp_ord AS INT)) AS _grp_ord,
       MIN(CAST(SORT.tp_ord AS INT)) AS _tp_ord
FROM frame_key AS FK
LEFT JOIN activity_actual AS AA ON FK.sc_key = AA.sc_key AND FK.tp_grp_1 = AA.tp_grp_1 AND FK.common_tp_nm = AA.common_tp_nm
LEFT JOIN activity_target AS AT ON FK.sc_key = AT.sc_key AND FK.tp_grp_1 = AT.tp_grp_1 AND FK.common_tp_nm = AT.common_tp_nm
LEFT JOIN lead_activity_count AS LAC ON FK.sc_key = LAC.sc_key AND FK.tp_grp_1 = LAC.tp_grp_1 AND FK.common_tp_nm = LAC.common_tp_nm
LEFT JOIN lead_total_count AS LTC ON FK.sc_key = LTC.sc_key AND FK.tp_grp_1 = LTC.tp_grp_1 AND FK.common_tp_nm = LTC.common_tp_nm
LEFT JOIN lead_target AS LT ON FK.sc_key = LT.sc_key AND FK.tp_grp_1 = LT.tp_grp_1 AND FK.common_tp_nm = LT.common_tp_nm
LEFT JOIN contract_activity_count AS CAC ON FK.sc_key = CAC.sc_key AND FK.tp_grp_1 = CAC.tp_grp_1 AND FK.common_tp_nm = CAC.common_tp_nm
LEFT JOIN contract_total_count AS CTC ON FK.sc_key = CTC.sc_key
LEFT JOIN contract_target AS CT ON FK.sc_key = CT.sc_key
LEFT JOIN contract_progress_count AS CPC ON FK.sc_key = CPC.sc_key AND FK.tp_grp_1 = CPC.tp_grp_1 AND FK.common_tp_nm = CPC.common_tp_nm
LEFT JOIN td_completed_lead_match AS TDCLM ON FK.sc_key = TDCLM.sc_key AND FK.tp_grp_1 = TDCLM.tp_grp_1 AND FK.common_tp_nm = TDCLM.common_tp_nm
LEFT JOIN td_form_without_cancel AS TDFC ON FK.sc_key = TDFC.sc_key AND FK.tp_grp_1 = TDFC.tp_grp_1 AND FK.common_tp_nm = TDFC.common_tp_nm
LEFT JOIN td_total_lead_distinct AS TDTLD ON FK.sc_key = TDTLD.sc_key AND FK.tp_grp_1 = TDTLD.tp_grp_1 AND FK.common_tp_nm = TDTLD.common_tp_nm
LEFT JOIN td_total_actual_sum AS TDTAS ON FK.sc_key = TDTAS.sc_key AND FK.tp_grp_1 = TDTAS.tp_grp_1 AND FK.common_tp_nm = TDTAS.common_tp_nm
LEFT JOIN td_target AS TDT ON FK.sc_key = TDT.sc_key
LEFT JOIN contract_td_activity_count AS CTDAC ON FK.sc_key = CTDAC.sc_key AND FK.tp_grp_1 = CTDAC.tp_grp_1 AND FK.common_tp_nm = CTDAC.common_tp_nm
LEFT JOIN contract_td_total_count AS CTDTC ON FK.sc_key = CTDTC.sc_key AND FK.tp_grp_1 = CTDTC.tp_grp_1 AND FK.common_tp_nm = CTDTC.common_tp_nm
LEFT JOIN valid_common_type AS SORT ON FK.tp_grp_1 = SORT.tp_grp_1 AND FK.common_tp_nm = SORT.common_tp_nm
GROUP BY FK.tp_grp_1, FK.common_tp_nm
),
type_group_total_raw AS (
SELECT [활동유형분류],
       N'전체' AS [활동유형],
       SUM([영업활동 건 수]) AS [영업활동 건 수],
       SUM([영업활동 당월 목표]) AS [영업활동 당월 목표],
       SUM([영업기회 건 수(당월활동실적)]) AS [영업기회 건 수(당월활동실적)],
       SUM([영업기회 건 수(당월전체실적)]) AS [영업기회 건 수(당월전체실적)],
       SUM([영업기회 당월 목표]) AS [영업기회 당월 목표],
       SUM([계약건수(당월활동실적)]) AS [계약건수(당월활동실적)],
       MAX([계약건수(당월전체실적)]) AS [계약건수(당월전체실적)],
       MAX([계약 당월 목표]) AS [계약 당월 목표],
       SUM([계약 진행 실적]) AS [계약 진행 실적],
       SUM([시승건수(당월활동실적/시승완료)]) AS [시승건수(당월활동실적/시승완료)],
       SUM([시승건수(당월활동실적/시승취소건 제외)]) AS [시승건수(당월활동실적/시승취소건 제외)],
       SUM([시승건수(당월전체실적/lead_key 기준)]) AS [시승건수(당월전체실적/lead_key 기준)],
       SUM([시승건수(당월전체실적/actual_cnt 기준)]) AS [시승건수(당월전체실적/actual_cnt 기준)],
       MAX([시승 당월 목표]) AS [시승 당월 목표],
       SUM([시승에서 계약으로 당월활동실적]) AS [시승에서 계약으로 당월활동실적],
       SUM([시승에서 계약으로 당월전체실적]) AS [시승에서 계약으로 당월전체실적],
       MIN(_grp_ord) AS _grp_ord,
       CAST(NULL AS INT) AS _tp_ord
FROM type_result_raw
GROUP BY [활동유형분류]
),
final_raw AS (
    SELECT T.*, CAST(0 AS INT) AS _row_order
    FROM type_group_total_raw AS T

    UNION ALL

    SELECT T.*, CAST(1 AS INT) AS _row_order
    FROM type_result_raw AS T
)
SELECT [활동유형분류],
       [활동유형],
       [영업활동 건 수],
       [영업활동 당월 목표],
       FORMAT(CASE WHEN [영업활동 당월 목표] = 0 THEN CAST(0 AS DECIMAL(38, 10)) ELSE CAST([영업활동 건 수] AS DECIMAL(38, 10)) / CAST([영업활동 당월 목표] AS DECIMAL(38, 10)) END, '0.00%') AS [영업활동 진행률],
       FORMAT(CASE WHEN [영업활동 건 수] = 0 THEN CAST(0 AS DECIMAL(38, 10)) ELSE CAST([영업기회 건 수(당월활동실적)] AS DECIMAL(38, 10)) / CAST([영업활동 건 수] AS DECIMAL(38, 10)) END, '0.00%') AS [영업활동에서 영업기회로의 전환율],
       [영업기회 건 수(당월활동실적)],
       [영업기회 건 수(당월전체실적)],
       [영업기회 당월 목표],
       FORMAT(CASE WHEN [영업기회 당월 목표] = 0 THEN CAST(0 AS DECIMAL(38, 10)) ELSE CAST([영업기회 건 수(당월활동실적)] AS DECIMAL(38, 10)) / CAST([영업기회 당월 목표] AS DECIMAL(38, 10)) END, '0.00%') AS [영업기회 진행률],
       FORMAT(CASE WHEN [영업기회 건 수(당월활동실적)] = 0 THEN CAST(0 AS DECIMAL(38, 10)) ELSE CAST([계약건수(당월활동실적)] AS DECIMAL(38, 10)) / CAST([영업기회 건 수(당월활동실적)] AS DECIMAL(38, 10)) END, '0.00%') AS [영업기회에서 계약으로 전환율],
       [계약건수(당월활동실적)],
       [계약건수(당월전체실적)],
       [계약 당월 목표],
       FORMAT(CASE WHEN [계약 당월 목표] = 0 THEN CAST(0 AS DECIMAL(38, 10)) ELSE CAST([계약 진행 실적] AS DECIMAL(38, 10)) / CAST([계약 당월 목표] AS DECIMAL(38, 10)) END, '0.00%') AS [계약 진행률],
       FORMAT(CASE WHEN [영업기회 건 수(당월활동실적)] = 0 THEN CAST(0 AS DECIMAL(38, 10)) ELSE CAST([시승건수(당월활동실적/시승완료)] AS DECIMAL(38, 10)) / CAST([영업기회 건 수(당월활동실적)] AS DECIMAL(38, 10)) END, '0.00%') AS [영업기회에서 시승으로 전환율],
       [시승건수(당월활동실적/시승완료)],
       [시승건수(당월활동실적/시승취소건 제외)],
       [시승건수(당월전체실적/lead_key 기준)],
       [시승건수(당월전체실적/actual_cnt 기준)],
       [시승 당월 목표],
       FORMAT(CASE WHEN [시승 당월 목표] = 0 THEN CAST(0 AS DECIMAL(38, 10)) ELSE CAST([시승건수(당월전체실적/actual_cnt 기준)] AS DECIMAL(38, 10)) / CAST([시승 당월 목표] AS DECIMAL(38, 10)) END, '0.00%') AS [시승 진행률],
       FORMAT(CASE WHEN [시승건수(당월활동실적/시승완료)] = 0 THEN CAST(0 AS DECIMAL(38, 10)) ELSE CAST([시승에서 계약으로 당월활동실적] AS DECIMAL(38, 10)) / CAST([시승건수(당월활동실적/시승완료)] AS DECIMAL(38, 10)) END, '0.00%') AS [시승에서 계약으로 전환율],
       [시승에서 계약으로 당월활동실적],
       [시승에서 계약으로 당월전체실적]
FROM final_raw
ORDER BY _grp_ord, _row_order, _tp_ord, [활동유형분류], [활동유형];