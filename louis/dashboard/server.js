import express from 'express'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { config as loadDotenv } from 'dotenv'
import { handleChatRequest } from './server/chatHandler.js'
import { handleDashboardCustomizeRequest } from './server/dashboardCustomizeHandler.js'
import { handleWarehouseQueryRequest } from './server/warehouseQueryHandler.js'

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
