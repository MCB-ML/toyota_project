import { formatDashboardValue } from '../../utils/dashboardObject.js'

const TIME_FORMATS = new Set(['auto', 'raw', 'day', 'month', 'week', 'quarter', 'year'])
const SORT_DIRECTIONS = new Set(['asc', 'desc', 'none'])
const AXIS_TARGET_INTERVALS = 7

function normalizedText(value) {
  return String(value ?? '').trim()
}

function dateParts(value) {
  const text = normalizedText(value)
  const match = text.match(/^(\d{4})[-./\s](\d{1,2})[-./\s](\d{1,2})(?:[T\s].*)?$/)
    || text.match(/^(\d{4})(\d{2})(\d{2})$/)
    || text.match(/^(\d{4})\s*\uB144\s*(\d{1,2})\s*\uC6D4\s*(\d{1,2})\s*\uC77C?$/)
  return match ? { year: Number(match[1]), month: Number(match[2]), day: Number(match[3]) } : null
}

function monthParts(value) {
  const text = normalizedText(value)
  const match = text.match(/^(\d{4})[-./\s](\d{1,2})$/)
    || text.match(/^(\d{4})\s*\uB144\s*(\d{1,2})\s*\uC6D4?$/)
  return match ? { year: Number(match[1]), month: Number(match[2]) } : null
}

function weekParts(value) {
  const text = normalizedText(value)
  const match = text.match(/^(\d{4})(?:\s*\uB144)?[-\s]*(?:W|week|\uC8FC|\uC8FC\uCC28)\s*(\d{1,2})$/i)
  return match ? { year: Number(match[1]), week: Number(match[2]) } : null
}

function quarterParts(value) {
  const text = normalizedText(value)
  const match = text.match(/^(\d{4})(?:\s*\uB144)?[-\s]*(?:Q|quarter|\uBD84\uAE30)\s*([1-4])$/i)
  return match ? { year: Number(match[1]), quarter: Number(match[2]) } : null
}

function yearParts(value) {
  const text = normalizedText(value)
  const match = text.match(/^(\d{4})(?:\s*(?:year|y|\uB144))?$/i)
  return match ? { year: Number(match[1]) } : null
}

export function inferTemporalGrain(values) {
  const meaningful = (values || []).map(normalizedText).filter(Boolean)
  if (!meaningful.length) return null
  const matches = (parser) => meaningful.every((value) => parser(value))
  if (matches(dateParts)) return 'day'
  if (matches(monthParts)) return 'month'
  if (matches(weekParts)) return 'week'
  if (matches(quarterParts)) return 'quarter'
  if (matches(yearParts)) return 'year'
  return null
}

function comparableValue(value, grain) {
  if (grain === 'day') {
    const parts = dateParts(value)
    return parts ? Date.UTC(parts.year, parts.month - 1, parts.day) : null
  }
  if (grain === 'month') {
    const parts = monthParts(value)
    return parts ? parts.year * 100 + parts.month : null
  }
  if (grain === 'week') {
    const parts = weekParts(value)
    return parts ? parts.year * 100 + parts.week : null
  }
  if (grain === 'quarter') {
    const parts = quarterParts(value)
    return parts ? parts.year * 10 + parts.quarter : null
  }
  if (grain === 'year') {
    const parts = yearParts(value)
    return parts ? parts.year : null
  }
  const number = Number(value)
  return Number.isFinite(number) && normalizedText(value) !== '' ? number : null
}

export function formatTemporalAxisValue(value, format = 'auto', inferredGrain = null) {
  const grain = TIME_FORMATS.has(format) && format !== 'auto' ? format : inferredGrain
  if (!grain || grain === 'raw') return normalizedText(value)
  if (grain === 'day') {
    const parts = dateParts(value)
    return parts ? `${parts.month}/${parts.day}` : normalizedText(value)
  }
  if (grain === 'month') {
    const parts = monthParts(value)
    return parts ? `${parts.year}.${String(parts.month).padStart(2, '0')}` : normalizedText(value)
  }
  if (grain === 'week') {
    const parts = weekParts(value)
    return parts ? `${parts.year} W${parts.week}` : normalizedText(value)
  }
  if (grain === 'quarter') {
    const parts = quarterParts(value)
    return parts ? `${parts.year} Q${parts.quarter}` : normalizedText(value)
  }
  if (grain === 'year') {
    const parts = yearParts(value)
    return parts ? String(parts.year) : normalizedText(value)
  }
  return normalizedText(value)
}

