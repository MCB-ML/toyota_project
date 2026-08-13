/* ── 파라미터 ──
   원본에서 파라미터 DECLARE 13개를 제거했다. mssql 드라이버가
   request.input()으로 바인딩해 주입한다(문자열 치환 금지).
     @Year @MonthNumber @Brand @DealerNm @GroupName @DeptNm @ActiveYn @ScName @ModelNm @VariantNm @MyCd @SfxCd @AsOfDate

   콤마 패딩 변수 12개에 CASE NULL 가드를 넣었다 — Fabric에서
   ',' + NULL + ',' 가 NULL이 아니라 ',,' 가 되어 "NULL=전체"가
   "NULL=결과 없음"으로 뒤집히기 때문이다(라이브로 확인된 문제).
   그 밖의 계산 로직과 페이지 고정 상수는 원문 그대로다. */

/* ============================================
   1. 슬라이서 변수 (NULL = 전체 선택, 다중 값은 콤마 구분·공백 없이, N'...' 사용)
      ※ @ScName 특수 규칙:
         NULL  → SC 열 미표시 (전체 집계)
         'ALL' → SC 열 표시 + 전체 SC
         값     → SC 열 표시 + 해당 SC만
      ※ @MonthNumber: 선택한 월만 표시
         예: '2' → 2월 행만 출력 (값은 1~2월 YTD 누적)
             '2,5' → 2월, 5월 행 출력
      ※ 콤마 구분값에 공백 넣지 말 것 (예: N'값1,값2' O / N'값1, 값2' X)
   ============================================ */

/* ============================================
   2. 페이지 필터 변수
   ============================================ */
DECLARE @ExclFacadeScYn NVARCHAR(50)  = N'창구SC';
DECLARE @ExclScName1    NVARCHAR(50)  = N'고객지원팀';
DECLARE @ExclScName2    NVARCHAR(50)  = N'TOYOTA YM';
DECLARE @ExclUserIds    NVARCHAR(500) = NEXCLUDED_USER_ID_1,EXCLUDED_USER_ID_2;

/* ============================================
   3. 기준일 (NULL 이면 각 월 말)
   ============================================ */

/* ============================================
   4. LIKE 매칭용 패딩 문자열 (TVF 제거용, 8623 방지)
   ============================================ */
DECLARE @pYear    NVARCHAR(210) = CASE WHEN @Year IS NULL THEN NULL ELSE ',' + @Year        + ',' END;
DECLARE @pMonth   NVARCHAR(210) = CASE WHEN @MonthNumber IS NULL THEN NULL ELSE ',' + @MonthNumber + ',' END;
DECLARE @pBrand   NVARCHAR(210) = CASE WHEN @Brand IS NULL THEN NULL ELSE ',' + @Brand       + ',' END;
DECLARE @pDealer  NVARCHAR(510) = CASE WHEN @DealerNm IS NULL THEN NULL ELSE ',' + @DealerNm    + ',' END;
DECLARE @pGroup   NVARCHAR(510) = CASE WHEN @GroupName IS NULL THEN NULL ELSE ',' + @GroupName   + ',' END;
DECLARE @pDept    NVARCHAR(510) = CASE WHEN @DeptNm IS NULL THEN NULL ELSE ',' + @DeptNm      + ',' END;
DECLARE @pActive  NVARCHAR(60)  = CASE WHEN @ActiveYn IS NULL THEN NULL ELSE ',' + @ActiveYn    + ',' END;
DECLARE @pSc      NVARCHAR(510) = CASE WHEN @ScName IS NULL THEN NULL ELSE ',' + @ScName      + ',' END;
DECLARE @pModel   NVARCHAR(510) = CASE WHEN @ModelNm IS NULL THEN NULL ELSE ',' + @ModelNm     + ',' END;
DECLARE @pVariant NVARCHAR(510) = CASE WHEN @VariantNm IS NULL THEN NULL ELSE ',' + @VariantNm   + ',' END;
DECLARE @pMyCd    NVARCHAR(210) = CASE WHEN @MyCd IS NULL THEN NULL ELSE ',' + @MyCd        + ',' END;
DECLARE @pSfxCd   NVARCHAR(210) = CASE WHEN @SfxCd IS NULL THEN NULL ELSE ',' + @SfxCd       + ',' END;
DECLARE @pExUsers NVARCHAR(510) = ',' + @ExclUserIds + ',';

