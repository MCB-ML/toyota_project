import datetime
import os

import bcrypt
import jwt

from internal.config.config import loadConfig
from internal.domain.entities.error_response import (
    ERROR_CODE_BAD_REQUEST,
    ERROR_CODE_FORBIDDEN,
    ERROR_CODE_INTERNAL_SERVER_ERROR,
    ERROR_CODE_UNAUTHORIZED,
    ERROR_MSG_BAD_REQUEST,
    ERROR_MSG_FORBIDDEN,
    ERROR_MSG_INTERNAL_SERVER_ERROR,
    ERROR_MSG_UNAUTHORIZED,
    newErrorResponse,
)
from internal.dto.auth_dto import (
    AuthResponse,
    CredentialLoginRequest,
    MicrosoftLoginRequest,
    TeamsLoginRequest,
)
from internal.helper.response_api import ResponseApi
from internal.infrastructure.httpserver.handler.handler_context import HandlerContext
from internal.infrastructure.msgraph.service import MicrosoftGraphService
from internal.interfaces.repository.ad_user_master_repository import (
    ADUserMasterRepository,
)
from internal.interfaces.repository.ad_user_repository import ADUserRepository
from internal.interfaces.repository.user_repository import UserRepository
from pkg.main_lib import MainLib

cfg = loadConfig()

LOG_TAG_AUTH_HANDLER = "OSHdAuth"
printDebugErrorAuthHandler = True

SECRET_KEY=os.getenv("SECRET_KEY")

# 이 어드민 페이지는 관리자 전용이다. 딜러사 사용자는 에이전트 화면만 쓴다.
ADMIN_ROLE = "admin"


class NotAdminError(Exception):
    """로그인은 됐지만 관리자 권한이 아니다.

    미인증과 구분해야 한다. 미인증은 로그인 화면으로 보내면 되지만,
    이 경우는 다시 로그인해도 결과가 같아서 안내 화면을 보여줘야 한다.
    """

    def __init__(self, message: str, email: str = "", role: str = ""):
        super().__init__(message)
        # 안내 화면이 "어느 계정으로 들어왔는지" 를 보여줄 수 있어야 한다.
        # 이 시점에는 토큰만 있고 화면에는 계정 정보가 없다.
        self.email = email
        self.role = role

ALGORITHM=os.getenv("ALGORITHM")

# 세션 유지 시간. 에이전트(server/auth.js)와 같은 값이어야 체감이 일치한다.
SESSION_TTL_SECONDS = int(os.getenv("SESSION_TTL_SECONDS", "3600"))

