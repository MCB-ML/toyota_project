/* ── 파라미터 ──
   원본에서 파라미터 DECLARE 12개를 제거했다. mssql 드라이버가
   request.input()으로 바인딩해 주입한다(문자열 치환 금지).
     @Year @Brand @DealerNm @GroupName @DeptNm @ActiveYn @ScName @ModelNm @VariantNm @MyCd @SfxCd @AsOfDate

   콤마 패딩 변수 11개에 CASE NULL 가드를 넣었다 — Fabric에서
   ',' + NULL + ',' 가 NULL이 아니라 ',,' 가 되어 "NULL=전체"가
   "NULL=결과 없음"으로 뒤집히기 때문이다(라이브로 확인된 문제).
   그 밖의 계산 로직과 페이지 고정 상수는 원문 그대로다. */

/* ============================================
   1. 슬라이서 변수 (NULL = 전체 선택, 다중 값은 콤마 구분, N'...' 사용)
      ※ @ScName: NULL → SC 열 미표시 / 'ALL' → 표시+전체 / 값 → 표시+해당 SC
   ============================================ */

/* ============================================
   2. 페이지 필터 변수
   ============================================ */
DECLARE @ExclFacadeScYn NVARCHAR(50)  = N'창구SC';
DECLARE @ExclScName1    NVARCHAR(50)  = N'고객지원팀';
DECLARE @ExclScName2    NVARCHAR(50)  = N'TOYOTA YM';
DECLARE @ExclUserIds    NVARCHAR(500) = NEXCLUDED_USER_ID_1,EXCLUDED_USER_ID_2;

/* ============================================
   3. 월별 기준일 (NULL 이면 각 월 전체)
   ============================================ */

/* ============================================
   4. LIKE 패딩 변수 (STRING_SPLIT 제거 → 8623 오류 방지)
      ※ ',값1,값2,' 형태로 패딩. 콤마 뒤 공백은 자동 제거(', ' → ',')
      ※ 값 자체에 콤마(,)가 포함된 데이터는 이 방식으로 필터할 수 없음
   ============================================ */
DECLARE @YearPad      NVARCHAR(210) = CASE WHEN @Year IS NULL THEN NULL ELSE N',' + REPLACE(@Year,      N', ', N',') + N',' END;
DECLARE @BrandPad     NVARCHAR(210) = CASE WHEN @Brand IS NULL THEN NULL ELSE N',' + REPLACE(@Brand,     N', ', N',') + N',' END;
DECLARE @DealerNmPad  NVARCHAR(510) = CASE WHEN @DealerNm IS NULL THEN NULL ELSE N',' + REPLACE(@DealerNm,  N', ', N',') + N',' END;
DECLARE @GroupNamePad NVARCHAR(510) = CASE WHEN @GroupName IS NULL THEN NULL ELSE N',' + REPLACE(@GroupName, N', ', N',') + N',' END;
DECLARE @DeptNmPad    NVARCHAR(510) = CASE WHEN @DeptNm IS NULL THEN NULL ELSE N',' + REPLACE(@DeptNm,    N', ', N',') + N',' END;
DECLARE @ActiveYnPad  NVARCHAR(60)  = CASE WHEN @ActiveYn IS NULL THEN NULL ELSE N',' + REPLACE(@ActiveYn,  N', ', N',') + N',' END;
DECLARE @ScNamePad    NVARCHAR(510) = CASE WHEN @ScName IS NULL THEN NULL ELSE N',' + REPLACE(@ScName,    N', ', N',') + N',' END;
DECLARE @ModelNmPad   NVARCHAR(510) = CASE WHEN @ModelNm IS NULL THEN NULL ELSE N',' + REPLACE(@ModelNm,   N', ', N',') + N',' END;
DECLARE @VariantNmPad NVARCHAR(510) = CASE WHEN @VariantNm IS NULL THEN NULL ELSE N',' + REPLACE(@VariantNm, N', ', N',') + N',' END;
DECLARE @MyCdPad      NVARCHAR(210) = CASE WHEN @MyCd IS NULL THEN NULL ELSE N',' + REPLACE(@MyCd,      N', ', N',') + N',' END;
DECLARE @SfxCdPad     NVARCHAR(210) = CASE WHEN @SfxCd IS NULL THEN NULL ELSE N',' + REPLACE(@SfxCd,     N', ', N',') + N',' END;
DECLARE @ExclUserIdsPad NVARCHAR(510) = N',' + REPLACE(@ExclUserIds, N' ', N'') + N',';

