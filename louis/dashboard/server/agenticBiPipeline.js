import { createAzureClient, getAzureConfig } from './azureClient.js'
import { streamAssistantTurn } from './azureStream.js'
import { queryFabricWithTimeout, QueryTimeoutError } from './fabricClient.js'
import { loadRegistry } from './agentic-bi/app/semantic/registry.js'
import { buildAgenticBiTool, renderMetricCatalogForPrompt, renderDimensionCatalogForPrompt } from './agentic-bi/tools.js'
import { validateSemanticQueryIR } from './agentic-bi/app/semantic/ir_schema.js'
import { validateSemanticQuery } from './agentic-bi/app/semantic/validator.js'
import { compileSingleMetricQuery, CompileError } from './agentic-bi/app/semantic/compiler.js'
import { planDashboard } from './agentic-bi/app/dashboard/planner.js'
import { validateDashboardIr } from './agentic-bi/app/dashboard/schemas.js'

// Agentic BI 실험 파이프라인 — agentic_bi_design/의 Ontology/Semantic Layer 설계를 실제로
// 브라우저에서 테스트해보기 위한 얇은 오케스트레이션 레이어. 16-node 에이전트 그래프
// 전체를 이식하지 않고, 검증이 끝난 4개 모듈(ir_schema/validator/compiler/planner+schemas)을
// 하나의 LLM tool-call(질문 -> SemanticQueryIR) 뒤에 그대로 연결한다 — 기존
// warehousePipeline.js/dashboardPipeline.js와 동일한 "단일 함수 + stage 이벤트" 스타일.

const STAGE_LABELS = {
  select: '지표/차원 선택 중...',
  compile: 'SQL 컴파일 중...',
  execute: 'Fabric 웨어하우스에 쿼리 실행 중...',
  render: '결과 정리 중...',
}

const FABRIC_DB = 'KPI_W' // ktws.* 테이블은 기존 rag-poc 파이프라인도 이 DB를 기본값으로 씀(server/rag-poc/pipeline.js)

