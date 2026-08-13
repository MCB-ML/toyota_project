import { dealerMaster } from '../data/dummy'

// AI365 로그인 응답 → 대시보드 딜러 접근 범위 매핑 계층.
//
// ── 딜러 식별 기준: name(부서명) ──
// 현재 API는 부서/권한을 따로 안 내려주므로, 로그인 시 확실히 받아오는 name 필드에
// 부서명(DEALER_NM: '토요타 강남', '렉서스 광주', 'TMKR', 'Admin' …)을 담아 사용한다.
// 이 값으로 SelectAccount의 딜러 목록을 필터링한다.
//   - TMKR / Admin        → 전체 딜러 + 본사 옵션
//   - 특정 딜러명(예: 렉서스 광주) → 그 딜러 하나만, 본사 옵션 없음
//   - 값 없음 / 미매칭      → 전체 딜러 + 본사 옵션(수동 선택, 잠금 방지 폴백)
//
// ※ department 필드가 실제로 실리기 시작하면 그 값을 우선 사용(getDealerKey) — 앞으로도 호환.

// 로그인 응답에서 딜러 식별자로 쓸 값(부서명). department 우선, 없으면 name.
export function getDealerKey(session) {
  if (!session) return ''
  const scopeKey = String(session.scopeKey || '').trim()
  const normalizedScopeKey = norm(scopeKey)
  if (normalizedScopeKey === 'hq') return 'hq'
  if (normalizedScopeKey.startsWith('dealer:')) {
    return scopeKey.slice(scopeKey.indexOf(':') + 1).trim()
  }
  return String(session.department || session.defaultCompanyName || session.name || '').trim()
}

// 공백/대소문자 차이를 흡수해 비교(예: '토요타  강남' vs '토요타 강남')
function norm(v) {
  return String(v ?? '').trim().replace(/\s+/g, ' ').toLowerCase()
}

// 전체 딜러(본사) 권한을 뜻하는 부서명
const HQ_KEYS = ['hq', 'tmkr', 'admin', '본사']

export function isHqKey(key) {
  return HQ_KEYS.includes(norm(key))
}

// 부서명(name) 기준으로 SelectAccount에 노출할 딜러 목록/본사 옵션/미등록 여부를 결정.
// 반환: { showHq, dealers, unmatched }
//   - unmatched=true → 부서명이 등록된 딜러와 매칭 안 됨. 절대 전체 권한으로 폴백하지 않고
//     빈 목록 + 안내를 띄운다(등록되지 않은 딜러사).
export function resolveVisibleDealers(session, dealers = dealerMaster) {
  const key = getDealerKey(session)

  // 부서명이 아예 없으면(MSAL 로그인 등) 전체 노출 + 본사 옵션 — 기존 수동 선택 흐름
  if (!key) {
    return { showHq: true, dealers, unmatched: false }
  }

  // 본사 권한(TMKR/Admin) → 전체 노출 + 본사 옵션
  if (isHqKey(key)) {
    return { showHq: true, dealers, unmatched: false }
  }

  // 특정 딜러명이면 그 딜러만
  const matched = dealers.filter((d) => norm(d.dealer) === norm(key))
  if (matched.length > 0) {
    return { showHq: false, dealers: matched, unmatched: false }
  }

  // 등록되지 않은 딜러명 → 선택지 없음. 전체 권한으로 폴백하지 않는다(보안).
  return { showHq: false, dealers: [], unmatched: true }
}
