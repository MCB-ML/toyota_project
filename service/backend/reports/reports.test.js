// Certified Report Layer 테스트:
//   node --test server/reports/reports.test.js
//
// 라이브 DB 없이 검증할 수 있는 것만 다룬다. 값 대조(리포트 vs 지표)는 실제 연결이
// 있어야 의미가 있어 여기 없다 — 아래 "원문 대조"가 그 자리를 대신한다.
import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import {
  getReport, listReports, loadReportRegistry, sha256, sqlSha256Matches, ReportError,
  renderReportCatalogForPrompt, reportDimensionNames, reportExtraParameters, distinctiveColumnsInText,
} from './registry.js'
import { validateReportParameters, SC_ALL, MAX_MULTI_VALUES } from './parameterValidator.js'
import { buildBindParameters } from './executor.js'
import {
  chartableMeasures, projectColumns, projectReportView, REPORT_VIEW_PRESETS, rollupReportRows, DIMENSION_ALIASES,
  resolveSelectedColumns, filterRowsByDimension, filterRowsByMeasure, numeratorColumns,
} from './projection.js'
import { funnelMonthSeriesForParams } from './series.js'
import {
  resolveReportRequest, SC_DISPLAY, GROUPABLE_DIMENSIONS, ROLLUP_SUGGESTION_ORDER,
  buildRunCertifiedReportTool,
} from '../agentic-bi/reportIntent.js'
import {
  cacheKey, getCached, setCached, clearCache, cacheSize, ttlFor,
  TTL_CLOSED_PERIOD_MS, TTL_OPEN_PERIOD_MS, MAX_ENTRIES,
} from './cache.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const report = getReport('activity_funnel_status')
const contract = report.contract

function validate(raw, scope = null) {
  return validateReportParameters(contract, raw, scope)
}

