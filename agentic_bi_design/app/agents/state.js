/**
 * AgentState — plain-object state passed through the node pipeline
 * (graph.js). No Pydantic in this stack (Node.js, not FastAPI — see
 * agentic_bi_design/docs/final_report.md 8절 스택 결정 근거); this is the
 * JS-idiomatic equivalent: a factory that fixes the shape + a runtime
 * shape-check, used the same way Pydantic validation would be.
 */

/**
 * @typedef {object} AgentState
 * @property {string} requestId
 * @property {string} currentDate - "YYYY-MM-DD", injected once at request start.
 *   Every node MUST read time from here, never from `new Date()` directly —
 *   see semantic/time_semantics.yaml relative_date_resolution_policy.
 * @property {string} userQuestion
 * @property {string|null} normalizedQuestion
 * @property {object} userContext
 * @property {{dealerScope: string[]|null, brandScope: string[]|null}|null} authorizationScope
 * @property {object[]} resolvedEntities
 * @property {string[]} resolvedMetrics
 * @property {string[]} resolvedDimensions
 * @property {object[]} ambiguities
 * @property {object[]} analysisPlan - AnalysisPlanner가 분해한 단계 목록
 * @property {object[]} semanticQueries - SemanticQueryIR 목록 (analysisPlan 1단계당 1개 이상)
 * @property {object[]} compiledQueries - {sql, params, metricId} 목록
 * @property {object[]} executionResults - 실행 결과 rows 목록
 * @property {object[]} validationResults - ResultValidator 출력 목록
 * @property {object[]} insights
 * @property {object|null} dashboardIr
 * @property {string|null} finalAnswer
 * @property {number} retryCount
 * @property {{node: string, message: string}[]} errors
 */

function createAgentState({ requestId, currentDate, userQuestion, userContext = {}, authorizationScope = null }) {
  if (!requestId || !currentDate || !userQuestion) {
    throw new Error("createAgentState: requestId, currentDate, userQuestion는 필수");
  }
  return {
    requestId,
    currentDate,
    userQuestion,
    normalizedQuestion: null,
    userContext,
    authorizationScope,

    resolvedEntities: [],
    resolvedMetrics: [],
    resolvedDimensions: [],
    ambiguities: [],

    analysisPlan: [],
    semanticQueries: [],
    compiledQueries: [],
    executionResults: [],
    validationResults: [],

    insights: [],
    dashboardIr: null,
    finalAnswer: null,

    retryCount: 0,
    errors: [],
  };
}

module.exports = { createAgentState };
