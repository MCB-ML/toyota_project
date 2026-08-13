/* ══════════════════════════════════════════════════════════════════════════
   [일별 활동 진행 현황 — 계층별/조건분기] v2 (연·월·일 다중 선택) IF 로 팀레벨 / SC레벨 쿼리 분리
   ──────────────────────────────────────────────────────────────────────────
   ■ @sc_name 으로 실행 쿼리 자체가 갈림 (컬럼 구성도 달라짐) :
       · @sc_name = NULL          → [팀레벨]  컬럼: 연·월·일·브랜드·딜러·전시장·팀·유형…  (SC 컬럼 없음)
       · @sc_name = 'ALL'         → [SC레벨]  전체 SC.        컬럼에 SC 포함
       · @sc_name = '홍길동,김철수' → [SC레벨]  지정 SC만.      컬럼에 SC 포함
     → 에이전트: SC 없으면 NULL / "모든 SC"면 'ALL' / 특정 SC면 이름목록.

   ■ 기간     : @year/@month/@day 모두 NULL 허용 (NULL = 해당 축 전체),
                콤마로 여러 값 동시 지정 가능 (예: @day = N'1,15').
                · 셋 다 값     → 해당 날짜(들)
                · @day만 NULL  → 해당 월의 모든 날짜가 일별 행으로
                · 셋 다 NULL   → 전체 기간이 일별 행으로
                결과 그레인 = 연×월×일 (각 행의 값은 그 날짜 하루치).
   ■ 출력     : 연도·월·일 열을 결과 맨 앞에 표시.
   ■ 값 컬럼  : 활동목표 / 일일활동실적 / 일일잔여타겟
                · 일일잔여타겟은 행 단위에서 활동목표-일일활동실적으로 계산.
                · 목표 초과 달성 시 음수값을 0으로 치환하지 않고 그대로 유지.
                · 상위 집계 시 SUM(활동목표)-SUM(일일활동실적) 방식으로 합산되어
                  BI의 MAX(0, SUM(활동목표)-SUM(일일활동실적)) 계산과 동일하게 상계되도록 구현.
                · 최종 전체값이 음수인 경우에만 최종 집계 단계에서 0으로 처리 필요.
   ■ 표시범위 : 활동 또는 목표가 있는 날짜×조합만. 합계행 없음(leaf만).
   ■ 필터방식 : 다중 값은 전부 LIKE 패딩(',값1,값2,') 비교.
                STRING_SPLIT 미사용 → 8623 오류 방지. 값에 콤마 포함 시 필터 불가.
                콤마 뒤 공백은 자동 제거(', ' → ',').
   ■ 고정 제외(!=) : common_tp_nm != 견적,관계형성 소개,시승결과,시승예약,신차상담,시승완료
                     tp_grp_1     != (공백),연락,판매목표 대수,활동기준 대수
   ■ 제외(공통) : 창구SC / 고객지원팀·TOYOTA YM(dept 및 SC명 기준) / user_id 목록
                · BI와 동일하게 고객지원팀·TOYOTA YM을 제외하기 위해
                  dept_nm뿐 아니라 DIM_MNG_USER.name도 동일한 제외 목록으로 필터링.
                · 예: dept_nm='영업팀', name='고객지원팀'인 DTCUST도 제외.
   ══════════════════════════════════════════════════════════════════════════ */

/* ── 기간 (NULL = 전체, 콤마로 여러 값 지정 가능) ── */
DECLARE @year  NVARCHAR(MAX) = NULL;   -- 예) N'2026' / N'2025,2026' / NULL=전체 연도
DECLARE @month NVARCHAR(MAX) = NULL;   -- 예) N'7' / N'1,2,3' / NULL=전체 월
DECLARE @day   NVARCHAR(MAX) = NULL;   -- 예) N'15' / N'1,15' / NULL=전체 일

