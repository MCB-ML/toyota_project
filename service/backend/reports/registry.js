// Certified Report 레지스트리 — 등록된 리포트 계약과 SQL 본문을 읽어들인다.
//
// 세만틱 레이어(server/agentic-bi/app/semantic/registry.js)와 같은 로딩 패턴을 쓴다.
// 다른 점은 여기 있는 SQL은 컴파일 대상이 아니라 "그대로 실행되는 최종본"이라는 것 —
// 그래서 로드 시점에 계약의 sql_sha256과 실제 본문 해시를 대조한다.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createHash } from 'node:crypto'
import { load as parseYaml } from 'js-yaml'
import { RATE_ASKED } from '../agentic-bi/semantic/requirement.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export class ReportError extends Error {
  constructor(code, message) {
    super(message)
    this.name = 'ReportError'
    this.code = code
  }
}

export function sha256(text) {
  return createHash('sha256').update(text, 'utf8').digest('hex')
}

function normalizeSqlLineEndings(text) {
  return String(text).replace(/\r\n?/g, '\n')
}

export function sqlSha256Matches(text, expected) {
  const raw = String(text)
  const normalized = normalizeSqlLineEndings(raw)
  return sha256(raw) === expected || sha256(normalized) === expected
}

function loadYaml(relPath) {
  return parseYaml(fs.readFileSync(path.join(__dirname, relPath), 'utf8'))
}

let cache = null

export function loadReportRegistry({ force = false } = {}) {
  if (cache && !force) return cache

  const index = loadYaml('registry.yaml')
  const reports = new Map()

  for (const entry of index.reports || []) {
    const rawContract = loadYaml(entry.contract)
    // 2026-08-04 leo: 인증 SQL은 파싱하지 않는다. 각 report가 명시한 dependency set만
    // watermark source로 사용해 리포트별 최신성 판단을 결정론적으로 만든다.
    const declaredDependencies = rawContract.source_dependencies || index.source_dependency_sets?.[entry.source_dependency_set] || []
    if (entry.source_dependency_set && !index.source_dependency_sets?.[entry.source_dependency_set]) {
      throw new ReportError('invalid_source_dependency_set', `리포트 '${entry.report_id}'가 알 수 없는 source_dependency_set '${entry.source_dependency_set}'을 참조합니다.`)
    }
    const contract = { ...rawContract, source_dependencies: declaredDependencies }
    const sqlText = fs.readFileSync(path.join(__dirname, contract.sql_file), 'utf8')

    // 등록 SQL이 계약과 어긋나면 로드 자체를 실패시킨다. 실행 시점까지 미루면
    // 이미 잘못된 SQL이 돌아간 뒤가 된다.
    const actual = sha256(sqlText)
    if (!sqlSha256Matches(sqlText, contract.sql_sha256)) {
      throw new ReportError(
        'sql_hash_mismatch',
        `리포트 '${entry.report_id}'의 SQL 해시가 계약과 다릅니다.\n` +
          `  계약: ${contract.sql_sha256}\n  실제: ${actual}\n` +
          `SQL을 의도적으로 바꿨다면 계약의 sql_sha256도 함께 갱신하세요.`,
      )
    }

    reports.set(entry.report_id, {
      ...entry,
      contract,
      sqlText,
      projection: entry.projection ? loadYaml(entry.projection) : null,
    })
  }

  cache = { reports }
  return cache
}

export function getReport(reportId) {
  const { reports } = loadReportRegistry()
  const report = reports.get(reportId)
  if (!report) {
    throw new ReportError(
      'unknown_report',
      `등록되지 않은 리포트입니다: ${reportId} (등록된 것: ${[...reports.keys()].join(', ') || '없음'})`,
    )
  }
  return report
}

export function listReports() {
  return [...loadReportRegistry().reports.values()]
}

// 계약에 선언된 차원 이름. SC 분기에 따라 목록이 갈리므로 합집합을 쓴다 —
// 프롬프트에서는 "이 리포트에 이런 열이 있다"만 알리면 되고, 실제로 어느 분기가
// 나올지는 sc_display가 정한다.
export function reportDimensionNames(contract) {
  const d = contract.dimension_columns || {}
  return [...new Set(Object.values(d).flat().filter(Boolean))]
}

