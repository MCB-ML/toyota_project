// Lifecycle tiers for multi-turn chat state, adapted from a reference LangGraph-style
// agent (agents/lifecycle.py: an IntEnum + FIELD_LIFECYCLE registry that nulls out
// fields whose scope has expired). This codebase has no persistent state object to
// reset fields on — chatHandler.js and dashboardPipeline.js are stateless per HTTP
// request, and the client resends its full `history` array every turn (see
// ChatPanel.jsx). So the equivalent guard here isn't "reset a field," it's "don't let
// a stale outcome in that resent history read as accepted precedent."
//
//   TURN    — resets every new user turn. An assistant turn whose proposed action
//             was rejected/discarded/errored gets annotated (not deleted — the fact
//             a request was *made* is still useful context) so the classifier sees
//             it happened but can't treat it as established fact for a new request.
//   QUERY   — resets when a new topic/SQL query is confirmed. Already true by
//             construction: dashboardPipeline.js's SQL-generation call never receives
//             `history` at all, only the current turn's `message` — so a previous
//             turn's SQL/execution result has no path into a new query's prompt.
//   SESSION — never auto-reset. The user's own messages always pass through verbatim.
//   RETRY   — not modeled yet. No retry-on-failure loop exists in this codebase today
//             (a failed SQL/execution just surfaces an error event and stops); add a
//             tier here if one gets built.

export const Lifecycle = Object.freeze({ TURN: 1, QUERY: 2, SESSION: 3 })

const STALE_OUTCOMES = new Set(['rejected', 'discarded', 'error'])
const OUTCOME_LABEL = {
  rejected: '검토 거부됨 또는 적용 불가',
  discarded: '사용자가 취소함',
  error: '실행 오류',
}

// TURN-scope guard — call this on `history` right before building the messages
// array for a NEW turn's classification/intent call (Stage 1 in both
// dashboardPipeline.js and chatHandler.js). Leaves user messages and cleanly
// `applied`/text-only assistant turns untouched.
export function sanitizeHistoryForClassification(history) {
  return history.map(m => {
    if (m.role === 'assistant' && m.outcome && STALE_OUTCOMES.has(m.outcome)) {
      const label = OUTCOME_LABEL[m.outcome] || m.outcome
      return { role: m.role, content: `(이전 제안: "${m.content}" — ${label}. 참고만 하고 이번 판단의 근거로 삼지 말 것)` }
    }
    // Strip `outcome` even when untouched — it's our own bookkeeping field, not
    // part of the chat-completions message shape, and must not reach the API call.
    return { role: m.role, content: m.content }
  })
}
