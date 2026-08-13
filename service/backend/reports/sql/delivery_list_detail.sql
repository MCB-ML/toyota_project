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
   3. 기준일 (NULL 이면 달력/슬라이서 범위의 마지막 날짜)
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
   판매 상세 목록 (연간 = sales_ytd 기준)
   연도 | 브랜드 | 딜러 | 전시장 | 팀 | 재직여부 | (SC) | 차종 | 연식
   | 계약번호 | 고객명 | 계약일자 | 출고일자 | 리드타임(일)
   | Model | SFX | 재구매 여부 | 자사금융 여부 | 지불유형 | sales_flag
   ============================================ */
IF @ScName IS NULL
BEGIN
    /* ---------- 분기 A: SC 열 없음 ---------- */
    ;WITH YearAnchor AS (
        SELECT
              CAL.[Year]                                        AS yr
            , DATEFROMPARTS(CAL.[Year], 1, 1)                   AS year_start
            , CASE WHEN @AsOfDate IS NOT NULL AND MAX(CAL.[Date]) > @AsOfDate
                   THEN @AsOfDate
                   ELSE MAX(CAL.[Date])
              END                                               AS period_end
            , CASE WHEN @AsOfDate IS NOT NULL AND MAX(CAL.[Date]) > @AsOfDate
                   THEN EOMONTH(@AsOfDate, -1)
                   ELSE EOMONTH(MAX(CAL.[Date]), -1)
              END                                               AS prev_month_end
        FROM ktws.DIM_CALENDAR_KTWS CAL
        WHERE (@YearPad IS NULL OR @YearPad LIKE N'%,' + CAST(CAL.[Year] AS NVARCHAR(10)) + N',%')
        GROUP BY CAL.[Year]
    )
    SELECT
          CAL.[Year]               AS N'연도'
        , U.BRAND                  AS N'브랜드'
        , D.dealer_nm              AS N'딜러'
        , U.group_name             AS N'전시장'
        , U.dept_nm                AS N'팀'
        , U.active_yn              AS N'재직여부'
        , V.variant_nm             AS N'차종'
        , S.my_cd                  AS N'연식'
        , F.dlr_contract_no        AS N'계약번호'
        , F.cust_nm                AS N'고객명'
        , F.contract_dt            AS N'계약일자'
        , F.last_retail_sales_dt   AS N'출고일자'
        , F.lead_time              AS N'리드타임(일)'
        , S.model_nm               AS N'Model'
        , S.sfx_cd                 AS N'SFX'
        , R.repurc_grp1            AS N'재구매 여부'
        , F.own_pay_flag           AS N'자사금융 여부'
        , F.pay_type               AS N'지불유형'
        , 1                        AS [sales_flag]   -- 계약 단위 DISTINCTCOUNT = 1
    FROM ktws.FCT_CONTRACT_KTWS        F
    JOIN ktws.DIM_CALENDAR_KTWS        CAL ON F.last_retail_sales_dt = CAL.[Date]
    JOIN YearAnchor                    A   ON CAL.[Year]       = A.yr
    LEFT JOIN ktws.DIM_MNG_USER        U   ON F.cn_sc_key      = U.sc_key
    LEFT JOIN ktws.DIM_MNG_DEALER      D   ON U.dealer_key     = D.dealer_key
    LEFT JOIN ktws.DIM_VEHIC_SPEC      S   ON F.cn_vehic_key   = S.spec_key
    LEFT JOIN ktws.DIM_VEHIC_SPEC_VAR  V   ON S.var_key        = V.var_key
    LEFT JOIN ktws.DIM_VEHIC_SPEC_MDL  M   ON V.model_key      = M.mdl_key
    LEFT JOIN ktws.DIM_REPURC_SALES_TYPE R ON F.sales_tp_key   = R.sales_tp_key
    WHERE 1 = 1
        /* ---- 출고일 YTD 범위: 연초 ~ 기준시점 ---- */
        AND F.last_retail_sales_dt >= A.year_start
        AND F.last_retail_sales_dt <= A.period_end

        /* ---- 기준시점 전월말 이후 취소 또는 미취소 ---- */
        AND (F.cancel_dt IS NULL OR F.cancel_dt > A.prev_month_end)

        /* ---- 페이지 필터 (DIM_MNG_USER, NULL-safe) ---- */
        AND (U.facade_sc_yn IS NULL OR U.facade_sc_yn NOT LIKE N'%' + @ExclFacadeScYn + N'%')
        AND (U.name IS NULL OR (U.name NOT LIKE N'%' + @ExclScName1 + N'%'
                            AND U.name NOT LIKE N'%' + @ExclScName2 + N'%'))
        AND (U.user_id IS NULL OR @ExclUserIdsPad NOT LIKE N'%,' + LTRIM(RTRIM(U.user_id)) + N',%')

        /* ---- 슬라이서 필터 (NULL = 전체, LIKE 패딩) ---- */
        AND (@BrandPad     IS NULL OR @BrandPad     LIKE N'%,' + LTRIM(RTRIM(U.BRAND))      + N',%')
        AND (@DealerNmPad  IS NULL OR @DealerNmPad  LIKE N'%,' + LTRIM(RTRIM(D.dealer_nm))  + N',%')
        AND (@GroupNamePad IS NULL OR @GroupNamePad LIKE N'%,' + LTRIM(RTRIM(U.group_name)) + N',%')
        AND (@DeptNmPad    IS NULL OR @DeptNmPad    LIKE N'%,' + LTRIM(RTRIM(U.dept_nm))    + N',%')
        AND (@ActiveYnPad  IS NULL OR @ActiveYnPad  LIKE N'%,' + LTRIM(RTRIM(U.active_yn))  + N',%')
        AND (@ModelNmPad   IS NULL OR @ModelNmPad   LIKE N'%,' + LTRIM(RTRIM(M.model_nm))   + N',%')
        AND (@VariantNmPad IS NULL OR @VariantNmPad LIKE N'%,' + LTRIM(RTRIM(V.variant_nm)) + N',%')
        AND (@MyCdPad      IS NULL OR @MyCdPad      LIKE N'%,' + LTRIM(RTRIM(S.my_cd))      + N',%')
        AND (@SfxCdPad     IS NULL OR @SfxCdPad     LIKE N'%,' + LTRIM(RTRIM(S.sfx_cd))     + N',%')
    ORDER BY
          CAL.[Year]
        , F.dlr_contract_no;