/* ============================================
   연도 | MonthAbbr | 브랜드 | 딜러 | 전시장 | 팀 | 재직여부 | (SC)
   | 모델 | 차종 | 연식 | SFX | 실적 | 취소 | 타겟 | 달성률
   ※ MonthNumber 미사용. 각 월 행 = 해당 월 MTD
   ============================================ */
IF @ScName IS NULL
BEGIN
    /* ---------- 분기 A: SC 열 없음 ---------- */
    ;WITH MonthAnchor AS (
        SELECT
              CAL.[Year]                                      AS yr
            , CAL.MonthAbbr
            , MIN(CAL.[Date])                                 AS month_start
            , CASE WHEN @AsOfDate IS NOT NULL AND EOMONTH(MAX(CAL.[Date])) > @AsOfDate
                   THEN @AsOfDate
                   ELSE EOMONTH(MAX(CAL.[Date]))
              END                                             AS month_end
        FROM ktws.DIM_CALENDAR_KTWS CAL
        WHERE (@YearPad IS NULL OR @YearPad LIKE N'%,' + CAST(CAL.[Year] AS NVARCHAR(10)) + N',%')
          AND (@AsOfDate IS NULL OR CAL.[Date] <= @AsOfDate OR MONTH(CAL.[Date]) = MONTH(@AsOfDate))
        GROUP BY CAL.[Year], CAL.MonthAbbr
    )
    , CN AS (
        /* 계약 MTD: 해당 월 계약일 기준, 현재 취소 상태로 실적/취소를 분리 */
        SELECT
              A.yr, A.MonthAbbr
            , ISNULL(U.BRAND, N'')      AS brand_k
            , ISNULL(D.dealer_nm, N'')  AS dealer_k
            , ISNULL(U.group_name, N'') AS grp_k
            , ISNULL(U.dept_nm, N'')    AS dept_k
            , ISNULL(U.active_yn, N'')  AS act_k
            , M.model_nm, V.variant_nm, S.my_cd, S.sfx_cd
            , SUM(CASE WHEN F.cancel_dt IS NULL
                       THEN F.cnt ELSE 0 END)                       AS ac_val
            , SUM(CASE WHEN F.cancel_dt IS NOT NULL
                       THEN F.cnt ELSE 0 END)                       AS cancel_val
            , SUM(F.cnt)                                            AS total_val
        FROM MonthAnchor A
        JOIN ktws.FCT_CONTRACT_KTWS        F   ON F.contract_dt >= A.month_start
                                              AND F.contract_dt <= A.month_end
        INNER JOIN ktws.DIM_MNG_USER        U   ON F.cn_sc_key    = U.sc_key
        INNER JOIN ktws.DIM_MNG_DEALER      D   ON U.dealer_key   = D.dealer_key
        LEFT JOIN ktws.DIM_VEHIC_SPEC      S   ON F.cn_vehic_key = S.spec_key
        LEFT JOIN ktws.DIM_VEHIC_SPEC_VAR  V   ON S.var_key      = V.var_key
        LEFT JOIN ktws.DIM_VEHIC_SPEC_MDL  M   ON V.model_key    = M.mdl_key
        WHERE 1 = 1
            AND (U.facade_sc_yn IS NULL OR U.facade_sc_yn NOT LIKE N'%' + @ExclFacadeScYn + N'%')
            AND (U.name IS NULL OR (U.name NOT LIKE N'%' + @ExclScName1 + N'%'
                                AND U.name NOT LIKE N'%' + @ExclScName2 + N'%'))
            AND (U.user_id IS NULL OR @ExclUserIdsPad NOT LIKE N'%,' + LTRIM(RTRIM(U.user_id)) + N',%')
            AND (@BrandPad     IS NULL OR @BrandPad     LIKE N'%,' + LTRIM(RTRIM(U.BRAND))      + N',%')
            AND (@DealerNmPad  IS NULL OR @DealerNmPad  LIKE N'%,' + LTRIM(RTRIM(D.dealer_nm))  + N',%')
            AND (@GroupNamePad IS NULL OR @GroupNamePad LIKE N'%,' + LTRIM(RTRIM(U.group_name)) + N',%')
            AND (@DeptNmPad    IS NULL OR @DeptNmPad    LIKE N'%,' + LTRIM(RTRIM(U.dept_nm))    + N',%')
            AND (@ActiveYnPad  IS NULL OR @ActiveYnPad  LIKE N'%,' + LTRIM(RTRIM(U.active_yn))  + N',%')
            AND (@ModelNmPad   IS NULL OR @ModelNmPad   LIKE N'%,' + LTRIM(RTRIM(M.model_nm))   + N',%')
            AND (@VariantNmPad IS NULL OR @VariantNmPad LIKE N'%,' + LTRIM(RTRIM(V.variant_nm)) + N',%')
            AND (@MyCdPad      IS NULL OR @MyCdPad      LIKE N'%,' + LTRIM(RTRIM(S.my_cd))      + N',%')
            AND (@SfxCdPad     IS NULL OR @SfxCdPad     LIKE N'%,' + LTRIM(RTRIM(S.sfx_cd))     + N',%')
        GROUP BY A.yr, A.MonthAbbr
            , ISNULL(U.BRAND, N''), ISNULL(D.dealer_nm, N''), ISNULL(U.group_name, N'')
            , ISNULL(U.dept_nm, N''), ISNULL(U.active_yn, N'')
            , M.model_nm, V.variant_nm, S.my_cd, S.sfx_cd
    )
    , TGTM AS (
        /* 목표 월별 (common_tp_nm='계약', 유효 사용자 차원) */
        SELECT
              CAL.[Year]                AS yr
            , CAL.MonthAbbr
            , ISNULL(U.BRAND, N'')      AS brand_k
            , ISNULL(D.dealer_nm, N'')  AS dealer_k
            , ISNULL(U.group_name, N'') AS grp_k
            , ISNULL(U.dept_nm, N'')    AS dept_k
            , ISNULL(U.active_yn, N'')  AS act_k
            , SUM(F.target_cnt)         AS mval
        FROM ktws.FCT_CRM_TARGET_M      F
        JOIN ktws.DIM_CALENDAR_KTWS     CAL ON F.monthly_dt = CAL.[Date]
        INNER JOIN ktws.DIM_MNG_USER     U   ON F.sc_key     = U.sc_key
        INNER JOIN ktws.DIM_MNG_DEALER   D   ON U.dealer_key = D.dealer_key
        JOIN ktws.DIM_CRM_ACT_TYPE      A   ON F.tp_key     = A.tp_key
        WHERE 1 = 1
            AND A.common_tp_nm = N'계약'
            AND (@AsOfDate IS NULL OR CAL.[Date] <= @AsOfDate)
            AND (@YearPad IS NULL OR @YearPad LIKE N'%,' + CAST(CAL.[Year] AS NVARCHAR(10)) + N',%')
            AND (U.facade_sc_yn IS NULL OR U.facade_sc_yn NOT LIKE N'%' + @ExclFacadeScYn + N'%')
            AND (U.name IS NULL OR (U.name NOT LIKE N'%' + @ExclScName1 + N'%'
                                AND U.name NOT LIKE N'%' + @ExclScName2 + N'%'))
            AND (U.user_id IS NULL OR @ExclUserIdsPad NOT LIKE N'%,' + LTRIM(RTRIM(U.user_id)) + N',%')
            AND (@BrandPad     IS NULL OR @BrandPad     LIKE N'%,' + LTRIM(RTRIM(U.BRAND))      + N',%')
            AND (@DealerNmPad  IS NULL OR @DealerNmPad  LIKE N'%,' + LTRIM(RTRIM(D.dealer_nm))  + N',%')
            AND (@GroupNamePad IS NULL OR @GroupNamePad LIKE N'%,' + LTRIM(RTRIM(U.group_name)) + N',%')
            AND (@DeptNmPad    IS NULL OR @DeptNmPad    LIKE N'%,' + LTRIM(RTRIM(U.dept_nm))    + N',%')
            AND (@ActiveYnPad  IS NULL OR @ActiveYnPad  LIKE N'%,' + LTRIM(RTRIM(U.active_yn))  + N',%')
        GROUP BY CAL.[Year], CAL.MonthAbbr
            , ISNULL(U.BRAND, N''), ISNULL(D.dealer_nm, N''), ISNULL(U.group_name, N'')
            , ISNULL(U.dept_nm, N''), ISNULL(U.active_yn, N'')
    )
    , TGTY AS (
        /* 목표 MTD: 동일 월의 계약 목표만 사용 */
        SELECT
              MA.yr, MA.MonthAbbr
            , DM.brand_k, DM.dealer_k, DM.grp_k, DM.dept_k, DM.act_k
            , ISNULL(T.mval, 0) AS tgt_mtd
        FROM MonthAnchor MA
        JOIN (SELECT DISTINCT yr, brand_k, dealer_k, grp_k, dept_k, act_k FROM TGTM) DM
            ON MA.yr = DM.yr
        LEFT JOIN TGTM T
            ON  T.yr = MA.yr AND T.MonthAbbr = MA.MonthAbbr
            AND T.brand_k = DM.brand_k AND T.dealer_k = DM.dealer_k
            AND T.grp_k = DM.grp_k AND T.dept_k = DM.dept_k AND T.act_k = DM.act_k
    )
    SELECT
          ISNULL(CN.yr, TG.yr)             AS N'연도'
        , ISNULL(CN.MonthAbbr, TG.MonthAbbr) AS MonthAbbr
        , ISNULL(CN.brand_k, TG.brand_k)   AS N'브랜드'
        , ISNULL(CN.dealer_k, TG.dealer_k) AS N'딜러'
        , ISNULL(CN.grp_k, TG.grp_k)       AS N'전시장'
        , ISNULL(CN.dept_k, TG.dept_k)     AS N'팀'
        , ISNULL(CN.act_k, TG.act_k)       AS N'재직여부'
        , CN.model_nm                      AS N'모델'
        , CN.variant_nm                    AS N'차종'
        , CN.my_cd                         AS N'연식'
        , CN.sfx_cd                        AS N'SFX'
        , ISNULL(CN.ac_val, 0)             AS N'실적'
        , ISNULL(CN.cancel_val, 0)         AS N'취소'
        , ISNULL(TG.tgt_mtd, 0)            AS N'타겟'
        , CASE WHEN ISNULL(TG.tgt_mtd, 0) = 0 THEN 0
               ELSE CAST(ISNULL(CN.total_val, 0) AS FLOAT) / TG.tgt_mtd
          END                              AS N'달성률'
    FROM CN
    FULL OUTER JOIN TGTY TG
        ON  CN.yr = TG.yr AND CN.MonthAbbr = TG.MonthAbbr
        AND CN.brand_k = TG.brand_k AND CN.dealer_k = TG.dealer_k
        AND CN.grp_k = TG.grp_k AND CN.dept_k = TG.dept_k AND CN.act_k = TG.act_k
    ORDER BY 1, 2, 3, 4, 5, 6, 8, 9
