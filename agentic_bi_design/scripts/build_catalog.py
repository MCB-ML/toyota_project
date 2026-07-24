"""
P13 — GOLD SQL migration classification.

Classifies each of the 67 distinct GOLD queries (inventory/sql_inventory.json +
sql_metadata.json) into A(semantic_metric) / B(controlled_template) / C(redesign),
per the rules in the spec:
  A: repetitive aggregation, standard org/time filters, target/actual/achievement
  B: complex detail lists, window functions, special ranking, multi-stage CTEs
  C: unclear grain, same-metric-different-SQL, excess hardcoding, hidden
     exclusions, performance risk, conflicting definitions

This is a heuristic first pass over measurable signals (parse_status, risks,
referenced_by_count) — not a substitute for human review. Every record carries
required_review so nothing is silently treated as "decided".
"""
import json
import re
from pathlib import Path

INV_DIR = Path(r"c:/Project/toyota_project/toyota_project/agentic_bi_design/inventory")
SEM_DIR = Path(r"c:/Project/toyota_project/toyota_project/agentic_bi_design/semantic/metrics")
OUT_DIR = Path(r"c:/Project/toyota_project/toyota_project/agentic_bi_design/migration")


def build_sql_to_metric_map():
    """metrics/*.yaml source_evidence[].sql_id -> [metric_id] — crude regex scan,
    good enough since the YAML shape is consistent (avoids a yaml dependency
    coupling this script to the app's own registry loader)."""
    mapping = {}
    for f in SEM_DIR.glob("*.yaml"):
        text = f.read_text(encoding="utf-8")
        # split into metric blocks
        blocks = re.split(r"(?=^  - id: )", text, flags=re.MULTILINE)
        for b in blocks:
            m_id = re.search(r"^\s*- id:\s*(\S+)", b, re.MULTILINE)
            if not m_id:
                continue
            metric_id = m_id.group(1)
            for sql_id in re.findall(r"sql_id:\s*(gold_[a-zA-Z0-9_]+)", b):
                mapping.setdefault(sql_id, []).append(metric_id)
    return mapping


def classify(meta):
    risks = set(meta.get("risks", []))
    parse_status = meta.get("parse_status")
    ref_count = meta.get("referenced_by_count", 1)

    if parse_status == "partial_command_blocks":
        return "redesign", ["hidden_conditional_branches (IF/BEGIN/END 분기 안에 로직이 숨어 있어 정적 분석으로 전체를 못 봄)"]
    if "mixed_grain_union" in risks or "window_function_grain_dependency" in risks:
        return "controlled_template", [r for r in ["mixed_grain_union", "window_function_grain_dependency"] if r in risks]
    if ref_count >= 5:
        return "controlled_template", [f"단일 SQL이 {ref_count}개 시각적 개체에 재사용되는 통합 쿼리 — 원자 지표로 분해 필요"]
    if "hardcoded_date" in risks:
        return "redesign", ["hardcoded_date"]
    if "correlated_subquery" in risks:
        return "controlled_template", ["correlated_subquery (EXISTS 기반 자격 조건 — 단일 Metric 컴파일러로 표현 불가, lead_mtd_actual 사례 참고)"]
    return "semantic_metric", []


def priority(classification, ref_count):
    if classification == "redesign":
        return "P1_high"
    if classification == "controlled_template" and ref_count >= 5:
        return "P1_high"
    if classification == "controlled_template":
        return "P2_medium"
    return "P3_low"


def main():
    sql_metadata = json.loads((INV_DIR / "sql_metadata.json").read_text(encoding="utf-8"))
    sql_to_metric = build_sql_to_metric_map()

    records = []
    counts = {"semantic_metric": 0, "controlled_template": 0, "redesign": 0}

    for meta in sql_metadata:
        sql_id = meta["sql_id"]
        classification, risk_reasons = classify(meta)
        target_metrics = sql_to_metric.get(sql_id, [])
        # 이미 metric으로 분해되어 있으면 등급과 무관하게 A로 재분류(실질적으로 완료됨)
        if target_metrics and classification != "redesign":
            classification = "semantic_metric"
        counts[classification] += 1

        records.append({
            "sql_id": sql_id,
            "classification": classification,
            "target_metric_ids": target_metrics,
            "reusable_rules": [r["business_rule_id"] for r in meta.get("business_rules", [])],
            "duplicated_rules": [],  # 수작업 리뷰 대상 — 자동 탐지 범위 밖
            "risks": meta.get("risks", []) + risk_reasons,
            "migration_priority": priority(classification, meta.get("referenced_by_count", 1)),
            "required_review": classification != "semantic_metric" or not target_metrics,
            "parse_status": meta.get("parse_status"),
            "referenced_by_count": meta.get("referenced_by_count"),
        })

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    (OUT_DIR / "migration_classification.json").write_text(
        json.dumps(records, ensure_ascii=False, indent=2), encoding="utf-8")

    summary = {
        "total": len(records),
        "classification_counts": counts,
        "already_has_metric_mapping": sum(1 for r in records if r["target_metric_ids"]),
    }
    print(json.dumps(summary, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