describe('등록 SQL이 GOLD 원문과 일치한다', () => {
  const source = fs.readFileSync(
    path.resolve(__dirname, 'sources', 'SQL_2a85a8c6b77b.sql'),
    'utf8',
  )

  test('원본 파일이 계약에 기록된 해시 그대로다', () => {
    assert.equal(sha256(source), contract.source.sha256)
  })

  test('원본에서 달라진 줄은 계약에 기록된 것뿐이다 (파라미터 DECLARE + pad 가드)', () => {
    const srcLines = source.split(/\r?\n/)
    const outLines = report.sqlText.split(/\r?\n/)
    const outSet = new Set(outLines.map((l) => l.trim()))

    // filter_trim_guard: LIKE 패딩의 컬럼을 LTRIM(RTRIM())으로 감싼 줄은 "달라진 줄"이
    // 아니라 "그 감싸기만 적용된 줄"이다. 원본 줄에 같은 변환을 걸어 등록본에 있으면
    // 통과시킨다 — 감싸기 외의 수정이 섞이면 여전히 걸린다.
    const trimGuarded = (line) => line.replace(
      /(LIKE\s+N'%,'\s*\+\s*)([A-Za-z_][A-Za-z_0-9]*\.(?:\[[^\]]+\]|[A-Za-z_][A-Za-z_0-9]*))(\s*\+\s*N',%')/g,
      (_, a, col, b) => `${a}LTRIM(RTRIM(${col}))${b}`,
    )

    const removed = srcLines
      .map((l) => l.trim())
      .filter((l) => l !== '' && !outSet.has(l) && !outSet.has(trimGuarded(l).trim()))

    // 원본에서 사라져도 되는 줄의 허용 목록. 여기 없는 로직 줄이 사라지면 실패한다.
    // (주석은 계약의 truncated_trailing_comment_closed / 파라미터 헤더 교체분이라 제외)
    const ALLOWED = [
      // parameters_bound: 파라미터 DECLARE 10개(@metric 포함)
      /^DECLARE @(Year|MonthNumber|Brand|DealerNm|GroupName|DeptNm|ActYn|ScName|CommonTpNm|metric)\b/i,
      // pad_null_guard: pad DECLARE 7개(가드 붙은 형태로 바뀜)
      /^DECLARE @\w+Pad\b/i,
      // pbi_measure_alignment: 기회실적의 자격활동 상관 2종만 제거된 상태다.
      // (계약실적 쪽 2종은 2026-07-31 재검증에서 복원했다 — 아래 별도 테스트가 존재를 고정한다)
      /^AND a\.sc_key\s+= l\.cl_sc_key$/,
      /^AND act\.common_tp_nm = lct\.common_tp_nm$/,
    ]

    const unexpected = removed.filter(
      (l) => !l.startsWith('/*') && !l.startsWith('--') && !ALLOWED.some((re) => re.test(l)),
    )
    assert.deepEqual(unexpected, [], `허용 목록에 없는 줄이 사라졌다:\n  ${unexpected.join('\n  ')}`)

    // 허용 목록이 실제로 다 쓰였는지도 확인 — 조건이 슬쩍 되살아나면 여기서 걸린다.
    for (const re of ALLOWED) {
      assert.ok(removed.some((l) => re.test(l)), `이 편차가 사라졌다(되살아났을 수 있음): ${re}`)
    }
  })

  test('계약이 원본과의 차이를 빠짐없이 문서화하고 있다', () => {
    const ids = contract.source.deviations.map((d) => d.id).sort()
    assert.deepEqual(ids, ['filter_trim_guard', 'pad_null_guard', 'parameters_bound', 'pbi_measure_alignment', 'pbi_measure_alignment_v2', 'truncated_trailing_comment_closed'])
    for (const d of contract.source.deviations) assert.ok(d.why?.trim(), `${d.id}에 사유가 없다`)
  })

  test('파생 변수·SC 3분기·중복제거 규칙이 모두 남아있다', () => {
    const sql = report.sqlText
    // 파생 DECLARE 8개(@PeriodStart/@PeriodEnd 한 줄 + 패딩 7개)
    assert.equal(sql.split(/\r?\n/).filter((l) => /^DECLARE/i.test(l)).length, 8)
    assert.match(sql, /IF @ScName IS NULL/)
    assert.match(sql, /ROW_NUMBER\(\) OVER/)
    assert.match(sql, /sc_first=1/)
    // 상위 grain 중복제거가 사라지면 합계의 계약목표가 부풀려진다.
    assert.match(sql, /SUM\(CASE WHEN sc_first=1 THEN ISNULL\(cntrct_tgt_sc,0\) ELSE 0 END\)/)
  })

  test('파라미터는 바인딩되므로 본문에 DECLARE가 남으면 안 된다', () => {
    for (const p of contract.parameters) {
      assert.doesNotMatch(
        report.sqlText,
        new RegExp(`^DECLARE\\s+@${p.name}\\b`, 'mi'),
        `@${p.name}이 여전히 선언돼 있다 — 바인딩 값이 덮어써지지 않는다`,
      )
    }
  })

  // 아래 두 개는 라이브 실행에서 실제로 리포트를 못 쓰게 만들었던 결함이다.
  // 둘 다 "에러 없이 조용히" 또는 "실행 자체 거부"로 나타나서 눈으로는 못 잡는다.
  test('주석이 짝을 이룬다 — 원본은 잘려 있어 실행 자체가 거부됐다', () => {
    const opens = (report.sqlText.match(/\/\*/g) || []).length
    const closes = (report.sqlText.match(/\*\//g) || []).length
    assert.equal(opens, closes, `주석 불균형: /*=${opens} */=${closes} → "Missing end comment mark" 오류가 난다`)
  })

  test("pad 변수에 NULL 가드가 있다 — 없으면 '전체 조회'가 빈 결과가 된다", () => {
    // Fabric에서 N',' + NULL + N',' 는 ',,' 다(NULL 아님). 가드가 없으면
    // (@Pad IS NULL OR ...) 가 무력화돼 elig_user가 0명이 되고 리포트 전체가 빈다.
    const bare = report.sqlText.split(/\r?\n/).filter(
      (l) => /Pad\s+NVARCHAR/.test(l) && !/CASE WHEN @\w+ IS NULL THEN NULL/.test(l),
    )
    assert.deepEqual(bare, [], `NULL 가드 없는 pad: ${bare.join(' | ')}`)
    assert.equal((report.sqlText.match(/CASE WHEN @\w+ IS NULL THEN NULL ELSE N','/g) || []).length, 7)
  })

  test('기회실적은 상관을 걸지 않고, 계약실적은 건다', () => {
    // 2026-07-31 재검증: 브랜드 필터(TOYOTA+LEXUS)를 적용한 올바른 기준으로 다시 재보니
    // 계약 쪽은 상관을 걸어야 맞았다(1,586 → 1,531, 검증된 1-1 리포트 1,534).
    // 기회 쪽은 걸지 않는 게 맞다(8,696으로 1-1의 8,692와 일치).
    for (const frag of [
      'a.sc_key  = l.cl_sc_key',             // lead_actual SC 상관 — 없어야 함
      'act.common_tp_nm = lct.common_tp_nm', // lead_actual 활동유형 상관 — 없어야 함
    ]) {
      assert.ok(!report.sqlText.includes(frag), `기회실적에 상관 조건이 남아있다: ${frag}`)
    }
    for (const frag of [
      'a.sc_key   = c.cn_sc_key',            // cntrct_actual SC 상관 — 있어야 함
      'act.common_tp_nm = ct.common_tp_nm',  // cntrct_actual 활동유형 상관 — 있어야 함
    ]) {
      assert.ok(report.sqlText.includes(frag), `계약실적의 상관 조건이 사라졌다: ${frag}`)
    }
  })

  test('Power BI 정렬: 활동그룹·부재중은 기회실적에만 남는다', () => {
    // 계약실적은 이 둘까지 빼야 PBI와 맞고, 기회실적은 유지해야 맞는다 — 두 측정값의
    // 정의가 원래 다르다. 한쪽에만 적용됐는지 개수로 고정한다(분기 A/B 각 1회씩).
    const cntrctBlocks = report.sqlText.split('/* 10. 계약 실적').slice(1)
      .map((b) => b.slice(0, b.indexOf('/* 9/11. 계약 목표')))
    assert.equal(cntrctBlocks.length, 2, '분기 A/B 두 블록이어야 한다')
    for (const b of cntrctBlocks) {
      assert.ok(!b.includes('tp_grp_1'), '계약실적에 활동그룹 조건이 남아있다')
      assert.ok(!b.includes('부재중'), '계약실적에 부재중 조건이 남아있다')
    }
    // 기회실적 쪽에는 그대로 있어야 한다.
    const leadBlocks = report.sqlText.split('/* 6. 기회 실적').slice(1)
      .map((b) => b.slice(0, b.indexOf('/* 10. 계약 실적')))
    assert.equal(leadBlocks.length, 2)
    for (const b of leadBlocks) {
      assert.ok(b.includes('tp_grp_1'), '기회실적의 활동그룹 조건이 사라졌다')
      assert.ok(b.includes('부재중'), '기회실적의 부재중 조건이 사라졌다')
    }
  })

  test('11개 지표가 모두 출력에 있다', () => {
    for (const col of Object.keys(contract.column_semantics)) {
      assert.match(report.sqlText, new RegExp(`AS \\[${col}\\]`), `${col} 컬럼이 없다`)
    }
    assert.equal(Object.keys(contract.column_semantics).length, 11)
  })
})

describe('퍼널 전체 구조 리포트 (1-1 페이지 최종 GOLD)', () => {
  const full = getReport('funnel_full_structure')
  const fc = full.contract

  test('엑셀 셀이 아니라 온전한 원문을 정본으로 삼았다', () => {
    // 워크북 G27은 32,767자 상한에 걸려 JOIN 중간에서 잘려 있다.
    assert.equal(fc.source.cell, 'G27')
    assert.ok(fc.source.untruncated_source, '온전한 원문 경로가 기록돼 있어야 한다')
    assert.ok(full.sqlText.length > 32767, `등록 SQL이 상한 이하다(${full.sqlText.length}) — 잘린 셀을 쓴 것일 수 있다`)
  })

  test('잘렸던 지점 이후의 SQL이 실제로 들어있다', () => {
    // 엑셀본은 여기서 끊겼다: "...CTDAC ON FK.sc_key = CTDAC.sc_key AND"
    assert.match(full.sqlText, /contract_td_activity_count AS CTDAC/)
    assert.match(full.sqlText, /FROM final_result/, '최종 SELECT가 없다 — 잘린 본문이다')
    assert.match(full.sqlText, /ORDER BY _sort_group/)
  })

  test('파라미터 DECLARE는 제거되고 고정 상수·파생 변수는 남아있다', () => {
    for (const p of fc.parameters) {
      assert.doesNotMatch(full.sqlText, new RegExp(`^DECLARE\\s+@${p.name}\\b`, 'mi'), `@${p.name}이 선언돼 있다`)
    }
    for (const keep of ['@tp_grp_1', '@exclude_facade', '@month_start', '@as_of_date', '@sc_filter']) {
      assert.match(full.sqlText, new RegExp(`DECLARE\\s+${keep}\\b`), `${keep} 선언이 사라졌다`)
    }
  })

  test('23개 측정값이 모두 출력 컬럼으로 존재한다', () => {
    assert.equal(Object.keys(fc.column_semantics).length, 23)
    for (const col of Object.keys(fc.column_semantics)) {
      assert.ok(full.sqlText.includes(`[${col}]`), `${col} 컬럼이 SQL에 없다`)
    }
  })

  test('시승 지표 10개가 포함돼 있다 — 세만틱에서 unresolved인 영역', () => {
    const td = Object.keys(fc.column_semantics).filter((c) => c.includes('시승'))
    assert.equal(td.length, 10, `시승 컬럼: ${td.join(', ')}`)
  })

  test('합계 행은 집계구분으로 구분한다 (v3의 딜러=합계와 다름)', () => {
    assert.equal(fc.total_row.detect_by.column, '집계구분')
    assert.equal(fc.total_row.detect_by.equals, '합계')
    assert.match(full.sqlText, /N'합계'/)
    assert.match(full.sqlText, /N'상세'/)
  })

  test('비율 8개는 분자·분모가 모두 실제 출력 컬럼을 가리킨다', () => {
    const cols = new Set(Object.keys(fc.column_semantics))
    const ratios = Object.entries(fc.column_semantics).filter(([, v]) => v.type === 'ratio')
    assert.equal(ratios.length, 8)
    for (const [name, v] of ratios) {
      // 분자가 출력에 없는 비율이 하나 있다 — 계약 진행률. GOLD가 표시 계약건수(CAC)와
      // 다른 CTE(CPC)를 분자로 쓰는데 그 값은 컬럼으로 나오지 않는다. 그런 비율은
      // recompute_impossible로 명시하고, 재계산을 걸지 않았는지까지 확인한다.
      if (v.recompute_impossible) {
        assert.equal(v.numerator, undefined, `${name}: 재계산 불가인데 분자가 적혀 있다 — 그 값으로 계산될 수 있다`)
        assert.ok(!v.recompute_ratio, `${name}: 재계산 불가인데 recompute_ratio가 켜져 있다`)
        assert.equal(v.direct_sum_forbidden, true, `${name}: 재계산도 못 하면 합산도 막아야 한다`)
      } else {
        assert.ok(cols.has(v.numerator), `${name}의 분자 '${v.numerator}'가 출력에 없다`)
      }
      assert.ok(cols.has(v.denominator), `${name}의 분모 '${v.denominator}'가 출력에 없다`)
      assert.equal(v.direct_average_forbidden, true)
    }
  })

  test('두 리포트는 서로 다른 페이지의 서로 다른 정의다', () => {
    // 1-1의 계약건수(당월활동실적)와 1-2의 계약 실적은 값이 다르다(실측 1,558 vs 1,611).
    // 같은 것으로 착각해 한쪽을 다른 쪽에 맞추려 하면 안 된다.
    assert.notEqual(fc.source.sheet, contract.source?.sheet)
    assert.equal(fc.dimension_columns.branch_a.includes('활동유형분류'), true)
    assert.equal(contract.dimension_columns.branch_a.includes('활동유형분류'), false)
  })
})

describe('퍼널 객체 표시 프리셋', () => {
  const full = getReport('funnel_full_structure')
  const fullContract = full.contract
  const metricValues = {
    '영업활동 건 수': 100,
    '영업활동 당월 목표': 200,
    '영업기회 건 수(당월활동실적)': 40,
    '영업기회 건 수(당월전체실적)': 40,
    '영업기회 당월 목표': 80,
    '계약건수(당월전체실적)': 10,
    '시승건수(당월전체실적/actual_cnt 기준)': 20,
    '시승건수(당월활동실적/시승완료)': 20,
    '시승건수(당월활동실적/시승취소건 제외)': 20,
    '시승건수(당월전체실적/lead_key 기준)': 20,
    '시승 당월 목표': 50,
    '시승에서 계약으로 당월활동실적': 10,
    '시승에서 계약으로 당월전체실적': 10,
    '계약건수(당월활동실적)': 10,
    '계약 당월 목표': 25,
    '영업활동 진행률': 0.5,
    '영업활동에서 영업기회로의 전환율': 0.4,
    '영업기회 진행률': 0.5,
    '영업기회에서 계약으로 전환율': 0.25,
    '영업기회에서 시승으로 전환율': 0.5,
    '시승 진행률': 0.4,
    '시승에서 계약으로 전환율': 0.5,
    '계약 진행률': 0.4,
  }
  const row = (집계구분, 딜러, 활동유형 = '자사출고', multiplier = 1, 활동유형분류 = '관계형성') => ({
    집계구분,
    브랜드: 딜러 ? '렉서스' : null,
    딜러,
    전시장: 딜러 ? '강남' : null,
    팀: 딜러 ? '1팀' : null,
    SC: 딜러 ? '김철수' : null,
    활동유형분류: 딜러 ? 활동유형분류 : null,
    활동유형: 딜러 ? 활동유형 : null,
    ...Object.fromEntries(Object.entries(metricValues).map(([key, value]) => [key, typeof value === 'number' ? value * multiplier : value])),
  })
  const result = {
    reportId: 'funnel_full_structure',
    branch: 'a',
    params: { year: 2026, month: 7 },
    dimensionColumns: fullContract.dimension_columns.branch_a,
    rows: [
      row('상세', '렉서스 강남', '자사출고', 1, '관계형성'),
      row('상세', '렉서스 강남', '잠재고객', 2, '기회창출'),
      row('상세', '렉서스 분당', '온라인 유입', 4, '기회창출'),
      row('합계', null, '전체', 99),
    ],
  }

  test('프리셋 목록이 리포트와 렌더러를 명시한다', () => {
    assert.equal(REPORT_VIEW_PRESETS.funnel_core_wide.reportId, 'funnel_full_structure')
    assert.equal(REPORT_VIEW_PRESETS.funnel_core_wide.chartCode, 'table')
    assert.equal(REPORT_VIEW_PRESETS.funnel_stage_chart.chartCode, 'funnel')
    assert.equal(REPORT_VIEW_PRESETS.funnel_pyramid_table.chartCode, 'table')
    assert.equal(REPORT_VIEW_PRESETS.funnel_pyramid_chart.chartCode, 'funnel_pyramid')
  })

  test('넓은 KPI 표는 요청한 실적·목표·진행률 컬럼으로 투영된다', () => {
    const p = projectReportView(result, null, 'funnel_core_wide')
    assert.equal(p.chartCode, 'table')
    assert.ok(p.columns.includes('월'))
    assert.ok(p.columns.includes('딜러'))
    assert.ok(p.columns.includes('활동 실적'))
    assert.ok(p.columns.includes('계약 진행률'))
    assert.equal(p.rows.length, 2)
    assert.equal(p.rows[0].연도, 2026)
    assert.equal(p.rows[0].월, '7월')
    assert.equal(p.rows[0].딜러, '렉서스 강남')
    assert.equal(p.rows[0]['활동 실적'], 300)
    assert.equal(p.rows[0]['계약 목표'], 75)
    // 계약 진행률은 접었을 때 비운다. GOLD가 표시 계약건수(CAC)가 아니라 CPC를 분자로
    // 쓰는데 그 값이 출력 컬럼에 없어 재계산이 불가능하다. 전에는 계약건수로 다시 계산해
    // 0.4를 냈지만, 2026-04 렉서스 강남 실측으로 GOLD는 35.49%(=208/586)이고 그 방식은
    // 45.05%(=264/586)라 9.6%p 부풀려진 값이었다. 틀린 값을 내느니 비운다.
    assert.equal(p.rows[0]['계약 진행률'], null)
    assert.deepEqual(p.filterFields, ['월', '딜러'])
    assert.deepEqual(p.totalRowIndexes, [])
  })

  test('단계별 표는 활동→영업기회→시승→계약 행으로 바뀐다', () => {
    const p = projectReportView(result, null, 'funnel_stage_rows')
    assert.equal(p.chartCode, 'table')
    assert.equal(p.rows.length, 8)
    assert.deepEqual(p.rows.slice(0, 4).map((r) => r.단계), ['활동', '영업기회', '시승', '계약'])
    assert.equal(p.rows[0].딜러, '렉서스 강남')
    assert.equal(p.rows[0].실적, 300)
    assert.equal(p.rows[1].목표, 240)
    assert.equal(p.rows[2].진행률, 0.4)
    assert.deepEqual(p.totalRowIndexes, [])
  })

  test('퍼널 차트 프리셋은 상세 행을 딜러별로 합쳐 차트 데이터로 쓴다', () => {
    const p = projectReportView(result, null, 'funnel_stage_chart')
    assert.equal(p.chartCode, 'funnel')
    assert.equal(p.rows.length, 8)
    assert.deepEqual(p.rows.slice(0, 4).map((r) => r.단계), ['활동', '영업기회', '시승', '계약'])
    assert.equal(p.rows[0].실적, 300)
    assert.equal(p.rows[0].딜러, '렉서스 강남')
    assert.equal(p.rows.filter((r) => r.단계 === '활동').reduce((sum, row) => sum + row.실적, 0), 700)
    assert.deepEqual(p.totalRowIndexes, [])
  })

  test('역삼각형 퍼널 표로 보기 프리셋은 채널별 숫자와 전환율 행을 만든다', () => {
    const p = projectReportView(result, null, 'funnel_pyramid_table')
    assert.equal(p.chartCode, 'table')
    assert.ok(p.columns.includes('단계'))
    assert.ok(p.columns.includes('항목'))
    assert.ok(p.columns.includes('관계형성활동'))
    assert.ok(p.columns.includes('SC활동'))
    assert.ok(p.columns.includes('내방/내전'))
    assert.ok(p.columns.includes('온라인유입'))
    assert.equal(p.rows.length, 32)

    const activityCount = p.rows.find((r) => r.딜러 === '렉서스 강남' && r.단계 === '활동' && r.항목 === '퍼널 숫자')
    assert.equal(activityCount['단계 합계'], 300)
    assert.equal(activityCount['전체 전환율'], '-')
    assert.equal(activityCount['관계형성활동'], 100)
    assert.equal(activityCount.SC활동, 200)
    assert.equal(activityCount['내방/내전'], 0)

    const activityShare = p.rows.find((r) => r.딜러 === '렉서스 강남' && r.단계 === '활동' && r.항목 === '단계내 비중')
    assert.equal(activityShare['관계형성활동'], '33.3%')
    assert.equal(activityShare.SC활동, '66.7%')

    const opportunityPrev = p.rows.find((r) => r.딜러 === '렉서스 강남' && r.단계 === '기회' && r.항목 === '전단계대비')
    assert.equal(opportunityPrev['관계형성활동'], '40.0%')
    assert.equal(opportunityPrev.SC활동, '40.0%')

    const testDriveBase = p.rows.find((r) => r.딜러 === '렉서스 강남' && r.단계 === '시승' && r.항목 === '활동대비')
    assert.equal(testDriveBase['관계형성활동'], '20.0%')
    assert.equal(testDriveBase.SC활동, '20.0%')
    assert.deepEqual(p.filterFields, ['월', '딜러'])
    assert.deepEqual(p.totalRowIndexes, [])
  })

  test('역삼각형 퍼널 구조 프리셋은 채널별 단계 합계를 차트 데이터로 만든다', () => {
    const p = projectReportView(result, null, 'funnel_pyramid_chart')
    assert.equal(p.chartCode, 'funnel_pyramid')
    assert.ok(p.columns.includes('단계'))
    assert.ok(p.columns.includes('단계 합계'))
    assert.ok(p.columns.includes('관계형성활동'))
    assert.ok(p.columns.includes('SC활동'))
    assert.ok(p.columns.includes('내방/내전'))
    assert.ok(p.columns.includes('온라인유입'))
    assert.equal(p.title, '평시 퍼널')
    assert.equal(p.rows.length, 8)

    const activity = p.rows.find((r) => r.딜러 === '렉서스 강남' && r.단계 === '활동')
    assert.equal(activity['단계 합계'], 300)
    assert.equal(activity['관계형성활동'], 100)
    assert.equal(activity.SC활동, 200)
    assert.equal(activity['내방/내전'], 0)

    const contract = p.rows.find((r) => r.딜러 === '렉서스 분당' && r.단계 === '계약')
    assert.equal(contract['단계 합계'], 40)
    assert.equal(contract.온라인유입, 40)
    assert.deepEqual(p.filterFields, ['월', '딜러'])
    assert.deepEqual(p.totalRowIndexes, [])
  })

  test('월이 비어 있는 퍼널 프리셋은 현재 연도의 지난 월들을 실행 대상으로 잡는다', () => {
    const months = funnelMonthSeriesForParams(
      'funnel_full_structure',
      { Year: 2026, MonthNumber: null },
      'funnel_core_wide',
      new Date('2026-07-31T00:00:00+09:00'),
    )
    assert.deepEqual(months, [1, 2, 3, 4, 5, 6, 7])
    assert.deepEqual(funnelMonthSeriesForParams('funnel_full_structure', { Year: 2026, MonthNumber: 7 }, 'funnel_core_wide'), [])
    assert.deepEqual(funnelMonthSeriesForParams('funnel_full_structure', { Year: 2026, MonthNumber: null }, null), [])
  })
})

describe('과거 N개월 퍼널 실적 리포트 (4. 목표 관리 최종 GOLD)', () => {
  const tgt = getReport('target_management_funnel_avg')
  const tc = tgt.contract

  test('잘렸던 CTE 계산식 이후가 실제로 들어있다', () => {
    assert.ok(tgt.sqlText.length > 32767, '등록 SQL이 상한 이하 — 잘린 셀을 쓴 것일 수 있다')
    assert.match(tgt.sqlText, /CAST\(@lookback_months AS FLOAT\)/)
    assert.match(tgt.sqlText, /ORDER BY \[연도\], \[월\], ord/)
  })

  test('pad NULL 가드가 9개 붙어있다 — 없으면 전체 조회가 빈 결과가 된다', () => {
    const guards = (tgt.sqlText.match(/CASE WHEN @\w+ IS NULL THEN NULL ELSE N','/g) || []).length
    assert.equal(guards, 9)
    // 상수에서 파생되는 excl_* 3개는 NULL이 될 수 없어 가드를 넣지 않았다.
    for (const v of ['excl_deptPad', 'excl_namePad', 'excl_usersPad']) {
      const line = tgt.sqlText.split('\n').find((l) => l.includes(`@${v}`) && l.includes('DECLARE'))
      assert.ok(line && !line.includes('CASE WHEN'), `${v}에 불필요한 가드가 붙었다`)
    }
  })

  test('lookback_months에 기본값이 있다 — NULL이면 TOP(NULL)로 실행이 실패한다', () => {
    const spec = tc.parameters.find((p) => p.name === 'lookback_months')
    assert.equal(spec.default, 3)
    const { params } = validateReportParameters(tc, { year: '2026', month: '4' })
    assert.equal(params.lookback_months, 3, '기본값이 적용되지 않았다')
  })

  test('SC 3분기 구조라 출력 스키마가 바뀐다', () => {
    assert.equal(tc.parameters.find((p) => p.name === 'sc_name').schema_switching, true)
    assert.equal(tc.dimension_columns.branch_a.includes('SC'), false)
    assert.equal(tc.dimension_columns.branch_b.includes('SC'), true)
  })

  test('영업기회·계약은 상세 행을 더해도 합계와 맞지 않으므로 직접 합산 금지', () => {
    // 합계는 tot CTE(유형 조건 없는 스코프 전체)에서 나온다 — 활동유형 축으로
    // 더하면 같은 리드가 여러 유형에 걸쳐 중복된다.
    for (const col of ['영업기회', '계약']) {
      assert.equal(tc.column_semantics[col].direct_sum_forbidden, true, col)
    }
    assert.equal(tc.column_semantics['활동'].type, 'additive')
  })

  test('리포트마다 출처(시트 + NO)가 서로 다르다', () => {
    // "4. 목표 관리"처럼 한 페이지에 여러 리포트가 있을 수 있으므로 NO까지 봐야 한다
    // (NO=1 월 목표 / NO=2 과거 N개월 실적은 서로 다른 정의다).
    const keys = listReports().map((r) => {
      const s = r.contract.source || {}
      return `${s.sheet ?? s.sql_id ?? '?'}#${s.no ?? s.value_name ?? ''}`
    })
    assert.equal(new Set(keys).size, keys.length, `출처가 겹친다: ${keys.join(' / ')}`)
  })
})

describe('등록된 인증 리포트 전체 (공통 규약)', () => {
  const all = listReports()

  test('등록된 리포트의 report_id가 겹치지 않는다', () => {
    assert.ok(all.length >= 6, `리포트가 줄었다: ${all.length}`)
    assert.equal(new Set(all.map((r) => r.report_id)).size, all.length)
  })

  test('모두 문자열 치환이 아니라 드라이버 바인딩을 쓰고 LLM 재작성을 금지한다', () => {
    for (const r of all) {
      assert.equal(r.contract.execution.parameter_binding, 'driver_bind', r.report_id)
      assert.equal(r.contract.execution.allow_llm_sql_rewrite, false, r.report_id)
      assert.equal(r.contract.execution.mode, 'single_query', r.report_id)
      assert.equal(r.contract.execution.database, 'KPI_W', r.report_id)
    }
  })

  test('파라미터 DECLARE가 본문에 남아있지 않다 — 남으면 바인딩 값이 덮어써진다', () => {
    for (const r of all) {
      for (const p of r.contract.parameters) {
        assert.doesNotMatch(r.sqlText, new RegExp(`^\\s*DECLARE\\s+@${p.name}\\b`, 'mi'),
          `${r.report_id}: @${p.name}이 선언돼 있다`)
      }
    }
  })

  test('pad 변수를 쓰는 리포트는 NULL 가드가 빠짐없이 붙어있다', () => {
    // 가드가 없으면 "슬라이서 비움 = 전체"가 "결과 없음"으로 뒤집힌다.
    // 실제로 hotboard_meeting은 sc_name='ALL'에서 91행 → 0행,
    // target_saved_status는 210행 → 2,662행이어야 할 것이 210행으로 나왔다.
    //
    // 제외 대상은 "NULL이 될 수 없는 상수에서 파생된 pad"뿐이다. 워크북마다 명명이
    // 달라서(@exclude_users / @ExclUserIds / @CONST_TP_GRP) 세 가지를 모두 본다.
    // 선언이 여러 줄에 걸칠 수 있으므로(가드가 다음 줄에 오는 경우) 줄이 아니라
    // 세미콜론까지의 "문장" 단위로 본다. 줄 단위로 보면 멀쩡한 선언을 오탐한다.
    const FROM_CONSTANT = /REPLACE\(@(exclude_|Excl|CONST_)/i
    const DECL = /^[ \t]*DECLARE\s+@\w*Pad\s+NVARCHAR\([^)]*\)\s*=[\s\S]*?;/gim
    for (const r of all) {
      const bare = (r.sqlText.match(DECL) || []).filter(
        (stmt) => !FROM_CONSTANT.test(stmt) && !/CASE WHEN @\w+ IS NULL THEN NULL/i.test(stmt),
      )
      assert.deepEqual(bare, [], `${r.report_id}에 가드 없는 pad:\n  ${bare.map((b) => b.replace(/\s+/g, ' ').trim()).join('\n  ')}`)
    }
  })

  test('합계 행 규약이 계약과 일치한다', () => {
    for (const r of all) {
      const declared = r.contract.execution.preserve_total_row
      const hasRule = !!r.contract.total_row?.detect_by
      assert.equal(hasRule, declared,
        `${r.report_id}: preserve_total_row=${declared}인데 total_row 규칙은 ${hasRule ? '있음' : '없음'}`)
    }
  })

  test('합계 행을 찾는 컬럼이 SQL이 실제로 표시하는 컬럼과 같다', () => {
    // sc_delivery_status에서 실제로 겪은 함정: 다른 리포트가 전부 딜러 컬럼에
    // '합계'를 넣길래 같은 패턴으로 썼는데, 이 리포트만 브랜드 컬럼에 넣는다.
    // 그러면 합계 행이 상세로 분류되고 "합계 행이 없다"는 잘못된 결론에 이른다.
    // 컬럼 이름이 dimension_columns에 있는지만 봐서는 못 잡으므로 SQL 본문을 본다.
    for (const r of all) {
      const rule = r.contract.total_row?.detect_by
      if (!rule) continue
      assert.ok(
        r.contract.dimension_columns.branch_a.includes(rule.column)
          || r.contract.dimension_columns.branch_b.includes(rule.column),
        `${r.report_id}: 합계 탐지 컬럼 '${rule.column}'이 출력 컬럼 목록에 없다`,
      )
      // SQL에 표식 자체가 있어야 한다.
      assert.ok(
        r.sqlText.includes(`'${rule.equals}'`),
        `${r.report_id}: SQL에 '${rule.equals}' 표식이 없는데 합계 행을 찾으려 한다`,
      )
      // 별칭을 인라인으로 붙인 SQL이면(N'합계' AS [브랜드]) 그 컬럼과 일치해야 한다.
      // 위치 기반 SELECT(N'합계', NULL, NULL …)는 정적으로 컬럼을 알 수 없어 건너뛴다.
      const aliased = [...r.sqlText.matchAll(new RegExp(`N?'${rule.equals}'\\s+AS\\s+\\[([^\\]]+)\\]`, 'g'))]
        .map((m) => m[1])
      if (aliased.length) {
        assert.ok(
          aliased.includes(rule.column),
          `${r.report_id}: SQL은 '${rule.equals}'를 [${[...new Set(aliased)].join('], [')}]에 넣는데 `
            + `계약은 [${rule.column}]에서 찾는다 — 합계 행이 상세로 분류된다`,
        )
      }
    }
  })

  test('모든 측정값에 집계 규칙(type)이 선언돼 있다', () => {
    for (const r of all) {
      for (const [col, sem] of Object.entries(r.contract.column_semantics)) {
        assert.ok(sem.type, `${r.report_id}의 ${col}에 type이 없다`)
      }
    }
  })

  test('비율 컬럼의 분자·분모는 실제 출력 컬럼을 가리킨다', () => {
    for (const r of all) {
      const cols = new Set(Object.keys(r.contract.column_semantics))
      for (const [col, sem] of Object.entries(r.contract.column_semantics)) {
        if (sem.type !== 'ratio') continue
        // GOLD가 출력하지 않는 값을 분자로 쓰는 비율이 있다(계약 진행률). 그런 건
        // 분자를 적지 않고 recompute_impossible로 선언한다 — 적어두면 그 컬럼으로
        // 재계산돼 조용히 다른 값이 된다.
        if (sem.recompute_impossible) {
          assert.equal(sem.numerator, undefined, `${r.report_id} ${col}: 재계산 불가인데 분자가 적혀 있다`)
          assert.ok(!sem.recompute_ratio, `${r.report_id} ${col}: 재계산 불가인데 recompute_ratio가 켜져 있다`)
        } else {
          // 분자는 컬럼 하나이거나 여러 컬럼의 합이다(달성률 = (실적+취소)/타겟).
          for (const n of numeratorColumns(sem)) {
            assert.ok(cols.has(n), `${r.report_id} ${col}: 분자 '${n}' 없음`)
          }
        }
        assert.ok(cols.has(sem.denominator), `${r.report_id} ${col}: 분모 '${sem.denominator}' 없음`)
      }
    }
  })

  test('권한이 아직 강제되지 않음을 모두 명시하고 있다', () => {
    // 서버 인증이 없어 authorizationScope는 보안 경계가 아니다. 계약이 이를 숨기면 안 된다.
    for (const r of all) assert.equal(r.contract.authorization.enforced, false, r.report_id)
  })
})

describe('SQL 해시 검증', () => {
  test('SQL line-ending differences do not break the contract hash', () => {
    const lfSql = 'select 1 as value\nfrom dual\n'
    const crlfSql = lfSql.replace(/\n/g, '\r\n')
    assert.equal(sqlSha256Matches(crlfSql, sha256(lfSql)), true)
    assert.equal(sqlSha256Matches(`${crlfSql}-- changed\r\n`, sha256(lfSql)), false)
  })

  test('본문이 바뀌면 로드 자체가 실패한다', () => {
    const sqlPath = path.join(__dirname, contract.sql_file)
    const original = fs.readFileSync(sqlPath, 'utf8')
    try {
      fs.writeFileSync(sqlPath, original + '\n-- 몰래 추가된 줄\n', 'utf8')
      assert.throws(
        () => loadReportRegistry({ force: true }),
        (e) => e instanceof ReportError && e.code === 'sql_hash_mismatch',
      )
    } finally {
      fs.writeFileSync(sqlPath, original, 'utf8')
      loadReportRegistry({ force: true })
    }
  })
})

describe('파라미터 검증', () => {
  test('빈 값·공백은 NULL(전체)로 정규화된다', () => {
    const r = validate({ Year: '', DealerNm: ['  ', ''] })
    assert.ok(r.ok)
    assert.equal(r.params.Year, null)
    assert.equal(r.params.DealerNm, null)
  })

  test('다중 값은 콤마로 이어 붙이고 중복은 제거한다', () => {
    const r = validate({ DealerNm: ['렉서스 강남', '렉서스 분당', '렉서스 강남'] })
    assert.ok(r.ok)
    assert.equal(r.params.DealerNm, '렉서스 강남,렉서스 분당')
  })

  test('값에 콤마가 있으면 조용히 넘기지 않고 거부한다', () => {
    const r = validate({ DealerNm: ['강남, 서초'] })
    assert.equal(r.ok, false)
    assert.match(r.errors[0], /콤마/)
  })

  test('허용값 밖의 재직여부는 거부한다', () => {
    assert.equal(validate({ ActYn: ['휴직'] }).ok, false)
    assert.equal(validate({ ActYn: ['재직'] }).ok, true)
  })

  test('월 범위를 벗어나면 거부한다', () => {
    assert.equal(validate({ MonthNumber: 13 }).ok, false)
    assert.equal(validate({ MonthNumber: 0 }).ok, false)
    assert.equal(validate({ MonthNumber: 7 }).ok, true)
  })

  test('계약에 없는 파라미터는 거부한다', () => {
    const r = validate({ DropTable: 'x' })
    assert.equal(r.ok, false)
    assert.match(r.errors[0], /없는 파라미터/)
  })

  test('값 개수 상한을 넘으면 거부한다', () => {
    const many = Array.from({ length: MAX_MULTI_VALUES + 1 }, (_, i) => `SC${i}`)
    assert.equal(validate({ ScName: many }).ok, false)
  })

  test("ScName의 'ALL'은 특정 이름과 섞일 수 없다", () => {
    assert.equal(validate({ ScName: ['ALL', '김철수'] }).ok, false)
  })

  test('PascalCase 요청 파라미터가 snake_case 계약명으로 정규화된다', () => {
    const fullContract = getReport('funnel_full_structure').contract
    const r = validateReportParameters(fullContract, {
      Year: 2026,
      MonthNumber: null,
      Brand: null,
      DealerNm: null,
      GroupName: null,
      DeptNm: null,
      ActYn: null,
      ScName: null,
      CommonTpNm: null,
    })

    assert.ok(r.ok, JSON.stringify(r.errors))
    assert.equal(r.params.year, 2026)
    assert.equal(r.params.month, null)
    assert.equal(r.params.dealer_nm, null)
    assert.equal(r.params.sc_name, null)

    const bind = buildBindParameters(fullContract, r.params)
    assert.deepEqual(bind.year, { type: 'int', value: 2026 })
    assert.equal(bind.Year, undefined)
  })

  test('snake_case 요청 파라미터도 PascalCase 계약명으로 정규화된다', () => {
    const r = validate({
      year: 2026,
      month: 7,
      dealer_nm: ['렉서스 강남'],
      sc_name: SC_ALL,
    })

    assert.ok(r.ok, JSON.stringify(r.errors))
    assert.equal(r.params.Year, 2026)
    assert.equal(r.params.MonthNumber, 7)
    assert.equal(r.params.DealerNm, '렉서스 강남')
    assert.equal(r.params.ScName, SC_ALL)
  })
})

describe('SC 3분기 — 필터가 아니라 출력 스키마', () => {
  test('NULL이면 SC 열 없는 표', () => {
    const r = validate({})
    assert.equal(r.params.ScName, null)
    assert.deepEqual(contract.dimension_columns.branch_a.includes('SC'), false)
  })

  test("'ALL'이면 SC 열이 있는 전체 SC 표", () => {
    const r = validate({ ScName: SC_ALL })
    assert.equal(r.params.ScName, SC_ALL)
    assert.ok(contract.dimension_columns.branch_b.includes('SC'))
  })

  test('특정 이름이면 SC 열 + 해당 SC만', () => {
    const r = validate({ ScName: ['김철수'] })
    assert.equal(r.params.ScName, '김철수')
  })

  test('계약이 이 파라미터를 스키마 전환용으로 표시하고 있다', () => {
    const spec = contract.parameters.find((p) => p.name === 'ScName')
    assert.equal(spec.schema_switching, true)
  })
})

describe('바인딩', () => {
  test('계약의 모든 파라미터가 빠짐없이 바인딩된다', () => {
    const { params } = validate({ Year: 2026, MonthNumber: 7 })
    const bind = buildBindParameters(contract, params)
    assert.deepEqual(Object.keys(bind).sort(), contract.parameters.map((p) => p.name).sort())
    assert.deepEqual(bind.Year, { type: 'int', value: 2026 })
    assert.deepEqual(bind.Brand, { type: 'nvarchar', value: null })
  })

  test('계약이 문자열 치환이 아니라 드라이버 바인딩을 선언하고 있다', () => {
    assert.equal(contract.execution.parameter_binding, 'driver_bind')
    assert.equal(contract.execution.allow_llm_sql_rewrite, false)
    assert.equal(contract.execution.mode, 'single_query')
  })
})

describe('권한 교집합 (구조만 — 서버 인증 도입 전까지 보안 경계 아님)', () => {
  test('계약이 아직 강제되지 않음을 명시하고 있다', () => {
    assert.equal(contract.authorization.enforced, false)
  })

  test('전체 요청은 허용 범위로 좁혀진다', () => {
    const r = validate({}, { DealerNm: ['렉서스 강남'] })
    assert.ok(r.ok)
    assert.equal(r.params.DealerNm, '렉서스 강남')
  })

  test('허용 밖의 값은 조용히 빼지 않고 오류로 세운다', () => {
    const r = validate({ DealerNm: ['렉서스 강남', '렉서스 분당'] }, { DealerNm: ['렉서스 강남'] })
    assert.equal(r.ok, false)
    assert.match(r.errors[0], /권한 밖/)
  })

  test("ScName 'ALL'도 허용 범위로 좁혀진다", () => {
    const r = validate({ ScName: SC_ALL }, { ScName: ['김철수', '이영희'] })
    assert.ok(r.ok)
    assert.equal(r.params.ScName, '김철수,이영희')
  })
})

describe('컬럼 의미론과 차트 가드', () => {
  test('계약목표는 상위 grain 반복값이라 직접 합산이 금지돼 있다', () => {
    const sem = contract.column_semantics['계약목표']
    assert.equal(sem.type, 'repeated_higher_grain_value')
    assert.equal(sem.direct_sum_forbidden, true)
  })

  test('비율 5개는 직접 평균이 금지되고 재계산 규칙이 붙어있다', () => {
    for (const col of ['활동진척률', '기회전환률', '기회진척률', '계약전환률', '계약진행률']) {
      const sem = contract.column_semantics[col]
      assert.equal(sem.direct_average_forbidden, true, `${col}`)
      assert.equal(sem.recompute_ratio, true, `${col}`)
    }
  })

  test('차트 후보에서 금지 컬럼이 빠지고 이유가 함께 나온다', () => {
    const { allowed, rejected } = chartableMeasures('activity_funnel_status')
    assert.deepEqual(allowed.sort(), ['계약실적', '기회목표', '기회실적', '활동목표', '활동실적'].sort())
    const names = rejected.map((r) => r.column)
    assert.ok(names.includes('계약목표'))
    assert.ok(names.includes('계약진행률'))
    for (const r of rejected) assert.ok(r.reason, `${r.column}에 이유가 없다`)
  })

  test('additive 컬럼만 차트 후보다', () => {
    const { allowed } = chartableMeasures('activity_funnel_status')
    for (const col of allowed) {
      assert.equal(contract.column_semantics[col].type, 'additive')
    }
  })
})

describe('실행 설정', () => {
  test('계약의 DB명이 파이프라인이 쓰는 것과 같다', () => {
    // ktws는 스키마고 DB는 KPI_W다 — 헷갈리면 연결은 되는데 테이블을 못 찾는다.
    const pipeline = fs.readFileSync(path.resolve(__dirname, '..', 'agenticBiPipeline.js'), 'utf8')
    const m = pipeline.match(/const FABRIC_DB = '([^']+)'/)
    assert.ok(m, 'FABRIC_DB를 찾지 못했다')
    assert.equal(contract.execution.database, m[1])
  })
})

