import { useCallback, useState } from 'react'
import WidgetGrid from './WidgetGrid'
import DashboardObjectEditor from './DashboardObjectEditor'
import { useDashboardState } from '../context/DashboardStateContext'
import { useUser } from '../auth/UserContext'
import { DEPLOY_TARGETS, labelForPageKey } from '../deployTargets'
import {
  LayoutGrid, Undo2, Redo2, Sparkles, Loader2, Save, Trash2, UploadCloud,
  LayoutTemplate, Star, Layers, ChevronDown, Plus, Eye, Pencil, RefreshCw,
} from 'lucide-react'
import { updateDashboardObject } from '../utils/dashboardObject'

const MAX_SAVED_PAGES = 5

// RAG 테스트 화면(/ktws/custom)에서 쓰던 툴바+캔버스+배포 모달을 그대로 뽑아낸 공용
// 컴포넌트 — DashboardStateContext가 앱 전역(스코프 단위) 공유 상태라 어느 페이지에서
// 렌더링하든 같은 캔버스를 보여준다(대시보드 커스텀 페이지(/ktws/agentic-bi)도 이걸 그대로 붙여서 같은 저장/배포/
// undo-redo 기능을 얻는다). props 없음: useDashboardState()/useUser()에서 전부 끌어온다.
export default function DashboardBuilder() {
  const {
    dashboardState, applyPatch, undo, redo, canUndo, canRedo, isLoading,
    name, dirty, saveStatus, savedPages, switchTo, newPage, save, deletePage, deploy,
    templates, loadTemplate, setTemplateFlag, selectedWidgetId, setSelectedWidgetId, refreshPageData, refreshObjectData,
  } = useDashboardState()
  const { user } = useUser()
  const { widgets } = dashboardState
  const current = savedPages.find(p => p.name === name)
  const [templateChoice, setTemplateChoice] = useState('')
  const [deployPickerOpen, setDeployPickerOpen] = useState(false)
  const [pageMenuOpen, setPageMenuOpen] = useState(false)
  const [editMode, setEditMode] = useState(true)
  const [editorOpen, setEditorOpen] = useState(false)
  const [refreshingData, setRefreshingData] = useState(false)
  const selectedWidget = widgets.find((widget) => widget.id === selectedWidgetId)

  // 저장 안 한 편집이 있을 때, 그걸 버리게 되는 동작(페이지 전환/새 페이지/템플릿 불러오기) 전에 한 번 확인.
  const confirmDiscardIfDirty = useCallback((message) => {
    return !dirty || window.confirm(message)
  }, [dirty])

  const handleNewPage = useCallback(() => {
    if (!confirmDiscardIfDirty('저장하지 않은 변경사항이 있습니다. 새 페이지를 만들면 사라집니다. 계속할까요?')) return
    const input = window.prompt('새 페이지 이름을 입력하세요.', '')
    const trimmed = input?.trim()
    if (!trimmed) return
    if (savedPages.some(p => p.name === trimmed)) {
      window.alert(`'${trimmed}' 이름은 이미 사용 중입니다. 다른 이름을 입력해 주세요.`)
      return
    }
    newPage(trimmed)
    setPageMenuOpen(false)
  }, [confirmDiscardIfDirty, newPage, savedPages])

  const handleSwitchPage = useCallback((targetName) => {
    setPageMenuOpen(false)
    if (targetName === name) return
    if (!confirmDiscardIfDirty('저장하지 않은 변경사항이 있습니다. 다른 페이지로 이동하면 사라집니다. 계속할까요?')) return
    switchTo(targetName)
  }, [name, confirmDiscardIfDirty, switchTo])

  // 이름이 있는(기존) 페이지면 그대로 덮어쓰고, 새 페이지(이름 없음)면 이름을 물어본 뒤 처음 저장한다.
  const handleSave = useCallback(() => {
    if (!name) {
      const input = window.prompt('저장할 페이지 이름을 입력하세요.', '')
      const trimmed = input?.trim()
      if (!trimmed) return
      save(trimmed).catch(err => window.alert(err.message))
      return
    }
    save().catch(err => window.alert(err.message))
  }, [name, save])

  const handleLoadTemplate = useCallback(() => {
    if (!templateChoice) return
    if (!confirmDiscardIfDirty('저장하지 않은 변경사항이 있습니다. 템플릿을 불러오면 사라집니다. 계속할까요?')) return
    loadTemplate(templateChoice).catch(err => window.alert(err.message))
  }, [templateChoice, confirmDiscardIfDirty, loadTemplate])

  const handleToggleTemplate = useCallback(() => {
    if (!current) return
    setTemplateFlag(!current.isTemplate).catch(err => window.alert(err.message))
  }, [current, setTemplateFlag])

  const handleDelete = useCallback(() => {
    if (!name) return
    if (!window.confirm(`'${name}' 저장본을 삭제할까요? 배포 중이었다면 배포도 함께 해제됩니다.`)) return
    deletePage(name).catch(err => window.alert(err.message))
  }, [name, deletePage])

  // 화면을 고르면 바로 배포하지 않고, 클릭한 화면의 실제 이름을 확인창으로 한 번 더 보여준다.
  // 목록 클릭 실수 한 번이 딜러사 전체 화면을 바꾸는 일이라 확인 단계가 필요하다.
  const handleDeploy = useCallback((pageKey) => {
    const label = labelForPageKey(pageKey)
    const dirtyNote = dirty ? '\n(저장하지 않은 변경사항은 포함되지 않습니다 — 마지막 저장본이 배포됩니다.)' : ''
    if (!window.confirm(`'${label}' 화면에 배포합니다.${dirtyNote}\n계속할까요?`)) return
    deploy(pageKey)
      .then(() => setDeployPickerOpen(false))
      .catch(err => window.alert(err.message))
  }, [dirty, deploy])

  const handleRefreshData = useCallback(() => {
    // 2026-08-04 leo: 사용자의 명시적 새로고침만 결과 cache와 watermark cache를 함께
    // 우회한다. 일반 페이지 진입은 SWR cache를 유지해 Fabric을 불필요하게 재실행하지 않는다.
    setRefreshingData(true)
    refreshPageData()
      .catch((error) => window.alert(error.message))
      .finally(() => setRefreshingData(false))
  }, [refreshPageData])

  // react-grid-layout이 리사이즈 종료(또는 자리 없는 위젯의 첫 자동 배치) 후 넘겨주는
  // {widgetId, left, top, right, bottom}[]를 위젯에 반영. 옛 weight/height, 그리고
  // 아직 자리를 못 찾은 위젯에 붙어있던 sizeHint는 여기서 걷어내(한 번만) 새 스키마로 정착시킨다.
  const commitLayout = useCallback((changes) => {
    const ops = changes.map(({ widgetId, left, top, right, bottom, layout }) => {
      const widget = widgets.find(w => w.id === widgetId)
      if (!widget) return null
      const { weight, height, sizeHint, ...rest } = widget
      return {
        op: 'update',
        widgetId,
        widget: updateDashboardObject({ ...rest, left, top, right, bottom }, { layout }),
      }
    }).filter(Boolean)
    if (ops.length) applyPatch({ baseVersion: dashboardState.version, ops }, { persist: 'layout' })
  }, [widgets, dashboardState.version, applyPatch])

  // 카드 우상단 삭제 버튼 — 챗봇 없이 바로 지운다. 실수로 지워도 위의 실행취소로 복구 가능.
  const handleRemoveWidget = useCallback((widgetId) => {
    applyPatch({ baseVersion: dashboardState.version, ops: [{ op: 'remove', widgetId }] })
    setSelectedWidgetId((selected) => (selected === widgetId ? null : selected))
  }, [dashboardState.version, applyPatch])

  const handleSaveObject = useCallback((changes) => {
    if (!selectedWidget) return
    const widget = updateDashboardObject(selectedWidget, changes)
    applyPatch({ baseVersion: dashboardState.version, ops: [{ op: 'update', widgetId: selectedWidget.id, widget }] })
    setEditorOpen(false)
  }, [selectedWidget, dashboardState.version, applyPatch])

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <button
            onClick={() => setPageMenuOpen(o => !o)}
            title="페이지 목록"
            className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
          >
            <Layers size={13} />
            {name ?? '(제목 없음)'}
            {dirty && <span className="w-1.5 h-1.5 rounded-full bg-amber-500" title="저장하지 않은 변경사항" />}
            <ChevronDown size={13} className="text-gray-400" />
          </button>
          {pageMenuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setPageMenuOpen(false)} />
              <div className="absolute left-0 top-full mt-1 z-50 w-56 rounded-lg border border-gray-200 bg-white shadow-lg overflow-hidden">
                <button
                  onClick={handleNewPage}
                  className="w-full flex items-center gap-1.5 px-3 py-2 text-left text-xs font-medium text-blue-600 hover:bg-blue-50 border-b border-gray-100"
                >
                  <Plus size={13} /> 새 페이지
                </button>
                <div className="max-h-64 overflow-y-auto py-1">
                  {savedPages.length === 0 && (
                    <div className="px-3 py-2 text-xs text-gray-400">저장된 페이지가 없습니다.</div>
                  )}
                  {savedPages.map(({ name: n }) => (
                    <button
                      key={n}
                      onClick={() => handleSwitchPage(n)}
                      className={`w-full flex items-center justify-between px-3 py-2 text-left text-xs ${
                        n === name ? 'text-blue-700 font-medium bg-blue-50/60' : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <span>{n}</span>
                      {n === name && <span className="text-[10px] text-blue-600">보는 중</span>}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
        <span className="text-[11px] text-gray-400">저장 {savedPages.length}/{MAX_SAVED_PAGES}</span>

        <button
          onClick={handleSave}
          title="저장"
          className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border ${
            dirty
              ? 'border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100'
              : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
          }`}
        >
          {saveStatus === 'saving' ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />} 저장
        </button>
        {saveStatus === 'saving' && <span className="text-[11px] text-gray-400">자동 저장 중</span>}
        {saveStatus === 'error' && <span className="text-[11px] text-red-500" title="저장에 실패했습니다. 저장 버튼을 다시 눌러주세요.">저장 실패</span>}
        <button
          onClick={handleRefreshData}
          disabled={!name || refreshingData}
          title={name ? '최신 데이터로 강제 새로고침' : '먼저 저장해야 새로고침할 수 있습니다'}
          className="flex h-7 w-7 items-center justify-center rounded border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <RefreshCw size={13} className={refreshingData ? 'animate-spin' : ''} />
        </button>
        <button
          onClick={handleDelete}
          disabled={!name}
          title="현재 저장본 삭제"
          className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-red-50 hover:text-red-600 disabled:opacity-40 disabled:cursor-not-allowed"
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
          disabled={!name}
          title={name ? '배포할 화면 선택' : '먼저 저장해야 배포할 수 있습니다'}
          className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <UploadCloud size={13} /> 배포
        </button>
        {current?.isDeployed && (
          <span className="text-[11px] text-blue-600">배포됨 · {labelForPageKey(current.targetPageKey)}</span>
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
        <button
          onClick={() => { setEditMode((value) => !value); setSelectedWidgetId(null) }}
          title={editMode ? '보기 모드로 전환' : '편집 모드로 전환'}
          className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border ${
            editMode
              ? 'border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100'
              : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
          }`}
        >
          {editMode ? <Pencil size={13} /> : <Eye size={13} />}
          {editMode ? '편집 중' : '보기'}
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
        <>
          <WidgetGrid
            widgets={widgets}
            editMode={editMode}
            onCommitLayout={commitLayout}
            onRemoveWidget={handleRemoveWidget}
            onRefreshWidget={(widgetId) => refreshObjectData(widgetId).catch((error) => window.alert(error.message))}
            selectedWidgetId={selectedWidgetId}
            onSelectWidget={setSelectedWidgetId}
            onEditWidget={(widgetId) => {
              setSelectedWidgetId(widgetId)
              setEditorOpen(true)
            }}
          />
        </>
      )}

      {editorOpen && selectedWidget && (
        <DashboardObjectEditor object={selectedWidget} onSave={handleSaveObject} onClose={() => setEditorOpen(false)} />
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
    </>
  )
}
