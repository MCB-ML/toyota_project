/* ── 파라미터 ──
   원본(docs/퍼널 쿼리.txt)의 파라미터 DECLARE를 제거했다. 아래 값들은 mssql 드라이버가
   request.input()으로 바인딩해 주입한다(문자열 치환 금지).
     @year @month @day @brand @dealer_nm @group_name @dept_nm @active_yn @sc_name @common_tp_nm
   NULL 또는 ''이면 전체. @sc_name은 'ALL'이면 SC 전체를 각각 표시한다.
   페이지 고정 상수(@tp_grp_1 / @exclude_*)와 파생 변수(@month_start/@as_of_date/@ref_date/
   @sc_filter)는 원문 그대로 남겨 둔다. 그 밖의 모든 줄은 손대지 않았다. */

/* ===== 기간 ===== */

DECLARE @month_start DATE = DATEFROMPARTS(@year, @month, 1);
DECLARE @as_of_date DATE = CASE WHEN @day IS NULL THEN EOMONTH(@month_start) ELSE DATEFROMPARTS(@year, @month, @day) END;
DECLARE @ref_date DATE = @as_of_date;

/* ===== 슬라이서: NULL 또는 ''이면 전체 ===== */

/* ===== 퍼널 페이지 고정 조건 ===== */
DECLARE @tp_grp_1 NVARCHAR(MAX) = N'관계형성,기회창출';
DECLARE @exclude_facade NVARCHAR(50) = N'창구SC';
DECLARE @exclude_name NVARCHAR(MAX) = N'고객지원팀,TOYOTA YM';
DECLARE @exclude_user_ids NVARCHAR(MAX) = NEXCLUDED_USER_ID_1,EXCLUDED_USER_ID_2;

DECLARE @sc_filter NVARCHAR(MAX) = CASE WHEN @sc_name IS NULL OR LTRIM(RTRIM(@sc_name)) = N'' OR UPPER(LTRIM(RTRIM(@sc_name))) = N'ALL' THEN NULL ELSE @sc_name END;

