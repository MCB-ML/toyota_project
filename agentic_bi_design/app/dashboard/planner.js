/**
 * DashboardPlanner (P5) — executionResults/insights를 보고 컴포넌트 조합을
 * 결정한다. 차트 타입 선택 규칙(스펙 요구사항 반영):
 *   - ratio/conversion/progress metric을 donut_chart에 넣지 않는다(비율을 합계
 *     차트로 표현 금지 — component_registry.yaml의 forbidden_metric_types).
 *   - 카테고리 수가 많으면(>30) bar_chart 대신 detail_table로 강등한다.
 *   - funnel 순서는 registry의 stage_order 고정값을 따른다(임의 순서 금지).
 */
const fs = require("fs");
const path = require("path");
const yaml = require("js-yaml");
const { loadRegistry } = require("../semantic/registry");

const ROOT = path.resolve(__dirname, "..", "..");
function loadComponentRegistry() {
  const doc = yaml.load(fs.readFileSync(path.join(ROOT, "frontend/component-registry/component_registry.yaml"), "utf8"));
  return new Map(doc.components.map((c) => [c.type, c]));
}

function pickComponentType(metricId, rowCount, semanticRegistry, componentRegistry) {
  const metric = semanticRegistry.metrics.get(metricId);
  const isRatioLike = ["ratio_metric", "conversion_metric", "progress_metric"].includes(metric?.metric_type);

  if (rowCount === 1) return "kpi_card"; // 단일 값이면 kpi_card — donut 금지 규칙은 breakdown(rowCount>1)에만 적용
  if (rowCount > 30) return "detail_table"; // 카테고리 많으면 비율이어도 표로 — bar_chart의 max_categories 초과 방지
  if (isRatioLike) return "bar_chart"; // 비율의 breakdown은 막대(0~100% 축)로, 도넛 금지
  return "bar_chart";
}

/**
 * @param {object[]} compiledQueries - state.compiledQueries (SQLCompiler 출력)
 * @param {object[]} executionResults - state.executionResults
 * @returns {object} DashboardIR (schemas/dashboard_ir.schema.json 형태, 이후 validator로 검증 필요)
 */
function planDashboard({ dashboardId, title, compiledQueries, executionResults }) {
  const semanticRegistry = loadRegistry();
  const componentRegistry = loadComponentRegistry();

  const components = [];
  let x = 0, y = 0;
  const COLS = 12;

  compiledQueries.forEach((cq, idx) => {
    const result = executionResults.find((r) => r.metricId === cq.metricId);
    const rowCount = result?.rows?.length ?? 0;
    const type = pickComponentType(cq.metricId, rowCount, semanticRegistry, componentRegistry);
    const compDef = componentRegistry.get(type);
    const w = type === "kpi_card" ? 3 : type === "detail_table" ? 12 : 6;
    const h = type === "kpi_card" ? 2 : 4;
    if (x + w > COLS) { x = 0; y += h; }

    components.push({
      id: `${cq.metricId}_${idx}`,
      type,
      title: semanticRegistry.metrics.get(cq.metricId)?.name_ko || cq.metricId,
      query_ref: cq.metricId,
      metric: cq.metricId,
      position: { x, y, w, h },
    });
    x += w;
  });

  return {
    dashboard_id: dashboardId,
    title,
    layout: { columns: COLS, row_height: 80 },
    global_filters: [],
    components,
  };
}

module.exports = { planDashboard, pickComponentType, loadComponentRegistry };
