import express from 'express'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { config as loadDotenv } from 'dotenv'
import { handleChatRequest } from './chatHandler.js'
import { handleDashboardCustomizeRequest } from './dashboardCustomizeHandler.js'
import { handleWarehouseQueryRequest } from './warehouseQueryHandler.js'
import { handleAgenticBiRequest } from './agenticBiHandler.js'
import { handleDynamicQueryRequest, handleDynamicRenderRequest } from './dynamicQueryHandler.js'
import { handleDealerFunnelActivity, handleDealerFunnelTestDrive, handleDealerFunnelForecast, handleDealerFunnelInsight, handleDealerFunnelMetrics, handleDealerFunnelReport, handleDealerFunnelReportEdit } from './dealerFunnelHandler.js'
import { handleListScopes } from './scopesHandler.js'
import { handleListLlmModels } from './llmModelsHandler.js'
import { handleMe, handleLogout } from './authHandler.js'
import {
  handleGetSavedPage,
  handleGetSavedPageObjectData,
  handleGetSavedPageData,
  handleListSavedPages,
  handleSaveSavedPage,
  handleDeleteSavedPage,
  handleGetDeployedPage,
  handleGetDeployedPageData,
  handleListDeployHistory,
  handlePreviewDeployVersion,
  handlePinDeployVersion,
  handleDeployPage,
  handleRollbackPage,
  handleListTemplates,
  handleGetTemplate,
  handleSetTemplateFlag,
} from './dashboardPagesHandler.js'

loadDotenv()

const __dirname = dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = process.env.PORT || 3000

// summary.json / inventory.json / contract.json / coupon.json are served from
// frontend/public/data/ in dev, but copied into dist/data/ by the Vite build for prod.
const ROOT_DIR = join(__dirname, '..')
const DATA_DIR = join(ROOT_DIR, 'dist', 'data')

app.get('/healthz', (req, res) => {
  res.status(200).json({ ok: true })
})

app.post('/api/chat', (req, res) => handleChatRequest(req, res, { dataDir: DATA_DIR }))
app.post('/api/dashboard-customize', (req, res) => handleDashboardCustomizeRequest(req, res, { dataDir: DATA_DIR }))
app.post('/api/warehouse-query', handleWarehouseQueryRequest)
app.post('/api/agentic-bi-ask', handleAgenticBiRequest)
app.post('/api/dynamic-query', handleDynamicQueryRequest)
app.post('/api/dynamic-query/render', handleDynamicRenderRequest)
app.get('/api/dealer-funnel/activity', handleDealerFunnelActivity)
app.get('/api/dealer-funnel/testdrive', handleDealerFunnelTestDrive)
app.get('/api/dealer-funnel/forecast', handleDealerFunnelForecast)
app.get('/api/dealer-funnel/insight', handleDealerFunnelInsight)
app.get('/api/dealer-funnel/metrics', handleDealerFunnelMetrics)
app.get('/api/dealer-funnel/report.html', handleDealerFunnelReport)
app.post('/api/dealer-funnel/report-edit', handleDealerFunnelReportEdit)
app.get('/api/auth/me', handleMe)
app.post('/api/auth/logout', handleLogout)
app.get('/api/scopes', handleListScopes)
app.get('/api/llm/models', handleListLlmModels)
app.get('/api/dashboard-pages', handleGetSavedPage)
app.post('/api/dashboard-pages/object-data', handleGetSavedPageObjectData)
// 2026-08-04 leo: 브라우저가 위젯마다 재조회하던 요청을 한 페이지 batch로 묶어 서버가
// 동시성·객체별 오류 격리를 관리하도록 데이터 재수화 엔드포인트를 추가한다.
app.post('/api/dashboard-pages/data', handleGetSavedPageData)
app.put('/api/dashboard-pages', handleSaveSavedPage)
app.delete('/api/dashboard-pages', handleDeleteSavedPage)
app.get('/api/dashboard-pages/list', handleListSavedPages)
app.get('/api/dashboard-pages/deploy-history', handleListDeployHistory)
app.post('/api/dashboard-pages/deploy-preview', handlePreviewDeployVersion)
app.post('/api/dashboard-pages/deploy-version', handlePinDeployVersion)
app.get('/api/dashboard-pages/deployed', handleGetDeployedPage)
app.post('/api/dashboard-pages/deployed-data', handleGetDeployedPageData)
app.post('/api/dashboard-pages/deploy', handleDeployPage)
app.post('/api/dashboard-pages/rollback', handleRollbackPage)
app.get('/api/dashboard-pages/templates', handleListTemplates)
app.get('/api/dashboard-pages/template', handleGetTemplate)
app.post('/api/dashboard-pages/template', handleSetTemplateFlag)

// ─── Serve React build (dist/) ────────────────────────────────────────────────
const distPath = join(ROOT_DIR, 'dist')
app.use(express.static(distPath))
// SPA fallback — all non-API routes serve index.html (Express 5 syntax)
app.get('/{*path}', (req, res) => {
  res.sendFile(join(distPath, 'index.html'))
})

// ─── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`Toyota Dashboard running on http://localhost:${PORT}`)
})
