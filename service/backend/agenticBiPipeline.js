import { randomUUID } from 'node:crypto'
import { createLlmClient, missingConfigMessage } from './llm/index.js'
import { streamAssistantTurn } from './azureStream.js'
import { sanitizeHistoryForClassification } from './lifecycle.js'
import { queryFabricWithTimeout, QueryTimeoutError, queryFabricCertified } from './fabricClient.js'
import { loadRegistry } from './agentic-bi/app/semantic/registry.js'
import { enforceSemanticFidelity } from './agentic-bi/semantic/fidelity.js'
import { buildAgenticBiTool, buildMultiMetricChartSpecTool, buildZeroRowsReaskTool, buildRestyleWidgetTool, renderMetricCatalogForPrompt, renderDimensionCatalogForPrompt } from './agentic-bi/tools.js'
import {
  buildRunCertifiedReportTool, resolveReportRequest, renderReportCatalogForPrompt, SC_DISPLAY, ROLLUP_SUGGESTION_ORDER,
} from './agentic-bi/reportIntent.js'
import { executeReportWithView } from './reports/series.js'
import {
  projectReportView, rollupReportRows, resolveSelectedColumns, filterRowsByDimension, filterRowsByMeasure,
} from './reports/projection.js'
import { getReport, listReports, reportsHavingColumns, distinctiveColumnsInText, ratioColumnForRateRequest } from './reports/registry.js'
import { buildFromMetricIr, derivedUnavailableReason, METRIC_MAP } from './agentic-bi/funnelDerived/fromMetricIr.js'
import { runFunnelMonthSeries } from './agentic-bi/funnelDerived/monthSeries.js'
import { runTargetMetric } from './agentic-bi/funnelDerived/fromSalesAchievement.js'
import { deriveFunnelMeasures, deriveFunnelChannels, derivedKey } from './agentic-bi/funnelDerived/forReportView.js'
import { detectAmbiguousSubject } from './agentic-bi/ambiguityGuard.js'
import { canonicalizeValues, PARAM_VALUE_NORMALIZERS } from './agentic-bi/dimensionValues.js'
import {
  buildRegroupReportWidgetTool, renderRegroupCatalogForPrompt, resolveRegroup,
} from './agentic-bi/regroupReportWidget.js'
import { applyRestyle, renderRestyleCatalogForPrompt, labelForChartCode } from './agentic-bi/restyleWidget.js'
import { buildLeadActualSql, buildContractActualSql } from './agentic-bi/funnelSql.js'
import { mergeMetricRows, applyRatioDerivation, applyTimeSeriesTransform } from './agentic-bi/mergeMetricRows.js'
import { validateSemanticQueryIR } from './agentic-bi/app/semantic/ir_schema.js'
import { validateSemanticQuery } from './agentic-bi/app/semantic/validator.js'
import { compileSingleMetricQuery, resolveTimeWindow, CompileError, timeGrainExpr } from './agentic-bi/app/semantic/compiler.js'
import { planDashboard } from './agentic-bi/app/dashboard/planner.js'
import { checkDonutEligible, checkScatterEligible, checkRadarEligible, foldDonutRows, DONUT_MAX_SLICES } from './agentic-bi/chartEligibility.js'
import { validateDashboardIr } from './agentic-bi/app/dashboard/schemas.js'
import { buildWidgetPropsFromRows } from './widgetSchema.js'
import { MAX_WIDGETS } from './dashboardValidation.js'
import { SIZE_TO_SPAN } from '../frontend/src/utils/gridLayout.js'
import { createDashboardObject } from '../frontend/src/utils/dashboardObject.js'
import { sourceDependenciesForQueryBundle } from './dashboardDataFreshness.js'
import { applyMandatoryAccessFilters, resolveDataAccessContext } from './dashboardAccessControl.js'

// Agentic BI 실험 파이프라인 — agentic_bi_design/의 Ontology/Semantic Layer 설계를 실제로
// 브라우저에서 테스트해보기 위한 얇은 오케스트레이션 레이어. 16-node 에이전트 그래프
// 전체를 이식하지 않고, 검증이 끝난 4개 모듈(ir_schema/validator/compiler/planner+schemas)을
// 하나의 LLM tool-call(질문 -> SemanticQueryIR) 뒤에 그대로 연결한다 — 기존
// warehousePipeline.js/dashboardPipeline.js와 동일한 "단일 함수 + stage 이벤트" 스타일.
//
// 2026-07-27: dashboardCustomizeHandler.js와 같은 "patch_ready 제안 -> 클라이언트가 적용"
// 흐름을 여기도 지원하도록 확장했다(대시보드 커스텀/배포/저장 기능 연동). widgetSchema.js의
// buildWidgetPropsFromRows()를 그대로 재사용해 위젯 props를 만드는 이유는 dashboardPagesHandler.js가
// 저장된 위젯을 다시 열 때 이 함수로 rehydrate하기 때문 — 여기서 다른 모양의 props를 만들면
// 방금 추가한 위젯은 보이지만 새로고침/재로드 후에는 다르게(또는 깨져) 보이는 불일치가 생긴다.

const STAGE_LABELS = {
  select: '지표/차원 선택 중...',
  compile: 'SQL 컴파일 중...',
  execute: 'Fabric 웨어하우스에 쿼리 실행 중...',
  render: '결과 정리 중...',
}

const FABRIC_DB = 'KPI_W' // ktws.* 테이블은 기존 rag-poc 파이프라인도 이 DB를 기본값으로 씀(server/rag-poc/pipeline.js)

// 2026-08-04 leo: 저장된 queryBundle에는 SQL만 있어 캐시가 어떤 Gold source의 갱신을
// 추적해야 하는지 알 수 없었다. semantic metric metadata에서 선언형 의존성을 붙여 저장하고,
// 재실행 시에는 이 값을 우선 사용한다. SQL 문자열을 파싱하지 않는다.
function withSourceDependencies(queries) {
  return queries.map((query) => ({
    ...query,
    ...(Array.isArray(query.sourceDependencies) ? {} : {
      sourceDependencies: sourceDependenciesForQueryBundle({ queries: [query] }),
    }),
  }))
}
// 리포트 파라미터 이름 -> 시맨틱 차원 id. 리포트마다 명명이 달라 둘 다 적는다.
const REPORT_PARAM_TO_DIMENSION = {
  dealer_nm: 'dealer', DealerNm: 'dealer',
  group_name: 'showroom', GroupName: 'showroom',
  dept_nm: 'department', DeptNm: 'department',
  sc_name: 'sales_consultant', ScName: 'sales_consultant',
}

// 리포트마다 명명이 갈린다. 월을 필터로 걸 수 있는지 판단하는 데 쓴다.
const MONTH_PARAM_NAMES = new Set(['month', 'MonthNumber', 'base_month'])
// "4월", "04월", "2026-04", "2026년 4월". 연도만 있는 질문은 잡지 않는다.
//
// 완전한 날짜(2026-07-30)는 월 요청이 아니다 — 그날 하루를 물은 것이다. 뒤에 일자가
// 붙으면 제외한다. 2026-08-05 실측: 이 구분이 없어 "계약일이 2026-07-30" 질문이
// 월 검사에 걸려 엉뚱한 리포트로 재선택됐고, 날짜 조건이 사라져 0행이 나왔다
// (실제로는 렉서스 분당에 그날 계약 6건이 있다).
const MONTH_IN_TEXT = /(\d{1,2}\s*월)|(\d{4}\s*[-/.]\s*(0[1-9]|1[0-2])(?![-/.\s]*\d))/

/** 월을 지정할 수 있는 다른 리포트들 — 되물을 때 대안으로 제시한다. */
function reportsWithMonth(exceptReportId) {
  return listReports()
    .filter((r) => r.report_id !== exceptReportId)
    .map((r) => getReport(r.report_id).contract)
    .filter((c) => c.parameters.some((p) => MONTH_PARAM_NAMES.has(p.name)))
}

const MAX_REPORT_ROWS = 300

function positiveIntegerEnv(name, fallback) {
  const value = Number.parseInt(process.env[name] || '', 10)
  return Number.isInteger(value) && value > 0 ? value : fallback
}

// 객체 필터가 붙은 표는 필터 후보를 만들 수 있도록 상세 행을 유지해야 한다. 화면은 표의
// 페이지네이션으로 50행씩만 렌더링하므로, 대화형 표의 저장 한도와 일반 리포트 미리보기 한도를 분리한다.
const MAX_INTERACTIVE_TABLE_ROWS = positiveIntegerEnv('DASHBOARD_INTERACTIVE_TABLE_MAX_ROWS', 20_000)

// projection.js의 FUNNEL_GROUP_DIMENSIONS와 같아야 한다 — 다르면 보정 키가 안 맞아
// 덮어쓰기가 조용히 실패한다.
const FUNNEL_VIEW_GROUP_DIMENSIONS = ['브랜드', '딜러']
const MAX_FUNNEL_REPORT_ROWS = 2500
const FUNNEL_PYRAMID_VIS_SPEC = {
  stageWidthFractions: { 활동: 1, 기회: 0.82, 영업기회: 0.82, 시승: 0.64, 계약: 0.46 },
  channelMeta: {
    관계형성활동: { name: '관계형성활동', sub: '(재구매/소개)', category: '기존고객', color: '#3b5f8a' },
    SC활동: { name: 'SC활동', sub: '(잠재고객/판촉)', category: '기존고객', color: '#7fa0cc' },
    '내방/내전': { name: '내방/내전', sub: '(신규유입)', category: '신규유입', color: '#d9534f' },
    온라인유입: { name: '온라인유입', sub: '(신규유입)', category: '신규유입', color: '#e8918e' },
  },
  domainMeta: {
    기존고객: { label: 'KTWS의 관리 영역', fill: '#eef1f6', stroke: '#3b5f8a', startStageIndex: 1 },
    신규유입: { label: '마케팅활동의 관리 영역', fill: '#fbeceb', stroke: '#d9534f', startStageIndex: 0 },
  },
}

function compactKoreanText(value) {
  return String(value || '').replace(/\s+/g, '')
}

function firstIntegerMatch(text, regex) {
  const match = String(text || '').match(regex)
  if (!match) return null
  const value = Number(match[1])
  return Number.isInteger(value) ? value : null
}

export function detectCertifiedFunnelRequest(message) {
  const text = String(message || '')
  const compact = compactKoreanText(text)
  if (!compact.includes('퍼널')) return null
  if (/결과예상|예상퍼널|forecast/i.test(compact)) return null

  const mentionsPyramid =
    /역삼각형|퍼널구조|평시퍼널|퍼널객체|관계형성활동|SC활동|내방\/?내전|온라인유입|채널/.test(compact)
  const mentionsPyramidTable = /표로보기|표|테이블|table/i.test(compact)
  if (!mentionsPyramid && !mentionsPyramidTable) return null

  const wantsChart = mentionsPyramid || /객체|차트|그래프|역삼각형/.test(compact)
  const wantsTable = mentionsPyramidTable
  const reportViews = wantsChart && wantsTable
    ? ['funnel_pyramid_chart', 'funnel_pyramid_table']
    : wantsTable && !wantsChart
      ? ['funnel_pyramid_table']
      : ['funnel_pyramid_chart']

  const year = firstIntegerMatch(text, /(20\d{2})\s*년/)
  const month = firstIntegerMatch(text, /(?:^|[^\d])(\d{1,2})\s*월/)
  const scDisplay = /SC\s*별|영업\s*사원\s*별|사원\s*별/i.test(text)
    ? SC_DISPLAY.ALL_SC
    : SC_DISPLAY.TEAM_LEVEL

  return {
    reason: 'deterministic_funnel_pyramid',
    argsList: reportViews.map((reportView) => ({
      report_id: 'funnel_full_structure',
      report_view: reportView,
      year,
      month,
      brand: null,
      dealer: null,
      group_name: null,
      dept_nm: null,
      act_yn: null,
      activity_type: null,
      sc_display: scDisplay,
      group_by: null,
    })),
  }
}

function objectPatch(patch) {
  return {
    ...patch,
    ops: patch.ops.map((op) => (op.widget ? { ...op, widget: createDashboardObject(op.widget) } : op)),
  }
}

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

function withOutputAlias(sql, sourceMetricId, outputAlias) {
  if (!outputAlias || outputAlias === sourceMetricId) return sql
  const source = `AS [${sourceMetricId}]`
  const position = sql.indexOf(source)
  if (position === -1) return sql
  return `${sql.slice(0, position)}AS [${outputAlias}]${sql.slice(position + source.length)}`
}

function normalizeDimensionIds(value) {
  const values = Array.isArray(value) ? value : [value]
  return [...new Set(values.filter((id) => typeof id === 'string' && id.trim() && id !== 'none'))].slice(0, 4)
}

export function buildIrFromToolArgs(args) {
  // 중복 제거 + 최대 6개(툴 스키마 maxItems와 동일한 방어를 서버 쪽에서도 한 번 더) —
  // metric_ids가 1개면 기존 단일 질문과 완전히 동일한 경로(ir.metrics.length===1)를 탄다.
  const metrics = [...new Set(args.metric_ids || [])].slice(0, 6)
  const requestedObjectFilterDimensions = normalizeDimensionIds(args.object_filter_dimension_ids)
  // "none"은 KPI 카드처럼 차원 없는 질의를 뜻하는 예약값이다. LLM이 단일 dimension_id가
  // 아니라 dimension_ids 배열로 보내도 동일하게 제거해야 검증기에 실제 차원으로 전달되지 않는다.
  const requestedDimensions = normalizeDimensionIds(args.dimension_ids)
  const legacyDimension = normalizeDimensionIds(args.dimension_id)
  const dimensions = [...new Set([
    ...(requestedDimensions.length ? requestedDimensions : legacyDimension),
    ...requestedObjectFilterDimensions,
  ])].slice(0, 4)
  const ir = {
    intent: metrics.length > 1 ? 'compare_metric' : (dimensions.length ? 'breakdown_by_dimension' : 'single_value'),
    metrics,
    dimensions,
    object_filter_dimensions: requestedObjectFilterDimensions.filter((dimensionId) => dimensions.includes(dimensionId)),
    // 툴 스키마는 dimension/values만 받는다(딜러/브랜드 등은 항상 "이 값들 중 하나" 필터라
    // gte/lte/between을 LLM에 고르게 할 이유가 없음) — 여기서 operator를 고정 부여한다.
    // 이 필드가 빠진 채 ir_schema.js로 넘어가면 "operator는 in|not_in|... 중 하나여야 함"
    // 검증 에러가 실제로 났다(2025-12 렉서스 강남 질문으로 발견).
    filters: (args.filters || []).filter((f) => f.values?.length).map((f) => ({ dimension: f.dimension, operator: 'in', values: f.values })),
    time_range: buildTimeRange(args),
    // ir_schema.js는 알려지지 않은 필드를 무시(화이트리스트 검증)하므로 여기 얹어도 구조
    // 검증에 걸리지 않는다 — "새 metric"이 아니라 "이미 계산된 시계열에 대한 후처리
    // 옵션"이라 IR 스키마 자체를 건드리지 않고 얹을 수 있었다(mergeMetricRows.js의
    // applyTimeSeriesTransform 주석 참고).
    time_series_transform: args.time_series_transform && args.time_series_transform !== 'none' ? args.time_series_transform : undefined,
    ...(args.time_grain && args.time_grain !== 'none' ? { time_grain: args.time_grain } : {}),
    ...(args.accumulation && args.accumulation !== 'none' ? { accumulation: args.accumulation } : {}),
    ...(args.chart_type && args.chart_type !== 'auto' ? { chart_type: args.chart_type } : {}),
    limit: 50,
  }
  if (dimensions.length && args.sort_desc && metrics.length === 1) {
    ir.sort = [{ field: metrics[0], direction: 'desc' }]
  }
  return ir
}

function compactSelectionText(value) {
  return String(value || '').toLowerCase().replace(/\s+/g, '')
}

// 2026-08-04 leo: 기존에는 유사한 업무 용어를 보정하려면 파이프라인에 metric id를 직접 추가해야 했다. YAML의 selection_override만 읽어 지표 선택을 보정하므로 새 용어는 선언 추가만으로 확장된다.
export function applyMetricSelectionOverrides(message, ir, registry) {
  if (!ir?.metrics?.length) return ir
  const question = compactSelectionText(message)
  if (!question) return ir

  const overrides = [...registry.metrics.values()]
    .flatMap((metric) => {
      const rule = metric.selection_override
      const terms = Array.isArray(rule?.terms) ? rule.terms : []
      const replaces = Array.isArray(rule?.replaces) ? rule.replaces : []
      const matchedTerm = terms
        .map((term) => compactSelectionText(term))
        .filter(Boolean)
        .filter((term) => question.includes(term))
        .sort((a, b) => b.length - a.length)[0]
      return matchedTerm && replaces.length
        ? [{ metricId: metric.id, replaces, matchedTerm, priority: Number(rule.priority) || 0 }]
        : []
    })
    .sort((a, b) => b.priority - a.priority || b.matchedTerm.length - a.matchedTerm.length || a.metricId.localeCompare(b.metricId))

  if (!overrides.length) return ir
  const metrics = ir.metrics.map((metricId) => overrides.find((rule) => rule.replaces.includes(metricId))?.metricId || metricId)
  if (metrics.every((metricId, index) => metricId === ir.metrics[index])) return ir
  const resolvedMetrics = [...new Set(metrics)].slice(0, 6)
  return { ...ir, metrics: resolvedMetrics, intent: resolvedMetrics.length > 1 ? 'compare_metric' : ir.intent }
}

// 2026-08-03 leo: 기존에는 LLM이 KPI 요청에서 실적 하나만 고르면 목표·진행률이 누락됐다. 메트릭 YAML의 선언형 묶음을 읽어 요청된 역할을 보완한다.
// 개별 지표 정의에 선언된 kpi_bundle을 읽어, "실적·목표·진행률 KPI 카드"처럼
// 여러 역할을 명시한 요청을 완전한 비교 지표 집합으로 만든다. 특정 업무/지표 id를
// 여기서 분기하지 않아 활동·기회·계약·출고 등도 같은 선언만 추가하면 재사용된다.
function requestedKpiBundleRoles(message) {
  const text = String(message || '').replace(/\s+/g, '')
  const asksCard = /kpi(?:요약)?카드|(?:요약)?지표카드|요약카드/i.test(text)
  if (!asksCard) return []

  const roles = []
  if (/실적|실제|현황|건수/.test(text)) roles.push('actual')
  if (/목표|타겟/.test(text)) roles.push('target')
  if (/진행률|진척률|달성률/.test(text)) roles.push('rate')
  return roles
}

export function applyKpiBundleIntent(message, ir, registry) {
  const roles = requestedKpiBundleRoles(message)
  if (!roles.length || !ir?.metrics?.length) return ir

  const selected = new Set(ir.metrics)
  const bundleOwner = [...registry.metrics.values()].find((metric) => {
    const bundle = metric.kpi_bundle
    return bundle && Object.values(bundle).some((metricId) => selected.has(metricId))
  })
  if (!bundleOwner?.kpi_bundle) return ir

  const expanded = [...ir.metrics]
  for (const role of roles) {
    const metricId = bundleOwner.kpi_bundle[role]
    if (metricId && registry.metrics.has(metricId) && !expanded.includes(metricId)) expanded.push(metricId)
  }
  if (expanded.length === ir.metrics.length) return ir
  return { ...ir, metrics: expanded.slice(0, 6), intent: expanded.length > 1 ? 'compare_metric' : ir.intent }
}

function dimensionMentionedInQuestion(text, alias) {
  const value = String(alias || '').trim().toLowerCase()
  if (!value) return false
  if (!/^[a-z0-9_\s-]+$/i.test(value)) return text.includes(value)
  const escaped = value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return new RegExp(`(?:^|[^a-z0-9_])${escaped}(?:$|[^a-z0-9_])`, 'i').test(text)
}

const TEMPORAL_DIMENSIONS = new Set(['time_year', 'time_month', 'time_day'])

const TEMPORAL_GRAIN_PATTERNS = {
  time_year: /(?:연도|년도)\s*(?:별|기준|단위|필터|선택|드롭다운)|년\s*별|(?:연도|년도|년)\s*로\s*(?:나눠|구분|분해|그룹|집계)|\byear\b/i,
  time_month: /월별|월\s*(?:단위|필터|선택|드롭다운)|월\s*(?:기준|별로)\s*(?:나눠|구분|분해|그룹|집계|보여|표시)|월로\s*(?:나눠|구분|분해|그룹|집계)|\b(?:month|yearmonth)\b/i,
  time_day: /일별|일자별|날짜별|(?:일자|날짜|일)\s*(?:단위|필터|선택|드롭다운)|(?:일자|날짜|일)\s*(?:기준|별로)\s*(?:나눠|구분|분해|그룹|집계|보여|표시)|\b(?:day|date)\b/i,
}

// 추이 질문은 시간축이 있어야 성립하지만, 어느 축인지까지 정해 주지는 않는다.
// 축을 못 정했을 때의 기본값은 월이다(대시보드 추이 그래프의 표준 단위).
const TREND_DEFAULT_DIMENSION = 'time_month'

// "어떻게 변했는지"처럼 명사형('변화')이 아닌 표현도 추이 질문이다. 이걸 놓치면
// 시간축이 아예 안 붙어서 "올해 계약이 어떻게 변했는지"에 누적값 하나만 답한다.
const TREND_INTENT_RE = /추이|추세|트렌드|시계열|흐름|증감|변화|변했|변동|전월\s*대비|전일\s*대비|mom\b/i

/**
 * 질문이 이 시간 차원을 요구하는가.
 *
 * 질문이 grain을 명시했으면 그것만 쓴다. 예전에는 "추이"만 보이면 연·월·일을 모두
 * 통과시켜서, "월별 추이"가 GROUP BY에 일자까지 달고 나가 선 그래프에 215점이
 * 찍혔다(2026년 월별이면 12점이어야 한다).
 */
function temporalDimensionRequested(text, dimensionId) {
  const question = String(text || '').replace(/\s+/g, ' ')

  const explicit = Object.keys(TEMPORAL_GRAIN_PATTERNS)
    .filter((id) => TEMPORAL_GRAIN_PATTERNS[id].test(question))
  if (explicit.length > 0) return explicit.includes(dimensionId)

  return TREND_INTENT_RE.test(question) && dimensionId === TREND_DEFAULT_DIMENSION
}

function shouldKeepProjectionDimension(question, dimensionId) {
  if (!TEMPORAL_DIMENSIONS.has(dimensionId)) return true
  return temporalDimensionRequested(question, dimensionId)
}

function metricSupportsProjectionDimension(metric, dimensionId) {
  if (dimensionId === 'time_year') return (metric.supported_time_grains || metric.grain || []).includes('year')
  if (dimensionId === 'time_month') return (metric.supported_time_grains || metric.grain || []).includes('month')
  if (dimensionId === 'time_day') return (metric.supported_time_grains || metric.grain || []).includes('day')
  return (metric.dimensions || []).includes(dimensionId)
}

// The model has a constrained dimension catalog, but table prompts often list
// several result fields in plain language. Preserve every compatible field so
// the generated object's client-side filters have source columns to operate on.
/**
 * 기간을 "필터"로 표현한 IR을 time_range로 되돌린다.
 *
 * LLM이 "2026년 4월"을 time_range 대신 filters=[time_year:2026, time_month:4] 로 넣을 때가
 * 있다. 그러면 두 가지가 깨진다: (1) 전용 컴파일러가 DIM_CALENDAR_KTWS를 조인하지 않아
 * "multi-part identifier ... could not be bound" SQL 오류로 답이 통째로 비고,
 * (2) 파생 경로가 그 필터를 못 걸어 폴백하므로 같은 질문이 실행마다 다른 경로를 탄다.
 * 기간은 필터가 아니라 기간이므로 여기서 원래 자리로 옮긴다.
 */
// 목표 대비 비율을 부르는 세 가지 말. 계산이 같아 서로 바꿔 써도 값이 달라지지 않는다
// (2026-08-05 등록 21종 확인: 이 말이 붙은 컬럼 16개가 모두 실적 ÷ 목표).
// 전환율·배수·비중은 분모가 달라 여기 없다 — 섞으면 다른 지표가 된다.
const TARGET_RATIO_WORDS = ['진척률', '진행률', '달성률']

/**
 * 지표 이름을 사용자가 쓴 말로 맞춘다.
 *
 * "계약 진척률"을 물었는데 "계약 진행률: 35.5%"로 답하면, 값이 맞아도 사용자는 자기가
 * 물은 것과 다른 지표를 받았다고 읽는다. 뜻이 같은 세 말 안에서만 바꾼다.
 */
export function echoUserRatioWord(label, message) {
  const text = String(message || '')
  const used = TARGET_RATIO_WORDS.find((w) => text.includes(w))
  if (!used) return label
  const inLabel = TARGET_RATIO_WORDS.find((w) => String(label).includes(w))
  if (!inLabel || inLabel === used) return label
  return String(label).replaceAll(inLabel, used)
}

/**
 * 인증 리포트 툴만 주고 한 번 더 묻는다.
 *
 * LLM이 "이건 인증 리포트로 답해야 합니다"라고 **말하면서** 그 툴은 부르지 않는 일이 있다.
 * 2026-08-05 전수 실행에서 2건이 그랬다 — 둘 다 어느 리포트인지까지 대놓고 되묻기만 했다.
 * 되묻는 대신 선택지를 서버가 대신 눌러 준다.
 *
 * @returns {boolean} 리포트로 답했으면 true. false면 호출부가 원래 흐름을 이어간다.
 */
async function retryWithCertifiedReport({ message, sendEvent, dashboardState, client, deployment, reportCatalog, why }) {
  sendEvent({ type: 'debug', label: '리포트로 재시도', detail: why })
  let retry
  try {
    ;[retry] = await streamAssistantTurn(client, {
      model: deployment,
      messages: [
        {
          role: 'system',
          content: `[인증 리포트 목록]\n${reportCatalog}\n\n`
            + '위 인증 리포트로만 답한다. run_certified_report를 반드시 호출해라 — '
            + '설명하지 말고 리포트를 골라 파라미터를 채워라.\n'
            + '**질문의 조건을 하나도 빠뜨리지 마라.** 연·월·일은 year/month/day에, '
            + '조직은 dealer/group_name/dept_nm에, 그 리포트만의 조건은 report_filters에, '
            + '파라미터가 없는 축(계약일자·월별주차 등)은 dimension_filters에 넣어라. '
            + '조건을 빠뜨리면 전체 결과가 나가고 사용자는 그것이 걸러진 결과라고 믿게 된다.',
        },
        { role: 'user', content: message },
      ],
      tools: [buildRunCertifiedReportTool()],
      toolChoice: 'required',
      temperature: 0,
    })
  } catch (err) {
    sendEvent({ type: 'debug', label: '리포트 재시도 실패', detail: err.message })
    return false
  }
  if (retry?.name !== 'run_certified_report') return false
  // 재선택 경로에서 다시 부르는 자리다 — allowReselect를 끄지 않으면 서로 되돈다.
  await handleCertifiedReport({ args: retry.args, dashboardState, sendEvent, message, allowReselect: false })
  return true
}

/**
 * 질문에 그 차원의 실제 값이 나와 있으면 breakdown 축이 아니라 filter로 옮긴다.
 *
 * "자사출고에 대한 시승 당월 목표"에서 LLM이 activity_type을 dimensions에 넣어
 * "그 지표는 activity_type으로 분해할 수 없다"로 실패했다(2026-08-06 평가 No.22).
 * 값을 지목한 것은 쪼개 달라는 뜻이 아니라 그 값으로 한정해 달라는 뜻이다.
 *
 * 근거가 질문 안에 있을 때만 옮긴다 — dimensions.yaml의 known_values에 있는 값이
 * 질문에 그대로 등장해야 한다. 추측으로 축을 없애지 않는다.
 */
/**
 * 질문에 그 값이 **언급됐는지** 본다. 부분 문자열이 아니라 언급이어야 한다.
 *
 * 'A'·'B'·'C' 같은 영문 짧은 값은 낱말로 떨어져 있을 때만 인정한다.
 * 2026-08-06 실측(평가 No.49·50): "PMA IN과 PMA OUT 건수"의 PM'A'를 SC 등급 A로
 * 읽어 grp_name=A 필터를 걸었고, 오류 없이 0행이 나갔다 — BI에는 값이 멀쩡히 있다.
 *
 * 한글 값은 조사가 붙어 나오므로("재직자별"의 '재직') 부분 문자열이어야 잡힌다.
 */
export function valueMentionedIn(message, value) {
  const s = String(value)
  const raw = String(message || '')
  if (!/^[A-Za-z0-9]+$/.test(s)) return raw.replace(/\s+/g, '').includes(s)
  return new RegExp(`(?<![A-Za-z0-9])${s}(?![A-Za-z0-9])`).test(raw)
}

/**
 * 바인드 값을 사람이 읽을 한 줄로.
 *
 * GOLD 파생 경로는 디버그에 SQL만 찍고 바인드는 안 찍었다 — @dealer_nm 자리표시자만
 * 보여서 "무엇으로 조회했나"를 알 수 없었다. 조건이 조용히 빠지는 결함을 찾을 때
 * 정작 필요한 정보가 화면에 없었다.
 */
export function bindSummary(bind) {
  return Object.entries(bind || {})
    .filter(([, v]) => v?.value !== null && v?.value !== undefined && v?.value !== '')
    .map(([k, v]) => `${k}=${Array.isArray(v.value) ? v.value.join('/') : v.value}`)
    .join(', ') || '(조건 없음)'
}

/**
 * 질문에 이름이 그대로 나온 형제 지표가 IR에서 빠졌으면 채운다.
 *
 * 2026-08-10 실측(평가 No.50): "PMA IN과 PMA OUT 건수를 알려줘"에 LLM이
 * metrics: ["delivery_ytd_pma_in"] 하나만 담아, 답변에 PMA IN만 나가고 OUT은
 * 조용히 사라졌다. 물어본 지표가 답에서 빠지는데 오류가 없어 눈으로는 안 걸린다.
 *
 * 아무 지표나 끌어오면 안 된다. 조건을 좁게 건다:
 *   1) 이미 고른 지표와 **같은 접두어 계열**일 것(delivery_ytd_pma_in ↔ _out)
 *   2) 그 지표의 이름(name_ko)에서 계열 공통부를 뺀 **구별어**가 질문에 있을 것
 * 두 조건을 다 만족할 때만 추가한다 — "매출도 보여줘" 같은 막연한 말로는 안 늘어난다.
 */
