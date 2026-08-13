// 딜러 계약퍼널 — 이상현상 원인 해석 (요구사항정의서 4장).
//
// 역할 분리(2-1)를 코드로 강제한다:
//   코드(anomaly.js)  무엇이 얼마나 변했는지 — 임계치 기반 탐지
//   AI(여기)          왜 그런지 — 해석과 문구 생성
//
// **AI에는 원문 로그를 넘기지 않는다.** 코드가 이미 집계한 요약만 준다(정의서 4-8 권장).
// 그래야 (1) 토큰이 폭발하지 않고 (2) AI가 집계를 다시 하다 틀리는 일이 없다.
//
// 4장 원칙 8가지를 시스템 프롬프트로 옮겼다. 정의서는 이 프롬프트가 "실제 운영하면서
// 계속 다듬어질 것을 전제로, 담당자가 지속적으로 수정할 수 있는 구조"여야 한다고 했다 —
// 그래서 문자열 상수 하나로 모아 두고 코드 곳곳에 흩지 않는다.
import { createLlmClient, missingConfigMessage } from '../llm/index.js'
import { INTERPRETATION_PRINCIPLES } from './principles.js'
import { THRESHOLDS } from './anomaly.js'

export const SYSTEM_PROMPT = `당신은 렉서스·토요타 코리아 딜러 계약퍼널(활동→기회→시승→계약) 분석가입니다.
코드가 이미 집계·탐지한 결과를 받아 **원인을 해석하고 설명하는 일만** 합니다. 숫자를 다시 계산하지 마세요.

다음 원칙을 반드시 지킵니다.

${INTERPRETATION_PRINCIPLES}

출력 형식:
- 한국어. 실무자가 읽는 보고 문구로 3~6문장.
- **마크다운을 쓰지 마세요** — ##, **, - 같은 기호가 화면과 HTML 문서에 그대로 글자로 나옵니다.
  이 문구는 렌더링되지 않고 있는 그대로 표시됩니다. 줄바꿈만 씁니다.
- 가장 중요한 이상현상부터 다룬다. 모든 항목을 나열하지 말고 묶어서 설명한다.
- 마지막에 "확인이 필요한 것" 한 줄 — 데이터만으로는 답할 수 없어 현장에 물어야 하는 지점.`

/** AI에 넘길 요약. 원문 로그는 절대 넣지 않는다. */
export function buildUserPayload({ period, brand, anomalies, dealerSpread = [], forecast, funnelTotals }) {
  return JSON.stringify({
    조회범위: { ...period, 브랜드: brand || '전체' },
    탐지기준: {
      전월대비_증감률_임계치_퍼센트: THRESHOLDS.change_pct,
      전환율_변화_임계치_퍼센트포인트: THRESHOLDS.rate_change_pp,
      소표본_기준_건수: THRESHOLDS.small_sample,
    },
    퍼널_총계: funnelTotals,
    부분월_예상최종치: forecast,
    딜러_확산: dealerSpread,
    탐지된_이상현상: anomalies,
  }, null, 1)
}

/**
 * 이상현상 요약을 받아 해석 문구를 만든다.
 *
 * @returns {{text: string}|{error: string}}
 */
export async function narrateAnomalies({ period, brand, anomalies, dealerSpread = [], forecast, funnelTotals, question = null, modelId = null }) {
  // 설명할 게 없으면 LLM을 부르지 않는다. 설정이 없어도 이 경로는 답이 나와야 한다 —
  // 탐지 결과가 깨끗한 것도 정보다.
  if (!anomalies?.length) {
    return {
      text: `임계치를 넘는 변화가 없습니다. 지금 기준(전월 대비 ±${THRESHOLDS.change_pct}%, `
        + `전환율 ±${THRESHOLDS.rate_change_pp}%p)으로는 특이사항이 잡히지 않았습니다.`,
    }
  }

  const made = createLlmClient(modelId)
  if (!made) return { error: missingConfigMessage(modelId) }
  const { client, model } = made

  const payload = buildUserPayload({ period, brand, anomalies, dealerSpread, forecast, funnelTotals })
  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: question ? `${question}\n\n[집계 결과]\n${payload}` : `아래 집계 결과를 해석해 주세요.\n\n${payload}` },
  ]

  try {
    const res = await client.chat.completions.create({
      model,
      messages,
      temperature: 0.2,   // 같은 데이터에 매번 다른 해석이 나오면 신뢰할 수 없다
    })
    const text = res.choices?.[0]?.message?.content?.trim()
    return text ? { text } : { error: '해석 결과가 비어 있습니다.' }
  } catch (error) {
    return { error: error.message || 'AI 해석 호출에 실패했습니다.' }
  }
}
