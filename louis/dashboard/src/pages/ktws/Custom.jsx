import { useCallback, useState } from 'react'
import PageHeader from '../../components/PageHeader'
import WidgetGrid from '../../components/WidgetGrid'
import { useDashboardState } from '../../context/DashboardStateContext'
import { DEPLOY_TARGETS, labelForPageKey } from '../../deployTargets'
import { LayoutGrid, Undo2, Redo2, Sparkles, Loader2, Save, Trash2, UploadCloud, RotateCcw } from 'lucide-react'

const MAX_SAVED_PAGES = 5

export default function KtwsCustom() {
  const {
    dashboardState, applyPatch, undo, redo, canUndo, canRedo, isLoading,
    name, savedPages, switchTo, saveAs, deletePage, deploy, rollback,
  } = useDashboardState()
  const { widgets } = dashboardState
  const current = savedPages.find(p => p.name === name)
  const [deployTarget, setDeployTarget] = useState(DEPLOY_TARGETS[0].pageKey)

  const handleSaveAs = useCallback(() => {
    const input = window.prompt('저장할 대시보드 이름을 입력하세요.', name === '기본' ? '' : (name ?? ''))
    const trimmed = input?.trim()
    if (!trimmed) return
    saveAs(trimmed).catch(err => window.alert(err.message))
  }, [name, saveAs])

  const handleDelete = useCallback(() => {
    if (!name) return
    if (!window.confirm(`'${name}' 저장본을 삭제할까요? 배포 중이었다면 배포도 함께 해제됩니다.`)) return
    deletePage(name).catch(err => window.alert(err.message))
  }, [name, deletePage])

  const handleDeploy = useCallback(() => {
    deploy(deployTarget).catch(err => window.alert(err.message))
  }, [deploy, deployTarget])

  const handleRollback = useCallback(() => {
    if (!current?.targetPageKey) return
    rollback(current.targetPageKey).catch(err => window.alert(err.message))
  }, [current, rollback])

  const commitWeights = useCallback((updates) => {
    const ops = Object.entries(updates).map(([widgetId, weight]) => {
      const widget = widgets.find(w => w.id === widgetId)
      return { op: 'update', widgetId, widget: { ...widget, weight } }
    })
    if (ops.length) applyPatch({ baseVersion: dashboardState.version, ops })
  }, [widgets, dashboardState.version, applyPatch])

  const commitHeight = useCallback((widgetId, height) => {
    const widget = widgets.find(w => w.id === widgetId)
    if (!widget) return
    applyPatch({
      baseVersion: dashboardState.version,
      ops: [{ op: 'update', widgetId, widget: { ...widget, height } }],
    })
  }, [widgets, dashboardState.version, applyPatch])

  return (
    <div className="p-6 space-y-6">
      <PageHeader title="대시보드 커스텀" description="오른쪽 상단 AI 챗봇에게 원하는 차트/지표를 요청하면 이 페이지에 바로 반영됩니다." />

      <div className="flex flex-wrap items-center gap-2">
        <select
          value={name ?? ''}
          onChange={(e) => switchTo(e.target.value)}
          title="저장된 대시보드"
          className="text-xs font-medium px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-600"
        >
          {savedPages.length === 0 && <option value="기본">기본</option>}
          {savedPages.map(({ name: n }) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
        <span className="text-[11px] text-gray-400">저장 {savedPages.length}/{MAX_SAVED_PAGES}</span>

        <button
          onClick={handleSaveAs}
          title="다른 이름으로 저장"
          className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
        >
          <Save size={13} /> 다른 이름으로 저장
        </button>
        <button
          onClick={handleDelete}
          title="현재 저장본 삭제"
          className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-red-50 hover:text-red-600"
        >
          <Trash2 size={13} /> 삭제
        </button>

        <div className="w-px h-5 bg-gray-200 mx-1" />

        <select
          value={deployTarget}
          onChange={(e) => setDeployTarget(e.target.value)}
          title="배포 대상 탭"
          className="text-xs font-medium px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-600"
        >
          {DEPLOY_TARGETS.map(t => (
            <option key={t.pageKey} value={t.pageKey}>{t.label}</option>
          ))}
        </select>
        <button
          onClick={handleDeploy}
          title="선택한 탭에 배포"
          className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100"
        >
          <UploadCloud size={13} /> 배포
        </button>
        {current?.isDeployed && (
          <>
            <span className="text-[11px] text-blue-600">배포됨 · {labelForPageKey(current.targetPageKey)}</span>
            <button
              onClick={handleRollback}
              title="기본 화면으로 롤백"
              className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
            >
              <RotateCcw size={13} /> 롤백
            </button>
          </>
        )}

        <div className="flex-1" />

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

      {isLoading ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 flex flex-col items-center justify-center text-center">
          <Loader2 size={28} className="text-gray-300 mb-3 animate-spin" />
          <p className="text-sm text-gray-500">대시보드 불러오는 중...</p>
        </div>
      ) : widgets.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 flex flex-col items-center justify-center text-center">
          <LayoutGrid size={40} className="text-gray-300 mb-3" />
          <p className="text-sm text-gray-500 mb-1">아직 추가된 위젯이 없습니다.</p>
          <p className="text-xs text-gray-400 flex items-center gap-1.5">
            <Sparkles size={12} /> 오른쪽 상단 AI 챗봇으로 위젯을 추가해보세요.
          </p>
        </div>
      ) : (
        <WidgetGrid widgets={widgets} onCommitWeights={commitWeights} onCommitHeight={commitHeight} />
      )}
    </div>
  )
}
