import { readFileSync } from 'node:fs'
import { join } from 'node:path'

// Semantic/metric layer: maps a stable metric id to (a) where its real,
// pre-aggregated value lives in public/data/*.json, and (b) a "SQL hint"
// grounded in the actual warehouse table/column names (see
// louis/docs/DB정의서_Karete.md, DB정의서_Agora.md, and generate_data.py,
// which reads karete_co_vehic / karete_om_contract / agora_svc_propo).
//
// The SQL built from sqlHint is DISPLAY-ONLY — this app has no live DB
// connection. Actual chart data always comes from resolveMetricRaw(), which
// reads the same JSON files the rest of the dashboard already uses.
export const METRIC_CATALOG = {
  'inventory.kpi': {
    label: '재고 핵심 지표(KPI)', dataset: 'inventory', jsonPath: 'kpi', shape: 'kpi',
    defaultChartTypes: ['kpi'],
    cardsFrom: [
      { key: 'total', title: '총 등록 차량', sub: 'Lexus + Toyota' },
      { key: 'lexus', title: 'Lexus 등록 대수' },
      { key: 'toyota', title: 'Toyota 등록 대수' },
      { key: 'first_owner', title: '최초소유 차량' },
    ],
    sqlHint: {
      table: 'karete_co_vehic', columns: ['VIN', 'SOURCE_SYSTEM', 'FIRST_OWNER_YN'],
      aggregation: "COUNT(DISTINCT VIN) AS total,\n       SUM(CASE WHEN SOURCE_SYSTEM='LDMS' THEN 1 ELSE 0 END) AS lexus,\n       SUM(CASE WHEN SOURCE_SYSTEM='TDMS' THEN 1 ELSE 0 END) AS toyota,\n       SUM(CASE WHEN FIRST_OWNER_YN='Y' THEN 1 ELSE 0 END) AS first_owner",
    },
  },
  'inventory.by_model': {
    label: '차종별 재고 등록 대수', dataset: 'inventory', jsonPath: 'by_model', shape: 'breakdown',
    defaultChartTypes: ['bar', 'pie', 'table'],
    fields: { labelKey: 'model', valueKey: 'count' },
    sqlHint: {
      table: 'karete_co_vehic', columns: ['VEHICLE_MODEL_CODE'],
      aggregation: 'COUNT(*) AS cnt', groupBy: 'VEHICLE_MODEL_CODE', orderBy: 'cnt DESC', limit: 15,
    },
  },
  'inventory.by_year': {
    label: '연도별 출고 대수 추이', dataset: 'inventory', jsonPath: 'by_year', shape: 'trend',
    defaultChartTypes: ['line', 'bar', 'table'],
    fields: { labelKey: 'year', valueKey: 'count' },
    sqlHint: {
      table: 'karete_co_vehic', columns: ['DELIVERY_DATE'],
      aggregation: 'COUNT(*) AS cnt', groupBy: 'YEAR(DELIVERY_DATE)', orderBy: 'YEAR(DELIVERY_DATE)',
    },
  },
  'contract.kpi': {
    label: '계약 핵심 지표(KPI)', dataset: 'contract', jsonPath: 'kpi', shape: 'kpi',
    defaultChartTypes: ['kpi'],
    cardsFrom: [
      { key: 'total', title: '총 계약 건수' },
      { key: 'completed', title: '출고완료 건수' },
      { key: 'lexus', title: 'Lexus 계약' },
      { key: 'toyota', title: 'Toyota 계약' },
    ],
    sqlHint: {
      table: 'karete_om_contract', columns: ['CONTRACT_NUMBER', 'CONTRACT_STAT_NAME', 'SOURCE_SYSTEM'],
      aggregation: "COUNT(*) AS total,\n       SUM(CASE WHEN CONTRACT_STAT_NAME='출고완료' THEN 1 ELSE 0 END) AS completed,\n       SUM(CASE WHEN SOURCE_SYSTEM='LDMS' THEN 1 ELSE 0 END) AS lexus,\n       SUM(CASE WHEN SOURCE_SYSTEM='TDMS' THEN 1 ELSE 0 END) AS toyota",
    },
  },
  'contract.by_month': {
    label: '월별 계약 건수 추이(최근 24개월)', dataset: 'contract', jsonPath: 'by_month', shape: 'trend',
    defaultChartTypes: ['line', 'bar', 'table'],
    fields: { labelKey: 'month', valueKey: 'count' },
    sqlHint: {
      table: 'karete_om_contract', columns: ['LAST_RETAIL_SALES_DATE'],
      aggregation: 'COUNT(*) AS cnt', groupBy: "FORMAT(LAST_RETAIL_SALES_DATE,'yyyy-MM')",
      whereHint: 'LAST_RETAIL_SALES_DATE >= DATEADD(month,-24,GETDATE())',
    },
  },
  'contract.by_status': {
    label: '계약 상태별 건수', dataset: 'contract', jsonPath: 'by_status', shape: 'breakdown',
    defaultChartTypes: ['pie', 'bar', 'table'],
    fields: { labelKey: 'stat', valueKey: 'count' },
    sqlHint: {
      table: 'karete_om_contract', columns: ['CONTRACT_STAT_NAME'],
      aggregation: 'COUNT(*) AS cnt', groupBy: 'CONTRACT_STAT_NAME', orderBy: 'cnt DESC',
    },
  },
  'contract.by_brand': {
    label: '브랜드별 계약 비율', dataset: 'contract', jsonPath: 'by_brand', shape: 'breakdown',
    defaultChartTypes: ['pie', 'bar', 'table'],
    fields: { labelKey: 'brand', valueKey: 'count' },
    sqlHint: {
      table: 'karete_om_contract', columns: ['SOURCE_SYSTEM'],
      aggregation: 'COUNT(*) AS cnt', groupBy: 'SOURCE_SYSTEM',
    },
  },
  'contract.by_sales_type': {
    label: '판매 유형별 계약 건수', dataset: 'contract', jsonPath: 'by_sales_type', shape: 'breakdown',
    defaultChartTypes: ['bar', 'table'],
    fields: { labelKey: 'type', valueKey: 'count' },
    sqlHint: {
      table: 'karete_om_contract', columns: ['SALES_TYPE_NAME'],
      aggregation: 'COUNT(*) AS cnt', groupBy: 'SALES_TYPE_NAME', orderBy: 'cnt DESC', limit: 8,
    },
  },
  'coupon.kpi': {
    label: 'FMS/PMS/SMS 핵심 지표(KPI)', dataset: 'coupon', jsonPath: 'kpi', shape: 'kpi',
    defaultChartTypes: ['kpi'],
    cardsFrom: [
      { key: 'total_fms', title: '총 FMS 서비스 건수' },
      { key: 'unique_vins', title: '서비스 이용 차량 수' },
      { key: 'cr_targets', title: 'CR 타겟 차량' },
    ],
    sqlHint: {
      table: 'agora_svc_propo', columns: ['VIN', 'PROPO_SEQ', 'SVC_TYPE_FMS_CD'],
      aggregation: 'COUNT(*) AS total_fms,\n       COUNT(DISTINCT VIN) AS unique_vins',
    },
  },
  'coupon.by_fms_group': {
    label: 'FMS/PMS/SMS 그룹별 서비스 건수', dataset: 'coupon', jsonPath: 'by_fms_group', shape: 'breakdown',
    defaultChartTypes: ['pie', 'bar', 'table'],
    fields: { labelKey: 'group', valueKey: 'count' },
    sqlHint: {
      table: 'agora_svc_propo', columns: ['SVC_TYPE_FMS_CD'],
      aggregation: 'COUNT(*) AS cnt', groupBy: 'FMS_GROUP(SVC_TYPE_FMS_CD)',
    },
  },
  'coupon.by_month': {
    label: '월별 FMS 서비스 건수 추이', dataset: 'coupon', jsonPath: 'by_month', shape: 'trend',
    defaultChartTypes: ['line', 'bar', 'table'],
    fields: { labelKey: 'month', valueKey: 'count' },
    sqlHint: {
      table: 'agora_svc_propo', columns: ['PROPO_DT'],
      aggregation: 'COUNT(*) AS cnt', groupBy: "FORMAT(PROPO_DT,'yyyy-MM')",
    },
  },
  'coupon.cr_by_age': {
    label: '연차별 CR 타겟 차량 수', dataset: 'coupon', jsonPath: 'cr_by_age', shape: 'breakdown',
    defaultChartTypes: ['bar', 'table'],
    fields: { labelKey: 'VEHICLE_AGE_YEAR', valueKey: 'count' },
    sqlHint: {
      table: 'cr_fms_targets', columns: ['VEHICLE_AGE_YEAR'],
      aggregation: 'COUNT(*) AS cnt', groupBy: 'VEHICLE_AGE_YEAR', orderBy: 'VEHICLE_AGE_YEAR',
    },
  },
}

