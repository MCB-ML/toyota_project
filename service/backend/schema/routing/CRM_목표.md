# CRM_목표 쿼리 규칙

"당월목표"/"진행률(달성률)" 패턴은 `ktws_측정값_쿼리화.xlsx`(1-1시트)의 GOLD 쿼리에서 그대로 가져온 것이다 — 추측이 아니라 검증된 정답 SQL이므로 아래와 다른 형태로 계산하지 말 것. 같은 GOLD 쿼리가 `활동_실적` topic에도 실려 있다 — "활동 건수" 자체(목표 없이)를 묻는 질문이면 그 topic을 우선 고려할 것.

## 테이블 선택
- "일별 CRM 목표"는 `FCT_CRM_TARGET_D` (day_seq 단위, daily_dt로 기간 필터).
- "월별 CRM 목표·목표율"은 `FCT_CRM_TARGET_M` (mon_key 단위, target_rate로 달성률 계산됨).
- "목표 저장/마감 여부"는 `FCT_CRM_TARGET_STS`.
- **"진행률/달성률"(목표 대비 실적 비율)은 목표 테이블 하나로 끝나지 않는다** — `FCT_CRM_TARGET_D.target_cnt`와 `FCT_ACTIVITY_v2.actual_cnt`를 동일한 필터로 각각 SUM한 뒤 나눠야 한다.

`FCT_CRM_TARGET_D`/`FCT_CRM_TARGET_M`/`FCT_CRM_TARGET_STS`는 서로 다른 집계 단위(일/월/상태)이며 조인 키가 명시적으로 이어지지 않는다 — 같은 질문에 여러 단위를 섞지 말 것.

## 반드시 포함해야 하는 필터 ("페이지 기본 조건")
목표/진행률을 집계하는 질문이면 사용자가 명시적으로 말하지 않아도 아래 4개를 **항상** 포함한다 — `활동_실적` topic과 동일한 필터다(같은 "KTWS 퍼널" 페이지의 측정값이기 때문):
```sql
AND B.tp_grp_1 IN ('관계형성', '기회창출')                 -- 활동유형 대분류 제한
AND D.facade_sc_yn != '창구SC'                              -- 창구SC 제외
AND D.name NOT IN ('고객지원팀', 'TOYOTA YM')                -- 특정 조직 제외
AND D.user_id NOT IN ('EXCLUDED_USER_ID', 'EXCLUDED_USER_ID', 'EXCLUDED_USER_ID', 'EXCLUDED_USER_ID', 'EXCLUDED_USER_ID', 'EXCLUDED_USER_ID')  -- 특정 사용자 제외
```
사용자가 명시한 조건(연월, 재직여부, 딜러, 브랜드, 그룹/부서)은 그 위에 추가 — `활동_실적` topic과 같은 슬라이서 세트다:
```sql
AND C.YearMonth = '2026-04'      -- 날짜 필터
AND D.active_yn = '재직'          -- 재직 여부 (기본값 '재직')
AND E.dealer_nm = '렉서스 강남'   -- 딜러 필터 (dealer_id보다 dealer_nm 매칭이 자연어 질문엔 더 안전)
AND D.BRAND = 'LEXUS'            -- 브랜드 필터 (사용자가 언급했을 때만)
AND D.group_name = '렉서스 강서'  -- 그룹(지역) 필터
AND D.dept_nm = '강서영업팀'      -- 부서(팀) 필터
```

## GOLD 쿼리 패턴

### 1. 당월목표 (act_mtd_(target)_preOp)
```sql
SELECT SUM(target_cnt) AS cnt
FROM ktws.FCT_CRM_TARGET_D AS A
    INNER JOIN ktws.DIM_CRM_ACT_TYPE AS B ON A.type_cd = B.tp_key
    INNER JOIN ktws.DIM_CALENDAR_KTWS AS C ON A.daily_dt = C.Date
    INNER JOIN ktws.DIM_MNG_USER AS D ON A.sc_key = D.sc_key
    INNER JOIN ktws.DIM_MNG_DEALER AS E ON D.dealer_key = E.dealer_key
    INNER JOIN ktws.DIM_CRM_ACT_TYPE_ORDER AS F ON B.common_tp_nm = F.common_tp_nm
WHERE C.YearMonth = '2026-04'
  AND D.active_yn = '재직'
  AND E.dealer_id = 'DT00000'
  AND B.tp_grp_1 IN ('관계형성', '기회창출')
  AND D.facade_sc_yn != '창구SC'
  AND D.name NOT IN ('고객지원팀', 'TOYOTA YM')
  AND D.user_id NOT IN ('EXCLUDED_USER_ID', 'EXCLUDED_USER_ID', 'EXCLUDED_USER_ID', 'EXCLUDED_USER_ID', 'EXCLUDED_USER_ID', 'EXCLUDED_USER_ID')
```

