// Tool schema for the "pick a SemanticQueryIR" LLM step — same style as
// server/rag-poc/ragTools.js buildStructureTool(): enum-constrained fields
// only, so the LLM can never invent a metric/dimension id that doesn't
// exist in the registry (app/semantic/validator.js still re-checks this
// server-side — the enum is a UX/accuracy aid, not the safety boundary).
import { loadRegistry } from './app/semantic/registry.js'

function isAtomicallyCompilable(m) {
  if (!m) return false
  // controlled_analysis: true는 compileSingleMetricQuery로는 못 만들지만(2단계 집계 등)
  // agenticBiPipeline.js에 전용 컴파일러가 등록되어 있는 metric — not_directly_compilable이어도 후보에 남긴다.
  if (m.controlled_analysis) return true
  return !m.not_directly_compilable && m.status !== 'unresolved' && m.expression !== 'unresolved' && m.metric_filter !== 'unresolved'
}

// 컴파일 가능한 metric만 후보로 노출한다 — not_directly_compilable/unresolved는
// LLM이 골라도 어차피 컴파일 단계에서 거부되므로 애초에 고를 수 없게 막는다.
// ratio/conversion/progress_metric은 자기 자신의 base_table/expression이 없지만(분자·분모를
// 별도 metric으로 명시하는 설계 원칙 — agentic_bi_design 최종 보고서 4절), 분자·분모가 각각
// 원자적으로 컴파일 가능하면 agenticBiPipeline.js가 둘을 따로 실행해 나눗셈으로 조합하므로
// 후보에 포함한다("Text2SQL + 가공" 원칙).
export function listCompilableMetrics() {
  const registry = loadRegistry()
  return [...registry.metrics.values()].filter((m) => {
    if (['ratio_metric', 'conversion_metric', 'progress_metric'].includes(m.metric_type)) {
      return isAtomicallyCompilable(registry.metrics.get(m.numerator_metric)) && isAtomicallyCompilable(registry.metrics.get(m.denominator_metric))
    }
    return isAtomicallyCompilable(m)
  })
}

export function renderMetricCatalogForPrompt() {
  const metrics = listCompilableMetrics()
  return metrics.map((m) => `- ${m.id}: ${m.name_ko}${m.description ? ` — ${m.description}` : ''}`).join('\n')
}

export function renderDimensionCatalogForPrompt() {
  const registry = loadRegistry()
  return [...registry.dimensions.values()].map((d) => {
    const knownValues = Array.isArray(d.known_values) ? ` — 실제 DB 값: [${d.known_values.join(', ')}] (이 표기 그대로 써야 함, 한글로 번역/의역 금지)` : ''
    return `- ${d.id}: ${d.label_ko}${knownValues}`
  }).join('\n')
}

