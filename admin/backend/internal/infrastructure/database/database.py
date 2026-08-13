import asyncio
import urllib.parse
from enum import Enum
from typing import Optional, Tuple

from sqlalchemy.ext.asyncio import AsyncEngine, create_async_engine

from internal.config.config import loadConfig
from pkg.main_lib import MainLib


class DatabaseType(Enum):
    POSTGRES = "postgres"


postgresDb: Optional[AsyncEngine] = None
_lock = asyncio.Lock()
mainLib = MainLib()
LOG_TAG = "OSDbConn"
printDebugDbConn = True


async def getDatabase(dbType: DatabaseType) -> AsyncEngine:
    global postgresDb

    async with _lock:
        if dbType == DatabaseType.POSTGRES:
            if postgresDb is None:
                postgresDb = connectDatabase(dbType)
            return postgresDb
        else:
            mainLib.logPrint(
                f"Unknown database type: {dbType}", LOG_TAG, printDebugDbConn
            )
            raise ValueError(f"Unknown database type: {dbType}")
        # end if
    # end with


# end def


async def connectToDatabase(dbType: DatabaseType) -> AsyncEngine:
    return await getDatabase(dbType)


# end def


def buildDsn(dbType: DatabaseType) -> str:
    cfg = loadConfig()

    if dbType == DatabaseType.POSTGRES:
        pgCfg = cfg.databasePostgres
        host = pgCfg.host or "localhost"
        port = pgCfg.port or "5432"
        user = urllib.parse.quote_plus(pgCfg.user)
        password = urllib.parse.quote_plus(pgCfg.password)
        dbname = pgCfg.name

        # asyncpg 는 DSN 쿼리스트링의 sslmode 를 받지 않는다.
        # SSL 은 connect_args 로 넘긴다 (_buildConnectArgs 참고).
        return f"postgresql+asyncpg://{user}:{password}@{host}:{port}/{dbname}"
    # end if

    return ""


# end def


def _buildConnectArgs() -> dict:
    """asyncpg 전용 연결 인자.

    ssl
        외부 DB 이므로 기본이 require. 로컬 도커면 DATABASE_PG_SSLMODE=disable.

    server_settings.search_path
        스키마가 셋이다 — dbo(어드민이 쓴다) / agent(에이전트가 쓴다) / dashboard.
        엔티티가 schema 를 명시하고 있어 테이블 해석에는 문제가 없지만,
        뷰나 raw SQL 은 검색 경로를 타므로 읽을 스키마를 모두 넣어둔다.
        어드민이 쓰는 것은 dbo 뿐이고 agent 는 사용량 조회용 읽기 전용이다.
    """
    cfg = loadConfig()
    pgCfg = cfg.databasePostgres

    connectArgs: dict = {
        "server_settings": {
            "search_path": f"{pgCfg.schema},agent,public",
            "application_name": "ai365-admin-api",
        }
    }

    sslMode = (pgCfg.sslMode or "").lower()

    if sslMode in ("", "disable", "allow", "prefer"):
        connectArgs["ssl"] = False
    else:
        # require / verify-ca / verify-full
        connectArgs["ssl"] = True
    # end if

    return connectArgs


# end def


def connectDatabase(dbType: DatabaseType) -> AsyncEngine:
    dsn = buildDsn(dbType)

    if not dsn:
        mainLib.logPrint(
            f"Failed to build DSN for database type: {dbType}",
            LOG_TAG,
            printDebugDbConn,
        )
        raise ValueError(f"Failed to build DSN for database type: {dbType}")
    # end if

    cfg = loadConfig()
    pgCfg = cfg.databasePostgres

    try:
        engine = create_async_engine(
            dsn,
            echo=pgCfg.echoSql,
            connect_args=_buildConnectArgs(),
            pool_size=pgCfg.poolSize,
            max_overflow=pgCfg.maxOverflow,
            pool_recycle=900,  # 15분마다 연결 재생성 (유휴 연결 끊김 대비)
            pool_pre_ping=True,  # 사용 전 연결 확인
        )

        return engine

    except Exception as e:
        mainLib.logPrint(
            f"Failed to connect to {dbType} database: {e}", LOG_TAG, printDebugDbConn
        )
        raise RuntimeError(f"Failed to connect to {dbType} database: {e}")
    # end try


# end def


def getDatabaseHostPort(dbType: DatabaseType) -> Tuple[str, str]:
    cfg = loadConfig()

    if dbType == DatabaseType.POSTGRES:
        return cfg.databasePostgres.host, cfg.databasePostgres.port
    # end if

    return "", ""


# end def
