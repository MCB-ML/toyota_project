import { useCallback, useRef, useState } from 'react'
import PageHeader from '../../components/PageHeader'
import GeneratedWidget from '../../components/widgets/GeneratedWidget'
import { useDashboardState } from '../../context/DashboardStateContext'
import { LayoutGrid, Undo2, Redo2, Sparkles } from 'lucide-react'

// Row-based flex "weight" layout (Compose's Modifier.weight(), continuous instead
// of the earlier 3-step sm/md/lg). A row holds widgets until their weights would
// exceed ROW_CAPACITY, then wraps — same visual default as before (two weight=1
// widgets side by side). Dragging a handle between two widgets grows one and
// shrinks its immediate neighbor by the same amount, so the row's total width
// never changes and nothing overlaps; MIN/MAX_WEIGHT bound how far either can go.
const ROW_CAPACITY = 2
const MIN_WEIGHT = 0.4
const MAX_WEIGHT = 3

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

export default function KtwsCustom() {
  const { dashboardState, applyPatch, undo, redo, canUndo, canRedo } = useDashboardState()
  const { widgets } = dashboardState
  const rows = packRows(widgets)

  const commitWeights = useCallback((updates) => {
    const ops = Object.entries(updates).map(([widgetId, weight]) => {
      const widget = widgets.find(w => w.id === widgetId)
      return { op: 'update', widgetId, widget: { ...widget, weight } }
    })
    if (ops.length) applyPatch({ baseVersion: dashboardState.version, ops })
  }, [widgets, dashboardState.version, applyPatch])

  return (
    <div className="p-6 space-y-6">
      <PageHeader title="대시보드 커스텀" description="오른쪽 상단 AI 챗봇에게 원하는 차트/지표를 요청하면 이 페이지에 바로 반영됩니다." />

      <div className="flex items-center gap-2">
        <button
          onClick={undo}
          disabled={!canUndo}
          title="실행 취소"
          className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Undo2 size={13} /> 실행 취소
        </button>
        <button
          onClick={redo}
          disabled={!canRedo}
          title="다시 실행"
          className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Redo2 size={13} /> 다시 실행
        </button>
      </div>

      {widgets.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 flex flex-col items-center justify-center text-center">
          <LayoutGrid size={40} className="text-gray-300 mb-3" />
          <p className="text-sm text-gray-500 mb-1">아직 추가된 위젯이 없습니다.</p>
          <p className="text-xs text-gray-400 flex items-center gap-1.5">
            <Sparkles size={12} /> 오른쪽 상단 AI 챗봇으로 위젯을 추가해보세요.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {rows.map((rowWidgets, i) => (
            <WidgetRow key={rowWidgets.map(w => w.id).join('-') || i} widgets={rowWidgets} onCommit={commitWeights} />
          ))}
        </div>
      )}
    </div>
  )
}

function WidgetRow({ widgets, onCommit }) {
  const containerRef = useRef(null)
  const [dragWeights, setDragWeights] = useState(null)
  const rowWeightSum = widgets.reduce((s, w) => s + (w.weight ?? 1), 0)

  const startDrag = (leftId, rightId, e) => {
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
      setDragWeights({ [leftId]: newLeft, [rightId]: newRight })
    }
    const onUp = () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      setDragWeights(current => {
        if (current) onCommit(current)
        return null
      })
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }

  return (
    <div ref={containerRef} className="flex gap-4 items-stretch">
      {widgets.map((widget, idx) => {
        const weight = dragWeights?.[widget.id] ?? widget.weight ?? 1
        const hasNext = idx < widgets.length - 1
        return (
          <div key={widget.id} style={{ flex: `${weight} 1 0%`, minWidth: 0 }} className="relative">
            <GeneratedWidget name={widget.type} props={widget.props} />
            {hasNext && (
              <div
                onPointerDown={(e) => startDrag(widget.id, widgets[idx + 1].id, e)}
                title="드래그해서 크기 조절"
                className="group/handle absolute top-0 -right-4 w-4 h-full cursor-col-resize flex items-center justify-center z-10 select-none"
              >
                <div className="w-1 h-10 rounded-full bg-gray-200 group-hover/handle:bg-blue-400 transition-colors" />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
