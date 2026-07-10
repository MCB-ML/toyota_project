// Pure functions — no side effects, safe to import from both the browser
// (DashboardStateContext) and the Node server (dashboardValidation.js) so
// patch semantics never drift between client-side apply and server-side
// pre-validation of a proposed patch.

export function createEmptyDashboardState() {
  return { version: 0, widgets: [] }
}

export function applyPatchToState(state, patch) {
  let widgets = [...state.widgets]

  for (const op of patch.ops) {
    if (op.op === 'add') {
      const index = op.index ?? widgets.length
      widgets.splice(index, 0, op.widget)
    } else if (op.op === 'remove') {
      widgets = widgets.filter(w => w.id !== op.widgetId)
    } else if (op.op === 'update') {
      widgets = widgets.map(w => (w.id === op.widgetId ? op.widget : w))
    } else if (op.op === 'move') {
      const idx = widgets.findIndex(w => w.id === op.widgetId)
      if (idx === -1) continue
      const [moved] = widgets.splice(idx, 1)
      widgets.splice(Math.min(op.toIndex, widgets.length), 0, moved)
    }
  }

  return { version: state.version + 1, widgets }
}
