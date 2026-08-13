/* ── 파라미터 ──
   원본에서 파라미터 DECLARE 9개를 제거했다. mssql 드라이버가
   request.input()으로 바인딩해 주입한다(문자열 치환 금지).
     @Year @MonthNumber @Brand @DealerNm @GroupName @DeptNm @ActYn @ScName @CommonTpNm

   콤마 패딩 변수 9개에 CASE NULL 가드를 넣었다 — Fabric에서
   ',' + NULL + ',' 가 NULL이 아니라 ',,' 가 되어 "NULL=전체"가
   "NULL=결과 없음"으로 뒤집히기 때문이다(라이브로 확인된 문제).
   그 밖의 계산 로직과 페이지 고정 상수는 원문 그대로다. */

/*═══════════════════════════════════════════════════════════════════════
   [활동 목표·실적 MTD 및 달성률] — LIKE 패딩 버전 v5

   ■ 목적
     선택한 기간과 사용자·조직·활동유형 조건을 기준으로
     주차별 누적(MTD) 목표, 누적 실적, 달성률 계산

   ■ 전체 조회
     · @ScName을 제외한 모든 변수는 NULL이면 전체 조회
     · @Year/@MonthNumber도 NULL 허용 → 해당 축 전체 (여러 연×월이 행으로 출력)
     · 연도·월 모두 콤마로 여러 값 동시 지정 가능 (예: @MonthNumber = N'1,2,3')
     · MTD 누적은 각 연×월 안에서 월초 주차부터 다시 누적(월별 리셋)

   ■ 필터방식
     · 다중 값 슬라이서는 전부 LIKE 패딩(',값1,값2,') 비교
     · STRING_SPLIT / IN 서브쿼리 미사용 → 8623 오류 방지
     · 값 자체에 콤마 포함 시 필터 불가
     · 콤마 뒤 공백은 자동 제거(', ' → ',')

   ■ @ScName 3분기
     · NULL  → SC 열 미표시 (브랜드/딜러/전시장/팀/재직여부 × 유형 레벨 집계)
     · 'ALL' → SC 열 표시 + 전체 SC
     · 값    → SC 열 표시 + 해당 SC만 (콤마 다중 가능)

   ■ 출력
     · 연도·월 열을 결과 맨 앞에 표시 (달력 기준)
     · 이후 조직/유형/월별주차/목표/활동/달성률(%)

   ■ 지표 정의 (원본 로직 유지)
     ① 목표(target_mtd) : FCT_CRM_TARGET_D.target_cnt 주차별 누적 합산
     ② 실적(actual_mtd) : FCT_ACTIVITY_v2.actual_cnt 주차별 누적 합산
     ③ 달성률(progress_rate) : 실적 ÷ 목표 × 100, 반올림 0자리
        · 목표 0 · 활동 0   → 0%
        · 목표 0 · 활동 있음 → 100%
        · 목표 있음 · 활동 0 → 0%
   ═══════════════════════════════════════════════════════════════════════*/

/* ── 1. 조회 연월 (NULL = 전체, 콤마로 여러 값 지정 가능) ── */

/* 연/월 패딩 (숫자값 → 공백 전체 제거) ※ 기간 파생(4번)보다 먼저 선언 필요 */
DECLARE @YearPad        NVARCHAR(MAX) = CASE WHEN @Year IS NULL THEN NULL ELSE N',' + REPLACE(@Year,        N' ', N'') + N',' END;
DECLARE @MonthNumberPad NVARCHAR(MAX) = CASE WHEN @MonthNumber IS NULL THEN NULL ELSE N',' + REPLACE(@MonthNumber, N' ', N'') + N',' END;

/* ── 2. 슬라이서 (NULL=전체, 여러 값은 콤마 구분, N'...' 사용) ── */

/* ── 3. 페이지 필터(제외 규칙) ── */
DECLARE @ExclFacade  NVARCHAR(50)  = N'창구SC';
DECLARE @ExclNames   NVARCHAR(MAX) = N'고객지원팀,TOYOTA YM';
DECLARE @ExclUserIds NVARCHAR(MAX) = NEXCLUDED_USER_ID_1,EXCLUDED_USER_ID_2;

