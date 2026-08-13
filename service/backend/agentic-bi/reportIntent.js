// Certified Report 요청 해석 — LLM이 낸 툴 인자를 Report 파라미터로 옮긴다.
//
// LLM의 역할은 여기까지다: 어떤 리포트인지 고르고, 질문에서 파라미터를 뽑고,
// 모르면 되묻는 것. SQL은 쓰지도 고치지도 못한다(툴 스키마에 SQL 필드가 없다).
import { getReport, listReports, renderReportCatalogForPrompt, reportExtraParameters } from '../reports/registry.js'
import { SC_ALL } from '../reports/parameterValidator.js'
import { loadRegistry } from './app/semantic/registry.js'
import { REPORT_VIEW_PRESETS } from '../reports/projection.js'

export { renderReportCatalogForPrompt }

// SC 표시 방식 3분기. 이건 필터가 아니라 출력 스키마를 바꾸는 선택이라
// 임의로 기본값을 고르면 사용자가 요청한 것과 다른 표가 나온다.
// 롤업으로 남길 수 있는 차원. SC는 sc_display로 따로 정해지므로 여기 없다
// (SC 열을 보고 싶으면 sc_display=all_sc/specific을 쓴다).
// 브랜드·모델·차종이 빠져 있으면 "모델별 출고"를 요청해도 롤업이 모델을 접어버려
// 사용자가 요청한 축 자체가 사라진다.
export const GROUPABLE_DIMENSIONS = [
  '연도', '월', '브랜드', '딜러', '전시장', '팀', '재직여부', 'SC', '활동유형', '모델', '차종', '연식', 'SFX',
]

// 행이 많을 때 "어느 단위로 묶을까요"에 제안할 순서. 연도·월은 마지막이다 —
// 행은 확실히 줄지만 사용자가 물어본 축(모델·딜러 등)을 통째로 접어버린다.
export const ROLLUP_SUGGESTION_ORDER = [
  '모델', '차종', '딜러', '전시장', '팀', '활동유형', '브랜드', '월', '연도',
]

// 서버 내부의 실행 상태다. LLM 툴 스키마에는 노출하지 않는다 — 예전에는 이 enum을
// 필수 인자로 두어 LLM이 골랐고, 'unspecified'가 선택지에 있는 한 모델은 확신이 조금만
// 부족해도 그것을 골라 불필요한 재질문을 만들었다. 그래서 unspecified 자체를 없앴다.
export const SC_DISPLAY = {
  TEAM_LEVEL: 'team_level',
  ALL_SC: 'all_sc',
  SPECIFIC: 'specific',
}

/**
 * SC 실행 옵션을 코드로 정한다. LLM은 근거만 주고 모드는 고르지 않는다.
 *
 * 우선순위가 곧 정책이다:
 *   1. 이름이 있으면 그 사람만                    → specific
 *   2. 특정 한 사람이 필요한데 이름이 없으면      → 되묻는다 (유일하게 허용되는 SC 재질문)
 *   3. "SC별로" 라고 명시했으면                   → all_sc
 *   4. 그 외 전부                                 → team_level (제품 기본 출력 정책)
 *
 * 4번이 임시 예외처리가 아니라 명시적 기본값이다. SC를 말하지 않았다는 것은
 * "정보가 부족하다"가 아니라 "SC 단위를 원하지 않는다"는 뜻이다. BI 화면의 기본도
 * 팀 단위이고, 답변 요약에 "팀 단위"라고 드러나므로 조용한 선택도 아니다.
 *
 * @returns {{scDisplay, scNames, scNameParameter, needsClarification, clarificationTarget}}
 */
export function resolveScOptions({
  scNames, explicitScBreakdown, requiresSpecificSc, internalScDisplay = null,
} = {}) {
  const names = (scNames || []).filter((s) => typeof s === 'string' && s.trim()).map((s) => s.trim())
  const done = (scDisplay, scNameParameter) => ({
    scDisplay, scNames: names, scNameParameter, needsClarification: false,
  })

  if (names.length > 0) return done(SC_DISPLAY.SPECIFIC, names.join(','))

  // 내부 호출부(저장된 위젯 재실행·테스트)가 실행 상태를 직접 넘긴 경우.
  if (internalScDisplay === SC_DISPLAY.ALL_SC) return done(SC_DISPLAY.ALL_SC, SC_ALL)
  if (internalScDisplay === SC_DISPLAY.TEAM_LEVEL) return done(SC_DISPLAY.TEAM_LEVEL, null)

  if (requiresSpecificSc || internalScDisplay === SC_DISPLAY.SPECIFIC) {
    return {
      scDisplay: null,
      scNames: [],
      scNameParameter: null,
      needsClarification: true,
      clarificationTarget: 'specific_sc_names',
    }
  }
  if (explicitScBreakdown) return done(SC_DISPLAY.ALL_SC, SC_ALL)
  return done(SC_DISPLAY.TEAM_LEVEL, null)
}

function inferredTemporalGroupBy(question) {
  const text = String(question || '').replaceAll(/\s+/g, ' ').trim()
  if (!text) return []
  // 2026-08-04 leo: 인증 리포트 툴이 월별 차트 요청에서도 group_by를 비워 가장
  // 상세한 조직·차량 행을 그대로 반환했다. 시간 표현만 읽어 LLM이 누락해도
  // 선언된 시간 단위로 안전하게 롤업한다.
  if (/(월\s*별|월\s*단위|매월)/.test(text)) return ['월']
  if (/(연도\s*별|년\s*별|연\s*단위|년\s*단위|매년)/.test(text)) return ['연도']
  return []
}

