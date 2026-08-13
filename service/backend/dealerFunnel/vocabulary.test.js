// 용어 블록 — 무엇을 가져오고 무엇을 안 가져오는지:
//   node --test backend/dealerFunnel/vocabulary.test.js
import { test, describe } from 'node:test'
import assert from 'node:assert/strict'

import { buildVocabularyBlock } from './vocabulary.js'
import { buildDataBlock } from './htmlEdit.js'

const block = buildVocabularyBlock()

describe('가져오는 것 — 이름의 뜻', () => {
  test('이 파이프라인이 읽는 세 팩트 테이블의 기준 컬럼이 있다', () => {
    for (const col of ['act_dt_fr', 'lead_reg_dt', 'contract_dt', 'ca_act_tp', 'lead_key']) {
      assert.match(block, new RegExp(col), `${col} 설명 누락`)
    }
  })

  test('퍼널과 상관있는 약어만 담는다', () => {
    assert.match(block, /SC \/ sc_key/)
    assert.match(block, /리드 \/ 영업기회 \/ 퍼널/)
    assert.match(block, /딜러 \/ 딜러사/)
  })

  test('cnt와 actual_cnt의 차이를 알려준다 — 모르면 "실적 건수"라고 잘못 부른다', () => {
    assert.match(block, /활동 건수 vs 실적 건수/)
  })
})

describe('안 가져오는 것 — 집계 규칙', () => {
  test('KTWS 시맨틱 지표의 수식·필터·제외규칙이 새어 들어오지 않는다', () => {
    // 딜러퍼널은 계약을 Gross로 세고 자격 SC 필터를 걸지 않는다(channelMap.js).
    // 그쪽 규칙이 섞이면 숫자와 설명이 어긋나는데 둘 다 그럴듯해 보인다.
    for (const leak of ['br_exclude_front_sc', 'sc_scope_default', 'required_filters',
      'exclusion_rules', 'sql_fragment', 'SUM(FCT_ACTIVITY_v2.actual_cnt)']) {
      assert.ok(!block.includes(leak), `집계 규칙이 새어 나갔다: ${leak}`)
    }
  })

  test('퍼널과 무관한 용어는 담지 않는다', () => {
    for (const off of ['NPS', 'PMA', '해피보드', 'contract_ratio', 'spec_key']) {
      assert.ok(!block.includes(off), `무관한 용어가 들어갔다: ${off}`)
    }
  })

  test('집계 규칙은 지표 정의를 따르라고 못박는다', () => {
    assert.match(block, /\[쓸 수 있는 데이터\]의 정의를 따르세요/)
    assert.match(block, /다른 화면\(KTWS\)과 집계 규칙이 다릅니다/)
  })
})

describe('데이터 블록의 기간 표기', () => {
  const data = {
    period: { from: '2026-01-01', to: '2026-09-01' },
    as_of: '2026-08-11',
    metrics: [{ id: '계약', definition: 'Gross', source: 'T', dateBasis: 'd', channelBasis: 'c', available: true }],
    series: { 계약: { total: 21500, month: { '2026-07': 2864, '2026-08': 860 }, channel: { SC활동: 6423 } } },
  }
  const out = buildDataBlock(data)

  test('누계임을 이름에 박는다 — "8월 요약"에 누계를 쓴 모델이 셋 중 둘이었다', () => {
    assert.match(out, /"기간누계":21500/)
    assert.match(out, /"채널_기간누계"/)
    assert.ok(!/"채널":/.test(out), '기간이 안 붙은 이름이 남아 있다')
  })

  test('조회 기간과 기준일을 적는다', () => {
    assert.match(out, /조회 기간 2026-01-01 ~ 2026-09-01/)
    assert.match(out, /기준일 2026-08-11/)
  })

  test('특정 달은 월별에서 뽑으라고 지시한다', () => {
    assert.match(out, /누계를 한 달 값인 양 쓰면 안 됩니다/)
  })

  test('용어 블록이 함께 실린다', () => {
    assert.match(out, /\[용어\]/)
  })

  test('period가 없어도 터지지 않는다', () => {
    assert.ok(buildDataBlock({ metrics: data.metrics, series: data.series }).includes('[집계 결과]'))
  })
})
