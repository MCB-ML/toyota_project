/* ── 파라미터 ──
   원본에서 파라미터 DECLARE 8개를 제거했다. mssql 드라이버가
   request.input()으로 바인딩해 주입한다(문자열 치환 금지).
     @close_yn @potential @brand @dealer_nm @group_name @dept_nm @active_yn @sc_name

   콤마 패딩 변수 0개에 CASE NULL 가드를 넣었다 — Fabric에서
   ',' + NULL + ',' 가 NULL이 아니라 ',,' 가 되어 "NULL=전체"가
   "NULL=결과 없음"으로 뒤집히기 때문이다(라이브로 확인된 문제).
   그 밖의 계산 로직과 페이지 고정 상수는 원문 그대로다. */

/* ══════════════════════════════════════════════════════════════════════════
   [영업기회 관리] 5-1. 고객 관리(칩) — 로우 데이터화  (칩보드 + 퍼널 겸용)
   ──────────────────────────────────────────────────────────────────────────
   목적 : 4개 구간(한달이내출고/계약/시승/상담) 칩을 재현하는 '구간 행'에,
          리드가 각 단계를 거쳤는지 나타내는 '4단계 Y/N 플래그 + 단계별 날짜'를
          함께 실어, 하나의 결과로 [칩 보드]와 [퍼널] 둘 다 그릴 수 있게 함.

   ■ 두 종류 정보가 한 행에 공존 :
     (1) 칩 표시용(배타)   : 구간 / 구간순서 / 칩라벨 / 정렬일자
     (2) 퍼널 집계용(누적) : 상담단계~출고단계 Y/N + 상담일/시승일/계약일/출고일
     → 같은 lead_key 라도 (1)은 배타라 구간마다 행이 갈리지만, (2) 플래그는
       그 리드의 '전체 여정'을 담아 모든 행에서 동일하게 반복됨.

   ■ 퍼널 흐름(초기→최종) : 상담 → 시승 → 계약 → 출고
   ■ 구간순서 : 진행 순서(상담=1, 시승=2, 계약=3, 출고=4). 화면배치는 ORDER BY DESC.

   ■ 칩 소속 규칙(배타 — 현재 각 단계에 '머문' 리드) :
       · 한달이내출고 : is_sales_in_mon='Y'
       · 계약        : contract_dt 존재 AND 당월출고 아님
       · 시승        : 시승라벨 존재(완료/예약) AND 계약X
       · 상담        : 상담활동 존재 AND 계약X
   ■ 단계 '거침' 판정(누적 — 퍼널용, 배타와 무관) :
       · 상담단계 Y : 상담활동(MSG/CALL/VISIT, P117/P113 제외) 존재
       · 시승단계 Y : 시승 라벨(예약 또는 완료) 존재
       · 계약단계 Y : contract_dt 존재
       · 출고단계 Y : is_sales_in_mon='Y'
   ■ 시승여부/시승상세 : 시승라벨 유무(Y/N) / 완료·예약·없음.

   ══════════════════════════════════════════════════════════════════════════
   [에이전트 활용 방안]  ── 파이썬 에이전트가 이 결과 하나로 아래 셋을 그림 ──

   ● 칩 보드(BI 개체 재현) :
       - 구간(한달이내출고/계약/시승/상담)으로 GROUP → 각 구간에 [고객명]+[칩라벨] 칩 배치.
       - 화면 위→아래 배치는 구간순서 DESC(출고 위). 정렬은 정렬일자 DESC.
       - 계약 구간 칩을 [시승여부]로 테두리색 구분(시승O/시승X) 가능.

   ● 역삼각형 퍼널(시승O/시승X 분리) :
       - 먼저 lead_key 로 DISTINCT (구간 행 중복 제거) → 리드 1명=1건으로.
       - [시승여부]='Y' 그룹 / ='N' 그룹으로 분리.
       - 각 그룹에서 단계별 Y 카운트 :
           상담수 = SUM(상담단계='Y'), 시승수 = SUM(시승단계='Y'),
           계약수 = SUM(계약단계='Y'), 출고수 = SUM(출고단계='Y').
       - 두 그룹을 상담→시승→계약→출고 순의 깔때기로 나란히 렌더.
       - 각 층 칩(고객명)도 해당 단계 Y 인 리드로 채움.
     ※ 퍼널 카운트 시 반드시 lead_key DISTINCT 후 집계(구간 행이 여러 개라 중복 방지).

   ● 전환율/KPI :
       - "시승하고 계약→출고" = 시승단계Y & 계약단계Y & 출고단계Y 인 리드 수.
       - "시승없이 계약→출고" = 시승단계N & 계약단계Y & 출고단계Y 인 리드 수.
       - 각 경로 최종 출고 전환율 = 출고수 / 상담수.

   [파이썬 예시 흐름]
       df = run_sql(...)                       # 이 쿼리 결과
       leads = df.drop_duplicates('lead_key')  # 퍼널용: 리드 1행
       yes = leads[leads.시승여부=='Y']
       funnel_yes = { s: (yes[s+'단계']=='Y').sum() for s in ['상담','시승','계약','출고'] }
       # 칩보드용은 df 그대로 구간별 groupby 하여 칩 배치
   ══════════════════════════════════════════════════════════════════════════ */

