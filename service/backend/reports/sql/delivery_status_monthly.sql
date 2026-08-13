/* ══════════════════════════════════════════════════════════════════════════
   [출고 현황 · 월별 FINAL3]
   ──────────────────────────────────────────────────────────────────────────
   FINAL3 변경 :
     · base의 DIM_CRM_ACT_TYPE 조인을 INNER → LEFT 로 변경.
       (유형 미매핑 계약이 탈락해 YTD-출고현황이 작게 나오던 근본 원인.
        검증 쿼리에는 유형 조인이 없어 값이 맞았음.)
       MTD/LM/구분별 값은 유형 조건 가드가 있어 기존과 동일.
   FINAL2 변경 :
     · YTD-출고현황을 agg 내부 계산에서 분리 → 검증된 확인 쿼리와 1:1 동일한
       전용 CTE(ytd_tot)로 계산해 결과에 붙임.
         분기 A: 월 × 딜러 × 팀 단위 COUNT(DISTINCT dlr_contract_no)
         분기 B: 월 × SC 단위 COUNT(DISTINCT dlr_contract_no)
       (제외 규칙 미적용 · 유형 무관 전건 — 확인 쿼리 기준 그대로)
     · 모든 차원 속성을 LTRIM(RTRIM())으로 정규화 → 공백 변형으로 인한
       행 쪼개짐(같은 팀이 여러 행으로 분산되어 값이 작아 보이는 문제) 방지.
     · 분기 A의 행 단위를 딜러×팀 기준으로 단순화(전시장/브랜드는 대표값 표시)
       → 팀 YTD가 한 행에 온전히 나옴. MTD/LM/구분별 값도 같은 단위로 합산.
   유지 :
     · MTD/LM/기회창출/관계형성/소개 = 제외 규칙 적용(excl_flag=0), 기존 계산식.
     · LM-출고현황 last_day 로직 / 기간 NULL=전체 월 / @sc_name 3분기 / LIKE 패딩.
   ══════════════════════════════════════════════════════════════════════════ */

/* ── 기간 (NULL = 데이터가 있는 전체 월) ── */

/* ── 슬라이서 (NULL=모두, 콤마 다중) ── */

