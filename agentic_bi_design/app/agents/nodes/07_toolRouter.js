/**
 * 7. ToolRouter — analysisPlan의 각 planned 단계를 실행 도구로 배정한다.
 * 이 워크북 범위에서는 사실상 전부 sql_tool(semantic compiler) 대상이고,
 * python_analysis_tool/예측 모델은 P7(확장 단계)에서 붙는다 — 지금은 라우팅
 * 로직만 두고 실제 Python 실행기는 연결하지 않는다(스펙 12단계 우선순위 P7).
 */
const TOOL_SQL = "sql_tool";
const TOOL_PYTHON = "python_analysis_tool";
const TOOL_UNSUPPORTED = "unsupported";

async function toolRouter(state) {
  const analysisPlan = state.analysisPlan.map((step) => {
    if (step.status === "unsupported") return { ...step, tool: TOOL_UNSUPPORTED };
    if (step.metric_hint) return { ...step, tool: TOOL_SQL };
    return { ...step, tool: TOOL_SQL }; // v1 스켈레톤 기본값 — 확장 시 랭킹/트렌드 등은 python_analysis_tool로 분기
  });
  return { ...state, analysisPlan };
}

module.exports = { toolRouter, TOOL_SQL, TOOL_PYTHON, TOOL_UNSUPPORTED };
