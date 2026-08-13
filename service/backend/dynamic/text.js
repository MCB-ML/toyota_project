// 이름·값을 맞출 때 쓰는 문자열 정규화. dimensionValues.js의 norm()과 같은 규칙이다 —
// 한국어 조직명·분류값은 공백 한 칸으로 답이 통째로 갈리기 때문에 공백을 지우고 비교한다.

/** 공백 제거 + 소문자. 값 대조의 기준형. */
export function norm(s) {
  return String(s ?? '').replace(/\s+/g, '').toLowerCase()
}

// 검색 토큰. 한글은 형태소 분석 없이 2-gram으로 쪼갠다 — "접수유형"이 "접수"·"수유"·"유형"이
// 되어 컬럼 설명의 "접수"와 겹친다. 영문/숫자는 단어 단위(스네이크·캐멀 분해)로 둔다.
const LATIN = /[a-z0-9]+/g
const HANGUL = /[가-힣]+/g

export function tokenize(s) {
  const raw = String(s ?? '')
  const lower = raw.toLowerCase()
  const out = new Set()

  // camelCase / snake_case / 점 표기를 단어로 분해
  for (const m of lower.replace(/([a-z])([0-9])/g, '$1 $2').match(LATIN) || []) {
    if (m.length >= 2) out.add(m)
  }
  for (const m of raw.replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase().match(LATIN) || []) {
    if (m.length >= 2) out.add(m)
  }

  for (const chunk of raw.match(HANGUL) || []) {
    out.add(chunk)
    for (let i = 0; i + 2 <= chunk.length; i++) out.add(chunk.slice(i, i + 2))
  }
  return out
}

/** 토큰 겹침 비율(0~1). 질문 쪽 토큰이 문서에 얼마나 들어 있는가. */
export function overlap(queryTokens, docTokens) {
  if (!queryTokens.size) return 0
  let hit = 0
  for (const t of queryTokens) if (docTokens.has(t)) hit++
  return hit / queryTokens.size
}

/** 값 대조: 완전 일치인가. 공백만 다른 것은 같은 값으로 본다. */
export function valueEquals(a, b) {
  const na = norm(a)
  return na.length > 0 && na === norm(b)
}
