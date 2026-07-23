import express from 'express'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { config as loadDotenv } from 'dotenv'
import { handleChatRequest } from './server/chatHandler.js'
import { handleDashboardCustomizeRequest } from './server/dashboardCustomizeHandler.js'
import { handleWarehouseQueryRequest } from './server/warehouseQueryHandler.js'
import { handleListScopes } from './server/scopesHandler.js'
import {
  handleGetSavedPage,
  handleListSavedPages,
  handleSaveSavedPage,
  handleDeleteSavedPage,
  handleGetDeployedPage,
  handleDeployPage,
  handleRollbackPage,
  handleListTemplates,
  handleGetTemplate,
  handleSetTemplateFlag,
} from './server/dashboardPagesHandler.js'

loadDotenv()

const __dirname = dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = process.env.PORT || 3000

// summary.json / inventory.json / contract.json / coupon.json are served from
// public/data/ in dev, but copied into dist/data/ by the Vite build for prod.
const DATA_DIR = join(__dirname, 'dist', 'data')

app.post('/api/chat', (req, res) => handleChatRequest(req, res, { dataDir: DATA_DIR }))
app.post('/api/dashboard-customize', (req, res) => handleDashboardCustomizeRequest(req, res, { dataDir: DATA_DIR }))
app.post('/api/warehouse-query', handleWarehouseQueryRequest)
app.get('/api/scopes', handleListScopes)
app.get('/api/dashboard-pages', handleGetSavedPage)
app.put('/api/dashboard-pages', handleSaveSavedPage)
app.delete('/api/dashboard-pages', handleDeleteSavedPage)
app.get('/api/dashboard-pages/list', handleListSavedPages)
app.get('/api/dashboard-pages/deployed', handleGetDeployedPage)
app.post('/api/dashboard-pages/deploy', handleDeployPage)
app.post('/api/dashboard-pages/rollback', handleRollbackPage)
app.get('/api/dashboard-pages/templates', handleListTemplates)
app.get('/api/dashboard-pages/template', handleGetTemplate)
app.post('/api/dashboard-pages/template', handleSetTemplateFlag)

// ─── Serve React build (dist/) ────────────────────────────────────────────────
const distPath = join(__dirname, 'dist')
app.use(express.static(distPath))
// SPA fallback — all non-API routes serve index.html (Express 5 syntax)
app.get('/{*path}', (req, res) => {
  res.sendFile(join(distPath, 'index.html'))
})

// ─── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`Toyota Dashboard running on http://localhost:${PORT}`)
})
