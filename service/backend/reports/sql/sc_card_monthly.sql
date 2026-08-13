/* ══════════════════════════════════════════════════════════════════════════
   [SC 카드 · 월별] 연도>월>브랜드>딜러>전시장>팀>(SC)
   프로필 + 판매 진행률(계약/출고) + 요약(고객/영업기회/NPS)
   ──────────────────────────────────────────────────────────────────────────
   ■ 컬럼 : 연도/월/브랜드/딜러/전시장/팀/(SC)
            (분기 B) 소속팀/근속년수/나이
            (분기 A) SC인원
            / 계약/계약목표/계약진행률 / 출고/출고목표/출고진행률
            / 고객수/HOT영업기회/전체영업기회/기회창출영업기회_3개월평균/NPS
   ■ 기간 : @year/@month NULL이면 (필터 통과 대상의) 계약·출고가 있는 모든
            연×월이 기준월 행으로. 각 행의 지표는 그 행의 기준월 기준:
            계약/출고/목표/영업기회 = 그 달, 3개월평균 = 그 달 포함 직전 3개월,
            NPS = 기준월 제외 직전 3개월. 고객수는 시점 무관(전체) → 매월 동일.
   ■ 프로필(근속년수/나이) : 오늘(GETDATE) 기준 — 연·월과 무관.
   ■ @sc_name 3분기 :
       NULL   → SC 열 미표시. 팀 레벨 합산(진행률 재계산, NPS는 팀 응답 평균).
                프로필 열 대신 [SC인원] 표시.
       'ALL'  → SC 열 표시 + 전체 SC (1명 1행 × 월).
       값     → SC 열 표시 + 해당 SC만 (콤마 다중 가능).
   ■ 슬라이서 전부 NULL → 전체 데이터 (전 기간 × 전 대상).
   ■ 필터방식 : LIKE 패딩(',값1,값2,') → STRING_SPLIT 미사용(8623 방지).
       속성 비교는 LTRIM(RTRIM())으로 공백 변형 방지.
   ■ 제외(3) : 창구SC / 고객지원팀·TOYOTA YM(dept 기준) / user_id 목록
   ══════════════════════════════════════════════════════════════════════════ */

/* ── 기간 (NULL = 데이터가 있는 전체 월) ── */

/* ── 프로필 기준일 : 오늘 ── */
DECLARE @today DATE = CAST(GETDATE() AS DATE);

/* ── 슬라이서 (NULL=모두, 콤마 다중) ── */

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
DECLARE @sc_namePad    NVARCHAR(MAX) = CASE WHEN @sc_name IS NULL THEN NULL ELSE N',' + REPLACE(@sc_name,    N', ', N',') + N',' END;
DECLARE @excl_deptPad  NVARCHAR(MAX) = N',' + REPLACE(@exclude_dept,  N', ', N',') + N',';
DECLARE @excl_usersPad NVARCHAR(MAX) = N',' + REPLACE(@exclude_users, N' ',  N'')  + N',';

