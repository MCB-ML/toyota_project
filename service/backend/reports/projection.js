// Certified Report 결과 → 화면에 낼 형태로 투영.
//
// 기본 경로는 "고르기"뿐이다. 퍼널 객체 프리셋은 화면 필터에 맞는 grain으로
// 상세 행을 다시 접되, 계약에 선언된 additive/ratio 규칙만 사용한다.
import { getReport } from './registry.js'

export const TOTAL_ROW_LABEL = '합계'

// 같은 축인데 리포트마다 열 이름이 다른 것들. 글자만 봐서는 이어지지 않는 짝이라
// (월 ↔ MonthAbbr) 여기 적어 둔다 — 글자가 겹치는 경우는 resolveSelectedColumns의
// 접미/포함 단계가 알아서 잇는다.
export const DIMENSION_ALIASES = {
  팀: ['부서'],
  부서: ['팀'],
  // 2026-08-04 leo: 일부 인증 GOLD는 월 축을 MonthAbbr로 내보내지만 리포트 도구의
  // 월별 롤업 값은 '월'이다. 같은 시간 축으로 선언해 상세 행이 그대로 남지 않게 한다.
  월: ['MonthAbbr'],
  MonthAbbr: ['월'],
  모델: ['Model'],
  Model: ['모델'],
}

export const REPORT_VIEW_PRESETS = {
  funnel_core_wide: {
    reportId: 'funnel_full_structure',
    chartCode: 'table',
    description: '활동/영업기회/시승/계약의 실적·목표·진행률을 한 행에 펼친 퍼널 요약 표',
  },
  funnel_stage_rows: {
    reportId: 'funnel_full_structure',
    chartCode: 'table',
    description: '활동/영업기회/시승/계약을 단계 행으로 나눈 퍼널 요약 표',
  },
  funnel_stage_chart: {
    reportId: 'funnel_full_structure',
    chartCode: 'funnel',
    description: '활동→영업기회→시승→계약 실적을 역삼각형 퍼널 차트로 표시',
  },
  funnel_pyramid_table: {
    reportId: 'funnel_full_structure',
    chartCode: 'table',
    description: '역삼각형 퍼널 구조의 표로 보기처럼 단계별 숫자·활동대비·전단계대비·단계내 비중을 채널 열로 펼친 표',
  },
  funnel_pyramid_chart: {
    reportId: 'funnel_full_structure',
    chartCode: 'funnel_pyramid',
    description: '역삼각형 퍼널 구조처럼 관계형성활동/SC활동/내방·내전/온라인유입 채널을 단계별로 쌓아 보여주는 객체',
  },
}

const FUNNEL_STAGE_FIELDS = [
  {
    stage: '활동',
    actual: '영업활동 건 수',
    target: '영업활동 당월 목표',
    progress: '영업활동 진행률',
  },
  {
    stage: '영업기회',
    actual: '영업기회 건 수(당월활동실적)',
    target: '영업기회 당월 목표',
    progress: '영업기회 진행률',
  },
  {
    stage: '시승',
    actual: '시승건수(당월전체실적/actual_cnt 기준)',
    target: '시승 당월 목표',
    progress: '시승 진행률',
  },
  {
    stage: '계약',
    actual: '계약건수(당월활동실적)',
    target: '계약 당월 목표',
    progress: '계약 진행률',
  },
]

const FUNNEL_CORE_WIDE_FIELDS = [
  ['활동 실적', '영업활동 건 수'],
  ['활동 목표', '영업활동 당월 목표'],
  ['활동 진행률', '영업활동 진행률'],
  ['영업기회 실적', '영업기회 건 수(당월활동실적)'],
  ['영업기회 목표', '영업기회 당월 목표'],
  ['영업기회 진행률', '영업기회 진행률'],
  ['시승 실적', '시승건수(당월전체실적/actual_cnt 기준)'],
  ['시승 목표', '시승 당월 목표'],
  ['시승 진행률', '시승 진행률'],
  ['계약 실적', '계약건수(당월활동실적)'],
  ['계약 목표', '계약 당월 목표'],
  ['계약 진행률', '계약 진행률'],
]

const FUNNEL_GROUP_DIMENSIONS = ['브랜드', '딜러']
const FUNNEL_CHANNEL_ORDER = ['관계형성활동', 'SC활동', '내방/내전', '온라인유입']

// 채널 → 그 채널을 이루는 활동유형(common_tp_nm). Power BI 1-1 화면 상단의 슬라이서
// 버튼 8개를 4채널로 묶은 것이다.
//
// 채널은 grain이 아니라 필터다 — BI에서 버튼을 누르면 페이지 전체가 그 활동유형으로
// 다시 계산된다. 그래서 채널 값도 GOLD에 common_tp_nm을 걸어 다시 돌려야 화면과 맞는다.
// 상세 행을 채널별로 더하면 자격 조건이 더 엄격해 값이 작게 나온다(2026-04 토요타 강남
// 기회: 상세합 605 vs 화면 635).
//
// 채널 값을 다 더해도 단계 합계와 같지 않다 — 한 리드가 여러 활동유형에 걸칠 수 있고
// 단계 사이를 이동하기도 한다. BI도 버튼을 하나씩 눌러 더하면 전체와 다르다.
export const FUNNEL_CHANNEL_ACTIVITY_TYPES = {
  관계형성활동: ['자사출고', '타사출고'],
  SC활동: ['잠재고객', '판촉', '관계형성 소개'],
  '내방/내전': ['내전상담', '내방상담'],
  온라인유입: ['온라인 유입'],
}
const FUNNEL_CHANNEL_FIELD = '__funnelChannel'
const FUNNEL_PYRAMID_ROW_LABELS = ['퍼널 숫자', '활동대비', '전단계대비', '단계내 비중']
const FUNNEL_PYRAMID_STAGE_LABELS = {
  영업기회: '기회',
}

