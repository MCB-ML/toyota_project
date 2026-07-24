/**
 * Structural validator for SemanticQueryIR.
 *
 * Stack note: the spec (agentic_bi_design 요청서) asked for "JSON Schema +
 * Pydantic". This repo's runtime is Node.js/Express (server/rag-poc/*), not
 * Python/FastAPI — per the spec's own "기존 프로젝트 구조가 있으면 기존
 * 기술 스택을 우선 유지" rule, we keep the JSON Schema (schemas/semantic_query_ir.schema.json,
 * language-agnostic, also used by tests/) but implement the runtime-checked
 * equivalent of a Pydantic model as a hand-rolled validator here — this repo
 * has no existing zod/ajv dependency (server/dashboardValidation.js already
 * uses the same hand-rolled style), so we don't introduce one just for this.
 *
 * This file only checks IR *shape* (types, enums, required fields) — it does
 * NOT know whether a metric id actually exists in the registry. That's
 * SemanticQueryValidator's job (validator.js), which runs after this and
 * needs the loaded semantic model.
 */

const INTENTS = new Set([
  "single_value", "compare_metric", "breakdown_by_dimension",
  "trend_over_time", "ranking", "conversion_analysis",
  "composite_analysis", "detail_list",
]);

const FILTER_OPERATORS = new Set(["in", "not_in", "eq", "gte", "lte", "between"]);
const TIME_RANGE_TYPES = new Set(["relative", "absolute", "mtd", "ytd"]);
const TIME_UNITS = new Set(["day", "week", "month", "year"]);
const SORT_DIRECTIONS = new Set(["asc", "desc"]);
const OUTPUT_TYPES = new Set(["table", "chart", "table_and_chart", "single_value", "narrative"]);
const ID_PATTERN = /^[a-z][a-z0-9_]*$/;

function fail(errors, path, message) {
  errors.push({ path, message });
}

function validateFilter(f, idx, errors) {
  const path = `filters[${idx}]`;
  if (typeof f !== "object" || f === null) return fail(errors, path, "필터는 객체여야 함");
  if (!ID_PATTERN.test(f.dimension || "")) fail(errors, `${path}.dimension`, "등록되지 않은 형식의 dimension id");
  if (!FILTER_OPERATORS.has(f.operator)) fail(errors, `${path}.operator`, `operator는 ${[...FILTER_OPERATORS].join("|")} 중 하나여야 함`);
  if (!Array.isArray(f.values) || f.values.length === 0) fail(errors, `${path}.values`, "values는 비어있지 않은 배열이어야 함");
}

function validateTimeRange(tr, errors) {
  const path = "time_range";
  if (typeof tr !== "object" || tr === null) return fail(errors, path, "time_range는 필수 객체");
  if (!TIME_RANGE_TYPES.has(tr.type)) fail(errors, `${path}.type`, `type은 ${[...TIME_RANGE_TYPES].join("|")} 중 하나`);
  if (tr.type === "relative") {
    if (!Number.isInteger(tr.value)) fail(errors, `${path}.value`, "relative는 정수 value 필수");
    if (!TIME_UNITS.has(tr.unit)) fail(errors, `${path}.unit`, "relative는 unit 필수");
    if (tr.anchor_date !== "runtime_context") {
      fail(errors, `${path}.anchor_date`, "LLM이 날짜를 직접 계산해 넣으면 안 됨 — 'runtime_context' 리터럴만 허용 (time_semantics.yaml 참고)");
    }
  }
  if (tr.type === "absolute") {
    if (!tr.start_date || !tr.end_date) fail(errors, path, "absolute는 start_date/end_date 필수");
  }
}

/**
 * @param {unknown} ir
 * @returns {{ ok: boolean, errors: {path: string, message: string}[] }}
 */
function validateSemanticQueryIR(ir) {
  const errors = [];
  if (typeof ir !== "object" || ir === null) {
    return { ok: false, errors: [{ path: "$", message: "IR은 객체여야 함" }] };
  }

  if (!INTENTS.has(ir.intent)) fail(errors, "intent", `intent는 ${[...INTENTS].join("|")} 중 하나`);

  if (!Array.isArray(ir.metrics) || ir.metrics.length === 0) {
    fail(errors, "metrics", "metrics는 최소 1개 이상");
  } else {
    if (ir.metrics.length > 6) fail(errors, "metrics", "metrics는 최대 6개 (결과 크기/컴파일 복잡도 제한)");
    if (new Set(ir.metrics).size !== ir.metrics.length) fail(errors, "metrics", "동일 metric 중복 요청 금지");
    ir.metrics.forEach((m, i) => {
      if (!ID_PATTERN.test(m)) fail(errors, `metrics[${i}]`, "metric id 형식 오류(snake_case 필요)");
    });
  }

  const dimensions = ir.dimensions ?? [];
  if (!Array.isArray(dimensions)) fail(errors, "dimensions", "dimensions는 배열이어야 함");
  else dimensions.forEach((d, i) => {
    if (!ID_PATTERN.test(d)) fail(errors, `dimensions[${i}]`, "dimension id 형식 오류");
  });

  const filters = ir.filters ?? [];
  if (!Array.isArray(filters)) fail(errors, "filters", "filters는 배열이어야 함");
  else filters.forEach((f, i) => validateFilter(f, i, errors));

  validateTimeRange(ir.time_range, errors);

  const sort = ir.sort ?? [];
  if (!Array.isArray(sort)) fail(errors, "sort", "sort는 배열이어야 함");
  else sort.forEach((s, i) => {
    if (!s || typeof s.field !== "string") fail(errors, `sort[${i}].field`, "field 필수");
    if (!SORT_DIRECTIONS.has(s?.direction)) fail(errors, `sort[${i}].direction`, "asc|desc만 허용");
  });

  if (ir.limit !== undefined) {
    if (!Number.isInteger(ir.limit) || ir.limit < 1 || ir.limit > 500) {
      fail(errors, "limit", "limit은 1~500 사이 정수");
    }
  }

  if (ir.comparison != null) {
    const validTypes = new Set(["vs_previous_period", "vs_previous_year", "vs_target"]);
    if (!validTypes.has(ir.comparison.type)) fail(errors, "comparison.type", "지원되지 않는 comparison 유형");
  }

  if (ir.required_output !== undefined && !OUTPUT_TYPES.has(ir.required_output)) {
    fail(errors, "required_output", `${[...OUTPUT_TYPES].join("|")} 중 하나`);
  }

  if (ir.intent === "composite_analysis") {
    fail(errors, "intent", "composite_analysis는 AnalysisPlanner가 이미 단일 분석들로 쪼갰어야 함 — 이 단계까지 남아있으면 안 됨");
  }

  return { ok: errors.length === 0, errors };
}

module.exports = { validateSemanticQueryIR };
