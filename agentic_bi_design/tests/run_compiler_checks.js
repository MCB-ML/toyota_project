/**
 * Executable slice of golden_questions.yaml — not all 18 are compilable
 * (composite/ambiguous/unresolved ones need the full agent graph + LLM),
 * but the ones with a concrete single-metric IR can be checked against the
 * real ir_schema.js / validator.js / compiler.js right now, with no mocks.
 * This is what actually proves P2/P3 aren't just paper YAML.
 *
 * Run: node agentic_bi_design/tests/run_compiler_checks.js
 * (needs to run from a location where js-yaml resolves — see docs/README
 * note on NODE_PATH, same constraint as the rest of this app/ tree until
 * it's merged into louis/dashboard's own node_modules)
 */
const path = require("path");
const { validateSemanticQueryIR } = require("../app/semantic/ir_schema");
const { validateSemanticQuery } = require("../app/semantic/validator");
const { compileSingleMetricQuery, CompileError } = require("../app/semantic/compiler");
const { loadRegistry } = require("../app/semantic/registry");

const CURRENT_DATE = "2026-07-23";

const CASES = [
  {
    id: "gq_01_single_metric_mtd",
    ir: { intent: "single_value", metrics: ["contract_mtd_actual"], dimensions: [], time_range: { type: "mtd" } },
    expect: "compiles",
  },
  {
    id: "gq_03_breakdown_by_dealer",
    ir: { intent: "breakdown_by_dimension", metrics: ["delivery_ytd_actual"], dimensions: ["dealer"], time_range: { type: "ytd" } },
    expect: "compiles",
  },
  {
    id: "gq_06_achievement_rate_numerator",
    ir: { intent: "single_value", metrics: ["contract_mtd_total_including_cancelled"], dimensions: [], time_range: { type: "mtd" } },
    expect: "compiles",
    checkSql: (sql) => sql.includes("FCT_CONTRACT_KTWS.cnt") && !sql.includes("cancel_dt IS NULL"),
    checkDescription: "달성률 분자(취소 포함 전체 cnt)가 실적(취소 제외)과 다른 SQL을 내는지",
  },
  {
    id: "gq_15_invalid_metric",
    ir: { intent: "single_value", metrics: ["net_profit_mtd"], dimensions: [], time_range: { type: "mtd" } },
    expect: "semantic_validation_fails",
  },
  {
    id: "gq_17_lead_qualification_needs_exists_subquery",
    ir: { intent: "single_value", metrics: ["lead_mtd_actual"], dimensions: [], time_range: { type: "mtd" } },
    expect: "compile_error",
    expectCode: "not_directly_compilable",
  },
  {
    id: "gq_18_working_day_no_sc_scope",
    ir: { intent: "single_value", metrics: ["working_day_progress_ratio"], dimensions: [], time_range: { type: "mtd" } },
    expect: "not_directly_compilable_progress",
    // working_day_progress_ratio는 progress_metric(분자/분모 별도)이라 compileSingleMetricQuery
    // 단일 호출 대상이 아님 — 대신 base metric 하나(working_day_count_pass)로 SC 스코프 배제를 검증
    substituteMetric: "working_day_count_pass",
    forbidTables: ["DIM_MNG_USER", "FCT_ACTIVITY_v2", "FCT_CONTRACT_KTWS"],
  },
];

function run() {
  loadRegistry({ force: true });
  let pass = 0, fail = 0;
  const results = [];

  for (const c of CASES) {
    const ir = c.substituteMetric ? { ...c.ir, metrics: [c.substituteMetric] } : c.ir;
    const structural = validateSemanticQueryIR(ir);
    let outcome = "unknown";
    let detail = "";

    if (!structural.ok) {
      outcome = "structural_fail";
      detail = JSON.stringify(structural.errors);
    } else {
      const semantic = validateSemanticQuery(ir);
      if (!semantic.ok) {
        outcome = "semantic_fail";
        detail = JSON.stringify(semantic.errors);
      } else {
        try {
          const compiled = compileSingleMetricQuery(ir, { currentDate: CURRENT_DATE });
          outcome = "compiled";
          detail = compiled.sql.replace(/\n/g, " ");
          if (c.checkSql && !c.checkSql(compiled.sql)) {
            outcome = "compiled_but_check_failed";
          }
          if (c.forbidTables) {
            const violated = c.forbidTables.filter((t) => compiled.sql.includes(t));
            if (violated.length) outcome = `compiled_but_forbidden_table(${violated.join(",")})`;
          }
        } catch (e) {
          outcome = e instanceof CompileError ? `compile_error:${e.code}` : "unexpected_throw";
          detail = e.message;
        }
      }
    }

    const expectMap = {
      compiles: outcome === "compiled",
      semantic_validation_fails: outcome === "semantic_fail",
      compile_error: outcome === `compile_error:${c.expectCode}`,
      not_directly_compilable_progress: outcome === "compiled", // substituted to a real base metric
    };
    const ok = expectMap[c.expect];
    ok ? pass++ : fail++;
    results.push({ id: c.id, expect: c.expect, outcome, ok, detail: detail.slice(0, 200) });
  }

  for (const r of results) {
    console.log(`[${r.ok ? "PASS" : "FAIL"}] ${r.id} — expected=${r.expect} actual=${r.outcome}`);
    if (!r.ok) console.log(`       detail: ${r.detail}`);
  }
  console.log(`\n${pass}/${pass + fail} passed`);
  process.exitCode = fail > 0 ? 1 : 0;
}

run();