describe('SC 3분기 해석 (에이전트 인자 → 파라미터)', () => {
  // 2026-08-06: SC 근거가 없으면 되묻지 않고 팀 단위로 간다. 예전에는 LLM이 고르는
  // sc_display enum에 'unspecified'가 있어 확신이 조금만 부족해도 그것을 골랐고,
  // "SC별로 볼까요, 팀 단위로 볼까요?"가 답 대신 나갔다. 출력 스키마를 고르려고
  // 사용자에게 묻지 않는다 — SC를 말하지 않았다는 건 SC 단위를 원하지 않는다는 뜻이다.
  test('SC 근거가 없으면 되묻지 않고 팀 단위로 실행한다', () => {
    const r = resolveReportRequest({ report_id: 'activity_funnel_status' }, '이번 달 퍼널 현황 보여줘')
    assert.equal(r.needsClarification, false)
    assert.equal(r.scDisplay, SC_DISPLAY.TEAM_LEVEL)
    assert.equal(r.params.ScName, undefined, '팀 레벨은 @ScName을 보내지 않는다(NULL)')
  })

  test('team_level이면 SC 파라미터를 보내지 않는다 (= 팀 레벨)', () => {
    const r = resolveReportRequest({ report_id: 'activity_funnel_status', sc_display: SC_DISPLAY.TEAM_LEVEL })
    assert.equal(r.needsClarification, false)
    assert.equal(r.params.ScName, undefined, 'SC를 안 보내면 검증기가 NULL로 정규화한다')
  })

  test("all_sc → ScName 'ALL'", () => {
    const r = resolveReportRequest({ report_id: 'activity_funnel_status', sc_display: SC_DISPLAY.ALL_SC })
    assert.equal(r.params.ScName, SC_ALL)
  })

  test('specific → 지정한 이름들', () => {
    const r = resolveReportRequest({ report_id: 'activity_funnel_status', sc_display: SC_DISPLAY.SPECIFIC, sc_names: ['김철수'] })
    assert.deepEqual(r.params.ScName, ['김철수'])
  })

  test('specific인데 이름이 없으면 되묻는다 — 임의로 전체로 바꾸지 않는다', () => {
    const r = resolveReportRequest({ report_id: 'activity_funnel_status', sc_display: SC_DISPLAY.SPECIFIC, sc_names: [] })
    assert.equal(r.needsClarification, true)
  })

  test('보낸 파라미터가 전부 그 리포트의 실제 이름이다', () => {
    // 리포트마다 명명이 다르다(@Year/@year, @ActYn/@ActiveYn). 툴의 일반 인자를
    // 계약의 실제 이름으로 옮기지 못하면 검증기가 "없는 파라미터"로 거부한다.
    for (const rep of listReports()) {
      const names = new Set(rep.contract.parameters.map((p) => p.name))
      const r = resolveReportRequest({
        report_id: rep.report_id, sc_display: SC_DISPLAY.ALL_SC,
        year: 2026, month: 4, brand: ['TOYOTA'], dealer: ['렉서스 강남'],
        group_name: ['강남'], dept_nm: ['1팀'], act_yn: ['재직'], activity_type: ['내방상담'],
      })
      if (r.needsClarification) continue
      for (const k of Object.keys(r.params)) {
        assert.ok(names.has(k), `${rep.report_id}: '${k}'는 이 리포트에 없는 파라미터다`)
      }
      // 검증기까지 통과해야 실제로 실행된다.
      const v = validateReportParameters(rep.contract, r.params)
      assert.ok(v.ok, `${rep.report_id}: ${v.errors?.join(' / ')}`)
    }
  })

  test('어느 리포트에서도 SC 때문에 되묻지 않는다 — 근거가 없으면 팀 단위다', () => {
    for (const rep of listReports()) {
      const r = resolveReportRequest({ report_id: rep.report_id })   // SC 근거 없음
      assert.equal(!!r.needsClarification, false,
        `${rep.report_id}: SC 근거가 없는데 되물었다`)
    }
  })

  // 유일하게 허용되는 SC 재질문: 특정 한 사람이 필요한데 이름을 알 수 없을 때.
  test('"이 SC의" 처럼 사람을 가리키는데 이름이 없으면 그때만 되묻는다', () => {
    const r = resolveReportRequest(
      { report_id: 'activity_funnel_status', requires_specific_sc: true },
      '이 SC의 퍼널 현황 보여줘',
    )
    assert.equal(r.needsClarification, true)
    assert.equal(r.clarificationTarget, 'specific_sc_names')
  })

  test('SC별 요청은 되묻지 않고 전체 SC로 간다', () => {
    const r = resolveReportRequest(
      { report_id: 'activity_funnel_status', explicit_sc_breakdown: true },
      '이번 달 SC별 퍼널 현황 보여줘',
    )
    assert.equal(r.needsClarification, false)
    assert.equal(r.params.ScName, SC_ALL)
  })

  test('이름이 있으면 requires_specific_sc가 켜져 있어도 그 사람으로 실행한다', () => {
    // 우선순위: 이름 > 이름 없는 특정 요구 > SC별 > 팀 단위.
    const r = resolveReportRequest(
      { report_id: 'activity_funnel_status', sc_names: ['강민성'], requires_specific_sc: true },
      '강민성 SC의 퍼널 현황 보여줘',
    )
    assert.equal(r.needsClarification, false)
    assert.deepEqual(r.params.ScName, ['강민성'])
  })

  test('차원 별칭이 실제로 서로 다른 열을 묶지 않는다', () => {
    // 팀/부서는 같은 개념이라 별칭이 맞지만, 차종과 모델은 한 표에 함께 있는 다른 열이다.
    // 별칭으로 묶으면 요청한 축이 아닌 축으로 조용히 집계된다.
    for (const [name, aliases] of Object.entries(DIMENSION_ALIASES)) {
      for (const rep of listReports()) {
        const dims = [
          ...(rep.contract.dimension_columns?.branch_a || []),
          ...(rep.contract.dimension_columns?.branch_b || []),
        ]
        for (const a of aliases) {
          assert.ok(!(dims.includes(name) && dims.includes(a)),
            `${rep.report_id}: '${name}'과 '${a}'가 같은 표에 함께 있는데 별칭으로 묶여 있다`)
        }
      }
    }
  })

  test('롤업 제안 순서는 사용자가 물어본 축을 먼저 지킨다', () => {
    // 연도·월로 접으면 행은 줄지만 "모델별 출고"의 모델이 통째로 사라진다.
    const iModel = ROLLUP_SUGGESTION_ORDER.indexOf('모델')
    for (const coarse of ['연도', '월']) {
      assert.ok(iModel < ROLLUP_SUGGESTION_ORDER.indexOf(coarse), `모델이 ${coarse}보다 뒤에 있다`)
    }
    // 제안 후보는 전부 실제로 롤업 가능한 차원이어야 한다.
    for (const d of ROLLUP_SUGGESTION_ORDER) {
      assert.ok(GROUPABLE_DIMENSIONS.includes(d), `${d}는 group_by로 보낼 수 없는 차원이다`)
    }
  })

  test('연·월을 정수로 못 받는 리포트는 날짜 구간으로 옮긴다', () => {
    // lead_list는 기간을 reg_from/reg_to(date)로 받는다. 옮겨주지 않으면 "2026년 4월"이
    // 조용히 버려지고 전 기간 명세가 나온다.
    const r = resolveReportRequest({ report_id: 'lead_list', sc_display: SC_DISPLAY.TEAM_LEVEL, year: 2026, month: 4 })
    assert.equal(r.params.reg_from, '2026-04-01')
    assert.equal(r.params.reg_to, '2026-04-30')

    const y = resolveReportRequest({ report_id: 'lead_list', sc_display: SC_DISPLAY.TEAM_LEVEL, year: 2026 })
    assert.equal(y.params.reg_from, '2026-01-01')
    assert.equal(y.params.reg_to, '2026-12-31')

    // 말일은 달마다 다르다 — 2월/윤년까지 맞아야 한다.
    const feb = resolveReportRequest({ report_id: 'lead_list', sc_display: SC_DISPLAY.TEAM_LEVEL, year: 2026, month: 2 })
    assert.equal(feb.params.reg_to, '2026-02-28')
    const leap = resolveReportRequest({ report_id: 'lead_list', sc_display: SC_DISPLAY.TEAM_LEVEL, year: 2024, month: 2 })
    assert.equal(leap.params.reg_to, '2024-02-29')
  })

  test('LLM이 연도를 빠뜨려도 질문에 적혀 있으면 채운다', () => {
    // 2026-08-06 실측(평가 No.18): "2026년 SC 김승진님의 월별 계약판매성취도"가
    // Year 없이 실행돼 여러 해가 섞인 54행이 나왔다. 오류가 아니라 표가 늘어날 뿐이라
    // 사람 눈으로는 안 걸린다.
    const r = resolveReportRequest(
      { report_id: 'sales_achievement_contract', sc_names: ['김승진'] },
      '2026년 SC 김승진님의 월별 계약판매성취도(타겟, 실적, 취소, 달성률)을 보여줘',
    )
    assert.equal(r.params.Year, 2026)

    // 연도를 정수로 못 받는 리포트에서도 날짜 구간으로 이어져야 한다.
    const list = resolveReportRequest({ report_id: 'lead_list' }, '2025년 리드 명세 보여줘')
    assert.equal(list.params.reg_from, '2025-01-01')
    assert.equal(list.params.reg_to, '2025-12-31')

    // LLM이 준 값이 우선이다 — 질문에 적힌 연도가 이를 덮지 않는다.
    const explicit = resolveReportRequest({ report_id: 'sales_achievement_contract', year: 2025 }, '2026년 계약 성취도')
    assert.equal(explicit.params.Year, 2025)

    // 연도가 없는 질문은 그대로 둔다(전체 연도).
    const none = resolveReportRequest({ report_id: 'sales_achievement_contract' }, '월별 계약 성취도 보여줘')
    assert.equal(none.params.Year, undefined)
  })

  test('group_by를 안 주면 null — 가장 상세한 단위', () => {
    const r = resolveReportRequest({ report_id: 'activity_funnel_status', sc_display: SC_DISPLAY.TEAM_LEVEL })
    assert.equal(r.groupBy, null)
  })

  test('팀 단위 보기에서는 group_by가 그대로 쓰인다', () => {
    const r = resolveReportRequest({
      report_id: 'activity_funnel_status', sc_display: SC_DISPLAY.TEAM_LEVEL, group_by: ['딜러', '전시장'],
    })
    assert.deepEqual(r.groupBy, ['딜러', '전시장'])
  })

  test('SC별로 보기로 했으면 롤업에도 SC가 남는다', () => {
    // SC별로 보자고 해놓고 SC가 합쳐진 표가 나오면 요청과 다른 결과다.
    const r = resolveReportRequest({
      report_id: 'activity_funnel_status', sc_display: SC_DISPLAY.ALL_SC, group_by: ['딜러'],
    })
    assert.deepEqual(r.groupBy, ['딜러', 'SC'])
  })

  test('알 수 없는 컬럼은 group_by에서 걸러진다', () => {
    const r = resolveReportRequest({
      report_id: 'activity_funnel_status', sc_display: SC_DISPLAY.TEAM_LEVEL, group_by: ['딜러', '매출액'],
    })
    assert.deepEqual(r.groupBy, ['딜러'])
  })

  test('해석 결과를 그대로 검증기에 넣으면 통과한다', () => {
    const r = resolveReportRequest({
      report_id: 'activity_funnel_status',
      year: 2026, month: 7, dealer: ['렉서스 강남'],
      sc_display: SC_DISPLAY.ALL_SC,
    })
    const v = validate(r.params)
    assert.ok(v.ok, JSON.stringify(v.errors))
    assert.equal(v.params.Year, 2026)
    assert.equal(v.params.ScName, SC_ALL)
  })

  test('퍼널 표시 프리셋은 해당 리포트에만 붙는다', () => {
    const r = resolveReportRequest({
      report_id: 'funnel_full_structure',
      report_view: 'funnel_core_wide',
      year: 2026,
      sc_display: SC_DISPLAY.TEAM_LEVEL,
    })
    assert.equal(r.reportView, 'funnel_core_wide')

    const wrong = resolveReportRequest({
      report_id: 'activity_funnel_status',
      report_view: 'funnel_core_wide',
      sc_display: SC_DISPLAY.TEAM_LEVEL,
    })
    assert.equal(wrong.reportView, null)
  })
})

