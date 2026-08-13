/* ── 파라미터 ──
   원본(docs/4.목표관리_과거3개월퍼널실적.sql)의 파라미터 DECLARE를 제거했다.
   아래 값들은 mssql 드라이버가 request.input()으로 바인딩한다(문자열 치환 금지).
     @year @month @lookback_months @brand @dealer_nm @group_name @dept_nm
     @active_yn @sc_name @common_tp

   또한 NULL 가능한 pad 변수 9개에 CASE NULL 가드를 넣었다 — Fabric에서
   N',' + NULL + N',' 가 NULL이 아니라 ',,' 가 되어 "NULL=전체"가
   "NULL=결과 없음"으로 뒤집히기 때문이다(activity_funnel_status에서 실측 확인).
   그 밖의 계산 로직은 원문 그대로다. */

/* ══════════════════════════════════════════════════════════════════════════
   [과거 N개월 퍼널 실적 — 계층별] v9-CTE  ★ 임시테이블 CREATE/DROP 미사용
   딜러 > 전시장 > 부서 (> SC) > 활동유형  ×  활동 → 영업기회 → 계약
   ──────────────────────────────────────────────────────────────────────────
   ■ 변경점 : #base / #elig / #mon / #detail / #tot  →  base / elig / mon /
              detail / tot  CTE 로 전환. SELECT ... INTO, DROP TABLE 전부 제거.
              CTE 스코프는 단일 문장이므로 두 분기(부서레벨/SC레벨)에 동일한
              CTE 블록을 각각 선언. 계산 로직은 원본과 100% 동일.
   ■ 주의   : 임시테이블이 없어져 중간 결과가 물리적으로 고정되지 않음.
              detail / mon / elig 가 여러 번 인라인 전개되므로 플랜이 매우 커짐
              → 8623(플랜 생성 실패) 재발 가능. 발생 시 OPTION (RECOMPILE),
              그래도 안 되면 @lookback_months 축소 또는 테이블변수 방식 검토.

   ■ 원본 DAX
     활동     : 1. act_mtd_(avg3m)_preOp
     영업기회  : 2. lead_funnel_(mtd_avg3m)  ← 2. lead_funnel_(mtd)_preOp
     계약     : 3. cntrct_funnel_(mtd_avg3m) ← 3. cntrct_funnel_(mtd)
     전환율   : 8. cvr_lead/act, 8. cvr_cntrct/lead  (DIVIDE, 분모 0 → 0)

   ■ 기간 (DAX 원문 기준)
     · 활동     : EDATE(RefDate,-k) → 각 달 1일 ~ 기준일과 같은 일자(월말 클램프) = m_mtd
     · 영업기회  : DATEADD(-k,MONTH)+TOTALMTD → 각 달 1일 ~ 말일(전체) = m_eom
     · 계약     : 동일하게 각 달 전체 = m_eom
     · 평균     : 각 달 값 합 ÷ N (빈 달 = 0 포함)

   ■ 컨텍스트 전파 (REMOVEFILTERS 없음 → 행 필터가 관계를 타고 전부 전파)
     ┌─────────┬──────────────────────────────────────────────┐
     │ 표시 레벨 │ 적용 조건                                        │
     ├─────────┼──────────────────────────────────────────────┤
     │ SC×유형행│ 리드·활동·계약 SC = 행 SC / 유형 = 행 유형(common_tp) │
     │ 부서×유형│ 리드·활동·계약 SC ∈ 같은 부서 / 유형 = 행 유형        │
     │ 합계행   │ SC ∈ 스코프(elig) / 유형 조건 없음(tp_grp 만)        │
     └─────────┴──────────────────────────────────────────────┘

   ■ ★ 자격활동 : tp_grp_1 IN (관계형성,기회창출) + act_result <> '부재중'
                  + 활동일자 = 해당 월(1일~말일)  (활동↔달력 관계 활성)
                  계약의 자격활동은 추가로 lead_key IS NOT NULL
   ■ 계약의 리드 조건 : 등록월 = 그 달 / 마감조건(close_dt > 월말 OR NULL OR 출고일 있음)
   ■ 전환율 : 활동→영업기회 = 영업기회÷활동, 영업기회→계약 = 계약÷영업기회 (분모 0 → 0)
   ■ @sc_name 3분기 : NULL=[부서레벨, SC열 없음·활동유형은 표시] / 'ALL'=전체 SC / 값=지정 SC
   ■ 제외 : 창구SC / 고객지원팀·TOYOTA YM(부서) / 고객지원팀(더미SC, name) / user_id 목록
   ══════════════════════════════════════════════════════════════════════════ */

/* ── 기준월 (NULL = 오늘 기준 연·월 자동, 콤마로 여러 값 지정 가능) ── */

SET @year  = ISNULL(@year,  CAST(YEAR(GETDATE())  AS NVARCHAR(10)));
SET @month = ISNULL(@month, CAST(MONTH(GETDATE()) AS NVARCHAR(10)));

/* 연/월 패딩 (숫자값 → 공백 전체 제거) */
DECLARE @yearPad  NVARCHAR(MAX) = CASE WHEN @year IS NULL THEN NULL ELSE N',' + REPLACE(@year,  N' ', N'') + N',' END;
DECLARE @monthPad NVARCHAR(MAX) = CASE WHEN @month IS NULL THEN NULL ELSE N',' + REPLACE(@month, N' ', N'') + N',' END;

/* ── 조회 개월수 (DAX 원문은 3 고정. 에이전트가 질의에 맞춰 변경 가능) ── */

/* ── 슬라이서 (NULL=모두, 콤마 다중) ── */

/* ── SC 필터 값 : NULL 또는 'ALL'(대소문자·공백 무관)이면 필터 해제, 그 외엔 지정 SC ── */
DECLARE @sc_filter NVARCHAR(MAX) =
    CASE WHEN @sc_name IS NULL THEN NULL
         WHEN UPPER(LTRIM(RTRIM(@sc_name))) = N'ALL' THEN NULL
         ELSE @sc_name END;

/* ── 제외 규칙 ── */
DECLARE @exclude_facade NVARCHAR(50)  = N'창구SC';
DECLARE @exclude_dept   NVARCHAR(MAX) = N'고객지원팀,TOYOTA YM';
DECLARE @exclude_name   NVARCHAR(MAX) = N'고객지원팀';   -- 더미SC(name 기준)
DECLARE @exclude_users  NVARCHAR(MAX) = NEXCLUDED_USER_ID_1,EXCLUDED_USER_ID_2;

