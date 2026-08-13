import { readJsonBody } from './azureClient.js'
import { getPool } from './db.js'
import { buildWidgetPropsFromRows } from './widgetSchema.js'
import { executeCachedQueryBundle } from './dashboardObjectExecution.js'
import { executeReportWithView } from './reports/series.js'
import { projectReportView, rollupReportRows } from './reports/projection.js'
import { authorizeDashboardObject, dashboardAccessContextFor, resolveDataAccessContext } from './dashboardAccessControl.js'
import { canAccessScope, normalizeRole, requireIdentity } from './auth.js'
import {
  normalizeDashboardObject,
  normalizeDashboardState,
  toStoredDashboardObject,
  validateDashboardState,
  withObjectRuntime,
} from '../frontend/src/utils/dashboardObject.js'

const DEFAULT_NAME = '기본'
const MAX_SAVED_PAGES = 5

// 신원 확인은 auth.js 한 곳에서 한다 — 토큰 서명을 직접 검증하고, 그게 안 되면
// 그때만 어드민 /auth/check 로 물어본다. 예전에는 이 파일이 언제나 어드민을 HTTP 로
// 호출했는데, 요청마다 왕복이 붙고 어드민이 죽으면 대시보드도 같이 멈췄다.
async function requireActor(req, res, db = getPool(), body = null) {
  const identity = await requireIdentity(req, res, { body, db, sendJson })
  if (!identity) return null
  return { email: identity.email, role: normalizeRole(identity.role), scopeKey: identity.scopeKey }
}

// 요청이 건드리려는 스코프가 이 사람 것인지 본다. 본사는 전체를 본다.
// 자기 스코프가 아니면 아예 없는 것처럼 다뤄야 하므로 호출부는 이 검사를 조회
// 이전에 해야 한다 — 나중에 하면 남의 딜러사에 무엇이 있는지가 응답 차이로 새어 나간다.
function requireScope(res, actor, targetScopeKey) {
  if (canAccessScope(actor, targetScopeKey)) return true
  sendJson(res, 403, { message: '이 소속의 대시보드에 접근할 권한이 없습니다.' })
  return false
}

function deployPermission(actor, targetScopeKey) {
  const role = normalizeRole(actor?.role)
  if (role !== 'user' && role !== 'admin') return { view: false, pin: false }
  if (actor?.scopeKey === targetScopeKey) return { view: true, pin: true }
  if (actor?.scopeKey === 'hq') return { view: true, pin: role === 'admin' }
  return { view: false, pin: false }
}

function parseVersion(value) {
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : null
}

// 2026-08-04 leo: 페이지 내 위젯별 개별 재조회는 Fabric 연결을 한꺼번에 소비했다.
// batch worker 수는 환경 변수로 제한하고 레이아웃 상단 객체를 먼저 실행한다.
function positiveInteger(value, fallback) {
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback
}

async function mapWithConcurrency(items, limit, mapper) {
  const results = new Array(items.length)
  let nextIndex = 0
  const workerCount = Math.min(items.length, Math.max(1, limit))
  await Promise.all(Array.from({ length: workerCount }, async () => {
    while (true) {
      const index = nextIndex
      nextIndex += 1
      if (index >= items.length) return
      results[index] = await mapper(items[index])
    }
  }))
  return results
}

function layoutPosition(value) {
  return Number.isFinite(value) ? value : Number.MAX_SAFE_INTEGER
}

// 2026-08-04 leo: Page data is restored in a bounded queue. Sorting by the saved grid position
// lets the widgets nearest the initial viewport claim the first permits while
// preserving the client-visible response shape (the reducer merges by id).
function prioritizeInitialViewportObjects(objects) {
  return [...objects].sort((left, right) => (
    layoutPosition(left.layout?.y) - layoutPosition(right.layout?.y) ||
    layoutPosition(left.layout?.x) - layoutPosition(right.layout?.x) ||
    String(left.id).localeCompare(String(right.id))
  ))
}

function sendJson(res, status, body) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.end(JSON.stringify(body))
}

function asObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {}
}

function stableStringify(value) {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`
  if (value && typeof value === 'object') {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(',')}}`
  }
  return JSON.stringify(value)
}

function rowToObject(row) {
  return normalizeDashboardObject({
    ...asObject(row.source_meta),
    id: row.object_id,
    objectType: row.object_type,
    type: row.renderer_type,
    chartCode: row.chart_code,
    title: row.title,
    queryBundle: row.query_bundle,
    querySpec: row.query_spec,
    objectSpec: row.object_spec,
    layout: row.layout,
    refreshPolicy: row.refresh_policy,
  })
}

function sourceMetaFor(object) {
  return {
    db: object.db || null,
    table: object.table || null,
    topic: object.topic || null,
    ragPatternId: object.ragPatternId || null,
    createdAt: object.createdAt || null,
  }
}

function objectRecord(object, sortOrder) {
  const stored = toStoredDashboardObject(object)
  return {
    objectId: stored.id,
    objectType: stored.objectType,
    rendererType: stored.type,
    chartCode: stored.chartCode,
    title: stored.title,
    queryBundle: stored.queryBundle || {},
    querySpec: stored.querySpec || {},
    objectSpec: stored.objectSpec || {},
    layout: stored.layout || {},
    refreshPolicy: stored.refreshPolicy || {},
    sourceMeta: sourceMetaFor(stored),
    sortOrder,
  }
}

function recordFingerprint(record) {
  return stableStringify({
    objectType: record.objectType,
    rendererType: record.rendererType,
    chartCode: record.chartCode,
    title: record.title,
    queryBundle: record.queryBundle,
    querySpec: record.querySpec,
    objectSpec: record.objectSpec,
    layout: record.layout,
    refreshPolicy: record.refreshPolicy,
    sourceMeta: record.sourceMeta,
    sortOrder: record.sortOrder,
  })
}

function rowRecord(row) {
  const object = rowToObject(row)
  return objectRecord(object, row.sort_order)
}

function loadingObject(object) {
  return withObjectRuntime(toStoredDashboardObject(object), { status: 'loading' })
}