describe('롤업 — 상위 grain 값을 중복 합산하지 않는다', () => {
  // 한 팀(A/X/T1)에 활동유형 2행, 다른 팀(A/X/T2)에 1행.
  // 계약목표는 팀 단위 값이라 T1의 두 행에 100이 반복돼 있다 — 합치면 200이 되면 안 된다.
  const mk = (팀, 활동유형, o) => ({
    연도: 2026, 월: 4, 딜러: 'A', 전시장: 'X', 팀, 활동유형,
    활동목표: 0, 활동실적: 0, 기회목표: 0, 기회실적: 0, 계약실적: 0,
    계약목표: 0, 활동진척률: 0, 기회전환률: 0, 기회진척률: 0, 계약전환률: 0, 계약진행률: 0,
    ...o,
  })
  const result = {
    reportId: 'activity_funnel_status',
    branch: 'a',
    dimensionColumns: contract.dimension_columns.branch_a,
    rows: [
      mk('T1', '전화', { 활동목표: 10, 활동실적: 8, 기회목표: 5, 기회실적: 4, 계약실적: 1, 계약목표: 100, 계약진행률: 0.5 }),
      mk('T1', '방문', { 활동목표: 20, 활동실적: 12, 기회목표: 5, 기회실적: 6, 계약실적: 2, 계약목표: 100, 계약진행률: 0.5 }),
      mk('T2', '전화', { 활동목표: 30, 활동실적: 30, 기회목표: 10, 기회실적: 5, 계약실적: 3, 계약목표: 40, 계약진행률: 0.25 }),
    ],
  }

  test('활동유형을 접어도 계약목표가 중복 합산되지 않는다', () => {
    const r = rollupReportRows(result, ['딜러', '전시장', '팀'])
    const t1 = r.rows.find((x) => x.팀 === 'T1')
    assert.equal(t1['계약목표'], 100, '반복된 100을 200으로 더하면 안 된다')
    assert.equal(t1['활동목표'], 30, 'additive는 그대로 합산')
    assert.equal(t1['계약실적'], 3)
  })

  test('딜러 단위까지 접으면 팀별 계약목표가 한 번씩만 더해진다', () => {
    const r = rollupReportRows(result, ['딜러'])
    assert.equal(r.rows.length, 1)
    assert.equal(r.rows[0]['계약목표'], 140, 'T1의 100 + T2의 40')
    assert.equal(r.rows[0]['활동목표'], 60)
    assert.equal(r.rows[0]['계약실적'], 6)
  })

  test('비율은 평균이 아니라 분자·분모를 재합산해 계산한다', () => {
    const r = rollupReportRows(result, ['딜러'])[('rows')][0]
    assert.equal(r['활동진척률'], 50 / 60)          // 활동실적/활동목표
    assert.equal(r['기회전환률'], 15 / 50)          // 기회실적/활동실적
    assert.equal(r['기회진척률'], 15 / 20)          // 기회실적/기회목표
    assert.equal(r['계약전환률'], 6 / 15)           // 계약실적/기회실적
    // 계약진행률 = 중복제거한 (분자 합) / (분모 합) = (0.5*100 + 0.25*40) / 140
    assert.equal(r['계약진행률'], (0.5 * 100 + 0.25 * 40) / 140)
    // 단순 평균(0.5,0.5,0.25 → 0.4167)이나 (0.5+0.25)/2=0.375 와 달라야 한다.
    assert.notEqual(r['계약진행률'], (0.5 + 0.5 + 0.25) / 3)
  })

  test('접힌 컬럼을 알려준다', () => {
    const r = rollupReportRows(result, ['딜러'])
    assert.deepEqual(r.collapsed, ['연도', '월', '전시장', '팀', '활동유형'])
  })

  test('표에 없는 컬럼으로 접으려 하면 오류', () => {
    assert.throws(() => rollupReportRows(result, ['SC']), /없는 컬럼/)
  })

  test('분기 B에서는 SC까지가 상위 grain이다', () => {
    const b = {
      ...result,
      branch: 'b',
      dimensionColumns: contract.dimension_columns.branch_b,
      rows: [
        { ...mk('T1', '전화', { 계약목표: 100, 계약진행률: 0.5 }), SC: '김' },
        { ...mk('T1', '방문', { 계약목표: 100, 계약진행률: 0.5 }), SC: '김' },
        { ...mk('T1', '전화', { 계약목표: 60, 계약진행률: 0.5 }), SC: '이' },
      ],
    }
    const r = rollupReportRows(b, ['딜러'])
    // 김(100)은 두 활동유형에 반복 → 한 번만. 이(60)은 별도 SC → 더해진다.
    assert.equal(r.rows[0]['계약목표'], 160)
  })
})

