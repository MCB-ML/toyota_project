"""
Dashboard data aggregation script.
Reads parquet files from ../data/hnd_svc/ and outputs JSON summaries to public/data/.
Run from the dashboard/ directory: python generate_data.py
"""

import os
import json
import warnings
import pandas as pd
import numpy as np
from pathlib import Path

warnings.filterwarnings("ignore")

DATA_DIR = Path(__file__).parent / ".." / "data" / "hnd_svc"
OUT_DIR = Path(__file__).parent / "public" / "data"
OUT_DIR.mkdir(parents=True, exist_ok=True)

FMS_CODE_MAP = {
    **{str(10000000 + i): f"FMS_{i}차" for i in range(1, 6)},
    **{str(10000000 + i): f"PMS_{i-5}차" for i in range(6, 12)},
    **{str(10000000 + i): f"SMS_{i-11}차" for i in range(12, 24)},
}
FMS_GROUP_MAP = {
    **{str(10000000 + i): "FMS" for i in range(1, 6)},
    **{str(10000000 + i): "PMS" for i in range(6, 12)},
    **{str(10000000 + i): "SMS" for i in range(12, 24)},
}

LEXUS_MODELS = {"ES", "NX", "RX", "UX", "LC", "LS", "LX", "GX", "RC", "IS", "CT", "GS", "HS"}


def load(filename):
    path = DATA_DIR / filename
    if path.exists():
        df = pd.read_parquet(path)
        print(f"  OK {filename}: {len(df):,} rows")
        return df
    print(f"  SKIP {filename}: not found")
    return None


def save_json(data, filename):
    path = OUT_DIR / filename
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, default=str)
    print(f"  → {filename} saved ({path.stat().st_size / 1024:.1f} KB)")


def normalize_int(val):
    if pd.isna(val):
        return None
    try:
        return int(val)
    except Exception:
        return None


# ─────────────────────────────────────────────────────────────
# 1. 재고관리 (Vehicle Inventory)
# ─────────────────────────────────────────────────────────────
print("\n=== 재고관리 데이터 생성 ===")

karete_vehic = load("karete_co_vehic.parquet")
agora_vehic = load("agora_co_vehic.parquet")

# Karete (Lexus LDMS + Toyota TDMS) — primary source
kv = karete_vehic.rename(
    columns={
        "VIN": "vin",
        "VEHICLE_MODEL_YEAR": "model_year",
        "VEHICLE_MODEL_CODE": "model_cd",
        "SERVICE_MODEL_CODE": "svc_model_cd",
        "VEHICLE_VARIANT_NAME": "variant_nm",
        "DELIVERY_DATE": "delivery_dt",
        "ODOMETER": "odometer",
        "SALES_TYPE": "sales_type",
        "FIRST_OWNER_YN": "first_owner_yn",
        "SOURCE_SYSTEM": "source",
    }
)[["vin", "model_year", "model_cd", "svc_model_cd", "variant_nm", "delivery_dt",
   "odometer", "sales_type", "first_owner_yn", "source"]].copy()

kv["delivery_dt"] = pd.to_datetime(kv["delivery_dt"], errors="coerce")
kv = kv[kv["delivery_dt"].dt.year.between(2000, 2026)]
kv = kv.drop_duplicates("vin", keep="first")

# Brand mapping
kv["brand"] = kv["source"].map({"LDMS": "Lexus", "TDMS": "Toyota"}).fillna("기타")

total = len(kv)
brand_counts = kv["brand"].value_counts().to_dict()
this_year = int((kv["delivery_dt"].dt.year == 2026).sum())

# 차종별 상위 15
by_model = (
    kv["model_cd"].value_counts().head(15).rename_axis("model").reset_index()
    .rename(columns={"count": "count"})
)
by_model["count"] = by_model["count"].astype(int)
by_model_list = by_model.to_dict("records")

