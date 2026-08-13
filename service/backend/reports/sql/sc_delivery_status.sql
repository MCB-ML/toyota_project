/* ── 파라미터 ──
   원본에서 파라미터 DECLARE 21개를 제거했다. 이 값들은 mssql 드라이버가
   request.input()으로 바인딩해 주입한다(문자열 치환 금지).
     @year @month @active_yn @age_grp @sc_brand @dealer_nm @group_name @dept_nm @sc_name @brand @model_nm @variant_nm @my_cd @sfx_cd @grp_category @grp_name @drop_empty_duplicates @exclude_no_activity @period_cancel @period_avg @sort_by_name

   또한 NULL 가능한 pad 변수 13개에 CASE NULL 가드를 넣었다 — Fabric에서
   N',' + NULL + N',' 가 NULL이 아니라 ',,' 가 되어 "NULL=전체"가
   "NULL=결과 없음"으로 뒤집히기 때문이다(라이브로 확인된 문제).
   상수에서 파생되는 pad와 계산 로직은 원문 그대로다. */

/* ══════════════════════════════════════════════════════════════════════════
   [SC 실적 매트릭스]  계층(브랜드 > 딜러 > 전시장 > 팀 > SC)
   ──────────────────────────────────────────────────────────────────────────
   @sc_name  NULL          → [팀레벨] 팀당 1행
             'ALL'         → [SC레벨] 계정(sc_key) 1개당 1행
             '홍길동,김철수' → [SC레벨] 지정 SC만

   ■ 집계 단위 : sc_key (= DIM_MNG_USER 1행. 전체행 = sc_key수 = 2,688)
     한 사람이 계정을 여러 개 갖는 경우가 있다. BI 는 이름만으로 자동 병합하지만
     여기서는 레코드 단위를 유지한다. 동명이인 오병합 위험이 없다.

   ■ 빈 중복계정 제거 (@drop_empty_duplicates)
     한 사람이 계정을 여러 개 가질 때, 실적이 없는 계정은 취소율이 0 으로
     계산되어 A등급을 받는다. 반면 실계정은 실제 취소율대로 B·C 가 될 수 있다.
     그 결과 등급 필터를 걸면 껍데기만 남고 실계정이 사라진다.
         예) 박기성  JM30021 계약 0건 → 취소율 0% → A → 표시
                     JM30037 계약 32건 → 취소율 10%↑ → B → 숨김
     그래서 같은 딜러·같은 이름에 실적 있는 계정이 따로 있으면 빈 계정을 버린다.
     계정이 하나뿐인 사람은 실적이 0 이어도 그대로 남는다.

   ■ 단일 쿼리 구조
     두 레벨의 계산 과정은 같고 마지막에 묶는 단위만 다르다. IF/ELSE 대신
     detail 의 GROUP BY 에서 CASE 로 전환한다.
         팀레벨  → sc_key 를 NULL 로 만들어 팀 단위로 합침
         SC레벨  → sc_key 를 그대로 두어 1행 유지
     출력 컬럼은 공통. SC레벨은 [SC수]=1 이고 팀레벨은 [SC]·[sc_key]가 NULL.

   ■ 공백 정리
     dept_nm 등에 '광진3팀 ' 처럼 끝공백이 붙은 값이 존재한다. LIKE 패딩은
     컬럼값을 패턴 쪽에 넣으므로 공백이 남으면 지정 필터가 0행을 반환한다.
     따라서 target_sc 안쪽에서 문자 컬럼을 한 번 트림한다.

   ■ 그룹규칙 (ktws.FCT_SC_GROUP_RULE)
     누적 취소율 : A = 0~0.1 / B = 0.1~0.2 / C = 0.2~   (비율 단위)
     metric_val 도 비율(0.053)이라 스케일 보정 불필요.
     @grp_category 가 NULL 이면 GRP_CATEGORY = NULL 비교가 항상 UNKNOWN 이
     되어 전원 '미분류'가 된다. 등급을 보려면 반드시 지정할 것.

   지표  ① 누적취소율   = 취소건 / 전체건 (최근 @period_cancel 개월, 전월말)
         ② 월평균 출고  = 팀레벨 : 6개월 출고합 ÷ 기간 ÷ SC수
                          SC레벨 : 실적 있는 달의 평균
         ③ 연누적 / PMA = YTD DISTINCT 계약수 (pma_yn<>'N'=IN, ='N'=OUT)

   표기  누적취소율·PMA 비중은 퍼센트(×100).
         누적취소율 1자리, PMA 비중 0자리, 월평균 출고 1자리.

   주의  @brand 는 판매된 '차량'의 브랜드(DIM_VEHIC_SPEC.BRAND).
         조직 브랜드는 @sc_brand (DIM_MNG_USER.BRAND).
   확인  ⚠ 차량 브릿지 키(cn_vehic_key), 나이대 컬럼명(age_grp)
   ══════════════════════════════════════════════════════════════════════════ */

