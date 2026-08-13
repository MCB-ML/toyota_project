/* ── 파라미터 ──
   원본에서 파라미터 DECLARE 12개를 제거했다. mssql 드라이버가
   request.input()으로 바인딩해 주입한다(문자열 치환 금지).
     @reg_from @reg_to @close_yn @brand @dealer_nm @group_name @dept_nm @active_yn @sc_name @potential @contract_yn @retail_yn

   콤마 패딩 변수 0개에 CASE NULL 가드를 넣었다 — Fabric에서
   ',' + NULL + ',' 가 NULL이 아니라 ',,' 가 되어 "NULL=전체"가
   "NULL=결과 없음"으로 뒤집히기 때문이다(라이브로 확인된 문제).
   그 밖의 계산 로직과 페이지 고정 상수는 원문 그대로다. */

/* ══════════════════════════════════════════════════════════════════════════
   [영업기회 관리] 5-2. 영업기회 목록 — 슬라이서 다중값 버전
   ──────────────────────────────────────────────────────────────────────────
   슬라이서(NULL=모두, 콤마로 여러 값 지정 가능)
     한 값 @sc_name=N'정지훈' / 여러 값 @sc_name=N'정지훈,김영범' / 전체 NULL
   탭 계열(close_yn/contract_yn/retail_yn)도 다중값 가능하나 보통 한 값만 사용.
   제외 : facade_sc_yn='창구SC', dept_nm∈(고객지원팀,TOYOTA YM), user_id 목록
   ══════════════════════════════════════════════════════════════════════════ */

/* ── 등록일 범위 ── */

/* ── 슬라이서 (NULL=모두, 콤마로 여러 값 지정 가능) ── */

/* ── 제외 규칙 (고정) ── */
DECLARE @exclude_facade NVARCHAR(50)  = N'창구SC';                -- 창구SC 제외 (일반SC만 남김)
DECLARE @exclude_dept   NVARCHAR(MAX) = N'고객지원팀,TOYOTA YM';  -- 제외 팀(콤마 구분)
DECLARE @exclude_users  NVARCHAR(MAX) = NEXCLUDED_USER_ID_1,EXCLUDED_USER_ID_2;  -- 제외 user_id(콤마 구분)

SELECT
    ROW_NUMBER() OVER (ORDER BY l.lead_reg_dt DESC,
        u.name COLLATE Korean_Wansung_CI_AS,
        l.cust_nm COLLATE Korean_Wansung_CI_AS)                    AS [순서],
    u.name              AS [SC명],
    l.cust_nm           AS [고객명],
    l.lead_reg_dt       AS [등록일],
    l.potential         AS [관심도],
    (SELECT MAX(a.act_dt_fr) FROM ktws.FCT_ACTIVITY_v2 a
      WHERE a.lead_key = l.lead_key AND a.act_tp = 'P117')         AS [시승요청일],
    (SELECT MAX(a.act_dt_fr) FROM ktws.FCT_ACTIVITY_v2 a
      WHERE a.lead_key = l.lead_key AND a.act_tp = 'P113')         AS [시승일],
    l.contract_dt       AS [계약일],
    l.last_retail_sales_dt AS [출고일],
    (SELECT MAX(a.act_dt_fr) FROM ktws.FCT_ACTIVITY_v2 a
      WHERE a.lead_key = l.lead_key
        AND a.contact_tp IN (N'MSG', N'CALL', N'VISIT'))          AS [최근 활동일자],
    (SELECT MAX(vv.variant_nm) FROM ktws.DIM_VEHIC_SPEC_VAR vv
      WHERE vv.var_key = l.int_vehic_variant_key1)                AS [관심 차종],
    (SELECT MAX(a.visit_type) FROM ktws.FCT_ACTIVITY_v2 a
      WHERE a.lead_key = l.lead_key
        AND a.act_tp IN ('P107', 'P108'))                        AS [접수 유형]
FROM ktws.FCT_LEAD l
LEFT JOIN ktws.DIM_MNG_USER u ON u.sc_key = l.cl_sc_key
WHERE 1=1
  AND (@reg_from IS NULL OR l.lead_reg_dt >= @reg_from)
  AND (@reg_to   IS NULL OR l.lead_reg_dt < DATEADD(DAY, 1, @reg_to))
  -- 탭/상태 슬라이서 (콤마 다중 가능)
  AND (@close_yn    IS NULL OR EXISTS (SELECT 1 FROM STRING_SPLIT(@close_yn,   N',') x WHERE LTRIM(RTRIM(x.value)) = l.close_yn))
  AND (@potential   IS NULL OR EXISTS (SELECT 1 FROM STRING_SPLIT(@potential,  N',') x WHERE LTRIM(RTRIM(x.value)) = l.potential))
  AND (@contract_yn IS NULL OR EXISTS (SELECT 1 FROM STRING_SPLIT(@contract_yn,N',') x WHERE LTRIM(RTRIM(x.value)) = l.contract_yn))
  AND (@retail_yn   IS NULL OR EXISTS (SELECT 1 FROM STRING_SPLIT(@retail_yn,  N',') x WHERE LTRIM(RTRIM(x.value)) = l.last_retail_sales_yn))
  -- SC 계열 슬라이서 (DIM_MNG_USER 조인, 콤마 다중 가능)
  AND (@brand      IS NULL OR EXISTS (SELECT 1 FROM STRING_SPLIT(@brand,     N',') x WHERE LTRIM(RTRIM(x.value)) = u.BRAND))
  AND (@dealer_nm  IS NULL OR EXISTS (SELECT 1 FROM STRING_SPLIT(@dealer_nm, N',') x WHERE LTRIM(RTRIM(x.value)) = u.dealer_nm))
  AND (@group_name IS NULL OR EXISTS (SELECT 1 FROM STRING_SPLIT(@group_name,N',') x WHERE LTRIM(RTRIM(x.value)) = u.group_name))
  AND (@dept_nm    IS NULL OR EXISTS (SELECT 1 FROM STRING_SPLIT(@dept_nm,   N',') x WHERE LTRIM(RTRIM(x.value)) = u.dept_nm))
  AND (@active_yn  IS NULL OR EXISTS (SELECT 1 FROM STRING_SPLIT(@active_yn, N',') x WHERE LTRIM(RTRIM(x.value)) = u.active_yn))
  AND (@sc_name    IS NULL OR EXISTS (SELECT 1 FROM STRING_SPLIT(@sc_name,   N',') x WHERE LTRIM(RTRIM(x.value)) = u.name))
  -- 제외 규칙
  AND (@exclude_facade IS NULL OR u.facade_sc_yn <> @exclude_facade OR u.facade_sc_yn IS NULL)
  AND (@exclude_dept   IS NULL
       OR NOT EXISTS (SELECT 1 FROM STRING_SPLIT(@exclude_dept,',') s
                      WHERE LTRIM(RTRIM(s.value)) = u.dept_nm))
  AND (@exclude_users  IS NULL
       OR NOT EXISTS (SELECT 1 FROM STRING_SPLIT(@exclude_users,',') s
                      WHERE LTRIM(RTRIM(s.value)) = u.user_id))
ORDER BY l.lead_reg_dt DESC,
         u.name COLLATE Korean_Wansung_CI_AS,
         l.cust_nm COLLATE Korean_Wansung_CI_AS;