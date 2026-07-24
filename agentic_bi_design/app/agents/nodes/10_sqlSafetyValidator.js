/**
 * 10. SQLSafetyValidator — P8 SQL Safety 체크리스트를 compiledQueries에 적용.
 * compiler.js가 이미 "등록된 테이블/조인/필터만" 사용하도록 보장하지만(컴파일 자체가
 * 실패하면 여기까지 오지 않음), 그와 별개로 실행 직전 마지막 방어선으로 구조적
 * 검사를 한 번 더 한다 — SQL Compiler와 SQL Safety Validator를 분리하라는 요구사항
 * (완료 기준 체크리스트) 때문에 의도적으로 별도 단계로 둔다.
 */
const FORBIDDEN_KEYWORDS = /\b(INSERT|UPDATE|DELETE|MERGE|DROP|ALTER|CREATE|EXEC|EXECUTE|TRUNCATE)\b/i;
const MAX_ROWS = 500;

function assertReadOnlySingleStatement(sql) {
  if (FORBIDDEN_KEYWORDS.test(sql)) return "DML/DDL 키워드 포함 — SELECT/WITH...SELECT만 허용";
  if (sql.includes(";") && sql.trim().indexOf(";") !== sql.trim().length - 1) return "세미콜론으로 구분된 다중 쿼리로 보임";
  if (!/^\s*(SELECT|WITH)/i.test(sql)) return "SELECT 또는 WITH로 시작하지 않음";
  return null;
}

async function sqlSafetyValidator(state) {
  const errors = [];
  const safeQueries = [];
  for (const cq of state.compiledQueries) {
    const violation = assertReadOnlySingleStatement(cq.sql);
    if (violation) {
      errors.push({ node: "SQLSafetyValidator", message: `${cq.metricId}: ${violation}` });
      continue;
    }
    safeQueries.push({ ...cq, limit: MAX_ROWS, timeoutMs: 30000 });
  }
  return { ...state, compiledQueries: safeQueries, errors: [...state.errors, ...errors] };
}

module.exports = { sqlSafetyValidator, assertReadOnlySingleStatement };
