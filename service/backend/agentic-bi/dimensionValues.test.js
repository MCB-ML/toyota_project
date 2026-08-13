// 차원 값 해석:
//   node --test server/agentic-bi/dimensionValues.test.js
import { test, describe } from 'node:test'
import assert from 'node:assert/strict'

import { matchOne, matchEnum, brandCode, ordinalNumber } from './dimensionValues.js'

const VALUES = ['토요타 동대문', '토요타 용산', '토요타 강남', '렉서스 강남', '렉서스 강서']

describe('이름 맞추기', () => {
  test('정확히 같으면 그대로', () => {
    assert.deepEqual(matchOne('토요타 동대문', VALUES), { value: '토요타 동대문' })
  })

  test('끝 공백은 무시한다 — 저장된 값에 공백이 붙어 있다', () => {
    assert.deepEqual(matchOne('토요타 동대문 ', VALUES), { value: '토요타 동대문' })
    assert.deepEqual(matchOne('토요타동대문', VALUES), { value: '토요타 동대문' })
  })

  test('브랜드를 뗀 이름도 하나로 좁혀지면 찾는다', () => {
    // "동대문 전시장"이라고 하면 group_name에 "동대문"만 들어와 0건이 됐다.
    assert.deepEqual(matchOne('동대문', VALUES), { value: '토요타 동대문' })
    assert.deepEqual(matchOne('강서', VALUES), { value: '렉서스 강서' })
  })

  test('후보가 여럿이면 고르지 않고 후보를 돌려준다', () => {
    // 임의로 고르면 사용자는 다른 매장 숫자를 보게 된다.
    const hit = matchOne('강남', VALUES)
    assert.deepEqual(hit.candidates.sort(), ['렉서스 강남', '토요타 강남'])
    assert.equal(hit.value, undefined)
  })

  test('없는 이름은 unknown', () => {
    assert.deepEqual(matchOne('없는곳', VALUES), { unknown: true })
    assert.deepEqual(matchOne('', VALUES), { unknown: true })
  })

  test('값 뒤에 붙은 차원 이름은 떼고 다시 본다', () => {
    // 값보다 긴 입력은 원래 역방향 포함으로 잡힌다("렉서스 강남 전시장").
    assert.deepEqual(matchOne('렉서스 강남 전시장', VALUES), { value: '렉서스 강남' })
    // 브랜드까지 빠지면 그 단계도 빗나간다 — 2026-08-05 실측: LLM이 "렉서스 부산
    // 전시장"에서 group_name으로 "부산 전시장"을 보내 오류 없이 0행이 나갔다.
    assert.deepEqual(matchOne('동대문 전시장', VALUES), { value: '토요타 동대문' })
    assert.deepEqual(matchOne('강서 딜러사', VALUES), { value: '렉서스 강서' })
  })

  test('접미어를 떼도 여럿이면 되묻는다 — 조용히 하나를 고르지 않는다', () => {
    const hit = matchOne('강남 전시장', VALUES)
    assert.deepEqual(hit.candidates.sort(), ['렉서스 강남', '토요타 강남'])
    assert.equal(hit.value, undefined)
  })

  test('접미어만 남는 입력은 떼지 않는다', () => {
    // "전시장"만 오면 뗄 게 없다 — 빈 문자열로 아무거나 맞히면 안 된다.
    assert.deepEqual(matchOne('전시장', VALUES), { unknown: true })
  })

  test('팀 이름 안의 "팀"은 접미어로 떼지 않는다', () => {
    const teams = ['강남영업1팀', '영업6팀', '부산영업2팀']
    assert.deepEqual(matchOne('강남영업1팀', teams), { value: '강남영업1팀' })
    assert.deepEqual(matchOne('영업6팀', teams), { value: '영업6팀' })
  })
})

// 이름이 아니라 코드/숫자 도메인. 사용자 말투 그대로 넘기면 LIKE 패딩 비교에
// 걸리지 않아 오류 없이 0행이 나간다 — 빈 표를 정답으로 받는 종류다.
describe('코드 값 되돌리기', () => {
  test('브랜드는 코드로 바꾼다 — BRAND는 LEXUS/TOYOTA다', () => {
    // 2026-08-05 실측: brand="렉서스"로 나가 활동 일별 진행 현황이 0행이 됐다.
    assert.equal(brandCode('렉서스'), 'LEXUS')
    assert.equal(brandCode('토요타'), 'TOYOTA')
    assert.equal(brandCode('Lexus'), 'LEXUS')
    assert.equal(brandCode('LEXUS'), 'LEXUS')
  })

  test('모르는 브랜드는 그대로 둔다 — 여기서 막으면 값이 늘었을 때 답을 못 한다', () => {
    assert.equal(brandCode('HINO'), 'HINO')
  })

  test('회차는 숫자만 남긴다 — meet_ym_seq는 정수다', () => {
    // 2026-08-05 실측: meet_round="3회차"로 나가 핫보드 회의가 0행이 됐다.
    assert.equal(ordinalNumber('3회차'), '3')
    assert.equal(ordinalNumber('3 회차'), '3')
    assert.equal(ordinalNumber('12차'), '12')
    assert.equal(ordinalNumber('3'), '3')
  })

  test('숫자가 섞인 이름은 건드리지 않는다', () => {
    assert.equal(ordinalNumber('강남영업1팀'), '강남영업1팀')
    assert.equal(ordinalNumber('ES300h(N)'), 'ES300h(N)')
  })
})

describe('열거형 차원 — 활동유형/활동그룹', () => {
  const ACT_TYPE = ['출고', '자사출고', '타사출고', '관계형성 소개', '시승완료', '계약']
  const ACT_GROUP = ['관계형성', '기회진행', '기회창출', '연락', '판매목표 대수', '활동기준 대수']

  test('정확히 같으면 찾는다', () => {
    assert.deepEqual(matchEnum('자사출고', ACT_TYPE), { value: '자사출고' })
    assert.deepEqual(matchEnum('관계형성', ACT_GROUP), { value: '관계형성' })
  })

  test('부분 일치로 다른 값을 만들어내지 않는다', () => {
    // 분류 체계는 값끼리 서로 부분 문자열이다. 부분 일치를 쓰면 활동그룹의 '관계형성'이
    // 활동유형에서 '관계형성 소개'로 조용히 바뀐다 — 사용자가 묻지 않은 지표가 나간다.
    assert.deepEqual(matchEnum('관계형성', ACT_TYPE), { unknown: true })
    // '출고'는 자사출고/타사출고에 들어 있지만 그 자체가 실제 값이므로 정확 일치가 이긴다.
    assert.deepEqual(matchEnum('출고', ACT_TYPE), { value: '출고' })
  })

  test('그 차원에 없으면 못 찾은 채로 둔다 — 옮길지는 호출부가 정한다', () => {
    assert.deepEqual(matchEnum('자사출고', ACT_GROUP), { unknown: true })
  })

  test('공백·대소문자는 무시한다', () => {
    assert.deepEqual(matchEnum('자사 출고', ACT_TYPE), { value: '자사출고' })
    assert.deepEqual(matchEnum(' 관계형성 ', ACT_GROUP), { value: '관계형성' })
  })
})