export function buildAgenticBiTool(dashboardState) {
  const metricIds = listCompilableMetrics().map((m) => m.id)
  const registry = loadRegistry()
  const dimensionIds = [...registry.dimensions.keys()]
  const widgetIds = (dashboardState?.widgets || []).map((w) => w.id)

  return [
    {
      type: 'function',
      function: {
        name: 'pick_semantic_query',
        description: '사용자 질문을 등록된 Metric/Dimension/Filter/기간으로 변환합니다. 목록에 없는 값은 절대 지어내지 마세요.',
        parameters: {
          type: 'object',
          properties: {
            answerable: {
              type: 'boolean',
              description:
                '이 질문이 아래 Metric 목록만으로 답변 가능한지. 불가능하면 false + reason + clarification_options을 채우세요.\n'
                + 'false로 답하기 전에 [인증 리포트 목록]의 "지표 컬럼"에 그 값이 있는지 보세요. '
                + '있으면 **이 툴을 부르지 말고 run_certified_report를 부르세요.** '
                + '리포트 id를 metric_ids에 넣으면 안 됩니다 — metric_ids는 Metric 목록의 id만 받습니다. '
                + '리포트가 여러 컬럼을 함께 낸다거나 월 단위 집계라는 이유로 "조회할 수 없다"고 하지 마세요 — '
                + '사실이 아니고, 사용자는 BI 화면에 보이는 값을 못 받게 됩니다.\n'
                + '반대로, Metric 목록으로 답할 수 있는 질문을 리포트로 넘기지도 마세요. '
                + '이 툴이 값 하나를 묻는 질문의 기본 경로입니다.',
            },
            reason_if_unanswerable: { type: 'string', description: 'answerable=false일 때만: 왜 답할 수 없는지(예: 해당 지표 없음, 질문이 모호함) — 사용자에게 그대로 보여줄 안내 문구' },
            clarification_options: {
              type: 'array',
              items: { type: 'string' },
              minItems: 2,
              maxItems: 2,
              description: 'answerable=false일 때만 필수: 사용자가 버튼 클릭 한 번으로 그대로 다시 보낼 수 있는, 완결된 문장 형태의 대안 질문 2개. 질문이 모호해서 여러 해석이 가능하면 그 각각을 구체화한 질문으로 만들고, 지원하지 않는 지표라 답할 수 없는 질문이면 실제로 답할 수 있는 가장 가까운 대안 질문 2개로 만드세요.',
            },
            action: {
              type: 'string',
              enum: ['add', 'modify'],
              description: '기본은 "add"(새 위젯 추가). 사용자가 "이거", "방금 그 그래프/카드", "그 위젯"처럼 [현재 대시보드 상태]에 이미 있는 특정 위젯 하나를 명시적으로 가리키며 다른 지표/기간/필터로 바꿔달라고 요청했을 때만 "modify". metric_ids가 2개 이상이면서 dimension_id가 "none"이면(차원 없는 N개 지표 비교) modify를 쓸 수 없습니다 — 이 경우 "add"만 허용됩니다.',
            },
            widget_id: {
              type: 'string',
              enum: widgetIds.length ? widgetIds : ['none'],
              description: 'action="modify"일 때만: 수정할 기존 위젯의 id ([현재 대시보드 상태] 목록에서 그대로 가져올 것). action="add"면 생략하거나 "none".',
            },
            metric_ids: {
              type: 'array',
              items: { type: 'string', enum: metricIds },
              minItems: 1,
              maxItems: 6,
              description: '질문에 맞는 metric 1개 이상(최대 4개). 단일 지표 질문이면 1개만. "A랑 B 비교해줘", "실적이랑 타겟 같이 보여줘"처럼 여러 지표를 나란히/겹쳐서 보고 싶은 질문이면 그만큼 채우세요. 같은 metric을 중복해서 넣지 마세요.',
            },
            dimension_id: { type: 'string', enum: [...dimensionIds, 'none'], description: '하위 호환용 단일 breakdown 차원입니다. dimension_ids를 함께 고른 경우에는 첫 번째 차원을 사용하므로, 새 요청에서는 dimension_ids를 우선 사용하세요.' },
            dimension_ids: {
              type: 'array',
              items: { type: 'string', enum: dimensionIds },
              maxItems: 4,
              description: 'SQL 결과에 함께 투영할 차원 ID 목록입니다. 복수 차원을 요청하면 모두 넣으세요. 첫 항목은 기본 정렬/차트 축 차원이고, 나머지도 결과 컬럼으로 함께 반환됩니다. 특정 값으로 결과를 제한하는 조건은 filters에만 넣습니다.',
            },
            object_filter_dimension_ids: {
              type: 'array',
              items: { type: 'string', enum: dimensionIds },
              maxItems: 4,
              description: '일반 시맨틱 SQL 위젯에서 사용자가 직접 고를 수 있는 드롭다운 필터 차원 ID 목록입니다. 값이 있는 SQL 조건(filters)과 다릅니다. 선택한 차원은 dimension_ids에도 포함해야 하며, 이 경로는 최대 4개 차원까지만 안전합니다. 5개 이상 필터(특히 조직·차량 차원과 목표를 함께 보는 표)는 run_certified_report의 object_filter_dimension_ids를 사용하세요.',
            },
            time_range_type: {
              type: 'string',
              enum: ['mtd', 'ytd', 'relative', 'absolute', 'week_of_month'],
              description: `mtd="이번 달"(오늘이 속한 달, 월초~오늘) / ytd="올해"(오늘이 속한 연도, 연초~오늘) — 둘 다 항상 오늘 날짜 기준이며 과거 연도에는 쓸 수 없다. 사용자가 특정 연도·월을 명시하면(예: "2025년", "2025년 12월", 올해가 아닌 연도) 반드시 absolute를 쓰고 absolute_start_date/absolute_end_date를 채울 것 — "N년 M월 연누적"은 그 해 1월 1일부터 그 달 말일까지. 사용자가 "N주차"(예: "2026년 4월 2주차")처럼 특정 월의 특정 주차를 물으면 week_of_month를 쓰고 week_year/week_month/week_label을 채울 것 — 이때 실제 조회 구간은 그 달 1일부터 해당 주차 마지막 날짜까지의 MTD 누적이다(주차 하루~하루가 아님).`,
            },
            relative_value: { type: 'integer', description: 'time_range_type=relative일 때만: 숫자(예: 최근 6개월 -> 6)' },
            relative_unit: { type: 'string', enum: ['day', 'week', 'month', 'year'], description: 'time_range_type=relative일 때만' },
            absolute_start_date: { type: 'string', description: 'time_range_type=absolute일 때만, YYYY-MM-DD' },
            absolute_end_date: { type: 'string', description: 'time_range_type=absolute일 때만, YYYY-MM-DD' },
            week_year: { type: 'integer', description: 'time_range_type=week_of_month일 때만: 연도(예: 2026)' },
            week_month: { type: 'integer', description: 'time_range_type=week_of_month일 때만: 월(1~12)' },
            week_label: { type: 'string', description: 'time_range_type=week_of_month일 때만: 사용자가 말한 주차 표기를 그대로("2주차", "1주차" 등) — 번역/가공하지 말 것.' },
            time_series_transform: {
              type: 'string',
              enum: ['none', 'mom_change_pct', 'cumulative'],
              description: `기본 "none". dimension_id가 time_month 또는 time_day이고, 사용자가 "전월 대비 증감률"/"전일 대비"/"MoM"처럼 직전 구간 대비 변화율을 물으면 "mom_change_pct"(각 구간 값을 실적이 아니라 직전 구간 대비 증감률로 치환 — 첫 구간은 비교 대상이 없어 null). "누적"/"누적 합계"/"러닝토탈"처럼 시간이 지날수록 쌓인 합계를 물으면 "cumulative". 이 두 경우가 아니면 "none"이며 dimension_id가 시간 차원이 아니면 이 필드는 무시된다.`,
            },
            time_grain: {
              type: 'string',
              enum: ['none', 'day', 'month'],
              description: 'Time trend requests only: day for daily, month for monthly. The server verifies this against the request text.',
            },
            accumulation: {
              type: 'string',
              enum: ['none', 'running_total'],
              description: 'Use running_total only when the user explicitly asks for cumulative values.',
            },
            chart_type: {
              type: 'string',
              enum: ['auto', 'bar', 'line', 'combo', 'table', 'donut'],
              description: 'Requested output shape. combo means quantity bars plus a rate line on the secondary axis. donut is for one additive metric broken down by categories; never use it for a rate metric itself.',
            },
            filters: {
              type: 'array',
              description: '질문에 실제로 언급된 필터만. 언급 안 됐으면 빈 배열.',
              items: {
                type: 'object',
                properties: {
                  dimension: { type: 'string', enum: dimensionIds },
                  values: { type: 'array', items: { type: 'string' } },
                },
                required: ['dimension', 'values'],
              },
            },
            sort_desc: { type: 'boolean', description: 'dimension_id가 있고 사용자가 랭킹/정렬을 원하면 true' },
          },
          required: ['answerable'],
        },
      },
    },
  ]
}

