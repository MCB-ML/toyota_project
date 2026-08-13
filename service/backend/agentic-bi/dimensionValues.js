// 사용자가 말한 이름을 데이터에 실제로 있는 값으로 맞춰 준다.
//
// 두 가지가 계속 문제였다:
//   1. 브랜드를 뗀 이름 — "동대문 전시장"이라고 하면 group_name에 "동대문"이 들어가는데
//      실제 값은 "토요타 동대문"이라 오류 없이 0건이 된다.
//   2. 끝 공백 — 실제 값이 '토요타 동대문 '이라 정확 일치로는 못 찾는다.
// 여기서 실제 값 목록과 맞춰 정본 이름(공백 제거본)으로 바꾼다.
//
// 후보가 여럿이면("강남" → 렉서스 강남 / 토요타 강남) 임의로 고르지 않고 되묻는다 —
// 하나를 골라 답하면 사용자는 다른 매장 숫자를 보게 된다.
import { queryFabricWithTimeout } from '../fabricClient.js'
import { loadRegistry } from './app/semantic/registry.js'

const DB = 'KPI_W'
const TTL_MS = 30 * 60 * 1000   // 조직 이름은 자주 안 바뀐다

// 시맨틱 차원 id → 실제 값을 읽어올 곳.
export const VALUE_SOURCES = {
  dealer: { sql: 'SELECT DISTINCT dealer_nm AS v FROM ktws.DIM_MNG_DEALER WHERE dealer_nm IS NOT NULL', label: '딜러' },
  showroom: { sql: 'SELECT DISTINCT group_name AS v FROM ktws.DIM_MNG_USER WHERE group_name IS NOT NULL', label: '전시장' },
  department: { sql: 'SELECT DISTINCT dept_nm AS v FROM ktws.DIM_MNG_USER WHERE dept_nm IS NOT NULL', label: '팀' },
  sales_consultant: { sql: 'SELECT DISTINCT name AS v FROM ktws.DIM_MNG_USER WHERE name IS NOT NULL', label: 'SC' },
}

const cache = new Map()   // dimension -> { at, values: string[] }

export function clearDimensionValueCache() { cache.clear() }

/**
 * 그 차원의 정본 값 목록.
 *
 * 조직 차원은 DB에서 읽고(사람이 드나들어 자주 바뀐다), 활동유형처럼 분류 체계인
 * 차원은 dimensions.yaml의 known_values를 쓴다 — 이미 라이브 DISTINCT로 채워 둔
 * 실측값이라 다시 조회할 이유가 없다.
 */
function declaredValues(dimension) {
  try {
    const values = loadRegistry().dimensions.get(dimension)?.known_values
    return Array.isArray(values) && values.length ? values.map((v) => String(v).trim()) : null
  } catch { return null }
}

/** 되묻는 문장에 쓸 이름. VALUE_SOURCES에 없으면 차원 선언의 label_ko를 쓴다. */
function labelOf(dimension) {
  if (VALUE_SOURCES[dimension]) return VALUE_SOURCES[dimension].label
  try { return loadRegistry().dimensions.get(dimension)?.label_ko || dimension } catch { return dimension }
}

async function knownValues(dimension) {
  const source = VALUE_SOURCES[dimension]
  if (!source) return declaredValues(dimension)
  const hit = cache.get(dimension)
  if (hit && Date.now() - hit.at < TTL_MS) return hit.values

  const rows = await queryFabricWithTimeout(DB, source.sql, 30000)
  // 저장된 값에 끝 공백이 있어도 정본은 공백을 뗀 이름이다 — SQL 쪽도 LTRIM(RTRIM())으로
  // 비교하므로 여기서 공백을 붙여 보내면 오히려 안 맞는다.
  const values = [...new Set(rows.map((r) => String(r.v ?? '').trim()).filter(Boolean))]
  cache.set(dimension, { at: Date.now(), values })
  return values
}

const norm = (s) => String(s ?? '').replace(/\s+/g, '').toLowerCase()

// 값 뒤에 붙어 오는 차원 이름. 앞의 세 단계가 전부 실패했을 때만 떼고 다시 본다.
const DIMENSION_SUFFIXES = ['전시장', '전시', '딜러사', '딜러', '대리점', '지점', '부서', 'sc']

function stripDimensionSuffix(n) {
  for (const suffix of DIMENSION_SUFFIXES) {
    if (n.length > suffix.length && n.endsWith(suffix)) return n.slice(0, -suffix.length)
  }
  return null
}

/**
 * @returns {{value: string}|{candidates: string[]}|{unknown: true}}
 */
/**
 * 열거형 차원(활동유형·활동그룹)의 값 대조. 부분 일치를 쓰지 않는다.
 *
 * 조직 이름은 브랜드가 떨어져 나오므로 부분 일치가 필요하지만("동대문" → "토요타 동대문"),
 * 분류 체계는 값끼리 서로 부분 문자열이라 부분 일치가 오히려 조용히 틀린 값을 만든다 —
 * 활동그룹의 '관계형성'을 활동유형에서 찾으면 '관계형성 소개'로 바뀌어 버린다.
 * 여기서는 못 찾으면 못 찾은 채로 두고, 다른 차원으로 옮길지는 호출부가 정한다.
 */