describe('캐시', () => {
  const base = { reportId: 'activity_funnel_status', version: 'v3', sqlHash: 'abc', params: { Year: 2026, MonthNumber: 4 } }

  test('같은 요청은 같은 키, 파라미터가 다르면 다른 키', () => {
    assert.equal(cacheKey(base), cacheKey({ ...base, params: { MonthNumber: 4, Year: 2026 } }), '키 순서에 흔들리면 안 된다')
    assert.notEqual(cacheKey(base), cacheKey({ ...base, params: { Year: 2026, MonthNumber: 5 } }))
  })

  test('SQL이 바뀌면 캐시가 무효화된다', () => {
    assert.notEqual(cacheKey(base), cacheKey({ ...base, sqlHash: 'def' }))
  })

  test('권한 범위가 다르면 남의 결과를 받지 않는다', () => {
    // 지금은 항상 null이지만 서버 인증이 생겼을 때를 위해 키에 포함돼 있어야 한다.
    assert.notEqual(cacheKey(base), cacheKey({ ...base, authorizationScope: { DealerNm: ['렉서스 강남'] } }))
  })

  test('지난 달은 길게, 당월/기간미지정은 짧게 캐시한다', () => {
    const now = new Date('2026-07-29T00:00:00Z')
    assert.equal(ttlFor({ Year: 2026, MonthNumber: 4 }, now), TTL_CLOSED_PERIOD_MS)
    assert.equal(ttlFor({ year: 2026, month: 4 }, now), TTL_CLOSED_PERIOD_MS)
    assert.equal(ttlFor({ Year: 2026, MonthNumber: 7 }, now), TTL_OPEN_PERIOD_MS, '당월은 계속 변한다')
    assert.equal(ttlFor({ Year: 2026, MonthNumber: null }, now), TTL_OPEN_PERIOD_MS, '기간 미지정은 당월을 포함한다')
    assert.equal(ttlFor({ Year: 2025, MonthNumber: 12 }, now), TTL_CLOSED_PERIOD_MS)
  })

  test('저장한 값을 돌려주고, 만료되면 안 돌려준다', () => {
    clearCache()
    const k = cacheKey(base)
    setCached(k, [{ a: 1 }], 1000, 10_000)
    assert.deepEqual(getCached(k, 10_500)?.rows, [{ a: 1 }])
    assert.equal(getCached(k, 11_001), null, '만료 후에는 미스여야 한다')
  })

  test('항목 수 상한을 넘으면 오래된 것부터 밀려난다', () => {
    clearCache()
    for (let i = 0; i < MAX_ENTRIES + 5; i++) setCached(`k${i}`, [{ i }], 60_000)
    assert.equal(cacheSize(), MAX_ENTRIES)
    assert.equal(getCached('k0'), null, '가장 오래된 것은 밀려나야 한다')
    assert.ok(getCached(`k${MAX_ENTRIES + 4}`), '최근 것은 남아야 한다')
    clearCache()
  })
})

