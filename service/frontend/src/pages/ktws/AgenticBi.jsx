import { Sparkles, Bot } from 'lucide-react'
import PageHeader from '../../components/PageHeader'
import DashboardBuilder from '../../components/DashboardBuilder'

const EXAMPLE_QUESTIONS = [
  '이번 달 계약 실적 알려줘',
  '이번 달 계약 달성률 몇 %야',
  '딜러별 연누적 출고 실적 보여줘',
  '이번 달 계약 취소 건수 몇 건이야',
  '연누적 출고 모델별로 보여줘',
  '이번 달 워킹데이 진행률 알려줘',
]

// 사이드바에 "대시보드 커스텀"으로 노출되는 화면(경로는 /ktws/agentic-bi 그대로) —
// agentic_bi_design/(Ontology/Semantic Layer 기반 설계)를 실제 Fabric 웨어하우스에 붙인
// 페이지. AI 챗봇 패널(ChatPanel, pageKey="agentic-bi")에
// 질문하면 답변이 채팅 스레드에 인라인으로 보이고, 단일 SQL로 재현 가능한 지표(등록된
// metric 정의로 결정론적으로 컴파일된 것)는 "대시보드에 추가" 제안(patch_ready)도 함께
// 온다 — RAG 테스트(/ktws/custom)와 같은 DashboardBuilder를 그대로 붙여 써서 같은
// 캔버스에 저장/배포/undo-redo까지 이어진다(스코프당 캔버스 하나 공유, DashboardStateContext).
export default function KtwsAgenticBi() {
  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="대시보드 커스텀"
        description="등록된 지표(Ontology/Semantic Layer 기반)에 대해 자연어로 질문하면, LLM이 SQL을 직접 쓰지 않고 검증된 지표 정의만으로 결정론적으로 SQL을 조립해 Fabric에 실행합니다. 오른쪽 위 AI 챗봇 버튼을 눌러 질문해보세요 — 대시보드에 추가 가능한 답변은 아래 캔버스에 반영할 수 있습니다."
      />

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
          <Sparkles size={15} className="text-blue-500" />
          예시 질문
        </div>
        <div className="flex flex-wrap gap-2">
          {EXAMPLE_QUESTIONS.map((q) => (
            <span key={q} className="text-xs px-3 py-1.5 rounded-full bg-gray-50 border border-gray-200 text-gray-600">
              {q}
            </span>
          ))}
        </div>
        <p className="text-xs text-gray-400 flex items-center gap-1.5 pt-2 border-t border-gray-100">
          <Bot size={12} /> 아직 컴파일러가 지원하지 않는 지표(예: 시승/영업기회 관련 일부)를 물어보면
          왜 안 되는지 이유를 그대로 보여줍니다 — 값을 지어내지 않습니다.
        </p>
      </div>

      <DashboardBuilder />
    </div>
  )
}
