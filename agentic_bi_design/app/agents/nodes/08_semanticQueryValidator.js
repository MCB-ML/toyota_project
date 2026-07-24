/**
 * 8. SemanticQueryValidator — 실제 구현체(app/semantic/ir_schema.js +
 * app/semantic/validator.js)를 그대로 호출한다. 이 노드는 얇은 래퍼일 뿐 검증
 * 로직 자체는 P2에서 이미 구현·테스트 완료된 것을 재사용한다.
 */
const { validateSemanticQueryIR } = require("../../semantic/ir_schema");
const { validateSemanticQuery } = require("../../semantic/validator");

async function semanticQueryValidator(state) {
  const validationResults = [];
  for (const ir of state.semanticQueries) {
    const structural = validateSemanticQueryIR(ir);
    if (!structural.ok) {
      validationResults.push({ ir, ok: false, stage: "structural", errors: structural.errors });
      continue;
    }
    const semantic = validateSemanticQuery(ir, {
      userContext: state.userContext,
      authorizationScope: state.authorizationScope,
    });
    validationResults.push({ ir, ok: semantic.ok, stage: "semantic", errors: semantic.errors });
  }
  const errors = validationResults
    .filter((v) => !v.ok)
    .map((v) => ({ node: "SemanticQueryValidator", message: JSON.stringify(v.errors) }));
  return { ...state, validationResults: [...state.validationResults, ...validationResults], errors: [...state.errors, ...errors] };
}

module.exports = { semanticQueryValidator };
