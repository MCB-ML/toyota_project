// Dummy data by department — will be replaced by real data in production

/* ─────────── 딜러 마스터 (계정 접근제어의 기준 키) ───────────
   dealerId: 딜러사 계정과 1:1로 매핑되는 키. 딜러사 계정은 본인 dealerId 행만 조회 가능.
   group: 계열사(딜러 운영사). 딜러사 계정은 본인 소속 계열사 외 데이터는 애초에 dealerId 필터로 걸러짐. */
export const dealerMaster = [
  { dealerId: 'GN01', dealer: '강남점', group: '센트럴모터스', brand: 'Lexus', region: '서울' },
  { dealerId: 'SM01', dealer: '상무점', group: '센트럴모터스', brand: 'Lexus', region: '광주' },
  { dealerId: 'BD01', dealer: '분당점', group: '경기모터스', brand: 'Toyota', region: '경기' },
  { dealerId: 'IS01', dealer: '일산점', group: '경기모터스', brand: 'Toyota', region: '경기' },
  { dealerId: 'SS01', dealer: '수성점', group: '영남모터스', brand: 'Toyota', region: '대구' },
  { dealerId: 'US01', dealer: '울산점', group: '영남모터스', brand: 'Lexus', region: '울산' },
  { dealerId: 'YS01', dealer: '연수점', group: '코스트모터스', brand: 'Toyota', region: '인천' },
  { dealerId: 'HD01', dealer: '해운대점', group: '코스트모터스', brand: 'Lexus', region: '부산' },
]