export function buildRunCertifiedReportTool() {
  const reportIds = listReports().map((r) => r.report_id)
  const filterDimensionIds = [...loadRegistry().dimensions.keys()]
  const reportViews = Object.keys(REPORT_VIEW_PRESETS)
  return {
    type: 'function',
    function: {
      name: 'run_certified_report',
      description:
        '차트, 그래프, 막대, 꺾은선, 라인, 추이처럼 시각화를 요청하면 지표가 여러 개여도 이 도구가 아니라 pick_semantic_query를 사용하세요.\n'
        +
        '등록된 인증 리포트(최종 확정 SQL)를 그대로 실행합니다. 다음 질문에 쓰세요:\n'
        + '- 여러 지표를 한 화면에 모은 완성된 표, 합계 행이나 딜러·전시장·팀 전체 계층이 필요한 질문\n'
        + '- 객체 필터를 5개 이상 요청하거나 조직·차량 필터와 목표/달성률을 함께 보는 표. 이때 object_filter_dimension_ids에 사용자가 말한 필터를 모두 넣으세요.\n'
        + '- 건별 명세·목록을 원하는 질문("목록", "명세", "리스트", "내역", "건별로", "뽑아줘"). '
        + '리드·계약·출고·회의 목록 리포트가 등록돼 있습니다 — 목록을 요구하는데 숫자 하나를 돌려주면 안 됩니다.\n'
        + '개별 지표 하나의 값·추이·자유로운 차트를 묻는 질문에만 pick_semantic_query를 쓰세요.\n'
        + '**단, 값 하나를 묻는 질문이라도 그 지표가 Metric 목록에 없고 아래 리포트의 컬럼에는 있으면 '
        + '이 툴을 쓰세요.** 리포트가 여러 컬럼을 함께 낸다는 이유로 되묻지 마세요 — 필요한 컬럼만 '
        + 'selected_columns로 고르면 됩니다. "그 지표는 없습니다"라고 답하기 전에 아래 목록의 '
        + '"지표 컬럼"을 반드시 확인하세요.',
      parameters: {
        type: 'object',
        properties: {
          report_id: {
            type: 'string',
            enum: reportIds.length ? reportIds : ['none'],
            description: '실행할 리포트 id. [인증 리포트 목록]에서 고르세요.',
          },
          year: { type: 'integer', description: '연도(예: 2026). 질문에 없으면 생략 — 전체 연도가 월별로 나옵니다.' },
          month: { type: 'integer', description: '월 1~12. 질문에 없으면 생략 — 전체 월이 나옵니다.' },
          // 일 단위를 받는 리포트가 있는데(daily_activity_progress) 툴에 자리가 없어
          // "4월 3일"이 그 달 전체로 나갔다(2026-08-05 실측: 03일 196건 → 4월 전체 1,686건).
          day: { type: 'integer', description: '일 1~31. 일 단위로 보는 리포트에서만 씁니다. 질문에 날짜가 있으면 채우세요.' },
          brand: { type: 'array', items: { type: 'string' }, description: '브랜드. 질문에 없으면 생략.' },
          dealer: { type: 'array', items: { type: 'string' }, description: '딜러명(예: "렉서스 강남"). 질문에 없으면 생략.' },
          group_name: { type: 'array', items: { type: 'string' }, description: '전시장. 질문에 없으면 생략.' },
          dept_nm: { type: 'array', items: { type: 'string' }, description: '팀. 질문에 없으면 생략.' },
          act_yn: { type: 'array', items: { type: 'string', enum: ['재직', '퇴직'] }, description: '재직 여부. 질문에 없으면 생략.' },
          activity_type: { type: 'array', items: { type: 'string' }, description: '활동유형. 질문에 없으면 생략.' },
          model: { type: 'array', items: { type: 'string' }, description: '차량 모델. 질문에 없으면 생략.' },
          vehicle_variant: { type: 'array', items: { type: 'string' }, description: '차종 또는 VARIANT. 질문에 없으면 생략.' },
          vehicle_year: { type: 'array', items: { type: 'string' }, description: '연식(MY). 질문에 없으면 생략.' },
          grade_sfx: { type: 'array', items: { type: 'string' }, description: 'SFX 또는 GRADE(SFX). 질문에 없으면 생략.' },
          object_filter_dimension_ids: {
            type: 'array',
            items: { type: 'string', enum: filterDimensionIds },
            maxItems: 12,
            description: '저장될 대시보드 객체에서 사용자가 직접 고를 필터 차원 ID입니다. 질문에 "필터를 만들어줘"가 있으면 해당 차원을 모두 넣으세요. 이 값은 현재 SQL 조건과 다르며, 인증 리포트가 결과에 가진 차원만 허용됩니다.',
          },

          // 일반 인자로는 닿을 수 없는 리포트 고유 필터. 20개 리포트에 70개가 있는데
          // 툴에 자리가 없어 "A 그룹만", "3회차 미팅", "HOT만" 같은 조건이 조용히
          // 무시되고 전체 결과가 나갔다(2026-08-04 평가표 No.47·52).
          report_filters: {
            type: 'array',
            description:
              '그 리포트만의 필터. [인증 리포트 목록]에서 고른 리포트의 '
              + '"이 리포트만의 필터"에 적힌 이름만 쓰세요. 거기 없는 이름을 넣으면 조회가 거절됩니다. '
              + '질문에 그런 조건이 있으면 반드시 채우세요 — 빠뜨리면 조건이 없는 전체 결과가 나가고 '
              + '사용자는 그것이 걸러진 결과라고 믿게 됩니다.',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string', description: '파라미터 이름(목록에 적힌 그대로).' },
                values: {
                  type: 'array',
                  items: { type: 'string' },
                  description: '값 목록. 괄호로 허용값이 적혀 있으면 그중에서만 고르세요.',
                },
              },
              required: ['name', 'values'],
            },
          },

          // 파라미터가 없는 축을 거를 때. GOLD가 월별주차를 파라미터로 받지 않아
          // "4월 2주차"가 4월 전체로 나갔다(2026-08-04 평가표 No.15).
          dimension_filters: {
            type: 'array',
            description:
              '리포트가 파라미터로는 받지 않지만 "차원 컬럼"에는 있는 축으로 행을 거를 때 쓰세요. '
              + '예) weekly_activity_progress에서 "2주차만" → [{"column":"월별주차","values":["2주차"]}]. '
              + '파라미터로 받을 수 있는 조건(딜러·전시장·팀 등)은 여기 넣지 말고 해당 인자를 쓰세요.',
            items: {
              type: 'object',
              properties: {
                column: { type: 'string', description: '그 리포트의 "차원 컬럼"에 적힌 이름 그대로.' },
                values: { type: 'array', items: { type: 'string' }, description: '남길 값들.' },
              },
              required: ['column', 'values'],
            },
          },

          // "활동배수가 5 이상인 SC"처럼 지표 값으로 거르는 조건. GOLD에 이런 파라미터가
          // 없어 조건이 통째로 무시되고 전체 목록이 나갔다(2026-08-04 평가표 No.43).
          measure_filters: {
            type: 'array',
            description:
              '지표 값으로 행을 거를 때 쓰세요. 예) "활동배수가 5 이상인 SC" → '
              + '[{"column":"활동배수","op":"gte","value":5}]. '
              + 'column은 그 리포트의 "지표 컬럼" 이름 그대로. '
              + '질문에 "~이상", "~미만", "~보다 큰" 같은 조건이 있으면 반드시 채우세요. '
              + '참고: 이 조건을 쓰면 합계 행은 빠집니다(부분집합에 전체 합계를 붙이면 표가 어긋납니다).',
            items: {
              type: 'object',
              properties: {
                column: { type: 'string' },
                op: { type: 'string', enum: ['gte', 'gt', 'lte', 'lt', 'eq'] },
                value: { type: 'number' },
              },
              required: ['column', 'op', 'value'],
            },
          },

          // SC 실행 모드는 LLM이 고르지 않는다. 사용자가 말한 근거만 뽑고,
          // @ScName을 무엇으로 바인딩할지는 서버가 resolveScOptions()로 정한다.
          //
          // 왜 바꿨나: 예전에는 sc_display(team_level|all_sc|specific|unspecified)를
          // 필수 enum으로 뒀다. 설명에 "모델별 → team_level" 예시까지 적었는데도 모델은
          // 확신이 조금만 부족하면 unspecified를 골랐고, 그때마다 "SC별로 볼까요,
          // 팀 단위로 볼까요?"를 되물었다. 2026-08-05 전수 실행에서 남은 실패 4건이
          // 전부 이것이었고, 넷 다 SC를 한 번도 언급하지 않은 질문이었다(21·23·25·44).
          // enum에 있는 값은 결국 쓰이므로, 선택지를 없애는 것이 근본 해결이다.
          sc_names: {
            type: 'array',
            items: { type: 'string' },
            description:
              '질문에 나온 SC(영업사원) 사람 이름. 예) "강민성 SC의 퍼널 현황" → ["강민성"]. '
              + '이름이 없으면 빈 배열로 두세요. 추측해서 채우지 마세요.',
          },
          explicit_sc_breakdown: {
            type: 'boolean',
            description:
              'SC 단위로 나눠 보자고 **명시**했으면 true. 예) "SC별", "영업사원별", "사원별로 나눠서". '
              + '"모델별", "등급별", "딜러별"처럼 다른 축으로 나누는 요청은 false입니다 — '
              + 'SC 얘기가 아닙니다. 언급이 없으면 false로 두세요.',
          },
          requires_specific_sc: {
            type: 'boolean',
            description:
              '특정 한 사람을 봐야 한다는 표현은 있는데 그 이름이 질문에 없으면 true. '
              + '예) "이 SC의 현황을 보여줘", "특정 SC만 비교해줘" → true (이름을 되물어야 함). '
              + '"SC별로 보여줘"는 전체 SC가 대상이라 false입니다.',
          },

          selected_columns: {
            type: 'array',
            items: { type: 'string' },
            description:
              '표에 낼 지표 컬럼만 고를 때 사용(예: ["기회실적","기회진척률"]). '
              + '질문이 특정 지표만 원할 때만 채우고, 전체 표를 원하면 생략하세요. '
              + '이건 SQL을 바꾸지 않고 표시할 컬럼만 고르는 것입니다.\n'
              + '중요: [인증 리포트 목록]에 적힌 그 리포트의 "지표 컬럼" 이름을 '
              + '**글자 그대로** 쓰세요. 사용자가 쓴 말이나 다른 리포트의 이름을 쓰지 마세요. '
              + '없는 이름을 만들어 붙이면 조회가 거절됩니다. '
              + '예) weekly_activity_progress의 컬럼은 "목표","활동","달성률"입니다 — '
              + '사용자가 "활동 목표"라고 해도 "활동목표"가 아니라 "목표"를 넣으세요. '
              + '예) sales_achievement_contract의 목표 컬럼 이름은 "타겟"입니다("계약목표"가 아닙니다). '
              + '차원 컬럼(딜러·SC·고객명 등)은 항상 표시되므로 여기 넣을 필요가 없습니다.',
          },
          report_view: {
            type: 'string',
            enum: reportViews.length ? reportViews : ['none'],
            description:
              '인증 리포트 결과를 목적에 맞는 객체 형태로 바꾸는 표시 프리셋입니다. '
              + 'funnel_full_structure에서 활동/영업기회/시승/계약의 실적·목표·진행률 표를 만들려면 funnel_core_wide, '
              + '단계별 행 표는 funnel_stage_rows, 단순 단계 퍼널 차트는 funnel_stage_chart를 고르세요. '
              + '"퍼널 구조" 또는 역삼각형 퍼널 객체처럼 관계형성활동/SC활동/내방/온라인유입 채널이 단계별로 보이는 차트는 funnel_pyramid_chart를 고르세요. '
              + '"표로 보기"처럼 관계형성활동/SC활동/내방/온라인유입 채널별 숫자와 전환율을 펼친 표는 funnel_pyramid_table을 고르세요. '
              + '프리셋은 SQL을 새로 쓰지 않고 등록 리포트 결과를 안전하게 투영합니다.',
          },

          group_by: {
            type: 'array',
            items: { type: 'string', enum: GROUPABLE_DIMENSIONS },
            description:
              '표를 어느 단위로 볼지. 여기 적은 컬럼만 남기고 나머지는 합쳐집니다. '
              + '예) "딜러별로" → ["딜러"], "전시장별로" → ["딜러","전시장"], '
              + '"활동유형은 합쳐서 팀별로" → ["딜러","전시장","팀"]. '
              + '생략하면 가장 상세한 단위(활동유형까지)로 나오는데 행이 매우 많아질 수 있습니다. '
              + '질문에 "~별로", "~단위로", "합쳐서", "묶어서" 같은 말이 있으면 반드시 채우세요.',
          },
        },
        // sc_display를 필수로 둔다 — 빼먹고 넘어가면 매번 되묻게 돼서
        // "팀 단위로 보여줘"처럼 이미 답이 들어있는 질문에도 재질문이 뜬다.
        required: ['report_id'],
      },
    },
  }
}