/* ── 탭/상태 슬라이서 (NULL=모두, 콤마 다중 가능) ── */

/* ── SC 계열 슬라이서 (NULL=모두, 콤마 다중 가능) ── */

/* ── 제외 규칙 (고정) ── */
DECLARE @exclude_facade NVARCHAR(50)  = N'창구SC';
DECLARE @exclude_dept   NVARCHAR(MAX) = N'고객지원팀,TOYOTA YM';
DECLARE @exclude_users  NVARCHAR(MAX) = NEXCLUDED_USER_ID_1,EXCLUDED_USER_ID_2;

;WITH
/* ── 슬라이서·제외·공통필터 통과 리드 집합 ── */
base_lead AS (
    SELECT
        l.lead_key, l.cust_nm, l.potential,
        l.contract_dt, l.last_retail_sales_dt, l.is_sales_in_mon,
        u.name AS sc_name, u.dept_nm, u.group_name, u.dealer_nm, u.BRAND
    FROM   ktws.FCT_LEAD l
    LEFT JOIN ktws.DIM_MNG_USER u ON u.sc_key = l.cl_sc_key
    WHERE  l.closed_in_mon = 'Y'
      AND (@close_yn  IS NULL OR EXISTS (SELECT 1 FROM STRING_SPLIT(@close_yn, N',') x WHERE LTRIM(RTRIM(x.value)) = l.close_yn))
      AND (@potential IS NULL OR EXISTS (SELECT 1 FROM STRING_SPLIT(@potential,N',') x WHERE LTRIM(RTRIM(x.value)) = l.potential))
      AND (@brand      IS NULL OR EXISTS (SELECT 1 FROM STRING_SPLIT(@brand,     N',') x WHERE LTRIM(RTRIM(x.value)) = u.BRAND))
      AND (@dealer_nm  IS NULL OR EXISTS (SELECT 1 FROM STRING_SPLIT(@dealer_nm, N',') x WHERE LTRIM(RTRIM(x.value)) = u.dealer_nm))
      AND (@group_name IS NULL OR EXISTS (SELECT 1 FROM STRING_SPLIT(@group_name,N',') x WHERE LTRIM(RTRIM(x.value)) = u.group_name))
      AND (@dept_nm    IS NULL OR EXISTS (SELECT 1 FROM STRING_SPLIT(@dept_nm,   N',') x WHERE LTRIM(RTRIM(x.value)) = u.dept_nm))
      AND (@active_yn  IS NULL OR EXISTS (SELECT 1 FROM STRING_SPLIT(@active_yn, N',') x WHERE LTRIM(RTRIM(x.value)) = u.active_yn))
      AND (@sc_name    IS NULL OR EXISTS (SELECT 1 FROM STRING_SPLIT(@sc_name,   N',') x WHERE LTRIM(RTRIM(x.value)) = u.name))
      AND (@exclude_facade IS NULL OR u.facade_sc_yn <> @exclude_facade OR u.facade_sc_yn IS NULL)
      AND (@exclude_dept   IS NULL
           OR NOT EXISTS (SELECT 1 FROM STRING_SPLIT(@exclude_dept,',') s WHERE LTRIM(RTRIM(s.value)) = u.dept_nm))
      AND (@exclude_users  IS NULL
           OR NOT EXISTS (SELECT 1 FROM STRING_SPLIT(@exclude_users,',') s WHERE LTRIM(RTRIM(s.value)) = u.user_id))
),

