// 이미 만든 인증 리포트 위젯의 표시 단위(grain)를 바꾼다.
//
// "여기서 활동유형 컬럼은 지워줘" 같은 요청이 갈 곳이 없었다. restyle_widget은 겉모습만
// 바꾸고, 차원 컬럼은 selected_columns 대상이 아니다(측정값만 고른다). 그래서 LLM이
// 일반 지표 경로로 새 조회를 만들어, 확정 리포트가 지표 하나로 바뀌고 지우라던 컬럼은
// 그대로 남는 일이 있었다(2026-08-03 확인).
//
// 차원을 빼는 건 열을 가리는 게 아니라 그 단위로 값을 다시 접는 일이다 — 안 그러면
// 같은 행이 활동유형 수만큼 중복돼 보인다. 그래서 rollupReportRows를 그대로 쓴다.
import { getReport } from '../reports/registry.js'
import { DIMENSION_ALIASES } from '../reports/projection.js'

/** 대시보드에서 다시 묶을 수 있는 위젯만 추린다. */
export function regroupableWidgets(dashboardState) {
  return (dashboardState?.widgets || []).filter((w) => {
    const spec = w?.querySpec
    if (!spec?.reportId) return false
    // 퍼널 프리셋은 표시 형태가 고정돼 있어 grain을 임의로 바꾸면 뷰가 깨진다.
    if (spec.reportView) return false
    return Array.isArray(w?.props?.columns) && w.props.columns.length > 0
  })
}

/** 그 위젯이 지금 들고 있는 차원 컬럼(= 지울 수 있는 후보). */
export function currentDimensions(widget) {
  const spec = widget?.querySpec
  if (!spec?.reportId) return []
  if (Array.isArray(spec.reportGroupBy) && spec.reportGroupBy.length) return [...spec.reportGroupBy]

  // 아직 접은 적이 없으면 계약의 측정값을 뺀 나머지가 차원이다.
  const { contract } = getReport(spec.reportId)
  const measures = new Set(Object.keys(contract.column_semantics || {}))
  return (widget.props?.columns || []).filter((c) => !measures.has(c))
}

export function renderRegroupCatalogForPrompt(dashboardState) {
  const widgets = regroupableWidgets(dashboardState)
  if (!widgets.length) return ''
  return widgets.map((w) => {
    const dims = currentDimensions(w)
    return `- ${w.id} | "${w.title}" | 현재 표시 단위: ${dims.join(' > ') || '(없음)'}`
  }).join('\n')
}

export function buildRegroupReportWidgetTool(dashboardState) {
  const ids = regroupableWidgets(dashboardState).map((w) => w.id)
  return {
    type: 'function',
    function: {
      name: 'regroup_report_widget',
      description:
        '대시보드에 이미 있는 인증 리포트 표의 표시 단위를 바꿉니다. 같은 리포트를 그대로 다시 '
        + '실행하고 지정한 단위로만 묶습니다 — 지표·기간·필터는 바뀌지 않습니다.\n'
        + '"여기서 활동유형 컬럼은 지워줘", "전시장은 빼줘", "딜러 단위로만 보여줘"처럼 '
        + '이미 만든 표의 컬럼을 빼거나 묶는 요청에 쓰세요.\n'
        + '주의: 차원 컬럼은 이 툴로만 뺄 수 있습니다. 값을 다시 집계해야 하므로 '
        + 'restyle_widget(겉모습 전용)이나 새 조회로 처리하면 안 됩니다.',
      parameters: {
        type: 'object',
        properties: {
          widget_id: {
            type: 'string',
            enum: ids.length ? ids : ['none'],
            description: '바꿀 위젯 id. [표 단위 변경 가능 범위] 목록에서 그대로 가져오세요.',
          },
          drop_dimensions: {
            type: 'array',
            items: { type: 'string' },
            description: '뺄 차원 컬럼 이름(예: ["활동유형"]). 목록의 "현재 표시 단위"에 있는 이름 그대로 쓰세요.',
          },
          keep_dimensions: {
            type: 'array',
            items: { type: 'string' },
            description: '남길 차원만 지정할 때 사용(예: ["딜러"] → 딜러 단위로만). drop_dimensions와 함께 쓰지 마세요.',
          },
        },
        required: ['widget_id'],
      },
    },
  }
}

const norm = (s) => String(s ?? '').replace(/\s+/g, '').toLowerCase()

/** 이름이 조금 달라도(공백·별칭) 찾아준다 — 못 찾으면 조용히 무시하지 않고 알린다. */
function matchDimension(name, available) {
  const hit = available.find((d) => norm(d) === norm(name))
  if (hit) return hit
  for (const alias of DIMENSION_ALIASES[name] || []) {
    const byAlias = available.find((d) => norm(d) === norm(alias))
    if (byAlias) return byAlias
  }
  return null
}

/**
 * @returns {{ok: true, groupBy: string[], dropped: string[]}|{ok: false, error: string}}
 */
export function resolveRegroup(widget, { drop_dimensions: drop, keep_dimensions: keep } = {}) {
  if (!widget) return { ok: false, error: '그 위젯을 찾지 못했습니다.' }
  const dims = currentDimensions(widget)
  if (!dims.length) return { ok: false, error: `"${widget.title}"은 묶을 수 있는 차원 컬럼이 없습니다.` }

  const wantDrop = (drop || []).filter((d) => typeof d === 'string' && d.trim())
  const wantKeep = (keep || []).filter((d) => typeof d === 'string' && d.trim())
  if (!wantDrop.length && !wantKeep.length) {
    return { ok: false, error: '무엇을 빼거나 남길지 알려주세요.' }
  }

  const resolve = (names) => {
    const found = []
    const missing = []
    for (const n of names) {
      const hit = matchDimension(n, dims)
      if (hit) found.push(hit)
      else missing.push(n)
    }
    return { found, missing }
  }

  let groupBy
  let dropped
  if (wantDrop.length) {
    const { found, missing } = resolve(wantDrop)
    if (missing.length) {
      return { ok: false, error: `이 표에 없는 컬럼입니다: ${missing.join(', ')} (현재 단위: ${dims.join(' > ')})` }
    }
    groupBy = dims.filter((d) => !found.includes(d))
    dropped = found
  } else {
    const { found, missing } = resolve(wantKeep)
    if (missing.length) {
      return { ok: false, error: `이 표에 없는 컬럼입니다: ${missing.join(', ')} (현재 단위: ${dims.join(' > ')})` }
    }
    groupBy = dims.filter((d) => found.includes(d))
    dropped = dims.filter((d) => !found.includes(d))
  }

  if (!groupBy.length) {
    return { ok: false, error: '차원을 모두 빼면 표가 성립하지 않습니다 — 최소 하나는 남겨야 합니다.' }
  }
  if (!dropped.length) {
    return { ok: false, error: '이미 그 단위로 보고 있습니다 — 바뀔 것이 없습니다.' }
  }
  return { ok: true, groupBy, dropped }
}