export function sortChartData(data, key, direction = 'asc') {
  if (!key || !SORT_DIRECTIONS.has(direction) || direction === 'none') return Array.isArray(data) ? data : []
  const rows = Array.isArray(data) ? [...data] : []
  const grain = inferTemporalGrain(rows.map((row) => row?.[key]))
  const multiplier = direction === 'desc' ? -1 : 1
  return rows.sort((left, right) => {
    const leftValue = left?.[key]
    const rightValue = right?.[key]
    const leftComparable = comparableValue(leftValue, grain)
    const rightComparable = comparableValue(rightValue, grain)
    if (leftComparable !== null && rightComparable !== null && leftComparable !== rightComparable) {
      return (leftComparable - rightComparable) * multiplier
    }
    return normalizedText(leftValue).localeCompare(normalizedText(rightValue), 'ko', { numeric: true }) * multiplier
  })
}

export function xAxisPresentation(data, key, { format = 'auto', sortDirection = 'asc' } = {}) {
  const sortedData = sortChartData(data, key, sortDirection)
  const grain = inferTemporalGrain(sortedData.map((row) => row?.[key]))
  const labels = sortedData.map((row) => formatTemporalAxisValue(row?.[key], format, grain))
  const longestLabelLength = labels.reduce((longest, label) => Math.max(longest, normalizedText(label).length), 0)
  // X-axis labels are rotated. Reserve only the space they need, so compact
  // temporal labels do not leave a large void while long category labels do
  // not run into the bottom edge of the widget.
  const axisHeight = Math.min(70, Math.max(42, Math.ceil(22 + longestLabelLength * 4.2)))
  const bottomPadding = Math.min(18, Math.max(8, Math.ceil(6 + longestLabelLength * 0.9)))
  const tickFormatter = (value) => truncateLabel(formatTemporalAxisValue(value, format, grain), grain ? 10 : 12)
  return {
    data: sortedData,
    grain,
    longestLabelLength,
    axisHeight,
    bottomPadding,
    tickFormatter,
    labelFormatter: (value) => formatTemporalAxisValue(value, format, grain),
  }
}

export function truncateLabel(value, maxChars = 8) {
  const text = normalizedText(value)
  return text.length > maxChars ? `${text.slice(0, maxChars)}...` : text
}

export function percentTick(value) {
  return typeof value === 'number' ? formatDashboardValue(value, { percent: true, decimals: 0 }) : value
}

export function numberTick(value) {
  return formatDashboardValue(value)
}

export function numberTooltip(value) {
  return formatDashboardValue(value)
}

function niceAxisStep(maxMagnitude) {
  if (!Number.isFinite(maxMagnitude) || maxMagnitude <= 0) return 1
  const rawStep = maxMagnitude / AXIS_TARGET_INTERVALS
  const magnitude = 10 ** Math.floor(Math.log10(rawStep))
  const normalized = rawStep / magnitude
  const multiplier = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 2.5 ? 2.5 : normalized <= 5 ? 5 : 10
  return multiplier * magnitude
}

function roundedToStep(value, step) {
  const decimals = Math.max(0, -Math.floor(Math.log10(step)) + 2)
  return Number(value.toFixed(decimals))
}

function isOnTick(value, tick, step) {
  return Math.abs(value - tick) <= Math.max(Math.abs(step) * 1e-9, Number.EPSILON * 32)
}

// Keep one readable tick of breathing room instead of expanding by a ratio.
// A proportional domain produced labels such as 4,651.6 and 152%, which are
// mathematically valid but visually noisy. The bound below is a clean tick at
// or just above the data, and adds exactly one tick only when data hits it.
export const valueAxisDomain = [
  (dataMin) => {
    const value = Number(dataMin)
    if (!Number.isFinite(value) || value >= 0) return 0
    const step = niceAxisStep(Math.abs(value))
    const floored = Math.floor(value / step) * step
    const bound = isOnTick(value, floored, step) ? floored - step : floored
    return roundedToStep(bound, step)
  },
  (dataMax) => {
    const value = Number(dataMax)
    if (!Number.isFinite(value)) return 'auto'
    if (value <= 0) return 0
    const step = niceAxisStep(value)
    const ceiled = Math.ceil(value / step) * step
    const bound = isOnTick(value, ceiled, step) ? ceiled + step : ceiled
    return roundedToStep(bound, step)
  },
]

export function legendMetrics(position, { width = 0, height = 0, seriesCount = 1 } = {}) {
  const compact = width > 0 && width < 420
  const dense = seriesCount > 3 || (height > 0 && height < 190)
  const fontSize = compact || dense ? 10 : width > 760 ? 12 : 11
  const iconSize = compact || dense ? 9 : 11
  return { fontSize, iconSize }
}
