// 출력 단위(output grain) — "월별"은 기간이 아니라 **단위**다.
//
// 연/월/일별은 "얼마나 잘게 나눠 볼 것인가"를 말한다. 기간("7월", "올해")과 독립이다.
// 둘을 섞으면 "월별 계약"이 당월 한 달만 묶은 1행이 되어, 요구한 추이가 조용히 사라진다.
//
// 단위를 뽑는 일은 이미 semantic/requirement.js가 정규식으로 하고 있다. 이 파일은
// 그 결과를 **코드가 쓸 수 있는 형태**로 옮긴다 — 어느 축으로 묶을지, 그 기간에
// 몇 칸이 나오는지, 칸이 하나뿐이면 어디까지 넓혀야 하는지.
//
// 축을 LLM의 group_by 자유 텍스트에 맡기지 않는 것이 요점이다. 같은 질문에 모델이
// '월'이라 쓰면 되고 '계약일'이라 쓰면 축이 조용히 사라졌다(2026-08-12 실측).

export const GRAIN = { YEAR: 'year', MONTH: 'month', DAY: 'day' }

/** 단위 → 등록 차원 id. dimensions.yaml의 derive_grain 차원과 1:1이다. */
export const GRAIN_DIMENSION = {
  [GRAIN.YEAR]: 'time_year',
  [GRAIN.MONTH]: 'time_month',
  [GRAIN.DAY]: 'time_day',
}

/** 단위 → 사람이 쓰는 축 이름. group_by에 이 말을 넣으면 위 차원으로 풀린다. */
export const GRAIN_CONCEPT = {
  [GRAIN.YEAR]: '연도',
  [GRAIN.MONTH]: '월',
  [GRAIN.DAY]: '일자',
}

export const GRAIN_LABEL = {
  [GRAIN.YEAR]: '연도별',
  [GRAIN.MONTH]: '월별',
  [GRAIN.DAY]: '일별',
}

// 이 말들이 축으로 오면 단위를 뜻한 것이다. 등록 차원 별칭(dimensions.yaml)과 같은 집합.
const GRAIN_WORDS = {
  [GRAIN.YEAR]: ['연도', '연', '년', '연도별', '년도별', 'year'],
  [GRAIN.MONTH]: ['월', '월별', '달', '달별', 'yearmonth', 'month'],
  [GRAIN.DAY]: ['일', '일자', '일별', '날짜', 'date', 'day'],
}

const norm = (s) => String(s ?? '').replace(/\s+/g, '').toLowerCase()

/** 이 말이 단위 축인가. 맞으면 어느 단위인지 돌려준다. */
export function grainOfConcept(concept) {
  const n = norm(concept)
  if (!n) return null
  for (const [grain, words] of Object.entries(GRAIN_WORDS)) {
    if (words.some((w) => norm(w) === n)) return grain
  }
  return null
}

/**
 * 기간을 이 단위로 나누면 몇 칸인가.
 *
 * 1이면 단위를 요구한 의미가 없다 — "월별"인데 한 달만 보면 묶어도 한 줄이다.
 */
export function bucketCount(grain, start, end) {
  if (!start || !end) return null
  const a = new Date(`${start}T00:00:00Z`)
  const b = new Date(`${end}T00:00:00Z`)
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime()) || b < a) return null
  if (grain === GRAIN.DAY) return Math.floor((b - a) / 86400000) + 1
  if (grain === GRAIN.MONTH) {
    return (b.getUTCFullYear() - a.getUTCFullYear()) * 12 + (b.getUTCMonth() - a.getUTCMonth()) + 1
  }
  if (grain === GRAIN.YEAR) return b.getUTCFullYear() - a.getUTCFullYear() + 1
  return null
}

/**
 * 칸이 하나뿐일 때 어디까지 넓힐 것인가.
 *
 * 임의로 넓히지 않는다 — 질문에 연도가 있으면 그 해 전체, 없으면 지금 있는 기간이
 * 속한 해의 연초부터 그 기간 끝까지다(연누적과 같은 폭). 기존 경로의
 * widenTimeRangeForTrend와 같은 취지이고, 넓혔다는 사실은 호출부가 남긴다.
 *
 * @returns {{start, end, reason}|null} 넓힐 필요가 없으면 null
 */
export function widenForGrain(grain, { start, end }, { today, question } = {}) {
  const count = bucketCount(grain, start, end)
  if (count == null || count > 1) return null

  const named = String(question || '').match(/(20\d{2})\s*년/)
  if (named) {
    const y = named[1]
    return {
      start: `${y}-01-01`,
      end: `${y}-12-31`,
      reason: `${GRAIN_LABEL[grain]}을 요구했는데 기간이 ${count}칸뿐이라 질문에 있는 ${y}년 전체로 넓혔습니다.`,
    }
  }

  const base = end || today
  if (!base) return null
  const year = base.slice(0, 4)
  if (`${year}-01-01` === start) return null   // 이미 연초부터다 — 더 넓힐 근거가 없다
  return {
    start: `${year}-01-01`,
    end: base,
    reason: `${GRAIN_LABEL[grain]}을 요구했는데 기간이 ${count}칸뿐이라 ${year}년 연초부터로 넓혔습니다.`,
  }
}

/** 날짜 셀을 이 단위의 칸 이름으로. 저장된 그대로의 ISO 문자열을 자른다. */
export function bucketOf(grain, isoDate) {
  if (!isoDate) return null
  if (grain === GRAIN.YEAR) return isoDate.slice(0, 4)
  if (grain === GRAIN.MONTH) return isoDate.slice(0, 7)
  return isoDate.slice(0, 10)
}