/* ── 4. 파생 기간 : 선택된 연/월 조합의 달력 최소~최대 날짜
       (@Year·@MonthNumber 모두 NULL → 달력 전체 범위)
       ※ 날짜범위 + 연/월 보조체크 이중 적용:
         범위는 인덱스 활용(sargable)용, 연/월 체크는 '월만 지정' 케이스 보정용 ── */
DECLARE @PeriodStart DATE, @PeriodEnd DATE;
SELECT @PeriodStart = MIN([Date]),
       @PeriodEnd   = MAX([Date])
FROM [ktws].[DIM_CALENDAR_KTWS]
WHERE (@YearPad        IS NULL OR @YearPad        LIKE N'%,' + CAST([Year]        AS NVARCHAR(10)) + N',%')
  AND (@MonthNumberPad IS NULL OR @MonthNumberPad LIKE N'%,' + CAST([MonthNumber] AS NVARCHAR(10)) + N',%');

/* ── 5. LIKE 패딩 변수 (콤마 뒤 공백 자동 제거 ', ' → ',') ── */
DECLARE @BrandPad      NVARCHAR(MAX) = CASE WHEN @Brand IS NULL THEN NULL ELSE N',' + REPLACE(@Brand,      N', ', N',') + N',' END;
DECLARE @DealerNmPad   NVARCHAR(MAX) = CASE WHEN @DealerNm IS NULL THEN NULL ELSE N',' + REPLACE(@DealerNm,   N', ', N',') + N',' END;
DECLARE @GroupNamePad  NVARCHAR(MAX) = CASE WHEN @GroupName IS NULL THEN NULL ELSE N',' + REPLACE(@GroupName,  N', ', N',') + N',' END;
DECLARE @DeptNmPad     NVARCHAR(MAX) = CASE WHEN @DeptNm IS NULL THEN NULL ELSE N',' + REPLACE(@DeptNm,     N', ', N',') + N',' END;
DECLARE @ActYnPad      NVARCHAR(MAX) = CASE WHEN @ActYn IS NULL THEN NULL ELSE N',' + REPLACE(@ActYn,      N', ', N',') + N',' END;
DECLARE @ScNamePad     NVARCHAR(MAX) = CASE WHEN @ScName IS NULL THEN NULL ELSE N',' + REPLACE(@ScName,     N', ', N',') + N',' END;
DECLARE @CommonTpNmPad NVARCHAR(MAX) = CASE WHEN @CommonTpNm IS NULL THEN NULL ELSE N',' + REPLACE(@CommonTpNm, N', ', N',') + N',' END;

/* 제외 규칙 패딩: 사용자명은 값 내부 공백 보존(TOYOTA YM), user_id는 전체 공백 제거 */
DECLARE @ExclNamesPad   NVARCHAR(MAX) = N',' + REPLACE(@ExclNames,   N', ', N',') + N',';
DECLARE @ExclUserIdsPad NVARCHAR(MAX) = N',' + REPLACE(@ExclUserIds, N' ',  N'')  + N',';


