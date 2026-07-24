/**
 * 11. QueryExecutor — 실제 Fabric SQL 웨어하우스 실행부. 이 저장소는 이미
 * 검증된 커넥션 클라이언트(server/rag-poc의 fabricClient류)를 갖고 있으므로 이
 * 스켈레톤은 그 클라이언트를 주입받아 얇게 감싸기만 한다 — 새 커넥션 로직을
 * 만들지 않는다([[feedback_deploy_server_sync]] 원칙: 기존 인프라 재사용).
 */
async function queryExecutor(state, { fabricClient } = {}) {
  const executionResults = [];
  const errors = [];

  for (const cq of state.compiledQueries) {
    if (!fabricClient) {
      executionResults.push({ metricId: cq.metricId, rows: null, status: "skipped_no_client" });
      continue;
    }
    try {
      const rows = await fabricClient.query(cq.sql, cq.params, { timeoutMs: cq.timeoutMs, maxRows: cq.limit });
      executionResults.push({ metricId: cq.metricId, rows, status: "ok" });
    } catch (e) {
      errors.push({ node: "QueryExecutor", message: `${cq.metricId}: ${e.message}` });
      executionResults.push({ metricId: cq.metricId, rows: null, status: "error", error: e.message });
    }
  }
  return { ...state, executionResults: [...state.executionResults, ...executionResults], errors: [...state.errors, ...errors] };
}

module.exports = { queryExecutor };
