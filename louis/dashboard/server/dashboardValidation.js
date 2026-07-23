import { getTopic } from './schemaLoader.js'
import { WIDGET_REQUIRED_PROPS } from './widgetSchema.js'

export const MAX_WIDGETS = 12

// Deterministic, fail-fast checks — run BEFORE the critic LLM call so a
// structurally broken proposal never costs a second network round trip.
export function validateProposal(proposal, currentState) {
  if (proposal.action === 'add' || proposal.action === 'modify') {
    if (!getTopic(proposal.topic)) {
      return { ok: false, reason: `알 수 없는 주제입니다: ${proposal.topic}` }
    }
  }

  if (proposal.action === 'add' && currentState.widgets.length >= MAX_WIDGETS) {
    return { ok: false, reason: `위젯 개수 제한(${MAX_WIDGETS}개)에 도달했습니다. 기존 위젯을 먼저 삭제해주세요.` }
  }

  if (['remove', 'modify', 'reorder', 'resize'].includes(proposal.action)) {
    const exists = currentState.widgets.some(w => w.id === proposal.widgetId)
    if (!exists) {
      return { ok: false, reason: `대시보드에 존재하지 않는 위젯입니다. 새로고침 후 다시 시도해주세요.` }
    }
  }

  return { ok: true }
}

export function validateWidgetProps(widget) {
  const required = WIDGET_REQUIRED_PROPS[widget.type]
  if (!required) return { ok: false, reason: `알 수 없는 위젯 타입입니다: ${widget.type}` }
  const missing = required.filter(k => widget.props?.[k] === undefined)
  if (missing.length) return { ok: false, reason: `필수 항목 누락: ${missing.join(', ')}` }
  return { ok: true }
}

export function isDuplicateWidget(widget, currentState) {
  return currentState.widgets.some(w => w.id !== widget.id && w.table === widget.table && w.type === widget.type)
}
