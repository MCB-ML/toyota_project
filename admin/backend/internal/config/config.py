import base64
import os
from dataclasses import dataclass
from pathlib import Path

from dotenv import load_dotenv

from pkg.main_lib import MainLib

mainLib = MainLib()
LOG_TAG = "OSConfig"
printDebugConfig = True


@dataclass
class ServerConfig:
    host: str
    port: int
    readTimeout: int
    writeTimeout: int
    idleTimeout: int
    workers: int
    allowedOrigins: list[str]


# end class


@dataclass
class LoggingConfig:
    level: str
    showInConsole: bool
    appEnv: str


# end class


@dataclass
class DatabasePostgresConfig:
    """PostgreSQL connection used by the admin backend."""

    host: str
    user: str
    password: str
    name: str
    port: str
    schema: str
    sslMode: str
    poolSize: int
    maxOverflow: int
    echoSql: bool


# end class


@dataclass
class AzureADConfig:
    tenantId: str
    clientId: str
    clientSecret: str
    syncInterval: int


# end class


@dataclass
class JwtConfig:
    privateKey: str
    publicKey: str
    algorithm: str


# end class


@dataclass
class Config:
    server: ServerConfig
    logging: LoggingConfig
    databasePostgres: DatabasePostgresConfig
    azureAd: AzureADConfig
    jwt: JwtConfig


# end class


def getEnv(key: str, defaultValue: str) -> str:
    """Get environment variable with default value."""
    value = os.getenv(key)
    if value is None or value == "":
        return defaultValue
    return value


# end def


def getBoolEnv(key: str, defaultValue: bool) -> bool:
    """Get boolean environment variable with default value."""
    value = os.getenv(key)
    if value is None or value == "":
        return defaultValue
    # end if

    # Handle boolean
    if value.lower() in ("true", "1", "yes", "on"):
        return True
    elif value.lower() in ("false", "0", "no", "off"):
        return False
    else:
        return defaultValue
    # end if


# end def


def getIntEnv(key: str, defaultValue: int) -> int:
    """Get integer environment variable with default value."""
    value = os.getenv(key)
    if value is None or value == "":
        return defaultValue
    # end if

    try:
        return int(value)
    except ValueError:
        return defaultValue
    # end try


# end def


def loadConfig() -> Config:
    # Determine environment
    env = os.getenv("APP_ENV", "dev")

    base_dir = Path(__file__).resolve().parent.parent.parent
    deployments_dir = base_dir / "deployments"

    env_file = deployments_dir / f"{env}.env"

    if env_file.exists():
        load_dotenv(dotenv_path=env_file)
    elif env not in {"docker", "compose"}:
        mainLib.logPrint(
            f"Warning: Environment file {env_file} not found.",
            LOG_TAG,
            printDebugConfig,
        )
    # end if

    # Load JWT Keys
    jwtPrivateKeyPath = getEnv("JWT_PRIVATE_KEY_PATH", "certs/private.pem")
    jwtPublicKeyPath = getEnv("JWT_PUBLIC_KEY_PATH", "certs/public.pem")

    privateKeyContent = ""
    publicKeyContent = ""

    try:
        # Try loading from Environment Variables (Base64 encoded) first
        privateKeyBase64 = getEnv("JWT_PRIVATE_KEY_BASE64", "")
        if privateKeyBase64:
            try:
                privateKeyContent = base64.b64decode(privateKeyBase64).decode("utf-8")
            except Exception as e:
                mainLib.logPrint(
                    f"Error decoding JWT_PRIVATE_KEY_BASE64: {e}",
                    LOG_TAG,
                    printDebugConfig,
                )
            # end try
        # end if

        if not privateKeyContent:
            if os.path.exists(jwtPrivateKeyPath):
                with open(jwtPrivateKeyPath, "r") as f:
                    privateKeyContent = f.read()
            else:
                mainLib.logPrint(
                    f"Warning: JWT Private Key not found at {jwtPrivateKeyPath}",
                    LOG_TAG,
                    printDebugConfig,
                )
            # end if
        # end if

        # Try loading Public Key
        publicKeyBase64 = getEnv("JWT_PUBLIC_KEY_BASE64", "")
        if publicKeyBase64:
            try:
                publicKeyContent = base64.b64decode(publicKeyBase64).decode("utf-8")
            except Exception as e:
                mainLib.logPrint(
                    f"Error decoding JWT_PUBLIC_KEY_BASE64: {e}",
                    LOG_TAG,
                    printDebugConfig,
                )
            # end try
        # end if

        if not publicKeyContent:
            if os.path.exists(jwtPublicKeyPath):
                with open(jwtPublicKeyPath, "r") as f:
                    publicKeyContent = f.read()
            else:
                mainLib.logPrint(
                    f"Warning: JWT Public Key not found at {jwtPublicKeyPath}",
                    LOG_TAG,
                    printDebugConfig,
                )
            # end if
        # end if

    except Exception as e:
        mainLib.logPrint(f"Error loading JWT keys: {e}", LOG_TAG, True)
    # end try

    return Config(
        server=ServerConfig(
            host=getEnv("SERVER_HOST", "0.0.0.0"),
            port=getIntEnv("SERVER_PORT", 8080),
            readTimeout=getIntEnv("SERVER_READ_TIMEOUT", 30),
            writeTimeout=getIntEnv("SERVER_WRITE_TIMEOUT", 30),
            idleTimeout=getIntEnv("SERVER_IDLE_TIMEOUT", 120),
            workers=getIntEnv("WORKERS", 1),
            allowedOrigins=getEnv("ALLOWED_ORIGINS", "*").split(","),
        ),
        logging=LoggingConfig(
            level=getEnv("LOG_LEVEL", "info"),
            showInConsole=getBoolEnv("LOG_SHOW_CONSOLE", True),
            appEnv=env,
        ),
        databasePostgres=DatabasePostgresConfig(
            host=getEnv("DATABASE_PG_HOST", "localhost"),
            user=getEnv("DATABASE_PG_USER", ""),
            password=getEnv("DATABASE_PG_PASSWORD", ""),
            name=getEnv("DATABASE_PG_NAME", ""),
            port=getEnv("DATABASE_PG_PORT", "5432"),
            schema=getEnv("DATABASE_PG_SCHEMA", "dbo"),

            sslMode=getEnv("DATABASE_PG_SSLMODE", "require"),
            # Keep the admin pool small; the service owns most Fabric query traffic.
            poolSize=getIntEnv("DATABASE_PG_POOL_SIZE", 5),
            maxOverflow=getIntEnv("DATABASE_PG_MAX_OVERFLOW", 5),
            echoSql=getBoolEnv("DB_ECHO_SQL", False),
        ),
        azureAd=AzureADConfig(
            tenantId=getEnv("AZURE_AD_TENANT_ID", ""),
            clientId=getEnv("AZURE_AD_CLIENT_ID", ""),
            clientSecret=getEnv("AZURE_AD_CLIENT_SECRET", ""),
            syncInterval=getIntEnv("AD_SYNC_INTERVAL_SECONDS", 3600),  # Default 1 hour
        ),
        jwt=JwtConfig(
            privateKey=privateKeyContent,
            publicKey=publicKeyContent,
            algorithm=getEnv("JWT_ALGORITHM", "RS256"),
        ),
    )


# end def
