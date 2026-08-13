// "목표"/"실적"처럼 대상이 빠진 질문을 되묻는다.
//
// "2026년 4월 목표 알려줘"는 계약·출고·활동·기회 중 무엇인지 질문만으로 정할 수 없다.
// LLM에 맡기면 실행마다 다른 것을 골라(계약 목표 3,165 / 월 목표 관리 표) 사용자는
// 같은 질문에 다른 답을 받는다. 어느 쪽도 틀린 답은 아니지만, 무엇을 답했는지
// 알려주지 않은 채 하나를 고르는 게 문제다.
//
// 여기서 되묻는 것은 **업무 의미**가 갈리는 경우다. "목표"라고만 하면 활동 목표인지
// 계약 목표인지에 따라 답 자체가 달라진다.
//
// SC 표시 방식은 이와 다르다. 그건 출력 스키마(열을 낼지 말지)일 뿐 답의 의미를
// 바꾸지 않아서, 근거가 없으면 되묻지 않고 팀 단위 기본값으로 간다
// (reportIntent.js의 resolveScOptions 참고). 출력 스키마를 고르려고 사용자에게
// 업무 질문을 던지지 않는다.

// 되물을 대상이 되는 말. 앞에 무엇의 목표/실적인지가 없으면 성립하지 않는다.
const AMBIGUOUS_TERMS = ['목표', '실적']

// 이 말이 함께 있으면 대상이 정해진 것이다.
const QUALIFIERS = [
  '계약', '출고', '활동', '영업활동', '기회', '영업기회', '리드', '시승', '판매', '인도',
]

// 리포트/화면 이름이라 되물을 필요가 없는 표현. "목표 관리 표 보여줘"는 모호하지 않다.
const NAMED_SUBJECTS = [
  '목표 관리', '목표관리', '목표 저장', '목표저장', '판매 성취도', '성취도',
  '퍼널', '핫보드', '명세', '목록', '리스트', '내역', '현황표',
]

// 되물을 때 제안할 대상. 순서는 퍼널 흐름을 따른다.
const CANDIDATES = ['활동', '영업기회', '시승', '계약', '출고']

const norm = (text) => String(text || '').replace(/\s+/g, ' ').trim()

/**
 * @returns {{term: string, question: string, options: string[]}|null}
 *   null이면 모호하지 않다 — 평소대로 라우팅한다.
 */
export function detectAmbiguousSubject(message) {
  const text = norm(message)
  if (!text) return null

  // 이름이 붙은 화면/리포트를 물은 것이면 되묻지 않는다.
  const bare = text.replace(/\s/g, '')
  if (NAMED_SUBJECTS.some((s) => bare.includes(s.replace(/\s/g, '')))) return null

  const term = AMBIGUOUS_TERMS.find((t) => text.includes(t))
  if (!term) return null

  // 대상이 이미 있으면 모호하지 않다.
  if (QUALIFIERS.some((q) => text.includes(q))) return null

  // 원래 문장에서 그 말 앞에 대상만 끼워 넣는다 — 기간·필터가 그대로 유지된다.
  const options = CANDIDATES.map((subject) => text.replace(term, `${subject} ${term}`))

  // 받침에 따라 조사가 달라진다 — "목표을"이 아니라 "목표를"이다.
  const hasFinalConsonant = (word) => {
    const code = String(word).charCodeAt(word.length - 1) - 0xac00
    return code >= 0 && code <= 11171 && code % 28 !== 0
  }
  const objectParticle = hasFinalConsonant(term) ? '을' : '를'
  const subjectParticle = hasFinalConsonant(term) ? '이' : '가'

  return {
    term,
    question: `어떤 ${term}${objectParticle} 말씀하시는 건가요? `
      + `활동·영업기회·시승·계약·출고의 ${term}${subjectParticle} 각각 따로 있습니다.`,
    options,
  }
}