export function matchEnum(input, values) {
  const n = norm(input)
  if (!n) return { unknown: true }
  const exact = values.filter((v) => norm(v) === n)
  if (exact.length === 1) return { value: exact[0] }
  if (exact.length > 1) return { candidates: exact }
  return { unknown: true }
}

export function matchOne(input, values) {
  const n = norm(input)
  if (!n) return { unknown: true }

  const exact = values.filter((v) => norm(v) === n)
  if (exact.length === 1) return { value: exact[0] }
  if (exact.length > 1) return { candidates: exact }

  // 브랜드를 뗀 이름: "동대문" → "토요타 동대문". 앞뒤 어느 쪽이든 붙어 있으면 후보다.
  const partial = values.filter((v) => norm(v).includes(n))
  if (partial.length === 1) return { value: partial[0] }
  if (partial.length > 1) return { candidates: partial }

  // 반대 방향: 입력이 실제 값보다 긴 경우. LLM이 차원 이름을 값에 붙여 보낸다 —
  // 2026-08-04 실측: group_name에 "렉서스 강남 전시장"이 들어와 오류 없이 0건이 됐다
  // (실제 값은 "렉서스 강남"). "김승진 SC", "강남영업1팀 팀"도 같은 모양이다.
  const inside = values.filter((v) => norm(v) && n.includes(norm(v)))
  if (inside.length === 1) return { value: inside[0] }
  // 여럿이면 어느 쪽을 말한 건지 알 수 없다 — 가장 긴 것을 고르면 조용히 틀릴 수 있어 되묻는다.
  if (inside.length > 1) return { candidates: inside }

  // 브랜드도 빠지고 차원 이름만 붙은 경우 — 위 세 단계가 전부 빗나간다.
  // 2026-08-05 실측: "렉서스 부산 전시장의 영업6팀"에서 LLM이 group_name으로
  // "부산 전시장"을 보냈다. 실제 값은 "렉서스 부산"/"토요타 부산"이라 어느 쪽에도
  // 걸리지 않고 오류 없이 0행이 나갔다. 접미어를 떼면 "부산"이 되어 후보 2개로
  // 좁혀지고, 되묻거나(아래) 브랜드로 자동 확정할 수 있다.
  const stripped = stripDimensionSuffix(n)
  if (stripped) {
    const again = matchOne(stripped, values)
    if (!again.unknown) return again
  }
  return { unknown: true }
}

// 브랜드 코드 → 조직 이름에 쓰이는 접두어. 후보가 여럿일 때 좁히는 데만 쓴다.
const BRAND_PREFIX = { LEXUS: '렉서스', TOYOTA: '토요타' }

// 값 도메인이 코드/숫자로 정해져 있는 리포트 파라미터. 사용자가 말한 말투 그대로
// 넘기면 LIKE 패딩 비교에 걸리지 않아 **오류 없이 0행**이 된다 — 사용자는 빈 표를
// 정답으로 받는다. 이름 보정과 같은 문제이되 대상이 이름이 아니라 코드다.
//
// 2026-08-05 실측:
//   brand="렉서스"    → DIM_MNG_USER[BRAND]는 LEXUS/TOYOTA → 0행
//   meet_round="3회차" → meet_ym_seq는 정수 1~55           → 0행
const BRAND_CODES = { 렉서스: 'LEXUS', 토요타: 'TOYOTA', lexus: 'LEXUS', toyota: 'TOYOTA' }

export function brandCode(value) {
  return BRAND_CODES[norm(value)] || value
}

/** "3회차" → "3". 숫자에 회차 표현만 붙은 경우로 한정한다 — 이름에 숫자가 섞인 값은 두어야 한다. */
export function ordinalNumber(value) {
  const m = String(value ?? '').trim().match(/^(\d+)\s*(회차|차수|회|차)?$/)
  return m ? m[1] : value
}

/** 리포트 파라미터 이름 → 값 정규화기. 리포트마다 명명이 갈려 둘 다 적는다. */
export const PARAM_VALUE_NORMALIZERS = {
  brand: brandCode, Brand: brandCode,
  meet_round: ordinalNumber, MeetRound: ordinalNumber,
}

/**
 * 같은 요청에 브랜드가 있으면 동명이지점 후보를 좁힌다.
 * "부산" → [토요타 부산, 렉서스 부산] 인데 Brand=LEXUS면 되물을 필요가 없다.
 */
function narrowByBrand(candidates, brands) {
  const prefixes = (brands || []).map((b) => BRAND_PREFIX[String(b).toUpperCase()]).filter(Boolean)
  if (!prefixes.length) return candidates
  const hit = candidates.filter((v) => prefixes.some((p) => norm(v).startsWith(norm(p))))
  return hit.length ? hit : candidates
}