export function addSiblingMetricsNamedInQuestion(ir, message, sendEvent = () => {}) {
  const chosen = ir?.metrics || []
  if (!chosen.length) return ir

  const registry = loadRegistry()
  const added = []
  for (const metricId of chosen) {
    // 같은 계열: 마지막 밑줄 앞까지가 같은 지표들(delivery_ytd_pma_*).
    const family = metricId.slice(0, metricId.lastIndexOf('_') + 1)
    if (family.length < 4) continue

    for (const [otherId, other] of registry.metrics) {
      if (chosen.includes(otherId) || added.includes(otherId)) continue
      if (!otherId.startsWith(family)) continue

      // 구별어 = 형제끼리 다른 부분. 'delivery_ytd_pma_out' → 'OUT'
      // id 조각은 소문자(_out)인데 질문은 대문자로 쓴다(PMA OUT). 대소문자를 맞춰 본다.
      const token = otherId.slice(family.length)
      if (token.length < 2) continue
      if (!valueMentionedIn(String(message).toUpperCase(), token.toUpperCase())) continue
      // 이름까지 겹쳐야 확신할 수 있다 — id 조각만으로는 우연히 맞을 수 있다.
      const nameTail = String(other.name_ko || '').split(/\s+/).at(-1)
      if (nameTail && !valueMentionedIn(message, nameTail)) continue
      added.push(otherId)
    }
  }
  if (!added.length) return ir

  sendEvent({
    type: 'debug',
    label: '지표 보완',
    detail: `질문에 이름이 있는데 빠진 지표를 채웠습니다: ${added.join(', ')}`,
  })
  return { ...ir, metrics: [...chosen, ...added] }
}

/**
 * "월별"이라고 물었으면 시간 축이 IR에 있어야 한다.
 *
 * 2026-08-10 실측(평가 No.36): "월별 활동 트렌드, 범례는 관계형성·기회창출"에 같은 지표로
 * 14행(7개월 × 2범례)이 나올 때와 2행(월이 접힌 것)이 나올 때가 갈렸다. 월이 빠지면
 * 추이가 통째로 사라지는데 표는 멀쩡해 보인다.
 *
 * 질문에 쓰인 말이 근거이므로 서버가 결정적으로 채운다. 지표가 그 축을 지원할 때만 넣는다.
 */
const TIME_WORDS = [
  { re: /일별|날짜별|일자별/, dimension: 'time_day' },
  { re: /월별|달별|월별로/, dimension: 'time_month' },
  { re: /연도별|년도별/, dimension: 'time_year' },
]

export function ensureTemporalDimension(ir, message, sendEvent = () => {}) {
  const hit = TIME_WORDS.find(({ re }) => re.test(String(message || '')))
  if (!hit) return ir
  const dims = ir?.dimensions || []
  if (dims.includes(hit.dimension)) return ir

  // 지표가 그 축을 지원하지 않으면 넣지 않는다 — 검증에서 막히면 답 자체가 실패한다.
  const registry = loadRegistry()
  const supported = (ir.metrics || []).every((id) => {
    const metric = registry.metrics.get(id)
    return !metric || (metric.dimensions || []).includes(hit.dimension)
  })
  if (!supported) return ir

  sendEvent({
    type: 'debug',
    label: '시간 축 보정',
    detail: `질문에 "${hit.re.source.split('|')[0]}"이 있는데 ${hit.dimension}이 빠져 있어 채웠습니다.`,
  })
  return { ...ir, dimensions: [hit.dimension, ...dims] }
}

/**
 * 월별 추이를 묻는데 기간이 한 달이면 모순이다 — 넓힌다.
 *
 * 2026-08-10 실측(평가 No.36): "2026년 ... 월별 활동 트렌드"에 time_range가 실행마다
 * absolute(2026 전체)와 mtd(당월) 사이에서 갈렸다. mtd면 월이 하나뿐이라 14행이 2행이
 * 되고, 추이가 통째로 사라진다. 표는 멀쩡해 보인다.
 *
 * 추측이 아니라 모순 해소다: time_grain이 month인데 기간이 한 달이면 축과 기간이 서로
 * 어긋난다. 질문에 연도가 적혀 있으면 그 해로, 없으면 연초부터(ytd)로 넓힌다.
 */
export function widenTimeRangeForTrend(ir, message, sendEvent = () => {}) {
  if (ir?.time_grain !== 'month') return ir
  if (ir?.time_range?.type !== 'mtd') return ir

  const named = String(message || '').match(/(20\d\d)\s*년/)
  const next = named
    ? { type: 'absolute', start_date: `${named[1]}-01-01`, end_date: `${named[1]}-12-31` }
    : { type: 'ytd' }

  sendEvent({
    type: 'debug',
    label: '기간 보정',
    detail: '월별 추이를 물었는데 기간이 당월(mtd)이라 월이 하나뿐이었습니다 — '
      + `${named ? `${named[1]}년 전체` : '연초부터'}로 넓혔습니다.`,
  })
  return { ...ir, time_range: next }
}

// "퍼센트도 함께", "달성률", "몇 %" 처럼 비율을 명시적으로 요구하는 말.
const RATE_ASKED = /퍼센트|퍼샌트|비율|달성률|달성율|진행률|진행율|진척률|진척율|%/

/**
 * 비율을 물었는데 비율 지표가 빠졌으면 채운다.
 *
 * 2026-08-11 실측(평가 No.28): "출고 목표 대비 출고 건수를 게이지로, 밑에는 퍼센트도"에
 * 12회 중 7회가 실적·목표만 담고 달성률을 빼먹었다. 사용자가 문장으로 요구한 값이
 * 오류 없이 사라진다 — 게이지는 그려지니 눈으로는 안 걸린다.
 *
 * 조건을 좁게 건다: 이미 고른 지표와 같은 계열이고 이름이 비율로 끝나는 것만.
 * 질문에 비율을 요구하는 말이 없으면 아무것도 안 한다.
 */
export function addRateMetricWhenAsked(ir, message, sendEvent = () => {}) {
  const chosen = ir?.metrics || []
  if (!chosen.length || !RATE_ASKED.test(String(message || ''))) return ir
  if (chosen.some((id) => /_rate$|_ratio$/.test(id))) return ir

  const registry = loadRegistry()
  const added = []
  for (const metricId of chosen) {
    // 계열 = 지표 id에서 마지막 마디를 뺀 앞부분(delivery_mtd_actual → delivery_mtd_).
    const family = metricId.slice(0, metricId.lastIndexOf('_') + 1)
    if (family.length < 4) continue
    for (const [otherId] of registry.metrics) {
      if (chosen.includes(otherId) || added.includes(otherId)) continue
      if (!otherId.startsWith(family)) continue
      if (!/_rate$|_ratio$/.test(otherId)) continue
      added.push(otherId)
      break
    }
    if (added.length) break     // 비율 하나면 충분하다 — 여러 개를 붙이면 화면이 어지럽다
  }
  if (!added.length) return ir

  sendEvent({
    type: 'debug',
    label: '비율 지표 보완',
    detail: `질문이 비율을 요구하는데 빠져 있어 채웠습니다: ${added.join(', ')}`,
  })
  return { ...ir, metrics: [...chosen, ...added] }
}

/**
 * 월별 추이를 묻는데 연누적 지표를 골랐으면 월 지표로 바꾼다.
 *
 * 2026-08-11 실측(평가 No.13): "2026년의 월별 판매 성취도 — 타겟·실적·취소·달성률"에
 * 10회 중 2회가 contract_ytd_* 를 골랐다. 값이 달라진다 — 4월 달성률이 월 기준 0.29인데
 * 연누적 기준 0.80이다. 표는 8행으로 똑같이 나와 눈으로는 안 걸린다.
 *
 * "누적"이라고 쓴 질문은 건드리지 않는다 — 연간 누적을 월별로 보는 건 정상 요청이다
 * (평가 No.37이 그 경우다). 월별인데 누적이라는 말이 없을 때만 바꾼다.
 */
const CUMULATIVE_ASKED = /누적|누계/
const MONTHLY_ASKED = /월별|월 별|달별/

export function preferMonthlyMetrics(ir, message, sendEvent = () => {}) {
  const text = String(message || '')
  if (!MONTHLY_ASKED.test(text) || CUMULATIVE_ASKED.test(text)) return ir
  const chosen = ir?.metrics || []
  if (!chosen.some((id) => id.includes('_ytd_'))) return ir

  const registry = loadRegistry()
  const swapped = []
  const next = chosen.map((id) => {
    if (!id.includes('_ytd_')) return id
    const monthly = id.replace('_ytd_', '_mtd_')
    if (!registry.metrics.has(monthly)) return id
    swapped.push(`${id}→${monthly}`)
    return monthly
  })
  if (!swapped.length) return ir

  sendEvent({
    type: 'debug',
    label: '월 지표로 교체',
    detail: `"월별"을 물었는데 연누적 지표가 선택돼 월 지표로 바꿨습니다: ${swapped.join(', ')}`,
  })
  return { ...ir, metrics: next }
}

/**
 * IR 필터 값을 DB의 정본 이름으로 맞춘다.
 *
 * 2026-08-11 실측(평가 No.1~5): 질문이 "렉서스강남"(붙여씀)인데 DB 값은
 * "렉서스 강남"(띄어씀)이다. 모델이 질문 표기를 그대로 넘기면 정확 일치가 안 되고
 * **0행이 나온다** — 오류가 아니라 "데이터 없음"이라 사용자는 진짜 없는 줄 안다.
 * 4회 중 2회가 그랬다.
 *
 * 같은 보정이 인증 리포트 경로에는 이미 있었다(canonicalizeValues). 지표 경로에만
 * 없었을 뿐이다. 값 표기를 모델에게 맡겨 두면 어느 모델을 쓰든 언젠가 이렇게 된다.
 *
 * @returns {object|null} 보정된 IR. 후보가 여럿이라 되물었으면 null.
 */
async function canonicalizeIrFilterValues(ir, sendEvent = () => {}) {
  const filters = ir?.filters || []
  if (!filters.length) return ir

  // 동명이지점("부산")을 좁히는 데 쓴다 — 인증 리포트 경로와 같은 재료다.
  const brands = filters.find((f) => f.dimension === 'brand')?.values || null

  const next = []
  const fixes = []
  for (const f of filters) {
    if (!Array.isArray(f?.values) || !f.values.length) { next.push(f); continue }
    let result
    try {
      result = await canonicalizeValues(f.dimension, f.values, { brands })
    } catch {
      next.push(f); continue      // 목록을 못 읽으면 원래 값을 쓴다 — 조회 실패로 질문을 막지 않는다
    }
    if (!result) { next.push(f); continue }
    if (!result.ok) {
      sendEvent({ type: 'reask', text: result.question, options: result.options })
      return null
    }
    for (const [from, to] of Object.entries(result.changed || {})) fixes.push(`${f.dimension}: "${from}" → "${to}"`)

    // 값이 다른 차원의 것이면 그 차원으로 옮긴다. 딜러 16개가 전시장 62개의 부분집합이라
    // "렉서스 강북"처럼 전시장에만 있는 이름이 딜러로 들어오면 역시 0행이 된다.
    let values = result.values
    for (const move of result.relocated || []) {
      const existing = next.find((x) => x.dimension === move.to)
      if (existing) existing.values = [...new Set([...existing.values, move.value])]
      else next.push({ dimension: move.to, operator: 'in', values: [move.value] })
      fixes.push(`"${move.input}" → ${move.label}`)
    }
    if (values.length) next.push({ ...f, values })
  }

  if (fixes.length) sendEvent({ type: 'debug', label: '필터 값 보정', detail: fixes.join(', ') })
  return { ...ir, filters: next }
}

export function moveValueDimensionsToFilters(ir, message, sendEvent = () => {}) {
  const dims = ir?.dimensions || []
  if (!dims.length) return ir
  const registry = loadRegistry()
  const hay = String(message || '').replace(/\s+/g, '')
  const already = new Set((ir.filters || []).filter((f) => f.values?.length).map((f) => f.dimension))

  const moved = []
  const keptDims = []
  const addedFilters = []
  for (const dimId of dims) {
    const known = registry.dimensions.get(dimId)?.known_values
    const norm = (v) => String(v).replace(/\s+/g, '')
    let hit = Array.isArray(known) ? known.filter((v) => hay.includes(norm(v))) : []
    // 더 긴 값 안에 들어 있기만 한 것은 언급된 게 아니다.
    // 2026-08-06: '자사출고'가 '출고'를 포함해 둘이 잡혔고, "값이 둘이면 범례" 규칙에
    // 걸려 축이 살아남았다 — 그 지표는 활동유형으로 분해할 수 없어 답이 실패했다(No.22).
    hit = hit.filter((v) => !hit.some((other) => other !== v && norm(other).includes(norm(v))))
    if (!hit.length) { keptDims.push(dimId); continue }
    // 값이 둘 이상 나오면 그건 범례다 — "범례는 관계형성, 기회창출이야"는 그 둘로
    // 나눠 보여 달라는 뜻이다. 축을 살리고 그 값들로 한정만 한다.
    // (2026-08-06: 이 구분이 없어 평가 No.36의 범례가 통째로 사라졌다.)
    if (hit.length > 1) {
      keptDims.push(dimId)
      if (!already.has(dimId)) {
        addedFilters.push({ dimension: dimId, operator: 'in', values: hit })
        moved.push(`${dimId}⊂${hit.join('/')} (축 유지)`)
      }
      continue
    }
    // 값이 하나면 한정 조건이다. 이미 같은 조건이 걸려 있으면 축에서 빼기만 한다 —
    // LLM이 축과 조건 양쪽에 넣는 일이 있는데, 그대로 두면 "그 축으로는 분해할 수
    // 없다"로 실패한다.
    if (already.has(dimId)) { moved.push(`${dimId}(중복 축 제거)`); continue }
    addedFilters.push({ dimension: dimId, operator: 'in', values: hit })
    moved.push(`${dimId}=${hit.join('/')}`)
  }
  if (!moved.length) return ir

  sendEvent({
    type: 'debug',
    label: '축 → 조건 보정',
    detail: `질문에 값이 그대로 나와 있어 분해 축이 아니라 조건으로 옮겼습니다: ${moved.join(', ')}`,
  })
  return { ...ir, dimensions: keptDims, filters: [...(ir.filters || []), ...addedFilters] }
}

export function normalizeTemporalFilters(ir) {
  const filters = ir?.filters || []
  const temporal = filters.filter((f) => ['time_year', 'time_month', 'time_day'].includes(f.dimension))
  if (!temporal.length) return ir

  // 이미 구체적인 기간이 있으면 그쪽이 우선이다 — 필터만 걷어낸다.
  const hasExplicitRange = ir.time_range && !['mtd', 'ytd'].includes(ir.time_range.type)
  const rest = filters.filter((f) => !['time_year', 'time_month', 'time_day'].includes(f.dimension))
  if (hasExplicitRange) return { ...ir, filters: rest }

  const rawOf = (id) => (temporal.find((f) => f.dimension === id)?.values || []).map((v) => String(v).trim())

  // time_day에 "2026-07-30"처럼 완성된 날짜가 오기도 한다. 숫자만 뽑으면 20260730이 되어
  // 일(day)로 성립하지 않고, 연도 필터가 따로 없으면 아래 분기에서 그대로 통과했다.
  // 그러면 MTD 기간(당월)과 그 날짜 필터가 SQL에 함께 들어가 서로 모순돼 0건이 된다
  // (2026-08-05 실측: 렉서스 분당 2026-07-30 계약 2건이 있는데 "데이터 없음"이 나왔다).
  const fullDates = rawOf('time_day').filter((v) => /^\d{4}-\d{2}-\d{2}$/.test(v))
  if (fullDates.length && fullDates.length === rawOf('time_day').length) {
    const sortedDates = [...new Set(fullDates)].sort()
    return {
      ...ir,
      filters: rest,
      time_range: { type: 'absolute', start_date: sortedDates[0], end_date: sortedDates[sortedDates.length - 1] },
    }
  }

  const nums = (id) => (temporal.find((f) => f.dimension === id)?.values || [])
    .map((v) => Number(String(v).replace(/[^0-9]/g, ''))).filter((n) => Number.isFinite(n) && n > 0)
  const years = nums('time_year')
  const months = nums('time_month')
  const days = nums('time_day')
  if (years.length !== 1) return ir   // 여러 해에 걸치면 구간 하나로 못 줄인다

  const year = years[0]
  const pad = (n) => String(n).padStart(2, '0')
  // 월이 여러 개면 최소~최대로 잇는다. 연속이 아니면 사이 달까지 포함되므로 건드리지 않는다.
  const sorted = [...months].sort((a, b) => a - b)
  const contiguous = sorted.every((m, i) => i === 0 || m === sorted[i - 1] + 1)
  if (months.length && !contiguous) return ir
  if (days.length > 1) return ir

  const startMonth = sorted[0] ?? 1
  const endMonth = sorted[sorted.length - 1] ?? 12
  const startDay = days.length && months.length === 1 ? days[0] : 1
  const endDay = days.length && months.length === 1
    ? days[0]
    : new Date(Date.UTC(year, endMonth, 0)).getUTCDate()

  return {
    ...ir,
    filters: rest,
    time_range: {
      type: 'absolute',
      start_date: `${year}-${pad(startMonth)}-${pad(startDay)}`,
      end_date: `${year}-${pad(endMonth)}-${pad(endDay)}`,
    },
  }
}

export function appendMentionedProjectionDimensions(message, ir, registry) {
  const question = String(message || '').toLowerCase()
  const metrics = ir.metrics.map((id) => registry.metrics.get(id)).filter(Boolean)
  if (!metrics.length) return ir
  const dimensions = [...(ir.dimensions || [])].filter((dimensionId) => shouldKeepProjectionDimension(question, dimensionId))
  const objectFilterDimensions = [...(ir.object_filter_dimensions || [])].filter((dimensionId) => shouldKeepProjectionDimension(question, dimensionId))
  const requestsObjectFilter = /필터|filter/i.test(question)
  for (const [dimensionId, dimension] of registry.dimensions.entries()) {
    if (dimensions.includes(dimensionId)) continue
    if (TEMPORAL_DIMENSIONS.has(dimensionId)) {
      if (!temporalDimensionRequested(question, dimensionId)) continue
    } else {
      const aliases = [dimensionId, dimension.label_ko, ...(Array.isArray(dimension.query_aliases) ? dimension.query_aliases : [])]
      if (!aliases.some((alias) => dimensionMentionedInQuestion(question, alias))) continue
    }
    if (!metrics.every((metric) => metricSupportsProjectionDimension(metric, dimensionId))) continue
    dimensions.push(dimensionId)
    if (requestsObjectFilter) {
      objectFilterDimensions.push(dimensionId)
    }
  }
  const nextDimensions = dimensions.slice(0, 4)
  const nextObjectFilterDimensions = [...new Set(objectFilterDimensions)].filter((field) => nextDimensions.includes(field))

  // 길이만 비교하면 차원이 "교체"된 경우를 놓친다 — "일별 추이"에서 time_month 하나가
  // time_day 하나로 바뀌면 개수가 같아 변경이 통째로 버려지고 월 단위로 나갔다.
  const same = (a = [], b = []) => a.length === b.length && a.every((v, i) => v === b[i])
  return same(nextDimensions, ir.dimensions) && same(nextObjectFilterDimensions, ir.object_filter_dimensions)
    ? ir
    : { ...ir, dimensions: nextDimensions, object_filter_dimensions: nextObjectFilterDimensions }
}

// The model chooses from a constrained semantic catalog, but temporal wording is
// still an invariant of the user's request. Keep it deterministic here so a
// trend request can never silently turn into an activity-type breakdown.
export function applyTimeIntent(message, ir) {
  const text = String(message || '').replace(/\s+/g, ' ')
  const asksDaily = /일별|일 단위|일자별|매일|하루별/.test(text)
  const asksMonthly = /월별|월 단위|매월/.test(text)
  const asksTrend = asksDaily || asksMonthly || /추이|트렌드|시계열|변화/.test(text)
  const asksCumulative = /누적|러닝\s*토탈|running\s*total/.test(text)
  const asksChangeRate = /증감률|증감율|전월\s*대비|전일\s*대비|mom\b/i.test(text)

  if (!asksTrend) return ir

  // A request can contain both "activity type" and "daily". In that case the
  // time axis remains the primary contract while compatible categorical fields
  // stay in the result for table display and object-level filtering.
  const timeGrain = asksDaily ? 'day' : (asksMonthly ? 'month' : null)
  const timeDimension = timeGrain === 'day' ? 'time_day' : timeGrain === 'month' ? 'time_month' : null
  const chartType = /막대\s*차트|바\s*차트|bar\s*chart/i.test(text)
    ? 'bar'
    : /라인\s*차트|선\s*차트|line\s*chart/i.test(text)
      ? 'line'
      : /표|테이블|table/i.test(text)
        ? 'table'
        : 'auto'

  return {
    ...ir,
    intent: 'trend_over_time',
    ...(timeDimension ? { dimensions: [timeDimension, ...(ir.dimensions || []).filter((dimension) => dimension !== timeDimension)], time_grain: timeGrain } : {}),
    accumulation: asksCumulative ? 'running_total' : 'none',
    chart_type: chartType,
    trend_calculation: asksChangeRate ? 'mom_change_rate' : 'actual',
    time_series_transform: asksCumulative ? 'cumulative' : (asksChangeRate ? 'mom_change_pct' : undefined),
  }
}

