/**
 * 1. QuestionNormalizer — 오타/구어체/줄임말을 정리하고, 도메인 약어를
 * business_vocabulary.yaml 기준으로 힌트만 붙인다(치환하지 않음 — 원문 의미를
 * LLM 단계에서 잃지 않기 위해, 기존 RAG 파이프라인 Stage 0의 "용어집 주입" 방식과
 * 동일 원칙: [[project_text2sql_rag_poc]]).
 *
 * LLM 호출 지점 표시만 해둔다 — 실제 프롬프트/모델 연결은 기존 server/rag-poc/stages/
 * structure.js의 LLM 클라이언트 설정을 재사용할 것.
 */
async function questionNormalizer(state, { llmClient } = {}) {
  const trimmed = state.userQuestion.trim().replace(/\s+/g, " ");

  // TODO(연결 지점): llmClient가 주어지면 문법 정리 + 오타 교정만 수행하는 LLM 호출.
  // 반드시 "의미를 바꾸지 않는다"는 제약을 시스템 프롬프트에 명시할 것 — 여기서
  // 자연어를 재작성하며 엔터티/숫자/기간을 실수로 바꾸는 것이 흔한 실패 모드.
  const normalized = llmClient ? await llmClient.normalize(trimmed) : trimmed;

  return { ...state, normalizedQuestion: normalized };
}

module.exports = { questionNormalizer };
