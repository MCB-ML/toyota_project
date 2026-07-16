import { useRef, useState } from 'react'
import GeneratedWidget from './widgets/GeneratedWidget'

// Row-based flex "weight" layout (Compose's Modifier.weight(), continuous instead
// of the earlier 3-step sm/md/lg). A row holds widgets until their weights would
// exceed ROW_CAPACITY, then wraps — same visual default as before (two weight=1
// widgets side by side). Dragging a handle between two widgets grows one and
// shrinks its immediate neighbor by the same amount, so the row's total width
// never changes and nothing overlaps; MIN/MAX_WEIGHT bound how far either can go.
const ROW_CAPACITY = 2
const MIN_WEIGHT = 0.4
const MAX_WEIGHT = 3

// Vertical resize is simpler — growing a widget's height never has to steal
// space from a sibling (the page just gets taller / scrolls further), so each
// widget's height is independent. Only clamped by MIN/MAX_HEIGHT.
const DEFAULT_HEIGHT = 220
const MIN_HEIGHT = 140
const MAX_HEIGHT = 640

function packRows(widgets) {
  const rows = []
  let current = []
  let sum = 0
  for (const w of widgets) {
    const weight = w.weight ?? 1
    if (current.length > 0 && sum + weight > ROW_CAPACITY + 1e-6) {
      rows.push(current)
      current = []
      sum = 0
    }
    current.push(w)
    sum += weight
  }
  if (current.length) rows.push(current)
  return rows
}

// readOnly=true일 때는 드래그 크기 조절 핸들을 숨긴다(다른 탭에 배포된 페이지를
// 보여줄 때처럼, 편집 권한이 없는 뷰어용).
export default function WidgetGrid({ widgets, readOnly = false, onCommitWeights, onCommitHeight }) {
  const rows = packRows(widgets)
  return (
    <div className="space-y-4">
      {rows.map((rowWidgets, i) => (
        <WidgetRow
          key={rowWidgets.map(w => w.id).join('-') || i}
          widgets={rowWidgets}
          readOnly={readOnly}
          onCommitWeights={onCommitWeights}
          onCommitHeight={onCommitHeight}
        />
      ))}
    </div>
  )
}

function WidgetRow({ widgets, readOnly, onCommitWeights, onCommitHeight }) {
  const containerRef = useRef(null)
  const [dragWeights, setDragWeights] = useState(null)
  const [dragHeights, setDragHeights] = useState({})
  // 최신 드래그 값을 ref로도 들고 있는다 — onUp에서 onCommit*을 setState updater
  // 안에서 호출하면 "다른 컴포넌트(DashboardStateProvider) 렌더 중 업데이트" 경고가
  // 나므로, 커밋은 항상 이벤트 핸들러 최상위에서 ref 값을 읽어 별도로 호출한다.
  const dragWeightsRef = useRef(null)
  const dragHeightsRef = useRef({})
  const rowWeightSum = widgets.reduce((s, w) => s + (w.weight ?? 1), 0)

  const startWidthDrag = (leftId, rightId, e) => {
    e.preventDefault()
    const container = containerRef.current
    if (!container) return
    const rowWidthPx = container.getBoundingClientRect().width
    const left = widgets.find(w => w.id === leftId)
    const right = widgets.find(w => w.id === rightId)
    const startX = e.clientX
    const startLeftW = left.weight ?? 1
    const startRightW = right.weight ?? 1
    const pairSum = startLeftW + startRightW

    const onMove = (moveEvent) => {
      const deltaPx = moveEvent.clientX - startX
      const deltaWeight = (deltaPx / rowWidthPx) * rowWeightSum
      let newLeft = startLeftW + deltaWeight
      let newRight = startRightW - deltaWeight
      // 예외 처리: 최소/최대 폭을 벗어나면 그 지점에서 멈추고, 상대 쪽이 나머지를 흡수
      // (둘의 합은 항상 pairSum으로 고정 — 같은 줄의 다른 위젯 폭은 건드리지 않음)
      if (newLeft < MIN_WEIGHT) { newLeft = MIN_WEIGHT; newRight = pairSum - MIN_WEIGHT }
      if (newRight < MIN_WEIGHT) { newRight = MIN_WEIGHT; newLeft = pairSum - MIN_WEIGHT }
      newLeft = Math.min(newLeft, MAX_WEIGHT)
      newRight = Math.min(newRight, MAX_WEIGHT)
      const next = { [leftId]: newLeft, [rightId]: newRight }
      dragWeightsRef.current = next
      setDragWeights(next)
    }
    const onUp = () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      const finalWeights = dragWeightsRef.current
      dragWeightsRef.current = null
      setDragWeights(null)
      if (finalWeights) onCommitWeights(finalWeights)
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }

  const startHeightDrag = (widgetId, e) => {
    e.preventDefault()
    const widget = widgets.find(w => w.id === widgetId)
    const startY = e.clientY
    const startHeight = widget.height ?? DEFAULT_HEIGHT

    const onMove = (moveEvent) => {
      const deltaY = moveEvent.clientY - startY
      const next = Math.min(MAX_HEIGHT, Math.max(MIN_HEIGHT, startHeight + deltaY))
      dragHeightsRef.current = { ...dragHeightsRef.current, [widgetId]: next }
      setDragHeights(dragHeightsRef.current)
    }
    const onUp = () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      const finalHeight = dragHeightsRef.current[widgetId]
      const { [widgetId]: _discard, ...rest } = dragHeightsRef.current
      dragHeightsRef.current = rest
      setDragHeights(rest)
      if (finalHeight !== undefined) onCommitHeight(widgetId, finalHeight)
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }

  return (
    <div ref={containerRef} className="flex gap-4 items-start">
      {widgets.map((widget, idx) => {
        const weight = dragWeights?.[widget.id] ?? widget.weight ?? 1
        const height = dragHeights[widget.id] ?? widget.height ?? DEFAULT_HEIGHT
        const hasNext = idx < widgets.length - 1
        const canResizeHeight = !readOnly && widget.type !== 'render_kpi_cards'
        return (
          <div key={widget.id} style={{ flex: `${weight} 1 0%`, minWidth: 0 }} className="relative">
            <GeneratedWidget name={widget.type} props={widget.props} height={height} />
            {!readOnly && hasNext && (
              <div
                onPointerDown={(e) => startWidthDrag(widget.id, widgets[idx + 1].id, e)}
                title="드래그해서 가로 크기 조절"
                className="group/handle absolute top-0 -right-4 w-4 h-full cursor-col-resize flex items-center justify-center z-10 select-none"
              >
                <div className="w-1 h-10 rounded-full bg-gray-200 group-hover/handle:bg-blue-400 transition-colors" />
              </div>
            )}
            {canResizeHeight && (
              <div
                onPointerDown={(e) => startHeightDrag(widget.id, e)}
                title="드래그해서 세로 크기 조절"
                className="group/vhandle absolute left-0 right-0 -bottom-4 h-4 cursor-row-resize flex items-center justify-center z-10 select-none"
              >
                <div className="h-1 w-10 rounded-full bg-gray-200 group-hover/vhandle:bg-blue-400 transition-colors" />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
