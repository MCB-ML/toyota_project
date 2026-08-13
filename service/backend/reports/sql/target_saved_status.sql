/* ── 파라미터 ──
   원본에서 파라미터 DECLARE 8개를 제거했다. mssql 드라이버가
   request.input()으로 바인딩해 주입한다(문자열 치환 금지).
     @year @month @brand @dealer_nm @group_name @dept_nm @active_yn @sc_name

   콤마 패딩 변수 7개에 CASE NULL 가드를 넣었다 — Fabric에서
   ',' + NULL + ',' 가 NULL이 아니라 ',,' 가 되어 "NULL=전체"가
   "NULL=결과 없음"으로 뒤집히기 때문이다(라이브로 확인된 문제).
   그 밖의 계산 로직과 페이지 고정 상수는 원문 그대로다. */

/* ══════════════════════════════════════════════════════════════════════════
   [목표 저장 현황] v3 (연·월 다중 선택) — 연×월 × SC(또는 부서)별 목표저장 여부
   ──────────────────────────────────────────────────────────────────────────
   ■ @sc_name 3분기 (컬럼 구성이 달라짐) :
       · NULL          → [부서레벨] SC 컬럼 없음. 부서당 1행,
                          목표저장여부 = 부서 내 한 명이라도 저장 시 Y,
                          저장플래그   = SC 저장플래그의 합(= 부서 내 저장 SC 수)
       · 'ALL'         → [SC레벨]  전체 SC. SC 1명당 1행, 저장여부 Y/N
       · '홍길동,김철수' → [SC레벨]  지정 SC만
   ■ 전체 조회 : @sc_name 외 모든 변수 NULL=전체.
       · @year/@month 도 NULL 허용 → STS 에 존재하는 전체 연×월이 행으로 출력.
       · 연·월 콤마 다중 지정 가능 (예: @month = N'1,2,3').
       · 연·월 모두 지정 시 STS 가 없어도 해당 연×월 조합으로 조회(전원 미저장 표시).
   ■ 출력 : [연도]·[월] 을 결과 맨 앞에 표시.
   ■ 기준 : FCT_CRM_TARGET_STS, 연×월별 save_yn='Y' 하나라도 있으면 저장(Y).
            STS 행이 없는 SC 는 미저장(N).
   ■ 필터 : LIKE 패딩(',값1,값2,'), STRING_SPLIT 미사용(8623 방지),
            콤마 뒤 공백 자동 제거(', ' → ','). 값에 콤마 포함 시 필터 불가.
   ■ 제외 : 창구SC / 고객지원팀·TOYOTA YM(부서) / user_id 목록
   ══════════════════════════════════════════════════════════════════════════ */

/* ── 기준 연·월 (NULL = 전체, 콤마로 여러 값 지정 가능) ── */

/* 연/월 패딩 (숫자값 → 공백 전체 제거) */
DECLARE @yearPad  NVARCHAR(MAX) = CASE WHEN @year IS NULL THEN NULL ELSE N',' + REPLACE(@year,  N' ', N'') + N',' END;
DECLARE @monthPad NVARCHAR(MAX) = CASE WHEN @month IS NULL THEN NULL ELSE N',' + REPLACE(@month, N' ', N'') + N',' END;

/* ── 슬라이서 (NULL=모두, 콤마 다중) ── */

/* ── SC 필터 값 : NULL 또는 'ALL'(대소문자·공백 무관)이면 필터 해제, 그 외엔 지정 SC ── */
DECLARE @sc_filter NVARCHAR(MAX) =
    CASE WHEN @sc_name IS NULL THEN NULL
         WHEN UPPER(LTRIM(RTRIM(@sc_name))) = N'ALL' THEN NULL
         ELSE @sc_name END;

/* ── 제외 규칙 ── */
DECLARE @exclude_facade NVARCHAR(50)  = N'창구SC';
DECLARE @exclude_dept   NVARCHAR(MAX) = N'고객지원팀,TOYOTA YM';
DECLARE @exclude_users  NVARCHAR(MAX) = NEXCLUDED_USER_ID_1,EXCLUDED_USER_ID_2;

/* ── LIKE 패딩 변수 (콤마 뒤 공백 자동 제거 ', ' → ',') ── */
DECLARE @brandPad      NVARCHAR(MAX) = CASE WHEN @brand IS NULL THEN NULL ELSE N',' + REPLACE(@brand,      N', ', N',') + N',' END;
DECLARE @dealer_nmPad  NVARCHAR(MAX) = CASE WHEN @dealer_nm IS NULL THEN NULL ELSE N',' + REPLACE(@dealer_nm,  N', ', N',') + N',' END;
DECLARE @group_namePad NVARCHAR(MAX) = CASE WHEN @group_name IS NULL THEN NULL ELSE N',' + REPLACE(@group_name, N', ', N',') + N',' END;
DECLARE @dept_nmPad    NVARCHAR(MAX) = CASE WHEN @dept_nm IS NULL THEN NULL ELSE N',' + REPLACE(@dept_nm,    N', ', N',') + N',' END;
DECLARE @active_ynPad  NVARCHAR(MAX) = CASE WHEN @active_yn IS NULL THEN NULL ELSE N',' + REPLACE(@active_yn,  N', ', N',') + N',' END;
DECLARE @sc_filterPad  NVARCHAR(MAX) = CASE WHEN @sc_filter IS NULL THEN NULL ELSE N',' + REPLACE(@sc_filter,  N', ', N',') + N',' END;