/* ── 제외 규칙 (MTD/LM/구분별 값에만 적용, YTD-출고현황엔 미적용) ── */
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
       분기 A : SC 열 없음 — 연×월 × 딜러 × 팀 × class
       ═════════════════════════════════════════════════════════════════ */
    ;WITH
    /* 슬라이서 통과 SC 전체 (속성 TRIM 정규화) + 제외 플래그 */
    elig_user AS (
        SELECT u.sc_key,
               LTRIM(RTRIM(u.BRAND))      AS brand_nm,
               LTRIM(RTRIM(dlr.dealer_nm)) AS dealer_nm,
               LTRIM(RTRIM(u.group_name)) AS group_name,
               LTRIM(RTRIM(u.dept_nm))    AS dept_nm,
               CASE WHEN ISNULL(u.facade_sc_yn,N'') = @exclude_facade
                      OR (u.dept_nm IS NOT NULL AND @excl_deptPad  LIKE N'%,' + LTRIM(RTRIM(u.dept_nm)) + N',%')
                      OR (u.user_id IS NOT NULL AND @excl_usersPad LIKE N'%,' + LTRIM(RTRIM(u.user_id)) + N',%')
                    THEN 1 ELSE 0 END AS excl_flag
        FROM   ktws.DIM_MNG_USER u
        LEFT JOIN ktws.DIM_MNG_DEALER dlr ON u.dealer_key = dlr.dealer_key
        WHERE (@brandPad      IS NULL OR @brandPad      LIKE N'%,' + LTRIM(RTRIM(u.BRAND))       + N',%')
          AND (@dealer_nmPad  IS NULL OR @dealer_nmPad  LIKE N'%,' + LTRIM(RTRIM(dlr.dealer_nm)) + N',%')
          AND (@group_namePad IS NULL OR @group_namePad LIKE N'%,' + LTRIM(RTRIM(u.group_name))  + N',%')
          AND (@dept_nmPad    IS NULL OR @dept_nmPad    LIKE N'%,' + LTRIM(RTRIM(u.dept_nm))     + N',%')
          AND (@active_ynPad  IS NULL OR @active_ynPad  LIKE N'%,' + LTRIM(RTRIM(u.active_yn))   + N',%')
    ),
    base AS (
        SELECT eu.dealer_nm, eu.dept_nm, eu.excl_flag,
               c.cnt, c.dlr_contract_no, c.last_retail_sales_dt, c.cancel_dt,
               t.tp_grp_1, t.tp_cd
        FROM ktws.FCT_CONTRACT_KTWS c
        LEFT JOIN ktws.DIM_CRM_ACT_TYPE t ON c.tp_key = t.tp_key   -- ★ LEFT: 유형 미매핑 계약도 포함 (YTD 검증쿼리와 동일)
        JOIN elig_user eu ON c.cn_sc_key = eu.sc_key
        WHERE c.last_retail_sales_dt IS NOT NULL
    ),
    mon_anchor AS (
        SELECT DISTINCT
               DATEFROMPARTS(YEAR(last_retail_sales_dt), MONTH(last_retail_sales_dt), 1) AS mon_start
        FROM base
        WHERE (@year  IS NULL OR YEAR(last_retail_sales_dt)  = @year)
          AND (@month IS NULL OR MONTH(last_retail_sales_dt) = @month)
    ),
    ma AS (
        SELECT mon_start,
               EOMONTH(mon_start)                        AS ref_date,
               DATEFROMPARTS(YEAR(mon_start),1,1)        AS ytd_start,
               DATEADD(DAY,1,EOMONTH(mon_start,-2))      AS lm_start,
               EOMONTH(mon_start,-1)                     AS lm_end,
               DATEFROMPARTS(YEAR(EOMONTH(mon_start,-1)), MONTH(EOMONTH(mon_start,-1)),
                   CASE WHEN DAY(EOMONTH(mon_start)) < 30 THEN DAY(EOMONTH(mon_start))
                        WHEN DAY(EOMONTH(mon_start)) <> DAY(EOMONTH(mon_start,-1)) THEN DAY(EOMONTH(mon_start,-1))
                        ELSE DAY(EOMONTH(mon_start)) END) AS lm_total_end
        FROM mon_anchor
    ),
    cls AS (
        SELECT * FROM (VALUES (N'출고현황',0),(N'기회창출',1),(N'관계형성',2),(N'소개',3)) v(class_nm, class_ord)
    ),
    /* ★ YTD-출고현황 : 검증 쿼리 1:1 이식 (월 × 딜러 × 팀, 제외 미적용·전건 DISTINCT) */
    ytd_tot AS (
        SELECT m.mon_start, b.dealer_nm, b.dept_nm,
               COUNT(DISTINCT b.dlr_contract_no) AS ytd_cnt
        FROM ma m
        JOIN base b
          ON b.last_retail_sales_dt >= m.ytd_start
         AND b.last_retail_sales_dt <= m.ref_date
         AND (b.cancel_dt IS NULL OR b.cancel_dt > EOMONTH(m.ref_date,-1))
        GROUP BY m.mon_start, b.dealer_nm, b.dept_nm
    ),
    /* 그리드 : 딜러 × 팀 (브랜드/전시장은 대표값) × 월 × class */
    team_dim AS (
        SELECT dealer_nm, dept_nm,
               MAX(brand_nm)  AS brand_nm,
               MAX(group_name) AS group_name
        FROM elig_user
        GROUP BY dealer_nm, dept_nm
    ),
    grid AS (
        SELECT m.mon_start, td.brand_nm, td.dealer_nm, td.group_name, td.dept_nm,
               c.class_nm, c.class_ord
        FROM ma m CROSS JOIN team_dim td CROSS JOIN cls c
    ),
    /* MTD/LM/구분별 YTD : 딜러 × 팀 단위, 제외 규칙 적용(excl_flag=0) */
    agg AS (
        SELECT m.mon_start, b.dealer_nm, b.dept_nm,
               cls.class_nm,
               SUM(CASE WHEN b.excl_flag = 0
                         AND b.last_retail_sales_dt >= m.mon_start AND b.last_retail_sales_dt <= m.ref_date
                         AND (b.cancel_dt IS NULL OR b.cancel_dt > EOMONTH(b.last_retail_sales_dt,0))
                         AND (cls.class_nm <> N'출고현황' OR b.tp_grp_1 IN (N'기회창출', N'관계형성'))
                        THEN b.cnt ELSE 0 END) AS mtd,
               SUM(CASE WHEN b.excl_flag = 0
                         AND b.last_retail_sales_dt >= m.ytd_start AND b.last_retail_sales_dt <= m.ref_date
                         AND (b.cancel_dt IS NULL OR b.cancel_dt > EOMONTH(m.ref_date,-1))
                        THEN b.cnt ELSE 0 END) AS ytd_cls,
               SUM(CASE WHEN b.excl_flag = 0
                         AND b.last_retail_sales_dt >= m.lm_start
                         AND b.last_retail_sales_dt <=
                             CASE WHEN cls.class_nm = N'출고현황' THEN m.lm_total_end ELSE m.lm_end END
                         AND (b.cancel_dt IS NULL OR b.cancel_dt > EOMONTH(b.last_retail_sales_dt,-1))
                         AND (cls.class_nm <> N'출고현황' OR b.tp_grp_1 IN (N'기회창출', N'관계형성'))
                        THEN b.cnt ELSE 0 END) AS lm
        FROM ma m
        JOIN base b
            ON b.last_retail_sales_dt >= CASE WHEN m.lm_start < m.ytd_start THEN m.lm_start ELSE m.ytd_start END
           AND b.last_retail_sales_dt <= m.ref_date
        JOIN cls ON (cls.class_nm = N'출고현황')
                 OR (cls.class_nm = N'기회창출' AND b.tp_grp_1 = N'기회창출')
                 OR (cls.class_nm = N'관계형성' AND b.tp_grp_1 = N'관계형성')
                 OR (cls.class_nm = N'소개'     AND b.tp_cd    = N'P120')
        GROUP BY m.mon_start, b.dealer_nm, b.dept_nm, cls.class_nm
    )
    SELECT
        YEAR(g.mon_start)  AS [연도],
        MONTH(g.mon_start) AS [월],
        g.brand_nm   AS [브랜드],
        g.dealer_nm  AS [딜러],
        g.group_name AS [전시장],
        g.dept_nm    AS [팀],
        g.class_nm   AS [구분],
        CAST(ISNULL(a.mtd,0) AS DECIMAL(18,0)) AS [출고MTD],
        CAST(CASE WHEN g.class_nm = N'출고현황' THEN ISNULL(y.ytd_cnt,0)
                  ELSE ISNULL(a.ytd_cls,0) END AS DECIMAL(18,0)) AS [출고YTD],
        CAST(ISNULL(a.lm,0)  AS DECIMAL(18,0)) AS [출고LM]
    FROM grid g
    LEFT JOIN agg a
        ON  a.mon_start = g.mon_start
        AND ISNULL(a.dealer_nm,N'') = ISNULL(g.dealer_nm,N'')
        AND ISNULL(a.dept_nm,N'')   = ISNULL(g.dept_nm,N'')
        AND a.class_nm = g.class_nm
    LEFT JOIN ytd_tot y
        ON  y.mon_start = g.mon_start
        AND ISNULL(y.dealer_nm,N'') = ISNULL(g.dealer_nm,N'')
        AND ISNULL(y.dept_nm,N'')   = ISNULL(g.dept_nm,N'')
    ORDER BY [연도], [월], g.brand_nm, g.dealer_nm, g.group_name, g.dept_nm, g.class_ord;