// 툴의 일반 인자 이름 → 리포트별 실제 파라미터 이름 후보.
// 워크북 GOLD마다 명명이 제각각이라(@Year/@year, @ActYn/@ActiveYn/@active_yn)
// 이름을 하나로 박아두면 그 이름을 쓰지 않는 리포트는 실행 자체가 거부된다.
const PARAM_ALIASES = {
  year: ['year', 'Year', 'base_year'],
  month: ['month', 'MonthNumber', 'Month', 'base_month'],
  day: ['day'],
  brand: ['brand', 'Brand', 'sc_brand'],
  dealer: ['dealer_nm', 'DealerNm'],
  group_name: ['group_name', 'GroupName'],
  dept_nm: ['dept_nm', 'DeptNm'],
  act_yn: ['active_yn', 'ActYn', 'ActiveYn'],
  activity_type: ['common_tp', 'common_tp_nm', 'CommonTpNm'],
  model: ['model_nm', 'ModelNm'],
  vehicle_variant: ['variant_nm', 'VariantNm'],
  vehicle_year: ['my_cd', 'MyCd'],
  grade_sfx: ['sfx_cd', 'SfxCd'],
}
const SC_ALIASES = ['sc_name', 'ScName']

// 비율을 명시적으로 요구하는 말. 아래 withRateCompanion에서만 쓴다.
const RATE_ASKED = /퍼센트|퍼샌트|비율|달성률|달성율|진행률|진행율|진척률|진척율|%/