// run_certified_report의 일반 인자(year/month/brand/dealer/...)가 이미 덮는 파라미터.
// reportIntent.js의 PARAM_ALIASES·SC_ALIASES와 같아야 한다 — 여기서 빠뜨리면
// 같은 필터를 두 경로로 받게 되고, 더 넣으면 닿을 수 없는 파라미터가 생긴다.
const GENERIC_PARAMS = new Set([
  'year', 'Year', 'base_year',
  'month', 'MonthNumber', 'Month', 'base_month',
  'day',
  // sc_brand는 일부러 뺐다. sc_delivery_status는 brand(차량 브랜드)와 sc_brand
  // (SC가 속한 조직 브랜드)를 둘 다 받는데, 툴의 brand 인자는 앞의 것에 붙는다.
  // 계약 설명에 "BI 화면의 브랜드 슬라이서가 sc_brand"라고 적혀 있으므로,
  // 조직 브랜드로 걸러야 할 때 report_filters로 닿을 수 있어야 한다.
  'brand', 'Brand',
  'dealer_nm', 'DealerNm',
  'group_name', 'GroupName',
  'dept_nm', 'DeptNm',
  'active_yn', 'ActYn', 'ActiveYn',
  'common_tp', 'common_tp_nm', 'CommonTpNm',
  'sc_name', 'ScName',
])

/**
 * 일반 인자로는 닿을 수 없는, 그 리포트만의 파라미터.
 *
 * 2026-08-04 실측: 20개 리포트에 이런 파라미터가 70개 있는데 툴 스키마에 없어서
 * LLM이 채울 방법이 자체가 없었다. "A 그룹만"(grp_name), "3회차 미팅"(meet_round),
 * "HOT만"(potential) 같은 조건이 오류 없이 무시되고 전체 결과가 나갔다.
 */
/**
 * 이 컬럼들을 모두 가진 리포트를 찾는다.
 *
 * 없는 컬럼이라고 거절만 하면 사용자는 어디로 가야 하는지 모른다. 2026-08-05 실측:
 * "딜러별 연누적 출고에서 ... PMA IN과 OUT"이 delivery_by_model로 갔는데, 그 말은
 * delivery_by_model의 제목과 닮았을 뿐이고 PMA 컬럼은 sc_delivery_status에만 있다.
 * 어느 리포트에 있는지 알려주면 한 번 더 물어 답에 닿을 수 있다.
 */
export function reportsHavingColumns(columns, exceptReportId = null) {
  const norm = (s) => String(s ?? '').replace(/\s+/g, '').toLowerCase()
  const wanted = columns.map(norm).filter(Boolean)
  if (!wanted.length) return []
  return listReports()
    .filter((r) => r.report_id !== exceptReportId)
    .filter((r) => {
      const have = new Set([
        ...Object.keys(r.contract.column_semantics || {}),
        ...reportDimensionNames(r.contract),
      ].map(norm))
      return wanted.every((w) => have.has(w))
    })
    .map((r) => ({ report_id: r.report_id, title: r.contract.title }))
}

// 이 업무에서 너무 흔한 말들. 이것만 이어 붙여 만들어진 컬럼 이름은 질문에 나와도
// 어느 리포트인지 가려주지 못한다 — "활동실적"(활동+실적), "연누적 출고"(연누적+출고)는
// 사실상 모든 출고·활동 질문에 등장한다.
const COMMON_WORDS = [
  '실적', '취소', '타겟', '목표', '활동', '계약', '기회', '출고', '영업', '시승',
  '건수', '대수', '당월', '전월', '월누적', '연누적', '누적', '월별', '일별', '전체',
  '달성률', '진행률', '진척률', '전환율', '전환률', '비중', '평균',
  '연도', '월', '일', '브랜드', '딜러', '전시장', '팀', 'sc', '모델', '차종', '연식',
  'sfx', '재직여부', '현황', '수', '분류', '유형',
]

// 흔한 말만으로 이루어졌는지 — 길이가 긴 말부터 걷어내고 남는 게 없으면 그렇다.
function isCommonCompound(normalized) {
  let rest = normalized
  for (const w of [...COMMON_WORDS].sort((a, b) => b.length - a.length)) {
    rest = rest.split(w).join('')
  }
  return rest.length === 0
}

/**
 * 질문에 그대로 등장하는 컬럼 이름 중, **한 리포트에만 있는 것**을 찾는다.
 *
 * LLM이 리포트를 잘못 골랐는데 selected_columns까지 비워 보내면 서버는 알 방법이 없어
 * 그 리포트의 표를 그대로 답으로 내보낸다. 2026-08-05 실측: "딜러별 연누적 출고에서
 * PMA IN과 OUT 건수"가 delivery_by_model로 가서 PMA가 없는 표가 3회 중 1회 나갔다.
 * 질문에 "PMA IN"이 적혀 있고 그 컬럼은 sc_delivery_status에만 있으므로 확정할 수 있다.
 *
 * @returns {{column, report_id, title}[]}
 */
