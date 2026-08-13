// REPORT_COMPOSED 실행기 — 인증 리포트의 **검증된 행집합** 위에서 새 집계를 만든다.
//
// 등록 SQL은 한 글자도 고치지 않는다. 고칠 수 있게 만드는 순간 GOLD와 값이 갈릴 길이
// 열리고, 그건 오류 없이 틀린 숫자가 나가는 가장 흔한 모양이다.
//
// 두 갈래로 나눠 처리한다:
//   푸시다운  리포트가 파라미터로 받아주는 조건(딜러·브랜드·전시장·팀·SC·관심도 등)
//   잔여 조건 리포트가 파라미터로 못 받는 조건 — 실행 후 행에서 건다
//
// lead_list가 대표적이다. 날짜 파라미터가 등록일뿐이라 "7월 출고"는 내려보낼 방법이 없다.
// 그래서 실행 후 행에서 [출고일]로 거는 것이고, 이것이 이 실행기가 존재하는 이유다.
import { executeReport } from '../../reports/executor.js'
import { canonicalizeValues } from '../../agentic-bi/dimensionValues.js'
import { compositionLimits } from '../reportSemantics.js'
import { OPERATOR } from '../requirement.js'
import { norm } from '../text.js'
import { grainOfConcept, bucketOf, GRAIN_LABEL } from '../timeGrain.js'

export class ComposeError extends Error {
  constructor(code, message, extra = {}) {
    super(message)
    this.name = 'ComposeError'
    this.code = code
    Object.assign(this, extra)
  }
}

/** 드라이버가 Date 객체로 주는 날짜를 저장된 그대로의 ISO 10자로. projection.js와 같은 규칙. */
export function cellDate(value) {
  if (value == null) return null
  if (value instanceof Date) return value.toISOString().slice(0, 10)
  const s = String(value).trim()
  const m = s.match(/^(\d{4}-\d{2}-\d{2})/)
  return m ? m[1] : null
}

/**
 * 요구 조건을 "내려보낼 것"과 "행에서 걸 것"으로 나눈다.
 *
 * @returns {{pushdown: object, residual: Array, notes: Array}}
 */
export function splitPredicates(requirement, coverage, semantics) {
  const pushdown = {}
  const residual = []
  const notes = []

  const byConcept = new Map(coverage.map((c) => [norm(c.concept), c]))

  for (const cond of requirement.conditions || []) {
    const hit = byConcept.get(norm(cond.concept))
    if (!hit) {
      // 라우터가 이미 전부 덮인 것을 확인했으므로 여기 오면 안 된다. 조용히 버리지 않는다.
      throw new ComposeError('unmapped_condition', `조건 '${cond.concept}'을 리포트 컬럼에 연결하지 못했습니다.`)
    }
    const column = hit.column
    const pushParam = pushdownParameterFor(column, semantics, cond)
    if (pushParam) {
      pushdown[pushParam.name] = pushParam.value
      notes.push({ concept: cond.concept, mode: 'pushdown', parameter: pushParam.name, values: cond.values })
      continue
    }
    residual.push({ concept: cond.concept, label: column.label, operator: cond.operator, values: cond.values, role: column.role })
    notes.push({ concept: cond.concept, mode: 'residual', column: column.label, values: cond.values })
  }

  // 기간 조건. 리포트가 그 날짜의 기간 파라미터를 받으면 내려보내고, 아니면 행에서 건다.
  if (requirement.time?.start && requirement.time?.end) {
    const hit = byConcept.get(norm(requirement.time.time_concept))
    if (!hit) throw new ComposeError('unmapped_time', `기준 날짜 '${requirement.time.time_concept}'를 리포트 컬럼에 연결하지 못했습니다.`)
    const column = hit.column
    const range = column.pushdown_parameter
    if (range && typeof range === 'object' && range.from && range.to) {
      pushdown[range.from] = requirement.time.start
      pushdown[range.to] = requirement.time.end
      notes.push({ concept: column.label, mode: 'pushdown', parameter: `${range.from}/${range.to}` })
    } else {
      residual.push({
        concept: column.label,
        label: column.label,
        operator: OPERATOR.BETWEEN,
        values: [requirement.time.start, requirement.time.end],
        role: 'date',
      })
      // 기간은 못 내려도 "그 날짜가 있는 행만" 정도는 내려보낼 수 있는 리포트가 있다.
      const partial = column.pushdown_parameter_partial
      if (partial?.name) {
        pushdown[partial.name] = partial.value
        notes.push({ concept: column.label, mode: 'pushdown_partial', parameter: partial.name, value: partial.value })
      }
      notes.push({ concept: column.label, mode: 'residual', column: column.label, why: '이 리포트에는 이 날짜의 기간 파라미터가 없다' })
    }
  }

  return { pushdown, residual, notes }
}