SET NOCOUNT ON;

/* ── 기준월 (NULL=전체, 콤마 다중 지정) ── */

/* ── SC 계열 슬라이서 (NULL=모두, 콤마 다중 지정) ── */

/* ── 차량 계열 슬라이서 (NULL=모두, 콤마 다중 지정) ── */

/* ── 그룹규칙 ── */

/* 같은 딜러·같은 이름에 계정이 여러 개일 때, 실적이 있는 계정이 따로 존재하면
   실적 없는 계정(취소율·월평균 둘 다 값 없음)을 버린다.
   계정이 하나뿐인 사람은 실적이 0이어도 그대로 남는다.
   → 빈 껍데기 계정이 취소율 0 으로 A등급을 받아 실계정을 가리는 문제를 막는다. */

/* 등급 판정 시 실적 0 처리.
   0 = 취소율 0 / 출고 0 으로 보아 최상위 등급(A) 부여
   1 = 판정에서 빼고 '미분류' 로 표시
   ※ 1 로 두면 BI 에 0.0% 로 표시되는 SC 들도 사라지므로 보통 0 이 맞다 */


/* ── 제외 규칙 ── */
DECLARE @exclude_facade NVARCHAR(50)  = N'창구SC';
DECLARE @exclude_dept   NVARCHAR(MAX) = N'고객지원팀,TOYOTA YM';
DECLARE @exclude_name   NVARCHAR(MAX) = N'고객지원팀';   -- 집계용 더미SC
DECLARE @exclude_users  NVARCHAR(MAX) = NEXCLUDED_USER_ID_1,EXCLUDED_USER_ID_2;

/* ── 집계 레벨 ── */
DECLARE @team_level BIT = CASE WHEN @sc_name IS NULL THEN 1 ELSE 0 END;

/* SC레벨 정렬. 1 = SC 이름 가나다순 / 0 = 계층순(브랜드>딜러>전시장>팀>이름)
   팀레벨(@sc_name = NULL)에는 영향이 없다. */

/* ── LIKE 패딩 (STRING_SPLIT 대체, 8623 방지). NULL 이면 해당 필터 해제 ── */
DECLARE @yearPad       NVARCHAR(MAX) = CASE WHEN @year IS NULL THEN NULL ELSE N',' + REPLACE(@year,  N' ', N'') + N',' END;
DECLARE @monthPad      NVARCHAR(MAX) = CASE WHEN @month IS NULL THEN NULL ELSE N',' + REPLACE(@month, N' ', N'') + N',' END;

DECLARE @active_ynPad  NVARCHAR(MAX) = CASE WHEN @active_yn IS NULL THEN NULL ELSE N',' + REPLACE(@active_yn,  N', ', N',') + N',' END;
DECLARE @age_grpPad    NVARCHAR(MAX) = CASE WHEN @age_grp IS NULL THEN NULL ELSE N',' + REPLACE(@age_grp,    N', ', N',') + N',' END;
DECLARE @sc_brandPad   NVARCHAR(MAX) = CASE WHEN @sc_brand IS NULL THEN NULL ELSE N',' + REPLACE(@sc_brand,   N', ', N',') + N',' END;
DECLARE @dealer_nmPad  NVARCHAR(MAX) = CASE WHEN @dealer_nm IS NULL THEN NULL ELSE N',' + REPLACE(@dealer_nm,  N', ', N',') + N',' END;
DECLARE @group_namePad NVARCHAR(MAX) = CASE WHEN @group_name IS NULL THEN NULL ELSE N',' + REPLACE(@group_name, N', ', N',') + N',' END;
DECLARE @dept_nmPad    NVARCHAR(MAX) = CASE WHEN @dept_nm IS NULL THEN NULL ELSE N',' + REPLACE(@dept_nm,    N', ', N',') + N',' END;

