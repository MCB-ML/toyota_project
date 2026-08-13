// 시승 집계 — 정의서 3-4:
//   node --test backend/dealerFunnel/testDrive.test.js
//
// 중복제거·취소제외는 SQL이 하고(라이브 DB 필요) 여기서는 그 결과를 채널로 귀속하는
// 부분을 검증한다.
import { test, describe } from 'node:test'
import assert from 'node:assert/strict'

import { aggregateTestDriveRows } from './testDrive.js'

const row = (origin_tp_nm, dealer, cnt, month = '2026-04') => ({ origin_tp_nm, dealer, cnt, month })

describe('시승 채널 귀속 (정의서 3-4 ④)', () => {
  test('기회를 만든 활동의 채널로 귀속된다', () => {
    const out = aggregateTestDriveRows([
      row('기회창출-내방상담', '렉서스 강남', 50),
      row('기회창출-온라인 유입(시승신청)', '렉서스 강남', 30),
      row('관계형성-자사출고', '렉서스 부산', 20),
    ])
    assert.deepEqual(out.channel, { 관계형성활동: 20, '내방/내전': 50, 온라인유입: 30 })
    assert.equal(out.total, 100)
    assert.equal(out.reconciliation.ok, true)
  })

  test('귀속 실패는 채널에 넣지 않고 따로 센다', () => {
    // 원래 기회가 기회진행 유형뿐이거나(시승예약만 있는 경우) 연결이 아예 안 되는 경우.
    const out = aggregateTestDriveRows([
      row('기회창출-내방상담', '렉서스 강남', 40),
      row('기회진행-시승예약', '렉서스 강남', 7),
      row(null, '렉서스 강남', 3),
    ])
    assert.deepEqual(out.channel, { '내방/내전': 40 })
    assert.equal(out.unattributed, 10)
    assert.equal(out.total, 50)
    // 채널 + 귀속실패 = 총계. 귀속 실패를 아무 채널에 넣으면 이 등식이 맞아 보이면서 값이 틀린다.
    assert.equal(out.reconciliation.ok, true)
  })

  test('딜러 합계는 귀속 여부와 무관하게 총계와 같다', () => {
    const out = aggregateTestDriveRows([
      row('기회창출-내방상담', '렉서스 강남', 40),
      row(null, '렉서스 부산', 10),
    ])
    assert.deepEqual(out.dealer, { '렉서스 강남': 40, '렉서스 부산': 10 })
    assert.equal(out.reconciliation.dealer, 50)
    assert.equal(out.reconciliation.ok, true)
  })

  test('생일 연락으로 만들어진 기회의 시승도 관계형성활동이다', () => {
    // tp_grp_1='연락'이라 그룹으로 매핑하면 여기서도 빠진다.
    const out = aggregateTestDriveRows([row('관계형성-생일 연락', '렉서스 강남', 5)])
    assert.deepEqual(out.channel, { 관계형성활동: 5 })
    assert.equal(out.unattributed, 0)
  })

  test('채널 순서가 고정돼 있다', () => {
    const out = aggregateTestDriveRows([
      row('기회창출-온라인 유입(상담신청)', '렉서스 강남', 99),
      row('관계형성-자사출고', '렉서스 강남', 1),
    ])
    assert.deepEqual(Object.keys(out.channel), ['관계형성활동', '온라인유입'])
  })

  test('월별 집계는 시승 활동일자 기준', () => {
    const out = aggregateTestDriveRows([
      row('기회창출-내방상담', '렉서스 강남', 10, '2026-03'),
      row('관계형성-자사출고', '렉서스 강남', 20, '2026-04'),
    ])
    assert.deepEqual(out.month, { '2026-03': 10, '2026-04': 20 })
  })

  test('빈 입력에서도 등식이 성립한다', () => {
    const out = aggregateTestDriveRows([])
    assert.equal(out.total, 0)
    assert.equal(out.reconciliation.ok, true)
  })
})
