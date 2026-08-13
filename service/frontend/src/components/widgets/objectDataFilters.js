import { tableRowsFromProps } from './tableModel.js'
import { formatTemporalAxisValue, inferTemporalGrain } from './axisFormat.js'

const TEMPORAL_FIELD = /date|month|week|quarter|year|time|\uC77C\uC790|\uC6D4|\uC8FC|\uBD84\uAE30|\uB144|\uAE30\uAC04/i
const FILTER_OPTION_LIMIT = 100

function asObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {}
}

function comparableText(value) {
  return String(value ?? '').trim()
}

function isNumericValue(value) {
  if (typeof value === 'number') return Number.isFinite(value)
  const text = comparableText(value).replaceAll(',', '')
  return text !== '' && Number.isFinite(Number(text))
}

function isTemporalValue(value) {
  return /^\d{4}(?:[-./]\d{1,2}(?:[-./]\d{1,2})?|\s*(?:Q[1-4]|W\d{1,2}))/.test(comparableText(value))
}

function optionSort(left, right, temporal) {
  if (temporal) return left.value.localeCompare(right.value, 'ko', { numeric: true })
  return left.label.localeCompare(right.label, 'ko', { numeric: true })
}

export function objectRowsFromProps(props = {}) {
  if (Array.isArray(props.data)) return props.data.filter((row) => row && typeof row === 'object' && !Array.isArray(row))
  if (Array.isArray(props.rows)) return tableRowsFromProps(props.columns, props.rows)
  return []
}

export function objectFilterCandidates({ props, objectSpec, includeSingleValueFields = [], includeSingleValueTemporalFields = false } = {}) {
  const rows = objectRowsFromProps(props)
  const columnMap = asObject(objectSpec?.vizSpec?.columnMap)
  const tableColumns = Array.isArray(objectSpec?.tableSpec?.columns) ? objectSpec.tableSpec.columns : []
  const tableLabels = Object.fromEntries(tableColumns.filter((column) => column?.field).map((column) => [column.field, column.headerName || column.field]))
  const explicitlyConfigured = new Set(Array.isArray(includeSingleValueFields) ? includeSingleValueFields : [])
  const fields = [...new Set(rows.flatMap((row) => Object.keys(row)))]
  return fields.flatMap((field) => {
    const values = [...new Set(rows.map((row) => comparableText(row?.[field])).filter(Boolean))]
    const temporal = TEMPORAL_FIELD.test(field) || (values.length > 0 && values.every(isTemporalValue))
    const stringField = values.length > 0 && values.some((value) => !isNumericValue(value))
    const includeSingleValue = explicitlyConfigured.has(field) || (includeSingleValueTemporalFields && temporal)
    if ((!temporal && !stringField) || (!includeSingleValue && values.length < 2) || (!explicitlyConfigured.has(field) && values.length > FILTER_OPTION_LIMIT)) return []
    const grain = temporal ? inferTemporalGrain(values) : null
    const options = values.map((value) => ({ value, label: temporal ? formatTemporalAxisValue(value, 'auto', grain) : value })).sort((left, right) => optionSort(left, right, temporal))
    return [{
      field,
      label: tableLabels[field] || columnMap[field]?.label || field,
      temporal,
      grain,
      options,
    }]
  })
}

export function configuredObjectFilterControls({ props, objectSpec } = {}) {
  const configured = objectSpec?.dataFilters?.fields
  const candidates = objectFilterCandidates({ props, objectSpec, includeSingleValueFields: configured })
  if (Array.isArray(configured)) {
    const candidatesByField = new Map(candidates.map((candidate) => [candidate.field, candidate]))
    return configured.map((field) => candidatesByField.get(field)).filter(Boolean)
  }
  // Existing objects become useful immediately while explicit settings remain
  // authoritative after the user saves the object.
  return candidates.slice(0, 3)
}

export function filterObjectRows(rows, filters = {}) {
  const state = asObject(filters)
  const active = Object.entries(state).filter(([, value]) => comparableText(value))
  if (!active.length) return Array.isArray(rows) ? rows : []
  return (Array.isArray(rows) ? rows : []).filter((row) => active.every(([field, value]) => comparableText(row?.[field]) === comparableText(value)))
}

function numericValue(value) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
  const text = comparableText(value).replaceAll(',', '')
  const parsed = Number(text)
  return text !== '' && Number.isFinite(parsed) ? parsed : null
}

function rateLikeField(field) {
  return /rate|ratio|percent|percentage|달성률|진척률|전환율/i.test(String(field || ''))
}

// A query may retain additional dimensions solely to drive object-level filters.
// Chart renderers need one point per displayed X value, so after filters are
// selected we aggregate the retained detail rows back to that visible grain.
export function aggregateChartRows(rows, xField, valueFields = [], derivations = []) {
  const sourceRows = Array.isArray(rows) ? rows : []
  const metrics = [...new Set((valueFields || []).filter(Boolean))]
  if (!xField || !metrics.length || sourceRows.length < 2) return sourceRows

  const validDerivations = (Array.isArray(derivations) ? derivations : []).filter((derivation) => (
    derivation?.numerator && derivation?.denominator && derivation?.outputKey
  ))
  const derivedFields = new Set(validDerivations.map((derivation) => derivation.outputKey))
  const aggregateFields = [...new Set([
    ...metrics.filter((field) => !derivedFields.has(field)),
    ...validDerivations.flatMap((derivation) => [derivation.numerator, derivation.denominator]),
  ])]

  const groups = new Map()
  for (const row of sourceRows) {
    const key = comparableText(row?.[xField])
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key).push(row)
  }
  if (groups.size === sourceRows.length) return sourceRows

  return [...groups.values()].map((group) => {
    const result = { ...group[0] }
    for (const field of aggregateFields) {
      const values = group.map((row) => numericValue(row?.[field])).filter((value) => value !== null)
      if (!values.length) continue
      result[field] = rateLikeField(field)
        ? values.reduce((total, value) => total + value, 0) / values.length
        : values.reduce((total, value) => total + value, 0)
    }
    for (const derivation of validDerivations) {
      const numerator = numericValue(result[derivation.numerator]) ?? 0
      const denominator = numericValue(result[derivation.denominator]) ?? 0
      result[derivation.outputKey] = denominator === 0
        ? (derivation.zeroDenominatorResult ?? null)
        : numerator / denominator
    }
    return result
  })
}

export function cascadedObjectFilterControls(rows, controls, filters = {}) {
  return (Array.isArray(controls) ? controls : []).map((control) => {
    const otherFilters = { ...asObject(filters) }
    delete otherFilters[control.field]
    const scopedRows = filterObjectRows(rows, otherFilters)
    const options = [...new Set(scopedRows.map((row) => comparableText(row?.[control.field])).filter(Boolean))]
      .map((value) => ({ value, label: control.temporal ? formatTemporalAxisValue(value, 'auto', control.grain) : value }))
      .sort((left, right) => optionSort(left, right, control.temporal))
    return { ...control, options }
  })
}