/* ── 시승 지표 : 리드별 P117/P113 집계 (@cust_td_dt 이식) ── */
td_metrics AS (
    SELECT
        bl.lead_key,
        MAX(CASE WHEN a.act_tp = 'P117' THEN a.act_dt_fr END)                                 AS req_117,
        MAX(CASE WHEN a.act_tp = 'P113' THEN a.plan_dt_fr END)                                AS req_113,
        MAX(CASE WHEN a.act_tp = 'P113' AND a.act_result = N'시승완료' THEN a.act_dt_fr END)  AS td_dt
    FROM base_lead bl
    JOIN ktws.FCT_ACTIVITY_v2 a ON a.lead_key = bl.lead_key
    WHERE a.act_tp IN ('P117','P113')
    GROUP BY bl.lead_key
),
td_latest AS (
    SELECT lead_key, act_result AS latest_result
    FROM (
        SELECT a.lead_key, a.act_result,
               ROW_NUMBER() OVER (PARTITION BY a.lead_key ORDER BY a.act_dt_fr DESC) AS rn
        FROM ktws.FCT_ACTIVITY_v2 a
        JOIN base_lead bl ON bl.lead_key = a.lead_key
        WHERE a.act_tp = 'P113'
    ) z
    WHERE rn = 1
),
td_label AS (
    SELECT
        m.lead_key,
        (SELECT MAX(v) FROM (VALUES (m.req_113),(m.req_117)) t(v))  AS req_coal,
        m.td_dt,
        CASE
            WHEN tl.latest_result = N'시승취소' AND m.td_dt IS NULL THEN NULL
            WHEN m.td_dt IS NOT NULL
                 THEN N'시승완료일 : ' + CONVERT(VARCHAR(10), m.td_dt, 23)
            WHEN (SELECT MAX(v) FROM (VALUES (m.req_113),(m.req_117)) t(v)) IS NOT NULL
                 THEN N'시승예약일 : ' + CONVERT(VARCHAR(10),
                        (SELECT MAX(v) FROM (VALUES (m.req_113),(m.req_117)) t(v)), 23)
            ELSE NULL
        END AS 칩라벨,
        CASE
            WHEN tl.latest_result = N'시승취소' AND m.td_dt IS NULL THEN N'없음'
            WHEN m.td_dt IS NOT NULL THEN N'완료'
            WHEN (SELECT MAX(v) FROM (VALUES (m.req_113),(m.req_117)) t(v)) IS NOT NULL THEN N'예약'
            ELSE N'없음'
        END AS 시승상세,
        -- 시승 대표일(퍼널 단계 날짜용) : 완료일 우선, 없으면 예약일
        COALESCE(m.td_dt, (SELECT MAX(v) FROM (VALUES (m.req_113),(m.req_117)) t(v))) AS 시승일
    FROM td_metrics m
    LEFT JOIN td_latest tl ON tl.lead_key = m.lead_key
),

/* ── 상담 지표 : MSG/CALL/VISIT 최근 활동일 (@cust_consult_dt 이식, P117/P113 제외) ── */
consult_metrics AS (
    SELECT bl.lead_key, MAX(a.act_dt_fr) AS act_dt
    FROM base_lead bl
    JOIN ktws.FCT_ACTIVITY_v2 a ON a.lead_key = bl.lead_key
    WHERE a.contact_tp IN (N'MSG', N'CALL', N'VISIT')
      AND a.act_tp NOT IN ('P117','P113')
    GROUP BY bl.lead_key
),

/* ── 리드 단위 종합 : 시승여부 + 4단계 Y/N 플래그 + 단계별 날짜 (퍼널용, 누적) ── */
lead_flag AS (
    SELECT
        bl.lead_key,
        CASE WHEN tl.칩라벨 IS NOT NULL THEN N'Y' ELSE N'N' END AS 시승여부,
        ISNULL(tl.시승상세, N'없음')                            AS 시승상세,
        -- 4단계 거침 여부 (배타와 무관한 누적 판정)
        CASE WHEN cm.act_dt IS NOT NULL              THEN N'Y' ELSE N'N' END AS 상담단계,
        CASE WHEN tl.칩라벨 IS NOT NULL              THEN N'Y' ELSE N'N' END AS 시승단계,
        CASE WHEN bl.contract_dt IS NOT NULL         THEN N'Y' ELSE N'N' END AS 계약단계,
        CASE WHEN ISNULL(bl.is_sales_in_mon,'N')='Y' THEN N'Y' ELSE N'N' END AS 출고단계,
        -- 단계별 날짜
        cm.act_dt                AS 상담일,
        tl.시승일                AS 시승일,
        bl.contract_dt           AS 계약일_단계,
        bl.last_retail_sales_dt  AS 출고일_단계
    FROM base_lead bl
    LEFT JOIN td_label       tl ON tl.lead_key = bl.lead_key
    LEFT JOIN consult_metrics cm ON cm.lead_key = bl.lead_key
),