IF @ScName IS NULL
BEGIN
    /* ═════════════════════════════════════════════════════════════════
       분기 A : SC 열 없음
       연×월 × 브랜드/딜러/전시장/팀/재직여부 × 유형 레벨 집계
       ═════════════════════════════════════════════════════════════════ */
    ;WITH calendar_weeks AS
    (
        /* 선택 기간에 존재하는 연×월×주차 */
        SELECT
            c.[Year]                 AS yr,
            c.[MonthNumber]          AS mn,
            c.WeekNumber_Monthly_txt AS week_nm,
            MIN(c.[Date])            AS week_start_date
        FROM [ktws].[DIM_CALENDAR_KTWS] AS c
        WHERE c.[Date] BETWEEN @PeriodStart AND @PeriodEnd
          AND (@YearPad        IS NULL OR @YearPad        LIKE N'%,' + CAST(c.[Year]        AS NVARCHAR(10)) + N',%')
          AND (@MonthNumberPad IS NULL OR @MonthNumberPad LIKE N'%,' + CAST(c.[MonthNumber] AS NVARCHAR(10)) + N',%')
        GROUP BY c.[Year], c.[MonthNumber], c.WeekNumber_Monthly_txt
    ),

    filtered_user AS
    (
        /* 사용자·조직 필터 (SC 필터 없음 → 전체 SC 합산) */
        SELECT
            u.sc_key,
            u.BRAND      AS brand,
            d.dealer_nm  AS dealer_nm,
            u.group_name AS group_name,
            u.dept_nm    AS dept_nm,
            u.active_yn  AS active_yn
        FROM [ktws].[DIM_MNG_USER] AS u
        INNER JOIN [ktws].[DIM_MNG_DEALER] AS d
            ON u.dealer_key = d.dealer_key
        WHERE
            /* 페이지 필터 */
            ISNULL(u.facade_sc_yn, N'') <> @ExclFacade

            AND @ExclNamesPad NOT LIKE N'%,' + LTRIM(RTRIM(u.[name])) + N',%'

            AND
            (
                u.user_id IS NULL
                OR @ExclUserIdsPad NOT LIKE N'%,' + LTRIM(RTRIM(u.user_id)) + N',%'
            )

            /* 공백 제외 */
            AND u.BRAND IS NOT NULL      AND LTRIM(RTRIM(u.BRAND)) <> N''
            AND d.dealer_nm IS NOT NULL  AND LTRIM(RTRIM(d.dealer_nm)) <> N''
            AND u.group_name IS NOT NULL AND LTRIM(RTRIM(u.group_name)) <> N''
            AND u.dept_nm IS NOT NULL    AND LTRIM(RTRIM(u.dept_nm)) <> N''
            AND u.active_yn IS NOT NULL  AND LTRIM(RTRIM(u.active_yn)) <> N''
            AND u.[name] IS NOT NULL     AND LTRIM(RTRIM(u.[name])) <> N''

            /* 선택 필터 (LIKE 패딩, NULL=전체) */
            AND (@BrandPad     IS NULL OR @BrandPad     LIKE N'%,' + LTRIM(RTRIM(u.BRAND))      + N',%')
            AND (@DealerNmPad  IS NULL OR @DealerNmPad  LIKE N'%,' + LTRIM(RTRIM(d.dealer_nm))  + N',%')
            AND (@GroupNamePad IS NULL OR @GroupNamePad LIKE N'%,' + LTRIM(RTRIM(u.group_name)) + N',%')
            AND (@DeptNmPad    IS NULL OR @DeptNmPad    LIKE N'%,' + LTRIM(RTRIM(u.dept_nm))    + N',%')
            AND (@ActYnPad     IS NULL OR @ActYnPad     LIKE N'%,' + LTRIM(RTRIM(u.active_yn))  + N',%')
    ),

    filtered_type AS
    (
        /* 활동유형 공통 필터 */
        SELECT
            t.tp_key,
            aord.tp_grp_1,
            aord.tp_grp_2,
            aord.common_tp_nm
        FROM [ktws].[DIM_CRM_ACT_TYPE] AS t
        INNER JOIN [ktws].[DIM_CRM_ACT_TYPE_ORDER] AS aord
            ON t.common_tp_nm = aord.common_tp_nm
        WHERE
            t.tp_grp_1 IN (N'관계형성', N'기회창출')
            AND t.tp_grp_2 IN
            (
                N'미출고 고객', N'온라인', N'전시장 상담', N'출고 고객', N'판촉활동'
            )
            AND (@CommonTpNmPad IS NULL OR @CommonTpNmPad LIKE N'%,' + LTRIM(RTRIM(aord.common_tp_nm)) + N',%')
    ),

    target_data AS
    (
        /* 목표 원천 (FCT_CRM_TARGET_D) */
        SELECT
            u.brand, u.dealer_nm, u.group_name, u.dept_nm, u.active_yn,
            t.tp_grp_1, t.tp_grp_2, t.common_tp_nm,
            c.[Year]                 AS yr,
            c.[MonthNumber]          AS mn,
            c.WeekNumber_Monthly_txt AS week_nm,
            f.target_cnt
        FROM [ktws].[FCT_CRM_TARGET_D] AS f
        INNER JOIN [ktws].[DIM_CALENDAR_KTWS] AS c
            ON f.daily_dt = c.[Date]
        INNER JOIN filtered_type AS t
            ON f.type_cd = t.tp_key
        INNER JOIN filtered_user AS u
            ON f.sc_key = u.sc_key
        WHERE c.[Date] BETWEEN @PeriodStart AND @PeriodEnd
          AND (@YearPad        IS NULL OR @YearPad        LIKE N'%,' + CAST(c.[Year]        AS NVARCHAR(10)) + N',%')
          AND (@MonthNumberPad IS NULL OR @MonthNumberPad LIKE N'%,' + CAST(c.[MonthNumber] AS NVARCHAR(10)) + N',%')
          AND t.tp_grp_1 IN (N'관계형성', N'기회창출')
    ),

    actual_data AS
    (
        /* 실적 원천 (FCT_ACTIVITY_v2) */
        SELECT
            u.brand, u.dealer_nm, u.group_name, u.dept_nm, u.active_yn,
            t.tp_grp_1, t.tp_grp_2, t.common_tp_nm,
            c.[Year]                 AS yr,
            c.[MonthNumber]          AS mn,
            c.WeekNumber_Monthly_txt AS week_nm,
            f.actual_cnt
        FROM [ktws].[FCT_ACTIVITY_v2] AS f
        INNER JOIN [ktws].[DIM_CALENDAR_KTWS] AS c
            ON f.act_dt_fr = c.[Date]
        INNER JOIN filtered_type AS t
            ON f.tp_key = t.tp_key
        INNER JOIN filtered_user AS u
            ON f.sc_key = u.sc_key
        WHERE c.[Date] BETWEEN @PeriodStart AND @PeriodEnd
          AND (@YearPad        IS NULL OR @YearPad        LIKE N'%,' + CAST(c.[Year]        AS NVARCHAR(10)) + N',%')
          AND (@MonthNumberPad IS NULL OR @MonthNumberPad LIKE N'%,' + CAST(c.[MonthNumber] AS NVARCHAR(10)) + N',%')
    ),

    weekly_target AS
    (
        SELECT
            brand, dealer_nm, group_name, dept_nm, active_yn,
            tp_grp_1, tp_grp_2, common_tp_nm,
            yr, mn, week_nm,
            SUM(ISNULL(target_cnt, 0)) AS weekly_target_cnt
        FROM target_data
        GROUP BY
            brand, dealer_nm, group_name, dept_nm, active_yn,
            tp_grp_1, tp_grp_2, common_tp_nm,
            yr, mn, week_nm
    ),

    weekly_actual AS
    (
        SELECT
            brand, dealer_nm, group_name, dept_nm, active_yn,
            tp_grp_1, tp_grp_2, common_tp_nm,
            yr, mn, week_nm,
            SUM(ISNULL(actual_cnt, 0)) AS weekly_actual_cnt
        FROM actual_data
        GROUP BY
            brand, dealer_nm, group_name, dept_nm, active_yn,
            tp_grp_1, tp_grp_2, common_tp_nm,
            yr, mn, week_nm
    ),

    result_dimension AS
    (
        /* 목표 또는 활동이 존재하는 연×월 × 조직·활동유형 목록 */
        SELECT DISTINCT
            brand, dealer_nm, group_name, dept_nm, active_yn,
            tp_grp_1, tp_grp_2, common_tp_nm,
            yr, mn
        FROM target_data
        UNION
        SELECT DISTINCT
            brand, dealer_nm, group_name, dept_nm, active_yn,
            tp_grp_1, tp_grp_2, common_tp_nm,
            yr, mn
        FROM actual_data
    ),

    weekly_grid AS
    (
        /* 데이터가 없는 주차도 포함하도록 해당 월의 전체 주차와 조인 */
        SELECT
            r.brand, r.dealer_nm, r.group_name, r.dept_nm, r.active_yn,
            r.tp_grp_1, r.tp_grp_2, r.common_tp_nm,
            r.yr, r.mn,
            w.week_nm, w.week_start_date,
            ISNULL(t.weekly_target_cnt, 0) AS weekly_target_cnt,
            ISNULL(a.weekly_actual_cnt, 0) AS weekly_actual_cnt
        FROM result_dimension AS r
        INNER JOIN calendar_weeks AS w
            ON  w.yr = r.yr
            AND w.mn = r.mn
        LEFT JOIN weekly_target AS t
            ON  t.brand        = r.brand
            AND t.dealer_nm    = r.dealer_nm
            AND t.group_name   = r.group_name
            AND t.dept_nm      = r.dept_nm
            AND t.active_yn    = r.active_yn
            AND t.tp_grp_1     = r.tp_grp_1
            AND t.tp_grp_2     = r.tp_grp_2
            AND t.common_tp_nm = r.common_tp_nm
            AND t.yr           = r.yr
            AND t.mn           = r.mn
            AND t.week_nm      = w.week_nm
        LEFT JOIN weekly_actual AS a
            ON  a.brand        = r.brand
            AND a.dealer_nm    = r.dealer_nm
            AND a.group_name   = r.group_name
            AND a.dept_nm      = r.dept_nm
            AND a.active_yn    = r.active_yn
            AND a.tp_grp_1     = r.tp_grp_1
            AND a.tp_grp_2     = r.tp_grp_2
            AND a.common_tp_nm = r.common_tp_nm
            AND a.yr           = r.yr
            AND a.mn           = r.mn
            AND a.week_nm      = w.week_nm
    ),

    cumulative_result AS
    (
        /* 주차별 누적 (연×월 파티션 → 매월 월초부터 다시 누적) */
        SELECT
            brand, dealer_nm, group_name, dept_nm, active_yn,
            tp_grp_1, tp_grp_2, common_tp_nm,
            yr, mn, week_nm, week_start_date,

            SUM(weekly_target_cnt) OVER
            (
                PARTITION BY
                    brand, dealer_nm, group_name, dept_nm, active_yn,
                    tp_grp_1, tp_grp_2, common_tp_nm,
                    yr, mn
                ORDER BY week_start_date
                ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
            ) AS target_mtd,

            SUM(weekly_actual_cnt) OVER
            (
                PARTITION BY
                    brand, dealer_nm, group_name, dept_nm, active_yn,
                    tp_grp_1, tp_grp_2, common_tp_nm,
                    yr, mn
                ORDER BY week_start_date
                ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
            ) AS actual_mtd
        FROM weekly_grid
    ),

    final_result AS
    (
        SELECT
            brand, dealer_nm, group_name, dept_nm, active_yn,
            tp_grp_1, tp_grp_2, common_tp_nm,
            yr, mn, week_nm, week_start_date,
            target_mtd, actual_mtd,

            CASE
                /* 목표 0 · 활동 0  → 0%   */
                WHEN ISNULL(target_mtd, 0) = 0
                 AND ISNULL(actual_mtd, 0) = 0
                    THEN CAST(0 AS DECIMAL(18, 2))

                /* 목표 0 · 활동 있음 → 100% (목표 없이 활동한 건 달성 인정) */
                WHEN ISNULL(target_mtd, 0) = 0
                    THEN CAST(100 AS DECIMAL(18, 2))

                ELSE
                    CAST
                    (
                        ROUND
                        (
                            CAST(ISNULL(actual_mtd, 0) AS DECIMAL(18, 4))
                            / CAST(target_mtd AS DECIMAL(18, 4))
                            * 100,
                            0 /*소수자리 필요할경우 설정*/
                        )
                        AS DECIMAL(18, 2)
                    )
            END AS progress_rate
        FROM cumulative_result
    )

    /* 최종 결과 (SC 열 없음) */
    SELECT
        yr            AS [연도],
        mn            AS [월],
        brand         AS [브랜드],
        dealer_nm     AS [딜러],
        group_name    AS [전시장],
        dept_nm       AS [팀],
        active_yn     AS [재직여부],
        tp_grp_1      AS [분류1],
        tp_grp_2      AS [분류2],
        common_tp_nm  AS [활동유형],
        week_nm       AS [월별주차],
        target_mtd    AS [목표],
        actual_mtd    AS [활동],
        progress_rate AS [달성률]
    FROM final_result
    ORDER BY
        yr, mn,
        brand, dealer_nm, group_name, dept_nm,
        tp_grp_1, tp_grp_2, common_tp_nm,
        week_start_date;