describe('컬럼 선택 (projection 단계에서만)', () => {
  const fakeResult = {
    reportId: 'activity_funnel_status',
    dimensionColumns: contract.dimension_columns.branch_a,
    rows: [
      { 연도: 2026, 월: 7, 딜러: '강남', 전시장: 'A', 팀: '1팀', 활동유형: '전화', 활동목표: 10, 활동실적: 8, 기회실적: 3, 계약목표: 5, 계약실적: 1 },
      { 연도: null, 월: null, 딜러: '합계', 전시장: null, 팀: null, 활동유형: null, 활동목표: 10, 활동실적: 8, 기회실적: 3, 계약목표: 5, 계약실적: 1 },
    ],
  }

  test('선택하지 않으면 11개 지표가 모두 나온다', () => {
    const p = projectColumns(fakeResult)
    assert.equal(p.columns.length, contract.dimension_columns.branch_a.length + 11)
  })

  test('선택한 지표만 나오되 차원과 퍼널 순서는 유지된다', () => {
    const p = projectColumns(fakeResult, ['계약실적', '활동실적'])
    assert.deepEqual(p.columns, [...contract.dimension_columns.branch_a, '활동실적', '계약실적'])
  })

  test('없는 컬럼을 고르면 오류', () => {
    assert.throws(() => projectColumns(fakeResult, ['매출액']), /없는 컬럼/)
  })

  test('컬럼명 공백 차이는 허용한다 — 리포트 전체가 거절되면 안 된다', () => {
    // 실제로 LLM이 '월평균 출고'를 '월평균출고'로 보내 sc_delivery_status 전체가
    // 거절됐고, 사용자는 아무 답도 받지 못했다.
    const p = projectColumns(fakeResult, ['계약 실적'.replace(' ', ''), ' 활동실적 '])
    assert.deepEqual(p.columns, [...contract.dimension_columns.branch_a, '활동실적', '계약실적'])
  })

  test('합계 행 위치를 표시해준다 — 다시 집계하지 않기 위해', () => {
    const p = projectColumns(fakeResult)
    assert.deepEqual(p.totalRowIndexes, [1])
  })
})

// 2026-08-04 평가표 52건 재실행: 거절 9건 중 8건이 selected_columns 불일치였다.
// 근본 원인은 카탈로그에 컬럼 목록이 없어 LLM이 실제 이름을 모르는 것이고(아래 별도 test),
// 여기 있는 건 그래도 새는 것을 받는 안전망이다. 실제로 들어왔던 입력을 그대로 고정한다.
describe('컬럼 이름 맞추기 — 평가표에서 실제로 거절됐던 입력', () => {
  const resolve = (id, sel) => {
    const { contract: c } = getReport(id)
    return resolveSelectedColumns(sel, Object.keys(c.column_semantics || {}), reportDimensionNames(c))
  }

  test('[11] 사용자 어휘의 접두어를 떼고 붙는다 — 영업활동실적 → 활동실적', () => {
    const r = resolve('activity_funnel_status', ['영업활동실적', '영업활동목표'])
    assert.deepEqual(r.measures, ['활동실적', '활동목표'])
    assert.deepEqual(r.unknown, [])
  })

  test('[15] LLM이 늘려 쓴 이름도 머리 명사로 붙는다 — 활동목표 → 목표', () => {
    // 사용자는 "목표, 활동, 달성률"이라고 정확히 말했는데 LLM이 늘려 보낸 경우다.
    const r = resolve('weekly_activity_progress', ['활동목표', '활동실적'])
    assert.deepEqual(r.measures, ['목표', '활동'])
  })

  test('[18] 타겟/목표처럼 리포트마다 다른 말을 같은 것으로 본다', () => {
    const r = resolve('sales_achievement_contract', ['계약목표', '계약실적', '계약취소', '계약달성률'])
    assert.deepEqual(r.measures, ['타겟', '실적', '취소', '달성률'])
  })

  test('[43][45] 차원 이름은 거절하지 않는다 — 어차피 항상 표시된다', () => {
    const a = resolve('target_management_month', ['SC명', '활동기준대수', '활동배수'])
    assert.deepEqual(a.measures, ['활동기준대수', '활동배수'])
    assert.deepEqual(a.dimensions, ['SC'])
    assert.deepEqual(a.unknown, [])

    const b = resolve('contract_list_detail', ['SC명', '고객명', '차종'])
    assert.deepEqual(b.dimensions, ['SC', '고객명', '차종'])
    assert.deepEqual(b.unknown, [])
  })

  test('[49] 요청 안에 실제 컬럼이 둘 들어 있으면 고르지 않는다', () => {
    // "연누적출고(PMA IN)"에는 '연누적 출고'와 'PMA IN'이 둘 다 들어 있다.
    // 접두 매칭을 넣었더니 IN/OUT이 **둘 다** '연누적 출고'로 붙었다 —
    // 조용히 틀린 표가 나가느니 모른다고 하는 편이 낫다.
    const r = resolve('sc_delivery_status', ['연누적출고(PMA IN)', '연누적출고(PMA OUT)'])
    assert.deepEqual(r.measures, [])
    assert.equal(r.unknown.length, 2)
  })

  test('[52] 뒤에 붙은 군더더기는 떼고 붙는다 — 월평균 출고대수 → 월평균 출고', () => {
    const r = resolve('sc_delivery_status', ['월평균 출고대수', '누적취소율', 'PMA IN'])
    assert.deepEqual(r.measures, ['월평균 출고', '누적취소율', 'PMA IN'])
  })

  test('[34] 정말 없는 지표는 그대로 모른다고 한다', () => {
    const r = resolve('funnel_full_structure', ['고객수', 'HOT영업기회', 'NPS'])
    assert.deepEqual(r.measures, [])
    assert.equal(r.unknown.length, 3)
  })

  test('서로 다른 요청 둘이 같은 컬럼에 붙으면 둘 다 버린다', () => {
    const r = resolveSelectedColumns(['활동 실적', '활동실적'], ['활동실적', '활동목표'], [])
    assert.deepEqual(r.measures, [])
    assert.equal(r.unknown.length, 2)
  })

  test('차원만 골랐으면 지표는 전부 남는다 — 숫자 없는 표가 나가면 안 된다', () => {
    const p = projectColumns(fakeResultForDims, ['고객명'])
    assert.ok(p.columns.includes('리드타임(일)'), '지표가 사라지면 안 된다')
  })

  const fakeResultForDims = {
    reportId: 'contract_list_detail',
    dimensionColumns: getReport('contract_list_detail').contract.dimension_columns.branch_a,
    rows: [{ 고객명: '홍길동', '리드타임(일)': 3 }],
  }
})

