// 조회 파라미터 검증 — 라이브 DB 없이 돈다:
//   node --test backend/dealerFunnel/handlerQuery.test.js
import { test, describe } from 'node:test'
import assert from 'node:assert/strict'

import { parseActivityQuery, defaultPeriod } from '../dealerFunnelHandler.js'

const params = (qs) => new URL(`http://x/?${qs}`).searchParams
const AUG = new Date(Date.UTC(2026, 7, 10))   // 2026-08-10

describe('활동 조회 파라미터', () => {
  test('기본 기간은 올해 1월 1일 ~ 다음 달 1일', () => {
    // 당월을 끝까지 포함해야 "이번 달 진행 상황"이 보인다. 미완성 달이라는 표시는 화면이 한다.
    assert.deepEqual(defaultPeriod(AUG), { from: '2026-01-01', to: '2026-09-01' })
    assert.deepEqual(defaultPeriod(new Date(Date.UTC(2026, 11, 5))), { from: '2026-01-01', to: '2027-01-01' })
  })

  test('값을 안 주면 기본 기간을 쓴다', () => {
    assert.deepEqual(parseActivityQuery(params(''), AUG), { from: '2026-01-01', to: '2026-09-01', brand: null })
  })

  test('브랜드는 대소문자를 가리지 않는다', () => {
    assert.equal(parseActivityQuery(params('brand=lexus'), AUG).brand, 'LEXUS')
    assert.equal(parseActivityQuery(params('brand=Toyota'), AUG).brand, 'TOYOTA')
  })

  test('날짜 형식이 아니면 거부한다 — 조용히 기본값으로 넘어가지 않는다', () => {
    assert.ok(parseActivityQuery(params('from=2026/01/01'), AUG).error)
    assert.ok(parseActivityQuery(params('to=오늘'), AUG).error)
  })

  test('from이 to 이상이면 거부한다', () => {
    assert.ok(parseActivityQuery(params('from=2026-05-01&to=2026-05-01'), AUG).error)
    assert.ok(parseActivityQuery(params('from=2026-06-01&to=2026-05-01'), AUG).error)
  })

  test('없는 브랜드는 거부한다 — 빈 결과를 정답처럼 내보내지 않는다', () => {
    const r = parseActivityQuery(params('brand=HONDA'), AUG)
    assert.ok(r.error)
    assert.match(r.error, /LEXUS/)
  })
})