/* ── LIKE 패딩 변수 (콤마 뒤 공백 자동 제거 ', ' → ',') ── */
DECLARE @brandPad      NVARCHAR(MAX) = CASE WHEN @brand IS NULL THEN NULL ELSE N',' + REPLACE(@brand,      N', ', N',') + N',' END;
DECLARE @dealer_nmPad  NVARCHAR(MAX) = CASE WHEN @dealer_nm IS NULL THEN NULL ELSE N',' + REPLACE(@dealer_nm,  N', ', N',') + N',' END;
DECLARE @group_namePad NVARCHAR(MAX) = CASE WHEN @group_name IS NULL THEN NULL ELSE N',' + REPLACE(@group_name, N', ', N',') + N',' END;
DECLARE @dept_nmPad    NVARCHAR(MAX) = CASE WHEN @dept_nm IS NULL THEN NULL ELSE N',' + REPLACE(@dept_nm,    N', ', N',') + N',' END;
DECLARE @active_ynPad  NVARCHAR(MAX) = CASE WHEN @active_yn IS NULL THEN NULL ELSE N',' + REPLACE(@active_yn,  N', ', N',') + N',' END;
DECLARE @sc_filterPad  NVARCHAR(MAX) = CASE WHEN @sc_filter IS NULL THEN NULL ELSE N',' + REPLACE(@sc_filter,  N', ', N',') + N',' END;
DECLARE @common_tpPad  NVARCHAR(MAX) = CASE WHEN @common_tp IS NULL THEN NULL ELSE N',' + REPLACE(@common_tp,  N', ', N',') + N',' END;

DECLARE @excl_deptPad  NVARCHAR(MAX) = N',' + REPLACE(@exclude_dept,  N', ', N',') + N',';
DECLARE @excl_namePad  NVARCHAR(MAX) = N',' + REPLACE(@exclude_name,  N', ', N',') + N',';
DECLARE @excl_usersPad NVARCHAR(MAX) = N',' + REPLACE(@exclude_users, N' ',  N'')  + N',';