/* ============================================
   연도 | 월 | 브랜드 | 딜러 | 전시장 | 팀 | 재직여부 | (SC)
   | 모델 | 차종 | 연식 | SFX | GRADE | 출고연누적
   ※ 선택한 월 행만 출력, 각 월 행 = 연초~해당 월 말 YTD 누적
   ============================================ */
IF @ScName IS NULL
BEGIN
    /* ---------- 분기 A: SC 열 없음 ---------- */
    ;WITH MonthAnchor AS (
        SELECT
              CAL.[Year]                                        AS yr
            , CAL.MonthNumber                                   AS mn
            , DATEFROMPARTS(CAL.[Year], 1, 1)                   AS year_start
            , CASE WHEN @AsOfDate IS NOT NULL AND MAX(CAL.[Date]) > @AsOfDate
                   THEN @AsOfDate
                   ELSE MAX(CAL.[Date])
              END                                               AS month_end
            , CASE WHEN @AsOfDate IS NOT NULL AND MAX(CAL.[Date]) > @AsOfDate
                   THEN EOMONTH(@AsOfDate, -1)
                   ELSE EOMONTH(MAX(CAL.[Date]), -1)
              END                                               AS prev_month_end
        FROM ktws.DIM_CALENDAR_KTWS CAL
        WHERE (@Year        IS NULL OR @pYear  LIKE N'%,' + CAST(CAL.[Year] AS NVARCHAR(10))       + N',%')
          AND (@MonthNumber IS NULL OR @pMonth LIKE N'%,' + CAST(CAL.MonthNumber AS NVARCHAR(10))  + N',%')   -- ★ 선택한 월만 (NULL = 전체)
          AND (@AsOfDate IS NULL OR CAL.[Date] <= @AsOfDate)
        GROUP BY CAL.[Year], CAL.MonthNumber
    )
    SELECT
          A.yr                                AS N'연도'
        , A.mn                                AS N'월'
        , U.BRAND                             AS N'브랜드'
        , D.dealer_nm                         AS N'딜러'
        , U.group_name                        AS N'전시장'
        , U.dept_nm                           AS N'팀'
        , U.active_yn                         AS N'재직여부'
        , M.model_nm                          AS N'모델'
        , V.variant_nm                        AS N'차종'
        , S.my_cd                             AS N'연식'
        , S.sfx_cd                            AS N'SFX'
        , S.grade                             AS N'GRADE'
        , COUNT(DISTINCT F.dlr_contract_no)   AS N'출고연누적'
    FROM MonthAnchor A
    JOIN ktws.FCT_CONTRACT_KTWS        F   ON F.last_retail_sales_dt >= A.year_start
                                          AND F.last_retail_sales_dt <= A.month_end
    JOIN ktws.DIM_VEHIC_SPEC           S   ON F.cn_vehic_key = S.spec_key
    LEFT JOIN ktws.DIM_MNG_USER        U   ON F.cn_sc_key    = U.sc_key
    LEFT JOIN ktws.DIM_MNG_DEALER      D   ON U.dealer_key   = D.dealer_key
    LEFT JOIN ktws.DIM_VEHIC_SPEC_VAR  V   ON S.var_key      = V.var_key
    LEFT JOIN ktws.DIM_VEHIC_SPEC_MDL  M   ON V.model_key    = M.mdl_key
    WHERE 1 = 1
        AND (F.cancel_dt IS NULL OR F.cancel_dt > A.prev_month_end)

        /* ---- 페이지 필터 (DIM_MNG_USER, NULL-safe) ---- */
        AND (U.facade_sc_yn IS NULL OR U.facade_sc_yn NOT LIKE N'%' + @ExclFacadeScYn + N'%')
        AND (U.name IS NULL OR (U.name NOT LIKE N'%' + @ExclScName1 + N'%'
                            AND U.name NOT LIKE N'%' + @ExclScName2 + N'%'))
        AND (U.user_id IS NULL OR @pExUsers NOT LIKE N'%,' + LTRIM(RTRIM(U.user_id)) + N',%')

        /* ---- 슬라이서 필터 (NULL = 전체) ---- */
        AND (@Brand     IS NULL OR @pBrand   LIKE N'%,' + LTRIM(RTRIM(U.BRAND))      + N',%')
        AND (@DealerNm  IS NULL OR @pDealer  LIKE N'%,' + LTRIM(RTRIM(D.dealer_nm))  + N',%')
        AND (@GroupName IS NULL OR @pGroup   LIKE N'%,' + LTRIM(RTRIM(U.group_name)) + N',%')
        AND (@DeptNm    IS NULL OR @pDept    LIKE N'%,' + LTRIM(RTRIM(U.dept_nm))    + N',%')
        AND (@ActiveYn  IS NULL OR @pActive  LIKE N'%,' + LTRIM(RTRIM(U.active_yn))  + N',%')
        AND (@ModelNm   IS NULL OR @pModel   LIKE N'%,' + LTRIM(RTRIM(M.model_nm))   + N',%')
        AND (@VariantNm IS NULL OR @pVariant LIKE N'%,' + LTRIM(RTRIM(V.variant_nm)) + N',%')
        AND (@MyCd      IS NULL OR @pMyCd    LIKE N'%,' + LTRIM(RTRIM(S.my_cd))      + N',%')
        AND (@SfxCd     IS NULL OR @pSfxCd   LIKE N'%,' + LTRIM(RTRIM(S.sfx_cd))     + N',%')
    GROUP BY
          A.yr, A.mn
        , U.BRAND, D.dealer_nm, U.group_name, U.dept_nm, U.active_yn
        , M.model_nm, V.variant_nm, S.my_cd, S.sfx_cd, S.grade
    ORDER BY
          A.yr, A.mn
        , COUNT(DISTINCT F.dlr_contract_no) DESC;
