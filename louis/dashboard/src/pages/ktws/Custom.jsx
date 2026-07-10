import PageHeader from '../../components/PageHeader'
import GeneratedWidget from '../../components/widgets/GeneratedWidget'
import { useDashboardState } from '../../context/DashboardStateContext'
import { LayoutGrid, Undo2, Redo2, Sparkles } from 'lucide-react'

export default function KtwsCustom() {
  const { dashboardState, undo, redo, canUndo, canRedo } = useDashboardState()
  const { widgets } = dashboardState

  return (
    <div className="p-6 space-y-6">
      <PageHeader title="대시보드 커스텀" description="오른쪽 상단 AI 챗봇에게 원하는 차트/지표를 요청하면 이 페이지에 바로 반영됩니다." />

      <div className="flex items-center gap-2">
        <button
          onClick={undo}
          disabled={!canUndo}
          title="실행 취소"
          className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Undo2 size={13} /> 실행 취소
        </button>
        <button
          onClick={redo}
          disabled={!canRedo}
          title="다시 실행"
          className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Redo2 size={13} /> 다시 실행
        </button>
      </div>

      {widgets.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 flex flex-col items-center justify-center text-center">
          <LayoutGrid size={40} className="text-gray-300 mb-3" />
          <p className="text-sm text-gray-500 mb-1">아직 추가된 위젯이 없습니다.</p>
          <p className="text-xs text-gray-400 flex items-center gap-1.5">
            <Sparkles size={12} /> 오른쪽 상단 AI 챗봇으로 위젯을 추가해보세요.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {widgets.map(widget => (
            <GeneratedWidget key={widget.id} name={widget.type} props={widget.props} />
          ))}
        </div>
      )}
    </div>
  )
}
