// 본사(hq) 계정은 전체 딜러 데이터를 조회할 수 있고,
// 딜러사(dealer) 계정은 본인 dealerId 행만 조회할 수 있다.
// 다른 딜러사·다른 계열사의 데이터는 이 필터를 거치면서 화면에 아예 내려가지 않는다.
export function filterByDealerAccess(rows, user, dealerKey = 'dealerId') {
  if (!user || user.role === 'hq') return rows
  return rows.filter(row => row[dealerKey] === user.dealerId)
}
