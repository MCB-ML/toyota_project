export const DEFAULT_CHART_TEXT_SIZES = {
  title: 13,
  axis: 11,
  legend: 11,
  label: 10,
}

export const DEFAULT_TABLE_TYPOGRAPHY = {
  titleFontSize: 13,
  headerFontSize: 12,
  bodyFontSize: 12,
}

export function clampFontSize(value, fallback, { min = 8, max = 48 } = {}) {
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) return fallback
  return Math.min(max, Math.max(min, Math.round(numeric)))
}

export function normalizeChartTextSizes(input) {
  const source = input && typeof input === 'object' && !Array.isArray(input) ? input : {}
  return {
    title: clampFontSize(source.title, DEFAULT_CHART_TEXT_SIZES.title, { min: 10, max: 28 }),
    axis: clampFontSize(source.axis, DEFAULT_CHART_TEXT_SIZES.axis, { min: 8, max: 24 }),
    legend: clampFontSize(source.legend, DEFAULT_CHART_TEXT_SIZES.legend, { min: 8, max: 24 }),
    label: clampFontSize(source.label, DEFAULT_CHART_TEXT_SIZES.label, { min: 8, max: 24 }),
  }
}

export function normalizeTableTypography(input) {
  const source = input && typeof input === 'object' && !Array.isArray(input) ? input : {}
  return {
    titleFontSize: clampFontSize(source.titleFontSize, DEFAULT_TABLE_TYPOGRAPHY.titleFontSize, { min: 10, max: 28 }),
    headerFontSize: clampFontSize(source.headerFontSize, DEFAULT_TABLE_TYPOGRAPHY.headerFontSize, { min: 9, max: 24 }),
    bodyFontSize: clampFontSize(source.bodyFontSize, DEFAULT_TABLE_TYPOGRAPHY.bodyFontSize, { min: 9, max: 24 }),
  }
}
