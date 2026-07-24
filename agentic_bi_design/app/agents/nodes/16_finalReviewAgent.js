/**
 * 16. FinalReviewAgent — 마지막 관문. 스펙 10단계(Semantic/SQL/Result/Visualization
 * Validation)의 네 관점을 최종적으로 재확인하고 finalAnswer를 조립한다.
 * 여기서 새로운 검증 로직을 만들지 않는다 — 앞 노드들이 이미 쌓아둔
 * state.errors / state.validationResults / state.ambiguities를 종합 판단만 한다
 * (검증 로직 중복 방지, 단일 소스: 각 담당 노드).
 */
async function finalReviewAgent(state, { llmClient } = {}) {
  const hardErrors = state.errors.filter((e) => e.node !== "ResultValidator"); // ResultValidator는 warn 위주라 별도 취급
  const unsupportedSteps = state.analysisPlan.filter((s) => s.status === "unsupported");

  const limitations = [
    ...state.ambiguities.map((a) => a.message),
    ...unsupportedSteps.map((s) => `"${s.description}" 단계는 데이터 부족으로 수행하지 못함: ${s.reason}`),
    ...state.insights.flatMap((i) => i.caveats || []),
  ];

  if (hardErrors.length > 0) {
    return {
      ...state,
      finalAnswer: null,
      errors: [...state.errors, { node: "FinalReviewAgent", message: "복구 불가능한 오류로 답변 생성 중단" }],
    };
  }

  // TODO(연결 지점): llmClient.composeFinalAnswer(insights, limitations, dashboardIr)
  const body = state.insights.map((i) => `- ${i.text}`).join("\n");
  const limitationsBlock = limitations.length ? `\n\n[한계]\n${limitations.map((l) => `- ${l}`).join("\n")}` : "";
  const finalAnswer = `${body}${limitationsBlock}`;

  return { ...state, finalAnswer };
}

module.exports = { finalReviewAgent };
