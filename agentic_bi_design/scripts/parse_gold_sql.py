"""
P0 step 2 — GOLD SQL static analysis.

Reads agentic_bi_design/inventory/sql_inventory.json (produced by
extract_workbook.py) and, for every distinct GOLD query:
  1. Extracts the DECLARE block mechanically via regex (T-SQL DECLARE
     syntax is regular and 100% consistent across this workbook — every
     GOLD query documents its own parameter contract this way).
  2. Parses the remaining SELECT/;WITH...SELECT body with sqlglot
     (tsql dialect) to pull tables, joins, ctes, group_by, aggregations.
  3. Flags structural risks (fanout join, hardcoded date, correlated
     subquery, etc.) as heuristics — not a substitute for human review,
     see risks[] on each record and required_review flag downstream.

Where sqlglot cannot parse a statement (T-SQL has vendor syntax it does
not fully cover, e.g. STRING_SPLIT correlated joins), the record is
marked parse_status="partial" with the raw error, and only the regex-
derived fields (tables/joins via FROM/JOIN scan) are filled — nothing is
invented to paper over the gap.
"""
import json
import re
from pathlib import Path

import sqlglot
from sqlglot import exp

INV_DIR = Path(r"c:/Project/toyota_project/toyota_project/agentic_bi_design/inventory")

DECLARE_RE = re.compile(
    r"DECLARE\s+@(\w+)\s+([\w\(\)]+)\s*=\s*(N?'[^']*'|[^;]+?);", re.IGNORECASE)

TABLE_REF_RE = re.compile(
    r"(?:FROM|JOIN)\s+(?:\[?ktws\]?\.)?\[?([A-Za-z0-9_]+)\]?\s*(?:AS\s+)?(\w+)?", re.IGNORECASE)

CTE_NAME_RE = re.compile(r"(?:WITH|,)\s*([A-Za-z_][A-Za-z0-9_]*)\s+AS\s*\(", re.IGNORECASE)
TEMP_TABLE_NAME_RE = re.compile(r"#([A-Za-z_][A-Za-z0-9_]*)", re.IGNORECASE)

SQL_KEYWORD_STOPLIST = {
    "AND", "OR", "ON", "WHERE", "SELECT", "N", "NOT", "IS", "NULL", "AS",
    "CASE", "WHEN", "THEN", "ELSE", "END", "GROUP", "ORDER", "BY", "IF",
    "BEGIN", "DECLARE", "SET",
}

RULE_SIGNATURES = [
    # (business_rule_id, regex, description)
    ("br_exclude_front_sc", re.compile(r"facade_sc_yn", re.I),
     "창구SC(facade_sc_yn) 제외"),
    ("br_exclude_staff_names", re.compile(r"고객지원팀|TOYOTA YM", re.I),
     "특정 이름(고객지원팀/TOYOTA YM) 제외"),
    ("br_exclude_test_users", re.compile(r"DM5103|DM9999|JB30007", re.I),
     "테스트/내부 계정 user_id 제외 목록"),
    ("br_active_staff", re.compile(r"active_yn", re.I),
     "재직/퇴직(active_yn) 필터"),
    ("br_contract_cancel_exclusion", re.compile(r"cancel_dt\s+IS\s+NULL", re.I),
     "취소(cancel_dt) 건 제외 → 유효 계약"),
    ("br_contract_cancel_inclusion_flag", re.compile(r"cancel_dt\s+IS\s+NOT\s+NULL", re.I),
     "취소 건만 별도 집계(취소 건수 지표)"),
    ("br_mtd_asof_cap", re.compile(r"@AsOfDate|@Today", re.I),
     "MTD 상한일(AsOfDate/오늘) 캡 적용"),
    ("br_dealer_scope", re.compile(r"dealer_nm\s+IS\s+NOT\s+NULL", re.I),
     "딜러명 NULL/빈값 제외 → 유효 딜러 스코프"),
    ("br_common_tp_scope", re.compile(r"common_tp_nm\s*=\s*N?'계약'", re.I),
     "활동유형을 '계약'으로 한정(목표 소계 레벨)"),
    ("br_qualified_lead_def", re.compile(r"close_dt\s*>\s*@MonthEnd|last_retail_sales_dt\s+IS\s+NOT\s+NULL", re.I),
     "유효 리드(오픈 유지 또는 매출전환) 정의"),
    ("br_working_day_def", re.compile(r"kr_holiday", re.I),
     "공휴일(kr_holiday) 제외 워킹데이 정의"),
    ("br_act_result_exclusion", re.compile(r"act_result.*부재중", re.I),
     "부재중(act_result) 활동 제외"),
    ("br_tp_grp_scope", re.compile(r"tp_grp_1", re.I),
     "활동 대분류(관계형성/기회창출 등) 필터"),
]

