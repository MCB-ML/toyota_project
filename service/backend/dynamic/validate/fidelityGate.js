// Semantic Fidelity Gate — 실행 직전에 질문과 계획을 다시 맞춰 본다(지시 30장).
//
// 이 레이어가 잡으려는 사고는 늘 같은 모양이다: 쿼리는 성공하고 표도 멀쩡한데 값만 다르다.
// "7월 출고 중 QR 접수 건수"를 물었는데 계획이 계약 건수를 세고 있으면, 결과만 봐서는
// 아무도 모른다. 그래서 사람이 아니라 코드가 대조한다.
//
// 판정은 결정론적이다. 근거가 없는 항목은 검사하지 않는다 — 추측으로 막기 시작하면
// 정상 질문이 막힌다.
import { entityForRequirement } from '../resolutionRouter.js'
import { norm } from '../text.js'

export const SEVERITY = { HARD: 'hard', SOFT: 'soft' }

export const CODE = {
  OBJECT_MISMATCH: 'OBJECT_MISMATCH',
  AGGREGATION_MISMATCH: 'AGGREGATION_MISMATCH',
  TIME_ROLE_MISMATCH: 'TIME_ROLE_MISMATCH',
  TIME_RANGE_MISMATCH: 'TIME_RANGE_MISMATCH',
  MISSING_FILTER: 'MISSING_FILTER',
  VALUE_SUBSTITUTED: 'VALUE_SUBSTITUTED',
  MISSING_GROUPING: 'MISSING_GROUPING',
  GRAIN_WINDOW_TOO_NARROW: 'GRAIN_WINDOW_TOO_NARROW',
  ROW_GRAIN_UNDECLARED: 'ROW_GRAIN_UNDECLARED',
  CUMULATIVE_MISMATCH: 'CUMULATIVE_MISMATCH',
}

/**
 * @param {object} requirement  정규화된 Semantic Requirement
 * @param {object} plan  실행 직전 계획
 *   {entity, aggregation, time_column_concept, time_start, time_end,
 *    applied_filters: [{concept, values}], grouping: [concept], row_grain, cumulative}
 * @returns {{ok: boolean, violations: Array, checks: Array}}
 */