/* ─────────── HND_Sales: 계약/출고 관리 ─────────── */
export const contractMgmtDummy = {
  dealerTargetStatus: [
    { dealerId: 'GN01', dealer: '강남점', group: '센트럴모터스', brand: 'Lexus', target: 120, contract: 98, delivery: 87, risk: 'warning' },
    { dealerId: 'HD01', dealer: '해운대점', group: '코스트모터스', brand: 'Lexus', target: 80, contract: 49, delivery: 41, risk: 'danger' },
    { dealerId: 'SS01', dealer: '수성점', group: '영남모터스', brand: 'Toyota', target: 95, contract: 92, delivery: 88, risk: 'ok' },
    { dealerId: 'YS01', dealer: '연수점', group: '코스트모터스', brand: 'Toyota', target: 70, contract: 73, delivery: 65, risk: 'ok' },
    { dealerId: 'SM01', dealer: '상무점', group: '센트럴모터스', brand: 'Lexus', target: 60, contract: 51, delivery: 47, risk: 'warning' },
    { dealerId: 'BD01', dealer: '분당점', group: '경기모터스', brand: 'Toyota', target: 110, contract: 108, delivery: 102, risk: 'ok' },
    { dealerId: 'IS01', dealer: '일산점', group: '경기모터스', brand: 'Toyota', target: 75, contract: 44, delivery: 38, risk: 'danger' },
    { dealerId: 'US01', dealer: '울산점', group: '영남모터스', brand: 'Lexus', target: 50, contract: 48, delivery: 43, risk: 'ok' },
  ],
  /* 딜러사별 × SFX별 계약/출고 상세. dealerTargetStatus의 딜러별 합계와 정합. */
  dealerSfxDetail: [
    { dealerId: 'GN01', dealer: '강남점', group: '센트럴모터스', brand: 'Lexus', sfx: 'ES300h Luxury', model: 'ES', target: 70, contract: 60, delivery: 54, risk: 'warning' },
    { dealerId: 'GN01', dealer: '강남점', group: '센트럴모터스', brand: 'Lexus', sfx: 'NX350h AWD Luxury', model: 'NX', target: 50, contract: 38, delivery: 33, risk: 'warning' },

    { dealerId: 'HD01', dealer: '해운대점', group: '코스트모터스', brand: 'Lexus', sfx: 'LBX H AWD E-Four', model: 'LBX', target: 45, contract: 24, delivery: 19, risk: 'danger' },
    { dealerId: 'HD01', dealer: '해운대점', group: '코스트모터스', brand: 'Lexus', sfx: 'UX250h 2WD Base', model: 'UX', target: 35, contract: 25, delivery: 22, risk: 'warning' },

    { dealerId: 'SS01', dealer: '수성점', group: '영남모터스', brand: 'Toyota', sfx: 'RAV4 HV AWD', model: 'RAV4', target: 55, contract: 54, delivery: 52, risk: 'ok' },
    { dealerId: 'SS01', dealer: '수성점', group: '영남모터스', brand: 'Toyota', sfx: 'Camry HV 2.5', model: 'Camry', target: 40, contract: 38, delivery: 36, risk: 'ok' },

    { dealerId: 'YS01', dealer: '연수점', group: '코스트모터스', brand: 'Toyota', sfx: 'RAV4 HV AWD', model: 'RAV4', target: 40, contract: 42, delivery: 38, risk: 'ok' },
    { dealerId: 'YS01', dealer: '연수점', group: '코스트모터스', brand: 'Toyota', sfx: 'Camry HV 2.5', model: 'Camry', target: 30, contract: 31, delivery: 27, risk: 'ok' },

    { dealerId: 'SM01', dealer: '상무점', group: '센트럴모터스', brand: 'Lexus', sfx: 'ES300h Luxury', model: 'ES', target: 35, contract: 31, delivery: 29, risk: 'warning' },
    { dealerId: 'SM01', dealer: '상무점', group: '센트럴모터스', brand: 'Lexus', sfx: 'NX350h AWD Luxury', model: 'NX', target: 25, contract: 20, delivery: 18, risk: 'warning' },

    { dealerId: 'BD01', dealer: '분당점', group: '경기모터스', brand: 'Toyota', sfx: 'RAV4 HV AWD', model: 'RAV4', target: 65, contract: 64, delivery: 61, risk: 'ok' },
    { dealerId: 'BD01', dealer: '분당점', group: '경기모터스', brand: 'Toyota', sfx: 'Camry HV 2.5', model: 'Camry', target: 45, contract: 44, delivery: 41, risk: 'ok' },

    { dealerId: 'IS01', dealer: '일산점', group: '경기모터스', brand: 'Toyota', sfx: 'RAV4 HV AWD', model: 'RAV4', target: 45, contract: 28, delivery: 24, risk: 'danger' },
    { dealerId: 'IS01', dealer: '일산점', group: '경기모터스', brand: 'Toyota', sfx: 'Camry HV 2.5', model: 'Camry', target: 30, contract: 16, delivery: 14, risk: 'danger' },

    { dealerId: 'US01', dealer: '울산점', group: '영남모터스', brand: 'Lexus', sfx: 'ES300h Luxury', model: 'ES', target: 30, contract: 29, delivery: 26, risk: 'ok' },
    { dealerId: 'US01', dealer: '울산점', group: '영남모터스', brand: 'Lexus', sfx: 'NX350h AWD Luxury', model: 'NX', target: 20, contract: 19, delivery: 17, risk: 'ok' },
  ],
  monthlyContractTrend: [
    { month: '2024-01', contract: 3420, delivery: 3180 },
    { month: '2024-02', contract: 3210, delivery: 2980 },
    { month: '2024-03', contract: 3890, delivery: 3650 },
    { month: '2024-04', contract: 3750, delivery: 3510 },
    { month: '2024-05', contract: 4020, delivery: 3790 },
    { month: '2024-06', contract: 4310, delivery: 4080 },
    { month: '2024-07', contract: 4150, delivery: 3920 },
    { month: '2024-08', contract: 4480, delivery: 4210 },
    { month: '2024-09', contract: 4620, delivery: 4390 },
    { month: '2024-10', contract: 4780, delivery: 4520 },
    { month: '2024-11', contract: 4900, delivery: 4640 },
  ],
  trafficTrend: [
    { month: '2024-07', showroom: 2840, test_drive: 1120 },
    { month: '2024-08', showroom: 3010, test_drive: 1290 },
    { month: '2024-09', showroom: 3190, test_drive: 1380 },
    { month: '2024-10', showroom: 2980, test_drive: 1210 },
    { month: '2024-11', showroom: 3240, test_drive: 1440 },
  ],
  riskAlerts: [
    { dealerId: 'HD01', dealer: '해운대점', type: 'danger', msg: '목표 달성률 61% — 월말까지 31대 부족, 트래픽 16% 감소', daysLeft: 8 },
    { dealerId: 'IS01', dealer: '일산점', type: 'danger', msg: '목표 달성률 59% — 트래픽 최저, SFX 재고 부족 동반', daysLeft: 8 },
    { dealerId: 'GN01', dealer: '강남점', type: 'warning', msg: '목표 달성률 82% — 주말 캠페인 필요 (예측 달성: 91%)', daysLeft: 8 },
    { dealerId: 'SM01', dealer: '상무점', type: 'warning', msg: '목표 달성률 85% — 계약 후 출고 전환율 92% 정상', daysLeft: 8 },
  ],
}

