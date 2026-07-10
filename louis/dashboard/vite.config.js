import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { config as loadDotenv } from 'dotenv'
import { handleChatRequest } from './server/chatHandler.js'
import { handleDashboardCustomizeRequest } from './server/dashboardCustomizeHandler.js'
import { handleWarehouseQueryRequest } from './server/warehouseQueryHandler.js'

loadDotenv()

const __dirname = dirname(fileURLToPath(import.meta.url))
const DATA_DIR = join(__dirname, 'public', 'data')

function withCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
}

function ssePost(path, handler) {
  return (server) => {
    server.middlewares.use(path, async (req, res) => {
      if (req.method === 'OPTIONS') {
        withCors(res)
        res.statusCode = 204
        return res.end()
      }
      if (req.method !== 'POST') {
        res.statusCode = 405
        return res.end('Method Not Allowed')
      }
      withCors(res)
      await handler(req, res, { dataDir: DATA_DIR })
    })
  }
}

function azureChatPlugin() {
  return {
    name: 'azure-chat',
    configureServer(server) {
      ssePost('/api/chat', handleChatRequest)(server)
      ssePost('/api/dashboard-customize', handleDashboardCustomizeRequest)(server)
      ssePost('/api/warehouse-query', handleWarehouseQueryRequest)(server)
    },
  }
}

export default defineConfig({
  plugins: [react(), azureChatPlugin()],
})
