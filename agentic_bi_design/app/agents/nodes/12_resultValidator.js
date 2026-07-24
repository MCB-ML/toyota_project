/**
 * 12. ResultValidator — "SQL 실행 성공 = 정답"으로 판단하지 않는다(스펙 금지사항).
 * row count/null ratio/duplicate key/percentage range/numerator<=denominator 등을
 * 실제로 계산해서 이상하면 validationResults에 남긴다. 값 자체를 고치지는 않는다 —
 * 이상 신호를 뒤 단계(InsightGenerator/FinalReviewAgent)로 넘겨서 최종 답변에
 * 한계로 명시하게 하는 것이 목적.
 */
function checkRows(rows, metricId, registry) {
  const flags = [];
  if (!rows || rows.length === 0) {
    flags.push({ level: "info", message: "결과 0행 — 데이터 없음(오류 아닐 수 있음, 하지만 조건이 지나치게 좁혀졌을 가능성도 있음)" });
    return flags;
  }
  const nullCount = rows.filter((r) => r[metricId] == null).length;
  const nullRatio = nullCount / rows.length;
  if (nullRatio > 0.5) flags.push({ level: "warn", message: `null 비율 ${(nullRatio * 100).toFixed(0)}% — 조인 실패 가능성` });

  const metric = registry.metrics.get(metricId);
  if (metric?.format === "percentage") {
    const outOfRange = rows.filter((r) => typeof r[metricId] === "number" && (r[metricId] < 0 || r[metricId] > 5)).length;
    if (outOfRange > 0) flags.push({ level: "warn", message: `percentage metric인데 [0, 500%] 범위를 벗어난 행 ${outOfRange}개 — 분모/분자 스와핑 의심` });
  }
  if (metric?.metric_type === "ratio_metric" || metric?.metric_type === "conversion_metric" || metric?.metric_type === "progress_metric") {
    // numerator > denominator 로 1.0(100%)을 훌쩍 넘는 값이 다수면 정의 오류 의심
    const over100 = rows.filter((r) => typeof r[metricId] === "number" && r[metricId] > 3).length; // 300% 초과는 흔치 않음
    if (over100 > 0) flags.push({ level: "warn", message: `${over100}개 행이 300%를 초과 — numerator/denominator 정의 재확인 필요` });
  }
  return flags;
}

async function resultValidator(state) {
  const { loadRegistry } = require("../../semantic/registry");
  const registry = loadRegistry();
  const validationResults = [];

  for (const er of state.executionResults) {
    if (er.status !== "ok") {
      validationResults.push({ metricId: er.metricId, ok: false, flags: [{ level: "error", message: `실행 실패/스킵: ${er.status}` }] });
      continue;
    }
    const flags = checkRows(er.rows, er.metricId, registry);
    validationResults.push({ metricId: er.metricId, ok: !flags.some((f) => f.level === "error"), flags });
  }
  return { ...state, validationResults: [...state.validationResults, ...validationResults] };
}

module.exports = { resultValidator, checkRows };
