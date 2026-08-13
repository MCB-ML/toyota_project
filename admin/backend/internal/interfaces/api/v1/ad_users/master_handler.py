from datetime import datetime
from typing import List

from internal.domain.entities.ad_user_master import ADUserMaster
from internal.domain.entities.error_response import (
    ERROR_CODE_BAD_REQUEST,
    ERROR_CODE_CONFLICT,
    ERROR_CODE_INTERNAL_SERVER_ERROR,
    ERROR_CODE_NOT_FOUND,
    ERROR_MSG_BAD_REQUEST,
    ERROR_MSG_INTERNAL_SERVER_ERROR,
    ERROR_MSG_NOT_FOUND,
    newErrorResponse,
)
from internal.domain.repository.workspace_repository import WorkspaceRepository
from internal.dto.ad_user_master_dto import (
    ADUserCreateRequest,
    ADUserListResponse,
    ADUserResponse,
    ADUserUpdateRequest,
    ADUserWorkspaceResponse,
)
from internal.infrastructure.httpserver.handler.handler_context import HandlerContext
from internal.interfaces.repository.ad_user_master_repository import (
    ADUserMasterRepository,
)
from internal.interfaces.repository.ad_user_repository import ADUserRepository
from internal.helper.timeutil import nowUtc

LOG_TAG_AD_USER_MASTER = "OSHdADMs"
printDebugError = True


def _isoOrNone(dt):
    """시각을 ISO-8601(시간대 포함) 문자열로.

    strftime("%Y-%m-%d %H:%M:%S") 은 시간대를 버린다.
    그러면 화면의 new Date(...) 가 그 값을 현지 시각(KST)으로 읽어
    UTC 로 저장된 시각이 9시간 앞당겨져 보인다. 하루가 밀리기도 한다.
    """
    return dt.isoformat() if dt else None

