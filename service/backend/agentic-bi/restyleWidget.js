// 이미 대시보드에 있는 위젯의 "겉모습만" 바꾼다 — 차트 종류와 계열 색.
// 데이터·지표·기간은 건드리지 않고 DB도 다시 조회하지 않는다(클라이언트가 dashboardState를
// 보낼 때 위젯 props에 원본 행이 함께 오므로 서버가 그대로 다시 그릴 수 있다).
//
// 순수 함수로 분리한 이유: 이 판정이 곧 "예외 없이 바뀌는가"의 보장 지점이라 단위 테스트로
// 고정해야 한다. 차트마다 querySpec 키 모양이 달라서(labelKey/valueKey ↔ xKey/yKeys ↔
// barKeys/lineKeys ↔ xKey/yKey) 허용되지 않은 종류로 바꾸면 저장 후 재조회 때 위젯이 깨진다.
// 허용 범위 판정과 변환은 편집 패널이 쓰는 것과 같은 함수를 그대로 재사용한다 — 두 경로가
// 다른 규칙을 갖게 되면 "패널에선 되는데 챗봇에선 깨지는" 상황이 생긴다.
import { chartCodeOptionsFor, convertQuerySpec, seriesKeysFor, rowsFromWidgetProps } from '../../frontend/src/utils/chartSpecConvert.js'
import { buildWidgetPropsFromRows } from '../widgetSchema.js'
import { validateWidgetProps } from '../dashboardValidation.js'

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/

export const CHART_CODE_LABELS = {
  bar: '막대', line: '꺾은선', area: '영역', pie: '도넛',
  combo: '막대+선', radar: '레이더', scatter: '산점도', funnel: '퍼널', funnel_pyramid: '퍼널 구조', table: '표',
}

export function labelForChartCode(code) {
  return CHART_CODE_LABELS[code] || code
}

// 이 위젯이 무엇으로 바뀔 수 있고 어떤 계열에 색을 칠할 수 있는지 — 프롬프트에 그대로
// 렌더링해 LLM이 허용 범위 밖을 고르지 않도록 유도한다(최종 판정은 applyRestyle이 한다).
export function describeRestyleOptions(widget) {
  const rows = rowsFromWidgetProps(widget.props, { chartCode: widget.chartCode, querySpec: widget.querySpec })
  if (!rows.length) return null
  const options = chartCodeOptionsFor(widget.chartCode, widget.querySpec || {}, rows)
  const series = seriesKeysFor(widget.chartCode, widget.querySpec || {}, rows)
  const others = options.filter((c) => c !== widget.chartCode)
  return {
    widgetId: widget.id,
    title: widget.title,
    current: widget.chartCode,
    changeableTo: others,
    seriesLabels: series.map((s) => s.label),
  }
}

// dashboardState의 위젯 목록을 프롬프트용 텍스트로. 바꿀 수 있는 게 없는 위젯(KPI 카드,
// 데이터가 없는 위젯)은 아예 빼서 LLM이 시도조차 안 하게 한다.
export function renderRestyleCatalogForPrompt(dashboardState) {
  const lines = []
  for (const widget of dashboardState?.widgets || []) {
    if (widget.chartCode === 'kpi') continue
    const info = describeRestyleOptions(widget)
    if (!info || (!info.changeableTo.length && !info.seriesLabels.length)) continue
    const types = info.changeableTo.length ? info.changeableTo.map(labelForChartCode).join(', ') : '(없음)'
    const series = info.seriesLabels.length ? info.seriesLabels.join(', ') : '(없음)'
    lines.push(`- ${info.widgetId} "${info.title}" (현재: ${labelForChartCode(info.current)}) → 바꿀 수 있는 종류: ${types} / 계열: ${series}`)
  }
  return lines.join('\n')
}

// { ok, widget?, notes[], error? }
// ok=false면 패치를 만들지 않는다 — 조용히 다른 걸 하지 않고 이유를 그대로 돌려준다.
export function applyRestyle(widget, { chartType, colors } = {}) {
  const notes = []
  if (!widget) return { ok: false, error: '수정할 위젯을 찾지 못했습니다. 새로고침 후 다시 시도해주세요.' }

  const rows = rowsFromWidgetProps(widget.props, { chartCode: widget.chartCode, querySpec: widget.querySpec })
  if (!rows.length) {
    return { ok: false, error: `"${widget.title}"은 표시할 데이터가 없어 모양을 바꿀 수 없습니다.` }
  }

  const currentCode = widget.chartCode
  const allowed = chartCodeOptionsFor(currentCode, widget.querySpec || {}, rows)

  // 1) 차트 종류
  let nextCode = currentCode
  if (chartType && chartType !== currentCode) {
    if (!allowed.includes(chartType)) {
      const list = allowed.filter((c) => c !== currentCode).map(labelForChartCode).join(', ')
      return {
        ok: false,
        error: `"${widget.title}"은 ${labelForChartCode(chartType)}(으)로 바꿀 수 없습니다`
          + (list ? ` — 이 데이터로는 ${list}만 가능합니다.` : ' — 이 데이터로는 다른 종류로 바꿀 수 없습니다.'),
      }
    }
    nextCode = chartType
  }

  let nextSpec = nextCode === currentCode
    ? { ...(widget.querySpec || {}) }
    : convertQuerySpec(currentCode, nextCode, widget.querySpec || {}, rows)

  // 2) 계열 색 — 실제 존재하는 계열 키에만, 올바른 hex만 반영한다.
  if (colors?.length) {
    const validKeys = new Map(seriesKeysFor(nextCode, nextSpec, rows).map((s) => [s.key, s.label]))
    const applied = {}
    const unknown = []
    const badHex = []
    for (const { series, color } of colors) {
      if (!validKeys.has(series)) { unknown.push(series); continue }
      if (!HEX_COLOR.test(color || '')) { badHex.push(series); continue }
      applied[series] = color
    }
    if (unknown.length) notes.push(`계열을 찾지 못해 건너뛴 항목: ${unknown.join(', ')}`)
    if (badHex.length) notes.push(`색상 형식(#RRGGBB)이 아니어서 건너뛴 항목: ${badHex.join(', ')}`)
    if (Object.keys(applied).length) {
      nextSpec = { ...nextSpec, colorsBySeries: { ...(nextSpec.colorsBySeries || {}), ...applied } }
    }
  }

  const changedType = nextCode !== currentCode
  const changedColors = nextSpec.colorsBySeries !== widget.querySpec?.colorsBySeries
  if (!changedType && !changedColors) {
    return { ok: false, error: '바꿀 내용을 알아내지 못했습니다. 차트 종류나 계열 색을 구체적으로 말씀해 주세요.', notes }
  }

  // 3) 실제로 렌더 가능한지 확인한 뒤에만 패치를 만든다.
  let built
  try {
    built = buildWidgetPropsFromRows(nextCode, rows, nextSpec, widget.title)
  } catch (err) {
    return { ok: false, error: `모양을 바꾸는 중 문제가 생겼습니다: ${err.message}`, notes }
  }
  const nextWidget = { ...widget, chartCode: nextCode, type: built.type, querySpec: nextSpec, props: built.props }
  const check = validateWidgetProps(nextWidget)
  if (!check.ok) {
    return { ok: false, error: `바뀐 모양이 유효하지 않아 적용하지 않았습니다: ${check.reason}`, notes }
  }

  // 위치(left/top/right/bottom)·sql·sqlQueries 등은 그대로 둔다 — 겉모습만 갈아끼운다.
  return {
    ok: true,
    notes,
    changedType,
    widget: nextWidget,
  }
}