DECLARE @brandPad      NVARCHAR(MAX) = CASE WHEN @brand IS NULL THEN NULL ELSE N',' + REPLACE(@brand,      N', ', N',') + N',' END;
DECLARE @model_nmPad   NVARCHAR(MAX) = CASE WHEN @model_nm IS NULL THEN NULL ELSE N',' + REPLACE(@model_nm,   N', ', N',') + N',' END;
DECLARE @variant_nmPad NVARCHAR(MAX) = CASE WHEN @variant_nm IS NULL THEN NULL ELSE N',' + REPLACE(@variant_nm, N', ', N',') + N',' END;
DECLARE @my_cdPad      NVARCHAR(MAX) = CASE WHEN @my_cd IS NULL THEN NULL ELSE N',' + REPLACE(@my_cd,      N', ', N',') + N',' END;
DECLARE @sfx_cdPad     NVARCHAR(MAX) = CASE WHEN @sfx_cd IS NULL THEN NULL ELSE N',' + REPLACE(@sfx_cd,     N', ', N',') + N',' END;

/* 'ALL'(대소문자·공백 무관)이면 SC 필터 해제 */
DECLARE @sc_filterPad  NVARCHAR(MAX) =
    CASE WHEN @sc_name IS NULL THEN NULL
         WHEN UPPER(LTRIM(RTRIM(@sc_name))) = N'ALL' THEN NULL
         ELSE N',' + REPLACE(@sc_name, N', ', N',') + N',' END;

/* 값 내부 공백 보존(TOYOTA YM), user_id 만 전체 공백 제거 */
DECLARE @excl_deptPad  NVARCHAR(MAX) = N',' + REPLACE(@exclude_dept,  N', ', N',') + N',';
DECLARE @excl_namePad  NVARCHAR(MAX) = N',' + REPLACE(@exclude_name,  N', ', N',') + N',';
DECLARE @excl_usersPad NVARCHAR(MAX) = N',' + REPLACE(@exclude_users, N' ',  N'')  + N',';

DECLARE @use_vehic_filter BIT =
    CASE WHEN @brand IS NULL AND @model_nm IS NULL AND @variant_nm IS NULL
          AND @my_cd IS NULL AND @sfx_cd IS NULL
         THEN 0 ELSE 1 END;


;WITH
base_month AS (
    SELECT DISTINCT
        c.[Year]        AS base_year,
        c.[MonthNumber] AS base_month_no,
        EOMONTH(DATEFROMPARTS(c.[Year], c.[MonthNumber], 1), -1) AS ref_date,
        EOMONTH(DATEFROMPARTS(c.[Year], c.[MonthNumber], 1))     AS ref_date_avg,
        DATEFROMPARTS(c.[Year], 1, 1)                            AS ytd_start
    FROM ktws.DIM_CALENDAR_KTWS c
    WHERE (@yearPad  IS NULL OR @yearPad  LIKE N'%,' + CAST(c.[Year]        AS NVARCHAR(10)) + N',%')
      AND (@monthPad IS NULL OR @monthPad LIKE N'%,' + CAST(c.[MonthNumber] AS NVARCHAR(10)) + N',%')
),

target_vehic AS (
    SELECT s.spec_key
    FROM   ktws.DIM_VEHIC_SPEC s
    WHERE (@brandPad      IS NULL OR @brandPad      LIKE N'%,' + LTRIM(RTRIM(s.BRAND))      + N',%')
      AND (@my_cdPad      IS NULL OR @my_cdPad      LIKE N'%,' + LTRIM(RTRIM(s.my_cd))      + N',%')
      AND (@sfx_cdPad     IS NULL OR @sfx_cdPad     LIKE N'%,' + LTRIM(RTRIM(s.sfx_cd))     + N',%')
      AND (@model_nmPad   IS NULL OR @model_nmPad   LIKE N'%,' + LTRIM(RTRIM(s.model_nm))   + N',%')
      AND (@variant_nmPad IS NULL OR @variant_nmPad LIKE N'%,' + LTRIM(RTRIM(s.variant_nm)) + N',%')
),

