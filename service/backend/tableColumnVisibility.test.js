import assert from 'node:assert/strict'
import { describe, test } from 'node:test'

import { buildTableColumns } from '../frontend/src/components/widgets/tableModel.js'
import { normalizeDashboardObject } from '../frontend/src/utils/dashboardObject.js'

describe('표 컬럼 표시 계약', () => {
  test('visible=false인 컬럼은 저장·렌더링 모델에서 비표시로 유지한다', () => {
    const columns = buildTableColumns({
      columns: ['dealer', 'actual'],
      rows: [['렉서스 강남', 12]],
      tableSpec: {
        columns: [
          { field: 'dealer', visible: true },
          { field: 'actual', visible: false },
        ],
      },
    })

    assert.equal(columns.find((column) => column.field === 'dealer').visible, true)
    assert.equal(columns.find((column) => column.field === 'actual').visible, false)
  })

  test('기존 hidden 저장값은 반대 의미의 visible로 정규화하고 다시 저장하지 않는다', () => {
    const object = normalizeDashboardObject({
      id: 'table-visibility-test',
      type: 'render_table',
      title: '표',
      props: {
        columns: ['dealer', 'actual'],
        rows: [['렉서스 강남', 12]],
      },
      objectSpec: {
        tableSpec: {
          columns: [
            { field: 'dealer', hidden: false },
            { field: 'actual', hidden: true },
          ],
        },
      },
    })

    assert.deepEqual(object.objectSpec.tableSpec.columns, [
      { field: 'dealer', visible: true },
      { field: 'actual', visible: false },
    ])
  })
})
