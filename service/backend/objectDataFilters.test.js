import assert from 'node:assert/strict'
import { test } from 'node:test'

import { configuredObjectFilterControls } from '../frontend/src/components/widgets/objectDataFilters.js'

test('명시적으로 저장한 객체 필터는 옵션이 100개를 넘어도 유지한다', () => {
  const rows = Array.from({ length: 101 }, (_, index) => ({ SC: `SC ${index + 1}`, 실적: index + 1 }))
  const controls = configuredObjectFilterControls({
    props: { data: rows },
    objectSpec: { dataFilters: { fields: ['SC'] } },
  })

  assert.equal(controls.length, 1)
  assert.equal(controls[0].field, 'SC')
  assert.equal(controls[0].options.length, 101)
})