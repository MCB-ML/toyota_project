// 퍼널 파생 지표 테스트:
//   node --test server/agentic-bi/funnelDerived/funnelDerived.test.js
//
// 값 대조(파생 지표 vs GOLD 합계)는 라이브 DB가 필요해 여기 없다. 대신 "GOLD에서
// 가져다 쓰는 구조가 유지되는지"를 고정한다 — 정의를 옮겨 적기 시작하면 여기서 깨진다.
import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { parseCtes, collectRequired, dependenciesOf, injectGrain } from './cteGraph.js'
import { buildFunnelMetricSql, listFunnelMetrics } from './buildFunnelMetricSql.js'
import { FUNNEL_METRICS, GRAIN_COLUMNS } from './metricSpecs.js'
import { getReport } from '../../reports/registry.js'
import { FUNNEL_CHANNEL_ACTIVITY_TYPES } from '../../reports/projection.js'
import { buildFromMetricIr, METRIC_MAP, derivedUnavailableReason } from './fromMetricIr.js'
import { TARGET_METRICS } from './fromSalesAchievement.js'
import { loadRegistry } from '../app/semantic/registry.js'
import { moveValueDimensionsToFilters, valueMentionedIn } from '../../agenticBiPipeline.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const goldSql = fs.readFileSync(
  path.resolve(__dirname, '..', '..', 'reports', 'sql', 'funnel_full_structure.sql'), 'utf8',
)
const ctes = parseCtes(goldSql)

describe('CTE 파서', () => {
  test('GOLD의 CTE를 모두 찾는다', () => {
    assert.ok(ctes.size > 50, `CTE가 ${ctes.size}개뿐이다 — 파서가 본문을 놓치고 있다`)
    for (const n of ['valid_user', 'overall_activity_actual', 'overall_lead_activity_pool']) {
      assert.ok(ctes.has(n), `${n}을 찾지 못했다`)
    }
  })

  test('서브쿼리 안의 "X AS (" 를 CTE로 착각하지 않는다', () => {
    // valid_user 본문에는 STRING_SPLIT(...) AS X 가 여러 번 나온다.
    assert.ok(!ctes.has('X'), 'STRING_SPLIT의 별칭 X를 CTE로 잡았다')
  })

  test('CTE 본문의 괄호가 짝을 이룬다 — 잘라내기가 정확하다는 뜻', () => {
    for (const [name, cte] of ctes) {
      const open = (cte.body.match(/\(/g) || []).length
      const close = (cte.body.match(/\)/g) || []).length
      assert.equal(open, close, `${name}의 괄호가 안 맞는다 (${open}/${close})`)
    }
  })

  test('의존 CTE는 선언 순서를 지켜 나온다 — SQL Server는 앞선 것만 참조할 수 있다', () => {
    const order = [...ctes.keys()]
    for (const m of listFunnelMetrics()) {
      const need = collectRequired([m.aggregate_cte], ctes)
      const idx = need.map((n) => order.indexOf(n))
      assert.deepEqual(idx, [...idx].sort((a, b) => a - b), `${m.id}의 CTE 순서가 뒤집혔다`)
      // 각 CTE의 의존이 자기보다 앞에 있어야 한다.
      for (const n of need) {
        for (const dep of dependenciesOf(ctes.get(n), ctes)) {
          assert.ok(need.indexOf(dep) < need.indexOf(n), `${m.id}: ${n}이 ${dep}보다 앞에 있다`)
        }
      }
    }
  })

  test('필요한 CTE만 담는다 — 57개를 통째로 넣지 않는다', () => {
    const need = collectRequired(['overall_activity_actual'], ctes)
    assert.ok(need.length < 10, `${need.length}개나 끌고 왔다: ${need.join(', ')}`)
    assert.ok(!need.includes('overall_lead_activity_pool'), '관계없는 CTE가 섞였다')
  })
})