function pushdownParameterFor(column, semantics, cond) {
  // 컬럼 자신이 파라미터를 갖고 있는가(단일 이름일 때만 — from/to 쌍은 기간 전용).
  if (typeof column.pushdown_parameter === 'string') {
    return { name: column.pushdown_parameter, value: cond.values.join(',') }
  }
  // 조직 축은 columns가 아니라 pushdown 블록에 선언되어 있다.
  const entry = semantics.pushdown?.[column.concept] || semantics.pushdown?.[column.global_dimension]
  if (entry?.parameter) return { name: entry.parameter, value: cond.values.join(',') }
  return null
}

/**
 * 조직 축 값을 실제 값으로 맞춘다("강남" → "렉서스 강남").
 * 리포트는 LTRIM/RTRIM 정확 일치라 여기서 안 맞추면 **오류 없이 0행**이 된다.
 */
export async function canonicalizePushdown(requirement, coverage, semantics, { canonicalize = canonicalizeValues } = {}) {
  const changes = []
  const byConcept = new Map(coverage.map((c) => [norm(c.concept), c]))
  const conditions = []
  const brands = (requirement.conditions || []).find((c) => norm(c.concept) === norm('브랜드'))?.values

  for (const cond of requirement.conditions || []) {
    const hit = byConcept.get(norm(cond.concept))
    const dimensionId = hit?.column?.global_dimension
      || semantics.pushdown?.[hit?.column?.concept]?.global_dimension
      || null
    if (!dimensionId) { conditions.push(cond); continue }

    let result
    try {
      result = await canonicalize(dimensionId, cond.values, { brands })
    } catch {
      result = null   // 값 목록을 못 읽으면 원래 값을 쓴다 — 조회 실패로 질문을 막지 않는다
    }
    if (!result) { conditions.push(cond); continue }
    if (result.ok === false) {
      throw new ComposeError('ambiguous_value', result.question, { options: result.options, clarification: true })
    }
    if (Object.keys(result.changed || {}).length) {
      changes.push({ concept: cond.concept, changed: result.changed })
    }
    // "이 값은 이 축이 아니라 저 축의 것"이라는 판정. 버리면 원래 축에 그대로 걸려
    // **오류 없이 0행**이 된다 — canonicalizeValues가 이 판정을 하는 이유가 그것이다.
    // 여기서는 옮겨 담을 축이 이 리포트에 있는지 확인한 뒤에만 옮긴다.
    if (result.relocated?.length) {
      for (const move of result.relocated) {
        const target = conceptForDimension(semantics, move.to)
        if (!target) {
          throw new ComposeError(
            'value_belongs_elsewhere',
            `'${move.input}'은 ${labelOfDimension(semantics, dimensionId)}가 아니라 ${move.label}입니다. `
            + `이 리포트는 그 축으로 거를 수 없습니다.`,
            { clarification: true }
          )
        }
        changes.push({ concept: cond.concept, relocated_to: target, value: move.value, was: move.input })
        conditions.push({ concept: target, operator: cond.operator, values: [move.value] })
      }
      if (!result.values.length) continue
    }
    if (result.values.length) conditions.push({ ...cond, values: result.values })
  }
  return { requirement: { ...requirement, conditions }, changes }
}

