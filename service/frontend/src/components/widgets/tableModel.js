import { formatDashboardValue } from '../../utils/dashboardObject.js'
import { normalizeTableTypography } from '../../utils/dashboardTypography.js'
import { formatTemporalAxisValue, inferTemporalGrain } from './axisFormat.js'

const STATUS_TONES = {
  success: new Set(['\uC815\uC0C1', '\uC644\uB8CC', '\uC131\uACF5', '\uC591\uD638', '\uC2B9\uC778', 'active', 'success', 'ok']),
  warning: new Set(['\uACBD\uACE0', '\uC8FC\uC758', '\uC9C0\uC5F0', '\uB300\uAE30', '\uBCF4\uD1B5', 'warning', 'pending']),
  danger: new Set(['\uC624\uB958', '\uC704\uD5D8', '\uC2E4\uD328', '\uCDE8\uC18C', '\uBC18\uB824', 'danger', 'error', 'failed', 'cancelled']),
}

const RATE_FIELD = /rate|ratio|percent|achievement|score|\uB2EC\uC131\uB960|\uBE44\uC728|\uC728|%/i
const TREND_FIELD = /delta|change|diff|growth|\uC99D\uAC10|\uBCC0\uD654/i
const STATUS_FIELD = /status|state|grade|\uC0C1\uD0DC|\uB4F1\uAE09/i
const DATE_FIELD = /date|day|month|week|quarter|year|time|\uC77C\uC790|\uC6D4|\uC8FC|\uBD84\uAE30|\uB144/i
const CURRENCY_FIELD = /amount|revenue|sales|price|cost|\uAE08\uC561|\uB9E4\uCD9C|\uB2E8\uAC00|\uBE44\uC6A9/i
const SORT_PRIORITY = /rate|ratio|achievement|score|amount|count|value|\uB2EC\uC131\uB960|\uBE44\uC728|\uC810\uC218|\uAE08\uC561|\uAC74\uC218/i

function asObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {}
}

function meaningfulValues(rows, field) {
  return rows.map((row) => row?.[field]).filter((value) => value !== null && value !== undefined && String(value).trim() !== '')
}

function numeric(value) {
  const parsed = typeof value === 'number' ? value : Number(String(value ?? '').replaceAll(',', ''))
  return Number.isFinite(parsed) ? parsed : null
}

function isNumeric(values) {
  return values.length > 0 && values.every((value) => numeric(value) !== null)
}

function normalizedField(field) {
  return String(field || '').replaceAll('_', ' ')
}

function percentBaseFor(values, format = {}) {
  if (Number.isFinite(format.percentBase) && format.percentBase > 0) return format.percentBase
  const max = Math.max(...values.map((value) => Math.abs(numeric(value) ?? 0)), 0)
  return max > 1.5 ? 100 : 1
}

function inferredRenderer(field, values) {
  const fieldText = normalizedField(field)
  if (STATUS_FIELD.test(fieldText)) return 'status-badge'
  if (DATE_FIELD.test(fieldText) && !isNumeric(values)) return 'date'
  if (!isNumeric(values)) return 'text'
  if (RATE_FIELD.test(fieldText)) return 'progress-bar'
  if (TREND_FIELD.test(fieldText)) return 'trend'
  if (CURRENCY_FIELD.test(fieldText)) return 'currency'
  return 'number'
}

function defaultAlign(renderer) {
  return ['number', 'currency', 'percent', 'progress-bar', 'trend'].includes(renderer) ? 'right' : 'left'
}

function defaultToneRules(renderer, field) {
  if (renderer === 'progress-bar' && RATE_FIELD.test(normalizedField(field))) {
    return [
      { operator: 'lt', value: 0.7, tone: 'danger' },
      { operator: 'between', value: 0.7, valueTo: 0.9, tone: 'warning' },
      { operator: 'gte', value: 0.9, tone: 'success' },
    ]
  }
  if (renderer === 'trend') return [{ operator: 'lt', value: 0, tone: 'danger' }, { operator: 'gte', value: 0, tone: 'success' }]
  return undefined
}

function defaultFormat(renderer, values) {
  if (renderer === 'progress-bar' || renderer === 'percent') {
    return { percent: true, percentBase: percentBaseFor(values), decimals: 1 }
  }
  if (renderer === 'currency') return { decimals: 0 }
  if (renderer === 'number' || renderer === 'trend') return { decimals: 0 }
  return undefined
}