/**
 * 비율을 물었는데 비율 컬럼이 빠졌으면 채운다.
 *
 * 2026-08-11 실측(평가 No.28): "출고 목표 대비 출고 건수를 게이지로, 밑에는 퍼센트도"에
 * selected_columns가 ["출고","출고목표"]로만 와서 진행률이 빠진 실행이 섞였다.
 * 사용자가 문장으로 요구한 값이 오류 없이 사라진다.
 *
 * 계약이 가진 컬럼 중 **고른 컬럼 이름으로 시작하고 비율로 끝나는 것**만 붙인다 —
 * 출고 → 출고진행률. 이름 규칙이 안 맞으면 아무것도 안 한다(추측하지 않는다).
 */
/**
 * 짝이 되는 컬럼이 질문에 이름으로 있으면 채운다.
 *
 * 2026-08-11 실측(평가 No.49): "PMA IN과 OUT 건수"에 selected_columns가
 * ["PMA IN","연누적 출고"]로 오는 실행이 10회 중 3회 섞였다 — 물어본 OUT이 사라지고
 * 묻지 않은 연누적이 들어온다. 질문에 "OUT"이 적혀 있으므로 코드가 가릴 수 있다.
 *
 * 고른 컬럼과 **접두어가 같고 뒷말만 다른** 컬럼 중, 그 뒷말이 질문에 낱말로 있는 것만
 * 붙인다. 'PMA IN' → 'PMA OUT'(질문에 OUT). 규칙이 안 맞으면 아무것도 안 한다.
 */
function withSiblingColumns(columns, contract, question) {
  const known = Object.keys(contract.column_semantics || {})
  const raw = String(question || '')
  const out = [...columns]

  for (const base of columns) {
    const prefix = base.slice(0, base.lastIndexOf(' ') + 1)
    if (prefix.length < 2) continue
    for (const other of known) {
      if (out.includes(other) || !other.startsWith(prefix) || other === base) continue
      const token = other.slice(prefix.length)
      if (token.length < 2) continue
      // 'OUT'처럼 영문 짧은 말은 낱말 경계로 본다 — 'A'가 PMA의 A에 걸리던 사고와 같은 이유.
      const found = /^[A-Za-z0-9]+$/.test(token)
        ? new RegExp(`(?<![A-Za-z0-9])${token}(?![A-Za-z0-9])`, 'i').test(raw)
        : raw.replace(/\s+/g, '').includes(token.replace(/\s+/g, ''))
      if (found) out.push(other)
    }
  }
  return out
}

function withRateCompanion(columns, contract, question) {
  if (!RATE_ASKED.test(String(question || ''))) return columns
  const known = Object.keys(contract.column_semantics || {})
  if (columns.some((c) => /(률|율)$/.test(c))) return columns

  for (const base of columns) {
    const hit = known.find((c) => c !== base && c.startsWith(base) && /(률|율)$/.test(c))
    if (hit && !columns.includes(hit)) return [...columns, hit]
  }
  return columns
}