function querySpecWithPresentationFallback(object) {
  const querySpec = { ...(object.querySpec || {}) }
  const binding = object.objectSpec?.vizSpec?.binding || {}
  if (querySpec.orientation === undefined && binding.orientation) querySpec.orientation = binding.orientation
  if (querySpec.stacked === undefined && binding.stacked !== undefined) querySpec.stacked = binding.stacked

  // A chart saved by the object editor keeps its combo mapping in querySpec.
  // This fallback lets an object-spec-only record still render correctly after
  // reload, which is useful for older objects and AI-created object plans.
  if (object.chartCode !== 'combo' || (querySpec.barKeys?.length || querySpec.lineKeys?.length)) return querySpec
  const columnMap = object.objectSpec?.vizSpec?.columnMap || {}
  const fields = [...new Set([
    ...(Array.isArray(binding.series) ? binding.series : []),
    ...Object.entries(columnMap).filter(([, value]) => value?.series).map(([field]) => field),
  ])]
  if (!fields.length) return querySpec
  const lineKeys = fields.filter((field) => columnMap[field]?.series?.type === 'line')
  const barKeys = fields.filter((field) => !lineKeys.includes(field))
  if (!barKeys.length && !lineKeys.length) return querySpec
  return {
    ...querySpec,
    barKeys,
    lineKeys,
    barLabels: barKeys.map((field) => columnMap[field]?.label || field),
    lineLabels: lineKeys.map((field) => columnMap[field]?.label || field),
    secondaryKeys: fields.filter((field) => columnMap[field]?.series?.axis === 'right'),
  }
}

async function loadPageObjects(db, pageId) {
  const { rows } = await db.query(
    `SELECT object_id, object_type, renderer_type, chart_code, title,
            query_bundle, query_spec, object_spec, layout, refresh_policy,
            source_meta, object_version, sort_order, created_at, updated_at
       FROM dashboard_objects
      WHERE page_id = $1
      ORDER BY sort_order, created_at`,
    [pageId]
  )
  return rows
}

function snapshotToObject(snapshot) {
  return normalizeDashboardObject({
    ...asObject(snapshot.sourceMeta || snapshot.source_meta),
    id: snapshot.objectId || snapshot.object_id,
    objectType: snapshot.objectType || snapshot.object_type,
    type: snapshot.rendererType || snapshot.renderer_type,
    chartCode: snapshot.chartCode || snapshot.chart_code,
    title: snapshot.title,
    queryBundle: snapshot.queryBundle || snapshot.query_bundle,
    querySpec: snapshot.querySpec || snapshot.query_spec,
    objectSpec: snapshot.objectSpec || snapshot.object_spec,
    layout: snapshot.layout,
    refreshPolicy: snapshot.refreshPolicy || snapshot.refresh_policy,
  })
}

async function loadPageObjectsAtVersion(db, pageId, version) {
  if (!Number.isInteger(version)) return null
  const { rows: manifestRows } = await db.query(
    'SELECT object_manifest FROM dashboard_page_versions WHERE page_id = $1 AND version = $2',
    [pageId, version]
  )
  if (!manifestRows.length) return null
  const manifest = Array.isArray(manifestRows[0].object_manifest) ? manifestRows[0].object_manifest : []
  if (!manifest.length) return []
  const ids = manifest.map((entry) => String(entry.id || '')).filter(Boolean)
  const versions = manifest.map((entry) => Number(entry.version))
  if (ids.length !== manifest.length || versions.some((item) => !Number.isInteger(item))) return null
  const { rows } = await db.query(
    `SELECT ov.object_id, ov.object_snapshot
       FROM dashboard_object_versions ov
       JOIN unnest($2::text[], $3::int[]) AS want(object_id, version)
         ON ov.object_id = want.object_id AND ov.version = want.version
      WHERE ov.page_id = $1 AND ov.operation <> 'delete' AND ov.object_snapshot IS NOT NULL`,
    [pageId, ids, versions]
  )
  const byId = new Map(rows.map((row) => [row.object_id, row.object_snapshot]))
  return manifest.map((entry) => byId.get(String(entry.id))).filter(Boolean).map(snapshotToObject)
}