/* ─────────── HND_Sales: 카드결제 관리 ─────────── */
export const paymentDummy = {
  monthlySummary: [
    { month: '2024-06', sales: 9820, card: 7640, ratio: 77.8 },
    { month: '2024-07', sales: 9450, card: 7210, ratio: 76.3 },
    { month: '2024-08', sales: 10120, card: 7980, ratio: 78.9 },
    { month: '2024-09', sales: 10540, card: 8340, ratio: 79.1 },
    { month: '2024-10', sales: 11200, card: 9010, ratio: 80.4 },
    { month: '2024-11', sales: 11850, card: 9620, ratio: 81.2 },
  ],
  cardCompanyBreakdown: [
    { company: '삼성카드', amount: 2840, fee_rate: 1.8, fee_amount: 51.1 },
    { company: '현대카드', amount: 2210, fee_rate: 1.9, fee_amount: 42.0 },
    { company: '신한카드', amount: 1980, fee_rate: 1.7, fee_amount: 33.7 },
    { company: 'KB카드', amount: 1560, fee_rate: 1.6, fee_amount: 25.0 },
    { company: 'NH카드', amount: 820, fee_rate: 2.1, fee_amount: 17.2 },
    { company: '롯데카드', amount: 210, fee_rate: 2.2, fee_amount: 4.6 },
  ],
  dealerCardUsage: [
    { dealer: '강남점', amount: 1840, ratio: 82.1, per_unit: 21.1 },
    { dealer: '분당점', amount: 1640, ratio: 80.4, per_unit: 16.1 },
    { dealer: '수성점', amount: 1210, ratio: 78.8, per_unit: 13.8 },
    { dealer: '연수점', amount: 980, ratio: 75.3, per_unit: 15.1 },
    { dealer: '해운대점', amount: 870, ratio: 74.6, per_unit: 17.8 },
    { dealer: '상무점', amount: 760, ratio: 73.1, per_unit: 16.2 },
    { dealer: '일산점', amount: 520, ratio: 70.2, per_unit: 13.7 },
    { dealer: '울산점', amount: 490, ratio: 72.4, per_unit: 11.4 },
  ],
}

/* ─────────── HND_Sales: KPI 분석 ─────────── */
export const kpiDealerDummy = {
  kpiItems: ['NPS', 'TCM', 'Trade-In', 'OP', 'AR', 'VC'],
  kpiDescriptions: {
    NPS: '고객 순추천지수',
    TCM: '고객 접점 관리',
    'Trade-In': '중고차 교환 비율',
    OP: '운영 성과',
    AR: '흡수율 (Absorption Rate)',
    VC: '차량 점검율',
  },
  targets: { NPS: 85, TCM: 80, 'Trade-In': 30, OP: 88, AR: 75, VC: 90 },
  dealerScores: [
    { dealer: '강남점', brand: 'Lexus', NPS: 82, TCM: 76, 'Trade-In': 28, OP: 88, AR: 71, VC: 91 },
    { dealer: '해운대점', brand: 'Lexus', NPS: 71, TCM: 68, 'Trade-In': 22, OP: 75, AR: 65, VC: 84 },
    { dealer: '수성점', brand: 'Toyota', NPS: 88, TCM: 81, 'Trade-In': 34, OP: 90, AR: 78, VC: 93 },
    { dealer: '연수점', brand: 'Toyota', NPS: 75, TCM: 72, 'Trade-In': 26, OP: 81, AR: 72, VC: 88 },
    { dealer: '상무점', brand: 'Lexus', NPS: 79, TCM: 77, 'Trade-In': 30, OP: 83, AR: 76, VC: 89 },
    { dealer: '분당점', brand: 'Toyota', NPS: 91, TCM: 85, 'Trade-In': 38, OP: 92, AR: 82, VC: 96 },
    { dealer: '일산점', brand: 'Toyota', NPS: 69, TCM: 65, 'Trade-In': 18, OP: 72, AR: 61, VC: 80 },
  ],
  quarterlyNps: [
    { quarter: 'Q1 24', lexus: 78, toyota: 71, target: 85 },
    { quarter: 'Q2 24', lexus: 81, toyota: 73, target: 85 },
    { quarter: 'Q3 24', lexus: 83, toyota: 75, target: 85 },
    { quarter: 'Q4 24 (예측)', lexus: 86, toyota: 78, target: 85 },
  ],
  yearEndForecast: {
    NPS: { current: 84, forecast: 86, target: 85 },
    TCM: { current: 78, forecast: 80, target: 80 },
    'Trade-In': { current: 29, forecast: 31, target: 30 },
    OP: { current: 87, forecast: 89, target: 88 },
    AR: { current: 73, forecast: 75, target: 75 },
    VC: { current: 91, forecast: 93, target: 90 },
  },
}