// group_by 컬럼(한글) → 그 축을 고정하는 파라미터 이름들.
const GROUP_BY_PINNING_PARAMS = {
  연도: PARAM_ALIASES.year,
  월: PARAM_ALIASES.month,
  브랜드: PARAM_ALIASES.brand,
  딜러: PARAM_ALIASES.dealer,
  전시장: PARAM_ALIASES.group_name,
  팀: PARAM_ALIASES.dept_nm,
  // 같은 조직 축인데 리포트마다 컬럼 이름이 다르다 — target_management_funnel_avg만
  // '부서'를 쓴다. 이름을 하나만 적어두면 그 리포트에서 고정 축이 안 걸린다
  // (2026-08-10 실측 평가 No.42: group_by=["부서"]와 null이 갈려 2행↔9행).
  부서: PARAM_ALIASES.dept_nm,
  재직여부: PARAM_ALIASES.act_yn,
  활동유형: PARAM_ALIASES.activity_type,
  모델: PARAM_ALIASES.model,
  차종: PARAM_ALIASES.vehicle_variant,
  연식: PARAM_ALIASES.vehicle_year,
  SFX: PARAM_ALIASES.grade_sfx,
  // sc_delivery_status의 등급 분류 축. 질문에서 기준과 그룹을 지정하면 두 컬럼이 상수가 된다
  // — 2026-08-10 실측(평가 No.48): selected_columns 유무에 따라 표가 2열과 4열로 갈렸다.
  평가기준: ['grp_category'],
  그룹분류: ['grp_name'],
}

/**
 * 그 축이 파라미터로 **한 값에 고정**돼 있는가.
 *
 * 고정된 축을 group_by에 넣으면 정보가 늘지 않는다 — 모든 행이 같은 값이다. 그런데
 * 표에는 상수 컬럼이 하나 더 생기고, 그 값이 숫자면 데이터처럼 보인다.
 * 2026-08-10 실측(평가 No.31): LLM이 group_by에 연도·월을 넣은 실행에서 결과 숫자에
 * 2026이 네 번 섞여 나왔고, 같은 질문의 다른 실행과 답이 갈렸다.
 *
 * 값이 여러 개인 파라미터(딜러 2곳 비교 등)는 축으로서 의미가 있으므로 남긴다.
 */
function isPinnedByParam(column, params) {
  const names = GROUP_BY_PINNING_PARAMS[column]
  if (!names) return false
  for (const name of names) {
    if (!(name in params)) continue
    const v = params[name]
    if (v === null || v === undefined || v === '') continue
    if (Array.isArray(v)) { if (v.length === 1) return true; continue }
    return true          // 스칼라는 한 값이다
  }
  return false
}

function paramNameFor(contract, candidates) {
  const names = new Set(contract.parameters.map((p) => p.name))
  return candidates.find((c) => names.has(c)) || null
}

// 시간 축은 계약마다 컬럼명이 한글이라 시맨틱 id로는 안 맞는다. filterable_dimensions에
// 일일이 적기보다 여기서 이름만 이어 준다 — 결과에 그 컬럼이 있을 때만 쓰인다.
const TIME_DIMENSION_COLUMNS = {
  time_year: ['연도'],
  time_month: ['월', 'MonthAbbr'],
  time_day: ['일'],
  time_week: ['월별주차', '주차'],
}

// 시맨틱 차원 id → 결과 컬럼 이름. filterable_dimensions에 없더라도 결과에 그 컬럼이
// 있으면 걸 수 있다 — 선언은 "권장 목록"이지 "허용 목록"이 아니다.
// 2026-08-05 실측: 과거 3개월 퍼널 평균이 department/active_status 로,
// SC 출고 현황이 team 으로 막혔다. 둘 다 결과에 팀·재직여부 컬럼이 있는데도 그랬다.
const DIMENSION_COLUMN_ALIASES = {
  brand: ['브랜드'],
  dealer: ['딜러'],
  showroom: ['전시장'],
  // 과거 3개월 퍼널 평균만 팀 컬럼을 '부서'로 내보낸다 — GOLD 원문이 그렇다.
  department: ['팀', '부서'], team: ['팀', '부서'],
  active_status: ['재직여부'], active_yn: ['재직여부'],
  sales_consultant: ['SC'], sc: ['SC'],
  activity_type: ['활동유형'],
  activity_group: ['활동유형분류'],
  vehicle_model: ['모델', 'Model'], model: ['모델', 'Model'],
  vehicle_variant: ['차종'],
  vehicle_year: ['연식'],
  grade_sfx: ['SFX'],
}

// LLM이 시맨틱 id 대신 GOLD 파라미터 이름을 보내기도 한다(group_name, dept_nm).
// 카탈로그에 파라미터 이름이 함께 노출되니 자연스러운 혼동이다 — 막지 말고 이어 준다.
const PARAM_NAME_TO_DIMENSION = {
  brand: 'brand', Brand: 'brand',
  dealer_nm: 'dealer', DealerNm: 'dealer',
  group_name: 'showroom', GroupName: 'showroom',
  dept_nm: 'department', DeptNm: 'department',
  active_yn: 'active_status', ActiveYn: 'active_status', ActYn: 'active_status',
  sc_name: 'sales_consultant', ScName: 'sales_consultant',
  common_tp_nm: 'activity_type', CommonTpNm: 'activity_type', common_tp: 'activity_type',
  tp_grp_1: 'activity_group',
  ModelNm: 'vehicle_model', model_nm: 'vehicle_model',
  VariantNm: 'vehicle_variant', variant_nm: 'vehicle_variant',
  MyCd: 'vehicle_year', my_cd: 'vehicle_year',
  SfxCd: 'grade_sfx', sfx_cd: 'grade_sfx',
}

function resolveObjectFilterFields(contract, dimensionIds) {
  const requested = [...new Set((dimensionIds || []).filter((id) => typeof id === 'string' && id.trim()))]
  const definitions = Array.isArray(contract.filterable_dimensions) ? contract.filterable_dimensions : []
  const byId = new Map(definitions.map((definition) => [definition.id, definition]))
  const columns = new Set([
    ...(contract.dimension_columns?.branch_a || []),
    ...(contract.dimension_columns?.branch_b || []),
  ])

  // LLM이 시맨틱 id 대신 결과 컬럼명을 그대로 보내기도 한다("자사금융여부").
  // 그 컬럼이 실제로 결과에 있으면 굳이 막을 이유가 없다.
  const pick = (list) => (list || []).find((c) => columns.has(c)) || null
  const columnFor = (id) => byId.get(id)?.column
    || byId.get(PARAM_NAME_TO_DIMENSION[id])?.column
    || (columns.has(id) ? id : null)
    || pick(TIME_DIMENSION_COLUMNS[id])
    || pick(DIMENSION_COLUMN_ALIASES[id])
    || pick(DIMENSION_COLUMN_ALIASES[PARAM_NAME_TO_DIMENSION[id]])
    || null

  const unsupported = requested.filter((id) => !columnFor(id))
  return {
    requested,
    unsupported,
    fields: requested.map(columnFor).filter(Boolean),
  }
}