async function findDeployment(db, scopeKey, pageKey) {
  const { rows } = await db.query(
    `SELECT p.page_id, p.name, d.page_version, d.deployed_at, d.deployed_by
       FROM dashboard_deployments d
       JOIN dashboard_pages p ON p.page_id = d.page_id
      WHERE d.scope_key = $1 AND d.target_page_key = $2`,
    [scopeKey, pageKey]
  )
  return rows[0] || null
}
// 2026-08-04 leo: 저장 객체에 결과 행을 넣지 않고 요청 시 재구성하되, queryBundle과 인증
// 리포트 모두 Redis cache/access context/force refresh를 같은 방식으로 통과시킨다.
//
// accessContext 는 호출부(핸들러)가 검증된 신원으로 만들어 넘긴다 — 그 값이 곧 캐시
// 공유 범위다. 배포본 경로는 딜러사 단위, 개인 작업본 경로는 소유자 단위로 넘어온다.
async function rehydrateObject(object, { request = null, forceRefresh = false, accessContext = null } = {}) {
  try {
    accessContext = accessContext || resolveDataAccessContext(request)
    const authorization = authorizeDashboardObject(object, accessContext)
    if (!authorization.allowed) throw new Error(authorization.reason || '이 대시보드 객체에 접근할 권한이 없습니다.')
    if (object.querySpec?.reportId) {
      const result = await executeReportWithView(object.querySpec.reportId, object.querySpec.reportParams || {}, {
        reportView: object.querySpec.reportView || null,
        accessContext,
        forceRefresh,
      })
      const isFunnelReportView = object.querySpec.reportView?.startsWith('funnel_')
      const view = object.querySpec.reportGroupBy && !isFunnelReportView
        ? (() => {
            const rolled = rollupReportRows(result, object.querySpec.reportGroupBy)
            return { ...result, rows: [...rolled.rows, ...rolled.totalRows], dimensionColumns: object.querySpec.reportGroupBy }
          })()
        : result
      const projected = projectReportView(view, object.querySpec.reportSelectedColumns || null, object.querySpec.reportView || null)
      const chartCode = projected.chartCode || object.chartCode || 'table'
      const querySpec = {
        ...(object.querySpec || {}),
        ...(chartCode === 'funnel' ? {
          labelKey: object.querySpec.labelKey || '단계',
          valueKey: object.querySpec.valueKey || '실적',
          dimensionKey: object.querySpec.dimensionKey || '단계',
          measureKeys: object.querySpec.measureKeys || ['실적'],
          measureLabels: object.querySpec.measureLabels || ['실적'],
        } : {}),
        ...(chartCode === 'funnel_pyramid' ? {
          stageKey: object.querySpec.stageKey || '단계',
          totalKey: object.querySpec.totalKey || '단계 합계',
          channels: object.querySpec.channels || ['관계형성활동', 'SC활동', '내방/내전', '온라인유입'],
          stageWidthFractions: object.querySpec.stageWidthFractions || object.querySpec.stageWidths,
          channelMeta: object.querySpec.channelMeta,
          domainMeta: object.querySpec.domainMeta,
          dimensionKey: object.querySpec.dimensionKey || '단계',
          measureKeys: object.querySpec.measureKeys || object.querySpec.channels || ['관계형성활동', 'SC활동', '내방/내전', '온라인유입'],
          measureLabels: object.querySpec.measureLabels || object.querySpec.channels || ['관계형성활동', 'SC활동', '내방/내전', '온라인유입'],
        } : {}),
      }
      const built = chartCode === 'table'
        ? {
            type: 'render_table',
            props: {
              title: object.title,
              columns: projected.columns,
              rows: projected.rows.map((row) => projected.columns.map((column) => row[column])),
              reportId: result.reportId,
              reportColumnSemantics: result.columnSemantics,
            },
          }
        : buildWidgetPropsFromRows(chartCode, projected.rows, querySpec, object.title)
      return withObjectRuntime({
        ...object,
        chartCode,
        type: built.type,
        props: built.props,
      }, {
        status: 'ready',
        refreshedAt: new Date().toISOString(),
        rowCount: projected.rows.length,
        queryResults: [],
        cache: result.cache || { state: result.cached ? 'fresh' : 'miss', refreshing: false, fetchedAt: result.fetchedAt },
        sourceFingerprint: result.sourceFingerprint || null,
      })
    }

    const { rows, queryResults, cache, sourceFingerprint } = await executeCachedQueryBundle(object, { accessContext, forceRefresh })
    if (rows === null) return withObjectRuntime(object, { status: 'ready', rowCount: 0, queryResults: [] })

    let renderRows = rows
    if (object.chartCode === 'kpi' && object.querySpec?.percentageFormat && object.querySpec?.cardKey) {
      const key = object.querySpec.cardKey
      renderRows = rows.map((row) => (
        typeof row[key] === 'number' ? { ...row, [key]: `${(row[key] * 100).toFixed(1)}%` } : row
      ))
    }
    const querySpec = querySpecWithPresentationFallback(object)
    const built = buildWidgetPropsFromRows(object.chartCode, renderRows, querySpec, object.title)
    return withObjectRuntime({ ...object, type: built.type, props: built.props }, {
      status: 'ready',
      refreshedAt: new Date().toISOString(),
      rowCount: rows.length,
      queryResults,
      cache,
      sourceFingerprint,
    })
  } catch (error) {
    console.error(`[dashboard-pages] object ${object.id} rehydrate failed:`, error.message)
    return withObjectRuntime(object, { status: 'error', message: error.message })
  }
}

// 작업본은 개인 것이다 — 같은 딜러사라도 남의 작업본은 보이지 않는다.
// 딜러사 전체가 함께 보는 것은 배포본(dashboard_deployments 경유)과 템플릿뿐이다.
//
// owner_email 이 NULL 인 행(007 이전에 만들어져 주인을 알 수 없는 레거시)도
// 여기서 걸러진다. 폴백으로 딜러사 전체에 열어주면 그게 곧 "개인 작업본 공유"라서,
// 레거시 행은 배포본으로만 보이고 작업본 목록에서는 사라지는 쪽을 택한다.
async function findPage(db, scopeKey, name, { ownerEmail = null, forUpdate = false } = {}) {
  const { rows } = await db.query(
    `SELECT page_id, scope_key, owner_email, name, target_page_key, is_deployed, is_template, version, updated_at
       FROM dashboard_pages
      WHERE scope_key = $1 AND name = $2 AND owner_email = $3
      LIMIT 1${forUpdate ? ' FOR UPDATE' : ''}`,
    [scopeKey, name, ownerEmail]
  )
  return rows[0] || null
}

export async function handleGetSavedPage(req, res) {
  const url = new URL(req.url, 'http://internal')
  const scopeKey = url.searchParams.get('scopeKey')
  const name = url.searchParams.get('name') || DEFAULT_NAME
  if (!scopeKey) return sendJson(res, 400, { message: 'scopeKey가 필요합니다.' })

  const actor = await requireActor(req, res)
  if (!actor) return
  if (!requireScope(res, actor, scopeKey)) return

  try {
    const pool = getPool()
    const page = await findPage(pool, scopeKey, name, { ownerEmail: actor.email })
    if (!page) return sendJson(res, 200, { version: 0, widgets: [] })
    const widgets = (await loadPageObjects(pool, page.page_id)).map(rowToObject).map(loadingObject)
    return sendJson(res, 200, { version: page.version, widgets })
  } catch (error) {
    console.error('[dashboard-pages] load failed:', error)
    return sendJson(res, 500, { message: `저장된 대시보드를 불러오지 못했습니다: ${error.message}` })
  }
}

export async function handleGetSavedPageObjectData(req, res) {
  let body
  try {
    body = await readJsonBody(req)
  } catch {
    return sendJson(res, 400, { message: '잘못된 요청 본문입니다.' })
  }
  const { scopeKey, name, objectId, forceRefresh = false } = body
  if (!scopeKey || !name || !objectId) return sendJson(res, 400, { message: 'scopeKey, name, objectId가 필요합니다.' })

  const actor = await requireActor(req, res, getPool(), body)
  if (!actor) return
  if (!requireScope(res, actor, scopeKey)) return

  try {
    const pool = getPool()
    const { rows } = await pool.query(
      `SELECT o.object_id, o.object_type, o.renderer_type, o.chart_code, o.title,
              o.query_bundle, o.query_spec, o.object_spec, o.layout, o.refresh_policy, o.source_meta
         FROM dashboard_objects o
         JOIN dashboard_pages p ON p.page_id = o.page_id
        WHERE p.scope_key = $1 AND p.name = $2 AND o.object_id = $3
          AND p.owner_email = $4`,
      [scopeKey, name, objectId, actor.email]
    )
    if (!rows.length) return sendJson(res, 404, { message: '대시보드 객체를 찾을 수 없습니다.' })
    const accessContext = dashboardAccessContextFor({ scopeKey, ownerEmail: actor.email })
    return sendJson(res, 200, { widget: await rehydrateObject(rowToObject(rows[0]), { request: req, forceRefresh: Boolean(forceRefresh), accessContext }) })
  } catch (error) {
    console.error('[dashboard-pages] object load failed:', error)
    return sendJson(res, 500, { message: `객체 데이터를 불러오지 못했습니다: ${error.message}` })
  }
}