// 2단계(chart-spec) 툴 — metric_ids가 2개 이상이고 dimension_id가 있을 때만 호출된다.
// 이미 각 metric별로 실행까지 끝난 뒤라(agenticBiPipeline.js의 resolveMultipleMetrics),
// 여기서는 "SQL을 어떻게 쓸지"가 아니라 "이미 계산된 숫자들을 막대/선/누적 중 어떤 형태로
// 겹쳐 보여줄지"만 고른다 — dashboardPipeline.js의 RAG 경로(set_chart_spec, dashboardTools.js)와
// 같은 패턴: 컬럼명(metricIds)이 이미 실제로 존재하는 값이라 LLM이 지어낼 수 없다.
export function buildMultiMetricChartSpecTool(metricIds) {
  return [
    {
      type: 'function',
      function: {
        name: 'set_multi_metric_chart_spec',
        description: '이미 계산된 여러 지표를 하나의 차원(카테고리) 축 위에 어떤 형태로 함께 그릴지 정합니다.',
        parameters: {
          type: 'object',
          properties: {
            chart_type: {
              type: 'string',
              enum: ['bar', 'line', 'area', 'combo', 'donut', 'scatter', 'radar', 'table'],
              description: 'bar=막대(그룹 또는 누적), line=꺾은선(추이 비교에 적합), area=누적 면적, combo=일부는 막대·일부는 선(예: 실적은 막대, 목표선은 line)으로 겹쳐 그림, table=표. '
                + 'donut=도넛/파이 — 사용자가 "도넛"/"파이"로 명시했고 지표들이 서로 겹치지 않는 하위 항목일 때만(예: PMA IN/OUT/ETC처럼 원래 하나의 값을 갈래로 쪼갠 것). "실적 vs 목표"처럼 합쳐도 전체가 안 되는 조합엔 쓰지 마세요. '
                + 'scatter=산점도 — 지표가 정확히 2개이고 그 둘의 상관관계를 볼 때만(X축·Y축에 하나씩, 점 하나가 차원 값 하나). '
                + 'radar=레이더/5각형 — 항목이 3~8개이고 여러 지표의 균형을 한눈에 비교할 때. '
                + '사용자가 "표로/테이블로/리스트로 보여줘"처럼 명시적으로 표를 요청했으면 항상 table을 고르세요 — 차트 형태는 그런 요청이 없을 때만 자유롭게 판단하세요.',
            },
            stacked: { type: 'boolean', description: 'chart_type=bar/area일 때: 막대를 나란히(그룹)가 아니라 쌓아서(누적) 그릴지. "실적 대비 잔여"처럼 두 값의 합이 의미가 있으면 true, 단순 비교면 false.' },
            bar_keys: { type: 'array', items: { type: 'string', enum: metricIds }, description: 'chart_type=combo일 때만: 막대로 그릴 metric id들.' },
            line_keys: { type: 'array', items: { type: 'string', enum: metricIds }, description: 'chart_type=combo일 때만: 선으로 그릴 metric id들. bar_keys/line_keys 합쳐서 metric_ids 전부를 빠짐없이 배정하세요.' },
            title: { type: 'string', description: '위젯 제목 (한국어)' },
          },
          required: ['chart_type'],
        },
      },
    },
  ]
}