/**
 * 연/월을 날짜 구간 파라미터로 바꾼다.
 *
 * 일부 GOLD는 기간을 연·월 정수가 아니라 date 구간(reg_from/reg_to)으로 받는다.
 * 툴은 year/month만 노출하므로, 그런 리포트는 변환해 주지 않으면 "2026년 4월"이
 * 그냥 버려지고 전 기간이 조회된다(목록형이라 행이 폭증한다).
 */
function dateRangeParams(contract, year, month) {
  if (!year) return null
  const dates = contract.parameters.filter((p) => p.sql_type === 'date')
  const from = dates.find((p) => /_from$/.test(p.name))
  const to = dates.find((p) => p.name === from?.name.replace(/_from$/, '_to'))
  if (!from || !to) return null

  const pad = (n) => String(n).padStart(2, '0')
  if (month) {
    const last = new Date(Date.UTC(year, month, 0)).getUTCDate()
    return { [from.name]: `${year}-${pad(month)}-01`, [to.name]: `${year}-${pad(month)}-${pad(last)}` }
  }
  return { [from.name]: `${year}-01-01`, [to.name]: `${year}-12-31` }
}

/**
 * 툴 인자 → 그 리포트가 실제로 받는 파라미터로 변환한다.
 *
 * SC 재질문은 "SC 여부가 출력 스키마를 바꾸는" 리포트에만 한다 —
 * 계약의 schema_switching이 그 판단 근거다. 목록형처럼 SC 열이 늘 있거나
 * 아예 없는 리포트까지 되물으면 답할 수 있는 질문에도 막힌다.
 */