/* 대상 SC. 안쪽 서브쿼리에서 문자 컬럼을 트림한 뒤 모든 필터가 그 값을 쓴다. */
target_sc AS (
    SELECT
        u.sc_key,
        u.name,
        u.dealer_key,
        u.brand_nm,
        u.dealer_nm,
        u.group_name,
        u.dept_nm
    FROM (
        SELECT
            x.sc_key,
            x.dealer_key,
            LTRIM(RTRIM(x.name))         AS name,
            LTRIM(RTRIM(x.BRAND))        AS brand_nm,
            LTRIM(RTRIM(x.dealer_nm))    AS dealer_nm,
            LTRIM(RTRIM(x.group_name))   AS group_name,
            LTRIM(RTRIM(x.dept_nm))      AS dept_nm,
            LTRIM(RTRIM(x.active_yn))    AS active_yn,
            LTRIM(RTRIM(x.age_grp))      AS age_grp,
            LTRIM(RTRIM(x.user_id))      AS user_id,
            LTRIM(RTRIM(x.facade_sc_yn)) AS facade_sc_yn
        FROM ktws.DIM_MNG_USER x
    ) u
    WHERE  u.name IS NOT NULL
      AND  u.name <> N''
      AND (u.dealer_nm  IS NULL OR u.dealer_nm  <> N'')
      AND (u.group_name IS NULL OR u.group_name <> N'')
      AND (u.dept_nm    IS NULL OR u.dept_nm    <> N'')
      AND (@active_ynPad  IS NULL OR @active_ynPad  LIKE N'%,' + LTRIM(RTRIM(u.active_yn))  + N',%')
      AND (@age_grpPad    IS NULL OR @age_grpPad    LIKE N'%,' + LTRIM(RTRIM(u.age_grp))    + N',%')   -- ⚠ 컬럼명 확인
      AND (@sc_brandPad   IS NULL OR @sc_brandPad   LIKE N'%,' + LTRIM(RTRIM(u.brand_nm))   + N',%')
      AND (@dealer_nmPad  IS NULL OR @dealer_nmPad  LIKE N'%,' + LTRIM(RTRIM(u.dealer_nm))  + N',%')
      AND (@group_namePad IS NULL OR @group_namePad LIKE N'%,' + LTRIM(RTRIM(u.group_name)) + N',%')
      AND (@dept_nmPad    IS NULL OR @dept_nmPad    LIKE N'%,' + LTRIM(RTRIM(u.dept_nm))    + N',%')
      AND (@sc_filterPad  IS NULL OR @sc_filterPad  LIKE N'%,' + LTRIM(RTRIM(u.name))       + N',%')
      AND (u.facade_sc_yn IS NULL OR u.facade_sc_yn <> @exclude_facade)
      AND (u.dept_nm      IS NULL OR @excl_deptPad  NOT LIKE N'%,' + LTRIM(RTRIM(u.dept_nm)) + N',%')
      AND (@excl_namePad  NOT LIKE N'%,' + LTRIM(RTRIM(u.name)) + N',%')
      AND (u.user_id      IS NULL OR @excl_usersPad NOT LIKE N'%,' + LTRIM(RTRIM(u.user_id)) + N',%')
),

/* ① 누적취소율 : 최근 @period_cancel 개월 계약 중 전월말 이전 취소 비율 */
cancel_ratio AS (
    SELECT
        bm.base_year,
        bm.base_month_no,
        u.sc_key,
        SUM(CASE WHEN c.cancel_dt IS NOT NULL AND c.cancel_dt < bm.ref_date
                 THEN c.cnt ELSE 0 END)                       AS canceled_cnt,
        SUM(c.cnt)                                            AS total_cnt,
        CAST(SUM(CASE WHEN c.cancel_dt IS NOT NULL AND c.cancel_dt < bm.ref_date
                      THEN c.cnt ELSE 0 END) AS FLOAT)
        / NULLIF(SUM(c.cnt), 0)                               AS ratio_val
    FROM   target_sc u
    CROSS JOIN base_month bm
    LEFT JOIN ktws.FCT_CONTRACT_KTWS c
           ON c.cn_sc_key    = u.sc_key
          AND c.contract_dt  > EOMONTH(bm.ref_date, -@period_cancel)
          AND c.contract_dt <= bm.ref_date
          AND (@use_vehic_filter = 0
               OR EXISTS (SELECT 1 FROM target_vehic tv WHERE tv.spec_key = c.cn_vehic_key))
    GROUP BY bm.base_year, bm.base_month_no, u.sc_key
),

