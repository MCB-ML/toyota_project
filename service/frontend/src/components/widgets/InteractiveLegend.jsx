import { useEffect, useMemo, useState } from 'react'
import { legendMetrics } from './axisFormat'

function normalizedKeys(items) {
  return items.map((item) => String(item.key))
}

export function useLegendVisibility(items = []) {
  const keys = useMemo(() => normalizedKeys(items), [items])
  const keySignature = keys.join('\u0001')
  const [hiddenKeys, setHiddenKeys] = useState(() => new Set())

  useEffect(() => {
    const allowed = new Set(keys)
    setHiddenKeys((current) => new Set([...current].filter((key) => allowed.has(key))))
  }, [keySignature])

  const toggle = (key) => {
    const normalized = String(key)
    setHiddenKeys((current) => {
      const next = new Set(current)
      if (next.has(normalized)) next.delete(normalized)
      else next.add(normalized)
      return next
    })
  }

  return {
    isHidden: (key) => hiddenKeys.has(String(key)),
    toggle,
  }
}

function Marker({ type, color }) {
  const shared = { display: 'inline-block', flex: '0 0 auto', color }
  if (type === 'line') {
    return (
      <span style={{ ...shared, position: 'relative', width: 16, height: 10 }} aria-hidden="true">
        <span style={{ position: 'absolute', top: 4, left: 0, width: 16, borderTop: `2px solid ${color}` }} />
        <span style={{ position: 'absolute', top: 2, left: 6, width: 5, height: 5, borderRadius: '50%', background: '#fff', border: `2px solid ${color}`, boxSizing: 'border-box' }} />
      </span>
    )
  }
  if (type === 'area') {
    return <span style={{ ...shared, width: 14, height: 8, borderTop: `2px solid ${color}`, background: color, opacity: 0.7, borderRadius: '2px 2px 0 0' }} aria-hidden="true" />
  }
  if (type === 'scatter') {
    return <span style={{ ...shared, width: 9, height: 9, borderRadius: '50%', background: color }} aria-hidden="true" />
  }
  return <span style={{ ...shared, width: 11, height: 8, borderRadius: 2, background: color }} aria-hidden="true" />
}

export default function InteractiveLegend({ items = [], hidden, onToggle, position = 'auto', width, height }) {
  const { fontSize, iconSize } = legendMetrics(position, { width, height, seriesCount: items.length })
  const vertical = position === 'left' || position === 'right'

  return (
    <div
      role="group"
      aria-label="Chart legend"
      style={{
        display: 'flex',
        flexDirection: vertical ? 'column' : 'row',
        flexWrap: 'wrap',
        justifyContent: vertical ? 'center' : 'center',
        alignItems: vertical ? 'flex-start' : 'center',
        gap: `${Math.max(4, Math.round(fontSize * 0.45))}px ${Math.max(6, Math.round(fontSize * 0.8))}px`,
        padding: vertical ? '2px 3px' : (position === 'top' ? '0 1px 2px' : '2px 1px 0'),
        maxWidth: '100%',
      }}
    >
      {items.map((item) => {
        const isHidden = hidden(String(item.key))
        return (
          <button
            key={String(item.key)}
            type="button"
            onClick={() => onToggle(item.key)}
            aria-pressed={!isHidden}
            title={`${item.label}${isHidden ? ' (hidden)' : ''}`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: Math.max(4, Math.round(fontSize * 0.45)),
              minWidth: 0,
              border: 0,
              padding: 0,
              background: 'transparent',
              color: isHidden ? '#98a2b3' : '#667085',
              cursor: 'pointer',
              fontSize,
              lineHeight: 1.3,
              textDecoration: isHidden ? 'line-through' : 'none',
              opacity: isHidden ? 0.55 : 1,
            }}
          >
            <Marker type={item.type} color={item.color} size={iconSize} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: vertical ? 120 : 150 }}>{item.label}</span>
          </button>
        )
      })}
    </div>
  )
}
