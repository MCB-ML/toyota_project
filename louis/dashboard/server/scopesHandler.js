import { getPool } from './db.js'

function sendJson(res, status, body) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(body))
}

// 본사 화면 상단 필터(어느 딜러사/본사 배포본을 볼지)에 쓰는 전체 소속 디렉터리.
export async function handleListScopes(req, res) {
  try {
    const pool = getPool()
    const { rows } = await pool.query(
      'SELECT scope_key, role, dealer_id, dealer_name, group_name, brand, region FROM dashboard_scopes ORDER BY role, dealer_name'
    )
    sendJson(res, 200, {
      scopes: rows.map(r => ({
        scopeKey: r.scope_key,
        role: r.role,
        dealerId: r.dealer_id,
        dealerName: r.dealer_name,
        groupName: r.group_name,
        brand: r.brand,
        region: r.region,
      })),
    })
  } catch (err) {
    console.error('[scopes] 목록 조회 실패:', err)
    sendJson(res, 500, { message: `소속 목록을 불러오지 못했습니다: ${err.message}` })
  }
}