export function resolveReportRequest(args, question = null) {
  // LLM이 연도를 빠뜨려도 질문에 적혀 있으면 그걸 쓴다. 연도가 빠지면 오류 없이
  // 전 연도가 조회되고, 표가 멀쩡해 보여서 사람 눈으로는 안 걸린다 —
  // 2026-08-06 실측(평가 No.18): "2026년 SC 김승진님의 월별 계약판매성취도"가
  // Year 없이 실행돼 여러 해가 섞인 54행이 나왔다.
  const yearInQuestion = String(question || '').match(/(20\d\d)\s*년/)
  if (args.year == null && yearInQuestion) args = { ...args, year: Number(yearInQuestion[1]) }

  const { contract } = getReport(args.report_id)
  const scParam = paramNameFor(contract, SC_ALIASES)
  const scSpec = scParam ? contract.parameters.find((p) => p.name === scParam) : null
  const scMattersForSchema = !!scSpec?.schema_switching
  // 걸 수 없는 축이 섞여 있어도 답변을 막지 않는다. 객체 필터는 화면에서 값을 골라
  // 보는 편의 기능이고, 데이터 자체는 그대로 유효하다. 되묻고 끝내면 답을 알면서도
  // 안 주는 셈이 된다 — 2026-08-05 전수 실행에서 이 이유로 8건이 답을 못 냈다.
  //
  // 그 리포트에 그 컬럼이 아예 없는 경우가 정상적으로 있다(과거 3개월 퍼널 평균에는
  // 재직여부 컬럼이 없다). 그런 축은 빼고 답한 뒤, 뺐다는 사실만 밝힌다.
  const objectFilters = resolveObjectFilterFields(contract, args.object_filter_dimension_ids)

  // SC 실행 옵션은 코드가 정한다. LLM은 근거만 준다.
  const sc = resolveScOptions({
    scNames: args.sc_names,
    explicitScBreakdown: args.explicit_sc_breakdown,
    requiresSpecificSc: args.requires_specific_sc,
    // 내부 호출부(재실행·테스트)가 실행 상태를 직접 넘기는 경우에만 존중한다.
    // LLM 툴 스키마에는 이 필드가 없다.
    internalScDisplay: args.sc_display,
  })
  // 유일하게 허용되는 SC 재질문: 특정 한 사람이 필요한데 이름을 알 수 없을 때.
  // 출력 스키마(SC 열을 낼지 말지)만을 위한 재질문은 하지 않는다.
  if (sc.needsClarification) {
    return {
      needsClarification: true,
      clarificationTarget: sc.clarificationTarget,
      question: '어떤 SC(영업사원)를 보시겠어요? 이름을 알려주시면 해당 SC만 표시합니다.',
      options: ['SC별로 나눠서 전부 보여줘', '팀 단위로 보여줘 (SC 열 없이)'],
    }
  }
  let scDisplay = sc.scDisplay

  // SC가 결과 열에 있어야 브라우저 객체 필터도 실제 값 목록을 만들 수 있다. SC 필터를 요청한
  // 경우 팀 단위 스키마를 고르면 SC 열 자체가 사라지므로 전체 SC로 승격한다.
  //
  // 다만 사용자가 사람을 지목했으면(specific) 승격하지 않는다. 승격하면 그 이름이
  // 지워지고 팀 전체가 나간다 — 2026-08-05 실측(평가 No.37): "강남영업1팀 김승진의
  // 연간 누적 계약"에서 ScName이 'ALL'로 나가 이래근·임태현·정지훈까지 함께 나왔다.
  if (scMattersForSchema && objectFilters.requested.includes('sales_consultant')
      && scDisplay !== SC_DISPLAY.SPECIFIC) {
    scDisplay = SC_DISPLAY.ALL_SC
  }

  // SC 열을 보여달라고 해놓고 팀 단위로 실행하면 그 열이 없는 분기가 나온다.
  // 2026-08-04 실측: "SC명, 고객명, 차종 표로 나타내줘"에 팀 단위가 잡혀 SC 열이
  // 사라졌고, 그 뒤 "없는 컬럼"으로 거절됐다. 요청이 이겨야 한다.
  //
  // SC로 묶어 달라거나(group_by) SC 열을 달라는(selected_columns) 요청 자체가 SC 근거다.
  // LLM이 explicit_sc_breakdown을 놓쳐도 여기서 살린다 — "SC 중 활동배수가 5 이상인
  // SC의..." 처럼 "SC별"이라는 말을 쓰지 않는 표현이 실제로 있다(2026-08-06 평가 11·43).
  const scWord = (c) => /^\s*(sc|SC)\s*(명|이름)?\s*$|영업사원/.test(String(c))
  const wantsScColumn = (args.selected_columns || []).some(scWord)
    || (args.group_by || []).some(scWord)
  if (wantsScColumn && scDisplay === SC_DISPLAY.TEAM_LEVEL) {
    scDisplay = SC_DISPLAY.ALL_SC
  }
  const preset = REPORT_VIEW_PRESETS[args.report_view]
  const reportView = preset?.reportId === args.report_id ? args.report_view : null

  // @ScName 바인딩. team_level은 NULL(SC 열 없음), all_sc는 'ALL', specific은 이름들.
  let scValue = null
  if (scDisplay === SC_DISPLAY.ALL_SC) scValue = SC_ALL
  else if (scDisplay === SC_DISPLAY.SPECIFIC) scValue = sc.scNames

  // 그 리포트가 가진 파라미터만 담는다. 없는 이름을 넣으면 검증기가 거부한다.
  const params = {}
  for (const [argKey, candidates] of Object.entries(PARAM_ALIASES)) {
    const v = args[argKey]
    if (v === undefined || v === null) continue
    const name = paramNameFor(contract, candidates)
    if (name) params[name] = v
  }
  if (scParam && scValue !== null) params[scParam] = scValue

  // 리포트 고유 필터. 없는 이름은 조용히 버리지 않는다 — 버리면 조건이 빠진 전체
  // 결과가 "걸러진 결과"인 것처럼 나간다. 어느 이름이 유효한지 알려주고 되묻는다.
  const paramNames = new Set(contract.parameters.map((p) => p.name))
  const unknownFilters = []
  for (const f of args.report_filters || []) {
    const name = String(f?.name || '').trim()
    const values = (f?.values || []).map((v) => String(v).trim()).filter(Boolean)
    if (!name || !values.length) continue
    if (!paramNames.has(name)) { unknownFilters.push(name); continue }
    // 일반 인자가 이미 채운 자리는 덮지 않는다(사용자가 말한 딜러를 지우면 안 된다).
    if (params[name] === undefined) params[name] = values
  }
  // 질문에 "3회차"처럼 단위가 붙은 값이 있는데 그 필터가 비어 있으면 서버가 채운다.
  //
  // 2026-08-11 실측(평가 No.47): "2026년 4월 3회차 미팅 진행한 이력은 총 몇건인지"에
  // meet_round가 실행마다 붙었다 안 붙었다 했다 — 빠진 실행은 전체 회차 85행,
  // 붙은 실행은 15행이다. 오류가 안 나고 표도 멀쩡해서 사람 눈으로는 안 걸린다.
  //
  // 어떤 파라미터가 그 단위인지는 계약이 스스로 말한다(description이 그 말로 시작한다).
  // 코드에 파라미터 이름을 박지 않는 이유다 — 리포트마다 이름이 다르다.
  const hay = String(question || '').replace(/\s+/g, '')
  for (const p of reportExtraParameters(contract)) {
    if (params[p.name] !== undefined) continue        // 사용자가 말한 값을 덮지 않는다

    const unit = String(p.description || '').match(/^([가-힣]{2,3})\s*[((.]/)?.[1]
    if (unit) {
      const said = String(question || '').match(new RegExp(`(\\d+)\\s*${unit}`))
      if (said) { params[p.name] = [said[1]]; continue }
    }

    // 허용값이 선언된 필터는 질문에 그 값이 그대로 있으면 채운다.
    //
    // 2026-08-11 실측(평가 No.52): "평가 기준은 누적 취소율로, A 그룹에 대한 데이터"에서
    // grp_category·grp_name이 붙었다 말았다 하며 같은 리포트가 300행과 380행을 오갔다.
    // 조건이 빠진 실행은 전체 등급을 걸러진 결과인 양 내놓는다.
    //
    // 한 글자짜리 값('A')은 질문 아무 데나 나올 수 있어 뒤에 묶는 말이 붙어야 인정한다 —
    // 이 리포트는 'A'라는 이름의 컬럼도 함께 낸다.
    if (!p.allowed?.length) continue
    const matched = p.allowed.filter((v) => {
      const n = String(v).replace(/\s+/g, '')
      if (n.length >= 2) return hay.includes(n)
      return new RegExp(`${n}\\s*(그룹|등급|군)`).test(String(question || ''))
    })
    if (matched.length) params[p.name] = matched
  }

  if (unknownFilters.length) {
    const usable = reportExtraParameters(contract)
      .map((p) => `${p.name}${p.allowed ? `(${p.allowed.join('|')})` : ''}`)
    return {
      needsClarification: true,
      question: `이 리포트에 없는 필터입니다: ${unknownFilters.join(', ')}.`
        + (usable.length ? ` 이 리포트가 받는 필터는 ${usable.join(', ')} 입니다.` : ' 이 리포트는 추가 필터를 받지 않습니다.'),
      options: ['조건 없이 전체로 보여줘', '다른 리포트에서 찾아줘'],
    }
  }

  // 연·월을 정수로 못 받는 리포트는 날짜 구간으로 옮겨 준다.
  Object.assign(params, dateRangeParams(contract, args.year, args.month) || {})

  return {
    needsClarification: false,
    reportId: args.report_id,
    reportView,
    // 호출부가 "SC 단위를 요청했는지"를 알아야 한다 — 행이 많다고 합계로 접으면
    // SC별로 보자고 한 요청이 통째로 사라진다.
    scDisplay,
    selectedColumns: (() => {
      const asked = (args.selected_columns || []).filter((c) => typeof c === 'string' && c.trim())

      // 계약이 선언한 별칭으로 질문에서 직접 유도한다. 사용자가 쓴 말이 근거이므로
      // LLM이 고른 것보다 이쪽을 믿는다 — LLM은 실행마다 다른 열을 고르지만 질문은 하나다.
      const aliases = contract.column_aliases || {}
      const norm = (s) => String(s).replace(/[\s_]+/g, '')
      const hay = norm(question || '')
      const fromQuestion = Object.entries(aliases)
        .filter(([, words]) => (words || []).some((w) => hay.includes(norm(w))))
        .map(([column]) => column)

      // 별칭이 선언되지 않은 컬럼은 **이름 자체**를 근거로 삼는다.
      //
      // 2026-08-11 실측(평가 No.34): 다섯 열을 물었는데 넷만 나왔다.
      // '기회창출영업기회_3개월평균'은 질문에 그대로 적혀 있었지만 별칭 항목이 없어
      // 안 잡혔고, 나머지 넷이 잡히는 바람에 LLM이 고른 목록이 통째로 교체되며 탈락했다.
      //
      // 별칭이 있는 컬럼에는 이 규칙을 적용하지 않는다 — '계약'은 별칭을 '계약 건수'·
      // '계약 실적'으로만 두고 맨 이름을 일부러 뺐다. 계약 얘기가 나오는 질문마다
      // 그 열이 딸려오면 안 되기 때문이다. 선언이 있으면 그 선언이 곧 의도다.
      const allColumns = Object.keys(contract.column_semantics || {})
      const byOwnName = allColumns.filter((c) => !aliases[c] && norm(c).length >= 2 && hay.includes(norm(c)))

      // 이름 매칭은 **더하기로만** 쓴다. 교체 기준으로 삼으면 안 된다 —
      // funnel_full_structure처럼 별칭이 하나도 없는 계약에서는 질문이 열 하나를 이름으로
      // 부르는 순간 LLM이 제대로 고른 나머지가 통째로 날아간다. 그건 방금 No.34에서
      // 고친 것과 똑같은 사고를 다른 자리에 만드는 것이다.
      let base = fromQuestion.length ? fromQuestion : asked
      base = [...base, ...byOwnName]

      if (!base.length) return []
      // 질문에 이름이 있는 짝 컬럼과 비율 컬럼을 채운다(각 함수 주석 참고).
      base = withSiblingColumns(base, contract, question)
      base = withRateCompanion(base, contract, question)
      return [...new Set(base)]
    })(),
    dimensionFilters: (args.dimension_filters || [])
      .filter((f) => f && typeof f.column === 'string' && Array.isArray(f.values) && f.values.length),
    measureFilters: (args.measure_filters || [])
      .filter((f) => f && typeof f.column === 'string' && typeof f.op === 'string' && Number.isFinite(Number(f.value))),
    // SC 열을 보기로 했으면 롤업에도 SC를 남긴다 — 안 그러면 SC별로 보자고 해놓고
    // SC가 합쳐진 표가 나온다.
    groupBy: (() => {
      const explicit = (args.group_by || []).filter((c) => GROUPABLE_DIMENSIONS.includes(c))
      let base = explicit.length ? explicit : inferredTemporalGroupBy(question)
      if (base.length === 0) base = contract.default_group_by || []
      // 고정 축 제거는 **폴백까지 지나온 뒤** 한 번에 한다. 명시 목록에만 걸면 계약
      // 기본 축으로 되돌아간 경로에 그대로 남는다 — 2026-08-10 실측(평가 No.33):
      // group_by에 '월'이 남아 결과 숫자에 4가 네 번 섞였다.
      base = base.filter((c) => !isPinnedByParam(c, params))
      // 객체 필터는 화면 전용 장식이 아니다. 해당 컬럼을 접어 버리면 필터 드롭다운은 보여도
      // 선택 후 어떤 행에도 적용할 수 없으므로, 계약에 선언한 원본 필드까지 결과 grain에 남긴다.
      // 단, 파라미터로 이미 한 값에 고정된 축은 뺀다 — 선택지가 하나뿐인 드롭다운을 위해
      // 상수 컬럼을 남기면 그 값이 결과 숫자에 섞인다(2026-08-10 실측: 평가 No.33에서
      // 이 경로로 '월'이 되살아나 4가 네 번 나왔다).
      base = [...new Set([...base, ...objectFilters.fields.filter((c) => !isPinnedByParam(c, params))])]
      // 접으면 같은 건을 두 번 세는 축은 반드시 남긴다. delivery_status_monthly의 '구분'은
      // 출고현황(전체)과 그 부분집합(기회창출·관계형성·소개)이 한 컬럼에 섞여 있어,
      // 접어서 더하면 연누적이 55 대신 125가 된다(2026-08-05 실측).
      const keep = (contract.never_collapse || []).filter((c) => !base.includes(c))
      if (keep.length) base = [...base, ...keep]
      // SC 열을 보기로 했으면 롤업에도 SC를 남긴다 — 안 그러면 SC별로 보자고 해놓고
      // SC가 합쳐진 표가 나온다.
      if (scDisplay !== SC_DISPLAY.TEAM_LEVEL && !base.includes('SC')) base = [...base, 'SC']
      return base.length ? base : null
    })(),
    objectFilterFields: objectFilters.fields,
    // 걸지 못한 축. 답변에 한 줄로 밝힌다 — 조용히 빼면 사용자는 걸린 줄 안다.
    unsupportedObjectFilters: objectFilters.unsupported,
    params,
  }
}
