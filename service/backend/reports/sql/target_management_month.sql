/* ── 파라미터 ──
   원본에서 파라미터 DECLARE 9개를 제거했다. 이 값들은 mssql 드라이버가
   request.input()으로 바인딩해 주입한다(문자열 치환 금지).
     @Year @Month @brand @dealer_nm @group_name @dept_nm @active_yn @sc_name @common_tp

   또한 NULL 가능한 pad 변수 9개에 CASE NULL 가드를 넣었다 — Fabric에서
   N',' + NULL + N',' 가 NULL이 아니라 ',,' 가 되어 "NULL=전체"가
   "NULL=결과 없음"으로 뒤집히기 때문이다(라이브로 확인된 문제).
   상수에서 파생되는 pad와 계산 로직은 원문 그대로다. */

/* ══════════════════════════════════════════════════════════════════════════
   [4. 목표 관리] 매트릭스 v5 (CTE 버전) — 임시테이블 CREATE/DROP 미사용
   ──────────────────────────────────────────────────────────────────────────
   ■ 변경점 : #elig / #detail / #flag  →  elig / detail / flag  CTE 로 전환.
              SELECT ... INTO, DROP TABLE IF EXISTS 문 전부 제거.
              CTE 스코프는 단일 문장이므로, 두 분기(부서레벨/SC레벨)에
              동일한 CTE 블록을 각각 선언함(로직은 완전히 동일).
   ■ 주의   : 임시테이블이 없어져 필터·지표 계산이 한 번만 평가된다는 보장이
              사라짐. 데이터량이 크면 8623(플랜 생성 실패)이 재발할 수 있음.
              그 경우 마지막 SELECT 에 OPTION (RECOMPILE) 또는
              OPTION (MAXRECURSION 0, FORCE ORDER) 등을 시도.

   ■ @sc_name 3분기 (컬럼 구성이 달라짐) :
       · @sc_name = NULL          → [부서레벨] SC·활동유형 컬럼 없음. 부서당 한 행(합계 기준)
       · @sc_name = 'ALL'         → [SC레벨]  전체 SC. 컬럼에 SC 포함
       · @sc_name = '홍길동,김철수' → [SC레벨]  지정 SC만. 컬럼에 SC 포함

   ■ 전체 조회 :
       · @sc_name 을 제외한 모든 변수는 NULL이면 전체 조회.
       · @Year/@Month 도 NULL 허용 → 해당 축 전체 (여러 연×월이 행으로 출력).
       · @Year/@Month 콤마 다중 지정 가능 (예: @Month = N'1,2,3').
       · 결과 그레인 = 연×월. [연도]·[월] 열을 맨 앞에 표시. 합계행도 연×월별 생성.

   ■ 값 컬럼(7) : 판매목표대수 / 활동기준대수 / 계약목표 / 영업기회목표 /
                  활동배수 / 활동목표 / 활동입력여부
   ■ 제외 : 창구SC / 고객지원팀·TOYOTA YM / user_id 목록
   ══════════════════════════════════════════════════════════════════════════ */

/* ── 기간 (NULL = 전체, 콤마로 여러 값 지정 가능) ── */

/* 연/월 패딩 (숫자값 → 공백 전체 제거) */
DECLARE @YearPad  NVARCHAR(MAX) = CASE WHEN @Year IS NULL THEN NULL ELSE N',' + REPLACE(@Year,  N' ', N'') + N',' END;
DECLARE @MonthPad NVARCHAR(MAX) = CASE WHEN @Month IS NULL THEN NULL ELSE N',' + REPLACE(@Month, N' ', N'') + N',' END;

/* ── SC 계열 슬라이서 (NULL=모두, 콤마 다중) ── */

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
DECLARE @common_tpPad  NVARCHAR(MAX) = CASE WHEN @common_tp IS NULL THEN NULL ELSE N',' + REPLACE(@common_tp,  N', ', N',') + N',' END;

/* 제외 규칙 패딩: dept 는 값 내부 공백 보존(TOYOTA YM), user_id 는 전체 공백 제거 */
DECLARE @excl_deptPad  NVARCHAR(MAX) = N',' + REPLACE(@exclude_dept,  N', ', N',') + N',';
DECLARE @excl_usersPad NVARCHAR(MAX) = N',' + REPLACE(@exclude_users, N' ',  N'')  + N',';