// 지정한 차원에 없을 때 대신 찾아볼 곳.
//
// 2026-08-04 실측: 딜러 16개는 **전부** 전시장 62개에 들어 있다(딜러가 전시장의 부분집합).
// 그래서 "렉서스 강북"처럼 이름만 봐서는 어느 쪽인지 알 수 없다. 질문에 "전시장"·"딜러"
// 같은 단서가 없으면 넓은 단위인 딜러를 먼저 보고, 딜러에 없으면 전시장에서 찾는다.
//
// 이 폴백이 없을 때 무슨 일이 났나: LLM이 "렉서스 강북의 강북1팀"을 DealerNm으로 보냈고,
// 그런 딜러가 없어 오류 없이 0행이 나왔다. 사용자는 빈 표를 정상 결과로 받았다.
const DIMENSION_FALLBACK = {
  dealer: ['showroom', 'department'],
  // 딜러는 전시장의 부분집합이라 되짚어볼 이유가 없다. 하지만 팀 이름이 전시장 자리로
  // 오는 일은 있다 — 2026-08-06 실측(평가 No.25): "렉서스 부산 전시장 영업6팀"에서
  // GroupName에 '영업6팀'이 들어가 오류 없이 0행이 됐다.
  showroom: ['department'],
  department: ['showroom'],
  sales_consultant: [],
  // 활동유형과 활동그룹은 값이 서로 섞이기 쉽다. LLM이 어느 쪽에 붙일지 실행마다
  // 흔들리는데, 틀린 쪽에 붙으면 GOLD 파생이 걸 수 없는 필터가 되어 **오류도 없이
  // 답이 통째로 사라진다** — 2026-08-07 실측(평가 No.22): 같은 질문 3회 중 1회가
  // '자사출고'를 activity_group으로 붙여 빈 응답이 됐고, 나머지 2회는 activity_type으로
  // 붙어 정상(목표 508 / 진행률 7.68%)이었다. 두 목록이 실측으로 채워져 있으므로
  // 어느 쪽 값인지는 코드가 결정적으로 가릴 수 있다.
  activity_type: ['activity_group'],
  activity_group: ['activity_type'],
}

/**
 * 필터 값들을 실제 값으로 바꾼다.
 *
 * @returns {{ok: true, values: string[], changed: object, relocated: Array<{input, to, value}>}
 *          |{ok: false, question, options}|null}
 *   null이면 이 차원은 해석 대상이 아니다(호출부는 원래 값을 그대로 쓴다).
 *   relocated는 "이 값은 이 차원이 아니라 저 차원의 것"이라는 뜻이다 — 호출부가 옮겨 담는다.
 */
export async function canonicalizeValues(dimension, values, { brands } = {}) {
  if (!values?.length) return null
  if (!VALUE_SOURCES[dimension] && !declaredValues(dimension)) return null

  let known
  try {
    known = await knownValues(dimension)
  } catch {
    return null   // 목록을 못 읽으면 원래 값을 그대로 쓴다 — 조회 실패로 질문을 막지 않는다
  }
  if (!known?.length) return null

  // 열거형 차원은 정확 일치만 쓴다(위 matchEnum 주석 참고).
  const match = (v, list, dim) => (VALUE_SOURCES[dim] ? matchOne(v, list) : matchEnum(v, list))

  const out = []
  const changed = {}
  const relocated = []
  for (const input of values) {
    const hit = match(input, known, dimension)
    if (hit.candidates) {
      // 같은 요청에 브랜드가 있으면 되묻지 않고 좁힌다 — "렉서스 부산 전시장"에서
      // 브랜드가 떨어져 나가도 Brand=LEXUS가 남아 있으면 답이 하나로 정해진다.
      const narrowed = narrowByBrand(hit.candidates, brands)
      if (narrowed.length === 1) {
        if (narrowed[0] !== input) changed[input] = narrowed[0]
        out.push(narrowed[0])
        continue
      }
      return {
        ok: false,
        question: `"${input}"에 해당하는 ${labelOf(dimension)}이(가) 여럿입니다. 어느 쪽인가요?`,
        options: narrowed.slice(0, 5),
        candidates: narrowed,
      }
    }
    if (hit.unknown) {
      // 지정된 차원에 없다. 다른 차원의 값이면 거기로 옮긴다 — 아니면 새 값일 수 있으니
      // 그대로 넘긴다(여기서 막으면 데이터에 값이 생겼을 때 답을 못 한다).
      let moved = false
      for (const alt of DIMENSION_FALLBACK[dimension] || []) {
        let altValues
        try { altValues = await knownValues(alt) } catch { continue }
        if (!altValues?.length) continue
        const altHit = match(input, altValues, alt)
        if (altHit.value) {
          relocated.push({ input, to: alt, value: altHit.value, label: labelOf(alt) })
          moved = true
          break
        }
      }
      if (!moved) out.push(input)
      continue
    }
    if (hit.value !== input) changed[input] = hit.value
    out.push(hit.value)
  }
  return { ok: true, values: out, changed, relocated }
}