// 페이지 메타데이터와 객체 데이터를 분리한 기존 UX는 유지하되, loading 객체를 브라우저가
// 개별 요청하던 구조를 서버 batch로 바꾼다. 페이지별 상한과 fabricClient 전역 Redis permit을
// 함께 적용해 한 페이지의 여러 위젯이 Fabric을 한꺼번에 점유하지 못하게 한다.
export async function handleGetSavedPageData(req, res) {
  let body
  try {
    body = await readJsonBody(req)
  } catch {
    return sendJson(res, 400, { message: '잘못된 요청 본문입니다.' })
  }
  const { scopeKey, name, objectIds, forceRefresh = false } = body
  if (!scopeKey || !name) return sendJson(res, 400, { message: 'scopeKey와 name이 필요합니다.' })
  const requestedIds = Array.isArray(objectIds) ? new Set(objectIds.filter((id) => typeof id === 'string')) : null

  const actor = await requireActor(req, res, getPool(), body)
  if (!actor) return
  if (!requireScope(res, actor, scopeKey)) return

  try {
    const pool = getPool()
    const page = await findPage(pool, scopeKey, name, { ownerEmail: actor.email })
    if (!page) return sendJson(res, 404, { message: '저장된 대시보드를 찾을 수 없습니다.' })
    const objects = prioritizeInitialViewportObjects((await loadPageObjects(pool, page.page_id))
      .map(rowToObject)
      .filter((object) => !requestedIds || requestedIds.has(object.id)))
    const maxConcurrency = positiveInteger(process.env.DASHBOARD_PAGE_MAX_CONCURRENCY, 3)
    // 개인 작업본 — 캐시도 소유자 단위로 갈라, 같은 딜러사 동료의 캐시와 섞이지 않는다.
    const accessContext = dashboardAccessContextFor({ scopeKey, ownerEmail: actor.email })
    const widgets = await mapWithConcurrency(objects, maxConcurrency, (object) => (
      rehydrateObject(object, { request: req, forceRefresh: Boolean(forceRefresh), accessContext })
    ))
    return sendJson(res, 200, { widgets })
  } catch (error) {
    console.error('[dashboard-pages] batch object load failed:', error)
    return sendJson(res, 500, { message: `대시보드 객체 데이터를 불러오지 못했습니다: ${error.message}` })
  }
}

export async function handleGetDeployedPage(req, res) {
  const url = new URL(req.url, 'http://internal')
  const scopeKey = url.searchParams.get('scopeKey')
  const pageKey = url.searchParams.get('pageKey')
  if (!scopeKey || !pageKey) return sendJson(res, 400, { message: 'scopeKey와 pageKey가 필요합니다.' })

  // 배포본은 딜러사 전체가 함께 보는 것이라 소유자를 따지지 않는다.
  // 다만 어느 딜러사의 배포본인지는 가려야 한다.
  const actor = await requireActor(req, res)
  if (!actor) return
  if (!requireScope(res, actor, scopeKey)) return

  try {
    const pool = getPool()
    const deployment = await findDeployment(pool, scopeKey, pageKey)
    if (!deployment) return sendJson(res, 200, { deployed: false })

    const pinned = await loadPageObjectsAtVersion(pool, deployment.page_id, deployment.page_version)
    const objects = pinned ?? (await loadPageObjects(pool, deployment.page_id)).map(rowToObject)
    return sendJson(res, 200, {
      deployed: true,
      name: deployment.name,
      version: deployment.page_version,
      pinned: pinned !== null,
      widgets: objects.map(loadingObject),
    })
  } catch (error) {
    console.error('[dashboard-pages] deployed load failed:', error)
    return sendJson(res, 500, { message: `배포된 대시보드를 불러오지 못했습니다: ${error.message}` })
  }
}

export async function handleGetDeployedPageData(req, res) {
  let body
  try {
    body = await readJsonBody(req)
  } catch {
    return sendJson(res, 400, { message: '잘못된 요청 본문입니다.' })
  }
  const { scopeKey, pageKey, objectIds, forceRefresh = false } = body
  if (!scopeKey || !pageKey) return sendJson(res, 400, { message: 'scopeKey와 pageKey가 필요합니다.' })
  const requestedIds = Array.isArray(objectIds) ? new Set(objectIds.filter((id) => typeof id === 'string')) : null

  const actor = await requireActor(req, res, getPool(), body)
  if (!actor) return
  if (!requireScope(res, actor, scopeKey)) return

  try {
    const pool = getPool()
    const deployment = await findDeployment(pool, scopeKey, pageKey)
    if (!deployment) return sendJson(res, 404, { message: '배포된 대시보드를 찾을 수 없습니다.' })
    const pinned = await loadPageObjectsAtVersion(pool, deployment.page_id, deployment.page_version)
    const allObjects = pinned ?? (await loadPageObjects(pool, deployment.page_id)).map(rowToObject)
    const objects = prioritizeInitialViewportObjects(allObjects.filter((object) => !requestedIds || requestedIds.has(object.id)))
    const maxConcurrency = positiveInteger(process.env.DASHBOARD_PAGE_MAX_CONCURRENCY, 3)
    // 배포본 — 딜러사 전체가 같은 것을 보므로 캐시도 딜러사 단위로 공유한다.
    // (본사가 이 딜러사 화면을 열어도 같은 scopeKey 로 같은 캐시를 쓴다.)
    const accessContext = dashboardAccessContextFor({ scopeKey })
    const widgets = await mapWithConcurrency(objects, maxConcurrency, (object) => (
      rehydrateObject(object, { request: req, forceRefresh: Boolean(forceRefresh), accessContext })
    ))
    return sendJson(res, 200, { widgets })
  } catch (error) {
    console.error('[dashboard-pages] deployed data load failed:', error)
    return sendJson(res, 500, { message: `배포 대시보드 데이터를 불러오지 못했습니다: ${error.message}` })
  }
}