// 이미 대시보드에 있는 위젯의 "겉모습만" 바꾸는 툴 — 데이터·지표·기간은 건드리지 않고
// DB도 다시 조회하지 않는다. pick_semantic_query의 action='modify'와 구분되는 지점이 이거다:
// 그쪽은 지표/기간/필터를 바꿔 다시 조회하는 용도라 겉모습만 바꾸려고 쓰면 느리고 원래
// 위젯과 다른 결과가 나올 수 있다.
//
// chart_type enum은 전체 목록이지만 위젯마다 실제 가능한 범위가 다르다 — 그 범위는
// 시스템 프롬프트에 위젯별로 렌더링해 알려주고(renderRestyleCatalogForPrompt), 최종 판정은
// 서버(restyleWidget.js의 applyRestyle)가 한다. LLM이 범위 밖을 골라도 조용히 다른 걸
// 하지 않고 "이 위젯은 A/B로만 가능합니다"라고 되돌려준다.
export function buildRestyleWidgetTool(dashboardState) {
  const widgetIds = (dashboardState?.widgets || []).map((w) => w.id)
  return {
    type: 'function',
    function: {
      name: 'restyle_widget',
      description: '대시보드에 이미 있는 위젯의 차트 종류나 계열 색만 바꿉니다. '
        + '데이터·지표·기간·필터는 그대로 두고 다시 조회하지 않습니다. '
        + '"이거 꺾은선으로 바꿔줘", "막대 색 빨간색으로", "이 그래프 도넛으로" 같은 요청에 쓰세요. '
        + '지표·기간·필터를 바꾸거나 새 데이터를 조회해야 하는 요청에는 절대 쓰지 마세요(그건 pick_semantic_query).',
      parameters: {
        type: 'object',
        properties: {
          widget_id: {
            type: 'string',
            enum: widgetIds.length ? widgetIds : ['none'],
            description: '바꿀 위젯의 id. [위젯 겉모습 변경 가능 범위] 목록에서 그대로 가져오세요.',
          },
          chart_type: {
            type: 'string',
            enum: ['bar', 'line', 'area', 'pie', 'combo', 'radar', 'scatter', 'funnel', 'table'],
            description: '바꿀 차트 종류. pie=도넛, combo=막대+선, radar=레이더(다각형), funnel=퍼널. '
              + '반드시 그 위젯의 "바꿀 수 있는 종류" 목록에 있는 것만 고르세요 — 목록에 없으면 적용되지 않습니다. '
              + '색만 바꾸는 요청이면 생략하세요.',
          },
          colors: {
            type: 'array',
            description: '계열별 색 지정. 종류만 바꾸는 요청이면 생략하세요.',
            items: {
              type: 'object',
              properties: {
                series: { type: 'string', description: '계열 이름 — 그 위젯의 "계열" 목록에 있는 값 그대로.' },
                color: { type: 'string', description: '#RRGGBB 형식의 색(예: 빨강 #e34948, 파랑 #2a78d6, 초록 #1baf7a, 주황 #eb6834).' },
              },
              required: ['series', 'color'],
            },
          },
        },
        required: ['widget_id'],
      },
    },
  }
}