/* 연/월/일 패딩 (숫자값 → 공백 전체 제거) ※ 기간 파생보다 먼저 선언 필요 */
DECLARE @yearPad  NVARCHAR(MAX) = N',' + REPLACE(@year,  N' ', N'') + N',';
DECLARE @monthPad NVARCHAR(MAX) = N',' + REPLACE(@month, N' ', N'') + N',';
DECLARE @dayPad   NVARCHAR(MAX) = N',' + REPLACE(@day,   N' ', N'') + N',';

/* ── 슬라이서 (NULL=모두, 콤마 다중) ── */
DECLARE @brand       NVARCHAR(MAX) = NULL;
DECLARE @dealer_nm   NVARCHAR(MAX) = NULL;
DECLARE @group_name  NVARCHAR(MAX) = NULL;
DECLARE @dept_nm     NVARCHAR(MAX) = NULL;
DECLARE @active_yn   NVARCHAR(MAX) = NULL;   -- 예) N'재직'
DECLARE @sc_name     NVARCHAR(MAX) = NULL;   -- ★ NULL=팀레벨 / 'ALL'=전체SC / '홍길동,김철수'=지정SC
DECLARE @common_tp   NVARCHAR(MAX) = NULL;
DECLARE @tp_grp_1    NVARCHAR(MAX) = NULL;

/* ── SC 필터 값 : 'ALL'(대소문자·공백 무관)이면 필터 해제(전체 SC), 그 외엔 지정 SC로 필터 ── */
DECLARE @sc_filter NVARCHAR(MAX) = CASE WHEN UPPER(LTRIM(RTRIM(@sc_name))) = N'ALL' THEN NULL ELSE @sc_name END;

/* ── 시각적개체 고정 제외 ── */
DECLARE @exclude_common_tp NVARCHAR(MAX) = N'견적,관계형성 소개,시승결과,시승예약,신차상담,시승완료';
DECLARE @exclude_tp_grp    NVARCHAR(MAX) = N'연락,판매목표 대수,활동기준 대수';

/* ── 제외 규칙 ── */
DECLARE @exclude_facade NVARCHAR(50)  = N'창구SC';
DECLARE @exclude_dept   NVARCHAR(MAX) = N'고객지원팀,TOYOTA YM';
DECLARE @exclude_users  NVARCHAR(MAX) = NEXCLUDED_USER_ID_1,EXCLUDED_USER_ID_2;

/* ── 파생 기간 : 선택된 연/월/일 조합의 달력 최소~최대 날짜
       (전부 NULL → 달력 전체 범위)
       ※ 날짜범위 + 연/월/일 보조체크 이중 적용:
         범위는 인덱스 활용(sargable)용, 보조체크는 '월만/일만 지정' 케이스 보정용 ── */
DECLARE @PeriodStart DATE, @PeriodEnd DATE;
SELECT @PeriodStart = MIN([Date]),
       @PeriodEnd   = MAX([Date])
FROM ktws.DIM_CALENDAR_KTWS
WHERE (@yearPad  IS NULL OR @yearPad  LIKE N'%,' + CAST([Year]        AS NVARCHAR(10)) + N',%')
  AND (@monthPad IS NULL OR @monthPad LIKE N'%,' + CAST([MonthNumber] AS NVARCHAR(10)) + N',%')
  AND (@dayPad   IS NULL OR @dayPad   LIKE N'%,' + CAST(DAY([Date])   AS NVARCHAR(10)) + N',%');

/* ── LIKE 패딩 변수 (콤마 뒤 공백 자동 제거 ', ' → ',') ── */
DECLARE @brandPad      NVARCHAR(MAX) = N',' + REPLACE(@brand,      N', ', N',') + N',';
DECLARE @dealer_nmPad  NVARCHAR(MAX) = N',' + REPLACE(@dealer_nm,  N', ', N',') + N',';
DECLARE @group_namePad NVARCHAR(MAX) = N',' + REPLACE(@group_name, N', ', N',') + N',';
DECLARE @dept_nmPad    NVARCHAR(MAX) = N',' + REPLACE(@dept_nm,    N', ', N',') + N',';
DECLARE @active_ynPad  NVARCHAR(MAX) = N',' + REPLACE(@active_yn,  N', ', N',') + N',';
DECLARE @sc_filterPad  NVARCHAR(MAX) = N',' + REPLACE(@sc_filter,  N', ', N',') + N',';
DECLARE @common_tpPad  NVARCHAR(MAX) = N',' + REPLACE(@common_tp,  N', ', N',') + N',';
DECLARE @tp_grp_1Pad   NVARCHAR(MAX) = N',' + REPLACE(@tp_grp_1,   N', ', N',') + N',';

