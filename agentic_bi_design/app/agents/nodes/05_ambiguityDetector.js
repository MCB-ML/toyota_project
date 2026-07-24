/**
 * 5. AmbiguityDetector — 확정할 수 없는 지점을 명시적으로 골라낸다.
 * 예: "출고"가 delivery_mtd_actual인지 delivery_ytd_actual인지 기간이 안 잡힘,
 * "딜러사"가 dealer 이름 후보 여러 개와 매칭됨(전시장 vs 딜러 혼동) 등.
 * 여기서 감지된 ambiguity는 FinalReviewAgent 이전 어디서든 사용자에게 되물을 수 있게
 * state.ambiguities에 쌓아둔다 — 조용히 임의로 하나를 골라버리지 않는다.
 */
async function ambiguityDetector(state) {
  const ambiguities = [];
  if ((state._metricCandidates || []).length > 1 && state.resolvedMetrics.length === 0) {
    ambiguities.push({
      type: "unresolved_metric_selection",
      message: "질문에서 어떤 metric을 원하는지 아직 확정되지 않음 — MetricDimensionResolver가 LLM 연결 전 상태",
    });
  }
  if (!/\d{4}|이번\s?달|당월|올해|연누적|최근/.test(state.normalizedQuestion || state.userQuestion)) {
    ambiguities.push({ type: "unclear_time_range", message: "질문에 명시적 기간 표현이 없음 — 기본값(당월)을 쓸지 되물을지 결정 필요" });
  }
  return { ...state, ambiguities: [...state.ambiguities, ...ambiguities] };
}

module.exports = { ambiguityDetector };