END
ELSE
BEGIN
    /* ---------- 분기 B: SC 열 포함 ('ALL' = 전체 SC) ---------- */
    ;WITH YearAnchor AS (
        SELECT
              CAL.[Year]                                        AS yr
            , DATEFROMPARTS(CAL.[Year], 1, 1)                   AS year_start
            , CASE WHEN @AsOfDate IS NOT NULL AND MAX(CAL.[Date]) > @AsOfDate
                   THEN @AsOfDate
                   ELSE MAX(CAL.[Date])
              END                                               AS period_end
            , CASE WHEN @AsOfDate IS NOT NULL AND MAX(CAL.[Date]) > @AsOfDate
                   THEN EOMONTH(@AsOfDate, -1)
                   ELSE EOMONTH(MAX(CAL.[Date]), -1)
              END                                               AS prev_month_end
        FROM ktws.DIM_CALENDAR_KTWS CAL
        WHERE (@YearPad IS NULL OR @YearPad LIKE N'%,' + CAST(CAL.[Year] AS NVARCHAR(10)) + N',%')
        GROUP BY CAL.[Year]
    )
    SELECT
          CAL.[Year]               AS N'연도'
        , U.BRAND                  AS N'브랜드'
        , D.dealer_nm              AS N'딜러'
        , U.group_name             AS N'전시장'
        , U.dept_nm                AS N'팀'
        , U.active_yn              AS N'재직여부'
        , U.name                   AS N'SC'
        , V.variant_nm             AS N'차종'
        , S.my_cd                  AS N'연식'
        , F.dlr_contract_no        AS N'계약번호'
        , F.cust_nm                AS N'고객명'
        , F.contract_dt            AS N'계약일자'
        , F.last_retail_sales_dt   AS N'출고일자'
        , F.lead_time              AS N'리드타임(일)'
        , S.model_nm               AS N'Model'
        , S.sfx_cd                 AS N'SFX'
        , R.repurc_grp1            AS N'재구매 여부'
        , F.own_pay_flag           AS N'자사금융 여부'
        , F.pay_type               AS N'지불유형'
        , 1                        AS [sales_flag]   -- 계약 단위 DISTINCTCOUNT = 1
    FROM ktws.FCT_CONTRACT_KTWS        F
    JOIN ktws.DIM_CALENDAR_KTWS        CAL ON F.last_retail_sales_dt = CAL.[Date]
    JOIN YearAnchor                    A   ON CAL.[Year]       = A.yr
    LEFT JOIN ktws.DIM_MNG_USER        U   ON F.cn_sc_key      = U.sc_key
    LEFT JOIN ktws.DIM_MNG_DEALER      D   ON U.dealer_key     = D.dealer_key
    LEFT JOIN ktws.DIM_VEHIC_SPEC      S   ON F.cn_vehic_key   = S.spec_key
    LEFT JOIN ktws.DIM_VEHIC_SPEC_VAR  V   ON S.var_key        = V.var_key
    LEFT JOIN ktws.DIM_VEHIC_SPEC_MDL  M   ON V.model_key      = M.mdl_key
    LEFT JOIN ktws.DIM_REPURC_SALES_TYPE R ON F.sales_tp_key   = R.sales_tp_key
    WHERE 1 = 1
        /* ---- 출고일 YTD 범위: 연초 ~ 기준시점 ---- */
        AND F.last_retail_sales_dt >= A.year_start
        AND F.last_retail_sales_dt <= A.period_end

        /* ---- 기준시점 전월말 이후 취소 또는 미취소 ---- */
        AND (F.cancel_dt IS NULL OR F.cancel_dt > A.prev_month_end)

        /* ---- 페이지 필터 (DIM_MNG_USER, NULL-safe) ---- */
        AND (U.facade_sc_yn IS NULL OR U.facade_sc_yn NOT LIKE N'%' + @ExclFacadeScYn + N'%')
        AND (U.name IS NULL OR (U.name NOT LIKE N'%' + @ExclScName1 + N'%'
                            AND U.name NOT LIKE N'%' + @ExclScName2 + N'%'))
        AND (U.user_id IS NULL OR @ExclUserIdsPad NOT LIKE N'%,' + LTRIM(RTRIM(U.user_id)) + N',%')

        /* ---- SC 필터 ('ALL' = 전체, LIKE 패딩) ---- */
        AND (@ScName = N'ALL' OR @ScNamePad LIKE N'%,' + LTRIM(RTRIM(U.name)) + N',%')

        /* ---- 슬라이서 필터 (NULL = 전체, LIKE 패딩) ---- */
        AND (@BrandPad     IS NULL OR @BrandPad     LIKE N'%,' + LTRIM(RTRIM(U.BRAND))      + N',%')
        AND (@DealerNmPad  IS NULL OR @DealerNmPad  LIKE N'%,' + LTRIM(RTRIM(D.dealer_nm))  + N',%')
        AND (@GroupNamePad IS NULL OR @GroupNamePad LIKE N'%,' + LTRIM(RTRIM(U.group_name)) + N',%')
        AND (@DeptNmPad    IS NULL OR @DeptNmPad    LIKE N'%,' + LTRIM(RTRIM(U.dept_nm))    + N',%')
        AND (@ActiveYnPad  IS NULL OR @ActiveYnPad  LIKE N'%,' + LTRIM(RTRIM(U.active_yn))  + N',%')
        AND (@ModelNmPad   IS NULL OR @ModelNmPad   LIKE N'%,' + LTRIM(RTRIM(M.model_nm))   + N',%')
        AND (@VariantNmPad IS NULL OR @VariantNmPad LIKE N'%,' + LTRIM(RTRIM(V.variant_nm)) + N',%')
        AND (@MyCdPad      IS NULL OR @MyCdPad      LIKE N'%,' + LTRIM(RTRIM(S.my_cd))      + N',%')
        AND (@SfxCdPad     IS NULL OR @SfxCdPad     LIKE N'%,' + LTRIM(RTRIM(S.sfx_cd))     + N',%')
    ORDER BY
          CAL.[Year]
        , F.contract_dt;
END