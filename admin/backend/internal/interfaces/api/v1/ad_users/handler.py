from typing import Any

from internal.domain.entities.error_response import (
    ERROR_CODE_INTERNAL_SERVER_ERROR,
    ERROR_MSG_INTERNAL_SERVER_ERROR,
    newErrorResponse,
)
from internal.dto.ad_user_master_dto import (
    ADUserWorkspaceResponse,
    AzureUserDetails,
    GetUserDetailsRequest,
    GetUserDetailsResponse,
)
from internal.infrastructure.httpserver.handler.handler_context import HandlerContext
from internal.infrastructure.msgraph.service import MicrosoftGraphService
from internal.interfaces.repository.ad_user_master_repository import (
    ADUserMasterRepository,
)
from internal.interfaces.repository.ad_user_repository import ADUserRepository
from internal.interfaces.repository.workspace_repository import WorkspaceRepository

LOG_TAG_AD_USER_HANDLER = "OSHdAdUs"
printDebugErrorAdUserHandler = True


class ADUserHandler:
    def __init__(
        self,
        repo: ADUserRepository,
        adUserMasterRepo: ADUserMasterRepository,
        workspaceRepo: WorkspaceRepository,
        graphService: MicrosoftGraphService,
        mainLib: Any,
    ):
        self.repo = repo
        self.adUserMasterRepo = adUserMasterRepo
        self.workspaceRepo = workspaceRepo
        self.graphService = graphService
        self.mainLib = mainLib

    # end def

    async def syncUsers(self, hc: HandlerContext):
        """Sync users from Azure AD to local DB"""
        try:
            # 1. Fetch from Graph API
            adUsers = await self.graphService.getUsers()
            self.mainLib.logPrint(
                f"Fetched {len(adUsers)} users from Azure AD",
                LOG_TAG_AD_USER_HANDLER,
                True,
            )

            # 2. Store in DB
            await self.repo.upsertUsers(adUsers)

            # 3. Return result
            return hc.sendJson(
                200,
                {
                    "message": "Synchronization completed successfully",
                    "count": len(adUsers),
                },
            )

        except Exception as e:
            self.mainLib.logPrint(
                f"Failed to sync users: {e}",
                LOG_TAG_AD_USER_HANDLER,
                printDebugErrorAdUserHandler,
            )
            return hc.sendErrorJson(
                500,
                newErrorResponse(
                    ERROR_CODE_INTERNAL_SERVER_ERROR,
                    ERROR_MSG_INTERNAL_SERVER_ERROR,
                    f"Failed to sync users: {str(e)}",
                ),
            )
        # end try

    # end def

    async def getUsers(self, hc: HandlerContext):
        """Get all AD users from local DB"""
        try:
            users = await self.repo.getAllUsers()

            usersData = []
            for user in users:
                usersData.append(
                    {
                        "userId": user.userId,
                        "userName": user.userName,
                        "userEmail": user.userEmail,
                        "userRole": user.userRole,
                        "userDepartment": user.userDepartment,
                        "userAvatar": user.userAvatar,
                        "createdAt": user.createdAt.isoformat()
                        if user.createdAt
                        else None,
                        "updatedAt": user.updatedAt.isoformat()
                        if user.updatedAt
                        else None,
                    }
                )

            return hc.sendJson(200, {"users": usersData, "total": len(usersData)})

        except Exception as e:
            self.mainLib.logPrint(
                f"Failed to get users: {e}",
                LOG_TAG_AD_USER_HANDLER,
                printDebugErrorAdUserHandler,
            )
            return hc.sendErrorJson(
                500,
                newErrorResponse(
                    ERROR_CODE_INTERNAL_SERVER_ERROR,
                    ERROR_MSG_INTERNAL_SERVER_ERROR,
                    "Failed to retrieve users",
                ),
            )
        # end try

    # end def

    async def getUserDetails(self, hc: HandlerContext):
        """Get detailed AD user info"""
        try:
            try:
                req = await hc.readBody(GetUserDetailsRequest)
            except Exception as e:
                return hc.sendErrorJson(
                    400,
                    newErrorResponse(
                        "INVALID_REQUEST",
                        "Invalid request",
                        f"Invalid body: {str(e)}",
                    ),
                )
            # end try

            import asyncio

            async def checkLocalUser():
                # 1. Check if user exists in DB
                localUser = await self.adUserMasterRepo.getADUserByEmail(req.email)
                if not localUser:
                    return None, None
                # end if

                # 2. Fetch assignments
                workspaceIds = await self.adUserMasterRepo.getUserAssignments(
                    localUser.userId
                )

                # 3. Fetch all workspaces for lookup
                # 워크스페이스 제거로 저장소가 없다. 빈 목록이면 아래 루프가 그냥 돈다.
                allWorkspaces = (
                    await self.workspaceRepo.getWorkspaces() if self.workspaceRepo else []
                )
                workspaceMap = {str(w.workspaceId): w for w in allWorkspaces}

                workspaces = []
                for wsId in workspaceIds:
                    ws = workspaceMap.get(str(wsId))
                    if ws:
                        workspaces.append(
                            ADUserWorkspaceResponse(
                                workspaceId=ws.workspaceId,
                                workspaceName=ws.workspaceName,
                            )
                        )
                    # end if
                # end for

                return localUser, workspaces

            # end def

            # Execute Graph API and DB check concurrently

            results = await asyncio.gather(
                self.graphService.getUserDetails(req.email), checkLocalUser()
            )

            userDetailsRaw = results[0]
            localUserResult = results[1]

            localUser, workspaces = localUserResult if localUserResult else (None, None)

            if not localUser:
                return hc.sendErrorJson(
                    404,
                    newErrorResponse(
                        "USER_NOT_FOUND",
                        "User not found or no permission",
                        "User does not exist in the system",
                    ),
                )
            # end if

            azureDetails = AzureUserDetails(**userDetailsRaw)
            response = GetUserDetailsResponse(
                defaultCompany=localUser.defaultCompany,
                defaultLanguage=localUser.defaultLanguage,
                workspaces=workspaces,
                details=azureDetails,
            )

            return hc.sendJson(200, response.model_dump(by_alias=True))

        except Exception as e:
            errorMsg = str(e)
            self.mainLib.logPrint(
                f"Failed to get user details: {errorMsg}",
                LOG_TAG_AD_USER_HANDLER,
                printDebugErrorAdUserHandler,
            )

            # Check if it's a "not found" error
            if "not found" in errorMsg.lower():
                return hc.sendErrorJson(
                    404,
                    newErrorResponse(
                        "USER_NOT_FOUND",
                        "User not found",
                        errorMsg,
                    ),
                )
            # end if

            return hc.sendErrorJson(
                500,
                newErrorResponse(
                    ERROR_CODE_INTERNAL_SERVER_ERROR,
                    ERROR_MSG_INTERNAL_SERVER_ERROR,
                    f"Failed to retrieve user details: {errorMsg}",
                ),
            )
        # end try

    # end def


# end class


def newADUserHandler(
    repo: ADUserRepository,
    adUserMasterRepo: ADUserMasterRepository,
    workspaceRepo: WorkspaceRepository,
    graphService: MicrosoftGraphService,
    mainLib: Any,
) -> ADUserHandler:
    return ADUserHandler(repo, adUserMasterRepo, workspaceRepo, graphService, mainLib)


# end def
