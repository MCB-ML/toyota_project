// Semantic Signature — 지표 의미 구조:
//   node --test backend/agentic-bi/semantic/signature.test.js
import { test, describe } from 'node:test'
import assert from 'node:assert/strict'

import { signatureOf, migrationClass, CONCEPT, KIND, WINDOW } from './signature.js'
import { loadRegistry } from '../app/semantic/registry.js'

describe('signature 추론', () => {
  test('출력 단위와 계산 창을 따로 잡는다 — 이게 이 구조의 존재 이유다', () => {
    // "월별 YTD"를 표현하려면 두 축이 있어야 한다. 한 필드였다면 이 요청 자체가 사라진다.
    const s = signatureOf({ id: 'contract_ytd_actual', name_ko: '계약 실적(연누적)', default_time_grain: 'month', supported_time_grains: ['month', 'year'] })
    assert.equal(s.time.output_grain, 'month')
    assert.equal(s.time.calculation_window, WINDOW.YEAR_TO_DATE)
    assert.equal(s.time.cumulative, true)
  })

  test('같은 개념이라도 mtd와 ytd는 계산 창이 갈린다', () => {
    const mtd = signatureOf({ id: 'contract_mtd_actual', default_time_grain: 'month' })
    const ytd = signatureOf({ id: 'contract_ytd_actual', default_time_grain: 'month' })
    assert.equal(mtd.time.calculation_window, WINDOW.MONTH_TO_DATE)
    assert.equal(ytd.time.calculation_window, WINDOW.YEAR_TO_DATE)
    // 개념·단위는 같다 — 오직 창만 다르다. 그래서 SQL이 성공하고 표 모양도 같다.
    assert.deepEqual(mtd.measure, ytd.measure)
    assert.equal(mtd.time.output_grain, ytd.time.output_grain)
  })

  test('비율은 절대치와 다른 종류로 표시된다', () => {
    const r = signatureOf({ id: 'contract_progress_rate_mtd', name_ko: '계약 진행률' })
    assert.equal(r.measure.concept, CONCEPT.RATE)
    assert.equal(r.measure.kind, KIND.RATIO)
    assert.equal(signatureOf({ id: 'contract_mtd_actual' }).measure.kind, KIND.ABSOLUTE)
  })

  test('목표와 실적과 취소를 구분한다', () => {
    assert.equal(signatureOf({ id: 'contract_mtd_target' }).measure.concept, CONCEPT.TARGET)
    assert.equal(signatureOf({ id: 'contract_mtd_actual' }).measure.concept, CONCEPT.ACTUAL)
    assert.equal(signatureOf({ id: 'contract_mtd_cancelled' }).measure.concept, CONCEPT.CANCELLED)
  })

  test('이름 괄호 안 설명이 개념을 뒤집지 못한다', () => {
    // 실측된 세 가지 오분류. 괄호를 그대로 읽으면 실적이 취소로, 건수가 비율로 바뀐다.
    assert.equal(
      signatureOf({ id: 'contract_mtd_actual', name_ko: '당월 계약 실적 (전체실적, 취소 제외)' }).measure.concept,
      CONCEPT.ACTUAL,
      '"취소 제외"는 취소 건수가 아니라 취소를 뺐다는 뜻이다',
    )
    assert.equal(
      signatureOf({ id: 'contract_ytd_total_including_cancelled', name_ko: '연누적 계약 전체 건수 (취소 포함, 달성률 분자 전용)' }).measure.kind,
      KIND.ABSOLUTE,
      '"달성률 분자 전용"은 용도 설명이지 이 지표가 비율이라는 뜻이 아니다',
    )
  })

  test('_mtd가 끝에 붙어도 창을 읽는다', () => {
    // `contract_progress_rate_mtd`는 뒤에 밑줄이 없어 예전 규칙에선 period로 샜다.
    assert.equal(signatureOf({ id: 'contract_progress_rate_mtd' }).time.calculation_window, WINDOW.MONTH_TO_DATE)
    assert.equal(signatureOf({ id: 'contract_ytd_achievement_rate' }).time.calculation_window, WINDOW.YEAR_TO_DATE)
  })

  test('grain이 배열이 아니어도 죽지 않는다', () => {
    // `grain: unresolved`인 지표가 실제로 있다. 여기서 던지면 registry 전체가 못 뜬다.
    const s = signatureOf({ id: 'x_unknown', grain: 'unresolved' })
    assert.equal(s.time.output_grain, null)
    assert.equal(s.confidence, 'low')
  })

  test('YAML에 적힌 signature가 추론을 이긴다', () => {
    // 이름이 ytd라도 사람이 period라고 적었으면 사람 말이 맞다.
    const s = signatureOf({ id: 'contract_ytd_actual', semantic_signature: { time: { calculation_window: WINDOW.PERIOD } } })
    assert.equal(s.time.calculation_window, WINDOW.PERIOD)
    assert.equal(s.source, 'declared')
  })

  test('근거 없이 추론한 값은 확신도를 낮춰 남긴다', () => {
    // 확신도가 낮은 signature로 후보를 탈락시키면 안 된다 — 그 판단의 재료가 이 값이다.
    const weak = signatureOf({ id: 'something_odd', default_time_grain: 'month' })
    assert.equal(weak.confidence, 'low')
    assert.ok(weak.evidence.length > 0, '근거를 안 남기면 왜 그렇게 판정했는지 알 수 없다')
  })
})

describe('마이그레이션 분류 (59개를 한 번에 바꾸지 않기 위한 것)', () => {
  test('창과 개념이 다 읽히면 AUTO_SAFE', () => {
    assert.equal(migrationClass({ id: 'contract_mtd_actual', default_time_grain: 'month' }), 'AUTO_SAFE')
  })

  test('근거가 없으면 AMBIGUOUS — 사람이 정해야 한다', () => {
    assert.equal(migrationClass({ id: 'something_odd', default_time_grain: 'month' }), 'AMBIGUOUS')
  })

  test('YAML에 적힌 건 마이그레이션 대상이 아니다', () => {
    assert.equal(migrationClass({ id: 'x', semantic_signature: {} }), 'DECLARED')
  })
})

describe('실제 지표 전체 (registry 통합)', () => {
  const { metrics } = loadRegistry({ force: true })

  test('모든 지표가 signature를 갖는다', () => {
    assert.ok(metrics.size >= 55, `지표가 ${metrics.size}개뿐입니다 — 로더가 일부만 읽었습니다`)
    for (const [id, m] of metrics) {
      assert.ok(m.semantic_signature, `${id}에 signature가 없습니다`)
      assert.ok(m.semantic_signature.measure, `${id} signature에 measure가 없습니다`)
    }
  })

  test('기존 계약 필드는 그대로다 — signature는 추가일 뿐 변경이 아니다', () => {
    // expression이 바뀌면 숫자가 바뀐다. 이 레이어는 절대 거기 손대지 않는다.
    for (const [id, m] of metrics) {
      if (m.expression !== undefined) assert.equal(typeof m.expression, 'string', `${id} expression이 훼손됐습니다`)
      assert.ok(Array.isArray(m.source_dependencies), `${id} source_dependencies가 사라졌습니다`)
    }
  })

  test('_mtd_/_ytd_ 지표는 전부 창이 제대로 읽힌다', () => {
    for (const [id, m] of metrics) {
      const w = m.semantic_signature.time.calculation_window
      if (id.includes('_mtd_')) assert.equal(w, WINDOW.MONTH_TO_DATE, `${id}`)
      if (id.includes('_ytd_')) assert.equal(w, WINDOW.YEAR_TO_DATE, `${id}`)
    }
  })
})
