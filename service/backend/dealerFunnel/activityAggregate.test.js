// 활동 집계 — 정의서 3-1·3-5:
//   node --test backend/dealerFunnel/activityAggregate.test.js
//
// 라이브 DB 없이 도는 순수 집계 테스트다. Fabric 조회는 fetchActivityRows가 하고
// 여기서는 그 결과 모양의 배열을 직접 만들어 넣는다.
import { test, describe } from 'node:test'
import assert from 'node:assert/strict'

import { aggregateActivityRows } from './activityAggregate.js'

const row = (tp_nm, dealer, cnt, month = '2026-04') => ({ tp_nm, dealer, cnt, month, brand: 'LEXUS' })

describe('활동 집계 (정의서 3-1·3-5)', () => {
  test('채널·카테고리·딜러 합계가 매핑 대상 총계와 같다', () => {
    const out = aggregateActivityRows([
      row('관계형성-자사출고', '렉서스 강남', 100),
      row('기회창출-잠재고객', '렉서스 강남', 30),
      row('기회창출-내방상담', '렉서스 부산', 20),
      row('기회창출-온라인 유입(시승신청)', '렉서스 부산', 10),
    ])
    assert.equal(out.reconciliation.ok, true)
    assert.equal(out.reconciliation.channel, 160)
    assert.equal(out.reconciliation.category, 160)
    assert.equal(out.reconciliation.dealer, 160)
    assert.deepEqual(out.channel, { 관계형성활동: 100, SC활동: 30, '내방/내전': 20, 온라인유입: 10 })
    assert.deepEqual(out.category, { 기존고객: 130, 신규유입: 30 })
    assert.deepEqual(out.dealer, { '렉서스 강남': 130, '렉서스 부산': 30 })
  })

  test('기회진행은 채널에서 빠지되 전체 총계에는 남는다', () => {
    // 정의서 3-5: 채널 특정 불가 건은 채널·딜러별 집계에서 빼되 전체 총계에는 포함.
    const out = aggregateActivityRows([
      row('관계형성-자사출고', '렉서스 강남', 100),
      row('기회진행-시승결과', '렉서스 강남', 40),
      row('기회진행-견적', '렉서스 강남', 5),
    ])
    assert.equal(out.total, 145)            // 전체 총계에는 포함
    assert.equal(out.progress, 45)
    assert.equal(out.reconciliation.channel, 100)   // 채널에는 미포함
    assert.equal(out.reconciliation.ok, true)
  })

  test('시승 파이프라인 입력 건수를 따로 센다 — 시승결과만', () => {
    const out = aggregateActivityRows([
      row('기회진행-시승결과', '렉서스 강남', 40),
      row('기회진행-시승예약', '렉서스 강남', 25),
    ])
    assert.equal(out.testdrive_source, 40)
    assert.equal(out.progress, 65)
  })

  test('그룹 컬럼으로 매핑했다면 빠졌을 세 유형이 관계형성활동에 들어간다', () => {
    // 생일 연락·출고 기념일 연락은 tp_grp_1='연락', 관계형성 소개는 '기회창출'이다.
    const out = aggregateActivityRows([
      row('관계형성-생일 연락', '렉서스 강남', 7),
      row('관계형성-출고 기념일 연락', '렉서스 강남', 11),
      row('기회창출-관계형성 소개', '렉서스 강남', 13),
    ])
    assert.deepEqual(out.channel, { 관계형성활동: 31 })
    assert.equal(out.reconciliation.ok, true)
  })

  test('모르는 활동유형은 드러내고 등식 계산에서 뺀다', () => {
    const out = aggregateActivityRows([
      row('관계형성-자사출고', '렉서스 강남', 100),
      row('기회창출-신종유형', '렉서스 강남', 9),
    ])
    assert.deepEqual(out.unknown, [{ tp_nm: '기회창출-신종유형', cnt: 9 }])
    assert.equal(out.total, 109)
    // 등식은 매핑 대상만 놓고 본다 — 모르는 값을 섞으면 늘 깨져 보여 진짜 결함을 가린다.
    assert.equal(out.reconciliation.ok, true)
    assert.equal(out.reconciliation.channel, 100)
  })

  test('채널 순서가 CHANNEL_ORDER를 따른다 — 건수 순이 아니다', () => {
    const out = aggregateActivityRows([
      row('기회창출-온라인 유입(상담신청)', '렉서스 강남', 500),
      row('관계형성-자사출고', '렉서스 강남', 1),
    ])
    assert.deepEqual(Object.keys(out.channel), ['관계형성활동', '온라인유입'])
  })

  test('월별 집계는 채널 매핑 대상만 센다 — 총계·채널별과 같은 모집단', () => {
    // 전에는 기회진행까지 포함해 총계 타일(매핑 대상)과 월별 추이(전체)가 갈렸다.
    // 예측은 매핑 대상만 세므로, 원칙 5의 부분월 치환이 다른 스케일 값을 끼워 넣어
    // 진행 중인 달만 급감으로 잡혔다. 2026-08-11 수동 산출물 대조에서 드러났다.
    const out = aggregateActivityRows([
      row('관계형성-자사출고', '렉서스 강남', 10, '2026-03'),
      row('기회진행-견적', '렉서스 강남', 5, '2026-03'),
      row('관계형성-자사출고', '렉서스 강남', 20, '2026-04'),
    ])
    assert.deepEqual(out.month, { '2026-03': 10, '2026-04': 20 })
    // 전체 행 수는 total에 그대로 남는다 — 화면의 '전체 활동' 타일이 이 값을 쓴다.
    assert.equal(out.total, 35)
    assert.equal(out.reconciliation.total, 30)
  })

  test('월별 합계 = 채널별 합계 = 매핑 총계', () => {
    const out = aggregateActivityRows([
      row('관계형성-자사출고', '렉서스 강남', 10, '2026-03'),
      row('기회창출-내방상담', '렉서스 용산', 7, '2026-04'),
      row('기회진행-견적', '렉서스 강남', 5, '2026-03'),
      row('알수없는유형', '렉서스 강남', 3, '2026-04'),
    ])
    const sum = (o) => Object.values(o).reduce((a, b) => a + b, 0)
    assert.equal(sum(out.month), out.reconciliation.total)
    assert.equal(sum(out.channel), out.reconciliation.total)
  })

  test('빈 입력에서도 등식이 성립한다', () => {
    const out = aggregateActivityRows([])
    assert.equal(out.total, 0)
    assert.equal(out.reconciliation.ok, true)
    assert.deepEqual(out.channel, {})
  })
})