/** 글로벌 차원 id → 이 리포트에서 그 축을 가리키는 개념 이름. 없으면 null. */
function conceptForDimension(semantics, dimensionId) {
  for (const [concept, entry] of Object.entries(semantics.pushdown || {})) {
    if (entry.global_dimension === dimensionId || concept === dimensionId) return concept
  }
  return semantics.columns.find((c) => c.global_dimension === dimensionId)?.concept || null
}

function labelOfDimension(semantics, dimensionId) {
  return semantics.columns.find((c) => c.global_dimension === dimensionId)?.label || dimensionId
}

/** 실행 후 행에 남은 조건을 건다. 날짜는 ISO 10자로 비교한다. */
export function applyResidualFilters(rows, residual) {
  let out = rows
  const applied = []
  for (const r of residual) {
    const before = out.length
    if (r.operator === OPERATOR.BETWEEN && r.role === 'date') {
      const [start, end] = r.values
      out = out.filter((row) => {
        const d = cellDate(row[r.label])
        return d != null && d >= start && d <= end
      })
    } else if (r.operator === OPERATOR.BETWEEN) {
      const [start, end] = r.values.map(Number)
      out = out.filter((row) => {
        const n = Number(row[r.label])
        return Number.isFinite(n) && n >= start && n <= end
      })
    } else if (r.operator === OPERATOR.GTE || r.operator === OPERATOR.LTE) {
      const bound = r.role === 'date' ? r.values[0] : Number(r.values[0])
      out = out.filter((row) => {
        const v = r.role === 'date' ? cellDate(row[r.label]) : Number(row[r.label])
        if (v == null || (typeof v === 'number' && !Number.isFinite(v))) return false
        return r.operator === OPERATOR.GTE ? v >= bound : v <= bound
      })
    } else {
      const wanted = new Set(r.values.map(norm))
      out = out.filter((row) => wanted.has(norm(row[r.label])))
    }
    applied.push({ column: r.label, operator: r.operator, values: r.values, rows_before: before, rows_after: out.length })
  }
  return { rows: out, applied }
}

/**
 * 리포트 row grain에 맞춰 센다. COUNT(*)를 근거 없이 쓰지 않는다(지시 11장) —
 * 계약이 선언한 counting.operation 을 따른다.
 */
export function countAtRowGrain(rows, rowGrain) {
  const op = rowGrain?.counting?.operation
  if (op === 'count_distinct' && rowGrain.unique_key_column) {
    return new Set(rows.map((r) => String(r[rowGrain.unique_key_column]))).size
  }
  if (op === 'count_rows') return rows.length
  throw new ComposeError(
    'row_grain_not_declared',
    `리포트의 row grain에 셈 방법이 선언되어 있지 않습니다 — 무엇을 한 건으로 셀지 근거가 없어 실행하지 않습니다.`
  )
}

/**
 * 축별로 묶어 센다.
 *
 * spec.grain이 있으면 그 컬럼은 날짜라 단위로 잘라 묶는다 — "월별"은 출고일 하나하나가
 * 아니라 그 달로 묶으라는 뜻이다. 날짜를 그대로 축으로 쓰면 하루가 한 줄이 된다.
 *
 * @param {Array<{label, grain?, title?}>} groupSpecs
 */
export function groupAtRowGrain(rows, groupSpecs, rowGrain) {
  const specs = groupSpecs.map((g) => (typeof g === 'string' ? { label: g, grain: null } : g))
  const cellOf = (row, spec) => (spec.grain ? bucketOf(spec.grain, cellDate(row[spec.label])) : row[spec.label])

  const buckets = new Map()
  for (const row of rows) {
    const key = specs.map((s) => String(cellOf(row, s) ?? '')).join(' | ')
    if (!buckets.has(key)) buckets.set(key, [])
    buckets.get(key).push(row)
  }
  const out = []
  for (const [, bucketRows] of buckets) {
    const entry = {}
    for (const s of specs) entry[s.title || s.label] = cellOf(bucketRows[0], s)
    entry['건수'] = countAtRowGrain(bucketRows, rowGrain)
    out.push(entry)
  }
  // 시간 축이 있으면 시간 순으로 읽는 것이 맞다. 없으면 큰 것부터.
  const timeSpec = specs.find((s) => s.grain)
  if (timeSpec) {
    const key = timeSpec.title || timeSpec.label
    out.sort((a, b) => String(a[key]).localeCompare(String(b[key])))
  } else {
    out.sort((a, b) => b['건수'] - a['건수'])
  }
  return out
}