export async function handleListSavedPages(req, res) {
  const url = new URL(req.url, 'http://internal')
  const scopeKey = url.searchParams.get('scopeKey')
  if (!scopeKey) return sendJson(res, 400, { message: 'scopeKey가 필요합니다.' })

  const actor = await requireActor(req, res)
  if (!actor) return
  if (!requireScope(res, actor, scopeKey)) return

  try {
    const pool = getPool()
    const { rows } = await pool.query(
      `SELECT name, target_page_key, is_deployed, is_template, updated_at
         FROM dashboard_pages
        WHERE scope_key = $1 AND owner_email = $2
        ORDER BY updated_at DESC`,
      [scopeKey, actor.email]
    )
    return sendJson(res, 200, {
      pages: rows.map((row) => ({
        name: row.name,
        targetPageKey: row.target_page_key,
        isDeployed: row.is_deployed,
        isTemplate: row.is_template,
        updatedAt: row.updated_at,
      })),
      limit: MAX_SAVED_PAGES,
    })
  } catch (error) {
    return sendJson(res, 500, { message: `목록을 불러오지 못했습니다: ${error.message}` })
  }
}

// 템플릿은 본사가 내놓는 견본이라 딜러사 누구나 불러다 쓴다 —
// 소유자를 따지지 않고, 로그인만 확인한다.
export async function handleListTemplates(req, res) {
  const actor = await requireActor(req, res)
  if (!actor) return

  try {
    const pool = getPool()
    const { rows } = await pool.query(
      `SELECT name, updated_at
         FROM dashboard_pages
        WHERE scope_key = 'hq' AND is_template = true
        ORDER BY updated_at DESC`
    )
    return sendJson(res, 200, { templates: rows.map((row) => ({ name: row.name, updatedAt: row.updated_at })) })
  } catch (error) {
    return sendJson(res, 500, { message: `템플릿 목록을 불러오지 못했습니다: ${error.message}` })
  }
}

export async function handleGetTemplate(req, res) {
  const url = new URL(req.url, 'http://internal')
  const name = url.searchParams.get('name')
  if (!name) return sendJson(res, 400, { message: 'name이 필요합니다.' })

  const actor = await requireActor(req, res)
  if (!actor) return

  try {
    const pool = getPool()
    // findPage 는 소유자로 거르므로 여기서는 쓸 수 없다 — 본사의 누가 만들었든
    // 템플릿으로 올라온 것은 모두에게 보여야 한다.
    const { rows } = await pool.query(
      `SELECT page_id FROM dashboard_pages
        WHERE scope_key = 'hq' AND name = $1 AND is_template = true
        ORDER BY updated_at DESC
        LIMIT 1`,
      [name]
    )
    if (!rows.length) return sendJson(res, 404, { message: '템플릿을 찾을 수 없습니다.' })
    // 템플릿은 본사가 내놓는 견본 — 본사 스코프 캐시를 모두가 공유한다.
    const templateContext = dashboardAccessContextFor({ scopeKey: 'hq' })
    const widgets = await Promise.all((await loadPageObjects(pool, rows[0].page_id)).map((row) => rehydrateObject(rowToObject(row), { accessContext: templateContext })))
    return sendJson(res, 200, { widgets })
  } catch (error) {
    return sendJson(res, 500, { message: `템플릿을 불러오지 못했습니다: ${error.message}` })
  }
}

export async function handleSetTemplateFlag(req, res) {
  let body
  try {
    body = await readJsonBody(req)
  } catch {
    return sendJson(res, 400, { message: '잘못된 요청 본문입니다.' })
  }
  const { scopeKey, name, isTemplate } = body
  if (!scopeKey || !name || typeof isTemplate !== 'boolean') return sendJson(res, 400, { message: 'scopeKey, name, isTemplate이 필요합니다.' })
  if (scopeKey !== 'hq') return sendJson(res, 403, { message: '템플릿 지정은 본사만 할 수 있습니다.' })

  const actor = await requireActor(req, res, getPool(), body)
  if (!actor) return
  if (actor.scopeKey !== 'hq') return sendJson(res, 403, { message: '템플릿 지정은 본사만 할 수 있습니다.' })

  try {
    const pool = getPool()
    // 자기 작업본만 템플릿으로 올릴 수 있다.
    const { rowCount } = await pool.query(
      `UPDATE dashboard_pages SET is_template = $3, updated_at = now()
        WHERE scope_key = $1 AND name = $2 AND owner_email = $4`,
      [scopeKey, name, isTemplate, actor.email]
    )
    if (!rowCount) throw new Error('저장된 대시보드를 찾을 수 없습니다.')
    return sendJson(res, 200, { ok: true })
  } catch (error) {
    return sendJson(res, 500, { message: `템플릿 지정에 실패했습니다: ${error.message}` })
  }
}

function pageManifest(rows) {
  return rows.map((row) => ({ id: row.object_id, version: row.object_version, sortOrder: row.sort_order }))
}

async function insertObjectVersion(client, pageId, record, version, operation) {
  await client.query(
    `INSERT INTO dashboard_object_versions (page_id, object_id, version, operation, object_snapshot)
     VALUES ($1, $2, $3, $4, $5::jsonb)`,
    [pageId, record.objectId, version, operation, JSON.stringify(record)]
  )
}

async function upsertObject(client, pageId, record, version) {
  await client.query(
    `INSERT INTO dashboard_objects (
       object_id, page_id, object_type, renderer_type, chart_code, title,
       query_bundle, query_spec, object_spec, layout, refresh_policy, source_meta,
       object_version, sort_order, updated_at
     ) VALUES (
       $1, $2, $3, $4, $5, $6,
       $7::jsonb, $8::jsonb, $9::jsonb, $10::jsonb, $11::jsonb, $12::jsonb,
       $13, $14, now()
     )
     ON CONFLICT (object_id) DO UPDATE SET
       page_id = EXCLUDED.page_id,
       object_type = EXCLUDED.object_type,
       renderer_type = EXCLUDED.renderer_type,
       chart_code = EXCLUDED.chart_code,
       title = EXCLUDED.title,
       query_bundle = EXCLUDED.query_bundle,
       query_spec = EXCLUDED.query_spec,
       object_spec = EXCLUDED.object_spec,
       layout = EXCLUDED.layout,
       refresh_policy = EXCLUDED.refresh_policy,
       source_meta = EXCLUDED.source_meta,
       object_version = EXCLUDED.object_version,
       sort_order = EXCLUDED.sort_order,
       updated_at = now()`,
    [
      record.objectId, pageId, record.objectType, record.rendererType, record.chartCode, record.title,
      JSON.stringify(record.queryBundle), JSON.stringify(record.querySpec), JSON.stringify(record.objectSpec),
      JSON.stringify(record.layout), JSON.stringify(record.refreshPolicy), JSON.stringify(record.sourceMeta),
      version, record.sortOrder,
    ]
  )
}