// 2026-08-04 평가표: 질문의 조건이 오류 없이 버려지고 전체 결과가 나갔다.
// 사용자는 그걸 걸러진 결과로 믿는다 — 기능 부족보다 나쁘다.
describe('조건이 조용히 버려지지 않는다', () => {
  const weekly = {
    reportId: 'weekly_activity_progress',
    dimensionColumns: ['딜러', '활동유형', '월별주차'],
    rows: [
      { 딜러: '강남', 활동유형: '자사출고', 월별주차: '1주차', 목표: 10, 활동: 8 },
      { 딜러: '강남', 활동유형: '자사출고', 월별주차: '2주차', 목표: 20, 활동: 25 },
      { 딜러: '강남', 활동유형: '판촉', 월별주차: '2주차', 목표: 5, 활동: 3 },
    ],
  }

  test('[15] 파라미터가 없는 축(월별주차)도 행에서 거른다', () => {
    const f = filterRowsByDimension(weekly, [{ column: '월별주차', values: ['2주차'] }])
    assert.equal(f.matched, 2)
    assert.deepEqual(f.unknownColumns, [])
  })

  test('줄여 말한 값도 받는다 — "2주차" / "2"', () => {
    assert.equal(filterRowsByDimension(weekly, [{ column: '월별주차', values: ['2'] }]).matched, 2)
  })

  test('없는 차원은 조용히 무시하지 않고 이름을 돌려준다', () => {
    const f = filterRowsByDimension(weekly, [{ column: '분기', values: ['1'] }])
    assert.deepEqual(f.unknownColumns, ['분기'])
    assert.equal(f.rows.length, 3, '거르지 못했으면 원본을 그대로 둔다')
  })

  test('조건에 맞는 행이 하나도 없으면 어느 조건인지 알려준다', () => {
    const f = filterRowsByDimension(weekly, [{ column: '월별주차', values: ['9주차'] }])
    assert.deepEqual(f.emptyFor, ['월별주차'])
  })

  test('[43] 지표 값 조건으로 거르고, 합계 행은 뺀다', () => {
    const target = {
      reportId: 'target_management_month',
      dimensionColumns: ['딜러', 'SC'],
      rows: [
        { 딜러: '강남', SC: '김', 활동배수: 7, 활동기준대수: 3 },
        { 딜러: '강남', SC: '이', 활동배수: 2, 활동기준대수: 1 },
        { 딜러: '합계', SC: null, 활동배수: 9, 활동기준대수: 4 },
      ],
    }
    const m = filterRowsByMeasure(target, [{ column: '활동배수', op: 'gte', value: 5 }])
    assert.equal(m.matched, 1)
    assert.equal(m.rows[0].SC, '김')
    assert.ok(m.droppedTotal, '부분집합에 전체 합계를 붙이면 표가 어긋난다')
  })

  test('없는 지표로 거르려 하면 이름을 돌려준다', () => {
    const target = { reportId: 'target_management_month', dimensionColumns: ['딜러'], rows: [] }
    const m = filterRowsByMeasure(target, [{ column: '매출액', op: 'gte', value: 5 }])
    assert.deepEqual(m.unknownColumns, ['매출액'])
  })

  test('[47][52] 리포트 고유 파라미터가 툴에 노출된다', () => {
    // 20개 리포트에 70개가 있는데 툴 스키마에 자리가 없어 닿을 수 없었다.
    const sc = reportExtraParameters(getReport('sc_delivery_status').contract).map((p) => p.name)
    assert.ok(sc.includes('grp_category'), '평가기준')
    assert.ok(sc.includes('grp_name'), '등급(A/B/C)')

    const hot = reportExtraParameters(getReport('hotboard_meeting').contract).map((p) => p.name)
    assert.ok(hot.includes('meet_round'), '회차')

    // 일반 인자가 덮는 것은 빠져야 한다 — 안 그러면 같은 필터를 두 경로로 받는다.
    assert.ok(!sc.includes('dealer_nm') && !sc.includes('year'))
  })

  test('카탈로그가 리포트 고유 필터를 알려준다', () => {
    const catalog = renderReportCatalogForPrompt()
    assert.match(catalog, /sc_delivery_status[\s\S]*?이 리포트만의 필터[^\n]*grp_name\(A\|B\|C\)/)
    assert.match(catalog, /hotboard_meeting[\s\S]*?이 리포트만의 필터[^\n]*meet_round/)
  })

  test('없는 필터 이름을 주면 실행하지 않고 되묻는다', () => {
    const r = resolveReportRequest({
      report_id: 'sc_delivery_status',
      sc_display: SC_DISPLAY.TEAM_LEVEL,
      report_filters: [{ name: '없는필터', values: ['X'] }],
    })
    assert.ok(r.needsClarification, '조용히 버리면 조건 없는 전체 결과가 나간다')
    assert.match(r.question, /없는필터/)
  })

  test('리포트 고유 필터가 파라미터로 들어간다', () => {
    const r = resolveReportRequest({
      report_id: 'sc_delivery_status',
      sc_display: SC_DISPLAY.ALL_SC,
      report_filters: [
        { name: 'grp_category', values: ['누적 취소율'] },
        { name: 'grp_name', values: ['A'] },
      ],
    })
    assert.deepEqual(r.params.grp_category, ['누적 취소율'])
    assert.deepEqual(r.params.grp_name, ['A'])
  })
})

// 진행(과정 중심)과 진척(목표 대비 성과)은 개념이 다른데, GOLD가 목표 대비 컬럼에도
// "진행률"이라는 이름을 쓴다. 이름으로는 구분되지 않으므로 계약에 근거를 적어 둔다.
// 질문에 적힌 컬럼이 고른 리포트에 없고 다른 리포트에만 있으면 리포트를 잘못 고른 것이다.
// 다만 어순이 다르거나 수식어가 붙었을 뿐 같은 개념인 경우가 많아, 겹치는 글자가 있으면
// 개입하지 않는다 — 2026-08-05 실측에서 이 구분 없이 오탐 3건이 났다.
describe('리포트를 잘못 골랐을 때만 개입한다', () => {
  test('겹치는 글자가 아예 없으면 잘못 고른 것이다 — PMA IN vs sales_ytd', () => {
    const hit = distinctiveColumnsInText(
      '딜러별 연누적 출고에서 2025년 12월 렉서스 부산의 PMA IN과 OUT 건수를 알려줘',
      'delivery_by_model',
    )
    assert.ok(hit.some((x) => x.column === 'PMA IN'))
    assert.equal(hit[0].report_id, 'sc_delivery_status')
  })

  test('어순만 다르면 개입하지 않는다 — "연누적 출고" vs 컬럼 "출고연누적"', () => {
    assert.deepEqual(
      distinctiveColumnsInText('2026년 4월의 연누적 출고 현황을 등급별로 보여줘', 'delivery_by_grade'),
      [],
    )
  })

  test('수식어가 붙었을 뿐이면 개입하지 않는다 — "영업기회" vs "HOT영업기회"', () => {
    assert.deepEqual(
      distinctiveColumnsInText('고객수, HOT영업기회, 전체영업기회, NPS 값 보여줘', 'sc_card_monthly'),
      [],
    )
  })

  test('흔한 말은 단서가 못 된다', () => {
    assert.deepEqual(distinctiveColumnsInText('2026년 4월 실적과 목표 보여줘', 'delivery_by_model'), [])
  })
})

describe('비율 지표는 무엇으로 나눈 값인지 계약에 적혀 있다', () => {
  test('모든 ratio 컬럼에 ratio_basis가 있다', () => {
    const missing = []
    for (const r of listReports()) {
      for (const [col, sem] of Object.entries(r.contract.column_semantics || {})) {
        if (!['ratio', 'higher_grain_ratio'].includes(sem.type)) continue
        if (!['target', 'stage'].includes(sem.ratio_basis)) missing.push(`${r.report_id}:${col}`)
      }
    }
    assert.deepEqual(missing, [], `ratio_basis 미지정: ${missing.join(', ')}`)
  })

  test('분모가 그 지표의 목표면 target, 다른 지표면 stage — 이름이 아니라 계산으로 정한다', () => {
    // 예외: 활동배수 = 활동목표 ÷ 영업기회목표. 분모가 "목표"로 끝나지만 자기 목표가
    // 아니라 **다른 단계의 목표**라서 진척이 아니다 — 기회 하나당 활동을 몇 번 하는지다.
    const CROSS_STAGE = new Set(['target_management_month:활동배수'])
    const wrong = []
    for (const r of listReports()) {
      for (const [col, sem] of Object.entries(r.contract.column_semantics || {})) {
        if (!['ratio', 'higher_grain_ratio'].includes(sem.type)) continue
        const key = `${r.report_id}:${col}`
        const expected = CROSS_STAGE.has(key) ? 'stage'
          : (/목표|타겟/.test(sem.denominator || '') ? 'target' : 'stage')
        if (sem.ratio_basis !== expected) wrong.push(`${key} ÷${sem.denominator} → ${sem.ratio_basis}(${expected}이어야)`)
      }
    }
    assert.deepEqual(wrong, [])
  })

  test('"진행률"이라 불리지만 목표 대비인 컬럼이 실제로 있다 — 이름을 믿으면 안 된다', () => {
    const misnamed = []
    for (const r of listReports()) {
      for (const [col, sem] of Object.entries(r.contract.column_semantics || {})) {
        if (sem.ratio_basis === 'target' && /진행률/.test(col)) misnamed.push(`${r.report_id}:${col}`)
      }
    }
    // 2026-08-05 기준 9개. 줄어들면(GOLD가 이름을 고치면) 이 테스트를 지워도 된다.
    assert.ok(misnamed.length > 0, '이름과 계산이 어긋나는 컬럼이 없어졌다면 주석·프롬프트도 함께 정리할 것')
  })

  test('카탈로그가 목표 대비와 전단계 대비를 갈라서 보여준다', () => {
    const catalog = renderReportCatalogForPrompt()
    assert.match(catalog, /activity_funnel_status[\s\S]*?목표 대비\(진척\):[^\n]*계약진행률/)
    assert.match(catalog, /activity_funnel_status[\s\S]*?전단계 대비\(전환\):[^\n]*계약전환률/)
    // 컬럼명 자체는 원문 그대로여야 한다 — 표시를 덧붙이면 LLM이 그걸 selected_columns에 넣는다.
    assert.doesNotMatch(catalog, /지표 컬럼:[^\n]*\[목표대비\]/)
  })
})

describe('리포트 카탈로그 — LLM에게 실제 컬럼 이름을 알려준다', () => {
  test('컬럼 목록이 없으면 LLM이 이름을 지어낸다 — 지표·차원을 모두 싣는다', () => {
    const catalog = renderReportCatalogForPrompt()
    // 평가표에서 실제로 틀렸던 두 곳을 고정한다.
    assert.match(catalog, /weekly_activity_progress[\s\S]*?지표 컬럼: 목표, 활동, 달성률/)
    assert.match(catalog, /sales_achievement_contract[\s\S]*?지표 컬럼: 실적, 취소, 타겟, 달성률/)
    assert.match(catalog, /contract_list_detail[\s\S]*?차원 컬럼:[^\n]*고객명/)
  })
})

