# DTO Imports
from internal.domain.entities.error_response import (
    ERROR_CODE_NOT_FOUND,
    ERROR_MSG_NOT_FOUND,
    ErrorResponse,
)
from internal.infrastructure.httpserver.handler.handler_context import HandlerContext
from internal.infrastructure.httpserver.router.router import Router

# Route Imports
from internal.interfaces.routes.ad_user_master_routes import adUserMasterRoutes
from internal.interfaces.routes.ad_user_routes import adUserRoutes
from internal.interfaces.routes.auth_routes import authRoutes
from internal.interfaces.routes.model_routes import modelRoutes
from internal.interfaces.routes.company_routes import companyRoutes
from internal.interfaces.routes.system_prompt_routes import systemPromptRoutes
from internal.interfaces.routes.token_usage_routes import tokenUsageRoutes
from internal.interfaces.routes.user_routes import userRoutes


# Branch / Workspace / OrgChart / PowerBI / Dataset / DataAgent / AIAgent / Copilot
# 라우트는 등록하지 않는다. 해당 테이블이 스키마에서 제거되어 호출 시 오류가 난다.
def registerRoutes(
    environment: str,
    mainLib,
    baseRouter: Router,
    userHandler=None,
    companyHandler=None,
    adUserHandler=None,
    adUserMasterHandler=None,
    modelHandler=None,
    systemPromptHandler=None,
    tokenUsageHandler=None,
    authHandler=None,
):
    # ==================== Ping Route ====================
    # Ping server to check health
    async def pingHandler(hc: HandlerContext):
        """Health check endpoint"""
        response = {
            "status": "OK",
            "message": "Pong!",
            "time": mainLib.getCurrentDatetime("%Y-%m-%d %H:%M:%S", True, False, ""),
            "env": environment,
        }
        return hc.sendJson(200, response)

    # end def

    baseRouter.get(
        "/ping",
        pingHandler,
        summary="Health Check",
        description="Check if the server is running and get basic server information",
        tags=["Ping"],
    )

    # ==================== API Routes ====================
    # API base route
    apiRouter = baseRouter.pathPrefix("/api/v1")

    # User Routes
    if userHandler:
        userRoutes(apiRouter, userHandler)
    # end if

    # Company Routes
    if companyHandler:
        companyRoutes(apiRouter, companyHandler)
    # end if

    # AD User Routes
    if adUserHandler:
        adUserRoutes(apiRouter, adUserHandler)
    # end if

    # AD User Master Routes
    if adUserMasterHandler:
        adUserMasterRoutes(apiRouter, adUserMasterHandler)
    # end if

    # 모델 스펙 카탈로그 (전역)
    if modelHandler:
        modelRoutes(apiRouter, modelHandler)

    # System Prompt Routes (전역 프롬프트. 딜러사 구분 없음)
    if systemPromptHandler:
        systemPromptRoutes(apiRouter, systemPromptHandler)

    # 토큰 사용량. 에이전트가 쓰고, 어드민 사용량 화면이 읽는다
    if tokenUsageHandler:
        tokenUsageRoutes(apiRouter, tokenUsageHandler)

    # Auth Routes
    if authHandler:
        authRoutes(apiRouter, authHandler)

    # ==================== Register all sub routers ====================
    baseRouter.includeRouter(apiRouter)

    # ==================== Not Found Handler ====================
    def notFoundHandler(hc: HandlerContext):
        method = hc.request.method
        path = hc.request.url.path
        clientHost = hc.request.client.host if hc.request.client else "unknown"

        mainLib.logPrint(
            f"404 Not Found - {method} {path} from {clientHost}", "OSRoutes", True
        )

        return hc.sendErrorJson(
            404, ErrorResponse(code=ERROR_CODE_NOT_FOUND, message=ERROR_MSG_NOT_FOUND)
        )

    # end def

    baseRouter.notFoundHandler(notFoundHandler)


# end def