DECLARE @excl_deptPad  NVARCHAR(MAX) = N',' + REPLACE(@exclude_dept,  N', ', N',') + N',';
DECLARE @excl_usersPad NVARCHAR(MAX) = N',' + REPLACE(@exclude_users, N' ',  N'')  + N',';


IF @sc_name IS NULL
BEGIN
    /* ══════════ [부서레벨] SC 미지정 → 부서당 1행. SC 컬럼 없음 ══════════ */
    ;WITH
    elig_user AS (
        SELECT u.sc_key, u.dept_nm, u.group_name, dlr.dealer_nm
        FROM   ktws.DIM_MNG_USER u
        LEFT JOIN ktws.DIM_MNG_DEALER dlr ON u.dealer_key = dlr.dealer_key
        WHERE  ISNULL(u.facade_sc_yn,N'') <> @exclude_facade
          AND (@brandPad      IS NULL OR @brandPad      LIKE N'%,' + LTRIM(RTRIM(u.BRAND))       + N',%')
          AND (@dealer_nmPad  IS NULL OR @dealer_nmPad  LIKE N'%,' + LTRIM(RTRIM(dlr.dealer_nm)) + N',%')
          AND (@group_namePad IS NULL OR @group_namePad LIKE N'%,' + LTRIM(RTRIM(u.group_name))  + N',%')
          AND (@dept_nmPad    IS NULL OR @dept_nmPad    LIKE N'%,' + LTRIM(RTRIM(u.dept_nm))     + N',%')
          AND (@active_ynPad  IS NULL OR @active_ynPad  LIKE N'%,' + LTRIM(RTRIM(u.active_yn))   + N',%')
          AND (u.dept_nm IS NULL OR @excl_deptPad  NOT LIKE N'%,' + LTRIM(RTRIM(u.dept_nm)) + N',%')
          AND (u.user_id IS NULL OR @excl_usersPad NOT LIKE N'%,' + LTRIM(RTRIM(u.user_id)) + N',%')
    ),
    month_list AS (
        /* 연·월 특정 시 STS 유무와 무관하게 해당 월 1개 / 아니면 STS 존재 연×월 전체 */
        /* 연·월 모두 지정 → 달력에서 선택된 연×월 조합 생성(STS 유무 무관, 다중값 지원) */
        SELECT DISTINCT DATEFROMPARTS(c.[Year], c.[MonthNumber], 1) AS ym
        FROM ktws.DIM_CALENDAR_KTWS c
        WHERE @year IS NOT NULL AND @month IS NOT NULL
          AND @yearPad  LIKE N'%,' + CAST(c.[Year]        AS NVARCHAR(10)) + N',%'
          AND @monthPad LIKE N'%,' + CAST(c.[MonthNumber] AS NVARCHAR(10)) + N',%'
        UNION
        /* 하나라도 NULL → STS 에 존재하는 연×월 중 조건 일치분 */
        SELECT DISTINCT f.ym
        FROM ktws.FCT_CRM_TARGET_STS f
        WHERE (@year IS NULL OR @month IS NULL)
          AND (@yearPad  IS NULL OR @yearPad  LIKE N'%,' + CAST(YEAR(f.ym)  AS NVARCHAR(10)) + N',%')
          AND (@monthPad IS NULL OR @monthPad LIKE N'%,' + CAST(MONTH(f.ym) AS NVARCHAR(10)) + N',%')
    ),
    sc_save AS (
        SELECT f.sc_key, f.ym,
               MAX(CASE WHEN f.save_yn = N'Y' THEN 1 ELSE 0 END) AS saved
        FROM ktws.FCT_CRM_TARGET_STS f
        WHERE (@yearPad  IS NULL OR @yearPad  LIKE N'%,' + CAST(YEAR(f.ym)  AS NVARCHAR(10)) + N',%')
          AND (@monthPad IS NULL OR @monthPad LIKE N'%,' + CAST(MONTH(f.ym) AS NVARCHAR(10)) + N',%')
        GROUP BY f.sc_key, f.ym
    )
    SELECT
        YEAR(m.ym)    AS [연도],
        MONTH(m.ym)   AS [월],
        eu.dealer_nm  AS [딜러],
        eu.group_name AS [전시장],
        eu.dept_nm    AS [부서],
        CASE WHEN MAX(ISNULL(sv.saved,0))=1 THEN N'Y' ELSE N'N' END AS [목표저장여부],
        SUM(ISNULL(sv.saved,0)) AS [저장플래그]   -- SC 저장플래그의 합 = 부서 내 저장 SC 수 (도넛 수치용)
    FROM elig_user eu
    CROSS JOIN month_list m
    LEFT JOIN sc_save sv ON sv.sc_key = eu.sc_key AND sv.ym = m.ym
    GROUP BY
        YEAR(m.ym), MONTH(m.ym),
        eu.dealer_nm, eu.group_name, eu.dept_nm
    ORDER BY [연도], [월], [목표저장여부] DESC, [딜러], [전시장], [부서];