describe('지표 명세가 GOLD와 연결돼 있다', () => {
  test('모든 지표의 집계 CTE가 GOLD에 실재한다', () => {
    for (const [id, spec] of Object.entries(FUNNEL_METRICS)) {
      assert.ok(ctes.has(spec.aggregate_cte), `${id}: GOLD에 없는 CTE ${spec.aggregate_cte}`)
      if (spec.grain_source !== 'vu') {
        assert.ok(ctes.has(spec.grain_source), `${id}: GOLD에 없는 CTE ${spec.grain_source}`)
      }
    }
  })

  test('report_column이 1-1 리포트 계약에 실재한다 — 합계 대조의 근거', () => {
    const { contract } = getReport('funnel_full_structure')
    for (const [id, spec] of Object.entries(FUNNEL_METRICS)) {
      // null은 "대응 컬럼이 없다"는 명시적 선언이다 — 값 대조에서 제외된다.
      if (spec.report_column === null) continue
      assert.ok(spec.report_column in contract.column_semantics,
        `${id}: 리포트에 없는 컬럼 '${spec.report_column}'`)
    }
  })

  // 이 테스트가 없으면 "컬럼이 실재하는가"만 보게 되어, 엉뚱한 컬럼을 가리켜도 통과한다.
  // 2026-08-05: contract_progress_actual 이 실제로 그랬다 — '계약건수(당월활동실적)'를
  // 가리켰지만 그 컬럼은 다른 CTE(CAC=264)이고 이 지표는 CPC(208)였다.
  test('두 지표가 같은 report_column을 가리키지 않는다 — 값 대조가 무의미해진다', () => {
    const seen = new Map()
    for (const [id, spec] of Object.entries(FUNNEL_METRICS)) {
      if (spec.report_column === null) continue
      const prev = seen.get(spec.report_column)
      assert.equal(prev, undefined,
        `'${spec.report_column}'를 ${prev}와 ${id}가 함께 가리킨다 — 둘 중 하나는 다른 측정값이다`)
      seen.set(spec.report_column, id)
    }
  })

  test('grain=vu인 지표는 집계 CTE 안에 valid_user가 조인돼 있다', () => {
    // 없으면 VU.dealer_nm을 넣는 순간 실행이 깨진다.
    for (const [id, spec] of Object.entries(FUNNEL_METRICS)) {
      if (spec.grain_source !== 'vu') continue
      assert.match(ctes.get(spec.aggregate_cte).body, /valid_user\s+AS\s+VU/i,
        `${id}: 집계 CTE에 valid_user AS VU가 없다`)
    }
  })

  test('계약목표의 활동유형 필터가 GOLD에 남아있다', () => {
    // 이 줄이 빠진 독립 SQL이 3,161 대신 560,790을 냈다. 파생의 존재 이유다.
    assert.match(ctes.get('overall_contract_target').body, /common_tp_nm\s*=\s*N'계약'/)
  })
})

describe('SQL 생성', () => {
  test('grain=[]이면 집계 CTE에 GROUP BY를 넣지 않는다 — GOLD 합계와 같은 전사 집계', () => {
    // GOLD 자체 CTE(valid_common_type 등)는 원래 자기 GROUP BY를 갖고 있다.
    // 확인할 것은 "우리가 넣지 않았는가"다.
    const sql = buildFunnelMetricSql('lead_actual', [])
    const agg = ctes.get(FUNNEL_METRICS.lead_actual.aggregate_cte).body
    assert.ok(sql.includes(agg), '집계 CTE 본문이 바뀌었다')
    assert.ok(!/GROUP BY/i.test(agg))
    assert.match(sql, /COUNT\(DISTINCT lead_key\)/)
    // 최종 SELECT도 grain 없이 한 줄이어야 한다.
    assert.match(sql, /SELECT cnt AS \[value\]\nFROM overall_lead_activity_count$/)
  })

  test('grain을 주면 그 컬럼으로 집계를 다시 한다 — 상세를 더하지 않는다', () => {
    const sql = buildFunnelMetricSql('lead_actual', ['딜러'])
    assert.match(sql, /GROUP BY dealer_nm/)
    // pool에도 grain이 들어가야 COUNT(DISTINCT)를 딜러 단위로 셀 수 있다.
    assert.match(sql, /SELECT DISTINCT VU\.dealer_nm/)
  })

  test('계산식은 GOLD 본문을 그대로 쓴다 — 옮겨 적지 않는다', () => {
    for (const m of listFunnelMetrics()) {
      const sql = buildFunnelMetricSql(m.id, [])
      const body = ctes.get(m.aggregate_cte).body.trim()
      // grain이 없으면 본문이 한 글자도 바뀌지 않아야 한다.
      assert.ok(sql.includes(body), `${m.id}: 집계 CTE 본문이 그대로 들어있지 않다`)
    }
  })

  test('지원하지 않는 단위는 거부한다 — 활동유형은 grain이 될 수 없다', () => {
    // 한 건이 여러 활동유형에 걸쳐 DISTINCT가 분할되지 않는다.
    assert.ok(!('활동유형' in GRAIN_COLUMNS))
    assert.throws(() => buildFunnelMetricSql('lead_actual', ['활동유형']), /나눌 수 없는 단위/)
  })

  test('없는 지표는 거부한다', () => {
    assert.throws(() => buildFunnelMetricSql('없는지표', []), /퍼널 파생 지표가 아닙니다/)
  })

  test('파라미터 DECLARE 헤더가 붙어 있다 — @month_start 등이 필요하다', () => {
    const sql = buildFunnelMetricSql('activity_actual', [])
    assert.match(sql, /DECLARE @month_start DATE/)
    assert.match(sql, /DECLARE @tp_grp_1 NVARCHAR/)
  })
})

