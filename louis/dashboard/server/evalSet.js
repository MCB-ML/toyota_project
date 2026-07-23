// 프로덕션 파이프라인(chatHandler.js /api/chat, dashboardPipeline.js 대시보드 커스터마이징)
// 평가용 — DebugTrace.jsx로 확인한 실제 topic/스키마/SQL을 이 파일의 정답과 비교한다.
// server/rag-poc/evalSet.js(테이블 리트리벌 POC 비교용, 정답 SQL 없음)와는 목적이 다르다:
// 여기는 "topic 분류가 맞았는가"뿐 아니라 "생성된 SQL이 실제로 실행 가능하고 질문에
// 맞는가"까지 검증한다. `sql`은 server/schema/tables/*.yaml의 실제 컬럼명/타입을 직접
// 확인해서 작성한 것 — 컬럼명을 지어내지 않았다 (타입이 varchar인 날짜 컬럼은
// dashboardTools.js의 buildWidgetQuerySystemPrompt 8번 지침대로 LEFT()로 처리).
// LLM이 낸 SQL이 이 정답과 문자열 그대로 같을 필요는 없다 — 같은 테이블에서 같은
// 조건/집계로 같은 결과 행을 반환하면 통과로 본다.
//
// 카테고리:
//  - glossary: 방금 주입한 도메인 용어 사전(server/schema/glossary.js) 없이는 topic
//    분류가 실패하기 쉬운, keywords 목록 밖의 jargon을 쓴 질문
//  - trap: index.yaml이 명시적으로 경고하는 오분류 함정 (예: "딜러별"이 실적 질문인데
//    딜러_업체_마스터로 잘못 가는 경우)
//  - trap_glossary: trap이면서 동시에 glossary 용어(gl06 딜러 vs SHOP)를 쓴 것 —
//    glossary 주입이 트랩 방지 노트를 오히려 무력화하지 않는지 확인하는 회귀 테스트
//  - coverage_gap: RAG POC에서 이미 확인한 orphan 테이블(어느 topic에도 안 걸림) —
//    glossary가 용어는 설명해도 topic reject는 그대로 나야 정상(과다수용 방지)
//  - control: topic keywords로 이미 커버되는 케이스, glossary 유무와 무관하게 항상
//    맞아야 하는 회귀 확인용

