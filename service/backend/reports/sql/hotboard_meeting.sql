/* ── 파라미터 ──
   원본에서 파라미터 DECLARE 10개를 제거했다. mssql 드라이버가
   request.input()으로 바인딩해 주입한다(문자열 치환 금지).
     @base_year @base_month @meet_round @brand @dealer_nm @group_name @dept_nm @sc_name @active_yn @variant_nm

   콤마 패딩 변수 9개에 CASE NULL 가드를 넣었다 — Fabric에서
   ',' + NULL + ',' 가 NULL이 아니라 ',,' 가 되어 "NULL=전체"가
   "NULL=결과 없음"으로 뒤집히기 때문이다(라이브로 확인된 문제).
   그 밖의 계산 로직과 페이지 고정 상수는 원문 그대로다. */

/* ══════════════════════════════════════════════════════════════════════════
   [HOT 보드 회의] 미팅 상세 테이블 v2 — 슬라이서 전체 변수화 / 다중값 / LIKE 패딩
   ──────────────────────────────────────────────────────────────────────────
   조인 : mng_sc_key→DIM_MNG_USER.sc_key(SC/팀/딜러/전시장/재직)
          int_var_key→DIM_VEHIC_SPEC_VAR.var_key(관심차종)
   기간 : meet_dt 연/월 (연도·월 탭),  회차=meet_ym_seq

   ■ 출력 : [연도]·[월]·[회차] 를 결과 맨 앞에 표시 (meet_dt / meet_ym_seq 기준)
   ■ 전체 조회 : @sc_name 을 제외한 모든 변수 NULL=전체.
       @base_year/@base_month/@meet_round 도 NULL 허용 → 해당 축 전체,
       콤마로 여러 연도/월/회차 동시 지정 가능 (예: @base_month=N'1,2,3').
   ■ @sc_name 3분기 (상세 테이블 → 행은 동일, SC 열 표시 여부만 다름) :
       · NULL          → SC 컬럼 없음 (행은 전체 SC 의 미팅 그대로)
       · 'ALL'         → SC 컬럼 표시 + 전체 SC
       · '정지훈,김영범' → SC 컬럼 표시 + 지정 SC 만
   ■ 필터 : LIKE 패딩(',값1,값2,') 비교. STRING_SPLIT 미사용(8623 방지).
       콤마 뒤 공백 자동 제거(', ' → ','). 값에 콤마 포함 시 필터 불가.
   ■ 제외 : facade_sc_yn='창구SC', dept_nm∈(고객지원팀,TOYOTA YM), user_id 목록
   ══════════════════════════════════════════════════════════════════════════ */

/* ── 기간·회차 (NULL = 전체, 콤마로 여러 값 지정 가능) ── */

/* ── 슬라이서 (NULL=모두, 콤마로 여러 값 지정 가능) ── */

/* ── SC 필터 값 : NULL 또는 'ALL'(대소문자·공백 무관)이면 필터 해제, 그 외엔 지정 SC ── */
DECLARE @sc_filter NVARCHAR(MAX) =
    CASE WHEN @sc_name IS NULL THEN NULL
         WHEN UPPER(LTRIM(RTRIM(@sc_name))) = N'ALL' THEN NULL
         ELSE @sc_name END;

/* ── 제외 규칙 (고정) ── */
DECLARE @exclude_facade NVARCHAR(50)  = N'창구SC';
DECLARE @exclude_dept   NVARCHAR(MAX) = N'고객지원팀,TOYOTA YM';
DECLARE @exclude_users  NVARCHAR(MAX) = NEXCLUDED_USER_ID_1,EXCLUDED_USER_ID_2;