function defaultProgress(values, renderer) {
  if (renderer !== 'progress-bar') return undefined
  const percentBase = percentBaseFor(values)
  return {
    min: 0,
    max: percentBase,
    target: percentBase,
    showValue: true,
    fillColor: '#2563EB',
    successColor: '#059669',
    warningColor: '#D97706',
    dangerColor: '#E11D48',
    showTargetMarker: true,
  }
}

function defaultColumn(field, rows, label) {
  const values = meaningfulValues(rows, field)
  const renderer = inferredRenderer(field, values)
  const width = renderer === 'progress-bar' ? 188 : renderer === 'text' || renderer === 'status-badge' ? 140 : 112
  return {
    field,
    headerName: label || field,
    visible: true,
    align: defaultAlign(renderer),
    minWidth: width,
    maxWidth: renderer === 'text' ? 280 : undefined,
    sortable: true,
    filter: renderer === 'text' || renderer === 'status-badge' || renderer === 'date',
    resizable: false,
    cellRenderer: renderer,
    ...(defaultFormat(renderer, values) ? { format: defaultFormat(renderer, values) } : {}),
    ...(defaultProgress(values, renderer) ? { progress: defaultProgress(values, renderer) } : {}),
    ...(defaultToneRules(renderer, field) ? { toneRules: defaultToneRules(renderer, field) } : {}),
  }
}

export function tableRowsFromProps(columns, rows) {
  const fields = Array.isArray(columns) ? columns.filter(Boolean) : []
  return (Array.isArray(rows) ? rows : []).map((row) => {
    if (!Array.isArray(row)) return asObject(row)
    return Object.fromEntries(fields.map((field, index) => [field, row[index]]))
  })
}

export function buildTableColumns({ columns, rows, tableSpec, columnMap } = {}) {
  const normalizedRows = tableRowsFromProps(columns, rows)
  const fields = Array.isArray(columns) && columns.length
    ? columns.filter(Boolean)
    : Object.keys(normalizedRows[0] || {})
  const savedByField = new Map((Array.isArray(tableSpec?.columns) ? tableSpec.columns : [])
    .filter((column) => column?.field)
    .map((column) => [column.field, column]))
  return fields.map((field) => {
    const saved = asObject(savedByField.get(field))
    const { hidden: legacyHidden, visible: savedVisible, ...savedColumn } = saved
    const inferred = defaultColumn(field, normalizedRows, columnMap?.[field]?.label)
    return {
      ...inferred,
      ...savedColumn,
      // 2026-08-04 leo: 기존 "hidden"은 설정 화면의 "컬럼 표시" 체크 의미와 반대여서
      // 저장값과 화면 결과가 혼동됐다. 신규 계약은 visible=true/false 하나로 고정하고,
      // DB 마이그레이션 전의 객체만 여기서 한 번 읽어 안전하게 변환한다.
      visible: typeof savedVisible === 'boolean' ? savedVisible : legacyHidden !== true,
      headerName: savedColumn.headerName || inferred.headerName,
      align: savedColumn.align || inferred.align,
      cellRenderer: savedColumn.cellRenderer || inferred.cellRenderer,
      format: { ...inferred.format, ...asObject(savedColumn.format) },
      progress: { ...inferred.progress, ...asObject(savedColumn.progress) },
      toneRules: Array.isArray(savedColumn.toneRules) ? savedColumn.toneRules : inferred.toneRules,
    }
  })
}