/* ─────────── FVD: VOC 분석 ─────────── */
export const fvdVocDummy = {
  npsMonthly: [
    { month: '2024-01', nps: 62, responses: 1240 },
    { month: '2024-02', nps: 64, responses: 1180 },
    { month: '2024-03', nps: 61, responses: 1310 },
    { month: '2024-04', nps: 65, responses: 1290 },
    { month: '2024-05', nps: 68, responses: 1420 },
    { month: '2024-06', nps: 67, responses: 1380 },
    { month: '2024-07', nps: 63, responses: 1450 },
    { month: '2024-08', nps: 66, responses: 1510 },
    { month: '2024-09', nps: 69, responses: 1490 },
    { month: '2024-10', nps: 70, responses: 1560 },
    { month: '2024-11', nps: 71, responses: 1620 },
  ],
  csiSsiQuarterly: [
    { quarter: 'Q1 2024', csi: 794, ssi: 781, csi_target: 800, ssi_target: 790 },
    { quarter: 'Q2 2024', csi: 802, ssi: 788, csi_target: 800, ssi_target: 790 },
    { quarter: 'Q3 2024', csi: 810, ssi: 795, csi_target: 800, ssi_target: 790 },
  ],
  categoryVoc: [
    { category: '서비스 대기시간', count: 2840, negative_rate: 62, priority: 'High' },
    { category: '서비스 품질', count: 3210, negative_rate: 18, priority: 'Low' },
    { category: '부품 수급 지연', count: 1560, negative_rate: 71, priority: 'High' },
    { category: '직원 응대', count: 2980, negative_rate: 14, priority: 'Low' },
    { category: '가격/비용', count: 2140, negative_rate: 55, priority: 'Medium' },
    { category: '쿠폰/프로모션', count: 1820, negative_rate: 38, priority: 'Medium' },
    { category: '시설 환경', count: 1340, negative_rate: 12, priority: 'Low' },
    { category: '예약 시스템', count: 1680, negative_rate: 44, priority: 'Medium' },
  ],
  topIssues: [
    { rank: 1, issue: '서비스 예약 후 2~3시간 대기', category: '서비스 대기시간', count: 412, change: +18 },
    { rank: 2, issue: '부품 수급 지연으로 수리 기간 길어짐', category: '부품 수급 지연', count: 389, change: +24 },
    { rank: 3, issue: 'FMS 쿠폰 만료 사전 안내 없음', category: '쿠폰/프로모션', count: 281, change: +12 },
    { rank: 4, issue: '수리비 예상 금액 초과', category: '가격/비용', count: 247, change: -8 },
    { rank: 5, issue: '전화 연결 지연', category: '예약 시스템', count: 198, change: +5 },
  ],
  improvementSuggestions: [
    { action: '예약 시스템 개선 및 대기시간 실시간 안내', impact: 'High', kpi: 'NPS +4~6', deadline: '2025 Q1' },
    { action: '부품 재고 사전 확보 프로세스 강화', impact: 'High', kpi: 'CSI +8~12', deadline: '2025 Q2' },
    { action: 'FMS 쿠폰 만료 D-60 자동 알림 발송', impact: 'Medium', kpi: 'CR +2~3%', deadline: '2024 Q4' },
    { action: '정비 견적 투명성 시스템 도입', impact: 'Medium', kpi: 'NPS +2~3', deadline: '2025 Q1' },
  ],
}

