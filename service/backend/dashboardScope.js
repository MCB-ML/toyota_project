// scope_key ↔ company_info_id 변환.
//
// 서비스(에이전트)는 딜러사를 scope_key('dealer:렉서스 강남' | 'hq')로 다루고,
// 어드민 스키마(dbo)는 company_info_id(uuid)를 쓴다. 두 체계가 만나는 유일한 지점이
// dbo."ScopeCompany_map" 이고, 이 모듈이 그걸 감싼다.
//
// 여기서 흡수해두면 핸들러는 계속 scope_key 로만 말하면 되고, 나중에 키 체계가
// 바뀌어도 이 파일만 고치면 된다.
import { getPool } from './db.js'

// 딜러사는 20개 미만이고 거의 바뀌지 않는다. 매 요청 조회할 이유가 없어 캐시한다
// (어드민에서 딜러사를 추가하면 서버 재시작 시 반영된다).
let cache = null

async function load(db) {
  if (cache) return cache
  const { rows } = await db.query('SELECT scope_key, company_info_id FROM dbo."ScopeCompany_map"')
  cache = {
    toCompany: new Map(rows.map((r) => [r.scope_key, r.company_info_id])),
    toScope: new Map(rows.map((r) => [r.company_info_id, r.scope_key])),
  }
  return cache
}

export function resetScopeCache() {
  cache = null
}

// 매핑이 없으면 null 을 돌려준다. 호출부는 이걸 "권한 없음"으로 다뤄야 한다 —
// 기본 딜러사로 떨어뜨리면 남의 대시보드가 보인다.
export async function companyIdForScope(scopeKey, db = getPool()) {
  if (!scopeKey) return null
  return (await load(db)).toCompany.get(scopeKey) ?? null
}

export async function scopeForCompanyId(companyInfoId, db = getPool()) {
  if (!companyInfoId) return null
  return (await load(db)).toScope.get(companyInfoId) ?? null
}
