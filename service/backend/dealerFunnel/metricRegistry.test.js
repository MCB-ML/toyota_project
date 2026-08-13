// 지표 레지스트리 — 정의와 조회가 갈라지지 않게 하는 장치:
//   node --test backend/dealerFunnel/metricRegistry.test.js
import { test, describe } from 'node:test'
import assert from 'node:assert/strict'

import { METRIC_CATALOG, METRIC_IDS, describeMetrics, toSeries } from './metricRegistry.js'

describe('지표 카탈로그', () => {
  test('퍼널 4단계를 퍼널 순서대로 담는다', () => {
    // 이 순서가 차트 순서·전환율 쌍(활동→기회→시승→계약)을 만든다.
    assert.deepEqual(METRIC_IDS, ['활동', '기회', '시승', '계약'])
  })

  test('지표마다 정의·원천·기간 기준·채널 근거가 다 있다', () => {
    // 하나라도 비면 화면의 지표 표에 빈 칸이 생기고, 챗봇도 그 지표를 설명하지 못한다.
    for (const m of METRIC_CATALOG) {
      for (const field of ['id', 'label', 'definition', 'source', 'dateBasis', 'channelBasis', 'spec']) {
        assert.ok(String(m[field] ?? '').trim(), `${m.id}의 ${field}가 비어 있다`)
      }
      assert.ok(Array.isArray(m.axes) && m.axes.length, `${m.id}에 축이 없다`)
    }
  })

  test('원천이 실제 테이블 이름을 담는다 — 산문만 적으면 코드가 못 쓴다', () => {
    assert.match(METRIC_CATALOG.find((m) => m.id === '기회').source, /FCT_LEAD/)
    assert.match(METRIC_CATALOG.find((m) => m.id === '계약').source, /FCT_CONTRACT_KTWS/)
  })

  test('활동·시승은 필수, 기회·계약은 실패해도 나머지로 문서를 만든다', () => {
    const required = METRIC_CATALOG.filter((m) => m.required).map((m) => m.id)
    assert.deepEqual(required, ['활동', '시승'])
  })

  // 로더 누락은 metricRegistry.js가 import 시점에 던진다 — 이 파일이 로드된 것 자체가 증거다.
  test('카탈로그의 모든 지표에 로더가 붙어 있다', () => {
    assert.equal(METRIC_CATALOG.length, METRIC_IDS.length)
  })
})

describe('공통 시리즈 모양 맞추기', () => {
  test('지표마다 다른 반환값에서 공통 축만 뽑는다', () => {
    // 활동은 category·excluded가, 시승은 stages가 더 붙어 있다. 차트는 공통 축만 본다.
    const s = toSeries({
      total: 10, month: { '2026-06': 10 }, channel: { SC활동: 10 },
      dealer: { D: 10 }, month_by_channel: { SC활동: { '2026-06': 10 } },
      month_by_dealer: { D: { '2026-06': 10 } }, unattributed: 2,
      category: { 기존고객: 10 }, excluded: { total: 3 },
    })
    assert.deepEqual(Object.keys(s).sort(), [
      'channel', 'dealer', 'month', 'month_by_channel', 'month_by_dealer', 'total', 'unattributed',
    ])
    assert.equal(s.unattributed, 2)
  })

  test('reconciliation.total을 total보다 우선한다 — 활동은 매핑 총계가 기준이다', () => {
    assert.equal(toSeries({ total: 999, reconciliation: { total: 100 } }).total, 100)
  })

  test('빈 결과에도 축이 빈 객체로 존재한다 — 호출부가 옵셔널 체이닝을 안 써도 된다', () => {
    const s = toSeries(undefined)
    assert.equal(s.total, 0)
    assert.deepEqual(s.month, {})
    assert.deepEqual(s.month_by_channel, {})
  })
})

describe('지표 설명 — 정의만 있고 값이 없는 지표를 드러낸다', () => {
  test('조회된 지표에는 실제 건수가 붙는다', () => {
    const described = describeMetrics({ series: { 활동: { total: 255253 } }, issues: [] })
    const activity = described.find((m) => m.id === '활동')
    assert.equal(activity.available, true)
    assert.equal(activity.total, 255253)
    assert.equal(activity.error, null)
  })

  test('조회 실패는 0이 아니라 오류로 남긴다 — 실적 0과 구분돼야 한다', () => {
    const described = describeMetrics({
      series: { 활동: { total: 10 } },
      issues: [{ metric: '계약', message: '타임아웃' }],
    })
    const contract = described.find((m) => m.id === '계약')
    assert.equal(contract.available, false)
    assert.equal(contract.total, null)
    assert.equal(contract.error, '타임아웃')
  })

  test('아무것도 안 넘겨도 카탈로그 전체를 돌려준다 — 정의는 조회와 무관하게 존재한다', () => {
    const described = describeMetrics()
    assert.equal(described.length, 4)
    assert.ok(described.every((m) => m.available === false))
    assert.ok(described.every((m) => m.definition))
  })
})