/* ② 월평균 출고의 재료 : SC × 최근 6개월, 달마다 출고 건수 */
monthly_sales AS (
    SELECT
        bm.base_year,
        bm.base_month_no,
        u.sc_key,
        m.month_offset,
        COUNT(DISTINCT c.dlr_contract_no) AS monthly_cnt
    FROM   target_sc u
    CROSS JOIN base_month bm
    CROSS APPLY (VALUES (1),(2),(3),(4),(5),(6)) AS m(month_offset)
    LEFT JOIN ktws.FCT_CONTRACT_KTWS c
           ON c.cn_sc_key = u.sc_key
          AND c.last_retail_sales_dt >= DATEFROMPARTS(
                  YEAR (DATEADD(MONTH, -m.month_offset, bm.ref_date_avg)),
                  MONTH(DATEADD(MONTH, -m.month_offset, bm.ref_date_avg)), 1)
          AND c.last_retail_sales_dt <= EOMONTH(DATEADD(MONTH, -m.month_offset, bm.ref_date_avg))
          AND (c.cancel_dt > EOMONTH(DATEADD(MONTH, -m.month_offset, bm.ref_date_avg))
               OR c.cancel_dt IS NULL)
          AND (@use_vehic_filter = 0
               OR EXISTS (SELECT 1 FROM target_vehic tv WHERE tv.spec_key = c.cn_vehic_key))
    WHERE  m.month_offset <= @period_avg
    GROUP BY bm.base_year, bm.base_month_no, u.sc_key, m.month_offset
),

/* SC별 월평균. 등급 판정과 BLANK 판정에 쓰인다. 실적 있는 달만 평균 */
monthly_avg AS (
    SELECT
        base_year,
        base_month_no,
        sc_key,
        AVG(CAST(monthly_cnt AS FLOAT)) AS avg_val
    FROM   monthly_sales
    WHERE  monthly_cnt > 0
    GROUP BY base_year, base_month_no, sc_key
),

/* ③ 연누적 출고 / PMA IN·OUT */
ytd AS (
    SELECT
        bm.base_year,
        bm.base_month_no,
        u.sc_key,
        COUNT(DISTINCT c.dlr_contract_no)                                   AS sales_ytd,
        COUNT(DISTINCT CASE WHEN c.pma_yn <> 'N' OR c.pma_yn IS NULL
                            THEN c.dlr_contract_no END)                     AS pma_in,
        COUNT(DISTINCT CASE WHEN c.pma_yn = 'N' THEN c.dlr_contract_no END) AS pma_out
    FROM   target_sc u
    CROSS JOIN base_month bm
    LEFT JOIN ktws.FCT_CONTRACT_KTWS c
           ON c.cn_sc_key = u.sc_key
          AND c.last_retail_sales_dt >= bm.ytd_start
          AND c.last_retail_sales_dt <= bm.ref_date_avg
          AND (c.cancel_dt > bm.ref_date OR c.cancel_dt IS NULL)
          AND (@use_vehic_filter = 0
               OR EXISTS (SELECT 1 FROM target_vehic tv WHERE tv.spec_key = c.cn_vehic_key))
    GROUP BY bm.base_year, bm.base_month_no, u.sc_key
),

/* SC 한 명 = 한 행. 등급 판정까지 마친 상태 */
sc_row AS (
    SELECT
        bm.base_year,
        bm.base_month_no,
        u.sc_key,
        u.name,
        u.brand_nm,
        u.dealer_nm,
        u.group_name,
        u.dept_nm,
        COALESCE(y.sales_ytd, 0)  AS sales_ytd,
        COALESCE(y.pma_in,    0)  AS pma_in,
        COALESCE(y.pma_out,   0)  AS pma_out,
        cr.canceled_cnt,
        cr.total_cnt,
        COALESCE(cr.ratio_val, 0) AS canceled_ratio_val,
        COALESCE(ma.avg_val,   0) AS monthly_avg_val,
        ma.avg_val                AS raw_avg,          -- BLANK 판정용 (COALESCE 전)
        CASE WHEN @grp_category IS NULL THEN N'평가기준 미지정'
             ELSE ISNULL(g.GRP_NAME, N'미분류') END AS grp_grade
    FROM   target_sc u
    CROSS JOIN base_month bm
    LEFT JOIN cancel_ratio cr
           ON cr.sc_key        = u.sc_key
          AND cr.base_year     = bm.base_year
          AND cr.base_month_no = bm.base_month_no
    LEFT JOIN monthly_avg ma
           ON ma.sc_key        = u.sc_key
          AND ma.base_year     = bm.base_year
          AND ma.base_month_no = bm.base_month_no
    LEFT JOIN ytd y
           ON y.sc_key         = u.sc_key
          AND y.base_year      = bm.base_year
          AND y.base_month_no  = bm.base_month_no
    /* 판정에 쓸 지표값을 한 번만 계산 */
    CROSS APPLY (VALUES (
        CASE
          WHEN @grp_category = N'누적 취소율' THEN
               CASE WHEN @exclude_no_activity = 1 AND COALESCE(cr.total_cnt, 0) = 0
                    THEN CAST(NULL AS FLOAT)
                    ELSE COALESCE(cr.ratio_val, 0) END
          WHEN @grp_category = N'출고평균대수' THEN
               CASE WHEN @exclude_no_activity = 1 AND ma.avg_val IS NULL
                    THEN CAST(NULL AS FLOAT)
                    ELSE COALESCE(ma.avg_val, 0) END
          ELSE CAST(NULL AS FLOAT)
        END
    )) AS gv(metric_val)
    /* 구간이 겹치거나 catch-all 규칙이 섞여 있으면 가장 구체적인 규칙 우선 */
    OUTER APPLY (
        SELECT TOP 1 r.GRP_NAME
        FROM   ktws.FCT_SC_GROUP_RULE r
        WHERE  r.DEALER_KEY   = u.dealer_key
          AND  r.GRP_CATEGORY = @grp_category
          AND  gv.metric_val IS NOT NULL
          AND (r.RANGE_FROM IS NULL OR gv.metric_val >= r.RANGE_FROM)
          AND (r.RANGE_TO   IS NULL OR gv.metric_val <  r.RANGE_TO)
        ORDER BY r.RANGE_FROM DESC, r.GRP_NAME
    ) AS g
),

