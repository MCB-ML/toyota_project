/**
 * SemanticQueryValidator — registry-aware checks, runs AFTER ir_schema.js's
 * pure structural validation passes. This is the "does it actually make
 * sense against what we know exists" layer (P6 SemanticQueryValidator node).
 */
const { loadRegistry } = require("./registry");

const MAX_RESULT_ROWS = 500;

function checkMetricsExist(ir, registry, errors) {
  for (const metricId of ir.metrics) {
    if (!registry.metrics.has(metricId)) {
      errors.push({ code: "unknown_metric", path: `metrics`, message: `등록되지 않은 metric: ${metricId}` });
    }
  }
}

function checkDimensionsExist(ir, registry, errors) {
  for (const dimId of ir.dimensions || []) {
    if (!registry.dimensions.has(dimId)) {
      errors.push({ code: "unknown_dimension", path: "dimensions", message: `등록되지 않은 dimension: ${dimId}` });
    }
  }
}

function checkFilterDimensionsExist(ir, registry, errors) {
  for (const f of ir.filters || []) {
    if (!registry.dimensions.has(f.dimension)) {
      errors.push({ code: "unknown_filter_dimension", path: "filters", message: `등록되지 않은 filter dimension: ${f.dimension}` });
    }
  }
}

/**
 * Grain compatibility: 요청한 dimension이 metric.grain(정의된 breakdown 축)에
 * 포함되는지, 또는 metric.dimensions 화이트리스트에 있는지 확인한다.
 * (완전한 grain 대수는 아니지만, "매출 MTD 지표에 vehicle_model 없이 갑자기
 * lead_key로 쪼개려는" 류의 명백한 grain 충돌은 잡아낸다.)
 */
function checkGrainCompatibility(ir, registry, errors) {
  for (const metricId of ir.metrics) {
    const metric = registry.metrics.get(metricId);
    if (!metric) continue; // already reported by checkMetricsExist
    const allowed = new Set(metric.dimensions || []);
    for (const dimId of ir.dimensions || []) {
      if (allowed.size > 0 && !allowed.has(dimId)) {
        errors.push({
          code: "grain_incompatible",
          path: "dimensions",
          message: `metric '${metricId}'은 dimension '${dimId}'로 breakdown이 등록되어 있지 않음 (metric.dimensions: [${[...allowed].join(", ")}])`,
        });
      }
    }
  }
}

/**
 * Join path validity: metric이 필요로 하는 dimension까지 도달하는 등록된
 * join_id가 joins.yaml에 있는지 확인. 이 draft 버전은 "동일 entity 계열
 * dimension이면 통과"로 단순화되어 있다 — 실제 그래프 탐색(BFS over joins.yaml)은
 * TODO, 지금은 존재 여부만 체크.
 */
function checkJoinPathExists(ir, registry, errors) {
  if (registry.joins.size === 0) {
    errors.push({ code: "no_joins_registered", path: "$", message: "joins.yaml이 비어있음 — 컴파일 불가" });
  }
  // TODO(P3 완성 시): metric.fact_entity -> dimension.entity 까지의 실제 BFS 경로 탐색
}

function checkRequiredFiltersPresent(ir, registry, errors) {
  for (const metricId of ir.metrics) {
    const metric = registry.metrics.get(metricId);
    if (!metric) continue;
    for (const ruleId of metric.required_filters || []) {
      if (ruleId === "unresolved") continue;
      if (!registry.filters.has(ruleId)) {
        errors.push({ code: "missing_filter_rule", path: "metrics", message: `metric '${metricId}'이 참조하는 filter rule '${ruleId}'이 filters.yaml에 없음` });
      }
      // 참고: required_filters는 IR에 사용자가 "명시"해야 하는 필터가 아니라
      // 컴파일러가 항상 자동 주입해야 하는 필터다 — 여기서는 등록 여부만 검증한다.
    }
  }
}

/**
 * authorization_scope 예시 형태: { dealerScope: string[] | null, brandScope: string[] | null }
 * security_policies.yaml의 row_level_dealer_access가 unresolved이므로,
 * 이 함수는 "제한이 있다고 주장된 경우에만" 검사하고, 없으면 그냥 통과시킨다 —
 * 없는 정책을 있다고 지어내지 않는다는 원칙 유지.
 */
function checkAuthorizationScope(ir, userContext, authorizationScope, errors) {
  if (!authorizationScope || authorizationScope.dealerScope == null) return; // 제한 없음 — 현재 확정된 정책 없음
  const dealerFilter = (ir.filters || []).find((f) => f.dimension === "dealer");
  const requested = dealerFilter ? dealerFilter.values : null;
  if (requested) {
    const allowed = new Set(authorizationScope.dealerScope);
    const forbidden = requested.filter((v) => !allowed.has(v));
    if (forbidden.length > 0) {
      errors.push({ code: "authorization_violation", path: "filters", message: `조회 권한 밖의 딜러 요청: ${forbidden.join(", ")}` });
    }
  }
}

function checkTimeRangeClear(ir, errors) {
  const tr = ir.time_range;
  if (!tr) return errors.push({ code: "missing_time_range", path: "time_range", message: "time_range 누락" });
  if (tr.type === "relative" && tr.anchor_date !== "runtime_context") {
    errors.push({ code: "ambiguous_time_anchor", path: "time_range.anchor_date", message: "anchor_date가 runtime_context가 아님 — LLM이 날짜를 직접 계산했을 가능성" });
  }
}

function checkNoDuplicateMetrics(ir, errors) {
  if (new Set(ir.metrics).size !== ir.metrics.length) {
    errors.push({ code: "duplicate_metric", path: "metrics", message: "동일 metric 중복 요청" });
  }
}

function checkResultSizeBound(ir, errors) {
  const limit = ir.limit ?? 50;
  if (limit > MAX_RESULT_ROWS) {
    errors.push({ code: "result_too_large", path: "limit", message: `limit(${limit})이 최대 허용치(${MAX_RESULT_ROWS})를 초과` });
  }
  const dimCount = (ir.dimensions || []).length;
  if (dimCount >= 3 && limit > 100) {
    errors.push({ code: "cardinality_risk", path: "dimensions", message: "3개 이상 dimension breakdown + 큰 limit 조합 — 카디널리티 폭발 위험, limit을 낮추거나 dimension을 줄일 것" });
  }
}

/**
 * @param {object} ir - ir_schema.js를 이미 통과한 SemanticQueryIR
 * @param {object} [options]
 * @param {object} [options.userContext]
 * @param {object} [options.authorizationScope]
 * @returns {{ ok: boolean, errors: {code: string, path: string, message: string}[] }}
 */
function validateSemanticQuery(ir, { userContext = {}, authorizationScope = null } = {}) {
  const registry = loadRegistry();
  const errors = [];

  checkMetricsExist(ir, registry, errors);
  checkDimensionsExist(ir, registry, errors);
  checkFilterDimensionsExist(ir, registry, errors);
  checkGrainCompatibility(ir, registry, errors);
  checkJoinPathExists(ir, registry, errors);
  checkRequiredFiltersPresent(ir, registry, errors);
  checkAuthorizationScope(ir, userContext, authorizationScope, errors);
  checkTimeRangeClear(ir, errors);
  checkNoDuplicateMetrics(ir, errors);
  checkResultSizeBound(ir, errors);

  return { ok: errors.length === 0, errors };
}

module.exports = { validateSemanticQuery };
