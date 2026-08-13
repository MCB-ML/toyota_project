import http

from starlette.types import ASGIApp, Receive, Scope, Send


class RequestLoggerMiddleware:
    printDebugLogger = True
    LOG_TAG = "OSLogger"

    def __init__(self, app: ASGIApp, mainLib, logHealthCheck: bool = False):
        self.app = app
        self.mainLib = mainLib
        self.logHealthCheck = logHealthCheck

    # end def

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return
        # end if

        # Skip logging health checks
        if not self.logHealthCheck and scope["path"] == "/ping":
            await self.app(scope, receive, send)
            return
        # end if

        # Capture request info
        client = scope.get("client")
        clientHost = client[0] if client else "unknown"
        clientPort = client[1] if client else 0
        method = scope["method"]
        path = scope["path"]
        httpVersion = scope.get("http_version", "1.1")

        statusCode = 500

        async def send_wrapper(message):
            nonlocal statusCode
            if message["type"] == "http.response.start":
                statusCode = message["status"]
            await send(message)

        # end def

        await self.app(scope, receive, send_wrapper)

        try:
            statusPhrase = http.HTTPStatus(statusCode).phrase
        except ValueError:
            statusPhrase = "Unknown"
        # end try

        message = f'{clientHost}:{clientPort} - "{method} {path} HTTP/{httpVersion}" {statusCode} {statusPhrase}'
        self.mainLib.logPrint(message, self.LOG_TAG, self.printDebugLogger)

    # end def


# end class