# 연도별 출고 추이 (2015~2026)
by_year = (
    kv[kv["delivery_dt"].dt.year.between(2015, 2026)]
    .groupby(kv["delivery_dt"].dt.year)
    .size()
    .rename_axis("year")
    .reset_index(name="count")
)
by_year["year"] = by_year["year"].astype(int)
by_year["count"] = by_year["count"].astype(int)
by_year_list = by_year.to_dict("records")

# 월별 출고 추이 (최근 24개월)
kv["ym"] = kv["delivery_dt"].dt.to_period("M")
recent_start = pd.Period("2024-07", "M")
by_month_inv = (
    kv[kv["ym"] >= recent_start]
    .groupby("ym")
    .size()
    .reset_index(name="count")
)
by_month_inv["month"] = by_month_inv["ym"].astype(str)
by_month_inv["count"] = by_month_inv["count"].astype(int)
by_month_inv_list = by_month_inv[["month", "count"]].to_dict("records")

# 모델연도별 분포
by_my = (
    kv["model_year"].value_counts()
    .rename_axis("model_year")
    .reset_index(name="count")
    .sort_values("model_year")
)
by_my = by_my[pd.to_numeric(by_my["model_year"], errors="coerce").between(2015, 2027).fillna(False)]
by_my["model_year"] = by_my["model_year"].astype(str)
by_my["count"] = by_my["count"].astype(int)
by_my_list = by_my.to_dict("records")

# first_owner_yn 분포
fo_counts = kv["first_owner_yn"].fillna("불명").value_counts().to_dict()

inventory_data = {
    "kpi": {
        "total": int(total),
        "lexus": int(brand_counts.get("Lexus", 0)),
        "toyota": int(brand_counts.get("Toyota", 0)),
        "this_year": int(this_year),
        "first_owner": int(kv["first_owner_yn"].eq("Y").sum()),
    },
    "by_model": by_model_list,
    "by_year": by_year_list,
    "by_month": by_month_inv_list,
    "by_model_year": by_my_list,
    "first_owner_dist": {
        "최초소유": int(kv["first_owner_yn"].eq("Y").sum()),
        "비최초소유": int((~kv["first_owner_yn"].eq("Y")).sum()),
    },
}
save_json(inventory_data, "inventory.json")

# ─────────────────────────────────────────────────────────────
# 2. 계약관리 (Contract Management)
# ─────────────────────────────────────────────────────────────
print("\n=== 계약관리 데이터 생성 ===")

karete_contract = load("karete_om_contract.parquet")

kc = karete_contract.rename(
    columns={
        "SOURCE_SYSTEM": "source",
        "CONTRACT_NUMBER": "contract_no",
        "VIN": "vin",
        "MODEL_CODE": "model_cd",
        "MODEL_NAME": "model_nm",
        "MODEL_YEAR": "model_year",
        "DELIVERY_ACTUAL_DATE": "delivery_dt_raw",
        "LAST_RETAIL_SALES_DATE": "sales_dt",
        "SALES_TYPE_NAME": "sales_type",
        "CONTRACT_STAT_NAME": "stat",
    }
).copy()

# Use LAST_RETAIL_SALES_DATE (cleaner) as delivery date
kc["delivery_dt"] = pd.to_datetime(kc["sales_dt"], errors="coerce")
kc = kc[kc["delivery_dt"].dt.year.between(2010, 2026)]
kc["brand"] = kc["source"].map({"LDMS": "Lexus", "TDMS": "Toyota"}).fillna("기타")

total_c = len(kc)
completed = int(kc["stat"].eq("출고완료").sum())

# 월별 계약 추이 (최근 24개월)
kc["ym"] = kc["delivery_dt"].dt.to_period("M")
recent_start_c = pd.Period("2024-07", "M")
by_month_c = (
    kc[kc["ym"] >= recent_start_c]
    .groupby("ym")
    .size()
    .reset_index(name="count")
)
by_month_c["month"] = by_month_c["ym"].astype(str)
by_month_c["count"] = by_month_c["count"].astype(int)

