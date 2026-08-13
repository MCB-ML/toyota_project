// 채널 매핑 — 정의서 3-1:
//   node --test backend/dealerFunnel/channelMap.test.js
import { test, describe } from 'node:test'
import assert from 'node:assert/strict'

import {
  CHANNEL, CATEGORY, CHANNEL_MAP, CHANNEL_ORDER, PROGRESS_TYPES, classifyActivityType,
} from './channelMap.js'

describe('활동유형 → 채널/카테고리 (정의서 3-1)', () => {
  test('관계형성활동 5종 — 그룹 컬럼이 아니라 활동유형명으로 정해진다', () => {
    // 이 세 가지가 tp_grp_1로 매핑하면 틀리는 자리다(2026-08-10 실측).
    //   생일 연락·출고 기념일 연락 → tp_grp_1='연락'
    //   관계형성 소개              → tp_grp_1='기회창출'
    for (const tp of ['관계형성-자사출고', '관계형성-타사출고', '관계형성-생일 연락',
      '관계형성-출고 기념일 연락', '기회창출-관계형성 소개']) {
      assert.deepEqual(classifyActivityType(tp),
        { channel: CHANNEL.RELATIONSHIP, category: CATEGORY.EXISTING }, tp)
    }
  })

  test('관계형성 소개는 SC활동이 아니다 — 정의서가 특히 주의로 표시한 항목', () => {
    assert.equal(classifyActivityType('기회창출-관계형성 소개').channel, CHANNEL.RELATIONSHIP)
    assert.notEqual(classifyActivityType('기회창출-관계형성 소개').channel, CHANNEL.SC)
  })

  test('SC활동 2종 · 내방/내전 2종 · 온라인유입 2종', () => {
    assert.equal(classifyActivityType('기회창출-잠재고객').channel, CHANNEL.SC)
    assert.equal(classifyActivityType('기회창출-판촉(개인/팀/회사)').channel, CHANNEL.SC)
    assert.equal(classifyActivityType('기회창출-내방상담').channel, CHANNEL.WALK_IN)
    assert.equal(classifyActivityType('기회창출-내전상담').channel, CHANNEL.WALK_IN)
    assert.equal(classifyActivityType('기회창출-온라인 유입(시승신청)').channel, CHANNEL.ONLINE)
    assert.equal(classifyActivityType('기회창출-온라인 유입(상담신청)').channel, CHANNEL.ONLINE)
  })

  test('신규유입은 내방/내전과 온라인유입뿐 — 나머지는 기존고객', () => {
    const isNew = Object.values(CHANNEL_MAP).filter((v) => v.category === CATEGORY.NEW)
    assert.equal(isNew.length, 4)
    assert.ok(isNew.every((v) => v.channel === CHANNEL.WALK_IN || v.channel === CHANNEL.ONLINE))
  })

  test('기회진행은 채널 매핑 대상이 아니다 — 시승결과만 시승 파이프라인 입력', () => {
    assert.deepEqual(classifyActivityType('기회진행-시승결과'), { progress: true, testdrive: true })
    for (const tp of ['기회진행-시승예약', '기회진행-신차상담', '기회진행-견적']) {
      assert.deepEqual(classifyActivityType(tp), { progress: true, testdrive: false }, tp)
    }
  })

  test('모르는 활동유형은 삼키지 않고 unknown으로 드러낸다', () => {
    // 데이터에 새 유형이 생기면 채널 합계에서 조용히 빠진다 — 정합성 등식이 깨지는 자리라
    // 임의로 어느 채널에 넣지 않고 호출부가 알아채게 한다.
    assert.deepEqual(classifyActivityType('기회창출-새로운유형'), { unknown: true })
    assert.deepEqual(classifyActivityType(''), { unknown: true })
    assert.deepEqual(classifyActivityType(null), { unknown: true })
  })

  test('앞뒤 공백은 무시한다 — 차원 값에 끝 공백이 섞여 있다', () => {
    assert.equal(classifyActivityType(' 관계형성-자사출고 ').channel, CHANNEL.RELATIONSHIP)
  })

  test('2026-01~07 실측 15종이 빠짐없이 분류된다', () => {
    // 실제 Fabric 값 전수(2026-08-10 조회). 새 값이 생기면 이 테스트가 먼저 깨져야 한다.
    const LIVE = [
      '관계형성-자사출고', '기회진행-시승결과', '기회진행-시승예약', '기회창출-잠재고객',
      '관계형성-타사출고', '기회창출-내방상담', '기회창출-온라인 유입(시승신청)',
      '기회창출-판촉(개인/팀/회사)', '기회창출-내전상담', '기회진행-신차상담', '기회진행-견적',
      '기회창출-관계형성 소개', '관계형성-출고 기념일 연락', '기회창출-온라인 유입(상담신청)',
      '관계형성-생일 연락',
    ]
    assert.equal(LIVE.length, 15)
    const unknown = LIVE.filter((tp) => classifyActivityType(tp).unknown)
    assert.deepEqual(unknown, [], `분류 안 되는 활동유형: ${unknown.join(', ')}`)
  })

  test('채널 순서가 고정돼 있다 — 대시보드 축이 실행마다 흔들리면 안 된다', () => {
    assert.deepEqual(CHANNEL_ORDER, ['관계형성활동', 'SC활동', '내방/내전', '온라인유입'])
    const used = new Set(Object.values(CHANNEL_MAP).map((v) => v.channel))
    assert.deepEqual([...used].sort(), [...CHANNEL_ORDER].sort())
  })

  test('기회진행 4종이 전부 선언돼 있다', () => {
    assert.equal(PROGRESS_TYPES.size, 4)
  })
})