describe('injectGrain', () => {
  test('SELECT 목록 앞에 컬럼을 넣고 GROUP BY를 붙인다', () => {
    const out = injectGrain('SELECT SUM(x) AS cnt\nFROM t', ['VU.a'], ['VU.a'])
    assert.match(out, /SELECT VU\.a, SUM\(x\) AS cnt/)
    assert.match(out, /GROUP BY VU\.a/)
  })

  test('DISTINCT 목록에도 넣을 수 있다', () => {
    const out = injectGrain('SELECT DISTINCT k\nFROM t', ['VU.a'], [], { distinct: true })
    assert.match(out, /SELECT DISTINCT VU\.a, k/)
    assert.ok(!/GROUP BY/.test(out))
  })

  test('빈 grain이면 본문을 건드리지 않는다', () => {
    const body = 'SELECT SUM(x) AS cnt FROM t'
    assert.equal(injectGrain(body, [], []), body)
  })
})

describe('지표 IR → 파생 SQL 판단', () => {
  const IR = (over = {}) => ({
    metrics: ['activity_mtd_actual'],
    dimensions: [],
    filters: [],
    time_range: { type: 'absolute', start_date: '2026-04-01', end_date: '2026-04-30' },
    ...over,
  })
  const NOW = '2026-07-31'

  test('한 달치 단일 지표는 파생으로 답한다', () => {
    const r = buildFromMetricIr(IR(), { currentDate: NOW })
    assert.ok(r)
    assert.equal(r.funnelMetricId, 'activity_actual')
    assert.equal(r.bind.year.value, 2026)
    assert.equal(r.bind.month.value, 4)
    assert.equal(r.bind.day.value, null, '말일까지면 @day는 NULL(=EOMONTH)이어야 한다')
    assert.match(r.sql, /cnt AS \[activity_mtd_actual\]/)
  })

  test('월 중간까지면 @day가 붙는다', () => {
    const r = buildFromMetricIr(IR({ time_range: { type: 'absolute', start_date: '2026-04-01', end_date: '2026-04-15' } }), { currentDate: NOW })
    assert.equal(r.bind.day.value, 15)
  })

  test('차원은 dimension id로 별칭이 붙는다 — 호출부가 그 이름으로 읽는다', () => {
    const r = buildFromMetricIr(IR({ dimensions: ['dealer'] }), { currentDate: NOW })
    assert.match(r.sql, /dealer_nm AS \[dealer\]/)
    assert.match(r.sql, /GROUP BY VU\.dealer_nm/)
  })

  test('필터는 GOLD 파라미터로 옮겨진다', () => {
    const r = buildFromMetricIr(IR({ filters: [{ dimension: 'brand', operator: 'in', values: ['TOYOTA', 'LEXUS'] }] }), { currentDate: NOW })
    assert.equal(r.bind.brand.value, 'TOYOTA,LEXUS')
    assert.equal(r.bind.dealer_nm.value, null)
  })

  // 아래는 전부 "파생으로 답하면 틀리는" 경우다. null을 돌려 기존 경로로 가야 한다.
  test('GOLD가 못 다루는 요청은 null — 기존 경로로 넘긴다', () => {
    const cases = {
      '여러 달 추이': IR({ time_range: { type: 'ytd' } }),
      '상대 기간': IR({ time_range: { type: 'relative', value: 3, unit: 'month' } }),
      '월 중간 시작': IR({ time_range: { type: 'absolute', start_date: '2026-04-10', end_date: '2026-04-30' } }),
      '달을 넘김': IR({ time_range: { type: 'absolute', start_date: '2026-04-01', end_date: '2026-05-31' } }),
      'GOLD에 없는 축': IR({ dimensions: ['vehicle_model'] }),
      '퍼널 지표가 아님': IR({ metrics: ['delivery_mtd_actual'] }),
      '지표 여러 개': IR({ metrics: ['activity_mtd_actual', 'activity_mtd_target'] }),
      '추이 후처리': IR({ time_series_transform: 'mom_change' }),
      '못 거는 필터': IR({ filters: [{ dimension: 'vehicle_model', operator: 'in', values: ['RAV4'] }] }),
      '값에 콤마': IR({ filters: [{ dimension: 'dealer', operator: 'in', values: ['A,B'] }] }),
    }
    for (const [why, ir] of Object.entries(cases)) {
      assert.equal(buildFromMetricIr(ir, { currentDate: NOW }), null, `${why}: 파생으로 답하려 했다`)
    }
  })

  test('계약 목표는 인증 퍼널로 파생하지 않고 시맨틱 SQL에서 직접 컴파일한다', () => {
    assert.equal(METRIC_MAP.contract_mtd_target, undefined)
    assert.equal(METRIC_MAP.contract_mtd_target_sc, undefined)
  })

  test('매핑된 시맨틱 지표는 실제 등록된 지표다', () => {
    const ids = loadRegistry().metrics
    for (const id of Object.keys(METRIC_MAP)) {
      assert.ok(ids.has(id), `시맨틱 레지스트리에 없는 지표를 매핑했다: ${id}`)
    }
  })
})