### 2. 진행률 (실적/목표, %) — 반드시 FCT_ACTIVITY_v2까지 조인
목표·실적을 같은 필터로 각각 CTE로 구해 나눈다:
```sql
WITH filtered_dates AS (
    SELECT Date FROM ktws.DIM_CALENDAR_KTWS WHERE YearMonth = '2026-04'
),
filtered_users AS (
    SELECT D.sc_key
    FROM ktws.DIM_MNG_USER AS D
    INNER JOIN ktws.DIM_MNG_DEALER AS E ON D.dealer_key = E.dealer_key
    WHERE D.active_yn = '재직'
      AND E.dealer_id = 'DT00000'
      AND D.facade_sc_yn <> '창구SC'
      AND D.name NOT IN ('고객지원팀', 'TOYOTA YM')
      AND D.user_id NOT IN ('EXCLUDED_USER_ID', 'EXCLUDED_USER_ID', 'EXCLUDED_USER_ID', 'EXCLUDED_USER_ID', 'EXCLUDED_USER_ID', 'EXCLUDED_USER_ID')
),
filtered_types AS (
    SELECT B.tp_key FROM ktws.DIM_CRM_ACT_TYPE AS B WHERE B.tp_grp_1 IN ('관계형성', '기회창출')
),
target_cnt AS (
    SELECT SUM(A.target_cnt) AS cnt
    FROM ktws.FCT_CRM_TARGET_D AS A
    INNER JOIN filtered_dates AS C ON A.daily_dt = C.Date
    INNER JOIN filtered_users AS D ON A.sc_key = D.sc_key
    INNER JOIN filtered_types AS B ON A.type_cd = B.tp_key
),
actual_cnt AS (
    SELECT SUM(A.actual_cnt) AS cnt
    FROM ktws.FCT_ACTIVITY_v2 AS A
    INNER JOIN filtered_dates AS C ON A.act_dt_fr = C.Date
    INNER JOIN filtered_users AS D ON A.sc_key = D.sc_key
    INNER JOIN filtered_types AS B ON A.tp_key = B.tp_key
)
SELECT FORMAT(CAST(A.cnt AS FLOAT) / NULLIF(T.cnt, 0), '0%') AS Percentage
FROM target_cnt AS T CROSS JOIN actual_cnt AS A
```

### 3. FCT_CRM_TARGET_M — 이 topic에서 직접 쓰지 말 것 (아래로 라우팅)
`FCT_CRM_TARGET_M`은 `tp_key`(활동유형)에 따라 여러 종류의 월간 목표가 섞여 있는 테이블이다 — `tp_grp_1`/`common_tp_nm` 필터 없이 그냥 SUM하면 영업기회 목표·계약 목표가 뒤섞여 잘못된 값이 나온다. GOLD로 검증된 필터는:
- **영업기회(리드) 월간 목표** → `영업기회_퍼널` topic의 "영업기회 당월 목표" 패턴(`DIM_CRM_ACT_TYPE_ORDER.tp_grp_1 IN ('관계형성','기회창출')` 필터)
- **계약 월간 목표** → `계약` topic의 "계약 목표" 패턴(`DIM_CRM_ACT_TYPE.common_tp_nm = '계약'` 필터)

"CRM 목표"를 막연히 물으면 우선 `FCT_CRM_TARGET_D`(이 topic의 패턴 1, 일간·활동 목표) 기준으로 답하고, 사용자가 "영업기회/리드 목표" 또는 "계약 목표"라고 구체적으로 물으면 위 두 topic으로 라우팅할 것.

## 주의
- `active_yn`은 'Y'/'N'이 아니라 **'재직'/'퇴사'** 문자열이다.
- "진행률/달성률"을 `FCT_CRM_TARGET_M.target_rate`만으로 답하지 말 것 — 그 컬럼은 이 topic의 GOLD 검증 대상이 아니며, 실측 검증된 정답은 위 패턴 2번(FCT_CRM_TARGET_D + FCT_ACTIVITY_v2 CTE)이다.
- "활동 건수"(목표 없이 실적만)를 물으면 이 topic이 아니라 `활동_실적` topic의 GOLD 패턴을 참고할 것 — 두 topic 다 같은 필터를 쓰지만 테이블 조합이 다르다.
