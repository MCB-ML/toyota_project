import { useCallback, useMemo, useRef } from 'react'
import GridLayoutBase, { WidthProvider } from 'react-grid-layout/legacy'
import 'react-grid-layout/css/styles.css'
import './WidgetGrid.css'
import GeneratedWidget from './widgets/GeneratedWidget'
import { GRID_COLS, ROW_HEIGHT, MARGIN, MIN_W, MIN_H, MAX_H, pxHeightForRows, computeLayout } from '../utils/gridLayout'

const GridLayout = WidthProvider(GridLayoutBase)

// A widget's rendered box (set by react-grid-layout from its row/col span) minus
// the chart card's own chrome (p-4 padding + title row) it needs to leave for the
// chart itself — every widgets/*.jsx card shares that same p-4 + <h4 mb-3> shape.
const CARD_CHROME_PX = 64
const MIN_CHART_PX = 80

// readOnly=true일 때는 드래그/리사이즈를 끈다(다른 탭에 배포된 페이지를 보여줄 때처럼,
// 편집 권한이 없는 뷰어용). onCommitLayout은 사용자가 리사이즈를 "놓았을 때"와, 자리 없는
// (레거시 또는 방금 추가된) 위젯이 첫 압축(compaction)으로 자리를 찾았을 때만 호출된다 —
// 드래그 도중 매 프레임 호출되지 않으므로 그때마다 서버에 저장이 튀지 않는다.
export default function WidgetGrid({ widgets, readOnly = false, onCommitLayout }) {
  const isInteractingRef = useRef(false)

  const layout = useMemo(() => {
    const byId = new Map(widgets.map(w => [w.id, w]))
    return computeLayout(widgets).map(item => {
      const w = byId.get(item.i)
      // 옛 KPI 위젯(카드 여러 개가 하나의 위젯 안에 묶인 레거시 저장본)만 리사이즈를
      // 막는다 — 이 변경 이후 새로 만든 KPI 카드는 위젯당 카드 하나라 다른 위젯처럼
      // 자유롭게 리사이즈된다.
      const isLegacyKpiBundle = w?.type === 'render_kpi_cards' && Array.isArray(w?.props?.cards)
      return {
        ...item,
        minW: MIN_W,
        maxW: GRID_COLS,
        minH: MIN_H,
        maxH: MAX_H,
        isResizable: !readOnly && !isLegacyKpiBundle,
      }
    })
  }, [widgets, readOnly])

  const commitIfChanged = useCallback((newLayout) => {
    if (readOnly || !onCommitLayout) return
    const changes = []
    for (const item of newLayout) {
      const widget = widgets.find(w => w.id === item.i)
      if (!widget) continue
      const right = item.x + item.w
      const bottom = item.y + item.h
      if (widget.left === item.x && widget.top === item.y && widget.right === right && widget.bottom === bottom) continue
      changes.push({ widgetId: item.i, left: item.x, top: item.y, right, bottom })
    }
    if (changes.length) onCommitLayout(changes)
  }, [widgets, readOnly, onCommitLayout])

  const handleLayoutChange = useCallback((newLayout) => {
    // 사용자가 드래그 중일 때는 매 프레임 호출되므로 무시 — 최종 값은 onResizeStop에서 커밋.
    // (마운트 시 자리 없는 위젯을 압축해 배치하는 경우에는 상호작용이 없어 여기서 바로 커밋된다.)
    if (isInteractingRef.current) return
    commitIfChanged(newLayout)
  }, [commitIfChanged])

  // 드래그와 리사이즈 둘 다 "시작~끝" 동안은 매 프레임 onLayoutChange가 튀는 걸 막고,
  // 끝났을 때 한 번만 커밋한다 — 리사이즈에서 쓰던 것과 동일한 패턴을 드래그에도 적용.
  const handleInteractionStart = useCallback(() => { isInteractingRef.current = true }, [])
  const handleInteractionStop = useCallback((newLayout) => {
    isInteractingRef.current = false
    commitIfChanged(newLayout)
  }, [commitIfChanged])

  return (
    <GridLayout
      className="layout"
      layout={layout}
      cols={GRID_COLS}
      rowHeight={ROW_HEIGHT}
      margin={[MARGIN, MARGIN]}
      containerPadding={[0, 0]}
      compactType="vertical"
      preventCollision={false}
      isDraggable={!readOnly}
      draggableHandle=".widget-drag-handle"
      isResizable={!readOnly}
      resizeHandles={['se']}
      onLayoutChange={handleLayoutChange}
      onDragStart={handleInteractionStart}
      onDragStop={handleInteractionStop}
      onResizeStart={handleInteractionStart}
      onResizeStop={handleInteractionStop}
    >
      {widgets.map(w => {
        const item = layout.find(l => l.i === w.id)
        const chartHeight = Math.max(MIN_CHART_PX, pxHeightForRows(item?.h ?? MIN_H) - CARD_CHROME_PX)
        return (
          <div key={w.id} className="relative h-full">
            {!readOnly && (
              <div
                className="widget-drag-handle absolute top-0 left-0 right-0 h-8 rounded-t-xl z-10"
                title="드래그하여 이동"
              />
            )}
            <GeneratedWidget name={w.type} props={w.props} height={chartHeight} />
          </div>
        )
      })}
    </GridLayout>
  )
}
