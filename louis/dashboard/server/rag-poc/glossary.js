// Minimal glossary bootstrap — no dedicated business-term dictionary exists in the
// repo yet (checked louis/docs/정의서/ and schema/routing/*.md). Every entry here is
// lifted from an existing source (a column's `ko` text, a routing note, or
// fabricClient.js's DB_TO_SYSTEM map) — nothing invented. Stage 4 searches this
// with no table filter, since business terms cut across tables/topics.

export const glossary = [
  {
    id: 'gl01', term: '계약 상태 코드 (CONTRACT_STAT_CD)',
    definition: 'TMKR_W.dbo.OM_CONTRACT의 2글자 상태코드: C1=계약 C2=계약요청 C3=계약반려 C4=계약승인 A1=배정요청 A2=배정확정 D1=출고요청 D2=출고반려 D3=출고승인 D4=출고완료 S1=매출취소요청 S2=매출취소반려 M1=계약취소요청 M2=계약취소반려 M3=계약변경요청 M4=계약변경반려 MX=계약취소(무효) MZ=계약취소. LH_REFINED.dbo.OM_CONTRACT의 CONTRACT_STAT_NAME은 이미 한글 텍스트라 이 코드를 몰라도 됨.',
    source: 'TMKR_W__dbo.OM_CONTRACT.yaml col CONTRACT_STAT_CD',
  },
  {
    id: 'gl02', term: 'FMS / PMS / SMS 쿠폰',
    definition: '무상점검(FMS) / 연장점검(PMS) / 스마트점검(SMS) — 차량에 부여되는 정비 쿠폰 종류. 잔여 쿠폰/CR 타겟 차량 조회는 dbo.SVC_CR / dbo.SVC_CR_VEHIC 테이블 담당.',
    source: 'schema/index.yaml topic FMS_PMS_SMS_쿠폰',
  },
  {
    id: 'gl03', term: 'CR (캠페인/리콜)',
    definition: 'Campaign/Recall의 약자. dbo.SVC_CR이 "캠페인이 무엇인지"(CR_NO, CR_NM, CR_TYPE), dbo.SVC_CR_VEHIC이 "그 캠페인이 특정 차량(VIN)에 실행됐는지"(EXEC_YN)를 담당.',
    source: 'schema/routing/FMS_PMS_SMS_쿠폰.md',
  },
  {
    id: 'gl04', term: 'RO (작업지시서/Repair Order)',
    definition: '정비/서비스 입고 건 단위의 작업지시서. LH_INTELLIGENCE_BI.dbo.FCT_SERVICE_REPAIR의 RO_DATE/RO_STATUS 등이 RO 단위 실적 컬럼.',
    source: 'schema/index.yaml topic 정비_서비스_실적',
  },
  {
    id: 'gl05', term: 'ac_trgt / co_trgt (판매 목표 컬럼)',
    definition: 'KPI_W.ktws.FCT_SALES_TARGET_DAILY 컬럼. ac_trgt=출고(딜리버리) 목표, co_trgt=계약 목표 — 컬럼명(ac/co)만 보면 반대로 느껴지지만 실제로는 이 매핑이 맞음 (ML 설계문서 가정과 반대).',
    source: 'schema/routing/판매_목표_달성률.md, [[project-sales-target-columns]]',
  },
  {
    id: 'gl06', term: '딜러 vs SHOP',
    definition: 'TMKR_L.dbo.co_group의 DEALER_YN/SHOP_YN 플래그로 구분되는 서로 다른 사업소 유형. "딜러사"와 "판매점(SHOP)"은 동일 그룹 마스터 안에서도 별개 속성.',
    source: 'schema/routing/딜러_업체_마스터.md',
  },
  {
    id: 'gl07', term: 'FIRST_OWNER_YN (최초소유여부)',
    definition: '차량이 신차 등록(최초 소유주) 상태인지 나타내는 플래그. LH_REFINED.dbo.CO_VEHIC에만 있고 TMKR_W.dbo.CO_VEHIC에는 이 컬럼이 없음.',
    source: 'schema/routing/차량_재고.md',
  },
  {
    id: 'gl08', term: 'SC (Sales Consultant)',
    definition: '판매 상담을 담당하는 딜러사 소속 영업사원. CO_USERS/USER_ID 등 계약·CRM 테이블에서 담당자 식별에 쓰임.',
    source: 'schema index.yaml CO_USERS synonyms',
  },
  {
    id: 'gl09', term: 'CRM 리드 (영업기회)',
    definition: '잠재고객 단위의 영업 기회. dbo.CRM_LEAD가 lead_id 단위 리드 정보를 담고, contract_no로 실제 계약 성사 여부와 연결됨.',
    source: 'schema/index.yaml topic CRM_영업활동_리드',
  },
  {
    id: 'gl10', term: '해피보드(HBOARD) 미팅',
    definition: '영업 조직의 정기 실적/전략 점검 미팅. dbo.SPM_HBOARD_MEETING이 미팅 기본 정보, dbo.SPM_HBOARD_MEETING_CHIP이 미팅 내 세부 선택항목(칩) 정보.',
    source: 'schema/index.yaml topic CRM_영업활동_리드',
  },
  {
    id: 'gl11', term: 'PDI (출고전점검)',
    definition: '차량이 항구에 입항(BUSAN-IN)한 뒤 출고 전 거치는 점검 공정. dbo.VT_PDI_MASTER가 차량 단위 정보, dbo.VT_PDI_STEP이 공정 단계 정보.',
    source: 'schema index.yaml VT_PDI_MASTER/VT_PDI_STEP synonyms',
  },
  {
    id: 'gl12', term: 'Agora / Karete / BP_KTWS (소스 시스템)',
    definition: '이 프로젝트가 연결하는 3개 Fabric 데이터웨어하우스 계열. Agora=원천(TMKR_L/TMKR_W 등), Karete=정제 레이어(LH_REFINED/LH_INTELLIGENCE_BI/LH_INTELLIGENCE_ML/LH_META), BP_KTWS=KTWS BI 전용(KPI_L/KPI_W). 서로 다른 계열의 테이블은 한 쿼리에서 조인 불가.',
    source: 'server/fabricClient.js DB_TO_SYSTEM',
  },
]

export function glossaryText(g) {
  return `용어: ${g.term}\n설명: ${g.definition}`
}
