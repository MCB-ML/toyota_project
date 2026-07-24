// Tool schema for the "pick a SemanticQueryIR" LLM step — same style as
// server/rag-poc/ragTools.js buildStructureTool(): enum-constrained fields
// only, so the LLM can never invent a metric/dimension id that doesn't
// exist in the registry (app/semantic/validator.js still re-checks this
// server-side — the enum is a UX/accuracy aid, not the safety boundary).
import { loadRegistry } from './app/semantic/registry.js'

function isAtomicallyCompilable(m) {
  if (!m) return false
  // controlled_analysis: true는 compileSingleMetricQuery로는 못 만들지만(2단계 집계 등)
  // agenticBiPipeline.js에 전용 컴파일러가 등록되어 있는 metric — not_directly_compilable이어도 후보에 남긴다.
  if (m.controlled_analysis) return true
  return !m.not_directly_compilable && m.status !== 'unresolved' && m.expression !== 'unresolved' && m.metric_filter !== 'unresolved'
}

// 컴파일 가능한 metric만 후보로 노출한다 — not_directly_compilable/unresolved는
// LLM이 골라도 어차피 컴파일 단계에서 거부되므로 애초에 고를 수 없게 막는다.
// ratio/conversion/progress_metric은 자기 자신의 base_table/expression이 없지만(분자·분모를
// 별도 metric으로 명시하는 설계 원칙 — agentic_bi_design 최종 보고서 4절), 분자·분모가 각각
// 원자적으로 컴파일 가능하면 agenticBiPipeline.js가 둘을 따로 실행해 나눗셈으로 조합하므로
// 후보에 포함한다("Text2SQL + 가공" 원칙).
export function listCompilableMetrics() {
  const registry = loadRegistry()
  return [...registry.metrics.values()].filter((m) => {
    if (['ratio_metric', 'conversion_metric', 'progress_metric'].includes(m.metric_type)) {
      return isAtomicallyCompilable(registry.metrics.get(m.numerator_metric)) && isAtomicallyCompilable(registry.metrics.get(m.denominator_metric))
    }
    return isAtomicallyCompilable(m)
  })
}

export function renderMetricCatalogForPrompt() {
  const metrics = listCompilableMetrics()
  return metrics.map((m) => `- ${m.id}: ${m.name_ko}${m.description ? ` — ${m.description}` : ''}`).join('\n')
}

export function renderDimensionCatalogForPrompt() {
  const registry = loadRegistry()
  return [...registry.dimensions.values()].map((d) => {
    const knownValues = Array.isArray(d.known_values) ? ` — 실제 DB 값: [${d.known_values.join(', ')}] (이 표기 그대로 써야 함, 한글로 번역/의역 금지)` : ''
    return `- ${d.id}: ${d.label_ko}${knownValues}`
  }).join('\n')
}

export function buildAgenticBiTool() {
  const metricIds = listCompilableMetrics().map((m) => m.id)
  const registry = loadRegistry()
  const dimensionIds = [...registry.dimensions.keys()]

  return [
    {
      type: 'function',
      function: {
        name: 'pick_semantic_query',
        description: '사용자 질문을 등록된 Metric/Dimension/Filter/기간으로 변환합니다. 목록에 없는 값은 절대 지어내지 마세요.',
        parameters: {
          type: 'object',
          properties: {
            answerable: { type: 'boolean', description: '이 질문이 아래 Metric 목록만으로 답변 가능한지. 불가능하면 false + reason만 채우세요.' },
            reason_if_unanswerable: { type: 'string', description: 'answerable=false일 때만: 왜 답할 수 없는지(예: 해당 지표 없음, 질문이 모호함)' },
            metric_id: { type: 'string', enum: metricIds, description: '질문에 가장 맞는 metric 1개' },
            dimension_id: { type: 'string', enum: [...dimensionIds, 'none'], description: 'breakdown 기준 차원. 없으면 "none"' },
            time_range_type: {
              type: 'string',
              enum: ['mtd', 'ytd', 'relative', 'absolute'],
              description: `mtd="이번 달"(오늘이 속한 달, 월초~오늘) / ytd="올해"(오늘이 속한 연도, 연초~오늘) — 둘 다 항상 오늘 날짜 기준이며 과거 연도에는 쓸 수 없다. 사용자가 특정 연도·월을 명시하면(예: "2025년", "2025년 12월", 올해가 아닌 연도) 반드시 absolute를 쓰고 absolute_start_date/absolute_end_date를 채울 것 — "N년 M월 연누적"은 그 해 1월 1일부터 그 달 말일까지.`,
            },
            relative_value: { type: 'integer', description: 'time_range_type=relative일 때만: 숫자(예: 최근 6개월 -> 6)' },
            relative_unit: { type: 'string', enum: ['day', 'week', 'month', 'year'], description: 'time_range_type=relative일 때만' },
            absolute_start_date: { type: 'string', description: 'time_range_type=absolute일 때만, YYYY-MM-DD' },
            absolute_end_date: { type: 'string', description: 'time_range_type=absolute일 때만, YYYY-MM-DD' },
            filters: {
              type: 'array',
              description: '질문에 실제로 언급된 필터만. 언급 안 됐으면 빈 배열.',
              items: {
                type: 'object',
                properties: {
                  dimension: { type: 'string', enum: dimensionIds },
                  values: { type: 'array', items: { type: 'string' } },
                },
                required: ['dimension', 'values'],
              },
            },
            sort_desc: { type: 'boolean', description: 'dimension_id가 있고 사용자가 랭킹/정렬을 원하면 true' },
          },
          required: ['answerable'],
        },
      },
    },
  ]
}
