import { useCallback, useMemo, useRef } from 'react'
import GridLayoutBase, { WidthProvider } from 'react-grid-layout/legacy'
import { AlertCircle, GripVertical, Loader2, RefreshCw, SlidersHorizontal, X } from 'lucide-react'
import 'react-grid-layout/css/styles.css'
import './WidgetGrid.css'
import GeneratedWidget from './widgets/GeneratedWidget'
import WidgetErrorBoundary from './WidgetErrorBoundary'
import { GRID_COLS, ROW_HEIGHT, MARGIN, MIN_W, MIN_H, MAX_H, computeLayout } from '../utils/gridLayout'

const GridLayout = WidthProvider(GridLayoutBase)

// 2026-08-04 leo: 결과 캐시의 상태는 watermark 확인 주기와 다르다. 조회가 방금 실행된
// miss/refreshed 상태를 모두 "최신"으로 보이면 1시간 워터마크 정책처럼 오해할 수 있어,
// 편집 화면에서만 실제 결과 캐시의 상태를 구분해 보여준다.
function cacheStatusLabel(state) {
  if (state === 'fresh') return '캐시'
  if (state === 'stale') return '이전 캐시'
  if (state === 'refreshed') return '강제 새로고침'
  return '새 조회'
}

// readOnly=true일 때는 드래그/리사이즈를 끈다(다른 탭에 배포된 페이지를 보여줄 때처럼,
// 편집 권한이 없는 뷰어용). onCommitLayout은 사용자가 리사이즈를 "놓았을 때"와, 자리 없는
// (레거시 또는 방금 추가된) 위젯이 첫 압축(compaction)으로 자리를 찾았을 때만 호출된다 —
// 드래그 도중 매 프레임 호출되지 않으므로 그때마다 서버에 저장이 튀지 않는다.
export default function WidgetGrid({
  widgets,
  readOnly = false,
  editMode = false,
  onCommitLayout,
  onRemoveWidget,
  selectedWidgetId,
  onSelectWidget,
  onEditWidget,
  onRefreshWidget,
}) {
  const isInteractingRef = useRef(false)
  const lastCommittedSignatureRef = useRef('')
  const isEditable = !readOnly && editMode

  const layout = useMemo(() => {
    const byId = new Map(widgets.map(w => [w.id, w]))
    return computeLayout(widgets).map(item => {
      const w = byId.get(item.i)
      return {
        ...item,
        minW: MIN_W,
        maxW: GRID_COLS,
        minH: MIN_H,
        maxH: MAX_H,
        isResizable: isEditable,
      }
    })
  }, [widgets, isEditable])

  const commitIfChanged = useCallback((newLayout) => {
    if (!isEditable || !onCommitLayout) return
    const changes = []
    for (const item of newLayout) {
      const widget = widgets.find(w => w.id === item.i)
      if (!widget) continue
      const right = item.x + item.w
      const bottom = item.y + item.h
      const current = widget.layout || {}
      if (
        current.x === item.x && current.y === item.y && current.w === item.w && current.h === item.h &&
        widget.left === item.x && widget.top === item.y && widget.right === right && widget.bottom === bottom
      ) continue
      changes.push({
        widgetId: item.i,
        left: item.x,
        top: item.y,
        right,
        bottom,
        layout: {
          i: item.i,
          x: item.x,
          y: item.y,
          w: item.w,
          h: item.h,
          minW: item.minW,
          minH: item.minH,
          maxW: item.maxW,
          maxH: item.maxH,
        },
      })
    }
    if (!changes.length) return
    const signature = changes
      .map(({ widgetId, layout: item }) => `${widgetId}:${item.x},${item.y},${item.w},${item.h}`)
      .sort()
      .join('|')
    if (signature === lastCommittedSignatureRef.current) return
    lastCommittedSignatureRef.current = signature
    onCommitLayout(changes)
  }, [widgets, isEditable, onCommitLayout])

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

  const handleCanvasPointerDown = useCallback((event) => {
    if (!isEditable || !onSelectWidget) return
    if (event.target instanceof Element && event.target.closest('.react-grid-item')) return
    onSelectWidget(null)
  }, [isEditable, onSelectWidget])

  return (
    <div className="dashboard-canvas-shell" onMouseDown={handleCanvasPointerDown}>
      <GridLayout
      className={`dashboard-canvas layout ${isEditable ? 'edit-mode' : 'view-mode'}`}
      layout={layout}
      cols={GRID_COLS}
      rowHeight={ROW_HEIGHT}
      margin={[MARGIN, MARGIN]}
      containerPadding={[0, 0]}
      compactType="vertical"
      preventCollision={false}
      isDraggable={isEditable}
      draggableHandle=".widget-edit-drag-handle"
      isResizable={isEditable}
      resizeHandles={['se']}
      onLayoutChange={handleLayoutChange}
      onDragStart={handleInteractionStart}
      onDragStop={handleInteractionStop}
      onResizeStart={handleInteractionStart}
      onResizeStop={handleInteractionStop}
      >
      {widgets.map(w => {
        return (
          <div
            key={w.id}
            className={`relative h-full min-h-0 ${isEditable ? 'flex flex-col' : ''} ${isEditable && selectedWidgetId === w.id ? 'ring-2 ring-blue-400 rounded-xl' : ''}`}
            onClick={() => { if (isEditable) onSelectWidget?.(w.id) }}
          >
            {isEditable && (
              <div className="widget-edit-toolbar shrink-0">
                <div className="widget-edit-drag-handle flex h-6 min-w-0 flex-1 items-center gap-1.5 rounded px-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700" title={'\ub4dc\ub798\uadf8\ud558\uc5ec \uc774\ub3d9'} aria-label={'\ub4dc\ub798\uadf8\ud558\uc5ec \uc774\ub3d9'}>
                  <GripVertical size={15} />
                </div>
                {onEditWidget && (
                  <button
                    type="button"
                    onMouseDown={(event) => event.stopPropagation()}
                    onClick={(event) => { event.stopPropagation(); onEditWidget(w.id) }}
                    title={'\uac1d\uccb4 \uc218\uc815'}
                    aria-label={'\uac1d\uccb4 \uc218\uc815'}
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded border border-transparent text-slate-400 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                  >
                    <SlidersHorizontal size={13} />
                  </button>
                )}
                {onRefreshWidget && (
                  <button
                    type="button"
                    onMouseDown={(event) => event.stopPropagation()}
                    onClick={(event) => { event.stopPropagation(); onRefreshWidget(w.id) }}
                    title={'최신 데이터로 새로고침'}
                    aria-label={'최신 데이터로 새로고침'}
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded border border-transparent text-slate-400 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                  >
                    <RefreshCw size={13} />
                  </button>
                )}
                {onRemoveWidget && (
                  <button
                    type="button"
                    onMouseDown={(event) => event.stopPropagation()}
                    onClick={(event) => { event.stopPropagation(); onRemoveWidget(w.id) }}
                    title={'\uac1d\uccb4 \uc0ad\uc81c'}
                    aria-label={'\uac1d\uccb4 \uc0ad\uc81c'}
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded border border-transparent text-slate-400 hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>
            )}
            <div className={isEditable ? 'min-h-0 flex-1' : 'h-full'}>
            {w.runtime?.status === 'loading' ? (
              <div className="h-full rounded-xl border border-gray-100 bg-white shadow-sm flex flex-col items-center justify-center gap-2 text-xs text-gray-400">
                <Loader2 size={18} className="animate-spin text-blue-500" />
                데이터 불러오는 중...
              </div>
            ) : w.runtime?.status === 'error' ? (
              <div className="h-full rounded-xl border border-red-100 bg-white shadow-sm flex flex-col items-center justify-center gap-2 px-5 text-center">
                <AlertCircle size={18} className="text-red-500" />
                <p className="text-xs font-medium text-gray-700">이 객체의 데이터를 불러오지 못했습니다.</p>
                <p className="text-[11px] text-gray-400 break-all">{w.runtime.message}</p>
              </div>
            ) : (
              <>
                <WidgetErrorBoundary resetKey={`${w.id}:${w.objectVersion || w.updatedAt || ''}`}>
                  <GeneratedWidget name={w.type} props={w.props} fill objectSpec={w.objectSpec} />
                </WidgetErrorBoundary>
                {/* 2026-08-04 leo: 보기 모드에서는 데이터 상태 UI가 차트를 가리지 않게 숨기고,
                    페이지 편집 중일 때만 운영 확인용 캐시 시각을 노출한다. */}
                {isEditable && w.runtime?.cache?.fetchedAt && (
                  <div className="pointer-events-none absolute bottom-1 right-2 z-10 rounded bg-white/90 px-1.5 py-0.5 text-[10px] text-slate-400 shadow-sm">
                    {cacheStatusLabel(w.runtime.cache.state)} · {new Date(w.runtime.cache.fetchedAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                )}
              </>
            )}
            </div>
          </div>
        )
      })}
      </GridLayout>
    </div>
  )
}
