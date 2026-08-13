import asyncio
import os
import sys

# Add project root to path
sys.path.append(os.getcwd())

from sqlalchemy import text

from internal.config.config import loadConfig
from internal.infrastructure.database.database import (
    DatabaseType,
    connectDatabase,
    getDatabaseHostPort,
)
from internal.infrastructure.httpserver.server.server import Server
from pkg.main_lib import MainLib

LOG_TAG = "OSMainPy"
printDebugMain = True


async def main():
    # Load configuration
    cfg = loadConfig()

    # Initialize MainLib for logging
    mainLib = MainLib()
    mainLib.logPrint("Welcome to OS API", LOG_TAG, printDebugMain)

    # Get environment
    appEnv = cfg.logging.appEnv
    mainLib.logPrint(f"Running [{appEnv.upper()}] environment", LOG_TAG, printDebugMain)

    # Initialize DB
    try:
        dbEngine = connectDatabase(DatabaseType.POSTGRES)

        # Test the connection with a simple query
        async with dbEngine.connect() as conn:
            await conn.execute(text("SELECT 1"))
        # end with

        host, port = getDatabaseHostPort(DatabaseType.POSTGRES)
        mainLib.logPrint(
            f"Successfully connected to PostgreSQL Host: {host}:{port}",
            LOG_TAG,
            True,
        )
    except Exception as e:
        mainLib.logPrint(f"Failed to connect to PostgreSQL database: {e}", LOG_TAG, True)
        sys.exit(1)
    # end try

    # Initialize repositories and handlers
    from internal.infrastructure.cache.async_cache import AsyncCache
    from internal.infrastructure.msgraph.service import MicrosoftGraphService
    from internal.interfaces.api.v1.ad_users.handler import newADUserHandler
    from internal.interfaces.api.v1.ad_users.master_handler import (
        newADUserMasterHandler,
    )
    from internal.interfaces.api.v1.auth.handler import newAuthHandler
    from internal.interfaces.api.v1.model.handler import newModelHandler
    from internal.interfaces.api.v1.systemPrompt.handler import newSystemPromptHandler
    from internal.interfaces.api.v1.tokenUsage.handler import newTokenUsageHandler
    from internal.interfaces.api.v1.companies.handler import newCompanyHandler
    from internal.interfaces.api.v1.users.handler import newUserHandler
    from internal.interfaces.repository.ad_user_master_repository import (
        newADUserMasterRepository,
    )
    from internal.interfaces.repository.ad_user_repository import newADUserRepository
    from internal.interfaces.repository.model_repository import newModelRepository
    from internal.interfaces.repository.company_repository import newCompanyRepository
    from internal.interfaces.repository.system_prompt_repository import (
        newSystemPromptRepository,
    )
    from internal.interfaces.repository.token_usage_repository import (
        newTokenUsageRepository,
    )
    from internal.interfaces.repository.user_repository import newUserRepository

    # Initialize cache
    cache = AsyncCache()

    # Inject dependencies
    # 1. Initialize Repositories
    userRepo = newUserRepository(dbEngine, cache)
    companyRepo = newCompanyRepository(dbEngine, cache)
    adUserRepo = newADUserRepository(dbEngine, cache)
    adUserMasterRepo = newADUserMasterRepository(dbEngine, cache)
    modelRepo = newModelRepository(dbEngine, cache)
    systemPromptRepo = newSystemPromptRepository(dbEngine, cache)
    tokenUsageRepo = newTokenUsageRepository(dbEngine, cache)

    # 2. Initialize Handlers
    # 워크스페이스 저장소는 없다(기능 제거). 핸들러가 None 을 받아 건너뛴다.
    userHandler = newUserHandler(userRepo, None, mainLib)
    companyHandler = newCompanyHandler(companyRepo, mainLib)
    modelHandler = newModelHandler(modelRepo, mainLib)
    systemPromptHandler = newSystemPromptHandler(systemPromptRepo, mainLib)
    tokenUsageHandler = newTokenUsageHandler(tokenUsageRepo, mainLib)

    # Initialize Microsoft Graph Service
    graphService = MicrosoftGraphService(cfg.azureAd)

    adUserHandler = newADUserHandler(
        adUserRepo, adUserMasterRepo, None, graphService, mainLib
    )
    adUserMasterHandler = newADUserMasterHandler(
        adUserMasterRepo, None, adUserRepo, mainLib
    )
    authHandler = newAuthHandler(
        adUserRepo, adUserMasterRepo, userRepo, graphService, mainLib
    )

    # Create HTTP server
    # userRepo 를 넘겨야 인증 미들웨어가 켜진다
    server = Server(mainLib, cfg, userRepo=userRepo)

    # Register all routes
    from internal.interfaces.routes.routes import registerRoutes

    registerRoutes(
        appEnv,
        mainLib,
        server.getRouter(),
        userHandler=userHandler,
        companyHandler=companyHandler,
        adUserHandler=adUserHandler,
        adUserMasterHandler=adUserMasterHandler,
        modelHandler=modelHandler,
        systemPromptHandler=systemPromptHandler,
        tokenUsageHandler=tokenUsageHandler,
        authHandler=authHandler,
    )

    # Run AD users sync
    async def runADUserSync():
        while True:
            try:
                adUsers = await graphService.getUsers()
                mainLib.logPrint(
                    f"Background: Fetched {len(adUsers)} users from Azure AD",
                    LOG_TAG,
                    printDebugMain,
                )
                if adUsers:
                    await adUserRepo.upsertUsers(adUsers)
                # end if

            except Exception as e:
                mainLib.logPrint(
                    f"Background: Failed to sync users from Azure AD: {e}",
                    LOG_TAG,
                    printDebugMain,
                )
            # end try

            await asyncio.sleep(cfg.azureAd.syncInterval)
        # end while

    # end def

    # Start independent tasks
    # AD 가 설정되지 않았으면 동기화를 돌리지 않는다.
    # 그냥 두면 주기마다 실패 로그만 쌓인다.
    if graphService.isConfigured:
        asyncio.create_task(runADUserSync())
    else:
        mainLib.logPrint(
            "Azure AD 미설정 - AD 사용자 동기화를 건너뜁니다.", LOG_TAG, printDebugMain
        )

    # Start the server
    import uvicorn

    # uvloop / httptools 는 Windows 에 없다. 있으면 쓰고 없으면 기본 구현으로 돈다.
    # 고정해두면 로컬(Windows)에서 서버가 아예 뜨지 못한다.
    def _hasModule(name: str) -> bool:
        import importlib.util

        return importlib.util.find_spec(name) is not None

    config = uvicorn.Config(
        server.app,
        host=cfg.server.host,
        port=cfg.server.port,
        loop="uvloop" if _hasModule("uvloop") else "auto",
        http="httptools" if _hasModule("httptools") else "auto",
        access_log=False,
    )
    uvicorn_server = uvicorn.Server(config)

    mainLib.logPrint(
        f"Server starting on {cfg.server.host}:{cfg.server.port}...", LOG_TAG, True
    )
    await uvicorn_server.serve()


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        pass
    # end try
# end if
