// schema/glossary.js — KTWS DW(ktws 스키마) 22개 테이블에 반복 등장하는 업계 약어/코드를
// 풀어주는 도메인 용어집. classify_topic 프롬프트에 항상 통째로 붙는다
// (schemaLoader.renderGlossaryForPrompt) — 사용자가 업무 용어로 질문했을 때 topic 분류/SQL
// 생성이 엉뚱한 곳으로 새지 않도록 하는 게 목적.
// `id`는 rag-poc/의 4단계 파이프라인(pipeline.js stage4Glossary)이 임베딩 검색 결과를
// 식별할 때 사용 — glossary.js 자체는 검색/판단을 하지 않고 순수 데이터만 제공한다.
export const glossary = [
  { id: 'g01', term: 'SC / sc_key', definition: '영업사원(Sales Consultant). DIM_MNG_USER.sc_key로 식별되며, 대부분의 FCT 테이블(sc_key/cn_sc_key/cl_sc_key/mng_sc_key 등)이 이 값으로 담당자를 연결한다.' },
  { id: 'g02', term: '디멘전 / tp_key / DIM_CRM_ACT_TYPE', definition: '활동유형(act_tp) 코드를 연락/방문/소개 등 업무 상위 카테고리(tp_grp_1/tp_grp_2)로 묶는 분류 체계. CO_CODE 텍스트만으로는 재현되지 않으며 반드시 DIM_CRM_ACT_TYPE을 거쳐야 한다.' },
  { id: 'g03', term: '활동 건수 vs 실적 건수', definition: 'FCT_ACTIVITY_v2의 cnt(전체 활동 건수)와 actual_cnt(KPI상 실적으로 인정되는 건수)는 다르다. "실적"을 물으면 actual_cnt를 SUM해야 한다.' },
  { id: 'g04', term: 'HOT / 해피보드(HBOARD)', definition: '계약 가능성이 높다고 등록된 유망고객과 그 관리 미팅. FCT_HBOARD_MEETING(미팅+칩 단위)이 기준 테이블이며, contract_ratio가 계약확률을 나타낸다.' },
  { id: 'g05', term: '리드 / 영업기회 / 퍼널', definition: 'FCT_LEAD.lead_id 단위. 잠재고객이 접촉한 시점부터 계약 체결 전까지의 영업 단계 전체를 "퍼널"이라 부른다.' },
  { id: 'g06', term: '딜러 / 딜러사 / dealer_key', definition: 'DIM_MNG_DEALER.dealer_key로 식별되는 딜러(대리점). 회사 단위가 아니라 브랜드+지역의 개별 매장(dealer_nm)을 가리킨다 — 예: "렉서스 강남", "토요타 강남". 같은 지역명이 브랜드별로 중복될 수 있으므로(강남 → 렉서스/토요타 둘 다 존재), 지역명만으로는 특정 매장을 확정할 수 없고 브랜드까지 함께 지정해야 한다. DIM_MNG_USER/FCT_SALES_TARGET_DAILY 등이 이 값을 참조한다.' },
  { id: 'g07', term: '지점 / group_id / group_name', definition: 'DIM_MNG_USER의 group_id/group_name — SC가 소속된 개별 지점(전시장 단위)으로, 딜러(dealer_key)보다 한 단계 더 세부적인 조직 단위.' },
  { id: 'g08', term: 'ac_trgt vs co_trgt', definition: 'FCT_SALES_TARGET_DAILY의 ac_trgt=출고(딜리버리) 목표, co_trgt=계약 목표 — 이름만 보면 반대로 헷갈리기 쉬우니 주의.' },
  { id: 'g09', term: 'spec_key / var_key / mdl_key', definition: '차량 사양의 3단계 계층 키. mdl_key(모델) ⊂ var_key(모델+차종) ⊂ spec_key(모델+차종+연식+SFX). 필요한 세분화 수준에 맞는 DIM_VEHIC_SPEC* 테이블을 골라야 한다.' },
  { id: 'g10', term: 'NPS', definition: 'Net Promoter Score, 고객추천지수. FCT_NPS.promoter_score로 집계.' },
  { id: 'g11', term: 'PMA', definition: '등록주소 관내/관외(in/out) 구분. FCT_CONTRACT_KTWS.pma_yn ↔ DIM_PMA_ORDER.pma_cd로 조인해 분류명을 조회한다.' },
  { id: 'g12', term: '재구매 / repurc_yn / DIM_REPURC_SALES_TYPE', definition: '기존 고객이 다시 차량을 구매하는 것. FCT_LEAD.repurc_yn(리드 단계 재구매 여부)과 FCT_CONTRACT_KTWS.sales_tp_key(계약 단계 판매유형, DIM_REPURC_SALES_TYPE으로 그룹 조회)는 서로 다른 컬럼이다.' },
  { id: 'g13', term: 'BRAND / ETL_TIMESTAMP', definition: '거의 모든 ktws 테이블에 공통으로 붙는 컬럼. BRAND는 브랜드 구분(TOYOTA/LEXUS 등), ETL_TIMESTAMP는 업무일자가 아니라 데이터 적재 시각이다.' },
  { id: 'g14', term: '*_yn 컬럼', definition: "'Y'/'N' 또는 유사 플래그 문자열로 된 여부 컬럼(close_yn, use_yn, active_yn 등). 대부분 필터 조건으로만 쓰인다." },
  { id: 'g15', term: 'DIM_CALENDAR_KTWS.Date', definition: '거의 모든 FCT 테이블의 날짜 컬럼(act_dt_fr, contract_dt, daily_dt, monthly_dt, dateby, reply_date, meet_dt 등)이 조인하는 공통 날짜 차원. 연/월/분기/주차 그룹핑은 여기서 가져온다.' },
  { id: 'g16', term: 'lead_time', definition: 'FCT_CONTRACT_KTWS.lead_time — 최초 영업활동 시점부터 계약까지 걸린 기간(일). 평균을 구할 때 자주 쓰인다.' },
  { id: 'g17', term: 'contract_ratio', definition: 'FCT_HBOARD_MEETING.contract_ratio — 해피보드 미팅에서 논의된 HOT 고객의 계약 성사 가능성을 나타내는 값.' },
]

// 임베딩용 blurb — rag-poc/buildEmbeddings.js가 그대로 사용.
export function glossaryText(g) {
  return `${g.term}: ${g.definition}`
}