// 결과 0건일 때 되묻는(reask) 툴 — 사용자 원 질문 + 실제로 적용된 지표/필터/기간을 이미
// 알고 있는 상태에서, 그 조건 중 무엇이 0건의 원인일 가능성이 높은지 짚어 클릭 한 번으로
// 재전송 가능한 대안 질문 2개를 만든다. 결과 자체는 이미 실행이 끝난 뒤라(0행) 여기서
// 값을 지어낼 위험은 없다 — 순수하게 "다음에 뭘 물어볼지" 문구만 생성.
export function buildZeroRowsReaskTool() {
  return [
    {
      type: 'function',
      function: {
        name: 'suggest_reask_options',
        description: '조회 결과가 0건일 때, 사용자에게 보여줄 안내 문구와 클릭 한 번으로 다시 보낼 수 있는 대안 질문 2개를 만듭니다.',
        parameters: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              description: '사용자에게 보여줄 안내 문구(한국어, 1문장) — 적용된 필터/기간 중 무엇 때문에 0건일 가능성이 높은지 짚어줄 것(예: 지정한 딜러명 철자, 그 달에 실제 데이터가 없을 가능성 등).',
            },
            options: {
              type: 'array',
              items: { type: 'string' },
              minItems: 2,
              maxItems: 2,
              description: '사용자가 그대로 클릭해 보낼 수 있는 완결된 문장 형태의 대안 질문 2개(예: "지난달로 다시 조회해줘", "딜러 필터 없이 전체로 보여줘"). 실제로 적용됐던 필터/기간을 바꾸는 구체적인 제안이어야 하며, 원 질문과 무관한 엉뚱한 제안은 안 됨.',
            },
          },
          required: ['message', 'options'],
        },
      },
    },
  ]
}