function paramValue(params, ...names) {
  for (const name of names) {
    if (Object.prototype.hasOwnProperty.call(params || {}, name)) return params[name]
  }
  return null
}

function periodValueForRow(result, row) {
  const year = row?.__reportYear ?? paramValue(result.params, 'Year', 'year')
  const month = row?.__reportMonth ?? paramValue(result.params, 'MonthNumber', 'month')
  return {
    연도: year ?? null,
    월: month ? `${month}월` : null,
  }
}

function periodColumns(result) {
  const year = paramValue(result.params, 'Year', 'year')
  const month = paramValue(result.params, 'MonthNumber', 'month')
  const hasRowPeriod = result.rows?.some((row) => row?.__reportYear !== undefined || row?.__reportMonth !== undefined)
  if (!hasRowPeriod && year == null && month == null) return { columns: [], valuesForRow: () => ({}) }
  return {
    columns: ['연도', '월'],
    valuesForRow: (row) => periodValueForRow(result, row),
  }
}

function filterFieldsFor(columns) {
  return ['월', '딜러'].filter((field) => columns.includes(field))
}

function numberValue(value) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0
  const parsed = Number(String(value ?? '').replaceAll(',', '').replace('%', ''))
  return Number.isFinite(parsed) ? parsed : 0
}

function percentText(value) {
  return value === null || value === undefined ? '-' : `${value.toFixed(1)}%`
}

function keyFor(values) {
  return JSON.stringify(values.map((value) => value ?? null))
}

function orderedChannels(values) {
  const unique = [...new Set(values.filter((value) => value !== null && value !== undefined && String(value).trim()))]
  return [
    ...FUNNEL_CHANNEL_ORDER.filter((value) => unique.includes(value)),
    ...unique.filter((value) => !FUNNEL_CHANNEL_ORDER.includes(value)).sort((a, b) => String(a).localeCompare(String(b), 'ko')),
  ]
}

function normalizedText(value) {
  return String(value ?? '').replace(/\s+/g, '')
}

function funnelPyramidChannel(row) {
  const group = normalizedText(row?.활동유형분류)
  const type = normalizedText(row?.활동유형)

  if (['자사출고', '타사출고', '관계형성활동'].includes(type)) return '관계형성활동'
  if (['관계형성소개', '잠재고객', '판촉', '판촉활동', 'SC활동'].includes(type)) return 'SC활동'
  if (['내방상담', '내전상담', '내방내전', '내방/내전'].includes(type)) return '내방/내전'
  if (['온라인유입', '온라인'].includes(type)) return '온라인유입'
  if (group === '관계형성') return '관계형성활동'
  if (type) return row.활동유형
  return row.활동유형분류 || '기타'
}

function funnelPyramidStage(stage) {
  return FUNNEL_PYRAMID_STAGE_LABELS[stage] || stage
}

// 비율의 분자는 컬럼 하나일 수도, 여러 컬럼의 합일 수도 있다.
// sales_achievement_contract의 달성률은 (실적 + 취소) / 타겟이다 — GOLD가 SUM(cnt)를
// 쓰기 때문에 파기된 건도 분자에 든다. 계약에 numerator: ['실적','취소'] 로 적는다.
export const numeratorColumns = (spec) => (Array.isArray(spec.numerator) ? spec.numerator : [spec.numerator])

export function isTotalRow(row, contract) {
  const rule = contract.total_row?.detect_by
  if (!rule) return false
  return row[rule.column] === rule.equals
}

// 같은 것을 가리키는데 리포트마다 말이 다른 것들. 요청과 실제 컬럼명 양쪽에 똑같이
// 적용해 비교한다 — 한쪽만 바꾸면 방향에 따라 결과가 달라진다.
//
// 진척률·진행률·달성률을 한 낱말로 합치는 근거 (2026-08-05 등록 21종 전수 확인):
// 이 세 말이 붙은 컬럼 16개가 **예외 없이 실적 ÷ 목표**다. 계산이 같으므로 합쳐도
// 다른 지표를 잘못 집지 않는다. 전단계 대비(전환율·배수·비중) 15개는 분모가 목표가
// 아니라서 이 목록에 넣지 않는다 — 합치면 진짜로 다른 지표가 섞인다.
//
// 앞선 주석에 "한 리포트 안에 두 표현이 함께 쓰이지 않는다"고 적었는데 사실이 아니었다.
// activity_funnel_status에는 활동진척률·기회진척률과 계약진행률이 같이 있다.
// 다만 셋 다 실적÷목표라 합쳐도 문제가 없다는 결론은 그대로다.
//
// 용어 자체는 GOLD가 일관되지 않다 — 뜻으로는 '진척'(목표 대비 성과)이 맞는데
// 9개 컬럼이 '진행'이라 불린다. 출력 컬럼명은 BI와 맞춰야 하므로 바꾸지 않고,
// 개념 구분은 계약의 ratio_basis에 적어 답변에서 설명할 수 있게 했다.
const COLUMN_WORD_SYNONYMS = [
  [/률/g, '율'],        // 전환률/전환율 표기 흔들림
  [/타겟/g, '목표'],
  [/진척율|달성율/g, '진행율'],
]

const normColumn = (s) => {
  let v = String(s ?? '').replace(/\s+/g, '').toLowerCase()
  for (const [re, to] of COLUMN_WORD_SYNONYMS) v = v.replace(re, to)
  return v
}