export function checkFidelity(requirement, plan) {
  const violations = []
  const checks = []
  const add = (code, severity, detail) => violations.push({ code, severity, detail })
  const pass = (name, detail) => checks.push({ name, detail })

  // 1) 대상 업무 객체
  const wantedEntity = entityForRequirement(requirement)
  if (wantedEntity && plan.entity) {
    if (wantedEntity === plan.entity) pass('target_business_object', `${wantedEntity}`)
    else add(CODE.OBJECT_MISMATCH, SEVERITY.HARD, `질문은 '${requirement.target_business_object}'(${wantedEntity})를 물었는데 계획은 ${plan.entity}를 셉니다.`)
  }

  // 2-0) 측정의 종류. 등록 지표 경로에서는 SQL 집계함수 대신 이걸 본다 —
  //      업무상 "건수"가 SQL에서 SUM(cnt)인 것은 정상이다(cnt가 건수 컬럼이다).
  //      의미 있는 검사는 "비율을 물었는데 절대값을 냈는가"다.
  if (plan.measure_kind) {
    const wantsRatio = requirement.aggregation_intent === 'ratio'
    if (wantsRatio && plan.measure_kind !== 'ratio') {
      add(CODE.AGGREGATION_MISMATCH, SEVERITY.HARD, `질문은 비율을 요구했는데 계획의 지표는 절대값입니다.`)
    } else if (!wantsRatio && plan.measure_kind === 'ratio') {
      add(CODE.AGGREGATION_MISMATCH, SEVERITY.HARD, `질문은 값을 요구했는데 계획의 지표는 비율입니다.`)
    } else {
      pass('measure_kind', plan.measure_kind)
    }
  }

  // 2) 집계 의도 — 코드가 직접 집계를 정하는 경로(리포트 조합·발견)에서만 본다.
  if (requirement.aggregation_intent && plan.aggregation) {
    const compatible = {
      count: ['count', 'count_rows', 'count_distinct'],
      count_distinct: ['count_distinct'],
      sum: ['sum'],
      average: ['average', 'avg'],
      ratio: ['ratio'],
      list: ['list'],
    }[requirement.aggregation_intent] || []
    if (compatible.includes(plan.aggregation)) pass('aggregation_intent', plan.aggregation)
    else add(CODE.AGGREGATION_MISMATCH, SEVERITY.HARD, `질문은 ${requirement.aggregation_intent}를 요구했는데 계획은 ${plan.aggregation}입니다.`)
  }

  // 3) 기준 날짜 역할 — "출고일"을 물었는데 "계약일"로 걸리면 값이 통째로 달라진다.
  if (requirement.time?.time_concept && plan.time_column_concept) {
    if (norm(requirement.time.time_concept) === norm(plan.time_column_concept)) {
      pass('time_role', plan.time_column_concept)
    } else {
      add(CODE.TIME_ROLE_MISMATCH, SEVERITY.HARD,
        `질문은 '${requirement.time.time_concept}' 기준인데 계획은 '${plan.time_column_concept}'으로 걸었습니다.`)
    }
  }

  // 4) 기간. 질문에서 코드가 직접 읽은 기간이 있으면 그것과 대조한다 —
  //    LLM이 기간을 흘리거나 넓혔는지 확인하는 유일한 결정론적 근거다.
  const fromQuestion = requirement.time_from_question
  if (fromQuestion && plan.time_start && plan.time_end) {
    if (fromQuestion.start === plan.time_start && fromQuestion.end === plan.time_end) {
      pass('time_range', `${plan.time_start} ~ ${plan.time_end}`)
    } else {
      add(CODE.TIME_RANGE_MISMATCH, SEVERITY.HARD,
        `질문에서 읽은 기간은 ${fromQuestion.start}~${fromQuestion.end}인데 계획은 ${plan.time_start}~${plan.time_end}입니다.`)
    }
  }
  if (requirement.time?.unresolved) {
    add(CODE.TIME_RANGE_MISMATCH, SEVERITY.HARD, `기간 표현 '${requirement.time.expression}'을 해석하지 못했습니다.`)
  }

  // 5) 요구한 조건이 전부 걸렸는가. 빠지는 쪽이 실제 사고였다 —
  //    조건 하나가 조용히 사라지면 숫자는 커지고 표는 멀쩡하다.
  const appliedByConcept = new Map((plan.applied_filters || []).map((f) => [norm(f.concept), f]))
  for (const cond of requirement.conditions || []) {
    const applied = appliedByConcept.get(norm(cond.concept))
    if (!applied) {
      add(CODE.MISSING_FILTER, SEVERITY.HARD, `요구한 조건 '${cond.concept}'이 계획에 없습니다.`)
      continue
    }
    // 6) 값이 바뀌었으면 그것이 정규화인지 대체인지 본다.
    //    "강남"→"렉서스 강남"은 정규화(원래 값을 포함). "QR 접수"→"수기 접수"는 대체 — 막는다.
    for (const wanted of cond.values) {
      const kept = (applied.values || []).some((v) => norm(v) === norm(wanted) || norm(v).includes(norm(wanted)))
      if (!kept) {
        add(CODE.VALUE_SUBSTITUTED, SEVERITY.HARD,
          `'${cond.concept}'에 요구한 값 '${wanted}'이 '${(applied.values || []).join(', ')}'으로 바뀌었습니다.`)
      }
    }
    pass('filter', `${cond.concept}=${(applied.values || []).join(',')}`)
  }

  // 7) 나눠 보자고 한 축이 결과에 있는가. plan.grouping이 null이면 축 이름이
  //    계층마다 달라 이름 대조가 무의미한 경우다(요구는 '월', IR은 time_month).
  if (plan.grouping) {
    for (const g of requirement.group_by || []) {
      if (!plan.grouping.some((x) => norm(x) === norm(g))) {
        add(CODE.MISSING_GROUPING, SEVERITY.HARD, `나눠 보자고 한 축 '${g}'이 결과에 없습니다.`)
      }
    }
  }

  // 7-1) 출력 단위(연/월/일별)를 요구했으면 그 축이 실제로 들어갔는가.
  //      "월별"이라고 했는데 축이 빠지면 표는 한 줄로 나오고 오류는 안 난다.
  if (plan.output_grain) {
    if (plan.grain_axis_present === false) {
      add(CODE.MISSING_GROUPING, SEVERITY.HARD, `'${plan.output_grain}' 단위로 나눠 보자고 했는데 그 축이 계획에 없습니다.`)
    } else {
      pass('output_grain', plan.output_grain)
    }
    // 7-2) 그 단위로 나눴을 때 칸이 하나뿐이면 단위를 요구한 의미가 없다.
    //      묶어도 한 줄이라 사용자는 "월별인데 왜 한 줄이지"를 화면에서만 알게 된다.
    if (plan.grain_buckets != null && plan.grain_buckets <= 1) {
      add(CODE.GRAIN_WINDOW_TOO_NARROW, SEVERITY.HARD,
        `${plan.output_grain} 단위로 나눠 보자고 했는데 기간이 ${plan.grain_buckets}칸뿐입니다(${plan.time_start} ~ ${plan.time_end}).`)
    }
  }

  // 8) 무엇을 한 건으로 세는지 근거가 있는가
  if (plan.aggregation && plan.aggregation !== 'list' && plan.requires_row_grain && !plan.row_grain) {
    add(CODE.ROW_GRAIN_UNDECLARED, SEVERITY.HARD, '무엇을 한 건으로 셀지 선언된 근거가 없습니다.')
  }

  // 9) 누적 여부 — 기존 안전망을 새 경로에서도 유지한다(지시 31장)
  const wantedWindow = requirement.legacy_constraints?.time?.calculation_window
  if (wantedWindow && plan.calculation_window && wantedWindow !== plan.calculation_window) {
    add(CODE.CUMULATIVE_MISMATCH, SEVERITY.HARD,
      `질문은 계산 창 ${wantedWindow}를 요구했는데 계획은 ${plan.calculation_window}입니다.`)
  }

  // 9-1) 별 vs 누적. **표는 같은 행 수로 나오고 값만 다르다** — 마지막으로 한 번 더 본다.
  //      "연도별"에 연누적 지표가 붙는 것을 창 이름이 아니라 성질로 막는다.
  if (requirement.cumulative != null && plan.calculation_window) {
    const w = plan.calculation_window
    const want = { year: 'year_to_date', month: 'month_to_date' }[requirement.cumulative]
    if (want && w !== want) {
      add(CODE.CUMULATIVE_MISMATCH, SEVERITY.HARD,
        `질문은 ${requirement.cumulative === 'year' ? '연누적' : '월누적'}을 요구했는데 계획의 지표 창은 ${w}입니다.`)
    } else if (requirement.cumulative === false && ['year_to_date', 'trailing'].includes(w)) {
      add(CODE.CUMULATIVE_MISMATCH, SEVERITY.HARD,
        `질문은 칸별(그 기간만)을 요구했는데 계획의 지표는 ${w}로 쌓아 셉니다.`)
    } else {
      pass('cumulative', requirement.cumulative === false ? '칸별' : `${requirement.cumulative === 'year' ? '연' : '월'}누적`)
    }
  }

  // 9-2) 누적의 **시작점**을 직접 본다. 창 이름이 맞아도 기간이 틀리면 값이 틀린다 —
  //      연누적은 1월 1일부터, 월누적은 그 달 1일부터가 업무 정의다.
  if (plan.time_start && plan.time_end) {
    if (requirement.cumulative === 'year' && !plan.time_start.endsWith('-01-01')) {
      add(CODE.CUMULATIVE_MISMATCH, SEVERITY.HARD,
        `연누적은 1월 1일부터여야 하는데 계획은 ${plan.time_start}부터입니다.`)
    }
    if (requirement.cumulative === 'month' && plan.time_start.slice(0, 7) !== plan.time_end.slice(0, 7)) {
      add(CODE.CUMULATIVE_MISMATCH, SEVERITY.HARD,
        `월누적은 그 달 1일부터여야 하는데 계획은 ${plan.time_start} ~ ${plan.time_end}로 달을 넘어갑니다.`)
    }
    if (requirement.cumulative === 'month' && !plan.time_start.endsWith('-01')) {
      add(CODE.CUMULATIVE_MISMATCH, SEVERITY.HARD,
        `월누적은 그 달 1일부터여야 하는데 계획은 ${plan.time_start}부터입니다.`)
    }
  }

  return {
    ok: !violations.some((v) => v.severity === SEVERITY.HARD),
    violations,
    checks,
  }
}