export function getMetric(metricId) {
  return METRIC_CATALOG[metricId] || null
}

export function listMetricsForPrompt() {
  return Object.entries(METRIC_CATALOG)
    .map(([id, m]) => `- ${id}: ${m.label} (shape=${m.shape}, 차트타입=${m.defaultChartTypes.join('/')})`)
    .join('\n')
}

// The real, pre-aggregated data behind a metric — always from public/data/*.json,
// never generated by the LLM.
export function resolveMetricRaw(metricId, dataDir) {
  const metric = getMetric(metricId)
  if (!metric) return undefined
  const json = JSON.parse(readFileSync(join(dataDir, `${metric.dataset}.json`), 'utf-8'))
  return json[metric.jsonPath]
}

// Display-only SQL string grounded in the real warehouse schema. Never executed.
export function buildSqlForMetric(metricId) {
  const metric = getMetric(metricId)
  if (!metric?.sqlHint) return null
  const { table, aggregation, groupBy, orderBy, limit, whereHint } = metric.sqlHint
  let sql = `SELECT ${groupBy ? `${groupBy} AS key,\n       ` : ''}${aggregation}\nFROM ${table}`
  if (whereHint) sql += `\nWHERE ${whereHint}`
  if (groupBy) sql += `\nGROUP BY ${groupBy}`
  if (orderBy) sql += `\nORDER BY ${orderBy}`
  if (limit) sql += `\nLIMIT ${limit}`
  return sql
}