/**
 * 요청한 컬럼 이름을 리포트의 실제 컬럼에 맞춘다.
 *
 * 왜 필요한가: LLM이 리포트의 실제 컬럼명을 모른 채 사용자 표현을 그대로 넣는다.
 * 2026-08-04 평가표 52건 재실행에서 거절 9건 중 8건이 이 문제였다. 방향도 제각각이다 —
 * 사용자가 "목표, 활동, 달성률"이라고 정확히 말했는데 LLM이 "활동목표, 활동실적"으로
 * 늘려 보낸 경우(weekly_activity_progress)까지 있었다.
 *
 * 근본 해결은 카탈로그에 컬럼 목록을 실어 LLM이 실제 이름을 고르게 하는 것이고
 * (registry.js의 renderReportCatalogForPrompt), 이건 그래도 새는 것을 받는 안전망이다.
 * 그래서 **후보가 하나로 확정될 때만** 받아들인다 — 둘 이상이면 조용히 아무거나
 * 고르지 않고 모른다고 한다. 잘못 고른 컬럼은 틀린 표가 되어 그대로 나간다.
 *
 * 차원은 measures에 넣지 않는다 — 어차피 항상 표시되므로 "인식했고 할 일 없음"이다.
 * 예전에는 SC명·고객명·차종을 측정값 목록에 없다고 거절했다.
 *
 * @returns {{measures: string[], dimensions: string[], unknown: string[]}}
 */
export function resolveSelectedColumns(selected, allMeasures, dimensionColumns = []) {
  const measureBy = allMeasures.map((c) => ({ name: c, n: normColumn(c) }))
  const dimBy = dimensionColumns.map((c) => ({ name: c, n: normColumn(c) }))

  // 느슨해지는 순서대로 본다. 측정값을 차원보다 먼저 보는 이유는 selected_columns가
  // 원래 측정값을 고르는 자리이기 때문이다.
  //
  // 접미 단계가 포함 단계보다 앞이다: 한국어 합성어는 뒤가 머리다("활동목표"의 머리는
  // 목표, 활동은 수식). 그래서 {목표, 활동} 중 목표를 고르는 것이 맞다.
  //
  // 접두 단계는 일부러 없다. 넣었더니 "연누적출고(PMA IN)"과 "연누적출고(PMA OUT)"이
  // 둘 다 '연누적 출고'로 붙어버렸다 — PMA IN보다 접두가 먼저 걸려서다. 요청 안에 실제
  // 컬럼이 둘 들어 있으면(연누적 출고 + PMA IN) 그건 정말로 모호한 것이라, 포함 단계에서
  // 후보 2개로 걸러 모른다고 하는 편이 조용히 틀린 표를 내보내는 것보다 낫다.
  const tiers = [
    (q, c) => c.n === q,
    (q, c) => q.endsWith(c.n),     // 영업활동실적 → 활동실적, 출고목표 → 목표
    (q, c) => q.includes(c.n),     // SC명 → SC, 월평균출고대수 → 월평균출고
  ]

  const measures = []
  const dimensions = []
  const unknown = []

  for (const raw of selected) {
    const q = normColumn(raw)
    let hit = null
    for (const match of tiers) {
      for (const pool of [measureBy, dimBy]) {
        const found = pool.filter((c) => match(q, c))
        // 후보가 갈리면 이 단계에서 고르지 않는다. 더 느슨한 단계로 내려가도
        // 갈림은 커지기만 하므로 그대로 모른다고 두는 편이 맞다.
        if (found.length === 1) { hit = { pool, name: found[0].name }; break }
        if (found.length > 1) { hit = { ambiguous: true }; break }
      }
      if (hit) break
    }
    if (!hit || hit.ambiguous) unknown.push(raw)
    else if (hit.pool === measureBy) measures.push({ raw, name: hit.name })
    else dimensions.push({ raw, name: hit.name })
  }

  // 서로 다른 요청 둘이 같은 컬럼에 붙었다면 최소 하나는 틀렸다. 어느 쪽이 맞는지
  // 알 수 없으므로 둘 다 모른다고 한다 — 한쪽을 남기면 사용자가 요청한 지표 하나가
  // 말없이 다른 지표로 바뀐 표를 받는다.
  const collided = new Set()
  for (const list of [measures, dimensions]) {
    const seen = new Map()
    for (const { raw, name } of list) {
      if (seen.has(name)) { collided.add(name); unknown.push(raw, seen.get(name)) }
      else seen.set(name, raw)
    }
  }
  const keep = (list) => list.filter((x) => !collided.has(x.name)).map((x) => x.name)

  return { measures: keep(measures), dimensions: keep(dimensions), unknown }
}

/**
 * 실행 결과의 행을 차원 값으로 거른다.
 *
 * 왜 필요한가: GOLD가 파라미터로 받지 않는 축이 있다. weekly_activity_progress의
 * '월별주차'는 출력 차원일 뿐 파라미터가 없어서, "4월 2주차"를 물어도 4월 전체가
 * 나갔다(2026-08-04 평가표 No.15). SQL은 그대로 두고 돌아온 행만 고른다.
 *
 * 합계 행이 있는 리포트에는 쓸 수 없다 — 상세만 걸러내면 합계가 전체 기준으로 남아
 * 표 안에서 숫자가 어긋난다. 그런 리포트는 호출부가 거절해야 한다(canFilterRows).
 *
 * @returns {{rows, matched: number, unknownColumns: string[], emptyFor: string[]}}
 */
export function filterRowsByDimension(result, filters) {
  const dims = new Set(result.dimensionColumns || [])
  // 날짜 컬럼은 드라이버가 Date 객체로 준다. String(Date)는
  // "Sat Jan 01 2022 09:00:00 GMT+0900"이라 사용자가 말한 "2026-07-30"과 절대 안 맞는다
  // (2026-08-05: 계약 명세에서 그 날짜 2건이 있는데도 0건이 나왔다).
  // 시간대 변환 없이 저장된 그대로의 날짜를 쓴다 — UTC 자정으로 들어오므로 ISO 앞 10자다.
  const norm = (v) => (v instanceof Date
    ? v.toISOString().slice(0, 10)
    : String(v ?? '').replace(/\s+/g, '').toLowerCase())

  const unknownColumns = []
  const usable = []
  for (const f of filters || []) {
    const column = String(f?.column || '').trim()
    const values = (f?.values || []).map((v) => String(v).trim()).filter(Boolean)
    if (!column || !values.length) continue
    if (!dims.has(column)) { unknownColumns.push(column); continue }
    usable.push({ column, wanted: new Set(values.map(norm)) })
  }

  if (unknownColumns.length || !usable.length) {
    return { rows: result.rows, matched: result.rows.length, unknownColumns, emptyFor: [] }
  }

  // "2주차"와 "2"처럼 사용자가 줄여 말하는 경우가 있어 포함 매칭도 받는다.
  const hit = (cell, wanted) => {
    const n = norm(cell)
    if (wanted.has(n)) return true
    for (const w of wanted) if (n.includes(w) || w.includes(n)) return true
    return false
  }

  const rows = result.rows.filter((row) => usable.every((f) => hit(row[f.column], f.wanted)))

  // 어느 조건이 0건을 만들었는지 알려준다 — 빈 표만 내보내면 사용자는 이유를 모른다.
  const emptyFor = usable
    .filter((f) => !result.rows.some((row) => hit(row[f.column], f.wanted)))
    .map((f) => f.column)

  return { rows, matched: rows.length, unknownColumns, emptyFor }
}

