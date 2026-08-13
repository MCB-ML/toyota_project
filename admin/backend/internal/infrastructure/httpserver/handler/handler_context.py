import json
import re
import time
from typing import Any, Dict, List, Optional, Tuple, Type, TypeVar

import httpx
from fastapi import Request
from fastapi.encoders import jsonable_encoder
from fastapi.responses import ORJSONResponse

from internal.domain.entities.error_response import ErrorResponse
from pkg.main_lib import MainLib

T = TypeVar("T")

LOG_TAG_CONTEXT = "OSHCmain"
printDebugCtx = True
printDebugCtxError = True


class HandlerContext:
    def __init__(self, request: Request, mainLib: MainLib):
        self.request = request
        self.mainLib = mainLib
        self.responseHeaders: Dict[str, str] = {}
        self._parsedBody: Optional[Any] = None
        self._client: Optional[httpx.AsyncClient] = None
        self._cookies: List[Dict[str, Any]] = []

    # end def

    async def _getClient(self) -> httpx.AsyncClient:
        """Lazy initialization of HTTP client"""
        if self._client is None:
            self._client = httpx.AsyncClient(timeout=10.0)
        return self._client

    # end def

    def getContext(self):
        """Get request context"""
        return self.request

    # end def

    def setParsedBody(self, body: Any):
        """Set the body that was already parsed by FastAPI"""
        self._parsedBody = body

    # end def

    def getParsedBody(self) -> Optional[Any]:
        """Get the body that was already parsed by FastAPI"""
        return self._parsedBody

    # end def

    def getHeader(self, key: str) -> str:
        """Get header value"""
        return self.request.headers.get(key, "")

    # end def

    def getQueryParam(self, key: str) -> str:
        """Get query parameter"""
        return self.request.query_params.get(key, "")

    # end def

    def getPathParams(self) -> Dict[str, Any]:
        """Get path parameters"""
        return dict(self.request.path_params)

    # end def

    async def readBytesBody(self) -> bytes:
        """Read request body as bytes"""
        return await self.request.body()

    # end def

    async def readBody(self, model: Type[T]) -> T:
        """Read and validate request body into Pydantic model"""
        # If we already parsed it via FastAPI dependency (for Swagger), use it
        if self._parsedBody is not None:
            # If it's already the right model type, return it
            if isinstance(self._parsedBody, model):
                return self._parsedBody
            # If it's a dict or other compatible type, validate it
            return model.model_validate(self._parsedBody)
        # end if

        # Otherwise read from stream/json
        body = await self.request.json()
        return model.model_validate(body)

    # end def

    async def readForm(self, model: Optional[Type[T]] = None) -> Any:
        """Read form data (including files) return a dictionary or Pydantic model"""
        data = {}

        # If already parsed it (via params_dependency=Form)
        if self._parsedBody is not None:
            if model and isinstance(self._parsedBody, model):
                return self._parsedBody
            data = self._parsedBody
        else:
            # Fallback to reading from request
            form_data = await self.request.form()
            data = dict(form_data)
        # end if

        if model:
            return model.model_validate(data)
        # end if

        return data

    # end def

    def setHeader(self, key: str, value: str):
        """Set response header"""
        self.responseHeaders[key] = value

    # end def

    def setCookie(
        self,
        key: str,
        value: str = "",
        max_age: Optional[int] = None,
        expires: Optional[int] = None,
        path: str = "/",
        domain: Optional[str] = None,
        secure: bool = False,
        httponly: bool = False,
        samesite: Optional[str] = "lax",
    ):
        self._cookies.append(
            {
                "key": key,
                "value": value,
                "max_age": max_age,
                "expires": expires,
                "path": path,
                "domain": domain,
                "secure": secure,
                "httponly": httponly,
                "samesite": samesite,
            }
        )

    # end def

    def sendJson(self, statusCode: int, body: Any) -> ORJSONResponse:
        """Send JSON response.

        jsonable_encoder 를 한 번 거치는 이유:
            asyncpg 는 uuid 컬럼을 pgproto.UUID 로 돌려준다. uuid.UUID 의 하위형이지만
            orjson 은 정확한 타입만 알아서 그대로 넘기면
            "Type is not JSON serializable: asyncpg.pgproto.pgproto.UUID" 로 죽는다.
            Decimal / datetime 도 같은 이유로 여기서 함께 정리된다.
        """
        headers = {"Content-Type": "application/json"}
        headers.update(self.responseHeaders)
        response = ORJSONResponse(
            content=jsonable_encoder(body), status_code=statusCode, headers=headers
        )

        for cookie in self._cookies:
            response.set_cookie(**cookie)
        # end for

        return response

    # end def

    def sendErrorJson(self, statusCode: int, error: ErrorResponse) -> ORJSONResponse:
        """Send error response in JSON format"""
        return self.sendJson(
            statusCode, error.model_dump(exclude_none=True, by_alias=True)
        )

    # end def

    def _logRequest(self, method: str, url: str, headers: Dict[str, str], body: bytes):
        """Log outgoing HTTP request"""
        self.mainLib.logPrint(f"==> [{method}] {url}", LOG_TAG_CONTEXT, True)

        # Log headers
        for key, value in headers.items():
            if key.lower() == "authorization" or "password" in key.lower():
                self.mainLib.logPrint(f"--> {key}: *", LOG_TAG_CONTEXT, printDebugCtx)
            else:
                self.mainLib.logPrint(
                    f"--> {key}: {value}", LOG_TAG_CONTEXT, printDebugCtx
                )
        # end for

        # Log body
        bodySize = len(body)
        if bodySize > 0:
            if bodySize > 1000:
                self.mainLib.logPrint(
                    f"--> Body size: {bodySize} bytes", LOG_TAG_CONTEXT, printDebugCtx
                )
                return
            # end if

            contentType = headers.get("Content-Type", "")
            isJson = "application/json" in contentType
            bodyStr = body.decode("utf-8", errors="replace")

            # Mask passwords in JSON
            if isJson and '"password"' in bodyStr:
                passwordRegex = re.compile(r'"password"\s*:\s*"[^"]*"')
                bodyStr = passwordRegex.sub('"password":"*****"', bodyStr)
            # end if

            if isJson:
                try:
                    prettyJson = json.dumps(json.loads(body), indent=2)
                    self.mainLib.logPrint(
                        f"--> JSON Body:\n{prettyJson}", LOG_TAG_CONTEXT, printDebugCtx
                    )
                except json.JSONDecodeError:
                    self.mainLib.logPrint(
                        f"--> Invalid JSON Body: {bodyStr}",
                        LOG_TAG_CONTEXT,
                        printDebugCtx,
                    )
                # end try
            else:
                self.mainLib.logPrint(
                    f"--> Body: {bodyStr}", LOG_TAG_CONTEXT, printDebugCtx
                )
            # end if
        # end if

    # end def

    def _logResponse(self, resp: httpx.Response, respBody: bytes, latency: float):
        """Log incoming HTTP response"""
        self.mainLib.logPrint(
            f"<== Response: {resp.status_code} {resp.reason_phrase} | Latency: {latency:.3f}s",
            LOG_TAG_CONTEXT,
            True,
        )

        # Log headers
        for key, value in resp.headers.items():
            self.mainLib.logPrint(f"<-- {key}: {value}", LOG_TAG_CONTEXT, printDebugCtx)
        # end for

        bodySize = len(respBody)
        if bodySize > 0:
            if bodySize > 1000:
                contentType = resp.headers.get("Content-Type", "")
                self.mainLib.logPrint(
                    f"<-- Body size: {bodySize} bytes, Type: {contentType}",
                    LOG_TAG_CONTEXT,
                    printDebugCtx,
                )
                return
            # end if

            contentType = resp.headers.get("Content-Type", "")
            isJson = "application/json" in contentType

            if isJson:
                try:
                    prettyJson = json.dumps(json.loads(respBody), indent=2)
                    self.mainLib.logPrint(
                        f"<-- JSON Body:\n{prettyJson}", LOG_TAG_CONTEXT, printDebugCtx
                    )
                except json.JSONDecodeError:
                    self.mainLib.logPrint(
                        f"<-- Invalid JSON Body: {respBody.decode('utf-8', errors='replace')}",
                        LOG_TAG_CONTEXT,
                        printDebugCtx,
                    )
                # end try
            else:
                try:
                    bodyStr = respBody.decode("utf-8", errors="replace")
                    # Check if printable
                    if bodyStr.isprintable() or all(
                        c.isprintable() or c.isspace() for c in bodyStr
                    ):
                        self.mainLib.logPrint(
                            f"<-- Body: {bodyStr}", LOG_TAG_CONTEXT, printDebugCtx
                        )
                    else:
                        self.mainLib.logPrint(
                            f"<-- Binary Body ({bodySize} bytes)",
                            LOG_TAG_CONTEXT,
                            printDebugCtx,
                        )
                    # end if
                except Exception:
                    self.mainLib.logPrint(
                        f"<-- Binary Body ({bodySize} bytes)",
                        LOG_TAG_CONTEXT,
                        printDebugCtx,
                    )
                # end try
            # end if
        # end if

    # end def

    async def makeRequest(
        self, method: str, url: str, payload: bytes = b""
    ) -> Tuple[httpx.Response, bytes]:
        """Make HTTP request with logging"""
        client = await self._getClient()

        headers = {"Content-Type": "application/json"}

        # Log the outgoing request
        self._logRequest(method, url, headers, payload)

        # Timer for latency
        start = time.time()

        try:
            # Send request
            resp = await client.request(method, url, content=payload, headers=headers)

            # Read response body
            respBody = resp.content

            # Log the incoming response
            latency = time.time() - start
            self._logResponse(resp, respBody, latency)

            return resp, respBody
        except Exception as e:
            self.mainLib.logPrint(
                f"Failed to send request to {url}: {e}",
                LOG_TAG_CONTEXT,
                printDebugCtxError,
            )
            raise
        # end try

    # end def

    async def close(self):
        """Close HTTP client"""
        if self._client is not None:
            await self._client.aclose()
        # end if

    # end def


# end class


def createHandlerContext(mainLib: MainLib):
    """DI factory for HandlerContext"""

    def _createContext(request: Request) -> HandlerContext:
        return HandlerContext(request, mainLib)

    # end def
    return _createContext


# end def
