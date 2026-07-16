// Hand-written eval set for comparing classify_topic (schemaLoader.js's existing
// topic taxonomy) against table-level RAG retrieval. Ground truth is expressed at
// the table level (`tables`) since that's the unit RAG actually retrieves; `topic`
// is the correct bucket for the classify_topic approach, taken straight from
// schema/index.yaml. `primary` marks the single most-specific correct table, used
// for a stricter hit@1 metric (topic classification returns its whole table bundle
// regardless of top-1, so hit@1 there is really "is the bundle non-empty and right").
//
// Categories, by design:
//  - direct: phrasing echoes the topic's own `keywords` list closely
//  - synonym_gap: phrasing hits a *table-level* `syn` that the topic's keywords list
//    does not cover — tests whether RAG's broader semantic match beats a fixed keyword bucket
//  - trap: index.yaml explicitly warns the classifier about this confusion (see
//    딜러_업체_마스터's own description) — tests whether classify_topic's LLM step
//    actually reads and obeys that warning vs RAG naively matching on "딜러"
//  - fine_grained: query implies one specific table variant within a multi-table topic
//    (e.g. Karete's human-readable status vs Agora's raw codes) — topic classification
//    hands back the whole bundle either way, RAG can in principle rank the right one higher
//  - out_of_scope: nothing in the 203-table catalog should answer this; topic=null