/* 제외 규칙 패딩: 값 내부 공백 보존(TOYOTA YM, 관계형성 소개 등), user_id만 전체 공백 제거 */
DECLARE @excl_common_tpPad NVARCHAR(MAX) = N',' + REPLACE(@exclude_common_tp, N', ', N',') + N',';
DECLARE @excl_tp_grpPad    NVARCHAR(MAX) = N',' + REPLACE(@exclude_tp_grp,    N', ', N',') + N',';
DECLARE @excl_deptPad      NVARCHAR(MAX) = N',' + REPLACE(@exclude_dept,      N', ', N',') + N',';
DECLARE @excl_usersPad     NVARCHAR(MAX) = N',' + REPLACE(@exclude_users,     N' ',  N'')  + N',';


IF @sc_name IS NULL
BEGIN
    /* ══════════════ [팀레벨] SC 미지정 → 팀(dept_nm)까지만. SC 컬럼 없음 ══════════════ */
    ;WITH
    elig_user AS (
        SELECT u.sc_key, u.BRAND AS brand_nm, dlr.dealer_nm, u.group_name, u.dept_nm
        FROM   ktws.DIM_MNG_USER u
        LEFT JOIN ktws.DIM_MNG_DEALER dlr ON u.dealer_key = dlr.dealer_key
        WHERE  ISNULL(u.facade_sc_yn,N'') <> @exclude_facade
          AND (@brandPad      IS NULL OR @brandPad      LIKE N'%,' + u.BRAND      + N',%')
          AND (@dealer_nmPad  IS NULL OR @dealer_nmPad  LIKE N'%,' + dlr.dealer_nm + N',%')
          AND (@group_namePad IS NULL OR @group_namePad LIKE N'%,' + u.group_name + N',%')
          AND (@dept_nmPad    IS NULL OR @dept_nmPad    LIKE N'%,' + u.dept_nm    + N',%')
          AND (@active_ynPad  IS NULL OR @active_ynPad  LIKE N'%,' + u.active_yn  + N',%')
          AND (u.dept_nm IS NULL OR @excl_deptPad  NOT LIKE N'%,' + u.dept_nm + N',%')
          AND (u.[name]  IS NULL OR @excl_deptPad  NOT LIKE N'%,' + u.[name]  + N',%')
          AND (u.user_id IS NULL OR @excl_usersPad NOT LIKE N'%,' + u.user_id + N',%')
    ),
    act_actual AS (
        SELECT eu.brand_nm, eu.dealer_nm, eu.group_name, eu.dept_nm,
               a.act_dt_fr AS act_date,
               t.tp_grp_1, t.common_tp_nm, SUM(a.cnt) AS act_daily
        FROM ktws.FCT_ACTIVITY_v2 a
        JOIN ktws.DIM_CRM_ACT_TYPE t ON a.tp_key = t.tp_key
        JOIN elig_user eu ON a.sc_key = eu.sc_key
        WHERE a.act_dt_fr BETWEEN @PeriodStart AND @PeriodEnd
          AND (@yearPad  IS NULL OR @yearPad  LIKE N'%,' + CAST(YEAR(a.act_dt_fr)  AS NVARCHAR(10)) + N',%')
          AND (@monthPad IS NULL OR @monthPad LIKE N'%,' + CAST(MONTH(a.act_dt_fr) AS NVARCHAR(10)) + N',%')
          AND (@dayPad   IS NULL OR @dayPad   LIKE N'%,' + CAST(DAY(a.act_dt_fr)   AS NVARCHAR(10)) + N',%')
          AND (a.act_result IS NULL OR a.act_result <> N'부재중')
          AND (a.contact_tp IS NULL OR a.contact_tp <> N'MSG')
        GROUP BY eu.brand_nm, eu.dealer_nm, eu.group_name, eu.dept_nm,
                 a.act_dt_fr, t.tp_grp_1, t.common_tp_nm
    ),
    act_target AS (
        SELECT eu.brand_nm, eu.dealer_nm, eu.group_name, eu.dept_nm,
               c.[Date] AS act_date,
               t.tp_grp_1, t.common_tp_nm, SUM(f.target_cnt) AS act_target
        FROM ktws.FCT_CRM_TARGET_D f
        JOIN ktws.DIM_CALENDAR_KTWS c ON f.daily_dt = c.[Date]
        JOIN ktws.DIM_CRM_ACT_TYPE t ON f.type_cd = t.tp_key
        JOIN elig_user eu ON f.sc_key = eu.sc_key
        WHERE c.[Date] BETWEEN @PeriodStart AND @PeriodEnd
          AND (@yearPad  IS NULL OR @yearPad  LIKE N'%,' + CAST(c.[Year]        AS NVARCHAR(10)) + N',%')
          AND (@monthPad IS NULL OR @monthPad LIKE N'%,' + CAST(c.[MonthNumber] AS NVARCHAR(10)) + N',%')
          AND (@dayPad   IS NULL OR @dayPad   LIKE N'%,' + CAST(DAY(c.[Date])   AS NVARCHAR(10)) + N',%')
        GROUP BY eu.brand_nm, eu.dealer_nm, eu.group_name, eu.dept_nm,
                 c.[Date], t.tp_grp_1, t.common_tp_nm
    ),
    grid AS (
        SELECT brand_nm, dealer_nm, group_name, dept_nm, act_date, tp_grp_1, common_tp_nm FROM act_actual
        UNION SELECT brand_nm, dealer_nm, group_name, dept_nm, act_date, tp_grp_1, common_tp_nm FROM act_target
    ),
    ord AS (
        SELECT common_tp_nm, MIN(tp_grp_1_order) AS grp_ord, MIN(tp_order) AS tp_ord
        FROM ktws.DIM_CRM_ACT_TYPE_ORDER GROUP BY common_tp_nm
    )
    SELECT
        YEAR(g.act_date)  AS [연도],
        MONTH(g.act_date) AS [월],
        DAY(g.act_date)   AS [일],
        g.brand_nm     AS [브랜드],
        g.dealer_nm    AS [딜러],
        g.group_name   AS [전시장],
        g.dept_nm      AS [팀],
        g.tp_grp_1     AS [활동유형분류],
        g.common_tp_nm AS [활동유형],
        CAST(ISNULL(tg.act_target,0) AS DECIMAL(18,0)) AS [활동목표],
        CAST(ISNULL(ac.act_daily,0)  AS DECIMAL(18,0)) AS [일일활동실적],
        CAST(
            ISNULL(tg.act_target,0) - ISNULL(ac.act_daily,0)
            AS DECIMAL(18,0)
        ) AS [일일잔여타겟]
    FROM grid g
    LEFT JOIN act_actual ac ON ac.brand_nm=g.brand_nm AND ac.dealer_nm=g.dealer_nm AND ac.group_name=g.group_name
                           AND ac.dept_nm=g.dept_nm AND ac.act_date=g.act_date
                           AND ac.tp_grp_1=g.tp_grp_1 AND ac.common_tp_nm=g.common_tp_nm
    LEFT JOIN act_target tg ON tg.brand_nm=g.brand_nm AND tg.dealer_nm=g.dealer_nm AND tg.group_name=g.group_name
                           AND tg.dept_nm=g.dept_nm AND tg.act_date=g.act_date
                           AND tg.tp_grp_1=g.tp_grp_1 AND tg.common_tp_nm=g.common_tp_nm
    LEFT JOIN ord o ON o.common_tp_nm = g.common_tp_nm
    WHERE g.tp_grp_1 IS NOT NULL AND LTRIM(RTRIM(g.tp_grp_1)) <> N''
      AND @excl_tp_grpPad NOT LIKE N'%,' + g.tp_grp_1 + N',%'
      AND (g.common_tp_nm IS NULL OR @excl_common_tpPad NOT LIKE N'%,' + g.common_tp_nm + N',%')
      AND (@tp_grp_1Pad  IS NULL OR @tp_grp_1Pad  LIKE N'%,' + g.tp_grp_1     + N',%')
      AND (@common_tpPad IS NULL OR @common_tpPad LIKE N'%,' + g.common_tp_nm + N',%')
    ORDER BY g.act_date, g.brand_nm, g.dealer_nm, g.group_name, g.dept_nm, o.grp_ord, o.tp_ord, g.common_tp_nm;