/* ─────────── FVD: 네트워크/PMA/CR ─────────── */
export const fvdNetworkDummy = {
  brandMarketShare: [
    { quarter: 'Q1 23', lexus: 1.8, toyota: 2.4, bmw: 5.2, benz: 6.1, audi: 3.1 },
    { quarter: 'Q2 23', lexus: 1.9, toyota: 2.5, bmw: 5.0, benz: 6.3, audi: 3.0 },
    { quarter: 'Q3 23', lexus: 2.0, toyota: 2.6, bmw: 4.9, benz: 6.1, audi: 2.9 },
    { quarter: 'Q4 23', lexus: 2.1, toyota: 2.7, bmw: 5.1, benz: 6.4, audi: 3.0 },
    { quarter: 'Q1 24', lexus: 2.0, toyota: 2.5, bmw: 5.3, benz: 6.2, audi: 2.8 },
    { quarter: 'Q2 24', lexus: 2.2, toyota: 2.8, bmw: 5.0, benz: 6.0, audi: 2.9 },
    { quarter: 'Q3 24', lexus: 2.3, toyota: 2.9, bmw: 4.8, benz: 5.9, audi: 2.7 },
  ],
  pmaDealerStatus: [
    { dealer: '강남점', region: '서울', pma_sales: 112, pma_in: 98, pma_out: 14, defense_rate: 87.5, attack_rate: 12.5 },
    { dealer: '분당점', region: '경기', pma_sales: 104, pma_in: 89, pma_out: 15, defense_rate: 85.6, attack_rate: 14.4 },
    { dealer: '수성점', region: '대구', pma_sales: 88, pma_in: 71, pma_out: 17, defense_rate: 80.7, attack_rate: 19.3 },
    { dealer: '연수점', region: '인천', pma_sales: 71, pma_in: 58, pma_out: 13, defense_rate: 81.7, attack_rate: 18.3 },
    { dealer: '해운대점', region: '부산', pma_sales: 95, pma_in: 74, pma_out: 21, defense_rate: 77.9, attack_rate: 22.1 },
    { dealer: '상무점', region: '광주', pma_sales: 58, pma_in: 43, pma_out: 15, defense_rate: 74.1, attack_rate: 25.9 },
    { dealer: '일산점', region: '경기', pma_sales: 67, pma_in: 49, pma_out: 18, defense_rate: 73.1, attack_rate: 26.9 },
    { dealer: '울산점', region: '울산', pma_sales: 44, pma_in: 31, pma_out: 13, defense_rate: 70.5, attack_rate: 29.5 },
  ],
  crMonthly: [
    { month: '2024-01', self_cr: 68.2, comp_cr: 31.8, target: 75 },
    { month: '2024-02', self_cr: 69.1, comp_cr: 30.9, target: 75 },
    { month: '2024-03', self_cr: 71.4, comp_cr: 28.6, target: 75 },
    { month: '2024-04', self_cr: 70.8, comp_cr: 29.2, target: 75 },
    { month: '2024-05', self_cr: 72.3, comp_cr: 27.7, target: 75 },
    { month: '2024-06', self_cr: 73.1, comp_cr: 26.9, target: 75 },
    { month: '2024-07', self_cr: 72.8, comp_cr: 27.2, target: 75 },
    { month: '2024-08', self_cr: 74.2, comp_cr: 25.8, target: 75 },
    { month: '2024-09', self_cr: 73.9, comp_cr: 26.1, target: 75 },
    { month: '2024-10', self_cr: 75.1, comp_cr: 24.9, target: 75 },
    { month: '2024-11', self_cr: 74.8, comp_cr: 25.2, target: 75 },
  ],
}

/* ─────────── FVD: 딜러 재무 (DLR FS) ─────────── */
export const fvdFinanceDummy = {
  dealerFsSummary: [
    { dealer: '강남점', revenue: 42800, cost: 38200, profit: 4600, margin: 10.7, health: 'good' },
    { dealer: '분당점', revenue: 38400, cost: 34100, profit: 4300, margin: 11.2, health: 'good' },
    { dealer: '수성점', revenue: 31200, cost: 28900, profit: 2300, margin: 7.4, health: 'warning' },
    { dealer: '연수점', revenue: 28600, cost: 26400, profit: 2200, margin: 7.7, health: 'warning' },
    { dealer: '해운대점', revenue: 34100, cost: 33200, profit: 900, margin: 2.6, health: 'danger' },
    { dealer: '상무점', revenue: 22800, cost: 20100, profit: 2700, margin: 11.8, health: 'good' },
    { dealer: '일산점', revenue: 25400, cost: 26100, profit: -700, margin: -2.8, health: 'danger' },
    { dealer: '울산점', revenue: 18200, cost: 16400, profit: 1800, margin: 9.9, health: 'good' },
  ],
  quarterlyTrend: [
    { quarter: 'Q1 24', avg_revenue: 30400, avg_cost: 27800, avg_profit: 2600 },
    { quarter: 'Q2 24', avg_revenue: 31200, avg_cost: 28400, avg_profit: 2800 },
    { quarter: 'Q3 24', avg_revenue: 32100, avg_cost: 29100, avg_profit: 3000 },
    { quarter: 'Q4 24 (예측)', avg_revenue: 33800, avg_cost: 30200, avg_profit: 3600 },
  ],
  revenueBreakdown: [
    { category: '신차 판매', value: 68.4 },
    { category: '중고차 판매', value: 9.2 },
    { category: '서비스/수리', value: 14.8 },
    { category: 'F&I (금융/보험)', value: 5.9 },
    { category: '기타', value: 1.7 },
  ],
}

