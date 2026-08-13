from collections import defaultdict
import uuid
from datetime import datetime
from typing import List

import bcrypt

from internal.domain.entities.error_response import (
    ERROR_CODE_BAD_REQUEST,
    ERROR_CODE_CONFLICT,
    ERROR_CODE_INTERNAL_SERVER_ERROR,
    ERROR_CODE_NOT_FOUND,
    ERROR_CODE_UNAUTHORIZED,
    ERROR_MSG_BAD_REQUEST,
    ERROR_MSG_INTERNAL_SERVER_ERROR,
    ERROR_MSG_NOT_FOUND,
    ERROR_MSG_UNAUTHORIZED,
    newErrorResponse,
)
from internal.domain.entities.user import User
from internal.domain.repository.user_repository import UserRepository
from internal.domain.repository.workspace_repository import WorkspaceRepository
from internal.dto.user_dto import (
    UserCreateRequest,
    UserDeleteResponse,
    UserListResponse,
    UserResponse,
    UserUpdatePasswordRequest,
    UserUpdateRequest,
    UserWorkspaceResponse,
)
from internal.infrastructure.httpserver.handler.handler_context import HandlerContext
from internal.helper.timeutil import nowUtc

LOG_TAG_USER_HANDLER = "OSHdUser"
printDebugErrorUserHandler = True


def _isoOrNone(dt):
    """시각을 ISO-8601(시간대 포함) 문자열로.

    strftime("%Y-%m-%d %H:%M:%S") 은 시간대를 버린다.
    그러면 화면의 new Date(...) 가 그 값을 현지 시각(KST)으로 읽어
    UTC 로 저장된 시각이 9시간 앞당겨져 보인다. 하루가 밀리기도 한다.
    """
    return dt.isoformat() if dt else None