export function distinctiveColumnsInText(text, exceptReportId = null) {
  // 컬럼명은 붙여 쓰는데(일일잔여타겟) 질문은 띄어 쓴다(일일 잔여 타겟). 양쪽에서
  // 공백을 걷어내고 비교한다 — 안 그러면 그대로인 질문만 잡힌다.
  const hay = String(text || '').replace(/\s+/g, '').toLowerCase()
  if (!hay.trim()) return []
  const owners = new Map()   // 컬럼명 → report[]
  for (const r of listReports()) {
    for (const c of Object.keys(r.contract.column_semantics || {})) {
      if (!owners.has(c)) owners.set(c, [])
      owners.get(c).push(r)
    }
  }

  // 고른 리포트가 이미 그 말과 겹치는 컬럼을 갖고 있으면 개입하지 않는다.
  // 2026-08-05 실측 오탐: "연누적 출고"를 delivery_by_grade(컬럼 '출고연누적')에서 찾지
  // 못했다고 다른 리포트로 보냈고, "영업기회"를 sc_card_monthly(컬럼 'HOT영업기회',
  // '전체영업기회')에 없다고 판정했다. 어순이 다르거나 수식어가 붙었을 뿐 같은 개념이다.
  // 두 글자만 겹쳐도 같은 개념일 가능성이 높으므로 그때는 손대지 않는다 — 진짜 잘못
  // 고른 경우(PMA IN vs sales_ytd·연도·월…)는 겹치는 글자가 아예 없다.
  const norm = (s) => String(s ?? '').replace(/\s+/g, '').toLowerCase()
  const chosen = exceptReportId
    ? [...Object.keys(getReport(exceptReportId).contract.column_semantics || {}),
      ...reportDimensionNames(getReport(exceptReportId).contract)].map(norm)
    : []
  const overlapsChosen = (column) => {
    const n = norm(column)
    for (let i = 0; i + 2 <= n.length; i += 1) {
      const gram = n.slice(i, i + 2)
      if (chosen.some((c) => c.includes(gram))) return true
    }
    return false
  }

  const out = []
  for (const [column, reports] of owners) {
    if (reports.length !== 1) continue           // 여러 리포트에 있으면 단서가 안 된다
    if (column.length < 3 || isCommonCompound(norm(column))) continue
    if (reports[0].report_id === exceptReportId) continue
    if (!hay.includes(norm(column))) continue
    if (overlapsChosen(column)) continue
    out.push({ column, report_id: reports[0].report_id, title: reports[0].contract.title })
  }
  return out
}

/**
 * 질문이 비율을 요구했을 때, 그 비율을 실제로 가진 리포트 컬럼을 찾는다.
 *
 * 2026-08-11 실측(평가 No.51): "전시장별 PMA IN 비율을 원형 차트로"가 4회 중 3회는
 * 시맨틱 경로로 가 원값(34·64·176·316·819)을, 1회는 인증 리포트로 가 PMA IN 비중을 냈다.
 * 경로 자체가 갈린 것이다.
 *
 * 시맨틱 레지스트리에는 PMA 비율 지표가 아예 없다 — 그 경로로는 비율을 낼 방법이
 * 없고, 원값을 내놓으면 물어본 것과 다른 답이다. 어느 쪽으로 갈지는 LLM의 그때그때
 * 판단이 아니라 **등록된 것이 무엇인가**로 정해져야 한다.
 *
 * 컬럼이 여럿 걸리면 null을 돌려준다 — 어디로 갈지 모르면 개입하지 않는 게 맞다.
 *
 * @returns {{column, report_id, title}|null}
 */
export function ratioColumnForRateRequest(text) {
  const q = String(text || '')
  if (!RATE_ASKED.test(q)) return null
  const hay = q.replace(/\s+/g, '').toLowerCase()

  const owners = new Map()
  for (const r of listReports()) {
    for (const c of Object.keys(r.contract.column_semantics || {})) {
      if (!owners.has(c)) owners.set(c, [])
      owners.get(c).push(r)
    }
  }

  const hits = []
  for (const [column, reports] of owners) {
    if (reports.length !== 1) continue                       // 여러 리포트에 있으면 단서가 안 된다
    if (!/비율|비중|률|율/.test(column)) continue
    // 비율을 뜻하는 말을 떼면 무엇의 비율인지가 남는다 — 그 말이 질문에 있어야 한다.
    const subject = column.replace(/비율|비중|률|율/g, '').replace(/\s+/g, '').toLowerCase()
    if (subject.length < 2 || !hay.includes(subject)) continue
    hits.push({ column, report_id: reports[0].report_id, title: reports[0].contract.title })
  }
  return hits.length === 1 ? hits[0] : null
}

