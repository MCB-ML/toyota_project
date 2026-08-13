import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import { executeQueryBundle, normalizeQueryBundle } from './dashboardQueryBundle.js'

describe('dashboard query bundle execution', () => {
  test('replays a certified derived query with its bound parameters', async () => {
    const params = {
      year: { type: 'int', value: 2026 },
      month: { type: 'int', value: 4 },
      dealer_nm: { type: 'nvarchar', value: '렉서스 강남' },
    }
    const object = {
      queryBundle: {
        version: 2,
        queries: [{
          id: 'activity_actual_1',
          metricId: 'activity_mtd_actual',
          db: 'KPI_W',
          sql: '/* derived */\nDECLARE @year int = @year;\nSELECT 1 AS activity_mtd_actual',
          execution: { mode: 'certified', source: 'funnel-derived', params },
        }],
        merge: { dimensionKey: null },
        derivations: [],
        transform: null,
      },
    }
    const calls = []

    const normalized = normalizeQueryBundle(object)
    assert.deepEqual(normalized.queries[0].execution, object.queryBundle.queries[0].execution)

    const result = await executeQueryBundle(object, {
      executeReadOnly: async () => {
        throw new Error('read-only executor must not run a certified query')
      },
      executeCertified: async (db, sql, bind) => {
        calls.push({ db, sql, bind })
        return [{ activity_mtd_actual: 47_718 }]
      },
    })

    assert.equal(calls.length, 1)
    assert.deepEqual(calls[0], { db: 'KPI_W', sql: object.queryBundle.queries[0].sql, bind: params })
    assert.deepEqual(result.rows, [{ activity_mtd_actual: 47_718 }])
    assert.equal(result.queryResults[0].status, 'ready')
  })

  // 월별 GOLD 파생은 달마다 같은 SQL을 다른 바인드로 돌린 결과다. 저장된 위젯을
  // 새로고침할 때 params 하나만 재생하면 오류 없이 첫 달짜리 차트가 되어버린다.
  test('replays every month of a monthly derived query, not just the first', async () => {
    const months = [
      { time_month: '2026-03', params: { year: { type: 'int', value: 2026 }, month: { type: 'int', value: 3 } } },
      { time_month: '2026-04', params: { year: { type: 'int', value: 2026 }, month: { type: 'int', value: 4 } } },
    ]
    const sql = '/* derived */\nSELECT 1 AS lead_mtd_actual'
    const calls = []

    const result = await executeQueryBundle({
      queryBundle: {
        version: 2,
        queries: [{
          id: 'lead_1',
          metricId: 'lead_mtd_actual',
          db: 'KPI_W',
          sql,
          execution: {
            mode: 'certified',
            source: 'funnel-derived-monthly',
            params: months[0].params,
            months,
            sourceKey: 'lead_mtd_actual',
          },
        }],
        merge: { dimensionKey: 'time_month' },
        derivations: [],
        transform: null,
      },
    }, {
      executeReadOnly: async () => { throw new Error('read-only executor must not run a certified query') },
      executeCertified: async () => { throw new Error('single-month replay must not be used for a month series') },
      executeMonthSeries: async (querySql, monthList, options) => {
        calls.push({ querySql, monthList, options })
        return monthList.map((m) => ({ time_month: m.time_month, lead_mtd_actual: 100 }))
      },
    })

    assert.equal(calls.length, 1)
    assert.equal(calls[0].querySql, sql)
    assert.deepEqual(calls[0].monthList, months)
    assert.equal(calls[0].options.sourceKey, 'lead_mtd_actual')
    assert.deepEqual(result.rows, [
      { time_month: '2026-03', lead_mtd_actual: 100 },
      { time_month: '2026-04', lead_mtd_actual: 100 },
    ])
    assert.equal(result.queryResults[0].status, 'ready')
  })

  test('rejects a monthly derived query that lost its month list', async () => {
    await assert.rejects(() => executeQueryBundle({
      queryBundle: {
        version: 2,
        queries: [{
          metricId: 'lead_mtd_actual',
          db: 'KPI_W',
          sql: 'SELECT 1 AS lead_mtd_actual',
          execution: { mode: 'certified', source: 'funnel-derived-monthly', params: {} },
        }],
        merge: { dimensionKey: null },
        derivations: [],
        transform: null,
      },
    }, {
      executeReadOnly: async () => { throw new Error('must not fall back to the read-only executor') },
      executeCertified: async () => { throw new Error('must not fall back to single-month replay') },
    }), /월별 인증 재실행 목록/)
  })

  test('keeps ordinary dashboard queries on the read-only executor', async () => {
    const calls = []
    const result = await executeQueryBundle({
      queryBundle: {
        version: 2,
        queries: [{ metricId: 'activity_mtd_actual', db: 'KPI_W', sql: 'SELECT 1 AS activity_mtd_actual' }],
        merge: { dimensionKey: null },
        derivations: [],
        transform: null,
      },
    }, {
      executeReadOnly: async (db, sql) => {
        calls.push({ db, sql })
        return [{ activity_mtd_actual: 1 }]
      },
      executeCertified: async () => {
        throw new Error('certified executor must not run an ordinary query')
      },
    })

    assert.deepEqual(calls, [{ db: 'KPI_W', sql: 'SELECT 1 AS activity_mtd_actual' }])
    assert.deepEqual(result.rows, [{ activity_mtd_actual: 1 }])
  })

  // 2026-08-03 leo: 기존에는 저장된 목표 리포트가 placeholder SQL을 실행해 재조회에 실패했다. 등록 리포트 executor로만 재실행되는 계약을 검증한다.
  test('저장된 출고 목표 지표는 원시 SQL 대신 등록된 리포트로 재조회한다', async () => {
    const reportInput = {
      metrics: ['delivery_mtd_target'],
      dimensions: [],
      filters: [],
      time_range: { type: 'absolute', start_date: '2026-04-01', end_date: '2026-04-30' },
    }
    const accessContext = {
      principalId: 'user-1', tenantId: 'tmkr', roleIds: ['viewer'], organizationIds: ['lexus-gangnam'],
      scopeVersion: 'v1', mandatoryFilters: [],
    }
    const result = await executeQueryBundle({
      queryBundle: {
        version: 2,
        queries: [{
          metricId: 'delivery_mtd_target',
          db: 'KPI_W',
          sql: '-- Registered report replay: sales_achievement_delivery',
          execution: { mode: 'certified', source: 'target-report', input: reportInput },
        }],
        merge: { dimensionKey: null },
        derivations: [],
        transform: null,
      },
    }, {
      executeReadOnly: async () => {
        throw new Error('read-only executor must not run a registered report')
      },
      executeCertified: async () => {
        throw new Error('SQL certified executor must not run a registered report')
      },
      accessContext,
      forceRefresh: true,
      executeTargetMetric: async (input, options) => {
        assert.deepEqual(input, reportInput)
        assert.deepEqual(options, { accessContext, forceRefresh: true })
        return { rows: [{ delivery_mtd_target: 46_493 }] }
      },
    })

    assert.deepEqual(result.rows, [{ delivery_mtd_target: 46_493 }])
    assert.equal(result.queryResults[0].status, 'ready')
  })
})