class ADUserMasterHandler:
    def __init__(
        self,
        repo: ADUserMasterRepository,
        workspaceRepo: WorkspaceRepository,
        adUserRepo: ADUserRepository,
        mainLib,
    ):
        self.repo = repo
        self.workspaceRepo = workspaceRepo
        self.adUserRepo = adUserRepo
        self.mainLib = mainLib

    # end def

    async def _getWorkspaceNameMap(self) -> dict:
        # 워크스페이스는 제거되었다. 저장소가 없으면 빈 map.
        if self.workspaceRepo is None:
            return {}

        workspaces = await self.workspaceRepo.getWorkspaces()
        return {str(w.workspaceId): w.workspaceName for w in workspaces}

    # end def

    def _userADToResponse(
        self, user: ADUserMaster, workspaces: List[ADUserWorkspaceResponse]
    ) -> ADUserResponse:
        return ADUserResponse(
            userId=user.userId,
            userName=user.userName,
            userEmail=user.userEmail,
            workspaces=workspaces,
            userRole=user.userRole,
            userAccess=user.userAccess,
            userDepartment=user.userDepartment,
            userAvatar=user.userAvatar,
            defaultCompany=user.defaultCompany,
            defaultLanguage=user.defaultLanguage,
            createdAt=_isoOrNone(user.createdAt) or "",
            updatedAt=_isoOrNone(user.updatedAt),
        )

    # end def

    async def createADUser(self, hc: HandlerContext):
        """Created AD User based on user AD list"""
        try:
            req = await hc.readBody(ADUserCreateRequest)
        except Exception as e:
            self.mainLib.logPrint(
                f"Invalid body: {e}", LOG_TAG_AD_USER_MASTER, printDebugError
            )
            return hc.sendErrorJson(
                400,
                newErrorResponse(
                    ERROR_CODE_BAD_REQUEST,
                    ERROR_MSG_BAD_REQUEST,
                    "Invalid request body",
                ),
            )
        # end try

        # Check workspaces
        for wsId in req.workspaceIds:
            workspace = await self.workspaceRepo.getWorkspaceById(wsId)
            if not workspace:
                return hc.sendErrorJson(
                    404,
                    newErrorResponse(
                        ERROR_CODE_NOT_FOUND,
                        ERROR_MSG_NOT_FOUND,
                        f"Workspace {wsId} not found",
                    ),
                )
            # end if
        # end for

        # Check if user exists in AD User List
        syncedUser = await self.adUserRepo.getUserById(req.userId)
        if not syncedUser:
            return hc.sendErrorJson(
                404,
                newErrorResponse(
                    ERROR_CODE_NOT_FOUND,
                    ERROR_MSG_NOT_FOUND,
                    f"AD User {req.userId} not found in synced list. Please sync first.",
                ),
            )
        # end if

        # Check existing in Master
        existing = await self.repo.getADUserById(req.userId)

        if existing:
            # Active user exists
            if req.mode == "2":
                inserted = await self.repo.UserAssignmentsInsert(
                    req.userId, req.workspaceIds
                )

                if inserted:
                    return hc.sendJson(200, {"message": "Success Add User"})

                else:
                    return hc.sendErrorJson(
                        409,
                        newErrorResponse(
                            ERROR_CODE_CONFLICT,
                            "User already exists",
                            f"AD User {req.userId} already exists",
                        ),
                    )

            else:
                return hc.sendErrorJson(
                    409,
                    newErrorResponse(
                        ERROR_CODE_CONFLICT,
                        "User already exists",
                        f"AD User {req.userId} already exists",
                    ),
                )
        # end if

        try:
            user = ADUserMaster(
                userId=req.userId,
                userName=syncedUser.userName,
                userEmail=syncedUser.userEmail,
                userRole=req.userRole,
                userAccess=req.userAccess,
                userDepartment=req.userDepartment,
                userAvatar=syncedUser.userAvatar,
                defaultCompany=req.defaultCompany,
                defaultLanguage=req.defaultLanguage,
                createdAt=nowUtc(),
            )
            await self.repo.createADUser(user, req.workspaceIds)

            wsMap = await self._getWorkspaceNameMap()
            workspaces = [
                ADUserWorkspaceResponse(
                    workspaceId=str(wsId), workspaceName=wsMap.get(wsId, "Unknown")
                )
                for wsId in req.workspaceIds
            ]

            return hc.sendJson(
                201, self._userADToResponse(user, workspaces).model_dump(by_alias=True)
            )
        except Exception as e:
            self.mainLib.logPrint(
                f"Failed create: {e}", LOG_TAG_AD_USER_MASTER, printDebugError
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

    async def getADUserById(self, hc: HandlerContext):
        params = hc.getPathParams()
        userId = params.get("id")
        if not userId:
            return hc.sendErrorJson(
                400,
                newErrorResponse(
                    ERROR_CODE_BAD_REQUEST, ERROR_MSG_BAD_REQUEST, "ID required"
                ),
            )
        # end if

        try:
            user = await self.repo.getADUserById(userId)
            if not user:
                return hc.sendErrorJson(
                    404,
                    newErrorResponse(
                        ERROR_CODE_NOT_FOUND, ERROR_MSG_NOT_FOUND, "User not found"
                    ),
                )
            # end if

            wsIds = await self.repo.getUserAssignments(user.userId)
            wsMap = await self._getWorkspaceNameMap()
            names = [wsMap.get(wsId, "Unknown") for wsId in wsIds]

            return hc.sendJson(
                200, self._userADToResponse(user, names).model_dump(by_alias=True)
            )
        except Exception as e:
            self.mainLib.logPrint(
                f"Failed get: {e}", LOG_TAG_AD_USER_MASTER, printDebugError
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

    async def getAllADUsers(self, hc: HandlerContext):
        try:
            users = await self.repo.getAllADUsers()
            wsMap = await self._getWorkspaceNameMap()
            assignmentMap = await self.repo.getAllUserAssignmentsMap()

            res = []
            for u in users:
                wsIds = assignmentMap.get(u.userId, [])
                workspaces = [
                    ADUserWorkspaceResponse(
                        workspaceId=str(wsId), workspaceName=wsMap.get(wsId, "Unknown")
                    )
                    for wsId in wsIds
                ]
                res.append(self._userADToResponse(u, workspaces))
            # end for

            return hc.sendJson(
                200,
                ADUserListResponse(users=res, total=len(res)).model_dump(by_alias=True),
            )
        except Exception as e:
            self.mainLib.logPrint(
                f"Failed get all: {e}", LOG_TAG_AD_USER_MASTER, printDebugError
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

    async def updateADUser(self, hc: HandlerContext):
        params = hc.getPathParams()
        userId = params.get("id")

        if not userId:
            return hc.sendErrorJson(
                400,
                newErrorResponse(
                    ERROR_CODE_BAD_REQUEST, ERROR_MSG_BAD_REQUEST, "ID required"
                ),
            )
        # end if

        try:
            req = await hc.readBody(ADUserUpdateRequest)
        except Exception:
            return hc.sendErrorJson(
                400,
                newErrorResponse(
                    ERROR_CODE_BAD_REQUEST, ERROR_MSG_BAD_REQUEST, "Invalid body"
                ),
            )
        # end try

        try:
            user = await self.repo.getADUserById(userId)

            if not user:
                return hc.sendErrorJson(
                    404,
                    newErrorResponse(
                        ERROR_CODE_NOT_FOUND, ERROR_MSG_NOT_FOUND, "User not found"
                    ),
                )
            # end if

            if req.userName:
                user.userName = req.userName
            if req.userEmail:
                user.userEmail = req.userEmail
            if req.userRole:
                user.userRole = req.userRole
            if req.userDepartment:
                user.userDepartment = req.userDepartment
            if req.userAccess:
                user.userAccess = req.userAccess
            if req.defaultCompany:
                user.defaultCompany = req.defaultCompany
            if req.defaultLanguage:
                user.defaultLanguage = req.defaultLanguage

            if req.workspaceIds is not None:
                # Check workspaces
                for wsId in req.workspaceIds:
                    ws = await self.workspaceRepo.getWorkspaceById(wsId)
                    if not ws:
                        return hc.sendErrorJson(
                            404,
                            newErrorResponse(
                                ERROR_CODE_NOT_FOUND,
                                ERROR_MSG_NOT_FOUND,
                                f"Workspace {wsId} not found",
                            ),
                        )
                    # end if
                # end for
            # end if

            await self.repo.updateADUser(user, req.workspaceIds)

            wsIds = await self.repo.getUserAssignments(user.userId)
            wsMap = await self._getWorkspaceNameMap()
            workspaces = [
                ADUserWorkspaceResponse(
                    workspaceId=str(wsId), workspaceName=wsMap.get(wsId, "Unknown")
                )
                for wsId in wsIds
            ]

            return hc.sendJson(
                200, self._userADToResponse(user, workspaces).model_dump(by_alias=True)
            )
        except Exception as e:
            self.mainLib.logPrint(
                f"Failed update: {e}", LOG_TAG_AD_USER_MASTER, printDebugError
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

    async def deleteADUser(self, hc: HandlerContext):
        params = hc.getPathParams()
        userId = params.get("id")

        if not userId:
            return hc.sendErrorJson(
                400,
                newErrorResponse(
                    ERROR_CODE_BAD_REQUEST, ERROR_MSG_BAD_REQUEST, "ID required"
                ),
            )
        # end if

        try:
            user = await self.repo.getADUserById(userId)
            if not user:
                return hc.sendErrorJson(
                    404,
                    newErrorResponse(
                        ERROR_CODE_NOT_FOUND, ERROR_MSG_NOT_FOUND, "User not found"
                    ),
                )
            # end if

            await self.repo.deleteADUser(userId)
            return hc.sendJson(
                200, {"message": "Deleted successfully", "userId": userId}
            )
        except Exception as e:
            self.mainLib.logPrint(
                f"Failed delete: {e}", LOG_TAG_AD_USER_MASTER, printDebugError
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


# end class


def newADUserMasterHandler(
    repo: ADUserMasterRepository,
    workspaceRepo: WorkspaceRepository,
    adUserRepo: ADUserRepository,
    mainLib,
) -> ADUserMasterHandler:
    return ADUserMasterHandler(repo, workspaceRepo, adUserRepo, mainLib)


# end def