const MEASURE_OPS = {
  gte: (a, b) => a >= b,
  gt: (a, b) => a > b,
  lte: (a, b) => a <= b,
  lt: (a, b) => a < b,
  eq: (a, b) => a === b,
}

/**
 * 지표 값 조건으로 행을 거른다("활동배수가 5 이상인 SC").
 *
 * GOLD에는 이런 조건을 받는 파라미터가 없다. 평가자의 정답 쿼리는 마지막 SELECT에
 * WHERE activity_multiple >= 5 를 붙여 만들었는데, 우리는 SQL을 고칠 수 없으므로
 * 돌아온 행에서 고른다. 조건을 조용히 버리면 사용자는 전체 목록을 "걸러진 목록"으로
 * 믿는다(2026-08-04 평가표 No.43).
 *
 * 합계 행은 뺀다 — 부분집합만 남긴 표에 전체 합계가 붙으면 그 표 안에서 숫자가
 * 어긋난다. 뺐다는 사실은 호출부가 사용자에게 알린다.
 *
 * @returns {{rows, matched, droppedTotal: boolean, unknownColumns: string[]}}
 */
export function filterRowsByMeasure(result, filters) {
  const { contract } = getReport(result.reportId)
  const measures = Object.keys(contract.column_semantics || {})
  const byNorm = new Map(measures.map((c) => [String(c).replace(/\s+/g, '').toLowerCase(), c]))

  const unknownColumns = []
  const usable = []
  for (const f of filters || []) {
    const asked = String(f?.column || '').trim()
    const op = MEASURE_OPS[f?.op]
    const value = Number(f?.value)
    if (!asked || !op || !Number.isFinite(value)) continue
    const column = byNorm.get(asked.replace(/\s+/g, '').toLowerCase())
    if (!column) { unknownColumns.push(asked); continue }
    usable.push({ column, op, value })
  }
  if (unknownColumns.length || !usable.length) {
    return { rows: result.rows, matched: result.rows.length, droppedTotal: false, unknownColumns }
  }

  let droppedTotal = false
  const rows = result.rows.filter((row) => {
    if (isTotalRow(row, contract)) { droppedTotal = true; return false }
    return usable.every((f) => {
      const v = Number(row[f.column])
      return Number.isFinite(v) && f.op(v, f.value)
    })
  })
  return { rows, matched: rows.length, droppedTotal, unknownColumns }
}

/**
 * 결과에서 보여줄 컬럼만 고른다.
 *
 * selected_columns는 SQL을 바꾸지 않는다(원본 GOLD의 @metric은 본문에서 쓰이지
 * 않는다) — 11개 지표는 항상 전부 계산되고, 여기서 표시할 것만 추린다.
 * 차원 컬럼은 표의 정체성이라 항상 유지한다.
 */
export function projectColumns(result, selectedColumns = null) {
  const { contract } = getReport(result.reportId)
  const dims = result.dimensionColumns
  const allMeasures = Object.keys(contract.column_semantics)

  let measures = allMeasures
  if (selectedColumns && selectedColumns.length > 0) {
    const r = resolveSelectedColumns(selectedColumns, allMeasures, dims)
    // 컬럼이 아니라 **차원의 값**을 컬럼처럼 요청하는 일이 있다.
    // 2026-08-05 실측(평가 No.30): "관계형성, 소개, 기회창출"은 delivery_status_monthly의
    // '구분' 컬럼 값인데 selected_columns로 들어와 리포트 전체가 거부됐다.
    // 값으로 확인되면 컬럼 목록에서 빼고 그대로 둔다 — 행 필터는 호출부가 따로 건다.
    if (r.unknown.length > 0) {
      const values = new Set()
      for (const dim of dims || []) {
        for (const row of result.rows) {
          const v = row[dim]
          if (v !== null && v !== undefined) values.add(String(v).replace(/\s+/g, ''))
        }
      }
      r.unknown = r.unknown.filter((name) => !values.has(String(name).replace(/\s+/g, '')))
    }
    // 파라미터로 거를 수 있는 축을 표시 컬럼처럼 요청하는 일도 있다("재직여부").
    // 그 리포트가 그 조건을 받을 수 있으면 거절할 이유가 없다 — 조건은 호출부가 채운다.
    if (r.unknown.length > 0) {
      const params = new Set(contract.parameters.map((p) => String(p.name).toLowerCase()))
      r.unknown = r.unknown.filter((name) => {
        const candidates = ROLLUP_AXIS_AS_PARAMETER[String(name).replace(/\s+/g, '')] || []
        return !candidates.some((c) => params.has(c.toLowerCase()))
      })
    }
    if (r.unknown.length > 0) {
      throw new Error(
        `이 리포트에 없는 컬럼입니다: ${r.unknown.join(', ')}`
        + ` (사용 가능한 지표: ${allMeasures.join(', ')}`
        + `${dims?.length ? ` / 차원: ${dims.join(', ')}` : ''})`,
      )
    }
    // 차원만 요청했다면 고를 측정값이 없다는 뜻이 아니라 "지표는 안 골랐다"는 뜻이다 —
    // 전체 측정값을 그대로 둔다. 여기서 빈 목록을 쓰면 숫자가 하나도 없는 표가 나간다.
    if (r.measures.length > 0) {
      // 계약에 적힌 순서를 따른다 — 지표 순서는 리포트의 일부다(퍼널 순서).
      measures = allMeasures.filter((c) => r.measures.includes(c))
    }
  }

  const columns = [...dims, ...measures]
  const rows = result.rows.map((row) => {
    const out = {}
    for (const col of columns) out[col] = row[col]
    return out
  })

  return {
    columns,
    rows,
    totalRowIndexes: rows
      .map((r, i) => (isTotalRow(r, contract) ? i : -1))
      .filter((i) => i >= 0),
  }
}