END
ELSE
BEGIN
    /* ═════════════════════════════════════════════════════════════════
       분기 B : SC 열 표시
       'ALL' → 전체 SC / 값 → 해당 SC만 (콤마 다중 가능)
       ═════════════════════════════════════════════════════════════════ */
    ;WITH calendar_weeks AS
    (
        SELECT
            c.[Year]                 AS yr,
            c.[MonthNumber]          AS mn,
            c.WeekNumber_Monthly_txt AS week_nm,
            MIN(c.[Date])            AS week_start_date
        FROM [ktws].[DIM_CALENDAR_KTWS] AS c
        WHERE c.[Date] BETWEEN @PeriodStart AND @PeriodEnd
          AND (@YearPad        IS NULL OR @YearPad        LIKE N'%,' + CAST(c.[Year]        AS NVARCHAR(10)) + N',%')
          AND (@MonthNumberPad IS NULL OR @MonthNumberPad LIKE N'%,' + CAST(c.[MonthNumber] AS NVARCHAR(10)) + N',%')
        GROUP BY c.[Year], c.[MonthNumber], c.WeekNumber_Monthly_txt
    ),

    filtered_user AS
    (
        SELECT
            u.sc_key,
            u.BRAND      AS brand,
            d.dealer_nm  AS dealer_nm,
            u.group_name AS group_name,
            u.dept_nm    AS dept_nm,
            u.active_yn  AS active_yn,
            u.[name]     AS sc_name
        FROM [ktws].[DIM_MNG_USER] AS u
        INNER JOIN [ktws].[DIM_MNG_DEALER] AS d
            ON u.dealer_key = d.dealer_key
        WHERE
            /* 페이지 필터 */
            ISNULL(u.facade_sc_yn, N'') <> @ExclFacade

            AND @ExclNamesPad NOT LIKE N'%,' + LTRIM(RTRIM(u.[name])) + N',%'

            AND
            (
                u.user_id IS NULL
                OR @ExclUserIdsPad NOT LIKE N'%,' + LTRIM(RTRIM(u.user_id)) + N',%'
            )

            /* 공백 제외 */
            AND u.BRAND IS NOT NULL      AND LTRIM(RTRIM(u.BRAND)) <> N''
            AND d.dealer_nm IS NOT NULL  AND LTRIM(RTRIM(d.dealer_nm)) <> N''
            AND u.group_name IS NOT NULL AND LTRIM(RTRIM(u.group_name)) <> N''
            AND u.dept_nm IS NOT NULL    AND LTRIM(RTRIM(u.dept_nm)) <> N''
            AND u.active_yn IS NOT NULL  AND LTRIM(RTRIM(u.active_yn)) <> N''
            AND u.[name] IS NOT NULL     AND LTRIM(RTRIM(u.[name])) <> N''

            /* 선택 필터 (LIKE 패딩, NULL=전체) */
            AND (@BrandPad     IS NULL OR @BrandPad     LIKE N'%,' + LTRIM(RTRIM(u.BRAND))      + N',%')
            AND (@DealerNmPad  IS NULL OR @DealerNmPad  LIKE N'%,' + LTRIM(RTRIM(d.dealer_nm))  + N',%')
            AND (@GroupNamePad IS NULL OR @GroupNamePad LIKE N'%,' + LTRIM(RTRIM(u.group_name)) + N',%')
            AND (@DeptNmPad    IS NULL OR @DeptNmPad    LIKE N'%,' + LTRIM(RTRIM(u.dept_nm))    + N',%')
            AND (@ActYnPad     IS NULL OR @ActYnPad     LIKE N'%,' + LTRIM(RTRIM(u.active_yn))  + N',%')

            /* SC 필터: 'ALL'이면 전체, 아니면 해당 SC만 */
            AND
            (
                @ScName = N'ALL'
                OR @ScNamePad LIKE N'%,' + LTRIM(RTRIM(u.[name])) + N',%'
            )
    ),

    filtered_type AS
    (
        SELECT
            t.tp_key,
            aord.tp_grp_1,
            aord.tp_grp_2,
            aord.common_tp_nm
        FROM [ktws].[DIM_CRM_ACT_TYPE] AS t
        INNER JOIN [ktws].[DIM_CRM_ACT_TYPE_ORDER] AS aord
            ON t.common_tp_nm = aord.common_tp_nm
        WHERE
            t.tp_grp_1 IN (N'관계형성', N'기회창출')
            AND t.tp_grp_2 IN
            (
                N'미출고 고객', N'온라인', N'전시장 상담', N'출고 고객', N'판촉활동'
            )
            AND (@CommonTpNmPad IS NULL OR @CommonTpNmPad LIKE N'%,' + LTRIM(RTRIM(aord.common_tp_nm)) + N',%')
    ),

    target_data AS
    (
        SELECT
            u.brand, u.dealer_nm, u.group_name, u.dept_nm, u.active_yn, u.sc_name,
            t.tp_grp_1, t.tp_grp_2, t.common_tp_nm,
            c.[Year]                 AS yr,
            c.[MonthNumber]          AS mn,
            c.WeekNumber_Monthly_txt AS week_nm,
            f.target_cnt
        FROM [ktws].[FCT_CRM_TARGET_D] AS f
        INNER JOIN [ktws].[DIM_CALENDAR_KTWS] AS c
            ON f.daily_dt = c.[Date]
        INNER JOIN filtered_type AS t
            ON f.type_cd = t.tp_key
        INNER JOIN filtered_user AS u
            ON f.sc_key = u.sc_key
        WHERE c.[Date] BETWEEN @PeriodStart AND @PeriodEnd
          AND (@YearPad        IS NULL OR @YearPad        LIKE N'%,' + CAST(c.[Year]        AS NVARCHAR(10)) + N',%')
          AND (@MonthNumberPad IS NULL OR @MonthNumberPad LIKE N'%,' + CAST(c.[MonthNumber] AS NVARCHAR(10)) + N',%')
          AND t.tp_grp_1 IN (N'관계형성', N'기회창출')
    ),

    actual_data AS
    (
        SELECT
            u.brand, u.dealer_nm, u.group_name, u.dept_nm, u.active_yn, u.sc_name,
            t.tp_grp_1, t.tp_grp_2, t.common_tp_nm,
            c.[Year]                 AS yr,
            c.[MonthNumber]          AS mn,
            c.WeekNumber_Monthly_txt AS week_nm,
            f.actual_cnt
        FROM [ktws].[FCT_ACTIVITY_v2] AS f
        INNER JOIN [ktws].[DIM_CALENDAR_KTWS] AS c
            ON f.act_dt_fr = c.[Date]
        INNER JOIN filtered_type AS t
            ON f.tp_key = t.tp_key
        INNER JOIN filtered_user AS u
            ON f.sc_key = u.sc_key
        WHERE c.[Date] BETWEEN @PeriodStart AND @PeriodEnd
          AND (@YearPad        IS NULL OR @YearPad        LIKE N'%,' + CAST(c.[Year]        AS NVARCHAR(10)) + N',%')
          AND (@MonthNumberPad IS NULL OR @MonthNumberPad LIKE N'%,' + CAST(c.[MonthNumber] AS NVARCHAR(10)) + N',%')
    ),

    weekly_target AS
    (
        SELECT
            brand, dealer_nm, group_name, dept_nm, active_yn, sc_name,
            tp_grp_1, tp_grp_2, common_tp_nm,
            yr, mn, week_nm,
            SUM(ISNULL(target_cnt, 0)) AS weekly_target_cnt
        FROM target_data
        GROUP BY
            brand, dealer_nm, group_name, dept_nm, active_yn, sc_name,
            tp_grp_1, tp_grp_2, common_tp_nm,
            yr, mn, week_nm
    ),

    weekly_actual AS
    (
        SELECT
            brand, dealer_nm, group_name, dept_nm, active_yn, sc_name,
            tp_grp_1, tp_grp_2, common_tp_nm,
            yr, mn, week_nm,
            SUM(ISNULL(actual_cnt, 0)) AS weekly_actual_cnt
        FROM actual_data
        GROUP BY
            brand, dealer_nm, group_name, dept_nm, active_yn, sc_name,
            tp_grp_1, tp_grp_2, common_tp_nm,
            yr, mn, week_nm
    ),

    result_dimension AS
    (
        SELECT DISTINCT
            brand, dealer_nm, group_name, dept_nm, active_yn, sc_name,
            tp_grp_1, tp_grp_2, common_tp_nm,
            yr, mn
        FROM target_data
        UNION
        SELECT DISTINCT
            brand, dealer_nm, group_name, dept_nm, active_yn, sc_name,
            tp_grp_1, tp_grp_2, common_tp_nm,
            yr, mn
        FROM actual_data
    ),

    weekly_grid AS
    (
        SELECT
            r.brand, r.dealer_nm, r.group_name, r.dept_nm, r.active_yn, r.sc_name,
            r.tp_grp_1, r.tp_grp_2, r.common_tp_nm,
            r.yr, r.mn,
            w.week_nm, w.week_start_date,
            ISNULL(t.weekly_target_cnt, 0) AS weekly_target_cnt,
            ISNULL(a.weekly_actual_cnt, 0) AS weekly_actual_cnt
        FROM result_dimension AS r
        INNER JOIN calendar_weeks AS w
            ON  w.yr = r.yr
            AND w.mn = r.mn
        LEFT JOIN weekly_target AS t
            ON  t.brand        = r.brand
            AND t.dealer_nm    = r.dealer_nm
            AND t.group_name   = r.group_name
            AND t.dept_nm      = r.dept_nm
            AND t.active_yn    = r.active_yn
            AND t.sc_name      = r.sc_name
            AND t.tp_grp_1     = r.tp_grp_1
            AND t.tp_grp_2     = r.tp_grp_2
            AND t.common_tp_nm = r.common_tp_nm
            AND t.yr           = r.yr
            AND t.mn           = r.mn
            AND t.week_nm      = w.week_nm
        LEFT JOIN weekly_actual AS a
            ON  a.brand        = r.brand
            AND a.dealer_nm    = r.dealer_nm
            AND a.group_name   = r.group_name
            AND a.dept_nm      = r.dept_nm
            AND a.active_yn    = r.active_yn
            AND a.sc_name      = r.sc_name
            AND a.tp_grp_1     = r.tp_grp_1
            AND a.tp_grp_2     = r.tp_grp_2
            AND a.common_tp_nm = r.common_tp_nm
            AND a.yr           = r.yr
            AND a.mn           = r.mn
            AND a.week_nm      = w.week_nm
    ),

    cumulative_result AS
    (
        /* 주차별 누적 (연×월 파티션 → 매월 월초부터 다시 누적) */
        SELECT
            brand, dealer_nm, group_name, dept_nm, active_yn, sc_name,
            tp_grp_1, tp_grp_2, common_tp_nm,
            yr, mn, week_nm, week_start_date,

            SUM(weekly_target_cnt) OVER
            (
                PARTITION BY
                    brand, dealer_nm, group_name, dept_nm, active_yn, sc_name,
                    tp_grp_1, tp_grp_2, common_tp_nm,
                    yr, mn
                ORDER BY week_start_date
                ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
            ) AS target_mtd,

            SUM(weekly_actual_cnt) OVER
            (
                PARTITION BY
                    brand, dealer_nm, group_name, dept_nm, active_yn, sc_name,
                    tp_grp_1, tp_grp_2, common_tp_nm,
                    yr, mn
                ORDER BY week_start_date
                ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
            ) AS actual_mtd
        FROM weekly_grid
    ),

    final_result AS
    (
        SELECT
            brand, dealer_nm, group_name, dept_nm, active_yn, sc_name,
            tp_grp_1, tp_grp_2, common_tp_nm,
            yr, mn, week_nm, week_start_date,
            target_mtd, actual_mtd,

            CASE
                /* 목표 0 · 활동 0  → 0%   */
                WHEN ISNULL(target_mtd, 0) = 0
                 AND ISNULL(actual_mtd, 0) = 0
                    THEN CAST(0 AS DECIMAL(18, 2))

                /* 목표 0 · 활동 있음 → 100% (목표 없이 활동한 건 달성 인정) */
                WHEN ISNULL(target_mtd, 0) = 0
                    THEN CAST(100 AS DECIMAL(18, 2))

                ELSE
                    CAST
                    (
                        ROUND
                        (
                            CAST(ISNULL(actual_mtd, 0) AS DECIMAL(18, 4))
                            / CAST(target_mtd AS DECIMAL(18, 4))
                            * 100,
                            0 /*소수자리 필요할경우 설정*/
                        )
                        AS DECIMAL(18, 2)
                    )
            END AS progress_rate
        FROM cumulative_result
    )

    /* 최종 결과 (SC 열 표시) */
    SELECT
        yr            AS [연도],
        mn            AS [월],
        brand         AS [브랜드],
        dealer_nm     AS [딜러],
        group_name    AS [전시장],
        dept_nm       AS [팀],
        active_yn     AS [재직여부],
        sc_name       AS [SC],
        tp_grp_1      AS [분류1],
        tp_grp_2      AS [분류2],
        common_tp_nm  AS [활동유형],
        week_nm       AS [월별주차],
        target_mtd    AS [목표],
        actual_mtd    AS [활동],
        progress_rate AS [달성률]
    FROM final_result
    ORDER BY
        yr, mn,
        brand, dealer_nm, group_name, dept_nm, sc_name,
        tp_grp_1, tp_grp_2, common_tp_nm,
        week_start_date;
END