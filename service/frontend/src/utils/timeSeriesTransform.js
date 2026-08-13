function dimensionFields(value) {
  const fields = Array.isArray(value) ? value : (value ? [value] : [])
  return [...new Set(fields.filter(Boolean))]
}

function dimensionKey(row, fields) {
  return JSON.stringify(fields.map((field) => row?.[field] ?? null))
}

function compareDimensionValues(left, right, fields) {
  for (const field of fields) {
    const comparison = String(left?.[field] ?? '').localeCompare(String(right?.[field] ?? ''), 'ko', { numeric: true })
    if (comparison !== 0) return comparison
  }
  return 0
}

function temporalComparable(value) {
  if (value instanceof Date) return Number.isFinite(value.getTime()) ? value.getTime() : null
  const text = String(value ?? '').trim()
  if (!text) return null
  const dateOnly = text.match(/^(\d{4})[-./](\d{1,2})[-./](\d{1,2})/)
  if (dateOnly) return Date.UTC(Number(dateOnly[1]), Number(dateOnly[2]) - 1, Number(dateOnly[3]))
  const monthOnly = text.match(/^(\d{4})[-./](\d{1,2})$/)
  if (monthOnly) return Date.UTC(Number(monthOnly[1]), Number(monthOnly[2]) - 1, 1)
  const timestamp = Date.parse(text)
  return Number.isFinite(timestamp) ? timestamp : null
}

function compareTimeValues(left, right, field) {
  const leftValue = temporalComparable(left?.[field])
  const rightValue = temporalComparable(right?.[field])
  if (leftValue !== null && rightValue !== null && leftValue !== rightValue) return leftValue - rightValue
  return String(left?.[field] ?? '').localeCompare(String(right?.[field] ?? ''), 'ko', { numeric: true })
}

function numericValue(value) {
  const number = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(number) ? number : 0
}

function sortedTimeRows(rows, dimId) {
  const fields = dimensionFields(dimId)
  const timeField = fields.find((field) => field === 'time_month' || field === 'time_day') || fields[0]
  const partitionFields = fields.filter((field) => field !== timeField)
  const sorted = [...rows].sort((left, right) => {
    const partitionComparison = compareDimensionValues(left, right, partitionFields)
    return partitionComparison || compareTimeValues(left, right, timeField)
  })
  return { fields, partitionFields, sorted }
}

// Fabric returns SQL DATE values as Date objects. Sorting String(date) sorts
// weekday names, not calendar order, so all time transforms use epoch values.
export function applyTimeSeriesTransform(rows, { dimId, metricIds, transform }) {
  const { fields, partitionFields, sorted } = sortedTimeRows(Array.isArray(rows) ? rows : [], dimId)
  if (!transform || transform === 'none' || !fields.length || !sorted.length) return Array.isArray(rows) ? rows : []
  const partitionKey = (row) => dimensionKey(row, partitionFields)

  if (transform === 'cumulative') {
    const runningByPartition = new Map()
    return sorted.map((row) => {
      const out = { ...row }
      const key = partitionKey(row)
      const running = runningByPartition.get(key) || {}
      for (const metricId of metricIds || []) {
        running[metricId] = (running[metricId] ?? 0) + numericValue(row[metricId])
        out[metricId] = running[metricId]
      }
      runningByPartition.set(key, running)
      return out
    })
  }

  if (transform === 'mom_change_pct') {
    const previousByPartition = new Map()
    return sorted.map((row) => {
      const out = { ...row }
      const key = partitionKey(row)
      const previous = previousByPartition.get(key) || {}
      for (const metricId of metricIds || []) {
        const current = numericValue(row[metricId])
        const before = previous[metricId]
        out[metricId] = (before === undefined || before === 0) ? null : (current - before) / before
        previous[metricId] = current
      }
      previousByPartition.set(key, previous)
      return out
    })
  }

  return sorted
}

export function reverseCumulativeTimeSeriesTransform(rows, { dimId, metricIds }) {
  const { fields, partitionFields, sorted } = sortedTimeRows(Array.isArray(rows) ? rows : [], dimId)
  if (!fields.length || !sorted.length) return Array.isArray(rows) ? rows : []
  const partitionKey = (row) => dimensionKey(row, partitionFields)
  const previousByPartition = new Map()
  return sorted.map((row) => {
    const out = { ...row }
    const key = partitionKey(row)
    const previous = previousByPartition.get(key) || {}
    for (const metricId of metricIds || []) {
      const current = numericValue(row[metricId])
      out[metricId] = current - (previous[metricId] ?? 0)
      previous[metricId] = current
    }
    previousByPartition.set(key, previous)
    return out
  })
}