export async function handleSaveSavedPage(req, res) {
  let body
  try {
    body = await readJsonBody(req)
  } catch {
    return sendJson(res, 400, { message: '잘못된 요청 본문입니다.' })
  }
  const { scopeKey, dashboardState, baseVersion } = body
  const name = body.name || DEFAULT_NAME
  if (!scopeKey || !dashboardState || !Array.isArray(dashboardState.widgets)) {
    return sendJson(res, 400, { message: 'scopeKey와 dashboardState.widgets가 필요합니다.' })
  }

  const normalizedState = normalizeDashboardState(dashboardState)
  const validationErrors = validateDashboardState(normalizedState)
  if (validationErrors.length) return sendJson(res, 400, { message: `저장할 대시보드 객체가 올바르지 않습니다: ${validationErrors.join(' ')}` })
  const nextRecords = normalizedState.widgets.map((object, index) => objectRecord(object, index))

  const pool = getPool()
  const actor = await requireActor(req, res, pool, body)
  if (!actor) return
  if (!requireScope(res, actor, scopeKey)) return

  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    let page = await findPage(client, scopeKey, name, { ownerEmail: actor.email, forUpdate: true })
    if (!page) {
      // 한도는 사람마다 센다 — 같은 딜러사에 사람이 늘었다고 각자의 몫이 줄면 안 된다.
      const { rows: counts } = await client.query(
        `SELECT COUNT(*)::int AS count FROM dashboard_pages
          WHERE scope_key = $1 AND owner_email = $2`,
        [scopeKey, actor.email]
      )
      if (counts[0].count >= MAX_SAVED_PAGES) {
        await client.query('ROLLBACK')
        return sendJson(res, 409, { message: `저장 한도(${MAX_SAVED_PAGES}개)를 초과했습니다.` })
      }
      const { rows } = await client.query(
        `INSERT INTO dashboard_pages (scope_key, owner_email, name, version)
         VALUES ($1, $2, $3, 0)
         RETURNING page_id, scope_key, owner_email, name, target_page_key, is_deployed, is_template, version, updated_at`,
        [scopeKey, actor.email, name]
      )
      page = rows[0]
    } else if (Number.isInteger(baseVersion) && baseVersion !== page.version) {
      await client.query('ROLLBACK')
      return sendJson(res, 409, { message: '다른 사용자가 먼저 저장했습니다. 최신 상태를 불러온 뒤 다시 적용해 주세요.' })
    }

    const existingRows = await loadPageObjects(client, page.page_id)
    const existingById = new Map(existingRows.map((row) => [row.object_id, row]))
    let changed = page.version === 0 && existingRows.length === 0

    for (const record of nextRecords) {
      const existing = existingById.get(record.objectId)
      const same = existing && recordFingerprint(record) === recordFingerprint(rowRecord(existing))
      if (same) continue
      const { rows: versionRows } = await client.query(
        `SELECT COALESCE(MAX(version), 0)::int AS version
           FROM dashboard_object_versions
          WHERE page_id = $1 AND object_id = $2`,
        [page.page_id, record.objectId]
      )
      const objectVersion = existing?.object_version
        ? existing.object_version + 1
        : versionRows[0].version + 1
      await upsertObject(client, page.page_id, record, objectVersion)
      await insertObjectVersion(client, page.page_id, record, objectVersion, existing ? 'update' : 'create')
      changed = true
    }

    const nextIds = new Set(nextRecords.map((record) => record.objectId))
    for (const row of existingRows) {
      if (nextIds.has(row.object_id)) continue
      const record = rowRecord(row)
      const objectVersion = row.object_version + 1
      await insertObjectVersion(client, page.page_id, record, objectVersion, 'delete')
      await client.query('DELETE FROM dashboard_objects WHERE object_id = $1', [row.object_id])
      changed = true
    }

    if (!changed) {
      await client.query('COMMIT')
      return sendJson(res, 200, { ok: true, version: page.version })
    }

    const nextVersion = page.version + 1
    await client.query('UPDATE dashboard_pages SET version = $2, updated_at = now() WHERE page_id = $1', [page.page_id, nextVersion])
    const finalRows = await loadPageObjects(client, page.page_id)
    await client.query(
      `INSERT INTO dashboard_page_versions (page_id, version, object_manifest)
       VALUES ($1, $2, $3::jsonb)`,
      [page.page_id, nextVersion, JSON.stringify(pageManifest(finalRows))]
    )
    await client.query('COMMIT')
    return sendJson(res, 200, { ok: true, version: nextVersion })
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {})
    console.error('[dashboard-pages] save failed:', error)
    return sendJson(res, 500, { message: `저장하지 못했습니다: ${error.message}` })
  } finally {
    client.release()
  }
}

export async function handleDeleteSavedPage(req, res) {
  const url = new URL(req.url, 'http://internal')
  const scopeKey = url.searchParams.get('scopeKey')
  const name = url.searchParams.get('name')
  if (!scopeKey || !name) return sendJson(res, 400, { message: 'scopeKey와 name이 필요합니다.' })

  const actor = await requireActor(req, res)
  if (!actor) return
  if (!requireScope(res, actor, scopeKey)) return

  try {
    const pool = getPool()
    await pool.query(
      `DELETE FROM dashboard_pages
        WHERE scope_key = $1 AND name = $2 AND owner_email = $3`,
      [scopeKey, name, actor.email]
    )
    return sendJson(res, 200, { ok: true })
  } catch (error) {
    return sendJson(res, 500, { message: `삭제하지 못했습니다: ${error.message}` })
  }
}

