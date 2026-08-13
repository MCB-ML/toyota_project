// 단일 HTML 대시보드 — 정의서 2-2(a):
//   node --test backend/dealerFunnel/htmlReport.test.js
import { test, describe } from 'node:test'
import assert from 'node:assert/strict'

import { buildHtmlReport } from './htmlReport.js'

const insight = {
  period: { from: '2026-01-01', to: '2026-09-01', brand: null },
  as_of: '2026-08-10',
  monthly: { 활동: { '2026-06': 59045, '2026-07': 61416 }, 시승: { '2026-06': 3143, '2026-07': 3031 } },
  month_by_channel: {
    활동: { 관계형성활동: { '2026-06': 40000, '2026-07': 41000 }, '내방/내전': { '2026-06': 5000, '2026-07': 4000 } },
    시승: { 온라인유입: { '2026-06': 900, '2026-07': 850 } },
  },
  forecast: {
    활동: {
      yearMonth: '2026-08', days_elapsed: 10, days_in_month: 31, actual_so_far: 18228,
      method1_forecast: 51582, method2_forecast: 45765, method3_forecast: 47287, complete: false,
    },
  },
  detection: {
    thresholds: { change_pct: 15, rate_change_pp: 5, small_sample: 10, data_loss_pct: 3 },
    axis_partial_month_skipped: ['2026-08'],
    anomalies: [
      { kind: 'month_over_month', metric: '활동', from_month: '2026-02', to_month: '2026-03', from_value: 22870, to_value: 37679, change_pct: 64.8, forecast_used: false, small_sample: false },
      { kind: 'rate_change', metric: '시승→계약 전환율', from_month: '2026-05', to_month: '2026-06', from_rate_pct: 30, to_rate_pct: 20, change_pp: -10, small_sample: false },
      { kind: 'data_loss', metric: '활동 집계 제외', lost_count: 800, base_count: 10000, loss_pct: 8, small_sample: false },
    ],
    dealer_spread: [
      { metric: '활동', from_month: '2026-06', to_month: '2026-07', same_direction_count: 6, total_dealers: 8, dominant_direction: '감소', pattern: '전사 패턴 가능성' },
    ],
  },
  funnel_totals: {
    활동: 255253,
    활동_채널별: { 관계형성활동: 178702, SC활동: 35523, '내방/내전': 25946, 온라인유입: 15082 },
    시승: 20089,
    시승_채널별: { 관계형성활동: 2756, SC활동: 4390, '내방/내전': 6892, 온라인유입: 6043 },
    시승_파이프라인: { raw: 32833, cancelled: 5598, deduped: 7127, after_dedup: 20108 },
    집계_제외: { total: 5082, no_activity_type: 4833, no_organization: 249 },
  },
  narration: { text: '2026년 2월 대비 3월 활동이 64.8% 증가했습니다.' },
}