export function applyRequestedChartType(message, ir) {
  const text = String(message || '')
  if (/(?:콤보|복합)\s*(?:차트|그래프)?|보조축|(?:막대|바).*(?:선|라인)|(?:선|라인).*(?:막대|바)/i.test(text)) {
    return { ...ir, chart_type: 'combo' }
  }
  if (/\uB3C4\uB11B|\uD30C\uC774|doughnut|donut|pie\s*chart/i.test(text)) {
    return { ...ir, chart_type: 'donut' }
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

// "N주차"(예: "2026년 4월 2주차")는 SemanticQueryIR/ir_schema.js가 아는 time_range.type이
// 아니다 — 주차 경계(WeekNumber_Monthly_txt)는 달력 계산 규칙을 추측하지 않고 항상
// DIM_CALENDAR_KTWS에서 실제 조회해 확정한다(참조 쿼리의 @WeekEnd 산출 방식과 동일).
// 확정되면 "그 달 1일 ~ 해당 주차 마지막 날짜"의 absolute 구간으로 바꿔치기해서 돌려준다 —
// 이후 compileSingleMetricQuery/모든 controlled_analysis 컴파일러는 absolute만 알면 되므로
// resolveTimeWindow 등 기존 동기 함수를 하나도 건드릴 필요가 없다(주차 개념은 여기서만 존재).
async function resolveWeekOfMonthArgs(args, sendEvent) {
  const year = Number(args.week_year)
  const month = Number(args.week_month)
  const weekLabel = args.week_label
  if (!year || !month || !weekLabel) {
    return { args: null, error: '주차 조회에 필요한 연도/월/주차 표기가 빠졌습니다.' }
  }
  const monthStart = `${year}-${String(month).padStart(2, '0')}-01`
  const sql = `SELECT MAX(Date) AS weekEnd FROM ktws.DIM_CALENDAR_KTWS WHERE YEAR(Date) = ${year} AND MONTH(Date) = ${month} AND WeekNumber_Monthly_txt = N'${String(weekLabel).replace(/'/g, "''")}'`
  sendEvent({ type: 'debug', label: '주차 경계 조회 (week_of_month)', detail: sql })
  const rows = await queryFabricWithTimeout(FABRIC_DB, sql, 15000)
  const weekEnd = rows?.[0]?.weekEnd
  if (!weekEnd) {
    return { args: null, error: `${year}년 ${month}월에 "${weekLabel}"에 해당하는 날짜를 달력에서 찾지 못했습니다.` }
  }
  const weekEndStr = new Date(weekEnd).toISOString().slice(0, 10)
  sendEvent({ type: 'debug', label: '주차 경계 확정', detail: `${monthStart} ~ ${weekEndStr} (${weekLabel} 기준 MTD)` })
  return { args: { ...args, time_range_type: 'absolute', absolute_start_date: monthStart, absolute_end_date: weekEndStr }, error: null }
}

// 2026-08-05 leo: 계약 목표는 모든 조직 범위에서 하나의 FCT_CRM_TARGET_M 유효 사용자 정의를 사용한다.
// 별도 SC 단위 목표 지표가 필요한 것은 출고뿐이므로, 계약 필터가 조용히 다른 팩트로 전환되지 않는다.
const SC_SCOPE_DIMENSIONS = new Set(['sales_consultant', 'department', 'showroom'])
const DEALER_TO_SC_TARGET = {
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

function controlledDimensionPlan(ir, registry, { factTable, dateColumn }) {
  const ids = [...new Set((ir.dimensions || []).filter(Boolean))]
  const dimensions = ids.map((id) => {
    const dimension = registry.dimensions.get(id)
    if (!dimension) throw new CompileError(`unknown dimension '${id}'`, 'unknown_dimension')
    return { id, dimension }
  })
  const joins = []
  const joinedTables = new Set()
  const addJoin = (table, sql) => {
    if (joinedTables.has(table)) return
    joinedTables.add(table)
    joins.push(sql)
  }

  for (const { dimension } of dimensions) {
    if (dimension.derive_grain) continue
    const table = dimension.column.table
    if (table === 'DIM_MNG_USER' || table === 'DIM_MNG_DEALER') continue
    if (table === 'DIM_CALENDAR_KTWS') {
      addJoin(table, `LEFT JOIN ktws.DIM_CALENDAR_KTWS ON ${dateColumn} = DIM_CALENDAR_KTWS.Date`)
      continue
    }
    if (table === 'DIM_CRM_ACT_TYPE') {
      addJoin(table, `LEFT JOIN ktws.DIM_CRM_ACT_TYPE ON ${factTable}.tp_key = DIM_CRM_ACT_TYPE.tp_key`)
      continue
    }
    if (table === 'DIM_CRM_ACT_TYPE_ORDER') {
      addJoin('DIM_CRM_ACT_TYPE', `LEFT JOIN ktws.DIM_CRM_ACT_TYPE ON ${factTable}.tp_key = DIM_CRM_ACT_TYPE.tp_key`)
      addJoin(table, 'LEFT JOIN ktws.DIM_CRM_ACT_TYPE_ORDER ON DIM_CRM_ACT_TYPE.common_tp_nm = DIM_CRM_ACT_TYPE_ORDER.common_tp_nm')
      continue
    }
    throw new CompileError(`controlled metric cannot join dimension table '${table}'`, 'unsupported_controlled_dimension')
  }

  const dimensionExpr = (dimension) => (
    dimension.derive_grain
      ? timeGrainExpr(dimension.derive_grain, dateColumn)
      : `${dimension.column.table}.${dimension.column.column}`
  )
  const selectColumns = dimensions.map(({ id, dimension }) => `${dimensionExpr(dimension)} AS [${id}]`)
  const groupByColumns = dimensions.map(({ dimension }) => dimensionExpr(dimension))
  return {
    ids,
    joins,
    selectPrefix: selectColumns.length ? `${selectColumns.join(', ')}, ` : '',
    selectColumns,
    groupByColumns,
    groupByClause: groupByColumns.length ? `GROUP BY ${groupByColumns.join(', ')}` : '',
    orderByClause: ids.length ? `ORDER BY ${ids.map((id) => `[${id}]`).join(', ')}` : '',
  }
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

  const dimensions = controlledDimensionPlan(ir, registry, {
    factTable: 'FCT_CONTRACT_KTWS',
    dateColumn: 'FCT_CONTRACT_KTWS.last_retail_sales_dt',
  })

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
  const groupByInner = [...dimensions.groupByColumns, monthExpr].join(', ')
  const outerDimensionColumns = dimensions.ids.map((id) => `[${id}]`)

  const sql = [
    `SELECT ${outerDimensionColumns.length ? `${outerDimensionColumns.join(', ')}, ` : ''}AVG(CAST(monthly_cnt AS FLOAT)) AS [${metric.id}]`,
    `FROM (`,
    `  SELECT ${dimensions.selectPrefix}COUNT(DISTINCT FCT_CONTRACT_KTWS.dlr_contract_no) AS monthly_cnt`,
    `  FROM ktws.FCT_CONTRACT_KTWS`,
    `  LEFT JOIN ktws.DIM_MNG_USER ON FCT_CONTRACT_KTWS.cn_sc_key = DIM_MNG_USER.sc_key`,
    `  LEFT JOIN ktws.DIM_MNG_DEALER ON DIM_MNG_USER.dealer_key = DIM_MNG_DEALER.dealer_key`,
    ...dimensions.joins.map((join) => `  ${join}`),
    `  WHERE ${whereClauses.join('\n    AND ')}`,
    `  GROUP BY ${groupByInner}`,
    `) monthly`,
    outerDimensionColumns.length ? `GROUP BY ${outerDimensionColumns.join(', ')}` : '',
    dimensions.orderByClause,
  ].filter(Boolean).join('\n')

  sendEvent({ type: 'debug', label: `Compiled SQL (${metric.id}, controlled analysis)`, detail: sql })
  sendEvent({ type: 'stage', stage: 'execute', label: STAGE_LABELS.execute })
  const rows = await queryFabricWithTimeout(FABRIC_DB, sql, 30000)
  return { rows, sql }
}

// lead_mtd_actual — "당월 기회 실적(유효 리드 수)". 유효 리드 = 자격 있는 Activity(관계형성/
// 기회창출, 부재중 제외)가 같은 기간에 있고, close_dt가 그 달 이후이거나 아직 열려있거나
// 이미 출고 전환된 리드. 이 "자격 있는 Activity가 있는 리드"라는 조건은 FCT_ACTIVITY_v2에
// 대한 EXISTS류 상관 서브쿼리로만 정확히 표현되는데, compileSingleMetricQuery(app/semantic/
// compiler.js)는 flat JOIN+WHERE 조립기라 이 형태를 낼 수 없다(lead_metrics.yaml의
// not_directly_compilable_reason 참고) — 그래서 여기서 전용 컴파일러로 직접 SQL을 짠다.
//
// 2026-07-24 오답노트에서 발견: 이 metric이 not_directly_compilable=true라는 이유로
// tools.js의 LLM 후보 목록에서 통째로 빠져 있었고, LLM은 "영업기회 당월활동실적"이라는
// 질문에 없는 답 대신 이름이 비슷한 activity_mtd_actual(영업활동 자체의 실적 — 전혀 다른
// 지표)을 골라 그럴듯하지만 틀린 숫자를 답했다. controlled_analysis:true로 등록해 실제로
// 답할 수 있게 만드는 것이 근본 수정이다(프롬프트로 "모른다고 답해라"만 강화하는 것보다 —
// 이 metric 자체가 실존하는 유효한 질문이므로).
//
// 2026-07-27 오답노트: 처음 버전은 사용자/딜러 스코프(창구SC·테스트계정·요청한 딜러 등)를
// 최종 리드 단계에서만 걸었다 — 참조 쿼리는 filtered_users를 활동 단계에도 걸어, "자격 있는
// 활동" 자체가 스코프 밖 SC(예: 다른 딜러, 창구SC)의 것이면 애초에 인정하지 않는다. 이
// 차이 때문에 원래 버전은 참조 쿼리보다 값이 부풀 수 있었다 — 이제 활동/리드 두 단계 모두에
// 같은 스코프를 건다(userScopeClauses를 재사용).
async function compileLeadMtdActual(ir, metric, registry, sendEvent, options = {}) {
  // GOLD 파생이 가능하면 그쪽이 정본이다 — 아래 전용 컴파일러는 GOLD의 CTE 구조를
  // 손으로 옮긴 것이라, 정의가 갈릴 여지가 있는 쪽이다.
  const derived = await runDerivedIfPossible(ir, sendEvent, options)
  if (derived) return derived

  const window = resolveTimeWindow(ir.time_range, todayISO())
  const startDate = window.start.toISOString().slice(0, 10)
  const endDate = window.end.toISOString().slice(0, 10)

  const dimensions = controlledDimensionPlan(ir, registry, {
    factTable: 'FCT_LEAD',
    dateColumn: 'FCT_LEAD.lead_reg_dt',
  })
  // 손으로 짠 SQL이라 compileSingleMetricQuery의 자동 조인 탐색을 안 쓴다 — time_month처럼
  // DIM_CALENDAR_KTWS 컬럼을 그룹핑에 쓰려면 그 조인을 직접 넣어야 한다(compileContractMtdActivityActual과 동일 패턴).

  // br_qualified_lead_def의 sql_fragment는 "@MonthEnd"라는 심볼릭 자리표시자를 쓴다
  // (filters.yaml 자체는 실행 가능한 SQL이 아니라 등록된 규칙 문서라 실제 바인딩은
  // 컴파일러 몫) — 이 window의 end를 리터럴로 채워 넣는다.
  const qualifiedLeadDef = registry.filters.get('br_qualified_lead_def').sql_fragment.replace('@MonthEnd', `'${endDate}'`)

  // 사용자(SC)/딜러 스코프 — 활동 단계/리드 단계 양쪽에 동일하게 적용한다.
  const userScopeClauses = [
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
    userScopeClauses.push(`${col} IN (${values})`)
  }

  // 자격 있는 Activity가 있는 리드만 — 그 활동을 남긴 SC 자신도 사용자/딜러 스코프를
  // 통과해야 "자격 있음"으로 인정한다.
  const qualifyingActivitySubquery = `(
      SELECT FCT_ACTIVITY_v2.lead_key
      FROM ktws.FCT_ACTIVITY_v2
      INNER JOIN ktws.DIM_CRM_ACT_TYPE ON FCT_ACTIVITY_v2.tp_key = DIM_CRM_ACT_TYPE.tp_key
      LEFT JOIN ktws.DIM_MNG_USER ON FCT_ACTIVITY_v2.sc_key = DIM_MNG_USER.sc_key
      LEFT JOIN ktws.DIM_MNG_DEALER ON DIM_MNG_USER.dealer_key = DIM_MNG_DEALER.dealer_key
      WHERE FCT_ACTIVITY_v2.act_dt_fr BETWEEN '${startDate}' AND '${endDate}'
        AND ${registry.filters.get('br_tp_grp_scope').sql_fragment}
        AND ${registry.filters.get('br_act_result_exclusion').sql_fragment}
        AND ${userScopeClauses.join('\n        AND ')}
  )`

  const whereClauses = [
    `FCT_LEAD.lead_reg_dt BETWEEN '${startDate}' AND '${endDate}'`,
    qualifiedLeadDef,
    `FCT_LEAD.lead_key IN ${qualifyingActivitySubquery}`,
    ...userScopeClauses,
  ]

  const sql = [
    `SELECT ${dimensions.selectPrefix}COUNT(DISTINCT FCT_LEAD.lead_key) AS [${metric.id}]`,
    `FROM ktws.FCT_LEAD`,
    `LEFT JOIN ktws.DIM_MNG_USER ON FCT_LEAD.cl_sc_key = DIM_MNG_USER.sc_key`,
    `LEFT JOIN ktws.DIM_MNG_DEALER ON DIM_MNG_USER.dealer_key = DIM_MNG_DEALER.dealer_key`,
    ...dimensions.joins,
    `WHERE ${whereClauses.join('\n  AND ')}`,
    dimensions.groupByClause,
    dimensions.orderByClause,
  ].filter(Boolean).join('\n')

  sendEvent({ type: 'debug', label: `Compiled SQL (${metric.id}, controlled analysis)`, detail: sql })
  sendEvent({ type: 'stage', stage: 'execute', label: STAGE_LABELS.execute })
  const rows = await queryFabricWithTimeout(FABRIC_DB, sql, 30000)
  return { rows, sql }
}

// contract_mtd_activity_actual — "계약건수(당월활동실적, 퍼널 전환 기준)". lead_mtd_actual의
// 자격 리드 풀(qualifyingActivitySubquery와 동일 로직)을 그대로 재사용해 FCT_CONTRACT_KTWS로
// 한 단계 더 조인한다. contract_mtd_actual(전체실적)과는 별도 모집단 — 섞지 말 것
// (contract_metrics.yaml의 해당 metric 주석 참고).
//
// 2026-07-24 오답노트: 사용자가 제시한 참조 쿼리는 filtered_users CTE에서
// facade_sc_yn/name을 순수 NOT IN으로 걸러 NULL 행이 조용히 빠지는 버그가 있었고,
// cancel_dt IS NULL(유효 계약 조건)도 빠져 있었다. 여기서는 등록된 filter fragment
// (br_exclude_front_sc/br_exclude_staff_names는 IS NULL OR <> 패턴, br_contract_
// cancel_exclusion)를 그대로 재사용해 두 문제를 모두 피한다.
//
// 2026-07-27 오답노트: compileLeadMtdActual과 같은 이유로 사용자/딜러 스코프를 활동/리드
// 단계에도 걸도록 수정(userScopeClauses) — 원래는 최종 계약 단계(cn_sc_key)에서만 걸어서
// 참조 쿼리보다 값이 부풀 수 있었다. SUM 결과가 0건일 때 NULL이 아니라 0이 나오도록
// COALESCE도 추가했다(참조 쿼리엔 있었는데 여기 빠져 있었음).
async function compileContractMtdActivityActual(ir, metric, registry, sendEvent, options = {}) {
  const derived = await runDerivedIfPossible(ir, sendEvent, options)
  if (derived) return derived

  const window = resolveTimeWindow(ir.time_range, todayISO())
  const startDate = window.start.toISOString().slice(0, 10)
  const endDate = window.end.toISOString().slice(0, 10)

  const dimensions = controlledDimensionPlan(ir, registry, {
    factTable: 'FCT_CONTRACT_KTWS',
    dateColumn: 'FCT_CONTRACT_KTWS.contract_dt',
  })
  // 이 컴파일러는 손으로 짠 SQL이라(compileSingleMetricQuery의 자동 조인 그래프 탐색을
  // 안 씀) time_month처럼 DIM_CALENDAR_KTWS 컬럼을 그룹핑에 쓰려면 그 조인을 직접 넣어야
  // 한다 — 안 넣으면 groupCol만 계산되고 실제 FROM/JOIN엔 없어서 "잘못된 열 이름" 오류가 난다.

  const qualifiedLeadDef = registry.filters.get('br_qualified_lead_def').sql_fragment.replace('@MonthEnd', `'${endDate}'`)

  const userScopeClauses = [
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
    userScopeClauses.push(`${col} IN (${values})`)
  }

  const qualifyingActivitySubquery = `(
      SELECT FCT_ACTIVITY_v2.lead_key
      FROM ktws.FCT_ACTIVITY_v2
      INNER JOIN ktws.DIM_CRM_ACT_TYPE ON FCT_ACTIVITY_v2.tp_key = DIM_CRM_ACT_TYPE.tp_key
      LEFT JOIN ktws.DIM_MNG_USER ON FCT_ACTIVITY_v2.sc_key = DIM_MNG_USER.sc_key
      LEFT JOIN ktws.DIM_MNG_DEALER ON DIM_MNG_USER.dealer_key = DIM_MNG_DEALER.dealer_key
      WHERE FCT_ACTIVITY_v2.act_dt_fr BETWEEN '${startDate}' AND '${endDate}'
        AND ${registry.filters.get('br_tp_grp_scope').sql_fragment}
        AND ${registry.filters.get('br_act_result_exclusion').sql_fragment}
        AND ${userScopeClauses.join('\n        AND ')}
  )`

  const qualifiedLeadPoolSubquery = `(
      SELECT FCT_LEAD.lead_key
      FROM ktws.FCT_LEAD
      LEFT JOIN ktws.DIM_MNG_USER ON FCT_LEAD.cl_sc_key = DIM_MNG_USER.sc_key
      LEFT JOIN ktws.DIM_MNG_DEALER ON DIM_MNG_USER.dealer_key = DIM_MNG_DEALER.dealer_key
      WHERE FCT_LEAD.lead_reg_dt BETWEEN '${startDate}' AND '${endDate}'
        AND ${qualifiedLeadDef}
        AND FCT_LEAD.lead_key IN ${qualifyingActivitySubquery}
        AND ${userScopeClauses.join('\n        AND ')}
  )`

  const whereClauses = [
    `FCT_CONTRACT_KTWS.contract_dt BETWEEN '${startDate}' AND '${endDate}'`,
    registry.filters.get('br_contract_cancel_exclusion').sql_fragment,
    `FCT_CONTRACT_KTWS.lead_key IN ${qualifiedLeadPoolSubquery}`,
    ...userScopeClauses,
  ]

  const sql = [
    `SELECT ${dimensions.selectPrefix}COALESCE(SUM(FCT_CONTRACT_KTWS.cnt), 0) AS [${metric.id}]`,
    `FROM ktws.FCT_CONTRACT_KTWS`,
    `LEFT JOIN ktws.DIM_MNG_USER ON FCT_CONTRACT_KTWS.cn_sc_key = DIM_MNG_USER.sc_key`,
    `LEFT JOIN ktws.DIM_MNG_DEALER ON DIM_MNG_USER.dealer_key = DIM_MNG_DEALER.dealer_key`,
    ...dimensions.joins,
    `WHERE ${whereClauses.join('\n  AND ')}`,
    dimensions.groupByClause,
    dimensions.orderByClause,
  ].filter(Boolean).join('\n')

  sendEvent({ type: 'debug', label: `Compiled SQL (${metric.id}, controlled analysis)`, detail: sql })
  sendEvent({ type: 'stage', stage: 'execute', label: STAGE_LABELS.execute })
  const rows = await queryFabricWithTimeout(FABRIC_DB, sql, 30000)
  return { rows, sql }
}

// testdrive_mtd_actual — "당월 시승 실적(리드매칭 기준)". 3단계 퍼널: (1) 관계형성/기회창출
// 자격 활동이 있고 부재중·MSG가 아닌 리드(act_grp) -> (2) 그 리드 중 당월 등록되고 유효
// 상태인 리드(lead_grp) -> (3) 그 리드에 연결된 "시승완료"(act_tp=P113, act_result=시승완료)
// 활동의 DISTINCT lead_key 수. compileSingleMetricQuery(flat JOIN 전용)로는 이 3단계
// 상관 서브쿼리 구조를 낼 수 없어 전용 컴파일러로 직접 짠다(testdrive_metrics.yaml의
// controlled_analysis_note 참고).
//
// 2026-07 오답노트: 사용자가 제시한 참조 쿼리는 filtered_users CTE에서 facade_sc_yn/name을
// 순수 NOT IN으로 걸러 NULL 행이 조용히 빠지는 버그가 있었다 — lead_mtd_actual과 동일하게
// 등록된 filter fragment(IS NULL OR <> 패턴)로 대체해 이 버그를 피한다. 사용자/딜러 스코프는
// 참조 쿼리가 filtered_users를 3단계 모두에서 재사용하는 구조를 그대로 재현해 act_grp/
// lead_grp/최종 활동 3곳 모두에 독립적으로 적용한다 — 후보 활동 담당 SC, 리드 담당 SC,
// 최종 시승완료 활동 담당 SC가 항상 같은 사람이라는 보장이 없기 때문이다.
async function compileTestdriveMtdActual(ir, metric, registry, sendEvent, options = {}) {
  // 2026-08-03 leo: 기존에는 시승 실적이 제어 컴파일러만 타 퍼널 표의 인증 GOLD 정의와 분리될 수 있었다. GOLD가 지원하는 월·조직 차원 요청은 먼저 파생 경로로 실행하고 나머지만 기존 SQL로 폴백한다.
  const derived = await runDerivedIfPossible(ir, sendEvent, options)
  if (derived) return derived

  const window = resolveTimeWindow(ir.time_range, todayISO())
  const startDate = window.start.toISOString().slice(0, 10)
  const endDate = window.end.toISOString().slice(0, 10)

  const dimensions = controlledDimensionPlan(ir, registry, {
    factTable: 'FCT_ACTIVITY_v2',
    dateColumn: 'FCT_ACTIVITY_v2.act_dt_fr',
  })

  const userScopeClauses = [
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
    userScopeClauses.push(`${col} IN (${values})`)
  }

  const actGrpSubquery = `(
      SELECT DISTINCT FCT_ACTIVITY_v2.lead_key
      FROM ktws.FCT_ACTIVITY_v2
      INNER JOIN ktws.DIM_CRM_ACT_TYPE ON FCT_ACTIVITY_v2.tp_key = DIM_CRM_ACT_TYPE.tp_key
      LEFT JOIN ktws.DIM_MNG_USER ON FCT_ACTIVITY_v2.sc_key = DIM_MNG_USER.sc_key
      LEFT JOIN ktws.DIM_MNG_DEALER ON DIM_MNG_USER.dealer_key = DIM_MNG_DEALER.dealer_key
      WHERE FCT_ACTIVITY_v2.act_dt_fr BETWEEN '${startDate}' AND '${endDate}'
        AND ${registry.filters.get('br_tp_grp_scope').sql_fragment}
        AND (FCT_ACTIVITY_v2.act_result IS NULL OR FCT_ACTIVITY_v2.act_result <> N'부재중')
        AND (FCT_ACTIVITY_v2.contact_tp IS NULL OR FCT_ACTIVITY_v2.contact_tp <> N'MSG')
        AND FCT_ACTIVITY_v2.lead_key IS NOT NULL
        AND ${userScopeClauses.join('\n        AND ')}
  )`

  const leadGrpSubquery = `(
      SELECT DISTINCT FCT_LEAD.lead_key
      FROM ktws.FCT_LEAD
      LEFT JOIN ktws.DIM_MNG_USER ON FCT_LEAD.cl_sc_key = DIM_MNG_USER.sc_key
      LEFT JOIN ktws.DIM_MNG_DEALER ON DIM_MNG_USER.dealer_key = DIM_MNG_DEALER.dealer_key
      WHERE FCT_LEAD.lead_reg_dt BETWEEN '${startDate}' AND '${endDate}'
        AND (FCT_LEAD.close_dt > '${endDate}' OR FCT_LEAD.close_dt IS NULL OR FCT_LEAD.last_retail_sales_dt IS NOT NULL)
        AND FCT_LEAD.lead_key IN ${actGrpSubquery}
        AND ${userScopeClauses.join('\n        AND ')}
  )`

  const whereClauses = [
    `FCT_ACTIVITY_v2.act_dt_fr BETWEEN '${startDate}' AND '${endDate}'`,
    `FCT_ACTIVITY_v2.act_tp = N'P113'`,
    `FCT_ACTIVITY_v2.act_result = N'시승완료'`,
    `FCT_ACTIVITY_v2.lead_key IS NOT NULL`,
    `FCT_ACTIVITY_v2.lead_key IN ${leadGrpSubquery}`,
    ...userScopeClauses,
  ]

  const sql = [
    `SELECT ${dimensions.selectPrefix}COUNT(DISTINCT FCT_ACTIVITY_v2.lead_key) AS [${metric.id}]`,
    `FROM ktws.FCT_ACTIVITY_v2`,
    `LEFT JOIN ktws.DIM_MNG_USER ON FCT_ACTIVITY_v2.sc_key = DIM_MNG_USER.sc_key`,
    `LEFT JOIN ktws.DIM_MNG_DEALER ON DIM_MNG_USER.dealer_key = DIM_MNG_DEALER.dealer_key`,
    ...dimensions.joins,
    `WHERE ${whereClauses.join('\n  AND ')}`,
    dimensions.groupByClause,
    dimensions.orderByClause,
  ].filter(Boolean).join('\n')

  sendEvent({ type: 'debug', label: `Compiled SQL (${metric.id}, controlled analysis)`, detail: sql })
  sendEvent({ type: 'stage', stage: 'execute', label: STAGE_LABELS.execute })
  const rows = await queryFabricWithTimeout(FABRIC_DB, sql, 30000)
  return { rows, sql }
}

// contract_mtd_testdrive_actual — "계약건수(시승 리드 기준)". compileContractMtdActivityActual과
// 거의 같은 3단계 퍼널이되, lead_pool 단계에 "시승 신청 리드(td_yn='Y')" 조건이 하나 더
// 붙는다 — testdrive_to_contract_conversion_rate(시승→계약 전환율)의 분자로 쓰기 위해
// 추가했다. 2026-07 평가표: "시승에서 계약으로의 전환"을 물었을 때 activity_type=시승
// 필터를 contract_mtd_activity_actual에 붙이려던 시도가 있었는데, 그 필터는 계약 fact에
// 없는 컬럼(DIM_CRM_ACT_TYPE_ORDER 미조인)이라 실행 자체가 안 됐고 애초에 의미도 달랐다 —
// "활동유형이 시승인 계약"이 아니라 "시승 신청 리드에서 나온 계약"이 실제 정의다.
//
// 2026-07-27 오답노트: compileContractMtdActivityActual과 같은 이유로 사용자/딜러 스코프를
// 활동/리드 단계에도 걸도록 수정, SUM 0건 시 NULL 대신 0이 나오도록 COALESCE도 추가.
async function compileContractMtdTestdriveActual(ir, metric, registry, sendEvent, options = {}) {
  // 2026-08-03 leo: 기존에는 시승 리드 기준 계약이 별도 SQL만 사용해 퍼널 표와 집계 기준이 달라질 수 있었다. 인증 GOLD CTE를 우선 사용하고 표현할 수 없는 요청만 기존 SQL로 처리한다.
  const derived = await runDerivedIfPossible(ir, sendEvent, options)
  if (derived) return derived

  const window = resolveTimeWindow(ir.time_range, todayISO())
  const startDate = window.start.toISOString().slice(0, 10)
  const endDate = window.end.toISOString().slice(0, 10)

  const dimensions = controlledDimensionPlan(ir, registry, {
    factTable: 'FCT_CONTRACT_KTWS',
    dateColumn: 'FCT_CONTRACT_KTWS.contract_dt',
  })
  // time_month은 아직 이 metric의 registered dimensions에 없어(contract_metrics.yaml)
  // validator.js가 그 전에 걸러내지만, 방어적으로 compileContractMtdActivityActual과
  // 동일하게 처리해둔다 — 나중에 time_month을 등록하더라도 여기 잊고 안 넣는 실수를 막는다.

  const qualifiedLeadDef = registry.filters.get('br_qualified_lead_def').sql_fragment.replace('@MonthEnd', `'${endDate}'`)

  const userScopeClauses = [
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
    userScopeClauses.push(`${col} IN (${values})`)
  }

  const qualifyingActivitySubquery = `(
      SELECT FCT_ACTIVITY_v2.lead_key
      FROM ktws.FCT_ACTIVITY_v2
      INNER JOIN ktws.DIM_CRM_ACT_TYPE ON FCT_ACTIVITY_v2.tp_key = DIM_CRM_ACT_TYPE.tp_key
      LEFT JOIN ktws.DIM_MNG_USER ON FCT_ACTIVITY_v2.sc_key = DIM_MNG_USER.sc_key
      LEFT JOIN ktws.DIM_MNG_DEALER ON DIM_MNG_USER.dealer_key = DIM_MNG_DEALER.dealer_key
      WHERE FCT_ACTIVITY_v2.act_dt_fr BETWEEN '${startDate}' AND '${endDate}'
        AND ${registry.filters.get('br_tp_grp_scope').sql_fragment}
        AND ${registry.filters.get('br_act_result_exclusion').sql_fragment}
        AND ${userScopeClauses.join('\n        AND ')}
  )`

  const qualifiedLeadPoolSubquery = `(
      SELECT FCT_LEAD.lead_key
      FROM ktws.FCT_LEAD
      LEFT JOIN ktws.DIM_MNG_USER ON FCT_LEAD.cl_sc_key = DIM_MNG_USER.sc_key
      LEFT JOIN ktws.DIM_MNG_DEALER ON DIM_MNG_USER.dealer_key = DIM_MNG_DEALER.dealer_key
      WHERE FCT_LEAD.lead_reg_dt BETWEEN '${startDate}' AND '${endDate}'
        AND ${qualifiedLeadDef}
        AND FCT_LEAD.td_yn = N'Y'
        AND FCT_LEAD.lead_key IN ${qualifyingActivitySubquery}
        AND ${userScopeClauses.join('\n        AND ')}
  )`

  const whereClauses = [
    `FCT_CONTRACT_KTWS.contract_dt BETWEEN '${startDate}' AND '${endDate}'`,
    registry.filters.get('br_contract_cancel_exclusion').sql_fragment,
    `FCT_CONTRACT_KTWS.lead_key IN ${qualifiedLeadPoolSubquery}`,
    ...userScopeClauses,
  ]

  const sql = [
    `SELECT ${dimensions.selectPrefix}COALESCE(SUM(FCT_CONTRACT_KTWS.cnt), 0) AS [${metric.id}]`,
    `FROM ktws.FCT_CONTRACT_KTWS`,
    `LEFT JOIN ktws.DIM_MNG_USER ON FCT_CONTRACT_KTWS.cn_sc_key = DIM_MNG_USER.sc_key`,
    `LEFT JOIN ktws.DIM_MNG_DEALER ON DIM_MNG_USER.dealer_key = DIM_MNG_DEALER.dealer_key`,
    ...dimensions.joins,
    `WHERE ${whereClauses.join('\n  AND ')}`,
    dimensions.groupByClause,
    dimensions.orderByClause,
  ].filter(Boolean).join('\n')

  sendEvent({ type: 'debug', label: `Compiled SQL (${metric.id}, controlled analysis)`, detail: sql })
  sendEvent({ type: 'stage', stage: 'execute', label: STAGE_LABELS.execute })
  const rows = await queryFabricWithTimeout(FABRIC_DB, sql, 30000)
  return { rows, sql }
}

// 2026-08-03 leo: 기존에는 퍼널 전용 원자 지표가 controlled_analysis 후보에 있어도 실행기가 없어 일반 지표로 대체되거나 실패했다. 공통 GOLD 파생 실행기를 추가해 등록된 메트릭을 같은 경로로 처리한다.
async function compileCertifiedFunnelMetric(ir, metric, _registry, sendEvent, options = {}) {
  const derived = await runDerivedIfPossible(ir, sendEvent, options)
  if (derived) return derived
  // 이 지표는 controlled_analysis라 폴백이 없다 — 파생이 안 되면 답할 방법이 없다.
  // 그래도 **무엇 때문에** 안 되는지는 알려준다. 예전 문구는 "월 단위 및 조직 차원만
  // 지원합니다"라고만 해서, 실제 원인이 조건 하나였는데도 사용자가 알 수 없었다.
  // 2026-08-06 실측(평가 No.22): "자사출고에 대한 시승 당월 목표"에서 자사출고가
  // pma_status로 해석돼 "GOLD에 없는 필터: pma_status"가 진짜 이유였다.
  throw new CompileError(
    `'${metric.name_ko}'은(는) 이 조건으로 답할 수 없습니다 — ${derivedUnavailableReason(ir)}.`
    + ' 인증 퍼널 정의는 월 단위와 조직 차원(브랜드·딜러·전시장·팀·SC), 활동유형 조건만 지원합니다.',
    'unsupported_certified_funnel_shape',
  )
}

// controlled_analysis:true인 metric마다 전용 컴파일러가 필요하다 - id로 디스패치한다.
// (이전에는 resolveMetricRows가 compileDeliveryMonthlyAverage 하나만 무조건 호출했는데,
// lead_mtd_actual을 추가하면서 여러 개를 구분해야 해서 맵으로 일반화했다.)
const CONTROLLED_ANALYSIS_COMPILERS = {
  delivery_monthly_avg_6m: compileDeliveryMonthlyAverage,
  lead_mtd_actual: compileLeadMtdActual,
  contract_mtd_activity_actual: compileContractMtdActivityActual,
  testdrive_mtd_actual: compileTestdriveMtdActual,
  contract_mtd_testdrive_actual: compileContractMtdTestdriveActual,
  lead_mtd_total_actual: compileCertifiedFunnelMetric,
  testdrive_mtd_actual_form_basis: compileCertifiedFunnelMetric,
  testdrive_mtd_total_lead_actual: compileCertifiedFunnelMetric,
  testdrive_mtd_total_actual: compileCertifiedFunnelMetric,
  testdrive_mtd_target: compileCertifiedFunnelMetric,
  contract_mtd_total_actual_funnel: compileCertifiedFunnelMetric,
  contract_mtd_progress_actual_funnel: compileCertifiedFunnelMetric,
  contract_mtd_target_funnel: compileCertifiedFunnelMetric,
  contract_mtd_testdrive_total_actual: compileCertifiedFunnelMetric,
}

function formatMetricValue(value, metric) {
  if (value == null) return '데이터 없음'
  if (metric.format === 'percentage') return `${(value * 100).toFixed(1)}%`
  if (typeof value === 'number') return value.toLocaleString()
  return String(value)
}

// dashboardIr.components[]의 type("kpi_card"/"bar_chart"/"detail_table")을 widgetSchema.js의
// chartCode("kpi"/"bar"/"table") 어휘로 바꾼다 — 대시보드 커스텀 파이프라인(dashboardPipeline.js)이
// 쓰는 어휘와 통일해서 buildWidgetPropsFromRows() 하나를 그대로 재사용하기 위함.
function chartCodeForComponentType(type) {
  if (type === 'kpi_card') return 'kpi'
  if (type === 'bar_chart') return 'bar'
  if (type === 'line_chart') return 'line'
  if (type === 'donut_chart') return 'pie'
  if (type === 'detail_table') return 'table'
  return null
}

// buildWidgetPropsFromRows(chartCode, rows, querySpec, title)가 기대하는 spec 모양은
// chartCode마다 다르다(widgetSchema.js 참고) — kpi는 어느 컬럼이 카드 값인지(cardKey),
// bar는 어느 컬럼이 x축/y축인지(labelKey/valueKey), table은 spec이 필요 없다.
function buildQuerySpecForComponent(chartCode, metric, dimensionId, title, { secondaryKeys } = {}) {
  if (chartCode === 'kpi') return { cardKey: metric.id, cardTitle: title }
  // secondaryKeys: "전월/전일 대비 증감률" 표시일 때 단일 계열이라도 오른쪽(퍼센트) 축으로
  // 보내야 percentTick 눈금이 붙는다 — BarChartWidget.jsx의 secondary_keys 메커니즘을
  // 다계열 비교(renderMultiSeriesAndRespond)뿐 아니라 단일 지표 차트에도 그대로 재사용.
  if (chartCode === 'bar') return { labelKey: dimensionId, valueKey: metric.id, ...(secondaryKeys ? { secondaryKeys } : {}) }
  if (chartCode === 'pie') return { labelKey: dimensionId, valueKey: metric.id, foldTopN: DONUT_MAX_SLICES }
  if (chartCode === 'line' || chartCode === 'area') {
    return { xKey: dimensionId, yKeys: [metric.id], yLabels: [metric.name_ko], ...(secondaryKeys ? { secondaryKeys } : {}) }
  }
  return {}
}

function buildQueryBundle({ metricId, db = FABRIC_DB, sql, execution, sqlQueries, dimensionId, ratioMeta, timeSeriesTransform, cumulativeResetPeriod }) {
  const queries = withSourceDependencies((sqlQueries?.length ? sqlQueries : (sql ? [{ metricId, db, sql, execution }] : []))
    .filter((query) => query?.sql)
    .map((query, index) => ({
      id: query.id || `${query.metricId || metricId}_${index + 1}`,
      metricId: query.metricId || metricId,
      db: query.db || db,
      sql: query.sql,
      ...(query.execution || execution ? { execution: query.execution || execution } : {}),
    })))

  return {
    version: 2,
    queries,
    merge: { dimensionKey: dimensionId || null },
    derivations: ratioMeta ? [ratioMeta] : [],
    transform: timeSeriesTransform && timeSeriesTransform !== 'none'
      ? { type: timeSeriesTransform, ...(cumulativeResetPeriod ? { resetPeriod: cumulativeResetPeriod } : {}) }
      : null,
  }
}

function buildMultiKpiSummaryWidget(resultsByMetric) {
  const primaryResult = resultsByMetric.find(({ metric }) => (
    metric.format !== 'percentage' && metric.metric_type !== 'target_metric'
  )) || resultsByMetric[0]
  const orderedResults = [primaryResult, ...resultsByMetric.filter((result) => result !== primaryResult)]
  const querySpec = {
    kpiItems: orderedResults.map(({ metric }) => ({
      key: metric.id,
      title: metric.name_ko,
      percentageFormat: metric.format === 'percentage',
    })),
  }
  const row = Object.fromEntries(orderedResults.map(({ metric, rows }) => [metric.id, rows[0]?.[metric.id]]))
  const built = buildWidgetPropsFromRows('kpi', [row], querySpec, primaryResult.metric.name_ko)
  const queries = []
  const derivations = []

  for (const { metric, sql, execution, sqlQueries, ratioMeta } of resultsByMetric) {
    if (sql) queries.push({ metricId: metric.id, db: FABRIC_DB, sql, ...(execution ? { execution } : {}) })
    if (sqlQueries?.length) queries.push(...sqlQueries)
    if (ratioMeta) derivations.push(ratioMeta)
  }

  const queryKeys = new Set()
  const replayQueries = withSourceDependencies(queries.filter((query) => {
    if (!query?.sql) return false
    const key = `${query.metricId || ''}:${query.sql}`
    if (queryKeys.has(key)) return false
    queryKeys.add(key)
    return true
  }).map((query, index) => ({
    id: query.id || `${query.metricId || 'metric'}_${index + 1}`,
    metricId: query.metricId,
    db: query.db || FABRIC_DB,
    sql: query.sql,
    ...(query.execution ? { execution: query.execution } : {}),
  })))
  const derivationKeys = new Set()
  const replayDerivations = derivations.filter((derivation) => {
    const key = derivation?.outputKey
    if (!key || derivationKeys.has(key)) return false
    derivationKeys.add(key)
    return true
  })
  const canReplay = resultsByMetric.every(({ sql, sqlQueries, ratioMeta }) => Boolean(sql) || Boolean(sqlQueries?.length && ratioMeta))

  return {
    canReplay: canReplay && replayQueries.length > 0,
    sql: replayQueries.map((query) => `-- ${query.metricId}\n${query.sql}`).join('\n\n'),
    widget: {
      id: randomUUID(),
      db: FABRIC_DB,
      table: orderedResults.map(({ metric }) => metric.base_table || metric.id).join('+'),
      sql: null,
      sqlQueries: replayQueries,
      queryBundle: {
        version: 2,
        queries: replayQueries,
        merge: { dimensionKey: null },
        derivations: replayDerivations,
        transform: null,
      },
      chartCode: 'kpi',
      title: primaryResult.metric.name_ko,
      topic: orderedResults.map(({ metric }) => metric.id).join('+'),
      ragPatternId: null,
      createdAt: new Date().toISOString(),
      type: built.type,
      querySpec,
      sizeHint: SIZE_TO_SPAN.md,
      props: built.props,
    },
  }
}

// widgetSchema.js의 kpi 케이스는 metric.format을 모르는(범용) 코드라 숫자를 그냥
// toLocaleString()만 한다 — format:'percentage' 지표(현재는 전부 ratio-like, sql=null이라
// 대시보드에 못 쌓이고 채팅에만 보이는 것들)는 formatMetricValue()로 다시 덮어써야
// "1.006"이 아니라 "100.6%"로 보인다. sql이 있는 경로(향후 percentage-format 직접
// 지표가 생길 가능성 대비)에도 똑같이 적용해 둔다.
function applyPercentageFormat(built, chartCode, rows, metric) {
  if (chartCode !== 'kpi' || metric.format !== 'percentage') return built
  return { ...built, props: { ...built.props, value: formatMetricValue(rows[0]?.[metric.id], metric) } }
}

// dashboardIr의 컴포넌트 하나를 "영구 저장 가능한" Widget으로 만든다 — dashboardPipeline.js가
// 만드는 widget과 정확히 같은 필드 집합(id/db/table/sql/chartCode/title/topic/querySpec/
// sizeHint/type/props)이어야 dashboardPagesHandler.js의 저장/재로드(rehydrate)가 그대로 통한다.
// sql은 반드시 materialize까지 끝난(파라미터 없는) 완성 SQL이어야 한다 — 나중에 이 SQL을
// 그대로 재실행해서 값을 다시 채우기 때문(props 자체는 저장하지 않음, widgetSchema.js 주석 참고).
//
// sqlQueries가 있으면(ratio/conversion/progress_metric — 분자·분모 SQL 2개) sql 대신 그걸
// 저장한다 — dashboardPagesHandler.js의 rehydrateWidget이 각각 재실행 후 mergeMetricRows +
// ratioMeta(querySpec에 실어 보냄)로 다시 나눠 값을 재현한다. metric.format==='percentage'인
// kpi 카드는 rehydrate 시에도 "23.6%"로 다시 포맷해야 하므로 querySpec.percentageFormat을
// 함께 남긴다(rehydrateWidget은 semantic registry를 몰라도 되게 하기 위한 자기완결 플래그).
function buildAgenticBiWidget(component, rows, metric, dimensionIds, sql, { execution, sqlQueries, ratioMeta, secondaryKeys, timeSeriesTransform, cumulativeResetPeriod, objectFilterFields } = {}) {
  const chartCode = chartCodeForComponentType(component.type)
  if (!chartCode) return null
  const dimensions = Array.isArray(dimensionIds) ? dimensionIds.filter(Boolean) : [dimensionIds].filter(Boolean)
  const primaryDimension = dimensions[0] || null
  const querySpec = {
    ...buildQuerySpecForComponent(chartCode, metric, primaryDimension, component.title, { secondaryKeys }),
    // The selected-object edit flow must retain the query's semantic dimensions.
    // A renderer's x/label key is not enough for table, KPI, and legacy chart shapes.
    ...(dimensions.length ? { dimensionKeys: dimensions } : {}),
    ...(ratioMeta ? { ratioMeta } : {}),
    ...(metric.format === 'percentage' ? { percentageFormat: true } : {}),
    // rehydrateWidget이 재조회한 raw rows에 저장 시점과 같은 "전월/전일 대비"/"누적" 변환을
    // 다시 태울 수 있도록 flag만 남긴다 — semantic registry 없이도 self-contained.
    ...(timeSeriesTransform && timeSeriesTransform !== 'none' ? { timeSeriesTransform } : {}),
    ...(cumulativeResetPeriod ? { cumulativeResetPeriod } : {}),
  }
  const built = applyPercentageFormat(buildWidgetPropsFromRows(chartCode, rows, querySpec, component.title), chartCode, rows, metric)
  return {
    id: randomUUID(),
    db: FABRIC_DB,
    table: metric.base_table || metric.id,
    sql: sqlQueries ? null : sql,
    ...(sqlQueries ? { sqlQueries } : {}),
    queryBundle: buildQueryBundle({
      metricId: metric.id,
      sql,
      execution,
      sqlQueries,
      dimensionId: dimensions.length ? dimensions : null,
      ratioMeta,
      timeSeriesTransform,
      cumulativeResetPeriod,
    }),
    chartCode,
    title: component.title,
    topic: metric.id,
    ragPatternId: null,
    createdAt: new Date().toISOString(),
    type: built.type,
    querySpec,
    ...(objectFilterFields?.length ? { objectSpec: { dataFilters: { fields: objectFilterFields } } } : {}),
    sizeHint: chartCode === 'kpi' ? SIZE_TO_SPAN.sm : SIZE_TO_SPAN.md,
    props: built.props,
  }
}

// rows.length===0 상황을 재질문(reask)으로 바꾼다 — 왜 0건인지 이유를 지어내지 않고,
// 실제로 실행에 쓰인 필터/기간(등록된 metric/dimension 값이라 지어낼 위험 없음)을 LLM에게
// 그대로 알려준 뒤 "다음엔 뭘 물어볼지" 안내 문구 + 클릭 한 번으로 재전송 가능한 대안
// 질문 2개만 생성하게 한다. LLM 호출이 실패해도(네트워크 등) 결정론적 문구로 폴백해
// 사용자가 최소한 재질문 UI 자체는 항상 받도록 한다.
async function sendZeroRowsReask({ message, metric, ir, registry, sendEvent, client, deployment }) {
  const dimLabel = ir.dimensions[0] ? registry.dimensions.get(ir.dimensions[0])?.label_ko : null
  const filterSummary = (ir.filters || [])
    .map((f) => `${registry.dimensions.get(f.dimension)?.label_ko || f.dimension}=${f.values.join('/')}`)
    .join(', ') || '(없음)'
  const timeSummary = ir.time_range.type === 'absolute'
    ? `${ir.time_range.start_date} ~ ${ir.time_range.end_date}`
    : ir.time_range.type

  const fallback = {
    text: `"${metric.name_ko}" 조회 결과가 0건입니다 — 조건에 맞는 데이터가 없거나 필터가 너무 좁을 수 있습니다.`,
    options: [`${metric.name_ko} 필터 없이 전체로 보여줘`, `${metric.name_ko} 이번 달로 다시 보여줘`],
  }

  try {
    const [call] = await streamAssistantTurn(client, {
      model: deployment,
      messages: [
        {
          role: 'system',
          content: `사용자 질문("${message}")을 다음 조건으로 조회했지만 결과가 0건이었습니다.\n` +
            `- 지표: ${metric.name_ko}\n- 차원: ${dimLabel || '(없음)'}\n- 필터: ${filterSummary}\n- 기간: ${timeSummary}\n\n` +
            `왜 0건일 가능성이 높은지 한 문장으로 안내하고, 그 필터/기간을 바꿔서 클릭 한 번으로 다시 물어볼 수 있는 ` +
            `대안 질문 2개를 만드세요.`,
        },
      ],
      tools: buildZeroRowsReaskTool(),
      toolChoice: { type: 'function', function: { name: 'suggest_reask_options' } },
      temperature: 0,
    })
    const args = call?.args
    const options = args?.options?.filter((o) => typeof o === 'string' && o.trim())
    if (args?.message && options?.length === 2) {
      sendEvent({ type: 'reask', text: args.message, options })
      return
    }
  } catch (err) {
    sendEvent({ type: 'debug', label: '재질문 생성 실패(기본 문구로 대체)', detail: err.message })
  }
  sendEvent({ type: 'reask', text: fallback.text, options: fallback.options })
}

// 결과 검증(간이, SQL 실행 성공 = 정답으로 취급하지 않음) + Dashboard IR 조립 + 최종 응답까지
// — controlled_analysis 경로와 일반(ratio/direct) 경로가 공유하는 마무리 단계.
//
// 2026-07-27: sql이 있고(단일 SQL로 재현 가능한 metric) dashboardState가 왔으면(대시보드
// 커스텀/배포/저장 기능이 연결된 화면에서 물어본 것이면) dashboardCustomizeHandler.js와
// 같은 patch_ready 제안을 만든다 — "적용" 버튼을 누르기 전까지는 대시보드에 반영되지 않는다
// (dashboardPipeline.js와 동일한 원칙). ratio형 지표(sql=null, 분자·분모를 각각 실행해 JS에서
// 나눈 값이라 SQL 한 줄로 재현 불가)는 아직 지원 범위 밖 — 지금까지처럼 채팅 인라인
// 컴포넌트로만 보여준다. 지표 여러 개를 비교/겹쳐 보는 질문(N metric_ids)은 이 함수가 아니라
// renderMultiKpiAndRespond/renderMultiSeriesAndRespond가 처리한다(단일 지표 경로는 그대로 둔 채
// 별도 함수로 분리 — 기존 동작에 영향 없이 다중 지표 지원을 얹기 위함).
async function renderAndRespond({ message, metric: rawMetric, ir, rows, sql, execution, sqlQueries, ratioMeta, dashboardState, registry, sendEvent, extraNote, targetWidgetId, client, deployment }) {
  // 사용자가 "진척률"이라 물었는데 등록 이름이 "진행률"이면 그 말로 답한다. 뜻이 같은
  // 세 말(진척률·진행률·달성률) 안에서만 바꾸므로 다른 지표로 바뀌지 않는다.
  // 값이 맞아도 물어본 말과 다른 말로 답하면 사용자는 다른 지표를 받았다고 읽는다.
  const echoed = echoUserRatioWord(rawMetric.name_ko, message)
  const metric = echoed === rawMetric.name_ko ? rawMetric : { ...rawMetric, name_ko: echoed }

  // 0행이면 위젯을 만들지 않고 바로 재질문한다 — 어떤 필터/기간이 원인일 가능성이
  // 높은지는 이미 실행된 ir(등록된 metric/dimension/filter라 값을 지어낼 위험 없음)을
  // 근거로 LLM이 판단하게 하고, 클릭 한 번으로 재전송 가능한 대안 질문 2개를 함께 만든다.
  if (rows.length === 0) {
    await sendZeroRowsReask({ message, metric, ir, registry, sendEvent, client, deployment })
    return
  }

  // "전월/전일 대비 증감률" 변환이 적용됐으면 metric 자체의 정의(base_table/sql/topic 등)는
  // 그대로 두되, 화면 표시(퍼센트 포맷/축 눈금)만은 metric.format을 percentage로 취급해야
  // "0.083"이 아니라 "8.3%"로 보인다 — 원본 metric은 저장/재조회(topic/table/id) 용도로
  // 계속 그대로 써야 하므로 표시 전용 별도 객체(displayMetric)로 분리한다.
  const isMomChangeDisplay = ir.time_series_transform === 'mom_change_pct'
  const displayMetric = isMomChangeDisplay ? { ...metric, format: 'percentage' } : metric

  const caveats = []
  if (metric.format === 'percentage' && !isMomChangeDisplay) {
    const outOfRange = rows.filter((r) => typeof r[metric.id] === 'number' && (r[metric.id] < 0 || r[metric.id] > 5)).length
    if (outOfRange > 0) caveats.push(`${outOfRange}개 행이 0~500% 범위를 벗어났습니다 — 분모/분자 정의를 다시 확인해 주세요.`)
  }

  sendEvent({ type: 'stage', stage: 'render', label: STAGE_LABELS.render })
  const dashboardIr = planDashboard({
    dashboardId: `agentic_bi_${Date.now()}`,
    title: message,
    compiledQueries: [{ metricId: metric.id }],
    executionResults: [{ metricId: metric.id, rows }],
    preferredChartType: ir.chart_type,
    isTimeSeries: ir.intent === 'trend_over_time',
    message,
  })
  let chartFallbackNote = null
  let isDonut = false
  for (const component of dashboardIr.components) {
    if (component.type === 'donut_chart') {
      const check = checkDonutEligible(rows, metric.id, metric)
      if (check.ok) {
        isDonut = true
      } else {
        chartFallbackNote = check.reason
        component.type = 'bar_chart'
        sendEvent({ type: 'debug', label: '도넛 대신 막대로 대체', detail: check.reason })
      }
      continue
    }
    // 선차트는 이어지는 시간 축이 있을 때만. "2026년 4월 딜러별 실적을 라인차트로" 같은
    // 요청은 축이 딜러(항목)라 선의 전제가 없다 — 도넛과 같은 방식으로 막대 폴백 + 사유.
    if (component.type === 'line_chart' && !TEMPORAL_DIMENSIONS.has(ir.dimensions[0])) {
      const lineDimLabel = ir.dimensions[0] ? (registry.dimensions.get(ir.dimensions[0])?.label_ko || ir.dimensions[0]) : '항목'
      chartFallbackNote = `선차트는 월별·일별처럼 이어지는 시간 축이 필요한데 "${lineDimLabel}별"은 항목 비교라 막대로 표시했습니다. "월별 추이"로 요청하시면 선차트로 보여드립니다.`
      component.type = 'bar_chart'
      sendEvent({ type: 'debug', label: '선 대신 막대로 대체', detail: chartFallbackNote })
    }
  }
  const rowsForValidation = isDonut ? foldDonutRows(rows, ir.dimensions[0], metric.id) : rows
  const dashboardCheck = validateDashboardIr(dashboardIr, {
    compiledQueryIds: [metric.id],
    executionResults: [{ metricId: metric.id, rows: rowsForValidation }],
    categoryFieldsByMetric: { [metric.id]: ir.dimensions[0] || null },
  })

  const dimLabel = ir.dimensions[0] ? registry.dimensions.get(ir.dimensions[0])?.label_ko : null
  const summaryLine = rows.length === 1 && !dimLabel
    ? `${metric.name_ko}: ${formatMetricValue(rows[0][metric.id], displayMetric)}`
    : `${metric.name_ko}${dimLabel ? ` (${dimLabel}별)` : ''}${isMomChangeDisplay ? ' — 전기 대비 증감률' : ''} — ${rows.length}건 조회됨`
  if (chartFallbackNote) caveats.push(chartFallbackNote)
  const caveatBlock0 = caveats.length ? `\n\n[주의]\n${caveats.map((c) => `- ${c}`).join('\n')}` : ''

  if (!dashboardCheck.ok) {
    sendEvent({ type: 'debug', label: 'Dashboard IR 검증 실패(narrative로 대체)', detail: JSON.stringify(dashboardCheck.errors) })
    sendEvent({ type: 'text', text: `${summaryLine}${caveatBlock0}${extraNote ? `\n\n${extraNote}` : ''}` })
    return
  }

  // ratio형(sql=null)도 sqlQueries(분자·분모 SQL 2개)가 있으면 저장 가능 — buildAgenticBiWidget이
  // sql 대신 sqlQueries+querySpec.ratioMeta를 담아서 rehydrateWidget이 재현할 수 있게 한다.
  const canPropose = (Boolean(sql) || Boolean(sqlQueries)) && Boolean(dashboardState)
  // modify는 위젯 개수를 늘리지 않으므로(기존 위젯을 그대로 교체) 개수 제한 계산에서 제외한다.
  const roomLeft = canPropose ? (targetWidgetId ? 0 : MAX_WIDGETS - dashboardState.widgets.length - dashboardIr.components.length) : 0

  if (canPropose && roomLeft >= 0) {
    const persistedTs = persistedTimeSeriesSpec(metric, ir.dimensions[0], registry, ir.time_series_transform)
    const widgets = dashboardIr.components
      .map((component) => buildAgenticBiWidget(component, rows, displayMetric, ir.dimensions, sql, {
        execution, sqlQueries, ratioMeta,
        secondaryKeys: isMomChangeDisplay ? [metric.id] : undefined,
        ...persistedTs,
        objectFilterFields: ir.object_filter_dimensions,
      }))
      .filter(Boolean)
    const currentWidget = targetWidgetId
      ? dashboardState.widgets.find((widget) => widget.id === targetWidgetId)
      : null
    const previousOrientation = currentWidget?.querySpec?.orientation || currentWidget?.objectSpec?.vizSpec?.binding?.orientation
    if (previousOrientation && !requestedBarOrientation(message)) {
      for (const widget of widgets) {
        if (widget.chartCode !== 'bar') continue
        widget.querySpec = { ...widget.querySpec, orientation: previousOrientation }
        widget.props = { ...widget.props, orientation: previousOrientation }
      }
    }
    if (widgets.length) {
      // modify: 기존 위젯 id를 그대로 유지한 채 내용만 교체(op:'update'). add: 새 위젯(들)을 추가(op:'add').
      const patch = targetWidgetId
        ? { baseVersion: dashboardState.version, ops: [{ op: 'update', widgetId: targetWidgetId, widget: { ...widgets[0], id: targetWidgetId } }] }
        : { baseVersion: dashboardState.version, ops: widgets.map((widget) => ({ op: 'add', widget })) }
      sendEvent({
        type: 'patch_ready',
        patch: objectPatch(patch),
        sql: sqlQueries ? sqlQueries.map((q) => `-- ${q.metricId}\n${q.sql}`).join('\n\n') : sql,
        topic: metric.id,
        review: { approved: true, reason: '등록된 Metric 정의(Ontology/Semantic Layer)로 결정론적으로 컴파일된 SQL입니다 — LLM이 SQL을 직접 작성하지 않았습니다.' },
        summaryText: summaryLine,
        previewWidget: { type: widgets[0].type, props: widgets[0].props },
        blocked: false,
        warning: caveats.length ? caveats.join(' ') : null,
      })
      sendEvent({ type: 'text', text: `${summaryLine}${caveatBlock0}${extraNote ? `\n\n${extraNote}` : ''}` })
      return
    }
  }

  // sql이 없거나(ratio형), dashboardState가 안 왔거나(대시보드 커스텀 화면이 아님), 위젯
  // 개수 제한에 걸렸으면 — 지금까지처럼 채팅 말풍선 안에 바로 렌더링만 한다(대시보드에는 안 쌓임).
  const capNote = canPropose && roomLeft < 0
    ? '\n\n[안내] 위젯 개수 제한(12개)에 도달해 대시보드에는 추가하지 못했습니다 — 답변만 표시합니다.'
    : ''
  for (const component of dashboardIr.components) {
    const chartCode = chartCodeForComponentType(component.type)
    if (!chartCode) continue
    const querySpec = buildQuerySpecForComponent(chartCode, displayMetric, ir.dimensions[0], component.title, {
      secondaryKeys: isMomChangeDisplay ? [metric.id] : undefined,
    })
    const built = applyPercentageFormat(buildWidgetPropsFromRows(chartCode, rows, querySpec, component.title), chartCode, rows, displayMetric)
    sendEvent({ type: 'component', name: built.type, props: built.props })
  }
  sendEvent({ type: 'text', text: `${summaryLine}${caveatBlock0}${extraNote ? `\n\n${extraNote}` : ''}${capNote}` })
}

// 단일 metric IR을 컴파일하고 Fabric에 실행 — 직접 조회 경로와 ratio 분자/분모 경로가
// 공유하는 컴파일+실행 로직을 한 곳에 모아둔다. outputAlias가 실제 컴파일된 metric id와
// 다르면(예: contract_mtd_target -> contract_mtd_target_sc로 전환된 경우) 결과 행의
// 컬럼명을 원래 요청한 id로 되돌려서, 호출부가 어느 variant가 실제로 쓰였는지 신경 쓰지
// 않고 항상 원래 metric id로 값을 읽을 수 있게 한다.
/**
 * 퍼널 지표는 GOLD에서 파생시킨 SQL로 답한다 — 정의가 GOLD 한 곳에만 있어
 * 리포트와 값이 갈릴 수 없다. 실제로 갈렸었다: 계약목표가 독립 SQL에서 560,790,
 * GOLD 합계는 3,161이었다(2026-04, common_tp_nm=N'계약' 필터 누락).
 *
 * 조건이 안 맞으면(여러 달 추이, GOLD에 없는 축 등) null을 돌려 호출부가
 * 기존 컴파일러를 쓰게 한다.
 */
/**
 * 월 축이 붙은 퍼널 지표를 GOLD로 낸다 — 달마다 한 번씩 돌려 이어 붙인다.
 *
 * @returns null이면 이 함수가 다룰 모양이 아니다(호출부가 원래 흐름을 이어간다).
 */
async function runDerivedMonthSeries(ir, sendEvent, { outputAlias } = {}) {
  const dims = ir.dimensions || []
  if (!dims.includes('time_month')) return null
  // 일 단위까지 쪼개는 요청은 GOLD가 그 grain을 갖고 있지 않다.
  if (dims.includes('time_day')) return null

  // 기간은 absolute 뿐 아니라 ytd 도 받는다.
  //
  // 2026-08-06 실측: 브라우저에서 "2026년 렉서스 강남 월별 …실적"을 물었더니 LLM이
  // time_range를 ytd로 줬고, absolute만 받던 이 함수가 null을 돌려 기존 컴파일러로
  // 넘어갔다 — 기회 1,350 대신 1,330, 계약 264 대신 303이 화면에 나왔다.
  // 평가 러너에서는 같은 질문에 absolute가 와서 GOLD 경로를 탔다. 표현이 갈리면
  // 답이 갈리는 상태였다.
  const range = ir.time_range
  const ytd = range?.type === 'ytd'
  const startISO = ytd ? `${todayISO().slice(0, 4)}-01-01` : range?.start_date
  const endISO = ytd ? todayISO() : range?.end_date
  if ((!ytd && range?.type !== 'absolute') || !startISO || !endISO) return null
  const s = new Date(`${startISO}T00:00:00Z`)
  const e = new Date(`${endISO}T00:00:00Z`)
  if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) return null
  if (s.getUTCFullYear() !== e.getUTCFullYear()) return null   // 해를 넘기면 연·월 바인드가 성립 안 한다

  const year = s.getUTCFullYear()
  const months = []
  for (let m = s.getUTCMonth() + 1; m <= e.getUTCMonth() + 1; m += 1) months.push(m)
  if (months.length < 2) return null            // 한 달이면 기존 경로가 그대로 처리한다
  if (months.length > 12) return null

  const rest = dims.filter((d) => d !== 'time_month')
  const built = months.map((m) => ({
    month: m,
    d: buildFromMetricIr({
      ...ir,
      dimensions: rest,
      time_range: {
        type: 'absolute',
        start_date: `${year}-${String(m).padStart(2, '0')}-01`,
        end_date: new Date(Date.UTC(year, m, 0)).toISOString().slice(0, 10),
      },
    }, { currentDate: todayISO() }),
  }))
  if (built.some((x) => !x.d)) return null      // 한 달이라도 못 만들면 통째로 포기한다

  sendEvent({
    type: 'debug',
    label: `Compiled SQL (${ir.metrics[0]}, GOLD 파생 · 월별 ${months.length}개월)`,
    detail: `퍼널 GOLD의 CTE로 ${year}년 ${months[0]}~${months[months.length - 1]}월을 달마다 계산합니다 — `
      + `funnel_metric=${built[0].d.funnelMetricId}, grain=[${rest.join(', ') || '전사'}]\n`
      + `바인드(첫 달): ${bindSummary(built[0].d.bind)}\n\n${built[0].d.sql}`,
  })
  sendEvent({ type: 'stage', stage: 'execute', label: STAGE_LABELS.execute })

  const months_ = built.map(({ month, d }) => ({
    time_month: `${year}-${String(month).padStart(2, '0')}`,
    params: d.bind,
  }))
  const rows = await runFunnelMonthSeries(built[0].d.sql, months_, {
    sourceKey: ir.metrics[0],
    outputAlias,
  })

  return {
    rows,
    sql: built[0].d.sql,
    // 달마다 바인드만 다르고 SQL 본문은 같다(확인함) — 저장된 위젯 재조회는
    // months 목록을 그대로 다시 돌려 전체 기간을 복원한다. params 하나만 남기면
    // 새로고침 때 조용히 한 달짜리 차트가 된다.
    compiled: { sql: built[0].d.sql, params: built[0].d.bind },
    execution: {
      mode: 'certified',
      source: 'funnel-derived-monthly',
      params: built[0].d.bind,
      months: months_,
      sourceKey: ir.metrics[0],
      ...(outputAlias && outputAlias !== ir.metrics[0] ? { outputAlias } : {}),
    },
  }
}

async function runDerivedIfPossible(ir, sendEvent, { outputAlias, accessContext } = {}) {
  // 계약·출고 목표는 2-1/2-3 인증 리포트에서 꺼낸다(GOLD 퍼널에는 없는 지표다).
  const fromReport = await runTargetMetric(ir, { currentDate: todayISO(), accessContext })
  if (fromReport) {
    sendEvent({
      type: 'debug',
      label: `Compiled SQL (${ir.metrics[0]}, 인증 리포트 파생)`,
      detail: `인증 리포트 ${fromReport.reportId}를 실행해 '${fromReport.month}' 값을 꺼냈습니다 — `
        + 'SQL을 새로 짜지 않았습니다. 목표 컬럼은 상위 grain 반복값이라 계약의 grain으로 '
        + '중복 제거 후 집계했습니다.',
    })
    let rows = fromReport.rows
    if (outputAlias && outputAlias !== ir.metrics[0]) {
      rows = rows.map((r) => {
        const { [ir.metrics[0]]: value, ...rest } = r
        return { ...rest, [outputAlias]: value }
      })
    }
    // 2026-08-03 leo: 기존에는 인증 리포트 결과의 재실행 정보가 저장되지 않아 새로고침 시 placeholder SQL이 실행됐다. 지표별 원본 IR을 저장해 등록된 리포트 executor가 같은 결과를 다시 조회하게 한다.
    return {
      rows,
      sql: `-- Registered report replay: ${fromReport.reportId}`,
      compiled: { sql: null, params: {} },
      execution: {
        mode: 'certified',
        source: 'target-report',
        reportId: fromReport.reportId,
        input: {
          metrics: [ir.metrics[0]],
          dimensions: [...(ir.dimensions || [])],
          filters: [...(ir.filters || [])],
          time_range: ir.time_range,
        },
        ...(outputAlias && outputAlias !== ir.metrics[0] ? { outputAlias } : {}),
      },
    }
  }

  // 월별 추이도 GOLD에서 낸다. GOLD의 파라미터는 연·월 스칼라라 한 번에 한 달만
  // 계산된다 — 인증 리포트 경로가 하듯 달마다 돌려 이어 붙인다.
  //
  // 이게 없을 때 무슨 일이 났나: 월 축이 붙으면 GOLD 파생이 null을 돌려주고 기존
  // 컴파일러로 넘어가는데, 그쪽은 자격 조건이 GOLD와 미세하게 달라 값이 갈렸다.
  // 2026-08-05 실측(2026-04 렉서스 강남): 기회 GOLD 1,350 vs 컴파일러 1,330,
  // 계약 GOLD 264 vs 컴파일러 302. 단건으로 물으면 맞고 "월별로" 물으면 틀렸다.
  const monthly = await runDerivedMonthSeries(ir, sendEvent, { outputAlias })
  if (monthly) return monthly

  const derived = buildFromMetricIr(ir, { currentDate: todayISO() })
  if (!derived) return null

  sendEvent({
    type: 'debug',
    label: `Compiled SQL (${ir.metrics[0]}, GOLD 파생)`,
    detail: `퍼널 GOLD(funnel_full_structure)의 CTE에서 생성 — funnel_metric=${derived.funnelMetricId}, `
      + `grain=[${derived.grain.join(', ') || '전사'}]\n바인드: ${bindSummary(derived.bind)}\n\n${derived.sql}`,
  })
  sendEvent({ type: 'stage', stage: 'execute', label: STAGE_LABELS.execute })

  let rows = await queryFabricCertified(FABRIC_DB, derived.sql, derived.bind, { timeoutMs: 60000 })
  if (outputAlias && outputAlias !== ir.metrics[0]) {
    rows = rows.map((r) => {
      const { [ir.metrics[0]]: value, ...rest } = r
      return { ...rest, [outputAlias]: value }
    })
  }
  return {
    rows,
    sql: derived.sql,
    compiled: { sql: derived.sql, params: derived.bind },
    execution: { mode: 'certified', source: 'funnel-derived', params: derived.bind },
  }
}

async function compileAndRun(ir, registry, sendEvent, { outputAlias, accessContext } = {}) {
  const derived = await runDerivedIfPossible(ir, sendEvent, { outputAlias, accessContext })
  if (derived) return derived

  // GOLD에 정의가 있는 지표인데 이 모양으로는 조립할 수 없어 시맨틱 정의로 넘어간다.
  // 두 정의가 늘 갈리는 건 아니다 — 활동유형 축은 2026-08-05 실측에서 유형별 합이
  // 퍼널 GOLD 총계(7,242)와 정확히 일치했다. 하지만 월 축은 갈렸다(기회 1,330 vs 1,350).
  // 그래서 막지 않고 **드러낸다.** 막으면 지금 맞는 답까지 사라진다.
  const goldDefined = Boolean(METRIC_MAP[ir.metrics[0]])
  if (goldDefined) {
    sendEvent({
      type: 'debug',
      label: `정의 출처 (${ir.metrics[0]}, 시맨틱)`,
      detail: `이 지표는 GOLD에도 정의가 있지만 이번 요청 모양으로는 GOLD 조립이 성립하지 않아 `
        + `시맨틱 정의로 계산합니다 — ${derivedUnavailableReason(ir)}. `
        + 'GOLD 화면 값과 다를 수 있습니다.',
    })
  }

  const compiled = compileSingleMetricQuery(ir, { currentDate: todayISO() })
  // 바인드 값을 함께 남긴다. 이 경로는 기간·필터를 전부 @p0/@p1로 빼기 때문에, SQL만
  // 봐서는 실제로 어느 구간을 조회했는지 알 수 없다 — "2026년"이 ytd로 해석돼도
  // 문장 어디에도 2026이 없다. 조건이 조용히 빠졌는지 사람도 점검기도 못 본다.
  const bind = Object.entries(compiled.params || {})
  sendEvent({
    type: 'debug',
    label: `Compiled SQL (${ir.metrics[0]})`,
    detail: bind.length ? `${compiled.sql}\n\n-- 바인드: ${bind.map(([k, v]) => `${k}=${v}`).join(', ')}` : compiled.sql,
  })
  sendEvent({ type: 'stage', stage: 'execute', label: STAGE_LABELS.execute })
  const materialized = withOutputAlias(materializeSql(compiled.sql, compiled.params), ir.metrics[0], outputAlias)
  const rows = await queryFabricWithTimeout(FABRIC_DB, materialized, 30000)
  return { rows, sql: materialized, compiled, execution: { mode: 'read_only' } }
}

// 대시보드 위젯 목록을 프롬프트용 텍스트로 렌더링 — dashboardTools.js의
// buildDashboardSystemPrompt와 같은 목적(LLM이 "이거/방금 그 그래프"가 어느 위젯을
// 가리키는지 id로 특정할 수 있게).
function renderWidgetListForPrompt(dashboardState) {
  const widgets = dashboardState?.widgets || []
  if (!widgets.length) return '(현재 위젯 없음 — 빈 대시보드)'
  return widgets
    .map((w) => `- id=${w.id} | title="${w.title || w.props?.title || ''}" | metric=${w.topic || '?'}`)
    .join('\n')
}

export async function runAgenticBiQuery({ message, dashboardState, history, modelId = null }, { sendEvent, accessContext = resolveDataAccessContext() }) {
  // "4월 목표 알려줘"처럼 무엇의 목표/실적인지 빠진 질문은 되묻는다. LLM에 맡기면
  // 실행마다 다른 것을 골라 같은 질문에 다른 답이 나간다(2026-08-03 하네스에서 확인).
  const ambiguous = detectAmbiguousSubject(message)
  if (ambiguous) {
    sendEvent({ type: 'reask', text: ambiguous.question, options: ambiguous.options })
    return
  }

  const deterministicFunnel = detectCertifiedFunnelRequest(message)
  if (deterministicFunnel) {
    await handleCertifiedReportBundle({ argsList: deterministicFunnel.argsList, dashboardState, sendEvent })
    return
  }

  const made = createLlmClient(modelId)
  if (!made) {
    sendEvent({ type: 'error', message: missingConfigMessage(modelId) })
    return
  }
  const { client, model: deployment } = made
  const registry = loadRegistry()
  const restyleCatalog = renderRestyleCatalogForPrompt(dashboardState)
  const regroupCatalog = renderRegroupCatalogForPrompt(dashboardState)
  const reportCatalog = renderReportCatalogForPrompt()
  // 2026-08-03 leo: 기존에는 시승 실적·목표·진행률과 퍼널 전체실적 변형의 지표 선택 근거가 부족해 서로 다른 모집단을 섞을 수 있었다. 인증 CTE에 등록한 메트릭의 의미와 선택 기준을 분류 프롬프트에 제공한다.
  const funnelMetricGuidance = `[시승·퍼널 지표 선택]\n` +
    `시승 실적은 testdrive_mtd_actual을 사용한다. 시승 실적·목표·진행률을 함께 요청하면 testdrive_mtd_actual, testdrive_mtd_target, testdrive_progress_rate_mtd를 함께 선택한다.\n` +
    `전체실적의 actual_cnt 기준은 testdrive_mtd_total_actual, lead_key 기준은 testdrive_mtd_total_lead_actual, 신청폼 또는 시승취소 제외 기준은 testdrive_mtd_actual_form_basis를 사용한다.\n` +
    `시승에서 계약은 활동실적 기준 contract_mtd_testdrive_actual, 전체실적 기준 contract_mtd_testdrive_total_actual을 사용한다. 활동유형 필터에 '시승'을 넣어 일반 계약 지표를 만들지 않는다.\n\n`

  // 1. LLM: 질문 -> SemanticQueryIR 후보 (등록된 metric/dimension enum만 고를 수 있음)
  sendEvent({ type: 'stage', stage: 'select', label: STAGE_LABELS.select })
  const [call] = await streamAssistantTurn(client, {
    model: deployment,
    messages: [
      {
        role: 'system',
        content: funnelMetricGuidance + `사용자 질문을 등록된 Metric/Dimension으로 변환하세요. 오늘 날짜: ${todayISO()}.\n\n` +
          `[딜러명 표기 규칙] "딜러"는 브랜드+지점이 합쳐진 하나의 매장명이다(예: "렉서스 강남", "토요타 용산"). ` +
          `"렉서스 강남"처럼 브랜드명이 포함된 딜러명이 언급되면 dealer 필터에 "렉서스 강남" 전체를 그대로 넣고, ` +
          `brand 필터를 별도로 만들지 마라(중복 필터링이 되어 결과가 사라진다) — brand 필터는 사용자가 특정 매장 없이 ` +
          `"렉서스 전체", "토요타 전체"처럼 브랜드 단위로만 물었을 때만 쓴다.\n\n` +
          `전시장도 같은 규칙이다 — 전시장명에도 브랜드가 붙어 있다("토요타 동대문", "렉서스 강서"). ` +
          `"토요타 동대문 전시장"이라고 하면 group_name에 "토요타 동대문" 전체를 넣어라. ` +
          `"동대문"처럼 브랜드를 떼면 그 이름이 데이터에 없어 결과가 0건이 된다(실제로 그랬다).

` +
          `[영업기회 vs 영업활동 구분 — 실제 오답 사례로 확인된 혼동 지점] "영업기회"(리드/lead)와 "영업활동"(SC가 ` +
          `수행하는 접점 활동/activity)은 서로 다른 대상이다. 질문에 "영업기회"/"기회"/"리드"가 핵심 명사로 ` +
          `등장하면, 뒤에 "당월활동실적"처럼 "활동"이라는 단어가 붙어 있어도 이는 activity_mtd_actual이 아니라 ` +
          `lead_mtd_actual류(자격 있는 활동을 가진 리드의 수)를 의미한다 — "영업기회의 당월활동실적"은 ` +
          `"영업기회 중 이번 달에 자격 활동이 있었던 건수"라는 뜻이지 "SC의 영업활동 건수 자체"가 아니다. ` +
          `반대로 질문의 핵심 명사가 "영업활동"/"활동"(리드 언급 없이)이면 activity_mtd_actual류를 쓴다. ` +
          `이름이 비슷해 보인다고 대충 고르지 말고, 질문의 핵심 대상(무엇의 실적을 세는지)을 기준으로 판단하라.\n\n` +
          `[계약건수: 퍼널 전환 기준 vs 전체실적] "계약건수"/"계약 실적"만 단독으로 물으면 ` +
          `contract_mtd_activity_actual(관계형성/기회창출 자격 활동이 있고 당월 등록·유효 상태인 리드에서 ` +
          `발생한, 취소되지 않은 계약 — 퍼널 전환 기준)을 기본으로 써라 — 이것이 표준/기본 정의다. ` +
          `"전체실적", "퍼널 조건 없이", "활동/영업기회 경유 여부와 무관하게"처럼 활동/리드 조건을 명시적으로 ` +
          `배제했을 때만 contract_mtd_actual(전체실적)을 써라. 사용자가 명시하지 않았는데 전체실적 쪽을 ` +
          `임의로 고르지 마라.\n\n` +
          `[시승 관련 지표 — activity_type 필터로 흉내내지 말 것] "시승 실적"/"시승 건수"처럼 시승을 물으면 ` +
          `activity_mtd_actual(관계형성/기회창출 활동 단순 합산 — 시승과 무관)이 아니라 testdrive_mtd_actual을 써라. ` +
          `"시승에서 계약으로 전환된 건수/전환율"처럼 시승→계약을 물으면 contract_mtd_testdrive_actual(건수) 또는 ` +
          `testdrive_to_contract_conversion_rate(비율)을 써라 — 이때 activity_type 필터에 "시승"을 넣어 ` +
          `contract_mtd_activity_actual/activity_to_lead_conversion_rate에 붙이면 안 된다(계약 fact에는 활동유형 ` +
          `컬럼이 아예 없어 실행이 실패하고, 애초에 "활동유형이 시승인 계약"과 "시승 신청 리드에서 나온 계약"은 ` +
          `다른 정의다). "시승" 자체는 activity_type dimension의 필터 값이 아니라 별도 metric으로 표현된다.\n\n` +
          `[여러 지표를 한 번에 물었을 때 달성률/진척률/전환율 빠뜨리지 말 것] "타겟, 활동, 달성률"처럼 ` +
          `사용자가 실적/목표뿐 아니라 "달성률"/"진척률"/"전환율"/"~율"도 함께 나열했다면, metric_ids에 그 실적/목표 ` +
          `metric뿐 아니라 대응하는 progress_metric/conversion_metric(예: activity_progress_rate_mtd)도 반드시 ` +
          `같이 넣어라 — rate 지표가 등록돼 있는지 확신이 안 서서 실적/목표만 담고 조용히 빠뜨리는 실수를 하지 마라. ` +
          `대응하는 rate metric이 Metric 목록에 없다면 그때는 answerable=false 대신, 있는 지표만이라도 ` +
          `metric_ids에 담아 응답하되 rate는 낼 수 없다는 점은 개의치 마라(억지로 answerable=false로 만들지 말 것).\n\n` +
          `[일별/누적/증감률/주차] "일별로"처럼 하루 단위 breakdown을 원하면 dimension_id에 time_day를 써라(월 ` +
          `단위는 time_month). "누적"/"누적 합계"/"러닝토탈"을 원하면 time_series_transform=cumulative를, ` +
          `"전월 대비 증감률"/"전일 대비"/"MoM"처럼 직전 구간 대비 변화율을 원하면 time_series_transform=` +
          `mom_change_pct를 써라 — 이 둘은 dimension_id가 time_month/time_day일 때만 의미가 있다(시간순 정렬이 ` +
          `가능해야 "직전 구간"이 성립하므로). "N주차"(예: "2026년 4월 2주차")를 물으면 time_range_type=` +
          `week_of_month + week_year/week_month/week_label을 채워라 — 임의로 날짜를 계산하지 말 것(달력에서 ` +
          `실제 주차 경계를 조회해 확정한다).\n\n` +
          `[답하기 전에 최대한 시도할 것] answerable=false는 정말 등록된 지표로 표현할 수 없을 때만 써라 — ` +
          `단어가 낯설다는 이유로 성급하게 포기하지 말고 위 Metric/Dimension 목록에서 가장 가까운 것을 먼저 찾아라. ` +
          `그래도 정말 불가능하거나 질문이 여러 갈래로 해석될 만큼 모호하면 answerable=false로 하고, ` +
          `clarification_options에 사용자가 버튼 하나로 그대로 다시 보낼 수 있는 구체적인 대안 질문 2개를 반드시 채워라 ` +
          `(예: 모호한 "전환율" -> ["영업활동에서 영업기회로의 전환율 알려줘", "시승에서 계약으로의 전환율 알려줘"]).\n\n` +
          (restyleCatalog
            ? `\n\n[위젯 겉모습 변경 가능 범위]\n${restyleCatalog}\n` +
              `차트 종류나 색만 바꾸는 요청("이거 꺾은선으로", "막대 색 빨갛게")은 pick_semantic_query가 아니라 ` +
              `restyle_widget 툴을 써라. 지표·기간·필터를 바꾸는 요청이면 pick_semantic_query를 써라.`
            : '')
          + (regroupCatalog
            ? `

[표 단위 변경 가능 범위]
${regroupCatalog}
` +
              `이미 만든 인증 리포트 표에서 컬럼을 빼거나 묶는 요청("여기서 활동유형 컬럼은 지워줘", ` +
              `"전시장은 빼줘", "딜러 단위로만")이면 regroup_report_widget 툴을 써라. ` +
              `차원 컬럼은 그 툴로만 뺄 수 있다 — 새로 조회하면 확정 리포트가 다른 것으로 바뀐다.`
            : '') +
          `\n\n[비율 지표 용어]\n` +
          `- 진척률 = 목표를 기준으로 얼마나 나아갔는지(성과 중심). 실적 ÷ 목표.\n` +
          `- 전환율 = 앞 단계에서 다음 단계로 얼마나 넘어왔는지. 그 단계 ÷ 앞 단계.\n` +
          `- 주의: 등록된 리포트에서 "진행률"이라 이름 붙은 컬럼은 전부 실적 ÷ 목표라 ` +
          `뜻으로는 진척률이다(GOLD의 이름이 일관되지 않다). 아래 목록의 ` +
          `"목표 대비(진척)" / "전단계 대비(전환)" 줄로 어느 쪽인지 판단해라.\n` +
          `- 사용자가 "진척률"이라 물으면 목표 대비 컬럼을, "전환율"이라 물으면 전단계 대비 ` +
          `컬럼을 골라라. 이름이 비슷하다고 다른 종류를 집으면 안 된다 — ` +
          `목표 대비와 전단계 대비는 분모가 달라 서로 비교할 수 없는 값이다.\n` +
          `\n[인증 리포트 목록]\n${reportCatalog}\n` +
          `여러 지표를 한 화면에 모은 완성된 표, 합계 행, 딜러·전시장·팀 계층이 필요한 질문이면 ` +
          `pick_semantic_query가 아니라 run_certified_report를 써라. 특히 객체 필터를 5개 이상 요청하거나 조직·차량 필터와 목표/달성률을 함께 요청한 표는 반드시 인증 리포트를 고르고 object_filter_dimension_ids에 요청 필터를 전부 넣어라. 일반 시맨틱 SQL은 최대 4개 분해 차원까지만 안전하다. 단, 막대/선/콤보/차트/그래프/추이처럼 시각화를 요청하면 지표가 여러 개여도 반드시 pick_semantic_query를 써라.\n` +
          `순서가 중요하다: 값 하나·추이·자유 차트를 묻는 질문은 **[Metric 목록]을 먼저 본다.** ` +
          `거기서 답할 수 있으면 pick_semantic_query를 써라 — 리포트에도 비슷한 이름의 컬럼이 있다는 ` +
          `이유로 리포트로 보내지 마라. 리포트는 수천~수만 행짜리 표라 숫자 하나를 묻는 질문에는 과하다.\n` +
          `[Metric 목록]을 다 훑어도 없을 때만(예: 근속년수, NPS, 고객수, 활동배수처럼 지표로 등록되지 ` +
          `않은 것) 리포트의 "지표 컬럼"을 보고 run_certified_report를 써라. 그 경우 answerable=false로 ` +
          `답하지 마라 — 사용자는 BI 화면에 보이는 값을 못 받게 된다.\n` +
          `**나누는 축(~별로)도 같다.** 지표는 [Metric 목록]에 있는데 나눌 축이 [Dimension 목록]에 ` +
          `없고 어느 리포트의 "차원 컬럼"에는 있으면(예: 자사금융여부, 지불유형, 월별주차, 평가기준, ` +
          `그룹분류) run_certified_report를 써라. 없는 축을 비슷한 다른 축(브랜드 등)으로 바꿔 답하지 마라 — ` +
          `사용자가 물어본 것과 다른 표가 나간다.\n\n` +
          `[Metric 목록]\n${renderMetricCatalogForPrompt()}\n\n[Dimension 목록]\n${renderDimensionCatalogForPrompt()}\n\n` +
          `[현재 대시보드 상태]\n${renderWidgetListForPrompt(dashboardState)}\n\n` +
          `[동작 결정] 기본은 action="add"(새 위젯 추가)다. 사용자가 "이거", "방금 그거", "그 그래프/카드"처럼 ` +
          `위 목록에 있는 특정 기존 위젯 하나를 명시적으로 가리키며 다른 지표/기간/필터로 바꿔달라고 요청했을 ` +
          `때만 action="modify"로 하고 widget_id에 그 위젯의 id를 넣어라. 그냥 "~보여줘", "~추가해줘", ` +
          `"~도 알려줘"처럼 새 위젯을 원하는 말은 비슷한 위젯이 이미 있어도 항상 action="add"다.`,
      },
      ...sanitizeHistoryForClassification(history || []),
      { role: 'user', content: message },
    ],
    tools: [
      ...buildAgenticBiTool(dashboardState),
      ...(restyleCatalog ? [buildRestyleWidgetTool(dashboardState)] : []),
      ...(regroupCatalog ? [buildRegroupReportWidgetTool(dashboardState)] : []),
      buildRunCertifiedReportTool(),
    ],
    toolChoice: 'required',
    temperature: 0,
  })

  if (call?.name === 'restyle_widget') {
    handleRestyleWidget({ args: call.args, dashboardState, sendEvent })
    return
  }
  if (call?.name === 'regroup_report_widget') {
    await handleRegroupReportWidget({ args: call.args, dashboardState, sendEvent })
    return
  }
  if (call?.name === 'run_certified_report') {
    await handleCertifiedReport({ args: call.args, dashboardState, sendEvent, message, client, deployment })
    return
  }

  const args = call?.args
  if (!args || args.answerable === false || !args.metric_ids?.length) {
    // "이건 인증 리포트로 답해야 합니다"라고 **말하면서** 그 툴은 부르지 않는 경우가 있다.
    // 2026-08-05 전수 실행에서 2건이 그랬다(29·46) — 둘 다 답을 알면서 되묻기만 했다.
    // 리포트 이름을 스스로 댔다면 그 툴만 주고 한 번 더 묻는다.
    // 리포트 이름을 스스로 댔거나(제목은 "계약 목록 (계약 단위 명세)"처럼 괄호가 붙어
    // 있어 앞부분만 비교한다) 질문에 그 리포트에만 있는 컬럼이 적혀 있으면 재시도한다.
    const said = String(args?.reason_if_unanswerable || '')
    const shortTitle = (t) => String(t).split(' (')[0].trim()
    const named = listReports().find((r) => said.includes(r.report_id) || said.includes(shortTitle(r.contract.title)))
      || distinctiveColumnsInText(message)[0]
    if (named) {
      const handled = await retryWithCertifiedReport({
        message, sendEvent, dashboardState, client, deployment, reportCatalog,
        why: `지표로는 답할 수 없다면서 ${named.report_id}를 지목했습니다 — 그 리포트로 다시 묻습니다.`,
      })
      if (handled) return
    }

    const reason = args?.reason_if_unanswerable || '이 질문에 답할 수 있는 등록된 지표를 찾지 못했습니다.'
    const options = args?.clarification_options?.filter((o) => typeof o === 'string' && o.trim())
    // 클릭 한 번으로 재전송 가능한 대안 질문 2개가 있으면 reask(재질문 UI)로, LLM이
    // 이를 못 만들었으면(스키마상 필수가 아니라 방어) 기존처럼 단순 거부 메시지로 폴백한다.
    if (options?.length === 2) {
      sendEvent({ type: 'reask', text: reason, options })
    } else {
      sendEvent({ type: 'rejected', reason })
    }
    return
  }

  // 질문에 적힌 컬럼이 한 리포트에만 있는데 시맨틱 경로로 왔다면 경로를 잘못 고른 것이다.
  // 인증 리포트 경로에는 같은 가드가 있는데 여기엔 없어서, "일별 활동 실적, 일일 잔여 타겟"이
  // daily_activity_progress 대신 activity_mtd_actual로 가 전혀 다른 값을 냈다
  // (2026-08-05 정답 대조: 정답은 활동유형별 자사출고 196/143, 우리는 231/452).
  {
    const named = distinctiveColumnsInText(message)
    if (named.length) {
      // 고른 지표 이름과 글자가 겹치면 같은 개념일 수 있으니 손대지 않는다.
      const chosen = (args.metric_ids || [])
        .map((id) => registry.metrics.get(id)?.name_ko || '')
        .join(' ').replace(/\s+/g, '').toLowerCase()
      const grams = (s) => { const g = []; for (let i = 0; i + 2 <= s.length; i += 1) g.push(s.slice(i, i + 2)); return g }
      const unrelated = named.filter((x) => !grams(x.column.replace(/\s+/g, '').toLowerCase()).some((g) => chosen.includes(g)))
      if (unrelated.length) {
        const t = unrelated[0]
        const handled = await retryWithCertifiedReport({
          message, sendEvent, dashboardState, client, deployment, reportCatalog,
          why: `"${unrelated.map((x) => x.column).join(', ')}"은(는) ${t.title}의 컬럼입니다 — 그 리포트로 다시 묻습니다.`,
        })
        if (handled) return
      }
    }
  }

  // 비율을 물었는데 고른 지표가 전부 절대치면, 이 경로로는 물어본 것을 낼 수 없다.
  // 등록된 비율 컬럼이 딱 하나 있으면 그 리포트로 간다 — 어느 경로로 갈지가
  // 실행마다 갈리면 안 되고, 그 판단은 LLM이 아니라 등록된 것이 정해야 한다.
  {
    const chosenHasRatio = (args.metric_ids || [])
      .some((id) => registry.metrics.get(id)?.semantic_signature?.measure?.kind === 'ratio')
    if (!chosenHasRatio) {
      const target = ratioColumnForRateRequest(message)
      if (target) {
        const handled = await retryWithCertifiedReport({
          message, sendEvent, dashboardState, client, deployment, reportCatalog,
          why: `"${target.column}"은(는) ${target.title}의 컬럼입니다 — 비율을 내는 지표가 없어 그 리포트로 다시 묻습니다.`,
        })
        if (handled) return
      }
    }
  }

  let resolvedArgs = args
  if (args.time_range_type === 'week_of_month') {
    let weekResolution
    try {
      weekResolution = await resolveWeekOfMonthArgs(args, sendEvent)
    } catch (err) {
      if (err instanceof QueryTimeoutError) {
        sendEvent({ type: 'error', message: err.message })
        return
      }
      throw err
    }
    if (weekResolution.error) {
      sendEvent({
        type: 'reask',
        text: weekResolution.error,
        options: [
          `${args.week_year ?? ''}년 ${args.week_month ?? ''}월 전체로 다시 조회해줘`,
          `${args.week_year ?? ''}년 ${args.week_month ?? ''}월 1주차로 다시 조회해줘`,
        ],
      })
      return
    }
    resolvedArgs = weekResolution.args
  }

  // 2026-08-04 leo: 기존에는 "계약 진행률"이 유사한 계약 달성률로 선택돼 취소 포함 계약 건수를 분자로 사용했다. YAML의 용어 보정과 KPI 묶음 확장을 검증·SQL 컴파일 전에 적용한다.
  // 2026-08-04 leo: 이후 권한 테이블을 붙여도 raw SQL에 조건을 덧붙이지 않도록, 같은 지점에서
  // access context의 mandatory filter를 검증 전 Semantic Query IR에 구조적으로 합친다.
  let ir = applyMandatoryAccessFilters(selectedWidgetShapeForRateChange(
    message,
    appendMentionedProjectionDimensions(
      message,
      applyRequestedChartType(
        message,
        applyTimeIntent(
          message,
          normalizeTemporalFilters(
            applyKpiBundleIntent(
              message,
              applyMetricSelectionOverrides(message, buildIrFromToolArgs(resolvedArgs), registry),
              registry
            )
          )
        )
      ),
      registry
    ),
    dashboardState
  ), accessContext)
  sendEvent({ type: 'debug', label: 'Semantic Query IR', detail: JSON.stringify(ir, null, 2) })

  const structural = validateSemanticQueryIR(ir)
  if (!structural.ok) {
    // 시맨틱에 없는 축을 물었는데 인증 리포트에는 그 컬럼이 있는 경우가 있다.
    // 2026-08-06 실측(평가 No.25): "자사금융여부에 따른 출고 현황"에서 LLM이
    // 차원 id로 한글 '자사금융여부'를 보내 "dimension id 형식 오류"로 끝났다.
    // 그 컬럼은 delivery_by_payment 리포트에 실재한다 — 오류로 끝내지 말고 그쪽으로
    // 다시 묻는다. 답할 수 있는데 형식 때문에 못 답하는 건 사용자에겐 결함이다.
    const owned = distinctiveColumnsInText(message)
    if (owned.length) {
      const handled = await retryWithCertifiedReport({
        message, sendEvent, dashboardState, client, deployment,
        reportCatalog: renderReportCatalogForPrompt(
          (r) => owned.some((x) => x.report_id === r.report_id),
        ),
        why: `"${owned.map((x) => x.column).join(', ')}"은(는) 시맨틱 지표의 축이 아니라 `
          + `${owned[0].title}의 컬럼입니다 — 그 리포트로 다시 묻습니다.`,
      })
      if (handled) return
    }
    sendEvent({ type: 'error', message: `질문 구조화 결과가 유효하지 않습니다: ${structural.errors.map((e) => e.message).join('; ')}` })
    return
  }
  // Target metrics have a deliberate BI-compatible scope switch: a query
  // grouped or filtered by SC/department/showroom uses the SC target fact.
  // Validate that effective metric, otherwise a valid SC-level request is
  // rejected against the narrower dealer-level target metadata before the
  // compiler gets a chance to make the same switch.
  // 값을 지목했으면 breakdown이 아니라 filter다.
  //
  // "자사출고에 대한 시승 당월 목표"에서 LLM이 activity_type을 breakdown 축으로 넣어
  // "그 지표는 activity_type으로 분해할 수 없다"며 답이 실패했다(평가 No.22).
  // 질문에 그 차원의 **실제 값**이 그대로 나와 있으면 쪼개 달라는 뜻이 아니라
  // 그 값으로 한정해 달라는 뜻이다 — 근거가 질문에 있으니 서버가 옮긴다.
  ir = moveValueDimensionsToFilters(ir, message, sendEvent)
  ir = addSiblingMetricsNamedInQuestion(ir, message, sendEvent)
  ir = ensureTemporalDimension(ir, message, sendEvent)
  ir = widenTimeRangeForTrend(ir, message, sendEvent)
  ir = addRateMetricWhenAsked(ir, message, sendEvent)
  ir = preferMonthlyMetrics(ir, message, sendEvent)
  // 마지막 관문. 위 규칙들은 알려진 형태를 하나씩 되돌리는 방식이라 새 형태는 못 막는다.
  // 여기서는 질문의 요구(Semantic Requirement)와 지표의 의미(Semantic Signature)를 직접
  // 맞춰 보고, 어긋나면 등록된 지표로 바꾼다 — 대체가 없으면 지어내지 않고 위반만 남긴다.
  ir = enforceSemanticFidelity(ir, message, sendEvent)
  // 필터 값을 DB의 정본 이름으로 맞춘다. 인증 리포트 경로에는 이 보정이 있었는데
  // 지표 경로에는 없었다 — 그래서 띄어쓰기 하나로 답이 사라졌다.
  {
    const fixed = await canonicalizeIrFilterValues(ir, sendEvent)
    if (!fixed) return          // 후보가 여럿이면 되묻고 끝낸다
    ir = fixed
  }

  const validationIr = {
    ...ir,
    metrics: ir.metrics.map((metricId) => resolveEffectiveMetricId(metricId, ir)),
  }
  const semantic = validateSemanticQuery(validationIr)
  if (!semantic.ok) {
    sendEvent({ type: 'error', message: `검증 실패: ${semantic.errors.map((e) => e.message).join('; ')}` })
    return
  }

  // action="modify"면 targetWidgetId를 끝까지 끌고 가서 add 대신 op:'update' 패치를 만든다 —
  // 위젯 id는 반드시 지금 대시보드에 실제로 존재해야 한다(dashboardValidation.js의
  // validateProposal과 같은 방어: 새로고침/동시편집으로 클라이언트가 들고 있는 dashboardState가
  // 서버 기준과 어긋난 경우를 막는다). 차원 없이 지표 여러 개를 비교하는 질문(N개의 독립된
  // KPI 카드로 쪼개짐, 아래 renderMultiKpiAndRespond)은 "위젯 하나"로 특정할 수 없어 modify를
  // 지원하지 않는다 — tools.js의 action 설명에도 명시.
  let targetWidgetId = selectedWidgetEditTarget(message, dashboardState)
  if (args.action === 'modify') {
    const requestedWidgetId = args.widget_id && args.widget_id !== 'none' ? args.widget_id : targetWidgetId
    if (!requestedWidgetId) {
      sendEvent({ type: 'error', message: '수정할 위젯을 특정하지 못했습니다. 어떤 위젯을 바꿀지 다시 말씀해주세요.' })
      return
    }
    if (!dashboardState?.widgets?.some((w) => w.id === requestedWidgetId)) {
      sendEvent({ type: 'error', message: '대시보드에 존재하지 않는 위젯입니다. 새로고침 후 다시 시도해주세요.' })
      return
    }
    targetWidgetId = requestedWidgetId
  }

  // 지표가 여러 개("A랑 B 비교해줘", "실적이랑 잔여타겟 같이")면 각 metric을 독립적으로
  // resolveMetricRows로 풀어낸 뒤(각자는 단일 질문과 완전히 같은 경로로 컴파일됨) 여기서
  // 병합/시각화만 한다. 차원이 있으면(예: 활동유형별) 하나의 다계열 위젯으로, 없으면
  // (총계끼리 비교) 지표 개수만큼의 독립된 KPI 카드로 나눈다.
  if (ir.metrics.length > 1) {
    const metrics = ir.metrics.map((id) => registry.metrics.get(id))
    // resolveMetricRows/compileSingleMetricQuery는 ir.metrics를 정확히 1개로 가정한다 —
    // 비교용 ir은 metrics가 N개라 각 metric마다 자기 하나로 좁혀서 넘겨야 한다.
    // 순차 실행(Promise.all 아님) — 기존 2-metric 비교 경로도 순차였고, sendEvent로 나가는
    // stage(compile/execute) 이벤트가 metric별로 뒤섞이지 않아야 클라이언트 진행 표시가
    // 어느 metric 처리 중인지 헷갈리지 않는다. Fabric 커넥션 풀 부하를 늘리지 않는 효과도 있음.
    let resultsByMetric = []
    try {
      for (const metric of metrics) {
        const metricIr = { ...applyTrailingWindowIfNeededWithNotice(ir, metric, sendEvent), metrics: [metric.id] }
        // ratio형 metric(예: 달성률)은 sql=null이지만 자기 분자·분모 쿼리(sqlQueries)와
        // 나눗셈 방법(ratioMeta)을 같이 돌려준다 — renderMultiSeriesAndRespond가 이걸
        // 펼쳐서 저장해야 비율 지표가 섞인 조합도 대시보드에 저장(적용) 가능해진다.
        const { rows, sql, execution, sqlQueries, ratioMeta } = await resolveMetricRows(metricIr, metric, registry, sendEvent, { accessContext })
        resultsByMetric.push({ metric, rows, sql, execution, sqlQueries, ratioMeta })
      }
    } catch (err) {
      if (err instanceof CompileError) {
        sendEvent({ type: 'error', message: `비교 지표를 컴파일할 수 없습니다 (${err.code}): ${err.message}` })
        return
      }
      if (err instanceof QueryTimeoutError) {
        sendEvent({ type: 'error', message: err.message })
        return
      }
      throw err
    }

    const dimensionIds = ir.dimensions || []
    if (dimensionIds.length) {
      await renderMultiSeriesAndRespond({
        message, resultsByMetric, dimensionIds, objectFilterFields: ir.object_filter_dimensions, dashboardState, registry, sendEvent, targetWidgetId, client, deployment,
        timeSeriesTransform: ir.time_series_transform,
        requestedChartType: ir.chart_type,
      })
    } else {
      renderMultiKpiAndRespond({ resultsByMetric, dashboardState, sendEvent, targetWidgetId })
    }
    return
  }

  const metric = registry.metrics.get(ir.metrics[0])
  const effectiveIr = applyTrailingWindowIfNeededWithNotice(ir, metric, sendEvent)

  let rows, sql, execution, sqlQueries, ratioMeta
  try {
    ;({ rows, sql, execution, sqlQueries, ratioMeta } = await resolveMetricRows(effectiveIr, metric, registry, sendEvent, { accessContext }))
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

  // "전월/전일 대비 증감률"/"누적" — dimension_id가 시간 차원일 때만 의미가 있다(정렬
  // 가능한 시간순이 있어야 "직전 구간"이 존재하므로). 시간 차원이 아닌데 LLM이 실수로
  // 채웠으면 dimId가 있어도 applyTimeSeriesTransform이 그대로 정렬만 하고 넘어가는 게
  // 아니라 의미 없는 결과가 나올 수 있어, time_month/time_day일 때만 적용한다.
  if (effectiveIr.time_series_transform && TIME_SERIES_DIMENSIONS.has(effectiveIr.dimensions[0])) {
    const autoResetPeriod = periodResetForAutoCumulative(metric, effectiveIr.dimensions[0], registry)
    if (!(effectiveIr.time_series_transform === 'cumulative' && autoResetPeriod)) {
      rows = applyTimeSeriesTransform(rows, { dimId: effectiveIr.dimensions[0], metricIds: [metric.id], transform: effectiveIr.time_series_transform })
    }
  }

  // controlled_analysis metric마다 알려진 근사/한계가 다르다 — 하나의 문구를 모든
  // controlled_analysis metric에 공용으로 쓰면(예: 출고 평균용 문구를 lead_mtd_actual에도
  // 붙이면) 무관하거나 틀린 안내가 나간다. metric.id로 구분한다.
  const CONTROLLED_ANALYSIS_NOTES = {
    delivery_monthly_avg_6m: '[근사값] 판매 공백월은 평균에서 제외됩니다 — 실제 BI(0건도 포함해 6개월 평균)와 약간 다를 수 있습니다.',
  }

  await renderAndRespond({
    message, metric, ir: effectiveIr, rows, sql, execution, sqlQueries, ratioMeta, dashboardState, registry, sendEvent,
    extraNote: metric.controlled_analysis ? CONTROLLED_ANALYSIS_NOTES[metric.id] : undefined,
    targetWidgetId, client, deployment,
  })
}

async function prepareCertifiedReportWidget({
  args, sendEvent, emitStage = true, message = '',
  dashboardState = null, client = null, deployment = null, allowReselect = false,
}) {
  let resolved = resolveReportRequest(args || {}, message)

  // 어떤 리포트가 선택됐는지는 되묻고 끝나는 경우에도 남겨야 한다 — 안 그러면
  // "재질문만 뜨고 끝났다"는 신고를 받았을 때 라우팅이 맞았는지조차 알 수 없다.
  sendEvent({
    type: 'debug',
    label: '인증 리포트 선택',
    detail: `report_id=${args?.report_id}\nsc_display=${args?.sc_display}`,
  })

  // 리포트가 맞는지부터 본다. 잘못 골랐으면 "SC별로 볼까요, 팀 단위로 볼까요?"를
  // 되물어봐야 소용이 없다 — 어차피 그 리포트에 원하는 컬럼이 없다.
  // 2026-08-05 실측: "PMA IN과 OUT 건수"가 delivery_by_model로 가서 SC 단위를 되물었다.
  {
    const own = new Set(Object.keys(getReport(args.report_id).contract.column_semantics || {}))
    const missed = distinctiveColumnsInText(message, args.report_id).filter((x) => !own.has(x.column))
    if (missed.length) {
      const target = missed[0]
      // 되묻기 전에 서버가 다시 고른다 — 그 컬럼을 가진 리포트만 보여 준다.
      // 어느 리포트인지 이미 알고 있으면서 사용자에게 고르라고 할 이유가 없다.
      const wanted = missed.map((x) => x.column)

      // 그 컬럼을 가진 리포트가 하나뿐이면 LLM에게 다시 묻지 않고 코드가 바꾼다.
      // 다시 고르게 하면 매번 같은 답이 나오지 않는다 — 2026-08-10 실측(평가 No.49):
      // 3회 중 1회가 delivery_by_model로 갔다가 재선택을 거쳤고, 그 경로만 결과에
      // 합계 행이 하나 더 붙어 같은 질문에 2행/3행이 갈렸다. 답이 하나로 정해지는
      // 자리에서는 LLM을 다시 태울 이유가 없다.
      const only = reportsHavingColumns(wanted)
      if (only.length === 1 && only[0].report_id !== args.report_id) {
        sendEvent({
          type: 'debug',
          label: '리포트 자동 교체',
          detail: `"${wanted.join(', ')}"은(는) ${getReport(args.report_id).contract.title}에 없고 `
            + `${only[0].title}에만 있습니다 — 되묻지 않고 바꿉니다.`,
        })
        // 표시 컬럼은 **바꾸기 전 리포트 기준**으로 골라진 것이라 들고 가면 안 된다.
        // 2026-08-11 실측(평가 No.49): delivery_by_model의 'sales_ytd'가 그대로 넘어와
        // sc_delivery_status에서 엉뚱한 열이 나왔다. 비우면 계약의 column_aliases가
        // 질문의 말로 다시 고른다.
        const swapped = { ...args, report_id: only[0].report_id }
        const target = getReport(only[0].report_id).contract
        const valid = new Set(Object.keys(target.column_semantics || {}))
        swapped.selected_columns = (args.selected_columns || []).filter((c) => valid.has(c))

        return prepareCertifiedReportWidget({
          args: swapped,
          sendEvent, emitStage, message, dashboardState, client, deployment,
          allowReselect: false,   // 한 번만 바꾼다 — 서로 떠넘기며 도는 걸 막는다
        })
      }
      const handled = allowReselect && client && await retryWithCertifiedReport({
        message,
        sendEvent,
        dashboardState,
        client,
        deployment,
        reportCatalog: renderReportCatalogForPrompt(
          (r) => reportsHavingColumns(wanted).some((x) => x.report_id === r.report_id),
        ),
        why: `"${wanted.join(', ')}"은(는) ${getReport(args.report_id).contract.title}에 없습니다 — `
          + `그 컬럼이 있는 리포트 중에서 다시 고릅니다.`,
      })
      if (handled) return null

      sendEvent({
        type: 'reask',
        text: `"${missed.map((x) => x.column).join(', ')}"은(는) ${getReport(args.report_id).contract.title}에 없습니다. `
          + `${target.title}에 있습니다 — 그쪽으로 조회할까요?`,
        options: [
          `${target.title}에서 ${missed.map((x) => x.column).join(', ')} 보여줘`,
          `${getReport(args.report_id).contract.title} 그대로 보여줘`,
        ],
      })
      return null
    }
  }

  // 월을 물었는데 그 리포트가 월을 표현할 수 없으면, 조건이 오류 없이 사라진다.
  //
  // 2026-08-05 실측: "2026년 4월 ... 출고 이력"이 delivery_list_detail로 갔는데
  // 이 리포트에는 MonthNumber 파라미터도 월 컬럼도 없다. 4월을 물었는데 1~7월 102행이
  // 나왔고 사용자는 그게 4월인 줄 알았다.
  //
  // 월이 파라미터로 있거나(필터로 걸림) 출력 컬럼으로 있으면(행에서 거름) 문제없다 —
  // 월별 판매 성취도처럼 월이 행으로 나오는 리포트를 여기서 막으면 안 된다.
  {
    const monthAsked = MONTH_IN_TEXT.test(String(message || ''))
    const contract = getReport(args.report_id).contract
    const hasMonthParam = contract.parameters.some((p) => MONTH_PARAM_NAMES.has(p.name))
    const dims = [
      ...(contract.dimension_columns?.branch_a || []),
      ...(contract.dimension_columns?.branch_b || []),
    ]
    const hasMonthColumn = dims.some((d) => /월|month/i.test(d))
    if (monthAsked && !hasMonthParam && !hasMonthColumn) {
      // 되묻기보다 서버가 다시 고르게 한다 — 월을 받을 수 있는 리포트만 보여 주고
      // 한 번 더 묻는다. 같은 영역(source_dependency_set) 안에 대개 대체제가 있다
      // (출고 목록 → 출고 이력).
      const handled = allowReselect && client && await retryWithCertifiedReport({
        message,
        sendEvent,
        dashboardState,
        client,
        deployment,
        reportCatalog: renderReportCatalogForPrompt(
          (r) => r.contract.parameters.some((p) => MONTH_PARAM_NAMES.has(p.name)),
        ),
        why: `${contract.title}은(는) 월을 지정할 수 없습니다 — 물어보신 달 대신 그 해 전체가 나갑니다. `
          + '월을 받을 수 있는 리포트 중에서 다시 고릅니다.',
      })
      if (handled) return null

      sendEvent({
        type: 'reask',
        text: `${contract.title}은(는) 월을 지정할 수 없습니다 — 연 단위로만 조회됩니다. `
          + '그대로 조회하면 물어보신 달이 아니라 그 해 전체가 나옵니다.',
        options: [
          ...reportsWithMonth(args.report_id).slice(0, 2).map((c) => `${c.title}에서 보여줘`),
          `${contract.title}로 연 단위 전체를 보여줘`,
        ],
      })
      return null
    }
  }

  if (resolved.needsClarification) {
    sendEvent({ type: 'reask', text: resolved.question, options: resolved.options })
    return null
  }

  // 사용자가 말한 이름을 데이터에 실제로 있는 값으로 맞춘다("동대문" → "토요타 동대문").
  // 후보가 여럿이면("강남") 임의로 고르지 않고 되묻는다 — 하나를 고르면 다른 매장 숫자가 나간다.
  //
  // 이 리포트가 실제로 받는 파라미터만 대상으로 한다. 리포트마다 이름이 달라
  // (DealerNm / dealer_nm) 계약에 있는 쪽을 찾아 쓴다.
  const reportParamNames = new Set(
    getReport(resolved.reportId).contract.parameters.map((p) => p.name),
  )
  const paramForDimension = (dim) => Object.entries(REPORT_PARAM_TO_DIMENSION)
    .find(([name, d]) => d === dim && reportParamNames.has(name))?.[0] || null

  // 파라미터의 허용값이 질문에 나오면 조건으로 채운다.
  //
  // "sc중 재직자별 영업활동 실적"에서 LLM이 '재직여부'를 표시 컬럼으로 요청했는데,
  // 이 리포트 출력에는 그런 열이 없어 통째로 거절됐다(2026-08-06 평가 No.11).
  // 재직자는 쪼갤 축이 아니라 걸러낼 조건이다 — 파라미터로 넣고 컬럼 요청은 뺀다.
  // 22번의 "자사출고에 대한"과 같은 계열이다: 값을 말했으면 조건이다.
  {
    const raw = String(message || '')
    const asked = raw.replace(/\s+/g, '')
    // 'A'·'B'·'C' 같은 영문 짧은 값은 낱말로 떨어져 있을 때만 인정한다.
    //
    // 2026-08-06 실측(평가 No.49·50): "PMA IN과 PMA OUT 건수"의 PM'A'를 SC 등급 A로
    // 읽어 grp_name=A 필터를 걸었고, 오류 없이 0행이 나갔다. BI에는 값이 멀쩡히 있다.
    // 반면 '재직'은 "재직자별"처럼 조사가 붙어 나오므로 부분 문자열이어야 잡힌다 —
    // 한글 값은 그대로 두고 ASCII 값에만 경계를 요구한다.
    for (const p of getReport(resolved.reportId).contract.parameters) {
      if (!Array.isArray(p.allowed_values) || resolved.params[p.name] != null) continue
      const hit = p.allowed_values.filter((v) => valueMentionedIn(raw, v))
      if (hit.length !== 1) continue          // 둘 다 나오면 무엇을 원하는지 알 수 없다
      resolved.params[p.name] = hit
      sendEvent({
        type: 'debug',
        label: '조건 보정',
        detail: `질문의 "${hit[0]}"을(를) ${p.name} 조건으로 넣었습니다 — 표시 축이 아니라 필터입니다.`,
      })
    }
  }

  // 코드/숫자 도메인을 사용자 말투에서 되돌린다. 이름 보정보다 먼저 해야 브랜드로
  // 동명이지점을 좁히는 아래 단계가 'LEXUS'를 받는다.
  const valueFixes = []
  for (const [param, normalize] of Object.entries(PARAM_VALUE_NORMALIZERS)) {
    const raw = resolved.params[param]
    if (!Array.isArray(raw) || !raw.length) continue
    const fixed = raw.map(normalize)
    fixed.forEach((v, i) => { if (v !== raw[i]) valueFixes.push(`${param}: "${raw[i]}" → "${v}"`) })
    resolved.params[param] = fixed
  }
  if (valueFixes.length) {
    sendEvent({ type: 'debug', label: '값 보정', detail: valueFixes.join(', ') })
  }

  // 리포트마다 파라미터 이름이 Brand / brand 로 갈린다. 동명이지점("부산")을 브랜드로
  // 좁히는 데만 쓰므로 있으면 쓰고 없으면 그냥 되묻는다.
  const brandParam = Object.keys(resolved.params).find((k) => k.toLowerCase() === 'brand')
  const brands = brandParam && Array.isArray(resolved.params[brandParam])
    ? resolved.params[brandParam]
    : null

  const relocations = []
  for (const [param, dimension] of Object.entries(REPORT_PARAM_TO_DIMENSION)) {
    const raw = resolved.params[param]
    if (!Array.isArray(raw) || !raw.length) continue
    const fixed = await canonicalizeValues(dimension, raw, { brands })
    if (!fixed) continue
    if (!fixed.ok) {
      sendEvent({ type: 'reask', text: fixed.question, options: fixed.options })
      return null
    }
    if (Object.keys(fixed.changed).length) {
      sendEvent({
        type: 'debug',
        label: '이름 보정',
        detail: Object.entries(fixed.changed).map(([a, b]) => `${param}: "${a}" → "${b}"`).join(', '),
      })
    }

    // 값이 이 차원의 것이 아니면 제 자리로 옮긴다. 딜러 16개가 전시장 62개의 부분집합이라
    // (2026-08-04 실측) "렉서스 강북"처럼 전시장에만 있는 이름이 딜러로 들어오면
    // 오류 없이 0행이 나갔다 — 사용자는 빈 표를 정상 결과로 받는다.
    let values = fixed.values
    for (const move of fixed.relocated || []) {
      const target = paramForDimension(move.to)
      if (!target) { values = [...values, move.input]; continue }   // 옮길 데가 없으면 원래대로
      const prev = resolved.params[target]
      resolved.params[target] = [...new Set([...(Array.isArray(prev) ? prev : []), move.value])]
      relocations.push(`"${move.input}" → ${move.label}(${target})`)
    }
    // 값이 전부 옮겨갔으면 이 필터는 비운다. 빈 배열을 남기면 "아무것도 해당 없음"이 된다.
    resolved.params[param] = values.length ? values : null
  }
  if (relocations.length) {
    sendEvent({
      type: 'debug',
      label: '차원 보정',
      detail: `${relocations.join(', ')} — 지정된 차원에 없는 이름이라 실제 있는 차원으로 옮겼습니다.`,
    })
  }


  if (emitStage) sendEvent({ type: 'stage', stage: 'execute', label: STAGE_LABELS.execute })
  sendEvent({
    type: 'debug',
    label: '인증 리포트 실행',
    // group_by와 selected_columns도 남긴다. 값이 아니라 **집계 단위**가 갈리면
    // 같은 파라미터로도 행 수가 달라진다 — 2026-08-10 실측(평가 31·33·42·44):
    // 같은 질문이 1행과 25행 사이를 오갔는데 파라미터는 동일해서 원인을 볼 수 없었다.
    detail: `report_id=${resolved.reportId}\nreport_view=${resolved.reportView || '(기본)'}`
      + `\ngroup_by=${JSON.stringify(resolved.groupBy)}`
      + `\nsc_display=${resolved.scDisplay}`
      + (resolved.selectedColumns?.length ? `\nselected_columns=${JSON.stringify(resolved.selectedColumns)}` : '')
      + `\n파라미터: ${JSON.stringify(resolved.params, null, 2)}`,
  })

  let result
  try {
    result = await executeReportWithView(resolved.reportId, resolved.params, { reportView: resolved.reportView })
  } catch (err) {
    if (err.isTimeout) {
      sendEvent({ type: 'reask', text: err.message, options: ['기간을 한 달로 좁혀서 다시 보여줘', '특정 딜러만 골라서 보여줘'] })
      return null
    }
    sendEvent({ type: 'rejected', reason: `리포트를 실행하지 못했습니다: ${err.message}` })
    return null
  }

  if (!result.rows.length) {
    sendEvent({
      type: 'reask',
      text: '해당 조건에 데이터가 없습니다. 기간이나 조건을 바꿔서 다시 조회해 보시겠어요?',
      options: ['지난달로 다시 조회해줘', '조건 없이 전체로 보여줘'],
    })
    return null
  }

  // 질문에 YYYY-MM-DD가 있는데 LLM이 날짜 필터를 안 넣었으면 서버가 채운다.
  // 프롬프트로 시키면 2회 중 1회만 넣는다(2026-08-05 실측) — 날짜는 놓치면 전체가
  // 나가므로 확정적으로 처리한다. 이 리포트가 실제로 가진 날짜 차원에만 건다.
  {
    const said = [...String(message || '').matchAll(/\d{4}-\d{2}-\d{2}/g)].map((m) => m[0])
    const already = new Set((resolved.dimensionFilters || []).map((f) => f.column))
    const dateDims = (result.dimensionColumns || []).filter((c) => /일자$|^계약일$|^출고일$/.test(c))
    // 날짜 차원이 여럿이면(계약일자·출고일자) 질문이 어느 쪽을 말했는지로 고른다.
    // "계약일이" → 계약일자. 판단이 안 되면 건드리지 않는다 — 잘못 걸면 조용히 틀린다.
    const asked = String(message || '').replace(/\s+/g, '')
    const pick = dateDims.length === 1 ? dateDims[0]
      : dateDims.filter((c) => asked.includes(c.replace(/자$/, ''))).length === 1
        ? dateDims.find((c) => asked.includes(c.replace(/자$/, '')))
        : null
    if (said.length === 1 && pick && !already.has(pick)) {
      resolved.dimensionFilters = [...(resolved.dimensionFilters || []), { column: pick, values: said }]
      sendEvent({
        type: 'debug',
        label: '날짜 필터 보정',
        detail: `질문의 ${said[0]}을(를) ${pick} 조건으로 넣었습니다 — LLM이 빠뜨렸습니다.`,
      })
    }
  }

  // 연누적 리포트에 "그 달만" 뜻이 분명하면 서버가 행 필터를 건다.
  //
  // 이 리포트들의 GOLD는 출고일자를 year_start ~ month_end 로 잡아 연누적만 낸다.
  // 카탈로그에 방법을 적어 둬도 LLM이 매번 넣지는 않는다(2026-08-05 실측: 2회 중 1회).
  // 놓치면 4월을 물었는데 1~4월이 나가고, 사용자는 그게 4월인 줄 안다.
  //
  // 기본은 연누적이다 — BI 화면이 그렇다. "연누적"이라고 말하면 절대 걸지 않는다.
  {
    const ps = getReport(resolved.reportId).contract.period_semantics
    const text = String(message || '').replace(/\s+/g, '')
    const saysYtd = /연누적|누적기준|ytd/i.test(text)
    // "4월에 출고된", "당월", "월누적", "그 달만", "해당 월만"
    const saysMtd = /월누적|당월|그달만|해당월만|(\d{1,2}월에\s*(출고|계약|나간))/.test(text)
      || /(\d{1,2}월)에출고/.test(text)
    const already = new Set((resolved.dimensionFilters || []).map((f) => f.column))
    const monthValue = String(message || '').match(/(\d{4})\s*년?\s*[-.]?\s*(\d{1,2})\s*월/)
    if (ps?.month_filter_column && saysMtd && !saysYtd && monthValue
        && !already.has(ps.month_filter_column)
        && (result.dimensionColumns || []).includes(ps.month_filter_column)) {
      const ym = `${monthValue[1]}-${String(monthValue[2]).padStart(2, '0')}`
      resolved.dimensionFilters = [...(resolved.dimensionFilters || []),
        { column: ps.month_filter_column, values: [ym] }]
      sendEvent({
        type: 'debug',
        label: '월 필터 보정',
        detail: `이 리포트는 연누적입니다. 질문이 그 달만을 뜻해 ${ps.month_filter_column}=${ym} 로 행을 걸렀습니다.`,
      })
    }
  }

  // 파라미터가 없는 축(월별주차 등)은 돌아온 행에서 거른다. 조건을 조용히 버리면
  // 사용자는 전체 결과를 "걸러진 결과"로 믿는다 — 못 거를 때는 그 사실을 알린다.
  // 질문에 그 축의 값이 **여럿** 나오면 걸러 달라는 게 아니라 나란히 보자는 뜻이다.
  //
  // 2026-08-10 실측(평가 No.33): "기회창출인 전월, 소개인 전월 값 보여줘"에 LLM이
  // 구분='기회창출' 필터를 걸어 4행이 1행으로 접혔다. 6회 중 5회가 그랬고 나머지 1회는
  // 안 걸어 4행이 나와, 같은 질문에 답이 갈렸다. 시맨틱 경로에는 같은 규칙이 이미 있다
  // (moveValueDimensionsToFilters의 "값이 둘 이상이면 범례") — 인증 리포트 경로에도 건다.
  if (resolved.dimensionFilters?.length) {
    const kept = resolved.dimensionFilters.filter((f) => {
      const mentioned = (result.rows || [])
        .map((r) => r[f.column])
        .filter((v) => v !== null && v !== undefined)
      const distinct = [...new Set(mentioned.map(String))].filter((v) => valueMentionedIn(message, v))
      return distinct.length < 2
    })
    if (kept.length !== resolved.dimensionFilters.length) {
      const dropped = resolved.dimensionFilters.filter((f) => !kept.includes(f))
      sendEvent({
        type: 'debug',
        label: '차원 값 필터 해제',
        detail: `${dropped.map((f) => f.column).join(', ')} — 질문에 이 축의 값이 둘 이상 나옵니다. `
          + '하나로 거르면 나머지가 사라지므로 전부 남깁니다.',
      })
      resolved = { ...resolved, dimensionFilters: kept }
    }
  }

  if (resolved.dimensionFilters?.length) {
    const { contract } = getReport(resolved.reportId)
    if (contract.total_row?.detect_by) {
      // 상세만 걸러내면 합계가 전체 기준으로 남아 표 안에서 숫자가 어긋난다.
      sendEvent({
        type: 'rejected',
        reason: `${contract.title}은(는) 합계 행이 있는 리포트라 `
          + `${resolved.dimensionFilters.map((f) => f.column).join('·')} 값으로 행만 걸러낼 수 없습니다`
          + ' — 합계가 전체 기준으로 남아 표 안에서 숫자가 어긋납니다.'
          + ' 조건을 파라미터로 받을 수 있는 형태로 바꾸거나, 전체를 보고 직접 찾아주세요.',
      })
      return null
    }
    const f = filterRowsByDimension(result, resolved.dimensionFilters)
    if (f.unknownColumns.length) {
      sendEvent({
        type: 'rejected',
        reason: `이 리포트에 없는 차원입니다: ${f.unknownColumns.join(', ')}`
          + ` (있는 차원: ${(result.dimensionColumns || []).join(', ')})`,
      })
      return null
    }
    if (f.emptyFor.length) {
      sendEvent({
        type: 'reask',
        text: `${f.emptyFor.join('·')} 조건에 해당하는 행이 없습니다.`
          + ' 값을 다르게 적으셨거나 그 기간에 데이터가 없을 수 있습니다.',
        options: ['조건 없이 전체로 보여줘', '지난달로 다시 조회해줘'],
      })
      return null
    }
    sendEvent({
      type: 'debug',
      label: '차원 값 필터',
      detail: `${resolved.dimensionFilters.map((x) => `${x.column}=${x.values.join('/')}`).join(', ')}`
        + ` → ${result.rows.length}행 중 ${f.matched}행`,
    })
    result = { ...result, rows: f.rows }
  }

  // 파라미터 값으로 이미 쓰인 말을 표시 컬럼으로도 쓰지 않는다.
  //
  // "평가 기준은 누적 취소율로, A 그룹에 대한 데이터"에서 '누적 취소율'은 평가 기준
  // (grp_category)이지 보여줄 값이 아니다. LLM이 이를 표시 컬럼으로 골랐고, 그 컬럼은
  // SC 단위 값이라 전시장으로 접으니 전부 null이 되어 빈 도넛이 나갔다(평가 No.48).
  //
  // 등급으로 걸렀으면(grp_name=A) 보여줄 값은 그 등급 컬럼이다 — 인증 리포트가
  // A/B/C/미분류를 열로 갖고 있다. 정답 쿼리도 [A]를 센다.
  {
    const cols = new Set(Object.keys(getReport(resolved.reportId).contract.column_semantics || {}))
    const paramValues = new Set(
      Object.values(resolved.params || {}).flatMap((v) => (Array.isArray(v) ? v : [v]))
        .filter((v) => typeof v === 'string').map((v) => v.replace(/\s+/g, '')),
    )
    const asked = resolved.selectedColumns || []
    const kept = asked.filter((c) => !paramValues.has(String(c).replace(/\s+/g, '')))
    // 등급은 grp_name에서만 가져온다. 아무 파라미터 값이나 쓰면 '누적 취소율'처럼
    // 컬럼명과 같은 기준값이 표시값으로 잡힌다 — 그건 평가 기준이지 보여줄 값이 아니다.
    const grade = ['grp_name', 'GrpName'].map((k) => resolved.params?.[k]).find(Boolean)
    const gradeCol = (Array.isArray(grade) ? grade : [grade])
      .map((v) => String(v ?? '').replace(/\s+/g, '')).find((v) => cols.has(v))
    if (kept.length !== asked.length || (gradeCol && !kept.includes(gradeCol))) {
      resolved.selectedColumns = [...new Set([...kept, ...(gradeCol ? [gradeCol] : [])])]
      sendEvent({
        type: 'debug',
        label: '표시 컬럼 보정',
        detail: `${asked.join(', ') || '(없음)'} → ${resolved.selectedColumns.join(', ') || '(전체)'}`
          + ' — 조건으로 쓴 말은 표시값이 아닙니다.',
      })
    }
  }

  const isFunnelReportView = resolved.reportView?.startsWith('funnel_')
  if (resolved.groupBy && !isFunnelReportView) {
    try {
      // selected_columns에 차원 이름이 섞여 있으면 "이 열을 보고 싶다"는 뜻이다.
      // 롤업이 그 열을 접어버리면 사용자가 요청한 것이 사라진 표가 나간다 —
      // 2026-08-04 실측: 계약 명세에서 SC명·고객명·차종을 요청했는데 LLM이
      // group_by=['딜러']를 함께 보내 세 열이 모두 사라졌고, 그 뒤 "없는 컬럼"으로 거절됐다.
      const wanted = resolveSelectedColumns(
        resolved.selectedColumns || [], [], result.dimensionColumns || [],
      ).dimensions
      const keepDimensions = [...new Set([...resolved.groupBy, ...wanted])]
      const rolled = rollupReportRows(result, keepDimensions)
      result = {
        ...result,
        rows: [...rolled.rows, ...rolled.totalRows],
        dimensionColumns: rolled.dimensionColumns || keepDimensions,
        rolledUpFrom: rolled.collapsed,
      }
    } catch (err) {
      sendEvent({ type: 'rejected', reason: err.message })
      return null
    }
  }

  // 지표 값 조건("활동배수 5 이상"). GOLD에 파라미터가 없어 돌아온 행에서 고른다.
  //
  // 롤업 **뒤**에 건다. "활동배수 5 이상인 SC"는 SC 단위 조건이지 활동유형 행 조건이
  // 아니다. 상세 행에 먼저 걸면 그 SC의 일부 유형 행만 남고, SC당 한 행에만 값이 있는
  // 컬럼(활동기준대수 = sc_first)이 통째로 사라져 0이 된다(2026-08-05 실측).
  let measureFilterNote = null
  if (resolved.measureFilters?.length) {
    const m = filterRowsByMeasure(result, resolved.measureFilters)
    if (m.unknownColumns.length) {
      const { contract } = getReport(resolved.reportId)
      sendEvent({
        type: 'rejected',
        reason: `이 리포트에 없는 지표입니다: ${m.unknownColumns.join(', ')}`
          + ` (있는 지표: ${Object.keys(contract.column_semantics || {}).join(', ')})`,
      })
      return null
    }
    const OP_LABEL = { gte: '이상', gt: '초과', lte: '이하', lt: '미만', eq: '' }
    const desc = resolved.measureFilters
      .map((x) => `${x.column} ${x.value}${OP_LABEL[x.op] ? ` ${OP_LABEL[x.op]}` : ''}`).join(', ')
    if (m.matched === 0) {
      sendEvent({
        type: 'reask',
        text: `${desc} 조건에 해당하는 행이 없습니다. 기준을 낮춰서 다시 보시겠어요?`,
        options: ['조건 없이 전체로 보여줘', '기준을 절반으로 낮춰서 보여줘'],
      })
      return null
    }
    sendEvent({
      type: 'debug',
      label: '지표 값 필터',
      detail: `${desc} → ${result.rows.length}행 중 ${m.matched}행`
        + (m.droppedTotal ? ' (합계 행 제외)' : ''),
    })
    measureFilterNote = `${desc} 조건으로 걸렀습니다`
      + (m.droppedTotal ? ' — 부분집합이라 합계 행은 뺐습니다.' : '.')
    result = { ...result, rows: m.rows }
  }


  // 퍼널 프리셋은 상세 행을 접어 값을 만드는데, GOLD는 상세용과 합계용 CTE를 따로
  // 두고 자격 조건도 다르게 건다 — 그대로 접으면 계약 목표가 8배(활동유형 8종에
  // 반복), 기회 실적이 −73이 된다. GOLD를 그 grain으로 다시 돌려 덮어쓴다.
  let derivedMeasures = null
  if (resolved.reportView?.startsWith('funnel_')) {
    try {
      const d = await deriveFunnelMeasures(result, FUNNEL_VIEW_GROUP_DIMENSIONS)
      if (d) {
        derivedMeasures = { ...d, keyOf: derivedKey }
        sendEvent({
          type: 'debug',
          label: '퍼널 프리셋 값 보정',
          detail: `GOLD를 grain=[${d.grain.join(', ')}]로 다시 돌려 ${d.byKey.size}개 그룹, `
            + `${d.filled.length}개 컬럼을 덮어썼습니다(상세 행 합산으로는 화면 숫자가 나오지 않습니다).`
            + (d.rejected?.length
              ? `
합계 행과 어긋나 쓰지 않은 컬럼: ${d.rejected.join(', ')}`
              : ''),
        })
        // 어긋난 컬럼이 있으면 사용자에게도 알린다 — 그 컬럼만 상세 합산값이라 근사치다.
        if (d.rejected?.length) {
          sendEvent({
            type: 'text',
            text: `일부 값(${d.rejected.length}개 컬럼)이 합계와 맞지 않아 보정하지 않았습니다. `
              + '그 컬럼은 상세 행 합산 기준이라 합계보다 작을 수 있습니다 — '
              + '다시 물어보시면 정상 값이 나올 수 있습니다.\n\n',
          })
        }
      }
    } catch (err) {
      // 보정 실패는 치명적이지 않다 — 근사치로라도 그린다. 다만 조용히 넘기지 않는다.
      sendEvent({ type: 'debug', label: '퍼널 프리셋 값 보정 실패', detail: err.message })
    }
  }

  // 피라미드 뷰는 채널(활동유형)로도 쪼갠다. 채널은 grain이 아니라 필터라 GOLD에
  // common_tp_nm을 걸어 다시 돌려야 BI 화면과 맞는다 — 상세 합산은 값이 작게 나온다.
  // 단계 실적 4개만 필요하다(전 컬럼을 돌리면 60개 쿼리로 27초가 걸렸다).
  let channelMeasures = null
  if (derivedMeasures && resolved.reportView?.startsWith('funnel_pyramid')) {
    try {
      const stageColumns = [
        '영업활동 건 수', '영업기회 건 수(당월활동실적)',
        '시승건수(당월활동실적/시승완료)', '계약건수(당월활동실적)',
      ]
      const c = await deriveFunnelChannels(result, FUNNEL_VIEW_GROUP_DIMENSIONS, stageColumns)
      if (c) {
        channelMeasures = { ...c, keyOf: derivedKey }
        sendEvent({
          type: 'debug',
          label: '퍼널 채널 값 보정',
          detail: `채널 ${c.byKey.size}개를 GOLD에 common_tp_nm을 걸어 다시 계산했습니다 — `
            + 'BI에서 해당 채널 버튼을 눌렀을 때와 같은 값입니다.',
        })
      }
    } catch (err) {
      sendEvent({ type: 'debug', label: '퍼널 채널 값 보정 실패', detail: err.message })
    }
  }

  let projected
  try {
    projected = projectReportView(result, resolved.selectedColumns, resolved.reportView, derivedMeasures, channelMeasures)
    // 인증 리포트 계약이 선언한 객체 필터는 결과 컬럼에 실제로 남아 있는 경우에만 저장한다.
    // 없는 필드를 저장하면 UI가 조용히 드롭다운을 빼 버려 설정과 화면이 어긋난다.
    if (resolved.objectFilterFields?.length) {
      projected = {
        ...projected,
        filterFields: resolved.objectFilterFields.filter((field) => projected.columns.includes(field)),
      }
    }
  } catch (err) {
    // 리포트를 잘못 고른 것일 수 있다. 그 컬럼이 어느 리포트에 있는지 알려주면
    // 사용자가 한 번 더 물어 답에 닿는다 — "없습니다"로 끝내면 갈 곳이 없다.
    const elsewhere = reportsHavingColumns(resolved.selectedColumns || [], resolved.reportId)
    if (elsewhere.length) {
      const names = elsewhere.slice(0, 2).map((r) => `${r.title}(${r.report_id})`).join(', ')
      sendEvent({
        type: 'reask',
        text: `${err.message}\n\n이 컬럼은 ${names}에 있습니다. 그쪽으로 조회할까요?`,
        options: elsewhere.slice(0, 2).map((r) => `${r.title}에서 ${(resolved.selectedColumns || []).join(', ')} 보여줘`),
      })
      return null
    }
    sendEvent({ type: 'rejected', reason: err.message })
    return null
  }

  // 채널 값과 단계 합계 모두 GOLD를 다시 돌린 값이라 각각은 BI와 맞는다. 다만 한 리드가
  // 여러 활동유형에 걸치고 단계 사이를 이동해 합이 딱 떨어지지는 않는다 — BI도 같다.
  // 정상이지만 사용자가 더해 보면 이상해 보이므로 얼마나 차이 나는지 남긴다.
  if (derivedMeasures && resolved.reportView?.startsWith('funnel_pyramid')) {
    const gaps = []
    const channels = ['관계형성활동', 'SC활동', '내방/내전', '온라인유입']
    for (const row of projected.rows) {
      if (row['항목'] && row['항목'] !== '퍼널 숫자') continue
      const total = Number(row['단계 합계'])
      const sum = channels.reduce((acc, c) => acc + (Number(row[c]) || 0), 0)
      if (Number.isFinite(total) && sum !== total) gaps.push(Math.abs(total - sum))
    }
    if (gaps.length) {
      const worst = Math.max(...gaps)
      sendEvent({
        type: 'debug',
        label: '채널 합 차이',
        detail: `${gaps.length}개 단계에서 채널 합이 단계 합계와 다릅니다(최대 ${worst}건). `
          + '채널 값과 단계 합계 모두 BI와 같은 값이지만, 한 리드가 여러 활동유형에 걸치고 '
          + '단계 사이를 이동해 합이 딱 떨어지지 않습니다 — BI도 같습니다.',
      })
    }
  }

  const chartCode = projected.chartCode || 'table'
  const hasInteractiveTableFilters = chartCode === 'table' && resolved.objectFilterFields?.length > 0
  const maxRows = projected.reportView?.startsWith('funnel_')
    ? MAX_FUNNEL_REPORT_ROWS
    : (hasInteractiveTableFilters ? MAX_INTERACTIVE_TABLE_ROWS : MAX_REPORT_ROWS)
  if (projected.rows.length > maxRows) {
    const { contract } = getReport(result.reportId)
    const measures = Object.keys(contract.column_semantics || {})

    // 명세형(건별 목록)은 접을 지표가 없어서 "묶어서 볼까요"가 성립하지 않는다.
    // 되묻는 대신 앞부분만 보여주고 몇 건 중 몇 건인지 밝힌다.
    if (measures.length === 0) {
      const total = projected.rows.length
      projected = { ...projected, rows: projected.rows.slice(0, maxRows) }
      sendEvent({
        type: 'text',
        text: `${result.title}은 건별 명세라 묶을 수 없어 ${total.toLocaleString()}건 중 앞 `
          + `${maxRows.toLocaleString()}건만 표시합니다. 기간이나 조건을 좁히면 전체를 볼 수 있습니다.\n\n`,
      })
    } else if (!resolved.groupBy?.length && projected.totalRowIndexes.length
      && !['all_sc', 'specific'].includes(resolved.scDisplay)) {
      // 사용자가 쪼개 달라고 하지 않았고 리포트가 합계 행을 갖고 있으면, 그 합계가
      // 곧 답이다. "영업기회 건수 알려줘"에 21,377행짜리 표를 만들어 놓고
      // "어느 단위로 묶을까요?"를 되묻던 것을 없앤다 — 물어본 건 숫자 하나다.
      const totals = projected.totalRowIndexes.map((i) => projected.rows[i])
      projected = { ...projected, rows: totals, totalRowIndexes: totals.map((_, i) => i) }
      sendEvent({
        type: 'debug',
        label: '합계 행으로 축약',
        detail: `상세가 많아(${maxRows.toLocaleString()}행 초과) 합계 행만 보여줍니다 — `
          + '쪼개 달라는 요청이 없었고 이 리포트에는 합계가 있습니다.',
      })
    } else {
      // 선택지는 이 리포트가 실제로 가진 차원으로 만든다. 예전에는 "퍼널 현황"으로
      // 고정돼 있어서, 다른 리포트에서 그 선택지를 누르면 엉뚱한 리포트가 실행됐다.
      const yearParam = result.params.Year ?? result.params.year
      const monthParam = result.params.MonthNumber ?? result.params.month
      const scope = [yearParam && `${yearParam}년`, monthParam && `${monthParam}월`]
        .filter(Boolean).join(' ') || '해당 기간'
      const dims = ROLLUP_SUGGESTION_ORDER.filter((d) => result.dimensionColumns.includes(d))
      // SC 단위를 명시적으로 요청했으면 되묻지 않는다 — 이미 "어느 단위로 볼지"에
      // 답한 것이다. 앞부분만 보여주고 몇 건 중 몇 건인지 밝힌다(명세형과 같은 처리).
      // 2026-08-05 실측: "SC 별로 ... 보여줘"에 399행이라며 "어느 단위로 묶을까요?"를
      // 되물었다.
      if (['all_sc', 'specific'].includes(resolved.scDisplay)) {
        const total = projected.rows.length
        projected = { ...projected, rows: projected.rows.slice(0, maxRows) }
        sendEvent({
          type: 'text',
          text: `SC별로 ${total.toLocaleString()}행이라 앞 ${maxRows.toLocaleString()}행만 표시합니다. `
            + '조건을 좁히면 전체를 볼 수 있습니다.\n\n',
        })
      } else {
      const options = (dims.length ? dims.slice(0, 2) : ['딜러'])
        .map((d) => `${scope} ${result.title}를 ${d}별로 보여줘`)
      sendEvent({
        type: 'reask',
        text: `${result.title}가 ${projected.rows.length.toLocaleString()}행이라 그대로 표시하면 화면이 느려집니다. `
          + `어느 단위로 묶어서 볼까요? (합계는 어느 단위로 보든 동일합니다)`,
        options,
      })
      return null
      }
    }
  }

  const title = projected.title || result.title
  const reportQuerySpec = {
    reportId: result.reportId,
    reportView: projected.reportView || resolved.reportView || null,
    reportParams: result.params,
    reportGroupBy: isFunnelReportView ? null : (resolved.groupBy || null),
    reportSelectedColumns: resolved.selectedColumns?.length ? resolved.selectedColumns : null,
    reportColumnSemantics: result.columnSemantics,
    ...(chartCode === 'funnel' ? {
      labelKey: '단계',
      valueKey: '실적',
      dimensionKey: '단계',
      measureKeys: ['실적'],
      measureLabels: ['실적'],
    } : {}),
    ...(chartCode === 'funnel_pyramid' ? {
      stageKey: '단계',
      totalKey: '단계 합계',
      channels: ['관계형성활동', 'SC활동', '내방/내전', '온라인유입'],
      ...FUNNEL_PYRAMID_VIS_SPEC,
      dimensionKey: '단계',
      measureKeys: ['관계형성활동', 'SC활동', '내방/내전', '온라인유입'],
      measureLabels: ['관계형성활동', 'SC활동', '내방/내전', '온라인유입'],
    } : {}),
  }
  const tableProps = {
    title,
    columns: projected.columns,
    rows: projected.rows.map((row) => projected.columns.map((column) => row[column])),
    reportId: result.reportId,
    reportColumnSemantics: result.columnSemantics,
  }
  const built = chartCode === 'table'
    ? { type: 'render_table', props: tableProps }
    : buildWidgetPropsFromRows(chartCode, projected.rows, reportQuerySpec, title)
  const objectSpec = {
    ...(projected.filterFields?.length ? { dataFilters: { fields: projected.filterFields } } : {}),
    ...(chartCode === 'table' ? {
      tableSpec: {
        density: 'compact',
        stickyHeader: true,
        scroll: { x: true, y: true, stickyHeader: true, stickyFirstColumn: true },
        // 필터를 위해 보존한 차원은 데이터에는 남기되, 월별 성취도처럼 표의 본문을
        // 지표 중심으로 읽어야 하는 경우 처음에는 숨긴다. 설정 탭에서 언제든 다시 표시할 수 있다.
        columns: projected.columns.map((field) => ({
          field,
          visible: !resolved.objectFilterFields?.includes(field),
        })),
        pagination: { pageSize: 50 },
      },
    } : {}),
  }

  const detailRows = projected.rows.length - projected.totalRowIndexes.length
  const scNote = result.branch === 'b' ? 'SC별' : '팀 단위'
  const grainNote = isFunnelReportView
    ? '퍼널 객체 단위'
    : resolved.groupBy ? `${resolved.groupBy.join(' > ')} 단위` : '가장 상세한 단위'
  const freshness = result.cached ? ` (${new Date(result.fetchedAt).toLocaleTimeString('ko-KR')} 조회 결과 재사용)` : ''
  const viewNote = projected.reportView ? `, ${projected.reportView}` : ''
  // 기간 의미를 밝힌다. 출고 계열 GOLD는 출고일자를 year_start ~ month_end 로 잡아
  // "4월"을 물어도 1~4월 누적을 낸다 — 안 밝히면 그 달만으로 오해한다
  // (2026-08-05 실측: 렉서스 부산 영업6팀 55행의 출고일자가 1~4월에 걸쳐 있다).
  // 계약에 선언한 리포트만 붙는다. 질문마다 따로 적지 않는다.
  const periodSemantics = getReport(resolved.reportId).contract.period_semantics
  // 그 달만 남기는 행 필터가 걸렸으면 더는 연누적이 아니다. 그대로 "연누적"이라 적으면
  // 걸러낸 결과를 누적으로 오해한다(2026-08-05: 4월만 13행인데 연누적 표기가 남았다).
  const monthFiltered = periodSemantics?.month_filter_column
    && (resolved.dimensionFilters || []).some((f) => f.column === periodSemantics.month_filter_column)
  const periodLabel = monthFiltered
    ? `해당 월만 (${periodSemantics.month_filter_column} 기준)`
    : periodSemantics?.label
  const periodNote = periodLabel ? `, ${periodLabel}` : ''
  // 걸지 못한 객체 필터는 밝힌다. 조용히 빼면 사용자는 걸린 줄 안다.
  const droppedFilters = resolved.unsupportedObjectFilters?.length
    ? `\n${resolved.unsupportedObjectFilters.join(', ')}은(는) 이 리포트 결과에 없는 축이라 화면 필터로 넣지 않았습니다.`
    : ''
  // 지표 값으로 걸렀으면 반드시 밝힌다 — 부분집합인 줄 모르면 전체로 오해한다.
  const summary = `${result.title} (${result.version}) - ${scNote}, ${grainNote}${viewNote}${periodNote}, 상세 ${detailRows}행 + 합계 ${projected.totalRowIndexes.length}행${freshness}`
    + (measureFilterNote ? `\n${measureFilterNote}` : '')
    + droppedFilters

  return {
    result,
    projected,
    built,
    objectSpec,
    summary,
    widget: {
      id: randomUUID(),
      db: FABRIC_DB,
      table: result.reportId,
      sql: null,
      chartCode,
      title,
      topic: result.reportId,
      ragPatternId: null,
      createdAt: new Date().toISOString(),
      type: built.type,
      querySpec: reportQuerySpec,
      objectSpec,
      sizeHint: SIZE_TO_SPAN.lg,
      props: built.props,
    },
  }
}

function emitCertifiedReportWidgets({ prepared, dashboardState, sendEvent }) {
  if (!prepared.length) return
  const widgets = prepared.map((item) => item.widget)
  const canSave = !!dashboardState && MAX_WIDGETS - dashboardState.widgets.length >= widgets.length
  const summary = prepared.map((item) => item.summary).join('\n')
  const first = prepared[0]
  const result = first.result

  if (canSave) {
    sendEvent({
      type: 'patch_ready',
      patch: objectPatch({
        baseVersion: dashboardState.version,
        ops: widgets.map((widget) => ({ op: 'add', widget })),
      }),
      sql: null,
      topic: result.reportId,
      review: {
        approved: true,
        reason: `등록된 인증 리포트(${result.reportId} ${result.version})의 확정 SQL을 그대로 실행했습니다. LLM이 SQL을 작성하지 않았습니다.`,
      },
      summaryText: summary,
      previewWidget: {
        id: first.widget.id,
        title: first.widget.title,
        type: first.built.type,
        props: first.built.props,
        objectSpec: first.objectSpec,
      },
      blocked: false,
      warning: prepared.length > 1 ? `${prepared.length}개 객체를 함께 추가합니다. 미리보기는 첫 번째 객체만 표시됩니다.` : null,
    })
    sendEvent({ type: 'text', text: summary })
    return
  }

  for (const item of prepared) {
    sendEvent({ type: 'component', name: item.built.type, props: item.built.props })
  }
  sendEvent({ type: 'text', text: `${summary}\n확정된 리포트 쿼리를 그대로 실행한 결과입니다.` })
}

async function handleCertifiedReportBundle({ argsList, dashboardState, sendEvent }) {
  sendEvent({ type: 'stage', stage: 'execute', label: STAGE_LABELS.execute })
  const prepared = []
  for (const args of argsList || []) {
    const item = await prepareCertifiedReportWidget({ args, sendEvent, emitStage: false })
    if (!item) return
    prepared.push(item)
  }
  emitCertifiedReportWidgets({ prepared, dashboardState, sendEvent })
}

/**
 * @param {boolean} [allowReselect] 월을 못 받는 리포트를 골랐을 때 서버가 한 번 더
 *   고르게 할지. 재시도 경로에서 다시 부를 때는 false — 아니면 무한히 되돈다.
 */
async function handleCertifiedReport({
  args, dashboardState, sendEvent, message = '',
  client = null, deployment = null, allowReselect = true,
}) {
  const item = await prepareCertifiedReportWidget({
    args, sendEvent, message, dashboardState, client, deployment, allowReselect,
  })
  if (!item) return
  emitCertifiedReportWidgets({ prepared: [item], dashboardState, sendEvent })
}

function handleRestyleWidget({ args, dashboardState, sendEvent }) {
  const widget = dashboardState?.widgets?.find((item) => item.id === args?.widget_id)
  const result = applyRestyle(widget, { chartType: args?.chart_type, colors: args?.colors })

  if (!result.ok) {
    sendEvent({ type: 'text', text: [result.error, ...(result.notes || [])].filter(Boolean).join('\n\n') })
    return
  }

  const changes = []
  if (result.changedType) changes.push(`${labelForChartCode(result.widget.chartCode)} 그래프로 변경`)
  if (result.widget.querySpec?.colorsBySeries) changes.push('계열 색상 변경')

  sendEvent({
    type: 'patch_ready',
    patch: objectPatch({
      baseVersion: dashboardState.version,
      ops: [{ op: 'update', widgetId: result.widget.id, widget: result.widget }],
    }),
    sql: null,
    topic: result.widget.topic ?? null,
    summaryText: [`"${result.widget.title}" - ${changes.join(', ')}`, ...(result.notes || [])].filter(Boolean).join('\n\n'),
    previewWidget: { type: result.widget.type, props: result.widget.props },
  })
}

// 이미 만든 인증 리포트 표를 다른 단위로 다시 묶는다.
//
// 새 조회가 아니라 "같은 리포트를 그대로 다시 실행하고 접는 단위만 바꾸는" 것이다 —
// 그래야 확정 SQL이 유지된다. 차원을 빼는 건 열을 가리는 게 아니라 값을 다시 접는
// 일이라, 단순히 컬럼만 지우면 같은 행이 중복돼 보인다.
async function handleRegroupReportWidget({ args, dashboardState, sendEvent }) {
  const widget = dashboardState?.widgets?.find((item) => item.id === args?.widget_id)
  const resolved = resolveRegroup(widget, args || {})
  if (!resolved.ok) {
    sendEvent({ type: 'text', text: resolved.error })
    return
  }

  const spec = widget.querySpec
  sendEvent({ type: 'stage', stage: 'execute', label: STAGE_LABELS.execute })
  sendEvent({
    type: 'debug',
    label: '인증 리포트 재집계',
    detail: `report_id=${spec.reportId}
뺀 차원: ${resolved.dropped.join(', ')}
`
      + `남긴 단위: ${resolved.groupBy.join(' > ')}`,
  })

  let result
  try {
    // 인증 리포트 경로와 같은 실행기를 쓴다 — 파라미터 검증·해시 대조·캐시가 동일하게 걸린다.
    result = await executeReportWithView(spec.reportId, spec.reportParams || {}, { reportView: null })
  } catch (err) {
    sendEvent({ type: 'rejected', reason: `리포트를 다시 실행하지 못했습니다: ${err.message}` })
    return
  }

  let rolled
  try {
    rolled = rollupReportRows(result, resolved.groupBy)
  } catch (err) {
    sendEvent({ type: 'rejected', reason: err.message })
    return
  }

  // SQL이 만든 합계 행은 그대로 살려 붙인다 — 접은 단위와 무관하게 그게 정답이다.
  const rows = [...rolled.rows, ...rolled.totalRows]
  const columns = [...resolved.groupBy, ...Object.keys(getReport(spec.reportId).contract.column_semantics || {})]
  const next = {
    ...widget,
    querySpec: { ...spec, reportGroupBy: resolved.groupBy },
    props: {
      ...widget.props,
      columns,
      rows: rows.map((row) => columns.map((column) => row[column])),
    },
  }

  sendEvent({
    type: 'patch_ready',
    patch: objectPatch({
      baseVersion: dashboardState.version,
      ops: [{ op: 'update', widgetId: next.id, widget: next }],
    }),
    sql: null,
    topic: next.topic ?? null,
    summaryText: `"${next.title}" — ${resolved.dropped.join(', ')} 빼고 ${resolved.groupBy.join(' > ')} 단위로 `
      + `다시 묶었습니다 (${rolled.rows.length}행${rolled.totalRows.length ? ` + 합계 ${rolled.totalRows.length}행` : ''}).`,
    previewWidget: { type: next.type, props: next.props },
  })
}

function applyTrailingWindowIfNeededWithNotice(ir, metric, sendEvent) {
  if (!metric.trailing_window_months) return ir
  const overridden = applyTrailingWindowIfNeeded(ir, metric)
  sendEvent({ type: 'debug', label: '기간 자동 고정', detail: `"${metric.name_ko}"은 오늘 기준이 아니라 지난달 말일까지 ${metric.trailing_window_months}개월 고정 — ${overridden.time_range.start_date} ~ ${overridden.time_range.end_date}` })
  return overridden
}

// 단일 metric을 rows로 풀어내는 3가지 경로(controlled_analysis / ratio-like / 직접 컴파일)를
// 한 곳에 모은다 — 단일 질문 경로와 비교(compare_metric) 경로가 이 함수를 그대로 공유한다.
// CompileError/QueryTimeoutError는 잡지 않고 그대로 던져서 호출부가 일관되게 처리하게 한다.
//
// {rows, sql} 을 돌려준다 — sql은 이 결과를 나중에 위젯으로 저장했다가 재실행(rehydrate)할
// 수 있는 "그대로 실행 가능한" 단일 SQL 문자열일 때만 채워지고, ratio/conversion/progress_metric
// (분자·분모를 서로 다른 쿼리 2번으로 실행해 JS에서 나눈 값이라 SQL 한 줄로 재현 불가)은
// sql=null이다 — 호출부가 이 값으로 "대시보드에 추가 가능 여부"를 판단한다(2026-07-27,
// 그래프 기능 고도화는 다음 라운드로 미루고 이번엔 단일 SQL로 재현 가능한 경로만 지원).
const TIME_SERIES_DIMENSIONS = new Set(['time_year', 'time_month', 'time_day'])
const ADDITIVE_AGGREGATIONS = new Set(['sum', 'count', 'count_distinct'])
const GRAIN_RANK = { year: 0, month: 1, day: 2 }

function periodResetForAutoCumulative(metric, dimId, registry) {
  const dimDef = registry.dimensions.get(dimId)
  if (!dimDef?.derive_grain) return null
  if (!ADDITIVE_AGGREGATIONS.has(metric.aggregation)) return null
  const metricRank = GRAIN_RANK[metric.default_time_grain]
  const dimRank = GRAIN_RANK[dimDef.derive_grain]
  if (metricRank === undefined || dimRank === undefined) return null
  if (metricRank >= dimRank) return null
  return metric.default_time_grain
}

function applyAutoCumulative(rows, ir, metric, registry, sendEvent) {
  const dimensionIds = [...new Set((ir.dimensions || []).filter(Boolean))]
  const dimId = dimensionIds[0]
  if (!dimId) return rows
  if (ir.time_series_transform === 'mom_change_pct') return rows
  const resetPeriod = periodResetForAutoCumulative(metric, dimId, registry)
  if (!resetPeriod) return rows
  sendEvent({
    type: 'debug',
    label: 'Time grain cumulative transform',
    detail: `${metric.id} is a ${resetPeriod}-grain cumulative metric; applying cumulative reset by ${resetPeriod} for ${dimId}.`,
  })
  return applyTimeSeriesTransform(rows, { dimId: dimensionIds, metricIds: [metric.id], transform: 'cumulative', resetPeriod })
}

function persistedTimeSeriesSpec(metric, dimId, registry, userTransform) {
  if (!dimId || !TIME_SERIES_DIMENSIONS.has(dimId)) return {}
  const resetPeriod = userTransform === 'mom_change_pct' ? null : periodResetForAutoCumulative(metric, dimId, registry)
  if (resetPeriod) return { timeSeriesTransform: 'cumulative', cumulativeResetPeriod: resetPeriod }
  if (userTransform && userTransform !== 'none') return { timeSeriesTransform: userTransform }
  return {}
}

async function resolveMetricRows(ir, metric, registry, sendEvent, { accessContext } = {}) {
  // compileSingleMetricQuery(flat JOIN 전용)로 표현할 수 없는 metric(2단계 집계, EXISTS
  // 상관 서브쿼리 등)은 CONTROLLED_ANALYSIS_COMPILERS에 등록된 전용 컴파일러로 우회한다.
  if (metric.controlled_analysis) {
    const compileFn = CONTROLLED_ANALYSIS_COMPILERS[metric.id]
    if (!compileFn) {
      throw new CompileError(`controlled_analysis metric '${metric.id}'에 대한 전용 컴파일러가 agenticBiPipeline.js의 CONTROLLED_ANALYSIS_COMPILERS에 등록되어 있지 않음`, 'missing_controlled_analysis_compiler')
    }
    sendEvent({ type: 'stage', stage: 'compile', label: STAGE_LABELS.compile })
    const result = await compileFn(ir, metric, registry, sendEvent, { accessContext })
    return {
      rows: applyAutoCumulative(result.rows, ir, metric, registry, sendEvent),
      sql: result.sql,
      // Some controlled metrics delegate to the GOLD-derived path. Preserve its
      // certified replay contract instead of downgrading it to read-only SQL.
      execution: result.execution || (result.sql ? { mode: 'read_only' } : null),
    }
  }

  const isRatioLike = ['ratio_metric', 'conversion_metric', 'progress_metric'].includes(metric.metric_type)

  // ratio/conversion/progress_metric은 base_table/expression이 없다 — 이 자체가 "전환율의
  // 분자·분모는 반드시 별도 metric으로 명시한다"는 설계 원칙의 결과다(agentic_bi_design
  // 최종 보고서 4절). 그래서 compileSingleMetricQuery로 곧장 컴파일할 수 없고, 대신
  // numerator_metric/denominator_metric을 각각 독립적으로 컴파일·실행한 뒤 여기서 나눈다 —
  // "GOLD 쿼리를 그대로 실행"이 아니라 "Text2SQL + 가공" 원칙 그대로.
  if (isRatioLike) {
    sendEvent({ type: 'stage', stage: 'compile', label: STAGE_LABELS.compile })
    // 분자/분모를 resolveMetricRows로 재귀 호출한다(예전엔 compileAndRun을 직접 불러 SC
    // 레벨 target 전환만 처리했는데, 분자/분모가 controlled_analysis metric(예:
    // lead_mtd_actual)이면 compileAndRun이 이를 모르고 compileSingleMetricQuery로 바로
    // 컴파일을 시도하다가 "not_directly_compilable" 오류로 죽었다 — 2026-07 평가표에서
    // activity_to_lead_conversion_rate 질문이 전부 이 경로로 실패한 것으로 확인됨).
    // resolveMetricRows는 controlled_analysis/SC 레벨 target 전환/직접 컴파일을 전부
    // 이미 알아서 분기하므로, 여기서는 분자·분모 각각을 그 metric 자신으로 다시 넘기기만
    // 하면 된다 — SC 레벨 target 자동전환 디버그 이벤트도 내부에서 그대로 발생한다.
    const numeratorMetric = registry.metrics.get(metric.numerator_metric)
    const denominatorMetric = registry.metrics.get(metric.denominator_metric)
    const numResult = await resolveMetricRows({ ...ir, metrics: [numeratorMetric.id] }, numeratorMetric, registry, sendEvent, { accessContext })
    const denResult = await resolveMetricRows({ ...ir, metrics: [denominatorMetric.id] }, denominatorMetric, registry, sendEvent, { accessContext })
    const dimensionIds = [...new Set((ir.dimensions || []).filter(Boolean))]
    const dimId = dimensionIds.join(', ')

    // 항목별(SC/딜러 등) 분해가 있으면 dimension 값 기준으로, 없으면(스칼라) 단일 행으로
    // 분자·분모를 합친 뒤(mergeMetricRows — 한쪽에만 있는 값은 0으로 취급) 나눈다
    // (applyRatioDerivation). 두 헬퍼 다 dashboardPagesHandler.js의 rehydrateWidget과
    // 공유해서 저장 전/후 값이 어긋나지 않는다.
    const merged = mergeMetricRows(
      [{ metricId: numeratorMetric.id, rows: numResult.rows }, { metricId: denominatorMetric.id, rows: denResult.rows }],
      dimensionIds.length ? dimensionIds : null
    )
    const ratioMeta = {
      numerator: numeratorMetric.id, denominator: denominatorMetric.id,
      outputKey: metric.id, zeroDenominatorResult: metric.zero_denominator_result,
    }
    const rows = applyRatioDerivation(merged, ratioMeta)

    if (dimId) {
      sendEvent({ type: 'debug', label: `분자/분모 항목별 병합 (${dimId})`, detail: `${rows.length}건` })
    } else {
      sendEvent({
        type: 'debug', label: `분자(${metric.numerator_metric}) / 분모(${metric.denominator_metric})`,
        detail: `${merged[0]?.[numeratorMetric.id]} / ${merged[0]?.[denominatorMetric.id]} = ${rows[0]?.[metric.id]}`,
      })
    }

    // 분자·분모 각각이 "단일 SQL로 재현 가능"(sql 있음)할 때만 이 ratio 위젯도 저장 가능하다 —
    // 분자/분모 중 하나가 또 다른 ratio(중첩)라 sql=null이면 재현 불가이므로 저장을 포기한다
    // (현재 등록된 metric 데이터에는 중첩 ratio가 없어 실제로는 항상 채워진다).
    const sqlQueries = (numResult.sql && denResult.sql)
      ? [
          { metricId: numeratorMetric.id, db: FABRIC_DB, sql: numResult.sql, ...(numResult.execution ? { execution: numResult.execution } : {}) },
          { metricId: denominatorMetric.id, db: FABRIC_DB, sql: denResult.sql, ...(denResult.execution ? { execution: denResult.execution } : {}) },
        ]
      : null
    return { rows, sql: null, sqlQueries, ratioMeta: sqlQueries ? ratioMeta : null }
  }

  // 직접 컴파일 (base_metric/target_metric) — LLM은 SQL을 직접 생성하지 않는다.
  sendEvent({ type: 'stage', stage: 'compile', label: STAGE_LABELS.compile })
  const effectiveMetricId = resolveEffectiveMetricId(metric.id, ir)
  if (effectiveMetricId !== metric.id) {
    sendEvent({ type: 'debug', label: 'SC 레벨 목표로 자동 전환', detail: `${metric.id} -> ${effectiveMetricId} (SC/부서/전시장 필터 감지, 실제 BI의 _cond 분기 재현)` })
  }
  const compileIr = effectiveMetricId !== metric.id ? { ...ir, metrics: [effectiveMetricId] } : ir
  const result = await compileAndRun(compileIr, registry, sendEvent, { outputAlias: metric.id, accessContext })
  return {
    rows: applyAutoCumulative(result.rows, ir, metric, registry, sendEvent),
    sql: result.sql,
    execution: result.execution,
  }
}

// 차원 없이 지표 N개를 비교("이번달 실적이랑 목표 총계 비교해줘") — 항목별로 나눌 축이
// 없으므로 하나로 합친 위젯을 만들 수 없다. 대신 dashboardPipeline.js가 KPI 행을 카드별로
// 쪼개는 것과 같은 원칙으로, 지표마다 완전히 독립된 KPI 카드 위젯을 만든다 — 각 카드는
// 자기 metric의 실제 sql을 그대로 갖고 있어(buildAgenticBiWidget 재사용) 다른 단일 지표
// 위젯과 똑같이 저장/재조회(rehydrate)된다. add만 지원(각자 다른 위젯이라 "이거 하나"로
// 특정한 modify가 성립하지 않음 — runAgenticBiQuery에서 이미 걸러냄).
function renderMultiKpiAndRespond({ resultsByMetric, dashboardState, sendEvent, targetWidgetId }) {
  sendEvent({ type: 'stage', stage: 'render', label: STAGE_LABELS.render })

  const { widget: proposedWidget, canReplay, sql } = buildMultiKpiSummaryWidget(resultsByMetric)
  const widget = targetWidgetId ? { ...proposedWidget, id: targetWidgetId } : proposedWidget
  const summaryLine = resultsByMetric
    .map(({ metric, rows }) => `${metric.name_ko}: ${formatMetricValue(rows[0]?.[metric.id], metric)}`)
    .join(' / ')
  const canPropose = Boolean(dashboardState) && canReplay
  const roomLeft = canPropose ? (targetWidgetId ? 0 : MAX_WIDGETS - dashboardState.widgets.length - 1) : -1

  if (canPropose && roomLeft >= 0) {
    const patch = targetWidgetId
      ? { baseVersion: dashboardState.version, ops: [{ op: 'update', widgetId: targetWidgetId, widget }] }
      : { baseVersion: dashboardState.version, ops: [{ op: 'add', widget }] }
    const previewObject = createDashboardObject(widget)
    sendEvent({
      type: 'patch_ready',
      patch: objectPatch(patch),
      sql,
      topic: widget.topic,
      review: { approved: true, reason: '등록된 Metric 정의(Ontology/Semantic Layer)로 결정론적으로 컴파일된 SQL입니다 — LLM이 SQL을 직접 작성하지 않았습니다.' },
      summaryText: summaryLine,
      previewWidget: { type: widget.type, props: widget.props, objectSpec: previewObject.objectSpec },
      blocked: false,
      warning: null,
    })
    sendEvent({ type: 'text', text: summaryLine })
    return
  }

  const capNote = canPropose && roomLeft < 0
    ? '\n\n[안내] 위젯 개수 제한(12개)에 도달해 대시보드에는 추가하지 못했습니다 — 답변만 표시합니다.'
    : ''
  sendEvent({ type: 'component', name: widget.type, props: widget.props })
  sendEvent({ type: 'text', text: `${summaryLine}${capNote}` })
}

// 차원이 있는 상태로 지표 N개를 비교("활동유형별로 실적이랑 잔여타겟 같이 보여줘") — 항목별로
// 지표들을 나란히/겹쳐 보여주는 다계열(멀티 시리즈) 위젯 하나를 만든다. "어떤 지표를 계산할지"는
// 이미 각 metric의 등록된 정의로 결정론적으로 끝난 뒤이므로, 여기서 LLM에게 맡기는 건 오직
// "이미 계산된 숫자들을 막대/선/누적 중 어떤 형태로 그릴지"뿐이다(set_multi_metric_chart_spec —
// 컬럼명이 이미 실제 존재하는 metric id라 지어낼 수 없음, dashboardPipeline.js의 RAG
// chart-spec 단계와 같은 패턴).
function orderObjectFilterFields(fields, registry) {
  return [...new Set((fields || []).filter(Boolean))]
    .map((field, index) => ({ field, index, order: registry.dimensions.get(field)?.filter_order }))
    .sort((left, right) => {
      const leftOrder = Number.isFinite(left.order) ? left.order : Number.MAX_SAFE_INTEGER
      const rightOrder = Number.isFinite(right.order) ? right.order : Number.MAX_SAFE_INTEGER
      return leftOrder - rightOrder || left.index - right.index
    })
    .map(({ field }) => field)
}

function selectedWidgetEditTarget(message, dashboardState) {
  const selectedWidgetId = dashboardState?.selectedWidgetId
  if (!selectedWidgetId || !dashboardState?.widgets?.some((widget) => widget.id === selectedWidgetId)) return null
  const question = String(message || '')
  const refersToSelection = /(?:선택한|이|그|현재|방금|해당)\s*(?:차트|그래프|위젯)|(?:이거|이것|그거|그것)/.test(question)
  const requestsChange = /바꿔|바꾸|변경|수정|설정|적용|표시|차트로/.test(question)
  return refersToSelection && requestsChange ? selectedWidgetId : null
}

function selectedWidgetDimensionIds(widget) {
  const querySpec = widget?.querySpec || {}
  return normalizeDimensionIds(querySpec.dimensionKeys)
}

export function selectedWidgetShapeForRateChange(message, ir, dashboardState) {
  const targetWidgetId = selectedWidgetEditTarget(message, dashboardState)
  if (!targetWidgetId || !/(진행률|달성률|전환율|비율|progress|achievement|conversion|rate)/i.test(String(message || ''))) return ir
  const selectedWidget = dashboardState.widgets.find((widget) => widget.id === targetWidgetId)
  const dimensions = selectedWidgetDimensionIds(selectedWidget)
  if (!dimensions.length) return ir
  const configuredFilters = Array.isArray(selectedWidget?.objectSpec?.dataFilters?.fields)
    ? selectedWidget.objectSpec.dataFilters.fields.filter((field) => dimensions.includes(field))
    : []
  return {
    ...ir,
    dimensions,
    object_filter_dimensions: configuredFilters,
    chart_type: ir.chart_type || selectedWidget.chartCode || 'bar',
  }
}

function requestedBarOrientation(message) {
  const question = String(message || '')
  if (/가로\s*(?:막대|바|bar|그래프|차트)|horizontal\s*(?:bar|chart)?/i.test(question)) return 'horizontal'
  if (/세로\s*(?:막대|바|bar|그래프|차트)|vertical\s*(?:bar|chart)?/i.test(question)) return 'vertical'
  return null
}

async function renderMultiSeriesAndRespond({ message, resultsByMetric, dimensionIds, objectFilterFields, dashboardState, registry, sendEvent, targetWidgetId, client, deployment, timeSeriesTransform, requestedChartType }) {
  const metrics = resultsByMetric.map((r) => r.metric)
  const metricIds = metrics.map((m) => m.id)
  const dimensions = [...new Set((dimensionIds || []).filter(Boolean))]
  const orderedObjectFilterFields = orderObjectFilterFields(
    objectFilterFields?.length ? objectFilterFields : dimensions,
    registry
  )
  const dimId = dimensions[0] || null
  const dimLabel = registry.dimensions.get(dimId)?.label_ko
  const dimensionLabels = dimensions.map((dimensionId) => registry.dimensions.get(dimensionId)?.label_ko || dimensionId)
  const isMomChangeDisplay = timeSeriesTransform === 'mom_change_pct' && TIME_SERIES_DIMENSIONS.has(dimId)
  let mergedRows = mergeMetricRows(resultsByMetric.map(({ metric, rows }) => ({ metricId: metric.id, rows })), dimensions)
  if (timeSeriesTransform && TIME_SERIES_DIMENSIONS.has(dimId)) {
    const anyAutoCumulated = metrics.some((mt) => periodResetForAutoCumulative(mt, dimId, registry))
    if (!(timeSeriesTransform === 'cumulative' && anyAutoCumulated)) {
      mergedRows = applyTimeSeriesTransform(mergedRows, { dimId: dimensions, metricIds, transform: timeSeriesTransform })
    }
  }
  const defaultTitle = `${metrics.map((m) => m.name_ko).join(' vs ')}${dimensionLabels.length ? ` (${dimensionLabels.join(' · ')})` : ''}${isMomChangeDisplay ? ' — 전기 대비 증감률' : ''}`

  sendEvent({ type: 'stage', stage: 'render', label: STAGE_LABELS.render })

  // 카테고리(dimension 값)가 30개를 넘으면 막대/선으로 그리기엔 너무 빼곡하다 — planner.js의
  // 동일 규칙(pickComponentType의 rowCount>30 → detail_table)과 일관되게 표로 강등한다.
  // 대시보드 편집 중에는 아래 공통 객체 생성 경로를 타야 필터 설정과 SQL 재조회 정보도 저장된다.
  // 독립 채팅 응답만 대용량 표로 바로 반환한다.
  if (mergedRows.length > 30 && !dashboardState) {
    sendEvent({
      type: 'component', name: 'render_table',
      props: { title: defaultTitle, columns: [...dimensions, ...metricIds], rows: mergedRows.map((row) => [...dimensions.map((dimensionId) => row[dimensionId]), ...metricIds.map((id) => row[id])]) },
    })
    sendEvent({ type: 'text', text: `${defaultTitle} — ${mergedRows.length}건 비교(표로 표시)` })
    return
  }

  sendEvent({ type: 'stage', stage: 'compile', label: '차트 형태 결정 중...' })
  const [specCall] = await streamAssistantTurn(client, {
      model: deployment,
      messages: [
        {
          role: 'system',
          content: `아래 지표들은 이미 "${dimLabel || dimId}" 기준으로 각각 계산이 끝났습니다. 사용자 질문("${message}")의 ` +
            `의도에 맞게 이 지표들을 하나의 차트로 어떻게 겹쳐 보여줄지만 고르세요. 예: "실적/잔여" 같은 달성-대비-목표류는 ` +
            `stacked=true인 bar, "추이"/"트렌드"를 원하면 line, "실적은 막대로 목표는 선으로" 처럼 형태를 섞어 달라면 combo를 ` +
            `쓰세요. bar_keys/line_keys를 채울 땐 아래 metric id 중에서만 고르고 빠짐없이 배정하세요.\n\n` +
            `[비교 대상 metric id]\n${metricIds.map((id) => `- ${id}: ${registry.metrics.get(id).name_ko}`).join('\n')}`,
        },
        { role: 'user', content: message },
      ],
      tools: buildMultiMetricChartSpecTool(metricIds),
      toolChoice: { type: 'function', function: { name: 'set_multi_metric_chart_spec' } },
      temperature: 0,
    })
  const suggestedSpec = specCall?.args || { chart_type: 'bar' }
  const normalizedRequestedChartType = requestedChartType === 'pie' ? 'donut' : requestedChartType
  const explicitChartType = ['bar', 'line', 'area', 'combo', 'table', 'donut', 'scatter', 'radar'].includes(normalizedRequestedChartType)
    ? normalizedRequestedChartType
    : null
  const spec = explicitChartType
      ? { ...suggestedSpec, chart_type: explicitChartType }
      : (mergedRows.length > 30 ? { chart_type: 'table' } : suggestedSpec)
  const title = spec.title || defaultTitle
  const metricLabels = metrics.map((m) => m.name_ko)

  let chartCode, querySpec, chartFallbackNoteMulti = null
  if (spec.chart_type === 'table') {
    // >30행 강등 표와 달리 이 경로는 사용자가 명시적으로 "표로 보여줘"라고 요청한
    // 경우다 — buildWidgetPropsFromRows('table', ...)는 렌더링에 querySpec을 쓰지
    // 않지만(rows의 컬럼을 그대로 표로 만듦), xKey는 남겨둔다 — dashboardPagesHandler.js의
    // rehydrateWidget이 sqlQueries를 재실행한 뒤 이 xKey를 병합 기준 dimension으로
    // 읽기 때문에(mergeMetricRows) — 없으면 새로고침 후 표가 항목별이 아니라 한 줄로 뭉개진다.
    chartCode = 'table'
    querySpec = { xKey: dimId, dimensionKeys: dimensions }
  } else if (spec.chart_type === 'combo') {
    const barKeys = (spec.bar_keys || []).filter((k) => metricIds.includes(k))
    const lineKeys = (spec.line_keys || []).filter((k) => metricIds.includes(k) && !barKeys.includes(k))
    // LLM이 일부 metric을 bar_keys/line_keys 어디에도 안 넣고 빠뜨렸을 수 있음 — 누락분은 bar로 보정.
    const assigned = new Set([...barKeys, ...lineKeys])
    const leftover = metricIds.filter((id) => !assigned.has(id))
    chartCode = 'combo'
    querySpec = {
      xKey: dimId,
      dimensionKeys: dimensions,
      barKeys: [...barKeys, ...leftover],
      lineKeys,
      barLabels: [...barKeys, ...leftover].map((id) => registry.metrics.get(id).name_ko),
      lineLabels: lineKeys.map((id) => registry.metrics.get(id).name_ko),
    }
  } else {
    let requested = spec.chart_type === 'pie' ? 'donut' : spec.chart_type
    if (requested === 'donut' || requested === 'scatter' || requested === 'radar') {
      const check = requested === 'donut'
        ? checkDonutEligible(mergedRows, metricIds[0], metrics[0])
        : requested === 'scatter'
          ? checkScatterEligible(metricIds, dimId)
          : checkRadarEligible(mergedRows)
      if (!check.ok) {
        chartFallbackNoteMulti = check.reason
        sendEvent({ type: 'debug', label: `${requested} instead of requested chart`, detail: check.reason })
        requested = 'bar'
      }
    }
    // 선/영역은 시간처럼 이어지는 축이 있어야 한다. "딜러별"(항목 비교) 축에 선을 그리면
    // 항목 사이에 없는 연속 관계가 있는 것처럼 보인다 — 사용자가 "라인차트로"라고 명시해도
    // 도넛·산점도와 같은 원칙으로 막대로 폴백하고 이유를 알려준다.
    if ((requested === 'line' || requested === 'area') && !TEMPORAL_DIMENSIONS.has(dimId)) {
      chartFallbackNoteMulti = `선차트는 월별·일별처럼 이어지는 시간 축이 필요한데 "${dimLabel || dimId || '항목'}별"은 항목 비교라 막대로 표시했습니다. "월별 추이"로 요청하시면 선차트로 보여드립니다.`
      sendEvent({ type: 'debug', label: 'line instead of requested chart', detail: chartFallbackNoteMulti })
      requested = 'bar'
    }
    if (requested === 'donut') {
      const isMulti = metricIds.length > 1
      chartCode = 'pie'
      querySpec = {
        labelKey: dimId,
        valueKey: isMulti ? '__donut_value' : metricIds[0],
        dimensionKeys: dimensions,
        ...(isMulti ? { sumKeys: metricIds } : {}),
        foldTopN: DONUT_MAX_SLICES,
      }
    } else if (requested === 'scatter') {
      chartCode = 'scatter'
      querySpec = {
        xKey: metricIds[0],
        yKey: metricIds[1],
        xLabel: metricLabels[0],
        yLabel: metricLabels[1],
        dimensionKeys: dimensions,
      }
    } else if (requested === 'radar') {
      chartCode = 'radar'
      querySpec = {
        xKey: dimId,
        dimensionKeys: dimensions,
        yKeys: metricIds,
        yLabels: metricLabels,
      }
    } else {
      chartCode = ['bar', 'line', 'area'].includes(requested) ? requested : 'bar'
    // stacked를 LLM이 명시했을 때만 querySpec에 넣는다 — 항상 Boolean()으로 채우면
    // area의 기본값(widgetSchema.js: stacked ?? true)이 undefined 대신 false로 덮여
    // LLM이 stacked를 언급하지 않은 area 차트가 의도와 다르게 겹치지 않고 그려진다.
      querySpec = {
        xKey: dimId,
        dimensionKeys: dimensions,
        yKeys: metricIds,
        yLabels: metricLabels,
        ...(chartCode === 'bar' && requestedBarOrientation(message) ? { orientation: requestedBarOrientation(message) } : {}),
        ...(spec.stacked !== undefined ? { stacked: Boolean(spec.stacked) } : {}),
      }
    }
  }

  // 개수형(대부분의 지표)과 퍼센트형(달성률 등) 지표가 섞여 있으면 같은 Y축에선 스케일
  // 차이 때문에 퍼센트 쪽이 바닥에 눌려 안 보인다 — "어색해 보이는지"를 LLM이 눈치채길
  // 기대하는 대신, 이미 알고 있는 사실(metric.format)로 결정론적으로 오른쪽 보조 축에
  // 배정한다. 전부 퍼센트거나 전부 개수형이면(섞이지 않으면) 나눌 필요가 없다.
  if (chartCode !== 'table') {
    if (isMomChangeDisplay) {
      // 증감률 변환이 적용되면 모든 계열이 다 퍼센트값이라 나눌 축이 없다 — 그래도
      // percentTick 눈금(오른쪽 축)을 쓰려면 전부 secondary로 보낸다(BarChartWidget.jsx는
      // 이 경우 왼쪽 축이 비어도 문제없이 렌더링됨).
      querySpec.secondaryKeys = metricIds
    } else {
      const percentageIds = metricIds.filter((id) => registry.metrics.get(id).format === 'percentage')
      if (percentageIds.length > 0 && percentageIds.length < metricIds.length) {
        querySpec.secondaryKeys = percentageIds
      }
    }
  }

  // rehydrateWidget이 sqlQueries를 재실행해 얻는 raw 병합 rows에 저장 시점과 같은 변환을
  // 다시 태울 수 있도록 flag를 남긴다 — ratioMeta/derivations와 같은 self-contained 원칙.
  const resetPeriods = new Set(metrics.map((mt) => periodResetForAutoCumulative(mt, dimId, registry)).filter(Boolean))
  if (timeSeriesTransform !== 'mom_change_pct' && resetPeriods.size === 1) {
    querySpec.timeSeriesTransform = 'cumulative'
    querySpec.cumulativeResetPeriod = [...resetPeriods][0]
  } else if (timeSeriesTransform && TIME_SERIES_DIMENSIONS.has(dimId)) {
    querySpec.timeSeriesTransform = timeSeriesTransform
  }

  const built = buildWidgetPropsFromRows(chartCode, mergedRows, querySpec, title)
  const summaryLine = `${title} — ${mergedRows.length}건 비교${chartFallbackNoteMulti ? `\n\n${chartFallbackNoteMulti}` : ''}`

  // sqlQueries: 각 metric을 재실행해 dimId 기준으로 다시 병합하면 그대로 rehydrate 가능
  // (dashboardPagesHandler.js가 이 배열 형태를 읽는다). ratio형 metric(예: 달성률)은
  // 자기 sql이 없지만(분자·분모를 나눈 값이라 SQL 한 줄이 아님) 그 분자·분모 쿼리
  // (sqlQueries)와 나눗셈 방법(ratioMeta)을 그대로 갖고 있으므로, 그걸 펼쳐 넣고
  // querySpec.derivations에 나눗셈 방법을 남겨두면 재조회 시 다시 계산할 수 있다 —
  // ratio형이 껴 있다고 무조건 저장을 포기하지 않는다(이전엔 그렇게 처리해서 이런
  // 조합은 항상 적용 버튼 없이 채팅에만 나갔다).
  const sqlQueries = []
  const derivations = []
  for (const { metric, sql, execution, sqlQueries: nested, ratioMeta: rMeta } of resultsByMetric) {
    if (sql) {
      sqlQueries.push({ metricId: metric.id, db: FABRIC_DB, sql, ...(execution ? { execution } : {}) })
    } else if (nested?.length && rMeta) {
      sqlQueries.push(...nested)
      derivations.push(rMeta)
    }
  }
  // 같은 metricId가 여러 번 들어갈 수 있다(예: 달성률의 분모가 마침 다른 비교 대상
  // metric과 같은 경우) — 재조회 때 같은 쿼리를 중복 실행하지 않도록 첫 번째만 남긴다.
  const seenMetricIds = new Set()
  const dedupedSqlQueries = withSourceDependencies(sqlQueries.filter((q) => (seenMetricIds.has(q.metricId) ? false : seenMetricIds.add(q.metricId))))
  if (derivations.length) querySpec.derivations = derivations

  // 모든 비교 대상 metric이 sql(직접) 또는 sqlQueries+ratioMeta(비율) 중 하나로 재현
  // 가능해야 저장할 수 있다 — 둘 다 없는 metric이 하나라도 있으면 저장을 포기한다.
  const canReplay = resultsByMetric.every(({ sql, sqlQueries: nested, ratioMeta: rMeta }) => Boolean(sql) || Boolean(nested?.length && rMeta))
    && dedupedSqlQueries.every((q) => q.sql)
  const canPropose = canReplay && Boolean(dashboardState)
  const roomLeft = canPropose ? (targetWidgetId ? 0 : MAX_WIDGETS - dashboardState.widgets.length - 1) : -1
  const bundleTransform = querySpec.timeSeriesTransform && querySpec.timeSeriesTransform !== 'none'
    ? {
        type: querySpec.timeSeriesTransform,
        ...(querySpec.cumulativeResetPeriod ? { resetPeriod: querySpec.cumulativeResetPeriod } : {}),
      }
    : null

  if (canPropose && roomLeft >= 0) {
    const widget = {
      id: targetWidgetId || randomUUID(),
      db: FABRIC_DB,
      table: metricIds.join('+'),
      sql: null,
      sqlQueries: dedupedSqlQueries,
      queryBundle: {
        version: 2,
        queries: dedupedSqlQueries.map((query, index) => ({
          id: query.id || `${query.metricId}_${index + 1}`,
          metricId: query.metricId,
          db: query.db || FABRIC_DB,
          sql: query.sql,
          ...(query.execution ? { execution: query.execution } : {}),
          ...(Array.isArray(query.sourceDependencies) ? { sourceDependencies: query.sourceDependencies } : {}),
        })),
        merge: { dimensionKey: dimensions },
        derivations,
        transform: bundleTransform,
      },
      chartCode,
      title,
      topic: metricIds.join('+'),
      ragPatternId: null,
      createdAt: new Date().toISOString(),
      type: built.type,
      querySpec,
      objectSpec: {
        dataFilters: { fields: orderedObjectFilterFields },
        vizSpec: {
          columnMap: Object.fromEntries(dimensions.map((dimensionId) => [dimensionId, {
            label: registry.dimensions.get(dimensionId)?.label_ko || dimensionId,
            role: 'dimension',
          }])),
        },
      },
      sizeHint: SIZE_TO_SPAN.md,
      props: built.props,
    }
    const patch = targetWidgetId
      ? { baseVersion: dashboardState.version, ops: [{ op: 'update', widgetId: targetWidgetId, widget }] }
      : { baseVersion: dashboardState.version, ops: [{ op: 'add', widget }] }
    sendEvent({
      type: 'patch_ready',
      patch: objectPatch(patch),
      sql: dedupedSqlQueries.map((q) => `-- ${q.metricId}\n${q.sql}`).join('\n\n'),
      topic: widget.topic,
      review: { approved: true, reason: '등록된 Metric 정의(Ontology/Semantic Layer)로 결정론적으로 컴파일된 SQL입니다 — LLM이 SQL을 직접 작성하지 않았습니다.' },
      summaryText: summaryLine,
      previewWidget: { type: built.type, props: built.props, objectSpec: widget.objectSpec },
      blocked: false,
      warning: null,
    })
    sendEvent({ type: 'text', text: summaryLine })
    return
  }

  const capNote = canPropose && roomLeft < 0
    ? '\n\n[안내] 위젯 개수 제한(12개)에 도달해 대시보드에는 추가하지 못했습니다 — 답변만 표시합니다.'
    : ''
  sendEvent({ type: 'component', name: built.type, props: built.props })
  sendEvent({ type: 'text', text: `${summaryLine}${capNote}` })
}
