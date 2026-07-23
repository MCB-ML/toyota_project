import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
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

// GET/PUT 둘 다 받는 라우트용 — ssePost()는 POST 전용이라 재사용 불가.
function jsonRoute(path, handlersByMethod) {
  return (server) => {
    server.middlewares.use(path, async (req, res) => {
      if (req.method === 'OPTIONS') {
        withCors(res)
        res.setHeader('Access-Control-Allow-Methods', Object.keys(handlersByMethod).join(', ') + ', OPTIONS')
        res.statusCode = 204
        return res.end()
      }
      const handler = handlersByMethod[req.method]
      if (!handler) {
        res.statusCode = 405
        return res.end('Method Not Allowed')
      }
      withCors(res)
      await handler(req, res)
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
      jsonRoute('/api/scopes', { GET: handleListScopes })(server)
      // server.middlewares.use()는 prefix 매칭이라 등록 순서가 중요하다 — 먼저 매칭되면
      // 그걸로 응답이 끝나버리므로, /api/dashboard-pages보다 구체적인 하위 경로를 먼저 등록한다.
      jsonRoute('/api/dashboard-pages/list', { GET: handleListSavedPages })(server)
      jsonRoute('/api/dashboard-pages/deployed', { GET: handleGetDeployedPage })(server)
      jsonRoute('/api/dashboard-pages/deploy', { POST: handleDeployPage })(server)
      jsonRoute('/api/dashboard-pages/rollback', { POST: handleRollbackPage })(server)
      jsonRoute('/api/dashboard-pages/templates', { GET: handleListTemplates })(server)
      jsonRoute('/api/dashboard-pages/template', { GET: handleGetTemplate, POST: handleSetTemplateFlag })(server)
      jsonRoute('/api/dashboard-pages', {
        GET: handleGetSavedPage,
        PUT: handleSaveSavedPage,
        DELETE: handleDeleteSavedPage,
      })(server)
    },
  }
}

export default defineConfig({
  plugins: [react(), azureChatPlugin()],
  // react-grid-layout(WidgetGrid.jsx)의 의존성인 react-draggable이 브라우저에 없는
  // `process.env.DRAGGABLE_DEBUG`를 참조해서 드래그 시작 시 "process is not defined"로
  // 죽는다 — Vite는 process.env.NODE_ENV만 기본으로 치환해주므로 process.env 전체를 빈
  // 객체로 정의해 막는다.
  define: {
    'process.env': {},
  },
})