IF @sc_name IS NULL
BEGIN
    /* ═════════════════════════════════════════════════════════════════
       분기 A : SC 열 없음 — 연×월 × 브랜드>딜러>전시장>팀 합산
       ═════════════════════════════════════════════════════════════════ */
    ;WITH
    elig_user AS (
        SELECT u.sc_key,
               LTRIM(RTRIM(u.BRAND))       AS brand_nm,
               LTRIM(RTRIM(dlr.dealer_nm)) AS dealer_nm,
               LTRIM(RTRIM(u.group_name))  AS group_name,
               LTRIM(RTRIM(u.dept_nm))     AS dept_nm
        FROM   ktws.DIM_MNG_USER u
        LEFT JOIN ktws.DIM_MNG_DEALER dlr ON u.dealer_key = dlr.dealer_key
        WHERE  ISNULL(u.facade_sc_yn,N'') <> @exclude_facade
          AND (u.dept_nm IS NULL OR @excl_deptPad  NOT LIKE N'%,' + LTRIM(RTRIM(u.dept_nm)) + N',%')
          AND (u.user_id IS NULL OR @excl_usersPad NOT LIKE N'%,' + LTRIM(RTRIM(u.user_id)) + N',%')
          AND (@brandPad      IS NULL OR @brandPad      LIKE N'%,' + LTRIM(RTRIM(u.BRAND))       + N',%')
          AND (@dealer_nmPad  IS NULL OR @dealer_nmPad  LIKE N'%,' + LTRIM(RTRIM(dlr.dealer_nm)) + N',%')
          AND (@group_namePad IS NULL OR @group_namePad LIKE N'%,' + LTRIM(RTRIM(u.group_name))  + N',%')
          AND (@dept_nmPad    IS NULL OR @dept_nmPad    LIKE N'%,' + LTRIM(RTRIM(u.dept_nm))     + N',%')
          AND (@active_ynPad  IS NULL OR @active_ynPad  LIKE N'%,' + LTRIM(RTRIM(u.active_yn))   + N',%')
    ),
    /* 기준월 앵커 : 대상의 계약일/출고일이 있는 연×월 */
    mon_anchor AS (
        SELECT DISTINCT DATEFROMPARTS(YEAR(x.d), MONTH(x.d), 1) AS mon_start
        FROM (
            SELECT c.contract_dt AS d
            FROM ktws.FCT_CONTRACT_KTWS c JOIN elig_user eu ON c.cn_sc_key = eu.sc_key
            WHERE c.contract_dt IS NOT NULL
            UNION
            SELECT c.last_retail_sales_dt
            FROM ktws.FCT_CONTRACT_KTWS c JOIN elig_user eu ON c.cn_sc_key = eu.sc_key
            WHERE c.last_retail_sales_dt IS NOT NULL
        ) x
        WHERE (@year  IS NULL OR YEAR(x.d)  = @year)
          AND (@month IS NULL OR MONTH(x.d) = @month)
    ),
    ma AS (
        SELECT mon_start,
               EOMONTH(mon_start)                    AS ref_date,
               DATEADD(DAY,1,EOMONTH(mon_start,-2))  AS m1_start,   -- 전월 1일
               EOMONTH(mon_start,-1)                 AS m1_end,     -- 전월 말일
               DATEADD(DAY,1,EOMONTH(mon_start,-3))  AS m2_start,   -- 전전월 1일
               EOMONTH(mon_start,-2)                 AS m2_end,     -- 전전월 말일
               DATEADD(DAY,1,EOMONTH(mon_start,-4))  AS nps_start,  -- 전전전월 1일
               EOMONTH(mon_start,-1)                 AS nps_end     -- 전월 말일
        FROM mon_anchor
    ),
    /* 계약 : 그 달 contract_dt 합 */
    cntrct_val AS (
        SELECT m.mon_start, eu.brand_nm, eu.dealer_nm, eu.group_name, eu.dept_nm, SUM(c.cnt) AS v
        FROM ma m
        JOIN ktws.FCT_CONTRACT_KTWS c ON c.contract_dt >= m.mon_start AND c.contract_dt <= m.ref_date
        JOIN elig_user eu ON c.cn_sc_key = eu.sc_key
        GROUP BY m.mon_start, eu.brand_nm, eu.dealer_nm, eu.group_name, eu.dept_nm
    ),
    /* 출고 : 그 달 실판매 + 미취소 */
    sales_val AS (
        SELECT m.mon_start, eu.brand_nm, eu.dealer_nm, eu.group_name, eu.dept_nm, SUM(c.cnt) AS v
        FROM ma m
        JOIN ktws.FCT_CONTRACT_KTWS c
          ON c.last_retail_sales_dt >= m.mon_start AND c.last_retail_sales_dt <= m.ref_date
         AND (c.cancel_dt IS NULL OR c.cancel_dt > EOMONTH(c.last_retail_sales_dt,0))
        JOIN elig_user eu ON c.cn_sc_key = eu.sc_key
        GROUP BY m.mon_start, eu.brand_nm, eu.dealer_nm, eu.group_name, eu.dept_nm
    ),
    /* 계약 목표(SC 합) : common_tp_nm='계약', 그 달 */
    cntrct_tgt AS (
        SELECT m.mon_start, eu.brand_nm, eu.dealer_nm, eu.group_name, eu.dept_nm, SUM(f.target_cnt) AS v
        FROM ma m
        JOIN ktws.FCT_CRM_TARGET_M f ON f.monthly_dt >= m.mon_start AND f.monthly_dt <= m.ref_date
        JOIN ktws.DIM_CRM_ACT_TYPE t ON f.tp_key = t.tp_key
        JOIN elig_user eu ON f.sc_key = eu.sc_key
        WHERE t.common_tp_nm = N'계약'
        GROUP BY m.mon_start, eu.brand_nm, eu.dealer_nm, eu.group_name, eu.dept_nm
    ),
    /* 출고 목표(SC 합) : Main / 판매목표 대수, 그 달 */
    sales_tgt AS (
        SELECT m.mon_start, eu.brand_nm, eu.dealer_nm, eu.group_name, eu.dept_nm, SUM(f.target_cnt) AS v
        FROM ma m
        JOIN ktws.FCT_CRM_TARGET_M f ON f.monthly_dt >= m.mon_start AND f.monthly_dt <= m.ref_date
        JOIN ktws.DIM_CRM_ACT_TYPE t ON f.tp_key = t.tp_key
        JOIN elig_user eu ON f.sc_key = eu.sc_key
        WHERE t.target_grp_nm = N'Main' AND t.tp_grp_1 = N'판매목표 대수'
        GROUP BY m.mon_start, eu.brand_nm, eu.dealer_nm, eu.group_name, eu.dept_nm
    ),
    /* 고객 수 : 시점 무관 전체 (매월 동일 표시) */
    cust AS (
        SELECT eu.brand_nm, eu.dealer_nm, eu.group_name, eu.dept_nm,
               COUNT(DISTINCT mc.cust_seq) AS v
        FROM ktws.FCT_MNG_CUST_LIST mc
        JOIN elig_user eu ON mc.mng_sc_key = eu.sc_key
        GROUP BY eu.brand_nm, eu.dealer_nm, eu.group_name, eu.dept_nm
    ),
    /* HOT 영업기회 : 그달 등록 + 그달말 기준 열림 */
    lead_hot AS (
        SELECT m.mon_start, eu.brand_nm, eu.dealer_nm, eu.group_name, eu.dept_nm, SUM(l.cnt) AS v
        FROM ma m
        JOIN ktws.FCT_LEAD l ON l.lead_reg_dt >= m.mon_start AND l.lead_reg_dt <= m.ref_date
        JOIN elig_user eu ON l.cl_sc_key = eu.sc_key
        WHERE l.potential = N'HOT'
          AND (l.close_dt > m.ref_date OR l.close_dt IS NULL)
        GROUP BY m.mon_start, eu.brand_nm, eu.dealer_nm, eu.group_name, eu.dept_nm
    ),
    /* 전체 영업기회 : 그달 등록 + (열림 or 판매됨) */
    lead_all AS (
        SELECT m.mon_start, eu.brand_nm, eu.dealer_nm, eu.group_name, eu.dept_nm, SUM(l.cnt) AS v
        FROM ma m
        JOIN ktws.FCT_LEAD l ON l.lead_reg_dt >= m.mon_start AND l.lead_reg_dt <= m.ref_date
        JOIN elig_user eu ON l.cl_sc_key = eu.sc_key
        WHERE (l.close_dt > m.ref_date OR l.close_dt IS NULL OR l.last_retail_sales_dt IS NOT NULL)
        GROUP BY m.mon_start, eu.brand_nm, eu.dealer_nm, eu.group_name, eu.dept_nm
    ),
    /* 기회창출 영업기회 3개월 평균 (당월+전월+전전월, 각 달말 기준 열림) */
    lead_avg3m AS (
        SELECT m.mon_start, eu.brand_nm, eu.dealer_nm, eu.group_name, eu.dept_nm,
            CAST(
              SUM(CASE WHEN l.lead_reg_dt >= m.mon_start AND l.lead_reg_dt <= m.ref_date
                        AND (l.close_dt > m.ref_date OR l.close_dt IS NULL) THEN l.cnt ELSE 0 END)
            + SUM(CASE WHEN l.lead_reg_dt >= m.m1_start AND l.lead_reg_dt <= m.m1_end
                        AND (l.close_dt > m.m1_end OR l.close_dt IS NULL) THEN l.cnt ELSE 0 END)
            + SUM(CASE WHEN l.lead_reg_dt >= m.m2_start AND l.lead_reg_dt <= m.m2_end
                        AND (l.close_dt > m.m2_end OR l.close_dt IS NULL) THEN l.cnt ELSE 0 END)
              AS FLOAT) / 3.0 AS v
        FROM ma m
        JOIN ktws.FCT_LEAD l ON l.lead_reg_dt >= m.m2_start AND l.lead_reg_dt <= m.ref_date
        JOIN ktws.DIM_CRM_ACT_TYPE t ON l.tp_key = t.tp_key
        JOIN elig_user eu ON l.cl_sc_key = eu.sc_key
        WHERE t.tp_grp_1 = N'기회창출'
        GROUP BY m.mon_start, eu.brand_nm, eu.dealer_nm, eu.group_name, eu.dept_nm
    ),
    /* NPS : 기준월 제외 직전 3개월 응답 평균 (팀 전체 응답 평균) */
    nps AS (
        SELECT m.mon_start, eu.brand_nm, eu.dealer_nm, eu.group_name, eu.dept_nm,
               AVG(CAST(n.promoter_score AS FLOAT)) AS v
        FROM ma m
        JOIN ktws.FCT_NPS n ON n.reply_date >= m.nps_start AND n.reply_date <= m.nps_end
        JOIN elig_user eu ON n.sc_key = eu.sc_key
        GROUP BY m.mon_start, eu.brand_nm, eu.dealer_nm, eu.group_name, eu.dept_nm
    ),
    team_dim AS (
        SELECT brand_nm, dealer_nm, group_name, dept_nm, COUNT(DISTINCT sc_key) AS sc_cnt
        FROM elig_user
        GROUP BY brand_nm, dealer_nm, group_name, dept_nm
    ),
    grid AS (
        SELECT m.mon_start, td.brand_nm, td.dealer_nm, td.group_name, td.dept_nm, td.sc_cnt
        FROM ma m CROSS JOIN team_dim td
    )
    SELECT
        YEAR(g.mon_start)  AS [연도],
        MONTH(g.mon_start) AS [월],
        g.brand_nm    AS [브랜드],
        g.dealer_nm   AS [딜러],
        g.group_name  AS [전시장],
        g.dept_nm     AS [팀],
        g.sc_cnt      AS [SC인원],
        CAST(ISNULL(cv.v,0) AS DECIMAL(18,0)) AS [계약],
        CAST(ISNULL(ct.v,0) AS DECIMAL(18,0)) AS [계약목표],
        CAST(CASE WHEN ISNULL(ct.v,0)=0 THEN 0 ELSE ISNULL(cv.v,0)*1.0/ct.v END AS DECIMAL(18,4)) AS [계약진행률],
        CAST(ISNULL(sv.v,0) AS DECIMAL(18,0)) AS [출고],
        CAST(ISNULL(st.v,0) AS DECIMAL(18,0)) AS [출고목표],
        CAST(CASE WHEN ISNULL(st.v,0)=0 THEN 0 ELSE ISNULL(sv.v,0)*1.0/st.v END AS DECIMAL(18,4)) AS [출고진행률],
        CAST(ISNULL(cu.v,0)  AS INT)           AS [고객수],
        CAST(ISNULL(lh.v,0)  AS INT)           AS [HOT영업기회],
        CAST(ISNULL(la.v,0)  AS INT)           AS [전체영업기회],
        CAST(ISNULL(a3.v,0)  AS DECIMAL(18,0)) AS [기회창출영업기회_3개월평균],
        CAST(np.v AS DECIMAL(18,1))            AS [NPS]      -- 응답 없으면 NULL
    FROM grid g
    LEFT JOIN cntrct_val cv ON cv.mon_start=g.mon_start AND ISNULL(cv.brand_nm,N'')=ISNULL(g.brand_nm,N'') AND ISNULL(cv.dealer_nm,N'')=ISNULL(g.dealer_nm,N'') AND ISNULL(cv.group_name,N'')=ISNULL(g.group_name,N'') AND ISNULL(cv.dept_nm,N'')=ISNULL(g.dept_nm,N'')
    LEFT JOIN sales_val  sv ON sv.mon_start=g.mon_start AND ISNULL(sv.brand_nm,N'')=ISNULL(g.brand_nm,N'') AND ISNULL(sv.dealer_nm,N'')=ISNULL(g.dealer_nm,N'') AND ISNULL(sv.group_name,N'')=ISNULL(g.group_name,N'') AND ISNULL(sv.dept_nm,N'')=ISNULL(g.dept_nm,N'')
    LEFT JOIN cntrct_tgt ct ON ct.mon_start=g.mon_start AND ISNULL(ct.brand_nm,N'')=ISNULL(g.brand_nm,N'') AND ISNULL(ct.dealer_nm,N'')=ISNULL(g.dealer_nm,N'') AND ISNULL(ct.group_name,N'')=ISNULL(g.group_name,N'') AND ISNULL(ct.dept_nm,N'')=ISNULL(g.dept_nm,N'')
    LEFT JOIN sales_tgt  st ON st.mon_start=g.mon_start AND ISNULL(st.brand_nm,N'')=ISNULL(g.brand_nm,N'') AND ISNULL(st.dealer_nm,N'')=ISNULL(g.dealer_nm,N'') AND ISNULL(st.group_name,N'')=ISNULL(g.group_name,N'') AND ISNULL(st.dept_nm,N'')=ISNULL(g.dept_nm,N'')
    LEFT JOIN cust       cu ON ISNULL(cu.brand_nm,N'')=ISNULL(g.brand_nm,N'') AND ISNULL(cu.dealer_nm,N'')=ISNULL(g.dealer_nm,N'') AND ISNULL(cu.group_name,N'')=ISNULL(g.group_name,N'') AND ISNULL(cu.dept_nm,N'')=ISNULL(g.dept_nm,N'')
    LEFT JOIN lead_hot   lh ON lh.mon_start=g.mon_start AND ISNULL(lh.brand_nm,N'')=ISNULL(g.brand_nm,N'') AND ISNULL(lh.dealer_nm,N'')=ISNULL(g.dealer_nm,N'') AND ISNULL(lh.group_name,N'')=ISNULL(g.group_name,N'') AND ISNULL(lh.dept_nm,N'')=ISNULL(g.dept_nm,N'')
    LEFT JOIN lead_all   la ON la.mon_start=g.mon_start AND ISNULL(la.brand_nm,N'')=ISNULL(g.brand_nm,N'') AND ISNULL(la.dealer_nm,N'')=ISNULL(g.dealer_nm,N'') AND ISNULL(la.group_name,N'')=ISNULL(g.group_name,N'') AND ISNULL(la.dept_nm,N'')=ISNULL(g.dept_nm,N'')
    LEFT JOIN lead_avg3m a3 ON a3.mon_start=g.mon_start AND ISNULL(a3.brand_nm,N'')=ISNULL(g.brand_nm,N'') AND ISNULL(a3.dealer_nm,N'')=ISNULL(g.dealer_nm,N'') AND ISNULL(a3.group_name,N'')=ISNULL(g.group_name,N'') AND ISNULL(a3.dept_nm,N'')=ISNULL(g.dept_nm,N'')
    LEFT JOIN nps        np ON np.mon_start=g.mon_start AND ISNULL(np.brand_nm,N'')=ISNULL(g.brand_nm,N'') AND ISNULL(np.dealer_nm,N'')=ISNULL(g.dealer_nm,N'') AND ISNULL(np.group_name,N'')=ISNULL(g.group_name,N'') AND ISNULL(np.dept_nm,N'')=ISNULL(g.dept_nm,N'')
    ORDER BY [연도], [월], g.brand_nm, g.dealer_nm, g.group_name, g.dept_nm;
