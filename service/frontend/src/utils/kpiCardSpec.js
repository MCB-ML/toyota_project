import { clampFontSize } from './dashboardTypography.js'

export const KPI_CARD_PADDING = {
  compact: 'px-3 py-2',
  comfortable: 'px-3.5 py-2.5',
  spacious: 'p-4',
}

export const DEFAULT_KPI_CARD_SPEC = {
  align: 'left',
  verticalAlign: 'center',
  padding: 'compact',
  accentColor: '#BE123C',
  title: {
    fontSize: 12,
    bold: false,
    color: '#64748B',
  },
  value: {
    fontSize: 24,
    bold: true,
    color: '#1F2937',
  },
  summaryItems: {},
}

function plainObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {}
}

function colorOrDefault(value, fallback) {
  return typeof value === 'string' && /^#[0-9a-fA-F]{6}$/.test(value) ? value.toUpperCase() : fallback
}

function kpiFontSize(value, fallback, range) {
  return clampFontSize(value, fallback, range)
}

function normalizeTextStyle(input, fallback, { range, boldByDefault }) {
  const source = plainObject(input)
  return {
    fontSize: kpiFontSize(source.fontSize, fallback.fontSize, range),
    bold: source.bold === undefined ? boldByDefault : source.bold === true,
    color: colorOrDefault(source.color, fallback.color),
  }
}

function normalizeSummaryItemStyle(input, fallback) {
  const source = plainObject(input)
  return {
    align: ['left', 'center', 'right'].includes(source.align) ? source.align : fallback.align,
    title: normalizeTextStyle(source.title, fallback.title, {
      range: { min: 10, max: 36 },
      boldByDefault: fallback.title.bold,
    }),
    value: normalizeTextStyle(source.value, fallback.value, {
      range: { min: 12, max: 64 },
      boldByDefault: fallback.value.bold,
    }),
  }
}

export function summaryItemStyleFor(cardSpec, itemKey, role = 'detail') {
  const spec = normalizeKpiCardSpec(cardSpec)
  const detailValue = {
    ...spec.value,
    fontSize: Math.max(14, Math.round(spec.value.fontSize * 0.65)),
  }
  const fallback = {
    align: spec.align,
    title: role === 'primary' ? spec.title : { ...spec.title, fontSize: Math.max(10, Math.min(16, spec.title.fontSize)) },
    value: role === 'primary' ? spec.value : detailValue,
  }
  return normalizeSummaryItemStyle(spec.summaryItems?.[itemKey], fallback)
}

export function normalizeKpiCardSpec(input) {
  const source = plainObject(input)
  const normalized = {
    align: ['left', 'center', 'right'].includes(source.align) ? source.align : DEFAULT_KPI_CARD_SPEC.align,
    verticalAlign: ['top', 'center', 'bottom'].includes(source.verticalAlign) ? source.verticalAlign : DEFAULT_KPI_CARD_SPEC.verticalAlign,
    padding: Object.hasOwn(KPI_CARD_PADDING, source.padding) ? source.padding : DEFAULT_KPI_CARD_SPEC.padding,
    accentColor: colorOrDefault(source.accentColor, DEFAULT_KPI_CARD_SPEC.accentColor),
    title: normalizeTextStyle(source.title, DEFAULT_KPI_CARD_SPEC.title, {
      range: { min: 10, max: 36 },
      boldByDefault: false,
    }),
    value: normalizeTextStyle(source.value, DEFAULT_KPI_CARD_SPEC.value, {
      range: { min: 12, max: 64 },
      boldByDefault: true,
    }),
  }
  const summaryItems = Object.entries(plainObject(source.summaryItems)).slice(0, 12)
    .filter(([key]) => typeof key === 'string' && key.trim())
    .map(([key, style]) => [key, normalizeSummaryItemStyle(style, {
      align: normalized.align,
      title: normalized.title,
      value: normalized.value,
    })])
  return { ...normalized, summaryItems: Object.fromEntries(summaryItems) }
}
