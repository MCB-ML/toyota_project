import contextlib
from typing import AsyncIterator

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import ORJSONResponse

from internal.infrastructure.database.database import DatabaseType, connectDatabase
from internal.middleware.auth import AuthMiddleware, newAuthMiddlewareArgs
from internal.middleware.logger import RequestLoggerMiddleware
from pkg.main_lib import MainLib

printDebugServer = True
LOG_TAG = "OSServer"
mainLib = MainLib()


@contextlib.asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    try:
        # Initialize Database Connection
        connectDatabase(DatabaseType.POSTGRES)
        mainLib.logPrint("Database connected successfully.", LOG_TAG, printDebugServer)
    except Exception as e:
        mainLib.logPrint(
            f"Failed to connect to database on startup: {e}", LOG_TAG, printDebugServer
        )
    # end try
    yield

    # Shutdown
    mainLib.logPrint("Server shutting down...", LOG_TAG, printDebugServer)
    # 이 코드베이스는 PostgreSQL 만 쓴다. mssqlDb 는 옛 MSSQL 시절 잔재라 존재하지 않아
    # 종료 때마다 ImportError 가 났고, 그 바람에 기동 실패의 진짜 원인이 가려졌다.
    from internal.infrastructure.database.database import postgresDb

    if postgresDb:
        await postgresDb.dispose()
        mainLib.logPrint("Database connection closed.", LOG_TAG, printDebugServer)
    # end if


# end def


class Server:
    def __init__(
        self,
        mainLib,
        config,
        userRepo=None,
        enableLogging=True,
        enableCors=True,
        enableGzip=True,
    ):
        self.mainLib = mainLib
        self.config = config
        # 인증 미들웨어가 계정을 조회할 때 쓴다. 없으면 인증이 꺼진다.
        self.userRepo = userRepo
        self.enableLogging = enableLogging
        self.enableCors = enableCors
        self.enableGzip = enableGzip

        self.app = FastAPI(
            title="OS Backend",
            default_response_class=ORJSONResponse,
            lifespan=lifespan,
            # Disable OpenAPI docs in production
            docs_url="/docs" if config.logging.appEnv != "prod" else None,
            redoc_url="/redoc" if config.logging.appEnv != "prod" else None,
        )

        self.setupMiddleware()

        # Create router for route registration
        from internal.infrastructure.httpserver.router.router import Router

        self.router = Router(app=self.app, mainLib=self.mainLib)

    # end def

    def setupMiddleware(self):
        # 인증을 제일 먼저 등록한다.
        #
        # add_middleware 는 목록 앞에 끼워 넣으므로 나중에 등록한 것이 바깥쪽이 된다.
        # 인증이 CORS 보다 바깥이면 401/403 응답에 CORS 헤더가 붙지 않아,
        # 브라우저가 상태코드 대신 CORS 오류를 보고한다. 화면이 원인을 알 수 없게 된다.
        if self.userRepo is not None:
            self.app.add_middleware(
                AuthMiddleware, **newAuthMiddlewareArgs(self.mainLib, self.userRepo)
            )
        else:
            self.mainLib.logPrint(
                "[경고] userRepo 가 없어 인증 미들웨어를 건너뜁니다. API 가 열려 있습니다.",
                LOG_TAG,
                printDebugServer,
            )
        # end if

        # Add RequestLoggerMiddleware
        if self.enableLogging:
            self.app.add_middleware(
                RequestLoggerMiddleware, mainLib=self.mainLib, logHealthCheck=False
            )
        # end if

        if self.enableCors:
            self.app.add_middleware(
                CORSMiddleware,
                allow_origins=self.config.server.allowedOrigins,
                allow_credentials=True,
                allow_methods=["*"],
                allow_headers=["*"],
            )
        # end if

        # Only enable GZip for responses > 1000 bytes
        if self.enableGzip:
            self.app.add_middleware(GZipMiddleware, minimum_size=1000)
        # end if

    # end def

    def getRouter(self):
        """Get the router instance for route registration"""
        return self.router

    # end def

    def run(self):
        self.mainLib.logPrint(
            f"Starting server on {self.config.server.host}:{self.config.server.port} with {self.config.server.workers} workers",
            LOG_TAG,
            printDebugServer,
        )

        uvicorn.run(
            self.app,
            host=self.config.server.host,
            port=self.config.server.port,
            workers=self.config.server.workers,
            loop="uvloop",
            http="httptools",
            log_level=self.config.logging.level,
            access_log=False,
        )

    # end def


# end class