export const evalQueries = [
  // --- direct ---
  { id: 'q01', category: 'direct', query: '이번달 브랜드별 계약 건수 알려줘',
    topic: '계약_현황', tables: [{ db: 'TMKR_W', id: 'dbo.OM_CONTRACT' }, { db: 'LH_REFINED', id: 'dbo.OM_CONTRACT' }, { db: 'KPI_W', id: 'ktws.FCT_CONTRACT_KTWS' }, { db: 'KPI_W', id: 'dbo.OM_CONTRACT' }],
    primary: { db: 'TMKR_W', id: 'dbo.OM_CONTRACT' } },
  { id: 'q02', category: 'direct', query: '브랜드별 등록 차량 현황이 어떻게 돼?',
    topic: '차량_재고', tables: [{ db: 'TMKR_W', id: 'dbo.CO_VEHIC' }, { db: 'LH_REFINED', id: 'dbo.CO_VEHIC' }, { db: 'KPI_W', id: 'dbo.VT_VEHIC_SUPPLY' }],
    primary: { db: 'TMKR_W', id: 'dbo.CO_VEHIC' } },
  { id: 'q03', category: 'direct', query: '이번달 RO(작업지시서) 처리 건수를 보여줘',
    topic: '정비_서비스_실적', tables: [{ db: 'TMKR_W', id: 'dbo.SVC_PROPO' }, { db: 'LH_INTELLIGENCE_BI', id: 'dbo.FCT_SERVICE_REPAIR' }],
    primary: { db: 'LH_INTELLIGENCE_BI', id: 'dbo.FCT_SERVICE_REPAIR' } },
  { id: 'q04', category: 'direct', query: '무상점검 쿠폰 잔여 대수가 얼마나 남았어?',
    topic: 'FMS_PMS_SMS_쿠폰', tables: [{ db: 'TMKR_W', id: 'dbo.SVC_CR' }, { db: 'TMKR_W', id: 'dbo.SVC_CR_VEHIC' }],
    primary: { db: 'TMKR_W', id: 'dbo.SVC_CR_VEHIC' } },
  { id: 'q05', category: 'direct', query: '딜러 그룹 마스터 정보(주소, 사업자번호)를 조회하고 싶어',
    topic: '딜러_업체_마스터', tables: [{ db: 'TMKR_L', id: 'dbo.co_group' }, { db: 'KPI_W', id: 'dbo.CO_GROUP' }],
    primary: { db: 'KPI_W', id: 'dbo.CO_GROUP' } },

  // --- synonym_gap: table-level `syn` covers it, topic `keywords` list doesn't ---
  { id: 'q06', category: 'synonym_gap', query: '차량 탁송(출고이동) 진행 상황을 알고 싶어',
    topic: '차량_재고', tables: [{ db: 'KPI_W', id: 'dbo.VT_VEHIC_SUPPLY' }, { db: 'TMKR_W', id: 'dbo.VT_VEHIC_MOVE' }, { db: 'TMKR_W', id: 'dbo.VT_VEHIC_SUPPLY' }],
    primary: { db: 'KPI_W', id: 'dbo.VT_VEHIC_SUPPLY' } },
  // q07-q09: CRM_영업활동_리드's own keywords list already contains these exact
  // terms (리드/잠재고객, NPS/고객만족도, 해피보드/미팅) — this is `direct`, not a
  // synonym gap. Kept as a topic-classification sanity check (13 topics exist in
  // index.yaml, not just the 11 with routing/*.md notes).
  { id: 'q07', category: 'direct', query: 'CRM 리드(잠재고객) 현황을 보고 싶어',
    topic: 'CRM_영업활동_리드', tables: [{ db: 'KPI_W', id: 'dbo.CRM_LEAD' }],
    primary: { db: 'KPI_W', id: 'dbo.CRM_LEAD' } },
  { id: 'q08', category: 'direct', query: 'NPS 고객만족도 설문 결과를 보여줘',
    topic: 'CRM_영업활동_리드', tables: [{ db: 'KPI_W', id: 'dbo.CO_NPS_RESULT' }],
    primary: { db: 'KPI_W', id: 'dbo.CO_NPS_RESULT' } },
  { id: 'q09', category: 'direct', query: '해피보드 미팅 상세 내역이 궁금해',
    topic: 'CRM_영업활동_리드', tables: [{ db: 'KPI_W', id: 'dbo.SPM_HBOARD_MEETING' }, { db: 'KPI_W', id: 'dbo.SPM_HBOARD_MEETING_CHIP' }],
    primary: { db: 'KPI_W', id: 'dbo.SPM_HBOARD_MEETING' } },

  // --- trap: index.yaml explicitly documents this confusion ---
  { id: 'q10', category: 'trap', query: '딜러별 계약 실적이 어떻게 돼?',
    topic: '계약_현황', tables: [{ db: 'TMKR_W', id: 'dbo.OM_CONTRACT' }, { db: 'LH_REFINED', id: 'dbo.OM_CONTRACT' }, { db: 'KPI_W', id: 'ktws.FCT_CONTRACT_KTWS' }, { db: 'KPI_W', id: 'dbo.OM_CONTRACT' }],
    primary: { db: 'TMKR_W', id: 'dbo.OM_CONTRACT' } },
  { id: 'q11', category: 'trap', query: '딜러사별 부품 재고 수량을 알려줘',
    topic: '부품_재고_발주', tables: [{ db: 'TMKR_W', id: 'dbo.PT_STOCK' }, { db: 'KPI_W', id: 'dbo.PT_STOCK' }],
    primary: { db: 'KPI_W', id: 'dbo.PT_STOCK' } },

  // --- fine_grained: one specific table variant within a multi-table topic ---
  { id: 'q12', category: 'fine_grained', query: 'Karete 쪽 계약 상태명을 한글 텍스트로 보고 싶어 (코드 말고)',
    topic: '계약_현황', tables: [{ db: 'LH_REFINED', id: 'dbo.OM_CONTRACT' }],
    primary: { db: 'LH_REFINED', id: 'dbo.OM_CONTRACT' } },
  { id: 'q13', category: 'fine_grained', query: 'KTWS BI 대시보드용 계약 팩트 테이블이 필요해',
    topic: '계약_현황', tables: [{ db: 'KPI_W', id: 'ktws.FCT_CONTRACT_KTWS' }],
    primary: { db: 'KPI_W', id: 'ktws.FCT_CONTRACT_KTWS' } },

  // --- more direct-ish coverage across remaining topics ---
  { id: 'q14', category: 'direct', query: '모델별 세부 트림(SFX) 종류를 알려줘',
    topic: '모델_차종_마스터', tables: [{ db: 'TMKR_W', id: 'dbo.VS_SFX' }, { db: 'KPI_W', id: 'dbo.VS_SFX' }],
    primary: { db: 'KPI_W', id: 'dbo.VS_SFX' } },
  { id: 'q15', category: 'direct', query: '이번달 판매 목표 대비 달성률을 보여줘',
    topic: '판매_목표_달성률', tables: [{ db: 'KPI_W', id: 'ktws.FCT_SALES_TARGET_DAILY' }, { db: 'LH_INTELLIGENCE_BI', id: 'dbo.FCT_SERVICE_TARGET' }],
    primary: { db: 'KPI_W', id: 'ktws.FCT_SALES_TARGET_DAILY' } },
  { id: 'q16', category: 'direct', query: '딜러사 재무제표(매출/손익) 정보를 조회하고 싶어',
    topic: '딜러_재무', tables: [{ db: 'LH_INTELLIGENCE_BI', id: 'dbo.FCT_FINANCE_DEALER_ACCOUNT' }],
    primary: { db: 'LH_INTELLIGENCE_BI', id: 'dbo.FCT_FINANCE_DEALER_ACCOUNT' } },
  { id: 'q17', category: 'direct', query: '이번 분기 영업일수가 며칠인지 캘린더로 확인하고 싶어',
    topic: '날짜_캘린더', tables: [{ db: 'LH_INTELLIGENCE_BI', id: 'dbo.DIM_CALENDAR' }, { db: 'KPI_W', id: 'ktws.DIM_CALENDAR' }],
    primary: { db: 'KPI_W', id: 'ktws.DIM_CALENDAR' } },
  { id: 'q18', category: 'direct', query: '부품 발주 대비 백오더(입고 지연) 현황을 보고 싶어',
    topic: '부품_재고_발주', tables: [{ db: 'KPI_W', id: 'dbo.PT_ORDER_BO' }, { db: 'KPI_W', id: 'bpk.BP_SVC_BACKORDER' }],
    primary: { db: 'KPI_W', id: 'dbo.PT_ORDER_BO' } },
  { id: 'q19', category: 'direct', query: '직원 근태(휴가/연차) 현황을 확인하고 싶어',
    topic: 'HR_인사', tables: [{ db: 'HR_Warehouse', id: 'WORK_CLDR' }, { db: 'HR_Lakehouse', id: 'dalit_cldr' }],
    primary: { db: 'HR_Warehouse', id: 'WORK_CLDR' } },

  // --- synonym_gap / niche tables less likely to be in any topic's keyword list ---
  { id: 'q20', category: 'synonym_gap', query: '시승 예약 신청 내역을 보고 싶어',
    topic: null, tables: [{ db: 'TMKR_W', id: 'dbo.SFA_TESTCAR_TRIAL' }],
    primary: { db: 'TMKR_W', id: 'dbo.SFA_TESTCAR_TRIAL' } },
  { id: 'q21', category: 'synonym_gap', query: '관용차(공용차량) 운영 현황을 알려줘',
    topic: null, tables: [{ db: 'LH_INTELLIGENCE_BI', id: 'dbo.FCT_PUBLIC_VEHICLE' }],
    primary: { db: 'LH_INTELLIGENCE_BI', id: 'dbo.FCT_PUBLIC_VEHICLE' } },
  { id: 'q22', category: 'synonym_gap', query: 'PDI(출고전점검) 공정 단계별 진행 상황을 보고 싶어',
    topic: null, tables: [{ db: 'TMKR_W', id: 'dbo.VT_PDI_MASTER' }, { db: 'TMKR_W', id: 'dbo.VT_PDI_STEP' }],
    primary: { db: 'TMKR_W', id: 'dbo.VT_PDI_MASTER' } },

  // --- out_of_scope: neither approach should confidently retrieve anything ---
  { id: 'q23', category: 'out_of_scope', query: '오늘 서울 날씨 어때?', topic: null, tables: [], primary: null },
  { id: 'q24', category: 'out_of_scope', query: '토요타 자동차 미국 주가가 얼마야?', topic: null, tables: [], primary: null },
  { id: 'q25', category: 'out_of_scope', query: '타이어 펑크났을 때 보증 규정이 어떻게 되는지 설명해줘', topic: null, tables: [], primary: null },
]