class AuthHandler:
    def __init__(
        self,
        adUserRepo: ADUserRepository,
        adUserMasterRepo: ADUserMasterRepository,
        userRepo: UserRepository,
        graphService: MicrosoftGraphService,
        mainLib: MainLib,
    ):
        self.adUserRepo = adUserRepo
        self.adUserMasterRepo = adUserMasterRepo
        self.userRepo = userRepo
        self.graphService = graphService
        self.mainLib = mainLib

    # end def

    async def handleMicrosoftLogin(self, hc: HandlerContext):
        try:
            # 1. Parse request body
            request = await hc.readBody(MicrosoftLoginRequest)
        except Exception as e:
            return hc.sendErrorJson(
                400,
                newErrorResponse(
                    ERROR_CODE_BAD_REQUEST,
                    ERROR_MSG_BAD_REQUEST,
                    f"Invalid request: {e}",
                ),
            )
        # end try

        try:
            # 2. Validate token with MS Graph
            try:
                userProfile = await self.graphService.getUserProfile(
                    request.accessToken
                )
            except Exception as e:
                self.mainLib.logPrint(
                    f"Graph API Error: {e}",
                    LOG_TAG_AUTH_HANDLER,
                    printDebugErrorAuthHandler,
                )
                return hc.sendErrorJson(
                    401,
                    newErrorResponse(
                        ERROR_CODE_UNAUTHORIZED,
                        ERROR_MSG_UNAUTHORIZED,
                        f"Invalid Microsoft Access Token: {e}",
                    ),
                )
            # end try

            # end try

            return await self._generateAuthResponse(hc, userProfile)

        except Exception as e:
            self.mainLib.logPrint(
                f"Auth Error: {e}", LOG_TAG_AUTH_HANDLER, printDebugErrorAuthHandler
            )
            return hc.sendErrorJson(
                500,
                newErrorResponse(
                    ERROR_CODE_INTERNAL_SERVER_ERROR,
                    ERROR_MSG_INTERNAL_SERVER_ERROR,
                    str(e),
                ),
            )
        # end try

    # end def

    async def handleTeamsLogin(self, hc: HandlerContext):
        try:
            # 1. Parse request body
            request = await hc.readBody(TeamsLoginRequest)
        except Exception as e:
            return hc.sendErrorJson(
                400,
                newErrorResponse(
                    ERROR_CODE_BAD_REQUEST,
                    ERROR_MSG_BAD_REQUEST,
                    f"Invalid request: {e}",
                ),
            )
        # end try

        try:
            # 2. Exchange Token (OBO Flow)
            try:
                accessToken = await self.graphService.exchangeOboToken(request.token)
            except Exception as e:
                self.mainLib.logPrint(
                    f"OBO Exchange Error: {e}",
                    LOG_TAG_AUTH_HANDLER,
                    printDebugErrorAuthHandler,
                )
                return hc.sendErrorJson(
                    401,
                    newErrorResponse(
                        ERROR_CODE_UNAUTHORIZED,
                        ERROR_MSG_UNAUTHORIZED,
                        f"Invalid Teams Token or OBO Exchange Failed: {e}",
                    ),
                )
            # end try

            # 3. Get User Profile using the new Access Token
            try:
                userProfile = await self.graphService.getUserProfile(accessToken)
            except Exception as e:
                self.mainLib.logPrint(
                    f"Graph API Error: {e}",
                    LOG_TAG_AUTH_HANDLER,
                    printDebugErrorAuthHandler,
                )
                return hc.sendErrorJson(
                    401,
                    newErrorResponse(
                        ERROR_CODE_UNAUTHORIZED,
                        ERROR_MSG_UNAUTHORIZED,
                        f"Failed to fetch user profile: {e}",
                    ),
                )
            # end try

            return await self._generateAuthResponse(hc, userProfile)

        except Exception as e:
            self.mainLib.logPrint(
                f"Teams Auth Error: {e}",
                LOG_TAG_AUTH_HANDLER,
                printDebugErrorAuthHandler,
            )
            return hc.sendErrorJson(
                500,
                newErrorResponse(
                    ERROR_CODE_INTERNAL_SERVER_ERROR,
                    ERROR_MSG_INTERNAL_SERVER_ERROR,
                    str(e),
                ),
            )
        # end try

    # end def

    async def _generateAuthResponse(self, hc: HandlerContext, userProfile: dict):
        try:
            userId = userProfile.get("id")
            userEmail = userProfile.get("mail") or userProfile.get("userPrincipalName")

            if not userId:
                return hc.sendErrorJson(
                    401,
                    newErrorResponse(
                        ERROR_CODE_UNAUTHORIZED,
                        ERROR_MSG_UNAUTHORIZED,
                        "Could not retrieve user ID from Microsoft Graph",
                    ),
                )

            # 3. Check if user exists in ADUser (User_AD_list)
            adUser = await self.adUserRepo.getUserById(userId)

            if not adUser:
                return hc.sendErrorJson(
                    403,
                    newErrorResponse(
                        ERROR_CODE_FORBIDDEN,
                        ERROR_MSG_FORBIDDEN,
                        "User not found in organization AD list",
                    ),
                )
            # end if

            # 4. Get Master Data
            adUserMaster = await self.adUserMasterRepo.getADUserById(userId)
            defaultCompany = None
            if adUserMaster:
                defaultCompany = (
                    str(adUserMaster.defaultCompany)
                    if adUserMaster.defaultCompany
                    else None
                )
            # end if

            # 5. Generate JWT
            tokenPayload = {
                "sub": userId,
                "email": userEmail,
                "name": adUser.userName,
                "role": adUser.userRole,
                "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=24),
            }

            encodedJwt = jwt.encode(
                tokenPayload, cfg.jwt.privateKey, algorithm=cfg.jwt.algorithm
            )

            # Set Cookie
            hc.setCookie(
                key="token",
                value=encodedJwt,
                httponly=True,
                secure=True,
                samesite="none",
                max_age=86400 * 7,
            )

            response = AuthResponse(
                # token=encodedJwt,
                user={
                    "id": userId,
                    "email": userEmail,
                    "name": adUser.userName,
                    "role": adUser.userRole,
                    "avatar": adUser.userAvatar,
                },
                defaultCompany=defaultCompany,
            )

            return hc.sendJson(200, response.model_dump())

        except Exception as e:
            self.mainLib.logPrint(
                f"Auth Error: {e}", LOG_TAG_AUTH_HANDLER, printDebugErrorAuthHandler
            )
            return hc.sendErrorJson(
                500,
                newErrorResponse(
                    ERROR_CODE_INTERNAL_SERVER_ERROR,
                    ERROR_MSG_INTERNAL_SERVER_ERROR,
                    str(e),
                ),
            )
        # end try

    # end def
    
    async def _checkToken(self, token: str):

        unverified_payload = jwt.decode(token, options={"verify_signature": False})
        mode = unverified_payload.get("mode")

        id = None

        if mode == "credential":
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            id = payload.get("sub")

        else:
            mode = "azure"

            payload = jwt.decode(token, options={"verify_signature": False})
            id = payload.get("oid")

        user = await self.userRepo.checkUser(mode, id)

        if user is None:
            raise Exception("계정을 찾을 수 없습니다.")

        if user.userRole != ADMIN_ROLE:
            raise NotAdminError(
                "관리자 페이지 접속 권한이 없습니다.",
                email=user.userEmail,
                role=user.userRole,
            )

        # role 을 함께 내려준다. 화면이 메뉴 노출을 판단할 근거가 필요하다.
        tokenPayload = {
            "email": user.userEmail,
            "name": user.userName,
            "role": user.userRole,
            "defaultLanguage": user.defaultLanguage,
        }

        return tokenPayload

    
    async def handleToken(self, hc: HandlerContext):

        params = hc.getPathParams()

        token = params.get("token")

        # ResponseApi 는 모든 예외를 500 으로 뭉갠다. 여기서는 권한 없음을
        # 403 으로 따로 내려야 화면이 안내 페이지를 띄울 수 있다.
        try:
            result = await self._checkToken(token)
        except NotAdminError as e:
            # ErrorResponse 로는 계정 정보를 실을 수 없다. 화면이 안내에 쓰므로
            # 일반 응답 형태로 내려보낸다.
            return hc.sendJson(
                403,
                {
                    "success": False,
                    "message": str(e),
                    "result": {"email": e.email, "role": e.role},
                },
            )
        except Exception as e:
            self.mainLib.logPrint(
                f"Auth check failed: {e}", LOG_TAG_AUTH_HANDLER, printDebugErrorAuthHandler
            )
            return hc.sendErrorJson(
                401,
                newErrorResponse(ERROR_CODE_UNAUTHORIZED, ERROR_MSG_UNAUTHORIZED, str(e)),
            )

        resp = ResponseApi()
        resp.result = result

        return resp.get_result()
        
        
    async def handleCredentialLogin(self, hc: HandlerContext):
        
        resp = ResponseApi()
    
        request = await hc.readBody(CredentialLoginRequest)
  
        await resp.validate_with_result(self._loginCredent, request.email,request.password)

        return resp.get_result()
        # end try

    # end def
    
    async def _loginCredent(self,email:str,password:str):
          
        user = await self.userRepo.getUserLoginByEmail(email)
        if not user:
            raise Exception("User not found") 

        if not bcrypt.checkpw(
            password.encode("utf-8"), user.userPassword.encode("utf-8")
        ):
            raise Exception("Invalid email / password") 


        companyContext = await self.userRepo.getUserCompanyContext(str(user.userId))
        tokenPayload = {
            # UUID 객체를 그대로 넣으면 PyJWT 가 json.dumps 에서 터진다
            "sub": str(user.userId),
            "email": user.userEmail,
            "name": user.userName,
            "role": user.userRole,
            "mode": "credential",
            # 만료가 없으면 발급된 토큰이 영원히 유효하다 — 권한을 낮추거나 계정을
            # 정지시켜도 그 토큰은 계속 통한다. 에이전트와 같은 1시간으로 맞춘다.
            "exp": datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(seconds=SESSION_TTL_SECONDS),
        }

        encodedJwt = jwt.encode(
            tokenPayload,SECRET_KEY, algorithm=ALGORITHM
        )

        # # Set Cookie
        # hc.setCookie(
        #     key="token",
        #     value=encodedJwt,
        #     httponly=True,
        #     secure=True,
        #     samesite="none",
        #     # max_age=86400 * 7,
        # )

        response = AuthResponse(
            token=encodedJwt,
            user={
                "id": str(user.userId),
                "email": user.userEmail,
                "name": user.userName,
                "role": user.userRole,
                "avatar": None,  # Current user credentials have no avatar
                "companyName": companyContext.get("companyInfoName"),
                "scopeKey": companyContext.get("scopeKey"),
            },
            defaultCompany=str(user.defaultCompany)
            if user.defaultCompany
            else None,
            defaultCompanyName=companyContext.get("companyInfoName"),
            scopeKey=companyContext.get("scopeKey"),
            defaultLanguage=user.defaultLanguage
            if user.defaultLanguage
            else None,
        )

        return response



# end class


def newAuthHandler(
    adUserRepo: ADUserRepository,
    adUserMasterRepo: ADUserMasterRepository,
    userRepo: UserRepository,
    graphService: MicrosoftGraphService,
    mainLib: MainLib,
) -> AuthHandler:
    return AuthHandler(adUserRepo, adUserMasterRepo, userRepo, graphService, mainLib)


# end def
