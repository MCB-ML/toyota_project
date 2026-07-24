/**
 * 4. MetricDimensionResolver — OntologyResolver가 찾은 Entity/용어를 실제
 * semantic/metrics/*.yaml의 metric id, semantic/dimensions.yaml의 dimension id로
 * 좁힌다. LLM이 자유 텍스트로 metric 이름을 지어내지 않도록, 후보 목록(registry에
 * 실재하는 id들)만 LLM에게 enum으로 제시하고 그중에서 고르게 하는 게 핵심 —
 * (기존 dashboardTools.js의 buildDashboardTools() enum 파라미터 패턴과 동일 원칙).
 */
const { loadRegistry } = require("../../semantic/registry");

async function metricDimensionResolver(state, { llmClient } = {}) {
  const registry = loadRegistry();
  const metricCandidates = [...registry.metrics.values()]
    .filter((m) => m.status !== "unresolved" && m.expression !== "unresolved")
    .map((m) => ({ id: m.id, name_ko: m.name_ko }));
  const dimensionCandidates = [...registry.dimensions.values()].map((d) => ({ id: d.id, name_ko: d.label_ko }));

  // TODO(연결 지점): llmClient.pickMetricsAndDimensions(question, metricCandidates, dimensionCandidates)
  // v1 스켈레톤은 후보 목록만 state에 실어 다음 노드(AmbiguityDetector)가 판단하게 한다.
  return {
    ...state,
    resolvedMetrics: state.resolvedMetrics,
    resolvedDimensions: state.resolvedDimensions,
    _metricCandidates: metricCandidates, // 내부 스크래치 필드 — 최종 AgentState 스키마에는 포함하지 않음
    _dimensionCandidates: dimensionCandidates,
  };
}

module.exports = { metricDimensionResolver };
