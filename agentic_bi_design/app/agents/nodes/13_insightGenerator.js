/**
 * 13. InsightGenerator — executionResults + validationResults를 바탕으로 자연어
 * 인사이트를 만든다. LLM 호출 지점. 원칙: ResultValidator가 warn/error 플래그를
 * 남긴 metric에 대해서는 그 한계를 인사이트 문장에 그대로 노출해야 한다(수치를
 * 검증 없이 확신에 찬 어조로 서술하지 않음 — FinalReviewAgent가 이를 다시 체크).
 */
async function insightGenerator(state, { llmClient } = {}) {
  const insights = [];
  for (const vr of state.validationResults) {
    if (!vr.metricId) continue; // SemanticQueryValidator 결과와 섞여 있으므로 metricId 있는 것만
    const warnings = (vr.flags || []).filter((f) => f.level !== "info");
    insights.push({
      metricId: vr.metricId,
      // TODO(연결 지점): llmClient.summarize(executionResults, vr)
      text: warnings.length
        ? `${vr.metricId}: 값 확인됨 (주의: ${warnings.map((w) => w.message).join("; ")})`
        : `${vr.metricId}: 값 확인됨`,
      caveats: warnings.map((w) => w.message),
    });
  }
  return { ...state, insights: [...state.insights, ...insights] };
}

module.exports = { insightGenerator };
