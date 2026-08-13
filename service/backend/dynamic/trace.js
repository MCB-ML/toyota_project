// Observability — 이 질문이 왜 이 답이 되었는지를 한 덩어리로 남긴다(지시 29장).
//
// 화면에 다 보여줄 필요는 없다. 다만 나중에 "이 숫자 어디서 나왔냐"는 질문에
// 코드가 답할 수 있어야 한다. 특히 어느 지식 계층이 답했는지(resolution_level)와
// 발견 스키마를 썼는지(discovered_schema_used)는 반드시 남는다.

export function createTrace({ question, today }) {
  const stages = []
  const startedAt = Date.now()

  const trace = {
    question,
    today,
    resolution_level: null,
    source: null,
    discovered_schema_used: false,
    // 이번 턴이 확정한 요구. 다음 턴이 "그럼 8월은?"이라고 이어 물을 때 화면이 이걸
    // 그대로 돌려보낸다 — 서버는 턴 사이에 아무 상태도 들고 있지 않다.
    requirement: null,
    stages,

    stage(name, data) {
      stages.push({ name, at_ms: Date.now() - startedAt, ...data })
      return trace
    },

    resolve(level, source, { discovered = false } = {}) {
      trace.resolution_level = level
      trace.source = source
      trace.discovered_schema_used = discovered
      return trace
    },

    toJSON() {
      return {
        question: trace.question,
        today: trace.today,
        resolution_level: trace.resolution_level,
        source: trace.source,
        discovered_schema_used: trace.discovered_schema_used,
        requirement: trace.requirement,
        elapsed_ms: Date.now() - startedAt,
        stages,
      }
    },
  }
  return trace
}