describe('LIKE 패딩 필터의 끝 공백 방어', () => {
  // 차원 이름에 끝 공백이 있는 값이 있다(2026-08-03 실측 44종 119명).
  // 감싸지 않으면 패턴이 N'%,토요타 동대문 ,%' 가 되어 사용자가 넘긴 ',토요타 동대문,'
  // 과 매칭되지 않고, 오류 없이 0건이 나온다.
  const PADDED = /LIKE\s+N'%,'\s*\+\s*([^+]+?)\s*\+\s*N',%'/g

  test('컬럼을 그대로 쓰는 LIKE 패딩이 남아있지 않다', () => {
    const offenders = []
    for (const rep of listReports()) {
      for (const m of rep.sqlText.matchAll(PADDED)) {
        const expr = m[1].trim()
        // CAST(...)는 숫자에서 만든 문자열이라 공백이 생길 수 없다 — 감쌀 필요가 없다.
        if (/^CAST\s*\(/i.test(expr)) continue
        if (/^LTRIM\s*\(\s*RTRIM\s*\(/i.test(expr)) continue
        offenders.push(`${rep.report_id}: ${expr}`)
      }
    }
    assert.deepEqual(offenders, [], `LTRIM(RTRIM())로 감싸지 않은 LIKE 패딩: ${offenders.join(', ')}`)
  })

  test('감싼 리포트는 계약에 근거를 적어 뒀다 — 우리 편차이거나, 원문이 이미 감쌌거나', () => {
    for (const rep of listReports()) {
      // 원본이 원래 쓰던 LTRIM(RTRIM(@param))과 구분해야 한다 — funnel_full_structure는
      // STRING_SPLIT 방식이라 우리가 감싼 적이 없는데도 그 문자열을 갖고 있다.
      if (!/LIKE\s+N'%,'\s*\+\s*LTRIM\s*\(\s*RTRIM\s*\(/i.test(rep.sqlText)) continue
      // GOLD가 처음부터 감싸고 나온 것도 있다(sc_card_monthly). 우리가 바꾼 게 없으니
      // 편차가 아니라 사실 기록이다 — 둘 중 하나는 반드시 있어야 한다.
      if (rep.contract.source?.trim_guard === 'original') continue
      const ids = (rep.contract.source?.deviations || []).map((d) => d.id)
      assert.ok(ids.includes('filter_trim_guard'),
        `${rep.report_id}: SQL은 감쌌는데 계약에 근거 기록이 없다`
        + ' (우리가 감쌌으면 filter_trim_guard 편차를, 원문이 감쌌으면 source.trim_guard: original 을 적을 것)')
    }
  })

  test('CAST 표현식은 감싸지 않았다 — 불필요한 수정이 섞이지 않았다', () => {
    for (const rep of listReports()) {
      assert.ok(!/LTRIM\s*\(\s*RTRIM\s*\(\s*CAST/i.test(rep.sqlText),
        `${rep.report_id}: CAST까지 감쌌다`)
    }
  })
})

// SC 재질문 회귀 — 2026-08-06.
//
// 근본 원인은 LLM이 sc_display enum을 직접 고르게 한 구조였다. 'unspecified'가
// 선택지에 있는 한 모델은 확신이 조금만 부족하면 그것을 골랐고, 그때마다 출력 스키마를
// 묻는 재질문이 답 대신 나갔다. 이제 LLM은 근거(sc_names / explicit_sc_breakdown /
// requires_specific_sc)만 주고, 모드는 resolveScOptions()가 정한다.
//
// "정보가 언급되지 않음"과 "답을 내는 데 반드시 필요한 정보가 없음"은 다르다.
describe('SC 실행 옵션은 코드가 정한다', () => {
  const R = (args, q) => resolveReportRequest({ report_id: 'activity_funnel_status', ...args }, q)

  test('모델별 출고 현황 — 리포트 경로를 유지하고 팀 단위로 실행한다', () => {
    // 이 요청은 delivery_by_model Certified Report로 가야 GOLD 값이 나온다.
    // SC 근거가 없으므로 @ScName은 NULL이고 되묻지 않는다.
    const r = resolveReportRequest({ report_id: 'delivery_by_model' }, '모델별로 출고 현황')
    assert.equal(r.needsClarification, false)
    assert.equal(r.scDisplay, SC_DISPLAY.TEAM_LEVEL)
    assert.equal(r.params.ScName, undefined)
  })

  test('목표 저장 여부 건수 — SC와 무관하므로 되묻지 않는다', () => {
    const r = resolveReportRequest({ report_id: 'target_saved_status' }, '목표 저장 여부 건수')
    assert.equal(r.needsClarification, false)
  })

  test('이번 달 퍼널 현황 — team_level, @ScName NULL', () => {
    const r = R({}, '이번 달 퍼널 현황 보여줘')
    assert.equal(r.scDisplay, SC_DISPLAY.TEAM_LEVEL)
    assert.equal(r.params.ScName, undefined)
    assert.equal(r.needsClarification, false)
  })

  test('SC별 퍼널 현황 — all_sc, @ScName ALL', () => {
    const r = R({ explicit_sc_breakdown: true }, '이번 달 SC별 퍼널 현황 보여줘')
    assert.equal(r.scDisplay, SC_DISPLAY.ALL_SC)
    assert.equal(r.params.ScName, SC_ALL)
    assert.equal(r.needsClarification, false)
  })

  test('강민성 SC의 퍼널 현황 — specific, 그 이름', () => {
    const r = R({ sc_names: ['강민성'] }, '강민성 SC의 퍼널 현황 보여줘')
    assert.equal(r.scDisplay, SC_DISPLAY.SPECIFIC)
    assert.deepEqual(r.params.ScName, ['강민성'])
    assert.equal(r.needsClarification, false)
  })

  test('이 SC의 퍼널 현황 — 이름을 알 수 없으니 그때만 되묻는다', () => {
    const r = R({ requires_specific_sc: true }, '이 SC의 퍼널 현황 보여줘')
    assert.equal(r.needsClarification, true)
    assert.equal(r.clarificationTarget, 'specific_sc_names')
  })

  test('LLM 툴 스키마에 sc_display가 없다 — 실행 모드는 LLM이 고르지 않는다', () => {
    const tool = buildRunCertifiedReportTool()
    const props = tool.function.parameters.properties
    assert.equal(props.sc_display, undefined, 'sc_display가 다시 LLM 입력으로 들어갔다')
    assert.ok(props.sc_names && props.explicit_sc_breakdown && props.requires_specific_sc)
    assert.ok(!tool.function.parameters.required.includes('sc_display'))
    // enum 자체에 unspecified가 남아 있으면 어딘가에서 다시 새어 나온다.
    assert.ok(!Object.values(SC_DISPLAY).includes('unspecified'))
  })
})

describe('파라미터로 고정된 축은 group_by에서 뺀다', () => {
  test('한 값으로 고정된 연도·월·전시장·팀은 축이 되지 않는다', () => {
    // 2026-08-10 실측(평가 No.31): LLM이 group_by에 연도·월을 넣은 실행에서 결과 숫자에
    // 2026이 네 번 섞였고, 같은 질문의 다른 실행과 답이 갈렸다. 고정된 축은 모든 행이
    // 같은 값이라 정보를 더하지 않으면서 상수 컬럼만 만든다.
    const r = resolveReportRequest({
      report_id: 'delivery_status_monthly',
      year: 2026,
      month: 4,
      report_filters: [
        { name: 'group_name', values: ['렉서스 부산'] },
        { name: 'dept_nm', values: ['영업6팀'] },
      ],
      group_by: ['연도', '월', '브랜드', '전시장', '팀', '구분'],
    }, '2026년 4월 렉서스 부산 전시장 영업6팀의 월누적 출고 현황')

    for (const pinned of ['연도', '월', '전시장', '팀']) {
      assert.ok(!r.groupBy.includes(pinned), `고정된 축이 남았습니다: ${pinned}`)
    }
    // never_collapse로 선언된 축은 그대로 남아야 한다.
    assert.ok(r.groupBy.includes('구분'))
  })

  test('값이 여럿인 파라미터는 축으로 남긴다 — 딜러 두 곳 비교', () => {
    const r = resolveReportRequest({
      report_id: 'funnel_full_structure',
      year: 2026,
      month: 4,
      report_filters: [{ name: 'dealer_nm', values: ['렉서스 강남', '렉서스 부산'] }],
      group_by: ['딜러'],
      sc_display: SC_DISPLAY.TEAM_LEVEL,
    }, '2026년 4월 딜러 렉서스 강남과 렉서스 부산 비교')
    assert.ok(r.groupBy.includes('딜러'), '두 값을 비교하는 축은 남아야 한다')
  })

  test('고정 축만 요청하면 계약 기본 축으로 되돌아간다 — 빈 group_by를 내보내지 않는다', () => {
    const r = resolveReportRequest({
      report_id: 'delivery_status_monthly',
      year: 2026,
      month: 4,
      group_by: ['연도', '월'],
    }, '2026년 4월 출고 현황')
    assert.ok(r.groupBy === null || r.groupBy.length > 0)
  })
})

describe('표시 컬럼을 질문에서 유도한다', () => {
  test('질문에 이름이 있는 짝 컬럼을 채운다 — "PMA IN과 OUT"', () => {
    // 2026-08-11 실측(평가 No.49): selected_columns가 ["PMA IN","연누적 출고"]로 와서
    // 물어본 OUT이 빠지는 실행이 10회 중 3회 섞였다.
    const r = resolveReportRequest({
      report_id: 'sc_delivery_status',
      year: 2025, month: 12,
      selected_columns: ['PMA IN'],
      report_filters: [{ name: 'dealer_nm', values: ['렉서스 부산'] }],
    }, '딜러별 연누적 출고에서 2025년 12월 렉서스 부산의 PMA IN과 OUT 건수를 알려줘')
    assert.ok(r.selectedColumns.includes('PMA IN'))
    assert.ok(r.selectedColumns.includes('PMA OUT'), 'OUT이 질문에 있으므로 짝 컬럼이 붙어야 한다')
  })

  test('질문에 없는 짝은 붙이지 않는다', () => {
    const r = resolveReportRequest({
      report_id: 'sc_delivery_status', year: 2025, month: 12, selected_columns: ['PMA IN'],
    }, '2025년 12월 PMA IN 건수만 알려줘')
    assert.ok(!r.selectedColumns.includes('PMA OUT'))
  })

  test('비율을 물으면 진행률 컬럼을 채운다 — "퍼센트도 함께"', () => {
    // 2026-08-11 실측(평가 No.28): 12회 중 7회가 실적·목표만 담고 달성률을 빼먹었다.
    const r = resolveReportRequest({
      report_id: 'sc_card_monthly', year: 2026, month: 4,
      selected_columns: ['출고', '출고목표'],
    }, '2026년 4월 출고 목표 대비 출고 건수를 게이지 차트로, 밑에는 퍼센트도 함께 보여줘')
    assert.ok(r.selectedColumns.includes('출고진행률'))
  })

  test('비율을 안 물으면 진행률을 붙이지 않는다', () => {
    const r = resolveReportRequest({
      report_id: 'sc_card_monthly', year: 2026, month: 4, selected_columns: ['출고', '출고목표'],
    }, '2026년 4월 출고와 출고 목표 보여줘')
    assert.ok(!r.selectedColumns.includes('출고진행률'))
  })

  test('질문에서 유도한 컬럼이 LLM이 고른 것보다 우선한다', () => {
    // 질문은 하나인데 LLM은 실행마다 다른 열을 고른다 — 사용자가 쓴 말이 더 믿을 만하다.
    const r = resolveReportRequest({
      report_id: 'delivery_status_monthly', year: 2026, month: 4,
      selected_columns: ['출고MTD', '출고YTD'],
    }, '2026년 4월 전월 출고 현황 보여줘')
    assert.deepEqual(r.selectedColumns, ['출고LM'])
  })
})
