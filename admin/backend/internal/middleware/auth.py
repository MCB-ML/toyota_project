"""어드민 API 인증.

이 백엔드는 어드민 페이지 하나만 먹인다. 어드민 페이지는 관리자 전용이므로
API 도 관리자 전용이다. 화면에서 메뉴를 감추는 것만으로는 부족하다 —
브라우저 주소창이나 curl 로 그대로 부를 수 있다.

예외는 두 갈래다.
  1) 인증 없이 열려야 하는 경로 (로그인, 헬스체크, 문서)
  2) 에이전트 백엔드가 사용량을 적재하는 경로.
     사람 계정이 없는 서버 대 서버 호출이라 별도 키를 쓴다.
"""

import os

import jwt
from starlette.types import ASGIApp, Receive, Scope, Send

LOG_TAG = "OSAuthMw"
printDebugAuth = True

ADMIN_ROLE = "admin"

# 인증 없이 통과. 접두사로 비교한다.
PUBLIC_PREFIXES = (
    "/ping",
    "/docs",
    "/redoc",
    "/openapi.json",
    "/api/v1/auth/",
)

# 에이전트 백엔드가 사용량을 적재하는 경로. 서비스 키로만 연다.
SERVICE_PATHS = ("/api/v1/tokenUsage/log",)


def _isPublic(path: str) -> bool:
    return any(path.startswith(p) for p in PUBLIC_PREFIXES)


class AuthMiddleware:
    """Bearer 토큰을 검사하고 관리자만 통과시킨다."""

    def __init__(self, app: ASGIApp, mainLib, userRepo, secretKey: str, algorithm: str,
                 serviceKey: str = ""):
        self.app = app
        self.mainLib = mainLib
        self.userRepo = userRepo
        self.secretKey = secretKey
        self.algorithm = algorithm or "HS256"
        self.serviceKey = serviceKey

    async def _deny(self, send: Send, status: int, message: str) -> None:
        import orjson

        body = orjson.dumps({"success": False, "result": None, "message": message})

        await send(
            {
                "type": "http.response.start",
                "status": status,
                "headers": [
                    (b"content-type", b"application/json"),
                    (b"content-length", str(len(body)).encode()),
                ],
            }
        )
        await send({"type": "http.response.body", "body": body})

    def _header(self, scope: Scope, name: bytes) -> str:
        for key, value in scope.get("headers", []):
            if key.lower() == name:
                return value.decode("latin-1")
        return ""

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        path = scope["path"]

        # CORS 사전 요청에는 Authorization 헤더가 붙지 않는다.
        # 여기서 막으면 브라우저가 본 요청을 아예 보내지 않는다.
        if scope["method"] == "OPTIONS":
            await self.app(scope, receive, send)
            return

        if _isPublic(path):
            await self.app(scope, receive, send)
            return

        # 에이전트 -> 사용량 적재. 사람 계정이 없으므로 서비스 키로 판단한다.
        if path in SERVICE_PATHS:
            if not self.serviceKey:
                # 키를 설정하지 않았으면 열어두지 않는다. 조용히 열린 문이 제일 위험하다.
                self.mainLib.logPrint(
                    "SERVICE_API_KEY 가 설정되지 않아 사용량 적재를 거부했습니다.",
                    LOG_TAG,
                    printDebugAuth,
                )
                return await self._deny(send, 503, "서비스 키가 설정되지 않았습니다.")

            if self._header(scope, b"x-service-key") != self.serviceKey:
                return await self._deny(send, 401, "서비스 키가 올바르지 않습니다.")

            await self.app(scope, receive, send)
            return

        authorization = self._header(scope, b"authorization")

        if not authorization.lower().startswith("bearer "):
            return await self._deny(send, 401, "로그인이 필요합니다.")

        token = authorization[7:].strip()

        if not token:
            return await self._deny(send, 401, "로그인이 필요합니다.")

        try:
            user = await self._resolveUser(token)
        except Exception as e:
            self.mainLib.logPrint(f"토큰 검증 실패: {e}", LOG_TAG, printDebugAuth)
            return await self._deny(send, 401, "로그인이 필요합니다.")

        if user is None:
            return await self._deny(send, 401, "계정을 찾을 수 없습니다.")

        if user.userRole != ADMIN_ROLE:
            # 401 이 아니라 403 이다. 다시 로그인해도 결과가 같다.
            return await self._deny(send, 403, "관리자 페이지 접속 권한이 없습니다.")

        # 핸들러가 "누가 호출했는지" 를 알아야 할 때를 위해 남긴다
        scope["user_email"] = user.userEmail
        scope["user_role"] = user.userRole

        await self.app(scope, receive, send)

    async def _resolveUser(self, token: str):
        """토큰에서 계정을 찾는다. auth handler 의 _checkToken 과 같은 규칙이다."""
        unverified = jwt.decode(token, options={"verify_signature": False})
        mode = unverified.get("mode")

        if mode == "credential":
            # 자체 발급 토큰은 서명을 검증한다
            payload = jwt.decode(token, self.secretKey, algorithms=[self.algorithm])
            userId = payload.get("sub")
        else:
            mode = "azure"
            userId = unverified.get("oid")

        if not userId:
            raise ValueError("토큰에 계정 식별자가 없습니다.")

        return await self.userRepo.checkUser(mode, userId)


def newAuthMiddlewareArgs(mainLib, userRepo) -> dict:
    """Server.setupMiddleware 에 넘길 인자.

    SECRET_KEY / ALGORITHM 은 auth handler 와 같은 환경변수를 본다.
    두 곳이 어긋나면 로그인은 되는데 이후 호출이 전부 401 이 된다.
    """
    return {
        "mainLib": mainLib,
        "userRepo": userRepo,
        "secretKey": os.getenv("SECRET_KEY", ""),
        "algorithm": os.getenv("ALGORITHM", "HS256"),
        "serviceKey": os.getenv("SERVICE_API_KEY", ""),
    }