describe('출고 목표는 인증 리포트에서 꺼낸다', () => {
  test('2종이 2-3 리포트의 실재하는 컬럼을 가리킨다', () => {
    for (const [id, spec] of Object.entries(TARGET_METRICS)) {
      const { contract } = getReport(spec.report)
      assert.ok(spec.column in contract.column_semantics,
        `${id}: ${spec.report}에 '${spec.column}' 컬럼이 없다`)
    }
  })

  test('목표 컬럼은 반복값으로 선언돼 있다 — 더하면 19배가 된다', () => {
    // 2026-04 실측: 상세 행을 그냥 더하면 233,429, 올바른 값은 12,338.
    for (const spec of Object.values(TARGET_METRICS)) {
      const sem = getReport(spec.report).contract.column_semantics[spec.column]
      assert.equal(sem.type, 'repeated_higher_grain_value', `${spec.report}.${spec.column}`)
      assert.equal(sem.direct_sum_forbidden, true)
      assert.ok(sem.grain_branch_a?.includes('MonthAbbr'),
        '월이 grain에 없으면 연누적 값이 달마다 섞인다')
    }
  })

  test('MTD와 YTD가 짝을 이룬다 — 같은 리포트·컬럼, 누적 여부만 다르다', () => {
    for (const [mtd, ytd] of [['delivery_mtd_target', 'delivery_ytd_target']]) {
      assert.equal(TARGET_METRICS[mtd].report, TARGET_METRICS[ytd].report)
      assert.equal(TARGET_METRICS[mtd].column, TARGET_METRICS[ytd].column)
      assert.equal(TARGET_METRICS[mtd].cumulative, false)
      assert.equal(TARGET_METRICS[ytd].cumulative, true)
    }
  })

  test('퍼널 파생과 겹치지 않는다 — 같은 지표를 두 곳이 처리하면 값이 갈린다', () => {
    for (const id of Object.keys(TARGET_METRICS)) {
      assert.equal(METRIC_MAP[id], undefined, `${id}가 퍼널 파생에도 매핑돼 있다`)
    }
  })

  test('매핑된 지표는 실제 등록된 시맨틱 지표다', () => {
    const ids = loadRegistry().metrics
    for (const id of Object.keys(TARGET_METRICS)) assert.ok(ids.has(id), `없는 지표: ${id}`)
  })
})