HARDCODED_DATE_RE = re.compile(r"\b(19|20)\d{2}-\d{2}-\d{2}\b|@Year\s*=\s*\d{4}|@MonthNumber\s*=\s*\d")


def extract_params(sql_text):
    params = []
    for m in DECLARE_RE.finditer(sql_text):
        name, typ, default = m.groups()
        default = default.strip()
        params.append({
            "name": name,
            "sql_type": typ,
            "default_raw": default,
            "nullable_all": default.upper() == "NULL",
        })
    return params


def extract_business_rules(sql_text):
    found = []
    for rule_id, pat, desc in RULE_SIGNATURES:
        if pat.search(sql_text):
            found.append({"business_rule_id": rule_id, "description": desc})
    return found


def strip_declares_and_comments(sql_text):
    body = DECLARE_RE.sub("", sql_text)
    body = re.sub(r"/\*.*?\*/", "", body, flags=re.DOTALL)
    body = re.sub(r"--[^\n]*", "", body)
    return body.strip()


def regex_ctes(sql_text):
    """Query-internal names that must never be reported as real schema
    tables: CTEs (WITH x AS (...)) and local #temp tables (both are
    intermediate structures the GOLD query builds for itself)."""
    names = {m.group(1) for m in CTE_NAME_RE.finditer(sql_text)}
    names |= {m.group(1) for m in TEMP_TABLE_NAME_RE.finditer(sql_text)}
    return names


def regex_tables(sql_text):
    tables = set()
    for m in TABLE_REF_RE.finditer(sql_text):
        t = m.group(1)
        if t and t.upper() not in SQL_KEYWORD_STOPLIST and t.upper() != "STRING_SPLIT":
            tables.add(t)
    return tables - regex_ctes(sql_text)


def detect_risks(sql_text, tables, join_count):
    risks = []
    if HARDCODED_DATE_RE.search(sql_text):
        risks.append("hardcoded_date")
    if len(tables) >= 2 and "LEFT JOIN" in sql_text.upper() and join_count >= 4:
        risks.append("fanout_join_possible")
    if "EXISTS (" in sql_text.upper() or "EXISTS(" in sql_text.upper():
        risks.append("correlated_subquery")
    if re.search(r"UNION\s+ALL", sql_text, re.I) and "GROUP BY" in sql_text.upper():
        risks.append("mixed_grain_union")
    if re.search(r"ROW_NUMBER\s*\(\s*\)\s*OVER", sql_text, re.I):
        risks.append("window_function_grain_dependency")
    return risks


def parse_with_sqlglot(body):
    result = {
        "parse_status": "failed",
        "error": None,
        "tables": [],
        "ctes": [],
        "joins": [],
        "group_by": [],
        "order_by": [],
        "aggregations": [],
        "window_functions": [],
    }
    try:
        statements = sqlglot.parse(body, read="tsql")
        statements = [s for s in statements if s is not None]
        if not statements:
            result["error"] = "empty parse (no statements)"
            return result
        has_command_blob = any(isinstance(s, exp.Command) or list(s.find_all(exp.Command))
                                for s in statements)
        tables, ctes, joins, group_by, order_by, aggs, windows = set(), [], [], set(), set(), set(), []
        for stmt in statements:
            for t in stmt.find_all(exp.Table):
                name = t.name
                if name:
                    tables.add(name)
            for c in stmt.find_all(exp.CTE):
                alias = c.alias
                if alias:
                    ctes.append(alias)
            for j in stmt.find_all(exp.Join):
                joins.append({
                    "kind": (j.args.get("kind") or "INNER"),
                    "table": j.this.name if hasattr(j.this, "name") else str(j.this)[:60],
                })
            for g in stmt.find_all(exp.Group):
                for e in g.expressions:
                    group_by.add(e.sql(dialect="tsql"))
            for o in stmt.find_all(exp.Order):
                for e in o.expressions:
                    order_by.add(e.sql(dialect="tsql"))
            for f in stmt.find_all(exp.AggFunc):
                aggs.add(f.sql_name())
            for w in stmt.find_all(exp.Window):
                windows.append(w.sql(dialect="tsql")[:120])
        tables = tables - set(ctes) - set(regex_ctes(body))
        result.update({
            "parse_status": "partial_command_blocks" if has_command_blob else "ok",
            "tables": sorted(tables),
            "ctes": ctes,
            "joins": joins,
            "group_by": sorted(group_by),
            "order_by": sorted(order_by),
            "aggregations": sorted(aggs),
            "window_functions": windows,
        })
    except Exception as e:
        result["error"] = f"{type(e).__name__}: {str(e)[:300]}"
    return result


