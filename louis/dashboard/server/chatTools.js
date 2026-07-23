import { listTopicsForPrompt, renderGlossaryForPrompt } from './schemaLoader.js'

// OpenAI function-calling schema shared by /api/chat (free-form Q&A) and, for the
// final widget shape only, the dashboard-customize pipeline (see widgetSchema.js).
export const TOOLS = [
  {
    type: 'function',
    function: {
      name: 'render_bar_chart',
      description: '막대 차트(Bar Chart)를 생성합니다. 카테고리별 수치 비교에 사용하세요.',
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string', description: '차트 제목' },
          data: { type: 'array', items: { type: 'object' }, description: '데이터 배열' },
          x_key: { type: 'string', description: 'X축 필드명' },
          y_key: { type: 'string', description: 'Y축 필드명' },
          color: { type: 'string', description: '색상 hex 코드 (기본값: #3B82F6)' },
        },
        required: ['title', 'data', 'x_key', 'y_key'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'render_line_chart',
      description: '선 차트(Line Chart)를 생성합니다. 시계열 추이 분석에 사용하세요.',
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          data: { type: 'array', items: { type: 'object' } },
          x_key: { type: 'string' },
          y_keys: { type: 'array', items: { type: 'string' }, description: 'Y축 필드명 목록 (여러 선)' },
          y_labels: { type: 'array', items: { type: 'string' }, description: '각 선의 범례 이름' },
        },
        required: ['title', 'data', 'x_key', 'y_keys'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'render_kpi_cards',
      description: 'KPI 지표 카드를 생성합니다. 주요 수치 강조 표시에 사용하세요.',
      parameters: {
        type: 'object',
        properties: {
          cards: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                title: { type: 'string' },
                value: { type: 'string' },
                sub: { type: 'string' },
                trend: { type: 'string', enum: ['up', 'down', 'neutral'] },
              },
              required: ['title', 'value'],
            },
          },
        },
        required: ['cards'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'render_table',
      description: '데이터 테이블을 생성합니다. 상세 데이터 나열에 사용하세요.',
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          columns: { type: 'array', items: { type: 'string' } },
          rows: { type: 'array', items: { type: 'array' } },
        },
        required: ['title', 'columns', 'rows'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'render_pie_chart',
      description: '파이/도넛 차트를 생성합니다. 구성 비율 표현에 사용하세요.',
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          data: {
            type: 'array',
            items: {
              type: 'object',
              properties: { name: { type: 'string' }, value: { type: 'number' } },
              required: ['name', 'value'],
            },
          },
        },
        required: ['title', 'data'],
      },
    },
  },
]

export function buildSystemPrompt(summary) {
  const invPct = (n) => ((n / summary.inventory.total_vehicles) * 100).toFixed(0)
  return `당신은 Toyota/Lexus Korea의 데이터 분석 AI 어시스턴트입니다.
아래의 실제 데이터를 기반으로 한국어로 분석 및 인사이트를 제공하세요.

# 현재 데이터 (${summary.last_updated} 기준)

## 차량 현황 (재고)
- 총 등록 차량: ${summary.inventory.total_vehicles.toLocaleString()}대
- Lexus: ${summary.inventory.lexus.toLocaleString()}대 (${invPct(summary.inventory.lexus)}%)
- Toyota: ${summary.inventory.toyota.toLocaleString()}대 (${invPct(summary.inventory.toyota)}%)
- 최초소유 차량: ${summary.inventory.first_owner.toLocaleString()}대
- 차종별 현황 (상위 10): ${JSON.stringify(summary.inventory.top_models)}
- 연도별 출고: ${JSON.stringify(summary.inventory.delivery_by_year)}

## 계약 현황
- 총 계약: ${summary.contracts.total.toLocaleString()}건
- 출고완료: ${summary.contracts.completed.toLocaleString()}건 (완료율 ${summary.contracts.completion_rate}%)
- Lexus 계약: ${summary.contracts.lexus.toLocaleString()}건 / Toyota 계약: ${summary.contracts.toyota.toLocaleString()}건
- 최근 12개월 추이: ${JSON.stringify(summary.contracts.monthly_trend_last12)}
- 차종별 계약 상위 10: ${JSON.stringify(summary.contracts.by_model_top10)}
- 계약 상태: ${JSON.stringify(summary.contracts.by_status)}

## FMS/PMS/SMS 쿠폰 현황
- 총 FMS 서비스: ${summary.fms_coupon.total_fms_services.toLocaleString()}건 (${summary.fms_coupon.unique_vins.toLocaleString()}대)
- FMS(무상점검 1~5차): ${summary.fms_coupon.fms_count.toLocaleString()}건
- PMS(연장 6~11차): ${summary.fms_coupon.pms_count.toLocaleString()}건
- SMS(스마트 12차~): ${summary.fms_coupon.sms_count.toLocaleString()}건
- CR 타겟 차량: ${summary.fms_coupon.cr_targets.toLocaleString()}대
- 연차별 잔여비율: ${JSON.stringify(summary.fms_coupon.remaining_by_age)}
- ${summary.fms_coupon.note}

# 위 요약에 없는 데이터가 필요할 때 (매우 중요 — 반드시 지킬 것)
위 "현재 데이터" 섹션은 차량 재고/계약/FMS·PMS·SMS 쿠폰, 딱 이 세 가지 주제만 다루는
미리 생성된 스냅샷입니다. 사용자의 질문이 이 세 가지 중 하나가 **명확히** 아니라면
(예: 딜러사/사업소별 수치, 재무제표, 매출/카드결제, 그 외 위 섹션 제목에 없는 어떤 것이든),
위 요약에 있는 비슷해 보이는 다른 숫자를 절대 억지로 끌어다 답하지 마세요.
반드시 render_* 대신 classify_topic 도구를 호출해서 아래 주제 중 실제로 가장 관련있는 것을
선택하세요 — 그러면 실제 Fabric 웨어하우스에 실시간 SQL을 실행해서 정확한 데이터를 가져옵니다.
확신이 서지 않을 때는 render_*보다 classify_topic을 우선하세요.

## 실시간 조회 가능한 주제
${listTopicsForPrompt()}

## 도메인 용어 사전
${renderGlossaryForPrompt()}

# 응답 지침
1. 항상 한국어로 답변하세요
2. 구체적인 수치와 함께 인사이트를 제공하세요
3. **위 "현재 데이터" 섹션(재고/계약/쿠폰)에 직접 해당하는 질문만 render_* 도구를 사용하세요**
4. **그 외 모든 데이터 질문은 render_*를 쓰지 말고 반드시 classify_topic을 호출하세요 — 관련 없는 요약 수치를 답으로 재활용하지 마세요**
5. 하나의 답변에 여러 개의 차트/표를 생성할 수 있습니다
6. 비율/퍼센트는 소수점 1자리까지 표시하세요`
}