/* 빈 중복계정 제거. 등급 필터보다 먼저 걸러야 실계정이 살아남는다. */
deduped AS (
    SELECT *
    FROM   sc_row r
    WHERE  @drop_empty_duplicates = 0
       OR  COALESCE(r.total_cnt, 0) > 0        -- 이 계정에 실적이 있으면 무조건 유지
       OR  r.raw_avg IS NOT NULL
       OR  NOT EXISTS (                        -- 실적 없는 계정은, 같은 이름에
               SELECT 1                        -- 실적 있는 다른 계정이 있을 때만 버린다
               FROM   sc_row s
               WHERE  s.base_year     = r.base_year
                 AND  s.base_month_no = r.base_month_no
                 AND  s.dealer_nm     = r.dealer_nm
                 AND  s.name          = r.name
                 AND  s.sc_key       <> r.sc_key
                 AND (COALESCE(s.total_cnt, 0) > 0 OR s.raw_avg IS NOT NULL)
           )
),

/* 등급 필터 */
visible AS (
    SELECT *
    FROM   deduped
    WHERE  @grp_name IS NULL
       OR  grp_grade = @grp_name
),

/* 표시용 월평균. 레벨에 따라 계산식이 다르다.
     팀레벨 : 소속 SC 전체의 6개월 출고합 ÷ 기간 ÷ SC수
     SC레벨 : 그 SC의 실적 있는 달만 평균 */
display_avg AS (
    SELECT
        v.base_year,
        v.base_month_no,
        v.brand_nm,
        v.dealer_nm,
        v.group_name,
        v.dept_nm,
        CASE WHEN @team_level = 1 THEN NULL ELSE v.sc_key END AS group_key,
        CASE WHEN @team_level = 1
             THEN SUM(ms.monthly_cnt) * 1.0
                  / @period_avg
                  / NULLIF(COUNT(DISTINCT ms.sc_key), 0)
             ELSE SUM(ms.monthly_cnt) * 1.0
                  / NULLIF(SUM(CASE WHEN ms.monthly_cnt > 0 THEN 1 ELSE 0 END), 0)
        END AS avg_val
    FROM monthly_sales ms
    JOIN visible v
      ON v.sc_key        = ms.sc_key
     AND v.base_year     = ms.base_year
     AND v.base_month_no = ms.base_month_no
    GROUP BY v.base_year, v.base_month_no,
             v.brand_nm, v.dealer_nm, v.group_name, v.dept_nm,
             CASE WHEN @team_level = 1 THEN NULL ELSE v.sc_key END
),

/* 합계행 월평균 : 전체 6개월 출고합의 월평균 (나중에 SC수로 나눔) */
total_avg AS (
    SELECT
        base_year,
        base_month_no,
        AVG(CAST(month_total AS FLOAT)) AS avg_val
    FROM (
        SELECT ms.base_year, ms.base_month_no, ms.month_offset,
               SUM(ms.monthly_cnt) AS month_total
        FROM monthly_sales ms
        WHERE EXISTS (SELECT 1 FROM visible v
                      WHERE v.sc_key        = ms.sc_key
                        AND v.base_year     = ms.base_year
                        AND v.base_month_no = ms.base_month_no)
        GROUP BY ms.base_year, ms.base_month_no, ms.month_offset
    ) z
    GROUP BY base_year, base_month_no
),

