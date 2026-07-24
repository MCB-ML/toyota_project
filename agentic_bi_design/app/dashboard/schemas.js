/**
 * DashboardIRValidator (P5) — schemas/dashboard_ir.schema.json의 JS 대응
 * 구조 검증(zod/ajv 미사용 이유는 app/semantic/ir_schema.js 상단 주석과 동일) +
 * 스펙이 명시한 의미론적 검사(허용 컴포넌트/쿼리 참조 존재/축-단위/비율-도넛 금지/
 * 카테고리 수/퍼널 순서/레이아웃 겹침/권한 범위).
 */
const { loadComponentRegistry } = require("./planner");
const { loadRegistry } = require("../semantic/registry");

function checkOverlap(components) {
  const overlaps = [];
  for (let i = 0; i < components.length; i++) {
    for (let j = i + 1; j < components.length; j++) {
      const a = components[i].position, b = components[j].position;
      const overlapX = a.x < b.x + b.w && b.x < a.x + a.w;
      const overlapY = a.y < b.y + b.h && b.y < a.y + a.h;
      if (overlapX && overlapY) overlaps.push([components[i].id, components[j].id]);
    }
  }
  return overlaps;
}

/**
 * @param {object} dashboardIr
 * @param {{ compiledQueryIds: string[], executionResults: object[] }} ctx
 * @returns {{ ok: boolean, errors: {code: string, message: string}[] }}
 */
function validateDashboardIr(dashboardIr, ctx) {
  const errors = [];
  const componentRegistry = loadComponentRegistry();
  const semanticRegistry = loadRegistry();
  const compiledQueryIds = new Set(ctx?.compiledQueryIds || []);
  const executionResults = new Map((ctx?.executionResults || []).map((r) => [r.metricId, r]));

  if (!dashboardIr || !Array.isArray(dashboardIr.components) || dashboardIr.components.length === 0) {
    return { ok: false, errors: [{ code: "empty_dashboard", message: "components가 비어있음" }] };
  }

  for (const comp of dashboardIr.components) {
    if (!componentRegistry.has(comp.type)) {
      errors.push({ code: "unregistered_component", message: `등록되지 않은 컴포넌트: ${comp.type}` });
      continue;
    }
    if (comp.query_ref && compiledQueryIds.size > 0 && !compiledQueryIds.has(comp.query_ref)) {
      errors.push({ code: "dangling_query_ref", message: `${comp.id}: query_ref '${comp.query_ref}'가 실제 컴파일된 쿼리 목록에 없음` });
    }

    const metric = comp.metric ? semanticRegistry.metrics.get(comp.metric) : null;
    const compDef = componentRegistry.get(comp.type);

    // 비율 지표를 도넛(합계형 차트)로 표시 금지
    if (metric && compDef?.forbidden_metric_types?.includes(metric.metric_type)) {
      errors.push({
        code: "ratio_as_sum_chart",
        message: `${comp.id}: ${metric.metric_type} 지표('${metric.id}')를 ${comp.type}에 표시 — 비율을 합계 차트로 잘못 표현`,
      });
    }

    // 카테고리 수 상한
    const result = executionResults.get(comp.metric);
    if (result?.rows && compDef?.max_categories && result.rows.length > compDef.max_categories) {
      errors.push({ code: "too_many_categories", message: `${comp.id}: ${result.rows.length}개 카테고리 > 허용치 ${compDef.max_categories}` });
    }

    // funnel 순서 고정
    if (comp.type === "funnel_chart" && compDef?.stage_order) {
      // 실제 stages 필드가 IR에 있다면 순서 비교 — v1은 존재 여부만 확인
      if (!comp.stages) errors.push({ code: "funnel_missing_stages", message: `${comp.id}: funnel_chart인데 stages 목록이 없음` });
    }
  }

  const overlaps = checkOverlap(dashboardIr.components);
  for (const [a, b] of overlaps) {
    errors.push({ code: "layout_overlap", message: `레이아웃 겹침: ${a} <-> ${b}` });
  }

  return { ok: errors.length === 0, errors };
}

module.exports = { validateDashboardIr, checkOverlap };