END
ELSE
BEGIN
    /* ---------- 분기 B: SC 열 포함 ('ALL' = 전체 SC) ---------- */
    ;WITH MonthAnchor AS (
        SELECT
              CAL.[Year]                                        AS yr
            , CAL.MonthNumber                                   AS mn
            , DATEFROMPARTS(CAL.[Year], 1, 1)                   AS year_start
            , CASE WHEN @AsOfDate IS NOT NULL AND MAX(CAL.[Date]) > @AsOfDate
                   THEN @AsOfDate
                   ELSE MAX(CAL.[Date])
              END                                               AS month_end
            , CASE WHEN @AsOfDate IS NOT NULL AND MAX(CAL.[Date]) > @AsOfDate
                   THEN EOMONTH(@AsOfDate, -1)
                   ELSE EOMONTH(MAX(CAL.[Date]), -1)
              END                                               AS prev_month_end
        FROM ktws.DIM_CALENDAR_KTWS CAL
        WHERE (@Year        IS NULL OR @pYear  LIKE N'%,' + CAST(CAL.[Year] AS NVARCHAR(10))       + N',%')
          AND (@MonthNumber IS NULL OR @pMonth LIKE N'%,' + CAST(CAL.MonthNumber AS NVARCHAR(10))  + N',%')   -- ★ 선택한 월만 (NULL = 전체)
          AND (@AsOfDate IS NULL OR CAL.[Date] <= @AsOfDate)
        GROUP BY CAL.[Year], CAL.MonthNumber
    )
    SELECT
          A.yr                                AS N'연도'
        , A.mn                                AS N'월'
        , U.BRAND                             AS N'브랜드'
        , D.dealer_nm                         AS N'딜러'
        , U.group_name                        AS N'전시장'
        , U.dept_nm                           AS N'팀'
        , U.active_yn                         AS N'재직여부'
        , U.name                              AS N'SC'
        , M.model_nm                          AS N'모델'
        , V.variant_nm                        AS N'차종'
        , S.my_cd                             AS N'연식'
        , S.sfx_cd                            AS N'SFX'
        , S.grade                             AS N'GRADE'
        , COUNT(DISTINCT F.dlr_contract_no)   AS N'출고연누적'
    FROM MonthAnchor A
    JOIN ktws.FCT_CONTRACT_KTWS        F   ON F.last_retail_sales_dt >= A.year_start
                                          AND F.last_retail_sales_dt <= A.month_end
    JOIN ktws.DIM_VEHIC_SPEC           S   ON F.cn_vehic_key = S.spec_key
    LEFT JOIN ktws.DIM_MNG_USER        U   ON F.cn_sc_key    = U.sc_key
    LEFT JOIN ktws.DIM_MNG_DEALER      D   ON U.dealer_key   = D.dealer_key
    LEFT JOIN ktws.DIM_VEHIC_SPEC_VAR  V   ON S.var_key      = V.var_key
    LEFT JOIN ktws.DIM_VEHIC_SPEC_MDL  M   ON V.model_key    = M.mdl_key
    WHERE 1 = 1
        AND (F.cancel_dt IS NULL OR F.cancel_dt > A.prev_month_end)

        /* ---- 페이지 필터 (DIM_MNG_USER, NULL-safe) ---- */
        AND (U.facade_sc_yn IS NULL OR U.facade_sc_yn NOT LIKE N'%' + @ExclFacadeScYn + N'%')
        AND (U.name IS NULL OR (U.name NOT LIKE N'%' + @ExclScName1 + N'%'
                            AND U.name NOT LIKE N'%' + @ExclScName2 + N'%'))
        AND (U.user_id IS NULL OR @pExUsers NOT LIKE N'%,' + LTRIM(RTRIM(U.user_id)) + N',%')

        /* ---- SC 필터 ('ALL' = 전체) ---- */
        AND (@ScName = N'ALL' OR @pSc LIKE N'%,' + LTRIM(RTRIM(U.name)) + N',%')

        /* ---- 슬라이서 필터 (NULL = 전체) ---- */
        AND (@Brand     IS NULL OR @pBrand   LIKE N'%,' + LTRIM(RTRIM(U.BRAND))      + N',%')
        AND (@DealerNm  IS NULL OR @pDealer  LIKE N'%,' + LTRIM(RTRIM(D.dealer_nm))  + N',%')
        AND (@GroupName IS NULL OR @pGroup   LIKE N'%,' + LTRIM(RTRIM(U.group_name)) + N',%')
        AND (@DeptNm    IS NULL OR @pDept    LIKE N'%,' + LTRIM(RTRIM(U.dept_nm))    + N',%')
        AND (@ActiveYn  IS NULL OR @pActive  LIKE N'%,' + LTRIM(RTRIM(U.active_yn))  + N',%')
        AND (@ModelNm   IS NULL OR @pModel   LIKE N'%,' + LTRIM(RTRIM(M.model_nm))   + N',%')
        AND (@VariantNm IS NULL OR @pVariant LIKE N'%,' + LTRIM(RTRIM(V.variant_nm)) + N',%')
        AND (@MyCd      IS NULL OR @pMyCd    LIKE N'%,' + LTRIM(RTRIM(S.my_cd))      + N',%')
        AND (@SfxCd     IS NULL OR @pSfxCd   LIKE N'%,' + LTRIM(RTRIM(S.sfx_cd))     + N',%')
    GROUP BY
          A.yr, A.mn
        , U.BRAND, D.dealer_nm, U.group_name, U.dept_nm, U.active_yn, U.name
        , M.model_nm, V.variant_nm, S.my_cd, S.sfx_cd, S.grade
    ORDER BY
          A.yr, A.mn
        , COUNT(DISTINCT F.dlr_contract_no) DESC;
END