this_month_c = int(kc[kc["ym"] == pd.Period("2026-06", "M")].shape[0])

# 차종별 계약 건수 (상위 15)
by_model_c = (
    kc["model_nm"].fillna(kc["model_cd"])
    .value_counts().head(15)
    .rename_axis("model")
    .reset_index(name="count")
)
by_model_c["count"] = by_model_c["count"].astype(int)

# 계약 상태 분포
by_stat = kc["stat"].fillna("미확인").value_counts().head(8).rename_axis("stat").reset_index(name="count")
by_stat["count"] = by_stat["count"].astype(int)

# 브랜드별
by_brand_c = kc["brand"].value_counts().rename_axis("brand").reset_index(name="count")
by_brand_c["count"] = by_brand_c["count"].astype(int)

# 연도별 계약 추이 (2015~2026)
by_year_c = (
    kc[kc["delivery_dt"].dt.year.between(2015, 2026)]
    .groupby(kc["delivery_dt"].dt.year)
    .size()
    .rename_axis("year")
    .reset_index(name="count")
)
by_year_c["year"] = by_year_c["year"].astype(int)
by_year_c["count"] = by_year_c["count"].astype(int)

# 판매유형별
by_sales_type = kc["sales_type"].fillna("미분류").value_counts().head(8).rename_axis("type").reset_index(name="count")
by_sales_type["count"] = by_sales_type["count"].astype(int)

contract_data = {
    "kpi": {
        "total": int(total_c),
        "completed": int(completed),
        "this_month": int(this_month_c),
        "lexus": int(kc["brand"].eq("Lexus").sum()),
        "toyota": int(kc["brand"].eq("Toyota").sum()),
    },
    "by_month": by_month_c[["month", "count"]].to_dict("records"),
    "by_year": by_year_c.to_dict("records"),
    "by_model": by_model_c.to_dict("records"),
    "by_status": by_stat.to_dict("records"),
    "by_brand": by_brand_c.to_dict("records"),
    "by_sales_type": by_sales_type.to_dict("records"),
}
save_json(contract_data, "contract.json")

# ─────────────────────────────────────────────────────────────
# 3. 쿠폰관리 (FMS/PMS/SMS Coupon Management)
# ─────────────────────────────────────────────────────────────
print("\n=== 쿠폰관리 데이터 생성 ===")

agora_propo = load("agora_svc_propo.parquet")
bp_propo = load("bpktws_svc_propo.parquet")
karete_propo = load("karete_svc_propo.parquet")

# ── Agora + BPKTWS (같은 데이터, 중복 제거) ──
PROPO_COLS = ["VIN", "PROPO_DT", "PROPO_SEQ", "SVC_TYPE_FMS_CD"]
ap = agora_propo.rename(columns={
    "vin": "VIN", "propo_dt": "PROPO_DT", "propo_seq": "PROPO_SEQ",
    "svc_type_fms_cd": "SVC_TYPE_FMS_CD",
})[PROPO_COLS].assign(SOURCE="agora")
bp = bp_propo.rename(columns=str.upper)[PROPO_COLS].assign(SOURCE="bpktws")

propo_ab = pd.concat([ap, bp], ignore_index=True)
propo_ab = propo_ab.drop_duplicates(["VIN", "PROPO_DT", "PROPO_SEQ"], keep="first")
propo_ab["PROPO_DT"] = pd.to_datetime(propo_ab["PROPO_DT"].astype(str), format="%Y%m%d", errors="coerce")
propo_ab = propo_ab.dropna(subset=["PROPO_DT"])
propo_ab["FMS_LABEL"] = propo_ab["SVC_TYPE_FMS_CD"].map(FMS_CODE_MAP).fillna("기타")
propo_ab["FMS_GROUP"] = propo_ab["SVC_TYPE_FMS_CD"].map(FMS_GROUP_MAP).fillna("기타")