END
ELSE
BEGIN
    /* ═════════════════════════════════════════════════════════════════
       분기 B : SC 열 포함 — 연×월 × SC ('ALL'=전체 / 값=해당 SC)
       ═════════════════════════════════════════════════════════════════ */
    ;WITH
    elig_user AS (
        SELECT u.sc_key,
               LTRIM(RTRIM(u.BRAND))       AS brand_nm,
               LTRIM(RTRIM(dlr.dealer_nm)) AS dealer_nm,
               LTRIM(RTRIM(u.group_name))  AS group_name,
               LTRIM(RTRIM(u.dept_nm))     AS dept_nm,
               LTRIM(RTRIM(u.[name]))      AS sc_name,
               u.birth_dt, u.work_start_dt
        FROM   ktws.DIM_MNG_USER u
        LEFT JOIN ktws.DIM_MNG_DEALER dlr ON u.dealer_key = dlr.dealer_key
        WHERE  ISNULL(u.facade_sc_yn,N'') <> @exclude_facade
          AND (u.dept_nm IS NULL OR @excl_deptPad  NOT LIKE N'%,' + LTRIM(RTRIM(u.dept_nm)) + N',%')
          AND (u.user_id IS NULL OR @excl_usersPad NOT LIKE N'%,' + LTRIM(RTRIM(u.user_id)) + N',%')
          AND (@sc_name = N'ALL' OR @sc_namePad LIKE N'%,' + LTRIM(RTRIM(u.[name])) + N',%')
          AND (@brandPad      IS NULL OR @brandPad      LIKE N'%,' + LTRIM(RTRIM(u.BRAND))       + N',%')
          AND (@dealer_nmPad  IS NULL OR @dealer_nmPad  LIKE N'%,' + LTRIM(RTRIM(dlr.dealer_nm)) + N',%')
          AND (@group_namePad IS NULL OR @group_namePad LIKE N'%,' + LTRIM(RTRIM(u.group_name))  + N',%')
          AND (@dept_nmPad    IS NULL OR @dept_nmPad    LIKE N'%,' + LTRIM(RTRIM(u.dept_nm))     + N',%')
          AND (@active_ynPad  IS NULL OR @active_ynPad  LIKE N'%,' + LTRIM(RTRIM(u.active_yn))   + N',%')
    ),
    mon_anchor AS (
        SELECT DISTINCT DATEFROMPARTS(YEAR(x.d), MONTH(x.d), 1) AS mon_start
        FROM (
            SELECT c.contract_dt AS d
            FROM ktws.FCT_CONTRACT_KTWS c JOIN elig_user eu ON c.cn_sc_key = eu.sc_key
            WHERE c.contract_dt IS NOT NULL
            UNION
            SELECT c.last_retail_sales_dt
            FROM ktws.FCT_CONTRACT_KTWS c JOIN elig_user eu ON c.cn_sc_key = eu.sc_key
            WHERE c.last_retail_sales_dt IS NOT NULL
        ) x
        WHERE (@year  IS NULL OR YEAR(x.d)  = @year)
          AND (@month IS NULL OR MONTH(x.d) = @month)
    ),
    ma AS (
        SELECT mon_start,
               EOMONTH(mon_start)                    AS ref_date,
               DATEADD(DAY,1,EOMONTH(mon_start,-2))  AS m1_start,
               EOMONTH(mon_start,-1)                 AS m1_end,
               DATEADD(DAY,1,EOMONTH(mon_start,-3))  AS m2_start,
               EOMONTH(mon_start,-2)                 AS m2_end,
               DATEADD(DAY,1,EOMONTH(mon_start,-4))  AS nps_start,
               EOMONTH(mon_start,-1)                 AS nps_end
        FROM mon_anchor
    ),
    cntrct_val AS (
        SELECT m.mon_start, c.cn_sc_key AS sc_key, SUM(c.cnt) AS v
        FROM ma m
        JOIN ktws.FCT_CONTRACT_KTWS c ON c.contract_dt >= m.mon_start AND c.contract_dt <= m.ref_date
        JOIN elig_user eu ON c.cn_sc_key = eu.sc_key
        GROUP BY m.mon_start, c.cn_sc_key
    ),
    sales_val AS (
        SELECT m.mon_start, c.cn_sc_key AS sc_key, SUM(c.cnt) AS v
        FROM ma m
        JOIN ktws.FCT_CONTRACT_KTWS c
          ON c.last_retail_sales_dt >= m.mon_start AND c.last_retail_sales_dt <= m.ref_date
         AND (c.cancel_dt IS NULL OR c.cancel_dt > EOMONTH(c.last_retail_sales_dt,0))
        JOIN elig_user eu ON c.cn_sc_key = eu.sc_key
        GROUP BY m.mon_start, c.cn_sc_key
    ),
    cntrct_tgt AS (
        SELECT m.mon_start, f.sc_key, SUM(f.target_cnt) AS v
        FROM ma m
        JOIN ktws.FCT_CRM_TARGET_M f ON f.monthly_dt >= m.mon_start AND f.monthly_dt <= m.ref_date
        JOIN ktws.DIM_CRM_ACT_TYPE t ON f.tp_key = t.tp_key
        JOIN elig_user eu ON f.sc_key = eu.sc_key
        WHERE t.common_tp_nm = N'계약'
        GROUP BY m.mon_start, f.sc_key
    ),
    sales_tgt AS (
        SELECT m.mon_start, f.sc_key, SUM(f.target_cnt) AS v
        FROM ma m
        JOIN ktws.FCT_CRM_TARGET_M f ON f.monthly_dt >= m.mon_start AND f.monthly_dt <= m.ref_date
        JOIN ktws.DIM_CRM_ACT_TYPE t ON f.tp_key = t.tp_key
        JOIN elig_user eu ON f.sc_key = eu.sc_key
        WHERE t.target_grp_nm = N'Main' AND t.tp_grp_1 = N'판매목표 대수'
        GROUP BY m.mon_start, f.sc_key
    ),
    cust AS (
        SELECT mc.mng_sc_key AS sc_key, COUNT(DISTINCT mc.cust_seq) AS v
        FROM ktws.FCT_MNG_CUST_LIST mc
        JOIN elig_user eu ON mc.mng_sc_key = eu.sc_key
        GROUP BY mc.mng_sc_key
    ),
    lead_hot AS (
        SELECT m.mon_start, l.cl_sc_key AS sc_key, SUM(l.cnt) AS v
        FROM ma m
        JOIN ktws.FCT_LEAD l ON l.lead_reg_dt >= m.mon_start AND l.lead_reg_dt <= m.ref_date
        JOIN elig_user eu ON l.cl_sc_key = eu.sc_key
        WHERE l.potential = N'HOT'
          AND (l.close_dt > m.ref_date OR l.close_dt IS NULL)
        GROUP BY m.mon_start, l.cl_sc_key
    ),
    lead_all AS (
        SELECT m.mon_start, l.cl_sc_key AS sc_key, SUM(l.cnt) AS v
        FROM ma m
        JOIN ktws.FCT_LEAD l ON l.lead_reg_dt >= m.mon_start AND l.lead_reg_dt <= m.ref_date
        JOIN elig_user eu ON l.cl_sc_key = eu.sc_key
        WHERE (l.close_dt > m.ref_date OR l.close_dt IS NULL OR l.last_retail_sales_dt IS NOT NULL)
        GROUP BY m.mon_start, l.cl_sc_key
    ),
    lead_avg3m AS (
        SELECT m.mon_start, l.cl_sc_key AS sc_key,
            CAST(
              SUM(CASE WHEN l.lead_reg_dt >= m.mon_start AND l.lead_reg_dt <= m.ref_date
                        AND (l.close_dt > m.ref_date OR l.close_dt IS NULL) THEN l.cnt ELSE 0 END)
            + SUM(CASE WHEN l.lead_reg_dt >= m.m1_start AND l.lead_reg_dt <= m.m1_end
                        AND (l.close_dt > m.m1_end OR l.close_dt IS NULL) THEN l.cnt ELSE 0 END)
            + SUM(CASE WHEN l.lead_reg_dt >= m.m2_start AND l.lead_reg_dt <= m.m2_end
                        AND (l.close_dt > m.m2_end OR l.close_dt IS NULL) THEN l.cnt ELSE 0 END)
              AS FLOAT) / 3.0 AS v
        FROM ma m
        JOIN ktws.FCT_LEAD l ON l.lead_reg_dt >= m.m2_start AND l.lead_reg_dt <= m.ref_date
        JOIN ktws.DIM_CRM_ACT_TYPE t ON l.tp_key = t.tp_key
        JOIN elig_user eu ON l.cl_sc_key = eu.sc_key
        WHERE t.tp_grp_1 = N'기회창출'
        GROUP BY m.mon_start, l.cl_sc_key
    ),
    nps AS (
        SELECT m.mon_start, n.sc_key, AVG(CAST(n.promoter_score AS FLOAT)) AS v
        FROM ma m
        JOIN ktws.FCT_NPS n ON n.reply_date >= m.nps_start AND n.reply_date <= m.nps_end
        JOIN elig_user eu ON n.sc_key = eu.sc_key
        GROUP BY m.mon_start, n.sc_key
    ),
    grid AS (
        SELECT m.mon_start, eu.sc_key
        FROM ma m CROSS JOIN (SELECT sc_key FROM elig_user) eu
    )
    SELECT
        YEAR(g.mon_start)  AS [연도],
        MONTH(g.mon_start) AS [월],
        eu.brand_nm    AS [브랜드],
        eu.dealer_nm   AS [딜러],
        eu.group_name  AS [전시장],
        eu.dept_nm     AS [팀],
        eu.sc_name     AS [SC],
        ISNULL(eu.dept_nm, N'')  AS [소속팀],
        /* 근속년수 : 오늘 기준 만 근속. 없으면 0 */
        CAST(CASE
            WHEN eu.work_start_dt IS NULL THEN 0
            WHEN (MONTH(@today) > MONTH(eu.work_start_dt))
              OR (MONTH(@today) = MONTH(eu.work_start_dt) AND DAY(@today) >= DAY(eu.work_start_dt))
                THEN YEAR(@today) - YEAR(eu.work_start_dt)
            ELSE YEAR(@today) - YEAR(eu.work_start_dt) - 1
        END AS INT)  AS [근속년수],
        /* 나이 : 연도차. 없으면 공백 */
        CASE WHEN eu.birth_dt IS NULL THEN NULL ELSE YEAR(@today) - YEAR(eu.birth_dt) END AS [나이],
        CAST(ISNULL(cv.v,0) AS DECIMAL(18,0)) AS [계약],
        CAST(ISNULL(ct.v,0) AS DECIMAL(18,0)) AS [계약목표],
        CAST(CASE WHEN ISNULL(ct.v,0)=0 THEN 0 ELSE ISNULL(cv.v,0)*1.0/ct.v END AS DECIMAL(18,4)) AS [계약진행률],
        CAST(ISNULL(sv.v,0) AS DECIMAL(18,0)) AS [출고],
        CAST(ISNULL(st.v,0) AS DECIMAL(18,0)) AS [출고목표],
        CAST(CASE WHEN ISNULL(st.v,0)=0 THEN 0 ELSE ISNULL(sv.v,0)*1.0/st.v END AS DECIMAL(18,4)) AS [출고진행률],
        CAST(ISNULL(cu.v,0)  AS INT)           AS [고객수],
        CAST(ISNULL(lh.v,0)  AS INT)           AS [HOT영업기회],
        CAST(ISNULL(la.v,0)  AS INT)           AS [전체영업기회],
        CAST(ISNULL(a3.v,0)  AS DECIMAL(18,0)) AS [기회창출영업기회_3개월평균],
        CAST(np.v AS DECIMAL(18,1))            AS [NPS]      -- 응답 없으면 NULL
    FROM grid g
    JOIN elig_user eu ON eu.sc_key = g.sc_key
    LEFT JOIN cntrct_val cv ON cv.mon_start = g.mon_start AND cv.sc_key = g.sc_key
    LEFT JOIN sales_val  sv ON sv.mon_start = g.mon_start AND sv.sc_key = g.sc_key
    LEFT JOIN cntrct_tgt ct ON ct.mon_start = g.mon_start AND ct.sc_key = g.sc_key
    LEFT JOIN sales_tgt  st ON st.mon_start = g.mon_start AND st.sc_key = g.sc_key
    LEFT JOIN cust       cu ON cu.sc_key = g.sc_key
    LEFT JOIN lead_hot   lh ON lh.mon_start = g.mon_start AND lh.sc_key = g.sc_key
    LEFT JOIN lead_all   la ON la.mon_start = g.mon_start AND la.sc_key = g.sc_key
    LEFT JOIN lead_avg3m a3 ON a3.mon_start = g.mon_start AND a3.sc_key = g.sc_key
    LEFT JOIN nps        np ON np.mon_start = g.mon_start AND np.sc_key = g.sc_key
    ORDER BY [연도], [월], eu.brand_nm, eu.dealer_nm, eu.group_name, eu.dept_nm, eu.sc_name;
END

/* ══════════════════════════════════════════════════════════════════════════
   [사용 가이드]
   ● 전 변수 NULL → 전체 데이터: 전 기간(데이터 있는 모든 연×월) × 전 대상.
       단 @sc_name 은 NULL이면 SC 열 없이 팀 레벨, 'ALL'이어야 SC별 전체.
   ● 각 월 행의 기준: 계약/출고/목표/영업기회=그 달, 3개월평균=그 달 포함
       직전 3개월, NPS=기준월 제외 직전 3개월. 고객수는 시점 무관(매월 동일).
   ● 근속년수/나이는 오늘(GETDATE) 기준 — 과거 월 행에도 현재 값이 표시됨.
   ● 기준월 목록은 대상의 계약일/출고일 기준 → 계약·출고가 전혀 없는 월은
       행이 생기지 않음 (그 월의 영업기회/NPS도 함께 안 보임).
   ● 슬라이서 LIKE 패딩(콤마 다중, 콤마 뒤 공백 자동 제거) → 8623 방지.
   ══════════════════════════════════════════════════════════════════════════ */