;
END
ELSE
BEGIN
    /* ---------- 분기 B: SC 열 포함 ('ALL' = 전체 SC) ---------- */
    ;WITH MonthAnchor AS (
        SELECT
              CAL.[Year]                                      AS yr
            , CAL.MonthAbbr
            , MIN(CAL.[Date])                                 AS month_start
            , CASE WHEN @AsOfDate IS NOT NULL AND EOMONTH(MAX(CAL.[Date])) > @AsOfDate
                   THEN @AsOfDate
                   ELSE EOMONTH(MAX(CAL.[Date]))
              END                                             AS month_end
        FROM ktws.DIM_CALENDAR_KTWS CAL
        WHERE (@YearPad IS NULL OR @YearPad LIKE N'%,' + CAST(CAL.[Year] AS NVARCHAR(10)) + N',%')
          AND (@AsOfDate IS NULL OR CAL.[Date] <= @AsOfDate OR MONTH(CAL.[Date]) = MONTH(@AsOfDate))
        GROUP BY CAL.[Year], CAL.MonthAbbr
    )
    , CN AS (
        SELECT
              A.yr, A.MonthAbbr
            , ISNULL(U.BRAND, N'')      AS brand_k
            , ISNULL(D.dealer_nm, N'')  AS dealer_k
            , ISNULL(U.group_name, N'') AS grp_k
            , ISNULL(U.dept_nm, N'')    AS dept_k
            , ISNULL(U.active_yn, N'')  AS act_k
            , ISNULL(U.name, N'')       AS sc_k
            , M.model_nm, V.variant_nm, S.my_cd, S.sfx_cd
            , SUM(CASE WHEN F.cancel_dt IS NULL
                       THEN F.cnt ELSE 0 END)                       AS ac_val
            , SUM(CASE WHEN F.cancel_dt IS NOT NULL
                       THEN F.cnt ELSE 0 END)                       AS cancel_val
            , SUM(F.cnt)                                            AS total_val
        FROM MonthAnchor A
        JOIN ktws.FCT_CONTRACT_KTWS        F   ON F.contract_dt >= A.month_start
                                              AND F.contract_dt <= A.month_end
        INNER JOIN ktws.DIM_MNG_USER        U   ON F.cn_sc_key    = U.sc_key
        INNER JOIN ktws.DIM_MNG_DEALER      D   ON U.dealer_key   = D.dealer_key
        LEFT JOIN ktws.DIM_VEHIC_SPEC      S   ON F.cn_vehic_key = S.spec_key
        LEFT JOIN ktws.DIM_VEHIC_SPEC_VAR  V   ON S.var_key      = V.var_key
        LEFT JOIN ktws.DIM_VEHIC_SPEC_MDL  M   ON V.model_key    = M.mdl_key
        WHERE 1 = 1
            AND (U.facade_sc_yn IS NULL OR U.facade_sc_yn NOT LIKE N'%' + @ExclFacadeScYn + N'%')
            AND (U.name IS NULL OR (U.name NOT LIKE N'%' + @ExclScName1 + N'%'
                                AND U.name NOT LIKE N'%' + @ExclScName2 + N'%'))
            AND (U.user_id IS NULL OR @ExclUserIdsPad NOT LIKE N'%,' + LTRIM(RTRIM(U.user_id)) + N',%')
            AND (@ScName = N'ALL' OR @ScNamePad LIKE N'%,' + LTRIM(RTRIM(U.name)) + N',%')
            AND (@BrandPad     IS NULL OR @BrandPad     LIKE N'%,' + LTRIM(RTRIM(U.BRAND))      + N',%')
            AND (@DealerNmPad  IS NULL OR @DealerNmPad  LIKE N'%,' + LTRIM(RTRIM(D.dealer_nm))  + N',%')
            AND (@GroupNamePad IS NULL OR @GroupNamePad LIKE N'%,' + LTRIM(RTRIM(U.group_name)) + N',%')
            AND (@DeptNmPad    IS NULL OR @DeptNmPad    LIKE N'%,' + LTRIM(RTRIM(U.dept_nm))    + N',%')
            AND (@ActiveYnPad  IS NULL OR @ActiveYnPad  LIKE N'%,' + LTRIM(RTRIM(U.active_yn))  + N',%')
            AND (@ModelNmPad   IS NULL OR @ModelNmPad   LIKE N'%,' + LTRIM(RTRIM(M.model_nm))   + N',%')
            AND (@VariantNmPad IS NULL OR @VariantNmPad LIKE N'%,' + LTRIM(RTRIM(V.variant_nm)) + N',%')
            AND (@MyCdPad      IS NULL OR @MyCdPad      LIKE N'%,' + LTRIM(RTRIM(S.my_cd))      + N',%')
            AND (@SfxCdPad     IS NULL OR @SfxCdPad     LIKE N'%,' + LTRIM(RTRIM(S.sfx_cd))     + N',%')
        GROUP BY A.yr, A.MonthAbbr
            , ISNULL(U.BRAND, N''), ISNULL(D.dealer_nm, N''), ISNULL(U.group_name, N'')
            , ISNULL(U.dept_nm, N''), ISNULL(U.active_yn, N''), ISNULL(U.name, N'')
            , M.model_nm, V.variant_nm, S.my_cd, S.sfx_cd
    )
    , TGTM AS (
        SELECT
              CAL.[Year]                AS yr
            , CAL.MonthAbbr
            , ISNULL(U.BRAND, N'')      AS brand_k
            , ISNULL(D.dealer_nm, N'')  AS dealer_k
            , ISNULL(U.group_name, N'') AS grp_k
            , ISNULL(U.dept_nm, N'')    AS dept_k
            , ISNULL(U.active_yn, N'')  AS act_k
            , ISNULL(U.name, N'')       AS sc_k
            , SUM(F.target_cnt)         AS mval
        FROM ktws.FCT_CRM_TARGET_M      F
        JOIN ktws.DIM_CALENDAR_KTWS     CAL ON F.monthly_dt = CAL.[Date]
        INNER JOIN ktws.DIM_MNG_USER     U   ON F.sc_key     = U.sc_key
        INNER JOIN ktws.DIM_MNG_DEALER   D   ON U.dealer_key = D.dealer_key
        JOIN ktws.DIM_CRM_ACT_TYPE      A   ON F.tp_key     = A.tp_key
        WHERE 1 = 1
            AND A.common_tp_nm = N'계약'
            AND (@AsOfDate IS NULL OR CAL.[Date] <= @AsOfDate)
            AND (@YearPad IS NULL OR @YearPad LIKE N'%,' + CAST(CAL.[Year] AS NVARCHAR(10)) + N',%')
            AND (U.facade_sc_yn IS NULL OR U.facade_sc_yn NOT LIKE N'%' + @ExclFacadeScYn + N'%')
            AND (U.name IS NULL OR (U.name NOT LIKE N'%' + @ExclScName1 + N'%'
                                AND U.name NOT LIKE N'%' + @ExclScName2 + N'%'))
            AND (U.user_id IS NULL OR @ExclUserIdsPad NOT LIKE N'%,' + LTRIM(RTRIM(U.user_id)) + N',%')
            AND (@ScName = N'ALL' OR @ScNamePad LIKE N'%,' + LTRIM(RTRIM(U.name)) + N',%')
            AND (@BrandPad     IS NULL OR @BrandPad     LIKE N'%,' + LTRIM(RTRIM(U.BRAND))      + N',%')
            AND (@DealerNmPad  IS NULL OR @DealerNmPad  LIKE N'%,' + LTRIM(RTRIM(D.dealer_nm))  + N',%')
            AND (@GroupNamePad IS NULL OR @GroupNamePad LIKE N'%,' + LTRIM(RTRIM(U.group_name)) + N',%')
            AND (@DeptNmPad    IS NULL OR @DeptNmPad    LIKE N'%,' + LTRIM(RTRIM(U.dept_nm))    + N',%')
            AND (@ActiveYnPad  IS NULL OR @ActiveYnPad  LIKE N'%,' + LTRIM(RTRIM(U.active_yn))  + N',%')
        GROUP BY CAL.[Year], CAL.MonthAbbr
            , ISNULL(U.BRAND, N''), ISNULL(D.dealer_nm, N''), ISNULL(U.group_name, N'')
            , ISNULL(U.dept_nm, N''), ISNULL(U.active_yn, N''), ISNULL(U.name, N'')
    )
    , TGTY AS (
        SELECT
              MA.yr, MA.MonthAbbr
            , DM.brand_k, DM.dealer_k, DM.grp_k, DM.dept_k, DM.act_k, DM.sc_k
            , ISNULL(T.mval, 0) AS tgt_mtd
        FROM MonthAnchor MA
        JOIN (SELECT DISTINCT yr, brand_k, dealer_k, grp_k, dept_k, act_k, sc_k FROM TGTM) DM
            ON MA.yr = DM.yr
        LEFT JOIN TGTM T
            ON  T.yr = MA.yr AND T.MonthAbbr = MA.MonthAbbr
            AND T.brand_k = DM.brand_k AND T.dealer_k = DM.dealer_k
            AND T.grp_k = DM.grp_k AND T.dept_k = DM.dept_k
            AND T.act_k = DM.act_k AND T.sc_k = DM.sc_k
    )
    SELECT
          ISNULL(CN.yr, TG.yr)               AS N'연도'
        , ISNULL(CN.MonthAbbr, TG.MonthAbbr) AS MonthAbbr
        , ISNULL(CN.brand_k, TG.brand_k)     AS N'브랜드'
        , ISNULL(CN.dealer_k, TG.dealer_k)   AS N'딜러'
        , ISNULL(CN.grp_k, TG.grp_k)         AS N'전시장'
        , ISNULL(CN.dept_k, TG.dept_k)       AS N'팀'
        , ISNULL(CN.act_k, TG.act_k)         AS N'재직여부'
        , ISNULL(CN.sc_k, TG.sc_k)           AS N'SC'
        , CN.model_nm                        AS N'모델'
        , CN.variant_nm                      AS N'차종'
        , CN.my_cd                           AS N'연식'
        , CN.sfx_cd                          AS N'SFX'
        , ISNULL(CN.ac_val, 0)               AS N'실적'
        , ISNULL(CN.cancel_val, 0)           AS N'취소'
        , ISNULL(TG.tgt_mtd, 0)              AS N'타겟'
        , CASE WHEN ISNULL(TG.tgt_mtd, 0) = 0 THEN 0
               ELSE CAST(ISNULL(CN.total_val, 0) AS FLOAT) / TG.tgt_mtd
          END                                AS N'달성률'
    FROM CN
    FULL OUTER JOIN TGTY TG
        ON  CN.yr = TG.yr AND CN.MonthAbbr = TG.MonthAbbr
        AND CN.brand_k = TG.brand_k AND CN.dealer_k = TG.dealer_k
        AND CN.grp_k = TG.grp_k AND CN.dept_k = TG.dept_k
        AND CN.act_k = TG.act_k AND CN.sc_k = TG.sc_k
    ORDER BY 1, 2, 3, 4, 5, 6, 7, 8, 9;
END