END
ELSE
BEGIN
    /* ═════════════════════════════════════════════════════════════════
       분기 B : SC 열 포함 — 연×월 × SC × class ('ALL'=전체 / 값=해당 SC)
       ═════════════════════════════════════════════════════════════════ */
    ;WITH
    elig_user AS (
        SELECT u.sc_key,
               LTRIM(RTRIM(u.BRAND))       AS brand_nm,
               LTRIM(RTRIM(dlr.dealer_nm)) AS dealer_nm,
               LTRIM(RTRIM(u.group_name))  AS group_name,
               LTRIM(RTRIM(u.dept_nm))     AS dept_nm,
               LTRIM(RTRIM(u.[name]))      AS sc_name,
               CASE WHEN ISNULL(u.facade_sc_yn,N'') = @exclude_facade
                      OR (u.dept_nm IS NOT NULL AND @excl_deptPad  LIKE N'%,' + LTRIM(RTRIM(u.dept_nm)) + N',%')
                      OR (u.user_id IS NOT NULL AND @excl_usersPad LIKE N'%,' + LTRIM(RTRIM(u.user_id)) + N',%')
                    THEN 1 ELSE 0 END AS excl_flag
        FROM   ktws.DIM_MNG_USER u
        LEFT JOIN ktws.DIM_MNG_DEALER dlr ON u.dealer_key = dlr.dealer_key
        WHERE (@sc_name = N'ALL' OR @sc_namePad LIKE N'%,' + LTRIM(RTRIM(u.[name])) + N',%')
          AND (@brandPad      IS NULL OR @brandPad      LIKE N'%,' + LTRIM(RTRIM(u.BRAND))       + N',%')
          AND (@dealer_nmPad  IS NULL OR @dealer_nmPad  LIKE N'%,' + LTRIM(RTRIM(dlr.dealer_nm)) + N',%')
          AND (@group_namePad IS NULL OR @group_namePad LIKE N'%,' + LTRIM(RTRIM(u.group_name))  + N',%')
          AND (@dept_nmPad    IS NULL OR @dept_nmPad    LIKE N'%,' + LTRIM(RTRIM(u.dept_nm))     + N',%')
          AND (@active_ynPad  IS NULL OR @active_ynPad  LIKE N'%,' + LTRIM(RTRIM(u.active_yn))   + N',%')
    ),
    base AS (
        SELECT c.cn_sc_key AS sc_key, eu.excl_flag,
               c.cnt, c.dlr_contract_no, c.last_retail_sales_dt, c.cancel_dt,
               t.tp_grp_1, t.tp_cd
        FROM ktws.FCT_CONTRACT_KTWS c
        LEFT JOIN ktws.DIM_CRM_ACT_TYPE t ON c.tp_key = t.tp_key   -- ★ LEFT: 유형 미매핑 계약도 포함 (YTD 검증쿼리와 동일)
        JOIN elig_user eu ON c.cn_sc_key = eu.sc_key
        WHERE c.last_retail_sales_dt IS NOT NULL
    ),
    mon_anchor AS (
        SELECT DISTINCT
               DATEFROMPARTS(YEAR(last_retail_sales_dt), MONTH(last_retail_sales_dt), 1) AS mon_start
        FROM base
        WHERE (@year  IS NULL OR YEAR(last_retail_sales_dt)  = @year)
          AND (@month IS NULL OR MONTH(last_retail_sales_dt) = @month)
    ),
    ma AS (
        SELECT mon_start,
               EOMONTH(mon_start)                        AS ref_date,
               DATEFROMPARTS(YEAR(mon_start),1,1)        AS ytd_start,
               DATEADD(DAY,1,EOMONTH(mon_start,-2))      AS lm_start,
               EOMONTH(mon_start,-1)                     AS lm_end,
               DATEFROMPARTS(YEAR(EOMONTH(mon_start,-1)), MONTH(EOMONTH(mon_start,-1)),
                   CASE WHEN DAY(EOMONTH(mon_start)) < 30 THEN DAY(EOMONTH(mon_start))
                        WHEN DAY(EOMONTH(mon_start)) <> DAY(EOMONTH(mon_start,-1)) THEN DAY(EOMONTH(mon_start,-1))
                        ELSE DAY(EOMONTH(mon_start)) END) AS lm_total_end
        FROM mon_anchor
    ),
    cls AS (
        SELECT * FROM (VALUES (N'출고현황',0),(N'기회창출',1),(N'관계형성',2),(N'소개',3)) v(class_nm, class_ord)
    ),
    /* ★ YTD-출고현황 : 검증 쿼리 1:1 이식 (월 × SC, 제외 미적용·전건 DISTINCT) */
    ytd_tot AS (
        SELECT m.mon_start, b.sc_key,
               COUNT(DISTINCT b.dlr_contract_no) AS ytd_cnt
        FROM ma m
        JOIN base b
          ON b.last_retail_sales_dt >= m.ytd_start
         AND b.last_retail_sales_dt <= m.ref_date
         AND (b.cancel_dt IS NULL OR b.cancel_dt > EOMONTH(m.ref_date,-1))
        GROUP BY m.mon_start, b.sc_key
    ),
    grid AS (
        SELECT m.mon_start, eu.sc_key, c.class_nm, c.class_ord
        FROM ma m
        CROSS JOIN (SELECT sc_key FROM elig_user) eu
        CROSS JOIN cls c
    ),
    agg AS (
        SELECT m.mon_start, b.sc_key,
               cls.class_nm,
               SUM(CASE WHEN b.excl_flag = 0
                         AND b.last_retail_sales_dt >= m.mon_start AND b.last_retail_sales_dt <= m.ref_date
                         AND (b.cancel_dt IS NULL OR b.cancel_dt > EOMONTH(b.last_retail_sales_dt,0))
                         AND (cls.class_nm <> N'출고현황' OR b.tp_grp_1 IN (N'기회창출', N'관계형성'))
                        THEN b.cnt ELSE 0 END) AS mtd,
               SUM(CASE WHEN b.excl_flag = 0
                         AND b.last_retail_sales_dt >= m.ytd_start AND b.last_retail_sales_dt <= m.ref_date
                         AND (b.cancel_dt IS NULL OR b.cancel_dt > EOMONTH(m.ref_date,-1))
                        THEN b.cnt ELSE 0 END) AS ytd_cls,
               SUM(CASE WHEN b.excl_flag = 0
                         AND b.last_retail_sales_dt >= m.lm_start
                         AND b.last_retail_sales_dt <=
                             CASE WHEN cls.class_nm = N'출고현황' THEN m.lm_total_end ELSE m.lm_end END
                         AND (b.cancel_dt IS NULL OR b.cancel_dt > EOMONTH(b.last_retail_sales_dt,-1))
                         AND (cls.class_nm <> N'출고현황' OR b.tp_grp_1 IN (N'기회창출', N'관계형성'))
                        THEN b.cnt ELSE 0 END) AS lm
        FROM ma m
        JOIN base b
            ON b.last_retail_sales_dt >= CASE WHEN m.lm_start < m.ytd_start THEN m.lm_start ELSE m.ytd_start END
           AND b.last_retail_sales_dt <= m.ref_date
        JOIN cls ON (cls.class_nm = N'출고현황')
                 OR (cls.class_nm = N'기회창출' AND b.tp_grp_1 = N'기회창출')
                 OR (cls.class_nm = N'관계형성' AND b.tp_grp_1 = N'관계형성')
                 OR (cls.class_nm = N'소개'     AND b.tp_cd    = N'P120')
        GROUP BY m.mon_start, b.sc_key, cls.class_nm
    )
    SELECT
        YEAR(g.mon_start)  AS [연도],
        MONTH(g.mon_start) AS [월],
        eu.brand_nm   AS [브랜드],
        eu.dealer_nm  AS [딜러],
        eu.group_name AS [전시장],
        eu.dept_nm    AS [팀],
        eu.sc_name    AS [SC],
        g.class_nm    AS [구분],
        CAST(ISNULL(a.mtd,0) AS DECIMAL(18,0)) AS [출고MTD],
        CAST(CASE WHEN g.class_nm = N'출고현황' THEN ISNULL(y.ytd_cnt,0)
                  ELSE ISNULL(a.ytd_cls,0) END AS DECIMAL(18,0)) AS [출고YTD],
        CAST(ISNULL(a.lm,0)  AS DECIMAL(18,0)) AS [출고LM]
    FROM grid g
    JOIN      elig_user eu ON eu.sc_key = g.sc_key
    LEFT JOIN agg a ON a.mon_start = g.mon_start AND a.sc_key = g.sc_key AND a.class_nm = g.class_nm
    LEFT JOIN ytd_tot y ON y.mon_start = g.mon_start AND y.sc_key = g.sc_key
    ORDER BY [연도], [월], eu.brand_nm, eu.dealer_nm, eu.group_name, eu.dept_nm, eu.sc_name, g.class_ord;
END

/* ══════════════════════════════════════════════════════════════════════════
   [사용 가이드]
   ● YTD-출고현황 = 검증 쿼리와 완전 동일 (딜러×팀 또는 SC 단위,
       제외 규칙 미적용, 유형 무관 전건 DISTINCTCOUNT(dlr_contract_no)).
   ● 분기 A 행 단위 = 연×월×딜러×팀 (전시장/브랜드는 대표값 표시).
       팀 YTD가 한 행에 온전히 나오며, 강남영업2팀 12월 행은 검증값과 동일해야 함.
   ● MTD/LM/기회창출/관계형성/소개 = 제외 규칙(excl_flag) 적용, 기존 계산식.
   ● 기간: @year/@month NULL → 실판매 있는 모든 연×월 행.
   ● @sc_name 3분기: NULL→SC 열 없음(팀 레벨) / N'ALL'→전체 SC / 값→해당 SC만.
   ══════════════════════════════════════════════════════════════════════════ */