def main():
    sql_inventory = json.loads((INV_DIR / "sql_inventory.json").read_text(encoding="utf-8"))
    visual_catalog = json.loads((INV_DIR / "visual_catalog.json").read_text(encoding="utf-8"))

    sql_metadata = []
    table_usage = {}  # table_name -> {sql_ids: [], columns: set()}

    for rec in sql_inventory:
        sql_text = rec["sql_text"]
        params = extract_params(sql_text)
        rules = extract_business_rules(sql_text)
        body = strip_declares_and_comments(sql_text)
        parsed = parse_with_sqlglot(body)

        if parsed["parse_status"] == "ok":
            tables = parsed["tables"]
        else:
            # AST missed tables hidden inside un-parsed T-SQL control-flow
            # blocks (IF/BEGIN/END branches sqlglot's tsql dialect doesn't
            # model) or failed outright — union with a regex scan over the
            # raw text so nothing found either way gets dropped.
            tables = sorted(set(parsed["tables"]) | set(regex_tables(body)))
        parsed["tables"] = tables

        risks = detect_risks(sql_text, tables, len(parsed.get("joins", [])))

        meta = {
            "sql_id": rec["sql_id"],
            "source_hash": rec["source_hash"],
            "sql_dialect": "tsql",
            "referenced_by": rec["referenced_by"],
            "referenced_by_count": len(rec["referenced_by"]),
            "parse_status": parsed["parse_status"],
            "parse_error": parsed.get("error"),
            "tables": tables,
            "ctes": parsed.get("ctes", []),
            "joins": parsed.get("joins", []),
            "group_by": parsed.get("group_by", []),
            "order_by": parsed.get("order_by", []),
            "aggregations": parsed.get("aggregations", []),
            "window_functions": parsed.get("window_functions", []),
            "parameters": params,
            "business_rules": rules,
            "risks": risks,
            "source": {
                "workbook": "ktws_측정값_쿼리화.xlsx",
                "first_seen_row_id": rec["first_seen_row_id"],
                "sql_reference": rec["sql_id"],
            },
        }
        sql_metadata.append(meta)

        for t in tables:
            table_usage.setdefault(t, {"table": t, "referenced_by_sql_ids": [], "referenced_by_row_count": 0})
            table_usage[t]["referenced_by_sql_ids"].append(rec["sql_id"])
            table_usage[t]["referenced_by_row_count"] += len(rec["referenced_by"])

    # sql_inventory.json stays the pure Source Registry (sql_id + full sql_text,
    # untouched, produced by extract_workbook.py). sql_metadata.json is the
    # separate extracted-semantics file that the Semantic Layer actually
    # consumes downstream — sql_id only, never the SQL text itself.
    (INV_DIR / "sql_metadata.json").write_text(
        json.dumps(sql_metadata, ensure_ascii=False, indent=2), encoding="utf-8")

    table_usage_list = sorted(table_usage.values(), key=lambda x: -x["referenced_by_row_count"])
    (INV_DIR / "table_column_usage.json").write_text(
        json.dumps(table_usage_list, ensure_ascii=False, indent=2), encoding="utf-8")

    ok = sum(1 for m in sql_metadata if m["parse_status"] == "ok")
    summary = {
        "total_sql": len(sql_metadata),
        "parsed_ok": ok,
        "partial_or_failed": len(sql_metadata) - ok,
        "distinct_tables": len(table_usage_list),
        "risk_counts": {},
    }
    for m in sql_metadata:
        for r in m["risks"]:
            summary["risk_counts"][r] = summary["risk_counts"].get(r, 0) + 1
    print(json.dumps(summary, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