/* ── 구간 ① 한달이내출고 ── */
seg_ship AS (
    SELECT N'한달이내출고' AS 구간, 4 AS 구간순서, bl.*,
           N'출고일자 ' + CONVERT(VARCHAR(10), bl.last_retail_sales_dt, 23) AS 칩라벨,
           bl.last_retail_sales_dt AS 정렬일자
    FROM base_lead bl
    WHERE bl.is_sales_in_mon = 'Y'
),
/* ── 구간 ② 계약 ── */
seg_contract AS (
    SELECT N'계약' AS 구간, 3 AS 구간순서, bl.*,
           N'계약일자 ' + CONVERT(VARCHAR(10), bl.contract_dt, 23) AS 칩라벨,
           bl.contract_dt AS 정렬일자
    FROM base_lead bl
    WHERE bl.contract_dt IS NOT NULL
      AND ISNULL(bl.is_sales_in_mon,'N') <> 'Y'
),
/* ── 구간 ③ 시승 ── */
seg_td AS (
    SELECT N'시승' AS 구간, 2 AS 구간순서, bl.*,
           tl.칩라벨,
           COALESCE(tl.td_dt, tl.req_coal) AS 정렬일자
    FROM base_lead bl
    JOIN td_label tl ON tl.lead_key = bl.lead_key
    WHERE tl.칩라벨 IS NOT NULL
      AND bl.contract_dt IS NULL
),
/* ── 구간 ④ 상담 ── */
seg_consult AS (
    SELECT N'상담' AS 구간, 1 AS 구간순서, bl.*,
           N'최근활동일 : ' + CONVERT(VARCHAR(10), cm.act_dt, 23) AS 칩라벨,
           cm.act_dt AS 정렬일자
    FROM base_lead bl
    JOIN consult_metrics cm ON cm.lead_key = bl.lead_key
    WHERE cm.act_dt IS NOT NULL
      AND bl.contract_dt IS NULL
),

/* ── 구간 통합 ── */
all_seg AS (
    SELECT 구간,구간순서,lead_key,cust_nm,potential,sc_name,dept_nm,group_name,dealer_nm,BRAND,contract_dt,last_retail_sales_dt,칩라벨,정렬일자 FROM seg_ship
    UNION ALL
    SELECT 구간,구간순서,lead_key,cust_nm,potential,sc_name,dept_nm,group_name,dealer_nm,BRAND,contract_dt,last_retail_sales_dt,칩라벨,정렬일자 FROM seg_contract
    UNION ALL
    SELECT 구간,구간순서,lead_key,cust_nm,potential,sc_name,dept_nm,group_name,dealer_nm,BRAND,contract_dt,last_retail_sales_dt,칩라벨,정렬일자 FROM seg_td
    UNION ALL
    SELECT 구간,구간순서,lead_key,cust_nm,potential,sc_name,dept_nm,group_name,dealer_nm,BRAND,contract_dt,last_retail_sales_dt,칩라벨,정렬일자 FROM seg_consult
)

/* ── 최종 반환 : 칩용(구간/칩라벨) + 퍼널용(4단계 플래그/단계별 날짜) 한 행에 ── */
SELECT
    /* (1) 칩 보드용 */
    s.구간, s.구간순서,
    s.sc_name  AS [SC명],
    s.cust_nm  AS [고객명],
    s.potential AS [관심도],
    s.칩라벨   AS [칩라벨],
    s.정렬일자 AS [정렬일자],
    /* (2) 퍼널용 : 시승여부 + 4단계 Y/N + 단계별 날짜 */
    f.시승여부  AS [시승여부],
    f.시승상세  AS [시승상세],
    f.상담단계  AS [상담단계],
    f.시승단계  AS [시승단계],
    f.계약단계  AS [계약단계],
    f.출고단계  AS [출고단계],
    f.상담일       AS [상담일],
    f.시승일       AS [시승일],
    f.계약일_단계  AS [계약일],
    f.출고일_단계  AS [출고일],
    /* 공통 계층 */
    s.dealer_nm  AS [딜러],
    s.group_name AS [전시장],
    s.dept_nm    AS [팀],
    s.BRAND      AS [브랜드],
    s.lead_key
FROM all_seg s
LEFT JOIN lead_flag f ON f.lead_key = s.lead_key
ORDER BY s.구간순서 DESC,          -- 화면 배치: 출고(4) 위 → 상담(1) 아래
         s.정렬일자 DESC,
         s.sc_name COLLATE Korean_Wansung_CI_AS,
         s.cust_nm COLLATE Korean_Wansung_CI_AS;