describe('퍼널 프리셋이 쓰는 값의 출처', () => {
  const { contract } = getReport('funnel_full_structure')
  const sem = contract.column_semantics

  // 프리셋(퍼널 표·차트)이 실제로 읽는 컬럼들. 이 중 하나라도 상세 합산에 기대면
  // 화면 숫자가 틀어진다 — 계약 목표가 8배(4,688 vs 586)로 나왔던 경로다.
  const PRESET_COLUMNS = [
    '영업활동 건 수', '영업활동 당월 목표',
    '영업기회 건 수(당월활동실적)', '영업기회 당월 목표',
    '시승건수(당월전체실적/actual_cnt 기준)', '시승 당월 목표',
    '계약건수(당월활동실적)', '계약 당월 목표',
  ]

  test('프리셋이 읽는 컬럼은 모두 파생 지표가 연결돼 있다', () => {
    for (const column of PRESET_COLUMNS) {
      assert.ok(sem[column], `계약에 없는 컬럼: ${column}`)
      assert.ok(sem[column].derived_metric, `${column}에 derived_metric이 없다 — 상세 합산으로 떨어진다`)
      assert.ok(FUNNEL_METRICS[sem[column].derived_metric],
        `${column} → ${sem[column].derived_metric} 는 등록되지 않은 파생 지표다`)
    }
  })

  test('derived_metric의 report_column이 자기 자신을 가리킨다', () => {
    // 엇갈리면 A 컬럼에 B 값이 덮어써져 조용히 틀린 숫자가 나간다.
    for (const [column, spec] of Object.entries(sem)) {
      if (!spec.derived_metric) continue
      assert.equal(FUNNEL_METRICS[spec.derived_metric].report_column, column,
        `${column} ↔ ${spec.derived_metric} 연결이 엇갈렸다`)
    }
  })

  test('목표 2종과 시승 actual_cnt는 additive가 아니다 — 상세를 더하면 8배가 된다', () => {
    // 2026-04 실측: 계약 목표 상세합 25,288 / 합계 3,161, 시승 목표 41,872 / 5,234.
    for (const column of ['계약 당월 목표', '시승 당월 목표', '시승건수(당월전체실적/actual_cnt 기준)']) {
      assert.notEqual(sem[column].type, 'additive', `${column}이 additive로 되돌아갔다`)
      assert.equal(sem[column].direct_sum_forbidden, true, column)
    }
  })

  test('진짜 additive 2종은 그대로 둔다 — 실측으로 상세합=합계를 확인했다', () => {
    for (const column of ['영업활동 건 수', '영업활동 당월 목표', '영업기회 당월 목표']) {
      assert.equal(sem[column].type, 'additive', column)
    }
  })
})

describe('퍼널 비율의 분자·분모가 GOLD와 같다', () => {
  const { contract } = getReport('funnel_full_structure')
  const sem = contract.column_semantics

  // GOLD 최종 SELECT의 비율 정의. 출력 컬럼으로 표현할 수 있는 것만 담는다 —
  // '계약 진행률'은 GOLD가 출력에 없는 CTE(CPC)를 쓰고 BI 카드/표도 갈려서 제외한다
  // (알려진-이슈.md #1). 결정되면 여기 추가한다.
  const GOLD_RATIOS = {
    '영업활동 진행률': ['영업활동 건 수', '영업활동 당월 목표'],
    '영업활동에서 영업기회로의 전환율': ['영업기회 건 수(당월활동실적)', '영업활동 건 수'],
    '영업기회 진행률': ['영업기회 건 수(당월활동실적)', '영업기회 당월 목표'],
    '영업기회에서 계약으로 전환율': ['계약건수(당월활동실적)', '영업기회 건 수(당월활동실적)'],
    '영업기회에서 시승으로 전환율': ['시승건수(당월활동실적/시승완료)', '영업기회 건 수(당월활동실적)'],
    // BI 1-1 시승 카드 = 3,475/5,234 = 66%. 시승완료(2,058)로 잡으면 39%가 나온다.
    '시승 진행률': ['시승건수(당월전체실적/actual_cnt 기준)', '시승 당월 목표'],
    '시승에서 계약으로 전환율': ['시승에서 계약으로 당월활동실적', '시승건수(당월활동실적/시승완료)'],
  }

  test('계약에 선언한 분자·분모가 GOLD 정의와 일치한다', () => {
    for (const [column, [numerator, denominator]] of Object.entries(GOLD_RATIOS)) {
      assert.ok(sem[column], `계약에 없는 비율: ${column}`)
      assert.equal(sem[column].numerator, numerator, `${column}의 분자`)
      assert.equal(sem[column].denominator, denominator, `${column}의 분모`)
    }
  })

  test('비율의 분자·분모가 실재하는 컬럼이다', () => {
    for (const [column, spec] of Object.entries(sem)) {
      if (!spec.recompute_ratio) continue
      assert.ok(spec.numerator in sem, `${column}의 분자 '${spec.numerator}'가 없다`)
      assert.ok(spec.denominator in sem, `${column}의 분모 '${spec.denominator}'가 없다`)
    }
  })
})

