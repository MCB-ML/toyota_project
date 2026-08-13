import { useEffect, useRef, useState } from 'react'

function isSideLegend(position) {
  return position === 'left' || position === 'right'
}

// Recharts normally observes its parent, but a grid item changes size through
// transforms while it is being resized. Supplying the measured viewport forces
// a deterministic redraw when the card's usable chart area changes.
export function chartViewport(size, fallbackHeight) {
  const width = Number.isFinite(size?.width) && size.width > 0 ? Math.floor(size.width) : '100%'
  const height = Number.isFinite(size?.height) && size.height > 0 ? Math.floor(size.height) : fallbackHeight
  const compact = typeof width === 'number' && (width < 440 || (typeof height === 'number' && height < 190))
  return {
    width,
    height,
    tickFontSize: compact ? 9 : 11,
    xAxisHeight: compact ? 34 : 42,
    marginTop: compact ? 5 : 8,
  }
}

export default function ChartSurface({ title, fill = false, height, children, legend, legendPosition = 'bottom', bottomPadding = 8, toolbar, backgroundColor, titleFontSize }) {
  const contentRef = useRef(null)
  const [size, setSize] = useState({ width: 0, height: 0 })
  const position = ['top', 'left', 'right', 'bottom'].includes(legendPosition) ? legendPosition : 'bottom'
  const sideLegend = isSideLegend(position)
  const legendNode = legend?.(size)
  const resolvedBottomPadding = Number.isFinite(bottomPadding) ? Math.min(20, Math.max(8, bottomPadding)) : 8

  useEffect(() => {
    const element = contentRef.current
    if (!element) return undefined
    const update = () => setSize({ width: element.clientWidth, height: element.clientHeight })
    update()
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', update)
      return () => window.removeEventListener('resize', update)
    }
    const observer = new ResizeObserver(update)
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  const legendSlot = legendNode ? (
    <div className="shrink-0 min-w-0 overflow-hidden">{legendNode}</div>
  ) : null

  return (
    <div
      className={`bg-white rounded-lg px-2.5 pt-2 shadow-sm border border-gray-100 ${fill ? 'h-full min-h-0 flex flex-col' : ''}`}
      style={{ paddingBottom: resolvedBottomPadding, ...(backgroundColor ? { backgroundColor } : {}) }}
    >
      <div className="mb-1.5 flex shrink-0 items-center justify-between gap-2">
        <h4 className="min-w-0 flex-1 truncate font-semibold leading-5 text-gray-700" style={{ fontSize: Number.isFinite(titleFontSize) ? `${titleFontSize}px` : '13px' }}>{title}</h4>
        {toolbar}
      </div>
      <div className={fill ? 'flex-1 min-h-0' : undefined}>
        <div className={sideLegend ? 'flex h-full min-h-0 gap-1.5' : 'flex h-full min-h-0 flex-col'}>
          {!sideLegend && position === 'top' && legendSlot}
          {sideLegend && position === 'left' && legendSlot}
          <div
            ref={contentRef}
            className={sideLegend ? 'flex-1 min-w-0 min-h-0' : (fill ? 'flex-1 min-h-0' : undefined)}
            style={fill || !height ? undefined : { minHeight: height }}
          >
            {children(size)}
          </div>
          {sideLegend && position === 'right' && legendSlot}
          {!sideLegend && position !== 'top' && legendSlot}
        </div>
      </div>
    </div>
  )
}
