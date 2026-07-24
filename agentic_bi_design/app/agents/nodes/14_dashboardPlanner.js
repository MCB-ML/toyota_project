/**
 * 14. DashboardPlanner — app/dashboard/planner.js의 planDashboard()를 그대로 호출.
 */
const { planDashboard } = require("../../dashboard/planner");

async function dashboardPlanner(state) {
  if (state.compiledQueries.length === 0) return state; // 시각화할 게 없으면(단일 서술형 답변 등) 스킵
  const dashboardIr = planDashboard({
    dashboardId: `dash_${state.requestId}`,
    title: state.normalizedQuestion || state.userQuestion,
    compiledQueries: state.compiledQueries,
    executionResults: state.executionResults,
  });
  return { ...state, dashboardIr };
}

module.exports = { dashboardPlanner };
