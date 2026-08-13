export const DEFAULT_CHART_COLOR_PALETTE = 'balanced'

export const CHART_COLOR_PALETTES = [
  {
    id: 'balanced',
    label: '\uade0\ud615',
    colors: ['#1E3A5F', '#2563EB', '#0F766E', '#B45309', '#BE123C', '#7C3AED', '#4D7C0F', '#475569'],
    backgroundColor: '#F8FAFC',
  },
  {
    id: 'vivid',
    label: '\uc120\uba85',
    colors: ['#0E7490', '#DC2626', '#16A34A', '#D97706', '#7C3AED', '#DB2777', '#0891B2', '#65A30D'],
    backgroundColor: '#FFFDFC',
  },
  {
    id: 'soft',
    label: '\ubd80\ub4dc\ub7ec\uc6c0',
    colors: ['#365E8D', '#5578E8', '#2F8F83', '#C47B34', '#C75B6A', '#8A6FD1', '#6F8D3C', '#64748B'],
    backgroundColor: '#FAFCFF',
  },
  {
    id: 'accessible',
    label: '\uc811\uadfc\uc131',
    colors: ['#0072B2', '#D55E00', '#009E73', '#CC79A7', '#E69F00', '#56B4E9', '#6A3D9A', '#7F7F7F'],
    backgroundColor: '#FAFCFB',
  },
  {
    id: 'ocean',
    label: '\uc624\uc158',
    colors: ['#075985', '#0284C7', '#0891B2', '#0F766E', '#14B8A6', '#2563EB', '#4F46E5', '#64748B'],
    backgroundColor: '#F6FBFD',
  },
  {
    id: 'orchard',
    label: '\uc624\ucc28\ub4dc',
    colors: ['#166534', '#15803D', '#65A30D', '#0F766E', '#CA8A04', '#B45309', '#9F1239', '#475569'],
    backgroundColor: '#FAFCF7',
  },
  {
    id: 'modern',
    label: '\ubaa8\ub358',
    colors: ['#312E81', '#2563EB', '#0891B2', '#059669', '#CA8A04', '#EA580C', '#DB2777', '#64748B'],
    backgroundColor: '#F9F9FF',
  },
  {
    id: 'pastel',
    label: '\ud30c\uc2a4\ud154',
    colors: ['#4F6D9D', '#6B8DE3', '#4F9E91', '#C28A53', '#C87582', '#9478C5', '#849B58', '#6E7D8F'],
    backgroundColor: '#FFFBFC',
  },
  {
    id: 'contrast',
    label: '\uace0\ub300\ube44',
    colors: ['#111827', '#0057D9', '#007A5E', '#D13C00', '#A5005A', '#6846C2', '#6B7200', '#4B5563'],
    backgroundColor: '#F9FAFB',
  },
  {
    id: 'earth',
    label: '\uc5b4\uc2a4',
    colors: ['#365314', '#3F6212', '#0F766E', '#0369A1', '#7E22CE', '#B45309', '#BE123C', '#52525B'],
    backgroundColor: '#FCFBF7',
  },
  {
    id: 'custom',
    label: '\uc0ac\uc6a9\uc790 \uc9c0\uc815',
    colors: ['#1E3A5F', '#2563EB', '#0F766E', '#B45309', '#BE123C', '#7C3AED', '#4D7C0F', '#475569'],
    backgroundColor: '#FFFFFF',
  },
]

const PALETTE_BY_ID = new Map(CHART_COLOR_PALETTES.map((palette) => [palette.id, palette]))

export function isChartColorPalette(value) {
  return PALETTE_BY_ID.has(value)
}

export function isChartColor(value) {
  return typeof value === 'string' && /^#[0-9a-fA-F]{6}$/.test(value)
}

function paletteFor(paletteId = DEFAULT_CHART_COLOR_PALETTE) {
  return PALETTE_BY_ID.get(paletteId) || PALETTE_BY_ID.get(DEFAULT_CHART_COLOR_PALETTE)
}

export function chartPaletteColors(paletteId = DEFAULT_CHART_COLOR_PALETTE, customPalette) {
  if (paletteId === 'custom') {
    const colors = Array.isArray(customPalette?.colors) ? customPalette.colors.filter(isChartColor) : []
    if (colors.length) return colors.map((color) => color.toUpperCase())
  }
  return paletteFor(paletteId).colors
}

export function chartPaletteBackground(paletteId = DEFAULT_CHART_COLOR_PALETTE, customPalette) {
  if (paletteId === 'custom' && isChartColor(customPalette?.backgroundColor)) return customPalette.backgroundColor.toUpperCase()
  return paletteFor(paletteId).backgroundColor || '#FFFFFF'
}

export function customChartPalette(value) {
  return {
    colors: chartPaletteColors('custom', value),
    backgroundColor: chartPaletteBackground('custom', value),
  }
}

export function seriesColorFor(key, index, { palette = DEFAULT_CHART_COLOR_PALETTE, customPalette, overrides = {} } = {}) {
  const override = overrides?.[String(key)]
  if (isChartColor(override)) return override
  const colors = chartPaletteColors(palette, customPalette)
  return colors[Math.abs(Number(index) || 0) % colors.length]
}