describe('퍼널 채널은 grain이 아니라 필터다', () => {
  test('4채널이 활동유형 8종을 빠짐없이 나눠 갖는다', () => {
    // BI 1-1 상단 슬라이서 버튼 8개를 4채널로 묶은 것이다. 누락되면 그 활동유형이
    // 어느 채널에도 안 잡혀 화면에서 사라진다.
    const all = Object.values(FUNNEL_CHANNEL_ACTIVITY_TYPES).flat()
    assert.deepEqual([...all].sort(), [
      '관계형성 소개', '내방상담', '내전상담', '온라인 유입', '자사출고', '잠재고객', '타사출고', '판촉',
    ])
    assert.equal(all.length, new Set(all).size, '한 활동유형이 두 채널에 들어갔다')
  })

  test('채널 이름이 표의 채널 열과 같다', () => {
    // 이름이 어긋나면 보정값이 조용히 반영되지 않는다.
    assert.deepEqual(Object.keys(FUNNEL_CHANNEL_ACTIVITY_TYPES).sort(),
      ['SC활동', '관계형성활동', '내방/내전', '온라인유입'].sort())
  })

  test('활동유형은 grain 후보가 아니다 — 필터로만 쓴다', () => {
    // DISTINCT가 활동유형으로 분할되지 않아 GROUP BY 축으로 쓰면 값이 틀어진다.
    assert.ok(!('활동유형' in GRAIN_COLUMNS))
  })
})

// 파생이 null을 돌리면 호출부는 시맨틱 정의로 넘어간다. 그 자체는 막지 않는다 —
// 2026-08-05 실측에서 활동유형 축은 유형별 합이 퍼널 GOLD 총계 7,242와 정확히
// 일치했다. 막으면 지금 맞는 답까지 사라진다. 대신 **왜 넘어갔는지**를 남겨,
// 조용히 다른 정의로 계산되는 일이 없게 한다.
describe('파생 불가 사유', () => {
  const base = {
    metrics: ['activity_mtd_actual'],
    dimensions: [],
    filters: [{ dimension: 'dealer', operator: 'in', values: ['렉서스 강남'] }],
    time_range: { type: 'absolute', start_date: '2026-04-01', end_date: '2026-04-30' },
  }

  test('사유가 조건마다 다르게 나온다 — 무엇을 넓혀야 하는지 알 수 있게', () => {
    const cases = [
      [{ ...base, dimensions: ['activity_type'] }, /없는 축: activity_type/],
      [{ ...base, dimensions: ['time_day'] }, /없는 축: time_day/],
      [{ ...base, time_range: { type: 'absolute', start_date: '2026-01-01', end_date: '2026-12-31' } }, /1일~N일만/],
      [{ ...base, filters: [{ dimension: 'dealer', operator: 'not_in', values: ['렉서스 강남'] }] }, /연산자: not_in/],
      [{ ...base, time_series_transform: 'growth' }, /여러 달이 필요/],
      [{ ...base, metrics: ['delivery_ytd_actual'] }, /GOLD에 정의가 없는/],
    ]
    for (const [ir, pattern] of cases) {
      assert.match(derivedUnavailableReason(ir), pattern)
      assert.equal(buildFromMetricIr(ir, { currentDate: '2026-08-05' }), null,
        '사유가 있는데 파생이 성립하면 둘 중 하나가 틀렸다')
    }
  })

  test('파생이 되는 요청에는 사유를 붙이지 않는다', () => {
    // 여기서 사유가 나오면 정상 답변에 "다를 수 있습니다" 경고가 붙는다.
    for (const dims of [[], ['dealer'], ['dealer', 'showroom'], ['dealer', 'showroom', 'department']]) {
      const ir = { ...base, dimensions: dims }
      assert.ok(buildFromMetricIr(ir, { currentDate: '2026-08-05' }), `${dims} 는 파생 가능해야 한다`)
    }
  })
})

