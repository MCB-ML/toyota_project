/**
 * 6. AnalysisPlanner — composite_analysis 질문을 단일 분석 단계들로 분해한다.
 * 스펙 예시("목표 미달 위험 딜러 찾고 원인 분석") 그대로 구현: 각 단계는 이후
 * ToolRouter가 SemanticQueryIR 1개(또는 Python 분석 1개)로 컴파일할 수 있는
 * 크기여야 한다. 데이터가 없는 단계는 "수행한 척" 하지 않고 unsupported로 표시한다
 * (스펙 7단계 명시 요구사항).
 */
async function analysisPlanner(state) {
  const isComposite = state.resolvedEntities.some((e) => e.type === "intent" && e.value === "composite_analysis");
  if (!isComposite) {
    return {
      ...state,
      analysisPlan: [{ step: 1, description: state.normalizedQuestion || state.userQuestion, status: "planned" }],
    };
  }

  // TODO(연결 지점): LLM이 실제 단계를 생성. v1 스켈레톤은 스펙 예시 템플릿만 재현.
  const analysisPlan = [
    { step: 1, description: "딜러별 목표 달성률 계산", status: "planned", metric_hint: "delivery_mtd_achievement_rate" },
    { step: 2, description: "목표 미달 위험 딜러 식별", status: "planned", depends_on: [1] },
    { step: 3, description: "계약 실적과 목표 차이 계산", status: "planned", metric_hint: "contract_mtd_achievement_rate" },
    { step: 4, description: "출고·재고 관련 데이터 존재 여부 확인", status: "unsupported", reason: "재고(inventory) 관련 팩트 테이블이 이번 워크북 범위에 없음 — ontology 미확정" },
    { step: 5, description: "원인별 기여도 분석", status: "unsupported", reason: "4번이 unsupported이므로 원인 비교가 불완전함을 최종 답변에 명시해야 함" },
    { step: 6, description: "추천 시각화 결정", status: "planned", depends_on: [1, 2, 3] },
    { step: 7, description: "근거와 한계를 포함한 답변 생성", status: "planned", depends_on: [1, 2, 3, 4, 5, 6] },
  ];
  return { ...state, analysisPlan };
}

module.exports = { analysisPlanner };
