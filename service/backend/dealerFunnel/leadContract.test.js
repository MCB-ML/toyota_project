// 기회·계약 집계 — 정의서 3-2:
//   node --test backend/dealerFunnel/leadContract.test.js
import { test, describe } from 'node:test'
import assert from 'node:assert/strict'

import { aggregateAttributedRows } from './leadContract.js'

const rows = [
  // 관계형성활동(슬롯 0) — 두 달, 두 딜러
  { tp_nm: '관계형성-자사출고', dealer: '토요타강남', month: '2026-06', cnt: 100 },
  { tp_nm: '관계형성-자사출고', dealer: '토요타강남', month: '2026-07', cnt: 120 },
  { tp_nm: '관계형성-생일 연락', dealer: '토요타분당', month: '2026-06', cnt: 30 },
  // 내방/내전
  { tp_nm: '기회창출-내방상담', dealer: '토요타강남', month: '2026-06', cnt: 50 },
  // 온라인유입
  { tp_nm: '기회창출-온라인 유입(상담신청)', dealer: '토요타분당', month: '2026-07', cnt: 20 },
  // 귀속 실패 — ca_act_tp 가 비었거나 매핑에 없는 값
  { tp_nm: null, dealer: '토요타강남', month: '2026-07', cnt: 7 },
  { tp_nm: '기회진행-견적', dealer: '토요타분당', month: '2026-07', cnt: 3 },
]

describe('기회·계약 채널 귀속', () => {
  const agg = aggregateAttributedRows(rows)

  test('채널 매핑되는 건만 채널에 들어간다', () => {
    assert.equal(agg.channel.관계형성활동, 250)   // 100 + 120 + 30
    assert.equal(agg.channel['내방/내전'], 50)
    assert.equal(agg.channel.온라인유입, 20)
    assert.equal(agg.channel.SC활동, undefined)   // 해당 행이 없으면 키 자체가 없다
  })

  test('귀속 실패는 채널에 넣지 않고 따로 센다', () => {
    // 임의로 채널을 주면 채널 합계가 조용히 부풀려진다.
    assert.equal(agg.unattributed, 10)
    assert.equal(agg.unattributed_types['(활동유형 없음)'], 7)
    assert.equal(agg.unattributed_types['기회진행-견적'], 3)
  })

  test('귀속 실패 이유를 SQL이 준 대로 나눠 센다', () => {
    // "귀속 실패 19%"로 뭉치면 매핑을 고쳐 줄일 수 있는 건과 원천에 연결고리가 없어
    // 못 줄이는 건이 구분되지 않는다. 계약 실측에서 후자가 19.49%였다.
    const withReason = aggregateAttributedRows([
      { tp_nm: null, attr_reason: '계약에 기회번호(lead_key)가 없음', dealer: 'D', month: '2026-07', cnt: 4184 },
      { tp_nm: null, attr_reason: '기회번호에 해당하는 기회 행을 찾지 못함', dealer: 'D', month: '2026-07', cnt: 17 },
      { tp_nm: '기회창출-내방상담', attr_reason: null, dealer: 'D', month: '2026-07', cnt: 4070 },
    ])
    assert.equal(withReason.unattributed_types['계약에 기회번호(lead_key)가 없음'], 4184)
    assert.equal(withReason.unattributed_types['기회번호에 해당하는 기회 행을 찾지 못함'], 17)
    assert.equal(withReason.channel['내방/내전'], 4070)
    // 귀속에 성공한 행의 attr_reason은 무시한다 — tp_nm이 있으면 그게 답이다.
    assert.equal(Object.keys(withReason.unattributed_types).length, 2)
  })

  test('정합성 등식 — 채널 + 귀속실패 = 총계 = 딜러 합계', () => {
    assert.equal(agg.total, 330)
    assert.equal(agg.reconciliation.channel + agg.reconciliation.unattributed, agg.total)
    assert.equal(agg.reconciliation.dealer, agg.total)
    assert.equal(agg.reconciliation.ok, true)
  })

  test('딜러 합계는 귀속 여부와 무관하다 — 귀속 실패도 딜러에는 잡힌다', () => {
    assert.equal(agg.dealer.토요타강남, 277)   // 100 + 120 + 50 + 7
    assert.equal(agg.dealer.토요타분당, 53)    // 30 + 20 + 3
  })

  test('월별 시리즈와 축×월 교차를 함께 만든다', () => {
    assert.deepEqual(agg.month, { '2026-06': 180, '2026-07': 150 })
    assert.deepEqual(agg.month_by_channel.관계형성활동, { '2026-06': 130, '2026-07': 120 })
    assert.deepEqual(agg.month_by_dealer.토요타분당, { '2026-06': 30, '2026-07': 23 })
  })

  test('채널 순서가 고정돼 있다 — 필터로 하나가 빠져도 남은 계열의 자리가 안 밀린다', () => {
    const withoutWalkIn = aggregateAttributedRows(rows.filter((r) => r.tp_nm !== '기회창출-내방상담'))
    assert.deepEqual(Object.keys(withoutWalkIn.channel), ['관계형성활동', '온라인유입'])
    assert.deepEqual(Object.keys(aggregateAttributedRows(rows).channel), ['관계형성활동', '내방/내전', '온라인유입'])
  })

  test('생일 연락으로 만들어진 기회도 관계형성활동이다 (tp_grp_1 함정)', () => {
    // tp_grp_1 으로 매핑하면 '연락' 그룹이라 관계형성활동에서 빠진다 — channelMap.js 주석 참고.
    const only = aggregateAttributedRows([{ tp_nm: '관계형성-생일 연락', dealer: 'D', month: '2026-06', cnt: 5 }])
    assert.equal(only.channel.관계형성활동, 5)
    assert.equal(only.unattributed, 0)
  })

  test('딜러명이 비면 총계에서 빼지 않고 (딜러 미상)으로 남긴다', () => {
    // 조용히 버리면 딜러 합계가 총계와 어긋나 정합성 검증이 깨진다.
    const agg2 = aggregateAttributedRows([{ tp_nm: '관계형성-자사출고', dealer: '  ', month: '2026-06', cnt: 9 }])
    assert.equal(agg2.dealer['(딜러 미상)'], 9)
    assert.equal(agg2.reconciliation.ok, true)
  })

  test('빈 입력에서도 등식이 성립한다', () => {
    const empty = aggregateAttributedRows([])
    assert.equal(empty.total, 0)
    assert.equal(empty.reconciliation.ok, true)
    assert.deepEqual(empty.channel, {})
  })
})
