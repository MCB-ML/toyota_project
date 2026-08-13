from datetime import datetime
from typing import List, Optional

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncEngine, AsyncSession
from internal.domain.entities.ad_user_master import ADUserMaster
from internal.domain.entities.user import User
from internal.domain.entities.user_assignment import UserAssignment
from internal.domain.entities.workspace import Workspace
from internal.domain.repository.branch_repository import BranchRepository
from internal.domain.repository.workspace_repository import WorkspaceRepository
from internal.infrastructure.cache.async_cache import AsyncCache
from internal.helper.timeutil import nowUtc

CACHE_KEY_ALL_WORKSPACES = "workspaces:all"
CACHE_KEY_ALL_USERS = "users:all"
CACHE_KEY_ORG_CHART_COMPANY = "orgchart:company_view"
CACHE_KEY_ORG_CHART_BRANCH = "orgchart:branch_view"
CACHE_KEY_ORG_CHART_WORKSPACE = "orgchart:workspace_view"
CACHE_KEY_ORG_CHART_END_USER = "orgchart:end_user_view"
CACHE_TTL_SECONDS = 300


class WorkspaceRepositoryImpl(WorkspaceRepository):
    def __init__(
        self, dbEngine: AsyncEngine, cache: AsyncCache, branchRepo: BranchRepository
    ):
        self.dbEngine = dbEngine
        self.cache = cache
        self.branchRepo = branchRepo

    # end def

    async def createWorkspace(self, workspace: Workspace) -> None:
        async with self.dbEngine.begin() as conn:
            await conn.run_sync(
                lambda sync_conn: sync_conn.execute(
                    Workspace.__table__.insert().values(
                        workspace_id=workspace.workspaceId,
                        workspace_name=workspace.workspaceName,
                        workspace_department=workspace.workspaceDepartment,
                        workspace_type=workspace.workspaceType,
                        branch_id=workspace.branchId,
                        seq=workspace.seq,
                        created_at=workspace.createdAt or nowUtc(),
                    )
                )
            )
        # end with

        # Invalid cache on create workspace
        await self.cache.delete(CACHE_KEY_ALL_WORKSPACES)
        await self.cache.delete(CACHE_KEY_ORG_CHART_COMPANY)
        await self.cache.delete(CACHE_KEY_ORG_CHART_BRANCH)
        await self.cache.delete(CACHE_KEY_ORG_CHART_WORKSPACE)
        await self.cache.delete(CACHE_KEY_ORG_CHART_END_USER)

    # end def

    async def updateWorkspace(self, workspace: Workspace) -> None:
        async with self.dbEngine.begin() as conn:
            await conn.run_sync(
                lambda sync_conn: sync_conn.execute(
                    Workspace.__table__.update()
                    .where(Workspace.workspaceId == workspace.workspaceId)
                    .values(
                        workspace_name=workspace.workspaceName,
                        workspace_department=workspace.workspaceDepartment,
                        branch_id=workspace.branchId,
                        seq=workspace.seq,
                        updated_at=nowUtc(),
                    )
                )
            )
        # end with

        # Invalid cache on update workspace
        await self.cache.delete(CACHE_KEY_ALL_WORKSPACES)
        await self.cache.delete(CACHE_KEY_ORG_CHART_COMPANY)
        await self.cache.delete(CACHE_KEY_ORG_CHART_BRANCH)
        await self.cache.delete(CACHE_KEY_ORG_CHART_WORKSPACE)
        await self.cache.delete(CACHE_KEY_ORG_CHART_END_USER)

    # end def

    async def deleteWorkspace(self, workspaceId: str) -> None:
        async with self.dbEngine.begin() as conn:
            # 1. Delete user assignments for this workspace
            await conn.run_sync(
                lambda sync_conn: sync_conn.execute(
                    UserAssignment.__table__.delete().where(
                        UserAssignment.workspaceId == workspaceId
                    )
                )
            )

            # 2. Delete workspace
            await conn.run_sync(
                lambda sync_conn: sync_conn.execute(
                    Workspace.__table__.delete().where(
                        Workspace.workspaceId == workspaceId
                    )
                )
            )
        # end with

        # Invalid cache on delete workspace
        await self.cache.delete(CACHE_KEY_ALL_WORKSPACES)
        await self.cache.delete(CACHE_KEY_ALL_USERS)

        await self.cache.delete(CACHE_KEY_ORG_CHART_COMPANY)
        await self.cache.delete(CACHE_KEY_ORG_CHART_BRANCH)
        await self.cache.delete(CACHE_KEY_ORG_CHART_WORKSPACE)
        await self.cache.delete(CACHE_KEY_ORG_CHART_END_USER)

    # end def

    async def getWorkspaceById(self, workspaceId: str) -> Optional[Workspace]:
        # Get all workspaces -> handles cache check & population automatically
        workspaces = await self.getWorkspaces()

        # Find workspace in the cache
        for w in workspaces:
            if str(w.workspaceId) == str(workspaceId):
                return w
            # end if
        # end for
        return None

    # end def

    async def getWorkspaces(self) -> List[Workspace]:
        # Check cache first
        cached = await self.cache.get(CACHE_KEY_ALL_WORKSPACES)
        if cached is not None:
            return cached
        # end if

        async with AsyncSession(self.dbEngine) as session:

            result = await session.execute(
                select(Workspace).order_by(func.coalesce(Workspace.seq, 9999))
            )
            workspaces = result.scalars().all()

            # Populate branch names
            branches = await self.branchRepo.getBranches()
            branchMap = {str(b.branchId): b.branchName for b in branches}

            for w in workspaces:
                w.branchName = branchMap.get(str(w.branchId), "")
            # end for

            # Update cache
            await self.cache.set(
                CACHE_KEY_ALL_WORKSPACES, workspaces, CACHE_TTL_SECONDS
            )

            return workspaces
        # end with

    # end def

    async def getWorkspaceByBranchId(self, branchId: str) -> List[Workspace]:
        # Get all workspaces -> handles cache check & population automatically
        workspaces = await self.getWorkspaces()

        filtered_workspaces = []
        for w in workspaces:
            if str(w.branchId) == str(branchId):
                filtered_workspaces.append(w)
            # end if
        # end for

        return filtered_workspaces

    # end def

    async def getWorkspaceByNameAndBranch(
        self, name: str, branchId: str
    ) -> Optional[Workspace]:
        # Get all workspaces -> handles cache check & population automatically
        workspaces = await self.getWorkspaces()

        # Find workspace in the cache
        for w in workspaces:
            if w.workspaceName == name and str(w.branchId) == str(branchId):
                return w
            # end if
        # end for
        return None

    # end def

    async def getWorkspaceUserAccess(self, id: str):
        async with AsyncSession(self.dbEngine) as session:
            result = await session.execute(
                select(UserAssignment).where(UserAssignment.workspaceId == id)
            )

            workspacesUser = result.scalars().all()

            userIdList = []
            userList = []

            for w in workspacesUser:
                userIdList.append(w.userId)

            user_result = (
                (await session.execute(select(User).where(User.userId.in_(userIdList))))
                .scalars()
                .all()
            )

            ad_result = (
                (
                    await session.execute(
                        select(ADUserMaster).where(ADUserMaster.userId.in_(userIdList))
                    )
                )
                .scalars()
                .all()
            )

            userList = [
                {
                    "userId": u.userId,
                    "email": u.userEmail,
                    "name": u.userName,
                    "source": "local",
                }
                for u in user_result
            ] + [
                {
                    "userId": u.userId,
                    "email": u.userEmail,
                    "name": u.userName,
                    "source": "ad",
                }
                for u in ad_result
            ]

        return userList

    # end def


# end class


def newWorkspaceRepository(
    dbEngine: AsyncEngine, cache: AsyncCache, branchRepo: BranchRepository
) -> WorkspaceRepository:
    return WorkspaceRepositoryImpl(dbEngine, cache, branchRepo)


# end def
