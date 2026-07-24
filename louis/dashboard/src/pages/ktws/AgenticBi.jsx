import { Sparkles, Bot } from 'lucide-react'
import PageHeader from '../../components/PageHeader'

const EXAMPLE_QUESTIONS = [
  '이번 달 계약 실적 알려줘',
  '이번 달 계약 달성률 몇 %야',
  '딜러별 연누적 출고 실적 보여줘',
  '이번 달 계약 취소 건수 몇 건이야',
  '연누적 출고 모델별로 보여줘',
  '이번 달 워킹데이 진행률 알려줘',
]

// 실험용 페이지 — agentic_bi_design/(Ontology/Semantic Layer 기반 설계)를 실제 Fabric
// 웨어하우스에 붙여 테스트하기 위한 최소 화면. 결과는 이 페이지가 아니라 오른쪽 상단
// AI 챗봇 패널(ChatPanel, pageKey="agentic-bi")에 인라인으로 렌더링된다 — 기존
// GeneratedWidget 컴포넌트를 그대로 재사용하기 위해 채팅 스레드 안에 차트/표를 그린다.
export default function KtwsAgenticBi() {
  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Agentic BI (실험)"
        description="등록된 지표(Ontology/Semantic Layer 기반)에 대해 자연어로 질문하면, LLM이 SQL을 직접 쓰지 않고 검증된 지표 정의만으로 결정론적으로 SQL을 조립해 Fabric에 실행합니다. 오른쪽 위 AI 챗봇 버튼을 눌러 질문해보세요."
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
    </div>
  )
}