describe('단일 HTML 대시보드', () => {
  const html = buildHtmlReport(insight)

  test('완결된 HTML 문서다', () => {
    assert.match(html, /^<!doctype html>/)
    assert.match(html, /<\/html>$/)
    assert.match(html, /<title>.*딜러 계약퍼널/)
  })

  test('외부 요청이 없다 — 파일 하나로 열려야 한다', () => {
    // CDN 스크립트·외부 스타일시트·원격 이미지가 있으면 오프라인/사내망에서 깨진다.
    assert.ok(!/<script\b/i.test(html), '스크립트가 없어야 한다')
    assert.ok(!/https?:\/\//i.test(html.replace(/<html lang="ko">/, '')), '외부 URL이 없어야 한다')
    assert.ok(!/<link\b/i.test(html))
  })

  test('계약 Gross 정의를 문서 안에 밝힌다', () => {
    assert.match(html, /Gross 기준/)
    assert.match(html, /취소·반려된 건도 포함/)
  })

  test('부분월은 예상 최종치로 환산하라고 적는다 (원칙 5)', () => {
    assert.match(html, /예상 최종치/)
    assert.match(html, /전월과 비교/)
  })

  test('축 단위에서 건너뛴 부분월을 밝힌다', () => {
    assert.match(html, /2026-08.*비교하지 않았습니다/s)
  })

  test('시승 파이프라인 단계를 숫자로 남긴다 (3-4)', () => {
    assert.match(html, /32,833/)   // 원본
    assert.match(html, /5,598/)    // 취소
    assert.match(html, /7,127/)    // 중복
  })

  test('딜러 확산 표로 전사/개별을 구분한다 (원칙 3)', () => {
    assert.match(html, /전사 패턴 가능성/)
    assert.match(html, /6\/8개 감소/)
  })

  test('계열마다 범례와 직접 라벨을 함께 단다 — 색만으로 식별하지 않는다', () => {
    assert.match(html, /class="legend"/)
    assert.match(html, /class="direct"/)
    assert.match(html, /관계형성활동/)
  })

  test('라이트·다크 두 모드의 색을 모두 선언한다', () => {
    assert.match(html, /#2a78d6/)   // light 슬롯 1
    assert.match(html, /#3987e5/)   // dark 슬롯 1
    assert.match(html, /prefers-color-scheme: dark/)
    assert.match(html, /\[data-theme="dark"\]/)
  })

  test('활동과 시승을 한 축에 겹치지 않는다 — 차트를 따로 그린다', () => {
    const captions = [...html.matchAll(/<figcaption>([^<]+)<\/figcaption>/g)].map((m) => m[1])
    assert.ok(captions.includes('활동 — 채널별'))
    assert.ok(captions.includes('시승 — 채널별'))
  })

  test('레지스트리가 준 지표를 전부 그린다 — 퍼널 4단계가 표에만 있고 그림엔 없던 문제', () => {
    const four = buildHtmlReport({
      ...insight,
      metrics: ['활동', '기회', '시승', '계약'].map((id) => ({
        id, label: id, available: true, definition: `${id} 정의`, source: `T_${id}`,
        dateBasis: `${id} 일자`, channelBasis: `${id} 근거`, total: 100,
      })),
      month_by_channel: {
        활동: { 관계형성활동: { '2026-06': 100, '2026-07': 110 } },
        기회: { 온라인유입: { '2026-06': 40, '2026-07': 45 } },
        시승: { 온라인유입: { '2026-06': 20, '2026-07': 22 } },
        계약: { 관계형성활동: { '2026-06': 10, '2026-07': 12 } },
      },
      funnel_totals: {
        ...insight.funnel_totals,
        기회_채널별: { 온라인유입: 85 }, 계약_채널별: { 관계형성활동: 22 },
      },
    })
    const captions = [...four.matchAll(/<figcaption>([^<]+)<\/figcaption>/g)].map((m) => m[1])
    for (const id of ['활동', '기회', '시승', '계약']) {
      assert.ok(captions.includes(`${id} — 채널별`), `${id} 월별 추이가 없다`)
    }
    assert.match(four, /지표 정의/)
    assert.match(four, /기회 근거/)   // 채널 귀속 근거를 문서가 스스로 밝힌다
  })

  test('조회 실패한 지표는 그리지 않고 실패했다고 적는다 — 0으로 그리면 실적 0과 헷갈린다', () => {
    const partial = buildHtmlReport({
      ...insight,
      metrics: [
        { id: '활동', label: '활동', available: true, definition: 'd', source: 's', dateBasis: 'b', channelBasis: 'c', total: 10 },
        { id: '계약', label: '계약', available: false, error: '타임아웃', definition: 'd', source: 's', dateBasis: 'b', channelBasis: 'c', total: null },
      ],
      metric_issues: [{ metric: '계약', message: '타임아웃' }],
    })
    const captions = [...partial.matchAll(/<figcaption>([^<]+)<\/figcaption>/g)].map((m) => m[1])
    assert.ok(!captions.includes('계약 — 채널별'))
    assert.match(partial, /조회하지 못한 지표.*계약\(타임아웃\)/s)
    assert.match(partial, /값이 0이어서가 아니라 가져오지 못한 것/)
  })

  test('AI 해석과 그 한계를 함께 싣는다', () => {
    assert.match(html, /64\.8% 증가/)
    assert.match(html, /숫자를 다시 계산하지 않으며/)
  })

  test('인쇄용 규칙을 담는다 — 종이는 화면과 다른 매체다', () => {
    assert.match(html, /@media print/)
    assert.match(html, /@page \{ size: A4/)
    // 표·차트가 페이지 사이에서 쪼개지면 읽을 수 없다.
    assert.match(html, /break-inside: avoid/)
    // 다크모드로 보던 사람이 검은 배경을 그대로 인쇄하지 않게 토큰을 되돌린다.
    assert.match(html, /@media print[\s\S]*?--surface-0: #ffffff/)
    // 화면에서 가로 스크롤로 처리하던 넓은 표는 종이에서 스크롤할 수 없다.
    assert.match(html, /@media print[\s\S]*?\.scroll \{ overflow: visible/)
  })

  test('값이 비어도 터지지 않는다', () => {
    const empty = buildHtmlReport({ period: {}, monthly: {}, detection: {}, funnel_totals: {} })
    assert.match(empty, /^<!doctype html>/)
  })

  test('데이터 값이 HTML로 새지 않는다', () => {
    // 딜러·활동유형 이름은 DB에서 온다. 그대로 끼워 넣으면 이름 하나로 문서가 깨진다.
    const evil = buildHtmlReport({
      ...insight,
      detection: {
        ...insight.detection,
        anomalies: [{
          kind: 'month_over_month', metric: '<script>alert(1)</script>', member: '"onload="x',
          from_month: '2026-06', to_month: '2026-07', from_value: 10, to_value: 20,
          change_pct: 100, small_sample: false,
        }],
      },
      narration: { text: '<img src=x onerror=alert(1)>' },
    })
    assert.ok(!evil.includes('<script>alert(1)</script>'))
    assert.ok(!evil.includes('<img src=x'))
    assert.match(evil, /&lt;script&gt;/)
    assert.match(evil, /&lt;img src=x/)
  })

  test('채널 목록에 없는 값은 차트에 그리지 않는다', () => {
    // 매핑에 없는 이름이 들어와도 축이 늘어나지 않는다 — 색 순서가 밀리면 계열 정체성이 깨진다.
    const html2 = buildHtmlReport({
      ...insight,
      funnel_totals: { ...insight.funnel_totals, 활동_채널별: { 관계형성활동: 10, 미지의채널: 999 } },
    })
    assert.ok(!html2.includes('미지의채널'))
  })
})

describe('색은 계열 정체성을 따른다 (recolor-on-filter 방지)', () => {
  test('채널 하나가 비어도 남은 채널의 색 슬롯이 그대로다', () => {
    const withAll = buildHtmlReport(insight)
    const withoutSc = buildHtmlReport({
      ...insight,
      funnel_totals: {
        ...insight.funnel_totals,
        활동_채널별: { 관계형성활동: 178702, '내방/내전': 25946, 온라인유입: 15082 },   // SC활동 빠짐
      },
    })
    // 온라인유입은 CHANNEL_ORDER의 4번째라 언제나 슬롯 3이어야 한다.
    const slotOfOnline = (h) => {
      const m = h.match(/온라인유입<\/span>\s*<span class="bar-track"><span class="bar-fill" style="width:[\d.]+%;background:var\(--s(\d)\)/)
      return m ? m[1] : null
    }
    assert.equal(slotOfOnline(withAll), '3')
    assert.equal(slotOfOnline(withoutSc), '3', '채널이 빠져도 남은 계열의 색이 밀리면 안 된다')
  })

  test('선형 차트도 같은 규칙을 따른다', () => {
    const only = buildHtmlReport({
      ...insight,
      month_by_channel: { 활동: { 온라인유입: { '2026-06': 100, '2026-07': 120 } }, 시승: {} },
    })
    // 관계형성활동(슬롯 0)이 없어도 온라인유입은 슬롯 3을 쓴다.
    assert.match(only, /stroke="var\(--s3\)"/)
    assert.ok(!/stroke="var\(--s0\)"/.test(only))
  })
})
