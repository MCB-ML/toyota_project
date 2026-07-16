// "배포"(대시보드 커스텀 빌더에서 만든 저장본으로 좌측 탭의 기본 화면을 교체) 대상이 되는
// 탭 목록. AI 어시스턴트('/')와 빌더 자신(KTWS 대시보드 커스텀)은 배포 대상이 아니므로 제외.
// pageKey는 App.jsx의 DeployableTab 래핑과 1:1로 맞춰야 한다.
export const DEPLOY_TARGETS = [
  { pageKey: 'sales-contract', label: '계약/출고 관리' },
  { pageKey: 'sales-payment', label: '카드결제 관리' },
  { pageKey: 'sales-inventory', label: '재고관리' },
  { pageKey: 'sales-kpi', label: 'KPI 분석' },
  { pageKey: 'service-coupon', label: 'FMS 쿠폰관리' },
  { pageKey: 'fvd-voc', label: 'VOC 분석' },
  { pageKey: 'fvd-network', label: '네트워크/PMA' },
  { pageKey: 'fvd-finance', label: '딜러 재무' },
  { pageKey: 'dsd-stock', label: '계약/재고 매칭' },
  { pageKey: 'dsd-target', label: '일별 타겟 분배' },
  { pageKey: 'ktws-bi', label: 'BI' },
]

export function labelForPageKey(pageKey) {
  return DEPLOY_TARGETS.find(t => t.pageKey === pageKey)?.label ?? pageKey
}