/* 상세행. GROUP BY 의 CASE 가 팀레벨/SC레벨을 가른다. */
detail AS (
    SELECT
        v.base_year     AS [연도],
        v.base_month_no AS [월],
        0 AS grp,
        ROW_NUMBER() OVER (
            PARTITION BY v.base_year, v.base_month_no
            /* @sort_by_name = 1 : SC 이름 가나다순 (팀레벨은 계층순 유지)
               @sort_by_name = 0 : 브랜드 > 딜러 > 전시장 > 팀 > 이름 */
            ORDER BY CASE WHEN @sort_by_name = 1 AND @team_level = 0
                          THEN NULL ELSE v.brand_nm   END COLLATE Korean_Wansung_CI_AS,
                     CASE WHEN @sort_by_name = 1 AND @team_level = 0
                          THEN NULL ELSE v.dealer_nm  END COLLATE Korean_Wansung_CI_AS,
                     CASE WHEN @sort_by_name = 1 AND @team_level = 0
                          THEN NULL ELSE v.group_name END COLLATE Korean_Wansung_CI_AS,
                     CASE WHEN @sort_by_name = 1 AND @team_level = 0
                          THEN NULL ELSE v.dept_nm    END COLLATE Korean_Wansung_CI_AS,
                     CASE WHEN @team_level = 1 THEN NULL ELSE MAX(v.name) END
                          COLLATE Korean_Wansung_CI_AS
        ) AS sort_no,
        CAST(ROW_NUMBER() OVER (
            PARTITION BY v.base_year, v.base_month_no
            /* @sort_by_name = 1 : SC 이름 가나다순 (팀레벨은 계층순 유지)
               @sort_by_name = 0 : 브랜드 > 딜러 > 전시장 > 팀 > 이름 */
            ORDER BY CASE WHEN @sort_by_name = 1 AND @team_level = 0
                          THEN NULL ELSE v.brand_nm   END COLLATE Korean_Wansung_CI_AS,
                     CASE WHEN @sort_by_name = 1 AND @team_level = 0
                          THEN NULL ELSE v.dealer_nm  END COLLATE Korean_Wansung_CI_AS,
                     CASE WHEN @sort_by_name = 1 AND @team_level = 0
                          THEN NULL ELSE v.group_name END COLLATE Korean_Wansung_CI_AS,
                     CASE WHEN @sort_by_name = 1 AND @team_level = 0
                          THEN NULL ELSE v.dept_nm    END COLLATE Korean_Wansung_CI_AS,
                     CASE WHEN @team_level = 1 THEN NULL ELSE MAX(v.name) END
                          COLLATE Korean_Wansung_CI_AS
        ) AS VARCHAR(10)) AS [no.],

        v.brand_nm   AS [브랜드],
        v.dealer_nm  AS [딜러],
        v.group_name AS [전시장],
        v.dept_nm    AS [팀],
        CASE WHEN @team_level = 1 THEN NULL ELSE MAX(v.name)      END AS [SC],
        CASE WHEN @team_level = 1 THEN NULL ELSE MAX(v.sc_key)    END AS [sc_key],
        ISNULL(@grp_category, N'미지정')                              AS [평가기준],
        CASE WHEN @team_level = 1 THEN NULL ELSE MAX(v.grp_grade) END AS [그룹분류],

        COUNT(*)                                                  AS [SC수],
        SUM(CASE WHEN v.grp_grade = N'A'      THEN 1 ELSE 0 END)  AS [A],
        SUM(CASE WHEN v.grp_grade = N'B'      THEN 1 ELSE 0 END)  AS [B],
        SUM(CASE WHEN v.grp_grade = N'C'      THEN 1 ELSE 0 END)  AS [C],
        SUM(CASE WHEN v.grp_grade = N'미분류' THEN 1 ELSE 0 END)  AS [미분류],

        ISNULL(@model_nm,   N'모두') AS [모델],
        ISNULL(@variant_nm, N'모두') AS [차종],
        ISNULL(@my_cd,      N'모두') AS [연식],
        ISNULL(@sfx_cd,     N'모두') AS [SFX],

        CAST(COALESCE(MAX(da.avg_val), 0) AS DECIMAL(18,1)) AS [월평균 출고],
        CAST(COALESCE(CAST(SUM(v.canceled_cnt) AS FLOAT)
             / NULLIF(SUM(v.total_cnt), 0), 0) * 100 AS DECIMAL(18,1)) AS [누적취소율],
        SUM(v.sales_ytd) AS [연누적 출고],
        SUM(v.pma_in)    AS [PMA IN],
        CAST(COALESCE(CAST(SUM(v.pma_in) AS FLOAT)
             / NULLIF(SUM(v.sales_ytd), 0), 0) * 100 AS DECIMAL(18,0)) AS [PMA IN 비중],
        SUM(v.pma_out)   AS [PMA OUT],
        CAST(COALESCE(CAST(SUM(v.pma_out) AS FLOAT)
             / NULLIF(SUM(v.sales_ytd), 0), 0) * 100 AS DECIMAL(18,0)) AS [PMA OUT 비중]
    FROM visible v
    LEFT JOIN display_avg da
           ON da.base_year     = v.base_year
          AND da.base_month_no = v.base_month_no
          AND da.brand_nm      = v.brand_nm
          AND da.dealer_nm     = v.dealer_nm
          AND da.group_name    = v.group_name
          AND da.dept_nm       = v.dept_nm
          AND (da.group_key = v.sc_key OR (da.group_key IS NULL AND @team_level = 1))
    GROUP BY v.base_year, v.base_month_no,
             v.brand_nm, v.dealer_nm, v.group_name, v.dept_nm,
             CASE WHEN @team_level = 1 THEN NULL ELSE v.sc_key END
),