class UserHandler:
    def __init__(
        self, repo: UserRepository, workspaceRepo: WorkspaceRepository, mainLib
    ):
        self.repo = repo
        self.workspaceRepo = workspaceRepo
        self.mainLib = mainLib

    # end def

    def _hashPassword(self, password: str) -> str:
        """Hash password using bcrypt"""
        salt = bcrypt.gensalt()
        return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")

    # end def

    def _verifyPassword(self, password: str, hashedPassword: str) -> bool:
        """Verify password against hash"""
        return bcrypt.checkpw(password.encode("utf-8"), hashedPassword.encode("utf-8"))

    # end def

    async def _getWorkspaceNameMap(self) -> dict:
        """workspaceId -> workspaceName.

        워크스페이스는 제거되었다. 딜러사(Company) 한 계층만 쓴다.
        호출부가 아직 남아 있어 빈 map 으로 답한다.
        """
        if self.workspaceRepo is None:
            return {}

        workspaces = await self.workspaceRepo.getWorkspaces()
        return {str(w.workspaceId): w.workspaceName for w in workspaces}

    # end def

    def _userToResponse(
        self, user: User, workspaces: List[UserWorkspaceResponse]
    ) -> UserResponse:
        """Convert User entity to UserResponse DTO"""
        return UserResponse(
            userId=user.userId,
            userName=user.userName,
            userEmail=user.userEmail,
            workspaces=workspaces,
            userRole=user.userRole,
            userAccess=user.userAccess,
            userDepartment=user.userDepartment,
            defaultCompany=user.defaultCompany,
            defaultLanguage=user.defaultLanguage,
            createdAt=_isoOrNone(user.createdAt) or "",
            updatedAt=_isoOrNone(user.updatedAt),
        )

    # end def

    async def createUser(self, hc: HandlerContext):
        """Create a new user"""
        try:
            req = await hc.readBody(UserCreateRequest)
        except Exception as e:
            self.mainLib.logPrint(
                f"Invalid body: {e}", LOG_TAG_USER_HANDLER, printDebugErrorUserHandler
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

        # 워크스페이스 검증. 저장소가 없으면 건너뛴다 (기능 제거됨)
        for wsId in req.workspaceIds if self.workspaceRepo else []:
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

        # Check existing email
        try:
            existing = await self.repo.getUserByEmail(req.userEmail)

            if existing:
                # Active user exists

                if req.mode == "2":
                    inserted = await self.repo.UserAssignmentsInsert(
                        existing.userId, req.workspaceIds
                    )

                    if inserted:
                        return hc.sendJson(200, {"message": "Success Add User"})

                    else:
                        return hc.sendErrorJson(
                            409,
                            newErrorResponse(
                                ERROR_CODE_CONFLICT,
                                "Email exists",
                                f"User {req.userEmail} already exists",
                            ),
                        )

                else:
                    return hc.sendErrorJson(
                        409,
                        newErrorResponse(
                            ERROR_CODE_CONFLICT,
                            "Email exists",
                            f"User {req.userEmail} already exists",
                        ),
                    )

        except Exception as e:
            return hc.sendErrorJson(
                500,
                newErrorResponse(
                    ERROR_CODE_INTERNAL_SERVER_ERROR,
                    ERROR_MSG_INTERNAL_SERVER_ERROR,
                    str(e),
                ),
            )
        # end try

        try:
            userId = str(uuid.uuid4())
            hashed = self._hashPassword(req.userPassword)

            user = User(
                userId=userId,
                userName=req.userName,
                userEmail=req.userEmail,
                userPassword=hashed,
                userRole=req.userRole,
                userAccess=req.userAccess,
                userDepartment=req.userDepartment,
                defaultCompany=req.defaultCompany,
                defaultLanguage=req.defaultLanguage,
                createdAt=nowUtc(),
            )

            await self.repo.createUser(user, req.workspaceIds)

            # Resolve workspaces
            wsMap = await self._getWorkspaceNameMap()
            workspaces = [
                UserWorkspaceResponse(
                    workspaceId=str(wsId), workspaceName=wsMap.get(wsId, "Unknown")
                )
                for wsId in req.workspaceIds
            ]

            return hc.sendJson(
                201, self._userToResponse(user, workspaces).model_dump(by_alias=True)
            )
        except Exception as e:
            self.mainLib.logPrint(
                f"Failed create: {e}", LOG_TAG_USER_HANDLER, printDebugErrorUserHandler
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

    async def getUserById(self, hc: HandlerContext):
        """Get user by ID"""
        params = hc.getPathParams()
        userId = params.get("id")

        if not userId:
            return hc.sendErrorJson(
                400,
                newErrorResponse(
                    ERROR_CODE_BAD_REQUEST, ERROR_MSG_BAD_REQUEST, "ID required"
                ),
            )

        try:
            user = await self.repo.getUserById(userId)
            if not user:
                return hc.sendErrorJson(
                    404,
                    newErrorResponse(
                        ERROR_CODE_NOT_FOUND, ERROR_MSG_NOT_FOUND, "User not found"
                    ),
                )

            workspaceIds = await self.repo.getUserAssignments(userId)

            # Resolve workspaces
            wsMap = await self._getWorkspaceNameMap()
            workspaces = [
                UserWorkspaceResponse(
                    workspaceId=str(wsId), workspaceName=wsMap.get(wsId, "Unknown")
                )
                for wsId in workspaceIds
            ]

            return hc.sendJson(
                200, self._userToResponse(user, workspaces).model_dump(by_alias=True)
            )
        except Exception as e:
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

    async def getAllUsers(self, hc: HandlerContext):
        """Get all users"""
        try:
            users = await self.repo.getAllUsers()
            wsMap = await self._getWorkspaceNameMap()


            assignments = await self.repo.getAllUserAssignments()


            userWsMap = defaultdict(list)
            for userId, wsId in assignments:
                userWsMap[userId].append(wsId)

            res = []
            for u in users:
                wsIds = userWsMap.get(u.userId, [])

                workspaces = [
                    UserWorkspaceResponse(
                        workspaceId=str(wsId),
                        workspaceName=wsMap.get(wsId, "Unknown"),
                    )
                    for wsId in wsIds
                ]

                res.append(self._userToResponse(u, workspaces))

            return hc.sendJson(
                200,
                UserListResponse(users=res, total=len(res)).model_dump(by_alias=True),
            )

        except Exception as e:
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

    async def updateUser(self, hc: HandlerContext):
        """Update user"""
        params = hc.getPathParams()
        userId = params.get("id")

        if not userId:
            return hc.sendErrorJson(
                400,
                newErrorResponse(
                    ERROR_CODE_BAD_REQUEST, ERROR_MSG_BAD_REQUEST, "ID required"
                ),
            )

        try:
            req = await hc.readBody(UserUpdateRequest)
        except Exception:
            return hc.sendErrorJson(
                400,
                newErrorResponse(
                    ERROR_CODE_BAD_REQUEST, ERROR_MSG_BAD_REQUEST, "Invalid body"
                ),
            )

        try:
            user = await self.repo.getUserById(userId)
            if not user:
                return hc.sendErrorJson(
                    404,
                    newErrorResponse(
                        ERROR_CODE_NOT_FOUND, ERROR_MSG_NOT_FOUND, "User not found"
                    ),
                )

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

            if req.userChangePassword:
                req.userChangePassword = self._hashPassword(req.userChangePassword)

            if req.workspaceIds is not None and self.workspaceRepo is not None:
                # Validate
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

            await self.repo.updateUser(user, req.workspaceIds, req.userChangePassword)

            # Fetch assignments
            finalWsIds = await self.repo.getUserAssignments(user.userId)

            # Resolve workspaces
            wsMap = await self._getWorkspaceNameMap()
            workspaces = [
                UserWorkspaceResponse(
                    workspaceId=str(wsId), workspaceName=wsMap.get(wsId, "Unknown")
                )
                for wsId in finalWsIds
            ]

            return hc.sendJson(
                200, self._userToResponse(user, workspaces).model_dump(by_alias=True)
            )
        except Exception as e:
            self.mainLib.logPrint(
                f"Failed update: {e}", LOG_TAG_USER_HANDLER, printDebugErrorUserHandler
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

    async def deleteUser(self, hc: HandlerContext):
        """Soft delete user"""
        params = hc.getPathParams()
        userId = params.get("id")

        if not userId:
            return hc.sendErrorJson(
                400,
                newErrorResponse(
                    ERROR_CODE_BAD_REQUEST, ERROR_MSG_BAD_REQUEST, "User ID is required"
                ),
            )
        # end if

        try:
            # Check if user exists
            user = await self.repo.getUserById(userId)
            if not user:
                return hc.sendErrorJson(
                    404,
                    newErrorResponse(
                        ERROR_CODE_NOT_FOUND,
                        ERROR_MSG_NOT_FOUND,
                        f"User with ID {userId} not found",
                    ),
                )
            # end if

            await self.repo.deleteUser(userId)

            response = UserDeleteResponse(
                userId=userId, message="User deleted successfully"
            )
            return hc.sendJson(200, response.model_dump(by_alias=True))

        except Exception as e:
            self.mainLib.logPrint(
                f"Failed to delete user: {e}",
                LOG_TAG_USER_HANDLER,
                printDebugErrorUserHandler,
            )
            return hc.sendErrorJson(
                500,
                newErrorResponse(
                    ERROR_CODE_INTERNAL_SERVER_ERROR,
                    ERROR_MSG_INTERNAL_SERVER_ERROR,
                    "Failed to delete user",
                ),
            )
        # end try

    # end def

    async def handleChangePassword(self, hc: HandlerContext):
        """Handle change password"""
        params = hc.getPathParams()
        userId = params.get("id")

        if not userId:
            return hc.sendErrorJson(
                400,
                newErrorResponse(
                    ERROR_CODE_BAD_REQUEST, ERROR_MSG_BAD_REQUEST, "User ID is required"
                ),
            )
        # end if

        try:
            req = await hc.readBody(UserUpdatePasswordRequest)
        except Exception as e:
            return hc.sendErrorJson(
                400,
                newErrorResponse(
                    ERROR_CODE_BAD_REQUEST, ERROR_MSG_BAD_REQUEST, f"Invalid body: {e}"
                ),
            )
        # end try

        try:
            user = await self.repo.getUserById(userId)
            if not user:
                return hc.sendErrorJson(
                    404,
                    newErrorResponse(
                        ERROR_CODE_NOT_FOUND, ERROR_MSG_NOT_FOUND, "User not found"
                    ),
                )
            # end if

            if not self._verifyPassword(req.oldPassword, user.userPassword):
                return hc.sendErrorJson(
                    401,
                    newErrorResponse(
                        ERROR_CODE_UNAUTHORIZED,
                        ERROR_MSG_UNAUTHORIZED,
                        "Invalid old password",
                    ),
                )
            # end if

            # Hash NEW password
            newHashed = self._hashPassword(req.newPassword)

            await self.repo.updatePassword(userId, newHashed)

            return hc.sendJson(200, {"message": "Password updated successfully"})

        except Exception as e:
            self.mainLib.logPrint(
                f"Failed to change password: {e}",
                LOG_TAG_USER_HANDLER,
                printDebugErrorUserHandler,
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


def newUserHandler(
    repo: UserRepository, workspaceRepo: WorkspaceRepository, mainLib
) -> UserHandler:
    return UserHandler(repo, workspaceRepo, mainLib)


# end def