IF @sc_name IS NULL
BEGIN
    /* ══════════ [부서레벨] SC 미지정 → 부서당 한 행. SC·활동유형 컬럼 없음 ══════════ */
    ;WITH
    /* ① 슬라이서·제외 통과 SC */
    elig AS (
        SELECT u.sc_key, u.[name] AS sc_name, u.dept_nm, u.group_name, dlr.dealer_nm
        FROM   ktws.DIM_MNG_USER u
        LEFT JOIN ktws.DIM_MNG_DEALER dlr ON u.dealer_key = dlr.dealer_key
        WHERE  ISNULL(u.facade_sc_yn,N'') <> @exclude_facade
          AND (@brandPad      IS NULL OR @brandPad      LIKE N'%,' + LTRIM(RTRIM(u.BRAND))       + N',%')
          AND (@dealer_nmPad  IS NULL OR @dealer_nmPad  LIKE N'%,' + LTRIM(RTRIM(dlr.dealer_nm)) + N',%')
          AND (@group_namePad IS NULL OR @group_namePad LIKE N'%,' + LTRIM(RTRIM(u.group_name))  + N',%')
          AND (@dept_nmPad    IS NULL OR @dept_nmPad    LIKE N'%,' + LTRIM(RTRIM(u.dept_nm))     + N',%')
          AND (@active_ynPad  IS NULL OR @active_ynPad  LIKE N'%,' + LTRIM(RTRIM(u.active_yn))   + N',%')
          AND (@sc_filterPad  IS NULL OR @sc_filterPad  LIKE N'%,' + LTRIM(RTRIM(u.[name]))      + N',%')
          AND (u.dept_nm IS NULL OR @excl_deptPad  NOT LIKE N'%,' + LTRIM(RTRIM(u.dept_nm)) + N',%')
          AND (u.user_id IS NULL OR @excl_usersPad NOT LIKE N'%,' + LTRIM(RTRIM(u.user_id)) + N',%')
    ),
    /* ② 연×월 × SC×유형 상세 */
    lead_tgt AS (
        SELECT eu.sc_key, c.[Year] AS yr, c.[MonthNumber] AS mn, aord.common_tp_nm, SUM(f.target_cnt) AS v
        FROM ktws.FCT_CRM_TARGET_M f
        JOIN ktws.DIM_CALENDAR_KTWS c ON f.monthly_dt = c.[Date]
        JOIN ktws.DIM_CRM_ACT_TYPE t ON f.tp_key = t.tp_key
        JOIN ktws.DIM_CRM_ACT_TYPE_ORDER aord ON t.common_tp_nm = aord.common_tp_nm
        JOIN elig eu ON f.sc_key = eu.sc_key
        WHERE t.tp_grp_1 IN (N'관계형성',N'기회창출')
          AND (@YearPad  IS NULL OR @YearPad  LIKE N'%,' + CAST(c.[Year]        AS NVARCHAR(10)) + N',%')
          AND (@MonthPad IS NULL OR @MonthPad LIKE N'%,' + CAST(c.[MonthNumber] AS NVARCHAR(10)) + N',%')
        GROUP BY eu.sc_key, c.[Year], c.[MonthNumber], aord.common_tp_nm
    ),
    act_tgt AS (
        SELECT eu.sc_key, c.[Year] AS yr, c.[MonthNumber] AS mn, aord.common_tp_nm, SUM(f.target_cnt) AS v
        FROM ktws.FCT_CRM_TARGET_D f
        JOIN ktws.DIM_CALENDAR_KTWS c ON f.daily_dt = c.[Date]
        JOIN ktws.DIM_CRM_ACT_TYPE t ON f.type_cd = t.tp_key
        JOIN ktws.DIM_CRM_ACT_TYPE_ORDER aord ON t.common_tp_nm = aord.common_tp_nm
        JOIN elig eu ON f.sc_key = eu.sc_key
        WHERE t.tp_grp_1 IN (N'관계형성',N'기회창출')
          AND (@YearPad  IS NULL OR @YearPad  LIKE N'%,' + CAST(c.[Year]        AS NVARCHAR(10)) + N',%')
          AND (@MonthPad IS NULL OR @MonthPad LIKE N'%,' + CAST(c.[MonthNumber] AS NVARCHAR(10)) + N',%')
        GROUP BY eu.sc_key, c.[Year], c.[MonthNumber], aord.common_tp_nm
    ),
    multi_tgt AS (
        SELECT eu.sc_key, c.[Year] AS yr, c.[MonthNumber] AS mn, aord.common_tp_nm, MAX(f.target_multi) AS v
        FROM ktws.FCT_CRM_TARGET_M f
        JOIN ktws.DIM_CALENDAR_KTWS c ON f.monthly_dt = c.[Date]
        JOIN ktws.DIM_CRM_ACT_TYPE t ON f.tp_key = t.tp_key
        JOIN ktws.DIM_CRM_ACT_TYPE_ORDER aord ON t.common_tp_nm = aord.common_tp_nm
        JOIN elig eu ON f.sc_key = eu.sc_key
        WHERE t.tp_grp_1 IN (N'관계형성',N'기회창출')
          AND (@YearPad  IS NULL OR @YearPad  LIKE N'%,' + CAST(c.[Year]        AS NVARCHAR(10)) + N',%')
          AND (@MonthPad IS NULL OR @MonthPad LIKE N'%,' + CAST(c.[MonthNumber] AS NVARCHAR(10)) + N',%')
        GROUP BY eu.sc_key, c.[Year], c.[MonthNumber], aord.common_tp_nm
    ),
    sc_sales AS (
        SELECT eu.sc_key, c.[Year] AS yr, c.[MonthNumber] AS mn, SUM(f.target_cnt) AS v
        FROM ktws.FCT_CRM_TARGET_M f
        JOIN ktws.DIM_CALENDAR_KTWS c ON f.monthly_dt = c.[Date]
        JOIN ktws.DIM_CRM_ACT_TYPE t ON f.tp_key = t.tp_key
        JOIN elig eu ON f.sc_key = eu.sc_key
        WHERE t.tp_grp_1 = N'판매목표 대수'
          AND (@YearPad  IS NULL OR @YearPad  LIKE N'%,' + CAST(c.[Year]        AS NVARCHAR(10)) + N',%')
          AND (@MonthPad IS NULL OR @MonthPad LIKE N'%,' + CAST(c.[MonthNumber] AS NVARCHAR(10)) + N',%')
        GROUP BY eu.sc_key, c.[Year], c.[MonthNumber]
    ),
    sc_actbase AS (
        SELECT eu.sc_key, c.[Year] AS yr, c.[MonthNumber] AS mn, SUM(f.target_cnt) AS v
        FROM ktws.FCT_CRM_TARGET_M f
        JOIN ktws.DIM_CALENDAR_KTWS c ON f.monthly_dt = c.[Date]
        JOIN ktws.DIM_CRM_ACT_TYPE t ON f.tp_key = t.tp_key
        JOIN elig eu ON f.sc_key = eu.sc_key
        WHERE t.target_grp_nm = N'Main' AND t.tp_grp_1 = N'활동기준 대수'
          AND (@YearPad  IS NULL OR @YearPad  LIKE N'%,' + CAST(c.[Year]        AS NVARCHAR(10)) + N',%')
          AND (@MonthPad IS NULL OR @MonthPad LIKE N'%,' + CAST(c.[MonthNumber] AS NVARCHAR(10)) + N',%')
        GROUP BY eu.sc_key, c.[Year], c.[MonthNumber]
    ),
    sc_cntrct AS (
        SELECT eu.sc_key, c.[Year] AS yr, c.[MonthNumber] AS mn, SUM(f.target_cnt) AS v
        FROM ktws.FCT_CRM_TARGET_M f
        JOIN ktws.DIM_CALENDAR_KTWS c ON f.monthly_dt = c.[Date]
        JOIN ktws.DIM_CRM_ACT_TYPE t ON f.tp_key = t.tp_key
        JOIN elig eu ON f.sc_key = eu.sc_key
        WHERE t.common_tp_nm = N'계약'
          AND (@YearPad  IS NULL OR @YearPad  LIKE N'%,' + CAST(c.[Year]        AS NVARCHAR(10)) + N',%')
          AND (@MonthPad IS NULL OR @MonthPad LIKE N'%,' + CAST(c.[MonthNumber] AS NVARCHAR(10)) + N',%')
        GROUP BY eu.sc_key, c.[Year], c.[MonthNumber]
    ),
    sc_save AS (
        /* 활동입력여부: f.ym(월초일) 자체를 연×월로 사용 */
        SELECT eu.sc_key, YEAR(f.ym) AS yr, MONTH(f.ym) AS mn,
               MAX(CASE WHEN f.save_yn='Y' THEN 1 ELSE 0 END) AS saved,
               1 AS has_sts
        FROM ktws.FCT_CRM_TARGET_STS f
        JOIN elig eu ON f.sc_key = eu.sc_key
        WHERE (@YearPad  IS NULL OR @YearPad  LIKE N'%,' + CAST(YEAR(f.ym)  AS NVARCHAR(10)) + N',%')
          AND (@MonthPad IS NULL OR @MonthPad LIKE N'%,' + CAST(MONTH(f.ym) AS NVARCHAR(10)) + N',%')
        GROUP BY eu.sc_key, YEAR(f.ym), MONTH(f.ym)
    ),
    type_grid AS (
        SELECT sc_key, yr, mn, common_tp_nm FROM lead_tgt
        UNION SELECT sc_key, yr, mn, common_tp_nm FROM act_tgt
        UNION SELECT sc_key, yr, mn, common_tp_nm FROM multi_tgt
    ),
    detail AS (
        SELECT
            g.yr, g.mn,
            eu.dealer_nm, eu.group_name, eu.dept_nm, eu.sc_name, g.common_tp_nm,
            lt.v  AS 영업기회목표,
            at1.v AS 활동목표,
            mt.v  AS 활동배수_유형,
            ss.v  AS 판매목표_raw,
            sab.v AS 활동기준_raw,
            sc.v  AS 계약목표_raw,
            sv.saved AS 저장_raw,
            ISNULL(sv.has_sts,0) AS has_sts,
            ROW_NUMBER() OVER (PARTITION BY eu.sc_key, g.yr, g.mn ORDER BY g.common_tp_nm) AS sc_first,
            eu.sc_key AS sc_key
        FROM type_grid g
        JOIN elig eu ON eu.sc_key = g.sc_key
        LEFT JOIN lead_tgt   lt  ON lt.sc_key=g.sc_key  AND lt.yr=g.yr  AND lt.mn=g.mn  AND lt.common_tp_nm=g.common_tp_nm
        LEFT JOIN act_tgt    at1 ON at1.sc_key=g.sc_key AND at1.yr=g.yr AND at1.mn=g.mn AND at1.common_tp_nm=g.common_tp_nm
        LEFT JOIN multi_tgt  mt  ON mt.sc_key=g.sc_key  AND mt.yr=g.yr  AND mt.mn=g.mn  AND mt.common_tp_nm=g.common_tp_nm
        LEFT JOIN sc_sales   ss  ON ss.sc_key=g.sc_key  AND ss.yr=g.yr  AND ss.mn=g.mn
        LEFT JOIN sc_actbase sab ON sab.sc_key=g.sc_key AND sab.yr=g.yr AND sab.mn=g.mn
        LEFT JOIN sc_cntrct  sc  ON sc.sc_key=g.sc_key  AND sc.yr=g.yr  AND sc.mn=g.mn
        LEFT JOIN sc_save    sv  ON sv.sc_key=g.sc_key  AND sv.yr=g.yr  AND sv.mn=g.mn
        WHERE (@common_tpPad IS NULL OR @common_tpPad LIKE N'%,' + LTRIM(RTRIM(g.common_tp_nm)) + N',%')
    ),
    /* ③ flag_save_yn='T' 판정 : 연×월 × SC 단위 */
    flag AS (
        SELECT sc_key, yr, mn
        FROM detail
        GROUP BY sc_key, yr, mn
        HAVING ( SUM(ISNULL(영업기회목표,0)) <> 0
              OR SUM(ISNULL(활동목표,0)) <> 0
              OR MAX(ISNULL(활동배수_유형,0)) <> 0
              OR MAX(저장_raw) = 1 )
           AND MAX(has_sts) = 1
    )
    SELECT
        [연도], [월],
        [딜러], [전시장], [부서],
        [판매목표대수], [활동기준대수], [계약목표], [영업기회목표],
        [활동배수], [활동목표], [활동입력여부]
    FROM (
        SELECT
            d.yr AS [연도], d.mn AS [월],
            0 AS [정렬],
            d.dealer_nm AS [딜러], d.group_name AS [전시장], d.dept_nm AS [부서],
            SUM(CASE WHEN d.sc_first=1 THEN d.판매목표_raw END) AS [판매목표대수],
            SUM(CASE WHEN d.sc_first=1 THEN d.활동기준_raw END) AS [활동기준대수],
            SUM(CASE WHEN d.sc_first=1 THEN d.계약목표_raw  END) AS [계약목표],
            SUM(d.영업기회목표) AS [영업기회목표],
            CAST(SUM(d.활동목표) AS FLOAT) / NULLIF(SUM(d.영업기회목표),0) AS [활동배수],
            SUM(d.활동목표) AS [활동목표],
            CASE WHEN MAX(CASE WHEN d.sc_first=1 AND d.저장_raw=1 THEN 1 ELSE 0 END) = 1
                 THEN N'활동 저장됨' END AS [활동입력여부]
        FROM detail d
        JOIN flag fl ON fl.sc_key=d.sc_key AND fl.yr=d.yr AND fl.mn=d.mn
        GROUP BY d.yr, d.mn, d.dealer_nm, d.group_name, d.dept_nm

        UNION ALL

        SELECT
            d.yr AS [연도], d.mn AS [월],
            1 AS [정렬],
            N'합계' AS [딜러], NULL, NULL,
            SUM(CASE WHEN d.sc_first=1 THEN d.판매목표_raw ELSE 0 END),
            SUM(CASE WHEN d.sc_first=1 THEN d.활동기준_raw ELSE 0 END),
            SUM(CASE WHEN d.sc_first=1 THEN d.계약목표_raw  ELSE 0 END),
            SUM(d.영업기회목표),
            CAST(SUM(d.활동목표) AS FLOAT) / NULLIF(SUM(d.영업기회목표),0),
            SUM(d.활동목표),
            NULL
        FROM detail d
        JOIN flag fl ON fl.sc_key=d.sc_key AND fl.yr=d.yr AND fl.mn=d.mn
        GROUP BY d.yr, d.mn
    ) t
    ORDER BY t.[연도], t.[월], t.[정렬], t.[딜러], t.[전시장], t.[부서];