IF @sc_name IS NULL
BEGIN
    /* ══════════ [부서레벨] SC 미지정 → 부서×활동유형 행. SC 컬럼만 없음 ══════════
       DAX 컨텍스트: SC 행필터 없음 → 리드·활동·계약 SC ∈ 같은 부서 / 유형 = 행 유형 */
    ;WITH
    /* ══ 선택 기준 연×월 ══ */
    base AS (
        SELECT DISTINCT
               c.[Year]        AS base_yr,
               c.[MonthNumber] AS base_mn,
               DATEFROMPARTS(c.[Year], c.[MonthNumber], 1) AS base_month,
               EOMONTH(DATEFROMPARTS(c.[Year], c.[MonthNumber], 1)) AS ref_day
        FROM ktws.DIM_CALENDAR_KTWS c
        WHERE @yearPad  LIKE N'%,' + CAST(c.[Year]        AS NVARCHAR(10)) + N',%'
          AND @monthPad LIKE N'%,' + CAST(c.[MonthNumber] AS NVARCHAR(10)) + N',%'
    ),
    moffs AS (
        SELECT TOP (@lookback_months)
               ROW_NUMBER() OVER (ORDER BY (SELECT NULL)) AS moff
        FROM      (VALUES (0),(0),(0),(0),(0),(0),(0),(0),(0),(0)) a(n)
        CROSS JOIN (VALUES (0),(0),(0),(0),(0),(0),(0),(0),(0),(0)) b(n)   -- 최대 100개월
    ),
    /* ══ 직전 N개월 각 달 구간 ══
       m_start~m_eom : 리드·계약·자격활동 창 (달 전체)
       m_start~m_mtd : 활동 창 (EDATE 동작: 기준일과 같은 일자, 월말 클램프) */
    mon AS (
        SELECT
              bs.base_yr,
              bs.base_mn,
              t.moff,
              DATEFROMPARTS(YEAR(DATEADD(MONTH,-t.moff,bs.base_month)),
                            MONTH(DATEADD(MONTH,-t.moff,bs.base_month)),1)  AS m_start,
              EOMONTH(DATEADD(MONTH,-t.moff,bs.base_month))                  AS m_eom,
              CASE WHEN DATEADD(DAY, DAY(bs.ref_day)-1,
                                DATEFROMPARTS(YEAR(DATEADD(MONTH,-t.moff,bs.base_month)),
                                              MONTH(DATEADD(MONTH,-t.moff,bs.base_month)),1))
                        > EOMONTH(DATEADD(MONTH,-t.moff,bs.base_month))
                   THEN EOMONTH(DATEADD(MONTH,-t.moff,bs.base_month))
                   ELSE DATEADD(DAY, DAY(bs.ref_day)-1,
                                DATEFROMPARTS(YEAR(DATEADD(MONTH,-t.moff,bs.base_month)),
                                              MONTH(DATEADD(MONTH,-t.moff,bs.base_month)),1))
              END                                                            AS m_mtd
        FROM base bs
        CROSS JOIN moffs t
    ),
    /* ══ 슬라이서·제외 통과 SC : 필터는 여기서 한 번만 ══ */
    elig AS (
        SELECT
              u.sc_key,
              CAST(u.[name]      AS VARCHAR(200)) AS sc_name,
              CAST(u.dept_nm     AS VARCHAR(200)) AS dept_nm,
              CAST(u.group_name  AS VARCHAR(200)) AS group_name,
              CAST(dlr.dealer_nm AS VARCHAR(200)) AS dealer_nm
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
          AND (u.[name]  IS NULL OR @excl_namePad  NOT LIKE N'%,' + LTRIM(RTRIM(u.[name]))  + N',%')
          AND (u.user_id IS NULL OR @excl_usersPad NOT LIKE N'%,' + LTRIM(RTRIM(u.user_id)) + N',%')
    ),
    /* ── [측정값1] 활동 : 각 달 1일~m_mtd, 행 SC·행 유형, tp_grp·부재중 ── */
    act_raw AS (
        SELECT mn2.base_yr, mn2.base_mn,
               eu.sc_key, aord.common_tp_nm, mn2.moff, SUM(a.cnt) AS v
        FROM mon mn2
        JOIN ktws.FCT_ACTIVITY_v2 a
              ON a.act_dt_fr >= mn2.m_start AND a.act_dt_fr <= mn2.m_mtd
        JOIN ktws.DIM_CRM_ACT_TYPE t ON a.tp_key = t.tp_key
        JOIN ktws.DIM_CRM_ACT_TYPE_ORDER aord ON t.common_tp_nm = aord.common_tp_nm
        JOIN elig eu ON a.sc_key = eu.sc_key
        WHERE t.tp_grp_1 IN (N'관계형성',N'기회창출')
          AND (a.act_result IS NULL OR a.act_result <> N'부재중')
        GROUP BY mn2.base_yr, mn2.base_mn,
                 eu.sc_key, aord.common_tp_nm, mn2.moff
    ),
    act_avg AS (
        SELECT base_yr, base_mn, sc_key, common_tp_nm,
               CAST(SUM(v) AS FLOAT) / CAST(@lookback_months AS FLOAT) AS 활동
        FROM act_raw
        GROUP BY base_yr, base_mn, sc_key, common_tp_nm
    ),
    /* ── [측정값2] 영업기회 ── */
    lead_raw AS (
        SELECT mn2.base_yr, mn2.base_mn,
               eu.sc_key, aord.common_tp_nm, mn2.moff,
               COUNT(DISTINCT l.lead_key) AS v
        FROM mon mn2
        JOIN ktws.FCT_LEAD l
              ON l.lead_reg_dt >= mn2.m_start AND l.lead_reg_dt <= mn2.m_eom
        JOIN ktws.DIM_CRM_ACT_TYPE lct ON l.tp_key = lct.tp_key
        JOIN ktws.DIM_CRM_ACT_TYPE_ORDER aord ON lct.common_tp_nm = aord.common_tp_nm
        JOIN elig eu ON l.cl_sc_key = eu.sc_key
        WHERE ( l.close_dt > mn2.m_eom OR l.close_dt IS NULL OR l.last_retail_sales_dt IS NOT NULL )
          AND EXISTS (
                SELECT 1 FROM ktws.FCT_ACTIVITY_v2 a
                JOIN ktws.DIM_CRM_ACT_TYPE act ON a.tp_key = act.tp_key
                WHERE a.lead_key = l.lead_key
                  AND a.sc_key   = l.cl_sc_key                       /* 행 SC 컨텍스트 */
                  AND act.common_tp_nm = lct.common_tp_nm            /* 행 유형 컨텍스트(common_tp) */
                  AND act.tp_grp_1 IN (N'관계형성',N'기회창출')
                  AND a.act_dt_fr >= mn2.m_start
                  AND a.act_dt_fr <= mn2.m_eom                       /* ★ 컨텍스트 날짜(그 달) */
                  AND (a.act_result IS NULL OR a.act_result <> N'부재중') )
        GROUP BY mn2.base_yr, mn2.base_mn,
                 eu.sc_key, aord.common_tp_nm, mn2.moff
    ),
    lead_avg AS (
        SELECT base_yr, base_mn, sc_key, common_tp_nm,
               CAST(SUM(v) AS FLOAT) / CAST(@lookback_months AS FLOAT) AS 영업기회
        FROM lead_raw
        GROUP BY base_yr, base_mn, sc_key, common_tp_nm
    ),
    /* ── [측정값3] 계약 ── */
    cntrct_raw AS (
        SELECT mn2.base_yr, mn2.base_mn,
               eu.sc_key, aord.common_tp_nm, mn2.moff, SUM(c.cnt) AS v
        FROM mon mn2
        JOIN ktws.FCT_CONTRACT_KTWS c
              ON c.contract_dt >= mn2.m_start AND c.contract_dt <= mn2.m_eom
        JOIN ktws.DIM_CRM_ACT_TYPE ct ON c.tp_key = ct.tp_key
        JOIN ktws.DIM_CRM_ACT_TYPE_ORDER aord ON ct.common_tp_nm = aord.common_tp_nm
        JOIN elig eu ON c.cn_sc_key = eu.sc_key
        WHERE EXISTS (
                SELECT 1 FROM ktws.FCT_LEAD l
                JOIN ktws.DIM_CRM_ACT_TYPE lct2 ON l.tp_key = lct2.tp_key
                WHERE l.lead_key = c.lead_key
                  AND l.cl_sc_key = c.cn_sc_key                      /* 행 SC 컨텍스트(리드도 그 SC) */
                  AND lct2.common_tp_nm = ct.common_tp_nm            /* 행 유형 컨텍스트(리드도 그 유형) */
                  AND l.lead_reg_dt >= mn2.m_start AND l.lead_reg_dt <= mn2.m_eom
                  AND ( l.close_dt > mn2.m_eom OR l.close_dt IS NULL OR l.last_retail_sales_dt IS NOT NULL )
                  AND EXISTS (
                        SELECT 1 FROM ktws.FCT_ACTIVITY_v2 a
                        JOIN ktws.DIM_CRM_ACT_TYPE act ON a.tp_key = act.tp_key
                        WHERE a.lead_key = l.lead_key
                          AND a.lead_key IS NOT NULL                 /* DAX: lead_key <> BLANK() */
                          AND a.sc_key   = c.cn_sc_key               /* 행 SC 컨텍스트 */
                          AND act.common_tp_nm = ct.common_tp_nm     /* 행 유형 컨텍스트 */
                          AND act.tp_grp_1 IN (N'관계형성',N'기회창출')
                          AND a.act_dt_fr >= mn2.m_start
                          AND a.act_dt_fr <= mn2.m_eom               /* ★ 컨텍스트 날짜(그 달) */
                          AND (a.act_result IS NULL OR a.act_result <> N'부재중') ) )
        GROUP BY mn2.base_yr, mn2.base_mn,
                 eu.sc_key, aord.common_tp_nm, mn2.moff
    ),
    cntrct_avg AS (
        SELECT base_yr, base_mn, sc_key, common_tp_nm,
               CAST(SUM(v) AS FLOAT) / CAST(@lookback_months AS FLOAT) AS 계약
        FROM cntrct_raw
        GROUP BY base_yr, base_mn, sc_key, common_tp_nm
    ),
    /* ── SC×유형 그리드 ── */
    grid AS (
        SELECT base_yr, base_mn, sc_key, common_tp_nm FROM act_avg
        UNION SELECT base_yr, base_mn, sc_key, common_tp_nm FROM lead_avg
        UNION SELECT base_yr, base_mn, sc_key, common_tp_nm FROM cntrct_avg
    ),
    detail AS (
        SELECT
            g.base_yr AS yr,
            g.base_mn AS mn,
            eu.dealer_nm, eu.group_name, eu.dept_nm, eu.sc_name, g.common_tp_nm,
            ISNULL(a.활동,0)     AS 활동,
            ISNULL(l.영업기회,0) AS 영업기회,
            ISNULL(c.계약,0)     AS 계약
        FROM grid g
        JOIN      elig       eu ON eu.sc_key = g.sc_key
        LEFT JOIN act_avg    a
               ON a.base_yr=g.base_yr AND a.base_mn=g.base_mn
              AND a.sc_key=g.sc_key AND a.common_tp_nm=g.common_tp_nm
        LEFT JOIN lead_avg   l
               ON l.base_yr=g.base_yr AND l.base_mn=g.base_mn
              AND l.sc_key=g.sc_key AND l.common_tp_nm=g.common_tp_nm
        LEFT JOIN cntrct_avg c
               ON c.base_yr=g.base_yr AND c.base_mn=g.base_mn
              AND c.sc_key=g.sc_key AND c.common_tp_nm=g.common_tp_nm
        WHERE (@common_tpPad IS NULL OR @common_tpPad LIKE N'%,' + LTRIM(RTRIM(g.common_tp_nm)) + N',%')
    ),
    /* ══ 합계행 전용 재계산 : 스코프 레벨 (SC·유형 행필터 없음 → tp_grp 만) ══ */
    tot_lead_raw AS (
        SELECT mn2.base_yr, mn2.base_mn, mn2.moff,
               COUNT(DISTINCT l.lead_key) AS v
        FROM mon mn2
        JOIN ktws.FCT_LEAD l
              ON l.lead_reg_dt >= mn2.m_start AND l.lead_reg_dt <= mn2.m_eom
        JOIN elig eu ON l.cl_sc_key = eu.sc_key
        WHERE ( l.close_dt > mn2.m_eom OR l.close_dt IS NULL OR l.last_retail_sales_dt IS NOT NULL )
          AND EXISTS (
                SELECT 1 FROM ktws.FCT_ACTIVITY_v2 a
                JOIN ktws.DIM_CRM_ACT_TYPE act ON a.tp_key = act.tp_key
                JOIN elig e3 ON e3.sc_key = a.sc_key                /* 스코프 컨텍스트 */
                WHERE a.lead_key = l.lead_key
                  AND act.tp_grp_1 IN (N'관계형성',N'기회창출')
                  AND a.act_dt_fr >= mn2.m_start
                  AND a.act_dt_fr <= mn2.m_eom                      /* ★ 컨텍스트 날짜(그 달) */
                  AND (a.act_result IS NULL OR a.act_result <> N'부재중') )
        GROUP BY mn2.base_yr, mn2.base_mn, mn2.moff
    ),
    tot_lead AS (
        SELECT base_yr, base_mn,
               CAST(SUM(v) AS FLOAT)/CAST(@lookback_months AS FLOAT) AS tot_lead
        FROM tot_lead_raw
        GROUP BY base_yr, base_mn
    ),
    tot_cntrct_raw AS (
        SELECT mn2.base_yr, mn2.base_mn, mn2.moff,
               SUM(c.cnt) AS v
        FROM mon mn2
        JOIN ktws.FCT_CONTRACT_KTWS c
              ON c.contract_dt >= mn2.m_start AND c.contract_dt <= mn2.m_eom
        JOIN elig eu ON c.cn_sc_key = eu.sc_key
        WHERE EXISTS (
                SELECT 1 FROM ktws.FCT_LEAD l
                WHERE l.lead_key = c.lead_key
                  AND EXISTS (SELECT 1 FROM elig e2 WHERE e2.sc_key = l.cl_sc_key)  /* 스코프 컨텍스트 */
                  AND l.lead_reg_dt >= mn2.m_start AND l.lead_reg_dt <= mn2.m_eom
                  AND ( l.close_dt > mn2.m_eom OR l.close_dt IS NULL OR l.last_retail_sales_dt IS NOT NULL )
                  AND EXISTS (
                        SELECT 1 FROM ktws.FCT_ACTIVITY_v2 a
                        JOIN ktws.DIM_CRM_ACT_TYPE act ON a.tp_key = act.tp_key
                        JOIN elig e3 ON e3.sc_key = a.sc_key         /* 스코프 컨텍스트 */
                        WHERE a.lead_key = l.lead_key
                          AND a.lead_key IS NOT NULL
                          AND act.tp_grp_1 IN (N'관계형성',N'기회창출')
                          AND a.act_dt_fr >= mn2.m_start
                          AND a.act_dt_fr <= mn2.m_eom               /* ★ 컨텍스트 날짜(그 달) */
                          AND (a.act_result IS NULL OR a.act_result <> N'부재중') ) )
        GROUP BY mn2.base_yr, mn2.base_mn, mn2.moff
    ),
    tot_cntrct AS (
        SELECT base_yr, base_mn,
               CAST(SUM(v) AS FLOAT)/CAST(@lookback_months AS FLOAT) AS tot_cntrct
        FROM tot_cntrct_raw
        GROUP BY base_yr, base_mn
    ),
    tot AS (
        SELECT
            bs.base_yr AS yr,
            bs.base_mn AS mn,
            ISNULL(l.tot_lead,0)   AS tot_lead,
            ISNULL(c.tot_cntrct,0) AS tot_cntrct
        FROM base bs
        LEFT JOIN tot_lead l
               ON l.base_yr=bs.base_yr AND l.base_mn=bs.base_mn
        LEFT JOIN tot_cntrct c
               ON c.base_yr=bs.base_yr AND c.base_mn=bs.base_mn
    ),
    /* ══ 부서레벨 재계산 ══ */
    dept_act AS (
        /* 활동은 가산 지표 → SC 셀 합 = 부서 재계산 */
        SELECT yr, mn, dealer_nm, group_name, dept_nm, common_tp_nm, SUM(활동) AS 활동
        FROM detail
        GROUP BY yr, mn, dealer_nm, group_name, dept_nm, common_tp_nm
    ),
    dept_lead_raw AS (
        SELECT mn2.base_yr AS yr, mn2.base_mn AS mn,
               eu.dealer_nm, eu.group_name, eu.dept_nm, aord.common_tp_nm, mn2.moff,
               COUNT(DISTINCT l.lead_key) AS v
        FROM mon mn2
        JOIN ktws.FCT_LEAD l
              ON l.lead_reg_dt >= mn2.m_start AND l.lead_reg_dt <= mn2.m_eom
        JOIN ktws.DIM_CRM_ACT_TYPE lct ON l.tp_key = lct.tp_key
        JOIN ktws.DIM_CRM_ACT_TYPE_ORDER aord ON lct.common_tp_nm = aord.common_tp_nm
        JOIN elig eu ON l.cl_sc_key = eu.sc_key
        WHERE ( l.close_dt > mn2.m_eom OR l.close_dt IS NULL OR l.last_retail_sales_dt IS NOT NULL )
          AND EXISTS (
                SELECT 1 FROM ktws.FCT_ACTIVITY_v2 a
                JOIN ktws.DIM_CRM_ACT_TYPE act ON a.tp_key = act.tp_key
                JOIN elig e3 ON e3.sc_key = a.sc_key
                            AND e3.dealer_nm  = eu.dealer_nm     /* 같은 부서 컨텍스트 */
                            AND e3.group_name = eu.group_name
                            AND e3.dept_nm    = eu.dept_nm
                WHERE a.lead_key = l.lead_key
                  AND act.common_tp_nm = lct.common_tp_nm        /* 행 유형 컨텍스트 */
                  AND act.tp_grp_1 IN (N'관계형성',N'기회창출')
                  AND a.act_dt_fr >= mn2.m_start
                  AND a.act_dt_fr <= mn2.m_eom                   /* ★ 컨텍스트 날짜(그 달) */
                  AND (a.act_result IS NULL OR a.act_result <> N'부재중') )
          AND (@common_tpPad IS NULL OR @common_tpPad LIKE N'%,' + LTRIM(RTRIM(aord.common_tp_nm)) + N',%')
        GROUP BY mn2.base_yr, mn2.base_mn,
                 eu.dealer_nm, eu.group_name, eu.dept_nm, aord.common_tp_nm, mn2.moff
    ),
    dept_lead AS (
        SELECT yr, mn, dealer_nm, group_name, dept_nm, common_tp_nm,
               CAST(SUM(v) AS FLOAT)/CAST(@lookback_months AS FLOAT) AS 영업기회
        FROM dept_lead_raw
        GROUP BY yr, mn, dealer_nm, group_name, dept_nm, common_tp_nm
    ),
    dept_cntrct_raw AS (
        SELECT mn2.base_yr AS yr, mn2.base_mn AS mn,
               eu.dealer_nm, eu.group_name, eu.dept_nm, aord.common_tp_nm, mn2.moff,
               SUM(c.cnt) AS v
        FROM mon mn2
        JOIN ktws.FCT_CONTRACT_KTWS c
              ON c.contract_dt >= mn2.m_start AND c.contract_dt <= mn2.m_eom
        JOIN ktws.DIM_CRM_ACT_TYPE ct ON c.tp_key = ct.tp_key
        JOIN ktws.DIM_CRM_ACT_TYPE_ORDER aord ON ct.common_tp_nm = aord.common_tp_nm
        JOIN elig eu ON c.cn_sc_key = eu.sc_key
        WHERE EXISTS (
                SELECT 1 FROM ktws.FCT_LEAD l
                JOIN ktws.DIM_CRM_ACT_TYPE lct2 ON l.tp_key = lct2.tp_key
                JOIN elig e2 ON e2.sc_key = l.cl_sc_key
                            AND e2.dealer_nm  = eu.dealer_nm     /* 같은 부서 컨텍스트 */
                            AND e2.group_name = eu.group_name
                            AND e2.dept_nm    = eu.dept_nm
                WHERE l.lead_key = c.lead_key
                  AND lct2.common_tp_nm = ct.common_tp_nm        /* 행 유형 컨텍스트 */
                  AND l.lead_reg_dt >= mn2.m_start AND l.lead_reg_dt <= mn2.m_eom
                  AND ( l.close_dt > mn2.m_eom OR l.close_dt IS NULL OR l.last_retail_sales_dt IS NOT NULL )
                  AND EXISTS (
                        SELECT 1 FROM ktws.FCT_ACTIVITY_v2 a
                        JOIN ktws.DIM_CRM_ACT_TYPE act ON a.tp_key = act.tp_key
                        JOIN elig e3 ON e3.sc_key = a.sc_key
                                    AND e3.dealer_nm  = eu.dealer_nm
                                    AND e3.group_name = eu.group_name
                                    AND e3.dept_nm    = eu.dept_nm
                        WHERE a.lead_key = l.lead_key
                          AND a.lead_key IS NOT NULL
                          AND act.common_tp_nm = ct.common_tp_nm /* 행 유형 컨텍스트 */
                          AND act.tp_grp_1 IN (N'관계형성',N'기회창출')
                          AND a.act_dt_fr >= mn2.m_start
                          AND a.act_dt_fr <= mn2.m_eom           /* ★ 컨텍스트 날짜(그 달) */
                          AND (a.act_result IS NULL OR a.act_result <> N'부재중') ) )
          AND (@common_tpPad IS NULL OR @common_tpPad LIKE N'%,' + LTRIM(RTRIM(aord.common_tp_nm)) + N',%')
        GROUP BY mn2.base_yr, mn2.base_mn,
                 eu.dealer_nm, eu.group_name, eu.dept_nm, aord.common_tp_nm, mn2.moff
    ),
    dept_cntrct AS (
        SELECT yr, mn, dealer_nm, group_name, dept_nm, common_tp_nm,
               CAST(SUM(v) AS FLOAT)/CAST(@lookback_months AS FLOAT) AS 계약
        FROM dept_cntrct_raw
        GROUP BY yr, mn, dealer_nm, group_name, dept_nm, common_tp_nm
    ),
    dept_grid AS (
        SELECT yr, mn, dealer_nm, group_name, dept_nm, common_tp_nm FROM dept_act
        UNION SELECT yr, mn, dealer_nm, group_name, dept_nm, common_tp_nm FROM dept_lead
        UNION SELECT yr, mn, dealer_nm, group_name, dept_nm, common_tp_nm FROM dept_cntrct
    )
    SELECT [연도], [월],
           [딜러], [전시장], [부서], [활동유형],
           [활동], [활동→영업기회], [영업기회], [영업기회→계약], [계약]
    FROM (
        SELECT
            g.yr AS [연도], g.mn AS [월],
            0 AS ord,
            g.dealer_nm  AS [딜러],
            g.group_name AS [전시장],
            g.dept_nm    AS [부서],
            g.common_tp_nm AS [활동유형],
            CAST(ISNULL(a.활동,0) AS DECIMAL(18,1)) AS [활동],
            /* DIVIDE(..., 0) : 분모 0 → 0 */
            CAST(CASE WHEN ISNULL(a.활동,0)=0 THEN 0
                      ELSE ISNULL(l.영업기회,0)/a.활동 END AS DECIMAL(18,2)) AS [활동→영업기회],
            CAST(ISNULL(l.영업기회,0) AS DECIMAL(18,1)) AS [영업기회],
            CAST(CASE WHEN ISNULL(l.영업기회,0)=0 THEN 0
                      ELSE ISNULL(c.계약,0)/l.영업기회 END AS DECIMAL(18,2)) AS [영업기회→계약],
            CAST(ISNULL(c.계약,0) AS DECIMAL(18,1)) AS [계약]
        FROM dept_grid g
        LEFT JOIN dept_act a
               ON a.yr=g.yr AND a.mn=g.mn
              AND a.dealer_nm=g.dealer_nm AND a.group_name=g.group_name
              AND a.dept_nm=g.dept_nm AND a.common_tp_nm=g.common_tp_nm
        LEFT JOIN dept_lead l
               ON l.yr=g.yr AND l.mn=g.mn
              AND l.dealer_nm=g.dealer_nm AND l.group_name=g.group_name
              AND l.dept_nm=g.dept_nm AND l.common_tp_nm=g.common_tp_nm
        LEFT JOIN dept_cntrct c
               ON c.yr=g.yr AND c.mn=g.mn
              AND c.dealer_nm=g.dealer_nm AND c.group_name=g.group_name
              AND c.dept_nm=g.dept_nm AND c.common_tp_nm=g.common_tp_nm

        UNION ALL

        /* 합계행 : 활동만 행 합, 영업기회·계약은 스코프 레벨 재계산 (DAX 총계 동작) */
        SELECT
            d.yr AS [연도], d.mn AS [월],
            1 AS ord,
            N'합계', NULL, NULL, NULL,
            CAST(SUM(d.활동) AS DECIMAL(18,1)),
            CAST(CASE WHEN SUM(d.활동)=0 THEN 0
                      ELSE MAX(tot.tot_lead)/SUM(d.활동) END AS DECIMAL(18,2)),
            CAST(MAX(tot.tot_lead) AS DECIMAL(18,1)),
            CAST(CASE WHEN MAX(tot.tot_lead)=0 THEN 0
                      ELSE MAX(tot.tot_cntrct)/MAX(tot.tot_lead) END AS DECIMAL(18,2)),
            CAST(MAX(tot.tot_cntrct) AS DECIMAL(18,1))
        FROM detail d
        JOIN tot ON tot.yr=d.yr AND tot.mn=d.mn
        GROUP BY d.yr, d.mn
    ) t
    ORDER BY [연도], [월], ord, [딜러], [전시장], [부서], [활동유형];