export async function handleDeployPage(req, res) {
  let body
  try {
    body = await readJsonBody(req)
  } catch {
    return sendJson(res, 400, { message: '잘못된 요청 본문입니다.' })
  }
  const { scopeKey, name, targetPageKey } = body
  if (!scopeKey || !name || !targetPageKey) return sendJson(res, 400, { message: 'scopeKey, name, targetPageKey가 필요합니다.' })

  const pool = getPool()
  const client = await pool.connect()
  try {
    const actor = await requireActor(req, res, client, body)
    if (!actor) return
    if (!deployPermission(actor, scopeKey).pin) {
      return sendJson(res, 403, { message: '이 소속의 공용 대시보드를 바꿀 권한이 없습니다.' })
    }

    await client.query('BEGIN')
    // 배포는 자기 작업본을 딜러사 공용으로 올리는 일이다 — 남의 작업본은 집지 않는다.
    const { rows: pages } = await client.query(
      `SELECT page_id, version FROM dashboard_pages
        WHERE scope_key = $1 AND name = $2 AND owner_email = $3
        LIMIT 1
          FOR UPDATE`,
      [scopeKey, name, actor.email]
    )
    if (!pages.length) {
      await client.query('ROLLBACK')
      return sendJson(res, 404, { message: '저장된 대시보드를 찾을 수 없습니다.' })
    }
    const page = pages[0]
    await client.query(
      'UPDATE dashboard_pages SET is_deployed = false WHERE scope_key = $1 AND target_page_key = $2 AND is_deployed = true',
      [scopeKey, targetPageKey]
    )
    await client.query(
      `UPDATE dashboard_pages
          SET is_deployed = true, target_page_key = $3, updated_at = now()
        WHERE page_id = $1 AND scope_key = $2`,
      [page.page_id, scopeKey, targetPageKey]
    )
    await client.query(
      `INSERT INTO dashboard_deployments
         (scope_key, target_page_key, page_id, page_version, deployed_by, deployed_at)
       VALUES ($1, $2, $3, $4, $5, now())
       ON CONFLICT (scope_key, target_page_key)
       DO UPDATE SET page_id = EXCLUDED.page_id,
                     page_version = EXCLUDED.page_version,
                     deployed_by = EXCLUDED.deployed_by,
                     deployed_at = now()`,
      [scopeKey, targetPageKey, page.page_id, page.version, actor.email]
    )
    await client.query(
      `INSERT INTO dashboard_deployment_logs
         (scope_key, target_page_key, page_id, page_version, action, actor_email)
       VALUES ($1, $2, $3, $4, 'deploy', $5)`,
      [scopeKey, targetPageKey, page.page_id, page.version, actor.email]
    )
    await client.query('COMMIT')
    return sendJson(res, 200, { ok: true })
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {})
    return sendJson(res, 500, { message: `배포하지 못했습니다: ${error.message}` })
  } finally {
    client.release()
  }
}

export async function handleListDeployHistory(req, res) {
  const url = new URL(req.url, 'http://internal')
  const scopeKey = url.searchParams.get('scopeKey')
  const pageKey = url.searchParams.get('pageKey')
  if (!scopeKey) return sendJson(res, 400, { message: 'scopeKey가 필요합니다.' })

  const actor = await requireActor(req, res)
  if (!actor) return
  const permission = deployPermission(actor, scopeKey)
  if (!permission.view) return sendJson(res, 403, { message: '이 소속의 배포 이력을 볼 권한이 없습니다.' })

  try {
    const pool = getPool()
    const { rows } = await pool.query(
      `WITH deploys AS (
         SELECT DISTINCT ON (l.page_id, l.page_version)
                l.id, l.target_page_key, l.page_id, l.page_version,
                l.actor_email, l.created_at
           FROM dashboard_deployment_logs l
          WHERE l.scope_key = $1
            AND ($2::text IS NULL OR l.target_page_key = $2)
            AND l.action IN ('deploy', 'replace')
          ORDER BY l.page_id, l.page_version, l.created_at DESC, l.id DESC
       )
       SELECT d.*, p.name AS page_name, p.owner_email,
              (p.page_id IS NOT NULL) AS page_exists,
              EXISTS (
                SELECT 1 FROM dashboard_page_versions v
                 WHERE v.page_id = d.page_id AND v.version = d.page_version
              ) AS restorable,
              (cur.page_id = d.page_id AND cur.page_version = d.page_version) AS is_current,
              cur.deployed_at AS activated_at,
              cur.deployed_by AS activated_by
         FROM deploys d
         LEFT JOIN dashboard_pages p ON p.page_id = d.page_id
         LEFT JOIN dashboard_deployments cur
                ON cur.scope_key = $1
               AND cur.target_page_key = d.target_page_key
        ORDER BY d.created_at DESC, d.id DESC
        LIMIT 200`,
      [scopeKey, pageKey || null]
    )
    return sendJson(res, 200, {
      canPin: permission.pin,
      history: rows.map((row) => ({
        id: String(row.id),
        targetPageKey: row.target_page_key,
        pageId: row.page_id === null ? null : String(row.page_id),
        pageName: row.page_name,
        ownerEmail: row.owner_email ?? null,
        version: row.page_version,
        actorEmail: row.actor_email,
        createdAt: row.created_at,
        restorable: row.page_exists && row.restorable,
        isCurrent: row.is_current === true,
        activatedAt: row.is_current === true ? row.activated_at : null,
        activatedBy: row.is_current === true ? row.activated_by : null,
      })),
    })
  } catch (error) {
    console.error('[dashboard-pages] deploy history failed:', error)
    return sendJson(res, 500, { message: `배포 이력을 불러오지 못했습니다: ${error.message}` })
  }
}

async function wasDeployedHere(db, scopeKey, targetPageKey, pageId, version) {
  const { rows } = await db.query(
    `SELECT 1 FROM dashboard_deployment_logs
      WHERE scope_key = $1 AND target_page_key = $2
        AND page_id = $3 AND page_version = $4
        AND action IN ('deploy', 'replace')
      LIMIT 1`,
    [scopeKey, targetPageKey, pageId, version]
  )
  return rows.length > 0
}