END
ELSE
BEGIN
    /* ══════════ [SC레벨] @sc_name='ALL'(전체) 또는 지정 SC → SC까지 전개 ══════════ */
    ;WITH
    elig AS (
        SELECT u.sc_key, u.[name] AS sc_name, u.dept_nm, u.group_name, dlr.dealer_nm
        FROM   ktws.DIM_MNG_USER u
        LEFT JOIN ktws.DIM_MNG_DEALER dlr ON u.dealer_key = dlr.dealer_key
        WHERE  ISNULL(u.facade_sc_yn,N'') <> @exclude_facade
          AND (@brandPad      IS NULL OR @brandPad      LIKE N'%,' + LTRIM(RTRIM(u.BRAND))       + N',%')
          AND (@dealer_nmPad  IS NULL OR @dealer_nmPad  LIKE N'%,' + LTRIM(RTRIM(dlr.dealer_nm)) + N',%')
          AND (@group_namePad IS NULL OR @group_namePad LIKE N'%,' + LTRIM(RTRIM(u.group_name))  + N',%')
          AND (@dept_nmPad    IS NULL OR @dept_nmPad    LIKE N'%,' + LTRIM(RTRIM(u.dept_nm))     + N',%')
          AND (@active_ynPad  IS NULL OR @active_ynPad  LIKE N'%,' + LTRIM(RTRIM(u.active_yn))   + N',%')
          AND (@sc_filterPad  IS NULL OR @sc_filterPad  LIKE N'%,' + LTRIM(RTRIM(u.[name]))      + N',%')
          AND (u.dept_nm IS NULL OR @excl_deptPad  NOT LIKE N'%,' + LTRIM(RTRIM(u.dept_nm)) + N',%')
          AND (u.user_id IS NULL OR @excl_usersPad NOT LIKE N'%,' + LTRIM(RTRIM(u.user_id)) + N',%')
    ),
    lead_tgt AS (
        SELECT eu.sc_key, c.[Year] AS yr, c.[MonthNumber] AS mn, aord.common_tp_nm, SUM(f.target_cnt) AS v
        FROM ktws.FCT_CRM_TARGET_M f
        JOIN ktws.DIM_CALENDAR_KTWS c ON f.monthly_dt = c.[Date]
        JOIN ktws.DIM_CRM_ACT_TYPE t ON f.tp_key = t.tp_key
        JOIN ktws.DIM_CRM_ACT_TYPE_ORDER aord ON t.common_tp_nm = aord.common_tp_nm
        JOIN elig eu ON f.sc_key = eu.sc_key
        WHERE t.tp_grp_1 IN (N'관계형성',N'기회창출')
          AND (@YearPad  IS NULL OR @YearPad  LIKE N'%,' + CAST(c.[Year]        AS NVARCHAR(10)) + N',%')
          AND (@MonthPad IS NULL OR @MonthPad LIKE N'%,' + CAST(c.[MonthNumber] AS NVARCHAR(10)) + N',%')
        GROUP BY eu.sc_key, c.[Year], c.[MonthNumber], aord.common_tp_nm
    ),
    act_tgt AS (
        SELECT eu.sc_key, c.[Year] AS yr, c.[MonthNumber] AS mn, aord.common_tp_nm, SUM(f.target_cnt) AS v
        FROM ktws.FCT_CRM_TARGET_D f
        JOIN ktws.DIM_CALENDAR_KTWS c ON f.daily_dt = c.[Date]
        JOIN ktws.DIM_CRM_ACT_TYPE t ON f.type_cd = t.tp_key
        JOIN ktws.DIM_CRM_ACT_TYPE_ORDER aord ON t.common_tp_nm = aord.common_tp_nm
        JOIN elig eu ON f.sc_key = eu.sc_key
        WHERE t.tp_grp_1 IN (N'관계형성',N'기회창출')
          AND (@YearPad  IS NULL OR @YearPad  LIKE N'%,' + CAST(c.[Year]        AS NVARCHAR(10)) + N',%')
          AND (@MonthPad IS NULL OR @MonthPad LIKE N'%,' + CAST(c.[MonthNumber] AS NVARCHAR(10)) + N',%')
        GROUP BY eu.sc_key, c.[Year], c.[MonthNumber], aord.common_tp_nm
    ),
    multi_tgt AS (
        SELECT eu.sc_key, c.[Year] AS yr, c.[MonthNumber] AS mn, aord.common_tp_nm, MAX(f.target_multi) AS v
        FROM ktws.FCT_CRM_TARGET_M f
        JOIN ktws.DIM_CALENDAR_KTWS c ON f.monthly_dt = c.[Date]
        JOIN ktws.DIM_CRM_ACT_TYPE t ON f.tp_key = t.tp_key
        JOIN ktws.DIM_CRM_ACT_TYPE_ORDER aord ON t.common_tp_nm = aord.common_tp_nm
        JOIN elig eu ON f.sc_key = eu.sc_key
        WHERE t.tp_grp_1 IN (N'관계형성',N'기회창출')
          AND (@YearPad  IS NULL OR @YearPad  LIKE N'%,' + CAST(c.[Year]        AS NVARCHAR(10)) + N',%')
          AND (@MonthPad IS NULL OR @MonthPad LIKE N'%,' + CAST(c.[MonthNumber] AS NVARCHAR(10)) + N',%')
        GROUP BY eu.sc_key, c.[Year], c.[MonthNumber], aord.common_tp_nm
    ),
    sc_sales AS (
        SELECT eu.sc_key, c.[Year] AS yr, c.[MonthNumber] AS mn, SUM(f.target_cnt) AS v
        FROM ktws.FCT_CRM_TARGET_M f
        JOIN ktws.DIM_CALENDAR_KTWS c ON f.monthly_dt = c.[Date]
        JOIN ktws.DIM_CRM_ACT_TYPE t ON f.tp_key = t.tp_key
        JOIN elig eu ON f.sc_key = eu.sc_key
        WHERE t.tp_grp_1 = N'판매목표 대수'
          AND (@YearPad  IS NULL OR @YearPad  LIKE N'%,' + CAST(c.[Year]        AS NVARCHAR(10)) + N',%')
          AND (@MonthPad IS NULL OR @MonthPad LIKE N'%,' + CAST(c.[MonthNumber] AS NVARCHAR(10)) + N',%')
        GROUP BY eu.sc_key, c.[Year], c.[MonthNumber]
    ),
    sc_actbase AS (
        SELECT eu.sc_key, c.[Year] AS yr, c.[MonthNumber] AS mn, SUM(f.target_cnt) AS v
        FROM ktws.FCT_CRM_TARGET_M f
        JOIN ktws.DIM_CALENDAR_KTWS c ON f.monthly_dt = c.[Date]
        JOIN ktws.DIM_CRM_ACT_TYPE t ON f.tp_key = t.tp_key
        JOIN elig eu ON f.sc_key = eu.sc_key
        WHERE t.target_grp_nm = N'Main' AND t.tp_grp_1 = N'활동기준 대수'
          AND (@YearPad  IS NULL OR @YearPad  LIKE N'%,' + CAST(c.[Year]        AS NVARCHAR(10)) + N',%')
          AND (@MonthPad IS NULL OR @MonthPad LIKE N'%,' + CAST(c.[MonthNumber] AS NVARCHAR(10)) + N',%')
        GROUP BY eu.sc_key, c.[Year], c.[MonthNumber]
    ),
    sc_cntrct AS (
        SELECT eu.sc_key, c.[Year] AS yr, c.[MonthNumber] AS mn, SUM(f.target_cnt) AS v
        FROM ktws.FCT_CRM_TARGET_M f
        JOIN ktws.DIM_CALENDAR_KTWS c ON f.monthly_dt = c.[Date]
        JOIN ktws.DIM_CRM_ACT_TYPE t ON f.tp_key = t.tp_key
        JOIN elig eu ON f.sc_key = eu.sc_key
        WHERE t.common_tp_nm = N'계약'
          AND (@YearPad  IS NULL OR @YearPad  LIKE N'%,' + CAST(c.[Year]        AS NVARCHAR(10)) + N',%')
          AND (@MonthPad IS NULL OR @MonthPad LIKE N'%,' + CAST(c.[MonthNumber] AS NVARCHAR(10)) + N',%')
        GROUP BY eu.sc_key, c.[Year], c.[MonthNumber]
    ),
    sc_save AS (
        SELECT eu.sc_key, YEAR(f.ym) AS yr, MONTH(f.ym) AS mn,
               MAX(CASE WHEN f.save_yn='Y' THEN 1 ELSE 0 END) AS saved,
               1 AS has_sts
        FROM ktws.FCT_CRM_TARGET_STS f
        JOIN elig eu ON f.sc_key = eu.sc_key
        WHERE (@YearPad  IS NULL OR @YearPad  LIKE N'%,' + CAST(YEAR(f.ym)  AS NVARCHAR(10)) + N',%')
          AND (@MonthPad IS NULL OR @MonthPad LIKE N'%,' + CAST(MONTH(f.ym) AS NVARCHAR(10)) + N',%')
        GROUP BY eu.sc_key, YEAR(f.ym), MONTH(f.ym)
    ),
    type_grid AS (
        SELECT sc_key, yr, mn, common_tp_nm FROM lead_tgt
        UNION SELECT sc_key, yr, mn, common_tp_nm FROM act_tgt
        UNION SELECT sc_key, yr, mn, common_tp_nm FROM multi_tgt
    ),
    detail AS (
        SELECT
            g.yr, g.mn,
            eu.dealer_nm, eu.group_name, eu.dept_nm, eu.sc_name, g.common_tp_nm,
            lt.v  AS 영업기회목표,
            at1.v AS 활동목표,
            mt.v  AS 활동배수_유형,
            ss.v  AS 판매목표_raw,
            sab.v AS 활동기준_raw,
            sc.v  AS 계약목표_raw,
            sv.saved AS 저장_raw,
            ISNULL(sv.has_sts,0) AS has_sts,
            ROW_NUMBER() OVER (PARTITION BY eu.sc_key, g.yr, g.mn ORDER BY g.common_tp_nm) AS sc_first,
            eu.sc_key AS sc_key
        FROM type_grid g
        JOIN elig eu ON eu.sc_key = g.sc_key
        LEFT JOIN lead_tgt   lt  ON lt.sc_key=g.sc_key  AND lt.yr=g.yr  AND lt.mn=g.mn  AND lt.common_tp_nm=g.common_tp_nm
        LEFT JOIN act_tgt    at1 ON at1.sc_key=g.sc_key AND at1.yr=g.yr AND at1.mn=g.mn AND at1.common_tp_nm=g.common_tp_nm
        LEFT JOIN multi_tgt  mt  ON mt.sc_key=g.sc_key  AND mt.yr=g.yr  AND mt.mn=g.mn  AND mt.common_tp_nm=g.common_tp_nm
        LEFT JOIN sc_sales   ss  ON ss.sc_key=g.sc_key  AND ss.yr=g.yr  AND ss.mn=g.mn
        LEFT JOIN sc_actbase sab ON sab.sc_key=g.sc_key AND sab.yr=g.yr AND sab.mn=g.mn
        LEFT JOIN sc_cntrct  sc  ON sc.sc_key=g.sc_key  AND sc.yr=g.yr  AND sc.mn=g.mn
        LEFT JOIN sc_save    sv  ON sv.sc_key=g.sc_key  AND sv.yr=g.yr  AND sv.mn=g.mn
        WHERE (@common_tpPad IS NULL OR @common_tpPad LIKE N'%,' + LTRIM(RTRIM(g.common_tp_nm)) + N',%')
    ),
    flag AS (
        SELECT sc_key, yr, mn
        FROM detail
        GROUP BY sc_key, yr, mn
        HAVING ( SUM(ISNULL(영업기회목표,0)) <> 0
              OR SUM(ISNULL(활동목표,0)) <> 0
              OR MAX(ISNULL(활동배수_유형,0)) <> 0
              OR MAX(저장_raw) = 1 )
           AND MAX(has_sts) = 1
    )
    SELECT
        [연도], [월],
        [딜러], [전시장], [부서], [SC], [활동유형],
        [판매목표대수], [활동기준대수], [계약목표], [영업기회목표],
        [활동배수], [활동목표], [활동입력여부]
    FROM (
        SELECT
            d.yr AS [연도], d.mn AS [월],
            0 AS [정렬],
            d.dealer_nm AS [딜러], d.group_name AS [전시장], d.dept_nm AS [부서],
            d.sc_name AS [SC], d.common_tp_nm AS [활동유형],
            CASE WHEN d.sc_first=1 THEN d.판매목표_raw END AS [판매목표대수],
            CASE WHEN d.sc_first=1 THEN d.활동기준_raw END AS [활동기준대수],
            CASE WHEN d.sc_first=1 THEN d.계약목표_raw  END AS [계약목표],
            d.영업기회목표 AS [영업기회목표],
            CAST(d.활동목표 AS FLOAT) / NULLIF(d.영업기회목표,0) AS [활동배수],
            d.활동목표 AS [활동목표],
            CASE WHEN d.sc_first=1 AND d.저장_raw=1 THEN N'활동 저장됨' END AS [활동입력여부]
        FROM detail d
        JOIN flag fl ON fl.sc_key=d.sc_key AND fl.yr=d.yr AND fl.mn=d.mn

        UNION ALL

        SELECT
            d.yr AS [연도], d.mn AS [월],
            1 AS [정렬],
            N'합계' AS [딜러], NULL, NULL, NULL, NULL,
            SUM(CASE WHEN d.sc_first=1 THEN d.판매목표_raw ELSE 0 END),
            SUM(CASE WHEN d.sc_first=1 THEN d.활동기준_raw ELSE 0 END),
            SUM(CASE WHEN d.sc_first=1 THEN d.계약목표_raw  ELSE 0 END),
            SUM(d.영업기회목표),
            CAST(SUM(d.활동목표) AS FLOAT) / NULLIF(SUM(d.영업기회목표),0),
            SUM(d.활동목표),
            NULL
        FROM detail d
        JOIN flag fl ON fl.sc_key=d.sc_key AND fl.yr=d.yr AND fl.mn=d.mn
        GROUP BY d.yr, d.mn
    ) t
    ORDER BY t.[연도], t.[월], t.[정렬], t.[딜러], t.[전시장], t.[부서], t.[SC], t.[활동유형];
END