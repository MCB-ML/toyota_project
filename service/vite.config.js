import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { config as loadDotenv } from 'dotenv'
import { handleChatRequest } from './backend/chatHandler.js'
import { handleDashboardCustomizeRequest } from './backend/dashboardCustomizeHandler.js'
import { handleWarehouseQueryRequest } from './backend/warehouseQueryHandler.js'
import { handleAgenticBiRequest } from './backend/agenticBiHandler.js'
import { handleDynamicQueryRequest, handleDynamicRenderRequest } from './backend/dynamicQueryHandler.js'
import { handleDealerFunnelActivity, handleDealerFunnelTestDrive, handleDealerFunnelForecast, handleDealerFunnelInsight, handleDealerFunnelMetrics, handleDealerFunnelReport, handleDealerFunnelReportEdit } from './backend/dealerFunnelHandler.js'
import { handleListScopes } from './backend/scopesHandler.js'
import { handleListLlmModels } from './backend/llmModelsHandler.js'
import { handleMe, handleLogout } from './backend/authHandler.js'
import {
  handleGetSavedPage,
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
  handleGetSavedPageObjectData,
  handleGetSavedPageData,
} from './backend/dashboardPagesHandler.js'

loadDotenv()

const __dirname = dirname(fileURLToPath(import.meta.url))
const FRONTEND_DIR = join(__dirname, 'frontend')
const DATA_DIR = join(FRONTEND_DIR, 'public', 'data')

function withCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
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
      ssePost('/api/agentic-bi-ask', handleAgenticBiRequest)(server)
      // /render를 먼저 등록한다. vite의 server.middlewares.use()는 경로를 **접두사**로
      // 매칭하므로, '/api/dynamic-query'를 먼저 걸면 '/api/dynamic-query/render' 요청까지
      // 조회 핸들러가 먹어서 JSON을 기대한 화면에 SSE 스트림이 돌아온다.
      jsonRoute('/api/dynamic-query/render', { POST: handleDynamicRenderRequest })(server)
      ssePost('/api/dynamic-query', handleDynamicQueryRequest)(server)
      jsonRoute('/api/dealer-funnel/activity', { GET: handleDealerFunnelActivity })(server)
      jsonRoute('/api/dealer-funnel/testdrive', { GET: handleDealerFunnelTestDrive })(server)
      jsonRoute('/api/dealer-funnel/forecast', { GET: handleDealerFunnelForecast })(server)
      jsonRoute('/api/dealer-funnel/insight', { GET: handleDealerFunnelInsight })(server)
      jsonRoute('/api/dealer-funnel/metrics', { GET: handleDealerFunnelMetrics })(server)
      jsonRoute('/api/dealer-funnel/report-edit', { POST: handleDealerFunnelReportEdit })(server)
      jsonRoute('/api/dealer-funnel/report.html', { GET: handleDealerFunnelReport })(server)
      jsonRoute('/api/auth/me', { GET: handleMe })(server)
      jsonRoute('/api/auth/logout', { POST: handleLogout })(server)
      jsonRoute('/api/scopes', { GET: handleListScopes })(server)
      jsonRoute('/api/llm/models', { GET: handleListLlmModels })(server)
      // server.middlewares.use()는 prefix 매칭이라 등록 순서가 중요하다 — 먼저 매칭되면
      // 그걸로 응답이 끝나버리므로, /api/dashboard-pages보다 구체적인 하위 경로를 먼저 등록한다.
      jsonRoute('/api/dashboard-pages/object-data', { POST: handleGetSavedPageObjectData })(server)
      jsonRoute('/api/dashboard-pages/data', { POST: handleGetSavedPageData })(server)
      jsonRoute('/api/dashboard-pages/list', { GET: handleListSavedPages })(server)
      jsonRoute('/api/dashboard-pages/deploy-history', { GET: handleListDeployHistory })(server)
      jsonRoute('/api/dashboard-pages/deploy-preview', { POST: handlePreviewDeployVersion })(server)
      jsonRoute('/api/dashboard-pages/deploy-version', { POST: handlePinDeployVersion })(server)
      jsonRoute('/api/dashboard-pages/deployed', { GET: handleGetDeployedPage })(server)
      jsonRoute('/api/dashboard-pages/deployed-data', { POST: handleGetDeployedPageData })(server)
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
  root: FRONTEND_DIR,
  publicDir: join(FRONTEND_DIR, 'public'),
  build: {
    outDir: join(__dirname, 'dist'),
    emptyOutDir: true,
  },
  plugins: [react(), azureChatPlugin()],
  // AI365 로그인 API가 localhost의 CORS를 허용하지 않을 때를 대비한 dev 프록시.
  // .env에서 VITE_AI365_LOGIN_URL=/api/ai365/login 로 두면 브라우저는 same-origin으로
  // 요청하고 vite가 실제 staging 엔드포인트로 중계한다(운영 빌드에는 영향 없음).
  server: {
    fs: {
      allow: [__dirname],
    },
    proxy: {
      '/api/ai365/login': {
        target: 'https://mcloud-dataagent-api-c0bjb0htc6bsg7fm.koreasouth-01.azurewebsites.net',
        changeOrigin: true,
        secure: true,
        rewrite: (p) => p.replace(/^\/api\/ai365\/login/, '/auth/login'),
      },
    },
  },
  // react-grid-layout(WidgetGrid.jsx)의 의존성인 react-draggable이 브라우저에 없는
  // `process.env.DRAGGABLE_DEBUG`를 참조해서 드래그 시작 시 "process is not defined"로
  // 죽는다 — Vite는 process.env.NODE_ENV만 기본으로 치환해주므로 process.env 전체를 빈
  // 객체로 정의해 막는다.
  define: {
    'process.env': {},
  },
})