END
ELSE
BEGIN
    /* ══════════════ [SC레벨] @sc_name='ALL'(전체) 또는 지정 SC → SC(name)까지 전개 ══════════════ */
    ;WITH
    elig_user AS (
        SELECT u.sc_key, u.BRAND AS brand_nm, dlr.dealer_nm, u.group_name, u.dept_nm, u.[name] AS sc_name
        FROM   ktws.DIM_MNG_USER u
        LEFT JOIN ktws.DIM_MNG_DEALER dlr ON u.dealer_key = dlr.dealer_key
        WHERE  ISNULL(u.facade_sc_yn,N'') <> @exclude_facade
          AND (@brandPad      IS NULL OR @brandPad      LIKE N'%,' + u.BRAND      + N',%')
          AND (@dealer_nmPad  IS NULL OR @dealer_nmPad  LIKE N'%,' + dlr.dealer_nm + N',%')
          AND (@group_namePad IS NULL OR @group_namePad LIKE N'%,' + u.group_name + N',%')
          AND (@dept_nmPad    IS NULL OR @dept_nmPad    LIKE N'%,' + u.dept_nm    + N',%')
          AND (@active_ynPad  IS NULL OR @active_ynPad  LIKE N'%,' + u.active_yn  + N',%')
          AND (@sc_filterPad  IS NULL OR @sc_filterPad  LIKE N'%,' + u.[name]     + N',%')  -- ALL이면 @sc_filter=NULL → 전체
          AND (u.dept_nm IS NULL OR @excl_deptPad  NOT LIKE N'%,' + u.dept_nm + N',%')
          AND (u.[name]  IS NULL OR @excl_deptPad  NOT LIKE N'%,' + u.[name]  + N',%')
          AND (u.user_id IS NULL OR @excl_usersPad NOT LIKE N'%,' + u.user_id + N',%')
    ),
    act_actual AS (
        SELECT eu.sc_key,
               a.act_dt_fr AS act_date,
               t.tp_grp_1, t.common_tp_nm, SUM(a.cnt) AS act_daily
        FROM ktws.FCT_ACTIVITY_v2 a
        JOIN ktws.DIM_CRM_ACT_TYPE t ON a.tp_key = t.tp_key
        JOIN elig_user eu ON a.sc_key = eu.sc_key
        WHERE a.act_dt_fr BETWEEN @PeriodStart AND @PeriodEnd
          AND (@yearPad  IS NULL OR @yearPad  LIKE N'%,' + CAST(YEAR(a.act_dt_fr)  AS NVARCHAR(10)) + N',%')
          AND (@monthPad IS NULL OR @monthPad LIKE N'%,' + CAST(MONTH(a.act_dt_fr) AS NVARCHAR(10)) + N',%')
          AND (@dayPad   IS NULL OR @dayPad   LIKE N'%,' + CAST(DAY(a.act_dt_fr)   AS NVARCHAR(10)) + N',%')
          AND (a.act_result IS NULL OR a.act_result <> N'부재중')
          AND (a.contact_tp IS NULL OR a.contact_tp <> N'MSG')
        GROUP BY eu.sc_key, a.act_dt_fr, t.tp_grp_1, t.common_tp_nm
    ),
    act_target AS (
        SELECT eu.sc_key,
               c.[Date] AS act_date,
               t.tp_grp_1, t.common_tp_nm, SUM(f.target_cnt) AS act_target
        FROM ktws.FCT_CRM_TARGET_D f
        JOIN ktws.DIM_CALENDAR_KTWS c ON f.daily_dt = c.[Date]
        JOIN ktws.DIM_CRM_ACT_TYPE t ON f.type_cd = t.tp_key
        JOIN elig_user eu ON f.sc_key = eu.sc_key
        WHERE c.[Date] BETWEEN @PeriodStart AND @PeriodEnd
          AND (@yearPad  IS NULL OR @yearPad  LIKE N'%,' + CAST(c.[Year]        AS NVARCHAR(10)) + N',%')
          AND (@monthPad IS NULL OR @monthPad LIKE N'%,' + CAST(c.[MonthNumber] AS NVARCHAR(10)) + N',%')
          AND (@dayPad   IS NULL OR @dayPad   LIKE N'%,' + CAST(DAY(c.[Date])   AS NVARCHAR(10)) + N',%')
        GROUP BY eu.sc_key, c.[Date], t.tp_grp_1, t.common_tp_nm
    ),
    grid AS (
        SELECT sc_key, act_date, tp_grp_1, common_tp_nm FROM act_actual
        UNION SELECT sc_key, act_date, tp_grp_1, common_tp_nm FROM act_target
    ),
    ord AS (
        SELECT common_tp_nm, MIN(tp_grp_1_order) AS grp_ord, MIN(tp_order) AS tp_ord
        FROM ktws.DIM_CRM_ACT_TYPE_ORDER GROUP BY common_tp_nm
    )
    SELECT
        YEAR(g.act_date)  AS [연도],
        MONTH(g.act_date) AS [월],
        DAY(g.act_date)   AS [일],
        eu.brand_nm    AS [브랜드],
        eu.dealer_nm   AS [딜러],
        eu.group_name  AS [전시장],
        eu.dept_nm     AS [팀],
        eu.sc_name     AS [SC],
        g.tp_grp_1     AS [활동유형분류],
        g.common_tp_nm AS [활동유형],
        CAST(ISNULL(tg.act_target,0) AS DECIMAL(18,0)) AS [활동목표],
        CAST(ISNULL(ac.act_daily,0)  AS DECIMAL(18,0)) AS [일일활동실적],
        CAST(
            ISNULL(tg.act_target,0) - ISNULL(ac.act_daily,0)
            AS DECIMAL(18,0)
        ) AS [일일잔여타겟]
    FROM grid g
    JOIN      elig_user  eu ON eu.sc_key = g.sc_key
    LEFT JOIN act_actual ac ON ac.sc_key=g.sc_key AND ac.act_date=g.act_date
                           AND ac.tp_grp_1=g.tp_grp_1 AND ac.common_tp_nm=g.common_tp_nm
    LEFT JOIN act_target tg ON tg.sc_key=g.sc_key AND tg.act_date=g.act_date
                           AND tg.tp_grp_1=g.tp_grp_1 AND tg.common_tp_nm=g.common_tp_nm
    LEFT JOIN ord o ON o.common_tp_nm = g.common_tp_nm
    WHERE g.tp_grp_1 IS NOT NULL AND LTRIM(RTRIM(g.tp_grp_1)) <> N''
      AND @excl_tp_grpPad NOT LIKE N'%,' + g.tp_grp_1 + N',%'
      AND (g.common_tp_nm IS NULL OR @excl_common_tpPad NOT LIKE N'%,' + g.common_tp_nm + N',%')
      AND (@tp_grp_1Pad  IS NULL OR @tp_grp_1Pad  LIKE N'%,' + g.tp_grp_1     + N',%')
      AND (@common_tpPad IS NULL OR @common_tpPad LIKE N'%,' + g.common_tp_nm + N',%')
    ORDER BY g.act_date, eu.brand_nm, eu.dealer_nm, eu.group_name, eu.dept_nm, eu.sc_name, o.grp_ord, o.tp_ord, g.common_tp_nm;
END