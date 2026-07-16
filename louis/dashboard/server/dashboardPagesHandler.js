import { readJsonBody } from './azureClient.js'
import { getPool } from './db.js'
import { queryFabric } from './fabricClient.js'
import { buildWidgetPropsFromRows } from './widgetSchema.js'

const DEFAULT_NAME = '기본'
const MAX_SAVED_PAGES = 5

function sendJson(res, status, body) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(body))
}

// 저장된 위젯 스펙(sql/chartCode/querySpec)을 Fabric에 재실행해 props를 다시 만든다.
// 실패(테이블 삭제, Fabric 연결 불가 등)해도 던지지 않고 null을 반환 — 위젯 하나가
// 깨졌다고 전체 레이아웃 로드가 막히면 안 되기 때문.
async function rehydrateWidget(spec) {
  try {
    const rows = await queryFabric(spec.db, spec.sql)
    const built = buildWidgetPropsFromRows(spec.chartCode, rows, spec.querySpec || {}, spec.title)
    return { ...spec, type: built.type, props: built.props }
  } catch (err) {
    console.error(`[dashboard-pages] widget ${spec.id} 재조회 실패:`, err.message)
    return null
  }
}

async function rehydrateWidgets(widgets) {
  const settled = await Promise.allSettled(widgets.map(rehydrateWidget))
  return settled.map(r => (r.status === 'fulfilled' ? r.value : null)).filter(Boolean)
}

// 빌더(KTWS 대시보드 커스텀)에서 이어서 편집할 저장본 하나를 연다 — scope + name.
export async function handleGetSavedPage(req, res) {
  const url = new URL(req.url, 'http://internal')
  const scopeKey = url.searchParams.get('scopeKey')
  const name = url.searchParams.get('name') || DEFAULT_NAME
  if (!scopeKey) {
    return sendJson(res, 400, { message: 'scopeKey가 필요합니다.' })
  }

  try {
    const pool = getPool()
    const { rows } = await pool.query(
      'SELECT version, widgets FROM dashboard_saved_pages WHERE scope_key = $1 AND name = $2',
      [scopeKey, name]
    )
    if (!rows.length) {
      return sendJson(res, 200, { version: 0, widgets: [] })
    }

    const stored = rows[0]
    const widgets = await rehydrateWidgets(stored.widgets)
    sendJson(res, 200, { version: stored.version, widgets })
  } catch (err) {
    console.error('[dashboard-pages] GET 실패:', err)
    sendJson(res, 500, { message: `저장된 대시보드를 불러오지 못했습니다: ${err.message}` })
  }
}

// scope가 좌측 탭(pageKey)에 배포해 둔 대시보드가 있으면 그 내용을 반환한다.
// 각 탭 화면(DeployableTab)이 "기본 화면 대신 이 커스텀 페이지를 보여줄지"를 판단하는 데 쓴다.
export async function handleGetDeployedPage(req, res) {
  const url = new URL(req.url, 'http://internal')
  const scopeKey = url.searchParams.get('scopeKey')
  const pageKey = url.searchParams.get('pageKey')
  if (!scopeKey || !pageKey) {
    return sendJson(res, 400, { message: 'scopeKey, pageKey가 필요합니다.' })
  }

  try {
    const pool = getPool()
    const { rows } = await pool.query(
      'SELECT name, version, widgets FROM dashboard_saved_pages WHERE scope_key = $1 AND target_page_key = $2 AND is_deployed = true',
      [scopeKey, pageKey]
    )
    if (!rows.length) {
      return sendJson(res, 200, { deployed: false })
    }

    const stored = rows[0]
    const widgets = await rehydrateWidgets(stored.widgets)
    sendJson(res, 200, { deployed: true, name: stored.name, version: stored.version, widgets })
  } catch (err) {
    console.error('[dashboard-pages] 배포 콘텐츠 조회 실패:', err)
    sendJson(res, 500, { message: `배포된 대시보드를 불러오지 못했습니다: ${err.message}` })
  }
}

// scope가 저장해 둔 대시보드 목록(최대 MAX_SAVED_PAGES개) — 이름, 배포 대상 탭, 배포 여부.
export async function handleListSavedPages(req, res) {
  const url = new URL(req.url, 'http://internal')
  const scopeKey = url.searchParams.get('scopeKey')
  if (!scopeKey) {
    return sendJson(res, 400, { message: 'scopeKey가 필요합니다.' })
  }

  try {
    const pool = getPool()
    const { rows } = await pool.query(
      'SELECT name, target_page_key, is_deployed, updated_at FROM dashboard_saved_pages WHERE scope_key = $1 ORDER BY updated_at DESC',
      [scopeKey]
    )
    sendJson(res, 200, {
      pages: rows.map(r => ({
        name: r.name,
        targetPageKey: r.target_page_key,
        isDeployed: r.is_deployed,
        updatedAt: r.updated_at,
      })),
      limit: MAX_SAVED_PAGES,
    })
  } catch (err) {
    console.error('[dashboard-pages] 목록 조회 실패:', err)
    sendJson(res, 500, { message: `목록을 불러오지 못했습니다: ${err.message}` })
  }
}