export const evalSet = [
  // --- glossary: keywords 밖 jargon ---
  {
    id: 'e01', category: 'glossary', query: '이번 달 ac_trgt 대비 우리 딜러 출고 실적이 얼마나 달성됐어?',
    topic: '판매_목표_달성률', db: 'KPI_W', table: 'ktws.FCT_SALES_TARGET_DAILY',
    sql: `SELECT TOP 50 dealer_key, SUM(ac_trgt) AS ac_trgt_total
FROM KPI_W.ktws.FCT_SALES_TARGET_DAILY
WHERE FORMAT(dateby, 'yyyyMM') = FORMAT(GETDATE(), 'yyyyMM')
GROUP BY dealer_key
ORDER BY ac_trgt_total DESC`,
    note: '진짜 "달성률"(목표 대비 실제 출고)은 실적 테이블과의 조인이 필요한데 cross-db 조인 금지 규칙 때문에 단일 쿼리로 불가 — 정답은 목표치(ac_trgt) 집계까지만.',
  },
  {
    id: 'e02', category: 'glossary', query: 'co_trgt는 다 채웠는데 계약이 왜 이렇게 적지?',
    topic: '판매_목표_달성률', db: 'KPI_W', table: 'ktws.FCT_SALES_TARGET_DAILY',
    sql: `SELECT TOP 50 dealer_key, SUM(co_trgt) AS co_trgt_total
FROM KPI_W.ktws.FCT_SALES_TARGET_DAILY
WHERE FORMAT(dateby, 'yyyyMM') = FORMAT(GETDATE(), 'yyyyMM')
GROUP BY dealer_key
ORDER BY co_trgt_total DESC`,
  },
  {
    id: 'e03', category: 'glossary', query: '이번달 HBOARD 몇 건 열렸어?',
    topic: 'CRM_영업활동_리드', db: 'KPI_W', table: 'dbo.SPM_HBOARD_MEETING',
    sql: `SELECT COUNT(*) AS hboard_meeting_cnt
FROM KPI_W.dbo.SPM_HBOARD_MEETING
WHERE LEFT(start_dt, 7) = FORMAT(GETDATE(), 'yyyy-MM')`,
    note: 'start_dt는 varchar(YYYY-MM-DD HH24:MI:SS) — LEFT(start_dt,7)로 문자열 비교. keywords엔 "해피보드"만 있고 영문 약어 "HBOARD"는 없음.',
  },
  {
    id: 'e04', category: 'glossary', query: 'FIRST_OWNER_YN이 Y인 차량 몇 대야?',
    topic: '차량_재고', db: 'LH_REFINED', table: 'dbo.CO_VEHIC',
    sql: `SELECT COUNT(*) AS first_owner_cnt
FROM LH_REFINED.dbo.CO_VEHIC
WHERE FIRST_OWNER_YN = 'Y'`,
    note: 'FIRST_OWNER_YN은 LH_REFINED.dbo.CO_VEHIC에만 있음(TMKR_W.dbo.CO_VEHIC엔 없음) — 잘못된 db를 고르면 컬럼이 없어 SQL 생성 단계에서 걸러져야 함.',
  },

  // --- trap / trap_glossary ---
  {
    id: 'e05', category: 'trap', query: '딜러별 계약 실적이 어떻게 돼?',
    topic: '계약_현황', db: 'TMKR_W', table: 'dbo.OM_CONTRACT',
    sql: `SELECT TOP 50 DEALER_ID, COUNT(*) AS contract_cnt
FROM TMKR_W.dbo.OM_CONTRACT
GROUP BY DEALER_ID
ORDER BY contract_cnt DESC`,
    note: 'index.yaml의 딜러_업체_마스터 topic 설명에 명시된 트랩 — "딜러별"이 있어도 실적 질문이면 계약_현황.',
  },
  {
    id: 'e06', category: 'trap_glossary', query: 'SHOP별 계약 건수 알려줘',
    topic: '계약_현황', db: 'TMKR_W', table: 'dbo.OM_CONTRACT',
    sql: `SELECT TOP 50 SHOP_CD, COUNT(*) AS contract_cnt
FROM TMKR_W.dbo.OM_CONTRACT
GROUP BY SHOP_CD
ORDER BY contract_cnt DESC`,
    note: '회귀 테스트 — glossary gl06(딜러 vs SHOP 정의)이 딜러_업체_마스터 쪽으로 잘못 편향시키지 않는지 확인. 실적 질문이므로 여전히 계약_현황이 정답.',
  },

  // --- coverage_gap: glossary로 용어는 알아도 topic 커버리지 밖 ---
  {
    id: 'e07', category: 'coverage_gap', query: 'SC별 이번달 상담 실적 좀 보여줘',
    topic: null, db: null, table: null, sql: null,
    note: 'CO_USERS(SC 정보)는 어느 topic에도 연결 안 됨 — reject_topic이 정상. glossary gl08이 "SC=영업사원"은 설명해도 라우팅 커버리지(21%)는 못 넘어야 함.',
  },
  {
    id: 'e08', category: 'coverage_gap', query: 'PDI 진행 중인 차량 몇 대나 있어?',
    topic: null, db: null, table: null, sql: null,
    note: 'VT_PDI_MASTER/VT_PDI_STEP은 RAG POC에서 이미 확인한 orphan 테이블 — reject_topic이 정상.',
  },

  // --- control: keywords로 이미 커버되는 회귀 확인용 ---
  {
    id: 'e09', category: 'control', query: '이번달 브랜드별 계약 건수 알려줘',
    topic: '계약_현황', db: 'TMKR_W', table: 'dbo.OM_CONTRACT',
    sql: `SELECT TOP 50 BRAND_CD, COUNT(*) AS contract_cnt
FROM TMKR_W.dbo.OM_CONTRACT
WHERE LEFT(CONTRACT_DT, 6) = FORMAT(GETDATE(), 'yyyyMM')
GROUP BY BRAND_CD
ORDER BY contract_cnt DESC`,
    note: 'CONTRACT_DT는 varchar(YYYYMMDD 추정) — LEFT(CONTRACT_DT,6)로 문자열 비교.',
  },
  {
    id: 'e10', category: 'control', query: '무상점검 잔여 쿠폰 있는 차량 중 CR 타겟인 애들 얼마나 돼?',
    topic: 'FMS_PMS_SMS_쿠폰', db: 'TMKR_W', table: 'dbo.SVC_CR_VEHIC',
    sql: `SELECT COUNT(DISTINCT VIN) AS remaining_cr_target_cnt
FROM TMKR_W.dbo.SVC_CR_VEHIC
WHERE EXEC_YN = 'N'`,
  },
  {
    id: 'e11', category: 'control', query: '딜러사 판매점 기본정보만 보여줘, 실적 말고',
    topic: '딜러_업체_마스터', db: 'KPI_W', table: 'dbo.CO_GROUP',
    sql: `SELECT TOP 50 group_id, group_name, biz_reg_no, dealer_yn, shop_yn, addr
FROM KPI_W.dbo.CO_GROUP
WHERE use_yn = 'Y'`,
  },
  {
    id: 'e12', category: 'control', query: '이번달 RO 처리 건수를 서비스센터별로 보여줘',
    topic: '정비_서비스_실적', db: 'LH_INTELLIGENCE_BI', table: 'dbo.FCT_SERVICE_REPAIR',
    sql: `SELECT TOP 50 SHOP_NAME, COUNT(*) AS ro_cnt
FROM LH_INTELLIGENCE_BI.dbo.FCT_SERVICE_REPAIR
WHERE FORMAT(RO_DATE, 'yyyyMM') = FORMAT(GETDATE(), 'yyyyMM')
GROUP BY SHOP_NAME
ORDER BY ro_cnt DESC`,
  },
]
