// Structured few-shot bank, hand-extracted from schema/routing/*.md's own "## 예시"
// sections (11 topics have routing notes; HR_인사 has none yet — see that file's
// own comment that live queries aren't wired up, so no SQL example exists to lift).
// CRM_영업활동_리드 / 고객_마스터 also have no routing.md, same reason.
//
// `tables` lists every table the SQL actually touches (FROM + JOIN); `is_cross_table`
// is true iff that list has more than one entry — this is the flag Stage 2-b filters
// on. Only 2 of the 17 examples are cross-table (FMS_PMS_SMS_쿠폰's SVC_CR join,
// 날짜_캘린더's calendar+service join), which happens to match the diagram's
// cross_few_shot k=2 exactly.

export const fewShotSet = [
  {
    id: 'fs01', topic: '계약_현황', query_pattern: '브랜드별 계약 건수를 보여줘',
    tables: [{ db: 'LH_REFINED', id: 'dbo.OM_CONTRACT' }], is_cross_table: false,
    sql: `SELECT TOP 50 BRAND_CODE AS label, COUNT(*) AS cnt\nFROM dbo.OM_CONTRACT\nGROUP BY BRAND_CODE\nORDER BY cnt DESC`,
  },
  {
    id: 'fs02', topic: '계약_현황', query_pattern: '월별 계약 추이를 보여줘',
    tables: [{ db: 'KPI_W', id: 'ktws.FCT_CONTRACT_KTWS' }], is_cross_table: false,
    sql: `SELECT TOP 50 FORMAT(contract_dt, 'yyyy-MM') AS ym, COUNT(*) AS cnt\nFROM ktws.FCT_CONTRACT_KTWS\nGROUP BY FORMAT(contract_dt, 'yyyy-MM')\nORDER BY ym`,
  },
  {
    id: 'fs03', topic: 'FMS_PMS_SMS_쿠폰', query_pattern: '캠페인 타입별 실행 완료 건수를 보여줘',
    tables: [{ db: 'TMKR_W', id: 'dbo.SVC_CR_VEHIC' }, { db: 'TMKR_W', id: 'dbo.SVC_CR' }], is_cross_table: true,
    sql: `SELECT TOP 50 c.CR_TYPE AS label, COUNT(*) AS cnt\nFROM dbo.SVC_CR_VEHIC v\nJOIN dbo.SVC_CR c ON c.CR_NO = v.CR_NO\nWHERE v.EXEC_YN = 'Y'\nGROUP BY c.CR_TYPE\nORDER BY cnt DESC`,
  },
  {
    id: 'fs04', topic: '차량_재고', query_pattern: '브랜드별 등록 차량 대수를 보여줘',
    tables: [{ db: 'LH_REFINED', id: 'dbo.CO_VEHIC' }], is_cross_table: false,
    sql: `SELECT TOP 50 VEHICLE_BRAND_CODE AS label, COUNT(*) AS cnt\nFROM dbo.CO_VEHIC\nGROUP BY VEHICLE_BRAND_CODE\nORDER BY cnt DESC`,
  },
  {
    id: 'fs05', topic: '차량_재고', query_pattern: '최초 소유 차량 비율을 보여줘',
    tables: [{ db: 'LH_REFINED', id: 'dbo.CO_VEHIC' }], is_cross_table: false,
    sql: `SELECT TOP 1\n  SUM(CASE WHEN FIRST_OWNER_YN = 'Y' THEN 1 ELSE 0 END) AS 최초소유대수,\n  COUNT(*) AS 전체대수\nFROM dbo.CO_VEHIC`,
  },
  {
    id: 'fs06', topic: '정비_서비스_실적', query_pattern: '수리유형(BP/기능)별 입고 건수를 보여줘',
    tables: [{ db: 'LH_INTELLIGENCE_BI', id: 'dbo.FCT_SERVICE_REPAIR' }], is_cross_table: false,
    sql: `SELECT TOP 50 REPAIR_GROUP AS label, COUNT(*) AS cnt\nFROM dbo.FCT_SERVICE_REPAIR\nGROUP BY REPAIR_GROUP\nORDER BY cnt DESC`,
  },
  {
    id: 'fs07', topic: '정비_서비스_실적', query_pattern: '월별 BP 금액 추이를 보여줘',
    tables: [{ db: 'LH_INTELLIGENCE_BI', id: 'dbo.FCT_SERVICE_REPAIR' }], is_cross_table: false,
    sql: `SELECT TOP 50 FORMAT(RO_DATE, 'yyyy-MM') AS ym, SUM(BP_AMOUNT) AS bp_amt\nFROM dbo.FCT_SERVICE_REPAIR\nWHERE IS_BP_INCLUDE = 1\nGROUP BY FORMAT(RO_DATE, 'yyyy-MM')\nORDER BY ym`,
  },
  {
    id: 'fs08', topic: '딜러_업체_마스터', query_pattern: '딜러사 목록과 SHOP 여부를 보여줘',
    tables: [{ db: 'TMKR_L', id: 'dbo.co_group' }], is_cross_table: false,
    sql: `SELECT TOP 50 group_name, dealer_yn, shop_yn, group_type\nFROM dbo.co_group\nWHERE use_yn = 'Y'\nORDER BY group_name`,
  },
  {
    id: 'fs09', topic: '딜러_업체_마스터', query_pattern: '브랜드별 딜러 수를 보여줘',
    tables: [{ db: 'TMKR_L', id: 'dbo.co_group' }], is_cross_table: false,
    sql: `SELECT TOP 50 brand_cd AS label, COUNT(*) AS cnt\nFROM dbo.co_group\nWHERE use_yn = 'Y' AND dealer_yn = 'Y'\nGROUP BY brand_cd\nORDER BY cnt DESC`,
  },
  {
    id: 'fs10', topic: '딜러_재무', query_pattern: '딜러별 이번 달 총 매출을 보여줘',
    tables: [{ db: 'LH_INTELLIGENCE_BI', id: 'dbo.FCT_FINANCE_DEALER_ACCOUNT' }], is_cross_table: false,
    sql: `SELECT TOP 50 DEALER_NAME AS label, (SALES_GS + SALES_BP + SALES_PCS) AS total_sales\nFROM dbo.FCT_FINANCE_DEALER_ACCOUNT\nWHERE YEARMONTH = FORMAT(GETDATE(), 'yyyy-MM')\nGROUP BY DEALER_NAME, SALES_GS, SALES_BP, SALES_PCS\nORDER BY total_sales DESC`,
  },
  {
    id: 'fs11', topic: '딜러_재무', query_pattern: '월별 매출 추이를 보여줘',
    tables: [{ db: 'LH_INTELLIGENCE_BI', id: 'dbo.FCT_FINANCE_DEALER_ACCOUNT' }], is_cross_table: false,
    sql: `SELECT TOP 50 YEARMONTH AS ym, SUM(SALES_GS + SALES_BP + SALES_PCS) AS total_sales\nFROM dbo.FCT_FINANCE_DEALER_ACCOUNT\nGROUP BY YEARMONTH\nORDER BY ym`,
  },
  {
    id: 'fs12', topic: '모델_차종_마스터', query_pattern: '모델별 SFX(트림) 개수를 보여줘',
    tables: [{ db: 'TMKR_W', id: 'dbo.VS_SFX' }], is_cross_table: false,
    sql: `SELECT TOP 50 MODEL_NM AS label, COUNT(*) AS cnt\nFROM dbo.VS_SFX\nWHERE CURR_SALES_YN = 'Y'\nGROUP BY MODEL_NM\nORDER BY cnt DESC`,
  },
  {
    id: 'fs13', topic: '부품_재고_발주', query_pattern: '재고 수량이 많은 부품 TOP 10을 보여줘',
    tables: [{ db: 'TMKR_W', id: 'dbo.PT_STOCK' }], is_cross_table: false,
    sql: `SELECT TOP 10 PART_NO AS label, STOCK_QTY AS cnt\nFROM dbo.PT_STOCK\nORDER BY STOCK_QTY DESC`,
  },
  {
    id: 'fs14', topic: '부품_재고_발주', query_pattern: '발주 상태별 건수를 보여줘',
    tables: [{ db: 'KPI_W', id: 'dbo.PT_ORDER' }], is_cross_table: false,
    sql: `SELECT TOP 50 order_stat AS label, COUNT(*) AS cnt\nFROM dbo.PT_ORDER\nGROUP BY order_stat\nORDER BY cnt DESC`,
  },
  {
    id: 'fs15', topic: '판매_목표_달성률', query_pattern: '딜러별 이번 달 출고 목표 대비 실적을 보여줘',
    tables: [{ db: 'KPI_W', id: 'ktws.FCT_SALES_TARGET_DAILY' }], is_cross_table: false,
    sql: `SELECT TOP 50 dealer_key AS label, SUM(ac_trgt) AS target_cnt\nFROM ktws.FCT_SALES_TARGET_DAILY\nWHERE FORMAT(dateby, 'yyyy-MM') = FORMAT(GETDATE(), 'yyyy-MM')\nGROUP BY dealer_key\nORDER BY target_cnt DESC`,
  },
  {
    id: 'fs16', topic: '판매_목표_달성률', query_pattern: '딜러별 정비 매출 목표 금액을 보여줘',
    tables: [{ db: 'LH_REFINED', id: 'dbo.SVC_MONTHLY_SALES_TARGET' }], is_cross_table: false,
    sql: `SELECT TOP 50 DEALER_NAME AS label, SUM(TOTAL_AMOUNT) AS amt\nFROM dbo.SVC_MONTHLY_SALES_TARGET\nGROUP BY DEALER_NAME\nORDER BY amt DESC`,
  },
  {
    id: 'fs17', topic: '날짜_캘린더', query_pattern: '딜러 휴일을 제외한 이번 달 일별 입고 건수를 보여줘',
    tables: [{ db: 'LH_INTELLIGENCE_BI', id: 'dbo.DIM_CALENDAR' }, { db: 'LH_INTELLIGENCE_BI', id: 'dbo.FCT_SERVICE_REPAIR' }], is_cross_table: true,
    sql: `SELECT TOP 50 c.DATE AS d, COUNT(r.SERVICE_REPAIR_KEY) AS cnt\nFROM dbo.DIM_CALENDAR c\nLEFT JOIN dbo.FCT_SERVICE_REPAIR r ON r.RO_DATE = c.DATE\nWHERE c.YYYYMM = FORMAT(GETDATE(), 'yyyyMM') AND c.WORK_TYPE_DEALER = '근무일'\nGROUP BY c.DATE\nORDER BY d`,
  },
]

// Embeddable blurb per example — just the NL query pattern plus topic, since that's
// what a live user question should match against semantically.
export function fewShotText(fs) {
  return `주제: ${fs.topic}\n질문 패턴: ${fs.query_pattern}`
}