END
ELSE
BEGIN
    /* ══════════ [SC레벨] 'ALL'=전체 / 지정 SC → SC>활동유형까지 전개 ══════════ */
    ;WITH
    base AS (
        SELECT DISTINCT
               c.[Year]        AS base_yr,
               c.[MonthNumber] AS base_mn,
               DATEFROMPARTS(c.[Year], c.[MonthNumber], 1) AS base_month,
               EOMONTH(DATEFROMPARTS(c.[Year], c.[MonthNumber], 1)) AS ref_day
        FROM ktws.DIM_CALENDAR_KTWS c
        WHERE @yearPad  LIKE N'%,' + CAST(c.[Year]        AS NVARCHAR(10)) + N',%'
          AND @monthPad LIKE N'%,' + CAST(c.[MonthNumber] AS NVARCHAR(10)) + N',%'
    ),
    moffs AS (
        SELECT TOP (@lookback_months)
               ROW_NUMBER() OVER (ORDER BY (SELECT NULL)) AS moff
        FROM      (VALUES (0),(0),(0),(0),(0),(0),(0),(0),(0),(0)) a(n)
        CROSS JOIN (VALUES (0),(0),(0),(0),(0),(0),(0),(0),(0),(0)) b(n)   -- 최대 100개월
    ),
    mon AS (
        SELECT
              bs.base_yr,
              bs.base_mn,
              t.moff,
              DATEFROMPARTS(YEAR(DATEADD(MONTH,-t.moff,bs.base_month)),
                            MONTH(DATEADD(MONTH,-t.moff,bs.base_month)),1)  AS m_start,
              EOMONTH(DATEADD(MONTH,-t.moff,bs.base_month))                  AS m_eom,
              CASE WHEN DATEADD(DAY, DAY(bs.ref_day)-1,
                                DATEFROMPARTS(YEAR(DATEADD(MONTH,-t.moff,bs.base_month)),
                                              MONTH(DATEADD(MONTH,-t.moff,bs.base_month)),1))
                        > EOMONTH(DATEADD(MONTH,-t.moff,bs.base_month))
                   THEN EOMONTH(DATEADD(MONTH,-t.moff,bs.base_month))
                   ELSE DATEADD(DAY, DAY(bs.ref_day)-1,
                                DATEFROMPARTS(YEAR(DATEADD(MONTH,-t.moff,bs.base_month)),
                                              MONTH(DATEADD(MONTH,-t.moff,bs.base_month)),1))
              END                                                            AS m_mtd
        FROM base bs
        CROSS JOIN moffs t
    ),
    elig AS (
        SELECT
              u.sc_key,
              CAST(u.[name]      AS VARCHAR(200)) AS sc_name,
              CAST(u.dept_nm     AS VARCHAR(200)) AS dept_nm,
              CAST(u.group_name  AS VARCHAR(200)) AS group_name,
              CAST(dlr.dealer_nm AS VARCHAR(200)) AS dealer_nm
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
          AND (u.[name]  IS NULL OR @excl_namePad  NOT LIKE N'%,' + LTRIM(RTRIM(u.[name]))  + N',%')
          AND (u.user_id IS NULL OR @excl_usersPad NOT LIKE N'%,' + LTRIM(RTRIM(u.user_id)) + N',%')
    ),
    act_raw AS (
        SELECT mn2.base_yr, mn2.base_mn,
               eu.sc_key, aord.common_tp_nm, mn2.moff, SUM(a.cnt) AS v
        FROM mon mn2
        JOIN ktws.FCT_ACTIVITY_v2 a
              ON a.act_dt_fr >= mn2.m_start AND a.act_dt_fr <= mn2.m_mtd
        JOIN ktws.DIM_CRM_ACT_TYPE t ON a.tp_key = t.tp_key
        JOIN ktws.DIM_CRM_ACT_TYPE_ORDER aord ON t.common_tp_nm = aord.common_tp_nm
        JOIN elig eu ON a.sc_key = eu.sc_key
        WHERE t.tp_grp_1 IN (N'관계형성',N'기회창출')
          AND (a.act_result IS NULL OR a.act_result <> N'부재중')
        GROUP BY mn2.base_yr, mn2.base_mn,
                 eu.sc_key, aord.common_tp_nm, mn2.moff
    ),
    act_avg AS (
        SELECT base_yr, base_mn, sc_key, common_tp_nm,
               CAST(SUM(v) AS FLOAT) / CAST(@lookback_months AS FLOAT) AS 활동
        FROM act_raw
        GROUP BY base_yr, base_mn, sc_key, common_tp_nm
    ),
    lead_raw AS (
        SELECT mn2.base_yr, mn2.base_mn,
               eu.sc_key, aord.common_tp_nm, mn2.moff,
               COUNT(DISTINCT l.lead_key) AS v
        FROM mon mn2
        JOIN ktws.FCT_LEAD l
              ON l.lead_reg_dt >= mn2.m_start AND l.lead_reg_dt <= mn2.m_eom
        JOIN ktws.DIM_CRM_ACT_TYPE lct ON l.tp_key = lct.tp_key
        JOIN ktws.DIM_CRM_ACT_TYPE_ORDER aord ON lct.common_tp_nm = aord.common_tp_nm
        JOIN elig eu ON l.cl_sc_key = eu.sc_key
        WHERE ( l.close_dt > mn2.m_eom OR l.close_dt IS NULL OR l.last_retail_sales_dt IS NOT NULL )
          AND EXISTS (
                SELECT 1 FROM ktws.FCT_ACTIVITY_v2 a
                JOIN ktws.DIM_CRM_ACT_TYPE act ON a.tp_key = act.tp_key
                WHERE a.lead_key = l.lead_key
                  AND a.sc_key   = l.cl_sc_key                       /* 행 SC 컨텍스트 */
                  AND act.common_tp_nm = lct.common_tp_nm            /* 행 유형 컨텍스트(common_tp) */
                  AND act.tp_grp_1 IN (N'관계형성',N'기회창출')
                  AND a.act_dt_fr >= mn2.m_start
                  AND a.act_dt_fr <= mn2.m_eom                       /* ★ 컨텍스트 날짜(그 달) */
                  AND (a.act_result IS NULL OR a.act_result <> N'부재중') )
        GROUP BY mn2.base_yr, mn2.base_mn,
                 eu.sc_key, aord.common_tp_nm, mn2.moff
    ),
    lead_avg AS (
        SELECT base_yr, base_mn, sc_key, common_tp_nm,
               CAST(SUM(v) AS FLOAT) / CAST(@lookback_months AS FLOAT) AS 영업기회
        FROM lead_raw
        GROUP BY base_yr, base_mn, sc_key, common_tp_nm
    ),
    cntrct_raw AS (
        SELECT mn2.base_yr, mn2.base_mn,
               eu.sc_key, aord.common_tp_nm, mn2.moff, SUM(c.cnt) AS v
        FROM mon mn2
        JOIN ktws.FCT_CONTRACT_KTWS c
              ON c.contract_dt >= mn2.m_start AND c.contract_dt <= mn2.m_eom
        JOIN ktws.DIM_CRM_ACT_TYPE ct ON c.tp_key = ct.tp_key
        JOIN ktws.DIM_CRM_ACT_TYPE_ORDER aord ON ct.common_tp_nm = aord.common_tp_nm
        JOIN elig eu ON c.cn_sc_key = eu.sc_key
        WHERE EXISTS (
                SELECT 1 FROM ktws.FCT_LEAD l
                JOIN ktws.DIM_CRM_ACT_TYPE lct2 ON l.tp_key = lct2.tp_key
                WHERE l.lead_key = c.lead_key
                  AND l.cl_sc_key = c.cn_sc_key                      /* 행 SC 컨텍스트(리드도 그 SC) */
                  AND lct2.common_tp_nm = ct.common_tp_nm            /* 행 유형 컨텍스트(리드도 그 유형) */
                  AND l.lead_reg_dt >= mn2.m_start AND l.lead_reg_dt <= mn2.m_eom
                  AND ( l.close_dt > mn2.m_eom OR l.close_dt IS NULL OR l.last_retail_sales_dt IS NOT NULL )
                  AND EXISTS (
                        SELECT 1 FROM ktws.FCT_ACTIVITY_v2 a
                        JOIN ktws.DIM_CRM_ACT_TYPE act ON a.tp_key = act.tp_key
                        WHERE a.lead_key = l.lead_key
                          AND a.lead_key IS NOT NULL                 /* DAX: lead_key <> BLANK() */
                          AND a.sc_key   = c.cn_sc_key               /* 행 SC 컨텍스트 */
                          AND act.common_tp_nm = ct.common_tp_nm     /* 행 유형 컨텍스트 */
                          AND act.tp_grp_1 IN (N'관계형성',N'기회창출')
                          AND a.act_dt_fr >= mn2.m_start
                          AND a.act_dt_fr <= mn2.m_eom               /* ★ 컨텍스트 날짜(그 달) */
                          AND (a.act_result IS NULL OR a.act_result <> N'부재중') ) )
        GROUP BY mn2.base_yr, mn2.base_mn,
                 eu.sc_key, aord.common_tp_nm, mn2.moff
    ),
    cntrct_avg AS (
        SELECT base_yr, base_mn, sc_key, common_tp_nm,
               CAST(SUM(v) AS FLOAT) / CAST(@lookback_months AS FLOAT) AS 계약
        FROM cntrct_raw
        GROUP BY base_yr, base_mn, sc_key, common_tp_nm
    ),
    grid AS (
        SELECT base_yr, base_mn, sc_key, common_tp_nm FROM act_avg
        UNION SELECT base_yr, base_mn, sc_key, common_tp_nm FROM lead_avg
        UNION SELECT base_yr, base_mn, sc_key, common_tp_nm FROM cntrct_avg
    ),
    detail AS (
        SELECT
            g.base_yr AS yr,
            g.base_mn AS mn,
            eu.dealer_nm, eu.group_name, eu.dept_nm, eu.sc_name, g.common_tp_nm,
            ISNULL(a.활동,0)     AS 활동,
            ISNULL(l.영업기회,0) AS 영업기회,
            ISNULL(c.계약,0)     AS 계약
        FROM grid g
        JOIN      elig       eu ON eu.sc_key = g.sc_key
        LEFT JOIN act_avg    a
               ON a.base_yr=g.base_yr AND a.base_mn=g.base_mn
              AND a.sc_key=g.sc_key AND a.common_tp_nm=g.common_tp_nm
        LEFT JOIN lead_avg   l
               ON l.base_yr=g.base_yr AND l.base_mn=g.base_mn
              AND l.sc_key=g.sc_key AND l.common_tp_nm=g.common_tp_nm
        LEFT JOIN cntrct_avg c
               ON c.base_yr=g.base_yr AND c.base_mn=g.base_mn
              AND c.sc_key=g.sc_key AND c.common_tp_nm=g.common_tp_nm
        WHERE (@common_tpPad IS NULL OR @common_tpPad LIKE N'%,' + LTRIM(RTRIM(g.common_tp_nm)) + N',%')
    ),
    tot_lead_raw AS (
        SELECT mn2.base_yr, mn2.base_mn, mn2.moff,
               COUNT(DISTINCT l.lead_key) AS v
        FROM mon mn2
        JOIN ktws.FCT_LEAD l
              ON l.lead_reg_dt >= mn2.m_start AND l.lead_reg_dt <= mn2.m_eom
        JOIN elig eu ON l.cl_sc_key = eu.sc_key
        WHERE ( l.close_dt > mn2.m_eom OR l.close_dt IS NULL OR l.last_retail_sales_dt IS NOT NULL )
          AND EXISTS (
                SELECT 1 FROM ktws.FCT_ACTIVITY_v2 a
                JOIN ktws.DIM_CRM_ACT_TYPE act ON a.tp_key = act.tp_key
                JOIN elig e3 ON e3.sc_key = a.sc_key                /* 스코프 컨텍스트 */
                WHERE a.lead_key = l.lead_key
                  AND act.tp_grp_1 IN (N'관계형성',N'기회창출')
                  AND a.act_dt_fr >= mn2.m_start
                  AND a.act_dt_fr <= mn2.m_eom                      /* ★ 컨텍스트 날짜(그 달) */
                  AND (a.act_result IS NULL OR a.act_result <> N'부재중') )
        GROUP BY mn2.base_yr, mn2.base_mn, mn2.moff
    ),
    tot_lead AS (
        SELECT base_yr, base_mn,
               CAST(SUM(v) AS FLOAT)/CAST(@lookback_months AS FLOAT) AS tot_lead
        FROM tot_lead_raw
        GROUP BY base_yr, base_mn
    ),
    tot_cntrct_raw AS (
        SELECT mn2.base_yr, mn2.base_mn, mn2.moff,
               SUM(c.cnt) AS v
        FROM mon mn2
        JOIN ktws.FCT_CONTRACT_KTWS c
              ON c.contract_dt >= mn2.m_start AND c.contract_dt <= mn2.m_eom
        JOIN elig eu ON c.cn_sc_key = eu.sc_key
        WHERE EXISTS (
                SELECT 1 FROM ktws.FCT_LEAD l
                WHERE l.lead_key = c.lead_key
                  AND EXISTS (SELECT 1 FROM elig e2 WHERE e2.sc_key = l.cl_sc_key)  /* 스코프 컨텍스트 */
                  AND l.lead_reg_dt >= mn2.m_start AND l.lead_reg_dt <= mn2.m_eom
                  AND ( l.close_dt > mn2.m_eom OR l.close_dt IS NULL OR l.last_retail_sales_dt IS NOT NULL )
                  AND EXISTS (
                        SELECT 1 FROM ktws.FCT_ACTIVITY_v2 a
                        JOIN ktws.DIM_CRM_ACT_TYPE act ON a.tp_key = act.tp_key
                        JOIN elig e3 ON e3.sc_key = a.sc_key         /* 스코프 컨텍스트 */
                        WHERE a.lead_key = l.lead_key
                          AND a.lead_key IS NOT NULL
                          AND act.tp_grp_1 IN (N'관계형성',N'기회창출')
                          AND a.act_dt_fr >= mn2.m_start
                          AND a.act_dt_fr <= mn2.m_eom               /* ★ 컨텍스트 날짜(그 달) */
                          AND (a.act_result IS NULL OR a.act_result <> N'부재중') ) )
        GROUP BY mn2.base_yr, mn2.base_mn, mn2.moff
    ),
    tot_cntrct AS (
        SELECT base_yr, base_mn,
               CAST(SUM(v) AS FLOAT)/CAST(@lookback_months AS FLOAT) AS tot_cntrct
        FROM tot_cntrct_raw
        GROUP BY base_yr, base_mn
    ),
    tot AS (
        SELECT
            bs.base_yr AS yr,
            bs.base_mn AS mn,
            ISNULL(l.tot_lead,0)   AS tot_lead,
            ISNULL(c.tot_cntrct,0) AS tot_cntrct
        FROM base bs
        LEFT JOIN tot_lead l
               ON l.base_yr=bs.base_yr AND l.base_mn=bs.base_mn
        LEFT JOIN tot_cntrct c
               ON c.base_yr=bs.base_yr AND c.base_mn=bs.base_mn
    )
    SELECT [연도], [월],
           [딜러], [전시장], [부서], [SC], [활동유형],
           [활동], [활동→영업기회], [영업기회], [영업기회→계약], [계약]
    FROM (
        SELECT
            d.yr AS [연도], d.mn AS [월],
            0 AS ord,
            d.dealer_nm  AS [딜러],
            d.group_name AS [전시장],
            d.dept_nm    AS [부서],
            d.sc_name    AS [SC],
            d.common_tp_nm AS [활동유형],
            CAST(d.활동 AS DECIMAL(18,1))    AS [활동],
            /* DIVIDE(..., 0) : 분모 0 → 0 */
            CAST(CASE WHEN d.활동=0 THEN 0 ELSE d.영업기회/d.활동 END AS DECIMAL(18,2)) AS [활동→영업기회],
            CAST(d.영업기회 AS DECIMAL(18,1)) AS [영업기회],
            CAST(CASE WHEN d.영업기회=0 THEN 0 ELSE d.계약/d.영업기회 END AS DECIMAL(18,2)) AS [영업기회→계약],
            CAST(d.계약 AS DECIMAL(18,1))    AS [계약]
        FROM detail d

        UNION ALL

        /* 합계행 : 활동만 행 합, 영업기회·계약은 스코프 레벨 재계산 (DAX 총계 동작) */
        SELECT
            d.yr AS [연도], d.mn AS [월],
            1 AS ord,
            N'합계', NULL, NULL, NULL, NULL,
            CAST(SUM(d.활동) AS DECIMAL(18,1)),
            CAST(CASE WHEN SUM(d.활동)=0 THEN 0
                      ELSE MAX(tot.tot_lead)/SUM(d.활동) END AS DECIMAL(18,2)),
            CAST(MAX(tot.tot_lead) AS DECIMAL(18,1)),
            CAST(CASE WHEN MAX(tot.tot_lead)=0 THEN 0
                      ELSE MAX(tot.tot_cntrct)/MAX(tot.tot_lead) END AS DECIMAL(18,2)),
            CAST(MAX(tot.tot_cntrct) AS DECIMAL(18,1))
        FROM detail d
        JOIN tot ON tot.yr=d.yr AND tot.mn=d.mn
        GROUP BY d.yr, d.mn
    ) t
    ORDER BY [연도], [월], ord, [딜러], [전시장], [부서], [SC], [활동유형];
END