function dimensionColumnsWithoutTotalMarker(result) {
  return (result.dimensionColumns || []).filter((column) => !['집계구분', '연도', '월'].includes(column))
}

function aggregateFunnelRows(result, groupDimensions = FUNNEL_GROUP_DIMENSIONS, derived = null) {
  const { contract } = getReport(result.reportId)
  const period = periodColumns(result)
  const detailRows = result.rows.filter((row) => !isTotalRow(row, contract))
  const sourceRows = detailRows.length ? detailRows : result.rows
  const sem = contract.column_semantics
  // Curated funnel views need the stage measures to remain visible even when the
  // generic report rollup marks distinct counts as non-summable.
  // separate_total_cte(목표 2종·시승 actual_cnt)도 여기 포함한다 — 상세 합산은
  // 근사치지만, 아래에서 derived 값이 오면 덮어쓴다. 채널(활동유형)처럼 GOLD가
  // 나눌 수 없는 grain에서는 이 근사치가 유일한 분해 수단이다.
  const additive = Object.keys(sem)
    .filter((column) => ['additive', 'distinct_count', 'separate_total_cte'].includes(sem[column].type))
  const ratios = Object.keys(sem).filter((column) => sem[column].recompute_ratio)
  const impossibleRatios = Object.keys(sem).filter((column) => sem[column].recompute_impossible)
  const dims = groupDimensions.filter((column) => (result.dimensionColumns || []).includes(column))
  const columns = [...period.columns, ...dims]
  const groups = new Map()

  for (const row of sourceRows) {
    const groupValues = {
      ...period.valuesForRow(row),
      ...Object.fromEntries(dims.map((column) => [column, row[column]])),
    }
    const key = keyFor(columns.map((column) => groupValues[column]))
    if (!groups.has(key)) {
      groups.set(key, {
        ...groupValues,
        ...Object.fromEntries(additive.map((column) => [column, 0])),
      })
    }
    const target = groups.get(key)
    for (const column of additive) target[column] += numberValue(row[column])
  }

  const rows = [...groups.values()].map((row) => {
    const out = { ...row }

    // GOLD를 이 grain으로 다시 돌린 값이 있으면 상세 합산분을 덮어쓴다.
    // 비율은 그 다음에 계산해야 분자·분모가 모두 정확한 값이 된다.
    if (derived) {
      const key = derived.keyOf(derived.grain.map((column) => out[column]))
      const exact = derived.byKey.get(key)
      if (exact) for (const [column, value] of Object.entries(exact)) out[column] = value
    }

    for (const column of ratios) {
      const { denominator } = sem[column]
      const d = numberValue(out[denominator])
      const n = numeratorColumns(sem[column]).reduce((sum, c) => sum + numberValue(out[c]), 0)
      out[column] = d === 0 ? 0 : n / d
    }
    // 분자가 출력 컬럼에 없어 다시 만들 수 없는 비율은 비운다(계약 진행률).
    // 키를 아예 빼면 표에서 열이 사라져 "값이 없다"와 "열이 없다"가 구분되지 않는다.
    for (const column of impossibleRatios) out[column] = null
    return out
  })

  return { columns, rows }
}

function buildFunnelPyramidModel(result, derived = null, channelDerived = null) {
  const enriched = {
    ...result,
    dimensionColumns: [...new Set([...(result.dimensionColumns || []), FUNNEL_CHANNEL_FIELD])],
    rows: result.rows.map((row) => ({ ...row, [FUNNEL_CHANNEL_FIELD]: funnelPyramidChannel(row) })),
  }
  const rollup = aggregateFunnelRows(enriched, [...FUNNEL_GROUP_DIMENSIONS, FUNNEL_CHANNEL_FIELD])
  const baseColumns = rollup.columns.filter((column) => column !== FUNNEL_CHANNEL_FIELD)
  const extraChannels = orderedChannels(rollup.rows.map((row) => row[FUNNEL_CHANNEL_FIELD]))
    .filter((channel) => !FUNNEL_CHANNEL_ORDER.includes(channel))
  const channels = [...FUNNEL_CHANNEL_ORDER, ...extraChannels]
  const groups = new Map()

  for (const row of rollup.rows) {
    const groupKey = keyFor(baseColumns.map((column) => row[column]))
    if (!groups.has(groupKey)) {
      const values = Object.fromEntries(baseColumns.map((column) => [column, row[column]]))
      // 채널 분해는 상세 행에서만 만들 수 있지만, 단계 합계는 GOLD를 그 grain으로
      // 다시 돌린 값이 정확하다. 채널 합과 1~2건 어긋날 수 있는데, 채널을 비례
      // 배분해 맞추면 없는 숫자를 지어내는 것이라 측정값 그대로 둔다.
      const exact = derived
        ? derived.byKey.get(derived.keyOf(derived.grain.map((column) => values[column]))) || null
        : null
      // 채널 값도 GOLD를 그 채널(common_tp_nm)로 다시 돌린 것이 정답이다 — BI에서 상단
      // 버튼을 눌렀을 때 나오는 바로 그 숫자다. 상세 행 합산은 자격 조건이 더 엄격해
      // 값이 작게 나온다(2026-04 토요타 강남 기회: 605 vs 635).
      const exactChannels = channelDerived
        ? new Map([...channelDerived.byKey].map(([channel, perGroup]) => [
          channel,
          perGroup.get(channelDerived.keyOf(channelDerived.grain.map((column) => values[column]))) || null,
        ]))
        : null
      groups.set(groupKey, { values, channels: new Map(), exact, exactChannels })
    }
    groups.get(groupKey).channels.set(row[FUNNEL_CHANNEL_FIELD], row)
  }

  return { baseColumns, channels, groups: [...groups.values()] }
}

