// Pure functions/constants — no side effects, safe to import from both the
// browser (WidgetGrid.jsx) and the Node server (dashboardPipeline.js), same
// sharing pattern as applyDashboardPatch.js. Keeps the AI's sm/md/lg size
// presets and the drag-resize grid expressed in the exact same units.
//
// Widgets are positioned on a fixed-column grid and store their box as grid
// line coordinates — left/top/right/bottom (column/row index, 0-based, right
// and bottom exclusive) — instead of the old row-flex `weight` + free-px
// `height`. That old pair couldn't express "this widget also starts lower
// than its row neighbor" or true 2D placement; a real grid can.
export const GRID_COLS = 12
export const ROW_HEIGHT = 24
export const MARGIN = 16
export const MIN_W = 2
export const MIN_H = 4
export const MAX_H = 16

// AI가 고르는 3단계 프리셋(sm/md/lg) → 그리드 칸(가로)/행(세로) 스팬.
// 드래그로는 이 사이 임의의 칸 수로도 조절 가능하다 (MIN_W~GRID_COLS, MIN_H~MAX_H 범위 안에서).
export const SIZE_TO_SPAN = {
  sm: { w: 4, h: 6 },
  md: { w: 6, h: 6 },
  lg: { w: 12, h: 9 },
}

// 아직 자리(top/left)가 없는 위젯(레거시 weight/height 위젯, 혹은 AI가 방금 추가한
// 위젯)을 임시로 놓아두는 y좌표. WidgetGrid의 수직 압축(compactType="vertical")이
// 렌더 시 알아서 첫 빈 자리로 끌어올려 준다.
export const BOTTOM = 99999

export function pxHeightForRows(h) {
  return h * ROW_HEIGHT + Math.max(0, h - 1) * MARGIN
}

function legacySpan(widget) {
  const w = widget.weight ? Math.round(widget.weight * (GRID_COLS / 2)) : SIZE_TO_SPAN.md.w
  const h = widget.height ? Math.round((widget.height + MARGIN) / (ROW_HEIGHT + MARGIN)) : SIZE_TO_SPAN.md.h
  return { w, h }
}

// widget(도메인 객체) → react-grid-layout의 layout item({i,x,y,w,h}).
export function widgetToLayoutItem(widget) {
  const hasPosition = [widget.left, widget.top, widget.right, widget.bottom]
    .every(v => typeof v === 'number')
  if (hasPosition) {
    return {
      i: widget.id,
      x: widget.left,
      y: widget.top,
      w: Math.max(MIN_W, widget.right - widget.left),
      h: Math.max(MIN_H, widget.bottom - widget.top),
    }
  }
  const span = widget.sizeHint || (widget.weight || widget.height ? legacySpan(widget) : SIZE_TO_SPAN.md)
  return {
    i: widget.id,
    x: 0,
    y: BOTTOM,
    w: Math.min(GRID_COLS, Math.max(MIN_W, span.w)),
    h: Math.min(MAX_H, Math.max(MIN_H, span.h)),
  }
}

function boxesOverlap(a, b) {
  return a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h
}

// 이미 자리 잡은 박스들(placed)과 겹치지 않는 가장 위/왼쪽 칸을 찾는다 — 한 열에만
// 쌓이던 옛 x:0 배치 대신, 가로로 빈 공간이 있으면 거기부터 채운다(shelf-packing).
function findFirstFit(w, h, placed) {
  for (let y = 0; y < 100000; y++) {
    for (let x = 0; x <= GRID_COLS - w; x++) {
      const candidate = { x, y, w, h }
      if (!placed.some(p => boxesOverlap(candidate, p))) return { x, y }
    }
  }
  return { x: 0, y: 100000 }
}

// widgets(도메인 객체 배열) → 겹치지 않는 layout item 배열. 이미 left/top/right/bottom을
// 가진 위젯은 그 자리를 그대로 쓰고, 아직 자리가 없는 위젯은 빈 칸을 스캔해 채워 넣는다.
export function computeLayout(widgets) {
  const placed = []
  const pending = []
  for (const widget of widgets) {
    const item = widgetToLayoutItem(widget)
    if (item.y === BOTTOM) pending.push({ widget, item })
    else placed.push(item)
  }
  for (const { item } of pending) {
    const { x, y } = findFirstFit(item.w, item.h, placed)
    item.x = x
    item.y = y
    placed.push(item)
  }
  return placed
}