// 대시보드를 이름으로 저장(새 이름이면 한도 검사 후 생성, 기존 이름이면 내용만 갱신).
export async function handleSaveSavedPage(req, res) {
  let body
  try {
    body = await readJsonBody(req)
  } catch {
    return sendJson(res, 400, { message: '잘못된 요청 본문입니다.' })
  }

  const { scopeKey, dashboardState } = body
  const name = body.name || DEFAULT_NAME
  if (!scopeKey || !dashboardState || !Array.isArray(dashboardState.widgets)) {
    return sendJson(res, 400, { message: 'scopeKey, dashboardState.widgets가 필요합니다.' })
  }

  // 데이터(props)는 저장하지 않는다 — 다음 로드 때 sql로 다시 채운다.
  const storedWidgets = dashboardState.widgets.map(({ props, ...spec }) => spec)

  try {
    const pool = getPool()
    const { rows: existing } = await pool.query(
      'SELECT 1 FROM dashboard_saved_pages WHERE scope_key = $1 AND name = $2',
      [scopeKey, name]
    )
    if (!existing.length) {
      const { rows: countRows } = await pool.query(
        'SELECT COUNT(*)::int AS n FROM dashboard_saved_pages WHERE scope_key = $1',
        [scopeKey]
      )
      if (countRows[0].n >= MAX_SAVED_PAGES) {
        return sendJson(res, 409, { message: `저장 한도(${MAX_SAVED_PAGES}개)를 초과했습니다. 기존 저장본을 삭제한 뒤 다시 시도하세요.` })
      }
    }

    await pool.query(
      `INSERT INTO dashboard_saved_pages (scope_key, name, version, widgets, updated_at)
       VALUES ($1, $2, $3, $4::jsonb, now())
       ON CONFLICT (scope_key, name)
       DO UPDATE SET version = EXCLUDED.version, widgets = EXCLUDED.widgets, updated_at = now()`,
      [scopeKey, name, dashboardState.version, JSON.stringify(storedWidgets)]
    )
    sendJson(res, 200, { ok: true })
  } catch (err) {
    console.error('[dashboard-pages] 저장 실패:', err)
    sendJson(res, 500, { message: `저장하지 못했습니다: ${err.message}` })
  }
}

// 저장본 삭제 — 한도(5개) 슬롯을 비울 때 사용. 배포 중이었다면 배포도 함께 사라진다.
export async function handleDeleteSavedPage(req, res) {
  const url = new URL(req.url, 'http://internal')
  const scopeKey = url.searchParams.get('scopeKey')
  const name = url.searchParams.get('name')
  if (!scopeKey || !name) {
    return sendJson(res, 400, { message: 'scopeKey, name이 필요합니다.' })
  }

  try {
    const pool = getPool()
    await pool.query('DELETE FROM dashboard_saved_pages WHERE scope_key = $1 AND name = $2', [scopeKey, name])
    sendJson(res, 200, { ok: true })
  } catch (err) {
    console.error('[dashboard-pages] 삭제 실패:', err)
    sendJson(res, 500, { message: `삭제하지 못했습니다: ${err.message}` })
  }
}

// 저장본을 좌측 탭(targetPageKey)에 배포 — 그 탭에 이미 배포돼 있던 다른 저장본은 자동으로 내려간다.
export async function handleDeployPage(req, res) {
  let body
  try {
    body = await readJsonBody(req)
  } catch {
    return sendJson(res, 400, { message: '잘못된 요청 본문입니다.' })
  }

  const { scopeKey, name, targetPageKey } = body
  if (!scopeKey || !name || !targetPageKey) {
    return sendJson(res, 400, { message: 'scopeKey, name, targetPageKey가 필요합니다.' })
  }

  const pool = getPool()
  let client
  try {
    client = await pool.connect()
    await client.query('BEGIN')
    await client.query(
      'UPDATE dashboard_saved_pages SET is_deployed = false WHERE scope_key = $1 AND target_page_key = $2 AND is_deployed = true',
      [scopeKey, targetPageKey]
    )
    const { rowCount } = await client.query(
      'UPDATE dashboard_saved_pages SET is_deployed = true, target_page_key = $3, updated_at = now() WHERE scope_key = $1 AND name = $2',
      [scopeKey, name, targetPageKey]
    )
    if (!rowCount) throw new Error('저장된 대시보드를 찾을 수 없습니다.')
    await client.query('COMMIT')
    sendJson(res, 200, { ok: true })
  } catch (err) {
    // client가 아예 없거나(연결 실패) 이미 죽은 연결이면 ROLLBACK 자체가 또 던질 수 있으니 무시한다.
    await client?.query('ROLLBACK').catch(() => {})
    console.error('[dashboard-pages] 배포 실패:', err)
    sendJson(res, 500, { message: `배포하지 못했습니다: ${err.message}` })
  } finally {
    client?.release()
  }
}

// 탭을 기본(Default) 화면으로 되돌린다 — 저장본 자체는 지우지 않고 배포만 해제.
export async function handleRollbackPage(req, res) {
  let body
  try {
    body = await readJsonBody(req)
  } catch {
    return sendJson(res, 400, { message: '잘못된 요청 본문입니다.' })
  }

  const { scopeKey, targetPageKey } = body
  if (!scopeKey || !targetPageKey) {
    return sendJson(res, 400, { message: 'scopeKey, targetPageKey가 필요합니다.' })
  }

  try {
    const pool = getPool()
    await pool.query(
      'UPDATE dashboard_saved_pages SET is_deployed = false WHERE scope_key = $1 AND target_page_key = $2 AND is_deployed = true',
      [scopeKey, targetPageKey]
    )
    sendJson(res, 200, { ok: true })
  } catch (err) {
    console.error('[dashboard-pages] 롤백 실패:', err)
    sendJson(res, 500, { message: `롤백하지 못했습니다: ${err.message}` })
  }
}