export function reportExtraParameters(contract) {
  return (contract.parameters || [])
    .filter((p) => !GENERIC_PARAMS.has(p.name))
    .map((p) => ({
      name: p.name,
      type: p.sql_type,
      allowed: p.allowed_values || null,
      description: (p.description || '').trim(),
    }))
}

// 라우팅 프롬프트에 넣을 리포트 목록. LLM에게는 report_id, "언제 고르는지",
// 그리고 **실제 컬럼 이름**을 준다. SQL이나 계산식은 여전히 보여주지 않는다
// (LLM이 SQL을 쓸 여지를 아예 없앤다) — 이름은 계산식이 아니다.
//
// 컬럼 목록을 넣는 이유: 이게 없으면 LLM은 리포트에 무슨 열이 있는지 모른 채
// 사용자 표현을 그대로 selected_columns에 넣는다. 2026-08-04 평가표 52건
// 재실행에서 거절 9건 중 8건이 이 문제였다. weekly_activity_progress처럼
// 사용자가 정확한 이름("목표, 활동, 달성률")을 말했는데 LLM이 "활동목표,
// 활동실적"으로 늘려 보내 거절된 경우까지 있었다.
/**
 * 연누적 리포트임을 알리고, 그 달만 보려면 어떻게 해야 하는지 적는다.
 *
 * 2026-08-05 실측: "2026년 4월에 출고된 것만"이라고 명시해도 연누적 55행(1~4월)이
 * 그대로 나갔다. 리포트가 연누적이라는 사실이 LLM에게 전달된 적이 없었다.
 */
function periodSemanticsLine(contract) {
  const ps = contract.period_semantics
  if (ps?.type !== 'ytd') return ''
  return `  기간: ${ps.label || '연누적'} — month를 4로 줘도 1~4월 누적이 나온다.\n`
    + (ps.month_filter_column
      ? `    그 달만("4월에 출고된 것만") 원하면 dimension_filters로 `
        + `{"column":"${ps.month_filter_column}","values":["2026-04"]} 를 함께 넣어라.\n`
      : '')
}

/**
 * @param {(report) => boolean} [only] 후보를 좁힌다. 월을 못 받는 리포트를 골랐을 때
 *   월을 받을 수 있는 것만 보여 주고 다시 고르게 하는 데 쓴다.
 */
export function renderReportCatalogForPrompt(only = null) {
  return listReports()
    .filter((r) => !only || only(r))
    .map((r) => {
      const hints = (r.routing_hints || []).map((h) => `    - ${h}`).join('\n')
      const sem = r.contract.column_semantics || {}
      const measures = Object.keys(sem)
      // 비율은 무엇으로 나눈 값인지 따로 알려준다. 컬럼명에 표시를 덧붙이면 LLM이 그걸
      // 그대로 selected_columns에 넣는다 — 이름은 원문 그대로 두고 설명만 붙인다.
      //
      // 왜 필요한가: "진행률"이라 불리는 컬럼 9개가 실제로는 목표 대비(=진척)다
      // (2026-08-05 등록 21종 전수 확인). 이름만 보면 과정 중심 지표로 읽혀
      // 전단계 대비(전환율)와 섞어 비교하게 된다.
      const byBasis = (b) => Object.keys(sem).filter((c) => sem[c].ratio_basis === b)
      const target = byBasis('target')
      const stage = byBasis('stage')
      const dims = reportDimensionNames(r.contract)
      const extra = reportExtraParameters(r.contract)
      const extraLine = extra
        .map((p) => `${p.name}${p.allowed ? `(${p.allowed.join('|')})` : ''}`)
        .join(', ')
      return `- ${r.report_id} — ${r.contract.title}\n  ${r.contract.description.trim()}\n`
        + (measures.length ? `  지표 컬럼: ${measures.join(', ')}\n` : '')
        + (dims.length ? `  차원 컬럼: ${dims.join(', ')}\n` : '')
        + (target.length ? `  ↳ 목표 대비(진척): ${target.join(', ')}\n` : '')
        + (stage.length ? `  ↳ 전단계 대비(전환): ${stage.join(', ')}\n` : '')
        + (extraLine ? `  이 리포트만의 필터(report_filters로 전달): ${extraLine}\n` : '')
        // 연누적 리포트는 "4월"을 물어도 1~4월을 낸다. 그 달만 원하면 행에서 거르는 수밖에
        // 없는데, 그걸 알려주지 않으면 LLM이 연누적을 그 달로 착각해 답한다.
        + (periodSemanticsLine(r.contract) || '')
        + `  이런 질문일 때 고른다:\n${hints}`
    })
    .join('\n')
}
