/**
 * 15. DashboardIRValidator — app/dashboard/schemas.js의 validateDashboardIr()를
 * 호출. 실패하면 dashboardIr을 null로 되돌리고 narrative-only 답변으로 강등한다
 * (깨진 대시보드를 화면에 내보내는 것보다 텍스트 답변만 주는 게 안전).
 */
const { validateDashboardIr } = require("../../dashboard/schemas");

async function dashboardIrValidator(state) {
  if (!state.dashboardIr) return state;

  const result = validateDashboardIr(state.dashboardIr, {
    compiledQueryIds: state.compiledQueries.map((q) => q.metricId),
    executionResults: state.executionResults,
  });

  if (result.ok) return state;

  return {
    ...state,
    dashboardIr: null,
    errors: [...state.errors, { node: "DashboardIRValidator", message: JSON.stringify(result.errors) }],
  };
}

module.exports = { dashboardIrValidator };