function todayISO() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// compiler.js는 `@p0` 스타일 placeholder + params 객체를 돌려주는데, 이 프로젝트의
// fabricClient.queryFabric*()는 파라미터 바인딩을 지원하지 않는 raw SQL 문자열만 받는다
// (기존 rag-poc 파이프라인의 composeSql도 마찬가지로 완전히 인라인된 SQL을 넘김). 따라서
// 여기서 안전하게 리터럴로 치환한다 — 값은 LLM이 사용자 질문에서 뽑아낸 필터 텍스트라
// SQL 인젝션 방지를 위해 반드시 작은따옴표를 이스케이프해야 한다.
function materializeSql(sql, params) {
  return sql.replace(/@(p\d+)\b/g, (_, key) => {
    const value = params[key]
    if (typeof value === 'number') return String(value)
    const escaped = String(value).replace(/'/g, "''")
    return `N'${escaped}'`
  })
}

function buildIrFromToolArgs(args) {
  const ir = {
    intent: args.dimension_id && args.dimension_id !== 'none' ? 'breakdown_by_dimension' : 'single_value',
    metrics: [args.metric_id],
    dimensions: args.dimension_id && args.dimension_id !== 'none' ? [args.dimension_id] : [],
    // 툴 스키마는 dimension/values만 받는다(딜러/브랜드 등은 항상 "이 값들 중 하나" 필터라
    // gte/lte/between을 LLM에 고르게 할 이유가 없음) — 여기서 operator를 고정 부여한다.
    // 이 필드가 빠진 채 ir_schema.js로 넘어가면 "operator는 in|not_in|... 중 하나여야 함"
    // 검증 에러가 실제로 났다(2025-12 렉서스 강남 질문으로 발견).
    filters: (args.filters || []).filter((f) => f.values?.length).map((f) => ({ dimension: f.dimension, operator: 'in', values: f.values })),
    time_range: buildTimeRange(args),
    limit: 50,
  }
  if (args.dimension_id && args.dimension_id !== 'none' && args.sort_desc) {
    ir.sort = [{ field: args.metric_id, direction: 'desc' }]
  }
  return ir
}

function buildTimeRange(args) {
  if (args.time_range_type === 'relative') {
    return { type: 'relative', value: args.relative_value ?? 1, unit: args.relative_unit ?? 'month', anchor_date: 'runtime_context' }
  }
  if (args.time_range_type === 'absolute') {
    return { type: 'absolute', start_date: args.absolute_start_date, end_date: args.absolute_end_date }
  }
  return { type: args.time_range_type === 'ytd' ? 'ytd' : 'mtd' }
}

// 실제 BI의 목표(target) measure들은 "_cond" 분기(ISFILTERED)로 SC/부서/전시장 필터
// 여부에 따라 딜러 레벨 목표(FCT_SALES_TARGET_DAILY)와 SC 레벨 목표(FCT_CRM_TARGET_M)를
// 자동 전환한다. SemanticQueryIR은 이 컨텍스트를 컴파일 시점에 이미 알고 있으므로
// (ir.dimensions/filters), DAX의 런타임 ISFILTERED보다 오히려 결정론적으로 재현 가능하다 —
// 그래서 여기서 미리 계산해서 어느 target metric을 실제로 컴파일할지 정한다.
const SC_SCOPE_DIMENSIONS = new Set(['sales_consultant', 'department', 'showroom'])
const DEALER_TO_SC_TARGET = {
  contract_mtd_target: 'contract_mtd_target_sc',
  contract_ytd_target: 'contract_ytd_target_sc',
  delivery_mtd_target: 'delivery_mtd_target_sc',
  delivery_ytd_target: 'delivery_ytd_target_sc',
}

function isScScopedContext(ir) {
  if (ir.dimensions?.some((d) => SC_SCOPE_DIMENSIONS.has(d))) return true
  if (ir.filters?.some((f) => SC_SCOPE_DIMENSIONS.has(f.dimension))) return true
  return false
}

function resolveEffectiveMetricId(metricId, ir) {
  const scVariant = DEALER_TO_SC_TARGET[metricId]
  if (scVariant && isScScopedContext(ir)) return scVariant
  return metricId
}

// metric.trailing_window_months가 있는 지표(누적취소율/월평균 출고 등)는 LLM이 고른
// time_range를 무시하고 "지난달 말일까지 N개월"로 고정한다 — 실측 DAX가 전부 이 방식
// (DATESINPERIOD/GENERATESERIES + EOMONTH(오늘,-1))을 쓰기 때문에 today/mtd/ytd 같은
// 일반 기간 개념과 맞지 않는다.
function isoDate(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
function computeTrailingWindow(months) {
  const now = new Date()
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0) // day 0 of this month = last day of previous month
  const startOfWindow = new Date(endOfLastMonth.getFullYear(), endOfLastMonth.getMonth() - (months - 1), 1)
  return { start_date: isoDate(startOfWindow), end_date: isoDate(endOfLastMonth) }
}
function applyTrailingWindowIfNeeded(ir, metric) {
  if (!metric.trailing_window_months) return ir
  const { start_date, end_date } = computeTrailingWindow(metric.trailing_window_months)
  return { ...ir, time_range: { type: 'absolute', start_date, end_date } }
}

// "월평균 출고"는 월별로 GROUP BY한 뒤 그 결과를 다시 평균 내는 2단계 집계라
// compileSingleMetricQuery(단일 SELECT 조립기)가 낼 수 있는 SQL 모양이 아니다 — 등록된
// 필터 조각(registry.filters)은 그대로 재사용하되 쿼리 구조 자체는 여기서 직접 조립한다
// (P8 스펙의 "Controlled Analysis SQL" 경로, migration classification B 대응).
//
// 알려진 단순화: 판매가 0건인 달은 안쪽 GROUP BY에 행이 아예 없어서 평균 분모에서
// 빠진다("6개월 평균"이 아니라 "판매가 있었던 달들의 평균"에 가까움) — 실측 DAX 원본은
// GENERATESERIES로 6개월을 항상 채우고 0건인 달도 0으로 포함해 평균을 낸다. 판매 공백월이
// 잦은 SC일수록 이 근사가 실제 BI 값보다 높게 나올 수 있다 — FCT_SC_GROUP_RULE의
// 그룹핑/구간 필터 기능도 구현하지 않음(리포트 UI 전용 기능으로 판단).
async function compileDeliveryMonthlyAverage(ir, metric, registry, sendEvent) {
  const { start_date, end_date } = computeTrailingWindow(metric.trailing_window_months)

  const dimId = ir.dimensions?.[0] || null
  const dim = dimId ? registry.dimensions.get(dimId) : null
  const groupCol = dim ? `${dim.column.table}.${dim.column.column}` : null

  const whereClauses = [
    `FCT_CONTRACT_KTWS.last_retail_sales_dt BETWEEN '${start_date}' AND '${end_date}'`,
    registry.filters.get('br_delivery_cancel_exclusion_mtd').sql_fragment,
    registry.filters.get('br_exclude_front_sc').sql_fragment,
    registry.filters.get('br_exclude_staff_names').sql_fragment,
    registry.filters.get('br_exclude_test_users').sql_fragment,
    registry.filters.get('br_dealer_scope').sql_fragment,
  ]
  for (const f of ir.filters || []) {
    const fDim = registry.dimensions.get(f.dimension)
    if (!fDim) continue
    const col = `${fDim.column.table}.${fDim.column.column}`
    const values = f.values.map((v) => `N'${String(v).replace(/'/g, "''")}'`).join(', ')
    whereClauses.push(`${col} IN (${values})`)
  }

  const monthExpr = 'DATEFROMPARTS(YEAR(FCT_CONTRACT_KTWS.last_retail_sales_dt), MONTH(FCT_CONTRACT_KTWS.last_retail_sales_dt), 1)'
  const groupByInner = groupCol ? `${groupCol}, ${monthExpr}` : monthExpr

  const sql = [
    `SELECT ${dimId ? `[${dimId}], ` : ''}AVG(CAST(monthly_cnt AS FLOAT)) AS [${metric.id}]`,
    `FROM (`,
    `  SELECT ${groupCol ? `${groupCol} AS [${dimId}], ` : ''}COUNT(DISTINCT FCT_CONTRACT_KTWS.dlr_contract_no) AS monthly_cnt`,
    `  FROM ktws.FCT_CONTRACT_KTWS`,
    `  LEFT JOIN ktws.DIM_MNG_USER ON FCT_CONTRACT_KTWS.cn_sc_key = DIM_MNG_USER.sc_key`,
    `  LEFT JOIN ktws.DIM_MNG_DEALER ON DIM_MNG_USER.dealer_key = DIM_MNG_DEALER.dealer_key`,
    `  WHERE ${whereClauses.join('\n    AND ')}`,
    `  GROUP BY ${groupByInner}`,
    `) monthly`,
    dimId ? `GROUP BY [${dimId}]` : '',
    dimId ? `ORDER BY [${dimId}]` : '',
  ].filter(Boolean).join('\n')

  sendEvent({ type: 'debug', label: `Compiled SQL (${metric.id}, controlled analysis)`, detail: sql })
  sendEvent({ type: 'stage', stage: 'execute', label: STAGE_LABELS.execute })
  const rows = await queryFabricWithTimeout(FABRIC_DB, sql, 30000)
  return { rows }
}

function formatMetricValue(value, metric) {
  if (value == null) return '데이터 없음'
  if (metric.format === 'percentage') return `${(value * 100).toFixed(1)}%`
  if (typeof value === 'number') return value.toLocaleString()
  return String(value)
}

// 결과 검증(간이, SQL 실행 성공 = 정답으로 취급하지 않음) + Dashboard IR 조립 + 최종 텍스트
// 응답까지 — controlled_analysis 경로와 일반(ratio/direct) 경로가 공유하는 마무리 단계.
function renderAndRespond({ message, metric, ir, rows, registry, sendEvent, extraNote }) {
  const caveats = []
  if (rows.length === 0) caveats.push('결과가 0행입니다 — 조건에 맞는 데이터가 없거나 필터가 너무 좁을 수 있습니다.')
  if (metric.format === 'percentage') {
    const outOfRange = rows.filter((r) => typeof r[metric.id] === 'number' && (r[metric.id] < 0 || r[metric.id] > 5)).length
    if (outOfRange > 0) caveats.push(`${outOfRange}개 행이 0~500% 범위를 벗어났습니다 — 분모/분자 정의를 다시 확인해 주세요.`)
  }

  sendEvent({ type: 'stage', stage: 'render', label: STAGE_LABELS.render })
  const dashboardIr = planDashboard({
    dashboardId: `agentic_bi_${Date.now()}`,
    title: message,
    compiledQueries: [{ metricId: metric.id }],
    executionResults: [{ metricId: metric.id, rows }],
  })
  const dashboardCheck = validateDashboardIr(dashboardIr, {
    compiledQueryIds: [metric.id],
    executionResults: [{ metricId: metric.id, rows }],
  })
  if (!dashboardCheck.ok) {
    sendEvent({ type: 'debug', label: 'Dashboard IR 검증 실패(narrative로 대체)', detail: JSON.stringify(dashboardCheck.errors) })
  } else {
    for (const component of dashboardIr.components) {
      const event = toChatComponentEvent(component, rows, metric, ir.dimensions[0])
      if (event) sendEvent({ type: 'component', ...event })
    }
  }

  const dimLabel = ir.dimensions[0] ? registry.dimensions.get(ir.dimensions[0])?.label_ko : null
  const summaryLine = rows.length === 1 && !dimLabel
    ? `${metric.name_ko}: ${formatMetricValue(rows[0][metric.id], metric)}`
    : `${metric.name_ko}${dimLabel ? ` (${dimLabel}별)` : ''} — ${rows.length}건 조회됨`
  const caveatBlock = caveats.length ? `\n\n[주의]\n${caveats.map((c) => `- ${c}`).join('\n')}` : ''
  sendEvent({ type: 'text', text: `${summaryLine}${caveatBlock}${extraNote ? `\n\n${extraNote}` : ''}` })
}

// dashboardIr.components[] -> ChatPanel이 이해하는 {name, props} 이벤트(GeneratedWidget.jsx
// 기존 render_* 케이스를 그대로 재사용 — 새 프런트 컴포넌트를 만들지 않는다).
function toChatComponentEvent(component, rows, metric, dimensionId) {
  if (component.type === 'kpi_card') {
    const value = rows[0]?.[metric.id]
    return { name: 'render_kpi_cards', props: { title: component.title, value: formatMetricValue(value, metric) } }
  }
  if (component.type === 'bar_chart') {
    return {
      name: 'render_bar_chart',
      props: { title: component.title, data: rows, x_key: dimensionId, y_key: metric.id },
    }
  }
  if (component.type === 'detail_table') {
    const columns = dimensionId ? [dimensionId, metric.id] : [metric.id]
    return {
      name: 'render_table',
      props: { title: component.title, columns, rows: rows.map((r) => columns.map((c) => r[c])) },
    }
  }
  return null
}

// 단일 metric IR을 컴파일하고 Fabric에 실행 — 직접 조회 경로와 ratio 분자/분모 경로가
// 공유하는 컴파일+실행 로직을 한 곳에 모아둔다. outputAlias가 실제 컴파일된 metric id와
// 다르면(예: contract_mtd_target -> contract_mtd_target_sc로 전환된 경우) 결과 행의
// 컬럼명을 원래 요청한 id로 되돌려서, 호출부가 어느 variant가 실제로 쓰였는지 신경 쓰지
// 않고 항상 원래 metric id로 값을 읽을 수 있게 한다.
async function compileAndRun(ir, registry, sendEvent, { outputAlias } = {}) {
  const compiled = compileSingleMetricQuery(ir, { currentDate: todayISO() })
  sendEvent({ type: 'debug', label: `Compiled SQL (${ir.metrics[0]})`, detail: compiled.sql })
  sendEvent({ type: 'stage', stage: 'execute', label: STAGE_LABELS.execute })
  const materialized = materializeSql(compiled.sql, compiled.params)
  let rows = await queryFabricWithTimeout(FABRIC_DB, materialized, 30000)
  if (outputAlias && outputAlias !== ir.metrics[0]) {
    rows = rows.map((r) => {
      const { [ir.metrics[0]]: value, ...rest } = r
      return { ...rest, [outputAlias]: value }
    })
  }
  return { rows, compiled }
}

export async function runAgenticBiQuery({ message }, { sendEvent }) {
  const client = createAzureClient()
  if (!client) {
    sendEvent({ type: 'error', message: 'Azure OpenAI 환경변수가 설정되지 않았습니다. .env 파일을 확인하세요.' })
    return
  }
  const { deployment } = getAzureConfig()
  const registry = loadRegistry()

  // 1. LLM: 질문 -> SemanticQueryIR 후보 (등록된 metric/dimension enum만 고를 수 있음)
  sendEvent({ type: 'stage', stage: 'select', label: STAGE_LABELS.select })
  const [call] = await streamAssistantTurn(client, {
    model: deployment,
    messages: [
      {
        role: 'system',
        content: `사용자 질문을 등록된 Metric/Dimension으로 변환하세요. 오늘 날짜: ${todayISO()}.\n\n` +
          `[딜러명 표기 규칙] "딜러"는 브랜드+지점이 합쳐진 하나의 매장명이다(예: "렉서스 강남", "토요타 용산"). ` +
          `"렉서스 강남"처럼 브랜드명이 포함된 딜러명이 언급되면 dealer 필터에 "렉서스 강남" 전체를 그대로 넣고, ` +
          `brand 필터를 별도로 만들지 마라(중복 필터링이 되어 결과가 사라진다) — brand 필터는 사용자가 특정 매장 없이 ` +
          `"렉서스 전체", "토요타 전체"처럼 브랜드 단위로만 물었을 때만 쓴다.\n\n` +
          `[Metric 목록]\n${renderMetricCatalogForPrompt()}\n\n[Dimension 목록]\n${renderDimensionCatalogForPrompt()}`,
      },
      { role: 'user', content: message },
    ],
    tools: buildAgenticBiTool(),
    toolChoice: { type: 'function', function: { name: 'pick_semantic_query' } },
    temperature: 0,
  })

  const args = call?.args
  if (!args || args.answerable === false || !args.metric_id) {
    sendEvent({ type: 'rejected', reason: args?.reason_if_unanswerable || '이 질문에 답할 수 있는 등록된 지표를 찾지 못했습니다.' })
    return
  }

  const ir = buildIrFromToolArgs(args)
  sendEvent({ type: 'debug', label: 'Semantic Query IR', detail: JSON.stringify(ir, null, 2) })

  const structural = validateSemanticQueryIR(ir)
  if (!structural.ok) {
    sendEvent({ type: 'error', message: `질문 구조화 결과가 유효하지 않습니다: ${structural.errors.map((e) => e.message).join('; ')}` })
    return
  }
  const semantic = validateSemanticQuery(ir)
  if (!semantic.ok) {
    sendEvent({ type: 'error', message: `검증 실패: ${semantic.errors.map((e) => e.message).join('; ')}` })
    return
  }

  const metric = registry.metrics.get(ir.metrics[0])

  if (metric.trailing_window_months) {
    const overridden = applyTrailingWindowIfNeeded(ir, metric)
    sendEvent({ type: 'debug', label: '기간 자동 고정', detail: `"${metric.name_ko}"은 오늘 기준이 아니라 지난달 말일까지 ${metric.trailing_window_months}개월 고정 — ${overridden.time_range.start_date} ~ ${overridden.time_range.end_date}` })
    Object.assign(ir, overridden)
  }

  // "월평균 출고"처럼 월별 GROUP BY 후 다시 평균 내는 2단계 집계는 compileSingleMetricQuery로
  // 표현할 수 없어 전용 컴파일러로 우회한다(위 compileDeliveryMonthlyAverage 주석 참고).
  if (metric.controlled_analysis) {
    sendEvent({ type: 'stage', stage: 'compile', label: STAGE_LABELS.compile })
    let result
    try {
      result = await compileDeliveryMonthlyAverage(ir, metric, registry, sendEvent)
    } catch (err) {
      if (err instanceof QueryTimeoutError) {
        sendEvent({ type: 'error', message: err.message })
        return
      }
      throw err
    }
    renderAndRespond({
      message, metric, ir, rows: result.rows, registry, sendEvent,
      extraNote: '[근사값] 판매 공백월은 평균에서 제외됩니다 — 실제 BI(0건도 포함해 6개월 평균)와 약간 다를 수 있습니다.',
    })
    return
  }

  const isRatioLike = ['ratio_metric', 'conversion_metric', 'progress_metric'].includes(metric.metric_type)

  // ratio/conversion/progress_metric은 base_table/expression이 없다 — 이 자체가 "전환율의
  // 분자·분모는 반드시 별도 metric으로 명시한다"는 설계 원칙의 결과다(agentic_bi_design
  // 최종 보고서 4절). 그래서 compileSingleMetricQuery로 곧장 컴파일할 수 없고, 대신
  // numerator_metric/denominator_metric을 각각 독립적으로 컴파일·실행한 뒤 여기서 나눈다 —
  // "GOLD 쿼리를 그대로 실행"이 아니라 "Text2SQL + 가공" 원칙 그대로.
  let rows
  if (isRatioLike) {
    sendEvent({ type: 'stage', stage: 'compile', label: STAGE_LABELS.compile })
    const effectiveDenominatorId = resolveEffectiveMetricId(metric.denominator_metric, ir)
    if (effectiveDenominatorId !== metric.denominator_metric) {
      sendEvent({ type: 'debug', label: 'SC 레벨 목표로 자동 전환', detail: `${metric.denominator_metric} -> ${effectiveDenominatorId} (SC/부서/전시장 필터 감지, 실제 BI의 _cond 분기 재현)` })
    }
    let numResult, denResult
    try {
      numResult = await compileAndRun({ ...ir, metrics: [metric.numerator_metric] }, registry, sendEvent)
      denResult = await compileAndRun({ ...ir, metrics: [effectiveDenominatorId] }, registry, sendEvent, { outputAlias: metric.denominator_metric })
    } catch (err) {
      if (err instanceof CompileError) {
        sendEvent({ type: 'error', message: `"${metric.name_ko}"의 분자/분모 지표를 컴파일할 수 없습니다 (${err.code}): ${err.message}` })
        return
      }
      if (err instanceof QueryTimeoutError) {
        sendEvent({ type: 'error', message: err.message })
        return
      }
      throw err
    }
    const dimId = ir.dimensions[0] || null
    if (dimId) {
      // 항목별(SC/딜러 등) 분해 — 분자·분모 각각 dimension으로 breakdown한 뒤 dimension 값
      // 기준으로 outer-join해 행별로 나눈다(한쪽에만 있는 값은 0으로 취급).
      const numMap = new Map(numResult.rows.map((r) => [r[dimId], r[metric.numerator_metric]]))
      const denMap = new Map(denResult.rows.map((r) => [r[dimId], r[metric.denominator_metric]]))
      const allKeys = new Set([...numMap.keys(), ...denMap.keys()])
      rows = [...allKeys].map((key) => {
        const numVal = numMap.get(key) ?? 0
        const denVal = denMap.get(key) ?? 0
        const ratio = denVal === 0 ? metric.zero_denominator_result : numVal / denVal
        return { [dimId]: key, [metric.id]: ratio }
      })
      sendEvent({ type: 'debug', label: `분자/분모 항목별 병합 (${dimId})`, detail: `${allKeys.size}건` })
    } else {
      const numVal = numResult.rows[0]?.[metric.numerator_metric] ?? 0
      const denVal = denResult.rows[0]?.[metric.denominator_metric] ?? 0
      const ratio = denVal === 0 ? metric.zero_denominator_result : numVal / denVal
      rows = [{ [metric.id]: ratio }]
      sendEvent({ type: 'debug', label: `분자(${metric.numerator_metric}) / 분모(${metric.denominator_metric})`, detail: `${numVal} / ${denVal} = ${ratio}` })
    }
  } else {
    // 1. 결정론적 SQL 컴파일 (LLM은 SQL을 직접 생성하지 않음)
    sendEvent({ type: 'stage', stage: 'compile', label: STAGE_LABELS.compile })
    const effectiveMetricId = resolveEffectiveMetricId(metric.id, ir)
    if (effectiveMetricId !== metric.id) {
      sendEvent({ type: 'debug', label: 'SC 레벨 목표로 자동 전환', detail: `${metric.id} -> ${effectiveMetricId} (SC/부서/전시장 필터 감지, 실제 BI의 _cond 분기 재현)` })
    }
    const compileIr = effectiveMetricId !== metric.id ? { ...ir, metrics: [effectiveMetricId] } : ir
    let result
    try {
      result = await compileAndRun(compileIr, registry, sendEvent, { outputAlias: metric.id })
    } catch (err) {
      if (err instanceof CompileError) {
        sendEvent({ type: 'error', message: `"${metric.name_ko}" 지표는 아직 결정론적 컴파일러로 표현할 수 없습니다 (${err.code}): ${err.message}` })
        return
      }
      if (err instanceof QueryTimeoutError) {
        sendEvent({ type: 'error', message: err.message })
        return
      }
      throw err
    }
    rows = result.rows
  }

  renderAndRespond({ message, metric, ir, rows, registry, sendEvent })
}