function projectFunnelCoreWide(result, derived = null) {
  const rollup = aggregateFunnelRows(result, FUNNEL_GROUP_DIMENSIONS, derived)
  const columns = [...rollup.columns, ...FUNNEL_CORE_WIDE_FIELDS.map(([label]) => label)]
  const rows = rollup.rows.map((row) => {
    const out = Object.fromEntries(rollup.columns.map((col) => [col, row[col]]))
    for (const [label, source] of FUNNEL_CORE_WIDE_FIELDS) out[label] = row[source]
    return out
  })

  return {
    columns,
    rows,
    totalRowIndexes: [],
    reportView: 'funnel_core_wide',
    chartCode: 'table',
    filterFields: filterFieldsFor(columns),
  }
}

function projectFunnelStageRows(result, reportView = 'funnel_stage_rows', derived = null) {
  const rollup = aggregateFunnelRows(result, FUNNEL_GROUP_DIMENSIONS, derived)
  const columns = [...rollup.columns, '단계', '실적', '목표', '진행률']
  const rows = []

  for (const sourceRow of rollup.rows) {
    for (const stage of FUNNEL_STAGE_FIELDS) {
      rows.push({
        ...Object.fromEntries(rollup.columns.map((col) => [col, sourceRow[col]])),
        단계: stage.stage,
        실적: sourceRow[stage.actual],
        목표: sourceRow[stage.target],
        진행률: sourceRow[stage.progress],
      })
    }
  }

  return {
    columns,
    rows,
    totalRowIndexes: [],
    reportView,
    chartCode: reportView === 'funnel_stage_chart' ? 'funnel' : 'table',
    filterFields: filterFieldsFor(columns),
  }
}

function projectFunnelPyramidTable(result, derived = null, channelDerived = null) {
  const { baseColumns, channels, groups } = buildFunnelPyramidModel(result, derived, channelDerived)
  const columns = [...baseColumns, '단계', '단계 합계', '전체 전환율', '항목', ...channels]

  const rows = []
  for (const group of groups) {
    const stageTotals = FUNNEL_STAGE_FIELDS.map((stage) => {
      if (group.exact && group.exact[stage.actual] !== undefined) return numberValue(group.exact[stage.actual])
      return channels.reduce((sum, channel) => sum + numberValue(group.channels.get(channel)?.[stage.actual]), 0)
    })
    const baseValuesByChannel = new Map()
    let previousValuesByChannel = null

    FUNNEL_STAGE_FIELDS.forEach((stage, stageIndex) => {
      const valuesByChannel = new Map(channels.map((channel) => [
        channel,
        group.exactChannels?.get(channel)?.[stage.actual] !== undefined
          ? numberValue(group.exactChannels.get(channel)[stage.actual])
          : numberValue(group.channels.get(channel)?.[stage.actual]),
      ]))
      if (stageIndex === 0) {
        for (const [channel, value] of valuesByChannel) baseValuesByChannel.set(channel, value)
      }
      const stageTotal = stageTotals[stageIndex]
      const previousTotal = stageIndex > 0 ? stageTotals[stageIndex - 1] : null
      const totalConversion = previousTotal ? percentText((stageTotal / previousTotal) * 100) : '-'

      for (const label of FUNNEL_PYRAMID_ROW_LABELS) {
        const out = {
          ...group.values,
          단계: funnelPyramidStage(stage.stage),
          '단계 합계': stageTotal,
          '전체 전환율': totalConversion,
          항목: label,
        }
        for (const channel of channels) {
          const value = valuesByChannel.get(channel) || 0
          const baseValue = baseValuesByChannel.get(channel)
          const previousValue = previousValuesByChannel?.get(channel)
          out[channel] = label === '퍼널 숫자'
            ? value
            : label === '활동대비'
              ? (stageIndex <= 1 || !baseValue ? '-' : percentText((value / baseValue) * 100))
              : label === '전단계대비'
                ? (stageIndex === 0 || !previousValue ? '-' : percentText((value / previousValue) * 100))
                : (stageTotal ? percentText((value / stageTotal) * 100) : '-')
        }
        rows.push(out)
      }
      previousValuesByChannel = valuesByChannel
    })
  }

  return {
    columns,
    rows,
    totalRowIndexes: [],
    reportView: 'funnel_pyramid_table',
    chartCode: 'table',
    title: '표로 보기 (평시 퍼널)',
    filterFields: filterFieldsFor(columns),
  }
}

function projectFunnelPyramidChart(result, derived = null, channelDerived = null) {
  const { baseColumns, channels, groups } = buildFunnelPyramidModel(result, derived, channelDerived)
  const columns = [...baseColumns, '단계', '단계 합계', ...channels]
  const rows = []

  for (const group of groups) {
    for (const stage of FUNNEL_STAGE_FIELDS) {
      const channelValues = Object.fromEntries(channels.map((channel) => [
        channel,
        group.exactChannels?.get(channel)?.[stage.actual] !== undefined
          ? numberValue(group.exactChannels.get(channel)[stage.actual])
          : numberValue(group.channels.get(channel)?.[stage.actual]),
      ]))
      rows.push({
        ...group.values,
        단계: funnelPyramidStage(stage.stage),
        '단계 합계': group.exact && group.exact[stage.actual] !== undefined
          ? numberValue(group.exact[stage.actual])
          : channels.reduce((sum, channel) => sum + channelValues[channel], 0),
        ...channelValues,
      })
    }
  }

  return {
    columns,
    rows,
    totalRowIndexes: [],
    reportView: 'funnel_pyramid_chart',
    chartCode: 'funnel_pyramid',
    title: '평시 퍼널',
    filterFields: filterFieldsFor(columns),
  }
}