/**
 * 요구의 group_by를 리포트 컬럼 축으로 옮긴다.
 * 단위 축은 기준 날짜 컬럼을 그 단위로 자르는 것으로 실현한다.
 */
export function buildGroupSpecs(requirement, coverage) {
  const specs = []
  for (const g of requirement.group_by || []) {
    if (grainOfConcept(g) && grainOfConcept(g) === requirement.output_grain) {
      const dateHit = coverage.find((c) => norm(c.concept) === norm(requirement.time?.time_concept))
      if (!dateHit) {
        throw new ComposeError('grain_without_date',
          `'${GRAIN_LABEL[requirement.output_grain]}'로 나누려면 기준 날짜가 필요한데 어느 날짜인지 확인하지 못했습니다.`)
      }
      specs.push({ label: dateHit.column.label, grain: requirement.output_grain, title: `${dateHit.column.label}(${GRAIN_LABEL[requirement.output_grain]})` })
      continue
    }
    const hit = coverage.find((c) => norm(c.concept) === norm(g))
    if (hit) specs.push({ label: hit.column.label, grain: null })
  }
  return specs
}

/**
 * 실행 전체.
 *
 * @returns {{value, rows, groupRows, stats, params, residual, notes, canonicalization}}
 */
export async function runReportComposed(requirement, routed, {
  runReport = executeReport,
  canonicalize = canonicalizeValues,
  accessContext,
} = {}) {
  const { semantics, coverage } = routed.report
  if (!semantics.composable) {
    throw new ComposeError('report_not_composable', `리포트 '${semantics.report_id}'는 ${semantics.composable_blocked_by || 'row grain 미선언'} — 새 집계에 쓸 수 없습니다.`)
  }

  const canon = await canonicalizePushdown(requirement, coverage, semantics, { canonicalize })
  const { pushdown, residual, notes } = splitPredicates(canon.requirement, coverage, semantics)

  const result = await runReport(semantics.report_id, pushdown, accessContext ? { accessContext } : {})
  const limits = compositionLimits(semantics)
  if (result.rows.length > limits.maxRowsFetched) {
    throw new ComposeError(
      'too_many_rows',
      `이 조건으로는 리포트에서 ${result.rows.length.toLocaleString()}행을 가져와야 합니다(한도 ${limits.maxRowsFetched.toLocaleString()}행). `
      + `조건을 더 좁혀 주시겠어요? 이 리포트가 파라미터로 받아주는 조건은 ${Object.keys(semantics.pushdown).join(', ')} 입니다.`,
      { clarification: true, fetched: result.rows.length }
    )
  }

  const filtered = applyResidualFilters(result.rows, residual)
  const groupSpecs = buildGroupSpecs(canon.requirement, coverage)
  const groupLabels = groupSpecs.map((s) => s.title || s.label)

  const value = countAtRowGrain(filtered.rows, semantics.row_grain)
  const groupRows = groupSpecs.length ? groupAtRowGrain(filtered.rows, groupSpecs, semantics.row_grain) : null

  return {
    value,
    rows: filtered.rows,
    groupRows,
    groupLabels,
    groupSpecs,
    params: pushdown,
    residual,
    notes,
    // Fidelity 게이트가 대조할 목록. **질문이 쓴 개념 이름 그대로** 남긴다 —
    // 파라미터 이름(dealer_nm)으로 남기면 '딜러'와 대조되지 않아 멀쩡한 조건이
    // "빠졌다"고 잡힌다.
    applied_filters: notes.filter((n) => n.values?.length).map((n) => ({ concept: n.concept, values: n.values, mode: n.mode })),
    canonicalization: canon.changes,
    stats: {
      fetched: result.rows.length,
      after_filter: filtered.rows.length,
      filter_steps: filtered.applied,
      row_grain: semantics.row_grain,
      report_cached: result.cached,
      fetched_at: result.fetchedAt,
    },
  }
}