# ── Karete (별도, Toyota + Lexus 통합) ──
kp = karete_propo.rename(columns={
    "VIN": "VIN",
    "PROPO_DATE": "PROPO_DT",
    "PROPO_SEQ": "PROPO_SEQ",
    "SERVICE_TYPE_FMS": "SVC_TYPE_FMS_CD",
}).copy()
kp["PROPO_DT"] = pd.to_datetime(kp["PROPO_DT"].astype(str), format="%Y%m%d", errors="coerce")
kp = kp.dropna(subset=["PROPO_DT"])
# Karete uses text labels for SERVICE_TYPE_FMS, not codes
kp["FMS_GROUP"] = kp["SVC_TYPE_FMS_CD"].fillna("").apply(
    lambda x: "FMS" if "FMS" in str(x).upper() else ("SMS" if "SMS" in str(x).upper() else ("PMS" if "PMS" in str(x).upper() else "기타"))
)
kp["FMS_LABEL"] = kp["SVC_TYPE_FMS_CD"].fillna("기타")

total_fms = len(propo_ab)
unique_vins = int(propo_ab["VIN"].nunique())

# FMS 유형별 분포 (Agora+BPKTWS 기준, 코드 매핑)
by_fms_label = (
    propo_ab["FMS_LABEL"].value_counts().head(20)
    .rename_axis("label").reset_index(name="count")
)
by_fms_label["count"] = by_fms_label["count"].astype(int)

# FMS 그룹별 (FMS/PMS/SMS)
by_fms_group = (
    propo_ab["FMS_GROUP"].value_counts()
    .rename_axis("group").reset_index(name="count")
)
by_fms_group["count"] = by_fms_group["count"].astype(int)

# 월별 FMS 서비스 건수 추이 (최근 24개월, Agora+BPKTWS)
propo_ab["YM"] = propo_ab["PROPO_DT"].dt.to_period("M")
recent_start_p = pd.Period("2024-07", "M")
by_month_fms = (
    propo_ab[propo_ab["YM"] >= recent_start_p]
    .groupby("YM")
    .size()
    .reset_index(name="count")
)
by_month_fms["month"] = by_month_fms["YM"].astype(str)
by_month_fms["count"] = by_month_fms["count"].astype(int)

# 연차별 FMS 잔여비율 (from CSV)
csv_path = DATA_DIR / "results" / "fms_remaining_ratio_by_age.csv"
if csv_path.exists():
    age_df = pd.read_csv(csv_path)
    age_df["VEHICLE_AGE_YEAR"] = age_df["VEHICLE_AGE_YEAR"].astype(int)
    age_df["avg_remaining_ratio"] = (age_df["avg_remaining_ratio"] * 100).round(1)
    age_df["pct_has_remaining"] = (age_df["pct_has_remaining"] * 100).round(1)
    age_df["avg_fms_cumulative"] = age_df["avg_fms_cumulative"].round(2)
    age_df["vehicle_count"] = age_df["vehicle_count"].astype(int)
    by_age_list = age_df.to_dict("records")
else:
    by_age_list = []

# CR 타겟 요약
cr_path = DATA_DIR / "results" / "cr_fms_targets.csv"
if cr_path.exists():
    cr_df = pd.read_csv(cr_path)
    cr_total = len(cr_df)
    cr_by_age = cr_df.groupby("VEHICLE_AGE_YEAR").size().reset_index(name="count")
    cr_by_age["count"] = cr_by_age["count"].astype(int)
    cr_by_model = (
        cr_df["MODEL_CD"].value_counts().head(10)
        .rename_axis("model").reset_index(name="count")
    )
    cr_by_model["count"] = cr_by_model["count"].astype(int)