export function projectReportView(result, selectedColumns = null, reportView = null, derived = null, channelDerived = null) {
  if (result.reportId === 'funnel_full_structure') {
    if (reportView === 'funnel_core_wide') return projectFunnelCoreWide(result, derived)
    if (reportView === 'funnel_stage_rows') return projectFunnelStageRows(result, 'funnel_stage_rows', derived)
    if (reportView === 'funnel_stage_chart') return projectFunnelStageRows(result, 'funnel_stage_chart', derived)
    if (reportView === 'funnel_pyramid_table') return projectFunnelPyramidTable(result, derived, channelDerived)
    if (reportView === 'funnel_pyramid_chart') return projectFunnelPyramidChart(result, derived, channelDerived)
  }
  return {
    ...projectColumns(result, selectedColumns),
    reportView: null,
    chartCode: 'table',
    filterFields: [],
  }
}

/**
 * 상세 행을 더 굵은 grain으로 접는다(예: 활동유형·전시장을 빼고 딜러 단위로).
 *
 * 단순 GROUP BY SUM이 아니다 — 컬럼마다 집계 규칙이 다르다:
 *   - additive(활동목표/실적, 기회목표/실적, 계약실적): 그대로 합산
 *   - 계약목표: 팀(또는 SC) 단위 값이 활동유형 행마다 반복돼 있다. 먼저 그 상위 grain
 *     키로 중복을 제거한 뒤 합산한다. GOLD 합계 행의 sc_first=1과 같은 규칙을
 *     임의 grain으로 일반화한 것.
 *   - 비율 5개: 행 평균이 아니라 분자·분모를 각각 합산해 다시 나눈다.
 *
 * 합계 행은 입력에서 제외한다(이미 집계된 행이라 다시 접으면 이중 계산된다).
 * SQL이 만든 합계 행은 그대로 살려 붙인다 — 그게 정답이고, 롤업 결과와 대조하는
 * 검산 수단이기도 하다.
 */
// 표시 축처럼 요청되지만 실은 그 리포트가 파라미터로 거르는 조건들.
// 값을 말한 것이지 쪼개 달라는 뜻이 아니다 — "sc중 재직자별", "자사출고에 대한".
// 리포트마다 파라미터 이름이 갈려(active_yn / ActiveYn / ActYn) 후보를 모두 적는다.
const ROLLUP_AXIS_AS_PARAMETER = {
  재직여부: ['active_yn', 'ActiveYn', 'ActYn'],
  브랜드: ['brand', 'Brand'],
  활동유형: ['common_tp_nm', 'CommonTpNm', 'common_tp'],
}