export async function handlePreviewDeployVersion(req, res) {
  let body
  try {
    body = await readJsonBody(req)
  } catch {
    return sendJson(res, 400, { message: '잘못된 요청 본문입니다.' })
  }
  const { scopeKey, pageKey, pageId, objectIds, withData = false, forceRefresh = false } = body
  const version = parseVersion(body.version)
  if (!scopeKey || !pageKey || !pageId || version === null) {
    return sendJson(res, 400, { message: 'scopeKey, pageKey, pageId, version이 필요합니다.' })
  }

  const actor = await requireActor(req, res, getPool(), body)
  if (!actor) return
  if (!deployPermission(actor, scopeKey).view) {
    return sendJson(res, 403, { message: '이 소속의 배포 이력을 볼 권한이 없습니다.' })
  }

  try {
    const pool = getPool()
    if (!(await wasDeployedHere(pool, scopeKey, pageKey, pageId, version))) {
      return sendJson(res, 404, { message: '이 화면에 배포된 적이 없는 버전입니다.' })
    }
    const restored = await loadPageObjectsAtVersion(pool, pageId, version)
    if (restored === null) return sendJson(res, 409, { message: '이 버전의 저장본이 남아 있지 않아 미리 볼 수 없습니다.' })
    if (!withData) return sendJson(res, 200, { version, widgets: restored.map(loadingObject) })

    const requested = Array.isArray(objectIds) ? new Set(objectIds.filter((id) => typeof id === 'string')) : null
    const objects = prioritizeInitialViewportObjects(restored.filter((object) => !requested || requested.has(object.id)))
    const maxConcurrency = positiveInteger(process.env.DASHBOARD_PAGE_MAX_CONCURRENCY, 3)
    // 배포 이력 미리보기 — 배포본과 같은 딜러사 공유 캐시를 쓴다.
    const accessContext = dashboardAccessContextFor({ scopeKey })
    const widgets = await mapWithConcurrency(objects, maxConcurrency, (object) => (
      rehydrateObject(object, { request: req, forceRefresh: Boolean(forceRefresh), accessContext })
    ))
    return sendJson(res, 200, { version, widgets })
  } catch (error) {
    console.error('[dashboard-pages] preview version failed:', error)
    return sendJson(res, 500, { message: `미리보기를 불러오지 못했습니다: ${error.message}` })
  }
}

export async function handlePinDeployVersion(req, res) {
  let body
  try {
    body = await readJsonBody(req)
  } catch {
    return sendJson(res, 400, { message: '잘못된 요청 본문입니다.' })
  }
  const { scopeKey, targetPageKey, pageId } = body
  const version = parseVersion(body.version)
  if (!scopeKey || !targetPageKey || !pageId || version === null) {
    return sendJson(res, 400, { message: 'scopeKey, targetPageKey, pageId, version이 필요합니다.' })
  }

  const pool = getPool()
  const client = await pool.connect()
  try {
    const actor = await requireActor(req, res, client, body)
    if (!actor) return
    if (!deployPermission(actor, scopeKey).pin) {
      return sendJson(res, 403, { message: '이 소속의 공용 대시보드를 바꿀 권한이 없습니다.' })
    }

    await client.query('BEGIN')
    if (!(await wasDeployedHere(client, scopeKey, targetPageKey, pageId, version))) {
      await client.query('ROLLBACK')
      return sendJson(res, 404, { message: '이 화면에 배포된 적이 없는 버전입니다.' })
    }
    const restored = await loadPageObjectsAtVersion(client, pageId, version)
    if (restored === null) {
      await client.query('ROLLBACK')
      return sendJson(res, 409, { message: '이 버전의 저장본이 남아 있지 않아 되돌릴 수 없습니다.' })
    }
    await client.query(
      'UPDATE dashboard_pages SET is_deployed = false WHERE scope_key = $1 AND target_page_key = $2 AND is_deployed = true',
      [scopeKey, targetPageKey]
    )
    await client.query(
      `UPDATE dashboard_pages
          SET is_deployed = true, target_page_key = $3, updated_at = now()
        WHERE page_id = $1 AND scope_key = $2`,
      [pageId, scopeKey, targetPageKey]
    )
    await client.query(
      `INSERT INTO dashboard_deployments
         (scope_key, target_page_key, page_id, page_version, deployed_by, deployed_at)
       VALUES ($1, $2, $3, $4, $5, now())
       ON CONFLICT (scope_key, target_page_key)
       DO UPDATE SET page_id = EXCLUDED.page_id,
                     page_version = EXCLUDED.page_version,
                     deployed_by = EXCLUDED.deployed_by,
                     deployed_at = now()`,
      [scopeKey, targetPageKey, pageId, version, actor.email]
    )
    await client.query(
      `INSERT INTO dashboard_deployment_logs
         (scope_key, target_page_key, page_id, page_version, action, actor_email)
       VALUES ($1, $2, $3, $4, 'replace', $5)`,
      [scopeKey, targetPageKey, pageId, version, actor.email]
    )
    await client.query('COMMIT')
    return sendJson(res, 200, { ok: true, version, widgetCount: restored.length })
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {})
    console.error('[dashboard-pages] pin version failed:', error)
    return sendJson(res, 500, { message: `버전을 고정하지 못했습니다: ${error.message}` })
  } finally {
    client.release()
  }
}

export async function handleRollbackPage(req, res) {
  let body
  try {
    body = await readJsonBody(req)
  } catch {
    return sendJson(res, 400, { message: '잘못된 요청 본문입니다.' })
  }
  const { scopeKey, targetPageKey } = body
  if (!scopeKey || !targetPageKey) return sendJson(res, 400, { message: 'scopeKey와 targetPageKey가 필요합니다.' })

  const pool = getPool()
  const client = await pool.connect()
  try {
    const actor = await requireActor(req, res, client, body)
    if (!actor) return
    if (!deployPermission(actor, scopeKey).pin) {
      return sendJson(res, 403, { message: '이 소속의 공용 대시보드를 바꿀 권한이 없습니다.' })
    }

    await client.query('BEGIN')
    const { rows } = await client.query(
      `DELETE FROM dashboard_deployments
        WHERE scope_key = $1 AND target_page_key = $2
        RETURNING page_id, page_version`,
      [scopeKey, targetPageKey]
    )
    await client.query(
      'UPDATE dashboard_pages SET is_deployed = false WHERE scope_key = $1 AND target_page_key = $2 AND is_deployed = true',
      [scopeKey, targetPageKey]
    )
    if (rows.length) {
      await client.query(
        `INSERT INTO dashboard_deployment_logs
           (scope_key, target_page_key, page_id, page_version, action, actor_email)
         VALUES ($1, $2, $3, $4, 'rollback', $5)`,
        [scopeKey, targetPageKey, rows[0].page_id, rows[0].page_version, actor.email]
      )
    }
    await client.query('COMMIT')
    return sendJson(res, 200, { ok: true })
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {})
    return sendJson(res, 500, { message: `롤백하지 못했습니다: ${error.message}` })
  } finally {
    client.release()
  }
}
