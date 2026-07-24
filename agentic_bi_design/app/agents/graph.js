/**
 * Agentic Analytics Workflow — explicit state machine (LangGraph is
 * Python-only; this repo's runtime is Node.js, so per the spec's own
 * "기존 기술 스택 우선" rule we implement the same 16-node pipeline as a
 * plain sequential runner over AgentState. Each node is a pure-ish async
 * function (state, deps) => partialState, matching LangGraph's node
 * contract closely enough that porting later is mechanical if this ever
 * needs real graph branching/cycles beyond what's here.
 *
 * Branching implemented:
 *   - AmbiguityDetector found blocking ambiguities -> short-circuit, return
 *     to caller for a clarifying question (never guess).
 *   - SQLSafetyValidator/SemanticQueryValidator produced hard errors ->
 *     skip execution, go straight to FinalReviewAgent (which will refuse
 *     to answer rather than show partial/wrong data).
 */
const { questionNormalizer } = require("./nodes/01_questionNormalizer");
const { intentClassifier } = require("./nodes/02_intentClassifier");
const { ontologyResolver } = require("./nodes/03_ontologyResolver");
const { metricDimensionResolver } = require("./nodes/04_metricDimensionResolver");
const { ambiguityDetector } = require("./nodes/05_ambiguityDetector");
const { analysisPlanner } = require("./nodes/06_analysisPlanner");
const { toolRouter } = require("./nodes/07_toolRouter");
const { semanticQueryValidator } = require("./nodes/08_semanticQueryValidator");
const { sqlCompiler } = require("./nodes/09_sqlCompiler");
const { sqlSafetyValidator } = require("./nodes/10_sqlSafetyValidator");
const { queryExecutor } = require("./nodes/11_queryExecutor");
const { resultValidator } = require("./nodes/12_resultValidator");
const { insightGenerator } = require("./nodes/13_insightGenerator");
const { dashboardPlanner } = require("./nodes/14_dashboardPlanner");
const { dashboardIrValidator } = require("./nodes/15_dashboardIrValidator");
const { finalReviewAgent } = require("./nodes/16_finalReviewAgent");

const BLOCKING_AMBIGUITY_TYPES = new Set(["unresolved_metric_selection"]);

/**
 * @param {import("./state").AgentState} initialState
 * @param {object} deps - { llmClient, fabricClient } 등 노드에 주입할 외부 클라이언트
 * @returns {Promise<{state: import("./state").AgentState, haltedAt: string|null}>}
 */
async function runAgentGraph(initialState, deps = {}) {
  let state = initialState;

  state = await questionNormalizer(state, deps);
  state = await intentClassifier(state, deps);
  state = await ontologyResolver(state, deps);
  state = await metricDimensionResolver(state, deps);
  state = await ambiguityDetector(state, deps);

  const blocking = state.ambiguities.filter((a) => BLOCKING_AMBIGUITY_TYPES.has(a.type));
  if (blocking.length > 0) {
    return { state, haltedAt: "AmbiguityDetector" };
  }

  state = await analysisPlanner(state, deps);
  state = await toolRouter(state, deps);

  // ToolRouter가 만든 계획을 SemanticQueryIR로 변환하는 단계는 LLM 연결 지점 —
  // v1 스켈레톤은 semanticQueries가 이미 채워져 있다고 가정(테스트/통합 시 주입).
  // 실제 구현에서는 여기서 llmClient로 각 analysisPlan 단계를 IR로 채운다.

  state = await semanticQueryValidator(state, deps);
  const hasValidQuery = state.validationResults.some((v) => v.ok && v.ir);
  if (!hasValidQuery && state.semanticQueries.length > 0) {
    state = await finalReviewAgent(state, deps);
    return { state, haltedAt: "SemanticQueryValidator" };
  }

  state = await sqlCompiler(state, deps);
  state = await sqlSafetyValidator(state, deps);
  state = await queryExecutor(state, deps);
  state = await resultValidator(state, deps);
  state = await insightGenerator(state, deps);
  state = await dashboardPlanner(state, deps);
  state = await dashboardIrValidator(state, deps);
  state = await finalReviewAgent(state, deps);

  return { state, haltedAt: null };
}

module.exports = { runAgentGraph };