export function rollupReportRows(result, keepDimensions) {
  const { contract } = getReport(result.reportId)
  const sem = contract.column_semantics
  const dims = result.dimensionColumns || []

  const resolveDim = (dimension) => {
    if (dims.includes(dimension)) return dimension
    return (DIMENSION_ALIASES[dimension] || []).find((alias) => dims.includes(alias)) || null
  }
  // 파라미터로 거를 축을 묶는 축으로 요청하는 일이 있다("sc중 재직자별").
  // 그 리포트가 그 조건을 파라미터로 받으면 이미 걸러진 결과라 묶을 이유가 없다 —
  // 표를 통째로 거절하지 말고 그 축만 뺀다(2026-08-06 평가 No.11).
  const paramNames = new Set(contract.parameters.map((p) => String(p.name).toLowerCase()))
  const filterableAxis = (name) => (ROLLUP_AXIS_AS_PARAMETER[String(name).replace(/\s+/g, '')] || [])
    .some((candidate) => paramNames.has(candidate.toLowerCase()))
  const requested = (keepDimensions || [])
    .filter((dimension) => resolveDim(dimension) || !filterableAxis(dimension))
    .map((dimension) => ({ asked: dimension, actual: resolveDim(dimension) }))
  const unknown = requested.filter((item) => !item.actual).map((item) => item.asked)
  if (unknown.length > 0) {
    throw new Error(`이 표에 없는 컬럼입니다: ${unknown.join(', ')} (사용 가능: ${dims.join(', ')})`)
  }
  const resolved = requested.map((item) => item.actual)
  const keep = dims.filter((dimension) => resolved.includes(dimension)) // 원래 컬럼 순서 유지

  const repeated = Object.keys(sem).filter((c) => sem[c].type === 'repeated_higher_grain_value')
  const higherRatios = Object.keys(sem).filter((c) => sem[c].type === 'higher_grain_ratio')
  const repeatedGrain = Object.fromEntries(repeated.map((col) => [
    col,
    result.branch === 'b' ? sem[col].grain_branch_b : sem[col].grain_branch_a,
  ]))
  const additive = Object.keys(sem).filter((c) => sem[c].type === 'additive')
  // 뺄셈으로 만든 값은 다시 계산한다. 바닥(floor)이 걸린 값은 더하면 부풀려진다 —
  // 실적이 목표를 넘긴 행이 0으로 잘리면서 음수 상쇄분이 사라진다.
  const differences = Object.keys(sem).filter((c) => sem[c].type === 'derived_difference')
  const ratios = Object.keys(sem).filter((c) => sem[c].recompute_ratio && !higherRatios.includes(c))
  const nonSummable = Object.keys(sem).filter(
    (c) => sem[c].direct_sum_forbidden
      && !repeated.includes(c) && !higherRatios.includes(c) && !ratios.includes(c)
      // 뺄셈 파생값은 아래에서 다시 계산한다 — 여기서 비우면 그 결과가 덮인다.
      && !differences.includes(c),
  )

  const detailRows = result.rows.filter((r) => !isTotalRow(r, contract))
  const totalRows = result.rows.filter((r) => isTotalRow(r, contract))

  const keyOf = (row, cols) => cols.map((c) => String(row[c] ?? '\u0000')).join('\u001f')
  const num = (v) => Number(v) || 0

  const groups = new Map()
  for (const row of detailRows) {
    const k = keyOf(row, keep)
    if (!groups.has(k)) {
      groups.set(k, {
        dims: Object.fromEntries(keep.map((c) => [c, row[c]])),
        rows: [],
        higher: Object.fromEntries(repeated.map((col) => [col, new Map()])),
      })
    }
    const g = groups.get(k)
    g.rows.push(row)
    // 상위 grain 값은 키당 한 번만 센다(반복 표시된 값을 중복 합산하지 않기 위해).
    for (const col of repeated) {
      const grain = repeatedGrain[col] || []
      const hk = keyOf(row, grain)
      if (!g.higher[col].has(hk)) g.higher[col].set(hk, row)
    }
  }

  const rows = [...groups.values()].map((g) => {
    const out = { ...g.dims }

    for (const col of additive) out[col] = g.rows.reduce((s, r) => s + num(r[col]), 0)

    // 뺄셈 파생값은 피감수·감수를 각각 합산한 뒤 식을 다시 적용한다.
    for (const col of differences) {
      const spec = sem[col]
      const a = g.rows.reduce((s, r) => s + num(r[spec.minuend]), 0)
      const b = g.rows.reduce((s, r) => s + num(r[spec.subtrahend]), 0)
      const v = a - b
      out[col] = spec.floor !== undefined ? Math.max(spec.floor, v) : v
    }

    // DISTINCT count처럼 셀을 더해도 상위 합계가 안 되는 컬럼은 비워 둔다.
    for (const col of nonSummable) out[col] = null

    // 상위 grain 반복값은 중복 제거한 뒤 합산한다.
    const repeatedSum = {}
    for (const col of repeated) {
      const value = [...g.higher[col].values()].reduce((s, r) => s + num(r[col]), 0)
      repeatedSum[col] = value
      out[col] = value
    }

    for (const col of higherRatios) {
      const denominator = sem[col].denominator
      if (!denominator || !repeated.includes(denominator)) {
        out[col] = null
        continue
      }
      const unique = [...g.higher[denominator].values()]
      const d = repeatedSum[denominator]
      const n = unique.reduce((sum, row) => {
        const ratioValue = row[col]
        return ratioValue === null || ratioValue === undefined ? sum : sum + (Number(ratioValue) * num(row[denominator]))
      }, 0)
      out[col] = d === 0 ? null : n / d
    }

    for (const col of ratios) {
      const { denominator } = sem[col]
      const numerator = numeratorColumns(sem[col])
      if (!denominator || numerator.length === 0) {
        out[col] = null
        continue
      }
      if (repeated.includes(denominator)) {
        // 분모는 중복 제거해서 더하고, 분자는 상세 행을 그대로 더한다.
        //
        // 예전에는 grain별로 남긴 대표 행 하나의 비율을 분모로 가중평균했는데, GOLD가
        // 비율을 **상세 행 단위**로 계산하는 리포트에서 크게 틀렸다. sales_achievement_contract는
        // 행마다 (그 모델 실적)/(팀 타겟)이라 대표 행 하나의 비율은 그 모델 몫일 뿐이다
        // (2026-08-05 실측: 1월 렉서스 강남 실적 437 / 타겟 1,013 = 43.1%인데 16.6%가 나왔다).
        // 비율이 상위 grain에서 계산돼 모든 행이 같은 값을 갖는 리포트(activity_funnel_status의
        // 계약진행률)에서는 어느 방식이든 같은 값이 나오므로 이 계산이 더 넓게 맞는다.
        const d = repeatedSum[denominator]
        const n = numerator.reduce((sum, c) => sum
          + (repeated.includes(c) ? repeatedSum[c] : g.rows.reduce((s, r) => s + num(r[c]), 0)), 0)
        out[col] = d === 0 ? (sem[col].zero_denominator_result ?? null) : n / d
        continue
      }
      const n = numerator
        .reduce((sum, c) => sum + g.rows.reduce((s, r) => s + num(r[c]), 0), 0)
      const d = g.rows.reduce((s, r) => s + num(r[denominator]), 0)
      // GOLD 상세 행과 같은 0 분모 처리 규칙을 따른다.
      if (d === 0) out[col] = sem[col].zero_denominator_result ?? null
      else out[col] = n / d
    }

    return out
  })

  return {
    columns: [...keep, ...Object.keys(sem)],
    dimensionColumns: keep,
    rows,
    totalRows,
    collapsed: dims.filter((d) => !keep.includes(d)),
  }
}

/**
 * 이 리포트 결과에서 차트로 만들 수 있는 측정값만 돌려준다.
 *
 * 계약목표처럼 상위 grain 값이 반복된 컬럼과 비율 컬럼은 그대로 합산/평균하면
 * 조용히 틀린 그래프가 된다. 그런 컬럼은 후보에서 빼고, 왜 뺐는지도 함께 돌려줘서
 * 사용자에게 그대로 설명할 수 있게 한다.
 */
export function chartableMeasures(reportId) {
  const { contract, projection } = getReport(reportId)
  const blocked = projection?.blocked_measures || {}

  const allowed = []
  const rejected = []
  for (const [name, sem] of Object.entries(contract.column_semantics)) {
    if (sem.direct_sum_forbidden || sem.direct_average_forbidden) {
      rejected.push({ column: name, ...(blocked[name] || { reason: '집계 규칙상 직접 차트화할 수 없습니다.' }) })
    } else {
      allowed.push(name)
    }
  }
  return { allowed, rejected, presets: projection?.presets || [] }
}
