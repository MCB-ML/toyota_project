import asyncio
import importlib.util
import os
import sys
from unittest.mock import AsyncMock, MagicMock, patch

# Add project root to path
sys.path.append(os.getcwd())


async def runStartupTest():
    print("Starting start up test...")

    # Mock critical infrastructure components
    with (
        patch(
            "internal.infrastructure.database.database.connectDatabase"
        ) as mockDBConnect,
        patch(
            "internal.infrastructure.database.database.getDatabaseHostPort"
        ) as mockDBGetHost,
        patch("uvicorn.Server.serve", new_callable=AsyncMock) as _,
        patch("azure.identity.aio.ClientSecretCredential", new_callable=MagicMock) as _,
    ):
        # Setup mocks
        mockEngine = MagicMock()
        # Mock async context manager for connect()
        mockConnection = AsyncMock()
        mockEngine.connect.return_value.__aenter__.return_value = mockConnection

        mockDBConnect.return_value = mockEngine
        mockDBGetHost.return_value = ("mock-host", 1433)

        # Mock sys.argv to simulate running the script
        with patch.object(sys, "argv", ["main.py"]):
            try:
                # Import cmd/main.py module
                spec = importlib.util.spec_from_file_location(
                    "cmdMain", os.path.join(os.getcwd(), "cmd", "main.py")
                )
                if spec is None or spec.loader is None:
                    raise ImportError("Could not find cmd/main.py")
                # end if

                cmdMain = importlib.util.module_from_spec(spec)
                sys.modules["cmdMain"] = cmdMain
                spec.loader.exec_module(cmdMain)

                # Verify imports
                from internal.config.config import loadConfig

                cfg = loadConfig()
                print(f"Config loaded successfully. Env: {cfg.logging.appEnv}")

                print("Executing main() routine...")
                if hasattr(cmdMain, "main"):
                    await cmdMain.main()
                # end if

                print("Imports and basic initialization successful.")
                return True
            except ImportError as e:
                print(f"Import Error: {e}")
                import traceback

                traceback.print_exc()
                return False
            except Exception as e:
                print(f"Startup Error: {e}")
                import traceback

                traceback.print_exc()
                return False
            # end try
        # end with
    # end with


# end def


if __name__ == "__main__":
    success = asyncio.run(runStartupTest())
    if success:
        print("Startup test PASSED")
        sys.exit(0)
    else:
        print("Startup test FAILED")
        sys.exit(1)
    # end if
# end if