END
ELSE
BEGIN
    /* ══════════ [SC레벨] 'ALL'=전체 / 지정 SC → SC 1명당 1행(연×월별) ══════════ */
    ;WITH
    elig_user AS (
        SELECT u.sc_key, u.[name] AS sc_name, u.dept_nm, u.group_name, dlr.dealer_nm
        FROM   ktws.DIM_MNG_USER u
        LEFT JOIN ktws.DIM_MNG_DEALER dlr ON u.dealer_key = dlr.dealer_key
        WHERE  ISNULL(u.facade_sc_yn,N'') <> @exclude_facade
          AND (@brandPad      IS NULL OR @brandPad      LIKE N'%,' + LTRIM(RTRIM(u.BRAND))       + N',%')
          AND (@dealer_nmPad  IS NULL OR @dealer_nmPad  LIKE N'%,' + LTRIM(RTRIM(dlr.dealer_nm)) + N',%')
          AND (@group_namePad IS NULL OR @group_namePad LIKE N'%,' + LTRIM(RTRIM(u.group_name))  + N',%')
          AND (@dept_nmPad    IS NULL OR @dept_nmPad    LIKE N'%,' + LTRIM(RTRIM(u.dept_nm))     + N',%')
          AND (@active_ynPad  IS NULL OR @active_ynPad  LIKE N'%,' + LTRIM(RTRIM(u.active_yn))   + N',%')
          AND (@sc_filterPad  IS NULL OR @sc_filterPad  LIKE N'%,' + LTRIM(RTRIM(u.[name]))      + N',%')  -- ALL이면 전체
          AND (u.dept_nm IS NULL OR @excl_deptPad  NOT LIKE N'%,' + LTRIM(RTRIM(u.dept_nm)) + N',%')
          AND (u.user_id IS NULL OR @excl_usersPad NOT LIKE N'%,' + LTRIM(RTRIM(u.user_id)) + N',%')
    ),
    month_list AS (
        /* 연·월 모두 지정 → 달력에서 선택된 연×월 조합 생성(STS 유무 무관, 다중값 지원) */
        SELECT DISTINCT DATEFROMPARTS(c.[Year], c.[MonthNumber], 1) AS ym
        FROM ktws.DIM_CALENDAR_KTWS c
        WHERE @year IS NOT NULL AND @month IS NOT NULL
          AND @yearPad  LIKE N'%,' + CAST(c.[Year]        AS NVARCHAR(10)) + N',%'
          AND @monthPad LIKE N'%,' + CAST(c.[MonthNumber] AS NVARCHAR(10)) + N',%'
        UNION
        /* 하나라도 NULL → STS 에 존재하는 연×월 중 조건 일치분 */
        SELECT DISTINCT f.ym
        FROM ktws.FCT_CRM_TARGET_STS f
        WHERE (@year IS NULL OR @month IS NULL)
          AND (@yearPad  IS NULL OR @yearPad  LIKE N'%,' + CAST(YEAR(f.ym)  AS NVARCHAR(10)) + N',%')
          AND (@monthPad IS NULL OR @monthPad LIKE N'%,' + CAST(MONTH(f.ym) AS NVARCHAR(10)) + N',%')
    ),
    sc_save AS (
        SELECT f.sc_key, f.ym,
               MAX(CASE WHEN f.save_yn = N'Y' THEN 1 ELSE 0 END) AS saved
        FROM ktws.FCT_CRM_TARGET_STS f
        WHERE (@yearPad  IS NULL OR @yearPad  LIKE N'%,' + CAST(YEAR(f.ym)  AS NVARCHAR(10)) + N',%')
          AND (@monthPad IS NULL OR @monthPad LIKE N'%,' + CAST(MONTH(f.ym) AS NVARCHAR(10)) + N',%')
        GROUP BY f.sc_key, f.ym
    )
    /* 출력 : 연×월 × SC 1행. STS 없으면 '미저장'(N)
       · 도넛 : [목표저장여부] 그룹, SC 수(COUNT) 또는 [저장플래그] 합
       · 목록 : 그대로 테이블 */
    SELECT
        YEAR(m.ym)    AS [연도],
        MONTH(m.ym)   AS [월],
        eu.dealer_nm  AS [딜러],
        eu.group_name AS [전시장],
        eu.dept_nm    AS [부서],
        eu.sc_name    AS [SC],
        CASE WHEN ISNULL(sv.saved,0)=1 THEN N'Y' ELSE N'N' END AS [목표저장여부],
        ISNULL(sv.saved,0) AS [저장플래그]   -- 1=저장, 0=미저장 (도넛 수치용)
    FROM elig_user eu
    CROSS JOIN month_list m
    LEFT JOIN sc_save sv ON sv.sc_key = eu.sc_key AND sv.ym = m.ym
    ORDER BY [연도], [월], [목표저장여부] DESC, [딜러], [전시장], [부서], [SC];
END