/**
 * 2. IntentClassifier — 질문 하나가 단일 분석인지 복합 분석인지, 어떤 SemanticQueryIR.intent
 * (single_value/compare_metric/breakdown_by_dimension/trend_over_time/ranking/
 * conversion_analysis/composite_analysis/detail_list) 후보인지 1차 분류.
 * composite_analysis로 분류되면 AnalysisPlanner(6번)가 반드시 여러 개로 쪼갠다 —
 * composite_analysis가 최종 SemanticQueryIR로 남는 것은 검증 실패(ir_schema.js 참고).
 */
async function intentClassifier(state, { llmClient } = {}) {
  // TODO(연결 지점): LLM 분류 호출. 최소 스켈레톤은 키워드 휴리스틱만 둔다.
  const q = state.normalizedQuestion || state.userQuestion;
  let intent = "single_value";
  if (/그리고|또한|원인|이유/.test(q)) intent = "composite_analysis";
  else if (/추이|트렌드|월별|추세/.test(q)) intent = "trend_over_time";
  else if (/랭킹|순위|top|가장/.test(q)) intent = "ranking";
  else if (/전환율|전환률/.test(q)) intent = "conversion_analysis";
  else if (/비교/.test(q)) intent = "compare_metric";
  else if (/목록|리스트|상세/.test(q)) intent = "detail_list";
  else if (/딜러별|SC별|전시장별|부서별|모델별/.test(q)) intent = "breakdown_by_dimension";

  return { ...state, resolvedEntities: [...state.resolvedEntities, { type: "intent", value: intent }] };
}

module.exports = { intentClassifier };
