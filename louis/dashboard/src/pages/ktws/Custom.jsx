import { useCallback, useState } from 'react'
import PageHeader from '../../components/PageHeader'
import WidgetGrid from '../../components/WidgetGrid'
import { useDashboardState } from '../../context/DashboardStateContext'
import { useUser } from '../../auth/UserContext'
import { DEPLOY_TARGETS, labelForPageKey } from '../../deployTargets'
import { LayoutGrid, Undo2, Redo2, Sparkles, Loader2, Save, Trash2, UploadCloud, RotateCcw, LayoutTemplate, Star } from 'lucide-react'

const MAX_SAVED_PAGES = 5

export default function KtwsCustom() {
  const {
    dashboardState, applyPatch, undo, redo, canUndo, canRedo, isLoading,
    name, savedPages, switchTo, saveAs, deletePage, deploy, rollback,
    templates, loadTemplate, setTemplateFlag,
  } = useDashboardState()
  const { user } = useUser()
  const { widgets } = dashboardState
  const current = savedPages.find(p => p.name === name)
  const [templateChoice, setTemplateChoice] = useState('')
  const [deployPickerOpen, setDeployPickerOpen] = useState(false)

  const handleSaveAs = useCallback(() => {
    const input = window.prompt('저장할 대시보드 이름을 입력하세요.', name === '기본' ? '' : (name ?? ''))
    const trimmed = input?.trim()
    if (!trimmed) return
    saveAs(trimmed).catch(err => window.alert(err.message))
  }, [name, saveAs])

  // 템플릿을 캔버스에 채운 뒤 곧바로 "다른 이름으로 저장"까지 유도 — 템플릿 자체는
  // 건드리지 않고, 지금 scope에 새 저장본으로 남긴다.
  const handleLoadTemplate = useCallback(() => {
    if (!templateChoice) return
    if (widgets.length > 0 && !window.confirm('지금 캔버스의 위젯을 템플릿 내용으로 덮어씁니다. 계속할까요?')) return
    loadTemplate(templateChoice)
      .then(() => {
        const input = window.prompt('이 템플릿을 어떤 이름으로 저장할까요?', templateChoice)
        const trimmed = input?.trim()
        if (!trimmed) return
        return saveAs(trimmed)
      })
      .catch(err => window.alert(err.message))
  }, [templateChoice, widgets.length, loadTemplate, saveAs])

  const handleToggleTemplate = useCallback(() => {
    if (!current) return
    setTemplateFlag(!current.isTemplate).catch(err => window.alert(err.message))
  }, [current, setTemplateFlag])

  const handleDelete = useCallback(() => {
    if (!name) return
    if (!window.confirm(`'${name}' 저장본을 삭제할까요? 배포 중이었다면 배포도 함께 해제됩니다.`)) return
    deletePage(name).catch(err => window.alert(err.message))
  }, [name, deletePage])

  const handleDeploy = useCallback((pageKey) => {
    deploy(pageKey)
      .then(() => setDeployPickerOpen(false))
      .catch(err => window.alert(err.message))
  }, [deploy])

  const handleRollback = useCallback(() => {
    if (!current?.targetPageKey) return
    rollback(current.targetPageKey).catch(err => window.alert(err.message))
  }, [current, rollback])

  // react-grid-layout이 리사이즈 종료(또는 자리 없는 위젯의 첫 자동 배치) 후 넘겨주는
  // {widgetId, left, top, right, bottom}[]를 위젯에 반영. 옛 weight/height, 그리고
  // 아직 자리를 못 찾은 위젯에 붙어있던 sizeHint는 여기서 걷어내(한 번만) 새 스키마로 정착시킨다.
  const commitLayout = useCallback((changes) => {
    const ops = changes.map(({ widgetId, left, top, right, bottom }) => {
      const widget = widgets.find(w => w.id === widgetId)
      if (!widget) return null
      const { weight, height, sizeHint, ...rest } = widget
      return { op: 'update', widgetId, widget: { ...rest, left, top, right, bottom } }
    }).filter(Boolean)
    if (ops.length) applyPatch({ baseVersion: dashboardState.version, ops })
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
        {user.role === 'hq' && (
          <button
            onClick={handleToggleTemplate}
            disabled={!current}
            title={current?.isTemplate ? '템플릿 해제' : '템플릿으로 지정'}
            className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border disabled:opacity-40 disabled:cursor-not-allowed ${
              current?.isTemplate
                ? 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100'
                : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Star size={13} /> {current?.isTemplate ? '템플릿 해제' : '템플릿으로 지정'}
          </button>
        )}

        <div className="w-px h-5 bg-gray-200 mx-1" />

        <LayoutTemplate size={13} className="text-gray-400" />
        <select
          value={templateChoice}
          onChange={(e) => setTemplateChoice(e.target.value)}
          title="템플릿에서 불러오기"
          className="text-xs font-medium px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-600"
        >
          <option value="">템플릿 선택...</option>
          {templates.map(t => (
            <option key={t.name} value={t.name}>{t.name}</option>
          ))}
        </select>
        <button
          onClick={handleLoadTemplate}
          disabled={!templateChoice}
          title="선택한 템플릿을 캔버스에 불러오기"
          className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          템플릿 불러오기
        </button>

        <div className="w-px h-5 bg-gray-200 mx-1" />

        <button
          onClick={() => setDeployPickerOpen(true)}
          title="배포할 화면 선택"
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
        <WidgetGrid widgets={widgets} onCommitLayout={commitLayout} />
      )}

      {deployPickerOpen && (
        <>
          <div className="fixed inset-0 bg-black/20 z-40" onClick={() => setDeployPickerOpen(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-gray-100 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                <p className="text-sm font-semibold text-gray-800">어느 화면에 배포할까요?</p>
                <button
                  onClick={() => setDeployPickerOpen(false)}
                  className="text-xs text-gray-400 hover:text-gray-600"
                >
                  닫기
                </button>
              </div>
              <div className="max-h-80 overflow-y-auto py-1.5">
                {DEPLOY_TARGETS.map(t => {
                  const isCurrent = current?.isDeployed && current?.targetPageKey === t.pageKey
                  return (
                    <button
                      key={t.pageKey}
                      onClick={() => handleDeploy(t.pageKey)}
                      className={`w-full flex items-center justify-between px-4 py-2.5 text-left text-sm hover:bg-blue-50 ${isCurrent ? 'text-blue-700 font-medium bg-blue-50/60' : 'text-gray-700'}`}
                    >
                      <span>{t.label}</span>
                      {isCurrent && <span className="text-[10px] text-blue-600">현재 배포됨</span>}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