/* ── LIKE 패딩 변수 (콤마 뒤 공백 자동 제거 ', ' → ',') ── */
/* 연도·월·회차는 숫자값 → 공백 전체 제거 */
DECLARE @base_yearPad  NVARCHAR(MAX) = CASE WHEN @base_year IS NULL THEN NULL ELSE N',' + REPLACE(@base_year,  N' ', N'') + N',' END;
DECLARE @base_monthPad NVARCHAR(MAX) = CASE WHEN @base_month IS NULL THEN NULL ELSE N',' + REPLACE(@base_month, N' ', N'') + N',' END;
DECLARE @meet_roundPad NVARCHAR(MAX) = CASE WHEN @meet_round IS NULL THEN NULL ELSE N',' + REPLACE(@meet_round, N' ', N'') + N',' END;
DECLARE @brandPad      NVARCHAR(MAX) = CASE WHEN @brand IS NULL THEN NULL ELSE N',' + REPLACE(@brand,      N', ', N',') + N',' END;
DECLARE @dealer_nmPad  NVARCHAR(MAX) = CASE WHEN @dealer_nm IS NULL THEN NULL ELSE N',' + REPLACE(@dealer_nm,  N', ', N',') + N',' END;
DECLARE @group_namePad NVARCHAR(MAX) = CASE WHEN @group_name IS NULL THEN NULL ELSE N',' + REPLACE(@group_name, N', ', N',') + N',' END;
DECLARE @dept_nmPad    NVARCHAR(MAX) = CASE WHEN @dept_nm IS NULL THEN NULL ELSE N',' + REPLACE(@dept_nm,    N', ', N',') + N',' END;
DECLARE @sc_filterPad  NVARCHAR(MAX) = CASE WHEN @sc_filter IS NULL THEN NULL ELSE N',' + REPLACE(@sc_filter,  N', ', N',') + N',' END;
DECLARE @active_ynPad  NVARCHAR(MAX) = CASE WHEN @active_yn IS NULL THEN NULL ELSE N',' + REPLACE(@active_yn,  N', ', N',') + N',' END;
DECLARE @variant_nmPad NVARCHAR(MAX) = CASE WHEN @variant_nm IS NULL THEN NULL ELSE N',' + REPLACE(@variant_nm, N', ', N',') + N',' END;

DECLARE @excl_deptPad  NVARCHAR(MAX) = N',' + REPLACE(@exclude_dept,  N', ', N',') + N',';
DECLARE @excl_usersPad NVARCHAR(MAX) = N',' + REPLACE(@exclude_users, N' ',  N'')  + N',';


IF @sc_name IS NULL
BEGIN
    /* ══════════ [SC열 미표시] 행은 전체 SC 의 미팅 그대로 ══════════ */
    SELECT
        YEAR(h.meet_dt)    AS [연도],
        MONTH(h.meet_dt)   AS [월],
        h.meet_ym_seq      AS [회차],
        h.meet_dt          AS [미팅일자],
        h.chip_status_nm   AS [상태],
        u.dept_nm          AS [팀],
        h.contact_nm       AS [상담자],
        h.hold_type_nm     AS [확보유형],
        v.variant_nm       AS [관심차종],
        h.hot_reg_dt       AS [HOT 등록일],
        h.hboard_reg_dt    AS [BOARD 등록일],
        h.next_plant_dt    AS [다음 활동 예정일],
        h.contract_ratio   AS [금주 계약 가능성],
        h.remark           AS [메모(회의 등록)],
        h.comp_model_nm    AS [경쟁차종],
        h.own_model_nm     AS [현재 보유차종],
        h.own_model_pdt    AS [현재 보유차종(상세)],
        h.pay_type_nm      AS [지불 유형]
    FROM   ktws.FCT_HBOARD_MEETING h
    LEFT JOIN ktws.DIM_MNG_USER       u ON u.sc_key  = h.mng_sc_key
    LEFT JOIN ktws.DIM_VEHIC_SPEC_VAR v ON v.var_key = h.int_var_key
    WHERE (@base_yearPad  IS NULL OR @base_yearPad  LIKE N'%,' + CAST(YEAR(h.meet_dt)  AS NVARCHAR(10)) + N',%')
      AND (@base_monthPad IS NULL OR @base_monthPad LIKE N'%,' + CAST(MONTH(h.meet_dt) AS NVARCHAR(10)) + N',%')
      AND (@meet_roundPad IS NULL OR @meet_roundPad LIKE N'%,' + CAST(h.meet_ym_seq    AS NVARCHAR(10)) + N',%')
      /* 브랜드 (팩트 직접) */
      AND (@brandPad      IS NULL OR @brandPad      LIKE N'%,' + LTRIM(RTRIM(h.BRAND))      + N',%')
      /* SC 계열 슬라이서 (DIM_MNG_USER 조인) */
      AND (@active_ynPad  IS NULL OR @active_ynPad  LIKE N'%,' + LTRIM(RTRIM(u.active_yn))  + N',%')
      AND (@dealer_nmPad  IS NULL OR @dealer_nmPad  LIKE N'%,' + LTRIM(RTRIM(u.dealer_nm))  + N',%')
      AND (@group_namePad IS NULL OR @group_namePad LIKE N'%,' + LTRIM(RTRIM(u.group_name)) + N',%')
      AND (@dept_nmPad    IS NULL OR @dept_nmPad    LIKE N'%,' + LTRIM(RTRIM(u.dept_nm))    + N',%')
      /* 관심차종 */
      AND (@variant_nmPad IS NULL OR @variant_nmPad LIKE N'%,' + LTRIM(RTRIM(v.variant_nm)) + N',%')
      /* 제외 규칙 (u 컬럼이 NULL 인 행은 원본과 동일하게 보존) */
      AND (u.facade_sc_yn IS NULL OR u.facade_sc_yn <> @exclude_facade)
      AND (u.dept_nm IS NULL OR @excl_deptPad  NOT LIKE N'%,' + LTRIM(RTRIM(u.dept_nm)) + N',%')
      AND (u.user_id IS NULL OR @excl_usersPad NOT LIKE N'%,' + LTRIM(RTRIM(u.user_id)) + N',%')
    ORDER BY h.meet_dt DESC, h.contact_nm;