// 질문에 나온 차원 값을 축으로 볼지 조건으로 볼지 — 2026-08-06.
//
// LLM은 "~에 대한", "~별"이라는 말에 반응해 분해 축으로 넣는데, 값을 지목한 경우는
// 한정 조건이다. 프롬프트로 타이르는 대신 질문 안에 그 값이 있는지로 판단한다.
describe('값을 지목한 축은 조건으로 옮긴다', () => {
  const Q = '2026년 04월 렉서스 강남의 자사출고에 대한 시승 당월 목표와 진행률 확인해줘'

  test('값이 하나면 축을 빼고 조건으로 옮긴다', () => {
    const out = moveValueDimensionsToFilters(
      { metrics: ['testdrive_mtd_target'], dimensions: ['activity_type'], filters: [] }, Q,
    )
    assert.deepEqual(out.dimensions, [])
    assert.deepEqual(out.filters, [{ dimension: 'activity_type', operator: 'in', values: ['자사출고'] }])
  })

  // '자사출고'가 '출고'를 포함해 둘이 잡혔고, "둘이면 범례" 규칙에 걸려 축이 살아남았다.
  // 그 지표는 활동유형으로 분해할 수 없어 답이 실패했다(평가 No.22).
  test('더 긴 값 안에 들어 있기만 한 것은 언급으로 세지 않는다', () => {
    const out = moveValueDimensionsToFilters(
      { metrics: ['testdrive_mtd_target'], dimensions: ['activity_type'], filters: [] }, Q,
    )
    const values = out.filters[0].values
    assert.ok(!values.includes('출고'), `'출고'가 별도 값으로 잡혔다: ${values.join(', ')}`)
  })

  test('값이 둘 이상이면 범례다 — 축을 살리고 그 값들로 한정만 한다', () => {
    const out = moveValueDimensionsToFilters(
      { metrics: ['activity_mtd_actual'], dimensions: ['activity_group', 'time_month'], filters: [] },
      '김승진의 월별 활동 트렌드. 범례는 관계형성, 기회창출이야',
    )
    assert.deepEqual(out.dimensions, ['activity_group', 'time_month'], '범례 축이 사라졌다')
    assert.deepEqual(out.filters[0].values, ['관계형성', '기회창출'])
  })

  test('질문에 값이 없으면 건드리지 않는다', () => {
    const ir = { metrics: ['activity_mtd_actual'], dimensions: ['activity_type'], filters: [] }
    assert.deepEqual(moveValueDimensionsToFilters(ir, '2026년 4월 활동유형별 실적').dimensions, ['activity_type'])
  })
})

// 파라미터 허용값이 질문에 "언급됐는지" 판정 — 2026-08-06.
// 부분 문자열로 잡으면 조용히 엉뚱한 필터가 걸린다. 오늘 두 번 그랬다.
describe('값이 언급됐는지 판정', () => {
  test('PMA의 A를 등급 A로 읽지 않는다 — 평가 No.49·50이 이것 때문에 0행이었다', () => {
    assert.equal(valueMentionedIn('2025년 12월 렉서스 부산의 PMA IN과 PMA OUT 건수를 알려줘', 'A'), false)
  })

  test('낱말로 떨어져 있으면 인정한다', () => {
    assert.equal(valueMentionedIn('A 그룹에 대한 데이터를 보고 싶어', 'A'), true)
    assert.equal(valueMentionedIn('평가 기준은 누적 취소율로, A 그룹', 'A'), true)
  })

  test('한글 값은 조사가 붙어도 잡는다 — "재직자별"의 재직', () => {
    assert.equal(valueMentionedIn('sc중 재직자별 영업활동 실적', '재직'), true)
    assert.equal(valueMentionedIn('2026년 4월 활동 실적', '재직'), false)
  })

  test('다른 영문 안에 묻힌 값은 세지 않는다', () => {
    assert.equal(valueMentionedIn('SFX가 ABC인 건', 'B'), false)
    assert.equal(valueMentionedIn('B 그룹', 'B'), true)
  })
})