;WITH valid_user AS (
    SELECT DISTINCT U.sc_key, U.BRAND AS brand_nm, D.dealer_nm, U.group_name, U.dept_nm, U.name AS sc_name
    FROM ktws.DIM_MNG_USER AS U
    LEFT JOIN ktws.DIM_MNG_DEALER AS D ON U.dealer_key = D.dealer_key
    WHERE ISNULL(U.facade_sc_yn, N'') COLLATE DATABASE_DEFAULT <> @exclude_facade COLLATE DATABASE_DEFAULT
      AND NOT EXISTS (SELECT 1 FROM STRING_SPLIT(@exclude_name, N',') AS X WHERE LTRIM(RTRIM(X.value)) COLLATE DATABASE_DEFAULT = U.name COLLATE DATABASE_DEFAULT)
      AND NOT EXISTS (SELECT 1 FROM STRING_SPLIT(@exclude_user_ids, N',') AS X WHERE LTRIM(RTRIM(X.value)) COLLATE DATABASE_DEFAULT = U.user_id COLLATE DATABASE_DEFAULT)
      AND (NULLIF(LTRIM(RTRIM(@brand)), N'') IS NULL OR EXISTS (SELECT 1 FROM STRING_SPLIT(@brand, N',') AS X WHERE LTRIM(RTRIM(X.value)) COLLATE DATABASE_DEFAULT = U.BRAND COLLATE DATABASE_DEFAULT))
      AND (NULLIF(LTRIM(RTRIM(@dealer_nm)), N'') IS NULL OR EXISTS (SELECT 1 FROM STRING_SPLIT(@dealer_nm, N',') AS X WHERE LTRIM(RTRIM(X.value)) COLLATE DATABASE_DEFAULT = D.dealer_nm COLLATE DATABASE_DEFAULT))
      AND (NULLIF(LTRIM(RTRIM(@group_name)), N'') IS NULL OR EXISTS (SELECT 1 FROM STRING_SPLIT(@group_name, N',') AS X WHERE LTRIM(RTRIM(X.value)) COLLATE DATABASE_DEFAULT = U.group_name COLLATE DATABASE_DEFAULT))
      AND (NULLIF(LTRIM(RTRIM(@dept_nm)), N'') IS NULL OR EXISTS (SELECT 1 FROM STRING_SPLIT(@dept_nm, N',') AS X WHERE LTRIM(RTRIM(X.value)) COLLATE DATABASE_DEFAULT = U.dept_nm COLLATE DATABASE_DEFAULT))
      AND (NULLIF(LTRIM(RTRIM(@active_yn)), N'') IS NULL OR EXISTS (SELECT 1 FROM STRING_SPLIT(@active_yn, N',') AS X WHERE LTRIM(RTRIM(X.value)) COLLATE DATABASE_DEFAULT = U.active_yn COLLATE DATABASE_DEFAULT))
      AND (@sc_filter IS NULL OR EXISTS (SELECT 1 FROM STRING_SPLIT(@sc_filter, N',') AS X WHERE LTRIM(RTRIM(X.value)) COLLATE DATABASE_DEFAULT = U.name COLLATE DATABASE_DEFAULT))
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
/* DAX에 활동유형분류 조건이 없는 측정식의 외부 유형 컨텍스트: 활동유형 슬라이서만 반영 */
selected_type AS (
    SELECT DISTINCT T.tp_key, T.tp_cd, T.tp_grp_1, T.common_tp_nm
    FROM ktws.DIM_CRM_ACT_TYPE AS T
    LEFT JOIN ktws.DIM_CRM_ACT_TYPE_ORDER AS O ON T.common_tp_nm = O.common_tp_nm
    WHERE NULLIF(LTRIM(RTRIM(@common_tp_nm)), N'') IS NULL
       OR EXISTS (SELECT 1 FROM STRING_SPLIT(@common_tp_nm, N',') AS X WHERE LTRIM(RTRIM(X.value)) COLLATE DATABASE_DEFAULT = O.common_tp_nm COLLATE DATABASE_DEFAULT)
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
      AND (A.act_result <> N'부재중' OR A.act_result IS NULL)
      AND A.lead_key IS NOT NULL
),
lead_activity_pool AS (
    SELECT DISTINCT LAS.sc_key, LAS.tp_grp_1, LAS.common_tp_nm, G.lead_key
    FROM lead_activity_seed AS LAS
    INNER JOIN ktws.FCT_LEAD AS G ON LAS.lead_key = G.lead_key AND LAS.sc_key = G.cl_sc_key
    INNER JOIN valid_type AS GVT ON G.tp_key = GVT.tp_key AND GVT.tp_grp_1 = LAS.tp_grp_1 AND GVT.common_tp_nm = LAS.common_tp_nm
    WHERE G.lead_reg_dt >= @month_start AND G.lead_reg_dt < DATEADD(DAY, 1, @as_of_date)
      AND (G.close_dt > @ref_date OR G.close_dt IS NULL OR G.last_retail_sales_dt IS NOT NULL)
),
lead_activity_count AS (
    SELECT G.cl_sc_key AS sc_key, VT.tp_grp_1, VT.common_tp_nm, COUNT(DISTINCT G.lead_key) AS cnt
    FROM ktws.FCT_LEAD AS G
    INNER JOIN valid_user AS VU ON G.cl_sc_key = VU.sc_key
    INNER JOIN valid_type AS VT ON G.tp_key = VT.tp_key
    WHERE G.lead_reg_dt >= @month_start AND G.lead_reg_dt < DATEADD(DAY, 1, @as_of_date)
      AND (G.close_dt > @ref_date OR G.close_dt IS NULL OR G.last_retail_sales_dt IS NOT NULL)
      AND EXISTS (
          SELECT 1
          FROM ktws.FCT_ACTIVITY_v2 AS A
          INNER JOIN valid_type AS AVT ON A.tp_key = AVT.tp_key
          WHERE A.lead_key = G.lead_key
            AND A.sc_key = G.cl_sc_key
            AND A.act_dt_fr >= @month_start AND A.act_dt_fr < DATEADD(DAY, 1, @as_of_date)
            AND (A.act_result <> N'부재중' OR A.act_result IS NULL)
            AND A.lead_key IS NOT NULL
            AND AVT.tp_grp_1 = VT.tp_grp_1
            AND AVT.common_tp_nm = VT.common_tp_nm
      )
    GROUP BY G.cl_sc_key, VT.tp_grp_1, VT.common_tp_nm
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
    INNER JOIN valid_type AS IVT ON I.tp_key = IVT.tp_key AND IVT.tp_grp_1 = LP.tp_grp_1 AND IVT.common_tp_nm = LP.common_tp_nm
    WHERE I.contract_dt >= @month_start AND I.contract_dt < DATEADD(DAY, 1, @as_of_date)
    GROUP BY I.cn_sc_key, LP.tp_grp_1, LP.common_tp_nm
),
contract_total_count AS (
    SELECT I.cn_sc_key AS sc_key, VT.tp_grp_1, VT.common_tp_nm, SUM(ISNULL(I.cnt, 0)) AS cnt
    FROM ktws.FCT_CONTRACT_KTWS AS I
    INNER JOIN valid_user AS VU ON I.cn_sc_key = VU.sc_key
    INNER JOIN valid_type AS VT ON I.tp_key = VT.tp_key
    WHERE I.contract_dt >= @month_start AND I.contract_dt < DATEADD(DAY, 1, @as_of_date)
    GROUP BY I.cn_sc_key, VT.tp_grp_1, VT.common_tp_nm
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
    INNER JOIN valid_type AS GVT ON G.tp_key = GVT.tp_key AND GVT.tp_grp_1 = A.tp_grp_1 AND GVT.common_tp_nm = A.common_tp_nm
    WHERE G.lead_reg_dt >= @month_start AND G.lead_reg_dt < DATEADD(DAY, 1, @as_of_date)
      AND (G.close_dt > EOMONTH(@as_of_date) OR G.close_dt IS NULL)
),
contract_progress_count AS (
    SELECT I.cn_sc_key AS sc_key, LP.tp_grp_1, LP.common_tp_nm, SUM(ISNULL(I.cnt, 0)) AS cnt
    FROM ktws.FCT_CONTRACT_KTWS AS I
    INNER JOIN contract_progress_lead_pool AS LP ON I.lead_key = LP.lead_key AND I.cn_sc_key = LP.sc_key
    INNER JOIN valid_type AS IVT ON I.tp_key = IVT.tp_key AND IVT.tp_grp_1 = LP.tp_grp_1 AND IVT.common_tp_nm = LP.common_tp_nm
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
    INNER JOIN valid_type AS GVT ON G.tp_key = GVT.tp_key AND GVT.tp_grp_1 = TAS.tp_grp_1 AND GVT.common_tp_nm = TAS.common_tp_nm
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
    INNER JOIN valid_type AS GVT ON G.tp_key = GVT.tp_key AND GVT.tp_grp_1 = LAS.tp_grp_1 AND GVT.common_tp_nm = LAS.common_tp_nm
    WHERE G.lead_reg_dt >= @month_start AND G.lead_reg_dt < DATEADD(DAY, 1, @as_of_date)
      AND G.td_yn = N'Y'
      AND (G.close_dt > @ref_date OR G.close_dt IS NULL OR G.last_retail_sales_dt IS NOT NULL)
),
contract_td_activity_count AS (
    SELECT I.cn_sc_key AS sc_key, CTP.tp_grp_1, CTP.common_tp_nm, SUM(ISNULL(I.cnt, 0)) AS cnt
    FROM ktws.FCT_CONTRACT_KTWS AS I
    INNER JOIN contract_td_pool AS CTP ON I.lead_key = CTP.lead_key AND I.cn_sc_key = CTP.sc_key
    INNER JOIN valid_type AS IVT ON I.tp_key = IVT.tp_key AND IVT.tp_grp_1 = CTP.tp_grp_1 AND IVT.common_tp_nm = CTP.common_tp_nm
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
    INNER JOIN valid_type AS IVT ON I.tp_key = IVT.tp_key AND IVT.tp_grp_1 = TL.tp_grp_1 AND IVT.common_tp_nm = TL.common_tp_nm
    WHERE I.contract_dt >= @month_start AND I.contract_dt < DATEADD(DAY, 1, @as_of_date)
    GROUP BY I.cn_sc_key, TL.tp_grp_1, TL.common_tp_nm
),

/* ===== 모든 필터가 '전체'인 행: 세부 ROW 합산이 아니라 원본 식 재계산 ===== */
overall_activity_actual AS (
    SELECT SUM(ISNULL(A.actual_cnt, 0)) AS cnt
    FROM ktws.FCT_ACTIVITY_v2 AS A
    INNER JOIN valid_user AS VU ON A.sc_key = VU.sc_key
    INNER JOIN valid_type AS VT ON A.tp_key = VT.tp_key
    WHERE A.act_dt_fr >= @month_start AND A.act_dt_fr < DATEADD(DAY, 1, @as_of_date)
),
overall_activity_target AS (
    SELECT SUM(ISNULL(TG.target_cnt, 0)) AS cnt
    FROM ktws.FCT_CRM_TARGET_D AS TG
    INNER JOIN valid_user AS VU ON TG.sc_key = VU.sc_key
    INNER JOIN valid_type AS VT ON TG.type_cd = VT.tp_key
    WHERE TG.daily_dt >= @month_start AND TG.daily_dt < DATEADD(DAY, 1, @as_of_date)
),
overall_lead_activity_pool AS (
    SELECT DISTINCT G.lead_key
    FROM ktws.FCT_LEAD AS G
    INNER JOIN valid_user AS VU ON G.cl_sc_key = VU.sc_key
    LEFT JOIN selected_type AS GST ON G.tp_key = GST.tp_key
    WHERE G.lead_reg_dt >= @month_start AND G.lead_reg_dt < DATEADD(DAY, 1, @as_of_date)
      AND (NULLIF(LTRIM(RTRIM(@common_tp_nm)), N'') IS NULL OR GST.tp_key IS NOT NULL)
      AND EXISTS (
          SELECT 1
          FROM ktws.FCT_ACTIVITY_v2 AS A
          INNER JOIN valid_user AS AVU ON A.sc_key = AVU.sc_key
          INNER JOIN valid_type AS AVT ON A.tp_key = AVT.tp_key
          WHERE A.lead_key = G.lead_key
            AND A.act_dt_fr >= @month_start AND A.act_dt_fr < DATEADD(DAY, 1, @as_of_date)
            AND (A.act_result <> N'부재중' OR A.act_result IS NULL)
            AND A.lead_key IS NOT NULL
      )
      AND (G.close_dt > EOMONTH(@as_of_date) OR G.close_dt IS NULL OR G.last_retail_sales_dt IS NOT NULL)
),
overall_lead_activity_count AS (
    SELECT COUNT(DISTINCT lead_key) AS cnt
    FROM overall_lead_activity_pool
),
overall_lead_total_count AS (
    SELECT SUM(ISNULL(G.cnt, 0)) AS cnt
    FROM ktws.FCT_LEAD AS G
    INNER JOIN valid_user AS VU ON G.cl_sc_key = VU.sc_key
    LEFT JOIN selected_type AS GST ON G.tp_key = GST.tp_key
    WHERE G.lead_reg_dt >= @month_start AND G.lead_reg_dt < DATEADD(DAY, 1, @as_of_date)
      AND (NULLIF(LTRIM(RTRIM(@common_tp_nm)), N'') IS NULL OR GST.tp_key IS NOT NULL)
      AND (G.close_dt > EOMONTH(@as_of_date) OR G.close_dt IS NULL OR G.last_retail_sales_dt IS NOT NULL)
),
overall_lead_target AS (
    SELECT SUM(ISNULL(TM.target_cnt, 0)) AS cnt
    FROM ktws.FCT_CRM_TARGET_M AS TM
    INNER JOIN valid_user AS VU ON TM.sc_key = VU.sc_key
    INNER JOIN valid_type AS VT ON TM.tp_key = VT.tp_key
    WHERE TM.monthly_dt >= @month_start AND TM.monthly_dt < DATEADD(DAY, 1, @as_of_date)
),
overall_contract_activity_count AS (
    SELECT SUM(ISNULL(I.cnt, 0)) AS cnt
    FROM ktws.FCT_CONTRACT_KTWS AS I
    INNER JOIN valid_user AS VU ON I.cn_sc_key = VU.sc_key
    LEFT JOIN selected_type AS IST ON I.tp_key = IST.tp_key
    INNER JOIN overall_lead_activity_pool AS LP ON I.lead_key = LP.lead_key
    WHERE I.contract_dt >= @month_start AND I.contract_dt < DATEADD(DAY, 1, @as_of_date)
      AND (NULLIF(LTRIM(RTRIM(@common_tp_nm)), N'') IS NULL OR IST.tp_key IS NOT NULL)
),
overall_contract_total_count AS (
    SELECT SUM(ISNULL(I.cnt, 0)) AS cnt
    FROM ktws.FCT_CONTRACT_KTWS AS I
    INNER JOIN valid_user AS VU ON I.cn_sc_key = VU.sc_key
    LEFT JOIN selected_type AS IST ON I.tp_key = IST.tp_key
    WHERE I.contract_dt >= @month_start AND I.contract_dt < DATEADD(DAY, 1, @as_of_date)
      AND (NULLIF(LTRIM(RTRIM(@common_tp_nm)), N'') IS NULL OR IST.tp_key IS NOT NULL)
),
overall_contract_target AS (
    SELECT SUM(ISNULL(TM.target_cnt, 0)) AS cnt
    FROM ktws.FCT_CRM_TARGET_M AS TM
    INNER JOIN valid_user AS VU ON TM.sc_key = VU.sc_key
    INNER JOIN ktws.DIM_CRM_ACT_TYPE AS T ON TM.tp_key = T.tp_key
    WHERE T.common_tp_nm = N'계약'
      AND TM.monthly_dt >= @month_start AND TM.monthly_dt < DATEADD(DAY, 1, @as_of_date)
),
overall_contract_progress_activity_leads AS (
    SELECT DISTINCT A.lead_key
    FROM ktws.FCT_ACTIVITY_v2 AS A
    INNER JOIN valid_user AS VU ON A.sc_key = VU.sc_key
    INNER JOIN valid_type AS VT ON A.tp_key = VT.tp_key
    WHERE A.act_dt_fr >= @month_start AND A.act_dt_fr < DATEADD(DAY, 1, @as_of_date)
      AND (A.act_result <> N'부재중' OR A.act_result IS NULL)
      AND A.lead_key IS NOT NULL
),
overall_contract_progress_lead_pool AS (
    SELECT DISTINCT G.lead_key
    FROM ktws.FCT_LEAD AS G
    INNER JOIN valid_user AS VU ON G.cl_sc_key = VU.sc_key
    LEFT JOIN selected_type AS GST ON G.tp_key = GST.tp_key
    INNER JOIN overall_contract_progress_activity_leads AS A ON G.lead_key = A.lead_key
    WHERE G.lead_reg_dt >= @month_start AND G.lead_reg_dt < DATEADD(DAY, 1, @as_of_date)
      AND (NULLIF(LTRIM(RTRIM(@common_tp_nm)), N'') IS NULL OR GST.tp_key IS NOT NULL)
      AND (G.close_dt > EOMONTH(@as_of_date) OR G.close_dt IS NULL)
),
overall_contract_progress_count AS (
    SELECT SUM(ISNULL(I.cnt, 0)) AS cnt
    FROM ktws.FCT_CONTRACT_KTWS AS I
    INNER JOIN valid_user AS VU ON I.cn_sc_key = VU.sc_key
    LEFT JOIN selected_type AS IST ON I.tp_key = IST.tp_key
    INNER JOIN overall_contract_progress_lead_pool AS LP ON I.lead_key = LP.lead_key
    WHERE I.contract_dt >= @month_start AND I.contract_dt < DATEADD(DAY, 1, @as_of_date)
      AND (NULLIF(LTRIM(RTRIM(@common_tp_nm)), N'') IS NULL OR IST.tp_key IS NOT NULL)
),
overall_td_activity_seed AS (
    SELECT DISTINCT A.lead_key
    FROM ktws.FCT_ACTIVITY_v2 AS A
    INNER JOIN valid_user AS VU ON A.sc_key = VU.sc_key
    INNER JOIN valid_type AS VT ON A.tp_key = VT.tp_key
    WHERE A.act_dt_fr >= @month_start AND A.act_dt_fr < DATEADD(DAY, 1, @as_of_date)
      AND (A.act_result <> N'부재중' OR A.act_result IS NULL)
      AND (A.contact_tp <> N'MSG' OR A.contact_tp IS NULL)
      AND A.lead_key IS NOT NULL
),
overall_td_lead_pool AS (
    SELECT DISTINCT G.lead_key
    FROM ktws.FCT_LEAD AS G
    INNER JOIN valid_user AS VU ON G.cl_sc_key = VU.sc_key
    LEFT JOIN selected_type AS GST ON G.tp_key = GST.tp_key
    INNER JOIN overall_td_activity_seed AS A ON G.lead_key = A.lead_key
    WHERE G.lead_reg_dt >= @month_start AND G.lead_reg_dt < DATEADD(DAY, 1, @as_of_date)
      AND (NULLIF(LTRIM(RTRIM(@common_tp_nm)), N'') IS NULL OR GST.tp_key IS NOT NULL)
      AND (G.close_dt > EOMONTH(@as_of_date) OR G.close_dt IS NULL OR G.last_retail_sales_dt IS NOT NULL)
),
overall_td_completed_lead_match AS (
    SELECT COUNT(DISTINCT A.lead_key) AS cnt
    FROM ktws.FCT_ACTIVITY_v2 AS A
    INNER JOIN valid_user AS VU ON A.sc_key = VU.sc_key
    INNER JOIN overall_td_lead_pool AS LP ON A.lead_key = LP.lead_key
    WHERE A.act_dt_fr >= @month_start AND A.act_dt_fr < DATEADD(DAY, 1, @as_of_date)
      AND A.act_tp = N'P113'
      AND A.act_result = N'시승완료'
      AND A.lead_key IS NOT NULL
),
overall_td_form_without_cancel AS (
    SELECT SUM(ISNULL(A.actual_cnt, 0)) AS cnt
    FROM ktws.FCT_ACTIVITY_v2 AS A
    INNER JOIN valid_user AS VU ON A.sc_key = VU.sc_key
    INNER JOIN overall_td_lead_pool AS LP ON A.lead_key = LP.lead_key
    WHERE A.act_dt_fr >= @month_start AND A.act_dt_fr < DATEADD(DAY, 1, @as_of_date)
      AND A.act_tp = N'P113'
      AND (A.act_result <> N'시승취소' OR A.act_result IS NULL)
),
overall_lead_set_all_calendar AS (
    SELECT DISTINCT G.lead_key
    FROM ktws.FCT_LEAD AS G
    INNER JOIN valid_user AS VU ON G.cl_sc_key = VU.sc_key
    LEFT JOIN selected_type AS GST ON G.tp_key = GST.tp_key
    WHERE NULLIF(LTRIM(RTRIM(@common_tp_nm)), N'') IS NULL OR GST.tp_key IS NOT NULL
),
overall_td_completed_total_leads AS (
    SELECT DISTINCT A.lead_key
    FROM ktws.FCT_ACTIVITY_v2 AS A
    INNER JOIN valid_user AS VU ON A.sc_key = VU.sc_key
    INNER JOIN overall_lead_set_all_calendar AS LS ON A.lead_key = LS.lead_key OR (A.lead_key IS NULL AND LS.lead_key IS NULL)
    WHERE A.act_dt_fr >= @month_start AND A.act_dt_fr < DATEADD(DAY, 1, @as_of_date)
      AND A.act_tp = N'P113'
      AND A.act_result = N'시승완료'
),
overall_td_total_lead_distinct AS (
    SELECT COUNT(DISTINCT lead_key) AS cnt
    FROM overall_td_completed_total_leads
),
overall_td_total_actual_sum AS (
    SELECT SUM(ISNULL(A.actual_cnt, 0)) AS cnt
    FROM ktws.FCT_ACTIVITY_v2 AS A
    INNER JOIN valid_user AS VU ON A.sc_key = VU.sc_key
    INNER JOIN overall_lead_set_all_calendar AS LS ON A.lead_key = LS.lead_key OR (A.lead_key IS NULL AND LS.lead_key IS NULL)
    WHERE A.act_dt_fr >= @month_start AND A.act_dt_fr < DATEADD(DAY, 1, @as_of_date)
      AND A.act_tp = N'P113'
      AND A.act_result = N'시승완료'
),
overall_td_target AS (
    SELECT SUM(ISNULL(TD.target_cnt, 0)) AS cnt
    FROM ktws.FCT_CRM_TARGET_D AS TD
    INNER JOIN valid_user AS VU ON TD.sc_key = VU.sc_key
    INNER JOIN ktws.DIM_CRM_ACT_TYPE AS T ON TD.type_cd = T.tp_key
    WHERE T.tp_cd = N'P113'
      AND TD.daily_dt >= @month_start AND TD.daily_dt < DATEADD(DAY, 1, @as_of_date)
),
overall_contract_td_lead_pool AS (
    SELECT DISTINCT G.lead_key
    FROM ktws.FCT_LEAD AS G
    INNER JOIN valid_user AS VU ON G.cl_sc_key = VU.sc_key
    LEFT JOIN selected_type AS GST ON G.tp_key = GST.tp_key
    WHERE G.lead_reg_dt >= @month_start AND G.lead_reg_dt < DATEADD(DAY, 1, @as_of_date)
      AND (NULLIF(LTRIM(RTRIM(@common_tp_nm)), N'') IS NULL OR GST.tp_key IS NOT NULL)
      AND G.td_yn = N'Y'
      AND G.lead_key IN (
          SELECT A.lead_key
          FROM ktws.FCT_ACTIVITY_v2 AS A
          INNER JOIN valid_user AS AVU ON A.sc_key = AVU.sc_key
          INNER JOIN valid_type AS VT ON A.tp_key = VT.tp_key
          WHERE A.act_dt_fr >= @month_start AND A.act_dt_fr < DATEADD(DAY, 1, @as_of_date)
            AND (A.act_result <> N'부재중' OR A.act_result IS NULL)
            AND A.lead_key IS NOT NULL
      )
      AND (G.close_dt > @ref_date OR G.close_dt IS NULL OR G.last_retail_sales_dt IS NOT NULL)
),
overall_contract_td_activity_count AS (
    SELECT SUM(ISNULL(I.cnt, 0)) AS cnt
    FROM ktws.FCT_CONTRACT_KTWS AS I
    INNER JOIN valid_user AS VU ON I.cn_sc_key = VU.sc_key
    LEFT JOIN selected_type AS IST ON I.tp_key = IST.tp_key
    INNER JOIN overall_contract_td_lead_pool AS LP ON I.lead_key = LP.lead_key
    WHERE I.contract_dt >= @month_start AND I.contract_dt < DATEADD(DAY, 1, @as_of_date)
      AND (NULLIF(LTRIM(RTRIM(@common_tp_nm)), N'') IS NULL OR IST.tp_key IS NOT NULL)
),
overall_contract_td_total_count AS (
    SELECT SUM(ISNULL(I.cnt, 0)) AS cnt
    FROM ktws.FCT_CONTRACT_KTWS AS I
    INNER JOIN valid_user AS VU ON I.cn_sc_key = VU.sc_key
    LEFT JOIN selected_type AS IST ON I.tp_key = IST.tp_key
    INNER JOIN overall_td_completed_total_leads AS TL ON I.lead_key = TL.lead_key OR (I.lead_key IS NULL AND TL.lead_key IS NULL)
    WHERE I.contract_dt >= @month_start AND I.contract_dt < DATEADD(DAY, 1, @as_of_date)
      AND (NULLIF(LTRIM(RTRIM(@common_tp_nm)), N'') IS NULL OR IST.tp_key IS NOT NULL)
),
detail_result AS (
SELECT N'상세' AS [집계구분],
       VU.brand_nm AS [브랜드],
       VU.dealer_nm AS [딜러],
       VU.group_name AS [전시장],
       VU.dept_nm AS [팀],
       VU.sc_name AS [SC],
       FK.tp_grp_1 AS [활동유형분류],
       FK.common_tp_nm AS [활동유형],
       COALESCE(AA.cnt, 0) AS [영업활동 건 수],
       COALESCE(AT.cnt, 0) AS [영업활동 당월 목표],
       FORMAT(CASE WHEN ISNULL(AT.cnt, 0) = 0 THEN CAST(0 AS DECIMAL(38, 10)) ELSE CAST(ISNULL(AA.cnt, 0) AS DECIMAL(28, 10)) / CAST(AT.cnt AS DECIMAL(28, 10)) END, '0.00%') AS [영업활동 진행률],
       FORMAT(CASE WHEN ISNULL(AA.cnt, 0) = 0 THEN CAST(0 AS DECIMAL(38, 10)) ELSE CAST(ISNULL(LAC.cnt, 0) AS DECIMAL(28, 10)) / CAST(AA.cnt AS DECIMAL(28, 10)) END, '0.00%') AS [영업활동에서 영업기회로의 전환율],
       COALESCE(LAC.cnt, 0) AS [영업기회 건 수(당월활동실적)],
       COALESCE(LTC.cnt, 0) AS [영업기회 건 수(당월전체실적)],
       COALESCE(LT.cnt, 0) AS [영업기회 당월 목표],
       FORMAT(CASE WHEN ISNULL(LT.cnt, 0) = 0 THEN CAST(0 AS DECIMAL(38, 10)) ELSE CAST(ISNULL(LAC.cnt, 0) AS DECIMAL(28, 10)) / CAST(LT.cnt AS DECIMAL(28, 10)) END, '0.00%') AS [영업기회 진행률],
       FORMAT(CASE WHEN ISNULL(LAC.cnt, 0) = 0 THEN CAST(0 AS DECIMAL(38, 10)) ELSE CAST(ISNULL(CAC.cnt, 0) AS DECIMAL(28, 10)) / CAST(LAC.cnt AS DECIMAL(28, 10)) END, '0.00%') AS [영업기회에서 계약으로 전환율],
       COALESCE(CAC.cnt, 0) AS [계약건수(당월활동실적)],
       COALESCE(CTC.cnt, 0) AS [계약건수(당월전체실적)],
       COALESCE(CT.cnt, 0) AS [계약 당월 목표],
       FORMAT(CASE WHEN ISNULL(CT.cnt, 0) = 0 THEN CAST(0 AS DECIMAL(38, 10)) ELSE CAST(ISNULL(CPC.cnt, 0) AS DECIMAL(28, 10)) / CAST(CT.cnt AS DECIMAL(28, 10)) END, '0.00%') AS [계약 진행률],
       FORMAT(CASE WHEN ISNULL(LAC.cnt, 0) = 0 THEN CAST(0 AS DECIMAL(38, 10)) ELSE CAST(ISNULL(TDCLM.cnt, 0) AS DECIMAL(28, 10)) / CAST(LAC.cnt AS DECIMAL(28, 10)) END, '0.00%') AS [영업기회에서 시승으로 전환율],
       COALESCE(TDCLM.cnt, 0) AS [시승건수(당월활동실적/시승완료)],
       COALESCE(TDFC.cnt, 0) AS [시승건수(당월활동실적/시승취소건 제외)],
       COALESCE(TDTLD.cnt, 0) AS [시승건수(당월전체실적/lead_key 기준)],
       COALESCE(TDTAS.cnt, 0) AS [시승건수(당월전체실적/actual_cnt 기준)],
       COALESCE(TDT.cnt, 0) AS [시승 당월 목표],
       FORMAT(CASE WHEN ISNULL(TDT.cnt, 0) = 0 THEN CAST(0 AS DECIMAL(38, 10)) ELSE CAST(ISNULL(TDTAS.cnt, 0) AS DECIMAL(28, 10)) / CAST(TDT.cnt AS DECIMAL(28, 10)) END, '0.00%') AS [시승 진행률],
       FORMAT(CASE WHEN ISNULL(TDCLM.cnt, 0) = 0 THEN CAST(0 AS DECIMAL(38, 10)) ELSE CAST(ISNULL(CTDAC.cnt, 0) AS DECIMAL(28, 10)) / CAST(TDCLM.cnt AS DECIMAL(28, 10)) END, '0.00%') AS [시승에서 계약으로 전환율],
       COALESCE(CTDAC.cnt, 0) AS [시승에서 계약으로 당월활동실적],
       COALESCE(CTDTC.cnt, 0) AS [시승에서 계약으로 당월전체실적],
       1 AS _sort_group,
       SORT.grp_ord AS _grp_ord,
       SORT.tp_ord AS _tp_ord
FROM frame_key AS FK
INNER JOIN valid_user AS VU ON FK.sc_key = VU.sc_key
LEFT JOIN activity_actual AS AA ON FK.sc_key = AA.sc_key AND FK.tp_grp_1 = AA.tp_grp_1 AND FK.common_tp_nm = AA.common_tp_nm
LEFT JOIN activity_target AS AT ON FK.sc_key = AT.sc_key AND FK.tp_grp_1 = AT.tp_grp_1 AND FK.common_tp_nm = AT.common_tp_nm
LEFT JOIN lead_activity_count AS LAC ON FK.sc_key = LAC.sc_key AND FK.tp_grp_1 = LAC.tp_grp_1 AND FK.common_tp_nm = LAC.common_tp_nm
LEFT JOIN lead_total_count AS LTC ON FK.sc_key = LTC.sc_key AND FK.tp_grp_1 = LTC.tp_grp_1 AND FK.common_tp_nm = LTC.common_tp_nm
LEFT JOIN lead_target AS LT ON FK.sc_key = LT.sc_key AND FK.tp_grp_1 = LT.tp_grp_1 AND FK.common_tp_nm = LT.common_tp_nm
LEFT JOIN contract_activity_count AS CAC ON FK.sc_key = CAC.sc_key AND FK.tp_grp_1 = CAC.tp_grp_1 AND FK.common_tp_nm = CAC.common_tp_nm
LEFT JOIN contract_total_count AS CTC ON FK.sc_key = CTC.sc_key AND FK.tp_grp_1 = CTC.tp_grp_1 AND FK.common_tp_nm = CTC.common_tp_nm
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
),
grand_total AS (
    SELECT N'합계' AS [집계구분],
           N'전체' AS [브랜드], N'전체' AS [딜러], N'전체' AS [전시장], N'전체' AS [팀], N'전체' AS [SC], N'전체' AS [활동유형분류], N'전체' AS [활동유형],
           COALESCE(AA.cnt, 0) AS [영업활동 건 수],
           COALESCE(AT.cnt, 0) AS [영업활동 당월 목표],
           FORMAT(CASE WHEN ISNULL(AT.cnt, 0) = 0 THEN CAST(0 AS DECIMAL(38, 10)) ELSE CAST(ISNULL(AA.cnt, 0) AS DECIMAL(28, 10)) / CAST(AT.cnt AS DECIMAL(28, 10)) END, '0.00%') AS [영업활동 진행률],
           FORMAT(CASE WHEN ISNULL(AA.cnt, 0) = 0 THEN CAST(0 AS DECIMAL(38, 10)) ELSE CAST(ISNULL(LAC.cnt, 0) AS DECIMAL(28, 10)) / CAST(AA.cnt AS DECIMAL(28, 10)) END, '0.00%') AS [영업활동에서 영업기회로의 전환율],
           COALESCE(LAC.cnt, 0) AS [영업기회 건 수(당월활동실적)],
           COALESCE(LTC.cnt, 0) AS [영업기회 건 수(당월전체실적)],
           COALESCE(LT.cnt, 0) AS [영업기회 당월 목표],
           FORMAT(CASE WHEN ISNULL(LT.cnt, 0) = 0 THEN CAST(0 AS DECIMAL(38, 10)) ELSE CAST(ISNULL(LAC.cnt, 0) AS DECIMAL(28, 10)) / CAST(LT.cnt AS DECIMAL(28, 10)) END, '0.00%') AS [영업기회 진행률],
           FORMAT(CASE WHEN ISNULL(LAC.cnt, 0) = 0 THEN CAST(0 AS DECIMAL(38, 10)) ELSE CAST(ISNULL(CAC.cnt, 0) AS DECIMAL(28, 10)) / CAST(LAC.cnt AS DECIMAL(28, 10)) END, '0.00%') AS [영업기회에서 계약으로 전환율],
           COALESCE(CAC.cnt, 0) AS [계약건수(당월활동실적)],
           COALESCE(CTC.cnt, 0) AS [계약건수(당월전체실적)],
           COALESCE(CT.cnt, 0) AS [계약 당월 목표],
           FORMAT(CASE WHEN ISNULL(CT.cnt, 0) = 0 THEN CAST(0 AS DECIMAL(38, 10)) ELSE CAST(ISNULL(CPC.cnt, 0) AS DECIMAL(28, 10)) / CAST(CT.cnt AS DECIMAL(28, 10)) END, '0.00%') AS [계약 진행률],
           FORMAT(CASE WHEN ISNULL(LAC.cnt, 0) = 0 THEN CAST(0 AS DECIMAL(38, 10)) ELSE CAST(ISNULL(TDCLM.cnt, 0) AS DECIMAL(28, 10)) / CAST(LAC.cnt AS DECIMAL(28, 10)) END, '0.00%') AS [영업기회에서 시승으로 전환율],
           COALESCE(TDCLM.cnt, 0) AS [시승건수(당월활동실적/시승완료)],
           COALESCE(TDFC.cnt, 0) AS [시승건수(당월활동실적/시승취소건 제외)],
           COALESCE(TDTLD.cnt, 0) AS [시승건수(당월전체실적/lead_key 기준)],
           COALESCE(TDTAS.cnt, 0) AS [시승건수(당월전체실적/actual_cnt 기준)],
           COALESCE(TDT.cnt, 0) AS [시승 당월 목표],
           FORMAT(CASE WHEN ISNULL(TDT.cnt, 0) = 0 THEN CAST(0 AS DECIMAL(38, 10)) ELSE CAST(ISNULL(TDTAS.cnt, 0) AS DECIMAL(28, 10)) / CAST(TDT.cnt AS DECIMAL(28, 10)) END, '0.00%') AS [시승 진행률],
           FORMAT(CASE WHEN ISNULL(TDCLM.cnt, 0) = 0 THEN CAST(0 AS DECIMAL(38, 10)) ELSE CAST(ISNULL(CTDAC.cnt, 0) AS DECIMAL(28, 10)) / CAST(TDCLM.cnt AS DECIMAL(28, 10)) END, '0.00%') AS [시승에서 계약으로 전환율],
           COALESCE(CTDAC.cnt, 0) AS [시승에서 계약으로 당월활동실적],
           COALESCE(CTDTC.cnt, 0) AS [시승에서 계약으로 당월전체실적],
           0 AS _sort_group, NULL AS _grp_ord, NULL AS _tp_ord
    FROM overall_activity_actual AS AA
    CROSS JOIN overall_activity_target AS AT
    CROSS JOIN overall_lead_activity_count AS LAC
    CROSS JOIN overall_lead_total_count AS LTC
    CROSS JOIN overall_lead_target AS LT
    CROSS JOIN overall_contract_activity_count AS CAC
    CROSS JOIN overall_contract_total_count AS CTC
    CROSS JOIN overall_contract_target AS CT
    CROSS JOIN overall_contract_progress_count AS CPC
    CROSS JOIN overall_td_completed_lead_match AS TDCLM
    CROSS JOIN overall_td_form_without_cancel AS TDFC
    CROSS JOIN overall_td_total_lead_distinct AS TDTLD
    CROSS JOIN overall_td_total_actual_sum AS TDTAS
    CROSS JOIN overall_td_target AS TDT
    CROSS JOIN overall_contract_td_activity_count AS CTDAC
    CROSS JOIN overall_contract_td_total_count AS CTDTC
),
final_result AS (
    SELECT * FROM grand_total
    UNION ALL
    SELECT * FROM detail_result
)
SELECT [집계구분], [브랜드], [딜러], [전시장], [팀], [SC], [활동유형분류], [활동유형],
       [영업활동 건 수], [영업활동 당월 목표], [영업활동 진행률], [영업활동에서 영업기회로의 전환율],
       [영업기회 건 수(당월활동실적)], [영업기회 건 수(당월전체실적)], [영업기회 당월 목표], [영업기회 진행률],
       [영업기회에서 계약으로 전환율], [계약건수(당월활동실적)], [계약건수(당월전체실적)], [계약 당월 목표], [계약 진행률],
       [영업기회에서 시승으로 전환율], [시승건수(당월활동실적/시승완료)], [시승건수(당월활동실적/시승취소건 제외)],
       [시승건수(당월전체실적/lead_key 기준)], [시승건수(당월전체실적/actual_cnt 기준)], [시승 당월 목표], [시승 진행률],
       [시승에서 계약으로 전환율], [시승에서 계약으로 당월활동실적], [시승에서 계약으로 당월전체실적]
FROM final_result
ORDER BY _sort_group, [브랜드], [딜러], [전시장], [팀], [SC], _grp_ord, _tp_ord, [활동유형분류], [활동유형];