END
ELSE
BEGIN
    /* ══════════ [SC열 표시] 'ALL'=전체 SC / 지정 SC 만 ══════════ */
    SELECT
        YEAR(h.meet_dt)    AS [연도],
        MONTH(h.meet_dt)   AS [월],
        h.meet_ym_seq      AS [회차],
        h.meet_dt          AS [미팅일자],
        h.chip_status_nm   AS [상태],
        u.dept_nm          AS [팀],
        u.name             AS [SC],
        h.contact_nm       AS [상담자],
        h.hold_type_nm     AS [확보유형],
        v.variant_nm       AS [관심차종],
        h.hot_reg_dt       AS [HOT 등록일],
        h.hboard_reg_dt    AS [BOARD 등록일],
        h.next_plant_dt    AS [다음 활동 예정일],
        h.contract_ratio   AS [금주 계약 가능성],
        h.remark           AS [메모(회의 등록)],
        h.comp_model_nm    AS [경쟁차종],
        h.own_model_nm     AS [현재 보유차종],
        h.own_model_pdt    AS [현재 보유차종(상세)],
        h.pay_type_nm      AS [지불 유형]
    FROM   ktws.FCT_HBOARD_MEETING h
    LEFT JOIN ktws.DIM_MNG_USER       u ON u.sc_key  = h.mng_sc_key
    LEFT JOIN ktws.DIM_VEHIC_SPEC_VAR v ON v.var_key = h.int_var_key
    WHERE (@base_yearPad  IS NULL OR @base_yearPad  LIKE N'%,' + CAST(YEAR(h.meet_dt)  AS NVARCHAR(10)) + N',%')
      AND (@base_monthPad IS NULL OR @base_monthPad LIKE N'%,' + CAST(MONTH(h.meet_dt) AS NVARCHAR(10)) + N',%')
      AND (@meet_roundPad IS NULL OR @meet_roundPad LIKE N'%,' + CAST(h.meet_ym_seq    AS NVARCHAR(10)) + N',%')
      /* 브랜드 (팩트 직접) */
      AND (@brandPad      IS NULL OR @brandPad      LIKE N'%,' + LTRIM(RTRIM(h.BRAND))      + N',%')
      /* SC 계열 슬라이서 (DIM_MNG_USER 조인) */
      AND (@active_ynPad  IS NULL OR @active_ynPad  LIKE N'%,' + LTRIM(RTRIM(u.active_yn))  + N',%')
      AND (@dealer_nmPad  IS NULL OR @dealer_nmPad  LIKE N'%,' + LTRIM(RTRIM(u.dealer_nm))  + N',%')
      AND (@group_namePad IS NULL OR @group_namePad LIKE N'%,' + LTRIM(RTRIM(u.group_name)) + N',%')
      AND (@dept_nmPad    IS NULL OR @dept_nmPad    LIKE N'%,' + LTRIM(RTRIM(u.dept_nm))    + N',%')
      AND (@sc_filterPad  IS NULL OR @sc_filterPad  LIKE N'%,' + LTRIM(RTRIM(u.[name]))     + N',%')  -- ALL이면 전체
      /* 관심차종 */
      AND (@variant_nmPad IS NULL OR @variant_nmPad LIKE N'%,' + LTRIM(RTRIM(v.variant_nm)) + N',%')
      /* 제외 규칙 (u 컬럼이 NULL 인 행은 원본과 동일하게 보존) */
      AND (u.facade_sc_yn IS NULL OR u.facade_sc_yn <> @exclude_facade)
      AND (u.dept_nm IS NULL OR @excl_deptPad  NOT LIKE N'%,' + LTRIM(RTRIM(u.dept_nm)) + N',%')
      AND (u.user_id IS NULL OR @excl_usersPad NOT LIKE N'%,' + LTRIM(RTRIM(u.user_id)) + N',%')
    ORDER BY h.meet_dt DESC, h.contact_nm;
END