export function inferredTableSpec({ columns, rows, tableSpec, columnMap } = {}) {
  const normalizedRows = tableRowsFromProps(columns, rows)
  const resolvedColumns = buildTableColumns({ columns, rows, tableSpec, columnMap })
  const defaultSortField = resolvedColumns.find((column) => SORT_PRIORITY.test(normalizedField(column.field)))?.field
    || resolvedColumns.find((column) => ['number', 'currency', 'progress-bar', 'trend'].includes(column.cellRenderer))?.field
  const temporalField = resolvedColumns.find((column) => column.cellRenderer === 'date')?.field
  const keyField = resolvedColumns.find((column) => /(^|_)(id|key|code)($|_)/i.test(column.field))?.field
  return {
    ...(asObject(tableSpec)),
    columns: resolvedColumns,
    rowKeyField: tableSpec?.rowKeyField || keyField,
    density: tableSpec?.density || 'comfortable',
    typography: normalizeTableTypography(tableSpec?.typography),
    showHeader: tableSpec?.showHeader !== false,
    stickyHeader: tableSpec?.stickyHeader !== false,
    scroll: {
      x: true,
      y: true,
      stickyHeader: tableSpec?.scroll?.stickyHeader !== false,
      stickyFirstColumn: tableSpec?.scroll?.stickyFirstColumn === true,
      ...asObject(tableSpec?.scroll),
    },
    pagination: tableSpec?.pagination === false ? false : (tableSpec?.pagination || (normalizedRows.length > 50 ? { pageSize: 50 } : false)),
    defaultSort: tableSpec?.defaultSort || (temporalField ? { field: temporalField, direction: 'asc' } : defaultSortField ? { field: defaultSortField, direction: 'desc' } : undefined),
    emptyText: tableSpec?.emptyText || '\uC870\uD68C\uB41C \uB370\uC774\uD130\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4.',
  }
}

export function sortTableRows(rows, field, direction = 'asc') {
  if (!field || !['asc', 'desc'].includes(direction)) return [...rows]
  const factor = direction === 'desc' ? -1 : 1
  return [...rows].sort((left, right) => {
    const leftValue = left?.[field]
    const rightValue = right?.[field]
    const leftNumber = numeric(leftValue)
    const rightNumber = numeric(rightValue)
    if (leftNumber !== null && rightNumber !== null && leftNumber !== rightNumber) return (leftNumber - rightNumber) * factor
    return String(leftValue ?? '').localeCompare(String(rightValue ?? ''), 'ko', { numeric: true }) * factor
  })
}

export function formatTableValue(value, column = {}) {
  if (value === null || value === undefined || value === '') return '-'
  const renderer = column.cellRenderer
  const format = asObject(column.format)
  const number = numeric(value)
  if (renderer === 'date') return formatTemporalAxisValue(value, 'auto', inferTemporalGrain([value]))
  if (number === null || ['text', 'badge', 'status-badge', 'link'].includes(renderer)) return String(value)
  if (renderer === 'percent' || format.percent) {
    const base = Number.isFinite(format.percentBase) && format.percentBase > 0 ? format.percentBase : (Math.abs(number) <= 1.5 ? 1 : 100)
    const formatted = formatDashboardValue(number / base, { percent: true, decimals: format.decimals ?? 1 })
    return format.unit && format.unit !== '%' ? `${formatted} ${format.unit}` : formatted
  }
  const formatted = formatDashboardValue(number, { compact: format.compact === true, decimals: format.decimals })
  return format.unit ? `${formatted} ${format.unit}` : formatted
}

export function statusTone(value) {
  const text = String(value ?? '').trim().toLowerCase()
  if (STATUS_TONES.success.has(text)) return 'success'
  if (STATUS_TONES.warning.has(text)) return 'warning'
  if (STATUS_TONES.danger.has(text)) return 'danger'
  return 'neutral'
}

export function toneForValue(value, toneRules) {
  const number = numeric(value)
  if (number === null || !Array.isArray(toneRules)) return null
  for (const rule of toneRules) {
    if (!rule || !Number.isFinite(rule.value)) continue
    const operator = rule.operator || 'gte'
    const matches = (operator === 'lt' && number < rule.value)
      || (operator === 'lte' && number <= rule.value)
      || (operator === 'gt' && number > rule.value)
      || (operator === 'gte' && number >= rule.value)
      || (operator === 'eq' && number === rule.value)
      || (operator === 'between' && Number.isFinite(rule.valueTo) && number >= rule.value && number <= rule.valueTo)
    if (matches) return rule.tone || null
  }
  return null
}

export function progressValue(value, progress = {}) {
  const current = numeric(value)
  if (current === null) return { percent: 0, current: null, target: null }
  const min = Number.isFinite(progress.min) ? progress.min : 0
  const target = Number.isFinite(progress.target) ? progress.target : (Number.isFinite(progress.max) ? progress.max : null)
  const max = Number.isFinite(progress.max) ? progress.max : (target ?? Math.max(current, 1))
  const percent = max > min ? Math.min(100, Math.max(0, ((current - min) / (max - min)) * 100)) : 0
  return { percent, current, target }
}
