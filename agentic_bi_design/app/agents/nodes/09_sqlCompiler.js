/**
 * 9. SQLCompiler — app/semantic/compiler.js의 compileSingleMetricQuery()를 그대로
 * 호출한다. 여러 metric을 요청한 IR은 metric별로 나눠 각각 컴파일한다(스펙의
 * "가공" 원칙 — orchestration 레이어가 여러 컴파일 결과를 나중에 합침).
 */
const { compileSingleMetricQuery, CompileError } = require("../../semantic/compiler");

async function sqlCompiler(state) {
  const compiledQueries = [];
  const errors = [];

  for (const validated of state.validationResults) {
    if (!validated.ok) continue;
    const ir = validated.ir;
    for (const metricId of ir.metrics) {
      const singleMetricIr = { ...ir, metrics: [metricId] };
      try {
        const compiled = compileSingleMetricQuery(singleMetricIr, { currentDate: state.currentDate });
        compiledQueries.push({ ...compiled, sourceIr: singleMetricIr });
      } catch (e) {
        if (e instanceof CompileError) {
          errors.push({ node: "SQLCompiler", message: `${e.code}: ${e.message}` });
        } else {
          throw e;
        }
      }
    }
  }
  return { ...state, compiledQueries: [...state.compiledQueries, ...compiledQueries], errors: [...state.errors, ...errors] };
}

module.exports = { sqlCompiler };