else:
    cr_total = 0
    cr_by_age = pd.DataFrame(columns=["VEHICLE_AGE_YEAR", "count"])
    cr_by_model = pd.DataFrame(columns=["model", "count"])

# FMS 차수별 건수 (FMS_1차~FMS_5차, PMS_1차~, SMS_1차~)
fms_detail = (
    propo_ab[propo_ab["FMS_GROUP"] != "기타"]
    .groupby(["FMS_GROUP", "FMS_LABEL"])
    .size()
    .reset_index(name="count")
    .sort_values(["FMS_GROUP", "FMS_LABEL"])
)
fms_detail["count"] = fms_detail["count"].astype(int)

coupon_data = {
    "kpi": {
        "total_fms": int(total_fms),
        "unique_vins": int(unique_vins),
        "cr_targets": int(cr_total),
        "fms_count": int(propo_ab[propo_ab["FMS_GROUP"] == "FMS"].shape[0]),
        "pms_count": int(propo_ab[propo_ab["FMS_GROUP"] == "PMS"].shape[0]),
        "sms_count": int(propo_ab[propo_ab["FMS_GROUP"] == "SMS"].shape[0]),
    },
    "by_age": by_age_list,
    "by_fms_label": by_fms_label.to_dict("records"),
    "by_fms_group": by_fms_group.to_dict("records"),
    "fms_detail": fms_detail.to_dict("records"),
    "by_month": by_month_fms[["month", "count"]].to_dict("records"),
    "cr_by_age": cr_by_age.to_dict("records"),
    "cr_by_model": cr_by_model.to_dict("records"),
}
save_json(coupon_data, "coupon.json")


# ─────────────────────────────────────────────────────────────
# 4. 챗봇용 데이터 요약 (summary.json)
# ─────────────────────────────────────────────────────────────
print("\n=== 챗봇 요약 데이터 생성 ===")

summary = {
    "last_updated": "2026-06-24",
    "description": "Toyota/Lexus Korea 통합 데이터 요약",
    "inventory": {
        "total_vehicles": int(total),
        "lexus": int(brand_counts.get("Lexus", 0)),
        "toyota": int(brand_counts.get("Toyota", 0)),
        "first_owner": int(kv["first_owner_yn"].eq("Y").sum()),
        "top_models": by_model_list[:10],
        "delivery_by_year": by_year_list,
        "by_model_year": by_my_list[:8],
        "note": "Karete 통합 데이터 기준 (Lexus LDMS + Toyota TDMS)"
    },
    "contracts": {
        "total": int(total_c),
        "completed": int(completed),
        "completion_rate": round(completed / total_c * 100, 1) if total_c else 0,
        "lexus": int(kc["brand"].eq("Lexus").sum()),
        "toyota": int(kc["brand"].eq("Toyota").sum()),
        "monthly_trend_last12": by_month_c[["month", "count"]].tail(12).to_dict("records"),
        "by_model_top10": by_model_c.head(10).to_dict("records"),
        "by_status": by_stat.to_dict("records"),
        "note": "Karete 통합 계약 데이터 기준"
    },
    "fms_coupon": {
        "total_fms_services": int(total_fms),
        "unique_vins": int(unique_vins),
        "cr_targets": int(cr_total),
        "fms_count": int(propo_ab[propo_ab["FMS_GROUP"] == "FMS"].shape[0]),
        "pms_count": int(propo_ab[propo_ab["FMS_GROUP"] == "PMS"].shape[0]),
        "sms_count": int(propo_ab[propo_ab["FMS_GROUP"] == "SMS"].shape[0]),
        "remaining_by_age": by_age_list,
        "note": "FMS=신차 무상점검 쿠폰(1~5차), PMS=연장 유상 패키지(6~11차), SMS=스마트 패키지(12차~)"
    }
}
save_json(summary, "summary.json")

print("\nDONE: 모든 데이터 파일 생성 완료")
print(f"  출력 경로: {OUT_DIR.resolve()}")