/* ─────────── DSD: 계약/재고 매칭 ─────────── */
export const dsdStockDummy = {
  sfxContractRatio: [
    { sfx: 'LBX H AWD E-Four', contracts: 420, stock: 38, wait_days: 45, status: 'shortage' },
    { sfx: 'NX350h AWD Luxury', contracts: 380, stock: 52, wait_days: 31, status: 'ok' },
    { sfx: 'RX450h+ AWD Premium', contracts: 290, stock: 21, wait_days: 68, status: 'critical' },
    { sfx: 'UX250h 2WD Base', contracts: 240, stock: 67, wait_days: 12, status: 'surplus' },
    { sfx: 'ES300h Luxury', contracts: 310, stock: 44, wait_days: 28, status: 'ok' },
    { sfx: 'RAV4 HV AWD', contracts: 520, stock: 89, wait_days: 14, status: 'ok' },
    { sfx: 'Camry HV 2.5', contracts: 480, stock: 42, wait_days: 37, status: 'shortage' },
    { sfx: 'Crown Cross HV', contracts: 190, stock: 14, wait_days: 72, status: 'critical' },
  ],
  colorDistribution: [
    { color: '소닉 크리스탈', pct: 28.4 },
    { color: '소닉 실버', pct: 22.1 },
    { color: '블랙 노바', pct: 18.7 },
    { color: '화이트 펄', pct: 14.2 },
    { color: '딥 블루', pct: 8.9 },
    { color: '기타', pct: 7.7 },
  ],
  contractChangeTrend: [
    { month: '2024-06', changes: 84, sfx_change: 52, color_change: 32 },
    { month: '2024-07', changes: 91, sfx_change: 58, color_change: 33 },
    { month: '2024-08', changes: 78, sfx_change: 47, color_change: 31 },
    { month: '2024-09', changes: 103, sfx_change: 64, color_change: 39 },
    { month: '2024-10', changes: 95, sfx_change: 61, color_change: 34 },
    { month: '2024-11', changes: 112, sfx_change: 71, color_change: 41 },
  ],
}

/* ─────────── DSD: 일별 타겟 분배 ─────────── */
export const dsdTargetDummy = {
  dailyContractTrend: Array.from({ length: 30 }, (_, i) => {
    const d = new Date(2024, 10, i + 1)
    const isWeekend = d.getDay() === 0 || d.getDay() === 6
    const base = isWeekend ? 180 : 95
    const noise = Math.floor(Math.random() * 40) - 20
    return {
      day: `11/${String(i + 1).padStart(2, '0')}`,
      contract: Math.max(0, base + noise),
      delivery: Math.max(0, base - 20 + noise),
      target: isWeekend ? 170 : 90,
    }
  }),
  modelDailyTarget: [
    { model: 'Lexus NX', monthly: 380, daily_avg: 12.7, weekend_avg: 18.4, weekday_avg: 10.8 },
    { model: 'Lexus RX', monthly: 290, daily_avg: 9.7, weekend_avg: 14.2, weekday_avg: 8.2 },
    { model: 'Lexus UX', monthly: 210, daily_avg: 7.0, weekend_avg: 10.1, weekday_avg: 6.0 },
    { model: 'Lexus ES', monthly: 180, daily_avg: 6.0, weekend_avg: 8.8, weekday_avg: 5.1 },
    { model: 'Toyota RAV4', monthly: 520, daily_avg: 17.3, weekend_avg: 25.1, weekday_avg: 14.8 },
    { model: 'Toyota Camry', monthly: 480, daily_avg: 16.0, weekend_avg: 23.2, weekday_avg: 13.6 },
    { model: 'Toyota Crown', monthly: 190, daily_avg: 6.3, weekend_avg: 9.1, weekday_avg: 5.4 },
  ],
  automationStats: {
    total_monthly_target: 2250,
    auto_distributed: 2184,
    manual_adjusted: 66,
    accuracy_rate: 97.1,
    avg_deviation: 2.3,
  },
}