/* 합계행 */
grand AS (
    SELECT
        v.base_year     AS [연도],
        v.base_month_no AS [월],
        1 AS grp,
        2147483647 AS sort_no,
        N'' AS [no.],

        N'합계' AS [브랜드],
        NULL    AS [딜러],
        NULL    AS [전시장],
        NULL    AS [팀],
        NULL    AS [SC],
        NULL    AS [sc_key],
        ISNULL(@grp_category, N'미지정') AS [평가기준],
        NULL    AS [그룹분류],

        COUNT(*)                                                  AS [SC수],
        SUM(CASE WHEN v.grp_grade = N'A'      THEN 1 ELSE 0 END)  AS [A],
        SUM(CASE WHEN v.grp_grade = N'B'      THEN 1 ELSE 0 END)  AS [B],
        SUM(CASE WHEN v.grp_grade = N'C'      THEN 1 ELSE 0 END)  AS [C],
        SUM(CASE WHEN v.grp_grade = N'미분류' THEN 1 ELSE 0 END)  AS [미분류],

        NULL AS [모델],
        NULL AS [차종],
        NULL AS [연식],
        NULL AS [SFX],

        CAST(COALESCE(MAX(ta.avg_val) / NULLIF(COUNT(*), 0), 0) AS DECIMAL(18,1)) AS [월평균 출고],
        CAST(COALESCE(CAST(SUM(v.canceled_cnt) AS FLOAT)
             / NULLIF(SUM(v.total_cnt), 0), 0) * 100 AS DECIMAL(18,1)) AS [누적취소율],
        SUM(v.sales_ytd) AS [연누적 출고],
        SUM(v.pma_in)    AS [PMA IN],
        CAST(COALESCE(CAST(SUM(v.pma_in) AS FLOAT)
             / NULLIF(SUM(v.sales_ytd), 0), 0) * 100 AS DECIMAL(18,0)) AS [PMA IN 비중],
        SUM(v.pma_out)   AS [PMA OUT],
        CAST(COALESCE(CAST(SUM(v.pma_out) AS FLOAT)
             / NULLIF(SUM(v.sales_ytd), 0), 0) * 100 AS DECIMAL(18,0)) AS [PMA OUT 비중]
    FROM visible v
    LEFT JOIN total_avg ta
           ON ta.base_year     = v.base_year
          AND ta.base_month_no = v.base_month_no
    GROUP BY v.base_year, v.base_month_no
)

SELECT
    [연도], [월],
    [no.], [브랜드], [딜러], [전시장], [팀], [SC], [sc_key],
    [평가기준], [그룹분류],
    [SC수], [A], [B], [C], [미분류],
    [모델], [차종], [연식], [SFX],
    [월평균 출고], [누적취소율],
    [연누적 출고], [PMA IN], [PMA IN 비중], [PMA OUT], [PMA OUT 비중]
FROM (
    SELECT * FROM detail
    UNION ALL
    SELECT * FROM grand
) AS m
ORDER BY [연도], [월], m.grp, m.sort_no;